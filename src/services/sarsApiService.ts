/**
 * @file sarsApiService.ts
 * @description Dedicated SARS REST Gateway Integration Service.
 * Connects to SARS_API_ENDPOINT using SARS_API_KEY authorization headers
 * to perform mock data validation checks, taxpayer verification, and statutory batch validation.
 */

import { loadAppConfig, AppEnvConfig } from '../utils/envConfig';

export interface SarsTaxpayerValidationRequest {
  taxNumber: string;
  idNumber: string;
  tradingName?: string;
}

export interface SarsValidationResponse {
  success: boolean;
  statusCode: number;
  environment: string;
  simulation: boolean;
  reference: string;
  verified: boolean;
  details: {
    taxpayerStatus?: 'ACTIVE' | 'DEREGISTERED' | 'NON_COMPLIANT';
    vatStatus?: 'REGISTERED' | 'NOT_REGISTERED';
    complianceScore?: number;
    validationErrors?: string[];
  };
  latencyMs: number;
  timestamp: string;
}

export interface SarsGatewayHealthStatus {
  endpoint: string;
  environment: string;
  isReachable: boolean;
  statusCode: number;
  authorized: boolean;
  latencyMs: number;
  timestamp: string;
}

export class SarsApiService {
  private config: AppEnvConfig;

  constructor(customConfig?: AppEnvConfig) {
    this.config = customConfig || loadAppConfig();
  }

  /**
   * Get common headers including the SARS_API_KEY authorization header
   */
  private getHeaders(): Record<string, string> {
    const apiKey = this.config.sarsApiKey || 'sandbox_isv_key_mock_9304318273';
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-SARS-Api-Key': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'X-Client-Application': 'ZAtax-Compliance-Advisor/2026',
      'X-Tax-Environment': this.config.taxEnv,
      'X-Simulation-Mode': String(this.config.sarsSimulation)
    };
  }

  /**
   * Resolves the target endpoint URL.
   * In browser environments, safely uses the local server-side proxy to prevent CORS issues.
   */
  private getTargetUrl(path: string): string {
    const isBrowser = typeof window !== 'undefined';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    if (isBrowser) {
      // Browser calls local server-side proxy to comply with sandbox network isolation
      return `/api/sars-gateway/v3${cleanPath}`;
    }

    const base = this.config.sarsApiEndpoint.replace(/\/+$/, '');
    return `${base}${cleanPath}`;
  }

  /**
   * Performs mock data validation check for taxpayer registration and TCS status
   */
  async validateTaxpayer(request: SarsTaxpayerValidationRequest): Promise<SarsValidationResponse> {
    const startTime = performance.now();
    const url = this.getTargetUrl('/taxpayer/validate');
    const reference = `SARS-VAL-${Date.now().toString(36).toUpperCase()}`;

    // If sandbox simulation is active or in fallback testing:
    if (this.config.sarsSimulation) {
      // Validate 10-digit SARS tax number algorithm (Luhn or basic length check)
      const isTaxNumValid = /^\d{10}$/.test(request.taxNumber.trim());
      const isIdValid = /^\d{13}$/.test(request.idNumber.trim());
      const errors: string[] = [];

      if (!isTaxNumValid) errors.push('SARS Tax Number must contain exactly 10 numeric digits.');
      if (!isIdValid) errors.push('South African ID number must contain exactly 13 digits.');

      const isValid = errors.length === 0;
      const latencyMs = Math.round(performance.now() - startTime + 18);

      return {
        success: true,
        statusCode: 200,
        environment: this.config.taxEnv,
        simulation: true,
        reference,
        verified: isValid,
        details: {
          taxpayerStatus: isValid ? 'ACTIVE' : 'NON_COMPLIANT',
          vatStatus: 'REGISTERED',
          complianceScore: isValid ? 100 : 0,
          validationErrors: errors
        },
        latencyMs,
        timestamp: new Date().toISOString()
      };
    }

    // Direct HTTP call to SARS API Endpoint with authorization header
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...request,
          submissionRef: reference
        })
      });

      const latencyMs = Math.round(performance.now() - startTime);
      const data = await response.json().catch(() => ({}));

      return {
        success: response.ok,
        statusCode: response.status,
        environment: this.config.taxEnv,
        simulation: false,
        reference,
        verified: response.ok && (data.verified ?? true),
        details: data.details || {},
        latencyMs,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      // Fallback for sandboxed network boundaries
      return {
        success: false,
        statusCode: 503,
        environment: this.config.taxEnv,
        simulation: this.config.sarsSimulation,
        reference,
        verified: false,
        details: {
          validationErrors: [`Gateway connection failed: ${err.message}`]
        },
        latencyMs,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Health probe verifying connectivity to SARS_API_ENDPOINT
   */
  async checkGatewayHealth(): Promise<SarsGatewayHealthStatus> {
    const startTime = performance.now();
    const url = this.getTargetUrl('/health');

    if (this.config.sarsSimulation) {
      return {
        endpoint: this.config.sarsApiEndpoint,
        environment: this.config.taxEnv,
        isReachable: true,
        statusCode: 200,
        authorized: true,
        latencyMs: 14,
        timestamp: new Date().toISOString()
      };
    }

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });
      const latencyMs = Math.round(performance.now() - startTime);

      return {
        endpoint: this.config.sarsApiEndpoint,
        environment: this.config.taxEnv,
        isReachable: res.ok,
        statusCode: res.status,
        authorized: res.status !== 401 && res.status !== 403,
        latencyMs,
        timestamp: new Date().toISOString()
      };
    } catch {
      return {
        endpoint: this.config.sarsApiEndpoint,
        environment: this.config.taxEnv,
        isReachable: false,
        statusCode: 504,
        authorized: false,
        latencyMs: Math.round(performance.now() - startTime),
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton service export
export const sarsApiService = new SarsApiService();

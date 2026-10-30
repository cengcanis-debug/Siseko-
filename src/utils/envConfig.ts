/**
 * @file envConfig.ts
 * @description Centralized Environment Variable Configuration & Validation Engine.
 * Safely parses, validates, and normalizes environment variables for ZAtax compliance.
 * Resolves duplicated keys (e.g., distinguishing between boolean SARS_SIMULATION and
 * gateway credentials like SARS_API_KEY / SARS_CLIENT_SECRET).
 */

export interface AppEnvConfig {
  /** Target tax compliance environment: 'production' | 'sandbox' | 'development' */
  taxEnv: 'production' | 'sandbox' | 'development';
  /** Whether SARS gateway simulation is enabled */
  sarsSimulation: boolean;
  /** Primary REST endpoint for SARS eFiling ingress */
  sarsApiEndpoint: string;
  /** Hostname for dedicated GovTech/SITA EDI Gateway */
  sarsEdiHost: string;
  /** TCP port for EDI ingress (typically 443 for HTTPS/TLS or 1364 for Connect:Direct) */
  sarsEdiPort: number;
  /** PostgreSQL database connection string */
  databaseUrl: string;
  /** Secret key used to sign bearer sessions and JWT tokens */
  sessionSecret: string;
  /** Optional SARS ISV Gateway API Key (replaces duplicated simulation keys) */
  sarsApiKey?: string;
  /** Optional SARS OAuth / mTLS Client Secret */
  sarsClientSecret?: string;
  /** Optional filesystem path to SARS client X.509 certificate */
  sarsCertPath?: string;
  /** POPIA Section 19 AES-256-GCM encryption key for PII at rest */
  popiaEncryptionKey?: string;
  /** Derived helper: true if strictly in live production mode */
  isProduction: boolean;
  /** Derived helper: true if sandbox simulation is permitted */
  isSimulationPermitted: boolean;
}

export interface EnvValidationReport {
  isValid: boolean;
  taxEnv: string;
  sarsSimulation: boolean;
  variables: Record<string, {
    status: 'CONFIGURED' | 'USING_DEFAULT' | 'MISSING_OPTIONAL' | 'CRITICAL_MISSING';
    maskedValue: string;
    description: string;
  }>;
  warnings: string[];
}

/**
 * Mask secret strings according to POPIA & security best practices.
 * Shows length and partial prefix/suffix if long enough, never full secret.
 */
export function maskEnvSecret(value?: string | null): string {
  if (!value) return '(not set)';
  const trimmed = value.trim();
  if (trimmed.length <= 8) return '********';
  return `${trimmed.substring(0, 3)}...${trimmed.substring(trimmed.length - 3)} (${trimmed.length} chars)`;
}

/**
 * Parses and validates environment variables from process.env or fallback objects.
 */
export function loadAppConfig(envSource: Record<string, string | undefined> = process.env): AppEnvConfig {
  // 1. Resolve TAX_ENV ('production' | 'sandbox' | 'development')
  const rawTaxEnv = (envSource.TAX_ENV || envSource.NODE_ENV || 'sandbox').toLowerCase().trim();
  const taxEnv: 'production' | 'sandbox' | 'development' = 
    rawTaxEnv === 'production' ? 'production' :
    rawTaxEnv === 'sandbox' ? 'sandbox' : 'development';

  // 2. Resolve SARS_SIMULATION vs SARS_API_KEY
  // If SARS_SIMULATION was duplicated with a key or token string instead of boolean:
  const rawSimulation = envSource.SARS_SIMULATION || envSource.SARS_SIMULATION_ENABLED;
  const isSimulationString = typeof rawSimulation === 'string';
  const isSimulationBoolean = isSimulationString && (
    rawSimulation.toLowerCase() === 'true' || 
    rawSimulation.toLowerCase() === '1' || 
    rawSimulation.toLowerCase() === 'yes'
  );
  
  // Detect if the duplicate key was intended as SARS_API_KEY:
  const rawApiKey = envSource.SARS_API_KEY || (
    isSimulationString && !['true', 'false', '1', '0', 'yes', 'no'].includes(rawSimulation.toLowerCase())
      ? rawSimulation
      : undefined
  );

  const sarsSimulation = taxEnv === 'sandbox' ? true : isSimulationBoolean;

  // 3. SARS Integration Endpoints
  const sarsApiEndpoint = (envSource.SARS_API_ENDPOINT || (
    taxEnv === 'production' 
      ? 'https://efiling.sars.gov.za/api/v3'
      : 'https://sandbox.sars.gov.za/api/v1'
  )).trim();

  const sarsEdiHost = (envSource.SARS_EDI_HOST || (
    taxEnv === 'production'
      ? 'sars-edi-gateway.govtech.internal'
      : 'edi-sandbox.sars.gov.za'
  )).trim();

  const parsedPort = parseInt(envSource.SARS_EDI_PORT || '', 10);
  const sarsEdiPort = (!isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) 
    ? parsedPort 
    : (taxEnv === 'sandbox' ? 443 : 1364);

  // 4. System & Security
  const databaseUrl = (envSource.DATABASE_URL || 'postgresql://sars_user:secure_password@localhost:5432/zatax_db').trim();
  const sessionSecret = (envSource.SESSION_SECRET || 'zat-session-signing-secret-default-sandbox-2026').trim();

  // 5. Production flags
  const isProduction = taxEnv === 'production' && !sarsSimulation;
  const isSimulationPermitted = taxEnv === 'sandbox' || sarsSimulation;

  return {
    taxEnv,
    sarsSimulation,
    sarsApiEndpoint,
    sarsEdiHost,
    sarsEdiPort,
    databaseUrl,
    sessionSecret,
    sarsApiKey: rawApiKey,
    sarsClientSecret: envSource.SARS_CLIENT_SECRET,
    sarsCertPath: envSource.SARS_CERT_PATH,
    popiaEncryptionKey: envSource.POPIA_ENCRYPTION_KEY,
    isProduction,
    isSimulationPermitted
  };
}

/**
 * Generates an audit-ready, POPIA-safe environment validation report
 */
export function validateEnvironment(config: AppEnvConfig = loadAppConfig()): EnvValidationReport {
  const warnings: string[] = [];
  const variables: EnvValidationReport['variables'] = {};

  // Check TAX_ENV
  variables['TAX_ENV'] = {
    status: 'CONFIGURED',
    maskedValue: config.taxEnv,
    description: `Active operating environment (${config.taxEnv.toUpperCase()})`
  };

  // Check SARS_SIMULATION
  variables['SARS_SIMULATION'] = {
    status: 'CONFIGURED',
    maskedValue: String(config.sarsSimulation),
    description: config.sarsSimulation 
      ? 'Simulation Mode Active: Real SARS gateway calls are mocked for safe testing'
      : 'Production Gateway Active: Outbound calls sent to GovTech/SARS endpoints'
  };

  // Check SARS_API_KEY (the resolved duplicate key)
  variables['SARS_API_KEY'] = {
    status: config.sarsApiKey ? 'CONFIGURED' : 'MISSING_OPTIONAL',
    maskedValue: maskEnvSecret(config.sarsApiKey),
    description: 'ISV API authentication key for SARS REST Gateway header auth'
  };

  // Check SARS_API_ENDPOINT
  const isUrlValid = /^https?:\/\//i.test(config.sarsApiEndpoint);
  variables['SARS_API_ENDPOINT'] = {
    status: isUrlValid ? 'CONFIGURED' : 'CRITICAL_MISSING',
    maskedValue: config.sarsApiEndpoint,
    description: 'Target SARS eFiling REST Ingress URL'
  };
  if (!isUrlValid) warnings.push('SARS_API_ENDPOINT is not a valid HTTP/HTTPS URL');

  // Check SARS_EDI_HOST
  variables['SARS_EDI_HOST'] = {
    status: config.sarsEdiHost ? 'CONFIGURED' : 'CRITICAL_MISSING',
    maskedValue: config.sarsEdiHost,
    description: 'GovTech EDI host domain or IP for Connect:Direct socket ingress'
  };

  // Check SARS_EDI_PORT
  variables['SARS_EDI_PORT'] = {
    status: (config.sarsEdiPort > 0 && config.sarsEdiPort <= 65535) ? 'CONFIGURED' : 'CRITICAL_MISSING',
    maskedValue: String(config.sarsEdiPort),
    description: 'EDI TCP port (443 HTTPS or 1364 Connect:Direct)'
  };

  // Check DATABASE_URL
  const isDbConfigured = Boolean(config.databaseUrl && !config.databaseUrl.includes('secure_password'));
  variables['DATABASE_URL'] = {
    status: isDbConfigured ? 'CONFIGURED' : 'USING_DEFAULT',
    maskedValue: maskEnvSecret(config.databaseUrl),
    description: 'PostgreSQL connection string for relational records'
  };
  if (!isDbConfigured && config.isProduction) {
    warnings.push('DATABASE_URL is using placeholder credentials in production mode');
  }

  // Check SESSION_SECRET
  const isSecretDefault = config.sessionSecret.includes('default-sandbox');
  variables['SESSION_SECRET'] = {
    status: !isSecretDefault ? 'CONFIGURED' : 'USING_DEFAULT',
    maskedValue: maskEnvSecret(config.sessionSecret),
    description: 'Cryptographic secret for signing bearer tokens and sessions'
  };
  if (isSecretDefault && config.isProduction) {
    warnings.push('SESSION_SECRET is using the fallback development key in production');
  }

  const isValid = warnings.length === 0;

  return {
    isValid,
    taxEnv: config.taxEnv,
    sarsSimulation: config.sarsSimulation,
    variables,
    warnings
  };
}

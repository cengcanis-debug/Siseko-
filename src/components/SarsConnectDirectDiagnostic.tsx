import React, { useState } from 'react';
import { 
  Server, 
  Terminal, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw, 
  Mail, 
  Code2, 
  Zap, 
  ExternalLink,
  Lock,
  Radio,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Globe,
  Network,
  FileCode,
  Key,
  Layers
} from 'lucide-react';
import { UserTaxProfile, RoleType } from '../types';

interface SarsConnectDirectDiagnosticProps {
  profile?: UserTaxProfile;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  currentUserRole?: RoleType;
  gatewayMode?: string;
}

interface SocketProbeResult {
  success: boolean;
  reachable: boolean;
  simulated?: boolean;
  host: string;
  port: number;
  latencyMs: number;
  message: string;
  statusText?: string;
  nodeIdentity?: string;
  error?: string;
  remediation?: string;
  contactEmail: string;
  timestamp: string;
}

interface HttpProbeResult {
  success: boolean;
  reachable: boolean;
  simulated?: boolean;
  url: string;
  httpStatus?: number;
  statusText?: string;
  latencyMs: number;
  dnsStatus?: string;
  errorName?: string;
  errorCode?: string;
  errorMessage?: string;
  diagnosis?: string;
  reasons?: string[];
  remediationWorkarounds?: string[];
  localProxyUrl?: string;
  data?: any;
  timestamp: string;
}

export const SarsConnectDirectDiagnostic: React.FC<SarsConnectDirectDiagnosticProps> = ({
  profile,
  addAuditLog,
  showBanner,
  currentUserRole = 'Accountant',
  gatewayMode = 'PRODUCTION_LIVE'
}) => {
  const isProduction = gatewayMode === 'PRODUCTION_LIVE' || 
    gatewayMode === 'Production Live' ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SARS_MODE === 'production');

  // Protocol mode: TCP Socket (Connect:Direct) vs HTTPS REST Ingress (v3 API)
  const [protocolMode, setProtocolMode] = useState<'REST_V3' | 'CONNECT_DIRECT'>('REST_V3');

  // TCP Socket parameters
  const [host, setHost] = useState<string>('sars-edi-gateway.govtech.internal');
  const [port, setPort] = useState<number>(1364);
  const [timeoutSec, setTimeoutSec] = useState<number>(5);
  const [useSocketSimulation, setUseSocketSimulation] = useState<boolean>(false);
  const [isSocketProbing, setIsSocketProbing] = useState<boolean>(false);
  const [socketResult, setSocketResult] = useState<SocketProbeResult | null>(null);
  const [socketHistory, setSocketHistory] = useState<SocketProbeResult[]>([]);

  // HTTPS REST v3 Gateway parameters (Browser only calls fetch('/api/sars-gateway/v3') - never direct staging)
  // ENOTFOUND is EXPECTED - GovTech isolation secure
  const [targetUrl, setTargetUrl] = useState<string>('/api/sars-gateway/v3');
  const [useHttpSimulation, setUseHttpSimulation] = useState<boolean>(false);
  const [isHttpProbing, setIsHttpProbing] = useState<boolean>(false);
  const [httpResult, setHttpResult] = useState<HttpProbeResult | null>(null);
  const [httpHistory, setHttpHistory] = useState<HttpProbeResult[]>([]);

  // UI state
  const [activeCodeTab, setActiveCodeTab] = useState<'fetch' | 'curl' | 'python'>('fetch');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showEmailTemplate, setShowEmailTemplate] = useState<boolean>(false);

  // Copy helper
  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showBanner(`📋 Copied ${label} to clipboard.`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Run live socket probe against backend /api/sars-gateway/test-node-socket
  const handleExecuteSocketProbe = async () => {
    setIsSocketProbing(true);
    showBanner(`📡 Initiating TCP socket probe to ${host}:${port} (Timeout: ${timeoutSec}s)...`);

    try {
      const response = await fetch('/api/sars-gateway/test-node-socket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: host.trim(),
          port: Number(port),
          timeoutMs: timeoutSec * 1000,
          simulate: useSocketSimulation
        })
      });

      const data: SocketProbeResult = await response.json();
      setSocketResult(data);
      setSocketHistory(prev => [data, ...prev.slice(0, 9)]);

      if (data.reachable) {
        addAuditLog(
          'SARS_QA_NODE_PROBE_SUCCESS',
          `TCP socket to ${data.host}:${data.port} reachable in ${data.latencyMs}ms. Handshake message: ${data.message}`,
          'info'
        );
        showBanner(`✅ ${data.message}`);
      } else {
        addAuditLog(
          'SARS_QA_NODE_PROBE_FAILED',
          `TCP socket to ${data.host}:${data.port} failed (${data.error || 'unreachable'}). Remediation: Open port 1364 on firewall.`,
          'warn'
        );
        showBanner(`⚠️ ${data.message}`);
      }
    } catch (err: any) {
      const failResult: SocketProbeResult = {
        success: false,
        reachable: false,
        host,
        port,
        latencyMs: timeoutSec * 1000,
        error: err.message || 'Network fetch failed',
        message: `SARS QA not reachable: ${err.message || 'fetch failed'} - open port 1364 on firewall`,
        statusText: 'Client Fetch Error',
        contactEmail: 'SPS_Connect_Direct@sars.gov.za',
        timestamp: new Date().toISOString()
      };
      setSocketResult(failResult);
      setSocketHistory(prev => [failResult, ...prev.slice(0, 9)]);
      showBanner(`⚠️ ${failResult.message}`);
    } finally {
      setIsSocketProbing(false);
    }
  };

  // Call the user-specified GET /api/probe-sars-qa endpoint
  const handleProbeSarsQaGet = async () => {
    setIsSocketProbing(true);
    showBanner(`🔌 Calling GET /api/probe-sars-qa (sarsqa:1364)...`);
    try {
      const res = await fetch(`/api/probe-sars-qa${useSocketSimulation ? '?simulate=true' : ''}`);
      const data = await res.json();
      const mappedResult: SocketProbeResult = {
        success: data.reachable === true,
        reachable: data.reachable === true,
        simulated: data.simulated === true,
        host: data.endpoint || data.ip || 'sars-edi-gateway.govtech.internal',
        port: data.port || 1364,
        latencyMs: data.latency || 0,
        message: data.reachable 
          ? `SARS QA reachable (${data.latency}ms) - node: ${data.node}` 
          : `SARS QA not reachable: ${data.reason || 'Connection failed'}`,
        statusText: data.reachable ? 'Reachable' : (data.reason || 'Unreachable'),
        nodeIdentity: data.node || 'sarsqa',
        contactEmail: 'SPS_Connect_Direct@sars.gov.za',
        timestamp: new Date().toISOString()
      };
      setSocketResult(mappedResult);
      setSocketHistory(prev => [mappedResult, ...prev.slice(0, 9)]);
      if (data.reachable) {
        showBanner(`✅ GET /api/probe-sars-qa: Node ${data.node} reachable in ${data.latency}ms`);
      } else {
        showBanner(`⚠️ GET /api/probe-sars-qa: ${data.reason}`);
      }
    } catch (err: any) {
      showBanner(`⚠️ Error calling /api/probe-sars-qa: ${err.message}`);
    } finally {
      setIsSocketProbing(false);
    }
  };

  // Run live HTTP probe against backend /api/sars-gateway/probe-http
  const handleExecuteHttpProbe = async (overrideUrl?: string) => {
    const urlToTest = overrideUrl || targetUrl;
    setIsHttpProbing(true);
    showBanner(`🌐 Probing HTTP endpoint: ${urlToTest}...`);

    try {
      const response = await fetch('/api/sars-gateway/probe-http', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlToTest.trim(),
          simulate: useHttpSimulation
        })
      });

      const data: HttpProbeResult = await response.json();
      setHttpResult(data);
      setHttpHistory(prev => [data, ...prev.slice(0, 9)]);

      if (data.reachable && data.success) {
        addAuditLog(
          'SARS_HTTP_GATEWAY_PROBE_SUCCESS',
          `HTTP probe to ${data.url} returned status ${data.httpStatus} in ${data.latencyMs}ms.`,
          'info'
        );
        showBanner(`✅ SARS Gateway responded (${data.httpStatus || 200} OK)`);
      } else {
        addAuditLog(
          'SARS_HTTP_GATEWAY_PROBE_DIAGNOSTIC',
          `HTTP probe to ${data.url} reported ${data.errorCode || 'UNRESOLVED'}: ${data.errorMessage || data.diagnosis}`,
          'warn'
        );
        showBanner(`⚠️ Probe result: ${data.errorCode || 'ENOTFOUND'} - ${data.dnsStatus || 'Failed'}`);
      }
    } catch (err: any) {
      const failResult: HttpProbeResult = {
        success: false,
        reachable: false,
        url: urlToTest,
        errorName: 'ClientFetchError',
        errorCode: 'CLIENT_FETCH_ERROR',
        errorMessage: err.message || 'Network fetch to local probe failed',
        latencyMs: 0,
        dnsStatus: 'ERROR',
        diagnosis: 'Local backend probe request could not complete.',
        timestamp: new Date().toISOString()
      };
      setHttpResult(failResult);
      setHttpHistory(prev => [failResult, ...prev.slice(0, 9)]);
      showBanner(`⚠️ ${failResult.errorMessage}`);
    } finally {
      setIsHttpProbing(false);
    }
  };

  // Preset node loader for TCP
  const handleSetSocketPreset = (presetHost: string, presetPort: number, label: string) => {
    setHost(presetHost);
    setPort(presetPort);
    showBanner(`🎯 Selected node preset: ${label} (${presetHost}:${presetPort})`);
  };

  // Preset URL loader for HTTP
  const handleSetHttpPreset = (presetUrl: string, label: string) => {
    setTargetUrl(presetUrl);
    showBanner(`🎯 Selected endpoint preset: ${label}`);
  };

  // Pre-drafted email to SPS_Connect_Direct@sars.gov.za
  const emailTo = "SPS_Connect_Direct@sars.gov.za";
  const emailSubject = `APPLICATION FOR SARS CONNECT:DIRECT & eFILING v3 REST API STAGING INGRESS (NODE: sarsqa - EDI Gateway Port 1364)`;
  const emailBody = `To: SARS SPS Connect:Direct Onboarding Team
South African Revenue Service (SARS)
Email: SPS_Connect_Direct@sars.gov.za
Cc: isvsupport@sars.gov.za; thirdpartydata@sars.gov.za

DATE: ${new Date().toISOString().split('T')[0]}
SUBJECT: APPLICATION FOR CONNECT:DIRECT PEM CERTIFICATE & eFILING v3 REST API STAGING INGRESS

Dear SARS Secure Ingress & Connect:Direct Technical Support,

1. PURPOSE & INTEGRATION SCOPE:
We are conducting readiness integration testing for the South Africa Tax Compliance Advisor platform. 
We have initiated connectivity diagnostics to:
- Connect:Direct QA Node: sars-edi-gateway.govtech.internal:1364 (sarsqa)
- eFiling REST Ingress: /api/sars-gateway/v3 (Proxying efiling-staging.sars.gov.za - ENOTFOUND is EXPECTED via GovTech isolation)
- Source Organization: ${profile?.name || 'Ilitha Fintech Operations (Pty) Ltd'}
- Registered CIPC / Practice: 2026/707498/07 / PR-0098412
- Director: V Zenzile | Lead Developer: S Cengcani
- Registered Address: 6787 Unique Homes, Mangaung, Bloemfontein 9301
- Technical Officer: ${profile?.email || 'cengcanis@gmail.com'}

2. REQUESTED CREDENTIALS & NETWORK AUTHORIZATION:
To complete our end-to-end integration (IT3(d), Section 18A, EMP501, and TCS PIN Verification):
1. SARS Connect:Direct Public PEM Root & Sub-CA Certificates.
2. X.509 Client Certificate (.pem / .p12) for mutual TLS (mTLS) authentication.
3. Egress IP Whitelisting for our cloud IP addresses.
4. Hostname resolution confirmation for 'efiling-staging.sars.gov.za' via SITA GPN / APN (ENOTFOUND is EXPECTED on public DNS).

Kind regards,
${profile?.name || 'Authorized Compliance Technical Officer'}
South Africa Tax Compliance Advisor Platform
Tel: +27 11 900 1200 / +27 82 555 1234
`;

  // Code snippets for REST v3 API
  // Browser only calls fetch('/api/sars-gateway/v3') - never direct staging
  const codeFetchSnippet = `// Browser only calls fetch('/api/sars-gateway/v3') - never direct staging
// ENOTFOUND is EXPECTED - GovTech isolation secure
const proxyRes = await fetch('/api/sars-gateway/v3');
const proxyData = await proxyRes.json();
console.log('SARS Sandbox Gateway Data:', proxyData);
`;

  const codeCurlSnippet = `# Test the local server-side sandbox proxy:
# ENOTFOUND is EXPECTED - GovTech isolation secure
curl -v http://localhost:3000/api/sars-gateway/v3
`;

  const codePythonSnippet = `import requests

# Query via the secure server-side sandbox proxy:
# ENOTFOUND is EXPECTED - GovTech isolation secure
response = requests.get('http://localhost:3000/api/sars-gateway/v3')
print("Status:", response.status_code)
print("Payload:", response.json())
`;

  return (
    <div className="space-y-6 animate-fadeIn" id="sars-connect-direct-diagnostic-section">
      
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-5 rounded-2xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                <span>SARS Ingress Diagnostics & Gateway Explorer</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  REST v3 API
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  PORT 1364 EDI
                </span>
              </h2>
            </div>
            <p className="text-xs text-white/70 max-w-3xl">
              Inspects connectivity, DNS resolution, and security requirements for SARS eFiling REST Ingress (<code className="text-cyan-300 font-mono">/api/sars-gateway/v3</code>) and Connect:Direct EDI (<code className="text-emerald-300 font-mono">Port 1364</code>).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmailTemplate(!showEmailTemplate)}
              className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-300" />
              <span>{showEmailTemplate ? 'Hide Email Template' : 'SPS Ingress Email'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PROTOCOL MODE SELECTOR PILL TABS */}
      <div className="flex items-center justify-between gap-3 p-1.5 bg-slate-950/80 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setProtocolMode('REST_V3')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              protocolMode === 'REST_V3'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-300" />
            <span>eFiling REST Gateway (/api/sars-gateway/v3)</span>
          </button>

          <button
            onClick={() => setProtocolMode('CONNECT_DIRECT')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              protocolMode === 'CONNECT_DIRECT'
                ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-lg shadow-emerald-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-300" />
            <span>Connect:Direct TCP EDI Node (Port 1364)</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-white/50 pr-2">
          <span>Security Standard: mTLS (X.509 RSA)</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: HTTPS REST GATEWAY (fetch('/api/sars-gateway/v3')) */}
      {/* ========================================================================= */}
      {protocolMode === 'REST_V3' && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* QUICK PRESETS */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/70 border border-white/10 rounded-2xl text-xs">
            <span className="font-mono text-[11px] text-white/50 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target URL Presets:</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSetHttpPreset('/api/sars-gateway/v3', 'SARS Staging Ingress Proxy')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer border ${
                  targetUrl === '/api/sars-gateway/v3'
                    ? 'bg-cyan-500/30 text-cyan-200 border-cyan-500/50 font-bold'
                    : 'bg-white/5 hover:bg-white/15 text-white/80 border-white/10'
                }`}
              >
                /api/sars-gateway/v3 (SARS Staging UAT Proxy)
              </button>
              <button
                onClick={() => handleSetHttpPreset('/api/sars-gateway/v3', 'Local Sandbox REST Gateway Proxy')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer border ${
                  targetUrl === '/api/sars-gateway/v3'
                    ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500/50 font-bold'
                    : 'bg-white/5 hover:bg-white/15 text-white/80 border-white/10'
                }`}
              >
                /api/sars-gateway/v3 (Local Sandbox Proxy)
              </button>
              <button
                onClick={() => handleSetHttpPreset('https://efiling.sars.gov.za/api/v3', 'SARS Production Live')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer border ${
                  targetUrl === 'https://efiling.sars.gov.za/api/v3'
                    ? 'bg-rose-500/30 text-rose-200 border-rose-500/50 font-bold'
                    : 'bg-white/5 hover:bg-white/15 text-white/80 border-white/10'
                }`}
              >
                https://efiling.sars.gov.za/api/v3 (SARS Production Live)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* LEFT 2 COLS: HTTP CONTROLLER & LIVE OUTPUT */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* TARGET INPUT & CONTROLS */}
              <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SARS eFiling REST Ingress Probe Configuration</span>
                  </span>
                  <label className="flex items-center gap-1.5 text-[11px] text-white/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useHttpSimulation}
                      onChange={(e) => setUseHttpSimulation(e.target.checked)}
                      className="rounded border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Simulate 200 OK Sandbox Handshake</span>
                  </label>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="text-[10.5px] font-mono text-white/50 block">Target Request URL (fetch)</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="/api/sars-gateway/v3"
                      className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={() => handleExecuteHttpProbe()}
                      disabled={isHttpProbing}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50 shrink-0"
                      id="execute-sars-http-probe-btn"
                    >
                      {isHttpProbing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Probing Endpoint...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Run fetch() Probe</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-white/50 pt-1">
                  <span>Method: <strong className="text-white font-mono">GET</strong> • Ingress Layer: <strong className="text-cyan-300 font-mono">TLS 1.3 REST</strong></span>
                  <button
                    onClick={() => {
                      setTargetUrl('/api/sars-gateway/v3');
                      handleExecuteHttpProbe('/api/sars-gateway/v3');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-mono text-[11px] underline cursor-pointer"
                  >
                    Switch to Local Sandbox Proxy (/api/sars-gateway/v3)
                  </button>
                </div>
              </div>

              {/* TERMINAL VIEWER & ERROR DIAGNOSTICS */}
              <div className="bg-black/95 border border-white/10 rounded-2xl p-4 font-mono text-xs space-y-3 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[11px] text-white/70 ml-1 font-bold">
                      HTTP Probe Terminal Output: fetch('{targetUrl}')
                    </span>
                  </div>
                  <span className="text-[10px] text-white/40">
                    Protocol: HTTPS • Port: 443
                  </span>
                </div>

                {/* PROBE OUTPUT SCREEN */}
                <div className="p-3 bg-slate-950/90 rounded-xl border border-white/5 space-y-2 min-h-[160px]">
                  <div className="text-white/40 text-[11px] flex items-center gap-1.5">
                    <span className="text-cyan-400">$</span>
                    <span>fetch("{targetUrl}")</span>
                  </div>

                  {isHttpProbing && (
                    <div className="text-cyan-300 animate-pulse text-[11.5px] py-3 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Resolving DNS & sending GET request to {targetUrl}...</span>
                    </div>
                  )}

                  {!isHttpProbing && !httpResult && (
                    <div className="text-white/50 py-6 text-center space-y-2">
                      <p>Click <strong className="text-white">"Run fetch() Probe"</strong> to test live HTTP connectivity to SARS staging v3.</p>
                      <p className="text-[11px] text-white/40">
                        Default test targets <code className="text-cyan-300 font-mono">/api/sars-gateway/v3</code>
                      </p>
                    </div>
                  )}

                  {!isHttpProbing && httpResult && (
                    <div className="space-y-3 py-1">
                      {httpResult.success ? (
                        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 space-y-1">
                          <div className="flex items-center gap-2 font-bold text-sm text-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Status: {httpResult.httpStatus || 200} {httpResult.statusText || 'OK'}</span>
                          </div>
                          <div className="text-[11px] text-emerald-300/80 font-mono">
                            Latency: {httpResult.latencyMs}ms • Endpoint: {httpResult.url}
                            {httpResult.simulated && ' (Simulated Sandbox Gateway)'}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 space-y-1.5">
                          <div className="flex items-center gap-2 font-bold text-sm text-rose-200">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>{httpResult.errorCode || 'ENOTFOUND'}: {httpResult.errorMessage || 'Fetch failed'}</span>
                          </div>
                          <div className="text-[11px] text-rose-300/80 font-mono">
                            Target: {httpResult.url} • DNS Status: {httpResult.dnsStatus || 'UNRESOLVED'} • Latency: {httpResult.latencyMs}ms
                          </div>
                        </div>
                      )}

                      {/* WHY DIRECT FETCH FAILS BREAKDOWN */}
                      {!httpResult.success && (
                        <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200 text-xs space-y-2 font-sans">
                          <strong className="block text-amber-300 font-bold flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                            <span>Why does direct fetch to efiling-staging.sars.gov.za fail? (ENOTFOUND is EXPECTED - GovTech isolation secure)</span>
                          </strong>
                          
                          <div className="space-y-1.5 text-white/80 text-[11.5px]">
                            <p>
                              <strong className="text-cyan-300">1. Private GovTech / SITA DNS (ENOTFOUND is EXPECTED):</strong> SARS's staging host (<code className="text-white font-mono">efiling-staging.sars.gov.za</code>) is an internal government intranet address protected via /api/sars-gateway proxy.
                            </p>
                            <p>
                              <strong className="text-cyan-300">2. Mutual TLS (mTLS):</strong> SARS v3 REST ingress enforces two-way cryptographic verification. Callers must supply an X.509 client certificate and private key signed by the SARS SPS Sub-CA.
                            </p>
                            <p>
                              <strong className="text-cyan-300">3. Browser CORS Policy:</strong> Even if DNS resolves via VPN, browsers block cross-origin requests unless SARS returns <code className="text-white font-mono">Access-Control-Allow-Origin</code>, requiring a server-side proxy.
                            </p>
                          </div>

                          <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] text-amber-300 font-bold">Recommended Solution:</span>
                            <button
                              onClick={() => {
                                setTargetUrl('/api/sars-gateway/v3');
                                handleExecuteHttpProbe('/api/sars-gateway/v3');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Execute via Sandbox Proxy (/api/sars-gateway/v3)</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* DATA PAYLOAD VIEWER IF SUCCESSFUL */}
                      {httpResult.data && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-white/50 font-mono uppercase block">Gateway Discovery Response Payload:</span>
                          <pre className="p-3 bg-black/80 rounded-xl text-emerald-300 font-mono text-[11px] overflow-x-auto border border-white/5 max-h-56 whitespace-pre-wrap">
                            {JSON.stringify(httpResult.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-between items-center text-[10.5px] text-white/40 pt-1 border-t border-white/10">
                  <span>Host: /api/sars-gateway/v3 (Internal target: efiling-staging.sars.gov.za - ENOTFOUND is EXPECTED via GovTech isolation)</span>
                  <span>Ingress Node: sars-edi-gateway.govtech.internal (sarsqa)</span>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: ARCHITECTURAL OVERVIEW & ENDPOINTS */}
            <div className="space-y-4">
              
              <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs border-b border-white/10 pb-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>SARS eFiling v3 REST API Architecture</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-white/40">Specification:</span>
                    <span className="text-white font-bold">v3.4.1 (2026 Release)</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-white/40">Ingress Target:</span>
                    <span className="text-cyan-300 font-mono">/api/sars-gateway/v3 (efiling-staging.sars.gov.za - ENOTFOUND is EXPECTED)</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-white/40">Production Host:</span>
                    <span className="text-white/70 font-mono">efiling.sars.gov.za</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-white/40">Auth Standard:</span>
                    <span className="text-emerald-300 font-bold">mTLS + OAuth2 Token</span>
                  </div>
                </div>

                <div className="p-2.5 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-[11px] text-cyan-200/90 space-y-1">
                  <span className="font-bold block text-cyan-300">Catalogued v3 Services:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-white/70">
                    <li><code className="text-cyan-300 font-mono">/api/v3/tcs/verify-pin</code> - Tax Compliance Status PINs</li>
                    <li><code className="text-cyan-300 font-mono">/api/v3/direct3p/it3d/submit</code> - Section 18A PBO returns</li>
                    <li><code className="text-cyan-300 font-mono">/api/v3/paye/emp501/reconcile</code> - Bi-Annual PAYE EMP501</li>
                    <li><code className="text-cyan-300 font-mono">/api/v3/vat/returns/vat201</code> - 2026 VAT201 e-filing</li>
                  </ul>
                </div>
              </div>

              {/* RECENT HTTP RUNS */}
              <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Recent HTTP Probes ({httpHistory.length})</span>
                  </span>
                  {httpHistory.length > 0 && (
                    <button
                      onClick={() => setHttpHistory([])}
                      className="text-[10px] text-white/40 hover:text-white cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {httpHistory.length === 0 ? (
                  <div className="text-[11px] text-white/40 py-2 text-center">
                    No HTTP probes executed yet.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {httpHistory.map((h, i) => (
                      <div 
                        key={i} 
                        className="p-2 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between text-[10.5px] font-mono"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {h.success ? (
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                          )}
                          <span className="text-white/80 truncate max-w-[140px]">{h.url}</span>
                        </div>
                        <div className="text-white/40 shrink-0">
                          {h.httpStatus ? `${h.httpStatus} OK` : h.errorCode || 'ERR'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* CODE SNIPPETS & WORKAROUNDS: HIDDEN IN PRODUCTION LIVE EXCEPT FOR AUDITOR ROLE */}
          {((process.env.NEXT_PUBLIC_SARS_MODE !== 'production' && !isProduction) || currentUserRole === 'Auditor') && (
            <div className="bg-slate-950/80 border border-white/10 rounded-2xl overflow-hidden space-y-0" id="integration-scripts-tabs">
              <div className="flex flex-wrap items-center justify-between border-b border-white/10 px-4 py-2.5 bg-slate-900/60 gap-2">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">
                    Integration Scripts & DNS Workarounds for SARS eFiling v3
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveCodeTab('fetch')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      activeCodeTab === 'fetch'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    fetch() & Local Proxy
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('curl')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      activeCodeTab === 'curl'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    cURL (with mTLS)
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('python')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      activeCodeTab === 'python'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    Python 3 requests
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 font-mono text-[10.5px]">
                    {activeCodeTab === 'fetch' && 'Client / Node.js fetch implementation with sandbox proxy fallback'}
                    {activeCodeTab === 'curl' && 'cURL command testing local server-side sandbox proxy'}
                    {activeCodeTab === 'python' && 'Python requests script querying local server-side sandbox proxy'}
                  </span>

                  <button
                    onClick={() => {
                      const code = activeCodeTab === 'fetch' 
                        ? codeFetchSnippet 
                        : activeCodeTab === 'curl' 
                        ? codeCurlSnippet 
                        : codePythonSnippet;
                      handleCopy(code, `code_${activeCodeTab}`, `${activeCodeTab.toUpperCase()} code`);
                    }}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-mono text-[10.5px] transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === `code_${activeCodeTab}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === `code_${activeCodeTab}` ? 'Copied' : 'Copy Snippet'}</span>
                  </button>
                </div>

                <pre className="p-3.5 bg-black/90 rounded-xl text-cyan-300 font-mono text-[11.5px] overflow-x-auto border border-white/5">
                  {activeCodeTab === 'fetch' && codeFetchSnippet}
                  {activeCodeTab === 'curl' && codeCurlSnippet}
                  {activeCodeTab === 'python' && codePythonSnippet}
                </pre>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: CONNECT:DIRECT TCP SOCKET (PORT 1364) */}
      {/* ========================================================================= */}
      {protocolMode === 'CONNECT_DIRECT' && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* QUICK PRESETS */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/70 border border-white/10 rounded-2xl text-xs">
            <span className="font-mono text-[11px] text-white/50 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quick Node Target Presets:</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSetSocketPreset('sars-edi-gateway.govtech.internal', 1364, 'SARS QA Node (sarsqa)')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer border ${
                  host === 'sars-edi-gateway.govtech.internal' && port === 1364
                    ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500/50 font-bold'
                    : 'bg-white/5 hover:bg-white/15 text-white/80 border-white/10'
                }`}
              >
                sars-edi-gateway.govtech.internal:1364 (sarsqa - QA Test Node)
              </button>
              <button
                onClick={() => handleSetSocketPreset('sars-edi-prod.govtech.internal', 1364, 'SARS Production Node (sarsprod)')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer border ${
                  host === 'sars-edi-prod.govtech.internal' && port === 1364
                    ? 'bg-rose-500/30 text-rose-200 border-rose-500/50 font-bold'
                    : 'bg-white/5 hover:bg-white/15 text-white/80 border-white/10'
                }`}
              >
                sars-edi-prod.govtech.internal:1364 (sarsprod - Live Node)
              </button>
              <button
                onClick={() => handleSetSocketPreset('127.0.0.1', 3000, 'Local Dev App Loopback')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer border ${
                  host === '127.0.0.1' && port === 3000
                    ? 'bg-indigo-500/30 text-indigo-200 border-indigo-500/50 font-bold'
                    : 'bg-white/5 hover:bg-white/15 text-white/80 border-white/10'
                }`}
              >
                127.0.0.1:3000 (Local Loopback)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* LEFT 2 COLUMNS: CONFIGURATION & TERMINAL MONITOR */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* PARAMETERS CARD */}
              <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Socket Connection Parameters</span>
                  </span>
                  <label className="flex items-center gap-1.5 text-[11px] text-white/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSocketSimulation}
                      onChange={(e) => setUseSocketSimulation(e.target.checked)}
                      className="rounded border-white/20 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Simulate Ingress Handshake (UAT Mode)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono text-white/50 block">Target Host / Hostname</label>
                    <input
                      type="text"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      placeholder="sars-edi-gateway.govtech.internal"
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono text-white/50 block">TCP Port (Default 1364)</label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      placeholder="1364"
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10.5px] font-mono text-white/50">
                      <span>Socket Timeout</span>
                      <span className="text-cyan-300 font-bold">{timeoutSec}s</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={15}
                      value={timeoutSec}
                      onChange={(e) => setTimeoutSec(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer mt-2"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-[11px] text-white/50 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Backend Socket Driver: Node.js <code className="text-white font-mono">net.Socket</code> • Direct TCP SYN Probe</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleProbeSarsQaGet}
                      disabled={isSocketProbing}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-mono font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      id="probe-sars-qa-get-btn"
                      title="Direct probe using app.get('/api/probe-sars-qa')"
                    >
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>GET /api/probe-sars-qa</span>
                    </button>
                    <button
                      onClick={handleExecuteSocketProbe}
                      disabled={isSocketProbing}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                      id="execute-sars-socket-probe-btn"
                    >
                      {isSocketProbing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Testing Connection to {host}:{port}...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Run Socket Connection Test</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* LIVE TERMINAL RESULT VIEWER */}
              <div className="bg-black/95 border border-white/10 rounded-2xl p-4 font-mono text-xs space-y-3 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[11px] text-white/70 ml-1 font-bold">
                      Terminal Output: SARS QA Diagnostic Probe
                    </span>
                  </div>
                  <span className="text-[10px] text-white/40">
                    Host: {host} • Port: {port}
                  </span>
                </div>

                {/* CONSOLE SCREEN */}
                <div className="p-3 bg-slate-950/90 rounded-xl border border-white/5 space-y-2 min-h-[140px]">
                  <div className="text-white/40 text-[11px] flex items-center gap-1.5">
                    <span className="text-emerald-400">$</span>
                    <span>python3 test_sars_qa_node.py --host {host} --port {port} --timeout {timeoutSec}</span>
                  </div>

                  {isSocketProbing && (
                    <div className="text-cyan-300 animate-pulse text-[11.5px] py-2 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting to {host}:{port} via TCP socket (awaiting SYN-ACK, timeout {timeoutSec}s)...</span>
                    </div>
                  )}

                  {!isSocketProbing && !socketResult && (
                    <div className="text-white/50 py-4 text-center">
                      Click <strong className="text-white">"Run Socket Connection Test"</strong> to probe reachability to SARS QA node.
                    </div>
                  )}

                  {!isSocketProbing && socketResult && (
                    <div className="space-y-2 py-1">
                      {socketResult.reachable ? (
                        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 space-y-1">
                          <div className="flex items-center gap-2 font-bold text-sm text-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{socketResult.message}</span>
                          </div>
                          <div className="text-[11px] text-emerald-300/80 font-mono">
                            Latency: {socketResult.latencyMs}ms • Status: 200 TCP_ESTABLISHED • Destination: {socketResult.host}:{socketResult.port}
                            {socketResult.simulated && ' (Simulated UAT Sandbox)'}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 space-y-1">
                          <div className="flex items-center gap-2 font-bold text-sm text-rose-200">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>{socketResult.message}</span>
                          </div>
                          <div className="text-[11px] text-rose-300/80 font-mono">
                            Latency: {socketResult.latencyMs}ms • Error: {socketResult.error} • Destination: {socketResult.host}:{socketResult.port}
                          </div>
                        </div>
                      )}

                      {/* REMEDIATION BANNER */}
                      {!socketResult.reachable && (
                        <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl text-amber-200 text-[11px] space-y-1 font-sans">
                          <strong className="block text-amber-300 font-bold flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                            <span>Remediation Action Plan:</span>
                          </strong>
                          <ol className="list-decimal list-inside space-y-1 text-white/70">
                            <li><strong className="text-white">Firewall Ingress/Egress:</strong> Ensure outbound security groups permit TCP traffic on port <code className="text-amber-300 font-mono">1364</code> to the GovTech EDI perimeter gateway.</li>
                            <li><strong className="text-white">IP Whitelisting:</strong> SARS QA network filters connections by source IP. Email your public IP to <code className="text-emerald-300 font-mono">SPS_Connect_Direct@sars.gov.za</code>.</li>
                            <li><strong className="text-white">PEM Certificate:</strong> Obtain your official client certificate and node authorization credentials from SARS.</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* TERMINAL FOOTER DETAILS */}
                <div className="flex flex-wrap justify-between items-center text-[10.5px] text-white/40 pt-1 border-t border-white/10">
                  <span>Node Protocol: IBM Sterling Connect:Direct / SPS File Transfer</span>
                  <span>Official Support: SPS_Connect_Direct@sars.gov.za</span>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: PROTOCOL & CERTIFICATE INFO CARD */}
            <div className="space-y-4">
              
              <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs border-b border-white/10 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>SPS Connect:Direct Architecture</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-white/40">Node Name:</span>
                    <span className="text-white font-bold">sarsqa</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-white/40">Node Host:</span>
                    <span className="text-cyan-300 font-bold">sars-edi-gateway.govtech.internal</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-white/40">Default Port:</span>
                    <span className="text-amber-300 font-bold">1364 (TCP)</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-white/40">Production Node:</span>
                    <span className="text-white/70">sars-edi-prod.govtech.internal (sarsprod)</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-white/40">Security Standard:</span>
                    <span className="text-emerald-300 font-bold">mTLS + PEM Certs</span>
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-200/90 space-y-1">
                  <span className="font-bold block text-emerald-300">What is Connect:Direct (Port 1364)?</span>
                  <p className="text-white/70">
                    Used by SARS for high-volume automated electronic data interchange (EDI), including Section 18A IT3(d) third-party reporting, bank interest IT3(b), and bi-annual EMP501 reconciliations.
                  </p>
                </div>
              </div>

              {/* HISTORIC SOCKET PROBES LIST */}
              <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Recent Socket Probes ({socketHistory.length})</span>
                  </span>
                  {socketHistory.length > 0 && (
                    <button
                      onClick={() => setSocketHistory([])}
                      className="text-[10px] text-white/40 hover:text-white cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {socketHistory.length === 0 ? (
                  <div className="text-[11px] text-white/40 py-2 text-center">
                    No socket probes executed yet.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {socketHistory.map((h, i) => (
                      <div 
                        key={i} 
                        className="p-2 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between text-[10.5px] font-mono"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {h.reachable ? (
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                          )}
                          <span className="text-white/80">{h.host}:{h.port}</span>
                        </div>
                        <div className="text-white/40 shrink-0">
                          {h.latencyMs}ms • {h.reachable ? 'OK' : 'ERR'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* COLLAPSIBLE EMAIL DOSSIER TEMPLATE */}
      {showEmailTemplate && (
        <div className="p-5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-indigo-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-300" />
              <h3 className="text-xs font-bold text-white">
                Pre-Formatted Email Application to <code className="text-cyan-300 font-mono">SPS_Connect_Direct@sars.gov.za</code>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(emailBody, 'email_body', 'Email Application Text')}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'email_body' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'email_body' ? 'Copied Email' : 'Copy Application Email'}</span>
              </button>

              <a
                href={`mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open Mail Client</span>
              </a>
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-white/40 w-16">To:</span>
              <span className="text-cyan-300 font-bold">{emailTo}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40 w-16">Subject:</span>
              <span className="text-white/90">{emailSubject}</span>
            </div>
          </div>

          <pre className="p-3 bg-black/70 rounded-xl text-white/80 font-mono text-[11px] overflow-x-auto border border-white/5 max-h-64 whitespace-pre-wrap">
            {emailBody}
          </pre>
        </div>
      )}

    </div>
  );
};

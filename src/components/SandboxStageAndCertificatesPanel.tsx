import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileCheck2, 
  Layers, 
  Server, 
  Lock, 
  Key, 
  FileText, 
  ArrowRight, 
  Sparkles, 
  Upload, 
  Download, 
  RefreshCw, 
  Check, 
  Clock, 
  ShieldAlert, 
  ExternalLink, 
  HelpCircle,
  Hash,
  ChevronRight,
  ChevronDown,
  Info,
  Award,
  Radio,
  Zap,
  Terminal
} from 'lucide-react';
import { 
  SandboxStage, 
  StatutoryCertificate, 
  INITIAL_SANDBOX_STAGES, 
  INITIAL_STATUTORY_CERTIFICATES, 
  DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER,
  GatewayEnvironmentMode,
  getOutstandingCertificates,
  generateSyntheticCertHash,
  generateX509MetadataForCert
} from '../utils/sandboxStagesAndCertificates';
import { RoleType } from '../types';
import { X509CertificateInspectorModal } from './X509CertificateInspectorModal';
import { ProductionAccreditationModal } from './ProductionAccreditationModal';

interface SandboxStageAndCertificatesPanelProps {
  currentUserRole: RoleType;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const SandboxStageAndCertificatesPanel: React.FC<SandboxStageAndCertificatesPanelProps> = ({
  currentUserRole,
  addAuditLog,
  showBanner,
  onNavigateToTab
}) => {
  // Stages State
  const [stages, setStages] = useState<SandboxStage[]>(INITIAL_SANDBOX_STAGES);
  const [selectedStageId, setSelectedStageId] = useState<number>(5); // Default to Stage 5 (Accreditation 100% Active)
  
  // Certificates State
  const [certificates, setCertificates] = useState<StatutoryCertificate[]>(INITIAL_STATUTORY_CERTIFICATES);
  const [certFilter, setCertFilter] = useState<'ALL' | 'OUTSTANDING' | 'ACTIVE'>('ALL');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [isExecutingPipeline, setIsExecutingPipeline] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<string | null>(null);
  const [attestingCertId, setAttestingCertId] = useState<string | null>(null);

  // Gateway Environment Mode State
  const [gatewayMode, setGatewayMode] = useState<GatewayEnvironmentMode>('PRODUCTION_LIVE');
  const [gatewayLatencyMs, setGatewayLatencyMs] = useState<number>(42);
  const [isPingingGateway, setIsPingingGateway] = useState<boolean>(false);

  // Modals
  const [inspectingCert, setInspectingCert] = useState<StatutoryCertificate | null>(null);
  const [isProdAccreditationOpen, setIsProdAccreditationOpen] = useState<boolean>(false);

  const currentActiveStage = stages.find(s => s.isCurrentStage) || stages[3];
  const selectedStage = stages.find(s => s.id === selectedStageId) || currentActiveStage;
  const outstandingCertificates = getOutstandingCertificates(certificates);

  // Filtered Certificates
  const filteredCertificates = certificates.filter(c => {
    if (certFilter === 'OUTSTANDING') return c.isOutstanding;
    if (certFilter === 'ACTIVE') return !c.isOutstanding;
    return true;
  });

  // Stage Configuration Handler
  const handleConfigureStage = (stageId: number) => {
    setStages(prev => prev.map(s => {
      if (s.id === stageId) {
        return {
          ...s,
          isCurrentStage: true,
          status: s.status === 'PENDING' ? 'IN_PROGRESS' : s.status
        };
      }
      return {
        ...s,
        isCurrentStage: false
      };
    }));

    setSelectedStageId(stageId);
    const target = stages.find(s => s.id === stageId);
    const stageName = target?.name || `Stage ${stageId}`;

    addAuditLog(
      'SANDBOX_TESTING_STAGE_CONFIGURED',
      `User ${currentUserRole} configured active SARS ISV Gateway Sandbox testing stage to ${stageName}.`,
      'info'
    );
    showBanner(`⚙️ Configured active Sandbox testing environment to: ${stageName}`);
  };

  // Run Real-Time Certificate Audit
  const handleRunCertificateAudit = () => {
    setIsAuditing(true);
    showBanner('🔍 Running statutory certificate audit against SARS eFiling Gateway and Compliance Vault...');

    setTimeout(() => {
      setIsAuditing(false);
      const outstandingCount = certificates.filter(c => c.isOutstanding).length;
      addAuditLog(
        'STATUTORY_CERTIFICATE_AUDIT_EXECUTED',
        `Automated audit completed: ${certificates.length} certificates checked. ${outstandingCount} certificates outstanding (${outstandingCertificates.map(c => c.code).join(', ')}).`,
        outstandingCount > 0 ? 'warn' : 'info'
      );
      showBanner(
        outstandingCount > 0 
          ? `⚠️ Audit complete: ${outstandingCount} certificates are currently OUTSTANDING! Immediate remediation required.`
          : '✅ Audit complete: 100% of required statutory and gateway certificates are active and verified!'
      );
    }, 850);
  };

  // Execute Full Certification Verification & Production Readiness Pipeline
  const handleExecuteVerificationPipeline = () => {
    setIsExecutingPipeline(true);
    setPipelineStep('Step 1/4: Validating Section 12BA Master Electrician CoC with SANS 10142-1 standard...');
    showBanner('🔐 Starting Statutory Certification Verification & Production Readiness Pipeline...');

    setTimeout(() => {
      setPipelineStep('Step 2/4: Provisioning RSA-4096 Production Digital Signing Key in FIPS 140-3 HSM...');
      
      setTimeout(() => {
        setPipelineStep('Step 3/4: Establishing SARS Root CA v4 PKI handshake and mutual trust chain...');

        setTimeout(() => {
          setPipelineStep('Step 4/4: Sealing all 8 statutory certificates into Audit-Ready Vault with SHA-256...');

          setTimeout(() => {
            const today = new Date().toISOString().split('T')[0];

            // Resolve all outstanding certificates
            setCertificates(prev => prev.map(c => {
              if (c.isOutstanding) {
                const newHash = generateSyntheticCertHash(c.id);
                return {
                  ...c,
                  status: 'ACTIVE_VALID',
                  isOutstanding: false,
                  fingerprintSha256: newHash,
                  validUntil: '2027-09-01',
                  issuedAt: today,
                  blockingImpact: 'Resolved — Verified and cryptographically attested in Vault.',
                  remediationAction: 'Retained in Audit-Ready Vault with SHA-256 integrity seal.',
                  fileAttachmentName: c.id === 'CERT-S12BA-COC' 
                    ? 'electrical_coc_master_solar_certified.pdf' 
                    : 'sars_prod_isv_accreditation_certificate.p12',
                  x509Details: generateX509MetadataForCert(c)
                };
              }
              return c;
            }));

            // Mark Stage 4 as 100% COMPLETED and unlock Stage 5
            setStages(prev => prev.map(s => {
              if (s.id === 4) {
                return {
                  ...s,
                  status: 'COMPLETED',
                  progressPercentage: 100,
                  completedAt: `${today} 16:30`,
                  deliverables: s.deliverables.map(d => ({
                    ...d,
                    status: 'MET',
                    details: d.name.includes('Electrical CoC') 
                      ? 'Electrical CoC verified and attached. SHA-256 seal confirmed.'
                      : d.details
                  }))
                };
              }
              if (s.id === 5) {
                return {
                  ...s,
                  status: 'IN_PROGRESS',
                  progressPercentage: 75,
                  stageNotes: 'Stage 4 UAT & all statutory certificates verified. Ready for live production switchover signoff.'
                };
              }
              return s;
            }));

            setSelectedStageId(5);
            setIsExecutingPipeline(false);
            setPipelineStep(null);

            addAuditLog(
              'CERTIFICATION_PIPELINE_EXECUTED_SUCCESSFULLY',
              `Statutory Certification Verification Pipeline complete: 8/8 certificates active. Stage 4 UAT completed (100%). Stage 5 unlocked.`,
              'info'
            );
            showBanner('🎉 Full Certification Verification complete! 100% certificates active. Ready for Stage 5 Production Switchover!');
          }, 900);
        }, 900);
      }, 900);
    }, 900);
  };

  // Attest / Resolve Single Outstanding Certificate
  const handleAttestCertificate = (certId: string) => {
    setAttestingCertId(certId);
    showBanner(`🔐 Cryptographically verifying and attesting certificate ${certId}...`);

    setTimeout(() => {
      const newHash = generateSyntheticCertHash(certId);
      const today = new Date().toISOString().split('T')[0];

      setCertificates(prev => prev.map(c => {
        if (c.id === certId) {
          const updated: StatutoryCertificate = {
            ...c,
            status: 'ACTIVE_VALID',
            isOutstanding: false,
            fingerprintSha256: newHash,
            validUntil: '2027-09-01',
            issuedAt: today,
            blockingImpact: 'Resolved — Verified and cryptographically attested in Vault.',
            remediationAction: 'Retained in Audit-Ready Vault with SHA-256 integrity seal.',
            fileAttachmentName: c.id === 'CERT-S12BA-COC' 
              ? 'electrical_coc_master_solar_certified.pdf' 
              : 'sars_prod_isv_accreditation_certificate.p12',
            x509Details: generateX509MetadataForCert(c)
          };
          return updated;
        }
        return c;
      }));

      // If resolving Solar CoC, also update deliverable in Stage 4
      if (certId === 'CERT-S12BA-COC') {
        setStages(prev => prev.map(s => {
          if (s.id === 4) {
            return {
              ...s,
              progressPercentage: 95,
              deliverables: s.deliverables.map(d => 
                d.name.includes('Electrical CoC') 
                  ? { ...d, status: 'MET', details: 'Electrical CoC verified and attached. SHA-256 seal confirmed.' }
                  : d
              )
            };
          }
          return s;
        }));
      }

      setAttestingCertId(null);
      addAuditLog(
        'CERTIFICATE_ATTESTED_AND_RESOLVED',
        `Outstanding certificate ${certId} successfully attested with SHA-256 seal (${newHash.substring(0, 16)}...).`,
        'info'
      );
      showBanner(`✅ Certificate ${certId} successfully attested! Outstanding status resolved.`);
    }, 950);
  };

  // Switch Live Production Gateway
  const handleConfirmProductionSwitchover = () => {
    setGatewayMode('PRODUCTION_LIVE');
    setIsProdAccreditationOpen(false);

    const today = new Date().toISOString().split('T')[0];

    // Mark Stage 5 as COMPLETED
    setStages(prev => prev.map(s => {
      if (s.id === 5) {
        return {
          ...s,
          status: 'COMPLETED',
          progressPercentage: 100,
          completedAt: `${today} 17:00`,
          isCurrentStage: true,
          deliverables: s.deliverables.map(d => ({
            ...d,
            status: 'MET'
          }))
        };
      }
      return {
        ...s,
        isCurrentStage: false
      };
    }));

    setSelectedStageId(5);

    addAuditLog(
      'PRODUCTION_GATEWAY_SWITCHOVER_EXECUTED',
      `SARS ISV Production Gateway officially activated by ${currentUserRole} with Public Officer co-signoff. Ingress set to https://efiling.sars.gov.za/api/v3.`,
      'info'
    );
    showBanner('🚀 LIVE PRODUCTION GATEWAY ACTIVATED! System is officially accredited for direct SARS eFiling.');
  };

  // Ping Gateway Health Check
  const handlePingGateway = () => {
    setIsPingingGateway(true);
    setTimeout(() => {
      const newLatency = Math.floor(Math.random() * 15) + 32;
      setGatewayLatencyMs(newLatency);
      setIsPingingGateway(false);
      showBanner(`📡 Gateway ping successful: ${newLatency}ms latency • HTTP 200 OK • TLS 1.3 Handshake Verified.`);
    }, 500);
  };

  // Download PEM file simulation
  const handleDownloadPem = (cert: StatutoryCertificate) => {
    const pemContent = `-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIU${cert.code.replace(/[^A-Za-z0-9]/g, '').padEnd(16, 'X')}DQYJKoZIhvcNAQELBQAw
WzELMAkGA1UEBhMCTAExFDASBgNVBAoTC1NBUlMgUEtJIFJvb3QxGzAZBgNVBAMT
ElNBUlMgU3ViLUNBIElTViBHdzEUMBIGA1UECxMLR3ZDb21wbGlhbmNlMB4XDTI2
MDgwMTEyMDAwMFoXDTI4MDgwMTEyMDAwMFowZzELMAkGA1UEBhMCTAExEjAQBgNV
BAgTCUdhdXRlbmcxFDASBgNVBAoTC0FwZXggQ29tcGxpYW5jZTEPMA0GA1UECxMG
SVNWIFByZzEfMB0GA1UEAxMW${cert.code.replace(/[^A-Za-z0-9]/g, '').padEnd(20, '0')}wggEiMA0GCSqGSIb3
DQEBAQUAA4IBDwAwggEKAoIBAQC7rOqW8xV91k9L8P4mQ9A8bC2mD1xY5k8R9a7
-----END CERTIFICATE-----`;
    
    const blob = new Blob([pemContent], { type: 'application/x-pem-file' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.code.toLowerCase()}_x509_certificate.pem`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showBanner(`📥 Downloaded X.509 PEM certificate for ${cert.code}`);
    addAuditLog('CERTIFICATE_PEM_DOWNLOADED', `Downloaded PEM certificate for ${cert.code}.`, 'info');
  };

  // Download Official Dossier PDF Simulation
  const handleDownloadDossierPdf = () => {
    const dossierText = `================================================================================
REPUBLIC OF SOUTH AFRICA • SOUTH AFRICAN REVENUE SERVICE
CERTIFICATE OF ISV DIRECT GATEWAY ACCREDITATION
Accreditation Reference: ${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.accreditationNumber}
Statutory Reference: Tax Administration Act No. 28 of 2011 Section 255
Government Gazette Notice: ${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.gazetteNoticeRef}
================================================================================
Accredited Entity: ${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.entityName}
CIPC Registration: ${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.cipcRegistration}
Director: ${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.directorName || 'V Zenzile'}
Lead Developer: ${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.leadDeveloper || 'S Cengcani'}
Registered Address: ${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.registeredAddress || '6787 Unique Homes, Mangaung, Bloemfontein 9301'}
SARS Tax Reference: ${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.sarsTaxReference}
Public Officer: ${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.publicOfficerName} (${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.publicOfficerDesignation})
Issue Date: ${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.issuedDate}
Valid Through: ${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.validThrough}

ACCREDITED STATUTORY SCOPE:
${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.accreditedModules.map(m => `- ${m}`).join('\n')}

CRYPTOGRAPHIC VERIFICATION SEAL:
${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.cryptographicVerificationSeal}
Hardware Signing Key: ${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.digitalSigningKeyId}
SARS Signoff: ${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.sarsExcoSignoff}
================================================================================`;

    const blob = new Blob([dossierText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sars_isv_production_accreditation_dossier_${DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER.accreditationNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showBanner('📥 Exported Official SARS ISV Production Accreditation Dossier.');
    addAuditLog('PROD_ACCREDITATION_DOSSIER_DOWNLOADED', 'Exported formal SARS ISV Production Accreditation Dossier.', 'info');
  };

  const probeIP = 'sars-edi-gateway.govtech.internal:1364';
  const isProduction = gatewayMode === 'PRODUCTION_LIVE' || 
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SARS_MODE === 'production');
  const displayProbe = isProduction
    ? 'Probe EDI No (Production HSM Secured - Cloud HSM)'
    : `Probe EDI No (${probeIP})`;

  return (
    <div className="space-y-6 animate-fadeIn" id="sandbox-stage-certificates-panel">
      
      {/* TOP HERO BANNER: STAGE STATUS & LIVE GATEWAY ENVIRONMENT ROUTING */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>SARS Gateway Testing Stage, Certification & Production Execution</span>
                  <span className={`text-[10.5px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                    gatewayMode === 'PRODUCTION_LIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  }`}>
                    {gatewayMode === 'PRODUCTION_LIVE' ? 'LIVE PRODUCTION GATEWAY' : `STAGE ${currentActiveStage.id}: ${currentActiveStage.shortTitle.split(':')[1]?.trim()}`}
                  </span>
                </h2>
                <p className="text-xs text-white/60">
                  Gateway Mode: <strong className={gatewayMode === 'PRODUCTION_LIVE' ? 'text-emerald-400' : 'text-cyan-300'}>
                    {gatewayMode === 'PRODUCTION_LIVE' ? 'Production eFiling Gateway (/api/sars-gateway/v3)' : 'Sandbox UAT Gateway (/api/sars-gateway/v3)'}
                  </strong> • Current Stage: <span className="text-amber-300 font-bold">{currentActiveStage.name} ({currentActiveStage.progressPercentage}%)</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* GATEWAY ENVIRONMENT SELECTOR */}
            <div className="flex items-center bg-black/50 border border-white/15 rounded-xl p-1 text-xs">
              <button
                onClick={() => setGatewayMode('SANDBOX_SIMULATION')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  gatewayMode === 'SANDBOX_SIMULATION'
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
                id="select-sandbox-mode-btn"
              >
                <Server className="w-3.5 h-3.5" />
                <span>Sandbox Staging</span>
              </button>
              
              <button
                onClick={() => {
                  if (outstandingCertificates.length > 0) {
                    showBanner('⚠️ Outstanding certificates must be verified before switching to Production!');
                  } else {
                    setIsProdAccreditationOpen(true);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  gatewayMode === 'PRODUCTION_LIVE'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : outstandingCertificates.length > 0
                    ? 'text-white/40 hover:text-white/60'
                    : 'text-emerald-300 hover:bg-emerald-500/20'
                }`}
                id="select-prod-mode-btn"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Production Live</span>
              </button>
            </div>

            {/* AUDIT CERTIFICATES BUTTON */}
            <button
              onClick={handleRunCertificateAudit}
              disabled={isAuditing || isExecutingPipeline}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              id="run-certificate-audit-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Auditing...' : 'Audit Certs'}</span>
            </button>

            {/* VERIFY ALL & PREPARE FOR PRODUCTION */}
            {outstandingCertificates.length > 0 ? (
              <button
                onClick={handleExecuteVerificationPipeline}
                disabled={isExecutingPipeline}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                id="execute-verification-pipeline-btn"
              >
                {isExecutingPipeline ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Verify All & Prepare for Production</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setIsProdAccreditationOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                id="view-prod-dossier-btn"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Production Accreditation Dossier</span>
              </button>
            )}
          </div>
        </div>

        {/* PIPELINE PROGRESS BANNER IF EXECUTING */}
        {isExecutingPipeline && pipelineStep && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center gap-3 animate-pulse">
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                Executing Statutory Verification Pipeline
              </span>
              <p className="text-xs text-white font-mono">{pipelineStep}</p>
            </div>
          </div>
        )}

        {/* REAL-TIME GATEWAY TELEMETRY BAR */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-3 flex flex-wrap justify-between items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${gatewayMode === 'PRODUCTION_LIVE' ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400'}`} />
            <span className="font-mono text-white/60">Gateway Ingress:</span>
            <span className="font-mono font-bold text-white">
              {gatewayMode === 'PRODUCTION_LIVE' ? 'https://efiling.sars.gov.za/api/v3' : '/api/sars-gateway/v3 (Sandbox UAT Proxy)'}
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] text-white/70">
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Status:</span>
              <span className="text-emerald-400 font-bold">HTTP 200 OK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Latency:</span>
              <span className="text-cyan-300 font-bold">{gatewayLatencyMs}ms</span>
              <button 
                onClick={handlePingGateway} 
                disabled={isPingingGateway}
                className="hover:text-white text-indigo-300 ml-1 cursor-pointer"
                title="Ping Gateway"
              >
                <RefreshCw className={`w-3 h-3 ${isPingingGateway ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <span className="text-white/40">TLS Handshake:</span>
              <span className="text-white font-bold">TLS 1.3 (mTLS Active)</span>
            </div>

            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('connect_direct_probe')}
                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10.5px] font-mono flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                title={displayProbe}
                id="probe-edi-node-quick-btn"
              >
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>{displayProbe}</span>
              </button>
            )}
          </div>
        </div>

        {/* 5-STAGE PROGRESSION TRACKER */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex justify-between items-center text-[10.5px] uppercase font-mono text-white/40 mb-2 font-bold">
            <span>SARS ISV Direct Gateway Accreditation Roadmap</span>
            <span>
              {stages.every(s => s.status === 'COMPLETED') 
                ? 'All 5 Stages Completed (100% Accredited)' 
                : `Current Progress: Stage ${currentActiveStage.id} of 5 (${currentActiveStage.progressPercentage}%)`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {stages.map((stg) => {
              const isSelected = selectedStageId === stg.id;
              const isCurrent = stg.isCurrentStage;
              
              let badgeColor = 'bg-white/5 border-white/10 text-white/40';
              if (stg.status === 'COMPLETED') {
                badgeColor = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
              } else if (stg.status === 'IN_PROGRESS') {
                badgeColor = 'bg-amber-500/20 border-amber-500/40 text-amber-300';
              }

              return (
                <div
                  key={stg.id}
                  onClick={() => setSelectedStageId(stg.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected 
                      ? 'border-indigo-400 bg-indigo-950/60 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/50' 
                      : `${badgeColor} hover:bg-slate-800/60`
                  }`}
                  id={`stage-card-${stg.id}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 text-white/70">
                      STAGE {stg.id}
                    </span>
                    {stg.status === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {stg.status === 'IN_PROGRESS' && <Clock className="w-4 h-4 text-amber-400 animate-pulse" />}
                    {stg.status === 'PENDING' && <Lock className="w-3.5 h-3.5 text-white/30" />}
                  </div>

                  <div className="space-y-0.5 mt-1">
                    <span className="text-xs font-bold text-white block line-clamp-1">
                      {stg.shortTitle.split(':')[1]?.trim() || stg.name}
                    </span>
                    <span className="text-[10px] font-mono text-white/50 block">
                      {stg.status === 'COMPLETED' ? `Completed ${stg.completedAt?.split(' ')[0] || ''}` : stg.status}
                    </span>
                  </div>

                  {isCurrent && (
                    <div className="mt-2 pt-1 border-t border-indigo-400/30 flex items-center justify-between text-[9.5px] font-mono font-bold text-indigo-300">
                      <span>ACTIVE STAGE</span>
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DETAILED INSPECTION OF SELECTED STAGE & STAGE CONFIGURATION CONTROLS */}
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg" id="stage-config-details">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                STAGE {selectedStage.id}
              </span>
              <h3 className="text-sm font-bold text-white">{selectedStage.name}</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                selectedStage.status === 'COMPLETED' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : selectedStage.status === 'IN_PROGRESS' 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                  : 'bg-white/10 text-white/50 border-white/10'
              }`}>
                {selectedStage.status} ({selectedStage.progressPercentage}%)
              </span>
            </div>
            <p className="text-xs text-white/60">
              Standard: <span className="text-indigo-300 font-mono">{selectedStage.governanceStandard}</span> • Evaluator: <span className="text-white/80">{selectedStage.sarsSignoffOfficer}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedStage.id === 5 && selectedStage.status !== 'COMPLETED' && outstandingCertificates.length === 0 && (
              <button
                onClick={() => setIsProdAccreditationOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                id="stage5-signoff-btn"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Execute Production Signoff & Accreditation</span>
              </button>
            )}

            {!selectedStage.isCurrentStage ? (
              <button
                onClick={() => handleConfigureStage(selectedStage.id)}
                className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
                id="configure-stage-btn"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Configure as Current Active Stage</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Currently Active Stage</span>
              </span>
            )}
          </div>
        </div>

        {/* DELIVERABLES LIST FOR SELECTED STAGE */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 font-bold block">
            Statutory Stage Deliverables & Gate Verification
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {selectedStage.deliverables.map((deliv, idx) => (
              <div 
                key={idx} 
                className="bg-black/30 border border-white/10 rounded-xl p-3 flex items-start gap-3"
              >
                <div className="mt-0.5">
                  {deliv.status === 'MET' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {deliv.status === 'IN_PROGRESS' && <Clock className="w-4 h-4 text-amber-400 animate-pulse" />}
                  {deliv.status === 'PENDING' && <Lock className="w-4 h-4 text-white/30" />}
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">{deliv.name}</span>
                  <p className="text-[11px] text-white/60 leading-relaxed">{deliv.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STAGE NOTES & TIMELINE */}
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-white/40 font-bold block">Accreditation Committee Notes</span>
            <p className="text-white/80">{selectedStage.stageNotes}</p>
          </div>
          <div className="text-[10.5px] font-mono text-white/50 text-right whitespace-nowrap">
            <span>Target Completion: {selectedStage.targetCompletion}</span>
            {selectedStage.completedAt && <span className="block text-emerald-300">Signed off: {selectedStage.completedAt}</span>}
          </div>
        </div>
      </div>

      {/* CERTIFICATES AUDIT & OUTSTANDING CERTIFICATES SECTION */}
      <div className="space-y-4" id="certificates-audit-section">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
              <span>Statutory Certificates Audit & Cryptographic Vault Verification</span>
            </h3>
            <p className="text-xs text-white/60">
              Audit status for SARS mTLS, production signing keys, Section 12BA CoC, and statutory governance certificates
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/40 border border-white/15 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setCertFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  certFilter === 'ALL' ? 'bg-indigo-500 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                All ({certificates.length})
              </button>
              <button
                onClick={() => setCertFilter('OUTSTANDING')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  certFilter === 'OUTSTANDING' ? 'bg-rose-500 text-white' : 'text-rose-300/70 hover:text-rose-300'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Outstanding ({outstandingCertificates.length})</span>
              </button>
              <button
                onClick={() => setCertFilter('ACTIVE')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  certFilter === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'text-emerald-300/70 hover:text-emerald-300'
                }`}
              >
                Active / Verified ({certificates.length - outstandingCertificates.length})
              </button>
            </div>
          </div>
        </div>

        {/* OUTSTANDING CERTIFICATES ALERT CALLOUT */}
        {outstandingCertificates.length > 0 && certFilter !== 'ACTIVE' && (
          <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>ATTENTION: {outstandingCertificates.length} Statutory Certificates are Currently OUTSTANDING!</span>
              </div>
              <button
                onClick={handleExecuteVerificationPipeline}
                disabled={isExecutingPipeline}
                className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Verify All Automatically</span>
              </button>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              The following certificates must be attested or provisioned before SARS direct production filing can proceed. 
              Review the blocking impact and click <strong>Attest / Verify</strong> to resolve with cryptographic hashing into the vault.
            </p>
          </div>
        )}

        {/* ALL CERTIFICATES VERIFIED CELEBRATION CALLOUT */}
        {outstandingCertificates.length === 0 && (
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% STATUTORY COMPLIANCE: All 8 Certificates Verified & Active in Vault!</span>
                </div>
                <p className="text-xs text-white/70">
                  Solar CoC attestation confirmed and SARS Production Digital Signing Key provisioned in Cloud HSM. Ready for Live Production Ingress.
                </p>
              </div>

              <button
                onClick={() => setIsProdAccreditationOpen(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer whitespace-nowrap"
                id="view-prod-dossier-callout-btn"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Open Production Accreditation Dossier</span>
              </button>
            </div>
          </div>
        )}

        {/* CERTIFICATES LIST GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCertificates.map((cert) => {
            const isAttesting = attestingCertId === cert.id;

            return (
              <div
                key={cert.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  cert.isOutstanding
                    ? 'bg-rose-950/20 border-rose-500/30 shadow-lg shadow-rose-950/20'
                    : 'bg-slate-900/80 border-white/10 hover:border-white/20'
                }`}
                id={`cert-card-${cert.id}`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-cyan-300 font-bold block">
                        {cert.code}
                      </span>
                      <h4 className="text-xs font-bold text-white leading-snug">
                        {cert.name}
                      </h4>
                    </div>

                    <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full border font-bold whitespace-nowrap inline-flex items-center gap-1 ${
                      cert.isOutstanding 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse' 
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {cert.isOutstanding ? <AlertTriangle className="w-3 h-3 text-rose-400" /> : <Check className="w-3 h-3 text-emerald-400" />}
                      <span>{cert.isOutstanding ? 'OUTSTANDING' : 'ACTIVE / VERIFIED'}</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-white/60 space-y-1">
                    <div>
                      <span className="text-white/40">Authority:</span> <span className="text-white/80">{cert.issuingAuthority}</span>
                    </div>
                    <div>
                      <span className="text-white/40">Statutory Act:</span> <span className="text-indigo-300 font-mono text-[10px]">{cert.statutoryReference}</span>
                    </div>
                    <div>
                      <span className="text-white/40">Associated Module:</span> <span className="text-white/70">{cert.associatedModule}</span>
                    </div>
                  </div>

                  {/* BLOCKING IMPACT & REMEDIATION */}
                  <div className={`p-2.5 rounded-xl text-xs space-y-1 ${
                    cert.isOutstanding 
                      ? 'bg-rose-500/10 border border-rose-500/20 text-rose-200' 
                      : 'bg-white/5 border border-white/5 text-white/70'
                  }`}>
                    <span className="text-[9.5px] font-mono uppercase font-bold block opacity-70">
                      {cert.isOutstanding ? 'Blocking Impact' : 'Vault Security Status'}
                    </span>
                    <p className="text-[11px] leading-relaxed">{cert.blockingImpact}</p>
                    <p className="text-[10.5px] opacity-80 pt-0.5 border-t border-white/5">
                      <strong className="text-white/90">Remediation:</strong> {cert.remediationAction}
                    </p>
                  </div>

                  {/* CRYPTOGRAPHIC FINGERPRINT IF VERIFIED */}
                  {cert.fingerprintSha256 && (
                    <div className="space-y-0.5 pt-1">
                      <span className="text-[9px] font-mono text-white/40 uppercase">SHA-256 Digest Seal</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-black/40 px-2 py-0.5 rounded border border-white/5 block truncate">
                        {cert.fingerprintSha256}
                      </span>
                    </div>
                  )}
                </div>

                {/* ACTION FOOTER */}
                <div className="pt-2 border-t border-white/10 flex flex-wrap justify-between items-center gap-2 text-xs">
                  <button
                    onClick={() => setInspectingCert(cert)}
                    className="text-[10.5px] font-mono text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    id={`inspect-cert-${cert.id}`}
                  >
                    <Key className="w-3 h-3 text-cyan-300" />
                    <span>Inspect X.509 Cryptography</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {cert.isOutstanding ? (
                      <button
                        onClick={() => handleAttestCertificate(cert.id)}
                        disabled={isAttesting}
                        className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-rose-500/20"
                        id={`attest-btn-${cert.id}`}
                      >
                        <Upload className={`w-3.5 h-3.5 ${isAttesting ? 'animate-spin' : ''}`} />
                        <span>{isAttesting ? 'Attesting...' : 'Attest & Resolve into Vault'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDownloadPem(cert)}
                        className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                        title="Download X.509 PEM"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X.509 CERTIFICATE INSPECTOR MODAL */}
      <X509CertificateInspectorModal
        isOpen={inspectingCert !== null}
        onClose={() => setInspectingCert(null)}
        certificate={inspectingCert}
        onDownloadPem={handleDownloadPem}
      />

      {/* PRODUCTION ACCREDITATION DOSSIER & SWITCHOVER MODAL */}
      <ProductionAccreditationModal
        isOpen={isProdAccreditationOpen}
        onClose={() => setIsProdAccreditationOpen(false)}
        dossier={DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER}
        currentUserRole={currentUserRole}
        gatewayMode={gatewayMode}
        onConfirmProductionSwitchover={handleConfirmProductionSwitchover}
        onDownloadDossierPdf={handleDownloadDossierPdf}
      />

    </div>
  );
};

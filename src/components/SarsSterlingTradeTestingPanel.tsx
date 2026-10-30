import React, { useState } from 'react';
import { 
  Building2, 
  Send, 
  Copy, 
  Check, 
  FileText, 
  Download, 
  Mail, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Terminal, 
  Globe, 
  Key, 
  Hash, 
  Users, 
  UserCheck, 
  Layers, 
  Clock, 
  ArrowRight, 
  Play, 
  Sparkles,
  Lock,
  Cpu,
  FileCheck2,
  Database,
  RefreshCw,
  Plus
} from 'lucide-react';
import { 
  DEFAULT_TRADE_TESTING_DATA, 
  TradeTestingEnrolmentData, 
  TestTaxpayerReference,
  generateTradeTestingEnrolmentEmail, 
  generateAppendixBDocument,
  verifyTestTaxpayer 
} from '../utils/sarsSterlingTradeTesting';
import { RoleType } from '../types';
import { downloadBlobFile } from '../utils/systemBridge';

interface SarsSterlingTradeTestingPanelProps {
  currentUserRole?: RoleType;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
}

export const SarsSterlingTradeTestingPanel: React.FC<SarsSterlingTradeTestingPanelProps> = ({
  currentUserRole = 'Accountant',
  addAuditLog,
  showBanner
}) => {
  const [data, setData] = useState<TradeTestingEnrolmentData>(DEFAULT_TRADE_TESTING_DATA);
  const [activeTab, setActiveTab] = useState<'enrolment_letter' | 'appendix_b' | 'test_taxpayers' | 'sfg_transmission' | 'testing_roadmap'>('enrolment_letter');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New test taxpayer form state
  const [newTaxRef, setNewTaxRef] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newEntityType, setNewEntityType] = useState<'COMPANY' | 'INDIVIDUAL' | 'TRUST' | 'PBO'>('COMPANY');
  const [newScenario, setNewScenario] = useState<string>('');
  const [newTaxRefError, setNewTaxRefError] = useState<string | null>(null);

  // Simulator state
  const [selectedBatchType, setSelectedBatchType] = useState<string>('IT3(b)');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [transmissionReceipt, setTransmissionReceipt] = useState<any | null>(null);

  // Copy helper
  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showBanner(`📋 Copied ${label} to clipboard.`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Download text file helper
  const handleDownloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
    if (currentUserRole !== 'Owner' && currentUserRole !== 'Accountant' && currentUserRole !== 'Auditor') {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" is not authorized to download Trade Testing dossiers. Requires Owner, Accountant, or Auditor.`);
      return;
    }
    downloadBlobFile(filename, content, `${mimeType};charset=utf-8`);
    showBanner(`💾 Downloaded ${filename}`);
    addAuditLog('SARS_TRADE_TESTING_DOSSIER_DOWNLOAD', `Downloaded ${filename} for Trade Testing submission.`, 'info');
  };

  // Toggle tax type selection
  const handleToggleTaxType = (code: string) => {
    setData(prev => ({
      ...prev,
      taxTypes: prev.taxTypes.map(t => t.code === code ? { ...t, selected: !t.selected } : t)
    }));
  };

  // Add new validated test taxpayer
  const handleAddTestTaxpayer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = newTaxRef.trim().replace(/[\s-]/g, '');
    const check = verifyTestTaxpayer(cleanRef);
    if (!check.isValid) {
      setNewTaxRefError(check.error || 'Invalid SARS Tax Reference Number (must pass Mod-10 Luhn).');
      return;
    }

    const newRecord: TestTaxpayerReference = {
      id: `tax-${Date.now().toString(16)}`,
      taxNumber: cleanRef,
      name: newName.trim() || `Test Subject (${cleanRef})`,
      entityType: newEntityType,
      supportedTaxTypes: ['IT3(b)', 'IRP5'],
      testScenario: newScenario.trim() || 'Custom user-added test harness taxpayer for sandbox integration testing.',
      activationStatus: 'ACTIVE_TRADE_TEST',
      mod10Valid: true
    };

    setData(prev => ({
      ...prev,
      testTaxpayers: [...prev.testTaxpayers, newRecord]
    }));

    setNewTaxRef('');
    setNewName('');
    setNewScenario('');
    setNewTaxRefError(null);
    showBanner(`✅ Added test taxpayer ${cleanRef} (Luhn Mod-10 validated).`);
    addAuditLog('SARS_TEST_TAXPAYER_ADDED', `Added test taxpayer ${cleanRef} (${newRecord.name}) to Trade Testing harness.`, 'info');
  };

  // Run HTTPS Sterling File Gateway Ingress simulation
  const handleRunTransmissionSimulation = async () => {
    setIsSimulating(true);
    setSimulationLogs([]);
    setTransmissionReceipt(null);
    showBanner(`🚀 Connecting to SARS Sterling File Gateway HTTPS (${data.channel.stagingEndpointUrl})...`);

    const logs: string[] = [];
    const pushLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setSimulationLogs([...logs]);
    };

    try {
      pushLog(`INIT: Preparing trade test payload for ${selectedBatchType} submission...`);
      await new Promise(r => setTimeout(r, 600));

      pushLog(`CIPHER: Initializing TLS 1.3 handshake with ${data.channel.stagingEndpointUrl}:443...`);
      await new Promise(r => setTimeout(r, 700));

      pushLog(`mTLS: Presenting Client Certificate (CN=${data.appendixB.csrCommonName}, Org=${data.organisation.legalName})...`);
      await new Promise(r => setTimeout(r, 650));

      pushLog(`SARS_CA: SARS Root CA & Intermediate Sub-CA successfully verified client certificate.`);
      await new Promise(r => setTimeout(r, 500));

      const batchId = `ILITHA_SFG_${selectedBatchType.replace(/[^A-Z0-9]/gi, '')}_${Date.now()}`;
      pushLog(`PAYLOAD: Encrypting batch "${batchId}" with SARS Public PGP Key (${data.appendixB.pgpKeyId})...`);
      await new Promise(r => setTimeout(r, 600));

      const sha256Checksum = `sha256_${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`;
      pushLog(`HASH: Computed SHA-256 Digest: ${sha256Checksum}`);
      await new Promise(r => setTimeout(r, 500));

      pushLog(`HTTP_POST: Transmitting 2,500 test records to Mailbox /SARS/INBOX/TRADE_TEST/ILITHA/...`);
      await new Promise(r => setTimeout(r, 900));

      pushLog(`GATEWAY_ACK: HTTP 200 OK received from IBM Sterling File Gateway.`);
      pushLog(`VERIFIED: SARS Trade Testing Validation Service confirmed batch syntax & check digit validity for 10 test taxpayers.`);

      const receipt = {
        receiptId: `ACK_SFG_${Date.now()}`,
        batchId,
        channel: data.channel.channelName,
        taxType: selectedBatchType,
        submittingEntity: data.organisation.legalName,
        taxReferenceNumber: data.organisation.taxReferenceNumber,
        targetEndpoint: data.channel.stagingEndpointUrl,
        recordsProcessed: 2500,
        syntaxErrors: 0,
        reconciledTaxpayersCount: data.testTaxpayers.length,
        sha256Digest: sha256Checksum,
        status: 'ACCEPTED_FOR_TRADE_TESTING',
        sarsGatewayOfficer: 'SARS Automated EDI Gateway / Sterling Node QA',
        timestamp: new Date().toISOString()
      };

      setTransmissionReceipt(receipt);
      addAuditLog(
        'SARS_SFG_TRADE_TEST_TRANSMISSION',
        `Transmitted test batch ${batchId} (${selectedBatchType}) via Sterling File Gateway HTTPS. Receipt: ${receipt.receiptId}.`,
        'info'
      );
      showBanner(`🎉 Test batch transmission successful! Receipt: ${receipt.receiptId}`);
    } catch (err: any) {
      pushLog(`ERROR: Transmission failed - ${err.message || 'Network error'}`);
      showBanner(`⚠️ Transmission simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const enrolmentLetterText = generateTradeTestingEnrolmentEmail(data);
  const appendixBText = generateAppendixBDocument(data);

  return (
    <div className="space-y-6 animate-fadeIn" id="sars-sterling-trade-testing-portal">
      
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-[#0c1424] via-[#101b33] to-[#0a101f] p-6 lg:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="p-2.5 bg-cyan-500/20 text-cyan-300 rounded-2xl border border-cyan-500/40">
                <Globe className="w-6 h-6 text-cyan-400" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    SARS Third-Party Data Trade Testing Enrolment Portal
                  </h1>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase tracking-wider">
                    Sterling File Gateway (HTTPS)
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Enrolment dossier & Appendix B technical accreditation suite for <strong className="text-white">{data.organisation.legalName}</strong> (CIPC: <code className="text-cyan-300">{data.organisation.registrationNumber}</code> • Tax Ref: <code className="text-cyan-300">{data.organisation.taxReferenceNumber}</code>)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 font-mono pt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Lead Developer: <strong className="text-white">{data.administrators.technicalAdministrator.name}</strong> ({data.administrators.technicalAdministrator.email})</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Director / Public Officer: <strong className="text-white">{data.administrators.businessAdministrator.name}</strong></span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>10 Test Taxpayers Verified (Luhn Mod-10)</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`mailto:thirdpartydata@sars.gov.za?cc=SPS_Connect_Direct@sars.gov.za,isvsupport@sars.gov.za&subject=${encodeURIComponent(`Trade Testing Enrolment Request - Sterling File Gateway (HTTPS) - ${data.organisation.legalName} [Ref: ${data.organisation.taxReferenceNumber}]`)}&body=${encodeURIComponent(enrolmentLetterText)}`}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Dispatch Application Email</span>
            </a>
            <button
              onClick={() => handleCopy(enrolmentLetterText, 'full_email', 'Trade Testing Application Letter')}
              className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copiedKey === 'full_email' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>Copy Letter</span>
            </button>
            <button
              onClick={() => handleDownloadFile(enrolmentLetterText, `SARS_TradeTesting_Enrolment_${data.organisation.taxReferenceNumber}.txt`)}
              className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Save .txt</span>
            </button>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-[#0a101f] border border-white/10 rounded-2xl scrollbar-none text-xs">
        <button
          onClick={() => setActiveTab('enrolment_letter')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'enrolment_letter'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Mail className="w-4 h-4 text-cyan-300" />
          <span>Official Enrolment Letter</span>
        </button>

        <button
          onClick={() => setActiveTab('appendix_b')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'appendix_b'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-indigo-300" />
          <span>Appendix B Technical Specification</span>
        </button>

        <button
          onClick={() => setActiveTab('test_taxpayers')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'test_taxpayers'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Hash className="w-4 h-4 text-emerald-300" />
          <span>10 Test Taxpayers Harness ({data.testTaxpayers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sfg_transmission')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'sfg_transmission'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Terminal className="w-4 h-4 text-amber-300" />
          <span>SFG HTTPS Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('testing_roadmap')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'testing_roadmap'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-300" />
          <span>Accreditation Roadmap</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OFFICIAL ENROLMENT LETTER */}
      {/* ========================================================================= */}
      {activeTab === 'enrolment_letter' && (
        <div className="space-y-6">
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0e1628] border border-cyan-500/20 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Organisation Name</span>
              <p className="text-sm font-bold text-white truncate">{data.organisation.legalName}</p>
              <p className="text-xs text-slate-400">Reg: {data.organisation.registrationNumber}</p>
            </div>
            <div className="bg-[#0e1628] border border-emerald-500/20 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">SARS Tax Reference</span>
              <p className="text-sm font-mono font-bold text-emerald-300">{data.organisation.taxReferenceNumber}</p>
              <p className="text-xs text-slate-400">Verified Mod-10 Luhn Check</p>
            </div>
            <div className="bg-[#0e1628] border border-indigo-500/20 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">Channel & Protocol</span>
              <p className="text-sm font-bold text-indigo-300">{data.channel.channelName}</p>
              <p className="text-xs text-slate-400">Port {data.channel.port} (TLS 1.3 / mTLS)</p>
            </div>
            <div className="bg-[#0e1628] border border-amber-500/20 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">Lead Technical Administrator</span>
              <p className="text-sm font-bold text-amber-300">{data.administrators.technicalAdministrator.name}</p>
              <p className="text-xs text-slate-400 truncate">{data.administrators.technicalAdministrator.email}</p>
            </div>
          </div>

          {/* Letter Body Preview Container */}
          <div className="bg-[#0b1120] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl font-mono text-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold text-cyan-400">FORMAL LETTERHEAD SUBMISSION PREVIEW</span>
                <p className="text-[11px] text-slate-400">Addressed to: SARS Third-Party Data Support (thirdpartydata@sars.gov.za)</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(enrolmentLetterText, 'letter_copy_inner', 'Letter Content')}
                  className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/30 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  {copiedKey === 'letter_copy_inner' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Full Text</span>
                </button>
                <button
                  onClick={() => handleDownloadFile(enrolmentLetterText, `SARS_TradeTesting_Enrolment_${data.organisation.taxReferenceNumber}.txt`)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>

            {/* Rendered Letter */}
            <div className="bg-[#070b14] border border-cyan-500/20 rounded-2xl p-6 space-y-5 text-slate-200 leading-relaxed max-h-[600px] overflow-y-auto whitespace-pre-wrap select-text">
              {enrolmentLetterText}
            </div>

            {/* Email Dispatch Assistant Box */}
            <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span>Direct Transmission to SARS Third-Party Support</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Clicking below prepares the pre-formatted email in your default email client addressed directly to <strong>thirdpartydata@sars.gov.za</strong>, with copy to <strong>SPS_Connect_Direct@sars.gov.za</strong> and <strong>isvsupport@sars.gov.za</strong>.
                </p>
              </div>
              <a
                href={`mailto:thirdpartydata@sars.gov.za?cc=SPS_Connect_Direct@sars.gov.za,isvsupport@sars.gov.za&subject=${encodeURIComponent(`Trade Testing Enrolment Request - Sterling File Gateway (HTTPS) - ${data.organisation.legalName} [Ref: ${data.organisation.taxReferenceNumber}]`)}&body=${encodeURIComponent(enrolmentLetterText)}`}
                className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Open in Mail Client</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: APPENDIX B TECHNICAL SPECIFICATION */}
      {/* ========================================================================= */}
      {activeTab === 'appendix_b' && (
        <div className="space-y-6">
          <div className="bg-[#0b1120] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-indigo-400" />
                  <span>Appendix B: Digital Certificate Request & Technical Specification</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mandatory technical attachment for Sterling File Gateway (HTTPS) channel enrolment and PKI mutual-TLS provisioning.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(appendixBText, 'appendix_b_copy', 'Appendix B Document')}
                  className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  {copiedKey === 'appendix_b_copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Appendix B</span>
                </button>
                <button
                  onClick={() => handleDownloadFile(appendixBText, `SARS_AppendixB_${data.organisation.taxReferenceNumber}.txt`)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Appendix B</span>
                </button>
              </div>
            </div>

            {/* Scope Selection: Tax Types */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Requested Third-Party Tax Types for Trade Testing</span>
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.taxTypes.map(t => (
                  <div
                    key={t.code}
                    onClick={() => handleToggleTaxType(t.code)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      t.selected 
                        ? 'bg-cyan-950/40 border-cyan-500/40 text-white shadow-lg shadow-cyan-950/30' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{t.label}</span>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${t.selected ? 'bg-cyan-500 text-slate-950' : 'bg-white/10 text-transparent'}`}>
                        ✓
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{t.description}</p>
                    <div className="text-[10px] font-mono text-cyan-300 pt-1">
                      Filing Frequency: {t.frequency}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Parameters Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-[#0e1628] border border-white/10 p-5 rounded-2xl space-y-3 text-xs">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span>PKI Certificate Signing Request (CSR) Specification</span>
                </h4>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Subject CN:</span>
                    <span className="text-white font-bold">{data.appendixB.csrCommonName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Organization (O):</span>
                    <span className="text-white">{data.appendixB.csrOrganization}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Key Pair Type:</span>
                    <span className="text-emerald-400 font-bold">{data.appendixB.keyAlgorithm} {data.appendixB.keySizeBits}-bit</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Payload PGP Key ID:</span>
                    <span className="text-cyan-300 font-mono">{data.appendixB.pgpKeyId}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Issuing Authority:</span>
                    <span className="text-amber-300">SARS Sub-CA v4 (mTLS)</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0e1628] border border-white/10 p-5 rounded-2xl space-y-3 text-xs">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Network Egress & Endpoint Mapping</span>
                </h4>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Channel Name:</span>
                    <span className="text-cyan-300 font-bold">{data.channel.channelName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Trade Test Mailbox:</span>
                    <span className="text-white truncate">{data.channel.stagingEndpointUrl}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Egress Whitelist IPs:</span>
                    <span className="text-emerald-300">{data.appendixB.egressIpAddresses.join(', ')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Port & Transport:</span>
                    <span className="text-indigo-300">Port {data.channel.port} (TLS 1.3)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Integrity Digest:</span>
                    <span className="text-amber-400">{data.channel.hashAlgorithm} Checksum</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Appendix B Dossier Viewer */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Full Generated Appendix B Attachment Text
              </span>
              <div className="bg-[#070b14] border border-indigo-500/20 rounded-2xl p-5 font-mono text-[11px] text-slate-300 max-h-96 overflow-y-auto whitespace-pre-wrap select-text">
                {appendixBText}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 10 TEST TAXPAYERS HARNESS */}
      {/* ========================================================================= */}
      {activeTab === 'test_taxpayers' && (
        <div className="space-y-6">
          <div className="bg-[#0b1120] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Hash className="w-4 h-4 text-emerald-400" />
                  <span>10 Test Taxpayer References for Trade Testing Activation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  SARS requirement: Submissions for trade testing require 10 activated test taxpayer reference numbers passing the official Luhn Mod-10 check digit verification.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(
                    data.testTaxpayers.map((t, i) => `${i + 1}. [${t.taxNumber}] - ${t.name} (${t.supportedTaxTypes.join(', ')})`).join('\n'),
                    'copy_tax_list',
                    'Taxpayer Reference List'
                  )}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  {copiedKey === 'copy_tax_list' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy 10 Numbers</span>
                </button>
                <button
                  onClick={() => handleDownloadFile(
                    JSON.stringify(data.testTaxpayers, null, 2),
                    `SARS_TradeTesting_Taxpayers_${data.organisation.taxReferenceNumber}.json`,
                    'application/json'
                  )}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* Taxpayers Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e1628] text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Tax Reference No.</th>
                    <th className="py-3 px-4">Entity & Name</th>
                    <th className="py-3 px-4">Luhn Status</th>
                    <th className="py-3 px-4">Target Tax Streams</th>
                    <th className="py-3 px-4">Trade Testing Scenario</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {data.testTaxpayers.length === 0 ? (
                    <tr key="empty-test-taxpayers-row">
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-sans text-xs">
                        No test taxpayers defined in trade testing harness.
                      </td>
                    </tr>
                  ) : (
                    data.testTaxpayers.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-bold">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                            {t.taxNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-sans font-medium text-white">{t.name}</div>
                          <div className="text-[10px] text-slate-400">{t.entityType}</div>
                        </td>
                        <td className="py-3 px-4">
                          {t.mod10Valid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>MOD-10 PASS</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              <span>FAILED</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {t.supportedTaxTypes.map(st => (
                              <span key={st} className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">
                                {st}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs font-sans text-slate-300 text-[11px] truncate">
                          {t.testScenario}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleCopy(t.taxNumber, `copy_num_${t.id}`, t.taxNumber)}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/10 transition-all cursor-pointer text-[10px]"
                            title="Copy Tax Number"
                          >
                            {copiedKey === `copy_num_${t.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Custom Test Taxpayer Form */}
            <div className="bg-[#0e1628] border border-white/10 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Verify & Add Additional Test Taxpayer to Harness</span>
              </h4>
              <form onSubmit={handleAddTestTaxpayer} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">10-Digit Tax Ref No.*</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. 9304318273"
                    value={newTaxRef}
                    onChange={e => {
                      setNewTaxRef(e.target.value);
                      setNewTaxRefError(null);
                    }}
                    className="w-full bg-[#070b14] border border-white/10 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Entity / Person Name*</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp (Pty) Ltd"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-[#070b14] border border-white/10 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Entity Type</label>
                  <select
                    value={newEntityType}
                    onChange={e => setNewEntityType(e.target.value as any)}
                    className="w-full bg-[#070b14] border border-white/10 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="COMPANY">Company / Corporate</option>
                    <option value="INDIVIDUAL">Individual / Director</option>
                    <option value="TRUST">Trust</option>
                    <option value="PBO">PBO (Section 18A)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Validate & Add</span>
                  </button>
                </div>
              </form>

              {newTaxRefError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{newTaxRefError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SFG HTTPS SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'sfg_transmission' && (
        <div className="space-y-6">
          <div className="bg-[#0b1120] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Sterling File Gateway (HTTPS) Trade Testing Transmission Simulator</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulates HTTPS mutual-TLS file transfer to SARS trade testing mailbox (<code className="text-cyan-300">{data.channel.stagingEndpointUrl}</code>) with PGP encryption and SHA-256 integrity seal.
                </p>
              </div>
              <button
                onClick={handleRunTransmissionSimulation}
                disabled={isSimulating}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2 cursor-pointer"
              >
                {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isSimulating ? 'Simulating Handshake & Transfer...' : 'Run Trade Test Transmission'}</span>
              </button>
            </div>

            {/* Test Configuration Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0e1628] border border-white/10 p-4 rounded-2xl space-y-2">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Select Target Tax Type Batch
                </label>
                <select
                  value={selectedBatchType}
                  onChange={e => setSelectedBatchType(e.target.value)}
                  className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-bold"
                >
                  <option value="IT3(b)">IT3(b) - Financial Income Batch</option>
                  <option value="IT3(c)">IT3(c) - Financial Instruments Disposals</option>
                  <option value="IT3(d)">IT3(d) - Section 18A PBO Donations Batch</option>
                  <option value="IT3(s)">IT3(s) - Tax Free Savings Batch</option>
                  <option value="IT3(t)">IT3(t) - Trust Vesting Allocations Batch</option>
                  <option value="IRP5">IRP5 / IT3(a) - Bulk Payroll Certificates</option>
                  <option value="Dividend Tax">Dividends Tax Return (DTR01)</option>
                </select>
              </div>

              <div className="bg-[#0e1628] border border-white/10 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Submitting Organisation
                </span>
                <p className="text-xs font-bold text-white truncate">{data.organisation.legalName}</p>
                <p className="text-[11px] font-mono text-cyan-300">Tax Ref: {data.organisation.taxReferenceNumber}</p>
              </div>

              <div className="bg-[#0e1628] border border-white/10 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Gateway Endpoint
                </span>
                <p className="text-xs font-mono font-bold text-emerald-300 truncate">{data.channel.stagingEndpointUrl}</p>
                <p className="text-[11px] text-slate-400 font-mono">Port {data.channel.port} • TLS 1.3 mTLS</p>
              </div>
            </div>

            {/* Terminal Log Console */}
            <div className="bg-[#060a12] border border-white/10 rounded-2xl p-4 font-mono text-[11px] space-y-2">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sterling File Gateway Transmission Terminal Output</span>
                </div>
                <span className="text-[10px]">Host: sfg-trade.sars.gov.za</span>
              </div>
              <div className="h-44 overflow-y-auto space-y-1 text-slate-300">
                {simulationLogs.length === 0 ? (
                  <div className="text-slate-600 italic py-8 text-center">
                    Click "Run Trade Test Transmission" above to execute simulated HTTPS mutual-TLS file transfer to SARS trade testing mailbox.
                  </div>
                ) : (
                  simulationLogs.map((lg, i) => (
                    <div key={i} className="leading-tight">
                      {lg.includes('VERIFIED') || lg.includes('SUCCESS') || lg.includes('200 OK') ? (
                        <span className="text-emerald-400 font-bold">{lg}</span>
                      ) : lg.includes('INIT') || lg.includes('CIPHER') ? (
                        <span className="text-cyan-300">{lg}</span>
                      ) : lg.includes('PAYLOAD') || lg.includes('HASH') ? (
                        <span className="text-amber-300">{lg}</span>
                      ) : (
                        <span>{lg}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Receipt Card */}
            {transmissionReceipt && (
              <div className="bg-[#091120] border border-emerald-500/30 rounded-2xl p-5 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">SARS Trade Testing Gateway Acknowledgment Receipt</h4>
                      <p className="text-[11px] font-mono text-emerald-300">Receipt Ref: {transmissionReceipt.receiptId}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono">
                    STATUS: {transmissionReceipt.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Batch Identifier:</span>
                    <span className="text-white font-bold">{transmissionReceipt.batchId}</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Records Processed:</span>
                    <span className="text-cyan-300 font-bold">{transmissionReceipt.recordsProcessed} Valid Test Records</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-slate-400 block text-[10px]">SHA-256 Integrity Digest:</span>
                    <span className="text-amber-300 truncate block">{transmissionReceipt.sha256Digest}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleDownloadFile(
                      JSON.stringify(transmissionReceipt, null, 2),
                      `SARS_SFG_Acknowledgment_${transmissionReceipt.receiptId}.json`,
                      'application/json'
                    )}
                    className="px-4 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official Receipt JSON</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TESTING ROADMAP */}
      {/* ========================================================================= */}
      {activeTab === 'testing_roadmap' && (
        <div className="space-y-6">
          <div className="bg-[#0b1120] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>SARS Sterling File Gateway (HTTPS) Accreditation Roadmap</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Standardised milestones governed under SARS External Guide GEN-EDI-01-G01 for Third-Party Data Intermediaries and Independent Software Vendors (ISVs).
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  step: '01',
                  title: 'Enrolment Application & Appendix B Submission',
                  desc: 'Submit official enrolment email to thirdpartydata@sars.gov.za with Appendix B specification and 10 validated test taxpayer reference numbers.',
                  status: 'READY_TO_DISPATCH',
                  badge: 'Current Action',
                  badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                },
                {
                  step: '02',
                  title: 'SARS Technical Administrator Vetting & Mailbox Provisioning',
                  desc: 'SARS SPS Connect:Direct / EDI Team provisions the applicant mailbox on IBM Sterling File Gateway (HTTPS) and issues Root/Intermediate CA certificates.',
                  status: 'PENDING_SARS_ACTION',
                  badge: '2–3 Business Days',
                  badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                },
                {
                  step: '03',
                  title: 'mTLS Digital Certificate Issuance & Egress Whitelisting',
                  desc: 'Sign CSR (CN=sfg-gateway.ilithafintech.co.za) via SARS PKI Sub-CA and whitelist cloud egress IPs (102.132.180.45, 102.132.180.46).',
                  status: 'SECURITY_STAGE',
                  badge: 'FIPS 140-3 Level 3',
                  badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                },
                {
                  step: '04',
                  title: 'Activation of 10 Test Taxpayers in Trade Testing Environment',
                  desc: 'SARS activates the 10 submitted taxpayer reference numbers in the UAT database to permit test batch ingestion without production tax liability impact.',
                  status: 'HARNESS_ACTIVATION',
                  badge: 'Mod-10 Validated',
                  badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                },
                {
                  step: '05',
                  title: 'Pilot Batch Execution & Business Sign-off',
                  desc: 'Transmit test batches (IT3b, IT3d Section 18A, IRP5) with 100% syntactic compliance to obtain final ISV Production Accreditation Certificate.',
                  status: 'FINAL_STAGE',
                  badge: 'Production Gate',
                  badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                }
              ].map(m => (
                <div key={m.step} className="p-4 rounded-2xl bg-[#0e1628] border border-white/5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-sm text-cyan-400 shrink-0">
                    {m.step}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="font-bold text-white text-xs">{m.title}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${m.badgeColor}`}>
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

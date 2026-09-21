import React, { useState } from 'react';
import { 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Code, 
  FileText, 
  ShieldAlert, 
  ArrowUpRight, 
  Play, 
  Check, 
  Copy, 
  Terminal, 
  Layers, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  Plus,
  Sparkles,
  Database
} from 'lucide-react';
import { RoleType } from '../types';

export interface BackendValidationError {
  id: string;
  timestamp: string;
  module: 'ITR12_INDIVIDUAL' | 'ITR14_CORPORATE' | 'SARS_TCS_PIN' | 'VAT201_OCR' | 'SBD4_PERSAL' | 'IT3D_PBO' | 'ADR1_OBJECTION';
  moduleLabel: string;
  endpoint: string;
  errorCode: string;
  errorMessage: string;
  failedField: string;
  payloadSnippet: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'UNRESOLVED' | 'RETRYING' | 'RESOLVED' | 'IGNORED';
  retryCount: number;
  lastAttemptAt?: string;
  suggestedRemediation: string;
  statutoryReference: string;
  resolvedAt?: string;
  resolvedMessage?: string;
}

interface BackendValidationErrorTrackerProps {
  currentUserRole: RoleType;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  formatZAR: (val: number) => string;
}

export const BackendValidationErrorTracker: React.FC<BackendValidationErrorTrackerProps> = ({
  currentUserRole,
  addAuditLog,
  showBanner,
  formatZAR
}) => {
  const [errors, setErrors] = useState<BackendValidationError[]>([
    {
      id: 'ERR-SARS-8402',
      timestamp: '2026-08-29 22:45:12',
      module: 'ITR14_CORPORATE',
      moduleLabel: 'ITR14 Corporate s12BA',
      endpoint: 'POST /v3/gateway/itr14/schedules/12ba',
      errorCode: 'XSD_SCHEMA_VAL_NULL_FIELD',
      errorMessage: "Element 'solarCocCertificateChecksum' cannot be null when claiming > R500,000 under Section 12BA super-allowance.",
      failedField: 'payload.schedules.s12BA.cocChecksum',
      payloadSnippet: JSON.stringify({
        taxpayerRef: "9812490123",
        taxYear: 2026,
        solarPanelsCost: 450000,
        inverterCost: 150000,
        batteryCost: 200000,
        superAllowanceClaimed: 1000000,
        solarCocCertificateChecksum: null,
        isCommissioned: true
      }, null, 2),
      severity: 'CRITICAL',
      status: 'UNRESOLVED',
      retryCount: 1,
      lastAttemptAt: '2026-08-29 22:45:12',
      suggestedRemediation: "Attach and hash the Electrical Certificate of Compliance (CoC) before payload serialization.",
      statutoryReference: "Income Tax Act §12BA(3) & SARS Corporate Schedule Gazettes"
    },
    {
      id: 'ERR-SARS-3199',
      timestamp: '2026-08-29 22:14:05',
      module: 'SARS_TCS_PIN',
      moduleLabel: 'TCS Tax PIN Gateway',
      endpoint: 'POST /v3/tcs/verify-pin',
      errorCode: 'INVALID_TAXPAYER_CHECKSUM',
      errorMessage: "Taxpayer Reference Number '981249012X' failed Mod-10 Luhn check validation.",
      failedField: 'request.taxpayerReferenceNumber',
      payloadSnippet: JSON.stringify({
        taxpayerReferenceNumber: "981249012X",
        taxPin: "9821A849X0",
        requestingEntity: "Transnet SOC Ltd",
        purpose: "Tender / Bid Award"
      }, null, 2),
      severity: 'HIGH',
      status: 'UNRESOLVED',
      retryCount: 0,
      suggestedRemediation: "Correct the 10-digit SARS reference number to pass the Luhn algorithm validation.",
      statutoryReference: "Tax Administration Act No. 28 of 2011 §256"
    },
    {
      id: 'ERR-SARS-7014',
      timestamp: '2026-08-29 21:50:33',
      module: 'ADR1_OBJECTION',
      moduleLabel: 'ADR1 Notice of Objection',
      endpoint: 'POST /v3/disputes/adr1/notice-of-objection',
      errorCode: 'RULE7_EVIDENCE_MISMATCH',
      errorMessage: "Claimed business distance (12,450 km) does not align with Vault Logbook #789 total verified distance.",
      failedField: 'noticeOfObjection.disallowanceDetails.originalClaimAmount',
      payloadSnippet: JSON.stringify({
        objectionReference: "OBJ-2026-88194",
        sourceCode: 4015,
        claimedBusinessDistanceKm: 12450,
        vaultLogbookTotalKm: 12450,
        deemedVsActualRateZAR: 5.50,
        corroboratingVaultId: "VAULT-LOGBOOK-789"
      }, null, 2),
      severity: 'HIGH',
      status: 'UNRESOLVED',
      retryCount: 2,
      lastAttemptAt: '2026-08-29 22:01:10',
      suggestedRemediation: "Ensure Vault Logbook #789 checksum is attached to the objection payload envelope.",
      statutoryReference: "Tax Administration Act §104 / Rule 7 & Income Tax Act §11(a)"
    },
    {
      id: 'ERR-CSD-5021',
      timestamp: '2026-08-29 20:30:19',
      module: 'SBD4_PERSAL',
      moduleLabel: 'SBD 4/9 CSD PERSAL',
      endpoint: 'GET /api/v2/csd/director-check?persal=P7829104',
      errorCode: 'GATEWAY_UPSTREAM_TIMEOUT_504',
      errorMessage: "National Treasury CSD REST API upstream gateway timed out while verifying Director PERSAL record.",
      failedField: 'directors[1].persalNumber',
      payloadSnippet: JSON.stringify({
        directorId: "900118-ENC-0083",
        directorName: "Nompumelelo Khumalo",
        persalNumber: "P7829104",
        organOfState: "Gauteng Department of Infrastructure Development",
        hasSec30WrittenApproval: true
      }, null, 2),
      severity: 'MEDIUM',
      status: 'UNRESOLVED',
      retryCount: 1,
      lastAttemptAt: '2026-08-29 20:32:00',
      suggestedRemediation: "Retry with exponential backoff against CSD Secondary Staging Gateway.",
      statutoryReference: "Public Service Act §30 & Treasury Instruction 03 of 2021/22"
    },
    {
      id: 'ERR-SARS-1803',
      timestamp: '2026-08-29 19:15:40',
      module: 'IT3D_PBO',
      moduleLabel: 'Section 18A IT3(d)',
      endpoint: 'POST /v3/thirdparty/it3d/donations/batch',
      errorCode: 'DEDUCTION_CAP_EXCEEDED_10PCT',
      errorMessage: "Section 18A donation deduction cap exceeds 10% of taxpayer taxable income without carry-forward flag.",
      failedField: 'it3dCertificates[0].deductibleSection18AAmount',
      payloadSnippet: JSON.stringify({
        pboNumber: "930048123",
        donorTaxNumber: "9812490123",
        totalDonationAmountZAR: 150000,
        taxableIncomeZAR: 850000,
        s18AMaxAllowableZAR: 85000,
        excessCarryForwardFlag: false
      }, null, 2),
      severity: 'LOW',
      status: 'RESOLVED',
      retryCount: 1,
      lastAttemptAt: '2026-08-29 19:20:11',
      resolvedAt: '2026-08-29 19:20:12',
      resolvedMessage: "Carry-forward flag enabled for excess R65,000 donation under s18A(1B).",
      suggestedRemediation: "Enable the excess carry-forward flag for Section 18A(1B) rolling deductions.",
      statutoryReference: "Income Tax Act No. 58 of 1962 §18A(1B)"
    }
  ]);

  const [selectedErrorId, setSelectedErrorId] = useState<string | null>('ERR-SARS-8402');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRetryingAll, setIsRetryingAll] = useState<boolean>(false);
  const [retryingIds, setRetryingIds] = useState<Record<string, boolean>>({});
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  const selectedError = errors.find(e => e.id === selectedErrorId) || null;

  // Filtered Errors List
  const filteredErrors = errors.filter(err => {
    const matchesStatus = filterStatus === 'ALL' || err.status === filterStatus;
    const matchesSeverity = filterSeverity === 'ALL' || err.severity === filterSeverity;
    const matchesSearch = 
      err.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      err.errorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      err.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      err.moduleLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      err.endpoint.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSeverity && matchesSearch;
  });

  const unresolvedCount = errors.filter(e => e.status === 'UNRESOLVED').length;
  const criticalCount = errors.filter(e => e.status === 'UNRESOLVED' && e.severity === 'CRITICAL').length;
  const highCount = errors.filter(e => e.status === 'UNRESOLVED' && e.severity === 'HIGH').length;
  const resolvedCount = errors.filter(e => e.status === 'RESOLVED').length;

  // Single Error Retry Handler
  const handleRetrySingle = (errorId: string) => {
    setRetryingIds(prev => ({ ...prev, [errorId]: true }));
    setErrors(prev => prev.map(e => e.id === errorId ? { ...e, status: 'RETRYING' } : e));

    showBanner(`🔄 Re-evaluating payload against SARS gateway endpoint for ${errorId}...`);

    setTimeout(() => {
      setErrors(prev => prev.map(e => {
        if (e.id === errorId) {
          return {
            ...e,
            status: 'RESOLVED',
            retryCount: e.retryCount + 1,
            lastAttemptAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            resolvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            resolvedMessage: `Payload validation successfully re-verified and accepted by SARS eFiling staging endpoint.`
          };
        }
        return e;
      }));

      setRetryingIds(prev => ({ ...prev, [errorId]: false }));
      addAuditLog(
        'BACKEND_VALIDATION_ERROR_RESOLVED',
        `Sentinel resolved backend validation error ${errorId} upon automated retry & schema re-verification.`,
        'info'
      );
      showBanner(`✅ Validation Error ${errorId} successfully resolved and accepted by gateway!`);
    }, 900);
  };

  // Batch Retry All Unresolved
  const handleRetryAllUnresolved = () => {
    const unresolvedErrors = errors.filter(e => e.status === 'UNRESOLVED');
    if (unresolvedErrors.length === 0) {
      showBanner('ℹ️ No unresolved errors in queue.');
      return;
    }

    setIsRetryingAll(true);
    showBanner(`🚀 Executing batch retry on ${unresolvedErrors.length} unresolved backend validation errors...`);

    const newRetryingIds: Record<string, boolean> = {};
    unresolvedErrors.forEach(e => {
      newRetryingIds[e.id] = true;
    });
    setRetryingIds(newRetryingIds);

    setErrors(prev => prev.map(e => e.status === 'UNRESOLVED' ? { ...e, status: 'RETRYING' } : e));

    setTimeout(() => {
      setErrors(prev => prev.map(e => {
        if (e.status === 'RETRYING') {
          return {
            ...e,
            status: 'RESOLVED',
            retryCount: e.retryCount + 1,
            lastAttemptAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            resolvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            resolvedMessage: `Auto-remediated schema envelope and confirmed against SARS staging gateway.`
          };
        }
        return e;
      }));

      setRetryingIds({});
      setIsRetryingAll(false);
      addAuditLog(
        'BATCH_BACKEND_ERRORS_RETRY_SUCCESS',
        `Batch retry successfully resolved ${unresolvedErrors.length} backend validation errors across SARS, CSD, and TCS gateways.`,
        'info'
      );
      showBanner(`🎉 All ${unresolvedErrors.length} validation errors successfully resolved!`);
    }, 1400);
  };

  // Inject Simulated Error
  const handleInjectSyntheticError = () => {
    const syntheticId = `ERR-SARS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newError: BackendValidationError = {
      id: syntheticId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      module: 'VAT201_OCR',
      moduleLabel: 'VAT 201 Section 20',
      endpoint: 'POST /v3/ocr/vat201/invoice-audit',
      errorCode: 'PROHIBITED_INPUT_DEDUCTION_CLAIMED',
      errorMessage: "Prohibited input tax item detected on scanned merchant receipt (Entertainment/Staff Lunch under s17(2)).",
      failedField: 'invoiceItems[2].isDeductible',
      payloadSnippet: JSON.stringify({
        invoiceNumber: "INV-2026-9921",
        merchantVatNumber: "4019284710",
        totalAmountZAR: 3450.00,
        vatClaimedZAR: 450.00,
        expenseCategory: "Staff Entertainment & Dining",
        sarsSection: "17(2)(a) Prohibited"
      }, null, 2),
      severity: 'HIGH',
      status: 'UNRESOLVED',
      retryCount: 0,
      suggestedRemediation: "Reclassify non-deductible entertainment expenses to eliminate prohibited VAT input claims.",
      statutoryReference: "Value-Added Tax Act 89 of 1991 §17(2)(a)"
    };

    setErrors(prev => [newError, ...prev]);
    setSelectedErrorId(syntheticId);
    addAuditLog(
      'SYNTHETIC_VALIDATION_ERROR_INJECTED',
      `Injected simulated backend validation fault ${syntheticId} into Sentinel error queue for diagnostic testing.`,
      'warn'
    );
    showBanner(`⚠️ Injected synthetic backend validation error: ${syntheticId}`);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    showBanner('📋 Copied payload snippet to clipboard!');
    setTimeout(() => setCopiedSnippetId(null), 2500);
  };

  const exportErrorsToCSV = () => {
    const headers = ['Error ID', 'Timestamp', 'Module', 'Endpoint', 'Error Code', 'Severity', 'Status', 'Retries', 'Failed Field', 'Error Message', 'Statute'];
    const rows = errors.map(e => [
      e.id,
      e.timestamp,
      e.moduleLabel,
      e.endpoint,
      e.errorCode,
      e.severity,
      e.status,
      e.retryCount,
      `"${e.failedField.replace(/"/g, '""')}"`,
      `"${e.errorMessage.replace(/"/g, '""')}"`,
      `"${e.statutoryReference.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sars_sentinel_validation_errors_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showBanner('📊 Downloaded validation error report as CSV.');
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="sentinel-error-tracker-root">
      
      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-1">
          <div className="flex justify-between items-center text-white/50 text-[10px] uppercase font-mono font-bold">
            <span>Unresolved Errors</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white flex items-baseline gap-2">
            <span>{unresolvedCount}</span>
            <span className="text-[10.5px] font-normal text-white/50">in queue</span>
          </div>
          <span className="text-[10px] text-amber-400 font-medium block">
            {criticalCount} Critical • {highCount} High
          </span>
        </div>

        <div className="bg-slate-900/70 border border-emerald-500/20 rounded-2xl p-4 space-y-1">
          <div className="flex justify-between items-center text-emerald-300/70 text-[10px] uppercase font-mono font-bold">
            <span>Resolved via Retry</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 flex items-baseline gap-2">
            <span>{resolvedCount}</span>
            <span className="text-[10.5px] font-normal text-emerald-400/60">remediated</span>
          </div>
          <span className="text-[10px] text-emerald-300/80 font-medium block">
            100% gateway reconciliation
          </span>
        </div>

        <div className="bg-slate-900/70 border border-indigo-500/20 rounded-2xl p-4 space-y-1">
          <div className="flex justify-between items-center text-indigo-300/70 text-[10px] uppercase font-mono font-bold">
            <span>Gateway Endpoints</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300">
            <span>6 Systems</span>
          </div>
          <span className="text-[10px] text-white/50 font-medium block">
            SARS v3, TCS, CSD, PBO
          </span>
        </div>

        <div className="bg-slate-900/70 border border-cyan-500/20 rounded-2xl p-4 space-y-1">
          <div className="flex justify-between items-center text-cyan-300/70 text-[10px] uppercase font-mono font-bold">
            <span>Recovery Protocol</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">
            <span>Auto-Retry</span>
          </div>
          <span className="text-[10px] text-cyan-300/80 font-medium block">
            Schema & Mod-10 Fixers
          </span>
        </div>
      </div>

      {/* TOOLBAR CONTROLS & FILTER BAR */}
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search error code, endpoint, field, or statutory reference..."
              className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
              id="sentinel-error-search-input"
            />
          </div>

          {/* FILTER DROPDOWNS */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/15 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-white/50" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                id="sentinel-error-status-filter"
              >
                <option value="ALL" className="bg-slate-900">All Statuses ({errors.length})</option>
                <option value="UNRESOLVED" className="bg-slate-900">Unresolved ({unresolvedCount})</option>
                <option value="RESOLVED" className="bg-slate-900">Resolved ({resolvedCount})</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-black/40 border border-white/15 rounded-xl px-2.5 py-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-white/50" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                id="sentinel-error-severity-filter"
              >
                <option value="ALL" className="bg-slate-900">All Severities</option>
                <option value="CRITICAL" className="bg-slate-900">Critical</option>
                <option value="HIGH" className="bg-slate-900">High</option>
                <option value="MEDIUM" className="bg-slate-900">Medium</option>
                <option value="LOW" className="bg-slate-900">Low</option>
              </select>
            </div>

            {/* BATCH RETRY BUTTON */}
            <button
              onClick={handleRetryAllUnresolved}
              disabled={isRetryingAll || unresolvedCount === 0}
              className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              id="retry-all-unresolved-errors-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetryingAll ? 'animate-spin' : ''}`} />
              <span>{isRetryingAll ? 'Retrying All...' : `Retry All Unresolved (${unresolvedCount})`}</span>
            </button>

            {/* INJECT TEST ERROR BUTTON */}
            <button
              onClick={handleInjectSyntheticError}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-semibold rounded-xl text-xs transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer"
              title="Simulate a new inbound backend validation error for testing"
              id="inject-synthetic-error-btn"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Error</span>
            </button>

            {/* EXPORT CSV BUTTON */}
            <button
              onClick={exportErrorsToCSV}
              className="p-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer"
              title="Export Errors to CSV"
              id="export-errors-csv-btn"
            >
              <Download className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>

      {/* MAIN DATA TABLE OF UNRESOLVED & RESOLVED BACKEND ERRORS */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="sentinel-backend-errors-table">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/60 text-[10.5px] uppercase font-mono tracking-wider text-white/50">
                <th className="py-3 px-4">Error ID & Time</th>
                <th className="py-3 px-3">Module & Endpoint</th>
                <th className="py-3 px-3">Error Code & Field</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-center">Severity</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredErrors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-white/40 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
                    <p className="text-xs">No backend validation errors matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredErrors.map((err) => {
                  const isSelected = selectedErrorId === err.id;
                  const isRetrying = retryingIds[err.id] || false;

                  const severityBadge = {
                    CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                    HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
                    MEDIUM: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                    LOW: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }[err.severity];

                  const statusBadge = {
                    UNRESOLVED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                    RETRYING: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse',
                    RESOLVED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                    IGNORED: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                  }[err.status];

                  return (
                    <tr
                      key={err.id}
                      onClick={() => setSelectedErrorId(err.id)}
                      className={`cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-indigo-950/40 border-l-4 border-l-indigo-400' 
                          : 'hover:bg-slate-800/40'
                      }`}
                      id={`error-row-${err.id}`}
                    >
                      {/* ID & TIMESTAMP */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-white text-xs flex items-center gap-1.5">
                          <AlertCircle className={`w-3.5 h-3.5 ${err.status === 'UNRESOLVED' ? 'text-amber-400' : 'text-emerald-400'}`} />
                          <span>{err.id}</span>
                        </div>
                        <span className="text-[10px] font-mono text-white/40 block mt-0.5">
                          {err.timestamp.substring(11)}
                        </span>
                      </td>

                      {/* MODULE & ENDPOINT */}
                      <td className="py-3 px-3">
                        <span className="text-xs font-bold text-white block">
                          {err.moduleLabel}
                        </span>
                        <span className="text-[10px] font-mono text-indigo-300/70 block truncate max-w-[180px]" title={err.endpoint}>
                          {err.endpoint}
                        </span>
                      </td>

                      {/* ERROR CODE & FAILED FIELD */}
                      <td className="py-3 px-3">
                        <span className="text-xs font-mono font-bold text-cyan-300 block">
                          {err.errorCode}
                        </span>
                        <span className="text-[10px] font-mono text-rose-300/80 block truncate max-w-[160px]" title={err.failedField}>
                          Field: {err.failedField}
                        </span>
                      </td>

                      {/* DESCRIPTION */}
                      <td className="py-3 px-3 max-w-[280px]">
                        <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">
                          {err.errorMessage}
                        </p>
                      </td>

                      {/* SEVERITY */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${severityBadge}`}>
                          {err.severity}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`text-[9.5px] font-mono font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${statusBadge}`}>
                          {err.status === 'RESOLVED' && <Check className="w-3 h-3 text-emerald-400" />}
                          {err.status === 'RETRYING' && <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />}
                          {err.status === 'UNRESOLVED' && <AlertCircle className="w-3 h-3 text-amber-400" />}
                          <span>{err.status}</span>
                        </span>
                        {err.retryCount > 0 && (
                          <span className="text-[9px] font-mono text-white/40 block mt-0.5">
                            {err.retryCount} retried
                          </span>
                        )}
                      </td>

                      {/* ACTION: RETRY BUTTON */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRetrySingle(err.id)}
                            disabled={isRetrying}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              err.status === 'RESOLVED'
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-md shadow-indigo-500/20'
                            }`}
                            id={`retry-btn-${err.id}`}
                            title="Trigger immediate re-validation against SARS gateway endpoint"
                          >
                            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                            <span>{isRetrying ? 'Verifying...' : err.status === 'RESOLVED' ? 'Re-Verify' : 'Retry'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED INSPECTION DRAWER FOR SELECTED ERROR */}
      {selectedError && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 space-y-4 shadow-2xl animate-fadeIn" id="selected-error-details-panel">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                  {selectedError.id}
                </span>
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  {selectedError.errorCode}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                  selectedError.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {selectedError.status}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2 pt-1">
                <Terminal className="w-4 h-4 text-indigo-400" />
                {selectedError.moduleLabel} — Endpoint Fault Details
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(selectedError.payloadSnippet, selectedError.id)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSnippetId === selectedError.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippetId === selectedError.id ? 'Copied Payload!' : 'Copy Payload JSON'}</span>
              </button>

              <button
                onClick={() => handleRetrySingle(selectedError.id)}
                disabled={retryingIds[selectedError.id]}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retryingIds[selectedError.id] ? 'animate-spin' : ''}`} />
                <span>{retryingIds[selectedError.id] ? 'Executing Gateway Retry...' : 'Apply Fix & Retry Now'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* LEFT: ERROR DIAGNOSTICS & REMEDIATION */}
            <div className="space-y-3 bg-black/40 border border-white/10 rounded-2xl p-4">
              <div className="space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Target REST / SOAP Endpoint</span>
                <span className="text-xs font-mono text-cyan-300 font-bold block">{selectedError.endpoint}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Failed Schema Field</span>
                <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 block">{selectedError.failedField}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Statutory Grounding & Act Reference</span>
                <span className="text-xs text-white/80 font-medium block">{selectedError.statutoryReference}</span>
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1">
                <span className="text-[10px] text-indigo-300 uppercase font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Suggested Remediation Protocol
                </span>
                <p className="text-xs text-white/90 leading-relaxed">
                  {selectedError.suggestedRemediation}
                </p>
              </div>

              {selectedError.resolvedMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 space-y-0.5">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block">Reconciliation Resolution</span>
                  <p>{selectedError.resolvedMessage}</p>
                  <span className="text-[9.5px] font-mono text-emerald-400/60 block">Resolved at: {selectedError.resolvedAt}</span>
                </div>
              )}
            </div>

            {/* RIGHT: RAW PAYLOAD SNIPPET */}
            <div className="space-y-2 bg-slate-950 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/40 uppercase font-mono font-bold flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-cyan-400" />
                    Serialized Request Payload
                  </span>
                  <span className="text-[9.5px] font-mono text-white/40">application/json</span>
                </div>
                <pre className="text-[11px] font-mono text-emerald-300 bg-black/60 p-3 rounded-xl border border-white/5 overflow-x-auto max-h-[220px] leading-relaxed">
                  {selectedError.payloadSnippet}
                </pre>
              </div>

              <div className="text-[10px] text-white/40 font-mono pt-2 border-t border-white/5 flex justify-between">
                <span>Last Gateway Attempt: {selectedError.lastAttemptAt || selectedError.timestamp}</span>
                <span>Retry Count: {selectedError.retryCount}</span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

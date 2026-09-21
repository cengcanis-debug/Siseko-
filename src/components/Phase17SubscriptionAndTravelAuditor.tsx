import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Car, 
  CreditCard, 
  FileCheck, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Zap, 
  RefreshCw, 
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  FileText
} from 'lucide-react';
import { RoleType } from '../types';

interface Phase17Props {
  formatZAR: (val: number) => string;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  currentUserRole: RoleType;
  checkPermission: (permission: string) => boolean;
}

export const Phase17SubscriptionAndTravelAuditor: React.FC<Phase17Props> = ({
  formatZAR,
  addAuditLog,
  showBanner,
  currentUserRole,
  checkPermission,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'auditor' | 'billing' | 'webhooks'>('auditor');

  // Account tier state
  const [currentTier, setCurrentTier] = useState<'lite' | 'pro' | 'wealth'>('pro');

  // Logbook records for TAA Rule 7 compliance audit
  const [trips, setTrips] = useState([
    {
      id: 'trip-101',
      date: '2026-06-20',
      departure: 'Sandton City, JHB',
      destination: 'Capitec Bank HQ, Stellenbosch',
      vehicle_value: 450000,
      business_km: 120.5,
      reason_for_trip: 'Corporate Tax provisional cycle audit & Section 12E SBC review',
      client_name: 'Capitec Bank Ltd',
      status: 'verified' as 'verified' | 'incomplete'
    },
    {
      id: 'trip-102',
      date: '2026-06-22',
      departure: 'Rosebank, JHB',
      destination: 'Standard Bank Simmonds St, JHB',
      vehicle_value: 620000,
      business_km: 280.0,
      reason_for_trip: '', // Incomplete
      client_name: 'Standard Bank of SA',
      status: 'incomplete' as 'verified' | 'incomplete'
    },
    {
      id: 'trip-103',
      date: '2026-06-25',
      departure: 'Century City, Cape Town',
      destination: 'Anglo American Hub, Marshalltown',
      vehicle_value: 350000,
      business_km: 45.2,
      reason_for_trip: 'Audit review of Section 18A donation tax receipts',
      client_name: '', // Incomplete
      status: 'incomplete' as 'verified' | 'incomplete'
    },
    {
      id: 'trip-104',
      date: '2026-07-02',
      departure: 'Durban North',
      destination: 'Transnet Port Terminals, Durban',
      vehicle_value: 520000,
      business_km: 88.0,
      reason_for_trip: 'VAT201 input tax inspection on imported logistics equipment',
      client_name: 'Transnet SOC Ltd',
      status: 'verified' as 'verified' | 'incomplete'
    }
  ]);

  // Auditor states
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Webhook simulator state
  const [webhookEventType, setWebhookEventType] = useState<'customer.subscription.updated' | 'payment.payfast.notify'>('customer.subscription.updated');
  const [webhookTier, setWebhookTier] = useState<'lite' | 'pro' | 'wealth'>('wealth');
  const [webhookEmail, setWebhookEmail] = useState('executive@enterprise-client.co.za');
  const [webhookResult, setWebhookResult] = useState<any>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);

  // Edit trip helper
  const handleUpdateTrip = (id: string, field: 'reason_for_trip' | 'client_name', val: string) => {
    setTrips(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, [field]: val };
        updated.status = (updated.reason_for_trip.trim() && updated.client_name.trim()) ? 'verified' : 'incomplete';
        return updated;
      }
      return t;
    }));
  };

  // Run TAA Rule 7 Audit Export
  const handleRunAuditExport = async () => {
    setIsAuditing(true);
    setAuditResult(null);

    const payload = {
      records: trips.map(t => ({
        trip_id: t.id,
        date: t.date,
        vehicle_value: t.vehicle_value,
        business_km: t.business_km,
        reason_for_trip: t.reason_for_trip,
        client_name: t.client_name
      })),
      include_receipts: true
    };

    try {
      const res = await fetch('/api/v1/audit/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Account-Tier': currentTier
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setAuditResult({
          success: false,
          errorCode: data.error_code || 'AUDIT_FAILED',
          message: data.message || 'One or more business trips failed TAA Rule 7 compliance validation.',
          failures: data.failures || []
        });
        addAuditLog(
          'TAA_RULE7_AUDIT_REJECTED',
          `Logbook export blocked by Rule 7 Auditor: ${data.failures?.length || 0} trip(s) missing mandatory purpose/client info.`,
          'warn'
        );
        showBanner('⚠️ Rule 7 Audit: Incomplete trips detected. Please provide mandatory reason and client name.');
      } else {
        setAuditResult({
          success: true,
          message: data.message,
          exportUrl: data.export_url,
          fileSizeBytes: data.file_size_bytes,
          pdfCompiledAt: data.pdf_compiled_at
        });
        addAuditLog(
          'TAA_RULE7_AUDIT_PASSED',
          `All ${trips.length} logbook trips validated under TAA Rule 7 & Section 11(a). PDF package compiled (${(data.file_size_bytes / 1024 / 1024).toFixed(1)} MB).`,
          'info'
        );
        showBanner('✅ TAA Rule 7 Travel Logbook verified and audit pack compiled!');
      }
    } catch (err: any) {
      showBanner(`Audit verification failed: ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  // Simulated PDF download
  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    setTimeout(() => {
      setDownloadingPdf(false);
      const content = `SARS STATUTORY TRAVEL LOGBOOK AUDIT PACK (TAA RULE 7 COMPLIANT)\nGenerated: ${new Date().toISOString()}\nTier: ${currentTier.toUpperCase()}\nStatus: CERTIFIED COMPLIANT\nTotal Trips: ${trips.length}\nTotal Business Distance: ${trips.reduce((a, b) => a + b.business_km, 0)} km\nCorroboration: Matched to Section 11(a) General Deduction and SARS 2026/2027 Deemed Cost Tables.`;
      const blob = new Blob([content], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SARS_Travel_Audit_Export_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showBanner('📥 Downloaded SARS Travel Audit Export PDF');
    }, 600);
  };

  // Simulate Webhook dispatch
  const handleDispatchWebhook = async () => {
    setWebhookLoading(true);
    setWebhookResult(null);

    const payload = {
      id: `evt_${Date.now()}`,
      type: webhookEventType,
      data: webhookEventType === 'customer.subscription.updated' ? {
        object: {
          customer_email: webhookEmail,
          metadata: {
            account_tier: webhookTier
          }
        }
      } : {
        merchant_id: '10000100',
        payment_status: 'COMPLETE',
        custom_str: `tier=${webhookTier}&email=${webhookEmail}`
      }
    };

    try {
      const res = await fetch('/api/v1/audit/webhooks/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setWebhookResult(data);
      if (data.updated_tier) {
        setCurrentTier(data.updated_tier);
        showBanner(`💳 Webhook processed: Tier updated to ${data.updated_tier.toUpperCase()}`);
      } else {
        showBanner(`💳 Webhook processed via ${data.handler || 'IPN'}`);
      }
      addAuditLog('PAYMENT_WEBHOOK_RECEIVED', `Received ${webhookEventType} for ${webhookEmail}.`);
    } catch (e: any) {
      showBanner(`Webhook failure: ${e.message}`);
    } finally {
      setWebhookLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="phase17-container">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded uppercase">
              Phase 17 Enhancement
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              TAA Rule 7 • Sec 11(a) • Stripe/PayFast
            </span>
          </div>
          <h3 className="text-lg font-black text-white mt-1 flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-400" />
            Subscription Locks & Rule 7 Travel Auditor
          </h3>
          <p className="text-xs text-white/60">
            Automated statutory travel verification under Tax Administration Act Rule 7 with multi-tier subscription gatekeepers.
          </p>
        </div>

        {/* SUB-TABS */}
        <div className="flex gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveSubTab('auditor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'auditor' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Rule 7 Auditor</span>
          </button>

          <button
            onClick={() => setActiveSubTab('billing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'billing' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Tier Gatekeeper</span>
          </button>

          <button
            onClick={() => setActiveSubTab('webhooks')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'webhooks' ? 'bg-purple-500 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>PayFast / Webhooks</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: RULE 7 AUDITOR */}
      {activeSubTab === 'auditor' && (
        <div className="space-y-6">
          {/* STATUTORY CONTEXT BANNER */}
          <div className="p-4 bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-slate-900/40 border border-amber-500/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                SARS TAA Rule 7 Strict Deduction Mandate
              </span>
              <span className="text-[10px] font-mono text-white/50">Section 8(1)(b) & Section 11(a)</span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              SARS automatically writes back business travel claims (Source Code 4015) to R0 during assessments if trips lack corroborated 
              <strong className="text-white"> specific business reasons</strong> or <strong className="text-white">verifiable client company names</strong>. 
              This engine executes strict validation prior to generating the formal objection or tax return pack.
            </p>
          </div>

          {/* TRIPS TABLE */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Active Business Logbook Entries for Audit ({trips.length} records)
                </h4>
                <p className="text-[10px] text-white/40">Edit any incomplete entries below to satisfy TAA Rule 7 requirements.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {trips.filter(t => t.status === 'verified').length} / {trips.length} Validated
                </span>
              </div>
            </div>

            <div className="space-y-3 overflow-x-auto">
              {trips.map((trip) => {
                const isComplete = trip.reason_for_trip.trim() && trip.client_name.trim();
                return (
                  <div 
                    key={trip.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isComplete 
                        ? 'bg-emerald-950/20 border-emerald-500/30' 
                        : 'bg-rose-950/20 border-rose-500/40 animate-pulse'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          isComplete ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {isComplete ? 'RULE 7 READY' : 'ACTION REQUIRED: MISSING FIELDS'}
                        </span>
                        <span className="text-xs font-mono text-white/50">{trip.date}</span>
                        <span className="text-xs font-bold text-white">{trip.departure} → {trip.destination}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-amber-400 font-bold">{trip.business_km} km</span>
                        <span className="text-white/50">Vehicle: {formatZAR(trip.vehicle_value)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-[9.5px] text-white/50 font-bold uppercase mb-0.5">
                          Business Purpose / Meeting Notes *
                        </label>
                        <input
                          type="text"
                          value={trip.reason_for_trip}
                          onChange={(e) => handleUpdateTrip(trip.id, 'reason_for_trip', e.target.value)}
                          placeholder="Enter explicit reason (e.g., Client tax assessment review)"
                          className={`w-full bg-slate-950 border rounded-lg px-2.5 py-1.5 text-xs text-white ${
                            trip.reason_for_trip.trim() ? 'border-white/20' : 'border-rose-500 text-rose-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] text-white/50 font-bold uppercase mb-0.5">
                          Client Organization / Company *
                        </label>
                        <input
                          type="text"
                          value={trip.client_name}
                          onChange={(e) => handleUpdateTrip(trip.id, 'client_name', e.target.value)}
                          placeholder="Enter verified company name (e.g., Standard Bank Ltd)"
                          className={`w-full bg-slate-950 border rounded-lg px-2.5 py-1.5 text-xs text-white ${
                            trip.client_name.trim() ? 'border-white/20' : 'border-rose-500 text-rose-200'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AUDIT TRIGGER BUTTON */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-white/60 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Auditing under active tier: <strong className="text-white capitalize">{currentTier}</strong></span>
              </div>
              <button
                onClick={handleRunAuditExport}
                disabled={isAuditing}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAuditing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{isAuditing ? 'Auditing Logbook Entries...' : 'Execute TAA Rule 7 Audit & Compile Pack'}</span>
              </button>
            </div>
          </div>

          {/* AUDIT RESULT VERDICT */}
          {auditResult && (
            <div className={`p-5 rounded-2xl border ${
              auditResult.success 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {auditResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                    )}
                    <h4 className="text-sm font-bold">
                      {auditResult.success ? 'TAA Rule 7 Statutory Compliance Passed' : 'TAA Rule 7 Audit Rejection'}
                    </h4>
                  </div>
                  <p className="text-xs text-white/80">{auditResult.message}</p>
                </div>

                {auditResult.success && (
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingPdf ? 'Downloading...' : 'Download Certified PDF (<5MB)'}</span>
                  </button>
                )}
              </div>

              {/* FAILURES LIST */}
              {!auditResult.success && auditResult.failures?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-rose-500/20 space-y-2">
                  <span className="text-[10.5px] font-bold text-rose-300 uppercase tracking-wider">
                    Trips Failing Rule 7 Requirements:
                  </span>
                  <div className="space-y-1.5">
                    {auditResult.failures.map((f: any, idx: number) => (
                      <div key={idx} className="text-xs font-mono bg-black/40 p-2 rounded-lg border border-rose-500/30 flex items-center justify-between">
                        <span className="text-rose-200 font-bold">Trip ID: {f.trip_id}</span>
                        <span className="text-rose-400">Missing: {f.missing_fields.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: TIER GATEKEEPER */}
      {activeSubTab === 'billing' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              Statutory Feature Access & Subscription Locks
            </h4>
            <p className="text-xs text-white/60">
              Access to corporate returns (VAT-201), multi-entity consolidation, and High-Wealth Individual (HWI) asset registries 
              is governed by subscription tier middleware.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* LITE TIER */}
              <div className={`p-4 rounded-2xl border transition-all ${
                currentTier === 'lite' 
                  ? 'bg-cyan-950/30 border-cyan-400 ring-1 ring-cyan-400/50' 
                  : 'bg-black/30 border-white/10'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white">Lite Personal</span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">R149 / mo</span>
                </div>
                <p className="text-[11px] text-white/50 mb-3">Individuals & basic sole proprietors.</p>
                <ul className="text-xs space-y-1.5 text-white/70 mb-4">
                  <li className="flex items-center gap-1.5 text-emerald-400">✓ Personal Tax & Logbook</li>
                  <li className="flex items-center gap-1.5 text-rose-400">✕ VAT-201 Corporate Filing Locked</li>
                  <li className="flex items-center gap-1.5 text-rose-400">✕ High-Wealth Registry Locked</li>
                </ul>
                <button
                  onClick={() => {
                    setCurrentTier('lite');
                    showBanner('Switched active tier to Lite');
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    currentTier === 'lite' ? 'bg-cyan-500 text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {currentTier === 'lite' ? 'Active Tier' : 'Select Lite'}
                </button>
              </div>

              {/* PRO TIER */}
              <div className={`p-4 rounded-2xl border transition-all ${
                currentTier === 'pro' 
                  ? 'bg-amber-950/30 border-amber-400 ring-1 ring-amber-400/50' 
                  : 'bg-black/30 border-white/10'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white">Pro SME Business</span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">R499 / mo</span>
                </div>
                <p className="text-[11px] text-white/50 mb-3">Pty Ltd corporations & active consultants.</p>
                <ul className="text-xs space-y-1.5 text-white/70 mb-4">
                  <li className="flex items-center gap-1.5 text-emerald-400">✓ Personal + Corporate Books</li>
                  <li className="flex items-center gap-1.5 text-emerald-400">✓ VAT-201 Bi-Monthly Return</li>
                  <li className="flex items-center gap-1.5 text-white/50">• 1 Associated Corporate Entity</li>
                  <li className="flex items-center gap-1.5 text-rose-400">✕ High-Wealth Registry (&gt;R50m) Locked</li>
                </ul>
                <button
                  onClick={() => {
                    setCurrentTier('pro');
                    showBanner('Switched active tier to Pro');
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    currentTier === 'pro' ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {currentTier === 'pro' ? 'Active Tier' : 'Select Pro'}
                </button>
              </div>

              {/* WEALTH TIER */}
              <div className={`p-4 rounded-2xl border transition-all ${
                currentTier === 'wealth' 
                  ? 'bg-purple-950/30 border-purple-400 ring-1 ring-purple-400/50' 
                  : 'bg-black/30 border-white/10'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white">Wealth Advisory Suite</span>
                  <span className="text-[10px] font-mono text-purple-400 font-bold">R1,200 / mo</span>
                </div>
                <p className="text-[11px] text-white/50 mb-3">Family offices, groups, & HWI entities.</p>
                <ul className="text-xs space-y-1.5 text-white/70 mb-4">
                  <li className="flex items-center gap-1.5 text-emerald-400">✓ Unlimited Corporate Consolidation</li>
                  <li className="flex items-center gap-1.5 text-emerald-400">✓ SARS High-Wealth Asset Registry</li>
                  <li className="flex items-center gap-1.5 text-emerald-400">✓ Section 42 / 45 Group Restructuring</li>
                  <li className="flex items-center gap-1.5 text-emerald-400">✓ Dedicated SITA Gateway Sandbox</li>
                </ul>
                <button
                  onClick={() => {
                    setCurrentTier('wealth');
                    showBanner('Switched active tier to Wealth Suite');
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    currentTier === 'wealth' ? 'bg-purple-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {currentTier === 'wealth' ? 'Active Tier' : 'Select Wealth'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: WEBHOOKS / PAYFAST */}
      {activeSubTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              Stripe & PayFast Webhook Dispatch Sandbox
            </h4>
            <p className="text-xs text-white/60">
              Simulates incoming subscription payment webhooks to verify automatic tier synchronization on the backend.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9.5px] text-white/50 font-bold uppercase mb-1">Event Type</label>
                <select
                  value={webhookEventType}
                  onChange={(e: any) => setWebhookEventType(e.target.value)}
                  className="w-full bg-slate-950 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="customer.subscription.updated">Stripe: customer.subscription.updated</option>
                  <option value="payment.payfast.notify">PayFast: Instant Payment Notification (IPN)</option>
                </select>
              </div>

              <div>
                <label className="block text-[9.5px] text-white/50 font-bold uppercase mb-1">Target Account Tier</label>
                <select
                  value={webhookTier}
                  onChange={(e: any) => setWebhookTier(e.target.value)}
                  className="w-full bg-slate-950 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="lite">Lite (Personal)</option>
                  <option value="pro">Pro (Business)</option>
                  <option value="wealth">Wealth (Advisory Suite)</option>
                </select>
              </div>

              <div>
                <label className="block text-[9.5px] text-white/50 font-bold uppercase mb-1">Customer Email</label>
                <input
                  type="email"
                  value={webhookEmail}
                  onChange={(e) => setWebhookEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <button
              onClick={handleDispatchWebhook}
              disabled={webhookLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {webhookLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{webhookLoading ? 'Dispatching...' : 'Simulate Incoming Payment Webhook'}</span>
            </button>

            {webhookResult && (
              <div className="p-3 bg-black/50 border border-purple-500/30 rounded-xl font-mono text-xs text-purple-200">
                <span className="text-[10px] text-white/50 block mb-1">Server Response:</span>
                <pre>{JSON.stringify(webhookResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  FileText,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Download,
  Printer,
  X,
  Sparkles,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Info,
  Clock,
  Lock,
  Layers,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import {
  VdpApplicationDossier,
  VdpOversightCategory,
  UserTaxProfile,
  RoleType
} from '../types';
import {
  calculateVdpPenaltyMitigation,
  createVdpDossierFromOversight,
  INITIAL_VDP_DOSSIERS
} from '../utils/sarsVdpEngine';
import { formatZAR } from '../utils/taxCalculations';
import { downloadBlobFile } from '../utils/systemBridge';

interface SarsVdpCenterProps {
  profile: UserTaxProfile;
  currentUserRole: RoleType;
  checkPermission: (action: string) => boolean;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  onNavigateToShield?: () => void;
  initialOversight?: {
    title: string;
    desc?: string;
    category?: VdpOversightCategory;
    shortfall?: number;
    standardPenaltyPct?: number;
  } | null;
}

export const SarsVdpCenter: React.FC<SarsVdpCenterProps> = ({
  profile,
  currentUserRole,
  checkPermission,
  addAuditLog,
  showBanner,
  onNavigateToShield,
  initialOversight
}) => {
  // Disclosures state
  const [dossiers, setDossiers] = useState<VdpApplicationDossier[]>(INITIAL_VDP_DOSSIERS);

  // Form state for creating a new proactive disclosure
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [oversightTitle, setOversightTitle] = useState<string>('');
  const [oversightDesc, setOversightDesc] = useState<string>('');
  const [category, setCategory] = useState<VdpOversightCategory>('DUAL_USE_UNAPPORTIONED');
  const [shortfallStr, setShortfallStr] = useState<string>('12500');
  const [standardPenaltyPct, setStandardPenaltyPct] = useState<number>(50);
  const [remediationPlan, setRemediationPlan] = useState<string>('Voluntarily adjusting ledger, repaying uncollected tax, and updating provisional tax return.');

  // Handle incoming initial oversight from Pre-Audit Shield or Statutory Enhancements
  useEffect(() => {
    if (initialOversight) {
      setOversightTitle(initialOversight.title || '');
      if (initialOversight.desc) setOversightDesc(initialOversight.desc);
      if (initialOversight.category) setCategory(initialOversight.category);
      if (initialOversight.shortfall !== undefined) setShortfallStr(String(initialOversight.shortfall));
      if (initialOversight.standardPenaltyPct !== undefined) setStandardPenaltyPct(initialOversight.standardPenaltyPct);
      setShowCreateModal(true);
    }
  }, [initialOversight]);

  // Selected dossier for viewing formal agreement modal
  const [inspectingDossier, setInspectingDossier] = useState<VdpApplicationDossier | null>(null);

  // Live mitigation calculation for form preview
  const formShortfall = parseFloat(shortfallStr) || 0;
  const liveMitigation = calculateVdpPenaltyMitigation(formShortfall, standardPenaltyPct);

  // Aggregated metrics
  const totalShortfallsDisclosed = dossiers.reduce((sum, d) => sum + d.understatedTaxShortfallZAR, 0);
  const totalPenaltiesEliminated = dossiers.reduce((sum, d) => sum + d.penaltySavedZAR, 0);
  const totalInterestPayable = dossiers.reduce((sum, d) => sum + d.estimated89quatInterestZAR, 0);

  // Handle submit new VDP application
  const handleCreateVdp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role ${currentUserRole} cannot draft statutory disclosures.`);
      return;
    }

    if (formShortfall <= 0 || !oversightTitle.trim()) {
      showBanner('⚠️ Please enter an oversight title and valid tax shortfall amount.');
      return;
    }

    const newDossier = createVdpDossierFromOversight(
      profile,
      oversightTitle,
      oversightDesc || 'Proactively disclosed internal accounting oversight to eliminate statutory penalties.',
      category,
      formShortfall,
      standardPenaltyPct,
      [],
      remediationPlan
    );

    setDossiers(prev => [newDossier, ...prev]);

    addAuditLog(
      'VDP_PROACTIVE_DISCLOSURE_DRAFTED',
      `Drafted SARS Voluntary Disclosure #${newDossier.vdpRefNumber} for "${newDossier.oversightTitle}". Shortfall: ${formatZAR(
        newDossier.understatedTaxShortfallZAR
      )}. Penalty Reduced from ${newDossier.standardAuditPenaltyPercentage}% to 0% (Saved ${formatZAR(
        newDossier.penaltySavedZAR
      )}). Criminal immunity invoked under TAA §229.`,
      'info'
    );

    setShowCreateModal(false);
    setOversightTitle('');
    setOversightDesc('');
    showBanner(`🛡️ Proactive Disclosure #${newDossier.vdpRefNumber} drafted! Saved ${formatZAR(newDossier.penaltySavedZAR)} in penalties.`);
  };

  // Sign and Submit VDP Dossier to SARS
  const handleSignAndSubmitVdp = (id: string) => {
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role ${currentUserRole} cannot submit statutory disclosures.`);
      return;
    }

    setDossiers(prev =>
      prev.map(d => {
        if (d.id === id) {
          const updated: VdpApplicationDossier = {
            ...d,
            status: 'SUBMITTED_TO_SARS',
            submittedAt: new Date().toISOString().substring(0, 10),
            signedOffByRole: currentUserRole
          };
          addAuditLog(
            'VDP_SUBMITTED_TO_SARS',
            `Submitted Proactive Voluntary Disclosure #${d.vdpRefNumber} to SARS VDP Unit. Shortfall: ${formatZAR(
              d.understatedTaxShortfallZAR
            )}. Signed off by ${currentUserRole}.`,
            'info'
          );
          return updated;
        }
        return d;
      })
    );

    if (inspectingDossier && inspectingDossier.id === id) {
      setInspectingDossier(prev => (prev ? { ...prev, status: 'SUBMITTED_TO_SARS', signedOffByRole: currentUserRole } : null));
    }

    showBanner('🚀 Proactive Disclosure successfully dispatched to SARS VDP Unit!');
  };

  const handleDownloadVdpDossier = (dossier: VdpApplicationDossier) => {
    if (!checkPermission('canDownloadLedger')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" is not authorized to export VDP application dossiers. Requires Owner, Accountant, or Auditor.`);
      return;
    }

    const timestamp = new Date().toISOString();
    const submissionRef = dossier.vdpRefNumber || `SARS-VDP01-${Date.now().toString(36).toUpperCase()}`;
    const companyName = profile?.name || 'Ilitha Fintech Operations (Pty) Ltd';
    const taxNumber = profile?.sarsTaxNumber || '9304318273';

    const content = [
      '=========================================================================',
      'REPUBLIC OF SOUTH AFRICA - TAX ADMINISTRATION ACT 28 OF 2011 (TAA)',
      'CHAPTER 16 - PART B: VOLUNTARY DISCLOSURE PROGRAMME (SECTIONS 225-233)',
      'FORM VDP01: STATUTORY VOLUNTARY DISCLOSURE APPLICATION DOSSIER',
      `APPLICATION REFERENCE: ${submissionRef}`,
      `DATE OF APPLICATION: ${dossier.submittedAt || timestamp.substring(0, 10)}`,
      `TAXPAYER LEGAL ENTITY: ${companyName}`,
      `SARS TAX REFERENCE NUMBER: ${taxNumber}`,
      '=========================================================================',
      '',
      '1. DETAILS OF DISCLOSED DEFAULT (TAA §227(c)):',
      `   Oversight / Issue Title: ${dossier.oversightTitle}`,
      `   Default Classification: ${dossier.category}`,
      `   Statutory Provision Impacted: ${dossier.statutoryReference}`,
      `   Factual Circumstances: ${dossier.oversightDescription}`,
      '',
      '2. QUANTIFICATION OF TAX SHORTFALL & STATUTORY RELIEF:',
      `   Principal Tax Shortfall: ${formatZAR(dossier.understatedTaxShortfallZAR)}`,
      `   Standard Audit Understatement Penalty (${dossier.standardAuditPenaltyPercentage}% / Gross Negligence): ${formatZAR(dossier.standardAuditPenaltyAmountZAR)}`,
      `   VDP Mitigated Understatement Penalty (0% Relief under §229(a)): R0.00`,
      `   Prescribed Section 89quat Interest (11.75% per annum): ${formatZAR(dossier.estimated89quatInterestZAR)}`,
      `   Total Net Settlement Due to SARS: ${formatZAR(dossier.understatedTaxShortfallZAR + dossier.estimated89quatInterestZAR)}`,
      `   Net Monetary Savings Gained by Taxpayer: ${formatZAR(dossier.penaltySavedZAR)}`,
      '',
      '3. CRIMINAL PROSECUTION IMMUNITY ASSERTION (TAA §229(b)):',
      '   "In terms of Section 229(b) of the Tax Administration Act, upon conclusion of this Voluntary',
      '   Disclosure Agreement, the Commissioner must not pursue criminal prosecution for any statutory',
      '   offence under a tax Act arising from the default disclosed herein."',
      '',
      '4. REMEDIATION & INTERNAL CONTROL SAFEGUARDS (TAA §227(b)):',
      `   Action Plan: ${dossier.remediationPlan}`,
      `   System Rectification: Contemporaneous audit logging and automated compliance gating active.`,
      '',
      '5. REPRESENTATIVE DECLARATION & STATUTORY SIGN-OFF:',
      `   Authorized Signatory Role: ${dossier.signedOffByRole || currentUserRole}`,
      `   Status: ${dossier.status}`,
      `   Audit Reference: SARS-VDP-EXEC-${submissionRef}`,
      '',
      '=========================================================================',
      'PREPARED BY: ZAtax Compliance Advisor • Statutory VDP Compliance Engine'
    ].join('\n');

    downloadBlobFile(
      `SARS_VDP01_Application_${submissionRef}.txt`,
      content,
      'text/plain;charset=utf-8;'
    );

    addAuditLog(
      'VDP_DOSSIER_DOWNLOADED',
      `Exported formal SARS Form VDP01 Voluntary Disclosure Dossier (${submissionRef}) for ${dossier.oversightTitle}. Net penalty relief: ${formatZAR(dossier.penaltySavedZAR)}.`,
      'info'
    );
    showBanner(`📥 Form VDP01 Application (${submissionRef}) downloaded!`);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="sars-vdp-center">
      
      {/* 1. TOP STATUTORY & STATUTORY BENEFIT HERO */}
      <div className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-indigo-950/60 border border-teal-500/30 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                  VOLUNTARY DISCLOSURE PROGRAMME (VDP)
                </span>
                <span className="text-[10.5px] font-mono text-cyan-300 font-bold">
                  TAA Chapter 16 Part B • Sections 225–233
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white tracking-wide mt-0.5">
                Proactive Voluntary Disclosure & Penalty Elimination Engine
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Proactively Disclose an Oversight</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-teal-200/90 leading-relaxed">
          <strong>Oversight Protection Mechanism:</strong> If you identify an error, unallowable deduction, or omitted income in your accounts, disclosing it proactively <em>before</em> SARS issues a notice of audit entitles you to statutory relief under <strong>Section 229 of the Tax Administration Act</strong>:
        </p>

        {/* 3 Pillars of Statutory Relief */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3 bg-black/40 border border-teal-500/30 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-teal-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Understatement Penalty Relief</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Reduces Section 222 penalties from <strong>50% (Gross Negligence)</strong> or <strong>25%</strong> directly to <strong>0%</strong> (Column 3 of TAA §223 table).
            </p>
          </div>

          <div className="p-3 bg-black/40 border border-teal-500/30 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-teal-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Criminal Prosecution Immunity</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Section 229(b) guarantees SARS will not pursue criminal prosecution for statutory tax offences related to disclosed defaults.
            </p>
          </div>

          <div className="p-3 bg-black/40 border border-teal-500/30 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-teal-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Principal Shortfall + Interest Only</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Taxpayer settles solely the actual tax shortfall and prescribed Section 89quat interest, avoiding punitive administrative fines.
            </p>
          </div>
        </div>

        <div className="pt-1 text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-white/10">
          <span>Pre-Audit Condition: Voluntary disclosure must be lodged prior to receipt of SARS audit notification (TAA §227(a)).</span>
          <span className="text-amber-300 font-bold">Acting as: {currentUserRole}</span>
        </div>
      </div>

      {/* 2. AGGREGATED VDP METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Shortfalls Disclosed</span>
            <DollarSign className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {formatZAR(totalShortfallsDisclosed)}
          </div>
          <div className="text-[10.5px] text-slate-400 font-mono">
            {dossiers.length} Proactive Disclosures Logged
          </div>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
            <span>Penalties Eliminated (Saved)</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300">
            {formatZAR(totalPenaltiesEliminated)}
          </div>
          <div className="text-[10.5px] text-emerald-400/80 font-mono font-bold">
            100% Understatement Relief Gained
          </div>
        </div>

        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Section 89quat Interest</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-300">
            {formatZAR(totalInterestPayable)}
          </div>
          <div className="text-[10.5px] text-slate-400 font-mono">
            11.75% Prescribed Rate Settled
          </div>
        </div>

        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Criminal Immunity Status</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-sm font-bold font-mono text-cyan-300 mt-1">
            IMMUNITY ACTIVE
          </div>
          <div className="text-[10.5px] text-slate-400 font-mono">
            Protected under TAA Section 229(b)
          </div>
        </div>

      </div>

      {/* 3. DOSSIERS LIST TABLE */}
      <div className="bg-[#0D1527] border border-white/10 rounded-3xl p-6 space-y-5">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Proactive Voluntary Disclosures Ledger ({dossiers.length} Records)
            </h3>
          </div>

          <span className="text-[10.5px] font-mono text-slate-400">
            Protective filings under Tax Administration Act Chapter 16
          </span>
        </div>

        <div className="space-y-3">
          {dossiers.map(dossier => (
            <div
              key={dossier.id}
              className="p-4 bg-slate-950/70 border border-white/10 rounded-2xl space-y-3 hover:border-teal-500/30 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{dossier.oversightTitle}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-bold">
                    {dossier.vdpRefNumber}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {dossier.taxPeriod}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                    dossier.status === 'VDP_AGREEMENT_SIGNED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : dossier.status === 'SUBMITTED_TO_SARS'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {dossier.status.replace(/_/g, ' ')}
                  </span>

                  <button
                    onClick={() => handleDownloadVdpDossier(dossier)}
                    className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/20 transition cursor-pointer flex items-center gap-1"
                    title="Download SARS Form VDP01 Application Dossier"
                    id={`download-vdp-dossier-${dossier.id}`}
                  >
                    <Download className="w-3 h-3 text-teal-400" />
                    <span>Download VDP01</span>
                  </button>

                  <button
                    onClick={() => setInspectingDossier(dossier)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>View Dossier</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                {dossier.oversightDescription}
              </p>

              {/* Financial Mitigation Comparison Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-black/40 p-3 rounded-xl border border-white/5 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Disclosed Shortfall</span>
                  <span className="font-bold text-white">{formatZAR(dossier.understatedTaxShortfallZAR)}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Audit Penalty (Without VDP)</span>
                  <span className="font-bold text-rose-400 line-through">
                    {formatZAR(dossier.standardAuditPenaltyAmountZAR)} ({dossier.standardAuditPenaltyPercentage}%)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Mitigated VDP Penalty</span>
                  <span className="font-bold text-emerald-400">
                    R0.00 (0% Under TAA §229)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-emerald-300 uppercase block font-bold">Penalties Saved</span>
                  <span className="font-bold text-emerald-300 text-sm">
                    +{formatZAR(dossier.penaltySavedZAR)}
                  </span>
                </div>
              </div>

              {/* Remediation & Audit Signoff */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-slate-400 pt-1 border-t border-white/5 font-mono">
                <span className="truncate max-w-lg">
                  Remediation: {dossier.remediationPlan}
                </span>

                {dossier.signedOffByRole && (
                  <span className="text-cyan-300 font-bold">
                    Signed by: {dossier.signedOffByRole} ({dossier.submittedAt})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* 4. MODAL: DRAFT NEW PROACTIVE DISCLOSURE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-teal-500/40 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-teal-500/20 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Draft Proactive Voluntary Disclosure (VDP01)</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Tax Administration Act Sections 225–233</p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVdp} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                    Oversight Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value="DUAL_USE_UNAPPORTIONED">Dual-Use / Private Expense Claim (Section 23(g))</option>
                    <option value="UNCLAIMABLE_DEDUCTION">Entertainment / Unallowable Deduction (Section 23(c))</option>
                    <option value="VAT_OUTPUT_UNDERPAYMENT">Unpaid Output VAT (VAT Act Section 7(1)(a))</option>
                    <option value="OMITTED_INCOME">Omitted Consulting or Trading Income</option>
                    <option value="PAYE_WITHHOLDING_ERROR">PAYE Withholding Understatement</option>
                    <option value="FOREIGN_INCOME_OMISSION">Foreign Remuneration / Investment Income</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                    Understated Tax Shortfall (ZAR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-mono">R</span>
                    <input
                      type="number"
                      step="100"
                      value={shortfallStr}
                      onChange={(e) => setShortfallStr(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-white/15 rounded-xl pl-8 pr-3 py-2 font-mono text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                  Oversight Summary / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unintentional Claim of Private Telephone & Fuel Without Apportionment"
                  value={oversightTitle}
                  onChange={(e) => setOversightTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                  Detailed Explanation of the Default
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain how the accounting oversight occurred and that it was identified through internal review before any audit contact from SARS..."
                  value={oversightDesc}
                  onChange={(e) => setOversightDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Standard Penalty Assessment Level */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-300">
                    Standard Audit Penalty Avoided: <strong className="text-rose-400 font-mono">{standardPenaltyPct}%</strong>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    VDP Mitigated Penalty: 0%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="15"
                  value={standardPenaltyPct}
                  onChange={(e) => setStandardPenaltyPct(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>10% (Substantial)</span>
                  <span>25% (No Grounds)</span>
                  <span>50% (Gross Negligence)</span>
                  <span>100% (Intentional)</span>
                </div>
              </div>

              {/* Real-Time Live Savings Comparison Box */}
              <div className="p-4 bg-teal-950/30 border border-teal-500/30 rounded-2xl grid grid-cols-3 gap-3 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Tax Shortfall to Repay</span>
                  <span className="text-sm font-bold text-white">{formatZAR(liveMitigation.taxShortfallZAR)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Audit Penalty Avoided</span>
                  <span className="text-sm font-bold text-rose-400 line-through">
                    {formatZAR(liveMitigation.standardPenaltyAmountZAR)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-300 uppercase block font-bold">Direct Penalty Saved</span>
                  <span className="text-base font-black text-emerald-300">
                    +{formatZAR(liveMitigation.penaltySavingsZAR)}
                  </span>
                </div>
              </div>

              {/* Section 227 Eligibility Confirmation */}
              <div className="p-3 bg-slate-950 border border-white/10 rounded-xl space-y-1.5 text-[11px] text-slate-300">
                <span className="font-bold text-white uppercase tracking-wider block font-mono text-[10px]">
                  TAA Section 227 Statutory Checklist Confirmation:
                </span>
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Disclosure is voluntary — no prior notification of an audit received from SARS.</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Disclosure is full and complete in all material respects.</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Taxpayer agrees to pay the outstanding tax shortfall plus Section 89quat interest.</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold transition cursor-pointer shadow-lg shadow-teal-600/20"
                >
                  Confirm & Generate Proactive VDP Dossier
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: VIEW FORMAL VDP AGREEMENT DOSSIER */}
      {inspectingDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-teal-500/40 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-teal-500/20 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">SARS Voluntary Disclosure Agreement</h3>
                  <p className="text-[11px] text-teal-300 font-mono">Dossier #{inspectingDossier.vdpRefNumber}</p>
                </div>
              </div>

              <button
                onClick={() => setInspectingDossier(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORMAL STATUTORY DOSSIER VIEW */}
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-2 font-mono">
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-slate-400">Taxpayer Legal Name:</span>
                  <span className="text-white font-bold">{inspectingDossier.taxpayerName}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-slate-400">SARS Tax Reference:</span>
                  <span className="text-white font-bold">{inspectingDossier.taxReferenceNumber}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-slate-400">Defaulting Tax Period:</span>
                  <span className="text-white">{inspectingDossier.taxPeriod}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-slate-400">Statutory Governing Authority:</span>
                  <span className="text-teal-300 font-bold">Tax Administration Act No. 28 of 2011 §225–§233</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-2">
                <span className="font-bold text-white block uppercase tracking-wider text-[11px]">
                  Factual Particulars of the Disclosed Oversight
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {inspectingDossier.oversightDescription}
                </p>
                <div className="pt-2 text-[10.5px] font-mono text-cyan-300">
                  Remediation Action: {inspectingDossier.remediationPlan}
                </div>
              </div>

              {/* STATUTORY RELIEF BREAKDOWN */}
              <div className="p-4 bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 rounded-2xl space-y-2">
                <span className="font-bold text-emerald-300 block uppercase tracking-wider text-[11px]">
                  Granted Statutory Relief (TAA Section 229)
                </span>
                <div className="grid grid-cols-2 gap-3 font-mono text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Understatement Penalty:</span>
                    <span className="font-bold text-emerald-300">
                      0% (100% RELIEF WAIVED BY SARS)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Criminal Prosecution:</span>
                    <span className="font-bold text-cyan-300">
                      STATUTORY IMMUNITY GRANTED (§229(b))
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Principal Shortfall Payable:</span>
                    <span className="font-bold text-white">
                      {formatZAR(inspectingDossier.understatedTaxShortfallZAR)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Net Cash Penalty Saved:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      +{formatZAR(inspectingDossier.penaltySavedZAR)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-[11px] font-mono text-slate-400">
                Status: <strong className="text-white">{inspectingDossier.status}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectingDossier(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>

                {inspectingDossier.status === 'DRAFT' && (
                  <button
                    onClick={() => handleSignAndSubmitVdp(inspectingDossier.id)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sign Off & Submit to SARS VDP</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGULATORY SIMULATION DISCLAIMER */}
      <div className="bg-slate-950/60 border border-teal-500/20 rounded-2xl p-4 text-[11px] text-slate-400 font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <span>Simulated Regulatory Model: Direct electronic filing through SARS VDP API Gateway is simulated pending formal statutory accreditation and digital certificate approval.</span>
        <span className="text-teal-400 font-bold shrink-0">TAA §225–233 Protected Mode</span>
      </div>

    </div>
  );
};

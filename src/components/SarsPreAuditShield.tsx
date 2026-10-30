import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Scale,
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Download,
  Sparkles,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Car,
  Receipt,
  Eye,
  Trash2,
  RefreshCw,
  FileWarning,
  Tag,
  Sliders
} from 'lucide-react';
import {
  TaxTransaction,
  UserTaxProfile,
  PendingBankTransaction,
  RoleType,
  TransactionPreAuditResult,
  SarsRiskSeverity,
  CategorizationRule
} from '../types';
import {
  auditTransaction,
  batchAuditLedger,
  LedgerAuditSummary
} from '../utils/sarsPreAuditEngine';
import { formatZAR } from '../utils/taxCalculations';
import { ImmediatePreAuditModal } from './ImmediatePreAuditModal';
import { downloadBlobFile } from '../utils/systemBridge';
import {
  suggestCategoryForPendingTransaction,
  batchSuggestCategories
} from '../utils/automatedTaggingEngine';

interface SarsPreAuditShieldProps {
  transactions: TaxTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<TaxTransaction[]>>;
  pendingTransactions: PendingBankTransaction[];
  setPendingTransactions: React.Dispatch<React.SetStateAction<PendingBankTransaction[]>>;
  profile: UserTaxProfile;
  currentUserRole: RoleType;
  checkPermission: (action: string) => boolean;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  categorizationRules?: CategorizationRule[];
  onNavigateToVdp?: (oversight?: {
    title: string;
    desc?: string;
    category?: any;
    shortfall?: number;
    standardPenaltyPct?: number;
  }) => void;
}

export const SarsPreAuditShield: React.FC<SarsPreAuditShieldProps> = ({
  transactions,
  setTransactions,
  pendingTransactions,
  setPendingTransactions,
  profile,
  currentUserRole,
  checkPermission,
  addAuditLog,
  showBanner,
  categorizationRules = [],
  onNavigateToVdp
}) => {
  // 1. Interactive Transaction Feed Form State
  const [desc, setDesc] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [type, setType] = useState<'expense' | 'income' | 'asset'>('expense');
  const [category, setCategory] = useState<string>('Travel & Transport');
  const [vatIncluded, setVatIncluded] = useState<boolean>(profile.vatRegistered);
  const [deductiblePercent, setDeductiblePercent] = useState<number>(100);
  const [hasLogbookAttached, setHasLogbookAttached] = useState<boolean>(true);
  const [hasPurchaseAgreement, setHasPurchaseAgreement] = useState<boolean>(true);

  // 2. Filter & Search State
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 3. Modal State for Detailed Pre-Audit Report
  const [modalAuditResult, setModalAuditResult] = useState<TransactionPreAuditResult | null>(null);
  const [modalTx, setModalTx] = useState<Partial<TaxTransaction> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Vault mock documents array
  const vaultDocs = useMemo(() => {
    const docs = [];
    if (hasLogbookAttached) docs.push('LOGBOOK_789');
    if (hasPurchaseAgreement) docs.push('VEHICLE_PURCHASE_AGREEMENT');
    return docs;
  }, [hasLogbookAttached, hasPurchaseAgreement]);

  // Real-time live pre-audit evaluation for the input form
  const liveFormAudit = useMemo(() => {
    const amt = parseFloat(amountStr) || 0;
    const tempTx: Partial<TaxTransaction> = {
      description: desc || 'Prospective Entry',
      amount: amt,
      type,
      category,
      vatIncluded,
      deductiblePercentage: deductiblePercent,
      isDeductible: deductiblePercent > 0
    };
    return auditTransaction(tempTx, profile, vaultDocs);
  }, [desc, amountStr, type, category, vatIncluded, deductiblePercent, profile, vaultDocs]);

  // Batch audit of all ledger transactions
  const { results: ledgerAuditMap, summary: auditSummary } = useMemo(() => {
    return batchAuditLedger(transactions, profile, ['LOGBOOK_789', 'VEHICLE_PURCHASE_AGREEMENT']);
  }, [transactions, profile]);

  // Automated Tagging Engine: Suggest categories using keyword matching against historical ledger and user rules
  const taggingSuggestions = useMemo(() => {
    return batchSuggestCategories(pendingTransactions, transactions, [], categorizationRules);
  }, [pendingTransactions, transactions, categorizationRules]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const audit = ledgerAuditMap[tx.id];
      if (!audit) return true;

      // Filter by severity
      if (filterSeverity === 'HIGH_CRITICAL') {
        if (audit.overallRisk !== 'HIGH_EXPOSURE' && audit.overallRisk !== 'CRITICAL_DISALLOWANCE') return false;
      } else if (filterSeverity === 'DISALLOWED_ONLY') {
        if (audit.projectedDisallowedAmountZAR <= 0) return false;
      } else if (filterSeverity === 'TRAVEL_4015') {
        if (!audit.sourceCodeAffected.includes('4015')) return false;
      } else if (filterSeverity === 'ENTERTAIN_4016') {
        if (!audit.sourceCodeAffected.includes('4016')) return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tx.description.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          audit.sourceCodeAffected.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [transactions, ledgerAuditMap, filterSeverity, searchQuery]);

  // Submit and Audit Transaction immediately
  const handleFeedTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role ${currentUserRole} cannot add transactions.`);
      return;
    }

    const amt = parseFloat(amountStr);
    if (isNaN(amt) || amt <= 0) {
      showBanner('⚠️ Please enter a valid transaction amount.');
      return;
    }

    const calculatedVat = vatIncluded ? Number(((amt * 15) / 115).toFixed(2)) : 0;
    const prospectiveTx: TaxTransaction = {
      id: `TX-AUDIT-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      description: desc || 'Uncategorized expense',
      amount: amt,
      type,
      category,
      vatIncluded,
      vatAmount: calculatedVat,
      sarsSection: liveFormAudit.ruleCitation,
      isDeductible: deductiblePercent > 0,
      deductiblePercentage: deductiblePercent,
      taxPositionImpactZAR: type === 'income' ? amt * profile.taxBracketRate : -((amt * deductiblePercent) / 100) * profile.taxBracketRate,
      explanation: `Captured via SARS Pre-Audit Shield. Source code: ${liveFormAudit.sourceCodeAffected}.`,
      status: liveFormAudit.overallRisk === 'CRITICAL_DISALLOWANCE' ? 'flagged_mixed_use' : 'classified'
    };

    // Open immediate pre-audit report modal so user inspects negative implications immediately!
    setModalTx(prospectiveTx);
    setModalAuditResult(liveFormAudit);
    setIsModalOpen(true);
  };

  // Commit transaction to ledger from modal
  const handleConfirmAddToLedger = (adjustedTx?: Partial<TaxTransaction>) => {
    const finalTx = (adjustedTx ? { ...modalTx, ...adjustedTx } : modalTx) as TaxTransaction;
    setTransactions(prev => [finalTx, ...prev]);

    const audit = auditTransaction(finalTx, profile, vaultDocs);
    addAuditLog(
      'TRANSACTION_PRE_AUDITED',
      `Fed ${finalTx.description} (${formatZAR(finalTx.amount)}). Risk: ${audit.overallRisk}. SARS Exposure: ${formatZAR(audit.totalPotentialSarsExposureZAR)}. TAA §222: ${audit.understatementPenaltyPercentage}%.`,
      audit.overallRisk === 'CRITICAL_DISALLOWANCE' ? 'warn' : 'info'
    );

    setIsModalOpen(false);
    setDesc('');
    setAmountStr('');

    if (audit.overallRisk === 'CRITICAL_DISALLOWANCE') {
      showBanner(`⚠️ Added to ledger with Critical SARS Disallowance Warning (${formatZAR(audit.totalPotentialSarsExposureZAR)} exposure).`);
    } else {
      showBanner(`✅ Transaction audited & committed to ledger (${audit.overallRisk})!`);
    }
  };

  // Audit and ingest pending bank transaction using intelligent category suggestion
  const handleAuditPendingItem = (item: PendingBankTransaction, categoryOverride?: string) => {
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role ${currentUserRole} cannot ingest transactions.`);
      return;
    }

    const suggestion = taggingSuggestions.get(item.id) || suggestCategoryForPendingTransaction(item, transactions, [], categorizationRules);
    const finalCategory = categoryOverride || suggestion.category;
    const finalType = suggestion.suggestedType;
    const finalSection = suggestion.sarsSection;
    const finalDeductible = item.suggestedAction === 'mixed_use_split' ? 80 : suggestion.suggestedDeductiblePercentage;

    const prospectiveTx: TaxTransaction = {
      id: `TX-BANK-${Date.now()}`,
      date: item.date,
      description: item.rawMerchant,
      amount: item.amount,
      type: finalType,
      category: finalCategory,
      vatIncluded: profile.vatRegistered && finalType === 'expense',
      vatAmount: profile.vatRegistered && finalType === 'expense' ? Number(((item.amount * 15) / 115).toFixed(2)) : 0,
      sarsSection: finalSection,
      isDeductible: finalType === 'expense' || finalType === 'asset',
      deductiblePercentage: finalDeductible,
      taxPositionImpactZAR: finalType === 'income' 
        ? item.amount * profile.taxBracketRate 
        : -item.amount * profile.taxBracketRate * (finalDeductible / 100),
      explanation: `${suggestion.explanation} (Ingested from pending bank feed).`,
      status: 'classified'
    };

    const auditRes = auditTransaction(prospectiveTx, profile, vaultDocs);
    setModalTx(prospectiveTx);
    setModalAuditResult(auditRes);
    setIsModalOpen(true);

    // Remove from pending feed
    setPendingTransactions(prev => prev.filter(p => p.id !== item.id));
  };

  // Delete transaction with strictly demarcated role check
  const handleDeleteTransaction = (id: string, description: string) => {
    if (!checkPermission('canDeleteTransactions')) {
      showBanner(`⛔ Access Denied: Role ${currentUserRole} is not authorized to delete transactions. Requires Owner or Accountant.`);
      return;
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
    addAuditLog('TRANSACTION_DELETED', `Deleted transaction "${description}" from compliance ledger by ${currentUserRole}.`, 'warn');
    showBanner(`🗑️ Deleted transaction "${description}".`);
  };

  // Export SARS Pre-Audit Defense File with role check
  const handleExportDefenseFile = () => {
    if (!checkPermission('canDownloadLedger')) {
      showBanner(`⛔ Access Denied: Role ${currentUserRole} is not authorized to download ledger defense packs. Requires Owner, Accountant, or Auditor.`);
      return;
    }
    const timestamp = new Date().toISOString();
    const submissionRef = `SARS-DEFENSE-${Date.now().toString(36).toUpperCase()}`;
    const headerLines = [
      '# =====================================================================',
      '# SARS PRE-AUDIT DEFENSE DOSSIER (TAA §222 & SECTION 11(a) COMPLIANT)',
      `# SUBMISSION REFERENCE: ${submissionRef}`,
      `# EXPORT TIMESTAMP: ${timestamp}`,
      `# TAXPAYER: ${profile.name} (Tax Ref: ${profile.sarsTaxNumber || '9304318273'})`,
      `# PRE-AUDIT EXPOSURE ASSESSED: ${formatZAR(auditSummary.totalNetSarsExposureZAR)}`,
      `# COMPLIANCE RATIO: ${auditSummary.cleanTransactionsCount}/${transactions.length} (${Math.round((auditSummary.cleanTransactionsCount / Math.max(1, transactions.length)) * 100)}%)`,
      '# =====================================================================',
      '',
      'TRANSACTION_ID,DATE,DESCRIPTION,AMOUNT_ZAR,CATEGORY,DEDUCTIBLE_PCT,SARS_SECTION,STATUS,AUDIT_VERDICT'
    ];

    const dataLines = transactions.map(tx => {
      const audit = auditTransaction(tx, profile);
      return [
        `"${tx.id}"`,
        `"${tx.date}"`,
        `"${tx.description.replace(/"/g, '""')}"`,
        tx.amount,
        `"${tx.category}"`,
        tx.deductiblePercentage,
        `"${tx.sarsSection}"`,
        `"${tx.status}"`,
        `"${audit.overallRisk} RISK (Score: ${audit.riskScore})"`
      ].join(',');
    });

    const csvContent = [...headerLines, ...dataLines].join('\n');
    downloadBlobFile(
      `SARS_PreAudit_Defense_${submissionRef}.csv`,
      csvContent,
      'text/csv;charset=utf-8;'
    );

    addAuditLog(
      'PRE_AUDIT_DOSSIER_DOWNLOADED',
      `Generated & downloaded SARS Pre-Audit Defense File (${submissionRef}) covering ${transactions.length} ledger transactions. Exposure assessed: ${formatZAR(auditSummary.totalNetSarsExposureZAR)}.`
    );
    showBanner(`📄 Downloaded SARS Pre-Audit Defense File (${submissionRef}).`);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="sars-pre-audit-shield">
      
      {/* 1. TOP SIMULATION & STATUTORY DISCLAIMER BANNER */}
      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-cyan-500/15 border border-amber-500/30 rounded-3xl p-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  REAL-TIME PRE-EMPTIVE AUDIT ENGINE
                </span>
                <span className="text-[10.5px] font-mono text-cyan-300 font-bold">
                  TAA Rule 7 • Section 222
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white tracking-wide mt-0.5">
                SARS Pre-Audit Shield & Exposure Assessment
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDefenseFile}
              className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Pre-Audit Defense Dossier</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-amber-200/90 leading-relaxed pt-1">
          <strong>Pre-Emptive Protection:</strong> This engine audits every transaction the moment it is fed into the system, detecting high-risk disallowance triggers (such as Source Code 4015 travel write-backs to R0, Section 23(g) private consumption, and Section 17(2) entertainment denials) and quantifying financial penalties (TAA §222 understatement penalties and §89quat interest) <em>before</em> SARS initiates an audit on the client&apos;s account.
        </p>

        {/* EXPLICIT SEPARATION FROM WAR ROOM */}
        <div className="p-3 bg-black/40 border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Kept Strictly Separate from the War Room:</strong> Pre-Audit operates continuously during transaction recording to defend your books and prevent disallowances. The <strong>Dispute War Room</strong> is an independent module used only after SARS issues an adverse Notice of Assessment (ITA34) or audit adjustment.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
            Pre-Filing Defense Only
          </span>
        </div>

        {/* PROACTIVE VOLUNTARY DISCLOSURE (VDP) INTEGRATION */}
        <div className="p-3 bg-teal-950/40 border border-teal-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[11px] text-teal-200">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              <strong>Identified an Internal Accounting Oversight?</strong> Proactively disclose any default or unapportioned expense claim under the <strong>SARS Voluntary Disclosure Programme (TAA §§225–233)</strong> <em>before</em> SARS conducts an audit to eliminate understatement penalties (reduced from up to 200% down to <strong>0%</strong>) and secure 100% criminal prosecution immunity.
            </span>
          </div>
          {onNavigateToVdp && (
            <button
              onClick={() => onNavigateToVdp()}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-teal-600/20"
            >
              <span>Launch Proactive VDP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="pt-1 text-[11px] text-slate-400 font-mono flex items-center gap-2 border-t border-white/10">
          <span className="text-amber-400">Notice:</span>
          <span>All ISV production gateway accreditations and formal statutory certifications are pending regulatory approval. System currently operates in simulation mode.</span>
        </div>
      </div>

      {/* 2. AGGREGATED SARS AUDIT EXPOSURE METRICS BENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Claimed Deductions</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {formatZAR(auditSummary.totalClaimedDeductionsZAR)}
          </div>
          <div className="text-[10.5px] text-slate-400 font-mono">
            {transactions.length} Ledger Items Audited
          </div>
        </div>

        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Projected SARS Disallowances</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg font-bold font-mono text-rose-400">
            {formatZAR(auditSummary.totalProjectedDisallowancesZAR)}
          </div>
          <div className="text-[10.5px] text-rose-400/80 font-mono">
            {auditSummary.criticalCount + auditSummary.highRiskCount} At-Risk Claims
          </div>
        </div>

        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Understatement Penalties (§222)</span>
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-400">
            {formatZAR(auditSummary.totalUnderstatementPenaltiesZAR)}
          </div>
          <div className="text-[10.5px] text-slate-400 font-mono">
            Up to 50% Gross Negligence
          </div>
        </div>

        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Statutory Interest (§89quat)</span>
            <Receipt className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-lg font-bold font-mono text-yellow-300">
            {formatZAR(auditSummary.totalInterestExposureZAR)}
          </div>
          <div className="text-[10.5px] text-slate-400 font-mono">
            11.75% Prescribed Rate
          </div>
        </div>

        <div className="bg-rose-950/20 border border-rose-500/40 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-rose-300 font-semibold">
            <span>Net SARS Exposure Risk</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-300">
            {formatZAR(auditSummary.totalNetSarsExposureZAR)}
          </div>
          <div className="text-[10.5px] text-rose-300/80 font-mono font-bold">
            Total Potential Assessment
          </div>
        </div>

      </div>

      {/* 3. TRANSACTION FEED & IMMEDIATE PRE-AUDIT WORKBENCH */}
      <div className="bg-[#0D1527] border border-white/10 rounded-3xl p-6 space-y-6">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Feed Transaction & Immediate Audit Engine
              </h3>
              <p className="text-xs text-slate-400">
                Inputs are evaluated in real-time as you type, calculating negative implications and disallowance risks before entry into the client&apos;s ledger.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Current Role:</span>
            <span className="text-[11px] font-mono font-bold text-amber-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
              {currentUserRole}
            </span>
          </div>
        </div>

        {/* FEED FORM WITH DUAL-COLUMN LIVE PREVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Form Inputs */}
          <form onSubmit={handleFeedTransaction} className="lg:col-span-7 space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                  Transaction Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="expense">Operating Expense (Section 11(a))</option>
                  <option value="income">Gross Professional Income (Section 1)</option>
                  <option value="asset">Capital Asset Allowance (Section 11(e) / 12BA)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                  Amount (ZAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">R</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 4850.00"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Travel & Transport">Travel & Transport (Source Code 4015)</option>
                  <option value="Meals & Entertainment">Meals & Entertainment (Source Code 4016)</option>
                  <option value="Telecommunications">Telecommunications & Fibre (Section 23(g))</option>
                  <option value="Computer & Office Equipment">Computer & Tech Equipment</option>
                  <option value="Solar & Renewable Energy">Solar & Renewable Energy (Section 12BA)</option>
                  <option value="Consulting Fees">Consulting & Professional Services</option>
                  <option value="General Supplies">General Office Supplies</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                  Description / Payee
                </label>
                <input
                  type="text"
                  placeholder="e.g. Uber Business Trips to Client Site or Woolworths Lunch"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Deductibility & Apportionment Controls */}
            {type !== 'income' && (
              <div className="p-3 bg-slate-950/60 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    Business Use Apportionment: <strong className="text-cyan-300 font-mono">{deductiblePercent}%</strong>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Personal Portion: {100 - deductiblePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={deductiblePercent}
                  onChange={(e) => setDeductiblePercent(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0% (Non-deductible)</span>
                  <span>50%</span>
                  <span>80% (Safe Portioned)</span>
                  <span>100% (Strict Business)</span>
                </div>
              </div>
            )}

            {/* Vault Attachments Checkbox */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasLogbookAttached}
                  onChange={(e) => setHasLogbookAttached(e.target.checked)}
                  className="rounded border-white/20 accent-emerald-500"
                />
                <span className="font-mono text-[11px]">Logbook #789 Verified in Vault</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPurchaseAgreement}
                  onChange={(e) => setHasPurchaseAgreement(e.target.checked)}
                  className="rounded border-white/20 accent-emerald-500"
                />
                <span className="font-mono text-[11px]">Vehicle Purchase Agreement Attached</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Audit & Report Immediately (Feed to System)</span>
              </button>
            </div>

          </form>

          {/* Right Live Real-Time Pre-Audit Analysis Box */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Live Pre-Audit Diagnostic
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  liveFormAudit.overallRisk === 'CRITICAL_DISALLOWANCE'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : liveFormAudit.overallRisk === 'HIGH_EXPOSURE'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {liveFormAudit.overallRisk}
                </span>
              </div>

              {/* Exposure breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400 font-mono">Source Code:</span>
                  <span className="font-mono text-cyan-300 truncate max-w-[200px]">
                    {liveFormAudit.sourceCodeAffected}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400 font-mono">Projected Disallowance:</span>
                  <span className="font-mono text-rose-400 font-bold">
                    {formatZAR(liveFormAudit.projectedDisallowedAmountZAR)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400 font-mono">TAA §222 Penalty Exposure:</span>
                  <span className="font-mono text-amber-400">
                    {formatZAR(liveFormAudit.understatementPenaltyAmountZAR)} ({liveFormAudit.understatementPenaltyPercentage}%)
                  </span>
                </div>
                <div className="flex justify-between text-slate-300 border-t border-white/10 pt-2 font-bold">
                  <span className="text-white">Total Negative Implication:</span>
                  <span className="font-mono text-rose-300 text-sm">
                    {formatZAR(liveFormAudit.totalPotentialSarsExposureZAR)}
                  </span>
                </div>
              </div>

              {/* Warning preview */}
              {liveFormAudit.negativeImplications.length > 0 ? (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{liveFormAudit.negativeImplications[0].title}</span>
                  </div>
                  <p className="text-slate-300 text-[10.5px]">
                    {liveFormAudit.negativeImplications[0].description}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>No Immediate Red Flags</span>
                  </div>
                  <p className="text-slate-300 text-[10.5px]">
                    Claim satisfies Section 11(a). Corroborating documents verified in vault.
                  </p>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 font-mono text-center border-t border-white/5 pt-2">
              Submitting opens immediate detailed report modal before ledger commitment.
            </div>
          </div>

        </div>

      </div>

      {/* 4. PENDING BANK FEED QUEUE (AUDIT & INGEST IMMEDIATELY) */}
      {/* 4. PENDING BANK TRANSACTIONS INGESTION QUEUE WITH AUTOMATED TAGGING */}
      {pendingTransactions.length > 0 && (
        <div className="bg-[#0D1527] border border-white/10 rounded-3xl p-5 space-y-4" id="pending-bank-feed-queue">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Pending Bank Feed Queue ({pendingTransactions.length} Unaudited Items)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Automated Tagging Engine Active ({transactions.length} Historical Records Indexed)</span>
              </span>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {pendingTransactions.map(item => {
              const suggestion = taggingSuggestions.get(item.id) || suggestCategoryForPendingTransaction(item, transactions, [], categorizationRules);

              return (
                <div key={item.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:bg-white/[0.02] p-2 rounded-2xl transition">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm">{item.rawMerchant}</span>
                      <span className="text-[10px] font-mono text-slate-400">{item.date}</span>
                      <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                        item.type === 'credit' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {item.type}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.flagReason}</p>

                    {/* Automated Tag Suggestion Pill */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {suggestion.matchedByCustomRule ? (
                        <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 shadow-sm">
                          <Sliders className="w-3 h-3 text-indigo-400" />
                          <span>Rule Match: {suggestion.category}</span>
                          <span className="text-[9.5px] text-indigo-300/80">({suggestion.matchedRuleName || 'Custom Rule'})</span>
                        </span>
                      ) : (
                        <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-teal-400" />
                          <span>Suggested Tag: {suggestion.category}</span>
                          <span className="text-[9.5px] text-teal-400/80">({suggestion.confidencePercentage}%)</span>
                        </span>
                      )}

                      {suggestion.matchedKeywords.length > 0 && (
                        <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                          Pattern: {suggestion.matchedKeywords.join(', ')}
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-purple-300/80 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                        {suggestion.sarsSection}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
                    <span className="font-mono font-bold text-base text-cyan-300">
                      {formatZAR(item.amount)}
                    </span>

                    <button
                      onClick={() => handleAuditPendingItem(item, suggestion.category)}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition cursor-pointer flex items-center gap-1.5"
                      title={suggestion.explanation}
                      id={`accept-suggested-tag-btn-${item.id}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>Accept Tag & Pre-Audit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. FULL LEDGER PRE-AUDIT VULNERABILITY MATRIX */}
      <div className="bg-[#0D1527] border border-white/10 rounded-3xl p-5 space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Comprehensive Ledger SARS Audit Vulnerability Matrix
            </h3>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterSeverity('ALL')}
              className={`px-2.5 py-1 rounded-lg font-mono transition cursor-pointer ${
                filterSeverity === 'ALL'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setFilterSeverity('HIGH_CRITICAL')}
              className={`px-2.5 py-1 rounded-lg font-mono transition cursor-pointer ${
                filterSeverity === 'HIGH_CRITICAL'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              High/Critical Exposure ({auditSummary.highRiskCount + auditSummary.criticalCount})
            </button>
            <button
              onClick={() => setFilterSeverity('TRAVEL_4015')}
              className={`px-2.5 py-1 rounded-lg font-mono transition cursor-pointer ${
                filterSeverity === 'TRAVEL_4015'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              Source Code 4015 (Travel)
            </button>
            <button
              onClick={() => setFilterSeverity('ENTERTAIN_4016')}
              className={`px-2.5 py-1 rounded-lg font-mono transition cursor-pointer ${
                filterSeverity === 'ENTERTAIN_4016'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              Source Code 4016 (Entertainment)
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search ledger entries by description, merchant, or statutory source code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Table of Ledger Transactions with Live Audit Results */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10.5px] font-mono text-slate-400 uppercase">
                <th className="py-2.5 pl-2">Date & Description</th>
                <th className="py-2.5">Amount</th>
                <th className="py-2.5">SARS Source Code</th>
                <th className="py-2.5">SARS Pre-Audit Rating</th>
                <th className="py-2.5">Potential Disallowance</th>
                <th className="py-2.5">TAA §222 Penalty</th>
                <th className="py-2.5 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.length === 0 ? (
                <tr key="empty-tx-shield">
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No transactions match the selected filter or risk criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                const audit = ledgerAuditMap[tx.id] || auditTransaction(tx, profile, vaultDocs);
                return (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 pl-2 max-w-[220px]">
                      <div className="font-semibold text-white truncate">{tx.description}</div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span className="capitalize">{tx.category}</span>
                      </div>
                    </td>

                    <td className="py-3 font-mono font-bold">
                      <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}>
                        {formatZAR(tx.amount)}
                      </span>
                    </td>

                    <td className="py-3 font-mono text-[11px] text-amber-300">
                      {audit.sourceCodeAffected}
                    </td>

                    <td className="py-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold inline-flex items-center gap-1 ${
                        audit.overallRisk === 'CRITICAL_DISALLOWANCE'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : audit.overallRisk === 'HIGH_EXPOSURE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : audit.overallRisk === 'MEDIUM_RISK'
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {audit.overallRisk}
                      </span>
                    </td>

                    <td className="py-3 font-mono">
                      {audit.projectedDisallowedAmountZAR > 0 ? (
                        <span className="text-rose-400 font-bold">
                          {formatZAR(audit.projectedDisallowedAmountZAR)}
                        </span>
                      ) : (
                        <span className="text-emerald-400">R0 (Defensible)</span>
                      )}
                    </td>

                    <td className="py-3 font-mono text-xs">
                      {audit.understatementPenaltyAmountZAR > 0 ? (
                        <span className="text-amber-400">
                          {formatZAR(audit.understatementPenaltyAmountZAR)} ({audit.understatementPenaltyPercentage}%)
                        </span>
                      ) : (
                        <span className="text-slate-500">0%</span>
                      )}
                    </td>

                    <td className="py-3 text-right pr-2">
                      <div className="flex items-center justify-end gap-1.5">
                        {onNavigateToVdp && audit.understatementPenaltyAmountZAR > 0 && (
                          <button
                            onClick={() => onNavigateToVdp({
                              title: tx.description,
                              desc: `Pre-audit detected ${audit.negativeImplications.map(n => n.title).join(', ')} under ${audit.sourceCodeAffected}. Disclosed proactively to mitigate penalties.`,
                              category: tx.category === 'Entertainment' ? 'UNCLAIMABLE_DEDUCTION' : 'DUAL_USE_UNAPPORTIONED',
                              shortfall: audit.projectedDisallowedAmountZAR,
                              standardPenaltyPct: audit.understatementPenaltyPercentage || 50
                            })}
                            className="p-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 transition cursor-pointer"
                            title="Proactively disclose this oversight under TAA §227 (Reduces penalty to 0%)"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setModalTx(tx);
                            setModalAuditResult(audit);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-cyan-300 transition cursor-pointer"
                          title="Inspect detailed pre-audit report and negative implications"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(tx.id, tx.description)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* 6. IMMEDIATE PRE-AUDIT MODAL FOR INSPECTING ANY TRANSACTION */}
      <ImmediatePreAuditModal
        auditResult={modalAuditResult}
        transaction={modalTx}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirmAddToLedger={handleConfirmAddToLedger}
        currentUserRole={currentUserRole}
        showBanner={showBanner}
        onInitiateVdp={(tx, audit) => {
          setIsModalOpen(false);
          if (onNavigateToVdp) {
            onNavigateToVdp({
              title: tx.description || 'Pre-Audit Oversight',
              desc: `Proactive disclosure: ${audit.negativeImplications.map(n => n.description).join('; ')}`,
              category: tx.category === 'Entertainment' ? 'UNCLAIMABLE_DEDUCTION' : 'DUAL_USE_UNAPPORTIONED',
              shortfall: audit.projectedDisallowedAmountZAR,
              standardPenaltyPct: audit.understatementPenaltyPercentage || 50
            });
          }
        }}
      />

    </div>
  );
};

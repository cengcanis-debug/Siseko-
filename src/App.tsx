import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Rocket,
  Car,
  Receipt,
  FileText,
  Scale,
  Building2,
  Bot,
  Users,
  Coins,
  Server,
  Activity,
  HeartHandshake,
  PiggyBank,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
  Award,
  KeyRound,
  Sparkles,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  Lock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Globe,
  Sliders,
  DollarSign,
  Layers,
  BrainCircuit,
  Zap,
  Briefcase
} from 'lucide-react';

import {
  UserTaxProfile,
  TaxTransaction,
  InvoiceRecord,
  BankAccount,
  PendingBankTransaction,
  RoleType,
  AppSession,
  AuditLogEntry,
  EntityProfile,
  TrustLoanAccount,
  CategorizationRule
} from './types';

import {
  initialTaxProfile,
  initialTransactions,
  initialInvoices,
  initialBankAccounts,
  pendingMixedUseFeed,
  initialCategorizationRules
} from './data/mockData';

import {
  formatZAR,
  generateLiveTaxSnapshot,
  calculateSANormalTax
} from './utils/taxCalculations';

import {
  createDefaultSession,
  generateTokenHex,
  getRoleScopes,
  isRoleAuthorized
} from './utils/sessionSecurity';

// High-fidelity Enhancement Module Components
import { Ita34AssessmentDecoder } from './components/Ita34AssessmentDecoder';
import { TravelLogbookCalculator } from './components/TravelLogbookCalculator';
import { TrustLoansCompliance } from './components/TrustLoansCompliance';
import { PboDonationsSection18A } from './components/PboDonationsSection18A';
import { EtiCalculatorPanel } from './components/EtiCalculatorPanel';
import { SbcAdvisoryWizard } from './components/SbcAdvisoryWizard';
import { TwoPotRetirementSimulator } from './components/TwoPotRetirementSimulator';
import { VatOcrScannerPanel } from './components/VatOcrScannerPanel';
import { AfsStatementsDrafter } from './components/AfsStatementsDrafter';
import { Phase17SubscriptionAndTravelAuditor } from './components/Phase17SubscriptionAndTravelAuditor';
import { Phase18DevOpsInfrastructure } from './components/Phase18DevOpsInfrastructure';
import { SarsSandboxReadinessHub } from './components/SarsSandboxReadinessHub';
import { SarsConnectDirectDiagnostic } from './components/SarsConnectDirectDiagnostic';
import { RealRepoHealthCheck } from './components/RealRepoHealthCheck';
import { BackendValidationErrorTracker } from './components/BackendValidationErrorTracker';
import TaxVisuals from './components/TaxVisuals';
import { TaxGamificationPanel } from './components/TaxGamificationPanel';
import { TaxLiteracyHub } from './components/TaxLiteracyHub';
import { SessionSecurityModal } from './components/SessionSecurityModal';
import { SarsPreAuditShield } from './components/SarsPreAuditShield';
import { ImmediatePreAuditModal } from './components/ImmediatePreAuditModal';
import { SarsAutoAssessmentPanel } from './components/SarsAutoAssessmentPanel';
import { StatutoryEnhancementsHub } from './components/StatutoryEnhancementsHub';
import { SarsVdpCenter } from './components/SarsVdpCenter';
import { SarsSterlingTradeTestingPanel } from './components/SarsSterlingTradeTestingPanel';
import { CategorizationRulesManager } from './components/CategorizationRulesManager';
import { VatFilingCenter } from './components/VatFilingCenter';
import { AiTaxDeductionsAdvisor } from './components/AiTaxDeductionsAdvisor';
import { AutomatedIntegratedSystemHub } from './components/AutomatedIntegratedSystemHub';
import { TaxProfessionalConnect } from './components/TaxProfessionalConnect';
import { Emp501InterimReconciliation } from './components/Emp501InterimReconciliation';
import { SarsAiTaxAssistant } from './components/SarsAiTaxAssistant';
import { GlobalAiChatbotWidget } from './components/GlobalAiChatbotWidget';
import { ProductionLaunchCockpit } from './components/ProductionLaunchCockpit';
import { auditTransaction } from './utils/sarsPreAuditEngine';
import { TransactionPreAuditResult } from './types';
import { systemBus, downloadBlobFile, generateSubmissionRef } from './utils/systemBridge';

type NavTab =
  | 'launch'
  | 'overview'
  | 'ai_assistant'
  | 'emp501_reconciliation'
  | 'tax_pro_connect'
  | 'integrated_system'
  | 'ai_deductions'
  | 'vat201_lodgement'
  | 'pre_audit_shield'
  | 'categorization_rules'
  | 'auto_assessment'
  | 'statutory_enhancements'
  | 'vdp_disclosure'
  | 'ita34_decoder'
  | 'logbook'
  | 'vat_invoices'
  | 'trust_loans'
  | 'sbc_wizard'
  | 'eti_calculator'
  | 'two_pot'
  | 'pbo_section18a'
  | 'afs_drafter'
  | 'phase17_auditor'
  | 'sandbox_hub'
  | 'sars_connect'
  | 'trade_testing'
  | 'devops_runway'
  | 'repo_health'
  | 'backend_errors'
  | 'literacy_hub'
  | 'gamification';

export default function App() {
  // 1. Core Profile & Role State
  const [profile, setProfile] = useState<UserTaxProfile>(initialTaxProfile);
  const [currentUserRole, setCurrentUserRole] = useState<RoleType>('Owner');

  const getInitialTab = (): NavTab => {
    if (typeof window !== 'undefined') {
      const path = (window.location.pathname || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();
      const search = (window.location.search || '').toLowerCase();
      if (path.includes('launch') || hash.includes('launch') || search.includes('launch')) {
        return 'launch';
      }
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<NavTab>(getInitialTab);

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.history) {
      if (tab === 'launch') {
        window.history.pushState(null, '', '/launch');
      } else if (window.location.pathname === '/launch') {
        window.history.pushState(null, '', '/');
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = (window.location.pathname || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();
      if (path.includes('launch') || hash.includes('launch')) {
        setActiveTab('launch');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Pre-Audit Modal State for Immediately Evaluating Fed Transactions
  const [preAuditModalOpen, setPreAuditModalOpen] = useState(false);
  const [preAuditModalTx, setPreAuditModalTx] = useState<Partial<TaxTransaction> | null>(null);
  const [preAuditModalResult, setPreAuditModalResult] = useState<TransactionPreAuditResult | null>(null);

  // Proactive Voluntary Disclosure (VDP) Prefill State
  const [vdpPrefillData, setVdpPrefillData] = useState<{
    title: string;
    desc?: string;
    category?: any;
    shortfall?: number;
    standardPenaltyPct?: number;
  } | null>(null);

  // 2. Financial Ledger State
  const [transactions, setTransactions] = useState<TaxTransaction[]>(initialTransactions);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(initialInvoices);
  const [bankAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [pendingTransactions, setPendingTransactions] = useState<PendingBankTransaction[]>(pendingMixedUseFeed);
  const [categorizationRules, setCategorizationRules] = useState<CategorizationRule[]>(initialCategorizationRules);

  // 3. Section 7C Trust Loans State
  const [trustLoans, setTrustLoans] = useState<TrustLoanAccount[]>([
    {
      id: 'TL-2026-001',
      lenderName: 'Ilitha Holdings (Lender)',
      trustName: 'Ilitha Enterprise Employee Trust',
      registrationNumber: 'IT-1842/2021',
      principalAmount: 1800000,
      interestRateCharged: 0,
      outstandingBalance: 1650000,
      officialRepoRate: 8.25,
      officialRateOfInterest: 9.25,
      annualDonationExemptionApplied: true,
      dateIssued: '2022-03-01',
      repaymentsAmountThisYear: 50000,
      exclusionReason: 'None'
    },
    {
      id: 'TL-2026-002',
      lenderName: 'Ilitha Fintech Operations (Pty) Ltd',
      trustName: 'Ilitha Technology Beneficiary Trust',
      registrationNumber: 'IT-9014/2024',
      principalAmount: 450000,
      interestRateCharged: 9.5,
      outstandingBalance: 420000,
      officialRepoRate: 8.25,
      officialRateOfInterest: 9.25,
      annualDonationExemptionApplied: false,
      dateIssued: '2024-05-15',
      repaymentsAmountThisYear: 30000,
      exclusionReason: 'Public Benefit Organisation'
    }
  ]);

  // 4. Cryptographic Session & Access Control
  const [session, setSession] = useState<AppSession>(() => createDefaultSession('Owner'));
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // 5. High-Fidelity Chronological Audit Log
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'LOG-INIT-001',
      timestamp: new Date().toISOString(),
      userId: 'USR-OWNER-01',
      userName: 'V Zenzile',
      userEmail: 'vzenzile@ilithafintech.co.za',
      userRole: 'Owner',
      action: 'SYSTEM_BOOTSTRAP',
      details: 'ZAtax Compliance Companion initialised. Directive8SafeRegister tracker active.'
    }
  ]);

  // 6. User Banner / Notification State
  const [banner, setBanner] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false
  });

  const showBanner = (msg: string) => {
    setBanner({ message: msg, visible: true });
    setTimeout(() => {
      setBanner(prev => ({ ...prev, visible: false }));
    }, 4500);
  };

  const addAuditLog = (
    action: string,
    details: string,
    _severity?: 'info' | 'warn' | 'crit'
  ) => {
    const newEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: session.userId,
      userName: session.userName,
      userEmail: session.userEmail,
      userRole: currentUserRole,
      action,
      details,
      ipAddress: session.ipAddress,
      sessionTokenMasked: `${session.token.substring(0, 8)}...${session.token.substring(56)}`
    };
    setAuditLogs(prev => [newEntry, ...prev.slice(0, 199)]);
  };

  // Role switching with simulated session re-authorization
  const handleRoleChange = (newRole: RoleType) => {
    setCurrentUserRole(newRole);
    const updatedSession: AppSession = {
      ...session,
      role: newRole,
      scopes: getRoleScopes(newRole),
      token: generateTokenHex(32)
    };
    setSession(updatedSession);
    addAuditLog('ROLE_SWITCH', `Simulated active role updated to ${newRole}. Scopes updated.`);
    showBanner(`🛡️ Switched active role to: ${newRole}`);
  };

  // Permission Checker
  const checkPermission = (actionOrRole: string | RoleType, actionKey?: string): boolean => {
    if (actionKey) {
      return isRoleAuthorized(actionOrRole as RoleType, actionKey);
    }
    return isRoleAuthorized(currentUserRole, actionOrRole as string);
  };

  // Live Tax Calculation Snapshot
  const liveSnapshot = useMemo(() => {
    return generateLiveTaxSnapshot(transactions, invoices, profile);
  }, [transactions, invoices, profile]);

  // Entity Profile composite for sub-components
  const entityProfile: EntityProfile = useMemo(() => ({
    id: 'ENT-ZA-001',
    profile,
    transactions,
    invoices,
    bankAccounts,
    pendingBankTransactions: pendingTransactions,
    auditLogs,
    simulatedCurrentUserRole: currentUserRole,
    grossIncome: liveSnapshot.grossIncome
  }), [profile, transactions, invoices, bankAccounts, pendingTransactions, auditLogs, currentUserRole, liveSnapshot]);

  // Handle invoice approval from OCR (RBAC Guarded: Owner and Accountant only)
  const handleApproveInvoice = (inv: Partial<InvoiceRecord> & Record<string, any>) => {
    if (!checkPermission('canApproveInvoices')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" cannot approve tax invoices. Requires Owner or Accountant.`);
      addAuditLog('ACCESS_DENIED_APPROVE_INVOICE', `Unauthorized attempt by role ${currentUserRole} to approve tax invoice #${inv.invoiceNumber || 'NEW'}.`, 'warn');
      return;
    }
    const completeInv: InvoiceRecord = {
      id: inv.id || `INV-${Date.now()}`,
      supplierName: inv.supplierName || 'Unknown Vendor',
      vatNumber: inv.vatNumber || inv.supplierVatNumber || '4000000000',
      invoiceNumber: inv.invoiceNumber || `INV-${Math.floor(Math.random() * 90000)}`,
      date: inv.date || new Date().toISOString().substring(0, 10),
      category: inv.category || 'General Supplies',
      totalAmount: inv.totalAmount || 0,
      vatAmount: inv.vatAmount || 0,
      netAmount: (inv.totalAmount || 0) - (inv.vatAmount || 0),
      sarsSection: 'Section 11(a) General Deduction',
      isVatClaimable: inv.vatCompliant !== undefined ? Boolean(inv.vatCompliant) : true,
      isDeductible: true,
      explanation: inv.description || inv.explanation || 'Scanned invoice verified under VAT Act Section 20.',
      confidence: 0.98,
      syncedToSarsReport: true
    };
    setInvoices(prev => [completeInv, ...prev]);

    // Automatically synchronize into transactions ledger so charts, projections, and reports alight!
    const correspondingTx: TaxTransaction = {
      id: `TX-INV-${completeInv.id}`,
      date: completeInv.date,
      description: `${completeInv.supplierName} - Inv #${completeInv.invoiceNumber}`,
      amount: completeInv.totalAmount,
      type: 'expense',
      category: completeInv.category || 'Operating Expenses',
      vatIncluded: completeInv.isVatClaimable,
      vatAmount: completeInv.vatAmount,
      sarsSection: 'Section 11(a)',
      isDeductible: completeInv.isDeductible,
      deductiblePercentage: 100,
      taxPositionImpactZAR: -completeInv.netAmount * (profile.taxBracketRate || 0.27),
      explanation: `Automatically synchronized from approved OCR Invoice #${completeInv.invoiceNumber}.`,
      status: 'classified'
    };

    setTransactions(prev => {
      if (prev.some(t => t.id === correspondingTx.id || t.description.includes(completeInv.invoiceNumber))) {
        return prev;
      }
      return [correspondingTx, ...prev];
    });

    systemBus.publish('INVOICE_APPROVED', 'VatOcrScannerPanel', 'INVOICE_APPROVED', { invoice: completeInv });
    addAuditLog('INVOICE_APPROVED', `Invoice #${completeInv.invoiceNumber} (${completeInv.supplierName}) approved into VAT201 schedule and synchronized to general ledger.`);
    showBanner(`✅ Invoice #${completeInv.invoiceNumber} recorded for VAT201 & synchronized to ledger!`);
  };

  // Quick transaction adder with Immediate SARS Pre-Audit Evaluation
  const handleAddQuickTransaction = (type: 'income' | 'expense', amount: number, desc: string) => {
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role ${currentUserRole} cannot add transactions.`);
      return;
    }
    const vatAmount = profile.vatRegistered ? Number(((amount * 15) / 115).toFixed(2)) : 0;
    const prospectiveTx: TaxTransaction = {
      id: `TX-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      description: desc,
      amount,
      type,
      category: type === 'income' ? 'Client Fees' : desc.toLowerCase().includes('travel') || desc.toLowerCase().includes('uber') ? 'Travel & Transport' : 'Operating Expenses',
      vatIncluded: profile.vatRegistered,
      vatAmount,
      sarsSection: type === 'income' ? 'Gross Income (Section 1)' : 'Section 11(a)',
      isDeductible: type === 'expense',
      deductiblePercentage: 100,
      taxPositionImpactZAR: type === 'income' ? amount * profile.taxBracketRate : -amount * profile.taxBracketRate,
      explanation: 'Quick entry added via ledger dashboard.',
      status: 'classified'
    };

    // Audit transaction immediately before entering ledger!
    const auditRes = auditTransaction(prospectiveTx, profile, ['LOGBOOK_789', 'VEHICLE_PURCHASE_AGREEMENT']);
    setPreAuditModalTx(prospectiveTx);
    setPreAuditModalResult(auditRes);
    setPreAuditModalOpen(true);
  };

  // Commit audited transaction to ledger
  const handleConfirmQuickTransaction = (adjustedTx?: Partial<TaxTransaction>) => {
    if (!preAuditModalTx) return;
    const finalTx = (adjustedTx ? { ...preAuditModalTx, ...adjustedTx } : preAuditModalTx) as TaxTransaction;
    setTransactions(prev => [finalTx, ...prev]);

    const audit = auditTransaction(finalTx, profile, ['LOGBOOK_789', 'VEHICLE_PURCHASE_AGREEMENT']);
    addAuditLog(
      'TRANSACTION_PRE_AUDITED',
      `Fed ${finalTx.description} (${formatZAR(finalTx.amount)}). Risk: ${audit.overallRisk}. Projected Disallowance: ${formatZAR(audit.projectedDisallowedAmountZAR)}. SARS Exposure: ${formatZAR(audit.totalPotentialSarsExposureZAR)}. TAA §222: ${audit.understatementPenaltyPercentage}%.`,
      audit.overallRisk === 'CRITICAL_DISALLOWANCE' ? 'warn' : 'info'
    );
    setPreAuditModalOpen(false);
    setPreAuditModalTx(null);
    showBanner(`💳 Audited & added ${formatZAR(finalTx.amount)} to ledger (${audit.overallRisk})!`);
  };

  // Download Full Ledger CSV with strict simulated role check
  const handleDownloadLedgerCSV = () => {
    if (!checkPermission('canDownloadLedger')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" is not authorized to download raw tax ledger CSVs. Only Owner, Accountant, or Auditor may export.`);
      addAuditLog('ACCESS_DENIED_LEDGER_CSV', `Unauthorized attempt by role ${currentUserRole} to export compliance ledger CSV.`, 'warn');
      return;
    }

    const timestamp = new Date().toISOString();
    const submissionRef = generateSubmissionRef('SARS-LEDGER');
    const headers = [
      '# =====================================================================',
      '# ZATAX GENERAL TAX COMPLIANCE LEDGER EXPORT (SARS COMPLIANT)',
      `# SUBMISSION REFERENCE: ${submissionRef}`,
      `# TAXPAYER: ${profile.name} [Ref: ${profile.sarsTaxNumber || '9304318273'}]`,
      `# EXPORT TIMESTAMP: ${timestamp}`,
      `# EXPORTED BY: ${session.userName} (${currentUserRole})`,
      `# TOTAL TRANSACTIONS: ${transactions.length}`,
      '# =====================================================================',
      '',
      'TRANSACTION_ID,DATE,DESCRIPTION,AMOUNT_ZAR,TYPE,CATEGORY,VAT_INCLUDED,VAT_AMOUNT_ZAR,SARS_SECTION,IS_DEDUCTIBLE,DEDUCTIBLE_PCT,TAX_IMPACT_ZAR,STATUS'
    ];

    const rows = transactions.map(t => [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      `"${t.type}"`,
      `"${t.category}"`,
      t.vatIncluded,
      t.vatAmount || 0,
      `"${t.sarsSection}"`,
      t.isDeductible,
      t.deductiblePercentage,
      t.taxPositionImpactZAR,
      `"${t.status}"`
    ].join(','));

    const csvContent = [...headers, ...rows].join('\n');
    downloadBlobFile(`ZAtax_General_Ledger_${submissionRef}.csv`, csvContent, 'text/csv;charset=utf-8;');

    addAuditLog('LEDGER_CSV_DOWNLOADED', `Exported full general tax ledger CSV (${transactions.length} records) by ${currentUserRole} (${session.userName}). Reference: ${submissionRef}.`, 'info');
    showBanner(`📥 Downloaded General Tax Ledger CSV (${submissionRef})!`);
  };

  // Gamification stats
  const gamificationBadges = [
    { id: 'b1', title: 'FICA Verified', description: 'Directive8 Safe Register Active', unlocked: profile.ficaStatus === 'Verified', metric: '100%', xpValue: 250, iconType: 'shield' },
    { id: 'b2', title: 'TAA Rule 7 Ready', description: 'Logbook Corroborated with Vault', unlocked: true, metric: '12,450 km', xpValue: 500, iconType: 'car' },
    { id: 'b3', title: 'VAT201 Invoices', description: 'Compliant Tax Invoices Tracked', unlocked: invoices.length >= 3, metric: `${invoices.length} Invoices`, xpValue: 300, iconType: 'receipt' },
    { id: 'b4', title: 'Section 7C Managed', description: 'Trust Loans Donated Under Exemption', unlocked: trustLoans.length > 0, metric: `${trustLoans.length} Loans`, xpValue: 400, iconType: 'coins' }
  ];

  const gamificationLeaderboard = [
    { name: `${profile.name || 'Compliance Officer'} (You)`, xp: 1450, level: 'Tax Master', isUser: true },
    { name: 'Khanyi M. (Accountant)', xp: 1220, level: 'Senior Practitioner', isUser: false },
    { name: 'Zola K. (Bookkeeper)', xp: 890, level: 'Compliance Officer', isUser: false }
  ];

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans antialiased flex flex-col" id="app-root">
      
      {/* 1. TOP STATUTORY & SESSION HEADER */}
      <header className="border-b border-white/10 bg-[#0B0F19]/90 backdrop-blur sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand Identity & Directive8 Tracker */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent border border-amber-400/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">ZAtax Compliance Advisor</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-semibold">
                  TAA Rule 7 • 2026/2027
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold hidden sm:inline-block">
                  Simulated Engine • Accreditations Pending Approval
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <span>Directive8SafeRegister</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400">Production Ledger Active</span>
                <span className="text-slate-600">•</span>
                <span>FICA Compliant</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics & Session Status */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Live Provisional Tax Status */}
            <div className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Net SARS Position</div>
                <div className={`text-xs font-bold font-mono ${liveSnapshot.netTaxLiabilityOrRefund > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {formatZAR(liveSnapshot.netTaxLiabilityOrRefund)}
                </div>
              </div>
            </div>

            {/* Role Switcher Pill */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-white/10 rounded-xl p-1">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
              <span className="text-[10px] text-slate-400 font-medium">Role:</span>
              <select
                value={currentUserRole}
                onChange={(e) => handleRoleChange(e.target.value as RoleType)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer pr-1"
                id="role-selector-dropdown"
              >
                <option value="Owner" className="bg-slate-900 text-white">Owner</option>
                <option value="Accountant" className="bg-slate-900 text-white">Accountant</option>
                <option value="Bookkeeper" className="bg-slate-900 text-white">Bookkeeper</option>
                <option value="Auditor" className="bg-slate-900 text-white">Auditor</option>
              </select>
            </div>

            {/* Export Ledger CSV Pill (RBAC Guarded) */}
            <button
              onClick={handleDownloadLedgerCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition cursor-pointer"
              title="Download full general ledger CSV (Requires Owner, Accountant, or Auditor role)"
              id="export-ledger-csv-btn"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {/* Session Security Token Pill */}
            <button
              onClick={() => setIsSessionModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium transition cursor-pointer"
              title="Inspect 64-character bearer token & cryptographic scopes"
              id="open-session-security-btn"
            >
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>{session.token.substring(0, 6)}...</span>
            </button>

          </div>

        </div>
      </header>

      {/* BANNER NOTIFICATION */}
      {banner.visible && (
        <div className="bg-slate-900/95 border-b border-cyan-500/30 px-4 py-2 text-center text-xs font-semibold text-cyan-200 flex items-center justify-center gap-2 animate-fadeIn shadow-sm">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{banner.message}</span>
        </div>
      )}

      {/* 2. NAVIGATION BAR */}
      <nav className="border-b border-white/5 bg-[#090D17] px-4 overflow-x-auto scrollbar-thin">
        <div className="max-w-7xl mx-auto flex items-center gap-1 py-2 text-xs">

          <button
            onClick={() => handleTabChange('launch')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'launch'
                ? 'bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 text-cyan-200 border border-cyan-400/50 shadow-sm font-bold ring-1 ring-cyan-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            id="nav-launch-cockpit-btn"
          >
            <Rocket className="w-3.5 h-3.5 text-cyan-400" />
            <span>Launch Cockpit</span>
          </button>
          
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Cockpit</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_assistant')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ai_assistant'
                ? 'bg-gradient-to-r from-cyan-500/30 via-indigo-500/30 to-purple-500/30 text-cyan-200 border border-cyan-400/50 shadow-sm font-bold ring-1 ring-cyan-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            id="nav-sars-ai-assistant-btn"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>SARS AI Assistant</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-200 font-bold">GEMINI 3.8</span>
          </button>

          <button
            onClick={() => setActiveTab('emp501_reconciliation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'emp501_reconciliation'
                ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-indigo-200 border border-indigo-400/50 shadow-sm font-bold ring-1 ring-indigo-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            id="nav-emp501-recon-btn"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interim EMP501 Recon</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-bold">202608</span>
          </button>

          <button
            onClick={() => setActiveTab('tax_pro_connect')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'tax_pro_connect'
                ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-200 border border-emerald-400/50 shadow-sm font-bold ring-1 ring-emerald-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            id="nav-tax-pro-connect-btn"
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tax Professional Connect</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-bold">§240 TAA</span>
          </button>

          <button
            onClick={() => setActiveTab('integrated_system')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'integrated_system'
                ? 'bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-cyan-200 border border-cyan-400/50 shadow-sm font-bold ring-1 ring-cyan-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            id="nav-integrated-system-btn"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Automated Integrated System</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-200 font-bold">AUTOPILOT</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_deductions')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ai_deductions'
                ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-200 border border-purple-400/50 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            id="nav-ai-deductions-btn"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Deductions & Credits</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 font-bold">AI</span>
          </button>

          <button
            onClick={() => setActiveTab('vat201_lodgement')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'vat201_lodgement'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            id="nav-vat201-lodgement-btn"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            <span>VAT201 Lodgement</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-bold">15%</span>
          </button>

          <button
            onClick={() => setActiveTab('pre_audit_shield')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'pre_audit_shield'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm font-bold animate-pulse'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>SARS Pre-Audit Shield</span>
          </button>

          <button
            onClick={() => setActiveTab('categorization_rules')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'categorization_rules'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            id="nav-categorization-rules-btn"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Categorization Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('auto_assessment')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'auto_assessment'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Auto-Assessment (SARS)</span>
          </button>

          <button
            onClick={() => setActiveTab('statutory_enhancements')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'statutory_enhancements'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Statutory Enhancements</span>
          </button>

          <button
            onClick={() => {
              setVdpPrefillData(null);
              setActiveTab('vdp_disclosure');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'vdp_disclosure'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Proactive Disclosure (VDP §227)</span>
          </button>

          <button
            onClick={() => setActiveTab('ita34_decoder')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ita34_decoder'
                ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dispute War Room (ADR1)</span>
          </button>

          <button
            onClick={() => setActiveTab('logbook')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'logbook'
                ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Travel Logbook</span>
          </button>

          <button
            onClick={() => setActiveTab('vat_invoices')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'vat_invoices'
                ? 'bg-blue-400/20 text-blue-300 border border-blue-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>VAT201 Invoices</span>
          </button>

          <button
            onClick={() => setActiveTab('trust_loans')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'trust_loans'
                ? 'bg-indigo-400/20 text-indigo-300 border border-indigo-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>§7C Trust Loans</span>
          </button>

          <button
            onClick={() => setActiveTab('sbc_wizard')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'sbc_wizard'
                ? 'bg-purple-400/20 text-purple-300 border border-purple-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>§12E SBC Wizard</span>
          </button>

          <button
            onClick={() => setActiveTab('eti_calculator')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'eti_calculator'
                ? 'bg-teal-400/20 text-teal-300 border border-teal-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ETI Youth Incentive</span>
          </button>

          <button
            onClick={() => setActiveTab('two_pot')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'two_pot'
                ? 'bg-pink-400/20 text-pink-300 border border-pink-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Two-Pot Retirement</span>
          </button>

          <button
            onClick={() => setActiveTab('pbo_section18a')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'pbo_section18a'
                ? 'bg-rose-400/20 text-rose-300 border border-rose-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>§18A PBO Donations</span>
          </button>

          <button
            onClick={() => setActiveTab('afs_drafter')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'afs_drafter'
                ? 'bg-violet-400/20 text-violet-300 border border-violet-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>AFS Statements</span>
          </button>

          <button
            onClick={() => setActiveTab('phase17_auditor')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'phase17_auditor'
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Audit & Packages</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox_hub')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'sandbox_hub'
                ? 'bg-blue-400/20 text-blue-300 border border-blue-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>SARS Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('sars_connect')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'sars_connect'
                ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>SARS Connect Direct</span>
          </button>

          <button
            onClick={() => setActiveTab('trade_testing')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'trade_testing'
                ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>Trade Testing (SFG HTTPS)</span>
          </button>

          <button
            onClick={() => setActiveTab('devops_runway')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'devops_runway'
                ? 'bg-orange-400/20 text-orange-300 border border-orange-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Runway DevOps</span>
          </button>

          <button
            onClick={() => setActiveTab('repo_health')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'repo_health'
                ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Repo Health & POPIA</span>
          </button>

          <button
            onClick={() => setActiveTab('backend_errors')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'backend_errors'
                ? 'bg-rose-400/20 text-rose-300 border border-rose-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Validation Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('literacy_hub')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'literacy_hub'
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tax Literacy</span>
          </button>

          <button
            onClick={() => setActiveTab('gamification')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'gamification'
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Compliance Quest</span>
          </button>

        </div>
      </nav>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* 0. PRODUCTION LAUNCH COCKPIT */}
        {activeTab === 'launch' && (
          <ProductionLaunchCockpit
            profile={profile}
            currentUserRole={currentUserRole}
            onSelectRole={handleRoleChange}
            onNavigateTab={(tabKey) => handleTabChange(tabKey as NavTab)}
            showBanner={showBanner}
            liveGrossIncome={liveSnapshot.grossIncome}
            liveNetLiability={liveSnapshot.netTaxLiabilityOrRefund}
          />
        )}
        
        {/* OVERVIEW / COCKPIT TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Quick Status Bento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Gross Receipts</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {formatZAR(liveSnapshot.grossIncome)}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {transactions.filter(t => t.type === 'income').length} Sales Invoices Recorded
                </div>
              </div>

              <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Input VAT Claimable</span>
                  <Receipt className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-xl font-bold font-mono text-blue-400">
                  {formatZAR(liveSnapshot.inputVatClaimable)}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  From {invoices.length} Scanned VAT201 Tax Slips
                </div>
              </div>

              <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Audit-Ready Vault Distance</span>
                  <Car className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-bold font-mono text-amber-400">
                  12,450 km
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Logbook #789 Corroborated
                </div>
              </div>

              <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>TAA Rule 7 Window</span>
                  <Scale className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-xl font-bold font-mono text-cyan-400">
                  54 Business Days
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Within statutory 80-day limitation
                </div>
              </div>

            </div>

            {/* Quick Action Buttons for Compliance Ledger */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => setActiveTab('ai_assistant')}
                className="px-3.5 py-2 bg-gradient-to-r from-cyan-600/30 via-indigo-600/30 to-purple-600/30 hover:from-cyan-600/40 hover:to-indigo-600/40 text-cyan-200 border border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ask SARS AI Assistant (§Act Counsel)</span>
              </button>
              <button
                onClick={() => setActiveTab('emp501_reconciliation')}
                className="px-3.5 py-2 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/40 hover:to-purple-600/40 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Interim EMP501 Recon (Due 31 Oct)</span>
              </button>
              <button
                onClick={() => setActiveTab('tax_pro_connect')}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/40 hover:to-teal-600/40 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tax Professional Connect (§240 TAA)</span>
              </button>
              <button
                onClick={() => setActiveTab('auto_assessment')}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/40 hover:to-cyan-600/40 text-blue-200 border border-blue-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Auto-Assessment Review (38 Days Left)</span>
              </button>
              <button
                onClick={() => {
                  setVdpPrefillData(null);
                  setActiveTab('vdp_disclosure');
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-teal-600/30 to-emerald-600/30 hover:from-teal-600/40 hover:to-emerald-600/40 text-teal-200 border border-teal-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Proactive Disclosure (VDP §227 - 0% Penalty)</span>
              </button>
              <button
                onClick={() => setActiveTab('statutory_enhancements')}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Statutory Enhancements (S13sex / S11D)</span>
              </button>
              <button
                onClick={() => setActiveTab('pre_audit_shield')}
                className="px-3.5 py-2 bg-gradient-to-r from-rose-600/30 to-amber-600/30 hover:from-rose-600/40 hover:to-amber-600/40 text-rose-200 border border-rose-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Pre-Emptive SARS Audit Shield</span>
              </button>
              <button
                onClick={() => handleAddQuickTransaction('income', 25000, 'Consulting Retainer')}
                className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Professional Income</span>
              </button>
              <button
                onClick={() => handleAddQuickTransaction('expense', 4850, 'Office Connectivity & Cloud Hosting')}
                className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Tax Deductible Expense</span>
              </button>
              <button
                onClick={() => setActiveTab('ita34_decoder')}
                className="px-3.5 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Decode SARS ITA34 Assessment</span>
              </button>
              <button
                onClick={() => setActiveTab('vat_invoices')}
                className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>OCR Invoice Scanner</span>
              </button>
            </div>

            {/* Visuals & Interactive Graphs */}
            <div className="bg-[#0D1527] border border-white/10 rounded-3xl p-5">
              <TaxVisuals
                transactions={transactions}
                invoices={invoices}
                profile={profile}
                snapshot={liveSnapshot}
              />
            </div>

            {/* Embedded High-Value Assessment Decoder on Overview */}
            <Ita34AssessmentDecoder
              profile={entityProfile}
              formatZAR={formatZAR}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
              onNavigateToTaxPro={() => setActiveTab('tax_pro_connect')}
            />

            {/* Audit Trail Drawer Preview */}
            <div className="bg-[#0D1527] border border-white/10 rounded-3xl p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    High-Fidelity Security & Compliance Audit Log
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                  {auditLogs.length} Events Logged
                </span>
              </div>
              <div className="divide-y divide-white/5 max-h-56 overflow-y-auto font-mono text-xs">
                {auditLogs.slice(0, 8).map(log => (
                  <div key={log.id} className="py-2 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold">{log.action}</span>
                        <span className="text-[10px] text-slate-400">by {log.userName} ({log.userRole})</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* AI-POWERED SOUTH AFRICAN TAX COMPLIANCE CHATBOT ASSISTANT */}
        {activeTab === 'ai_assistant' && (
          <div className="space-y-6 animate-fadeIn">
            <SarsAiTaxAssistant
              profile={profile}
              currentUserRole={currentUserRole}
              showBanner={showBanner}
              addAuditLog={addAuditLog}
              onNavigateTab={(tabKey) => setActiveTab(tabKey as NavTab)}
              liveGrossIncome={liveSnapshot.grossIncome}
              liveDeductions={liveSnapshot.allowableDeductions}
              liveNetLiability={liveSnapshot.netTaxLiability}
            />
          </div>
        )}

        {/* INTERIM EMPLOYER RECONCILIATION (EMP501 - PERIOD 202608) */}
        {activeTab === 'emp501_reconciliation' && (
          <div className="space-y-6 animate-fadeIn">
            <Emp501InterimReconciliation
              profile={profile}
              currentUserRole={currentUserRole}
              checkPermission={checkPermission}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
              onNavigateToTaxPro={() => setActiveTab('tax_pro_connect')}
            />
          </div>
        )}

        {/* AUTOMATED INTEGRATED SYSTEM ENGINE (AUTOPILOT - ZERO OVERLAPS & ZERO REPETITIONS) */}
        {activeTab === 'integrated_system' && (
          <AutomatedIntegratedSystemHub
            transactions={transactions}
            setTransactions={setTransactions}
            profile={profile}
            setProfile={setProfile}
            currentUserRole={currentUserRole}
            setCurrentUserRole={handleRoleChange}
            checkPermission={checkPermission}
            addAuditLog={addAuditLog}
            showBanner={showBanner}
            onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
          />
        )}

        {/* AI-POWERED SARS TAX DEDUCTIONS & CREDITS DISCOVERY ENGINE */}
        {activeTab === 'ai_deductions' && (
          <AiTaxDeductionsAdvisor
            transactions={transactions}
            setTransactions={setTransactions}
            profile={profile}
            currentUserRole={currentUserRole}
            checkPermission={checkPermission}
            addAuditLog={addAuditLog}
            showBanner={showBanner}
          />
        )}

        {/* VAT201 RETURN CALCULATOR & ELECTRONIC LODGEMENT CENTER */}
        {activeTab === 'vat201_lodgement' && (
          <VatFilingCenter
            profile={profile}
            setProfile={setProfile}
            currentUserRole={currentUserRole}
            checkPermission={checkPermission}
            addAuditLog={addAuditLog}
            showBanner={showBanner}
          />
        )}

        {/* PRE-EMPTIVE SARS AUDIT SHIELD & IMMEDIATE EXPOSURE ASSESSMENT */}
        {activeTab === 'pre_audit_shield' && (
          <SarsPreAuditShield
            transactions={transactions}
            setTransactions={setTransactions}
            pendingTransactions={pendingTransactions}
            setPendingTransactions={setPendingTransactions}
            profile={profile}
            currentUserRole={currentUserRole}
            checkPermission={checkPermission}
            addAuditLog={addAuditLog}
            showBanner={showBanner}
            categorizationRules={categorizationRules}
            onNavigateToVdp={(prefill) => {
              setVdpPrefillData(prefill || null);
              setActiveTab('vdp_disclosure');
              showBanner('🛡️ Transferred oversight to SARS Voluntary Disclosure Programme for 0% penalty relief.');
            }}
          />
        )}

        {/* CATEGORIZATION RULES & PATTERN OVERRIDES */}
        {activeTab === 'categorization_rules' && (
          <div className="space-y-6 animate-fadeIn">
            <CategorizationRulesManager
              rules={categorizationRules}
              setRules={setCategorizationRules}
              currentUserRole={currentUserRole}
              checkPermission={checkPermission}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
            />
          </div>
        )}

        {/* SARS AUTO-ASSESSMENT RECONCILIATION CENTER */}
        {activeTab === 'auto_assessment' && (
          <SarsAutoAssessmentPanel
            profile={profile}
            currentUserRole={currentUserRole}
            checkPermission={checkPermission}
            addAuditLog={addAuditLog}
            showBanner={showBanner}
            onNavigateToWarRoom={() => setActiveTab('ita34_decoder')}
            onNavigateToVault={() => setActiveTab('logbook')}
            onNavigateToVdp={(prefill) => {
              setVdpPrefillData(prefill || null);
              setActiveTab('vdp_disclosure');
              showBanner('🛡️ Transferred Auto-Assessment oversight to SARS Voluntary Disclosure Programme for 0% penalty relief.');
            }}
          />
        )}

        {/* STATUTORY ENHANCEMENTS HUB (S13sex, S11D, S24C, Phase 12 Concessions) */}
        {activeTab === 'statutory_enhancements' && (
          <div className="space-y-6 animate-fadeIn">
            <StatutoryEnhancementsHub
              profile={profile}
              setProfile={setProfile}
              currentUserRole={currentUserRole}
              checkPermission={checkPermission}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
              onNavigateToVault={() => setActiveTab('logbook')}
              onNavigateToVdp={() => {
                setVdpPrefillData(null);
                setActiveTab('vdp_disclosure');
                showBanner('🛡️ Opened SARS Voluntary Disclosure Center for statutory oversight relief.');
              }}
              onNavigateToTaxPro={() => setActiveTab('tax_pro_connect')}
            />
          </div>
        )}

        {/* SARS VOLUNTARY DISCLOSURE PROGRAMME (VDP) & PROACTIVE OVERSIGHT RELIEF (TAA §§225-233) */}
        {activeTab === 'vdp_disclosure' && (
          <SarsVdpCenter
            profile={profile}
            currentUserRole={currentUserRole}
            checkPermission={checkPermission}
            addAuditLog={addAuditLog}
            showBanner={showBanner}
            onNavigateToShield={() => setActiveTab('pre_audit_shield')}
            initialOversight={vdpPrefillData}
          />
        )}

        {/* 1. ITA34 DECODER & RULE 7 LEGAL OBJECTION */}
        {activeTab === 'ita34_decoder' && (
          <div className="space-y-6 animate-fadeIn">
            <Ita34AssessmentDecoder
              profile={entityProfile}
              formatZAR={formatZAR}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
              onNavigateToTaxPro={() => setActiveTab('tax_pro_connect')}
            />
          </div>
        )}

        {/* 2. TRAVEL LOGBOOK CALCULATOR */}
        {activeTab === 'logbook' && (
          <div className="space-y-6 animate-fadeIn">
            <TravelLogbookCalculator
              formatZAR={formatZAR}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
              currentUserRole={currentUserRole}
              checkPermission={checkPermission}
              invoices={invoices}
              profile={profile}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          </div>
        )}

        {/* 3. VAT201 OCR INVOICES (UNIFIED WITH VAT FILING CENTER - ZERO OVERLAPS) */}
        {activeTab === 'vat_invoices' && (
          <div className="space-y-6 animate-fadeIn">
            <VatFilingCenter
              profile={profile}
              setProfile={setProfile}
              currentUserRole={currentUserRole}
              checkPermission={checkPermission}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
            />
          </div>
        )}

        {/* 4. SECTION 7C TRUST LOANS COMPLIANCE */}
        {activeTab === 'trust_loans' && (
          <div className="space-y-6 animate-fadeIn">
            <TrustLoansCompliance
              trustLoans={trustLoans}
              setTrustLoans={setTrustLoans}
              userRole={currentUserRole}
              checkPermission={checkPermission}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
              activeProfileName={profile.name}
            />
          </div>
        )}

        {/* 5. SECTION 12E SBC ADVISORY WIZARD */}
        {activeTab === 'sbc_wizard' && (
          <div className="bg-[#0D1527] border border-white/10 rounded-3xl p-6 space-y-6 animate-fadeIn">
            <SbcAdvisoryWizard
              profile={entityProfile}
              formatZAR={formatZAR}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
            />
          </div>
        )}

        {/* 6. ETI YOUTH INCENTIVE CALCULATOR */}
        {activeTab === 'eti_calculator' && (
          <div className="space-y-6 animate-fadeIn">
            <EtiCalculatorPanel
              formatZAR={formatZAR}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
              currentUserRole={currentUserRole}
              checkPermission={checkPermission}
              profile={profile}
            />
          </div>
        )}

        {/* 7. TWO-POT RETIREMENT REFORM SIMULATOR */}
        {activeTab === 'two_pot' && (
          <div className="bg-[#0D1527] border border-white/10 rounded-3xl p-6 space-y-6 animate-fadeIn">
            <TwoPotRetirementSimulator
              profile={entityProfile}
              formatZAR={formatZAR}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
            />
          </div>
        )}

        {/* 8. SECTION 18A PBO DONATIONS & IT3(d) */}
        {activeTab === 'pbo_section18a' && (
          <div className="space-y-6 animate-fadeIn">
            <PboDonationsSection18A
              taxableIncome={liveSnapshot.netTaxableIncome}
              formatZAR={formatZAR}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
              currentUserRole={currentUserRole}
              checkPermission={checkPermission}
              profile={profile}
            />
          </div>
        )}

        {/* 9. AFS ANNUAL FINANCIAL STATEMENTS DRAFTER */}
        {activeTab === 'afs_drafter' && (
          <div className="bg-[#0D1527] border border-white/10 rounded-3xl p-6 space-y-6 animate-fadeIn">
            <AfsStatementsDrafter
              profile={profile}
              liveSnapshot={liveSnapshot}
              formatZAR={formatZAR}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
              currentUserRole={currentUserRole}
              checkPermission={checkPermission}
            />
          </div>
        )}

        {/* 10. PHASE 17 AUDIT PACKS & COMPLIANCE BUNDLES */}
        {activeTab === 'phase17_auditor' && (
          <div className="space-y-6 animate-fadeIn">
            <Phase17SubscriptionAndTravelAuditor
              formatZAR={formatZAR}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
              currentUserRole={currentUserRole}
              checkPermission={checkPermission}
              profile={profile}
            />
          </div>
        )}

        {/* 11. SARS SANDBOX READINESS HUB */}
        {activeTab === 'sandbox_hub' && (
          <div className="space-y-6 animate-fadeIn">
            <SarsSandboxReadinessHub
              profile={profile}
              formatZAR={formatZAR}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
              currentUserRole={currentUserRole}
            />
          </div>
        )}

        {/* 12. SARS CONNECT DIRECT DIAGNOSTICS */}
        {activeTab === 'sars_connect' && (
          <div className="space-y-6 animate-fadeIn">
            <SarsConnectDirectDiagnostic
              profile={profile}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
              currentUserRole={currentUserRole}
            />
          </div>
        )}

        {/* 12B. SARS STERLING FILE GATEWAY (HTTPS) TRADE TESTING & APPENDIX B */}
        {activeTab === 'trade_testing' && (
          <div className="space-y-6 animate-fadeIn">
            <SarsSterlingTradeTestingPanel
              currentUserRole={currentUserRole}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
            />
          </div>
        )}

        {/* 13. DEVOPS RUNWAY INFRASTRUCTURE */}
        {activeTab === 'devops_runway' && (
          <div className="space-y-6 animate-fadeIn">
            <Phase18DevOpsInfrastructure
              formatZAR={formatZAR}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
            />
          </div>
        )}

        {/* 14. REAL REPO HEALTH & POPIA SCAN */}
        {activeTab === 'repo_health' && (
          <div className="space-y-6 animate-fadeIn">
            <RealRepoHealthCheck onNotify={showBanner} />
          </div>
        )}

        {/* 15. BACKEND VALIDATION ERROR TRACKER */}
        {activeTab === 'backend_errors' && (
          <div className="space-y-6 animate-fadeIn">
            <BackendValidationErrorTracker
              currentUserRole={currentUserRole}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
              formatZAR={formatZAR}
            />
          </div>
        )}

        {/* 16. TAX LITERACY HUB */}
        {activeTab === 'literacy_hub' && (
          <div className="space-y-6 animate-fadeIn">
            <TaxLiteracyHub
              formatZAR={formatZAR}
              showBanner={showBanner}
            />
          </div>
        )}

        {/* 17. GAMIFICATION & COMPLIANCE QUEST */}
        {activeTab === 'gamification' && (
          <div className="space-y-6 animate-fadeIn">
            <TaxGamificationPanel
              currentXP={1450}
              complianceScore={96}
              levelDetails={{
                currentLevel: 'Tax Master',
                levelNum: 4,
                xpNeededForNext: 2000,
                xpInCurrentLevel: 1450,
                levelProgressPercentage: 72.5
              }}
              badges={gamificationBadges}
              leaderboard={gamificationLeaderboard}
              userRank={1}
              onNavigateToTab={(tab: string) => {
                if (tab === 'logbook') setActiveTab('logbook');
                else if (tab === 'invoices') setActiveTab('vat_invoices');
                else setActiveTab('overview');
              }}
              onTriggerAction={(actionKey: string) => {
                showBanner(`Action triggered: ${actionKey}`);
              }}
              pendingInvoicesCount={invoices.length}
              ficaStatus={profile.ficaStatus || 'Verified'}
              vatRegistered={profile.vatRegistered}
              hasLogbook={true}
            />
          </div>
        )}

        {/* 18. TAX PROFESSIONAL CONNECT & PERMISSION-BASED DATA SHARING */}
        {activeTab === 'tax_pro_connect' && (
          <div className="space-y-6 animate-fadeIn">
            <TaxProfessionalConnect
              profile={profile}
              transactions={transactions}
              invoices={invoices}
              currentUserRole={currentUserRole}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
              formatZAR={formatZAR}
            />
          </div>
        )}

      </main>

      {/* 4. FOOTER */}
      <footer className="border-t border-white/10 bg-[#0B0F19] px-4 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Directive8SafeRegister Tracker • S Cengcani IP / Ilitha Fintech Operations (Pty) Ltd Reg 2026/707498/07 • Simulated System (Accreditations Pending Approval)
          </div>
          <div className="text-[11px] text-slate-400">
            Rule 7 TAA (80-day limitation window) • SARS Source Code 4015 Audited • Real-Time Pre-Audit Active
          </div>
        </div>
      </footer>

      {/* 5. SESSION SECURITY MODAL */}
      <SessionSecurityModal
        session={session}
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        onRotateToken={() => {
          const newToken = generateTokenHex(32);
          setSession(prev => ({ ...prev, token: newToken }));
          addAuditLog('SESSION_TOKEN_ROTATED', 'Rotated 64-character bearer token.');
          showBanner('🔑 Session bearer token rotated successfully.');
        }}
        onRevokeSession={() => {
          setSession(prev => ({ ...prev, status: 'REVOKED' }));
          addAuditLog('SESSION_REVOKED', 'Session status set to REVOKED.');
          showBanner('⚠️ Session revoked.');
        }}
        onExtendSession={() => {
          const newExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
          setSession(prev => ({ ...prev, expiresAt: newExpiry, status: 'ACTIVE' }));
          addAuditLog('SESSION_EXTENDED', 'Session validity extended by 60 minutes.');
          showBanner('⏳ Session extended by 60 minutes.');
        }}
        showBanner={showBanner}
      />

      {/* 6. IMMEDIATE TRANSACTION PRE-AUDIT EVALUATION MODAL */}
      <ImmediatePreAuditModal
        auditResult={preAuditModalResult}
        transaction={preAuditModalTx}
        isOpen={preAuditModalOpen}
        onClose={() => {
          setPreAuditModalOpen(false);
          setPreAuditModalTx(null);
          setPreAuditModalResult(null);
        }}
        onConfirmAddToLedger={handleConfirmQuickTransaction}
        currentUserRole={currentUserRole}
        showBanner={showBanner}
        onInitiateVdp={(tx, auditResult) => {
          setPreAuditModalOpen(false);
          setPreAuditModalTx(null);
          setPreAuditModalResult(null);
          setVdpPrefillData({
            title: tx.description || 'Pre-Audit Accounting Oversight',
            desc: auditResult.negativeImplications.map(n => n.description).join('; '),
            category: tx.category === 'Entertainment' ? 'UNCLAIMABLE_DEDUCTION' : 'DUAL_USE_UNAPPORTIONED',
            shortfall: auditResult.projectedDisallowedAmountZAR,
            standardPenaltyPct: auditResult.understatementPenaltyPercentage || 50
          });
          setActiveTab('vdp_disclosure');
          addAuditLog(
            'VDP_INITIATED_FROM_PREAUDIT',
            `Initiated proactive voluntary disclosure for "${tx.description}" (Disallowance: R${auditResult.projectedDisallowedAmountZAR}) under TAA §227 to reduce penalty to 0%.`,
            'info'
          );
          showBanner(`🛡️ Transferred "${tx.description}" to SARS Voluntary Disclosure Programme (0% Penalty Protection).`);
        }}
      />

      {/* 7. GLOBAL FLOATING AI TAX COMPLIANCE ASSISTANT WIDGET */}
      {activeTab !== 'ai_assistant' && (
        <GlobalAiChatbotWidget
          profile={profile}
          currentUserRole={currentUserRole}
          onNavigateTab={(tabKey) => setActiveTab(tabKey as NavTab)}
          showBanner={showBanner}
          liveGrossIncome={liveSnapshot.grossIncome}
          liveNetLiability={liveSnapshot.netTaxLiabilityOrRefund}
        />
      )}

    </div>
  );
}

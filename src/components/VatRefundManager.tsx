import React, { useState, useMemo } from 'react';
import {
  Banknote,
  Calendar,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Download,
  FileText,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Percent,
  Landmark,
  Building2,
  Receipt,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  Send,
  Sliders,
  DollarSign,
  Scale
} from 'lucide-react';
import { 
  UserTaxProfile, 
  RoleType, 
  VatRefundClaim, 
  VatRefundStatus, 
  VatRefundAuditItem 
} from '../types';
import { formatZAR } from '../utils/taxCalculations';
import { downloadBlobFile, generateSubmissionRef } from '../utils/systemBridge';

interface VatRefundManagerProps {
  profile: UserTaxProfile;
  currentUserRole: RoleType;
  netVatPosition?: number; // From active VAT201 (negative = refund)
  activeTaxPeriod?: string;
  vatRegistrationNumber?: string;
  onNavigateToLodgement?: () => void;
  showBanner?: (msg: string) => void;
  addAuditLog?: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
}

export const VatRefundManager: React.FC<VatRefundManagerProps> = ({
  profile,
  currentUserRole,
  netVatPosition = -88400, // Default to a simulated refund if not set
  activeTaxPeriod = '2026/02 - Category B (Bimonthly: Jan-Feb)',
  vatRegistrationNumber = profile.vatNumber || '4920184719',
  onNavigateToLodgement,
  showBanner = (_msg?: string) => {},
  addAuditLog = (_action?: string, _details?: string, _severity?: 'info' | 'warn' | 'crit') => {}
}) => {
  // Current active refund amount (if negative in VAT201, take absolute value; otherwise use custom/preset)
  const currentEligibleRefund = useMemo(() => {
    return netVatPosition < 0 ? Math.abs(netVatPosition) : 88400;
  }, [netVatPosition]);

  const [refundAmount, setRefundAmount] = useState<number>(currentEligibleRefund);
  const [taxPeriod, setTaxPeriod] = useState<string>(activeTaxPeriod);
  const [selectedScenario, setSelectedScenario] = useState<'CURRENT' | 'EXPORTS' | 'SOLAR_CAPEX' | 'CUSTOM'>('CURRENT');

  // SARS Prescribed Rate for Section 45 Delayed Refund Interest (11.75% per annum)
  const [sarsPrescribedRate, setSarsPrescribedRate] = useState<number>(11.75);

  // Lodgement date state for timeline and interest calculation
  const defaultLodgedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 32); // Default to 32 calendar days ago (approx 23 business days -> eligible for Sec 45 interest!)
    return d.toISOString().split('T')[0];
  }, []);

  const [lodgedDate, setLodgedDate] = useState<string>(defaultLodgedDate);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Section 190 & 191 Banking and Set-off Details
  const [bankName, setBankName] = useState<string>('First National Bank (FNB)');
  const [bankAccountMasked, setBankAccountMasked] = useState<string>('•••• •••• 4821');
  const [bankVerified, setBankVerified] = useState<boolean>(true);
  const [incomeTaxDebtSetOff, setIncomeTaxDebtSetOff] = useState<number>(0);
  const [payeDebtSetOff, setPayeDebtSetOff] = useState<number>(0);

  // Mock Active & Historical Refund Claims
  const [refundClaims, setRefundClaims] = useState<VatRefundClaim[]>([
    {
      id: 'ref-claim-2026-02',
      claimRef: 'SARS-REF-2026-02B-7819',
      taxPeriod: '2026/02 - Category B (Bimonthly: Jan-Feb)',
      vatRegistrationNumber: vatRegistrationNumber,
      vendorName: profile.name,
      refundAmountZAR: 134850,
      lodgedDate: '2026-01-28',
      statutoryDeadlineDate: '2026-02-26',
      businessDaysElapsed: 26,
      status: 'UNDER_SARS_AUDIT',
      sarsAuditCaseNo: 'AUD-VAT-2026-9921',
      bankDetailsVerified: true,
      bankName: 'First National Bank',
      bankAccountMasked: '•••• •••• 4821',
      taa191SetOffAmountZAR: 0,
      netPayoutAmountZAR: 134850,
      delayedDays: 5,
      prescribedInterestOwedBySars: 217.09,
      supportingInvoicesCount: 14,
      auditPackReady: true,
      notes: 'SARS issued Section 46 Request for Information (RFI) for top 5 capital equipment purchase invoices.'
    },
    {
      id: 'ref-claim-2025-10',
      claimRef: 'SARS-REF-2025-10B-4412',
      taxPeriod: '2025/10 - Category B (Bimonthly: Sep-Oct)',
      vatRegistrationNumber: vatRegistrationNumber,
      vendorName: profile.name,
      refundAmountZAR: 52400,
      lodgedDate: '2025-11-25',
      statutoryDeadlineDate: '2025-12-24',
      businessDaysElapsed: 21,
      status: 'PAID_TO_BANK',
      bankDetailsVerified: true,
      bankName: 'First National Bank',
      bankAccountMasked: '•••• •••• 4821',
      taa191SetOffAmountZAR: 0,
      netPayoutAmountZAR: 52400,
      delayedDays: 0,
      prescribedInterestOwedBySars: 0,
      supportingInvoicesCount: 8,
      auditPackReady: true,
      notes: 'Full statutory refund deposited directly into verified vendor commercial bank account.'
    },
    {
      id: 'ref-claim-2025-06',
      claimRef: 'SARS-REF-2025-06B-1193',
      taxPeriod: '2025/06 - Category B (Bimonthly: May-Jun)',
      vatRegistrationNumber: vatRegistrationNumber,
      vendorName: profile.name,
      refundAmountZAR: 96300,
      lodgedDate: '2025-07-25',
      statutoryDeadlineDate: '2025-08-25',
      businessDaysElapsed: 28,
      status: 'PAID_TO_BANK',
      bankDetailsVerified: true,
      bankName: 'First National Bank',
      bankAccountMasked: '•••• •••• 4821',
      taa191SetOffAmountZAR: 7500, // Small administrative set-off
      netPayoutAmountZAR: 88800,
      delayedDays: 7,
      prescribedInterestOwedBySars: 217.15,
      supportingInvoicesCount: 19,
      auditPackReady: true,
      notes: 'TAA Section 191 set-off of R7,500 applied against historic provisional tax penalty. Balance of R88,800 + interest paid.'
    }
  ]);

  // Section 20(4) Top Input Invoices substantiating the claim
  const refundSubstantiationInvoices: VatRefundAuditItem[] = [
    {
      invoiceNumber: 'INV-2026-8801',
      supplierName: 'VoltServe Clean Energy (Pty) Ltd',
      supplierVatNumber: '4190284711',
      date: '2026-01-14',
      description: 'Tier-1 Bifacial Solar PV Panels (120kWp) & Inverter Ingress',
      totalConsiderationZAR: 460000,
      vatInputClaimedZAR: 60000,
      proofOfPaymentAttached: true,
      section20Compliance: true
    },
    {
      invoiceNumber: 'INV-2026-9042',
      supplierName: 'AfriTech Cloud Data Solutions',
      supplierVatNumber: '4820194822',
      date: '2026-01-20',
      description: 'Enterprise Dedicated Server Hardware & Disaster Recovery SAN',
      totalConsiderationZAR: 184000,
      vatInputClaimedZAR: 24000,
      proofOfPaymentAttached: true,
      section20Compliance: true
    },
    {
      invoiceNumber: 'INV-2026-9215',
      supplierName: 'Industrial Heavy Machinery SA',
      supplierVatNumber: '4019284755',
      date: '2026-02-04',
      description: 'Automated Packaging Assembly Conveyor Module',
      totalConsiderationZAR: 92000,
      vatInputClaimedZAR: 12000,
      proofOfPaymentAttached: true,
      section20Compliance: true
    },
    {
      invoiceNumber: 'INV-2026-9400',
      supplierName: 'Cape Logistics & Cold Chain Freight',
      supplierVatNumber: '4481029384',
      date: '2026-02-12',
      description: 'Refrigerated Intermodal Container Lease & Port Transit',
      totalConsiderationZAR: 46000,
      vatInputClaimedZAR: 6000,
      proofOfPaymentAttached: true,
      section20Compliance: true
    }
  ];

  // Statutory Calculations for 21 Business Days & Section 45 Interest
  const calculationResults = useMemo(() => {
    const lodged = new Date(lodgedDate);
    const today = new Date();
    
    // Calculate calendar days
    const diffTime = today.getTime() - lodged.getTime();
    const calendarDaysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    
    // Approximate business days (excluding weekends: ~5 business days per 7 calendar days)
    // For precision, count actual non-weekend days
    let businessDaysElapsed = 0;
    const cur = new Date(lodged);
    while (cur <= today) {
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDaysElapsed++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    // Remove the starting day itself to calculate days elapsed
    businessDaysElapsed = Math.max(0, businessDaysElapsed - 1);

    const statutoryWindowDays = 21; // VAT Act Section 44(1)
    const delayedBusinessDays = Math.max(0, businessDaysElapsed - statutoryWindowDays);

    // Section 45 Prescribed Interest Calculation
    // Daily simple interest: Principal * (Rate / 365) * DelayedDays
    const dailyInterestRate = (sarsPrescribedRate / 100) / 365;
    const totalPrescribedInterestOwed = delayedBusinessDays > 0 
      ? Math.round(refundAmount * dailyInterestRate * delayedBusinessDays * 100) / 100 
      : 0;

    // TAA Section 191 Net Payout
    const totalSetOffs = incomeTaxDebtSetOff + payeDebtSetOff;
    const netCashPayout = Math.max(0, Math.round((refundAmount + totalPrescribedInterestOwed - totalSetOffs) * 100) / 100);

    // Calculate Statutory Target Payout Date (21 business days from lodgement)
    const deadlineDate = new Date(lodged);
    let addedBdays = 0;
    while (addedBdays < 21) {
      deadlineDate.setDate(deadlineDate.getDate() + 1);
      const dow = deadlineDate.getDay();
      if (dow !== 0 && dow !== 6) {
        addedBdays++;
      }
    }
    const formattedDeadline = deadlineDate.toISOString().split('T')[0];

    return {
      calendarDaysElapsed,
      businessDaysElapsed,
      statutoryWindowDays,
      delayedBusinessDays,
      dailyInterestRate: dailyInterestRate * 100,
      totalPrescribedInterestOwed,
      totalSetOffs,
      netCashPayout,
      formattedDeadline,
      isOverdue: delayedBusinessDays > 0
    };
  }, [lodgedDate, refundAmount, sarsPrescribedRate, incomeTaxDebtSetOff, payeDebtSetOff]);

  // Handle Preset Scenarios
  const handleSelectScenario = (scen: 'CURRENT' | 'EXPORTS' | 'SOLAR_CAPEX' | 'CUSTOM') => {
    setSelectedScenario(scen);
    if (scen === 'CURRENT') {
      setRefundAmount(currentEligibleRefund);
    } else if (scen === 'EXPORTS') {
      setRefundAmount(245000);
      showBanner?.('Loaded Zero-Rated Export Vendor Scenario (High Box 2 export supplies + local input tax refund).');
    } else if (scen === 'SOLAR_CAPEX') {
      setRefundAmount(385000);
      showBanner?.('Loaded Solar PV & Capital Machinery Acquisition Scenario (Large Box 14 capital input deduction).');
    }
  };

  // 1-Click Document Downloader: SARS Formal Section 44/45 Release Demand Letter
  const handleDownloadDemandLetter = () => {
    const ref = generateSubmissionRef('SARS-VAT-DEMAND');
    const content = [
      '====================================================================================',
      'FORMAL STATUTORY DEMAND FOR RELEASE OF VALUE-ADDED TAX REFUND & SECTION 45 INTEREST',
      'PURSUANT TO VALUE-ADDED TAX ACT NO. 89 OF 1991 (SECTIONS 44 & 45) & TAA NO. 28 OF 2011',
      '====================================================================================',
      `DATE OF DEMAND:               ${new Date().toISOString().split('T')[0]}`,
      `SUBMISSION REFERENCE:         ${ref}`,
      `TAX OFFICE:                   South African Revenue Service (SARS) Large Business / SME Center`,
      '',
      '1. VENDOR IDENTIFICATION & REGISTRATION PARTICULARS:',
      `   Vendor Legal Name:         ${profile.name}`,
      `   VAT Registration Number:   ${vatRegistrationNumber}`,
      `   CIPC Registration Number:  ${profile.registrationNumber || '2023/108924/07'}`,
      `   SARS Tax Reference:        ${profile.sarsTaxNumber || '9401829384'}`,
      `   Designated Public Officer: V Zenzile (TAA §246 Legal Attestation)`,
      '',
      '2. STATUTORY REFUND CLAIM PARTICULARS:',
      `   VAT Tax Period:            ${taxPeriod}`,
      `   Date Return Lodged:        ${lodgedDate}`,
      `   Principal Refund Claimed:  ${formatZAR(refundAmount)}`,
      `   Statutory 21-Day Deadline: ${calculationResults.formattedDeadline}`,
      `   Business Days Elapsed:     ${calculationResults.businessDaysElapsed} business days`,
      `   Statutory Delay Incurred:  ${calculationResults.delayedBusinessDays} business days past Section 44(1) deadline`,
      '',
      '3. SECTION 45 STATUTORY INTEREST COMPUTATION:',
      `   Official SARS Prescribed Rate: ${sarsPrescribedRate}% per annum`,
      `   Accrued Delayed Interest:     ${formatZAR(calculationResults.totalPrescribedInterestOwed)}`,
      `   Net Payout Demanded:          ${formatZAR(calculationResults.netCashPayout)}`,
      '',
      '4. SECTION 190 TAA BANKING VERIFICATION ATTESTATION:',
      `   Designated Bank:           ${bankName}`,
      `   Verified Account Number:   ${bankAccountMasked}`,
      '   Status:                    FICA and SARS Verified Commercial Account (TAA §190(2) Satisfied)',
      '',
      '5. LEGAL NOTICE & STATUTORY GROUNDS:',
      '   Notice is hereby served that under Section 44(1) of the VAT Act No. 89 of 1991,',
      '   the Commissioner is statutorily required to refund the excess input tax within 21',
      '   business days of receipt of the return. Where payment is delayed, interest accrues',
      '   at the prescribed rate in terms of Section 45 from the expiry of the 21-day period.',
      '',
      '   All supporting Section 20(4) tax invoices and proof of payment are ready and available',
      '   in the verified Audit Vault for immediate electronic transfer via eFiling.',
      '====================================================================================',
      'PREPARED VIA ZATAX COMPLIANCE ADVISOR • CANDIDATE ISV DIRECT GATEWAY ENGINE',
      '===================================================================================='
    ].join('\n');

    downloadBlobFile(`SARS_VAT_Refund_Demand_Letter_${ref}.txt`, content, 'text/plain;charset=utf-8;');
    addAuditLog?.('VAT_REFUND_DEMAND_LETTER_DOWNLOADED', `Generated formal statutory Section 44 demand letter for ${formatZAR(refundAmount)} (${ref}).`, 'info');
    showBanner?.(`📥 Downloaded SARS Section 44/45 VAT Refund Demand Letter (${ref})!`);
  };

  // 1-Click Download of Top Invoices Substantiation Schedule (CSV)
  const handleDownloadInvoicesSchedule = () => {
    const ref = generateSubmissionRef('SARS-VAT-AUDIT-SCHED');
    const headers = [
      '# ================================================================================',
      '# REPUBLIC OF SOUTH AFRICA • SARS VAT201 REFUND SUBSTANTIATION SCHEDULE',
      '# SECTION 20(4) COMPLIANT TAX INVOICE DOSSIER FOR AUDIT RELEASE',
      `# VENDOR: ${profile.name} [VAT: ${vatRegistrationNumber}]`,
      `# TAX PERIOD: ${taxPeriod}`,
      `# TOTAL REFUND CLAIMED: ${formatZAR(refundAmount)}`,
      '# ================================================================================',
      'INVOICE_NUMBER,SUPPLIER_NAME,SUPPLIER_VAT_NUMBER,INVOICE_DATE,DESCRIPTION,TOTAL_CONSIDERATION_ZAR,INPUT_VAT_CLAIMED_ZAR,POP_VERIFIED,SEC20_COMPLIANT'
    ];

    const rows = refundSubstantiationInvoices.map((inv) => 
      `"${inv.invoiceNumber}","${inv.supplierName}","${inv.supplierVatNumber}","${inv.date}","${inv.description}",${inv.totalConsiderationZAR},${inv.vatInputClaimedZAR},"${inv.proofOfPaymentAttached ? 'YES' : 'NO'}","${inv.section20Compliance ? 'COMPLIANT' : 'PENDING'}"`
    );

    const content = [...headers, ...rows].join('\n');
    downloadBlobFile(`SARS_VAT_Refund_Invoices_Schedule_${ref}.csv`, content, 'text/csv;charset=utf-8;');
    addAuditLog?.('VAT_REFUND_INVOICES_SCHEDULE_DOWNLOADED', `Downloaded VAT refund input tax substantiation schedule for ${taxPeriod}.`, 'info');
    showBanner?.('📥 Downloaded Section 20(4) Tax Invoice Substantiation Schedule!');
  };

  // Advance claim status in simulated sandbox
  const handleSimulateAuditPass = (claimId: string) => {
    setRefundClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          status: 'APPROVED_FOR_PAYMENT',
          notes: 'SARS Audit Panel completed verification. Refund approved for electronic bank transfer.'
        };
      }
      return c;
    }));
    addAuditLog?.('VAT_REFUND_STATUS_UPDATED', `SARS verification approved for refund claim ${claimId}.`, 'info');
    showBanner?.('✅ SARS Audit Verification Completed! Claim approved for bank transfer.');
  };

  const handleSimulateBankPayout = (claimId: string) => {
    setRefundClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          status: 'PAID_TO_BANK',
          delayedDays: 0,
          notes: `Statutory refund of ${formatZAR(c.netPayoutAmountZAR)} deposited into verified bank account.`
        };
      }
      return c;
    }));
    addAuditLog?.('VAT_REFUND_PAID_TO_BANK', `Simulated bank payout confirmed for ${claimId}.`, 'info');
    showBanner?.('🎉 Refund Deposited! Funds cleared into verified commercial bank account.');
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="vat-refund-manager-root">
      
      {/* 1. HERO REGULATORY BANNER & STATUS */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Client VAT Refund & Payout Hub</span>
                <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full font-bold">
                  SECTIONS 44 & 45 STATUTORY RECOVERY
                </span>
              </h2>
              <p className="text-xs text-white/60">
                Track SARS 21-business-day refund releases, compute Section 45 delayed refund interest, verify banking details, and prepare audit substantiation packs
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToLodgement && (
            <button
              onClick={onNavigateToLodgement}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 border border-white/15 cursor-pointer shadow-md"
              id="back-to-vat201-boxes-btn"
            >
              <Receipt className="w-3.5 h-3.5 text-indigo-400" />
              <span>Back to VAT201 Return</span>
            </button>
          )}

          <button
            onClick={handleDownloadDemandLetter}
            className="px-3.5 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            id="download-demand-letter-btn"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Demand Letter (Sec 44/45)</span>
          </button>

          <button
            onClick={handleDownloadInvoicesSchedule}
            className="px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-teal-500/20 cursor-pointer"
            id="download-invoices-sched-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Invoices Audit CSV</span>
          </button>
        </div>
      </div>

      {/* 2. STATUTORY REFUND AMOUNT & SCENARIO SELECTOR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* CURRENT POSITION CARD */}
        <div 
          onClick={() => handleSelectScenario('CURRENT')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedScenario === 'CURRENT'
              ? 'bg-teal-950/40 border-teal-500/50 ring-1 ring-teal-500/30'
              : 'bg-slate-900 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-white/50 uppercase font-bold">Current VAT201 Position</span>
            <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded font-bold">Active</span>
          </div>
          <div className="text-xl font-black font-mono text-teal-400">
            {formatZAR(currentEligibleRefund)}
          </div>
          <p className="text-[11px] text-white/60 mt-1">
            Linked directly to live VAT201 input deductions vs output tax.
          </p>
        </div>

        {/* ZERO-RATED EXPORT SCENARIO */}
        <div 
          onClick={() => handleSelectScenario('EXPORTS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedScenario === 'EXPORTS'
              ? 'bg-teal-950/40 border-teal-500/50 ring-1 ring-teal-500/30'
              : 'bg-slate-900 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-white/50 uppercase font-bold">Zero-Rated Exporter</span>
            <span className="text-[10px] font-mono text-cyan-300">Sec 11(1)</span>
          </div>
          <div className="text-xl font-black font-mono text-white">
            {formatZAR(245000)}
          </div>
          <p className="text-[11px] text-white/60 mt-1">
            Simulate 100% offshore client exports with high local input tax recovery.
          </p>
        </div>

        {/* SOLAR CAPEX SCENARIO */}
        <div 
          onClick={() => handleSelectScenario('SOLAR_CAPEX')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedScenario === 'SOLAR_CAPEX'
              ? 'bg-teal-950/40 border-teal-500/50 ring-1 ring-teal-500/30'
              : 'bg-slate-900 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-white/50 uppercase font-bold">Solar PV / Fixed Capex</span>
            <span className="text-[10px] font-mono text-amber-300">Sec 16(3)(a)</span>
          </div>
          <div className="text-xl font-black font-mono text-white">
            {formatZAR(385000)}
          </div>
          <p className="text-[11px] text-white/60 mt-1">
            Simulate large commercial solar array or machinery plant investment.
          </p>
        </div>

        {/* CUSTOM REFUND INPUT */}
        <div className="p-4 rounded-2xl border bg-slate-900 border-white/10 space-y-1.5">
          <label className="text-[10px] font-mono text-white/50 uppercase font-bold block">
            Custom Refund Amount (ZAR)
          </label>
          <input
            type="number"
            value={refundAmount}
            onChange={(e) => {
              setSelectedScenario('CUSTOM');
              setRefundAmount(Math.max(0, Number(e.target.value)));
            }}
            className="w-full bg-slate-950 border border-white/15 rounded-lg px-2.5 py-1 font-mono text-white text-sm font-bold"
            placeholder="e.g. 150000"
          />
          <p className="text-[10px] text-white/40">Enter client's specific audited refundable amount.</p>
        </div>

      </div>

      {/* 3. CORE 21-BUSINESS-DAY COUNTDOWN & STATUTORY TIMELINE CARD */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>Section 44(1) 21-Business-Day Statutory Refund Tracker</span>
            </h3>
            <p className="text-xs text-white/60">
              VAT Act mandates SARS to release refunds within 21 business days. Past this benchmark, Section 45 statutory interest accrues automatically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[10px] font-mono text-white/50">Return Lodged Date:</label>
            <input
              type="date"
              value={lodgedDate}
              onChange={(e) => setLodgedDate(e.target.value)}
              className="bg-slate-950 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
            />
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/10">
            <span className="text-white/40 block text-[10px] uppercase font-bold">Business Days Elapsed</span>
            <span className="text-2xl font-black text-white">{calculationResults.businessDaysElapsed}</span>
            <span className="text-[10px] text-white/40 block mt-0.5">out of 21 statutory days</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/10">
            <span className="text-white/40 block text-[10px] uppercase font-bold">Statutory Deadline Date</span>
            <span className="text-base font-bold text-cyan-300">{calculationResults.formattedDeadline}</span>
            <span className="text-[10px] text-white/40 block mt-0.5">Section 44(1) Benchmark</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/10">
            <span className="text-white/40 block text-[10px] uppercase font-bold">SARS Delay Status</span>
            <span className={`text-base font-bold flex items-center gap-1.5 ${
              calculationResults.isOverdue ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {calculationResults.isOverdue ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{calculationResults.delayedBusinessDays} Days Overdue</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Within 21-Day Window</span>
                </>
              )}
            </span>
            <span className="text-[10px] text-white/40 block mt-0.5">
              {calculationResults.isOverdue ? 'Sec 45 Interest Activated' : `${21 - calculationResults.businessDaysElapsed} days remaining`}
            </span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-teal-500/30">
            <span className="text-teal-400 block text-[10px] uppercase font-bold">Section 45 Interest Owed</span>
            <span className="text-2xl font-black text-teal-300">
              {formatZAR(calculationResults.totalPrescribedInterestOwed)}
            </span>
            <span className="text-[10px] text-white/40 block mt-0.5">
              at {sarsPrescribedRate}% Prescribed Rate
            </span>
          </div>
        </div>

        {/* VISUAL STEPPER TRACKER */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-[11px] font-bold text-white/70">
            <span>Stage 1: Lodgement</span>
            <span>Stage 2: Bank Check</span>
            <span>Stage 3: Audit Selection</span>
            <span>Stage 4: 21-Day Benchmark</span>
            <span>Stage 5: Payout</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 border border-white/10 overflow-hidden flex">
            <div className="bg-teal-500 h-full transition-all" style={{ width: `${Math.min(100, (calculationResults.businessDaysElapsed / 21) * 100)}%` }} />
            {calculationResults.isOverdue && (
              <div className="bg-rose-500 h-full animate-pulse transition-all" style={{ width: `${Math.min(50, (calculationResults.delayedBusinessDays / 21) * 100)}%` }} />
            )}
          </div>
          <div className="flex justify-between text-[10px] font-mono text-white/40">
            <span>Day 0 (Filing)</span>
            <span>Day 2 (TAA §190 Verified)</span>
            <span>Day 7 (Sec 46 RFI Notice)</span>
            <span>Day 21 (Mandatory Release)</span>
            <span className={calculationResults.isOverdue ? 'text-rose-400 font-bold' : ''}>
              {calculationResults.isOverdue ? `Day ${21 + calculationResults.delayedBusinessDays} (Interest Accruing)` : 'Direct Payout'}
            </span>
          </div>
        </div>

      </div>

      {/* 4. SECTION 45 INTEREST CALCULATOR & TAA 190/191 SET-OFF RECONCILIATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION 45 DELAYED REFUND INTEREST CALCULATOR */}
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Section 45 Statutory Interest Calculator
              </h3>
            </div>
            <span className="text-[10px] font-mono text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full font-bold">
              SARS PRESCRIBED RATE: {sarsPrescribedRate}%
            </span>
          </div>

          <p className="text-xs text-white/60 leading-relaxed">
            Under Section 45 of the VAT Act, where a refund is not paid within 21 business days after receipt of the return, interest is calculated at the prescribed rate for each day until payment is released.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] text-white/60 font-semibold">SARS Prescribed Rate (% per annum)</label>
                <span className="font-mono text-white/40">TAA §187 / §189 Gazette Rate</span>
              </div>
              <input
                type="number"
                step="0.25"
                value={sarsPrescribedRate}
                onChange={(e) => setSarsPrescribedRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 font-mono text-white font-bold"
              />
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-white/10 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between text-white/60">
                <span>Principal Refund Amount:</span>
                <span className="text-white font-bold">{formatZAR(refundAmount)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Daily Interest Factor:</span>
                <span className="text-cyan-300 font-bold">{calculationResults.dailyInterestRate.toFixed(6)}% per day</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Daily Interest Accrual:</span>
                <span className="text-white font-bold">
                  {formatZAR(refundAmount * (sarsPrescribedRate / 100 / 365))} / day
                </span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Delayed Days Beyond 21 Days:</span>
                <span className="text-rose-400 font-bold">{calculationResults.delayedBusinessDays} business days</span>
              </div>
              <div className="flex justify-between text-teal-300 font-bold border-t border-white/10 pt-2 text-xs">
                <span>TOTAL ACCRUED INTEREST (SARS OWES CLIENT):</span>
                <span>{formatZAR(calculationResults.totalPrescribedInterestOwed)}</span>
              </div>
            </div>

            <div className="p-3 bg-teal-950/30 border border-teal-500/20 rounded-xl text-[11px] text-teal-200">
              💡 <strong>Statutory Advice:</strong> If SARS pauses the refund due to an unaddressed Section 46 document request or incorrect bank details, Section 45 interest stops accruing for the duration of the delay caused by the taxpayer.
            </div>
          </div>
        </div>

        {/* TAA 190 BANKING VERIFICATION & TAA 191 SET-OFF RECONCILIATION */}
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Banking Verification & Debt Set-Off (TAA §190 / §191)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
              BANK VERIFIED
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* BANK VERIFICATION STRIP */}
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-white/40 block uppercase font-bold">Designated Commercial Account</span>
                <span className="text-white font-bold text-xs">{bankName}</span>
                <span className="text-[11px] font-mono text-white/60 block">{bankAccountMasked}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  TAA §190(2) Satisfied
                </span>
                <p className="text-[10px] text-white/40 mt-1">Verified with SARB Bankserv</p>
              </div>
            </div>

            {/* SET-OFF SIMULATION INPUTS */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] text-white/50 uppercase font-bold block">
                TAA §191 Cross-Tax Set-Off Audit (Other SARS Debts)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-white/50 block mb-0.5">Corporate Income Tax (ITR14)</label>
                  <input
                    type="number"
                    value={incomeTaxDebtSetOff}
                    onChange={(e) => setIncomeTaxDebtSetOff(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-white/15 rounded-lg px-2.5 py-1 font-mono text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-0.5">Payroll PAYE Debt (EMP201)</label>
                  <input
                    type="number"
                    value={payeDebtSetOff}
                    onChange={(e) => setPayeDebtSetOff(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-white/15 rounded-lg px-2.5 py-1 font-mono text-white"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* NET CASH PAYOUT SUMMARY */}
            <div className="bg-black/60 p-3.5 rounded-2xl border border-white/10 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between text-white/60">
                <span>Principal Refund:</span>
                <span className="text-white">{formatZAR(refundAmount)}</span>
              </div>
              <div className="flex justify-between text-teal-300">
                <span>+ Section 45 Interest:</span>
                <span>+{formatZAR(calculationResults.totalPrescribedInterestOwed)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>- TAA §191 Set-offs:</span>
                <span>-{formatZAR(calculationResults.totalSetOffs)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-black border-t border-white/10 pt-2 text-sm">
                <span>ESTIMATED NET BANK DEPOSIT:</span>
                <span>{formatZAR(calculationResults.netCashPayout)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 5. ACTIVE & HISTORICAL VAT REFUND CLAIMS TABLE */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Client VAT Refund Claims Ledger & SARS Audit Log
            </h3>
          </div>
          <span className="text-[10px] font-mono text-white/50">
            {refundClaims.length} Claims Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-[10px] uppercase">
                <th className="pb-2">Claim Ref & Period</th>
                <th className="pb-2">Lodged Date</th>
                <th className="pb-2">Principal Refund</th>
                <th className="pb-2">Sec 45 Interest</th>
                <th className="pb-2">Net Payout</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {refundClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-white/5 transition">
                  <td className="py-3">
                    <span className="text-white font-bold block">{claim.claimRef}</span>
                    <span className="text-[10px] text-white/50">{claim.taxPeriod}</span>
                  </td>
                  <td className="py-3 text-white/70">
                    {claim.lodgedDate}
                  </td>
                  <td className="py-3 text-teal-300 font-bold">
                    {formatZAR(claim.refundAmountZAR)}
                  </td>
                  <td className="py-3 text-teal-400">
                    {claim.prescribedInterestOwedBySars > 0 ? `+${formatZAR(claim.prescribedInterestOwedBySars)}` : 'R0.00'}
                  </td>
                  <td className="py-3 text-white font-black">
                    {formatZAR(claim.netPayoutAmountZAR)}
                  </td>
                  <td className="py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-block ${
                      claim.status === 'PAID_TO_BANK'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : claim.status === 'APPROVED_FOR_PAYMENT'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        : claim.status === 'UNDER_SARS_AUDIT'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-white/10 text-white/70 border-white/20'
                    }`}>
                      {claim.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {claim.status === 'UNDER_SARS_AUDIT' && (
                        <button
                          onClick={() => handleSimulateAuditPass(claim.id)}
                          className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Verify Audit
                        </button>
                      )}
                      {claim.status === 'APPROVED_FOR_PAYMENT' && (
                        <button
                          onClick={() => handleSimulateBankPayout(claim.id)}
                          className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Confirm Payout
                        </button>
                      )}
                      <button
                        onClick={handleDownloadDemandLetter}
                        title="Download Dossier"
                        className="p-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. SECTION 20(4) TOP INPUT INVOICES AUDIT SUBSTANTIATION GRID */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Section 20(4) Primary Input Invoices Substantiating Refund
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
            100% PROOF OF PAYMENT ATTACHED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {refundSubstantiationInvoices.map((inv, idx) => (
            <div key={idx} className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/10 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-white block">{inv.supplierName}</span>
                  <span className="text-[10px] font-mono text-white/50">VAT: {inv.supplierVatNumber} • Inv: {inv.invoiceNumber}</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  {formatZAR(inv.vatInputClaimedZAR)} VAT
                </span>
              </div>
              <p className="text-[11px] text-white/70">{inv.description}</p>
              <div className="flex justify-between text-[10px] font-mono text-white/50 border-t border-white/5 pt-1.5">
                <span>Total Consideration: <strong className="text-white">{formatZAR(inv.totalConsiderationZAR)}</strong></span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <Check className="w-3 h-3" /> Stamped POP Attached
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

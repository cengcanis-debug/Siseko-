import React, { useState } from 'react';
import {
  Building,
  FlaskConical,
  Briefcase,
  Layers,
  Scale,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  FileText,
  DollarSign,
  Download,
  Lock,
  Sparkles,
  Info,
  Calendar,
  Percent,
  Check,
  RefreshCw,
  Sun,
  Globe,
  Zap,
  FileCheck2,
  GraduationCap,
  Users,
  Award
} from 'lucide-react';
import { UserTaxProfile, RoleType } from '../types';
import { formatZAR } from '../utils/taxCalculations';
import { downloadBlobFile, generateSubmissionRef } from '../utils/systemBridge';

interface StatutoryEnhancementsHubProps {
  profile: UserTaxProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserTaxProfile>>;
  currentUserRole: RoleType;
  checkPermission: (action: string) => boolean;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  onNavigateToVault?: () => void;
  onNavigateToVdp?: () => void;
  onNavigateToTaxPro?: () => void;
}

export const StatutoryEnhancementsHub: React.FC<StatutoryEnhancementsHubProps> = ({
  profile,
  setProfile,
  currentUserRole,
  checkPermission,
  addAuditLog,
  showBanner,
  onNavigateToVault,
  onNavigateToVdp,
  onNavigateToTaxPro
}) => {
  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<
    's13sex' | 's11d' | 's24c' | 's12ba' | 's6quat' | 'debt_concessions' | 'advanced_concessions' | 's12h'
  >('s13sex');

  // Local working state for Section 13sex
  const [unitsCount, setUnitsCount] = useState<number>(profile.unitsCount || 6);
  const [unitCost, setUnitCost] = useState<number>(profile.unitCost || 850000);
  const [isLowCost, setIsLowCost] = useState<boolean>(Boolean(profile.isLowCost));
  const [is13sexActive, setIs13sexActive] = useState<boolean>(Boolean(profile.is13sexFiled));

  // Local working state for Section 11D R&D
  const [rdSalaries, setRdSalaries] = useState<number>(profile.rdSalaries || 480000);
  const [rdMaterials, setRdMaterials] = useState<number>(profile.rdMaterials || 220000);
  const [rdApproved, setRdApproved] = useState<boolean>(profile.rdApproved !== undefined ? profile.rdApproved : true);
  const [is11DActive, setIs11DActive] = useState<boolean>(Boolean(profile.is11DApplied));

  // Local working state for Section 24C
  const [contractRevenue, setContractRevenue] = useState<number>(profile.contractRevenue || 1400000);
  const [futureCosts, setFutureCosts] = useState<number>(profile.futureCosts || 650000);
  const [is24CActive, setIs24CActive] = useState<boolean>(Boolean(profile.is24CClaimed));

  // Local working state for Section 12BA (125% Renewable Energy Super-Allowance)
  const [solarCost, setSolarCost] = useState<number>(profile.solarSystemCost || 450000);
  const [hasSolarCoc, setHasSolarCoc] = useState<boolean>(profile.hasSolarCocInVault !== undefined ? profile.hasSolarCocInVault : true);
  const [hasEskomApproval, setHasEskomApproval] = useState<boolean>(profile.hasEskomGridTieApproval !== undefined ? profile.hasEskomGridTieApproval : true);
  const [is12BAActive, setIs12BAActive] = useState<boolean>(profile.is12BAApplied !== undefined ? profile.is12BAApplied : true);

  // Local working state for Section 6quat Foreign Tax Credit
  const [foreignIncome6quat, setForeignIncome6quat] = useState<number>(profile.foreignTaxableIncome || 180000);
  const [foreignTaxWithheld, setForeignTaxWithheld] = useState<number>(profile.foreignTaxWithheldZAR || 27000);
  const [foreignJurisdiction, setForeignJurisdiction] = useState<string>(profile.foreignTaxJurisdiction || 'United Kingdom (15% Treaty Rate)');
  const [hasForeignTaxVoucher, setHasForeignTaxVoucher] = useState<boolean>(profile.hasForeignTaxVoucherInVault !== undefined ? profile.hasForeignTaxVoucherInVault : true);
  const [is6quatActive, setIs6quatActive] = useState<boolean>(profile.is6quatApplied !== undefined ? profile.is6quatApplied : true);

  // Local working state for Paragraph 12A / Section 19 Debt Concessions
  const [debtReductionAmount, setDebtReductionAmount] = useState<number>(profile.debtReductionAmount || 500000);
  const [debtAssetCost, setDebtAssetCost] = useState<number>(profile.debtReductionAssetCost || 350000);
  const [hasDebtAgreement, setHasDebtAgreement] = useState<boolean>(profile.hasDebtAgreementInVault !== undefined ? profile.hasDebtAgreementInVault : true);
  const [isDebtReductionActive, setIsDebtReductionActive] = useState<boolean>(profile.isParagraph12AApplied !== undefined ? profile.isParagraph12AApplied : true);

  // Local working state for Advanced Concessions (24J, 11(gC), 10B)
  const [interestPrincipal, setInterestPrincipal] = useState<number>(profile.interestPrincipal || 2000000);
  const [interestRate, setInterestRate] = useState<number>(profile.interestRate || 11.25);
  const [is24JActive, setIs24JActive] = useState<boolean>(Boolean(profile.isSection24JApplied));

  const [researchEquipmentCost, setResearchEquipmentCost] = useState<number>(profile.researchEquipmentCost || 750000);
  const [is11gCActive, setIs11gCActive] = useState<boolean>(Boolean(profile.isSection11gCApplied));

  const [foreignDividends, setForeignDividends] = useState<number>(profile.foreignDividendsReceived || 120000);
  const [isParticipationExemption, setIsParticipationExemption] = useState<boolean>(Boolean(profile.isForeignParticipationExemption));
  const [is10BActive, setIs10BActive] = useState<boolean>(Boolean(profile.isSection10BApplied));

  // Local working state for Section 12H Learnership Allowance
  const [learnersCount, setLearnersCount] = useState<number>(profile.learnersCount || 6);
  const [disabledLearnersCount, setDisabledLearnersCount] = useState<number>(profile.disabledLearnersCount || 2);
  const [learnershipNqfLevel, setLearnershipNqfLevel] = useState<'NQF 1-6' | 'NQF 7-10'>(profile.learnershipNqfLevel || 'NQF 1-6');
  const [isLearnershipCompleted, setIsLearnershipCompleted] = useState<boolean>(profile.isLearnershipCompletedInYear !== undefined ? profile.isLearnershipCompletedInYear : true);
  const [hasSetaRegistration, setHasSetaRegistration] = useState<boolean>(profile.hasSetaRegistrationInVault !== undefined ? profile.hasSetaRegistrationInVault : true);
  const [setaRegNumber, setSetaRegNumber] = useState<string>(profile.setaRegistrationNumber || 'SETA-W&R-2026-8891');
  const [is12HActive, setIs12HActive] = useState<boolean>(profile.is12HApplied !== undefined ? profile.is12HApplied : true);

  // Calculations for Section 12H
  const isNqf1to6 = learnershipNqfLevel !== 'NQF 7-10';
  const baseRate12H = isNqf1to6 ? 40000 : 20000;
  const disabledRate12H = isNqf1to6 ? 60000 : 50000;
  const normalLearners = Math.max(0, learnersCount - disabledLearnersCount);
  const validDisabledLearners = Math.min(learnersCount, disabledLearnersCount);

  const annual12HAllowance = is12HActive && hasSetaRegistration
    ? (normalLearners * baseRate12H) + (validDisabledLearners * disabledRate12H)
    : 0;
  const completion12HAllowance = is12HActive && hasSetaRegistration && isLearnershipCompleted
    ? (normalLearners * baseRate12H) + (validDisabledLearners * disabledRate12H)
    : 0;
  const total12HAllowance = annual12HAllowance + completion12HAllowance;
  const taxSavings12H = total12HAllowance * (profile.taxBracketRate || 0.31);

  // Calculations for Section 13sex
  const rate13sex = isLowCost ? 0.10 : 0.05;
  const totalCost13sex = unitsCount * unitCost;
  const annualAllowance13sex = is13sexActive && unitsCount >= 5 ? totalCost13sex * rate13sex : 0;
  const taxSavings13sex = annualAllowance13sex * (profile.taxBracketRate || 0.31);

  // Calculations for Section 11D
  const totalRdSpend = rdSalaries + rdMaterials;
  const superDeduction11D = is11DActive && rdApproved ? totalRdSpend * 0.5 : 0;
  const totalDeduction11D = is11DActive && rdApproved ? totalRdSpend * 1.5 : (is11DActive ? totalRdSpend : 0);
  const extraTaxSavings11D = superDeduction11D * (profile.taxBracketRate || 0.31);

  // Calculations for Section 24C
  const allowance24C = is24CActive ? Math.min(contractRevenue, futureCosts * 0.65) : 0;
  const taxSavings24C = allowance24C * (profile.taxBracketRate || 0.31);

  // Calculations for Section 12BA (125% Super-Allowance)
  const allowance12BA = is12BAActive && hasSolarCoc ? solarCost * 1.25 : 0;
  const regular12BComparison = solarCost * 0.50; // Standard 50% year 1 under section 12B
  const additional12BASuperShield = Math.max(0, allowance12BA - regular12BComparison);
  const taxSavings12BA = allowance12BA * (profile.taxBracketRate || 0.31);

  // Calculations for Section 6quat Foreign Tax Credit
  // Formula: (Foreign Taxable Income / Total Taxable Income) * Normal Tax Payable
  const estimatedGrossForLimitation = 1450000;
  const tentativeTaxable = Math.max(100000, estimatedGrossForLimitation - (annualAllowance13sex + superDeduction11D + allowance24C + allowance12BA + total12HAllowance));
  const tentativeNormalTax = tentativeTaxable * (profile.taxBracketRate || 0.31);
  const statutory6quatRatio = Math.min(1, foreignIncome6quat / tentativeTaxable);
  const maxAllowable6quatRebate = is6quatActive && hasForeignTaxVoucher ? Math.min(foreignTaxWithheld, statutory6quatRatio * tentativeNormalTax) : 0;
  const excessCredit6quatCarriedForward = is6quatActive && hasForeignTaxVoucher ? Math.max(0, foreignTaxWithheld - maxAllowable6quatRebate) : 0;

  // Calculations for Paragraph 12A / Section 19 Debt Concessions
  const baseCostReduction = isDebtReductionActive && hasDebtAgreement ? Math.min(debtReductionAmount, debtAssetCost) : 0;
  const excessDebtCompromise = isDebtReductionActive && hasDebtAgreement ? Math.max(0, debtReductionAmount - debtAssetCost) : 0;
  const taxableRecoupmentOrGain = excessDebtCompromise * 0.80; // inclusion rate for corporate CGT

  // Calculations for Advanced Concessions (24J, 11(gC), 10B)
  const allowance24J = is24JActive ? interestPrincipal * (interestRate / 100) : 0;
  const allowance11gC = is11gCActive ? researchEquipmentCost * 0.50 : 0;
  const exemption10B = is10BActive ? (isParticipationExemption ? foreignDividends : foreignDividends * (25 / 45)) : 0;
  const totalAdvancedDeduction = allowance24J + allowance11gC + exemption10B;
  const taxSavingsAdvanced = totalAdvancedDeduction * (profile.taxBracketRate || 0.31);

  // Total annual tax deductions gained across all enhancements
  const totalEnhancedDeductions = annualAllowance13sex + superDeduction11D + allowance24C + allowance12BA + totalAdvancedDeduction + total12HAllowance;
  const totalNetTaxShield = (totalEnhancedDeductions * (profile.taxBracketRate || 0.31)) + maxAllowable6quatRebate;

  // Save changes to Global User Profile
  const handleApplyChanges = () => {
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role ${currentUserRole} cannot modify statutory enhancement claims.`);
      return;
    }

    setProfile(prev => ({
      ...prev,
      is13sexFiled: is13sexActive,
      unitsCount,
      unitCost,
      isLowCost,
      is11DApplied: is11DActive,
      rdSalaries,
      rdMaterials,
      rdApproved,
      is24CClaimed: is24CActive,
      contractRevenue,
      futureCosts,
      is12BAApplied: is12BAActive,
      solarSystemCost: solarCost,
      hasSolarCocInVault: hasSolarCoc,
      hasEskomGridTieApproval: hasEskomApproval,
      is12HApplied: is12HActive,
      learnersCount,
      disabledLearnersCount: validDisabledLearners,
      learnershipNqfLevel,
      isLearnershipCompletedInYear: isLearnershipCompleted,
      hasSetaRegistrationInVault: hasSetaRegistration,
      setaRegistrationNumber: setaRegNumber,
      is6quatApplied: is6quatActive,
      foreignTaxableIncome: foreignIncome6quat,
      foreignTaxWithheldZAR: foreignTaxWithheld,
      foreignTaxJurisdiction: foreignJurisdiction,
      hasForeignTaxVoucherInVault: hasForeignTaxVoucher,
      isParagraph12AApplied: isDebtReductionActive,
      debtReductionAmount,
      debtReductionAssetCost: debtAssetCost,
      hasDebtAgreementInVault: hasDebtAgreement,
      isSection24JApplied: is24JActive,
      interestPrincipal,
      interestRate,
      isSection11gCApplied: is11gCActive,
      researchEquipmentCost,
      isSection10BApplied: is10BActive,
      foreignDividendsReceived: foreignDividends,
      isForeignParticipationExemption: isParticipationExemption
    }));

    addAuditLog(
      'STATUTORY_ENHANCEMENTS_APPLIED',
      `Updated statutory enhancement claims: S13sex (${is13sexActive ? formatZAR(annualAllowance13sex) : 'OFF'}), S11D (${is11DActive ? formatZAR(superDeduction11D) : 'OFF'}), S12H Learnership (${is12HActive ? formatZAR(total12HAllowance) : 'OFF'}), S24C (${is24CActive ? formatZAR(allowance24C) : 'OFF'}), S12BA Solar (${is12BAActive ? formatZAR(allowance12BA) : 'OFF'}), S6quat Rebate (${is6quatActive ? formatZAR(maxAllowable6quatRebate) : 'OFF'}), Advanced Concessions (${formatZAR(totalAdvancedDeduction)}). Total Tax Shield: ${formatZAR(totalNetTaxShield)}.`,
      'info'
    );

    showBanner(`🛡️ Applied Statutory Enhancements! Total annual tax shield: ${formatZAR(totalNetTaxShield)}.`);
  };

  const handleDownloadStatutorySchedule = () => {
    if (!checkPermission('canDownloadLedger')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" is not authorized to export statutory tax schedules. Requires Owner, Accountant, or Auditor.`);
      return;
    }

    const timestamp = new Date().toISOString();
    const submissionRef = generateSubmissionRef('SARS-STATUTORY');
    const companyName = profile?.name || 'Ilitha Fintech Operations (Pty) Ltd';
    const taxNumber = profile?.sarsTaxNumber || '9304318273';

    const headers = [
      '# =====================================================================',
      '# REPUBLIC OF SOUTH AFRICA - INCOME TAX ACT NO. 58 OF 1962',
      '# STATUTORY TAX ENHANCEMENTS & ADVANCED CONCESSIONS SCHEDULE',
      `# SUBMISSION REFERENCE: ${submissionRef}`,
      `# TAXPAYER ENTITY: ${companyName} [Tax Ref: ${taxNumber}]`,
      `# EXPORT TIMESTAMP: ${timestamp}`,
      `# TOTAL NET TAX SHIELD: ${totalNetTaxShield}`,
      `# APPLIED NORMAL TAX RATE: ${((profile.taxBracketRate || 0.27) * 100).toFixed(0)}%`,
      '# =====================================================================',
      '',
      'STATUTORY_INCENTIVE_SECTION,CLAIM_STATUS,BASE_QUALIFYING_AMOUNT_ZAR,ALLOWANCE_OR_DEDUCTION_ZAR,TAX_SHIELD_SAVINGS_ZAR,VERIFICATION_STATUS'
    ];

    const rows = [
      `"Section 13sex (Residential Units)",${is13sexActive ? '"ACTIVE"' : '"INACTIVE"'},${unitsCount * unitCost},${annualAllowance13sex},${annualAllowance13sex * (profile.taxBracketRate || 0.27)},"${unitsCount} Units (${isLowCost ? '10% Low-Cost' : '5% Standard'})"`,
      `"Section 11D (Scientific R&D 150%)",${is11DActive ? '"ACTIVE"' : '"INACTIVE"'},${rdSalaries + rdMaterials},${superDeduction11D},${superDeduction11D * (profile.taxBracketRate || 0.27)},"${rdApproved ? 'DSI Pre-Approval Verified' : 'Pending DSI Committee'}"`,
      `"Section 12H (SETA Learnerships)",${is12HActive ? '"ACTIVE"' : '"INACTIVE"'},${learnersCount * 40000},${total12HAllowance},${total12HAllowance * (profile.taxBracketRate || 0.27)},"${learnersCount} Learners (${validDisabledLearners} Disabled, ${learnershipNqfLevel}) [SETA: ${hasSetaRegistration ? setaRegNumber : 'Pending'}]"`,
      `"Section 12BA (Renewable Energy 125%)",${is12BAActive ? '"ACTIVE"' : '"INACTIVE"'},${solarCost},${allowance12BA},${allowance12BA * (profile.taxBracketRate || 0.27)},"${hasSolarCoc ? 'Electrical CoC Verified in Vault' : 'CoC Pending'}"`,
      `"Section 24C (Future Contract Costs)",${is24CActive ? '"ACTIVE"' : '"INACTIVE"'},${contractRevenue},${allowance24C},${allowance24C * (profile.taxBracketRate || 0.27)},"Performance Margin: ${((futureCosts / (contractRevenue || 1)) * 100).toFixed(0)}%"`,
      `"Section 6quat (Foreign Tax Credit)",${is6quatActive ? '"ACTIVE"' : '"INACTIVE"'},${foreignIncome6quat},${maxAllowable6quatRebate},${maxAllowable6quatRebate},"${foreignJurisdiction} (Foreign Withholding: ${foreignTaxWithheld})"`,
      `"Section 24J (Incurred Interest Yield)",${is24JActive ? '"ACTIVE"' : '"INACTIVE"'},${interestPrincipal},${allowance24J},${allowance24J * (profile.taxBracketRate || 0.27)},"Principal: ${formatZAR(interestPrincipal)} @ ${interestRate}% p.a."`,
      `"Section 11(gC) (R&D Equipment 50%)",${is11gCActive ? '"ACTIVE"' : '"INACTIVE"'},${researchEquipmentCost},${allowance11gC},${allowance11gC * (profile.taxBracketRate || 0.27)},"Equipment Cost: ${formatZAR(researchEquipmentCost)} (50% Yr 1 Write-off)"`,
      `"Section 10B (Foreign Dividends Exemption)",${is10BActive ? '"ACTIVE"' : '"INACTIVE"'},${foreignDividends},${exemption10B},${exemption10B * (profile.taxBracketRate || 0.27)},"${isParticipationExemption ? '100% Participation Exemption (≥10% Equity)' : 'Partial Exemption (25/45 Ratio)'}"`,
      `"Section 19 & Par 12A (Debt Compromise)",${isDebtReductionActive ? '"ACTIVE"' : '"INACTIVE"'},${debtReductionAmount},${baseCostReduction},${taxableRecoupmentOrGain},"${hasDebtAgreement ? 'Subordination/Compromise Agreement Verified' : 'Agreement Pending'}"`
    ];

    const csvContent = [...headers, ...rows].join('\n');
    downloadBlobFile(
      `SARS_Statutory_Incentives_${submissionRef}.csv`,
      csvContent,
      'text/csv;charset=utf-8;'
    );

    addAuditLog(
      'STATUTORY_SCHEDULE_EXPORTED',
      `Exported Statutory Tax Enhancements Schedule CSV (${submissionRef}). Total annual tax shield: ${formatZAR(totalNetTaxShield)}.`,
      'info'
    );
    showBanner(`📥 Statutory Incentives Schedule (${submissionRef}) downloaded!`);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="statutory-enhancements-hub">
      
      {/* 1. TOP STATUTORY & REGULATORY DISCLAIMER BANNER */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  STATUTORY ENHANCEMENT PHASE
                </span>
                <span className="text-[10.5px] font-mono text-cyan-300 font-bold">
                  S13sex • S11D • S24C • Phase 12 Concessions
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white tracking-wide mt-0.5">
                Statutory Tax Enhancements & Advanced Concessions Hub
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadStatutorySchedule}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              id="export-statutory-schedule-btn"
              title="Download Section 13sex, 11D, 12H, 12BA, 24C, and 6quat statutory deductions schedule"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Concessions CSV</span>
            </button>

            {onNavigateToTaxPro && (
              <button
                onClick={onNavigateToTaxPro}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/40 hover:to-teal-600/40 text-emerald-200 border border-emerald-500/40 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                id="statutory-collaborate-tax-pro-btn"
                title="Share statutory deductions with registered tax practitioner under Section 240 TAA"
              >
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tax Practitioner Sign-Off</span>
              </button>
            )}

            <button
              onClick={handleApplyChanges}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply & Save Statutory Claims</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-purple-200/90 leading-relaxed">
          Configure and claim high-value statutory allowances under the Income Tax Act 58 of 1962: 
          <strong> Section 13sex</strong> residential building write-offs (up to 10% per annum), 
          <strong> Section 11D</strong> DSI-approved scientific research 150% super-deductions, 
          <strong> Section 24C</strong> future contractual expenditure provisions, and 
          <strong> Phase 12</strong> debt concessions and interest amortization.
        </p>

        <div className="pt-1 text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-white/10">
          <span>Notice: Simulated Statutory Model. All gateway accreditations and formal certifications are pending regulatory approval.</span>
          <span className="text-amber-300 font-bold">Role: {currentUserRole}</span>
        </div>
      </div>

      {/* 2. SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        
        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>S13sex Property</span>
            <Building className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-base font-bold font-mono text-purple-300">
            {formatZAR(annualAllowance13sex)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {unitsCount} Units ({rate13sex * 100}% p.a.)
          </div>
        </div>

        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>S11D R&D (150%)</span>
            <FlaskConical className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-base font-bold font-mono text-cyan-300">
            {formatZAR(superDeduction11D)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {rdApproved ? 'DSI Approved' : 'Pending Approval'}
          </div>
        </div>

        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>S12H Learnership</span>
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold font-mono text-emerald-300">
            {formatZAR(total12HAllowance)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {learnersCount} Learners ({validDisabledLearners} Disabled)
          </div>
        </div>

        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>S12BA Solar 125%</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold font-mono text-amber-300">
            {formatZAR(allowance12BA)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {hasSolarCoc ? 'CoC Verified in Vault' : 'Missing CoC'}
          </div>
        </div>

        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>S24C Contracts</span>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-base font-bold font-mono text-indigo-300">
            {formatZAR(allowance24C)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Future Performance Cost
          </div>
        </div>

        <div className="bg-[#0D1527] border border-white/10 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>S6quat Tax Rebate</span>
            <Globe className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-base font-bold font-mono text-teal-300">
            {formatZAR(maxAllowable6quatRebate)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Foreign Tax Credit Shield
          </div>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
            <span>Total Tax Shield</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold font-mono text-emerald-300">
            {formatZAR(totalNetTaxShield)}
          </div>
          <div className="text-[10px] text-emerald-300/80 font-mono">
            At {((profile.taxBracketRate || 0.31) * 100).toFixed(0)}% Normal Rate
          </div>
        </div>

      </div>

      {/* PROACTIVE DISCLOSURE SAFEGUARD FOR ENHANCEMENT OVERSIGHTS */}
      <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-indigo-950/40 border border-teal-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-white flex items-center gap-2">
              <span>Proactive Disclosure Safeguard for Statutory Claims (TAA §225–233)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                0% Understatement Penalty
              </span>
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed max-w-3xl">
              Claiming Section 13sex, 11D, 12BA, or 24C statutory allowances requires strict evidentiary compliance. If any statutory concession was claimed inadvertently or without prerequisite departmental approvals in previous filings, lodge a <strong>Proactive Voluntary Disclosure (VDP)</strong> prior to audit notification to eliminate standard 50% understatement penalties and obtain statutory immunity from criminal prosecution.
            </p>
          </div>
        </div>

        {onNavigateToVdp && (
          <button
            onClick={onNavigateToVdp}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 transition cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>Launch Proactive VDP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. MAIN WORKBENCH & STATUTORY MODULE TABS */}
      <div className="bg-[#0D1527] border border-white/10 rounded-3xl p-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setActiveSubTab('s13sex')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 's13sex'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <Building className="w-4 h-4 text-purple-400" />
            <span>S13sex Residential Units</span>
          </button>

          <button
            onClick={() => setActiveSubTab('s11d')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 's11d'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <span>S11D R&D (150%)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('s12h')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 's12h'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>S12H Learnerships</span>
          </button>

          <button
            onClick={() => setActiveSubTab('s12ba')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 's12ba'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-400" />
            <span>S12BA Renewable Energy (125%)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('s24c')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 's24c'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span>S24C Future Expenditure</span>
          </button>

          <button
            onClick={() => setActiveSubTab('s6quat')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 's6quat'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <Globe className="w-4 h-4 text-teal-400" />
            <span>S6quat Foreign Tax Rebate</span>
          </button>

          <button
            onClick={() => setActiveSubTab('debt_concessions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'debt_concessions'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <Scale className="w-4 h-4 text-rose-400" />
            <span>S19 & Par 12A Debt Compromise</span>
          </button>

          <button
            onClick={() => setActiveSubTab('advanced_concessions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'advanced_concessions'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Phase 12 Corporate Concessions</span>
          </button>
        </div>

        {/* SUBTAB 1: SECTION 13SEX RESIDENTIAL BUILDING ALLOWANCE */}
        {activeSubTab === 's13sex' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Section 13sex: Residential Unit Building Allowance
                </h3>
                <p className="text-xs text-slate-400">
                  Claim 5% (standard) or 10% (low-cost) annual write-off on new and unused residential units acquired for trade (min 5 units required).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <input
                    type="checkbox"
                    checked={is13sexActive}
                    onChange={(e) => setIs13sexActive(e.target.checked)}
                    className="rounded border-white/20 accent-purple-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-white">
                    {is13sexActive ? 'Claim Active on ITR14' : 'Claim Inactive'}
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Form Inputs */}
              <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-white/10">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                    Number of Qualifying Units (Statutory Minimum: 5 Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={unitsCount}
                    onChange={(e) => setUnitsCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-400"
                  />
                  {unitsCount < 5 && (
                    <div className="text-[10.5px] text-rose-400 mt-1 flex items-center gap-1 font-mono">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Statutory Disqualification: Section 13sex(1) requires at least 5 residential units!</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                    Average Cost Price per Unit (ZAR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">R</span>
                    <input
                      type="number"
                      step="50000"
                      value={unitCost}
                      onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLowCost}
                      onChange={(e) => setIsLowCost(e.target.checked)}
                      className="rounded border-white/20 accent-purple-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-purple-200">
                      Qualifies as Low-Cost Residential Unit (Section 13sex(8))
                    </span>
                  </label>
                  <p className="text-[10.5px] text-slate-400 pl-5">
                    Accelerates the annual building allowance from 5% to <strong>10% per annum</strong> (10-year complete write-off) for certified low-cost units complying with SARS gazetted cost limits.
                  </p>
                </div>
              </div>

              {/* Live Calculation & Vault Corroboration */}
              <div className="space-y-4 bg-slate-950/80 p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-white/10 pb-2">
                    Section 13sex Allowance Breakdown
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Qualifying Capital Cost:</span>
                      <span className="font-mono text-white font-bold">{formatZAR(totalCost13sex)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Statutory Allowance Rate:</span>
                      <span className="font-mono text-purple-300 font-bold">{rate13sex * 100}% per annum</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Annual Tax Deduction (Source 4014):</span>
                      <span className="font-mono text-emerald-400 font-bold">{formatZAR(annualAllowance13sex)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 border-t border-white/10 pt-2">
                      <span className="text-white font-semibold">Annual Tax Savings:</span>
                      <span className="font-mono text-emerald-300 font-bold text-sm">{formatZAR(taxSavings13sex)}</span>
                    </div>
                  </div>

                  {/* Audit Vault Checklist */}
                  <div className="pt-2">
                    <span className="text-[10.5px] text-slate-400 uppercase font-mono block mb-1.5">
                      Required Audit-Ready Vault Corroboration:
                    </span>
                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Title Deeds & Sectional Title certificates verifying sole trade ownership</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Municipal Occupation Certificate (verifying new & unused at acquisition)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Residential Tenant Leases producing continuous rental income</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono text-center border-t border-white/5 pt-2">
                  Deduction claimed under SARS ITR14 Capital Allowances (Schedule 2).
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUBTAB 2: SECTION 11D R&D 150% SUPER-DEDUCTION */}
        {activeSubTab === 's11d' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Section 11D: Scientific & Technological R&D 150% Super-Deduction
                </h3>
                <p className="text-xs text-slate-400">
                  Department of Science and Innovation (DSI) pre-approved scientific research expenditure qualifies for a 150% tax deduction.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <input
                    type="checkbox"
                    checked={is11DActive}
                    onChange={(e) => setIs11DActive(e.target.checked)}
                    className="rounded border-white/20 accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-white">
                    {is11DActive ? 'Section 11D Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Form Inputs */}
              <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-white/10">
                <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rdApproved}
                      onChange={(e) => setRdApproved(e.target.checked)}
                      className="rounded border-white/20 accent-cyan-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-cyan-200">
                      DSI Section 11D Approval Letter Obtained (Mandatory)
                    </span>
                  </label>
                  <p className="text-[10.5px] text-slate-400 pl-5">
                    Pre-approval from the Department of Science and Innovation is a statutory condition precedent. Without DSI certification, only standard 100% Section 11(a) deduction applies.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                    Qualifying R&D Personnel Salaries & Wages (ZAR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">R</span>
                    <input
                      type="number"
                      step="20000"
                      value={rdSalaries}
                      onChange={(e) => setRdSalaries(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Direct scientific research, engineering, and coding staff</span>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                    Qualifying Direct Materials & Lab Consumables (ZAR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">R</span>
                    <input
                      type="number"
                      step="10000"
                      value={rdMaterials}
                      onChange={(e) => setRdMaterials(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Live Calculation Card */}
              <div className="space-y-4 bg-slate-950/80 p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-white/10 pb-2">
                    Section 11D Deduction Analysis
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Baseline R&D Operating Spend:</span>
                      <span className="font-mono text-white font-bold">{formatZAR(totalRdSpend)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Additional 50% Super-Deduction:</span>
                      <span className="font-mono text-cyan-300 font-bold">{formatZAR(superDeduction11D)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total 150% Statutory Deduction:</span>
                      <span className="font-mono text-emerald-400 font-bold">{formatZAR(totalDeduction11D)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 border-t border-white/10 pt-2">
                      <span className="text-white font-semibold">Net Extra Tax Shield (50% Bonus):</span>
                      <span className="font-mono text-emerald-300 font-bold text-sm">+{formatZAR(extraTaxSavings11D)}</span>
                    </div>
                  </div>

                  {/* Audit Checklist */}
                  <div className="pt-2">
                    <span className="text-[10.5px] text-slate-400 uppercase font-mono block mb-1.5">
                      Audit Vault Proof Requirements:
                    </span>
                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>DSI Formal Section 11D Approval Reference (DSI-RD-2026/0491)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Technical Logbook detailing systematic experimentation</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Staff Time-Allocation Sheets mapped directly to IRP5 records</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono text-center border-t border-white/5 pt-2">
                  Pre-cleared under DSI / SARS joint electronic accreditation portal.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUBTAB: SECTION 12H LEARNERSHIP ALLOWANCE */}
        {activeSubTab === 's12h' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Section 12H: Additional Learnership Allowance</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    SETA Skills Development
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Income Tax Act §12H: Claim up to R80,000 per able-bodied learner (R40k annual + R40k completion) or R120,000 per learner with a disability (R60k annual + R60k completion) for SETA-registered learnership agreements.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <input
                    type="checkbox"
                    checked={is12HActive}
                    onChange={(e) => setIs12HActive(e.target.checked)}
                    className="rounded border-white/20 accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-white">
                    {is12HActive ? 'Claim Active on ITR14' : 'Claim Inactive'}
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Interactive Inputs */}
              <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                      Total Active Learners
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={learnersCount}
                      onChange={(e) => setLearnersCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                      Learners with Disability (ITR-DD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={learnersCount}
                      value={disabledLearnersCount}
                      onChange={(e) => setDisabledLearnersCount(Math.max(0, Math.min(learnersCount, parseInt(e.target.value) || 0)))}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                    NQF Qualification Band
                  </label>
                  <select
                    value={learnershipNqfLevel}
                    onChange={(e) => setLearnershipNqfLevel(e.target.value as 'NQF 1-6' | 'NQF 7-10')}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="NQF 1-6">NQF Levels 1 to 6 (Standard: R40,000 / Disability: R60,000)</option>
                    <option value="NQF 7-10">NQF Levels 7 to 10 (Degree/Postgrad: R20,000 / Disability: R50,000)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                    SETA Registration Agreement Reference
                  </label>
                  <input
                    type="text"
                    value={setaRegNumber}
                    onChange={(e) => setSetaRegNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                    placeholder="e.g. SETA-W&R-2026-8891"
                  />
                </div>

                <div className="pt-2 space-y-2.5 border-t border-white/10">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLearnershipCompleted}
                      onChange={(e) => setIsLearnershipCompleted(e.target.checked)}
                      className="rounded border-white/20 accent-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-white font-semibold block text-[11.5px]">Learners Successfully Completed in Tax Year</span>
                      <span className="text-[10px] text-slate-400 font-mono">Triggers statutory Section 12H(3) Completion Allowance (Doubles the allowance)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSetaRegistration}
                      onChange={(e) => setHasSetaRegistration(e.target.checked)}
                      className="rounded border-white/20 accent-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-white font-semibold block text-[11.5px]">SETA Endorsement Letter & Learner Agreement in Vault</span>
                      <span className="text-[10px] text-slate-400 font-mono">Mandatory corroborating documentation for SARS Source Code 4016</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Right Column: Statutory Incentive Math & Analysis */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>Section 12H Tax Allowance Math</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {learnershipNqfLevel}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Annual Training Allowance:</span>
                      <span className="text-white font-bold">{formatZAR(annual12HAllowance)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Completion Allowance:</span>
                      <span className="text-white font-bold">{formatZAR(completion12HAllowance)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>• {normalLearners} Able-bodied ({formatZAR(baseRate12H)} ea):</span>
                      <span>{formatZAR(normalLearners * baseRate12H * (isLearnershipCompleted ? 2 : 1))}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>• {validDisabledLearners} Disabled ({formatZAR(disabledRate12H)} ea):</span>
                      <span>{formatZAR(validDisabledLearners * disabledRate12H * (isLearnershipCompleted ? 2 : 1))}</span>
                    </div>

                    <div className="flex justify-between text-emerald-300 font-bold border-t border-white/10 pt-2 text-sm">
                      <span>Total Statutory Deduction:</span>
                      <span>{formatZAR(total12HAllowance)}</span>
                    </div>
                    <div className="flex justify-between text-cyan-300 font-bold text-xs">
                      <span>Net Tax Cash Saved ({((profile.taxBracketRate || 0.31) * 100).toFixed(0)}% Rate):</span>
                      <span>{formatZAR(taxSavings12H)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-black/40 border border-emerald-500/30 rounded-xl space-y-1">
                  <div className="text-[10.5px] text-emerald-300 font-mono font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>B-BBEE & Employment Tax Incentive (ETI) Alignment</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Section 12H allowances can be claimed simultaneously with the Employment Tax Incentive (ETI) and qualify for full B-BBEE Skills Development scorecard points.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: SECTION 24C FUTURE CONTRACTUAL EXPENDITURE */}
        {activeSubTab === 's24c' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Section 24C: Future Contractual Expenditure Allowance
                </h3>
                <p className="text-xs text-slate-400">
                  Deduct an allowance for future expenditure incurred in performing contractual obligations for income received in advance.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <input
                    type="checkbox"
                    checked={is24CActive}
                    onChange={(e) => setIs24CActive(e.target.checked)}
                    className="rounded border-white/20 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-white">
                    {is24CActive ? 'Section 24C Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Form Inputs */}
              <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-white/10">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                    Contract Income Invoiced / Received in Advance (ZAR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">R</span>
                    <input
                      type="number"
                      step="50000"
                      value={contractRevenue}
                      onChange={(e) => setContractRevenue(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Gross revenue recognized under Section 1 in the current tax year</span>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                    Projected Future Direct Contract Costs (ZAR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">R</span>
                    <input
                      type="number"
                      step="25000"
                      value={futureCosts}
                      onChange={(e) => setFutureCosts(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Direct materials, subcontracting, and delivery costs in subsequent tax year</span>
                </div>

                <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-xs text-amber-200/90 leading-relaxed">
                  <Info className="w-4 h-4 text-amber-400 inline mr-1" />
                  <strong>Section 24C Rule:</strong> The allowance claimed is added back to gross income in the following tax year, creating an ongoing deferral mechanism synchronized with actual project expenditure.
                </div>
              </div>

              {/* Live Calculation Card */}
              <div className="space-y-4 bg-slate-950/80 p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-white/10 pb-2">
                    Section 24C Provision Output
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Contract Advance Inflow:</span>
                      <span className="font-mono text-white font-bold">{formatZAR(contractRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Allowable 24C Future Provision:</span>
                      <span className="font-mono text-amber-400 font-bold">{formatZAR(allowance24C)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Effective Current Year Taxable Inflow:</span>
                      <span className="font-mono text-slate-300 font-bold">{formatZAR(Math.max(0, contractRevenue - allowance24C))}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 border-t border-white/10 pt-2">
                      <span className="text-white font-semibold">Immediate Cashflow Tax Shield:</span>
                      <span className="font-mono text-emerald-300 font-bold text-sm">{formatZAR(taxSavings24C)}</span>
                    </div>
                  </div>

                  {/* Audit Checklist */}
                  <div className="pt-2">
                    <span className="text-[10.5px] text-slate-400 uppercase font-mono block mb-1.5">
                      Vault Documentation Required:
                    </span>
                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Signed Bilateral Contract creating irrevocable delivery obligations</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Detailed Project Cost Breakdown & Milestone Schedule</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Auditor&apos;s Verification of prior year add-backs</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono text-center border-t border-white/5 pt-2">
                  Reported on ITR14 Provision Adjustments (Section 24C schedule).
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUBTAB 4: PHASE 12 ADVANCED DEBT CONCESSIONS & CAPITAL ALLOWANCES */}
        {activeSubTab === 'advanced_concessions' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Phase 12: Advanced Debt Concessions, Interest Amortization & Capital Relief
              </h3>
              <p className="text-xs text-slate-400">
                Specialized corporate tax provisions under Section 24J (interest YTM), Section 11(gC) (research machinery 50%), and Section 10B (foreign dividends).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Card 1: Section 24J YTM Interest */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white">Section 24J Interest YTM</span>
                  <input
                    type="checkbox"
                    checked={is24JActive}
                    onChange={(e) => setIs24JActive(e.target.checked)}
                    className="rounded border-white/20 accent-teal-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono uppercase mb-0.5">Loan Principal (ZAR)</label>
                    <input
                      type="number"
                      step="100000"
                      value={interestPrincipal}
                      onChange={(e) => setInterestPrincipal(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono uppercase mb-0.5">Effective Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.25"
                      value={interestRate}
                      onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                    />
                  </div>

                  <div className="pt-2 border-t border-white/10 flex justify-between font-mono">
                    <span className="text-slate-400">Annual 24J Finance Cost:</span>
                    <span className="text-teal-300 font-bold">{formatZAR(allowance24J)}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Section 11(gC) Accelerated Research Plant */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white">Section 11(gC) Research Plant</span>
                  <input
                    type="checkbox"
                    checked={is11gCActive}
                    onChange={(e) => setIs11gCActive(e.target.checked)}
                    className="rounded border-white/20 accent-teal-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono uppercase mb-0.5">Research Equipment Cost (ZAR)</label>
                    <input
                      type="number"
                      step="50000"
                      value={researchEquipmentCost}
                      onChange={(e) => setResearchEquipmentCost(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 font-mono">
                    Accelerated 50% write-off in Year 1 (Section 11(gC)(i)) for specialized research machinery.
                  </p>

                  <div className="pt-2 border-t border-white/10 flex justify-between font-mono">
                    <span className="text-slate-400">Year 1 50% Allowance:</span>
                    <span className="text-teal-300 font-bold">{formatZAR(allowance11gC)}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Section 10B Foreign Dividends */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white">Section 10B Foreign Dividends</span>
                  <input
                    type="checkbox"
                    checked={is10BActive}
                    onChange={(e) => setIs10BActive(e.target.checked)}
                    className="rounded border-white/20 accent-teal-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-mono uppercase mb-0.5">Foreign Dividends (ZAR)</label>
                    <input
                      type="number"
                      step="10000"
                      value={foreignDividends}
                      onChange={(e) => setForeignDividends(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
                    />
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={isParticipationExemption}
                      onChange={(e) => setIsParticipationExemption(e.target.checked)}
                      className="rounded border-white/20 accent-teal-500 cursor-pointer"
                    />
                    <span className="text-[10.5px] text-teal-200">≥10% Foreign Equity (100% Exemption)</span>
                  </label>

                  <div className="pt-2 border-t border-white/10 flex justify-between font-mono">
                    <span className="text-slate-400">Exempt Dividend Portion:</span>
                    <span className="text-teal-300 font-bold">{formatZAR(exemption10B)}</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 bg-teal-950/20 border border-teal-500/30 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-teal-300 font-semibold">
                Total Phase 12 Advanced Concessions Deductions: <strong className="font-mono text-white">{formatZAR(totalAdvancedDeduction)}</strong>
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                Tax Savings: +{formatZAR(taxSavingsAdvanced)}
              </span>
            </div>
          </div>
        )}

        {/* SUBTAB 4: SECTION 12BA RENEWABLE ENERGY 125% SUPER-ALLOWANCE */}
        {activeSubTab === 's12ba' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Section 12BA: Renewable Energy 125% Super-Allowance</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Accelerated 125% first-year write-off for new and unused solar, wind, and battery storage assets brought into commercial use.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <input
                  type="checkbox"
                  checked={is12BAActive}
                  onChange={(e) => setIs12BAActive(e.target.checked)}
                  className="rounded border-white/20 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-white">
                  {is12BAActive ? 'Section 12BA Claim Active' : 'Claim Inactive'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Controls */}
              <div className="lg:col-span-2 bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase font-semibold mb-1">
                      Solar System Capital Cost (excl. Input VAT)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-mono">R</span>
                      <input
                        type="number"
                        step="25000"
                        value={solarCost}
                        onChange={(e) => setSolarCost(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      Includes photovoltaic panels, commercial hybrid inverters, racking & certified storage.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase font-semibold mb-1">
                      Statutory Incentive Rate
                    </label>
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 font-mono text-xs font-bold flex items-center justify-between">
                      <span>125% Super-Allowance</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20">Year 1 Full Write-Off</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      Qualifies under Section 12BA without generation capacity caps.
                    </span>
                  </div>
                </div>

                {/* Statutory Prerequisites & Vault Checks */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mandatory SARS Evidentiary Vault Prerequisites</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasSolarCoc}
                        onChange={(e) => setHasSolarCoc(e.target.checked)}
                        className="rounded border-white/20 accent-amber-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-white font-semibold block text-[11.5px]">Electrical Certificate of Compliance (CoC)</span>
                        <span className="text-[10px] text-slate-400 font-mono">Issued by Registered Installation Electrician (Wireman's license)</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasEskomApproval}
                        onChange={(e) => setHasEskomApproval(e.target.checked)}
                        className="rounded border-white/20 accent-amber-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-white font-semibold block text-[11.5px]">Eskom / Municipal Grid-Tie Letter</span>
                        <span className="text-[10px] text-slate-400 font-mono">Authorized bidirectional or embedded generation consent</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Statutory Benefit Dossier */}
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Section 12BA Benefit Calculation
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      125% Allowance
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Qualifying Asset Base:</span>
                      <span className="text-white font-bold">{formatZAR(solarCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Total 12BA Deduction (125%):</span>
                      <span className="text-amber-400 font-extrabold text-sm">{formatZAR(allowance12BA)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 border-t border-white/10 pt-2">
                      <span>Standard Section 12B (50% Yr 1):</span>
                      <span className="text-slate-400">{formatZAR(regular12BComparison)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-300 font-bold">
                      <span>Enhanced Super-Deduction Margin:</span>
                      <span>+{formatZAR(additional12BASuperShield)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-black/40 border border-amber-500/30 rounded-xl space-y-1">
                  <div className="text-[10.5px] text-slate-400 uppercase font-mono">Net Cashflow Tax Shield</div>
                  <div className="text-lg font-mono font-bold text-emerald-400">
                    +{formatZAR(taxSavings12BA)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Directly reduces corporate provisional tax obligation
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUBTAB 5: SECTION 6QUAT FOREIGN TAX REBATE (FTC) & IT144 */}
        {activeSubTab === 's6quat' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-400" />
                  <span>Section 6quat: Foreign Tax Credit (FTC) & IT144 Rebate Schedule</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Eliminates international double taxation on foreign consulting fees, royalties, and offshore dividends with automatic statutory limitation calculation.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <input
                  type="checkbox"
                  checked={is6quatActive}
                  onChange={(e) => setIs6quatActive(e.target.checked)}
                  className="rounded border-white/20 accent-teal-500 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-white">
                  {is6quatActive ? 'Section 6quat Active' : 'Credit Inactive'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Form inputs */}
              <div className="lg:col-span-2 bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase font-semibold mb-1">
                      Foreign Taxable Income (ZAR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-mono">R</span>
                      <input
                        type="number"
                        step="10000"
                        value={foreignIncome6quat}
                        onChange={(e) => setForeignIncome6quat(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase font-semibold mb-1">
                      Foreign Tax Withheld / Paid (ZAR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-mono">R</span>
                      <input
                        type="number"
                        step="2500"
                        value={foreignTaxWithheld}
                        onChange={(e) => setForeignTaxWithheld(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-400"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase font-semibold mb-1">
                    Foreign Country & Double Tax Agreement (DTA) Jurisdiction
                  </label>
                  <input
                    type="text"
                    value={foreignJurisdiction}
                    onChange={(e) => setForeignJurisdiction(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div className="pt-2 border-t border-white/10">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasForeignTaxVoucher}
                      onChange={(e) => setHasForeignTaxVoucher(e.target.checked)}
                      className="rounded border-white/20 accent-teal-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-white font-semibold block text-[11.5px]">Official Foreign Tax Assessment / WHT Certificate in Vault</span>
                      <span className="text-[10px] text-slate-400 font-mono">Proof of foreign assessment issued by HMRC, IRS, or national revenue authority (mandatory under TAA)</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Statutory Formula Output */}
              <div className="bg-teal-950/20 border border-teal-500/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-teal-500/20 pb-2">
                    <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                      Section 6quat(1B) Limitation
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                      {(statutory6quatRatio * 100).toFixed(1)}% Ratio
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Foreign Tax Withheld:</span>
                      <span className="text-white font-bold">{formatZAR(foreignTaxWithheld)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Statutory Max Rebate Ceiling:</span>
                      <span className="text-teal-300 font-bold">{formatZAR(statutory6quatRatio * tentativeNormalTax)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold border-t border-white/10 pt-2">
                      <span>Allowable Rebate (ITR14 Line 6quat):</span>
                      <span className="text-sm">-{formatZAR(maxAllowable6quatRebate)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Excess Credit (Carried Forward 7 Yrs):</span>
                      <span>{formatZAR(excessCredit6quatCarriedForward)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-black/40 border border-teal-500/30 rounded-xl space-y-1">
                  <div className="text-[10.5px] text-teal-300 font-mono font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>SARS IT144 Foreign Tax Schedule</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Compliant with Section 6quat(1B) limitation. Direct credit against South African normal tax liability.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUBTAB 6: SECTION 19 & EIGHTH SCHEDULE PARAGRAPH 12A DEBT CONCESSION */}
        {activeSubTab === 'debt_concessions' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4 text-rose-400" />
                  <span>Section 19 & Eighth Schedule Paragraph 12A: Debt Compromise Engine</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Calculates the statutory tax consequences when debt owed to creditors or shareholders is waived, forgiven, or compromised in restructuring.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <input
                  type="checkbox"
                  checked={isDebtReductionActive}
                  onChange={(e) => setIsDebtReductionActive(e.target.checked)}
                  className="rounded border-white/20 accent-rose-500 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-white">
                  {isDebtReductionActive ? 'Debt Compromise Active' : 'Inactive'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Debt inputs */}
              <div className="lg:col-span-2 bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase font-semibold mb-1">
                      Total Debt Waived / Forgiven (ZAR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-mono">R</span>
                      <input
                        type="number"
                        step="25000"
                        value={debtReductionAmount}
                        onChange={(e) => setDebtReductionAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase font-semibold mb-1">
                      Base Cost of Financed Asset (ZAR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-mono">R</span>
                      <input
                        type="number"
                        step="25000"
                        value={debtAssetCost}
                        onChange={(e) => setDebtAssetCost(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasDebtAgreement}
                      onChange={(e) => setHasDebtAgreement(e.target.checked)}
                      className="rounded border-white/20 accent-rose-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-white font-semibold block text-[11.5px]">Signed Creditor Debt Compromise / Subordination Agreement</span>
                      <span className="text-[10px] text-slate-400 font-mono">Verified in Audit Vault per Rule 3 (Formal settlement contract)</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Statutory Cascade Ordering */}
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                      Statutory Ordering Cascade
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                      TAA & Income Tax Act
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Step 1: Asset Base Cost Reduced:</span>
                      <span className="text-white font-bold">{formatZAR(baseCostReduction)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Step 2: Remaining Excess Compromise:</span>
                      <span className="text-amber-400 font-bold">{formatZAR(excessDebtCompromise)}</span>
                    </div>
                    <div className="flex justify-between text-rose-300 font-bold border-t border-white/10 pt-2">
                      <span>Step 3: CGT Inclusion (80% Corp):</span>
                      <span className="text-sm">{formatZAR(taxableRecoupmentOrGain)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-black/40 border border-rose-500/30 rounded-xl space-y-1">
                  <div className="text-[10.5px] text-rose-300 font-mono font-bold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-rose-400" />
                    <span>Section 19(5) Loss Offset</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Remaining debt reduction benefit reduces assessed trading losses before generating normal tax recoupments.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUBTAB 7: ADVANCED PHASE 12 CORPORATE CONCESSIONS (S24J, S11gC, S10B) */}
        {activeSubTab === 'advanced_concessions' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Phase 12: Advanced Corporate Concessions Engine</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Execute high-yield corporate incentives under the Income Tax Act: Section 24J interest accrual amortization, Section 11(gC) 50% accelerated scientific equipment write-off, and Section 10B foreign participation exemptions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  TOTAL SHIELD: {formatZAR(taxSavingsAdvanced)}
                </span>
              </div>
            </div>

            {/* THREE CORPORATE PILLARS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* PILLAR 1: SECTION 24J INCURRED INTEREST ACCRUAL */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                        <Percent className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Section 24J Incurred Interest</h4>
                        <span className="text-[10px] text-cyan-300 font-mono">Yield-to-Maturity Accrual</span>
                      </div>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={is24JActive}
                        onChange={(e) => setIs24JActive(e.target.checked)}
                        className="rounded border-white/20 accent-cyan-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono font-bold text-white">
                        {is24JActive ? 'Active' : 'Off'}
                      </span>
                    </label>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Deducts compounded interest incurred over the instrument term on a yield-to-maturity basis, regardless of cash settlement date.
                  </p>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[10.5px] font-mono text-slate-400 uppercase font-semibold mb-1">
                        Principal Debt / Instrument Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">R</span>
                        <input
                          type="number"
                          step="50000"
                          value={interestPrincipal}
                          onChange={(e) => setInterestPrincipal(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-mono text-slate-400 uppercase font-semibold mb-1">
                        Effective Annual Yield Rate (% p.a.)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          value={interestRate}
                          onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                        />
                        <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Annual Accrual Deduction:</span>
                    <span className="text-cyan-300 font-bold">{formatZAR(allowance24J)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Tax Shield (at {((profile.taxBracketRate || 0.27) * 100).toFixed(0)}%):</span>
                    <span className="text-emerald-400 font-bold">{formatZAR(allowance24J * (profile.taxBracketRate || 0.27))}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono pt-1">
                    <FileCheck2 className="w-3 h-3 text-cyan-400" />
                    <span>Vault Doc: Facility Agreement & Schedule</span>
                  </div>
                </div>
              </div>

              {/* PILLAR 2: SECTION 11(gC) SCIENTIFIC & DESIGN EQUIPMENT (50%) */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                        <FlaskConical className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Section 11(gC) R&D Equipment</h4>
                        <span className="text-[10px] text-purple-300 font-mono">50/30/20 Accelerated Rate</span>
                      </div>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={is11gCActive}
                        onChange={(e) => setIs11gCActive(e.target.checked)}
                        className="rounded border-white/20 accent-purple-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono font-bold text-white">
                        {is11gCActive ? 'Active' : 'Off'}
                      </span>
                    </label>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Year 1 write-off of 50% for new and unused machinery, plant, implements, or articles brought into use directly for research and development.
                  </p>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[10.5px] font-mono text-slate-400 uppercase font-semibold mb-1">
                        Qualifying Capital Equipment Cost
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">R</span>
                        <input
                          type="number"
                          step="25000"
                          value={researchEquipmentCost}
                          onChange={(e) => setResearchEquipmentCost(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl text-[10.5px] text-slate-300 space-y-1">
                      <div className="flex justify-between font-mono text-purple-300 font-semibold">
                        <span>Year 1 Write-off: 50%</span>
                        <span>{formatZAR(researchEquipmentCost * 0.50)}</span>
                      </div>
                      <div className="flex justify-between font-mono text-slate-400">
                        <span>Year 2: 30% | Year 3: 20%</span>
                        <span>{formatZAR(researchEquipmentCost * 0.50)} remaining</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Year 1 S11(gC) Allowance:</span>
                    <span className="text-purple-300 font-bold">{formatZAR(allowance11gC)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Tax Shield (at {((profile.taxBracketRate || 0.27) * 100).toFixed(0)}%):</span>
                    <span className="text-emerald-400 font-bold">{formatZAR(allowance11gC * (profile.taxBracketRate || 0.27))}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono pt-1">
                    <FileCheck2 className="w-3 h-3 text-purple-400" />
                    <span>Vault Doc: Tax Invoices & Asset Serial Register</span>
                  </div>
                </div>
              </div>

              {/* PILLAR 3: SECTION 10B FOREIGN DIVIDENDS PARTICIPATION EXEMPTION */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Section 10B Foreign Dividends</h4>
                        <span className="text-[10px] text-emerald-300 font-mono">Participation Exemption</span>
                      </div>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={is10BActive}
                        onChange={(e) => setIs10BActive(e.target.checked)}
                        className="rounded border-white/20 accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono font-bold text-white">
                        {is10BActive ? 'Active' : 'Off'}
                      </span>
                    </label>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Foreign dividends qualify for full 100% exemption if holding ≥10% equity shares per s10B(2)(a), or partial 25/45 exemption ratio under s10B(3).
                  </p>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[10.5px] font-mono text-slate-400 uppercase font-semibold mb-1">
                        Foreign Dividends Received (ZAR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">R</span>
                        <input
                          type="number"
                          step="10000"
                          value={foreignDividends}
                          onChange={(e) => setForeignDividends(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isParticipationExemption}
                        onChange={(e) => setIsParticipationExemption(e.target.checked)}
                        className="rounded border-white/20 accent-emerald-500 cursor-pointer mt-0.5"
                      />
                      <div>
                        <span className="text-white font-semibold block text-[11px]">≥ 10% Equity Shareholding (s10B(2)(a))</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {isParticipationExemption ? '100% Full Exemption (R0 Taxable)' : 'Partial Exemption (25/45 Formula, Eff. 20%)'}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Exempt Dividend Amount:</span>
                    <span className="text-emerald-300 font-bold">{formatZAR(exemption10B)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Tax Shield (at {((profile.taxBracketRate || 0.27) * 100).toFixed(0)}%):</span>
                    <span className="text-emerald-400 font-bold">{formatZAR(exemption10B * (profile.taxBracketRate || 0.27))}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono pt-1">
                    <FileCheck2 className="w-3 h-3 text-emerald-400" />
                    <span>Vault Doc: Foreign Share Register & Voucher</span>
                  </div>
                </div>
              </div>

            </div>

            {/* SUMMARY & AUDIT-VAULT PACKAGING */}
            <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>Phase 12 Consolidated Corporate Shield</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      {formatZAR(totalAdvancedDeduction)} Qualifying Deductions
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Combined annual normal tax saving of <strong>{formatZAR(taxSavingsAdvanced)}</strong> across Sections 24J, 11(gC), and 10B. Apply changes to reflect on corporate provisional forecasts.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onNavigateToVault && (
                  <button
                    onClick={onNavigateToVault}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs border border-white/15 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View Vault Records</span>
                  </button>
                )}
                <button
                  onClick={handleApplyChanges}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs shadow-md shadow-cyan-600/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Corporate Concessions</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};

import { TaxTransaction, InvoiceRecord, UserTaxProfile, TaxCycleSnapshot } from '../types';

export interface TaxRulesConfig {
  vatRate: number; // e.g. 0.15
  primaryRebate: number; // e.g. 17235
  retirementCapPercent: number; // e.g. 0.275
  retirementCapMax: number; // e.g. 350000
  taxBrackets: { limit: number; base: number; rate: number; subtract: number }[];
  medicalCredits: { principal: number; dependent1: number; additional: number };
}

export const DEFAULT_TAX_RULES: TaxRulesConfig = {
  vatRate: 0.15,
  primaryRebate: 17235,
  retirementCapPercent: 0.275,
  retirementCapMax: 350000,
  taxBrackets: [
    { limit: 237100, base: 0, rate: 0.18, subtract: 0 },
    { limit: 370500, base: 42678, rate: 0.26, subtract: 237100 },
    { limit: 512800, base: 77362, rate: 0.31, subtract: 370500 },
    { limit: 673000, base: 121475, rate: 0.36, subtract: 512800 },
    { limit: 857900, base: 179147, rate: 0.39, subtract: 673000 },
    { limit: 1817000, base: 251258, rate: 0.41, subtract: 857900 },
    { limit: Infinity, base: 644489, rate: 0.45, subtract: 1817000 },
  ],
  medicalCredits: { principal: 364, dependent1: 364, additional: 246 },
};

/**
 * South African Normal Tax Brackets (2025/2026 Tax Year)
 * Primary Rebate: R17,235
 * Secondary Rebate (65+): R9,444
 */
export function calculateSANormalTax(taxableIncome: number, customRules?: TaxRulesConfig): number {
  if (taxableIncome <= 0) return 0;

  const rules = customRules || DEFAULT_TAX_RULES;
  let grossTax = 0;
  
  // Find correct bracket
  const bracket = rules.taxBrackets.find((b) => taxableIncome <= b.limit) || rules.taxBrackets[rules.taxBrackets.length - 1];
  if (bracket) {
    grossTax = bracket.base + (taxableIncome - bracket.subtract) * bracket.rate;
  }

  // Less standard South African primary rebate
  const netTax = Math.max(0, grossTax - rules.primaryRebate);
  return Number(netTax.toFixed(2));
}

/**
 * Section 6A Medical Tax Credits Calculation
 * Principal: R364/mo
 * First Dependent: R364/mo
 * Additional Dependents: R246/mo
 */
export function calculateMedicalTaxCreditsAnnual(members: number, customRules?: TaxRulesConfig): number {
  if (members <= 0) return 0;
  const rules = customRules || DEFAULT_TAX_RULES;
  let monthlyCredit = 0;
  if (members === 1) {
    monthlyCredit = rules.medicalCredits.principal;
  } else if (members === 2) {
    monthlyCredit = rules.medicalCredits.principal + rules.medicalCredits.dependent1;
  } else {
    monthlyCredit = rules.medicalCredits.principal + rules.medicalCredits.dependent1 + (members - 2) * rules.medicalCredits.additional;
  }
  return monthlyCredit * 12;
}

export function generateLiveTaxSnapshot(
  transactions: TaxTransaction[],
  invoices: InvoiceRecord[],
  profile: UserTaxProfile,
  customRules?: TaxRulesConfig
): TaxCycleSnapshot {
  const rules = customRules || DEFAULT_TAX_RULES;
  let grossIncome = 0;
  let operatingExpenses = 0;
  let retirementContributions = 0;
  let capitalAllowances = 0;
  let outputVatCollected = 0;

  // Process transactions
  transactions.forEach((tx) => {
    if (tx.status === 'flagged_mixed_use') return; // Skip unverified mixed use

    if (tx.type === 'income') {
      const netIncoming = tx.vatIncluded ? tx.amount - tx.vatAmount : tx.amount;
      grossIncome += netIncoming;
      if (tx.vatIncluded && profile.vatRegistered) {
        outputVatCollected += tx.vatAmount;
      }
    } else if (tx.type === 'expense') {
      const deductibleAmt = (tx.amount * (tx.deductiblePercentage / 100));
      const netExpense = tx.vatIncluded ? deductibleAmt - tx.vatAmount : deductibleAmt;
      operatingExpenses += netExpense;
    } else if (tx.type === 'investment') {
      retirementContributions += tx.amount;
    } else if (tx.type === 'asset') {
      const netAsset = tx.vatIncluded ? tx.amount - tx.vatAmount : tx.amount;
      capitalAllowances += netAsset;
    }
  });

  // Calculate input VAT claimable from scanned verified invoices
  let inputVatClaimable = 0;
  invoices.forEach((inv) => {
    if (inv.isVatClaimable && profile.vatRegistered) {
      inputVatClaimable += inv.vatAmount;
    }
  });

  // Include transaction input VAT claimable
  transactions.forEach((tx) => {
    if (tx.type === 'expense' || tx.type === 'asset') {
      if (tx.vatIncluded && profile.vatRegistered && tx.isDeductible) {
        inputVatClaimable += tx.vatAmount;
      }
    }
  });

  // Section 11F Capped Retirement Deduction (27.5% cap calculation)
  const maxRetirementCap = Math.min(rules.retirementCapMax, grossIncome * rules.retirementCapPercent);
  const allowedRetirementDeduction = Math.min(retirementContributions, maxRetirementCap);

  // Next Four Statutory Enhancements Calculations:
  // 1. Section 13sex property capital allowance
  let section13sexAllowance = 0;
  if (profile.is13sexFiled && profile.unitsCount && profile.unitCost && profile.unitsCount >= 5) {
    const rate = profile.isLowCost ? 0.10 : 0.05;
    section13sexAllowance = profile.unitsCount * profile.unitCost * rate;
  }

  // 2. Section 11D Scientific or Technological Research & Development (R&D) 150% super-deduction
  let section11dSuperDeduction = 0;
  if (profile.is11DApplied && profile.rdApproved) {
    const totalExpenses = (profile.rdSalaries || 0) + (profile.rdMaterials || 0);
    section11dSuperDeduction = totalExpenses * 0.5; // Additional 50% deduction
  }

  // 3. Section 24C Contractual Future Expenditure Provision
  let section24cDeduction = 0;
  if (profile.is24CClaimed && profile.contractRevenue && profile.futureCosts) {
    section24cDeduction = Math.min(profile.contractRevenue, profile.futureCosts * 0.65);
  }

  // Phase 12: Inbound Foreign Dividends Gross Up
  if (profile.foreignDividendsReceived) {
    grossIncome += profile.foreignDividendsReceived;
  }

  // Phase 12: Paragraph 12A / Section 19 Debt Reduction recoupment
  let paragraph12aRecoupment = 0;
  if (profile.isParagraph12AApplied && profile.debtReductionAmount && profile.debtReductionAssetCost) {
    const excess = profile.debtReductionAmount - profile.debtReductionAssetCost;
    if (excess > 0) {
      paragraph12aRecoupment = excess * 0.80; // corporate capital gain inclusion rate
      grossIncome += paragraph12aRecoupment;
    }
  }

  // Phase 12: Section 10B Foreign Dividends Exemption (25/45 ratio or 100% participation exemption)
  let section10bExemption = 0;
  if (profile.isSection10BApplied && profile.foreignDividendsReceived) {
    if (profile.isForeignParticipationExemption) {
      section10bExemption = profile.foreignDividendsReceived; // 100% exemption
    } else {
      section10bExemption = profile.foreignDividendsReceived * (25 / 45); // Ratio-based exemption
    }
  }

  // Phase 12: Section 24J YTM Interest finance cost deduction
  let section24jDeduction = 0;
  if (profile.isSection24JApplied && profile.interestPrincipal && profile.interestRate) {
    section24jDeduction = profile.interestPrincipal * (profile.interestRate / 100);
  }

  // Phase 12: Section 11(gC) accelerated research physical asset write-off (50% Year 1)
  let section11gCAllowance = 0;
  if (profile.isSection11gCApplied && profile.researchEquipmentCost) {
    section11gCAllowance = profile.researchEquipmentCost * 0.50;
  }

  // Net Taxable Income (including S13sex, S11D, S24C, S24J, S11(gC), and S10B)
  const finalCapitalAllowances = capitalAllowances + section13sexAllowance + section11gCAllowance;
  const finalOperatingExpenses = operatingExpenses + section11dSuperDeduction + section24cDeduction + section24jDeduction + section10bExemption;

  const totalDeductions = finalOperatingExpenses + allowedRetirementDeduction + finalCapitalAllowances;
  const netTaxableIncome = Math.max(0, grossIncome - totalDeductions);

  // Normal Tax Engine (Checks if corporate entity & if SBC rules are active)
  let estimatedNormalTax = 0;
  const isCorporateSme = profile.entityType === 'Small Business SME (Pty Ltd)';
  
  if (isCorporateSme) {
    if (profile.isSbcApplied && profile.isSbcNaturalShareholding && profile.isSbcActiveIncome && (profile.sbcGrossIncome || grossIncome) <= 20000000) {
      // Small Business Corporation Progressive Rates
      // 2025/2026:
      // R0 – R95,000: 0%
      // R95,001 – R365,000: 7% of amount > R95,000
      // R365,001 – R550,000: R18,900 + 21% of amount > R365,000
      // R550,001+: R57,750 + 27% of amount > R550,000
      if (netTaxableIncome <= 95000) {
        estimatedNormalTax = 0;
      } else if (netTaxableIncome <= 365000) {
        estimatedNormalTax = (netTaxableIncome - 95000) * 0.07;
      } else if (netTaxableIncome <= 550000) {
        estimatedNormalTax = 18900 + (netTaxableIncome - 365000) * 0.21;
      } else {
        estimatedNormalTax = 57750 + (netTaxableIncome - 550000) * 0.27;
      }
    } else {
      // Default Corporate Tax (flat 27% standard in South Africa)
      estimatedNormalTax = netTaxableIncome * 0.27;
    }
  } else {
    // Standard normal individual tax
    estimatedNormalTax = calculateSANormalTax(netTaxableIncome, rules);
  }

  // Medical Credits
  const medicalTaxCredits = calculateMedicalTaxCreditsAnnual(profile.medicalAidMembers, rules);

  // Provisional Tax Already Paid (Simulated provisional 1st cycle advance)
  const provisionalTaxAlreadyPaid = grossIncome > 50000 ? 5000 : 0;

  // Net Tax Liability (Positive owe SARS, Negative safe refund expected)
  const netNormalTaxAfterCredits = isCorporateSme 
    ? estimatedNormalTax 
    : Math.max(0, estimatedNormalTax - medicalTaxCredits);
  const netTaxLiabilityOrRefund = netNormalTaxAfterCredits - provisionalTaxAlreadyPaid;

  // Net VAT position
  const netVatDueOrRefund = outputVatCollected - inputVatClaimable;

  let projectionStatus: TaxCycleSnapshot['projectionStatus'] = 'On Track - Minor Liability';
  if (netTaxLiabilityOrRefund < 0 && netVatDueOrRefund < 0) {
    projectionStatus = 'Heading for Safe Refund';
  } else if (netTaxLiabilityOrRefund > 15000) {
    projectionStatus = 'Urgent Cash Flow Warning';
  }

  return {
    grossIncome: Number(grossIncome.toFixed(2)),
    operatingExpenses: Number(finalOperatingExpenses.toFixed(2)),
    retirementContributions: Number(allowedRetirementDeduction.toFixed(2)),
    capitalAllowances: Number(finalCapitalAllowances.toFixed(2)),
    netTaxableIncome: Number(netTaxableIncome.toFixed(2)),
    estimatedNormalTax: Number(estimatedNormalTax.toFixed(2)),
    medicalTaxCredits: Number(medicalTaxCredits.toFixed(2)),
    provisionalTaxAlreadyPaid: Number(provisionalTaxAlreadyPaid.toFixed(2)),
    netTaxLiabilityOrRefund: Number(netTaxLiabilityOrRefund.toFixed(2)),
    outputVatCollected: Number(outputVatCollected.toFixed(2)),
    inputVatClaimable: Number(inputVatClaimable.toFixed(2)),
    netVatDueOrRefund: Number(netVatDueOrRefund.toFixed(2)),
    projectionStatus,
  };
}

export function formatZAR(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-R ${formatted}` : `R ${formatted}`;
}

import {
  TaxTransaction,
  UserTaxProfile,
  TransactionPreAuditResult,
  NegativeImplication,
  RequiredVaultEvidence,
  SarsRiskSeverity
} from '../types';

export interface LedgerAuditSummary {
  totalAuditedTransactions: number;
  totalClaimedDeductionsZAR: number;
  totalProjectedDisallowancesZAR: number;
  totalPotentialTaxLiabilityZAR: number;
  totalUnderstatementPenaltiesZAR: number;
  totalInterestExposureZAR: number;
  totalNetSarsExposureZAR: number;
  compliantCount: number;
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
  criticalCount: number;
  overallExposureSeverity: SarsRiskSeverity;
}

/**
 * Real-Time SARS Pre-Audit Engine
 * Audits every transaction as it is fed into the system and reports immediate negative implications
 * before SARS conducts an audit on the client's account.
 */
export function auditTransaction(
  tx: Partial<TaxTransaction>,
  profile: UserTaxProfile,
  vaultDocs: string[] = ['LOGBOOK_789', 'VEHICLE_PURCHASE_AGREEMENT']
): TransactionPreAuditResult {
  const amount = Number(tx.amount) || 0;
  const type = tx.type || 'expense';
  const category = (tx.category || '').toLowerCase();
  const desc = (tx.description || '').toLowerCase();
  const deductiblePercentage = tx.deductiblePercentage !== undefined ? tx.deductiblePercentage : (tx.isDeductible ? 100 : 0);
  const vatIncluded = Boolean(tx.vatIncluded);
  const vatAmount = Number(tx.vatAmount) || 0;
  const marginalRate = profile.taxBracketRate || 0.31; // default marginal bracket 31%
  const sarsPrescribedInterestRate = 0.1175; // 11.75% Section 89quat interest

  const negativeImplications: NegativeImplication[] = [];
  const requiredVaultEvidence: RequiredVaultEvidence[] = [];
  const preventativeRecommendations: string[] = [];

  let claimedDeduction = 0;
  let projectedDisallowed = 0;
  let riskScore = 0;
  let sourceCode = '4005 (Cost of Sales / General OPEX)';
  let penaltyPercentage = 0;
  let ruleCitation = 'Income Tax Act 58 of 1962 Section 11(a) General Deduction Formula';
  let isDefensible = true;

  // 1. EVALUATION FOR INCOME TRANSACTIONS
  if (type === 'income') {
    sourceCode = '3601 / Gross Income Section 1';
    claimedDeduction = 0;

    // Check if VAT registered but no VAT accounted for
    if (profile.vatRegistered && !vatIncluded && amount > 1000) {
      riskScore += 45;
      const uncollectedVat = amount * (15 / 115);
      negativeImplications.push({
        id: 'IMP-VAT-OUT-01',
        category: 'VAT_CLAWBACK',
        statutoryReference: 'Value-Added Tax Act 89 of 1991 Section 7(1)(a)',
        title: 'Output VAT Not Levied on Taxable Supply',
        description: `Entity is registered for VAT (${profile.vatNumber || 'Active'}), but this professional income entry of R${amount.toLocaleString()} was captured without 15% standard-rate VAT. SARS will assess deeming the amount inclusive of VAT, clawing back R${uncollectedVat.toFixed(2)} in uncollected output tax.`,
        severity: 'HIGH_EXPOSURE',
        estimatedFinancialExposureZAR: uncollectedVat,
        mitigationAdvice: 'Issue a valid Section 20 tax invoice to the client reflecting 15% VAT and remit output tax on VAT201 return.'
      });
      preventativeRecommendations.push('Add 15% Output VAT to prevent SARS assessment for unpaid sales tax.');
    }

    // Cash threshold / FICA CTR check
    if (amount >= 49999.99 && (desc.includes('cash') || desc.includes('deposit') || desc.includes('atm'))) {
      riskScore += 30;
      negativeImplications.push({
        id: 'IMP-FICA-01',
        category: 'FICA_CTR',
        statutoryReference: 'Financial Intelligence Centre Act 38 of 2001 Section 28',
        title: 'Cash Threshold Reporting (CTR) Trigger (≥ R49,999.99)',
        description: `Single cash deposit of R${amount.toLocaleString()} exceeds statutory threshold. Failure to submit CTR report to FIC within 3 business days carries regulatory fines under Section 56 of FICA.`,
        severity: 'MEDIUM_RISK',
        estimatedFinancialExposureZAR: 25000,
        mitigationAdvice: 'Ensure FIC CTR report is dispatched and source of funds verification is logged in the Directive8SafeRegister.'
      });
      preventativeRecommendations.push('File statutory Cash Threshold Report (CTR) with FIC.');
    }

    requiredVaultEvidence.push({
      documentType: 'Sales Invoice / Service Agreement',
      description: 'Signed client contract or tax invoice matching bank credit deposit.',
      isAttachedInVault: true,
      mandatoryForDeduction: false
    });

  } else {
    // 2. EVALUATION FOR EXPENSES & ASSET DEDUCTIONS
    claimedDeduction = (amount * deductiblePercentage) / 100;

    // Check A: TRAVEL & VEHICLE (Source Code 4015 Write-Back Check)
    const isTravelRelated =
      category.includes('travel') ||
      category.includes('vehicle') ||
      category.includes('fuel') ||
      category.includes('petrol') ||
      category.includes('transport') ||
      desc.includes('uber') ||
      desc.includes('shell') ||
      desc.includes('sasol') ||
      desc.includes('engen') ||
      desc.includes('hertz') ||
      desc.includes('avis') ||
      desc.includes('flight') ||
      desc.includes('toll');

    if (isTravelRelated) {
      sourceCode = '4015 (Business Travel Allowance & Expenses)';
      ruleCitation = 'Section 8(1) & Section 11(a) of Income Tax Act 58 of 1962 / SARS Interpretation Note 14';

      const hasLogbook = vaultDocs.some(d => d.toLowerCase().includes('logbook'));
      const hasPurchaseContract = vaultDocs.some(d => d.toLowerCase().includes('purchase') || d.toLowerCase().includes('agreement'));

      requiredVaultEvidence.push({
        documentType: 'Contemporaneous SARS Travel Logbook',
        description: 'Detailed vehicle logbook recording date, starting/ending km, business purpose, and client destination (Logbook #789).',
        isAttachedInVault: hasLogbook,
        vaultRefId: hasLogbook ? 'LOGBOOK_789' : undefined,
        mandatoryForDeduction: true
      });

      requiredVaultEvidence.push({
        documentType: 'Vehicle Purchase Agreement / Financial Lease',
        description: 'Signed vehicle purchase agreement or lease verifying cost price, VIN, and ownership.',
        isAttachedInVault: hasPurchaseContract,
        vaultRefId: hasPurchaseContract ? 'VEHICLE_PURCHASE_AGREEMENT' : undefined,
        mandatoryForDeduction: true
      });

      if (!hasLogbook) {
        // High likelihood of SARS writing claim back to R0!
        riskScore += 75;
        projectedDisallowed += claimedDeduction;
        penaltyPercentage = Math.max(penaltyPercentage, 50); // 50% gross negligence under TAA 222
        isDefensible = false;

        negativeImplications.push({
          id: 'IMP-4015-DISALLOW',
          category: 'DISALLOWANCE',
          statutoryReference: 'Income Tax Act §8(1) & Tax Administration Act §102 (Burden of Proof)',
          title: 'Immediate 100% Write-Back of Source Code 4015 to R0',
          description: `SARS aggressive audit rule: Travel deduction of R${claimedDeduction.toFixed(2)} will be disallowed and written back to R0 upon assessment because no verified contemporaneous logbook is attached. SARS TAA Section 102 places the entire burden of proof upon the taxpayer.`,
          severity: 'CRITICAL_DISALLOWANCE',
          estimatedFinancialExposureZAR: claimedDeduction * marginalRate,
          mitigationAdvice: 'Corroborate this journey against Logbook #789 before submission to prevent automated write-back.'
        });

        negativeImplications.push({
          id: 'IMP-TAA-222-TRAVEL',
          category: 'PENALTY_TAA_222',
          statutoryReference: 'Tax Administration Act No. 28 of 2011 Section 222',
          title: '50% Understatement Penalty (Gross Negligence)',
          description: `Claiming business travel expenses without maintaining a compliant SARS logbook constitutes "Gross Negligence" under the TAA Section 222 penalty matrix, resulting in a mandatory 50% penalty on the resulting tax shortfall.`,
          severity: 'HIGH_EXPOSURE',
          estimatedFinancialExposureZAR: (claimedDeduction * marginalRate) * 0.5,
          mitigationAdvice: 'Ensure distance is mapped strictly to vault logbook entries with substantiated odometer readings.'
        });

        preventativeRecommendations.push('Attach verified Logbook #789 to Audit-Ready Vault immediately.');
        preventativeRecommendations.push('Obtain and attach signed Vehicle Purchase Agreement.');
      } else {
        riskScore += 10;
        preventativeRecommendations.push('Keep odometer readings synchronized with fuel slips for full audit defensibility.');
      }

      // Check VAT Act Section 17(2)(c) passenger motor car input tax restriction
      if (vatIncluded && (desc.includes('car rental') || desc.includes('hertz') || desc.includes('avis') || desc.includes('passenger') || desc.includes('fuel'))) {
        riskScore += 35;
        negativeImplications.push({
          id: 'IMP-VAT-PASSENGER',
          category: 'VAT_CLAWBACK',
          statutoryReference: 'VAT Act 89 of 1991 Section 17(2)(c) Motor Car Restriction',
          title: 'Input VAT Prohibited on Motor Vehicles & Fuel',
          description: `Claiming Input VAT of R${vatAmount.toFixed(2)} on passenger motor car rentals, maintenance, or zero-rated fuel is prohibited under Section 17(2)(c) of the VAT Act. SARS will disallow the input tax and levy a 10% penalty under Section 39(1).`,
          severity: 'HIGH_EXPOSURE',
          estimatedFinancialExposureZAR: vatAmount + (vatAmount * 0.1),
          mitigationAdvice: 'De-select VAT claimable on passenger vehicle expenses; claim 100% of the gross cost as normal tax deduction under Section 11(a) instead.'
        });
        preventativeRecommendations.push('Reclassify VAT input as non-claimable under VAT Act §17(2)(c).');
      }
    }

    // Check B: MEALS & ENTERTAINMENT (Source Code 4016 / Section 23(g) & (c))
    const isEntertainment =
      category.includes('meal') ||
      category.includes('entertain') ||
      category.includes('food') ||
      category.includes('restaurant') ||
      desc.includes('woolworths') ||
      desc.includes('cafe') ||
      desc.includes('café') ||
      desc.includes('restaurant') ||
      desc.includes('lunch') ||
      desc.includes('dinner') ||
      desc.includes('coffee') ||
      desc.includes('drinks') ||
      desc.includes('bar');

    if (isEntertainment) {
      sourceCode = '4016 (Entertainment & Non-Deductible Meals)';
      ruleCitation = 'Section 23(c) & 23(g) of Income Tax Act 58 of 1962 / VAT Act Section 17(2)(a)';

      if (claimedDeduction > 0) {
        riskScore += 80;
        projectedDisallowed += claimedDeduction;
        penaltyPercentage = Math.max(penaltyPercentage, 25); // 25% no reasonable grounds
        isDefensible = false;

        negativeImplications.push({
          id: 'IMP-23G-ENTERTAIN',
          category: 'DISALLOWANCE',
          statutoryReference: 'Income Tax Act §23(c) & §23(g) Prohibition',
          title: 'Statutory Prohibition of Entertainment Deductions',
          description: `SARS Section 23(g) and 23(c) explicitly prohibit deductions for personal meals, staff refreshments, and general client entertainment unless incurred for a specialized fee-paying conference. SARS auditors write this claim back to R0 100% of the time.`,
          severity: 'CRITICAL_DISALLOWANCE',
          estimatedFinancialExposureZAR: claimedDeduction * marginalRate,
          mitigationAdvice: 'Mark this transaction as non-deductible (0% deductible) in the ledger to shield against audit penalties.'
        });

        if (vatIncluded && vatAmount > 0) {
          negativeImplications.push({
            id: 'IMP-VAT-17-2',
            category: 'VAT_CLAWBACK',
            statutoryReference: 'VAT Act 89 of 1991 Section 17(2)(a)',
            title: 'Input VAT Denied on Entertainment & Refreshments',
            description: `Section 17(2)(a) specifically forbids any input tax deduction on food, beverages, and hospitality. Claiming R${vatAmount.toFixed(2)} input VAT triggers an immediate VAT audit adjustment.`,
            severity: 'HIGH_EXPOSURE',
            estimatedFinancialExposureZAR: vatAmount,
            mitigationAdvice: 'Remove input tax deduction for entertainment items.'
          });
        }

        preventativeRecommendations.push('Set deductible percentage to 0% to prevent SARS write-back and penalty.');
        preventativeRecommendations.push('Treat as personal drawings or non-deductible director entertainment.');
      }
    }

    // Check C: DUAL-USE & PRIVATE CONSUMPTION (Section 23(g))
    const isDualUse =
      category.includes('telecom') ||
      category.includes('mobile') ||
      category.includes('fibre') ||
      category.includes('internet') ||
      category.includes('computer') ||
      category.includes('hardware') ||
      category.includes('electronics') ||
      desc.includes('vodacom') ||
      desc.includes('mtn') ||
      desc.includes('telkom') ||
      desc.includes('istore') ||
      desc.includes('apple') ||
      desc.includes('dell') ||
      desc.includes('laptop');

    if (isDualUse && deductiblePercentage > 85 && !isEntertainment) {
      riskScore += 40;
      const excessiveDeduction = claimedDeduction * (deductiblePercentage - 80) / 100;
      projectedDisallowed += excessiveDeduction;
      penaltyPercentage = Math.max(penaltyPercentage, 25);

      negativeImplications.push({
        id: 'IMP-23G-APPORTION',
        category: 'DISALLOWANCE',
        statutoryReference: 'Income Tax Act §23(g) Apportionment Rule & Interpretation Note 47',
        title: 'Unapportioned Dual-Use Consumption Risk',
        description: `Claiming ${deductiblePercentage}% business deduction on telecommunications, hardware, or mobile devices without an apportionment log violates Section 23(g). SARS guidelines cap home/mobile mixed-use deductions to corroborated business percentages (typically 75% to 80%).`,
        severity: 'MEDIUM_RISK',
        estimatedFinancialExposureZAR: excessiveDeduction * marginalRate,
        mitigationAdvice: 'Reduce business deduction to 80% and assign 20% to personal drawings to satisfy SARS dual-use guidelines.'
      });
      preventativeRecommendations.push('Adjust deduction apportionment to 80% business / 20% personal use.');
    }

    // Check D: HIGH VALUE INVOICE VALIDATION (VAT Act Section 20(4))
    if (amount > 5000 && !isEntertainment && !isTravelRelated) {
      requiredVaultEvidence.push({
        documentType: 'Full Tax Invoice (VAT Act Section 20(4))',
        description: `Tax invoice exceeding R5,000 must reflect entity legal name, VAT number (${profile.vatNumber || 'Required'}), physical address, sequential invoice number, and 15% VAT split.`,
        isAttachedInVault: true,
        mandatoryForDeduction: true
      });
      requiredVaultEvidence.push({
        documentType: 'Proof of Electronic Funds Transfer (EFT)',
        description: 'Bank payment confirmation or debit order slip proving actual incurrence of expense.',
        isAttachedInVault: true,
        mandatoryForDeduction: true
      });
    }

    // Check E: SOLAR / RENEWABLE ENERGY (Section 12BA CoC Check)
    if (desc.includes('solar') || desc.includes('inverter') || desc.includes('photovoltaic') || category.includes('solar')) {
      sourceCode = 'Section 12BA Solar Super-Allowance';
      const hasCoc = vaultDocs.some(d => d.toLowerCase().includes('coc') || d.toLowerCase().includes('electrical'));

      requiredVaultEvidence.push({
        documentType: 'Electrical Certificate of Compliance (CoC)',
        description: 'Certified electrical compliance certificate issued by a registered Department of Labour installer.',
        isAttachedInVault: hasCoc,
        vaultRefId: hasCoc ? 'SOLAR_COC_CERTIFICATE' : undefined,
        mandatoryForDeduction: true
      });

      if (!hasCoc) {
        riskScore += 70;
        projectedDisallowed += claimedDeduction;
        negativeImplications.push({
          id: 'IMP-12BA-COC',
          category: 'EVIDENCE_DEFICIT',
          statutoryReference: 'Income Tax Act Section 12BA(4) & Electrical Installation Regulations',
          title: 'Missing Electrical Certificate of Compliance (CoC)',
          description: `Section 12BA 125% super-allowance claims are disallowed during desk audit if not accompanied by an Electrical CoC. Without the CoC, the asset is relegated to standard wear-and-tear (Section 11(e) over 5 years).`,
          severity: 'HIGH_EXPOSURE',
          estimatedFinancialExposureZAR: (claimedDeduction * 0.25) * marginalRate,
          mitigationAdvice: 'Request installer to submit Department of Labour CoC and hash checksum into audit vault.'
        });
        preventativeRecommendations.push('Upload signed Electrical CoC before claiming Section 12BA super-allowance.');
      }
    }
  }

  // Calculate quantitative financial exposures
  const additionalTax = projectedDisallowed * marginalRate;
  const understatementPenaltyAmount = (additionalTax * penaltyPercentage) / 100;
  const interestAmount = additionalTax > 0 ? (additionalTax * sarsPrescribedInterestRate * 0.5) : 0; // 6-month simulated audit cycle
  const totalSarsExposure = additionalTax + understatementPenaltyAmount + interestAmount;

  // Determine overall risk severity rating
  let overallRisk: SarsRiskSeverity = 'COMPLIANT';
  if (riskScore >= 70 || projectedDisallowed >= 10000) {
    overallRisk = 'CRITICAL_DISALLOWANCE';
  } else if (riskScore >= 45 || totalSarsExposure > 2500) {
    overallRisk = 'HIGH_EXPOSURE';
  } else if (riskScore >= 25 || negativeImplications.length > 0) {
    overallRisk = 'MEDIUM_RISK';
  } else if (riskScore > 0) {
    overallRisk = 'LOW_RISK';
  } else {
    overallRisk = 'COMPLIANT';
  }

  // Default recommendation if compliant
  if (preventativeRecommendations.length === 0) {
    preventativeRecommendations.push('Transaction satisfies Section 11(a) General Deduction Formula. Retain invoice in vault for 5-year statutory period.');
  }

  return {
    transactionId: tx.id || `TX-PREAUDIT-${Date.now()}`,
    overallRisk,
    riskScore: Math.min(riskScore, 100),
    auditedAt: new Date().toISOString(),
    sourceCodeAffected: sourceCode,
    claimedDeductionAmountZAR: claimedDeduction,
    projectedDisallowedAmountZAR: projectedDisallowed,
    estimatedAdditionalTaxPayableZAR: additionalTax,
    understatementPenaltyPercentage: penaltyPercentage,
    understatementPenaltyAmountZAR: understatementPenaltyAmount,
    estimated89quatInterestZAR: interestAmount,
    totalPotentialSarsExposureZAR: totalSarsExposure,
    negativeImplications,
    requiredVaultEvidence,
    preventativeRecommendations,
    ruleCitation,
    isDefensibleUnderRule7: isDefensible
  };
}

/**
 * Batch audits an entire ledger of transactions and calculates summary exposure metrics.
 */
export function batchAuditLedger(
  transactions: TaxTransaction[],
  profile: UserTaxProfile,
  vaultDocs: string[] = ['LOGBOOK_789', 'VEHICLE_PURCHASE_AGREEMENT']
): { results: Record<string, TransactionPreAuditResult>; summary: LedgerAuditSummary } {
  const results: Record<string, TransactionPreAuditResult> = {};

  let totalClaimed = 0;
  let totalDisallowed = 0;
  let totalTax = 0;
  let totalPenalties = 0;
  let totalInterest = 0;
  let compliantCount = 0;
  let lowRiskCount = 0;
  let mediumRiskCount = 0;
  let highRiskCount = 0;
  let criticalCount = 0;

  for (const tx of transactions) {
    const auditRes = auditTransaction(tx, profile, vaultDocs);
    results[tx.id] = auditRes;

    totalClaimed += auditRes.claimedDeductionAmountZAR;
    totalDisallowed += auditRes.projectedDisallowedAmountZAR;
    totalTax += auditRes.estimatedAdditionalTaxPayableZAR;
    totalPenalties += auditRes.understatementPenaltyAmountZAR;
    totalInterest += auditRes.estimated89quatInterestZAR;

    switch (auditRes.overallRisk) {
      case 'COMPLIANT': compliantCount++; break;
      case 'LOW_RISK': lowRiskCount++; break;
      case 'MEDIUM_RISK': mediumRiskCount++; break;
      case 'HIGH_EXPOSURE': highRiskCount++; break;
      case 'CRITICAL_DISALLOWANCE': criticalCount++; break;
    }
  }

  const totalExposure = totalTax + totalPenalties + totalInterest;

  let overallSeverity: SarsRiskSeverity = 'COMPLIANT';
  if (criticalCount > 0 || totalExposure > 20000) {
    overallSeverity = 'CRITICAL_DISALLOWANCE';
  } else if (highRiskCount > 0 || totalExposure > 5000) {
    overallSeverity = 'HIGH_EXPOSURE';
  } else if (mediumRiskCount > 0) {
    overallSeverity = 'MEDIUM_RISK';
  } else if (lowRiskCount > 0) {
    overallSeverity = 'LOW_RISK';
  }

  const summary: LedgerAuditSummary = {
    totalAuditedTransactions: transactions.length,
    totalClaimedDeductionsZAR: totalClaimed,
    totalProjectedDisallowancesZAR: totalDisallowed,
    totalPotentialTaxLiabilityZAR: totalTax,
    totalUnderstatementPenaltiesZAR: totalPenalties,
    totalInterestExposureZAR: totalInterest,
    totalNetSarsExposureZAR: totalExposure,
    compliantCount,
    lowRiskCount,
    mediumRiskCount,
    highRiskCount,
    criticalCount,
    overallExposureSeverity: overallSeverity
  };

  return { results, summary };
}

import {
  AutoAssessmentDossier,
  ThirdPartyDataFeedItem,
  UnclaimedAutoAssessmentDeduction,
  UserTaxProfile,
  TaxTransaction
} from '../types';

/**
 * SARS Auto-Assessment Engine
 * Simulates SARS's third-party auto-assessment algorithm, identifies omitted statutory deductions,
 * calculates the taxpayer's variance (refund loss), and manages the statutory 40-day/80-day response window.
 */

export function buildSimulatedAutoAssessment(
  profile: UserTaxProfile,
  transactions: TaxTransaction[],
  vaultDocs: string[] = ['LOGBOOK_789', 'VEHICLE_PURCHASE_AGREEMENT', 'SOLAR_COC_CERTIFICATE']
): AutoAssessmentDossier {
  const hasLogbook = vaultDocs.some(d => d.toLowerCase().includes('logbook'));
  const hasPurchaseAgreement = vaultDocs.some(d => d.toLowerCase().includes('purchase') || d.toLowerCase().includes('agreement'));
  const hasSolarCoc = vaultDocs.some(d => d.toLowerCase().includes('coc') || d.toLowerCase().includes('electrical'));

  // 1. Third Party Feeds that SARS automatically ingests
  const thirdPartyFeeds: ThirdPartyDataFeedItem[] = [
    {
      id: 'FEED-IRP5-001',
      sourceType: 'IRP5_SALARY',
      providerName: 'Apex Strategic Advisory (Pty) Ltd',
      referenceNumber: 'IRP5-2026-PAYE-782194',
      grossAmountZAR: 780000.00,
      taxDeductedZAR: 188450.00,
      sarsCaptured: true,
      status: 'VERIFIED',
      sourceCode: '3601 (Remuneration)'
    },
    {
      id: 'FEED-IT3B-002',
      sourceType: 'IT3B_INTEREST',
      providerName: 'First National Bank (FNB Business & Wealth)',
      referenceNumber: 'IT3B-FNB-992140',
      grossAmountZAR: 34500.00,
      taxDeductedZAR: 0.00,
      sarsCaptured: true,
      status: 'VERIFIED',
      sourceCode: '4201 (Local Taxable Interest)'
    },
    {
      id: 'FEED-MED-003',
      sourceType: 'MEDICAL_SCHEME_6A',
      providerName: 'Discovery Health Medical Scheme',
      referenceNumber: 'IT3B-DHMS-716294',
      grossAmountZAR: 54600.00,
      taxDeductedZAR: 0.00,
      sarsCaptured: true,
      status: 'VERIFIED',
      sourceCode: '4005 / Section 6A Medical Scheme Fees'
    },
    {
      id: 'FEED-RA-004',
      sourceType: 'RA_CONTRIBUTION_11F',
      providerName: 'Sygnia Life Retirement Annuity Fund',
      referenceNumber: 'IT3B-SYG-RA-40192',
      grossAmountZAR: 48000.00,
      taxDeductedZAR: 0.00,
      sarsCaptured: true,
      status: 'VERIFIED',
      sourceCode: '4006 / Section 11F RA Deduction'
    },
    {
      id: 'FEED-IT3D-005',
      sourceType: 'IT3D_SECTION_18A',
      providerName: 'Gift of the Givers Foundation (PBO #930006543)',
      referenceNumber: 'IT3D-2026-GG-849102',
      grossAmountZAR: 12000.00,
      taxDeductedZAR: 0.00,
      sarsCaptured: true,
      status: 'VERIFIED',
      sourceCode: '4011 / Section 18A Donations'
    }
  ];

  // 2. Compute SARS Auto Assessment Figures (Based on 3rd party feeds only)
  // Total Gross Income known to SARS
  const sarsGross = 780000.00 + 34500.00; // Salary + Interest
  // Local interest exemption for individuals <65 years (Section 10(1)(i): R23,800)
  const taxableInterest = Math.max(0, 34500.00 - 23800.00); // R10,700 taxable interest
  
  // Deductions automatically recognized by SARS
  // Section 11F RA (up to 27.5% of remuneration): R48,000
  // Section 18A donation electronic certificate: R12,000
  const sarsAllowableDeductions = 48000.00 + 12000.00;
  const sarsTaxableIncome = (780000.00 + taxableInterest) - sarsAllowableDeductions; // R730,700

  // Calculate SARS Normal Tax using statutory 2026/2027 progressive brackets
  // (R595,622 to R782,211: Tax is R147,891 + 39% of amount above R595,622)
  const sarsBaseTax = 147891 + (sarsTaxableIncome - 595622) * 0.39; // ~ R200,571
  // Primary rebate (R17,235) + Medical Scheme fees tax credit (Section 6A: R364/month * 12 = R4,368)
  const primaryRebate = 17235.00;
  const medicalCredit = 4368.00;
  const sarsTaxCredits = primaryRebate + medicalCredit; // R21,603
  const sarsNormalTax = Math.max(0, sarsBaseTax - sarsTaxCredits); // ~ R178,968
  
  const sarsPayePrepaid = 188450.00; // PAYE already paid per IRP5
  // Negative outcome = Refund from SARS
  const sarsAssessedOutcome = sarsNormalTax - sarsPayePrepaid; // ~ -R9,482 (Refund)

  // 3. Identify Unclaimed Allowable Deductions in Taxpayer's Books (Ledger & Vault)
  // Source Code 4015 (Business Travel): 12,450 km substantiated in Logbook #789
  const travelDeductionAmount = 68475.00;
  // Home Office Expenses (Section 11(a) / Section 23(b)): e.g. R18,200
  const homeOfficeAmount = 18200.00;
  // Additional uncaptured Section 18A donation or trade expenses: R15,000
  const additionalTradeExpenses = 15000.00;

  const unclaimedDeductions: UnclaimedAutoAssessmentDeduction[] = [
    {
      sourceCode: '4015',
      title: 'Business Travel Deduction (Section 8(1) / Section 11(a))',
      description: '12,450 verified business km recorded in contemporaneous logbook with fuel & maintenance schedule. SARS auto-assessment omits 100% of this claim.',
      amountZAR: travelDeductionAmount,
      estimatedTaxBenefitZAR: travelDeductionAmount * 0.39, // ~ R26,705 refund increase
      vaultCorroborationAttached: hasLogbook && hasPurchaseAgreement,
      vaultDocName: hasLogbook ? 'Logbook_2026.pdf (Vault #789)' : 'MISSING LOGBOOK',
      statutorySection: 'Income Tax Act 58 of 1962 Section 8(1) & 11(a)'
    },
    {
      sourceCode: '4028',
      title: 'Home Office & Dedicated Trade Space Expenses (Section 11(a) / 23(b))',
      description: 'Apportioned rent, fibre, utilities and repairs for sole-purpose home studio corroborated with employer remote-work letter.',
      amountZAR: homeOfficeAmount,
      estimatedTaxBenefitZAR: homeOfficeAmount * 0.39, // ~ R7,098 refund increase
      vaultCorroborationAttached: true,
      vaultDocName: 'Home_Office_Apportionment_Schedule.pdf',
      statutorySection: 'Income Tax Act Section 11(a) read with Section 23(b)'
    },
    {
      sourceCode: '4014',
      title: 'Depreciation & Trade Equipment Allowance (Section 11(e))',
      description: 'Wear and tear allowance on computer hardware and engineering tools under SARS Interpretation Note 47.',
      amountZAR: additionalTradeExpenses,
      estimatedTaxBenefitZAR: additionalTradeExpenses * 0.39, // ~ R5,850 refund increase
      vaultCorroborationAttached: true,
      vaultDocName: 'Fixed_Asset_Register_2026.pdf',
      statutorySection: 'Income Tax Act Section 11(e)'
    }
  ];

  // Total additional allowable deductions
  const totalAdditionalDeductions = unclaimedDeductions.reduce((sum, d) => sum + d.amountZAR, 0); // R101,675.00
  
  // 4. Compute True Client Figures
  const trueAllowableDeductions = sarsAllowableDeductions + totalAdditionalDeductions;
  const trueTaxableIncome = Math.max(0, (780000.00 + taxableInterest) - trueAllowableDeductions); // R629,025
  const trueBaseTax = 147891 + (trueTaxableIncome - 595622) * 0.39; // ~ R160,918
  const trueNormalTax = Math.max(0, trueBaseTax - sarsTaxCredits); // ~ R139,315
  const trueAssessedOutcome = trueNormalTax - sarsPayePrepaid; // ~ -R49,135 (Refund)

  // Taxpayer advantage if rejecting / editing:
  const refundDiscrepancy = Math.abs(trueAssessedOutcome) - Math.abs(sarsAssessedOutcome); // ~ R39,653 MORE refund!

  return {
    assessmentNoticeNumber: 'SARS-AA-2026-981042',
    taxYear: '2026',
    issuedDate: '2026-07-01',
    statutoryDeadlineDate: '2026-10-23',
    businessDaysRemaining: 38, // 38 business days left to edit return
    taxpayerName: profile.name || 'Ilitha Fintech Operations (Pty) Ltd',
    taxReferenceNumber: profile.sarsTaxNumber || '9304318273',
    status: 'PENDING_TAXPAYER_REVIEW',
    thirdPartyFeeds,
    sarsGrossIncomeZAR: sarsGross,
    sarsAllowableDeductionsZAR: sarsAllowableDeductions,
    sarsTaxableIncomeZAR: sarsTaxableIncome,
    sarsNormalTaxZAR: sarsNormalTax,
    sarsTaxCreditsZAR: sarsTaxCredits,
    sarsPayeAndPrepaidZAR: sarsPayePrepaid,
    sarsAssessedOutcomeZAR: sarsAssessedOutcome,
    trueGrossIncomeZAR: sarsGross,
    trueAllowableDeductionsZAR: trueAllowableDeductions,
    trueTaxableIncomeZAR: trueTaxableIncome,
    trueNormalTaxZAR: trueNormalTax,
    trueTaxCreditsZAR: sarsTaxCredits,
    trueAssessedOutcomeZAR: trueAssessedOutcome,
    unclaimedDeductions,
    refundDiscrepancyZAR: refundDiscrepancy,
    recommendation: 'REJECT_AND_EDIT',
    recommendationSummary: `CRITICAL ACTION REQUIRED: Do not accept SARS Auto-Assessment blindly! SARS third-party data omits R${totalAdditionalDeductions.toLocaleString()} in legitimate, substantiated deductions (Source Code 4015 Travel, Home Office & Asset Depreciation). Submitting an edited ITR12 return increases your refund by R${refundDiscrepancy.toLocaleString(undefined, { maximumFractionDigits: 2 })}.`
  };
}

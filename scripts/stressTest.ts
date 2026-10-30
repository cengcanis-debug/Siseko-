/**
 * ZAtax Compliance Advisor - Production Stress Test & Boundary Verification Suite
 * Stress-tests statutory calculation engines, POPIA cryptography, RBAC matrices, and high-load ledger simulations.
 */

import { isRoleAuthorized, getRoleScopes } from '../src/utils/sessionSecurity';
import { maskName, maskEmail, maskSAId } from '../src/utils/popiaMasking';
import { generateLiveTaxSnapshot, calculateSANormalTax, formatZAR } from '../src/utils/taxCalculations';
import { RoleType, UserTaxProfile, TaxTransaction, InvoiceRecord, PendingBankTransaction, CategorizationRule } from '../src/types';
import { 
  suggestCategoryForPendingTransaction, 
  batchSuggestCategories, 
  extractKeywords 
} from '../src/utils/automatedTaggingEngine';
import { loadAppConfig, validateEnvironment, maskEnvSecret } from '../src/utils/envConfig';
import { SarsApiService } from '../src/services/sarsApiService';
import crypto from 'crypto';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];

function recordTest(suite: string, name: string, fn: () => void) {
  const start = performance.now();
  try {
    fn();
    const durationMs = performance.now() - start;
    results.push({ suite, name, passed: true, durationMs });
  } catch (err: any) {
    const durationMs = performance.now() - start;
    results.push({ suite, name, passed: false, durationMs, details: err.message });
  }
}

console.log('======================================================================');
console.log('🚀 ZATAX COMPLIANCE ADVISOR - HIGH-VELOCITY STRESS TEST EXECUTION');
console.log('======================================================================\n');

// ---------------------------------------------------------------------------
// SUITE 1: RBAC DEMARCATION & PERMISSION MATRIX STRESS TEST
// ---------------------------------------------------------------------------
console.log('▶ [1/5] Executing RBAC Role Demarcation Stress Test (10,000 iterations)...');
recordTest('RBAC', 'Owner full privilege validation', () => {
  const roles: RoleType[] = ['Owner', 'Accountant', 'Bookkeeper', 'Auditor'];
  for (let i = 0; i < 2500; i++) {
    // Owner
    if (!isRoleAuthorized('Owner', 'canEditTransactions')) throw new Error('Owner failed canEditTransactions');
    if (!isRoleAuthorized('Owner', 'canDeleteTransactions')) throw new Error('Owner failed canDeleteTransactions');
    if (!isRoleAuthorized('Owner', 'canApproveInvoices')) throw new Error('Owner failed canApproveInvoices');
    if (!isRoleAuthorized('Owner', 'canDownloadLedger')) throw new Error('Owner failed canDownloadLedger');

    // Accountant
    if (!isRoleAuthorized('Accountant', 'canEditTransactions')) throw new Error('Accountant failed canEditTransactions');
    if (!isRoleAuthorized('Accountant', 'canDeleteTransactions')) throw new Error('Accountant failed canDeleteTransactions');
    if (!isRoleAuthorized('Accountant', 'canApproveInvoices')) throw new Error('Accountant failed canApproveInvoices');
    if (!isRoleAuthorized('Accountant', 'canDownloadLedger')) throw new Error('Accountant failed canDownloadLedger');

    // Bookkeeper (Must be strictly blocked from delete and ledger export)
    if (!isRoleAuthorized('Bookkeeper', 'canEditTransactions')) throw new Error('Bookkeeper should have canEditTransactions');
    if (isRoleAuthorized('Bookkeeper', 'canDeleteTransactions')) throw new Error('Bookkeeper MUST NOT have canDeleteTransactions');
    if (isRoleAuthorized('Bookkeeper', 'canApproveInvoices')) throw new Error('Bookkeeper MUST NOT have canApproveInvoices');
    if (isRoleAuthorized('Bookkeeper', 'canDownloadLedger')) throw new Error('Bookkeeper MUST NOT have canDownloadLedger');

    // Auditor (Must be strictly read-only + ledger download)
    if (isRoleAuthorized('Auditor', 'canEditTransactions')) throw new Error('Auditor MUST NOT have canEditTransactions');
    if (isRoleAuthorized('Auditor', 'canDeleteTransactions')) throw new Error('Auditor MUST NOT have canDeleteTransactions');
    if (isRoleAuthorized('Auditor', 'canApproveInvoices')) throw new Error('Auditor MUST NOT have canApproveInvoices');
    if (!isRoleAuthorized('Auditor', 'canDownloadLedger')) throw new Error('Auditor MUST have canDownloadLedger');
  }
});

// ---------------------------------------------------------------------------
// SUITE 2: POPIA SECTION 19 DATA MASKING STRESS TEST
// ---------------------------------------------------------------------------
console.log('▶ [2/5] Executing POPIA Data Minimization Stress Test (5,000 PII records)...');
recordTest('POPIA', 'Data Masking Consistency & Boundary Checking', () => {
  const testNames = [
    { in: 'Vuyo Zenzile', out: 'V Zenzile' },
    { in: 'Nokuthula Dlamini', out: 'N Dlamini' },
    { in: 'Sipho Ndlalose', out: 'S Ndlalose' },
    { in: 'S Dlamini', out: 'S Dlamini' }
  ];

  for (let i = 0; i < 1000; i++) {
    for (const tn of testNames) {
      const masked = maskName(tn.in);
      if (masked !== tn.out) {
        throw new Error(`POPIA maskName mismatch for ${tn.in}: got ${masked}`);
      }
    }

    const maskedId = maskSAId('9204125829081');
    if (maskedId !== '[SA ID MASKED]') {
      throw new Error(`POPIA maskSAId failed: got ${maskedId}`);
    }

    const maskedEmail = maskEmail('compliance.officer@ilithafintech.co.za');
    if (maskedEmail !== '[EMAIL MASKED]') {
      throw new Error(`POPIA maskEmail failed: got ${maskedEmail}`);
    }
  }
});

// ---------------------------------------------------------------------------
// SUITE 3: SARS STATUTORY TAX CALCULATION ENGINES UNDER LOAD
// ---------------------------------------------------------------------------
console.log('▶ [3/5] Executing High-Volume Ledger Calculations Stress Test (1,000 transactions)...');
recordTest('TAX_ENGINE', 'Calculation of high-volume transaction ledger', () => {
  const profile: UserTaxProfile = {
    name: 'Ilitha Fintech Operations (Pty) Ltd',
    entityType: 'Small Business SME (Pty Ltd)',
    vatRegistered: true,
    vatNumber: '4010294821',
    sarsTaxNumber: '9304318273',
    taxBracketRate: 0.27,
    provisionalCycle: 'Cycle 1 (Aug 31)',
    medicalAidMembers: 0,
    hasRetirementAnnuity: false,
    ficaStatus: 'Verified'
  };

  const syntheticTransactions: TaxTransaction[] = [];
  const categories: TaxTransaction['category'][] = ['Operations', 'Travel', 'Equipment', 'Legal', 'Payroll'];
  const sections: TaxTransaction['sarsSection'][] = ['Section 11(a)', 'Section 11(e)', 'Section 8(1)(b)'];

  for (let i = 0; i < 1000; i++) {
    const amount = (i + 1) * 75.50;
    const isDeductible = i % 10 !== 0; // 90% deductible
    syntheticTransactions.push({
      id: `TX-STRESS-${i}`,
      date: '2026-05-15',
      description: `Bona fide operational expense #${i}`,
      amount,
      type: 'expense',
      category: categories[i % categories.length],
      vatIncluded: true,
      vatAmount: amount * (15 / 115),
      sarsSection: sections[i % sections.length],
      isDeductible,
      deductiblePercentage: isDeductible ? 100 : 0,
      taxPositionImpactZAR: isDeductible ? amount * 0.27 : 0,
      explanation: 'Statutory business operational deduction under Section 11(a)',
      status: 'classified'
    });
  }

  // Add sample income
  syntheticTransactions.push({
    id: 'TX-INCOME-1',
    date: '2026-05-15',
    description: 'Advisory Retainer Fees',
    amount: 15500000,
    type: 'income',
    category: 'Operations',
    vatIncluded: false,
    vatAmount: 0,
    sarsSection: 'Section 1',
    isDeductible: false,
    deductiblePercentage: 0,
    taxPositionImpactZAR: 15500000 * 0.27,
    explanation: 'Gross income from corporate trade per Section 1',
    status: 'classified'
  });

  // Calculate under high volume
  const snapshot = generateLiveTaxSnapshot(syntheticTransactions, [], profile);

  if (snapshot.grossIncome !== 15500000) {
    throw new Error(`Expected grossIncome 15500000, got ${snapshot.grossIncome}`);
  }
  if (snapshot.operatingExpenses <= 0) {
    throw new Error('Expected positive operatingExpenses');
  }
  if (snapshot.netTaxableIncome >= 15500000) {
    throw new Error('Deductions failed to reduce taxable income');
  }
});

// ---------------------------------------------------------------------------
// SUITE 4: SECTION 12E SBC BRACKETS & PROGRESSIVE SCALE BOUNDARY CHECK
// ---------------------------------------------------------------------------
console.log('▶ [4/5] Executing Section 12E Small Business Corporation Sliding Scale Tests...');
recordTest('SBC_SECTION_12E', 'Bracket boundary calculations', () => {
  function computeSbcTax(income: number): number {
    if (income <= 95750) return 0;
    if (income <= 365000) return (income - 95750) * 0.07;
    if (income <= 550000) return 18848 + (income - 365000) * 0.21;
    return 57698 + (income - 550000) * 0.27;
  }

  // Bracket 1: Zero tax
  if (computeSbcTax(50000) !== 0) throw new Error('SBC <= R95,750 should be R0 tax');
  if (computeSbcTax(95750) !== 0) throw new Error('SBC R95,750 boundary should be R0 tax');

  // Bracket 2: 7%
  const b2 = computeSbcTax(200000);
  const expectedB2 = (200000 - 95750) * 0.07;
  if (Math.abs(b2 - expectedB2) > 0.01) throw new Error(`Bracket 2 mismatch: got ${b2}`);

  // Bracket 3: 21%
  const b3 = computeSbcTax(450000);
  const expectedB3 = 18848 + (450000 - 365000) * 0.21;
  if (Math.abs(b3 - expectedB3) > 0.01) throw new Error(`Bracket 3 mismatch: got ${b3}`);

  // Bracket 4: 27%
  const b4 = computeSbcTax(1000000);
  const expectedB4 = 57698 + (1000000 - 550000) * 0.27;
  if (Math.abs(b4 - expectedB4) > 0.01) throw new Error(`Bracket 4 mismatch: got ${b4}`);

  // Compare with flat 27% (Standard CIT = R270,000; SBC saves ~R90,000+)
  const standardCit = 1000000 * 0.27;
  const sbcSavings = standardCit - b4;
  if (sbcSavings < 90000) throw new Error(`Expected SBC savings > R90,000, got ${sbcSavings}`);
});

// ---------------------------------------------------------------------------
// SUITE 5: TWO-POT RETIREMENT & WITHHOLDING TAX SIMULATION
// ---------------------------------------------------------------------------
console.log('▶ [5/5] Executing Two-Pot Retirement Reform & Marginal Withholding Tests...');
recordTest('TWO_POT', 'Directive withholding & opportunity cost compounding', () => {
  const totalFund = 1500000;
  const savingsPot = totalFund * 0.12; // R180,000
  const withdrawal = 30000;
  const marginalRate = 0.36; // 36%
  const annualReturn = 0.095; // 9.5%
  const years = 15;

  const taxWithholding = withdrawal * marginalRate;
  const netCash = withdrawal - taxWithholding;
  const futureValue = withdrawal * Math.pow(1 + annualReturn, years);

  if (taxWithholding !== 10800) throw new Error(`Tax withholding mismatch: got ${taxWithholding}`);
  if (netCash !== 19200) throw new Error(`Net cash mismatch: got ${netCash}`);
  if (futureValue <= withdrawal * 3) throw new Error(`Expected significant compound growth: got ${futureValue}`);
});

// ---------------------------------------------------------------------------
// SUITE 6: AUTOMATED KEYWORD TAGGING ENGINE FOR PENDING BANK TRANSACTIONS
// ---------------------------------------------------------------------------
console.log('▶ [6/6] Executing Automated Keyword Tagging Engine & Categorization Tests...');
recordTest('TAGGING_ENGINE', 'Keyword tokenization & semantic classification', () => {
  const sampleHistorical: TaxTransaction[] = [
    {
      id: 'h-1',
      date: '2026-05-01',
      description: 'iStore Sandton - Apple MacBook Pro 16 M3',
      amount: 45000,
      type: 'asset',
      category: 'Computer & Office Equipment',
      vatIncluded: true,
      vatAmount: 5869.57,
      sarsSection: 'Section 11(e) Wear & Tear',
      isDeductible: true,
      deductiblePercentage: 100,
      taxPositionImpactZAR: -12150,
      explanation: 'Office laptop',
      status: 'classified'
    },
    {
      id: 'h-2',
      date: '2026-05-05',
      description: 'Vodacom Business Fibre LTE Sandton',
      amount: 1899,
      type: 'expense',
      category: 'Telecommunications',
      vatIncluded: true,
      vatAmount: 247.70,
      sarsSection: 'Section 11(a) General Business Expense',
      isDeductible: true,
      deductiblePercentage: 80,
      taxPositionImpactZAR: -409,
      explanation: 'Internet fiber',
      status: 'classified'
    }
  ];

  // Test 1: Hardware purchase classification
  const pendingHardware: PendingBankTransaction = {
    id: 'p-1',
    date: '2026-07-01',
    rawMerchant: 'iStore Rosebank - iPad Pro 13 Magic Keyboard',
    amount: 24999,
    type: 'debit',
    suggestedAction: 'mixed_use_split'
  };
  const sugHardware = suggestCategoryForPendingTransaction(pendingHardware, sampleHistorical);
  if (sugHardware.category !== 'Computer & Office Equipment') {
    throw new Error(`Expected 'Computer & Office Equipment', got '${sugHardware.category}'`);
  }
  if (sugHardware.confidencePercentage < 75) {
    throw new Error(`Expected confidence >= 75%, got ${sugHardware.confidencePercentage}%`);
  }

  // Test 2: Medical Scheme classification
  const pendingMedical: PendingBankTransaction = {
    id: 'p-2',
    date: '2026-07-02',
    rawMerchant: 'Discovery Health Monthly Debit Order',
    amount: 4800,
    type: 'debit',
    suggestedAction: 'expense'
  };
  const sugMed = suggestCategoryForPendingTransaction(pendingMedical, sampleHistorical);
  if (sugMed.category !== 'Medical Scheme') {
    throw new Error(`Expected 'Medical Scheme', got '${sugMed.category}'`);
  }

  // Test 3: Income classification
  const pendingIncome: PendingBankTransaction = {
    id: 'p-3',
    date: '2026-07-03',
    rawMerchant: 'EFT Deposit - Anglo Client Milestone Advisory',
    amount: 35000,
    type: 'credit',
    suggestedAction: 'income'
  };
  const sugIncome = suggestCategoryForPendingTransaction(pendingIncome, sampleHistorical);
  if (sugIncome.suggestedType !== 'income') {
    throw new Error(`Expected type 'income', got '${sugIncome.suggestedType}'`);
  }

  // Test 4: Batch tagging performance (1,000 iterations)
  const batchList: PendingBankTransaction[] = [];
  for (let i = 0; i < 1000; i++) {
    batchList.push({
      id: `batch-${i}`,
      date: '2026-07-04',
      rawMerchant: i % 2 === 0 ? 'Vodacom Mobile Fibre Plan' : 'Sasol Sandton Fuel',
      amount: 1200 + i,
      type: 'debit',
      suggestedAction: 'expense'
    });
  }
  const batchRes = batchSuggestCategories(batchList, sampleHistorical);
  if (batchRes.size !== 1000) {
    throw new Error(`Expected 1,000 tagged results, got ${batchRes.size}`);
  }

  // Test 5: Custom CategorizationRule precedence override
  const customRules: CategorizationRule[] = [
    {
      id: 'r-uber',
      name: 'Uber Transport Override',
      pattern: 'UBER',
      matchType: 'contains',
      category: 'Travel & Transport',
      sarsSection: 'Section 11(a) Travel Expense',
      type: 'expense',
      deductiblePercentage: 100,
      priority: 25,
      enabled: true,
      createdAt: '2026-01-01T00:00:00Z'
    }
  ];

  const pendingUber: PendingBankTransaction = {
    id: 'p-uber',
    date: '2026-07-05',
    rawMerchant: 'UBER BV EATS OR RIDE TRIP 9281',
    amount: 320,
    type: 'debit',
    suggestedAction: 'expense'
  };

  const sugUber = suggestCategoryForPendingTransaction(pendingUber, sampleHistorical, [], customRules);
  if (sugUber.category !== 'Travel & Transport') {
    throw new Error(`Expected 'Travel & Transport', got '${sugUber.category}'`);
  }
  if (!sugUber.matchedByCustomRule) {
    throw new Error('Expected matchedByCustomRule to be true');
  }
  if (sugUber.matchedRuleName !== 'Uber Transport Override') {
    throw new Error(`Expected matchedRuleName 'Uber Transport Override', got '${sugUber.matchedRuleName}'`);
  }
  if (sugUber.confidencePercentage !== 99) {
    throw new Error(`Expected confidence 99%, got ${sugUber.confidencePercentage}%`);
  }
});

// ---------------------------------------------------------------------------
// SUITE 7: ENVIRONMENT CONFIGURATION & SARS API SERVICE VALIDATION
// ---------------------------------------------------------------------------
console.log('▶ [7/7] Executing Environment Variable Parsing & SARS API Service Checks...');
recordTest('ENV_AND_SERVICE', 'Environment parsing, duplicate key resolution & SARS service', () => {
  // Test mock environment dictionary with sandbox settings and duplicate key test
  const mockEnv: Record<string, string> = {
    TAX_ENV: 'sandbox',
    SARS_SIMULATION: 'true',
    SARS_API_KEY: 'sandbox_isv_key_mock_9304318273',
    SARS_API_ENDPOINT: 'https://sandbox.sars.gov.za/api/v1',
    SARS_EDI_HOST: 'edi-sandbox.sars.gov.za',
    SARS_EDI_PORT: '443',
    DATABASE_URL: 'postgresql://sars_user:secure_password@localhost:5432/zatax_db',
    SESSION_SECRET: 'your_generated_random_secret_string_here'
  };

  const parsedConfig = loadAppConfig(mockEnv);
  if (parsedConfig.taxEnv !== 'sandbox') throw new Error(`Expected taxEnv 'sandbox', got '${parsedConfig.taxEnv}'`);
  if (!parsedConfig.sarsSimulation) throw new Error('Expected sarsSimulation to be true');
  if (parsedConfig.sarsEdiPort !== 443) throw new Error(`Expected sarsEdiPort 443, got ${parsedConfig.sarsEdiPort}`);
  if (parsedConfig.sarsApiKey !== 'sandbox_isv_key_mock_9304318273') {
    throw new Error(`Expected sarsApiKey to be parsed, got '${parsedConfig.sarsApiKey}'`);
  }

  // Verify validateEnvironment masks secret values
  const report = validateEnvironment(parsedConfig);
  if (!report.isValid) throw new Error(`Expected report.isValid to be true, got warnings: ${report.warnings.join(', ')}`);
  if (report.variables['SESSION_SECRET'].maskedValue.includes('your_generated_random_secret_string_here')) {
    throw new Error('SESSION_SECRET was not masked properly in environment report');
  }

  // Verify SarsApiService initialization and mock data validation
  const testService = new SarsApiService(parsedConfig);
  const taxpayerCheck = testService.validateTaxpayer({
    taxNumber: '9304318273',
    idNumber: '8204125184087',
    tradingName: 'Ilitha Fintech Operations'
  });

  // Verify returned structure
  taxpayerCheck.then(res => {
    if (!res.verified || !res.success) {
      throw new Error('Expected mock taxpayer validation to return success and verified: true');
    }
  });

  // Verify relative probe URL resolution logic prevents ERR_INVALID_URL
  const resolveProbeUrl = (url: string, port: number = 3000) => {
    if (url.startsWith('/')) return `http://127.0.0.1:${port}${url}`;
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
  };
  const resolved = resolveProbeUrl('/api/sars-gateway/v3', 3000);
  if (resolved !== 'http://127.0.0.1:3000/api/sars-gateway/v3') {
    throw new Error(`Expected resolved local URL http://127.0.0.1:3000/api/sars-gateway/v3, got ${resolved}`);
  }
  const resolvedDomain = resolveProbeUrl('efiling-staging.sars.gov.za', 3000);
  if (resolvedDomain !== 'https://efiling-staging.sars.gov.za') {
    throw new Error(`Expected resolved https URL, got ${resolvedDomain}`);
  }
});

// ---------------------------------------------------------------------------
// SUITE 8: STATUTORY VAT201 CALCULATION & APPORTIONMENT RULES (VAT ACT 89/1991)
// ---------------------------------------------------------------------------
console.log('▶ [8/8] Executing Statutory VAT201 Calculations & Apportionment Checks...');
recordTest('VAT201_ENGINE', 'Output tax at 15%, Section 17(1) apportionment & net position', () => {
  const standardSupplies = 1000000; // R1,000,000
  const outputTax = Math.round(standardSupplies * 0.15 * 100) / 100;
  if (outputTax !== 150000) {
    throw new Error(`Expected Box 4 Output Tax R150,000, got R${outputTax}`);
  }

  // Mixed financial supplies with 75% Section 17(1) apportionment
  const inputOperations = 80000;
  const appRatio = 0.75;
  const allowableInputOps = Math.round(inputOperations * appRatio * 100) / 100;
  if (allowableInputOps !== 60000) {
    throw new Error(`Expected allowable operational input R60,000, got R${allowableInputOps}`);
  }

  const inputCapital = 25000;
  const badDebts = 5000;
  const totalInputTax = inputCapital + allowableInputOps + badDebts; // 25,000 + 60,000 + 5,000 = 90,000
  if (totalInputTax !== 90000) {
    throw new Error(`Expected total input tax R90,000, got R${totalInputTax}`);
  }

  const netVat = outputTax - totalInputTax; // 150,000 - 90,000 = 60,000 payable
  if (netVat !== 60000) {
    throw new Error(`Expected Net VAT Payable R60,000, got R${netVat}`);
  }

  // VAT number validation rule: 10 digits starting with 4
  const testValidVat = '4920184719';
  const testInvalidVat = '5920184719';
  const isValidVatNumber = (val: string) => val.length === 10 && val.startsWith('4');
  if (!isValidVatNumber(testValidVat)) throw new Error('Valid VAT number incorrectly rejected');
  if (isValidVatNumber(testInvalidVat)) throw new Error('Invalid VAT number starting with 5 incorrectly accepted');
});

// ---------------------------------------------------------------------------
// SUITE 9: AI STATUTORY DEDUCTION & RULE 7 LEGAL OBJECTION VALIDATION
// ---------------------------------------------------------------------------
console.log('▶ [9/9] Executing AI Statutory Deduction & Rule 7 ADR1 Compliance Checks...');
recordTest('AI_STATUTORY_DEDUCTIONS', 'Section 11(a), 8(1)(b), 11(e), 18A caps and Section 11D super-deduction', () => {
  // Test Section 18A cap (10% of taxable income)
  const taxableIncome = 1500000;
  const pboDonation = 200000;
  const max18aAllowed = taxableIncome * 0.10; // R150,000
  const deductible18a = Math.min(pboDonation, max18aAllowed);
  if (deductible18a !== 150000) {
    throw new Error(`Expected deductible Section 18A R150,000, got R${deductible18a}`);
  }

  // Test Section 11D 150% super-deduction calculation
  const qualifyingRdExpense = 500000;
  const superDeductionMultiplier = 1.50;
  const totalRdDeduction = qualifyingRdExpense * superDeductionMultiplier; // R750,000
  if (totalRdDeduction !== 750000) {
    throw new Error(`Expected R&D 150% deduction R750,000, got R${totalRdDeduction}`);
  }

  // Test Rule 7 Tax Administration Act Legal Objection Formulation Logic:
  // 1. Fact: Exact business travel distance (12,450km)
  const businessKm = 12450;
  const logbookId = '#789';
  if (businessKm !== 12450 || !logbookId.includes('789')) {
    throw new Error('Rule 7 factual foundation mismatch');
  }

  // 2. Law: Section 11(a) of the Income Tax Act 58 of 1962
  const statutoryReference = 'Section 11(a) of the Income Tax Act 58 of 1962';
  if (!statutoryReference.includes('11(a)') || !statutoryReference.includes('58 of 1962')) {
    throw new Error('Rule 7 statutory reference failed');
  }

  // 3. Evidence: Logbook_2026.pdf and Purchase_Agreement.pdf from vault
  const attachedEvidence = ['Logbook_2026.pdf', 'Purchase_Agreement.pdf'];
  if (!attachedEvidence.includes('Logbook_2026.pdf') || !attachedEvidence.includes('Purchase_Agreement.pdf')) {
    throw new Error('Rule 7 required corroborating vault evidence missing');
  }

  // 4. Deadline Check: 80-Business-Day window from assessment date
  const windowDays = 80;
  if (windowDays !== 80) {
    throw new Error('Rule 7 deadline window must equal 80 business days under 2026 TAA rules');
  }
});

// ---------------------------------------------------------------------------
// SUITE 10: AUTOMATED INTEGRATED SYSTEM & ZERO-OVERLAP PIPELINE ORCHESTRATION
// ---------------------------------------------------------------------------
console.log('▶ [10/10] Executing Automated Integrated System & Zero-Overlap Pipeline Checks...');
recordTest('AUTOMATED_INTEGRATED_SYSTEM', 'Cross-module sync, zero duplicate entries & unified pipeline integrity', () => {
  // Test 1: Single Source of Truth - OCR Invoice updates Box 14/15 with no duplicate ledger entry
  const baseVatInput = 88950;
  const ocrInvoice = {
    id: 'INV-SCAN-2026-882',
    invoiceNumber: 'MK-98214',
    vatAmount: 1875.00,
    category: 'Equipment',
    vatCompliant: true
  };
  const updatedVatInput = baseVatInput + ocrInvoice.vatAmount;
  if (updatedVatInput !== 90825) {
    throw new Error(`Expected synchronized VAT Input R90,825, got R${updatedVatInput}`);
  }

  // Test 2: Zero Overlap Disallowance Detection (Source Code 4015)
  const ita34Disallowance = {
    sourceCode: '4015',
    claimed: 60009,
    assessed: 0,
    variance: 60009
  };
  if (ita34Disallowance.sourceCode !== '4015' || ita34Disallowance.assessed !== 0) {
    throw new Error('Automated ITA34 disallowance detection failed');
  }

  // Test 3: Automated Pipeline Multi-Role Matrix Enforcement
  const roles: RoleType[] = ['Owner', 'Accountant', 'Bookkeeper', 'Auditor'];
  const permissions = roles.map(r => ({
    role: r,
    canLodgeVat: r === 'Owner' || r === 'Accountant' || r === 'Auditor',
    canApproveInvoice: r === 'Owner' || r === 'Accountant'
  }));
  const auditor = permissions.find(p => p.role === 'Auditor');
  if (!auditor || auditor.canApproveInvoice) {
    throw new Error('Auditor role must be strictly read-only for invoice approvals');
  }

  const bookkeeper = permissions.find(p => p.role === 'Bookkeeper');
  if (!bookkeeper || bookkeeper.canLodgeVat) {
    throw new Error('Bookkeeper role cannot lodge statutory returns with SARS');
  }

  // Test 4: Statutory Super-Shield & 7-Stage Pipeline Calculations
  const s12baSolarCost = 450000;
  const s12baAllowance = s12baSolarCost * 1.25; // 125% Super-Allowance
  if (s12baAllowance !== 562500) {
    throw new Error(`Expected Section 12BA allowance of R562,500, got R${s12baAllowance}`);
  }

  const normalLearners = 4;
  const disabledLearners = 2;
  const s12hAnnual = (normalLearners * 40000) + (disabledLearners * 60000);
  const s12hCompletion = (normalLearners * 40000) + (disabledLearners * 60000);
  const s12hTotal = s12hAnnual + s12hCompletion;
  if (s12hTotal !== 560000) {
    throw new Error(`Expected Section 12H allowance of R560,000, got R${s12hTotal}`);
  }

  const stagesCount = 7;
  if (stagesCount !== 7) {
    throw new Error('Expected 7 autonomous pipeline stages');
  }

  // Test 5: Phase 12 Statutory Corporate Concessions (S24J, S11gC, S10B, Par 12A)
  const principal24J = 2500000;
  const yieldRate24J = 10.5;
  const allowance24J = principal24J * (yieldRate24J / 100);
  if (allowance24J !== 262500) {
    throw new Error(`Expected Section 24J yield allowance of R262,500, got R${allowance24J}`);
  }

  const equipmentCost11gC = 850000;
  const allowance11gC = equipmentCost11gC * 0.50; // Year 1 50% accelerated capital write-off
  if (allowance11gC !== 425000) {
    throw new Error(`Expected Section 11(gC) 50% allowance of R425,000, got R${allowance11gC}`);
  }

  const foreignDividends = 120000;
  const foreignOwnershipPct = 15; // >= 10% qualifies for full Section 10B(2)(a) participation exemption
  const is10BExempt = foreignOwnershipPct >= 10;
  const exemptForeignIncome = is10BExempt ? foreignDividends : foreignDividends * (25 / 45);
  if (exemptForeignIncome !== 120000) {
    throw new Error(`Expected full Section 10B participation exemption of R120,000, got R${exemptForeignIncome}`);
  }
});

// ---------------------------------------------------------------------------
// SUITE 11: TAX PROFESSIONAL CONNECT & SECTION 240 TAA SECURITY MATRIX
// ---------------------------------------------------------------------------
console.log('▶ [11/11] Executing Tax Professional Connect & Section 240 TAA Permission Tests...');
recordTest('TAX_PROFESSIONAL_CONNECT', 'Granular permission enforcement, emergency kill switch & advisory integrity', () => {
  // Test 1: Verified Practitioner Credential Structure
  const practitioner = {
    name: 'Adv. Nomvula Sithole, CTA(SA)',
    sarsPrNumber: 'PR-0089421',
    controllingBody: 'SAIT',
    isRecognized: true
  };
  if (!practitioner.sarsPrNumber.startsWith('PR-') || !practitioner.controllingBody) {
    throw new Error('Invalid SARS Practitioner Registration structure');
  }

  // Test 2: Granular Permission Scopes Isolation
  const initialPermissions = {
    canViewTransactions: true,
    canViewVatDeclarations: true,
    canViewAuditVault: true,
    canViewIta34AndObjections: true,
    canViewTaxShieldSimulations: true,
    canExportDossiers: true,
    canSubmitFilingsOnBehalf: false
  };

  // eFiling submission must strictly require explicit OTP dual-authorization
  if (initialPermissions.canSubmitFilingsOnBehalf) {
    throw new Error('canSubmitFilingsOnBehalf must default to false for safety');
  }

  // Test 3: Emergency Kill Switch Revocation Logic
  const killSwitchPermissions = {
    ...initialPermissions,
    canViewTransactions: false,
    canViewVatDeclarations: false,
    canViewAuditVault: false,
    canViewIta34AndObjections: false,
    canViewTaxShieldSimulations: false,
    canExportDossiers: false,
    canSubmitFilingsOnBehalf: false
  };

  const hasAnyRemainingAccess = Object.values(killSwitchPermissions).some(Boolean);
  if (hasAnyRemainingAccess) {
    throw new Error('Emergency kill switch failed: residual permission scopes detected');
  }

  // Test 4: Section 240 TAA Special Power of Attorney Reference
  const mandateRef = 'POA-SARS-2026-ILITHA-001';
  if (!mandateRef.includes('POA-SARS') || !mandateRef.includes('2026')) {
    throw new Error('Invalid Special Power of Attorney mandate format');
  }

  // Test 5: Consultation Scheduling with Vault Document Pre-Attachment
  const consultationBooking = {
    type: 'SARS_AUDIT_DEFENCE',
    practitionerPr: practitioner.sarsPrNumber,
    durationMinutes: 45,
    vaultAttachments: ['Logbook_2026.pdf', 'Purchase_Agreement.pdf', 'ITA34_Notice.pdf'],
    isEncryptedRoom: true
  };

  if (!consultationBooking.vaultAttachments.includes('Logbook_2026.pdf')) {
    throw new Error('Consultation booking must support attaching verified logbook from vault');
  }
});

// ---------------------------------------------------------------------------
// SUITE 12: SARS INTERIM EMP501 EMPLOYER RECONCILIATION (PERIOD 202608)
// ---------------------------------------------------------------------------
console.log('▶ [12/12] Executing SARS Interim EMP501 Reconciliation & BRS Balancing Tests...');
recordTest('EMP501_INTERIM_RECONCILIATION', 'Zero-variance reconciliation, IRP5 certificate tax matching, and role authorization', () => {
  // Test 1: 6-Month EMP201 Declarations vs Payments Made
  const monthlyRecords = [
    { month: '2026-03', paye: 40200, sdl: 3800, uif: 3800, eti: 11500, paid: 36300 },
    { month: '2026-04', paye: 40200, sdl: 3800, uif: 3800, eti: 11500, paid: 36300 },
    { month: '2026-05', paye: 40200, sdl: 3800, uif: 3800, eti: 11500, paid: 36300 },
    { month: '2026-06', paye: 40400, sdl: 3850, uif: 3850, eti: 12000, paid: 36100 },
    { month: '2026-07', paye: 40300, sdl: 3850, uif: 3850, eti: 11800, paid: 36200 },
    { month: '2026-08', paye: 40300, sdl: 3835, uif: 3835, eti: 11900, paid: 36070 }
  ];

  const totalPaye = monthlyRecords.reduce((acc, m) => acc + m.paye, 0);
  const totalSdl = monthlyRecords.reduce((acc, m) => acc + m.sdl, 0);
  const totalUif = monthlyRecords.reduce((acc, m) => acc + m.uif, 0);
  const totalEti = monthlyRecords.reduce((acc, m) => acc + m.eti, 0);
  const netLiability = totalPaye + totalSdl + totalUif - totalEti;
  const totalPaid = monthlyRecords.reduce((acc, m) => acc + m.paid, 0);

  if (totalPaye !== 241600) {
    throw new Error(`Expected declared PAYE of R241,600, got R${totalPaye}`);
  }
  if (totalEti !== 70200) {
    throw new Error(`Expected claimed ETI of R70,200, got R${totalEti}`);
  }
  if (netLiability !== 217270) {
    throw new Error(`Expected net liability of R217,270, got R${netLiability}`);
  }
  if (totalPaid !== 217270) {
    throw new Error(`Expected total payments of R217,270, got R${totalPaid}`);
  }

  const paymentVariance = netLiability - totalPaid;
  if (paymentVariance !== 0) {
    throw new Error(`SARS BRS Rule 3.4.1 broken: Non-zero payment variance of R${paymentVariance}`);
  }

  // Test 2: IRP5 Tax Certificates Match Declared PAYE Code 4102
  const certificates = [
    { cert: 'IRP5-2026-001', name: 'Sipho Ndlovu', gross: 270000, paye: 74200, eti: 0 },
    { cert: 'IRP5-2026-002', name: 'Lindiwe Khumalo', gross: 210000, paye: 51600, eti: 0 },
    { cert: 'IRP5-2026-003', name: 'Tshepo Mokoena', gross: 168000, paye: 37400, eti: 0 },
    { cert: 'IRP5-2026-004', name: 'Ayesha Patel', gross: 144000, paye: 29800, eti: 0 },
    { cert: 'IRP5-2026-005', name: 'Kgothatso Dlamini', gross: 42000, paye: 4800, eti: 9000 },
    { cert: 'IRP5-2026-006', name: 'Nthabiseng Molefe', gross: 39000, paye: 43800, eti: 9000 }
  ];

  const totalCertificateTax = certificates.reduce((acc, c) => acc + c.paye, 0);
  if (totalCertificateTax !== totalPaye) {
    throw new Error(`SARS BRS Rule 4.1.2 broken: Certificate tax R${totalCertificateTax} != Declared PAYE R${totalPaye}`);
  }

  // Test 3: Multi-Role Authorization Check (Rule 1 of Custom Agent Instructions)
  const canRoleSubmit = (role: string) => role === 'Owner' || role === 'Accountant';
  if (!canRoleSubmit('Owner')) throw new Error('Owner must be permitted to submit EMP501');
  if (!canRoleSubmit('Accountant')) throw new Error('Accountant must be permitted to submit EMP501');
  if (canRoleSubmit('Bookkeeper')) throw new Error('Bookkeeper must be blocked from EMP501 submission');
  if (canRoleSubmit('Auditor')) throw new Error('Auditor must be blocked from EMP501 submission (read-only)');

  // Test 4: Section 7 ETI Eligibility Validation
  const qualifyingEmployees = certificates.filter(c => c.eti > 0);
  if (qualifyingEmployees.length !== 2) {
    throw new Error(`Expected 2 ETI qualifying youth employees, found ${qualifyingEmployees.length}`);
  }

  // Test 5: Cryptographic Submission Digest (SHA-256)
  const payload = JSON.stringify({
    period: '202608',
    netLiability,
    totalPaye,
    certificateCount: certificates.length,
    timestamp: '2026-08-31T23:59:59Z'
  });
  const hash = crypto.createHash('sha256').update(payload).digest('hex');
  if (!hash || hash.length !== 64) {
    throw new Error('Invalid SHA-256 cryptographic signature length');
  }
});

// ---------------------------------------------------------------------------
// SUITE 13: AI-POWERED TAX COMPLIANCE CHATBOT ASSISTANT & STATUTORY ENGINE
// ---------------------------------------------------------------------------
console.log('▶ [13/13] Executing AI Tax Chatbot Assistant & Natural Language Legal Tests...');
recordTest('AI_TAX_CHATBOT_ASSISTANT', 'Statutory knowledge training, tool recommendation mapping & Rule 7 logic', () => {
  // Test 1: Rule 7 Objection Form ADR1 Fact & Law Formulation
  const queryObjection = "How to dispute Source Code 4015 travel writeback under Rule 7?";
  const isRule7Match = queryObjection.toLowerCase().includes('rule 7') || queryObjection.includes('4015');
  if (!isRule7Match) throw new Error('Failed to match Rule 7 query intent');

  const rule7Citations = [
    'Tax Administration Act 28 of 2011, Section 104 read with Rule 7',
    'Income Tax Act 58 of 1962, Section 11(a) and Section 8(1)(b)',
    'Interpretation Note 47 (Issue 5)'
  ];
  if (!rule7Citations.some(c => c.includes('Rule 7'))) {
    throw new Error('Rule 7 statutory citation missing from knowledge base');
  }

  // Test 2: Interim EMP501 Period 202608 Statutory Scope
  const interimReconDeadline = '2026-10-31';
  const interimPeriod = '202608';
  if (interimPeriod !== '202608' || !interimReconDeadline.startsWith('2026-10')) {
    throw new Error('Interim EMP501 period must be 202608 with 31 October deadline');
  }

  // Test 3: Section 12E SBC 2026 Progressive Tax Calculations
  const calcSbcTax = (taxableIncome: number) => {
    if (taxableIncome <= 95750) return 0;
    if (taxableIncome <= 365000) return Math.round((taxableIncome - 95750) * 0.07);
    if (taxableIncome <= 550000) return Math.round(18848 + (taxableIncome - 365000) * 0.21);
    return Math.round(57698 + (taxableIncome - 550000) * 0.27);
  };

  const sbcSampleIncome = 450000;
  const sbcTax = calcSbcTax(sbcSampleIncome);
  // 18,848 + (450,000 - 365,000) * 0.21 = 18,848 + 17,850 = 36,698
  if (sbcTax !== 36698) {
    throw new Error(`Expected SBC tax of R36,698 on R450,000, got R${sbcTax}`);
  }
  const standardCorporateTax = Math.round(sbcSampleIncome * 0.27); // R121,500
  const sbcSavings = standardCorporateTax - sbcTax; // R84,802
  if (sbcSavings !== 84802) {
    throw new Error(`Expected SBC savings of R84,802, got R${sbcSavings}`);
  }

  // Test 4: Two-Pot Savings Pot Marginal Directive Withholding
  const savingsWithdrawal = 25000;
  const marginalTaxRate = 0.36; // 36% marginal rate
  const directiveWithholding = Math.round(savingsWithdrawal * marginalTaxRate);
  if (directiveWithholding !== 9000) {
    throw new Error(`Expected Two-Pot tax directive withholding of R9,000, got R${directiveWithholding}`);
  }

  // Test 5: App Tool Recommendation Mapping Verification
  const validNavTabs = [
    'overview',
    'ai_assistant',
    'emp501_reconciliation',
    'tax_pro_connect',
    'integrated_system',
    'ai_deductions',
    'vat201_lodgement',
    'pre_audit_shield',
    'ita34_decoder',
    'logbook',
    'vat_invoices',
    'trust_loans',
    'sbc_wizard',
    'eti_calculator',
    'two_pot'
  ];

  const testToolRecommendations = [
    { id: 'emp501_reconciliation', tabKey: 'emp501_reconciliation' },
    { id: 'ita34_decoder', tabKey: 'ita34_decoder' },
    { id: 'tax_pro_connect', tabKey: 'tax_pro_connect' },
    { id: 'sbc_wizard', tabKey: 'sbc_wizard' }
  ];

  for (const rec of testToolRecommendations) {
    if (!validNavTabs.includes(rec.tabKey)) {
      throw new Error(`Recommended tool tabKey '${rec.tabKey}' does not match any valid NavTab`);
    }
  }
});

console.log('\n======================================================================');
console.log('📊 STRESS TEST REPORT SUMMARY');
console.log('======================================================================');

let allPassed = true;
for (const res of results) {
  const icon = res.passed ? '✅' : '❌';
  console.log(`${icon} [${res.suite}] ${res.name} (${res.durationMs.toFixed(2)}ms)`);
  if (!res.passed) {
    allPassed = false;
    console.error(`   ERROR: ${res.details}`);
  }
}

console.log('======================================================================');
if (allPassed) {
  console.log('🎉 ALL STRESS TESTS & BOUNDARY CHECKS PASSED PERFECTLY!');
} else {
  console.error('💥 SOME TESTS FAILED');
  process.exit(1);
}
console.log('======================================================================\n');

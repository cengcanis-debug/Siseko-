import { 
  UserTaxProfile, 
  TaxTransaction, 
  InvoiceRecord, 
  BankAccount, 
  PendingBankTransaction, 
  SarsLegislationUpdate, 
  ScenarioSimulation 
} from '../types';

export const initialTaxProfile: UserTaxProfile = {
  name: 'Sipho Dlamini (Dlamini Consulting)',
  entityType: 'Self-Employed / Sole Prop',
  vatRegistered: true,
  vatNumber: '4180123456',
  taxBracketRate: 0.31, // 31% average/marginal South African bracket
  provisionalCycle: 'Cycle 1 (Aug 31)',
  medicalAidMembers: 2, // Principal + 1 dependent = R364 + R364 monthly credit
  hasRetirementAnnuity: true,
  // Identity & FICA fields
  idNumber: '8305125189087',
  sarsTaxNumber: '9817263544',
  ficaStatus: 'Verified',
  ficaProgress: 100,
  directorsList: ['Sipho Dlamini'],
  isOtpVerified: true,
  lastIdentitySync: '2026-06-20',
};

export const initialTransactions: TaxTransaction[] = [
  {
    id: 'tx-101',
    date: '2026-06-20',
    description: 'Advisory Retainer - Anglo American SA',
    amount: 45000.00,
    type: 'income',
    category: 'Consulting Fees',
    vatIncluded: true,
    vatAmount: 5869.57, // 45000 * 15/115
    sarsSection: 'Gross Income (Section 1 definition)',
    isDeductible: false,
    deductiblePercentage: 0,
    taxPositionImpactZAR: 12130.43, // (45000 - 5869.57) * 0.31 marginal tax due
    explanation: 'Revenue generated from professional consulting services. R5,869.57 output VAT set aside for VAT201 return. Net R39,130.43 added to provisional taxable income.',
    bankAccountSource: 'FNB Business Current',
    status: 'classified',
  },
  {
    id: 'tx-102',
    date: '2026-06-18',
    description: 'Dell Latitude Laptop & Dual Monitors',
    amount: 28750.00,
    type: 'asset',
    category: 'Computer & Office Equipment',
    vatIncluded: true,
    vatAmount: 3750.00, // 28750 * 15/115
    sarsSection: 'Section 11(e) / Section 12B Small Business Asset Allowance',
    isDeductible: true,
    deductiblePercentage: 100,
    taxPositionImpactZAR: -7750.00, // 25000 * 0.31 tax saved
    explanation: 'Qualifies for 100% first-year write-off for small business computing tools under SARS Section 12C/11(e). Input VAT of R3,750 is fully claimable.',
    bankAccountSource: 'FNB Business Current',
    status: 'classified',
  },
  {
    id: 'tx-103',
    date: '2026-06-15',
    description: 'Allan Gray Retirement Annuity Monthly Contribution',
    amount: 6500.00,
    type: 'investment',
    category: 'Retirement Fund Contribution',
    vatIncluded: false,
    vatAmount: 0,
    sarsSection: 'Section 11F Retirement Funds Deduction',
    isDeductible: true,
    deductiblePercentage: 100,
    taxPositionImpactZAR: -2015.00, // 6500 * 0.31 direct tax reduction
    explanation: 'Deductible under SARS Section 11F (up to 27.5% of remuneration/taxable income). Instantly lowers your normal tax calculation by R2,015.',
    bankAccountSource: 'Nedbank Personal Cheque',
    status: 'classified',
  },
  {
    id: 'tx-104',
    date: '2026-06-12',
    description: 'Vodacom Business Fibre & LTE Mobile Plan',
    amount: 1899.00,
    type: 'expense',
    category: 'Telecommunications',
    vatIncluded: true,
    vatAmount: 247.70,
    sarsSection: 'Section 11(a) General Business Expense',
    isDeductible: true,
    deductiblePercentage: 80, // 80% business use apportionment
    taxPositionImpactZAR: -409.51,
    explanation: 'Apportioned 80% for business consulting use and 20% personal use as per SARS Interpretation Note 47. Deductible amount R1,321.',
    bankAccountSource: 'FNB Business Current',
    status: 'classified',
  },
  {
    id: 'tx-105',
    date: '2026-06-10',
    description: 'Uber Business Trips - Sandton Client Meetings',
    amount: 1240.00,
    type: 'expense',
    category: 'Travel & Transport',
    vatIncluded: false, // Uber SA transport generally exempt / no input VAT
    vatAmount: 0,
    sarsSection: 'Section 11(a) Travel Expense',
    isDeductible: true,
    deductiblePercentage: 100,
    taxPositionImpactZAR: -384.40,
    explanation: 'Local business travel exclusively for client engagements. 100% deductible against business gross income. Retain e-receipt trip logs.',
    bankAccountSource: 'FNB Business Current',
    status: 'classified',
  },
  {
    id: 'tx-106',
    date: '2026-06-08',
    description: 'Woolworths Food & Woolworths Café - Sandton City',
    amount: 1450.00,
    type: 'expense',
    category: 'Meals & Entertainment',
    vatIncluded: true,
    vatAmount: 189.13,
    sarsSection: 'Non-Deductible Entertainment (Section 23)',
    isDeductible: false,
    deductiblePercentage: 0,
    taxPositionImpactZAR: 0,
    explanation: 'SARS Section 23(c) strictly prevents claiming deductions or VAT input tax on personal meals or general client entertainment unless specifically billed as a seminar/conference item.',
    bankAccountSource: 'Nedbank Personal Cheque',
    status: 'flagged_mixed_use',
  }
];

export const initialInvoices: InvoiceRecord[] = [
  {
    id: 'inv-301',
    supplierName: 'Makro Commercial (Massmart)',
    vatNumber: '4910123890',
    invoiceNumber: 'MAK-JHB-8921',
    date: '2026-06-14',
    category: 'Office Stationery & Desks',
    totalAmount: 4370.00,
    vatAmount: 570.00,
    netAmount: 3800.00,
    sarsSection: 'Section 11(a) General Deduction',
    isVatClaimable: true,
    isDeductible: true,
    explanation: 'Valid South African tax invoice captured with verified 10-digit VAT number. R570 input VAT auto-synced to VAT201 return schedule.',
    confidence: 0.98,
    syncedToSarsReport: true,
  },
  {
    id: 'inv-302',
    supplierName: 'Hertz Rent-A-Car O.R. Tambo Airport',
    vatNumber: '4220198765',
    invoiceNumber: 'HRZ-99120',
    date: '2026-06-05',
    category: 'Vehicle Rental - Client Site Visit',
    totalAmount: 2150.00,
    vatAmount: 280.43,
    netAmount: 1869.57,
    sarsSection: 'Section 11(a) Travel Deduction',
    isVatClaimable: false, // Passenger vehicle rentals restricted under VAT Act S17(2)
    isDeductible: true,
    explanation: 'Expense is 100% deductible for Income Tax (ITR12), BUT Input VAT on passenger motor car rentals is strictly denied under VAT Act Section 17(2)(c).',
    confidence: 0.95,
    syncedToSarsReport: true,
  }
];

export const initialBankAccounts: BankAccount[] = [
  {
    id: 'bank-fnb',
    bankName: 'First National Bank (FNB)',
    accountName: 'FNB Platinum Business Account',
    accountNumberMasked: '•••• •••• •••• 6192',
    balanceZAR: 74250.80,
    accountType: 'Business Current',
    lastSynced: 'Just now (Real-time API Feed)',
    status: 'Connected',
  },
  {
    id: 'bank-nedbank',
    bankName: 'Nedbank',
    accountName: 'Nedbank Savvy Savvy Account',
    accountNumberMasked: '•••• •••• •••• 1044',
    balanceZAR: 18400.00,
    accountType: 'Personal Cheque',
    lastSynced: '12 mins ago',
    status: 'Connected',
  }
];

export const pendingMixedUseFeed: PendingBankTransaction[] = [
  {
    id: 'feed-801',
    date: '2026-06-21',
    rawMerchant: 'iStore Sandton Drive - Apple Care & iPad Pro',
    amount: 19800.00,
    type: 'debit',
    suggestedAction: 'mixed_use_split',
    flagReason: 'High value hardware purchase. Requires classification: Is this iPad 100% business consulting or split with family use?',
  },
  {
    id: 'feed-802',
    date: '2026-06-21',
    rawMerchant: 'Discovery Medical Aid - Monthly Premium',
    amount: 5420.00,
    type: 'debit',
    suggestedAction: 'expense',
    flagReason: 'Medical Scheme contribution. Qualifies for SARS Section 6A Medical Tax Credits (R364 per beneficiary per month).',
  },
  {
    id: 'feed-803',
    date: '2026-06-22',
    rawMerchant: 'EFT Deposit - M Khumalo Project Milestone',
    amount: 15000.00,
    type: 'credit',
    suggestedAction: 'income',
    flagReason: 'Uncategorized credit deposit of R15,000. Confirm if subject to 15% VAT or if an exempt loan refund.',
  }
];

export const sarsUpdatesFeed: SarsLegislationUpdate[] = [
  {
    id: 'amend-501',
    date: '2026-06-15',
    title: 'Two-Pot Retirement System - Section 12T Clarification',
    actReference: 'Revenue Laws Amendment Act 2024 (Two-Pot System)',
    category: 'Retirement',
    summary: 'Withdrawals from the Savings Component prior to retirement are taxed at the taxpayer\'s applicable marginal PAYE rate without the R27,500 exemption.',
    impactOnUser: 'Your advisory position: Keeping emergency savings inside Allan Gray RA is tax-shielded growing at 0% tax. Any savings pot withdrawal this year will add directly to your 31% marginal bracket.',
    isUrgentPush: true,
  },
  {
    id: 'amend-502',
    date: '2026-05-30',
    title: 'VAT Threshold & E-Billing Compliance Notice',
    actReference: 'VAT Act No. 89 of 1991 Schedule 1',
    category: 'VAT',
    summary: 'Compulsory VAT registration threshold remains R1,000,000 turnover in any consecutive 12-month period. Digital invoices must contain supplier VAT number and exact 15% breakdown.',
    impactOnUser: 'Your current annualized turnover projection is R540,000. You remain safely compliant as a voluntary VAT vendor enjoying full input VAT refunds on equipment.',
    isUrgentPush: false,
  },
  {
    id: 'amend-503',
    date: '2026-04-10',
    title: 'Home Office Deduction Rigorous Audit Rules',
    actReference: 'SARS Interpretation Note 28 (Issue 3)',
    category: 'Deductions',
    summary: 'To claim interest, municipal rates, and electricity for a home office, the room must be exclusively fitted and used for professional work (>50% of duties performed there).',
    impactOnUser: 'Ensure your home office desk square meterage calculation (determined at R1,899 Vodacom expense proportion) is supported with floor plans if SARS requests audit verification.',
    isUrgentPush: false,
  }
];

export const sampleSimulations: ScenarioSimulation[] = [
  {
    id: 'sim-901',
    title: 'Invest R20,000 Top-Up into Section 11F Retirement Fund',
    description: 'Make a lump sum investment into your retirement annuity before the February provisional tax close.',
    investmentAmount: 20000.00,
    type: 'retirement',
    projectedTaxableIncomeDrop: 20000.00,
    projectedLiabilitySaveZAR: 6200.00, // 20000 * 0.31 marginal tax save
    sarsLawClause: 'Section 11F Retirement Funds Contribution (27.5% Cap)',
    cashFlowRecommendation: 'Executing this immediately reduces your upcoming provisional tax EFT payment to SARS by R6,200. Effectively SARS funds 31% of your retirement investment!',
  },
  {
    id: 'sim-902',
    title: 'Install R65,000 Solar Photovoltaic Inverter & Battery System',
    description: 'Upgrade your consulting practice premises with renewable energy backup generation.',
    investmentAmount: 65000.00,
    type: 'solar_asset',
    projectedTaxableIncomeDrop: 65000.00,
    projectedLiabilitySaveZAR: 20150.00, // 65000 * 0.31
    sarsLawClause: 'Section 12B Renewable Energy Accelerated Allowance',
    cashFlowRecommendation: 'Qualifies for 100% first-year deduction plus R8,478 Input VAT claimable. Your net cash out of pocket after SARS tax savings is only R36,372.',
  },
  {
    id: 'sim-903',
    title: 'Purchase Commercial Delivery / Utility Bakkie (R280,000)',
    description: 'Acquire dedicated business transport asset for client deliveries and equipment transport.',
    investmentAmount: 280000.00,
    type: 'vehicle_asset',
    projectedTaxableIncomeDrop: 93333.33, // 33.3% 3-year commercial write-off
    projectedLiabilitySaveZAR: 28933.33,
    sarsLawClause: 'Section 11(e) Commercial Asset Depreciation (33% p.a.)',
    cashFlowRecommendation: 'Unlike passenger cars, commercial delivery vehicles allow input VAT claiming (R36,521 VAT refund) and 33.3% annual tax depreciation.',
  }
];

export const technicalBlueprintNodes = [
  {
    module: 'Transaction Impact Advisor (AI Inference Layer)',
    sarsRuleMatch: 'Income Tax Act 58 of 1962 (Section 11(a) & S23)',
    apiConnection: 'Gemini 3.5 Flash JSON Schema Inference (/api/gemini/advisor)',
    dataSync: 'Real-time calculation engine updating Provisional Taxable Income after every ZAR sale or debit.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    module: 'Smart OCR Invoice & Cash Slip Scanner',
    sarsRuleMatch: 'VAT Act 89 of 1991 (Section 20 Tax Invoices)',
    apiConnection: 'Multimodal Vision Extraction (/api/gemini/scan-invoice)',
    dataSync: 'Auto-extracts 10-digit SARS VAT numbers and categorizes input VAT into claimable schedules for VAT201 submissions.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    module: 'South African Bank Account Feed Aggregator',
    sarsRuleMatch: 'SARS Interpretation Note 47 (Apportionment)',
    apiConnection: 'Encrypted Open Banking / Mock EFT Sync Engine',
    dataSync: 'Auto-tags recurring business retainers and flags mixed-use private/business transactions for SARS audit compliance justification.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    module: 'Refund vs Provisional Liability Calculator',
    sarsRuleMatch: 'Fourth Schedule Paragraph 19 (Provisional Tax)',
    apiConnection: 'Local South African Tax Bracket Engine (2025/2026)',
    dataSync: 'Calculates Normal TaxPAYE less Section 6A Medical Credits & Provisional IT3(a) payments. Advises on 20% penalty prevention.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    module: 'Strategic "What-If" Scenario Planner',
    sarsRuleMatch: 'Section 11F (RA Cap) & Section 12B (Solar)',
    apiConnection: 'Simulated Monte Carlo Tax Marginal Engine',
    dataSync: 'Simulates tax implications before asset capital deployment to optimize cash retention prior to August / February filing deadlines.',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  {
    module: 'SARS Legislation Auto-Updater Feed',
    sarsRuleMatch: 'National Treasury Revenue Laws Amendments',
    apiConnection: 'Automated RegTech Webhook Feed',
    dataSync: 'Pushes urgent tax compliance updates (e.g. Two-Pot Retirement S12T rules or VAT threshold regulations) directly to mobile cockpit.',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
  }
];

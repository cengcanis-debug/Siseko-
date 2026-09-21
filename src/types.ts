export interface UserTaxProfile {
  name: string;
  entityType: 'Individual / Salaried' | 'Self-Employed / Sole Prop' | 'Small Business SME (Pty Ltd)';
  vatRegistered: boolean;
  vatNumber?: string;
  taxBracketRate: number; // e.g. 0.28
  provisionalCycle: 'Cycle 1 (Aug 31)' | 'Cycle 2 (Feb 28)';
  medicalAidMembers: number;
  hasRetirementAnnuity: boolean;
  // Identity & FICA Compliance fields
  idNumber?: string;
  registrationNumber?: string; // CIPC company registration code
  sarsTaxNumber?: string;
  ficaStatus?: 'Verified' | 'Pending' | 'Action Required';
  ficaProgress?: number;
  directorsList?: string[];
  isOtpVerified?: boolean;
  lastIdentitySync?: string;
  employmentField?: string; // e.g. 'Software & IT', 'Healthcare & Medicine', 'Education', 'Creative & Media', etc.
  // Next Four Identified Enhancement Tool States
  is13sexFiled?: boolean;
  unitsCount?: number;
  unitCost?: number;
  isLowCost?: boolean;
  is11DApplied?: boolean;
  rdSalaries?: number;
  rdMaterials?: number;
  rdApproved?: boolean;
  is24CClaimed?: boolean;
  contractRevenue?: number;
  futureCosts?: number;
  isSbcApplied?: boolean;
  sbcGrossIncome?: number;
  isSbcNaturalShareholding?: boolean;
  isSbcActiveIncome?: boolean;
  // Phase 12 Advanced Debt Concessions, Interest Amortization, R&D Equipment & Foreign Dividends
  isParagraph12AApplied?: boolean;
  debtReductionAmount?: number;
  debtReductionAssetCost?: number;
  isSection24JApplied?: boolean;
  interestPrincipal?: number;
  interestRate?: number;
  interestTenor?: number;
  isSection11gCApplied?: boolean;
  researchEquipmentCost?: number;
  isSection10BApplied?: boolean;
  foreignDividendsReceived?: number;
  isForeignParticipationExemption?: boolean;
  isDstApproved?: boolean;
  dstReferenceNumber?: string;
  hasDebtAgreementInVault?: boolean;
}

export interface TaxTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'investment' | 'asset';
  category: string;
  vatIncluded: boolean;
  vatAmount: number;
  sarsSection: string;
  isDeductible: boolean;
  deductiblePercentage: number;
  taxPositionImpactZAR: number; // Positive increases tax due, negative lowers tax due
  explanation: string;
  bankAccountSource?: string;
  status: 'classified' | 'flagged_mixed_use' | 'pending';
}

export interface InvoiceRecord {
  id: string;
  supplierName: string;
  vatNumber: string;
  invoiceNumber: string;
  date: string;
  category: string;
  totalAmount: number;
  vatAmount: number;
  netAmount: number;
  sarsSection: string;
  isVatClaimable: boolean;
  isDeductible: boolean;
  explanation: string;
  imageUrl?: string;
  confidence: number;
  syncedToSarsReport: boolean;
  // South African VAT 201 & OCR specific fields
  merchantRegNo?: string;
  taxRate?: string; // "15% VAT" | "Zero-Rated" | "Exempt"
  accountingClassification?: 'Input Tax' | 'Output Tax';
  isFullTaxInvoiceRequired?: boolean; // True if totalAmount > R25,000
  buyerCompanyName?: string;
  buyerAddress?: string;
  buyerVatNumber?: string;
  hasFullTaxInvoiceFields?: boolean;
  // Petrol / Fuel station geospatial pinning fields
  isPetrolInvoice?: boolean;
  stationName?: string;
  stationLatitude?: number;
  stationLongitude?: number;
  litresPurchased?: number;
}

export interface BankAccount {
  id: string;
  bankName: 'First National Bank (FNB)' | 'Standard Bank' | 'Capitec Bank' | 'Nedbank' | 'Absa';
  accountName: string;
  accountNumberMasked: string;
  balanceZAR: number;
  accountType: 'Business Current' | 'Personal Cheque' | 'Savings Feed';
  lastSynced: string;
  status: 'Connected' | 'Syncing' | 'Reauth Required';
}

export interface PendingBankTransaction {
  id: string;
  date: string;
  rawMerchant: string;
  amount: number;
  type: 'credit' | 'debit';
  suggestedAction: 'income' | 'expense' | 'mixed_use_split';
  flagReason?: string;
}

export interface SarsLegislationUpdate {
  id: string;
  date: string;
  title: string;
  actReference: string;
  category: 'Deductions' | 'VAT' | 'Provisional Tax' | 'Retirement';
  summary: string;
  impactOnUser: string;
  isUrgentPush: boolean;
}

export interface ScenarioSimulation {
  id: string;
  title: string;
  description: string;
  investmentAmount: number;
  type: 'retirement' | 'solar_asset' | 'vehicle_asset' | 'business_loan';
  projectedTaxableIncomeDrop: number;
  projectedLiabilitySaveZAR: number;
  sarsLawClause: string;
  cashFlowRecommendation: string;
}

export interface TaxCycleSnapshot {
  grossIncome: number;
  operatingExpenses: number;
  retirementContributions: number;
  capitalAllowances: number;
  netTaxableIncome: number;
  estimatedNormalTax: number;
  medicalTaxCredits: number;
  provisionalTaxAlreadyPaid: number;
  netTaxLiabilityOrRefund: number; // >0 means owe SARS, <0 means refund expected
  outputVatCollected: number;
  inputVatClaimable: number;
  netVatDueOrRefund: number;
  projectionStatus: 'Heading for Safe Refund' | 'On Track - Minor Liability' | 'Urgent Cash Flow Warning';
}

export type RoleType = 'Owner' | 'Accountant' | 'Bookkeeper' | 'Auditor' | 'Custom';

export interface RolePermissions {
  canEditTransactions: boolean;
  canScanInvoices: boolean;
  canViewTaxProjections: boolean;
  canManageTeam: boolean;
  canManageDisputes: boolean;
  canManageSuccession: boolean;
  canDownloadCSV: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  permissions: RolePermissions;
  status: 'Active' | 'Pending Invite';
  joinedAt?: string;
}

export interface AppSession {
  token: string; // 64-character cryptographically secure hex string (secrets.token_hex(32))
  role: RoleType;
  userId: string;
  userName: string;
  userEmail: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  scopes: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: RoleType;
  action: string;
  details: string;
  ipAddress?: string;
  sessionTokenMasked?: string;
}

export interface EntityProfile {
  id: string;
  profile: UserTaxProfile;
  transactions: TaxTransaction[];
  invoices: InvoiceRecord[];
  bankAccounts: BankAccount[];
  pendingBankTransactions: PendingBankTransaction[];
  recurringExpenses?: RecurringExpense[];
  teamMembers?: TeamMember[];
  auditLogs?: AuditLogEntry[];
  simulatedCurrentUserRole?: RoleType;
  provisionalPayments?: Array<{
    period: string;
    amount: number;
    date: string;
  }>;
  vatSubmissions?: Array<{
    period: string;
    amount: number;
    date: string;
  }>;
  savingsGoals?: Array<{
    name: string;
    targetAmount: number;
    achieved: boolean;
  }>;
  extraBadgesUnlocked?: string[];
  pointsMultiplier?: number;
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  frequency: 'Monthly' | 'Weekly' | 'Quarterly' | 'Annually';
  category: string;
  nextDueDate: string;
  vatIncluded: boolean;
  vatAmount: number;
  isActive: boolean;
}

export interface TrustLoanAccount {
  id: string;
  lenderName: string;
  trustName: string;
  registrationNumber: string;
  principalAmount: number;
  interestRateCharged: number; // e.g. 0 for 0% or 3.5 for 3.5%
  outstandingBalance: number;
  officialRepoRate: number; // e.g. 8.25
  officialRateOfInterest: number; // repoRate + 1.00 = 9.25
  annualDonationExemptionApplied: boolean; // whether to apply the R100k exemption
  dateIssued: string;
  repaymentsAmountThisYear: number;
  exclusionReason: 'None' | 'Primary Residence' | 'Special Trust Disability' | 'Public Benefit Organisation' | 'Vested Beneficiary Right';
}


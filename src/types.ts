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
  // Section 12BA 125% Renewable Energy Super-Allowance
  is12BAApplied?: boolean;
  solarSystemCost?: number;
  solarInstallationDate?: string;
  hasSolarCocInVault?: boolean;
  hasEskomGridTieApproval?: boolean;
  // Section 6quat Foreign Tax Rebate (FTC)
  is6quatApplied?: boolean;
  foreignTaxableIncome?: number;
  foreignTaxWithheldZAR?: number;
  foreignTaxJurisdiction?: string;
  hasForeignTaxVoucherInVault?: boolean;
  // Section 12H Additional Learnership Allowance (SETA Skills Incentive)
  is12HApplied?: boolean;
  learnersCount?: number;
  disabledLearnersCount?: number;
  learnershipNqfLevel?: 'NQF 1-6' | 'NQF 7-10';
  isLearnershipCompletedInYear?: boolean;
  hasSetaRegistrationInVault?: boolean;
  setaRegistrationNumber?: string;
}

export interface It3tDistributionRecord {
  id: string;
  beneficiaryName: string;
  beneficiaryIdOrRef: string;
  beneficiaryType: 'INDIVIDUAL_RESIDENT' | 'INDIVIDUAL_NON_RESIDENT' | 'COMPANY' | 'TRUST';
  incomeCategory: 'LOCAL_INTEREST' | 'LOCAL_DIVIDENDS' | 'FOREIGN_INCOME' | 'CAPITAL_GAIN' | 'TRADING_INCOME';
  vestedAmountZAR: number;
  taxableAmountZAR: number;
  withholdingTaxZAR: number;
  conduitSectionApplied: 'SECTION_25B_CONDUIT' | 'SECTION_7_DONOR_ATTRIBUTION';
  deemedDonorName?: string;
  isAuditVerified: boolean;
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

export interface CategorizationRule {
  id: string;
  name: string;
  pattern: string; // e.g. "UBER", "DISCOVERY", "AWS"
  matchType: 'contains' | 'exact' | 'starts_with' | 'regex';
  category: string;
  sarsSection?: string;
  type?: 'income' | 'expense' | 'asset' | 'investment';
  deductiblePercentage?: number;
  priority: number; // Higher number = higher precedence
  enabled: boolean;
  notes?: string;
  createdAt: string;
  lastMatchedAt?: string;
  matchCount?: number;
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
  grossIncome?: number;
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

export type SarsRiskSeverity = 'COMPLIANT' | 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_EXPOSURE' | 'CRITICAL_DISALLOWANCE';

export interface NegativeImplication {
  id: string;
  category: 'DISALLOWANCE' | 'PENALTY_TAA_222' | 'INTEREST_89QUAT' | 'VAT_CLAWBACK' | 'EVIDENCE_DEFICIT' | 'FICA_CTR';
  statutoryReference: string; // e.g. "Income Tax Act §23(g)", "TAA §222", "VAT Act §17(2)"
  title: string;
  description: string;
  severity: SarsRiskSeverity;
  estimatedFinancialExposureZAR: number;
  mitigationAdvice: string;
}

export interface RequiredVaultEvidence {
  documentType: string;
  description: string;
  isAttachedInVault: boolean;
  vaultRefId?: string;
  mandatoryForDeduction: boolean;
}

export interface ThirdPartyDataFeedItem {
  id: string;
  sourceType: 'IRP5_SALARY' | 'IT3B_INTEREST' | 'IT3C_CAPITAL_GAIN' | 'MEDICAL_SCHEME_6A' | 'RA_CONTRIBUTION_11F' | 'IT3D_SECTION_18A';
  providerName: string;
  referenceNumber: string;
  grossAmountZAR: number;
  taxDeductedZAR: number;
  sarsCaptured: boolean;
  status: 'VERIFIED' | 'DISCREPANCY_FLAGGED' | 'CONFIRMED';
  sourceCode: string;
}

export interface UnclaimedAutoAssessmentDeduction {
  sourceCode: string; // e.g. "4015", "4028", "4014"
  title: string;
  description: string;
  amountZAR: number;
  estimatedTaxBenefitZAR: number;
  vaultCorroborationAttached: boolean;
  vaultDocName?: string;
  statutorySection: string;
}

export interface AutoAssessmentDossier {
  assessmentNoticeNumber: string;
  taxYear: string;
  issuedDate: string;
  statutoryDeadlineDate: string;
  businessDaysRemaining: number;
  taxpayerName: string;
  taxReferenceNumber: string;
  status: 'PENDING_TAXPAYER_REVIEW' | 'ACCEPTED_STANDS_AS_ORIGINAL' | 'EDITED_AND_RESUBMITTED' | 'DISPUTED_UNDER_RULE_7';
  
  // Third Party Feed Items that SARS pulled
  thirdPartyFeeds: ThirdPartyDataFeedItem[];
  
  // SARS Auto Assessment figures (blind third-party data only)
  sarsGrossIncomeZAR: number;
  sarsAllowableDeductionsZAR: number;
  sarsTaxableIncomeZAR: number;
  sarsNormalTaxZAR: number;
  sarsTaxCreditsZAR: number;
  sarsPayeAndPrepaidZAR: number;
  sarsAssessedOutcomeZAR: number; // negative = refund from SARS, positive = owe SARS
  
  // True Client Ledger & Vault Figures (including uncaptured travel logbook, home office, etc.)
  trueGrossIncomeZAR: number;
  trueAllowableDeductionsZAR: number;
  trueTaxableIncomeZAR: number;
  trueNormalTaxZAR: number;
  trueTaxCreditsZAR: number;
  trueAssessedOutcomeZAR: number;
  
  // The Variance / Taxpayer Value at Stake
  unclaimedDeductions: UnclaimedAutoAssessmentDeduction[];
  refundDiscrepancyZAR: number; // positive = taxpayer is entitled to this much MORE refund
  recommendation: 'REJECT_AND_EDIT' | 'ACCEPT_AS_ACCURATE' | 'LODGE_RULE_7_DISPUTE';
  recommendationSummary: string;
}

export interface TransactionPreAuditResult {
  transactionId: string;
  overallRisk: SarsRiskSeverity;
  riskScore: number; // 0 (perfectly compliant) to 100 (critical non-compliance)
  auditedAt: string;
  sourceCodeAffected: string; // e.g. "4015 (Business Travel)", "4016 (Entertainment)", "4030 (Consulting)"
  claimedDeductionAmountZAR: number;
  projectedDisallowedAmountZAR: number;
  estimatedAdditionalTaxPayableZAR: number;
  understatementPenaltyPercentage: number; // 0%, 10%, 25%, 50%, 100%
  understatementPenaltyAmountZAR: number;
  estimated89quatInterestZAR: number;
  totalPotentialSarsExposureZAR: number;
  negativeImplications: NegativeImplication[];
  requiredVaultEvidence: RequiredVaultEvidence[];
  preventativeRecommendations: string[];
  ruleCitation: string;
  isDefensibleUnderRule7: boolean;
}

export type VdpDisclosureStatus = 'DRAFT' | 'ELIGIBILITY_VERIFIED' | 'SUBMITTED_TO_SARS' | 'VDP_AGREEMENT_SIGNED' | 'REMEDIED';

export type VdpOversightCategory = 
  | 'UNCLAIMABLE_DEDUCTION' 
  | 'OMITTED_INCOME' 
  | 'VAT_OUTPUT_UNDERPAYMENT' 
  | 'DUAL_USE_UNAPPORTIONED' 
  | 'PAYE_WITHHOLDING_ERROR' 
  | 'FOREIGN_INCOME_OMISSION';

export interface VdpEligibilityCriteria {
  isVoluntaryNoPriorAuditNotice: boolean; // TAA §227(a)
  hasMaterialDefault: boolean;             // TAA §227(b)
  isFullAndComplete: boolean;             // TAA §227(c)
  involvesShortfallPayment: boolean;      // TAA §227(d)
  doesNotYieldRefund: boolean;            // TAA §227(e)
}

export interface VdpApplicationDossier {
  id: string;
  vdpRefNumber: string;
  taxpayerName: string;
  taxReferenceNumber: string;
  taxPeriod: string;
  oversightTitle: string;
  oversightDescription: string;
  category: VdpOversightCategory;
  statutoryReference: string;
  affectedTransactionIds: string[];
  understatedTaxShortfallZAR: number;
  standardAuditPenaltyPercentage: number;
  standardAuditPenaltyAmountZAR: number;
  mitigatedVdpPenaltyPercentage: number;
  mitigatedVdpPenaltyAmountZAR: number;
  penaltySavedZAR: number;
  estimated89quatInterestZAR: number;
  isCriminalImmunityGranted: boolean;
  eligibilityCriteria: VdpEligibilityCriteria;
  status: VdpDisclosureStatus;
  submittedAt?: string;
  signedOffByRole?: RoleType;
  remediationPlan: string;
}

export interface Vat201Declaration {
  id: string;
  submissionRef: string;
  vendorName: string;
  vatRegistrationNumber: string;
  taxPeriod: string;
  standardRatedSupplies: number; // Box 1
  outputStandardVat: number; // Box 4 (15%)
  zeroRatedSupplies: number; // Box 2
  exemptSupplies: number; // Box 3
  totalSupplies: number;
  totalOutputTax: number;
  inputCapitalGoods: number; // Box 14
  inputOperationalGoods: number; // Box 15
  apportionmentRatio: number; // Section 17(1) Turnover/Apportionment %
  badDebtRelief: number; // Section 22(1)
  customsVatPaid: number;
  totalInputTax: number; // Box 19
  netVatPayableOrRefund: number; // Positive = Payable to SARS, Negative = Refundable
  status: 'DRAFT' | 'CALCULATED' | 'LODGED_PENDING' | 'LODGED_CONFIRMED';
  lodgedAt?: string;
  lodgedByRole?: RoleType;
  sarsReceiptNumber?: string;
  paymentDueDate?: string;
  notes?: string;
}

export interface AiDeductionSuggestion {
  id: string;
  title: string;
  statutorySection: string;
  category: 'DEDUCTION' | 'TAX_CREDIT' | 'ACCELERATED_ALLOWANCE' | 'REBATE';
  potentialSavingZAR: number;
  qualifyingAmountZAR: number;
  confidenceScore: number;
  sarsJustification: string;
  legalBasis: string;
  actionableSteps: string[];
  requiredDocumentation: string[];
  linkedTransactionIds: string[];
  status: 'SUGGESTED' | 'APPLIED' | 'DISMISSED';
}

export interface AiDeductionAnalysisResult {
  suggestions: AiDeductionSuggestion[];
  totalIdentifiedSavingsZAR: number;
  auditRiskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  timestamp: string;
  modelUsed: string;
}

// ============================================================================
// TAX PROFESSIONAL CONNECT & SECURE CLIENT-PRACTITIONER COLLABORATION
// Compliant with Section 240 of the Tax Administration Act 28 of 2011 (TAA)
// ============================================================================

export type ProfessionalBody = 'SAIT' | 'SAICA' | 'CIBA' | 'ACCA' | 'IAC';

export interface TaxProfessionalPermissions {
  canViewProfileAndFica: boolean;
  canViewTransactions: boolean;
  canViewVatDeclarations: boolean;
  canViewAuditVault: boolean; // Logbooks, vehicle purchase agreements, solar CoC, etc.
  canViewIta34AndObjections: boolean; // ITA34 assessments & Rule 7 Notice of Objection
  canViewTaxShieldSimulations: boolean; // Section 12BA, 24J, 11(gC), SBC, ETI
  canExportDossiers: boolean;
  canSubmitFilingsOnBehalf: boolean; // SARS eFiling registered practitioner delegate
  dataMaskingLevel: 'FULL_ACCESS' | 'MASK_PERSONAL_IDENTIFIERS' | 'AGGREGATED_ONLY';
}

export interface TaxPractitionerInvite {
  id: string;
  practitionerName: string;
  practitionerEmail: string;
  firmName: string;
  sarsPrNumber: string; // e.g., 'PR-0089421'
  professionalBody: ProfessionalBody;
  specialization: string;
  inviteStatus: 'PENDING_INVITE' | 'ACTIVE_CONNECTED' | 'ACCESS_EXPIRED' | 'REVOKED';
  invitedAt: string;
  acceptedAt?: string;
  expiresAt: string;
  inviteToken: string;
  pinCode: string;
  sarsMandateSigned: boolean;
  mandateReference?: string;
  permissions: TaxProfessionalPermissions;
  lastAccessedAt?: string;
}

export interface AdvisoryMessageAttachment {
  id: string;
  name: string;
  type: 'document' | 'transaction' | 'assessment' | 'logbook' | 'concession';
  referenceId?: string;
  badge?: string;
  summary?: string;
}

export interface AdvisoryMessage {
  id: string;
  threadId: string;
  senderRole: 'Taxpayer' | 'Practitioner';
  senderName: string;
  timestamp: string;
  message: string;
  attachments?: AdvisoryMessageAttachment[];
  isEncrypted: boolean;
  encryptionAlgorithm: string;
}

export interface AdvisoryThread {
  id: string;
  practitionerId: string;
  title: string;
  category: 'ITA34_OBJECTION' | 'PROVISIONAL_TAX' | 'VAT201_RECONCILIATION' | 'SECTION_12BA_SOLAR' | 'GENERAL_COMPLIANCE' | 'AUDIT_PREPARATION';
  priority: 'NORMAL' | 'HIGH' | 'STATUTORY_DEADLINE';
  status: 'OPEN' | 'IN_REVIEW' | 'CLIENT_ACTION_REQUIRED' | 'SIGNED_OFF';
  lastUpdated: string;
  unreadCount: number;
  formalSignOff?: {
    practitionerName: string;
    sarsPrNumber: string;
    signedAt: string;
    opinionSummary: string;
    referenceHash: string;
  };
}

export interface ConsultationBooking {
  id: string;
  practitionerId: string;
  practitionerName: string;
  title: string;
  type: 'PRE_FILING_REVIEW' | 'SARS_AUDIT_DEFENCE' | 'YEAR_END_OPTIMIZATION' | 'QUICK_COMPLIANCE_SYNC';
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00 - 10:45 SAST"
  durationMinutes: number;
  meetingFormat: 'SECURE_VIDEO' | 'PHONE_CONSULTATION' | 'IN_OFFICE';
  meetingLink?: string;
  officeAddress?: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'RESCHEDULED' | 'CANCELLED';
  agendaItems: string[];
  preparedVaultDocuments: string[];
  notes?: string;
  createdAt: string;
}

export interface PractitionerAccessEvent {
  id: string;
  practitionerName: string;
  timestamp: string;
  action: string;
  resource: string;
  ipAddress: string;
  status: 'PERMITTED' | 'BLOCKED_SCOPE';
}

export interface CertifiedPractitionerDirectoryEntry {
  id: string;
  name: string;
  firmName: string;
  sarsPrNumber: string;
  professionalBody: ProfessionalBody;
  bodyDesignation: string; // e.g. "Chartered Tax Advisor (SA)", "CA(SA)", "CBA(SA)"
  specialties: string[];
  location: string;
  rating: number;
  completedReviews: number;
  hourlyRateZAR: number;
  avatarInitials: string;
  isVerifiedSarsPr: boolean;
}

// ============================================================================
// EMP501 INTERIM EMPLOYER RECONCILIATION DECLARATION (1 MARCH - 31 AUGUST)
// In terms of Paragraph 14(3) of the Fourth Schedule to the Income Tax Act 58/1962
// ============================================================================

export interface Emp201MonthlyRecord {
  monthKey: '03' | '04' | '05' | '06' | '07' | '08';
  monthLabel: string; // e.g. 'March 2026'
  payeDeclared: number; // Source Code 4102
  sdlDeclared: number; // Source Code 4141
  uifDeclared: number; // Source Code 4142
  etiClaimed: number; // Source Code 4118 (Deducted against PAYE)
  netLiability: number; // (PAYE + SDL + UIF - ETI)
  paymentMade: number;
  paymentDate: string;
  paymentReferenceNumber: string;
  variance: number; // paymentMade - netLiability
  status: 'BALANCED' | 'SHORTFALL' | 'OVERPAYMENT';
}

export interface Irp5CertificateRecord {
  id: string;
  certificateNumber: string; // e.g. 'IRP5-2026-001'
  employeeName: string;
  employeeIdNumber: string;
  taxNumber: string;
  employmentPeriod: string;
  grossRemuneration: number; // Code 3699
  payeWithheld: number; // Code 4102
  uifContribution: number; // Code 4142
  etiClaimed: number; // Code 4118
  certificateType: 'IRP5' | 'IT3a';
  isValidated: boolean;
}

export interface Emp501InterimDeclaration {
  id: string;
  submissionRef: string;
  employerName: string;
  tradingName: string;
  payeReferenceNumber: string; // e.g. '7940182914'
  uifReferenceNumber: string; // e.g. 'U12089471'
  sdlReferenceNumber: string; // e.g. 'L40182914'
  reconciliationPeriod: '202608' | 'INTERIM_2026'; // 1 March to 31 August
  declarationType: 'INTERIM_RECONCILIATION' | 'ANNUAL_FINAL';
  totalPayeDeclared: number;
  totalSdlDeclared: number;
  totalUifDeclared: number;
  totalEtiClaimed: number;
  netTotalLiability: number;
  totalPaymentsMade: number;
  totalVariance: number;
  certificatesCount: number;
  totalCertificateTaxWithheld: number;
  certificateVariance: number; // totalPayeDeclared - totalCertificateTaxWithheld
  status: 'DRAFT' | 'BALANCED_READY' | 'SUBMITTED_CONFIRMED';
  submittedAt?: string;
  submittedByRole?: RoleType;
  sarsReceiptNumber?: string;
  cryptographicSignature: string;
  monthlyBreakdown: Emp201MonthlyRecord[];
  certificates: Irp5CertificateRecord[];
}

// =========================================================================
// AI TAX COMPLIANCE CHATBOT ASSISTANT
// =========================================================================
export interface AppToolRecommendation {
  id: string;
  label: string;
  description: string;
  tabKey: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedQuestions?: string[];
  recommendedAppTools?: AppToolRecommendation[];
  statutoryReferences?: string[];
  modelUsed?: string;
  isStreaming?: boolean;
}

export interface TaxTopicPrompt {
  id: string;
  title: string;
  category: 'DEDUCTIONS' | 'COMPLIANCE' | 'DISPUTES' | 'VAT' | 'PAYROLL' | 'TOOLS';
  prompt: string;
  statutoryRef: string;
}

import {
  BusinessEntityWorkspace,
  TeamMember,
  SubmissionApprovalRequest,
  RoleType,
  RolePermissions
} from '../types';
import {
  initialTaxProfile,
  initialTransactions,
  initialInvoices,
  initialBankAccounts,
  pendingMixedUseFeed,
  initialCategorizationRules
} from './mockData';
import { getDefaultPermissionsForRole } from '../utils/sessionSecurity';

export interface RoleDefinitionMeta {
  role: RoleType;
  label: string;
  tierSummary: string;
  description: string;
  permissions: RolePermissions;
}

export const ROLE_DEFINITIONS: RoleDefinitionMeta[] = [
  {
    role: 'Owner',
    label: 'Owner / Public Officer',
    tierSummary: 'Full Control · Submission Approval · Team & Entity Admin',
    description: 'Unrestricted authority across all assigned business entities, statutory filings, user access management, and SARS dispute sign-off.',
    permissions: getDefaultPermissionsForRole('Owner')
  },
  {
    role: 'Accountant',
    label: 'Accountant / Practitioner',
    tierSummary: 'Data Entry · Invoice Approval · Submission Approval',
    description: 'Full accounting and filing rights including approving OCR tax invoices, lodging VAT201/EMP501 returns, and reviewing Rule 7 objections.',
    permissions: getDefaultPermissionsForRole('Accountant')
  },
  {
    role: 'Bookkeeper',
    label: 'Bookkeeper (Data Entry)',
    tierSummary: 'Data Entry · Draft Preparation · No Final Approval',
    description: 'Can capture expenses, scan VAT invoices, and log business travel, but cannot delete records, approve invoices, export raw ledgers, or submit final SARS returns.',
    permissions: getDefaultPermissionsForRole('Bookkeeper')
  },
  {
    role: 'Auditor',
    label: 'Auditor (View-Only & Audit)',
    tierSummary: 'View-Only · Audit Verification · CSV Export',
    description: 'Strictly read-only access to ledgers, tax projections, and chronological audit trails with CSV export enabled for statutory verification.',
    permissions: getDefaultPermissionsForRole('Auditor')
  },
  {
    role: 'Custom',
    label: 'Custom Permission Set',
    tierSummary: 'Granular Per-Feature Permission Overrides',
    description: 'Tailored access control configured individually per user across view-only, data entry, invoice approval, and submission approval.',
    permissions: getDefaultPermissionsForRole('Custom')
  }
];

export const INITIAL_BUSINESS_ENTITIES: BusinessEntityWorkspace[] = [
  {
    id: 'ent-ilitha-fintech',
    code: 'ILITHA',
    sector: 'Financial Technology & Software Advisory',
    financialYearEnd: 'February (28/29 Feb)',
    status: 'Active',
    createdAt: '2026-01-10',
    profile: {
      ...initialTaxProfile,
      registrationNumber: '2026/707498/07'
    },
    transactions: initialTransactions,
    invoices: initialInvoices,
    bankAccounts: initialBankAccounts,
    pendingTransactions: pendingMixedUseFeed,
    categorizationRules: initialCategorizationRules,
    trustLoans: [
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
    ]
  },
  {
    id: 'ent-kalahari-solar',
    code: 'KALAHARI',
    sector: 'Renewable Energy EPC & Solar PV (§12BA)',
    financialYearEnd: 'February (28/29 Feb)',
    status: 'Active',
    createdAt: '2026-02-14',
    profile: {
      name: 'Kalahari Clean Energy (Pty) Ltd',
      entityType: 'Small Business SME (Pty Ltd)',
      vatRegistered: true,
      vatNumber: '4520193847',
      registrationNumber: '2024/519204/07',
      taxBracketRate: 0.27,
      provisionalCycle: 'Cycle 1 (Aug 31)',
      medicalAidMembers: 0,
      hasRetirementAnnuity: false,
      idNumber: '8504125100081',
      sarsTaxNumber: '9128475012',
      ficaStatus: 'Verified',
      ficaProgress: 100,
      directorsList: ['V Zenzile', 'M Ndlovu'],
      isOtpVerified: true,
      lastIdentitySync: '2026-10-15',
      is12BAApplied: true,
      solarSystemCost: 1250000,
      solarInstallationDate: '2026-01-20',
      hasSolarCocInVault: true,
      hasEskomGridTieApproval: true
    },
    transactions: [
      {
        id: 'tx-kal-201',
        date: '2026-06-19',
        description: 'Commercial Solar Microgrid Installation - Kuruman Mine',
        amount: 690000,
        type: 'income',
        category: 'EPC Engineering Revenue',
        vatIncluded: true,
        vatAmount: 90000,
        sarsSection: 'Gross Income (Section 1 definition)',
        isDeductible: false,
        deductiblePercentage: 0,
        taxPositionImpactZAR: 162000,
        explanation: 'Commercial turnkey solar EPC milestone billing. Output VAT R90,000 accounted for under VAT201 Box 1.',
        bankAccountSource: 'Investec Corporate Call',
        status: 'classified'
      },
      {
        id: 'tx-kal-202',
        date: '2026-06-15',
        description: 'Longi Bifacial 550W PV Arrays & Hybrid Inverters (Capex)',
        amount: 920000,
        type: 'asset',
        category: 'Renewable Generation Plant',
        vatIncluded: true,
        vatAmount: 120000,
        sarsSection: 'Section 12BA 125% Renewable Energy Allowance',
        isDeductible: true,
        deductiblePercentage: 100,
        taxPositionImpactZAR: -270000,
        explanation: 'Qualifies for Section 12BA 125% upfront capital deduction and R120,000 Input VAT Box 14 refund claim.',
        bankAccountSource: 'Investec Corporate Call',
        status: 'classified'
      },
      {
        id: 'tx-kal-203',
        date: '2026-06-11',
        description: '4x4 Site Survey Fleet Diesel & Toll Fees (Northern Cape)',
        amount: 14200,
        type: 'expense',
        category: 'Travel & Transport',
        vatIncluded: false,
        vatAmount: 0,
        sarsSection: 'Section 11(a) General Business Expense',
        isDeductible: true,
        deductiblePercentage: 100,
        taxPositionImpactZAR: -3834,
        explanation: 'Verified engineering site transit corroborated with GPS fleet logbook.',
        bankAccountSource: 'Nedbank Fleet Card',
        status: 'classified'
      }
    ],
    invoices: [
      {
        id: 'inv-kal-1',
        supplierName: 'VoltServe Clean Energy Distributors',
        vatNumber: '4190284711',
        invoiceNumber: 'VLT-CPT-8801',
        date: '2026-06-15',
        category: 'Equipment',
        totalAmount: 920000,
        vatAmount: 120000,
        netAmount: 800000,
        sarsSection: 'Section 12BA / VAT Box 14 Capital',
        isVatClaimable: true,
        isDeductible: true,
        explanation: 'Full Section 20(4) tax invoice verified with electrical CoC attached in vault.',
        confidence: 0.99,
        syncedToSarsReport: true
      }
    ],
    bankAccounts: [
      {
        id: 'bank-nedbank',
        bankName: 'Nedbank',
        accountName: 'Kalahari Clean Energy Project Treasury',
        accountNumberMasked: '•••• •••• •••• 3014',
        balanceZAR: 418500.0,
        accountType: 'Business Current',
        lastSynced: 'Real-time API Feed (Open Banking TLS 1.3)',
        status: 'Connected'
      }
    ],
    pendingTransactions: [
      {
        id: 'feed-kal-1',
        date: '2026-06-22',
        rawMerchant: 'SANS Electrical CoC Compliance Inspection Fee',
        amount: 6850,
        type: 'debit',
        suggestedAction: 'expense',
        flagReason: 'Statutory wiring certificate cost required to unlock Section 12BA 125% solar deduction.'
      }
    ],
    categorizationRules: initialCategorizationRules,
    trustLoans: []
  },
  {
    id: 'ent-tablebay-freight',
    code: 'TABLEBAY',
    sector: 'Cold-Chain Freight & Logistics Advisory',
    financialYearEnd: 'June (30 Jun)',
    status: 'Active',
    createdAt: '2026-03-01',
    profile: {
      name: 'Table Bay Freight & Advisory CC',
      entityType: 'Self-Employed / Sole Prop',
      vatRegistered: true,
      vatNumber: '4810293746',
      registrationNumber: '2019/338102/23',
      taxBracketRate: 0.31,
      provisionalCycle: 'Cycle 2 (Feb 28)',
      medicalAidMembers: 2,
      hasRetirementAnnuity: true,
      idNumber: '8209195042088',
      sarsTaxNumber: '9840127364',
      ficaStatus: 'Verified',
      ficaProgress: 100,
      directorsList: ['T Mkhize'],
      isOtpVerified: true,
      lastIdentitySync: '2026-10-20'
    },
    transactions: [
      {
        id: 'tx-tb-301',
        date: '2026-06-18',
        description: 'Cape Town Port Refrigerated Haulage Retainer',
        amount: 115000,
        type: 'income',
        category: 'Logistics & Haulage',
        vatIncluded: true,
        vatAmount: 15000,
        sarsSection: 'Gross Income (Section 1 definition)',
        isDeductible: false,
        deductiblePercentage: 0,
        taxPositionImpactZAR: 31000,
        explanation: 'Standard rated domestic port transit fee subject to 15% output VAT.',
        bankAccountSource: 'ABSA Commercial Logistics',
        status: 'classified'
      },
      {
        id: 'tx-tb-302',
        date: '2026-06-14',
        description: 'Engen Commercial Diesel Bulk Fleet Refill',
        amount: 28400,
        type: 'expense',
        category: 'Travel & Transport',
        vatIncluded: false,
        vatAmount: 0,
        sarsSection: 'Section 11(a) Freight Fuel',
        isDeductible: true,
        deductiblePercentage: 100,
        taxPositionImpactZAR: -8804,
        explanation: 'Zero-rated fuel purchase fully deductible for haulage trade.',
        bankAccountSource: 'ABSA Commercial Logistics',
        status: 'classified'
      },
      {
        id: 'tx-tb-303',
        date: '2026-06-10',
        description: 'Container Tracking Telemetry SaaS Subscription',
        amount: 5750,
        type: 'expense',
        category: 'Software & Cloud',
        vatIncluded: true,
        vatAmount: 750,
        sarsSection: 'Section 11(a) Operating Software',
        isDeductible: true,
        deductiblePercentage: 100,
        taxPositionImpactZAR: -1550,
        explanation: 'Direct operational GPS telemetry fee with valid Section 20(4) tax invoice.',
        bankAccountSource: 'ABSA Commercial Logistics',
        status: 'classified'
      }
    ],
    invoices: [
      {
        id: 'inv-tb-1',
        supplierName: 'Cape Logistics Telemetry Services',
        vatNumber: '4481029384',
        invoiceNumber: 'CLT-2026-441',
        date: '2026-06-10',
        category: 'Software & Cloud',
        totalAmount: 5750,
        vatAmount: 750,
        netAmount: 5000,
        sarsSection: 'Section 11(a) General Deduction',
        isVatClaimable: true,
        isDeductible: true,
        explanation: 'Full tax invoice captured with supplier VAT number verified.',
        confidence: 0.97,
        syncedToSarsReport: true
      }
    ],
    bankAccounts: [
      {
        id: 'bank-absa',
        bankName: 'Absa',
        accountName: 'Table Bay Logistics Current',
        accountNumberMasked: '•••• •••• •••• 7741',
        balanceZAR: 142900.0,
        accountType: 'Business Current',
        lastSynced: 'Synchronized via Direct API',
        status: 'Connected'
      }
    ],
    pendingTransactions: [
      {
        id: 'feed-tb-1',
        date: '2026-06-21',
        rawMerchant: 'Cross-Border Customs Clearance SAD500 Duty',
        amount: 18500,
        type: 'debit',
        suggestedAction: 'expense',
        flagReason: 'Import VAT on SAD500 voucher eligible for Box 18 VAT201 claim.'
      }
    ],
    categorizationRules: initialCategorizationRules,
    trustLoans: []
  }
];

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'usr-owner-01',
    name: 'V Zenzile',
    email: 'vzenzile@ilithafintech.co.za',
    title: 'Managing Director & Public Officer',
    role: 'Owner',
    permissions: getDefaultPermissionsForRole('Owner'),
    assignedEntityIds: ['ALL'],
    status: 'Active',
    joinedAt: '2026-01-10',
    lastActiveAt: '2026-11-13 20:45 SAST'
  },
  {
    id: 'usr-acc-02',
    name: 'Khanyi M.',
    email: 'khanyi@kma-taxpractitioners.co.za',
    title: 'Registered Tax Practitioner (PR-0041928)',
    role: 'Accountant',
    permissions: getDefaultPermissionsForRole('Accountant'),
    assignedEntityIds: ['ALL'],
    status: 'Active',
    joinedAt: '2026-01-15',
    lastActiveAt: '2026-11-13 18:10 SAST'
  },
  {
    id: 'usr-book-03',
    name: 'Zola K.',
    email: 'zola.k@ilithafintech.co.za',
    title: 'Finance Bookkeeper (Data Entry)',
    role: 'Bookkeeper',
    permissions: getDefaultPermissionsForRole('Bookkeeper'),
    assignedEntityIds: ['ent-ilitha-fintech', 'ent-kalahari-solar'],
    status: 'Active',
    joinedAt: '2026-02-01',
    lastActiveAt: '2026-11-13 16:30 SAST'
  },
  {
    id: 'usr-aud-04',
    name: 'Priya N.',
    email: 'priya.n@shieldaudit.co.za',
    title: 'External Statutory Auditor (View-Only)',
    role: 'Auditor',
    permissions: getDefaultPermissionsForRole('Auditor'),
    assignedEntityIds: ['ent-ilitha-fintech', 'ent-tablebay-freight'],
    status: 'Active',
    joinedAt: '2026-03-12',
    lastActiveAt: '2026-11-12 11:20 SAST'
  },
  {
    id: 'usr-cust-05',
    name: 'S Cengcani',
    email: 'cengcanis@gmail.com',
    title: 'Group Compliance Lead',
    role: 'Custom',
    permissions: {
      canViewTaxProjections: true,
      canEditTransactions: true,
      canDeleteTransactions: false,
      canScanInvoices: true,
      canApproveInvoices: true,
      canApproveSubmissions: true,
      canManageTeam: true,
      canManageEntities: true,
      canManageDisputes: true,
      canManageSuccession: false,
      canDownloadCSV: true
    },
    assignedEntityIds: ['ALL'],
    status: 'Active',
    joinedAt: '2026-01-10',
    lastActiveAt: '2026-11-13 21:00 SAST'
  }
];

export const INITIAL_SUBMISSION_APPROVALS: SubmissionApprovalRequest[] = [
  {
    id: 'sub-apr-001',
    entityId: 'ent-kalahari-solar',
    entityName: 'Kalahari Clean Energy (Pty) Ltd',
    submissionType: 'VAT201_RETURN',
    period: '2026/02 - Category B (Jan-Feb)',
    title: 'VAT201 Refund Return (§12BA Solar Capex Input Claim)',
    amountImpactZAR: -30000,
    preparedByUserId: 'usr-book-03',
    preparedByName: 'Zola K.',
    preparedByRole: 'Bookkeeper',
    preparedAt: '2026-11-13 14:22 SAST',
    status: 'PENDING_APPROVAL'
  },
  {
    id: 'sub-apr-002',
    entityId: 'ent-ilitha-fintech',
    entityName: 'Ilitha Fintech Operations (Pty) Ltd',
    submissionType: 'ADR1_OBJECTION',
    period: '2026 Tax Assessment',
    title: 'TAA Rule 7 ADR1 Notice of Objection (Source Code 4015 Travel)',
    amountImpactZAR: 68475,
    preparedByUserId: 'usr-book-03',
    preparedByName: 'Zola K.',
    preparedByRole: 'Bookkeeper',
    preparedAt: '2026-11-12 09:40 SAST',
    status: 'APPROVED_FOR_FILING',
    reviewedByName: 'Khanyi M.',
    reviewedByRole: 'Accountant',
    reviewedAt: '2026-11-12 11:05 SAST',
    reviewNotes: 'Verified against Logbook_2026.pdf (#789) and signed Vehicle Purchase Agreement in vault.',
    sarsRefNumber: 'SARS-ADR1-2026-4015A'
  }
];

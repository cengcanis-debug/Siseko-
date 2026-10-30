import { 
  TaxPractitionerInvite, 
  AdvisoryThread, 
  AdvisoryMessage, 
  ConsultationBooking, 
  PractitionerAccessEvent,
  CertifiedPractitionerDirectoryEntry 
} from '../types';

export const initialPractitioners: TaxPractitionerInvite[] = [
  {
    id: 'PRAC-001',
    practitionerName: 'Adv. Nomvula Sithole, CTA(SA)',
    practitionerEmail: 'nsithole@sitholetaxadvisory.co.za',
    firmName: 'Sithole & Partners Tax Advocates Inc.',
    sarsPrNumber: 'PR-0089421',
    professionalBody: 'SAIT',
    specialization: 'SARS Dispute Resolution & Corporate Section 11(a) Audits',
    inviteStatus: 'ACTIVE_CONNECTED',
    invitedAt: '2026-08-15T09:30:00Z',
    acceptedAt: '2026-08-15T11:45:00Z',
    expiresAt: '2027-08-15T23:59:59Z',
    inviteToken: 'STPC-7F9A-4E21-9B88',
    pinCode: '741920',
    sarsMandateSigned: true,
    mandateReference: 'POA-SARS-2026-ILITHA-001',
    permissions: {
      canViewProfileAndFica: true,
      canViewTransactions: true,
      canViewVatDeclarations: true,
      canViewAuditVault: true,
      canViewIta34AndObjections: true,
      canViewTaxShieldSimulations: true,
      canExportDossiers: true,
      canSubmitFilingsOnBehalf: false, // Requires explicit OTP dual-authorization
      dataMaskingLevel: 'FULL_ACCESS'
    },
    lastAccessedAt: '2026-10-14T16:20:00Z'
  },
  {
    id: 'PRAC-002',
    practitionerName: 'Dawie van der Merwe, CA(SA)',
    practitionerEmail: 'dawie@vdmaccounting.co.za',
    firmName: 'Van der Merwe Chartered Accountants',
    sarsPrNumber: 'PR-0043192',
    professionalBody: 'SAICA',
    specialization: 'VAT201 Apportionment & Section 12BA Capital Allowances',
    inviteStatus: 'PENDING_INVITE',
    invitedAt: '2026-10-12T14:15:00Z',
    expiresAt: '2026-11-12T23:59:59Z',
    inviteToken: 'STPC-3C12-88B1-7A90',
    pinCode: '582301',
    sarsMandateSigned: false,
    permissions: {
      canViewProfileAndFica: false,
      canViewTransactions: true,
      canViewVatDeclarations: true,
      canViewAuditVault: true,
      canViewIta34AndObjections: false,
      canViewTaxShieldSimulations: true,
      canExportDossiers: false,
      canSubmitFilingsOnBehalf: false,
      dataMaskingLevel: 'MASK_PERSONAL_IDENTIFIERS'
    }
  }
];

export const certifiedDirectoryList: CertifiedPractitionerDirectoryEntry[] = [
  {
    id: 'DIR-001',
    name: 'Adv. Nomvula Sithole',
    firmName: 'Sithole & Partners Tax Advocates Inc.',
    sarsPrNumber: 'PR-0089421',
    professionalBody: 'SAIT',
    bodyDesignation: 'Chartered Tax Advisor (SA)',
    specialties: ['SARS Rule 7 TAA Objections', 'Corporate Income Tax', 'ITR14 & ITA34 Decoders'],
    location: 'Sandton, Johannesburg (Gauteng)',
    rating: 4.9,
    completedReviews: 142,
    hourlyRateZAR: 2400,
    avatarInitials: 'NS',
    isVerifiedSarsPr: true
  },
  {
    id: 'DIR-002',
    name: 'Dawie van der Merwe',
    firmName: 'Van der Merwe Chartered Accountants',
    sarsPrNumber: 'PR-0043192',
    professionalBody: 'SAICA',
    bodyDesignation: 'CA(SA) / Registered Auditor',
    specialties: ['Section 12BA 125% Solar', 'VAT Apportionment §17(1)', 'Two-Pot Tax Audits'],
    location: 'Stellenbosch / Cape Town (Western Cape)',
    rating: 4.8,
    completedReviews: 98,
    hourlyRateZAR: 2100,
    avatarInitials: 'DM',
    isVerifiedSarsPr: true
  },
  {
    id: 'DIR-003',
    name: 'Kaveshan Pillay',
    firmName: 'Apex Tax & Advisory Partners',
    sarsPrNumber: 'PR-0091845',
    professionalBody: 'CIBA',
    bodyDesignation: 'Certified Business Accountant (SA)',
    specialties: ['SME SBC §12E Tax Shields', 'Section 12H SETA Learnership', 'Provisional IRP6'],
    location: 'Umhlanga, Durban (KwaZulu-Natal)',
    rating: 4.9,
    completedReviews: 76,
    hourlyRateZAR: 1850,
    avatarInitials: 'KP',
    isVerifiedSarsPr: true
  },
  {
    id: 'DIR-004',
    name: 'Lindiwe Mokwena',
    firmName: 'Mokwena & Associates Forensic Tax',
    sarsPrNumber: 'PR-0078120',
    professionalBody: 'ACCA',
    bodyDesignation: 'FCCA / Certified Forensic Tax Auditor',
    specialties: ['VDP Proactive Disclosures §227', 'Section 24J Debt Accruals', 'SARS Criminal Immunity'],
    location: 'Pretoria East (Gauteng)',
    rating: 5.0,
    completedReviews: 110,
    hourlyRateZAR: 2600,
    avatarInitials: 'LM',
    isVerifiedSarsPr: true
  }
];

export const initialAdvisoryThreads: AdvisoryThread[] = [
  {
    id: 'THREAD-001',
    practitionerId: 'PRAC-001',
    title: 'ITA34 Source Code 4015 Writeback & Rule 7 ADR1 Formal Grounding',
    category: 'ITA34_OBJECTION',
    priority: 'STATUTORY_DEADLINE',
    status: 'IN_REVIEW',
    lastUpdated: '2026-10-14T16:20:00Z',
    unreadCount: 1,
    formalSignOff: {
      practitionerName: 'Adv. Nomvula Sithole, CTA(SA)',
      sarsPrNumber: 'PR-0089421',
      signedAt: '2026-10-14T16:15:00Z',
      opinionSummary: 'Corroborating Logbook #789 (12,450 km) and signed Vehicle Purchase Agreement meet all evidentiary standards under Section 11(a) of the Income Tax Act. Recommendation: File ADR1 Notice of Objection within the remaining 80-business-day window.',
      referenceHash: 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    }
  },
  {
    id: 'THREAD-002',
    practitionerId: 'PRAC-001',
    title: 'Section 12BA Renewable Energy Super-Allowance (125%) CoC Verification',
    category: 'SECTION_12BA_SOLAR',
    priority: 'NORMAL',
    status: 'SIGNED_OFF',
    lastUpdated: '2026-10-11T11:05:00Z',
    unreadCount: 0,
    formalSignOff: {
      practitionerName: 'Adv. Nomvula Sithole, CTA(SA)',
      sarsPrNumber: 'PR-0089421',
      signedAt: '2026-10-11T11:00:00Z',
      opinionSummary: 'Verified Solar Electrical CoC dated 15 Nov 2025 and Eskom Grid-Tie authorization for R450,000 system. Qualifies for full R562,500 Section 12BA allowance with R151,875 corporate tax shield.',
      referenceHash: 'SHA256:7c92b83a218f0a0d4c679238e8312019c43a6d9124be3e4a8f90240954b81923'
    }
  },
  {
    id: 'THREAD-003',
    practitionerId: 'PRAC-001',
    title: 'Provisional Tax Cycle 2 (Feb 2027) Liability & ETI Optimization',
    category: 'PROVISIONAL_TAX',
    priority: 'NORMAL',
    status: 'OPEN',
    lastUpdated: '2026-10-08T15:40:00Z',
    unreadCount: 0
  }
];

export const initialAdvisoryMessages: AdvisoryMessage[] = [
  // Thread 1: ITA34 Code 4015
  {
    id: 'MSG-001',
    threadId: 'THREAD-001',
    senderRole: 'Taxpayer',
    senderName: 'V Zenzile (Owner)',
    timestamp: '2026-10-14T14:10:00Z',
    message: 'Hello Adv. Sithole. SARS issued our ITA34 Notice of Assessment and specifically wrote back our Business Travel Claim under Source Code 4015 to R0, triggering an additional liability notice. Can you review our vault evidence and check our Rule 7 dispute draft?',
    attachments: [
      {
        id: 'ATT-001',
        name: 'ITA34_Assessment_2026_Notice.pdf',
        type: 'assessment',
        referenceId: 'ITA34-ADJ-4015',
        badge: 'SARS Notice',
        summary: 'Source Code 4015 written back from R82,450 to R0'
      },
      {
        id: 'ATT-002',
        name: 'Logbook_2026.pdf (Logbook ID #789)',
        type: 'logbook',
        referenceId: 'LOGBOOK-#789',
        badge: 'Vault Corroborated',
        summary: '12,450 km verified business travel with client visit stamps'
      },
      {
        id: 'ATT-003',
        name: 'Vehicle_Purchase_Agreement.pdf',
        type: 'document',
        referenceId: 'VAULT-VPA-2024',
        badge: 'Signed Contract',
        summary: 'Toyota Fortuner 2.8 GD-6 RB ownership agreement'
      }
    ],
    isEncrypted: true,
    encryptionAlgorithm: 'AES-256-GCM / Client-Practitioner Ephemeral Key'
  },
  {
    id: 'MSG-002',
    threadId: 'THREAD-001',
    senderRole: 'Practitioner',
    senderName: 'Adv. Nomvula Sithole, CTA(SA)',
    timestamp: '2026-10-14T15:05:00Z',
    message: 'Good day Vuyo. I have accessed your Audit-Ready Vault through the secure token. I inspected Logbook #789: every journey has GPS coordinates, client purpose, and odometer readings totaling exactly 12,450 km. Furthermore, the Vehicle Purchase Agreement confirms the cost benchmark.\n\nSARS automated assessment audits routinely write back Code 4015 if the logbook is not pre-attached to the initial eFiling submission. Under Rule 7 of the Tax Administration Act 28 of 2011, we are within the statutory 80-business-day window. I have formulated our legal ground relying directly on Section 11(a) of the Income Tax Act 58 of 1962 (General Deduction Formula).',
    isEncrypted: true,
    encryptionAlgorithm: 'AES-256-GCM / Client-Practitioner Ephemeral Key'
  },
  {
    id: 'MSG-003',
    threadId: 'THREAD-001',
    senderRole: 'Practitioner',
    senderName: 'Adv. Nomvula Sithole, CTA(SA)',
    timestamp: '2026-10-14T16:15:00Z',
    message: 'I have attached my formal Tax Opinion and signed off on your ADR1 dispute package. The legal argument and bundle are ready for digital submission to SARS Appeals. Let us schedule a 30-minute Pre-Filing Review to finalize the lodgement.',
    attachments: [
      {
        id: 'ATT-004',
        name: 'Formal_Tax_Opinion_ADR1_Code4015.pdf',
        type: 'document',
        referenceId: 'OPINION-SITHOLE-001',
        badge: 'SAIT Certified Opinion',
        summary: 'Concludes 100% compliance with TAA Rule 7 and Section 11(a)'
      }
    ],
    isEncrypted: true,
    encryptionAlgorithm: 'AES-256-GCM / Client-Practitioner Ephemeral Key'
  },
  // Thread 2: Section 12BA Solar
  {
    id: 'MSG-004',
    threadId: 'THREAD-002',
    senderRole: 'Taxpayer',
    senderName: 'V Zenzile (Owner)',
    timestamp: '2026-10-10T09:15:00Z',
    message: 'Adv. Sithole, please verify our Section 12BA 125% super-allowance calculation. We brought the 45kW commercial solar array into service on 15 Nov 2025 at R450,000 cost.',
    attachments: [
      {
        id: 'ATT-005',
        name: 'Solar_Electrical_CoC_Certificate.pdf',
        type: 'document',
        referenceId: 'VAULT-COC-SOLAR-01',
        badge: 'CoC Verified',
        summary: 'Master Installation Electrician signed CoC #EC-984102'
      }
    ],
    isEncrypted: true,
    encryptionAlgorithm: 'AES-256-GCM / Client-Practitioner Ephemeral Key'
  },
  {
    id: 'MSG-005',
    threadId: 'THREAD-002',
    senderRole: 'Practitioner',
    senderName: 'Adv. Nomvula Sithole, CTA(SA)',
    timestamp: '2026-10-11T11:00:00Z',
    message: 'Thoroughly audited. Because the system was brought into use between 1 March 2023 and 28 February 2026, Section 12BA grants the accelerated 125% day-one deduction of R562,500.00. This provides a direct corporate tax cash shield of R151,875.00. I have stamped the statutory schedule as compliant.',
    isEncrypted: true,
    encryptionAlgorithm: 'AES-256-GCM / Client-Practitioner Ephemeral Key'
  }
];

export const initialConsultations: ConsultationBooking[] = [
  {
    id: 'CONS-001',
    practitionerId: 'PRAC-001',
    practitionerName: 'Adv. Nomvula Sithole, CTA(SA)',
    title: 'SARS Rule 7 Dispute Sign-Off & ADR1 Lodgement Session',
    type: 'SARS_AUDIT_DEFENCE',
    date: '2026-10-18',
    timeSlot: '10:00 - 10:45 SAST',
    durationMinutes: 45,
    meetingFormat: 'SECURE_VIDEO',
    meetingLink: 'https://video.zat-secure.co.za/room/sithole-adr1-dispute-789',
    status: 'CONFIRMED',
    agendaItems: [
      'Final review of ADR1 Notice of Objection document package',
      'Affidavit verification for Logbook #789 (12,450 km business travel)',
      'SARS eFiling Power of Attorney (Section 240 TAA) confirmation',
      'Discussion of expected SARS 60-day response turnaround'
    ],
    preparedVaultDocuments: [
      'Logbook_2026.pdf (Logbook ID #789)',
      'Vehicle_Purchase_Agreement.pdf',
      'ITA34_Notice_of_Assessment_2026.pdf',
      'SARS_Rule7_Objection_Brief.pdf'
    ],
    notes: 'Please ensure both directors (V Zenzile & S Cengcani) are on the call to authorize the digital dispute submission.',
    createdAt: '2026-10-14T16:30:00Z'
  },
  {
    id: 'CONS-002',
    practitionerId: 'PRAC-001',
    practitionerName: 'Adv. Nomvula Sithole, CTA(SA)',
    title: 'Year-End Statutory Concessions & Section 24J/12H Review',
    type: 'YEAR_END_OPTIMIZATION',
    date: '2026-11-04',
    timeSlot: '14:00 - 15:00 SAST',
    durationMinutes: 60,
    meetingFormat: 'IN_OFFICE',
    officeAddress: 'Floor 14, The Leonardo, 75 Maude St, Sandton, 2196',
    status: 'CONFIRMED',
    agendaItems: [
      'Compound interest amortization schedule under Section 24J',
      'Section 12H learnership allowance SETA contracts inspection',
      'Paragraph 12A debt compromise tax reconciliation'
    ],
    preparedVaultDocuments: [
      'Senior_Facility_Loan_Agreement.pdf',
      'SETA_Registered_Learnership_Agreements.pdf'
    ],
    createdAt: '2026-10-09T10:15:00Z'
  },
  {
    id: 'CONS-003',
    practitionerId: 'PRAC-001',
    practitionerName: 'Adv. Nomvula Sithole, CTA(SA)',
    title: 'Mid-Year Provisional Tax Cycle 1 Review (Aug 2026)',
    type: 'PRE_FILING_REVIEW',
    date: '2026-08-25',
    timeSlot: '11:00 - 11:30 SAST',
    durationMinutes: 30,
    meetingFormat: 'SECURE_VIDEO',
    meetingLink: 'https://video.zat-secure.co.za/room/sithole-irp6-cycle1',
    status: 'COMPLETED',
    agendaItems: [
      'Review August 2026 IRP6 turnover projection',
      'Verify R45,000 provisional tax payment receipt'
    ],
    preparedVaultDocuments: [
      'IRP6_Calculation_Schedule_Aug2026.pdf'
    ],
    notes: 'Signed off and lodged on SARS eFiling with zero penalty exposure.',
    createdAt: '2026-08-20T08:00:00Z'
  }
];

export const initialPractitionerAccessLogs: PractitionerAccessEvent[] = [
  {
    id: 'ACC-LOG-001',
    practitionerName: 'Adv. Nomvula Sithole, CTA(SA)',
    timestamp: '2026-10-14T16:20:00Z',
    action: 'VIEW_DOCUMENT',
    resource: 'Audit Vault: Logbook_2026.pdf (12,450 km)',
    ipAddress: '197.89.14.88 (Sandton, JHB)',
    status: 'PERMITTED'
  },
  {
    id: 'ACC-LOG-002',
    practitionerName: 'Adv. Nomvula Sithole, CTA(SA)',
    timestamp: '2026-10-14T16:15:30Z',
    action: 'DIGITAL_SIGN_OFF',
    resource: 'Tax Opinion Stamp: ADR1 Rule 7 Notice of Objection',
    ipAddress: '197.89.14.88 (Sandton, JHB)',
    status: 'PERMITTED'
  },
  {
    id: 'ACC-LOG-003',
    practitionerName: 'Adv. Nomvula Sithole, CTA(SA)',
    timestamp: '2026-10-14T15:02:14Z',
    action: 'VIEW_DOCUMENT',
    resource: 'Audit Vault: Vehicle_Purchase_Agreement.pdf',
    ipAddress: '197.89.14.88 (Sandton, JHB)',
    status: 'PERMITTED'
  },
  {
    id: 'ACC-LOG-004',
    practitionerName: 'Adv. Nomvula Sithole, CTA(SA)',
    timestamp: '2026-10-14T14:58:10Z',
    action: 'VIEW_ASSESSMENT',
    resource: 'ITA34 Assessment 2026: Source Code 4015 Writeback',
    ipAddress: '197.89.14.88 (Sandton, JHB)',
    status: 'PERMITTED'
  },
  {
    id: 'ACC-LOG-005',
    practitionerName: 'Adv. Nomvula Sithole, CTA(SA)',
    timestamp: '2026-10-11T10:45:00Z',
    action: 'VIEW_DOCUMENT',
    resource: 'Audit Vault: Solar_Electrical_CoC_Certificate.pdf',
    ipAddress: '197.89.14.88 (Sandton, JHB)',
    status: 'PERMITTED'
  },
  {
    id: 'ACC-LOG-006',
    practitionerName: 'Dawie van der Merwe, CA(SA)',
    timestamp: '2026-10-12T14:16:00Z',
    action: 'ATTEMPT_VIEW_PII',
    resource: 'Directors SA ID & FICA Documents',
    ipAddress: '105.22.119.42 (Stellenbosch, CPT)',
    status: 'BLOCKED_SCOPE' // Blocked because canViewProfileAndFica is false
  }
];

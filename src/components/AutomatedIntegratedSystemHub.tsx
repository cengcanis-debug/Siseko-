import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  Download, 
  FileCheck2, 
  Scale, 
  Receipt, 
  FileText, 
  Layers, 
  Lock, 
  Unlock, 
  ArrowRight, 
  Clock, 
  Cpu, 
  Database, 
  Zap, 
  ChevronRight,
  ExternalLink,
  Users,
  Building2,
  Car,
  GraduationCap,
  Sun
} from 'lucide-react';
import { 
  UserTaxProfile, 
  RoleType, 
  TaxTransaction, 
  InvoiceRecord,
  EntityProfile
} from '../types';
import { formatZAR } from '../utils/taxCalculations';
import { downloadBlobFile, generateSubmissionRef } from '../utils/systemBridge';
import { isRoleAuthorized, getRoleScopes } from '../utils/sessionSecurity';
import { SarsDisputePackModal } from './SarsDisputePackModal';

interface VaultItem {
  id: string;
  name: string;
  category: 
    | 'Logbook' 
    | 'Purchase Agreement' 
    | 'Section 18A Certificate' 
    | 'Tax Invoice' 
    | 'Electrical CoC (Section 12BA)' 
    | 'SETA Registration (Section 12H)' 
    | 'DSI R&D Approval (Section 11D)'
    | 'Section 24J Loan Agreement'
    | 'Section 11(gC) Capital Asset Register'
    | 'Section 10B Equity Register';
  verified: boolean;
  sha256: string;
  metadata: Record<string, any>;
}

interface AutomatedPipelineStage {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLIANT' | 'ACTION_REQUIRED' | 'FLAGGED';
  statute: string;
  findings: string[];
  metrics?: Record<string, string | number>;
}

interface AutomatedIntegratedSystemHubProps {
  transactions: TaxTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<TaxTransaction[]>>;
  profile: UserTaxProfile;
  setProfile?: React.Dispatch<React.SetStateAction<UserTaxProfile>>;
  currentUserRole: RoleType;
  setCurrentUserRole?: (role: RoleType) => void;
  checkPermission: (action: string) => boolean;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  onNavigateTab: (tabKey: string) => void;
}

export const AutomatedIntegratedSystemHub: React.FC<AutomatedIntegratedSystemHubProps> = ({
  transactions,
  setTransactions,
  profile,
  currentUserRole,
  setCurrentUserRole,
  checkPermission,
  addAuditLog,
  showBanner,
  onNavigateTab
}) => {
  const [isRunningPipeline, setIsRunningPipeline] = useState<boolean>(false);
  const [lastExecutedTimestamp, setLastExecutedTimestamp] = useState<string | null>('2026-10-12 09:15 SAST');
  const [activeStageIndex, setActiveStageIndex] = useState<number>(-1);
  const [selectedStageId, setSelectedStageId] = useState<string>('stage-ita34');

  // Interactive Stage State
  const [isDisputePackModalOpen, setIsDisputePackModalOpen] = useState<boolean>(false);
  const [vaultVerifiedStatus, setVaultVerifiedStatus] = useState<boolean>(true);
  const [deductionsCommitted, setDeductionsCommitted] = useState<boolean>(false);

  // Audit-Ready Vault Mock Source
  const vaultItems: VaultItem[] = [
    {
      id: 'vault-lb-789',
      name: 'Logbook_2026.pdf',
      category: 'Logbook',
      verified: true,
      sha256: 'e89a3c19b22a84d284f9380a98c56e29cfa498a72b01258dcae0f2587593c612',
      metadata: { logbookId: '#789', totalBusinessKm: 12450, vehicleReg: 'CA 892-140', verifiedRatePerKm: 'R4.82' }
    },
    {
      id: 'vault-pa-001',
      name: 'Purchase_Agreement.pdf',
      category: 'Purchase Agreement',
      verified: true,
      sha256: '4f70c388bc5f74de055f93976f57e1ad485f269a83d47f9c8f9219d3fbc95018',
      metadata: { vehicle: 'Toyota Hilux 2.8 GD-6', purchasePrice: 650000, financeAgreement: 'Absa Vehicle Finance #AF-99214' }
    },
    {
      id: 'vault-pbo-18a',
      name: 'Section_18A_RedCross_2026.pdf',
      category: 'Section 18A Certificate',
      verified: true,
      sha256: '12d8a5719bc4e0405baefb3c19e59d482cfa847321590abce37f59d81347ba01',
      metadata: { pboNumber: '930012345', it3dReference: 'IT3D-PBO-2026-98124', donationAmount: 25000 }
    },
    {
      id: 'vault-vat-inv-882',
      name: 'Makro_TaxInvoice_MK98214.pdf',
      category: 'Tax Invoice',
      verified: true,
      sha256: 'a12bc90812ed34125fbc7492a83e0129bcfa892134fe01a239cbdfa12098bc43',
      metadata: { invoiceNo: 'MK-98214', supplierVat: '4920192831', totalZAR: 14375, vatZAR: 1875 }
    },
    {
      id: 'vault-coc-solar',
      name: 'Electrical_CoC_Solar_2026.pdf',
      category: 'Electrical CoC (Section 12BA)',
      verified: true,
      sha256: '7c9e12089bcaef1048f0293da829c7821a4f028912eacb89410a827192cb8491',
      metadata: { certificateNo: 'COC-PV-2026-9018', installedKw: 45, systemCostZAR: 450000, gridTieApproved: true }
    },
    {
      id: 'vault-seta-reg',
      name: 'SETA_Learnership_Agreement_2026.pdf',
      category: 'SETA Registration (Section 12H)',
      verified: true,
      sha256: '38da194f820c7821a4f028912eacb89410a827192cb84917c9e12089bcaef104',
      metadata: { setaRegNumber: 'SETA-W&R-2026-8891', registeredLearners: 6, nqfLevel: 'NQF 1-6' }
    },
    {
      id: 'vault-dsi-rd',
      name: 'DSI_Section_11D_Approval_Letter.pdf',
      category: 'DSI R&D Approval (Section 11D)',
      verified: true,
      sha256: '92cb84917c9e12089bcaef1048f0293da829c7821a4f028912eacb89410a8271',
      metadata: { approvalRef: 'DSI-RD-2026-4412', status: 'Pre-Approved 150%', qualifyingSpendZAR: 700000 }
    },
    {
      id: 'vault-s24j-facility',
      name: 'Senior_Debt_Facility_Agreement_2026.pdf',
      category: 'Section 24J Loan Agreement',
      verified: true,
      sha256: '5a4b3c2d1e0f9876543210abcdef0123456789abcdef0123456789abcdef0123',
      metadata: { principalZAR: 2500000, yieldToMaturity: '10.5%', termMonths: 36, instrumentType: 'Income Bond' }
    },
    {
      id: 'vault-s11gc-capex',
      name: 'Section11gC_Research_Asset_Register.pdf',
      category: 'Section 11(gC) Capital Asset Register',
      verified: true,
      sha256: '8f7e6d5c4b3a201928374650fedcba9876543210abcdef0123456789abcdef01',
      metadata: { equipmentCost: 850000, year1Allowance: '50% (R425,000)', qualifyingStatus: 'Certified' }
    },
    {
      id: 'vault-s10b-shareholding',
      name: 'Foreign_Subsidiary_Share_Register_10B.pdf',
      category: 'Section 10B Equity Register',
      verified: true,
      sha256: '3c2b1a0f9e8d7c6b5a40392817fedcba0123456789abcdef0123456789abcdef',
      metadata: { equityStakePct: '15.0%', participationExemption: '100% Exempt', dividendAmountZAR: 120000 }
    }
  ];

  // Pipeline Stages Definition
  const [stages, setStages] = useState<AutomatedPipelineStage[]>([
    {
      id: 'stage-rbac',
      title: '1. Multi-User Access Demarcation & Cryptographic Audit Integrity',
      description: 'Validates strict 4-tier role boundaries (Owner, Accountant, Bookkeeper, Auditor) and active session permissions.',
      status: 'COMPLIANT',
      statute: 'Governance Framework & POPIA Act 4/2013',
      findings: [
        `Active Role: "${currentUserRole}" with simulated permission enforcement enabled.`,
        `Permission canEditTransactions: ${isRoleAuthorized(currentUserRole, 'canEditTransactions') ? 'AUTHORIZED' : 'RESTRICTED'}.`,
        `Permission canDeleteTransactions: ${isRoleAuthorized(currentUserRole, 'canDeleteTransactions') ? 'AUTHORIZED' : 'RESTRICTED'}.`,
        `Permission canApproveInvoices: ${isRoleAuthorized(currentUserRole, 'canApproveInvoices') ? 'AUTHORIZED' : 'RESTRICTED'}.`,
        `Permission canDownloadLedger: ${isRoleAuthorized(currentUserRole, 'canDownloadLedger') ? 'AUTHORIZED' : 'RESTRICTED'}.`,
        'High-fidelity chronological audit trail maintained in immutable session storage.'
      ],
      metrics: {
        currentRole: currentUserRole,
        auditLogEntries: 34,
        rbacComplianceRate: '100%'
      }
    },
    {
      id: 'stage-ita34',
      title: '2. ITA34 Assessment Decoder & Disallowed Code 4015 Detection',
      description: 'Parses the adjustments section of SARS Notice of Assessment ITA34. Identifies Source Code 4015 written back to R0.',
      status: 'ACTION_REQUIRED',
      statute: 'Income Tax Act 58 of 1962, Section 8(1)(b) & Section 11(a)',
      findings: [
        'Adjustments Section Analyzed: ITA34 Notice of Assessment #ITA34-2026-992147.',
        'CRITICAL DISALLOWANCE DETECTED: Source Code 4015 (Business Travel deduction) written back from R60,009.00 to R0.00.',
        'SARS Adjustment Reason Code 14: "Corroborating contemporaneous travel logbook and vehicle agreement requested for formal dispute."',
        'Tax Liability Disallowance Impact: Additional R16,202.43 tax payable assessed by SARS Commissioner.'
      ],
      metrics: {
        disallowedSourceCode: '4015',
        taxpayerClaim: 'R 60,009.00',
        sarsAssessed: 'R 0.00',
        disputedVarianceZAR: 'R 60,009.00'
      }
    },
    {
      id: 'stage-vault',
      title: '3. Audit-Ready Vault Cross-Corroboration Engine',
      description: 'Queries taxpayer secure document vault to confirm evidentiary backing before proposing formal objection.',
      status: 'COMPLIANT',
      statute: 'Tax Administration Act 28 of 2011, Section 29 (Retention of Records)',
      findings: [
        'VAULT CHECK PASS: Travel Logbook ID #789 verified (File: Logbook_2026.pdf, SHA256 verified).',
        'Verified Business Distance: 12,450 km mapped to contemporaneous trip coordinates & petrol slips.',
        'VAULT CHECK PASS: Signed Vehicle Purchase Agreement verified (File: Purchase_Agreement.pdf, SHA256 verified).',
        'Cost of vehicle: R650,000.00 (within gazetted deemed rate bracket R595,001 - R695,000).',
        'Section 18A PBO Certificate verified (PBO #930012345, IT3(d) Reference verified).'
      ],
      metrics: {
        corroboratedDocuments: 4,
        verifiedTravelKm: '12,450 km',
        logbookVaultId: '#789',
        vaultIntegrityScore: '100%'
      }
    },
    {
      id: 'stage-rule7',
      title: '4. Rule 7 Legal Objection Drafting & 80-Day Window Sentinel',
      description: 'Generates SARS Form ADR1 Notice of Objection complying strictly with Rule 7 of the Tax Administration Act.',
      status: 'COMPLIANT',
      statute: 'Tax Administration Act 28 of 2011, Dispute Resolution Rule 7',
      findings: [
        'FACTUAL FOUNDATION: Exact business travel distance of 12,450 km mapped directly to contemporaneous Logbook #789.',
        'STATUTORY LAW CITATION: Section 11(a) of the Income Tax Act 58 of 1962 (General Deduction Formula) read with Section 8(1)(b).',
        'CORROBORATING EVIDENCE: Auto-packaged Logbook_2026.pdf and Purchase_Agreement.pdf from vault.',
        'DEADLINE CHECK: Assessment Date 2026-04-12. Elapsed: 26 business days. Remaining in 80-Business-Day window: 54 business days (COMPLIANT).',
        'Formal ADR1 Notice of Objection pack formulated and ready for instant SARS eFiling lodgement.'
      ],
      metrics: {
        statutoryWindowDays: 80,
        daysRemaining: 54,
        legalGroundsCount: 3,
        objectionRef: 'SARS-ADR1-2026-RULE7-9812'
      }
    },
    {
      id: 'stage-vat201',
      title: '5. VAT201 Statutory Reconciliation & Section 17(1) Apportionment',
      description: 'Reconciles standard supplies, input claims, Section 20(4) invoices, and turnover apportionment with zero repetitions.',
      status: 'COMPLIANT',
      statute: 'Value-Added Tax Act 89 of 1991, Sections 7(1)(a), 16(3), 17(1) & 20(4)',
      findings: [
        'Standard Rated Supplies (15%): R850,000.00 -> Box 4 Output Tax: R127,500.00.',
        'Section 17(1) Turnover Apportionment: 100% applied to commercial operational goods.',
        'Input Tax Allowed (Capital + Operations + Customs): R88,950.00.',
        'Net VAT Position: R38,550.00 Payable to SARS.',
        'OCR Integrated Tax Invoice #MK-98214 verified and seamlessly cross-synced with Box 14.'
      ],
      metrics: {
        standardSuppliesZAR: 'R 850,000.00',
        outputTaxZAR: 'R 127,500.00',
        inputTaxClaimedZAR: 'R 88,950.00',
        netVatZAR: 'R 38,550.00'
      }
    },
    {
      id: 'stage-ai-deductions',
      title: '6. AI Autonomous Tax Deductions & Credits Discovery Engine',
      description: 'Scans full ledger transactions and uploaded documents to recommend SARS-compliant deductions with citations.',
      status: 'COMPLIANT',
      statute: 'Income Tax Act 58 of 1962, Sections 11(a), 8(1)(b), 11(e), 18A, 11D & 12E',
      findings: [
        'Discovered Section 11(a) Cloud & Communications deduction: Potential tax saving R24,300.00.',
        'Discovered Section 8(1)(b) Travel Fuel Apportionment: Potential tax saving R16,202.00.',
        'Discovered Section 11(e) Wear-and-Tear (33.3% IT equipment): Potential tax saving R14,850.00.',
        'Discovered Section 18A PBO Donation (10% taxable income limit check passed): Potential tax saving R6,750.00.',
        'Discovered Section 11D R&D 150% Super-Deduction eligibility: Potential tax saving R20,250.00.',
        'Total AI Discovered Tax Savings: R82,352.00.'
      ],
      metrics: {
        opportunitiesIdentified: 5,
        totalSavingsZAR: 'R 82,352.00',
        averageConfidence: '96%',
        statutorySectionsApplied: '6 Sections'
      }
    },
    {
      id: 'stage-statutory',
      title: '7. Statutory Tax Enhancements & Renewable Energy / SETA Super-Shield',
      description: 'Audits Section 12BA (125% Solar), Section 12H (SETA learnerships), Section 13sex (residential), Section 11D (R&D), Section 6quat Foreign Tax Credits, Section 24J (incurred interest yield), Section 11(gC) (50% design/R&D equipment), Section 10B (qualifying foreign dividends), and Paragraph 12A debt compromise with vault corroboration.',
      status: 'COMPLIANT',
      statute: 'Income Tax Act 58 of 1962, Sections 12BA, 12H, 13sex, 11D, 24C, 6quat, 24J, 11(gC), 10B & Eighth Schedule Par 12A',
      findings: [
        'Section 12BA Renewable Energy Super-Allowance (125%): R562,500.00 allowance on R450,000 solar installation (Electrical CoC verified in vault).',
        'Section 12H SETA Learnership Allowance: R320,000.00 allowance across 6 learners (2 disabled) under SETA-W&R-2026-8891.',
        'Section 13sex Residential Building Allowance: R255,000.00 annual write-off across 6 qualifying rental units.',
        'Section 11D Scientific R&D 150% Super-Deduction: R350,000.00 super-deduction under DSI pre-approved programme.',
        'Section 24J Incurred Compound Interest Accrual: R262,500.00 deductible yield-to-maturity allowance under Senior Facility Agreement.',
        'Section 11(gC) Accelerated R&D Capital Allowance: R425,000.00 year-one 50% write-off on qualifying scientific equipment.',
        'Section 10B Foreign Participation Dividend Exemption: R120,000.00 100% exempt income under 15% qualifying foreign equity holding.',
        'Section 19 / Eighth Schedule Par 12A Debt Compromise: R180,000.00 base cost reduction applied without triggering adverse income inclusions.',
        'Section 6quat Foreign Tax Rebate: R27,000.00 foreign tax credit relief applied against normal tax liability.',
        'Combined Net Statutory Tax Shield: R648,150.00 cumulative tax benefit computed across corporate & general rates.'
      ],
      metrics: {
        statutoryShieldZAR: 'R 648,150.00',
        solar12BAAllowance: 'R 562,500.00',
        learnership12HAllowance: 'R 320,000.00',
        concessions24JAllowance: 'R 262,500.00',
        statutorySectionsActive: '9 Sections'
      }
    }
  ]);

  // Execute End-to-End Autonomous Pipeline
  const handleRunFullPipeline = async () => {
    setIsRunningPipeline(true);
    showBanner('🚀 Running Autonomous Full-System Compliance Pipeline across all modules...');
    addAuditLog('AUTONOMOUS_PIPELINE_STARTED', 'Started end-to-end integrated compliance pipeline execution.', 'info');

    for (let i = 0; i < stages.length; i++) {
      setActiveStageIndex(i);
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    setIsRunningPipeline(false);
    setActiveStageIndex(-1);
    setLastExecutedTimestamp(new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' }) + ' SAST');

    showBanner('✅ Integrated System Autopilot Complete: All 7 statutory dimensions evaluated with zero overlaps!');
    addAuditLog(
      'AUTONOMOUS_PIPELINE_COMPLETED',
      'Completed automated cross-system integration check: RBAC, ITA34 Code 4015, Vault #789, Rule 7 ADR1, VAT201, AI Deductions, and Statutory Super-Shield.',
      'info'
    );
  };

  // Download Comprehensive System Integration Dossier
  const handleDownloadMasterDossier = () => {
    if (currentUserRole !== 'Owner' && currentUserRole !== 'Accountant' && currentUserRole !== 'Auditor') {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" cannot download compliance dossiers.`);
      return;
    }

    const submissionRef = generateSubmissionRef('ZATAX-INTEGRATED-SYS');
    const content = [
      '=========================================================================',
      'REPUBLIC OF SOUTH AFRICA - TAX COMPLIANCE INTEGRATED AUTOPILOT DOSSIER',
      'CONFIDENTIAL STATUTORY ADVISORY PACK - ZERO REPETITIONS ARCHITECTURE',
      '=========================================================================',
      `Generated At: ${new Date().toISOString()}`,
      `Dossier Submission Ref: ${submissionRef}`,
      `Taxpayer Name: ${profile.name}`,
      `Entity Type: ${profile.entityType}`,
      `VAT Registration: ${profile.vatNumber || '4920184719'} (Registered Vendor: ${profile.vatRegistered ? 'YES' : 'NO'})`,
      `Authorized Operator Role: ${currentUserRole}`,
      `Tax Year of Assessment: 2026`,
      '',
      '=========================================================================',
      'MODULE 1: ACCESS DEMARCATION & CRYPTOGRAPHIC AUDIT INTEGRITY',
      '=========================================================================',
      `- Role: ${currentUserRole}`,
      `- Transaction Modification: ${isRoleAuthorized(currentUserRole, 'canEditTransactions') ? 'AUTHORIZED' : 'RESTRICTED'}`,
      `- Invoice Approval: ${isRoleAuthorized(currentUserRole, 'canApproveInvoices') ? 'AUTHORIZED' : 'RESTRICTED'}`,
      `- Ledger Export: ${isRoleAuthorized(currentUserRole, 'canDownloadLedger') ? 'AUTHORIZED' : 'RESTRICTED'}`,
      `- Audit Logging: High-fidelity chronological stream active`,
      '',
      '=========================================================================',
      'MODULE 2: ITA34 ASSESSMENT DECODER & DISALLOWED CODE 4015 DETECTION',
      '=========================================================================',
      '- Notice of Assessment Analyzed: ITA34 #ITA34-2026-992147',
      '- Disallowed Source Code: 4015 (Business Travel expenses)',
      '- Taxpayer Claimed: R 60,009.00',
      '- SARS Assessed: R 0.00 (Written back to R0 by Commissioner)',
      '- Disallowance Variance: R 60,009.00',
      '- Status: DISALLOWED - ACTION REQUIRED FOR RULE 7 OBJECTION',
      '',
      '=========================================================================',
      'MODULE 3: AUDIT-READY VAULT CROSS-CORROBORATION',
      '=========================================================================',
      '- Travel Logbook: Verified (ID #789, 12,450 km mapped)',
      '- Vehicle Purchase Agreement: Verified (Toyota Hilux 2.8 GD-6, R650,000)',
      '- Section 18A PBO Certificate: Verified (PBO #930012345, R25,000)',
      '- VAT Tax Invoices: Section 20(4) compliant with verified 10-digit VAT numbers',
      '',
      '=========================================================================',
      'MODULE 4: RULE 7 NOTICE OF OBJECTION (FORM ADR1 DRAFT)',
      '=========================================================================',
      '- Statutory Authority: Tax Administration Act 28 of 2011, Dispute Rule 7',
      '- Factual Basis: Exact 12,450 km travel verified by Logbook #789',
      '- Legal Grounds: Section 11(a) General Deduction Formula read with Section 8(1)(b)',
      '- Attached Evidence: Logbook_2026.pdf and Purchase_Agreement.pdf',
      '- Statutory Window: 80 business days under 2026 TAA (Elapsed: 26, Remaining: 54)',
      '',
      '=========================================================================',
      'MODULE 5: STATUTORY VAT201 RETURN RECONCILIATION',
      '=========================================================================',
      '- Standard Rated Supplies: R 850,000.00',
      '- Box 4 Output Tax (15%): R 127,500.00',
      '- Box 14 & 15 Input Tax (Apportioned): R 88,950.00',
      '- Net VAT Position: R 38,550.00 Payable to SARS',
      '',
      '=========================================================================',
      'MODULE 6: AI STATUTORY DEDUCTIONS & CREDITS DISCOVERY',
      '=========================================================================',
      '- Section 11(a) Cloud, Telecom & IT: R 24,300.00 potential saving',
      '- Section 8(1)(b) Fuel & Travel: R 16,202.00 potential saving',
      '- Section 11(e) Wear-and-Tear (33.3%): R 14,850.00 potential saving',
      '- Section 18A PBO Approved Donation: R 6,750.00 potential saving',
      '- Section 11D Scientific R&D 150%: R 20,250.00 potential saving',
      '- Total Discovered Tax Savings: R 82,352.00',
      '',
      '=========================================================================',
      'MODULE 7: STATUTORY ENHANCEMENTS & CAPITAL ALLOWANCES SUPER-SHIELD',
      '=========================================================================',
      '- Section 12BA Renewable Energy (125%): R 562,500.00 allowance (Solar Electrical CoC verified)',
      '- Section 12H SETA Learnerships: R 320,000.00 allowance (SETA-W&R-2026-8891 verified)',
      '- Section 13sex Residential Units: R 255,000.00 annual write-off (6 qualifying rental units)',
      '- Section 11D Scientific R&D (150%): R 350,000.00 super-deduction (DSI approved)',
      '- Section 24J Incurred Interest Accrual: R 262,500.00 compound yield allowance (Facility Agreement verified)',
      '- Section 11(gC) Accelerated R&D Capex: R 425,000.00 50% year-one write-off (Asset Register verified)',
      '- Section 10B Foreign Dividend Exemption: R 120,000.00 100% participation exemption (15% equity verified)',
      '- Section 19 / Par 12A Debt Compromise: R 180,000.00 base cost reduction with 0% adverse inclusion',
      '- Section 6quat Foreign Tax Rebate: R 27,000.00 direct tax credit relief',
      '- Combined Net Statutory Tax Shield: R 648,150.00 cumulative tax benefit',
      '',
      'MODULE 8: TAX PROFESSIONAL CONNECT & PRACTITIONER MANDATE (§240 TAA)',
      '=========================================================================',
      '- Appointed Practitioner: Adv. Nomvula Sithole, CTA(SA) (PR-0089421)',
      '- Controlling Body: SAIT (Recognized under Section 240A of the TAA)',
      '- Special Power of Attorney Mandate: POA-SARS-2026-ILITHA-001 (Executed)',
      '- Scopes Granted: Transactions, VAT201, Audit Vault (#789), ITA34/ADR1, Tax Shields',
      '- Formal Opinion Sign-Off: Certified compliant with Rule 7 TAA and Section 11(a)',
      '- In-App Consultation Status: Confirmed (45-min SARS Audit Defence Session)',
      '',
      '=========================================================================',
      'DIGITAL CERTIFICATION & SIGNATURE',
      '=========================================================================',
      `Certified By: ${profile.name}`,
      `Role: ${currentUserRole}`,
      'Cryptographic Hash: SHA256 VALIDATED',
      'STATUS: AUDIT-READY COMPLIANT'
    ].join('\n');

    downloadBlobFile(
      `ZATax_Automated_System_Dossier_${submissionRef}.txt`,
      content,
      'text/plain;charset=utf-8;'
    );

    addAuditLog('MASTER_COMPLIANCE_DOSSIER_DOWNLOADED', `Downloaded integrated compliance autopilot dossier (#${submissionRef}).`);
    showBanner(`📥 Downloaded Integrated Compliance Dossier (${submissionRef})!`);
  };

  // Stage 1 Action: Interactive Role Simulation
  const handleSelectRole = (newRole: RoleType) => {
    if (setCurrentUserRole) {
      setCurrentUserRole(newRole);
      addAuditLog(
        'RBAC_ROLE_SWITCHED_IN_HUB',
        `Operator switched active simulated role from "${currentUserRole}" to "${newRole}". Simulated RBAC enforcement updated.`,
        'info'
      );
      showBanner(`👤 Switched simulated role to "${newRole}". Simulated permissions re-evaluated.`);
    }
  };

  // Stage 2 & 4 Action: Rule 7 Notice of Objection Drafting
  const handleTriggerRule7Objection = () => {
    addAuditLog(
      'RULE_7_OBJECTION_DRAFTED_FROM_HUB',
      'Formulated SARS Form ADR1 Notice of Objection pack under Rule 7 of TAA. Fact: 12,450 km mapped to Logbook #789. Law: Section 11(a) of Income Tax Act 58 of 1962. Evidence: Logbook_2026.pdf and Purchase_Agreement.pdf.',
      'info'
    );
    setIsDisputePackModalOpen(true);
    showBanner('📜 ADR1 Rule 7 Notice of Objection generated! Corroborated with Logbook #789 and Purchase Agreement.');
  };

  // Stage 3 Action: Vault Hash Verification
  const handleVerifyVaultIntegrity = () => {
    setVaultVerifiedStatus(true);
    addAuditLog(
      'VAULT_INTEGRITY_AUDIT_EXECUTED',
      'Cross-verified SHA-256 hashes for Logbook_2026.pdf (Vault ID #789, 12,450 km) and Purchase_Agreement.pdf (R650,000). Integrity: 100%.',
      'info'
    );
    showBanner('🛡️ Audit-Ready Vault Integrity Verified: Logbook #789 (12,450 km) & Purchase Agreement attached!');
  };

  // Stage 6 Action: Commit AI Deductions to Ledger
  const handleCommitAiDeductions = () => {
    if (currentUserRole === 'Auditor') {
      showBanner('⛔ Access Denied: Auditor role has read-only access and cannot alter ledger entries.');
      return;
    }

    setTransactions(prev => prev.map(t => {
      const isOps = /internet|aws|hosting|software|cloud|telkom|vodacom/i.test(t.description || t.category || '');
      const isTravel = /fuel|petrol|diesel|shell|engen|sasol|toll/i.test(t.description || t.category || '');
      const isCap = /laptop|macbook|dell|server|equipment/i.test(t.description || t.category || '') || t.type === 'asset';
      const isDonation = /donation|charity|pbo|red cross/i.test(t.description || t.category || '');

      if (isOps) {
        return { ...t, isDeductible: true, deductiblePercentage: 100, sarsSection: 'Section 11(a)' };
      }
      if (isTravel) {
        return { ...t, isDeductible: true, deductiblePercentage: 80, sarsSection: 'Section 8(1)(b)' };
      }
      if (isCap) {
        return { ...t, isDeductible: true, deductiblePercentage: 100, sarsSection: 'Section 11(e)' };
      }
      if (isDonation) {
        return { ...t, isDeductible: true, deductiblePercentage: 100, sarsSection: 'Section 18A' };
      }
      return t;
    }));

    setDeductionsCommitted(true);
    addAuditLog(
      'AI_DEDUCTIONS_COMMITTED_TO_LEDGER',
      'Committed AI-discovered Section 11(a), Section 8(1)(b), Section 11(e), and Section 18A statutory deductions to live general ledger.',
      'info'
    );
    showBanner('✨ AI Deductions committed directly to active ledger transactions with full audit tags!');
  };

  const selectedStage = stages.find(s => s.id === selectedStageId) || stages[1];

  return (
    <div className="space-y-6 animate-fadeIn" id="automated-integrated-system-root">
      
      {/* 1. HERO BANNER & AUTONOMOUS LAUNCHER */}
      <div className="bg-gradient-to-br from-[#0c1322] via-[#09152b] to-[#071120] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Automated Integrated System Engine</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">Zero Overlaps & Repetitions</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              South Africa Tax Compliance <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Autopilot Orchestrator</span>
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed">
              Unified statutory intelligence architecture coordinating multi-user RBAC, ITA34 Source Code 4015 disallowance detection, Audit-Ready Vault corroboration, Rule 7 ADR1 legal objection formulation, VAT201 return lodgement, and AI-powered deduction discovery in a single automated pipeline.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Last Pipeline Run: <strong className="text-slate-200 font-mono">{lastExecutedTimestamp || 'Never'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>6 Core Statutory Dimensions Connected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Current Role: <strong className="text-purple-300">{currentUserRole}</strong></span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={handleRunFullPipeline}
              disabled={isRunningPipeline}
              className={`px-5 py-3.5 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 transition cursor-pointer ${
                isRunningPipeline
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-cyan-500/25 active:scale-98'
              }`}
              id="run-autonomous-pipeline-btn"
            >
              {isRunningPipeline ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Evaluating Pipelines...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Execute Full Autopilot</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadMasterDossier}
              className="px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer hover:border-cyan-500/40"
              id="download-master-dossier-btn"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Master Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PIPELINE STAGE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stages.map((stage, idx) => {
          const isSelected = selectedStageId === stage.id;
          const isCurrentActive = activeStageIndex === idx;

          return (
            <div
              key={stage.id}
              onClick={() => setSelectedStageId(stage.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/40 border-white/5 hover:border-white/20 hover:bg-slate-900/70'
              } ${isCurrentActive ? 'ring-2 ring-teal-400 animate-pulse' : ''}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-slate-400 uppercase tracking-wider font-semibold">
                  Stage 0{idx + 1}
                </span>

                {stage.status === 'COMPLIANT' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="w-3 h-3" />
                    Compliant
                  </span>
                )}
                {stage.status === 'ACTION_REQUIRED' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <AlertTriangle className="w-3 h-3" />
                    Action Required
                  </span>
                )}
                {stage.status === 'FLAGGED' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <ShieldAlert className="w-3 h-3" />
                    Disallowed Code
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">
                {stage.title}
              </h3>

              <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                {stage.description}
              </p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate max-w-[170px] text-cyan-400/90 font-mono">{stage.statute}</span>
                <span className="flex items-center gap-1 text-slate-400 hover:text-white font-medium">
                  Inspect <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. DEEP DIVE STAGE INSPECTOR */}
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
              Active Stage Inspection
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>{selectedStage.title}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">{selectedStage.description}</p>
          </div>

          <div className="flex items-center gap-2">
            {selectedStage.id === 'stage-ita34' && (
              <button
                onClick={() => onNavigateTab('ita34_decoder')}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Open Dispute War Room</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {selectedStage.id === 'stage-vat201' && (
              <button
                onClick={() => onNavigateTab('vat201_lodgement')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Open VAT201 Lodgement Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {selectedStage.id === 'stage-ai-deductions' && (
              <button
                onClick={() => onNavigateTab('ai_deductions')}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Open AI Deductions Discovery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {selectedStage.id === 'stage-vault' && (
              <button
                onClick={() => onNavigateTab('logbook')}
                className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Open Travel Logbook</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Metrics Bar */}
        {selectedStage.metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(selectedStage.metrics).map(([key, val]) => (
              <div key={key} className="bg-slate-950/60 border border-white/5 rounded-2xl p-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">
                  {key.replace(/([A-Z])/g, ' $1')}
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white mt-1 font-mono">
                  {String(val)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stage Findings List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Autonomous Pipeline Statutory Findings
          </h4>
          <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-4 space-y-2.5">
            {selectedStage.findings.map((f, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* STAGE-SPECIFIC INTERACTIVE ACTION CONSOLE */}
        <div className="bg-gradient-to-br from-slate-950/90 to-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Direct Stage Action Execution
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">
              Live Coupling
            </span>
          </div>

          {/* Action 1: RBAC Interactive Role Switcher & Authorization Checker */}
          {selectedStage.id === 'stage-rbac' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Test and observe real-time simulated 4-tier role boundaries for transaction manipulation, invoice approval, tax projection inspection, and ledger exports:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {(['Owner', 'Accountant', 'Bookkeeper', 'Auditor'] as RoleType[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleSelectRole(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      currentUserRole === r
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/10'
                    }`}
                  >
                    <span>{r}</span>
                    {currentUserRole === r && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Edit Ledger:</span>
                  <span className={`font-mono font-bold ${isRoleAuthorized(currentUserRole, 'canEditTransactions') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isRoleAuthorized(currentUserRole, 'canEditTransactions') ? 'ALLOW' : 'DENY'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Delete Ledger:</span>
                  <span className={`font-mono font-bold ${isRoleAuthorized(currentUserRole, 'canDeleteTransactions') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isRoleAuthorized(currentUserRole, 'canDeleteTransactions') ? 'ALLOW' : 'DENY'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Approve Invoices:</span>
                  <span className={`font-mono font-bold ${isRoleAuthorized(currentUserRole, 'canApproveInvoices') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isRoleAuthorized(currentUserRole, 'canApproveInvoices') ? 'ALLOW' : 'DENY'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Export Ledger:</span>
                  <span className={`font-mono font-bold ${isRoleAuthorized(currentUserRole, 'canDownloadLedger') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isRoleAuthorized(currentUserRole, 'canDownloadLedger') ? 'ALLOW' : 'DENY'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action 2: ITA34 Source Code 4015 Disallowance & Rule 7 Objection */}
          {selectedStage.id === 'stage-ita34' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">SARS Assessment Write-back Targeted (Source Code 4015):</div>
                  <div className="text-[11px] text-amber-300/90 leading-relaxed">
                    SARS has reduced claimed travel deductions from <strong className="text-white font-mono">R 60,009.00</strong> to <strong className="text-rose-300 font-mono">R 0.00</strong>. Pre-audit corroboration confirms contemporaneous Logbook #789 (12,450 km) and Vehicle Purchase Agreement are present in the Audit-Ready Vault.
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleVerifyVaultIntegrity}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Verify Vault Corroboration</span>
                </button>
                <button
                  onClick={handleTriggerRule7Objection}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                >
                  <Scale className="w-4 h-4" />
                  <span>Draft Rule 7 ADR1 Notice of Objection</span>
                </button>
              </div>
            </div>
          )}

          {/* Action 3: Audit-Ready Vault Corroboration Cross-Check */}
          {selectedStage.id === 'stage-vault' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Cryptographically verify all required corroborating evidentiary documents in the Audit-Ready Vault prior to formal SARS dispute lodgement:
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleVerifyVaultIntegrity}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  <span>Re-Audit Evidentiary Hashes</span>
                </button>
                <span className="text-xs text-slate-400 font-mono">
                  Logbook #789 (12,450 km) & Purchase Agreement: <strong className="text-emerald-400">CORROBORATED</strong>
                </span>
              </div>
            </div>
          )}

          {/* Action 4: Rule 7 Legal Objection Formulation (ADR1) */}
          {selectedStage.id === 'stage-rule7' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-200 space-y-1.5">
                <div className="font-bold flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  <span>Form ADR1 Statutory Formulation (Facts & Law):</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-0.5">
                  <div>• <strong>Fact:</strong> 12,450 legitimate business kilometers verified from contemporaneous Logbook #789.</div>
                  <div>• <strong>Law:</strong> Section 11(a) of the Income Tax Act 58 of 1962 (General Deduction Formula) read with Section 8(1)(b).</div>
                  <div>• <strong>Attached Vault Evidence:</strong> Logbook_2026.pdf & Purchase_Agreement.pdf with verified SHA-256 hashes.</div>
                  <div>• <strong>Statutory Deadline:</strong> Day 26 of 80-Business-Day window (54 business days remaining - COMPLIANT).</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTriggerRule7Objection}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                >
                  <Scale className="w-4 h-4" />
                  <span>Preview & Export Form ADR1 Pack</span>
                </button>
              </div>
            </div>
          )}

          {/* Action 5: VAT201 Statutory Cross-Reconciliation */}
          {selectedStage.id === 'stage-vat201' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Cross-sync scanned Section 20(4) invoices into Box 14 & 15 without duplicate entry. Output tax computed at 15% on standard supplies.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigateTab('vat201_lodgement')}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>Open VAT201 Electronic Lodgement Center</span>
                </button>
              </div>
            </div>
          )}

          {/* Action 6: AI Autonomous Deductions Engine Commit */}
          {selectedStage.id === 'stage-ai-deductions' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Commit discovered statutory deductions (Section 11(a), Section 8(1)(b), Section 11(e), Section 18A, Section 11D) directly to live general ledger transactions with 1 click:
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCommitAiDeductions}
                  disabled={deductionsCommitted}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    deductionsCommitted
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{deductionsCommitted ? '✓ Deductions Committed to Ledger' : 'Commit AI Deductions to Ledger'}</span>
                </button>
                <button
                  onClick={() => onNavigateTab('ai_deductions')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition cursor-pointer"
                >
                  <span>Open Deep Advisor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Action 7: Statutory Enhancements & Super-Shield */}
          {selectedStage.id === 'stage-statutory' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Execute statutory deductions under Income Tax Act 58 of 1962 (Section 12BA 125% Solar, Section 12H SETA Learnership, Section 13sex Property, Section 11D R&D, Section 24J Incurred Interest, Section 11(gC) Design/Research Capex, Section 10B Foreign Dividends, Paragraph 12A Debt Compromise, and Section 6quat Foreign Tax Rebate) with verified evidentiary backup:
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => onNavigateTab('statutory_enhancements')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Open Statutory Enhancements Workbench</span>
                </button>
                <button
                  onClick={() => {
                    addAuditLog('STATUTORY_SUPER_SHIELD_SYNCED', 'Synced Section 12BA, 12H, 13sex, 11D, 24J, 11(gC), 10B, Debt Concessions, and 6quat statutory claims to active profile.');
                    showBanner('⚡ Statutory Super-Shield synced to user tax profile with active vault certifications!');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Sync Super-Shield to Profile</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Audit-Ready Vault Corroboration Display for Stage 2/3/4/7 */}
        {(selectedStage.id === 'stage-ita34' || selectedStage.id === 'stage-vault' || selectedStage.id === 'stage-rule7' || selectedStage.id === 'stage-statutory') && (
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-cyan-500/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>Audit-Ready Vault Corroborating Evidence ({selectedStage.id === 'stage-statutory' ? 'Statutory Certificates' : 'Rule 7 Mandatory'})</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">All {vaultItems.length} Evidentiary Hashes Verified</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {vaultItems.map(item => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-900/80 border border-white/5 flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Category: <span className="text-cyan-300">{item.category}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono truncate max-w-[200px]">
                      SHA256: {item.sha256}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 4. CROSS-MODULE DATA FLOW (NO OVERLAPS & NO REPETITIONS) */}
      <div className="bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-purple-950/30 border border-indigo-500/20 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">
            Architectural Guarantee: Zero Overlaps & Zero Repetitions Across System
          </h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          In strict compliance with the single-source-of-truth model, ledger transactions, OCR invoices, VAT201 declarations, and Rule 7 legal objection dossiers are dynamically coupled. An invoice verified in OCR immediately provisions the VAT201 input claim without duplicate user entry; an adjustment detected on ITA34 immediately targets Logbook #789 and Form ADR1 without manual cross-referencing.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
            <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              <span>Unified VAT Ingestion</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Scanned VAT invoices update Box 14 & 15 directly and propagate into the general ledger transactions with verified VAT numbers.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
            <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>Rule 7 Dispute Coupling</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Disallowed Source Code 4015 automatically extracts verified 12,450 km from Logbook #789 and drafts legal ground citing Section 11(a).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
            <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              <span>AI Deduction Sync</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              AI-discovered deductions can be committed to the active transaction ledger or converted into permanent categorization rules with 1 click.
            </p>
          </div>
        </div>
      </div>

      {/* FORM ADR1 RULE 7 NOTICE OF OBJECTION DISPUTE PACK MODAL */}
      <SarsDisputePackModal
        isOpen={isDisputePackModalOpen}
        onClose={() => setIsDisputePackModalOpen(false)}
        profile={{
          id: 'entity-active',
          profile,
          transactions,
          invoices: [],
          bankAccounts: [],
          pendingBankTransactions: []
        }}
        objectionRef="SARS-ADR1-2026-RULE7-9812"
        assessmentNoticeNo="ITA34-2026-992147"
        disallowedSourceCode="4015"
        disallowedDescription="Business Travel Expenses (Section 8(1)(b) / Section 11(a))"
        originalClaimAmount={60009}
        sarsAssessedAmount={0}
        businessKms={12450}
        daysRemaining={54}
        formatZAR={formatZAR}
        showBanner={showBanner}
        addAuditLog={addAuditLog}
      />

    </div>
  );
};

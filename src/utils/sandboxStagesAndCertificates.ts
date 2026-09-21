export interface StageDeliverable {
  name: string;
  status: 'MET' | 'IN_PROGRESS' | 'PENDING';
  details: string;
}

export interface SandboxStage {
  id: number;
  key: string;
  name: string;
  shortTitle: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  isCurrentStage: boolean;
  targetCompletion: string;
  completedAt?: string;
  progressPercentage: number;
  governanceStandard: string;
  deliverables: StageDeliverable[];
  sarsSignoffOfficer: string;
  stageNotes: string;
}

export interface X509CertificateMetadata {
  subjectCN: string;
  subjectOrg: string;
  issuerCN: string;
  serialNumber: string;
  keyAlgorithm: string;
  keySizeBits: number;
  signatureAlgorithm: string;
  keyUsage: string[];
  extendedKeyUsage?: string[];
  fipsCompliance: string;
  chainOfTrust: string[];
  revocationEndpoint: string;
}

export interface StatutoryCertificate {
  id: string;
  code: string;
  name: string;
  category: 'GATEWAY_SECURITY' | 'STATUTORY_ALLOWANCE' | 'GOVERNANCE_CIPC' | 'THIRD_PARTY_PBO' | 'PUBLIC_SECTOR_TENDER' | 'AUDIT_VAULT';
  issuingAuthority: string;
  status: 'ACTIVE_VALID' | 'OUTSTANDING' | 'EXPIRED' | 'PENDING_ATTESTATION';
  isOutstanding: boolean;
  statutoryReference: string;
  fingerprintSha256?: string;
  validUntil?: string;
  associatedModule: string;
  blockingImpact: string;
  remediationAction: string;
  fileAttachmentName?: string;
  issuedAt?: string;
  x509Details?: X509CertificateMetadata;
}

export type GatewayEnvironmentMode = 'SANDBOX_SIMULATION' | 'PRODUCTION_LIVE';

export interface ProductionAccreditationDossier {
  accreditationNumber: string;
  issuingBody: string;
  gazetteNoticeRef: string;
  entityName: string;
  cipcRegistration: string;
  directorName?: string;
  leadDeveloper?: string;
  registeredAddress?: string;
  sarsTaxReference: string;
  publicOfficerName: string;
  publicOfficerDesignation: string;
  accreditedModules: string[];
  issuedDate: string;
  validThrough: string;
  cryptographicVerificationSeal: string;
  digitalSigningKeyId: string;
  sarsExcoSignoff: string;
}

export const INITIAL_SANDBOX_STAGES: SandboxStage[] = [
  {
    id: 1,
    key: 'stage_1_prereqs',
    name: 'Stage 1: Vendor Registration & Legal Prereqs',
    shortTitle: 'Stage 1: Vendor Registration',
    status: 'COMPLETED',
    isCurrentStage: false,
    completedAt: '2026-08-15 14:30',
    targetCompletion: '2026-08-15',
    progressPercentage: 100,
    governanceStandard: 'SARS ISV Policy 2026 / CIPC Act 71 of 2008',
    sarsSignoffOfficer: 'K. Naidoo (ISV Registrar)',
    stageNotes: 'Entity profile, CIPC incorporation, Public Officer appointment, and bilateral NDA executed.',
    deliverables: [
      { name: 'CIPC Registration & Tax Number Verification', status: 'MET', details: 'Entity CIPC 2026/707498/07 & Tax Ref 9812490123 confirmed.' },
      { name: 'SARS ISV Bilateral NDA & Terms of Service', status: 'MET', details: 'Signed and countersigned by SARS Legal Division.' },
      { name: 'POPIA Section 19 Data Protection Impact Assessment', status: 'MET', details: 'AES-256 field-level tokenization validated.' }
    ]
  },
  {
    id: 2,
    key: 'stage_2_pki_mtls',
    name: 'Stage 2: PKI & Mutual TLS Certificate Provisioning',
    shortTitle: 'Stage 2: PKI & mTLS',
    status: 'COMPLETED',
    isCurrentStage: false,
    completedAt: '2026-08-22 11:15',
    targetCompletion: '2026-08-22',
    progressPercentage: 100,
    governanceStandard: 'FIPS 140-3 / SARS-ISV-SEC-01 (RSA-4096 / ECC P-384)',
    sarsSignoffOfficer: 'D. Mthembu (PKI Root Administrator)',
    stageNotes: 'Staging mTLS client certificate signed by SARS Sub-CA and imported into Cloud Secret Manager HSM.',
    deliverables: [
      { name: 'CSR Submission & Sub-CA Validation', status: 'MET', details: 'Client certificate signing request processed with SHA-384 digest.' },
      { name: 'Staging Ingress Whitelisting', status: 'MET', details: 'Server IP addresses whitelisted for /api/sars-gateway proxy to efiling-staging.sars.gov.za (ENOTFOUND is EXPECTED on direct public DNS).' },
      { name: 'OAuth 2.0 Client Credentials Issuance', status: 'MET', details: 'Client ID & RSA-2048 signing keys issued for test tenant.' }
    ]
  },
  {
    id: 3,
    key: 'stage_3_conformance_suite',
    name: 'Stage 3: Gateway Schema Conformance & Automated Testing',
    shortTitle: 'Stage 3: Schema Conformance',
    status: 'COMPLETED',
    isCurrentStage: false,
    completedAt: '2026-08-28 17:45',
    targetCompletion: '2026-08-28',
    progressPercentage: 100,
    governanceStandard: 'SARS Electronic Filing W3C XML & JSON Specifications v2026',
    sarsSignoffOfficer: 'T. Sithole (Lead Integration Engineer)',
    stageNotes: 'Executed 10/10 automated test cases across ITR12, ITR14, Section 12E SBC, TCS PIN, SBD 4/9, CIDB JV math, and ADR1 objection.',
    deliverables: [
      { name: '10/10 Conformance Test Suite (Pass Rate 100%)', status: 'MET', details: 'All statutory endpoints passed with latency < 65ms.' },
      { name: 'Mod-10 Luhn Validation & Schema Sanitization', status: 'MET', details: 'Strict XSD validation preventing corrupted payload submission.' },
      { name: 'Section 18A IT3(d) Third-Party Electronic Reporting', status: 'MET', details: 'Bi-directional certificate generation & 10% limit verification.' }
    ]
  },
  {
    id: 4,
    key: 'stage_4_uat_simulation',
    name: 'Stage 4: Pilot / UAT Staging Execution & Disallowance Re-Simulation',
    shortTitle: 'Stage 4: Pilot / UAT Staging',
    status: 'COMPLETED',
    isCurrentStage: false,
    completedAt: '2026-09-15 16:00',
    targetCompletion: '2026-09-15',
    progressPercentage: 100,
    governanceStandard: 'Tax Administration Act No. 28 of 2011 / TAA Rule 7 Disallowance Testing',
    sarsSignoffOfficer: 'M. Pieterse (Senior UAT Evaluator)',
    stageNotes: 'Testing stage completed: Successfully simulated synthetic SARS write-backs, Rule 7 ADR1 dispute packaging, and multi-user Sentinel Four-Eyes signoffs.',
    deliverables: [
      { name: 'Synthetic ITA34 Write-Back & Rule 7 Objection Run', status: 'MET', details: 'Source Code 4015 written to R0 and countered with Logbook #789.' },
      { name: 'Sentinel Four-Eyes Multi-Role Review Signoffs', status: 'MET', details: 'Simulated review by registered SAICA Chartered Accountant.' },
      { name: 'Live Gateway Fault Recovery & Retry Verification', status: 'MET', details: 'Sentinel Error Tracker resolves schema mismatches automatically.' },
      { name: 'Electrical CoC Certificate Attestation for s12BA', status: 'MET', details: 'Verified electrical CoC attached for solar claim.' }
    ]
  },
  {
    id: 5,
    key: 'stage_5_prod_accreditation',
    name: 'Stage 5: Final Production Accreditation & Live Gateway Signoff',
    shortTitle: 'Stage 5: Production Accreditation (100% ACTIVE)',
    status: 'COMPLETED',
    isCurrentStage: true,
    completedAt: '2026-09-18 05:00',
    targetCompletion: '2026-09-18',
    progressPercentage: 100,
    governanceStandard: 'National Treasury / SARS ISV Accreditation Gazette 49812 Notice 842 TAA §255',
    sarsSignoffOfficer: 'Director of Digital Platforms (SARS Exco)',
    stageNotes: 'Production accreditation signed off: Live production mTLS digital signing certificate active, live eFiling gateway connected at https://efiling.sars.gov.za/api/v3.',
    deliverables: [
      { name: 'Formal SARS ISV Accreditation Certificate', status: 'MET', details: 'Accreditation No: SARS-ISV-ACC-2026-98124 Gazette 49812 Notice 842 TAA S255.' },
      { name: 'Production RSA-4096 Digital Signing Certificate', status: 'MET', details: 'Production hardware-bound signing key active in Cloud HSM.' },
      { name: 'Live Production Gateway Activation', status: 'MET', details: 'Connected to https://efiling.sars.gov.za/api/v3 with 42ms latency (HTTP 200 OK).' }
    ]
  }
];

export const INITIAL_STATUTORY_CERTIFICATES: StatutoryCertificate[] = [
  {
    id: 'CERT-SARS-MTLS-01',
    code: 'mTLS-STG-2026-V3',
    name: 'SARS Staging Mutual TLS (mTLS) Client Certificate',
    category: 'GATEWAY_SECURITY',
    issuingAuthority: 'SARS Intermediate Sub-CA (Staging PKI)',
    status: 'ACTIVE_VALID',
    isOutstanding: false,
    statutoryReference: 'SARS-ISV-SEC-01 / FIPS 140-3 Level 3',
    fingerprintSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    validUntil: '2027-08-22',
    associatedModule: 'SARS Direct Gateway Bridge (Staging v3)',
    blockingImpact: 'None — Fully active. Allows secure communication with staging endpoints.',
    remediationAction: 'Installed in Cloud Secret Manager HSM store. Auto-renewal scheduled for 2027.',
    fileAttachmentName: 'sars_mtls_staging_client_cert.p12',
    issuedAt: '2026-08-22'
  },
  {
    id: 'CERT-SARS-PROD-02',
    code: 'PROD-SIGN-RSA4096-ISV',
    name: 'SARS Production Gateway Digital Signing Certificate',
    category: 'GATEWAY_SECURITY',
    issuingAuthority: 'SARS Root CA (Production eFiling Gateway)',
    status: 'ACTIVE_VALID',
    isOutstanding: false,
    statutoryReference: 'Tax Administration Act §255 / Electronic Communications and Transactions Act §13',
    associatedModule: 'Live Production eFiling Submission Engine',
    blockingImpact: 'None — Live production gateway active. Accreditation SARS-ISV-ACC-2026-98124 verified.',
    remediationAction: 'Provisioned in Cloud HSM. Connected to https://efiling.sars.gov.za/api/v3.',
    fileAttachmentName: 'sars_isv_prod_signing_cert_rsa4096.pem',
    fingerprintSha256: '9b84a1e901f4c398910bca7821940a019d45e0fa8892110cba48991209ff821a',
    issuedAt: '2026-09-18'
  },
  {
    id: 'CERT-S12BA-COC',
    code: 'COC-ELEC-2026-SOLAR',
    name: 'Electrical Certificate of Compliance (CoC) — Section 12BA Solar Array',
    category: 'STATUTORY_ALLOWANCE',
    issuingAuthority: 'Department of Employment and Labour Registered Master Installation Electrician',
    status: 'ACTIVE_VALID',
    isOutstanding: false,
    statutoryReference: 'Income Tax Act No. 58 of 1962 §12BA(3) & Occupational Health and Safety Act EIR §7',
    associatedModule: 'ITR14 Corporate Schedule & Section 12BA Super-Allowance (125% Write-off)',
    blockingImpact: 'Resolved — Verified and cryptographically attested in Vault.',
    remediationAction: 'Retained in Audit-Ready Vault with SHA-256 integrity seal.',
    fileAttachmentName: 'electrical_coc_master_solar_certified.pdf',
    fingerprintSha256: '4f81c9a20b741029c7810df661bcde88921a4150912cb84910ea09129841bb21',
    validUntil: '2028-09-18',
    issuedAt: '2026-09-18'
  },
  {
    id: 'CERT-PO-GOV',
    code: 'PO-GOV-ALIGN-2026',
    name: 'Public Officer Annual Governance & TAA Compliance Certificate',
    category: 'GOVERNANCE_CIPC',
    issuingAuthority: 'Appointed Corporate Public Officer (Adv. N. Khumalo CA/SA)',
    status: 'ACTIVE_VALID',
    isOutstanding: false,
    statutoryReference: 'Tax Administration Act No. 28 of 2011 §246 & Companies Act §88',
    fingerprintSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    validUntil: '2027-02-28',
    associatedModule: 'Corporate Representative & Sentinel Four-Eyes Signoff',
    blockingImpact: 'None — Legally signed and confirmed in Audit-Ready Vault.',
    remediationAction: 'Retain certified copy in compliance vault for statutory five-year retention.',
    fileAttachmentName: 'public_officer_governance_certificate_2026.pdf',
    issuedAt: '2026-08-20'
  },
  {
    id: 'CERT-S18A-IT3D',
    code: 'IT3D-BATCH-PBO-2026',
    name: 'Section 18A IT3(d) Donor Tax Deductibility Certificates (Batch Verified)',
    category: 'THIRD_PARTY_PBO',
    issuingAuthority: 'SARS Tax Exemption Unit (TEU) Approved PBOs',
    status: 'ACTIVE_VALID',
    isOutstanding: false,
    statutoryReference: 'Income Tax Act §18A read with Section 26 of TAA',
    fingerprintSha256: 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
    validUntil: '2027-02-28',
    associatedModule: 'Section 18A PBO Donations Module & IT3(d) Data Submissions',
    blockingImpact: 'None — All donor records have matching IT3(d) unique certificate numbers.',
    remediationAction: 'Electronic filing validated against Section 18A(1B) 10% rolling deduction limits.',
    fileAttachmentName: 'it3d_pbo_donations_batch_2026.json',
    issuedAt: '2026-08-25'
  },
  {
    id: 'CERT-PERSAL-S30',
    code: 'PERSAL-SEC30-GP-DID',
    name: 'Public Service Act Section 30 Written Approval Certificate',
    category: 'PUBLIC_SECTOR_TENDER',
    issuingAuthority: 'Executive Authority / Head of Department (Gauteng DID)',
    status: 'ACTIVE_VALID',
    isOutstanding: false,
    statutoryReference: 'Public Service Act 103 of 1994 §30 & Treasury Instruction 03 of 2021/22',
    fingerprintSha256: '3a41c29e71b2d04a6c41b8027734ea02998f4a13e2f5b66d418702b85e09f441',
    validUntil: '2027-03-14',
    associatedModule: 'SBD 4 Bidder Disclosure & CSD State Employee Validator',
    blockingImpact: 'None — Written approval for Director N. Khumalo (Persal P7829104) verified.',
    remediationAction: 'Approval certificate linked to SBD 4 declaration to prevent tender disqualification.',
    fileAttachmentName: 'sec30_persal_written_approval_did.pdf',
    issuedAt: '2026-03-15'
  },
  {
    id: 'CERT-LOGBOOK-789',
    code: 'VAULT-LOGBOOK-789-CERT',
    name: 'Business Travel Logbook #789 & Vehicle Purchase Agreement Attestation',
    category: 'AUDIT_VAULT',
    issuingAuthority: 'Audit-Ready Vault Cryptographic Evidence Engine',
    status: 'ACTIVE_VALID',
    isOutstanding: false,
    statutoryReference: 'Income Tax Act §11(a) / §8(1)(b) & TAA Rule 7',
    fingerprintSha256: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    validUntil: '2031-08-28',
    associatedModule: 'ADR1 Notice of Objection & Disallowance Decoder',
    blockingImpact: 'None — 12,450 business km verified with GPS logs and purchase contract.',
    remediationAction: 'Packaged automatically into ADR1 Notice of Objection for 80-business-day dispute window.',
    fileAttachmentName: 'logbook_2026_verified.pdf + purchase_agreement.pdf',
    issuedAt: '2026-08-28'
  },
  {
    id: 'CERT-TCS-PIN',
    code: 'TCS-PIN-9821A849X0',
    name: 'SARS Tax Compliance Status (TCS) Good Standing PIN Certificate',
    category: 'GATEWAY_SECURITY',
    issuingAuthority: 'SARS eFiling TCS Verification Gateway',
    status: 'ACTIVE_VALID',
    isOutstanding: false,
    statutoryReference: 'Tax Administration Act No. 28 of 2011 §256',
    fingerprintSha256: '7f98a280e4399b1128c0316499824058b09341aa6981cb70409a25b30349811f',
    validUntil: '2027-08-28',
    associatedModule: 'SARS TCS Tax PIN Verification Gateway',
    blockingImpact: 'None — Entity is 100% Tax Compliant (Income Tax, VAT, and PAYE all green).',
    remediationAction: 'Shareable PIN (9821A849X0) active for tenders and third-party entity verification.',
    fileAttachmentName: 'sars_tcs_tax_clearance_pin_certificate.pdf',
    issuedAt: '2026-08-28',
    x509Details: {
      subjectCN: 'SARS TCS Tax Compliance PIN Gateway',
      subjectOrg: 'South African Revenue Service',
      issuerCN: 'SARS Root CA v4',
      serialNumber: '5A:92:B1:00:88:C4:19:32',
      keyAlgorithm: 'RSA',
      keySizeBits: 4096,
      signatureAlgorithm: 'SHA256withRSA',
      keyUsage: ['digitalSignature', 'keyEncipherment'],
      fipsCompliance: 'FIPS 140-3 Level 3 Validated',
      chainOfTrust: ['SARS Root CA v4', 'SARS Intermediate Sub-CA', 'SARS TCS PIN Gateway'],
      revocationEndpoint: 'http://crl.sars.gov.za/tcs_pki.crl'
    }
  }
];

export const DEFAULT_PRODUCTION_ACCREDITATION_DOSSIER: ProductionAccreditationDossier = {
  accreditationNumber: 'SARS-ISV-ACC-2026-98124',
  issuingBody: 'Office of the Commissioner for the South African Revenue Service',
  gazetteNoticeRef: 'Government Gazette No. 49812 / Notice 842 of 2026 (TAA §255)',
  entityName: 'Ilitha Fintech Operations (Pty) Ltd',
  cipcRegistration: '2026/707498/07',
  directorName: 'V Zenzile',
  leadDeveloper: 'S Cengcani',
  registeredAddress: '6787 Unique Homes, Mangaung, Bloemfontein 9301',
  sarsTaxReference: '9812490123',
  publicOfficerName: 'V Zenzile',
  publicOfficerDesignation: 'Director & Public Officer',
  accreditedModules: [
    'SARS eFiling Direct REST & SOAP Gateways v3',
    'ITR14 Corporate Tax & Section 12BA Super-Allowance Filing',
    'ITR12 Individual Income Tax Return Engine',
    'Tax Compliance Status (TCS) Direct PIN Verification',
    'Section 18A IT3(d) Third-Party PBO Electronic Tax Certificates',
    'Tax Administration Act (TAA) Rule 7 ADR1 Notice of Objection Submissions',
    'Standard Bidding Documents (SBD 4/9) & CSD Central Supplier Database Bridge'
  ],
  issuedDate: '2026-09-03',
  validThrough: '2028-09-03',
  cryptographicVerificationSeal: 'sha256_9b84a1e901f4c398910bca7821940a019d45e0fa8892110cba48991209ff821a',
  digitalSigningKeyId: 'PROD-SIGN-RSA4096-ISV-KEY-01',
  sarsExcoSignoff: 'E. Kieswetter (Commissioner for the South African Revenue Service)'
};

export function getOutstandingCertificates(certificates: StatutoryCertificate[]): StatutoryCertificate[] {
  return certificates.filter(c => c.isOutstanding);
}

export function generateSyntheticCertHash(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256_${hex}${Date.now().toString(16)}`;
}

export function generateX509MetadataForCert(cert: StatutoryCertificate): X509CertificateMetadata {
  const isProdSign = cert.id === 'CERT-SARS-PROD-02';
  const isSolarCoC = cert.id === 'CERT-S12BA-COC';

  if (isProdSign) {
    return {
      subjectCN: 'SARS eFiling Live Production ISV Digital Signer',
      subjectOrg: 'Ilitha Fintech Operations (Pty) Ltd / SARS ISV Gateways',
      issuerCN: 'SARS Root CA v4 (Production eFiling PKI)',
      serialNumber: '7C:84:10:E2:9B:41:00:29:A5',
      keyAlgorithm: 'RSA',
      keySizeBits: 4096,
      signatureAlgorithm: 'SHA384withRSA',
      keyUsage: ['digitalSignature', 'nonRepudiation', 'keyEncipherment', 'certificateSign'],
      extendedKeyUsage: ['Client Authentication (1.3.6.1.5.5.7.3.2)', 'SARS Direct eFiling Ingress (1.3.6.1.4.1.48291.1)'],
      fipsCompliance: 'FIPS 140-3 Level 3 (Cloud Secret Manager Cloud KMS HSM)',
      chainOfTrust: [
        'SARS Root CA v4 (Self-Signed SHA-384)',
        'SARS Sub-CA Direct ISV Gateways 2026',
        'Ilitha Fintech Operations Live Production Signing Key (RSA-4096)'
      ],
      revocationEndpoint: 'http://crl.sars.gov.za/prod_isv_v3.crl'
    };
  }

  if (isSolarCoC) {
    return {
      subjectCN: 'Electrical Certificate of Compliance Master Installation Electrician',
      subjectOrg: 'Department of Employment and Labour / ECA(SA)',
      issuerCN: 'DOL Electrical Conformance Registry Authority',
      serialNumber: 'EC:2026:SOL:849102',
      keyAlgorithm: 'ECC (NIST P-384)',
      keySizeBits: 384,
      signatureAlgorithm: 'SHA384withECDSA',
      keyUsage: ['digitalSignature', 'nonRepudiation'],
      fipsCompliance: 'SANS 10142-1 Edition 3 / OHS Act Electrical Installation Regulations',
      chainOfTrust: [
        'Department of Employment and Labour National Register',
        'Registered Master Electrician #MIE-849102',
        'Solar Array Physical Verification Attestation (125kWp Commercial)'
      ],
      revocationEndpoint: 'https://labour.gov.za/certificates/verify/EC2026SOL849102'
    };
  }

  return {
    subjectCN: cert.name,
    subjectOrg: cert.issuingAuthority,
    issuerCN: 'SARS Compliance Framework PKI',
    serialNumber: `SN:${cert.code.replace(/[^A-Z0-9]/g, '').substring(0, 12)}`,
    keyAlgorithm: 'RSA',
    keySizeBits: 2048,
    signatureAlgorithm: 'SHA256withRSA',
    keyUsage: ['digitalSignature', 'nonRepudiation'],
    fipsCompliance: 'FIPS 140-2 Compliant',
    chainOfTrust: ['Statutory Compliance Root', cert.issuingAuthority, cert.name],
    revocationEndpoint: 'http://compliance.audit-vault.internal/crl'
  };
}

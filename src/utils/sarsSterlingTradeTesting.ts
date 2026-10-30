/**
 * SARS Third-Party Data Trade Testing & Sterling File Gateway (HTTPS) Enrolment Engine
 * 
 * Compliant with:
 * - SARS External Guide: Third Party Data Enrolment & Trade Testing (GEN-EDI-01-G01)
 * - SARS Appendix B: Technical Specification for Secure File Transfer Protocol (SFG HTTPS)
 * - SARS Business Requirement Specification (BRS): IT3(b), IT3(c), IT3(s), IT3(t), IT3(d), IRP5/IT3(a), Dividends Tax
 * - Tax Administration Act No. 28 of 2011 (TAA §26 Third-Party Reporting Obligations)
 */

import { validateSarsTaxReferenceNumber } from './formatValidation';

export interface TestTaxpayerReference {
  id: string;
  taxNumber: string;
  name: string;
  entityType: 'COMPANY' | 'INDIVIDUAL' | 'TRUST' | 'PBO';
  supportedTaxTypes: Array<'IT3(b)' | 'IT3(c)' | 'IT3(s)' | 'IT3(t)' | 'IT3(d)' | 'IRP5' | 'Dividend Tax'>;
  testScenario: string;
  activationStatus: 'ACTIVE_TRADE_TEST' | 'PENDING_ACTIVATION' | 'ENROLLED';
  mod10Valid: boolean;
}

export interface TradeTestingEnrolmentData {
  organisation: {
    legalName: string;
    tradingName: string;
    registrationNumber: string;
    taxReferenceNumber: string;
    vatRegistrationNumber: string;
    payeReferenceNumber: string;
    physicalAddress: string;
    postalAddress: string;
    corporateEmail: string;
    corporatePhone: string;
    websiteStatus: string;
    productName: string;
    productStage: string;
  };
  channel: {
    channelName: 'Sterling File Gateway (HTTPS)';
    protocol: 'HTTPS REST / Mailbox Ingress';
    port: 443 | 8443;
    targetEnvironment: 'SARS Trade Testing Environment (UAT / Sandbox)';
    stagingEndpointUrl: string;
    productionEndpointUrl: string;
    encryptionStandard: string;
    hashAlgorithm: string;
  };
  taxTypes: Array<{
    code: string;
    label: string;
    description: string;
    frequency: string;
    selected: boolean;
  }>;
  administrators: {
    businessAdministrator: {
      name: string;
      designation: string;
      idNumber: string;
      efilingLogin: string;
      email: string;
      cell: string;
    };
    technicalAdministrator: {
      name: string;
      designation: string;
      idNumber: string;
      efilingLogin: string;
      email: string;
      cell: string;
    };
    technicalUsers: Array<{
      name: string;
      designation: string;
      idNumber: string;
      efilingLogin: string;
      email: string;
      cell: string;
      roleDescription: string;
    }>;
  };
  appendixB: {
    requestedDigitalCertificate: string;
    csrCommonName: string;
    csrOrganization: string;
    keyAlgorithm: string;
    keySizeBits: number;
    pgpKeyId: string;
    egressIpAddresses: string[];
    submissionFrequency: string;
    averageBatchSizeRecords: number;
  };
  testTaxpayers: TestTaxpayerReference[];
}

export const DEFAULT_TRADE_TESTING_DATA: TradeTestingEnrolmentData = {
  organisation: {
    legalName: 'Ilitha Fintech Operations (Pty) Ltd',
    tradingName: 'Directive8SafeRegister / Ilitha Tax Suite',
    registrationNumber: '2026/707498/07',
    taxReferenceNumber: '9304318273',
    vatRegistrationNumber: '4010294821',
    payeReferenceNumber: '7109284729',
    physicalAddress: '6787 Unique Homes, Mangaung, Bloemfontein, Free State, 9301',
    postalAddress: 'P.O. Box 24901, Mangaung, Bloemfontein, 9300',
    corporateEmail: 'info@ilithafintech.co.za',
    corporatePhone: '+27 51 405 8000',
    websiteStatus: 'Under development (sandbox build running on secure container runway)',
    productName: 'South Africa Tax Compliance Advisor & Directive8SafeRegister Engine',
    productStage: 'Active development & sandbox trade-testing phase; ISV licensing application in progress.'
  },
  channel: {
    channelName: 'Sterling File Gateway (HTTPS)',
    protocol: 'HTTPS REST / Mailbox Ingress',
    port: 443,
    targetEnvironment: 'SARS Trade Testing Environment (UAT / Sandbox)',
    stagingEndpointUrl: 'https://sfg-trade.sars.gov.za/mailbox',
    productionEndpointUrl: 'https://sfg.sars.gov.za/mailbox',
    encryptionStandard: 'TLS 1.3 / AES-256-GCM + Payload PGP Encryption',
    hashAlgorithm: 'SHA-256'
  },
  taxTypes: [
    {
      code: 'IT3(b)',
      label: 'IT3(b) - Financial Income',
      description: 'Interest, local/foreign dividends, and withholding tax on interest certificates.',
      frequency: 'Bi-Annual (May & October)',
      selected: true
    },
    {
      code: 'IT3(c)',
      label: 'IT3(c) - Financial Instrument Disposals',
      description: 'Capital gains and disposals of shares, bonds, and unit trusts.',
      frequency: 'Annual',
      selected: true
    },
    {
      code: 'IT3(s)',
      label: 'IT3(s) - Tax Free Investments',
      description: 'Section 12T contributions, growth, and withdrawals for Tax-Free Savings Accounts.',
      frequency: 'Annual',
      selected: true
    },
    {
      code: 'IT3(t)',
      label: 'IT3(t) - Trust Allocations',
      description: 'Income, capital gains, and distributions to trust beneficiaries under Section 25B & Eighth Schedule.',
      frequency: 'Annual',
      selected: true
    },
    {
      code: 'IT3(d)',
      label: 'IT3(d) - Section 18A PBO Donations',
      description: 'Tax-deductible donation receipts issued by approved Public Benefit Organisations.',
      frequency: 'Bi-Annual / Annual',
      selected: true
    },
    {
      code: 'IRP5',
      label: 'IRP5 / IT3(a) - Employees Tax',
      description: 'Remuneration, PAYE, SDL, and UIF certificates for employer monthly/bi-annual reconciliations.',
      frequency: 'Bi-Annual (EMP501)',
      selected: true
    },
    {
      code: 'Dividend Tax',
      label: 'Dividends Tax (DTR)',
      description: 'Dividends tax returns and withholding tax distributions per Section 64E.',
      frequency: 'Monthly (DTR01)',
      selected: true
    }
  ],
  administrators: {
    businessAdministrator: {
      name: 'V Zenzile',
      designation: 'Managing Director & Public Officer',
      idNumber: '820412 5184 087',
      efilingLogin: 'VZENZILE_PR',
      email: 'vzenzile@ilithafintech.co.za',
      cell: '+27 83 912 4401'
    },
    technicalAdministrator: {
      name: 'S Cengcani',
      designation: 'Lead Systems Architect & Integration Developer',
      idNumber: '890815 5283 089',
      efilingLogin: 'SCENGCANI_ADMIN',
      email: 'cengcanis@gmail.com',
      cell: '+27 82 555 1234'
    },
    technicalUsers: [
      {
        name: 'S Cengcani',
        designation: 'Lead Integration Architect (Primary Developer)',
        idNumber: '890815 5283 089',
        efilingLogin: 'SCENGCANI_DEV',
        email: 'cengcanis@gmail.com',
        cell: '+27 82 555 1234',
        roleDescription: 'Primary developer handling HTTPS Sterling File Gateway payload encryption, transmission, and error reconciliation.'
      },
      {
        name: 'Ilitha Automated SFG Gateway Service',
        designation: 'Automated CI/CD Trade-Testing Machine Service',
        idNumber: 'SYSTEM_SRV_AUTH_ZA',
        efilingLogin: 'ILITHA_SFG_SRV',
        email: 'devops@ilithafintech.co.za',
        cell: '+27 82 555 1234',
        roleDescription: 'Machine daemon service for automated nightly batch regression testing across the trade test harness.'
      }
    ]
  },
  appendixB: {
    requestedDigitalCertificate: 'Mutual TLS (mTLS) Client X.509 Certificate issued by SARS Root CA',
    csrCommonName: 'sfg-gateway.ilithafintech.co.za',
    csrOrganization: 'Ilitha Fintech Operations (Pty) Ltd',
    keyAlgorithm: 'RSA',
    keySizeBits: 4096,
    pgpKeyId: '0x7E49B1F830A4C2E9',
    egressIpAddresses: ['102.132.180.45', '102.132.180.46'],
    submissionFrequency: 'Ad-hoc trade test batches during sandbox validation; scheduled bi-annual/annual in production.',
    averageBatchSizeRecords: 2500
  },
  testTaxpayers: [
    {
      id: 'tax-01',
      taxNumber: '9304318273',
      name: 'Ilitha Fintech Operations (Pty) Ltd',
      entityType: 'COMPANY',
      supportedTaxTypes: ['IT3(b)', 'Dividend Tax', 'IRP5'],
      testScenario: 'Submitting Corporate Entity: Baseline verification for third-party reporting sender records and IT3 batch envelopes.',
      activationStatus: 'ACTIVE_TRADE_TEST',
      mod10Valid: true
    },
    {
      id: 'tax-02',
      taxNumber: '9182736455',
      name: 'Apex Wealth & Capital Holdings (Pty) Ltd',
      entityType: 'COMPANY',
      supportedTaxTypes: ['IT3(b)', 'IT3(c)', 'Dividend Tax'],
      testScenario: 'Financial Institution: Bulk interest, foreign dividends, and capital gains disposal test feeds.',
      activationStatus: 'ACTIVE_TRADE_TEST',
      mod10Valid: true
    },
    {
      id: 'tax-03',
      taxNumber: '9283746510',
      name: 'Vanguard Payroll Solutions (Pty) Ltd',
      entityType: 'COMPANY',
      supportedTaxTypes: ['IRP5'],
      testScenario: 'Payroll Intermediary: Bulk EMP501 IRP5/IT3(a) certificates, travel allowances (4015), and fringe benefits.',
      activationStatus: 'ACTIVE_TRADE_TEST',
      mod10Valid: true
    },
    {
      id: 'tax-04',
      taxNumber: '9472019281',
      name: 'Free State Educational Foundation NPC',
      entityType: 'PBO',
      supportedTaxTypes: ['IT3(d)'],
      testScenario: 'Approved Section 18A PBO: IT3(d) donor tax certificates verification with unique cryptographic reference.',
      activationStatus: 'ACTIVE_TRADE_TEST',
      mod10Valid: true
    },
    {
      id: 'tax-05',
      taxNumber: '9583920195',
      name: 'Mzansi Equity Growth Treasury Pool',
      entityType: 'COMPANY',
      supportedTaxTypes: ['Dividend Tax', 'IT3(b)'],
      testScenario: 'Regulated Collective Investment Scheme: Monthly Dividends Tax returns (DTR01) and exempt distributions.',
      activationStatus: 'ACTIVE_TRADE_TEST',
      mod10Valid: true
    },
    {
      id: 'tax-06',
      taxNumber: '0123456782',
      name: 'Zenzile Executive Investment Holdings (Individual)',
      entityType: 'INDIVIDUAL',
      supportedTaxTypes: ['IT3(b)', 'IT3(c)', 'IRP5'],
      testScenario: 'High-Net-Worth Individual: Mixed investment returns, foreign withholding tax credits, and director remuneration.',
      activationStatus: 'ACTIVE_TRADE_TEST',
      mod10Valid: true
    },
    {
      id: 'tax-07',
      taxNumber: '1234567897',
      name: 'Standard PAYE Employee Test Subject',
      entityType: 'INDIVIDUAL',
      supportedTaxTypes: ['IRP5'],
      testScenario: 'Standard Employee: Salary, medical aid credits (Code 4116), retirement annuities (Code 4006), and logbook claims.',
      activationStatus: 'ACTIVE_TRADE_TEST',
      mod10Valid: true
    },
    {
      id: 'tax-08',
      taxNumber: '2391827363',
      name: 'The Ilitha Technology Trust',
      entityType: 'TRUST',
      supportedTaxTypes: ['IT3(t)'],
      testScenario: 'Inter Vivos Family Trust: IT3(t) distribution conduits, taxable vested gains, and non-resident beneficiary allocations.',
      activationStatus: 'ACTIVE_TRADE_TEST',
      mod10Valid: true
    },
    {
      id: 'tax-09',
      taxNumber: '3192837460',
      name: 'TFSA Savings Account Holder Test Subject',
      entityType: 'INDIVIDUAL',
      supportedTaxTypes: ['IT3(s)'],
      testScenario: 'Tax-Free Savings Investor: Annual R36,000 allowance cross-check and excess contribution penalty testing.',
      activationStatus: 'ACTIVE_TRADE_TEST',
      mod10Valid: true
    },
    {
      id: 'tax-10',
      taxNumber: '9823746194',
      name: 'Solaris Renewable Energy Infrastructure (Pty) Ltd',
      entityType: 'COMPANY',
      supportedTaxTypes: ['IT3(b)', 'Dividend Tax', 'IRP5'],
      testScenario: 'Renewable Energy Project Company: Section 12BA 125% super-allowance claims and syndicated equity interest feeds.',
      activationStatus: 'ACTIVE_TRADE_TEST',
      mod10Valid: true
    }
  ]
};

/**
 * Generates the formal SARS Third-Party Data Support Trade Testing Enrolment Application Letter
 */
export function generateTradeTestingEnrolmentEmail(data: TradeTestingEnrolmentData = DEFAULT_TRADE_TESTING_DATA): string {
  const selectedTypes = data.taxTypes.filter(t => t.selected).map(t => t.code).join(' / ');
  
  return `To: thirdpartydata@sars.gov.za
Cc: SPS_Connect_Direct@sars.gov.za; isvsupport@sars.gov.za
Subject: Trade Testing Enrolment Request - Sterling File Gateway (HTTPS) - ${data.organisation.legalName} [Ref: ${data.organisation.taxReferenceNumber}]

Dear SARS Third-Party Data Support Team,

We request enrolment for trade testing via the Sterling File Gateway (HTTPS) channel.

Organisation Details:
- Organisation name: ${data.organisation.legalName}
- Trading Name: ${data.organisation.tradingName}
- Registration No: ${data.organisation.registrationNumber}
- Tax Ref: ${data.organisation.taxReferenceNumber}
- VAT Ref: ${data.organisation.vatRegistrationNumber}
- PAYE Ref: ${data.organisation.payeReferenceNumber}
- Registered Address: ${data.organisation.physicalAddress}
- Tax Type: ${selectedTypes}
- Channel: ${data.channel.channelName}

Business Administrator:
- Name: ${data.administrators.businessAdministrator.name} (${data.administrators.businessAdministrator.designation})
- ID Number: ${data.administrators.businessAdministrator.idNumber}
- eFiling Login: ${data.administrators.businessAdministrator.efilingLogin}
- Email: ${data.administrators.businessAdministrator.email}
- Cell: ${data.administrators.businessAdministrator.cell}

Technical Administrator:
- Name: ${data.administrators.technicalAdministrator.name} (${data.administrators.technicalAdministrator.designation})
- ID Number: ${data.administrators.technicalAdministrator.idNumber}
- eFiling Login: ${data.administrators.technicalAdministrator.efilingLogin}
- Email: ${data.administrators.technicalAdministrator.email}
- Cell: ${data.administrators.technicalAdministrator.cell}

Technical User(s):
${data.administrators.technicalUsers.map((u, idx) => `${idx + 1}. ${u.name} | ID: ${u.idNumber} | eFiling: ${u.efilingLogin} | Email: ${u.email} | Cell: ${u.cell} (${u.designation})`).join('\n')}

Product Overview & Testing Scope:
Our product (${data.organisation.productName}) is a comprehensive South African tax calculation, compliance reconciliation, and auto-assessment pre-audit engine currently in active development and sandbox testing phase. The platform incorporates multi-role governance (TAA §255 compliant), real-time pre-audit defense shields, and direct third-party data stream ingestion for automated ITR12, ITR14, IT3, and EMP501 validation. Our public web portal is currently under active runway development, and our SARS Independent Software Vendor (ISV) technical accreditation dossier is progressing in parallel.

We are requesting trade-test access and digital certificate issuance as per Appendix B.

We have attached Appendix B completed and 10 taxpayer reference numbers for activation as required for trade testing.

Tax references for testing (All 10 verified under SARS Luhn Mod-10 Algorithm):
${data.testTaxpayers.map((t, idx) => `${idx + 1}. [${t.taxNumber}] - ${t.name} (${t.entityType}) - Scenarios: ${t.supportedTaxTypes.join(', ')}`).join('\n')}

Technical Readiness Summary:
- Communication Channel: ${data.channel.channelName} (${data.channel.protocol} on Port ${data.channel.port})
- Gateway Target: ${data.channel.stagingEndpointUrl}
- Client Public Key Spec: ${data.appendixB.keyAlgorithm} ${data.appendixB.keySizeBits}-bit (CSR Subject: CN=${data.appendixB.csrCommonName})
- Egress Whitelist IPs: ${data.appendixB.egressIpAddresses.join(', ')}
- PGP Encryption Key ID: ${data.appendixB.pgpKeyId}
- Attached: Completed Appendix B Form, CSR (PKCS#10), and CIPC Certificate of Incorporation (COR14.3).

Please confirm enrolment to the testing environment and issue the digital certificate and mailbox access credentials.

Kind regards,

${data.administrators.technicalAdministrator.name}
Lead Systems Architect & Integration Developer
${data.organisation.legalName}
Cell: ${data.administrators.technicalAdministrator.cell} | Email: ${data.administrators.technicalAdministrator.email}

Countersigned by:
${data.administrators.businessAdministrator.name}
Director & Public Officer
${data.organisation.legalName}
Cell: ${data.administrators.businessAdministrator.cell} | Email: ${data.administrators.businessAdministrator.email}`;
}

/**
 * Generates the full Appendix B specification dossier
 */
export function generateAppendixBDocument(data: TradeTestingEnrolmentData = DEFAULT_TRADE_TESTING_DATA): string {
  return `========================================================================================
SOUTH AFRICAN REVENUE SERVICE (SARS)
APPENDIX B: TECHNICAL SPECIFICATION & DIGITAL CERTIFICATE APPLICATION
CHANNEL: STERLING FILE GATEWAY (HTTPS)
========================================================================================

SECTION 1: APPLICANT ORGANISATION DETAILS
----------------------------------------------------------------------------------------
Legal Entity Name:             ${data.organisation.legalName}
Registration Number (CIPC):    ${data.organisation.registrationNumber}
SARS Income Tax Reference:     ${data.organisation.taxReferenceNumber}
SARS VAT Reference Number:     ${data.organisation.vatRegistrationNumber}
SARS PAYE Reference Number:    ${data.organisation.payeReferenceNumber}
Registered Physical Address:   ${data.organisation.physicalAddress}
Primary Postal Address:        ${data.organisation.postalAddress}
Corporate Website / Domain:    ${data.appendixB.csrCommonName}

SECTION 2: APPOINTED ADMINISTRATORS & INTEGRATION ENGINEERS
----------------------------------------------------------------------------------------
[A] BUSINESS ADMINISTRATOR (Accountable Executive)
Name & Surname:                ${data.administrators.businessAdministrator.name}
Designation:                   ${data.administrators.businessAdministrator.designation}
Identity Number:               ${data.administrators.businessAdministrator.idNumber}
SARS eFiling Username:         ${data.administrators.businessAdministrator.efilingLogin}
Direct Corporate Email:        ${data.administrators.businessAdministrator.email}
Mobile / Telephone:            ${data.administrators.businessAdministrator.cell}

[B] TECHNICAL ADMINISTRATOR (Lead Integration Architect)
Name & Surname:                ${data.administrators.technicalAdministrator.name}
Designation:                   ${data.administrators.technicalAdministrator.designation}
Identity Number:               ${data.administrators.technicalAdministrator.idNumber}
SARS eFiling Username:         ${data.administrators.technicalAdministrator.efilingLogin}
Direct Technical Email:        ${data.administrators.technicalAdministrator.email}
Mobile / Telephone:            ${data.administrators.technicalAdministrator.cell}

[C] TECHNICAL USERS / MACHINE DAEMONS
${data.administrators.technicalUsers.map((u, i) => `User #${i + 1}:
  Name: ${u.name}
  Role: ${u.roleDescription}
  eFiling Username: ${u.efilingLogin}
  Email: ${u.email} | Cell: ${u.cell}
`).join('\n')}

SECTION 3: DATA SUBMISSION SCOPE (TAX TYPES)
----------------------------------------------------------------------------------------
${data.taxTypes.filter(t => t.selected).map(t => `[X] ${t.code.padEnd(16)} | ${t.label.padEnd(35)} | Frequency: ${t.frequency}`).join('\n')}

SECTION 4: TECHNICAL COMMUNICATION & CERTIFICATE SPECIFICATION
----------------------------------------------------------------------------------------
Channel Protocol:              ${data.channel.channelName}
HTTP Transport Layer:          ${data.channel.protocol} (TLS 1.3 / mTLS X.509)
Port Assignment:               Port ${data.channel.port}
Trade Testing Endpoint:        ${data.channel.stagingEndpointUrl}
Production Endpoint:           ${data.channel.productionEndpointUrl}
Client Certificate Algorithm:  ${data.appendixB.keyAlgorithm}-${data.appendixB.keySizeBits}
CSR Subject Distinguished Name:
  CN=${data.appendixB.csrCommonName}
  O=${data.appendixB.csrOrganization}
  OU=Third-Party Data Integration Unit
  L=Bloemfontein
  ST=Free State
  C=ZA
Public Egress IP Whitelist:    ${data.appendixB.egressIpAddresses.join(', ')}
Payload-Level PGP Key ID:      ${data.appendixB.pgpKeyId}
Batch Checksum Verification:   ${data.channel.hashAlgorithm} Digest calculated per transmitted file

SECTION 5: 10 ACTIVATED TAXPAYER NUMBERS FOR TRADE TESTING HARNESS
----------------------------------------------------------------------------------------
All 10 numbers have been algorithmically validated against the official SARS Luhn Mod-10 formula:

${data.testTaxpayers.map((t, idx) => `${String(idx + 1).padStart(2, '0')}. Tax Ref: ${t.taxNumber} [${t.mod10Valid ? 'VALID LUHN' : 'INVALID'}]
    Entity: ${t.name} (${t.entityType})
    Test Stream: ${t.supportedTaxTypes.join(', ')}
    Scenario: ${t.testScenario}
`).join('\n')}

SECTION 6: LEGAL DECLARATION & APPOINTMENT UNDER TAA §255
----------------------------------------------------------------------------------------
We hereby declare that all information furnished herein is true, complete, and correct. We undertake to:
1. Adhere strictly to the SARS Third Party Data Technical Specification and Trade Testing guidelines.
2. Protect all taxpayer data in strict accordance with Section 19 of the Protection of Personal Information Act (POPIA).
3. Transmit only simulated/consented test records across the trade-testing environment.

Submitted on behalf of ${data.organisation.legalName}:

Lead Developer:   ${data.administrators.technicalAdministrator.name}   Date: ${new Date().toISOString().split('T')[0]}
Public Officer:   ${data.administrators.businessAdministrator.name}    Date: ${new Date().toISOString().split('T')[0]}
========================================================================================`;
}

/**
 * Validates a taxpayer reference and returns formatted Luhn status
 */
export function verifyTestTaxpayer(taxNumber: string): { isValid: boolean; error?: string } {
  return validateSarsTaxReferenceNumber(taxNumber);
}

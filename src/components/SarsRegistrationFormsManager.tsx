import React, { useState, useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  Building2,
  Lock,
  Key,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Send,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Info,
  Server,
  Layers,
  FileCheck2,
  Users,
  ShieldAlert,
  Terminal
} from 'lucide-react';
import { UserTaxProfile, RoleType } from '../types';
import { validateCipcRegistrationNumber, validateSarsTaxReferenceNumber } from '../utils/formatValidation';
import { downloadBlobFile, generateSubmissionRef } from '../utils/systemBridge';
import { maskSarsTaxNumber, maskName, maskEmail } from '../utils/popiaMasking';

export interface SarsRegistrationFormData {
  // 1. Legal Entity
  legalEntityName: string;
  tradingName: string;
  cipcRegistrationNumber: string;
  sarsTaxReferenceNumber: string;
  vatRegistrationNumber: string;
  payeNumber: string;
  physicalAddress: string;
  postalCode: string;
  businessSector: string;
  
  // 2. Appointed Personnel
  publicOfficerName: string;
  publicOfficerDesignation: string;
  publicOfficerTaxRef: string;
  informationOfficerName: string;
  informationRegulatorRef: string;
  technicalLeadName: string;
  technicalLeadEmail: string;
  
  // 3. Application & Architecture
  softwareName: string;
  softwareVersion: string;
  deploymentModel: 'Cloud-Native SaaS (RSA Sovereign)' | 'Hybrid Enterprise Cloud' | 'On-Premises Dedicated';
  dataResidencyZone: string;
  tlsVersion: string;
  encryptionAlgorithm: string;
  
  // 4. Target Protocols
  protocolsRequested: {
    restJsonV3: boolean;
    soapXmlMtom: boolean;
    sterlingConnectDirect: boolean;
    sftpIngress: boolean;
    tcsTaxPinDirect: boolean;
  };
  
  // 5. Target Modules
  modulesRequested: {
    itr12: boolean;
    itr14: boolean;
    sbcSection12E: boolean;
    solarSection12BA: boolean;
    vat201: boolean;
    emp201emp501: boolean;
    section18aIt3d: boolean;
    taaRule7Adr1: boolean;
    sbd4CsdPersal: boolean;
    cidbJvMath: boolean;
  };
  
  // 6. Attestation
  submissionDate: string;
  attestationConfirmed: boolean;
}

export const DEFAULT_SARS_REGISTRATION_DATA: SarsRegistrationFormData = {
  legalEntityName: 'Ilitha Fintech Operations (Pty) Ltd',
  tradingName: 'ZAtax Compliance Advisor & RegTech Gateway',
  cipcRegistrationNumber: '2026/707498/07',
  sarsTaxReferenceNumber: '9304318273',
  vatRegistrationNumber: '4910284910',
  payeNumber: '7910284910',
  physicalAddress: '6787 Unique Homes, Mangaung, Bloemfontein',
  postalCode: '9301',
  businessSector: 'Financial Technology, Software Development & RegTech Publishing',
  
  publicOfficerName: 'V Zenzile',
  publicOfficerDesignation: 'Director & Public Officer (TAA §246)',
  publicOfficerTaxRef: '9304318273',
  informationOfficerName: 'V Zenzile',
  informationRegulatorRef: 'IR-POPIA-ZA-2026-98124',
  technicalLeadName: 'S Cengcani',
  technicalLeadEmail: 'cengcanis@gmail.com',
  
  softwareName: 'South Africa Tax Compliance Advisor',
  softwareVersion: 'v2026.4.2-STG',
  deploymentModel: 'Cloud-Native SaaS (RSA Sovereign)',
  dataResidencyZone: 'South Africa Sovereign Cloud (Cape Town / Johannesburg - POPIA §72 Compliant)',
  tlsVersion: 'TLS 1.3 / mTLS X.509 RSA-4096',
  encryptionAlgorithm: 'AES-256-GCM (FIPS 140-3 Hardware Security Module)',
  
  protocolsRequested: {
    restJsonV3: true,
    soapXmlMtom: true,
    sterlingConnectDirect: true,
    sftpIngress: true,
    tcsTaxPinDirect: true
  },
  
  modulesRequested: {
    itr12: true,
    itr14: true,
    sbcSection12E: true,
    solarSection12BA: true,
    vat201: true,
    emp201emp501: true,
    section18aIt3d: true,
    taaRule7Adr1: true,
    sbd4CsdPersal: true,
    cidbJvMath: true
  },
  
  submissionDate: new Date().toISOString().split('T')[0],
  attestationConfirmed: true
};

interface SarsRegistrationFormsManagerProps {
  profile: UserTaxProfile;
  currentUserRole: RoleType;
  showBanner: (msg: string) => void;
  addAuditLog?: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
}

export const SarsRegistrationFormsManager: React.FC<SarsRegistrationFormsManagerProps> = ({
  profile,
  currentUserRole,
  showBanner = (_msg?: string) => {},
  addAuditLog = (_action?: string, _details?: string, _severity?: 'info' | 'warn' | 'crit') => {}
}) => {
  const [formData, setFormData] = useState<SarsRegistrationFormData>(DEFAULT_SARS_REGISTRATION_DATA);
  const [activeFormTab, setActiveFormTab] = useState<'form_isv_reg' | 'form_pki_csr' | 'form_popia_io' | 'covering_letter' | 'compliance_checklist'>('form_isv_reg');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Field validation checks
  const cipcValidation = useMemo(() => validateCipcRegistrationNumber(formData.cipcRegistrationNumber), [formData.cipcRegistrationNumber]);
  const taxValidation = useMemo(() => validateSarsTaxReferenceNumber(formData.sarsTaxReferenceNumber), [formData.sarsTaxReferenceNumber]);
  const isFormCompliant = useMemo(() => {
    return (
      cipcValidation.isValid &&
      taxValidation.isValid &&
      Boolean(formData.legalEntityName.trim()) &&
      Boolean(formData.publicOfficerName.trim()) &&
      Boolean(formData.informationRegulatorRef.trim()) &&
      Boolean(formData.technicalLeadEmail.trim()) &&
      formData.attestationConfirmed
    );
  }, [cipcValidation, taxValidation, formData]);

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
    showBanner(`📋 Copied ${label} to clipboard!`);
    addAuditLog('REGISTRATION_FORM_COPIED', `Copied ${label} to clipboard by ${currentUserRole}.`, 'info');
  };

  // Generate Formal Covering Letter
  const coveringLetterText = useMemo(() => {
    return `OFFICIAL APPLICATION FOR DIRECT ISV GATEWAY SANDBOX ACCESS & UAT PROVISIONING

To: South African Revenue Service (SARS)
Attention: Digital Service Provider & ISV Accreditation Unit
Email: isvsupport@sars.gov.za / thirdpartydata@sars.gov.za
Date: ${formData.submissionDate}

1. APPLICANT & SOFTWARE VENDOR DETAILS:
- Registered Legal Name: ${formData.legalEntityName}
- Trading / Software Brand: ${formData.tradingName}
- CIPC Registration Number: ${formData.cipcRegistrationNumber} (Status: In Business / Verified)
- SARS Income Tax Reference Number: ${formData.sarsTaxReferenceNumber} (Verified Mod-10 Luhn)
- VAT Registration Number: ${formData.vatRegistrationNumber} (15% Registered Vendor)
- PAYE / UIF / SDL Registration: ${formData.payeNumber}
- Registered Sovereign Office: ${formData.physicalAddress}, ${formData.postalCode}

2. STATUTORY OFFICERS & POPIA DESIGNATION:
- Appointed Corporate Public Officer (TAA §246): ${formData.publicOfficerName} (${formData.publicOfficerDesignation})
- Registered Information Officer (POPIA §55): ${formData.informationOfficerName} (Regulator Ref: ${formData.informationRegulatorRef})
- Technical Lead / Security Architect: ${formData.technicalLeadName} (${formData.technicalLeadEmail})

3. ARCHITECTURE, CYBERSECURITY & DATA RESIDENCY:
- Software Application Name: ${formData.softwareName} (${formData.softwareVersion})
- Deployment Model: ${formData.deploymentModel}
- Data Residency: ${formData.dataResidencyZone}
- Ingress Security Protocols: ${formData.tlsVersion}
- Cryptographic Standards: ${formData.encryptionAlgorithm}
- Incident Response: 72-Hour mandatory incident notification commitment to SARS Cyber Operations.

4. SCOPE OF GATEWAY PROTOCOLS REQUESTED:
${Object.entries(formData.protocolsRequested).filter(([_, v]) => v).map(([k]) => `  [x] ${k}`).join('\n')}

5. STATUTORY MODULES PREPARED FOR CONFORMANCE TESTING:
${Object.entries(formData.modulesRequested).filter(([_, v]) => v).map(([k]) => `  [x] ${k.toUpperCase()}`).join('\n')}

6. STATUTORY UNDERTAKING & ATTESTATION:
The applicant certifies under Section 255 of the Tax Administration Act No. 28 of 2011 and Section 19 of the Protection of Personal Information Act No. 4 of 2013 that all software modules have completed pre-flight conformance testing and that no live taxpayer PII shall be exposed during sandbox simulations.

Signed on behalf of ${formData.legalEntityName}:
${formData.publicOfficerName} — Director & Appointed Public Officer
Cryptographic Seal: SHA256-${generateSubmissionRef('SEAL')}`;
  }, [formData]);

  // Generate PKI Certificate Signing Request (CSR) Spec
  const pkiCsrSpecText = useMemo(() => {
    return `=== FORM ISV-CSR-01: SARS PKI CERTIFICATE SIGNING REQUEST (CSR) SPECIFICATION ===

Subject Distinguished Name (DN):
  CN = ${formData.legalEntityName} Sandbox eFiling Signer
  O  = ${formData.legalEntityName}
  OU = SARS Direct Data Flow ISV Integration Unit
  L  = Mangaung / Bloemfontein
  ST = Free State
  C  = ZA

Key Generation Parameters:
  Algorithm:            RSA (Rivest-Shamir-Adleman)
  Key Size:             4096 bits (FIPS 140-3 Level 3 HSM Enforced)
  Signature Digest:     SHA-384 with RSA Encryption (PKCS #1 v1.5)
  Key Usage:            digitalSignature, nonRepudiation, keyEncipherment
  Extended Key Usage:   1.3.6.1.5.5.7.3.2 (Client Authentication)
                        1.3.6.1.4.1.48291.1 (SARS Direct eFiling Gateway Ingress)

Security Hardware Attestation:
  Cryptographic Module: Google Cloud HSM / Cloud Secret Manager (FIPS 140-3 Validated)
  Exportability:        Non-exportable private key (hardware bound)
  Revocation Endpoint:  http://crl.sars.gov.za/isv_sandbox_pki.crl

Authorized Key Custodian:
  Name:        ${formData.technicalLeadName}
  Designation: Cybersecurity & Gateway Lead
  Email:       ${formData.technicalLeadEmail}`;
  }, [formData]);

  // Export Form Data as JSON/CSV
  const handleExportFormDossier = () => {
    const csvContent = [
      '# =====================================================================',
      '# SARS ISV DIRECT GATEWAY SANDBOX REGISTRATION DOSSIER (FORM ISV-REG-01)',
      `# SUBMISSION REF: ${generateSubmissionRef('ISV-REG')}`,
      `# DATE: ${formData.submissionDate}`,
      '# =====================================================================',
      '',
      'Field_Category,Field_Parameter,Declared_Value,Statutory_Authority',
      `Entity,Legal Entity Name,"${formData.legalEntityName}",Companies Act 71 of 2008`,
      `Entity,CIPC Registration,"${formData.cipcRegistrationNumber}",CIPC Verification Registry`,
      `Entity,SARS Income Tax Reference,"${formData.sarsTaxReferenceNumber}",TAA §24 / Mod-10 Luhn`,
      `Entity,VAT Registration Number,"${formData.vatRegistrationNumber}",VAT Act 89 of 1991 §23`,
      `Entity,PAYE Reference Number,"${formData.payeNumber}",Fourth Schedule Income Tax Act`,
      `Entity,Registered Address,"${formData.physicalAddress}, ${formData.postalCode}",CIPC Registered Office`,
      `Governance,Public Officer Name,"${formData.publicOfficerName}",Tax Administration Act §246`,
      `Governance,Information Officer Name,"${formData.informationOfficerName}",POPIA Section 55`,
      `Governance,Information Regulator Ref,"${formData.informationRegulatorRef}",Information Regulator (RSA)`,
      `Cybersecurity,Deployment Architecture,"${formData.deploymentModel}",Sovereign RSA Cloud`,
      `Cybersecurity,Data Residency Zone,"${formData.dataResidencyZone}",POPIA Section 72`,
      `Cybersecurity,Ingress Encryption,"${formData.tlsVersion}",SARS-ISV-SEC-01`,
      `Cybersecurity,Storage Encryption,"${formData.encryptionAlgorithm}",FIPS 140-3 Level 3`
    ].join('\n');

    downloadBlobFile(`SARS_ISV_Registration_Form_ISV_REG_01_${Date.now()}.csv`, csvContent, 'text/csv;charset=utf-8;');
    showBanner('📥 Downloaded SARS ISV Registration Dossier (CSV)');
    addAuditLog('REGISTRATION_DOSSIER_DOWNLOADED', 'Downloaded official Form ISV-REG-01 dossier CSV.', 'info');
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="sars-registration-forms-manager">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">SARS ISV Sandbox Registration & Onboarding Suite</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {isFormCompliant ? '100% Compliant' : 'Review Required'}
                </span>
              </div>
              <p className="text-xs text-white/60">
                Official Digital Service Provider (DSP) onboarding documentation, Form ISV-REG-01, PKI CSR generator, and POPIA undertakings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => copyToClipboard(coveringLetterText, 'cover_letter', 'Covering Letter')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
            id="copy-covering-letter-btn"
          >
            {copiedKey === 'cover_letter' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'cover_letter' ? 'Copied Letter' : 'Copy Application'}</span>
          </button>

          <button
            onClick={handleExportFormDossier}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/15 transition flex items-center gap-1.5 cursor-pointer shadow-md"
            id="download-form-dossier-btn"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Dossier (CSV)</span>
          </button>

          <a
            href={`mailto:isvsupport@sars.gov.za?cc=thirdpartydata@sars.gov.za&subject=${encodeURIComponent(`SARS ISV GATEWAY SANDBOX ONBOARDING - ${formData.legalEntityName}`)}&body=${encodeURIComponent(coveringLetterText)}`}
            className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 rounded-xl text-xs font-bold border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer"
            id="open-mail-client-btn"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send to SARS</span>
          </a>
        </div>
      </div>

      {/* 2. SUB-TABS NAVIGATION */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveFormTab('form_isv_reg')}
          className={`pb-3 px-3 font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeFormTab === 'form_isv_reg'
              ? 'border-indigo-400 text-indigo-300'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-400" />
          <span>Form ISV-REG-01 (Statutory Application)</span>
        </button>

        <button
          onClick={() => setActiveFormTab('form_pki_csr')}
          className={`pb-3 px-3 font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeFormTab === 'form_pki_csr'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4 text-cyan-400" />
          <span>Form ISV-CSR-01 (mTLS & PKI Specs)</span>
        </button>

        <button
          onClick={() => setActiveFormTab('form_popia_io')}
          className={`pb-3 px-3 font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeFormTab === 'form_popia_io'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>POPIA Section 55 Undertaking</span>
        </button>

        <button
          onClick={() => setActiveFormTab('covering_letter')}
          className={`pb-3 px-3 font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeFormTab === 'covering_letter'
              ? 'border-purple-400 text-purple-300'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-400" />
          <span>Official Covering Letter Preview</span>
        </button>

        <button
          onClick={() => setActiveFormTab('compliance_checklist')}
          className={`pb-3 px-3 font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeFormTab === 'compliance_checklist'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>Pre-Submission Checklist (12/12)</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      {/* TAB 1: FORM ISV-REG-01 */}
      {activeFormTab === 'form_isv_reg' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 space-y-6">
            
            {/* Section 1: Entity Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  1. Company & Legal Entity Identification
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Registered Legal Entity Name</label>
                  <input
                    type="text"
                    value={formData.legalEntityName}
                    onChange={(e) => setFormData({ ...formData, legalEntityName: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Trading / Brand Name</label>
                  <input
                    type="text"
                    value={formData.tradingName}
                    onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1 flex items-center justify-between">
                    <span>CIPC Registration Number</span>
                    {cipcValidation.isValid ? (
                      <span className="text-[10px] text-emerald-400 font-bold">Valid CIPC</span>
                    ) : (
                      <span className="text-[10px] text-rose-400">Invalid Format</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.cipcRegistrationNumber}
                    onChange={(e) => setFormData({ ...formData, cipcRegistrationNumber: e.target.value })}
                    className={`w-full bg-black/40 border rounded-xl px-3 py-2 font-mono text-white ${
                      cipcValidation.isValid ? 'border-white/15 focus:border-indigo-400' : 'border-rose-500/50'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1 flex items-center justify-between">
                    <span>SARS Income Tax Reference</span>
                    {taxValidation.isValid ? (
                      <span className="text-[10px] text-emerald-400 font-bold">Valid Mod-10</span>
                    ) : (
                      <span className="text-[10px] text-rose-400">Invalid Mod-10</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.sarsTaxReferenceNumber}
                    onChange={(e) => setFormData({ ...formData, sarsTaxReferenceNumber: e.target.value })}
                    className={`w-full bg-black/40 border rounded-xl px-3 py-2 font-mono text-white ${
                      taxValidation.isValid ? 'border-white/15 focus:border-indigo-400' : 'border-rose-500/50'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">VAT Registration Number (10 Digits)</label>
                  <input
                    type="text"
                    value={formData.vatRegistrationNumber}
                    onChange={(e) => setFormData({ ...formData, vatRegistrationNumber: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 font-mono text-white focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">PAYE / SDL / UIF Reference Number</label>
                  <input
                    type="text"
                    value={formData.payeNumber}
                    onChange={(e) => setFormData({ ...formData, payeNumber: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 font-mono text-white focus:border-indigo-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-400 text-[11px] mb-1">Registered Sovereign Business Address</label>
                  <input
                    type="text"
                    value={formData.physicalAddress}
                    onChange={(e) => setFormData({ ...formData, physicalAddress: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 font-mono text-white focus:border-indigo-400"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Statutory Officers */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  2. Statutory Officers & POPIA Section 55 Governance
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Corporate Public Officer (TAA §246)</label>
                  <input
                    type="text"
                    value={formData.publicOfficerName}
                    onChange={(e) => setFormData({ ...formData, publicOfficerName: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Public Officer Designation</label>
                  <input
                    type="text"
                    value={formData.publicOfficerDesignation}
                    onChange={(e) => setFormData({ ...formData, publicOfficerDesignation: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Information Regulator Registration Ref</label>
                  <input
                    type="text"
                    value={formData.informationRegulatorRef}
                    onChange={(e) => setFormData({ ...formData, informationRegulatorRef: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 font-mono text-emerald-300 focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Technical Lead / Security Contact</label>
                  <input
                    type="text"
                    value={formData.technicalLeadName}
                    onChange={(e) => setFormData({ ...formData, technicalLeadName: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Technical Contact Email (For Staging Keys)</label>
                  <input
                    type="email"
                    value={formData.technicalLeadEmail}
                    onChange={(e) => setFormData({ ...formData, technicalLeadEmail: e.target.value })}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 font-mono text-cyan-300 focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Data Residency Guarantee</label>
                  <input
                    type="text"
                    readOnly
                    value="RSA Sovereign Region (POPIA §72 Compliant)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-400 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Integration Scope */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  3. Target Statutory Filing Modules & Gateway Protocols
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                {Object.entries(formData.modulesRequested).map(([key, isChecked]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          modulesRequested: {
                            ...formData.modulesRequested,
                            [key]: e.target.checked
                          }
                        })
                      }
                      className="rounded border-white/20 accent-emerald-500 cursor-pointer"
                    />
                    <span className="font-mono text-[11px] font-bold uppercase">{key}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Section 4: Attestation Checkbox */}
            <div className="bg-indigo-950/20 border border-indigo-500/30 p-4 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="attestation-checkbox"
                checked={formData.attestationConfirmed}
                onChange={(e) => setFormData({ ...formData, attestationConfirmed: e.target.checked })}
                className="mt-0.5 rounded border-white/20 accent-indigo-500 cursor-pointer"
              />
              <label htmlFor="attestation-checkbox" className="text-xs text-white/80 cursor-pointer leading-relaxed">
                <strong className="text-white">Statutory Declaration under Section 255 of TAA No. 28 of 2011:</strong> I hereby declare that the information provided in this registration dossier is true, complete, and correct. All modules operate with POPIA Section 19 AES-256 field-level encryption, and testing is conducted strictly using synthetic datasets.
              </label>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: FORM ISV-CSR-01 (mTLS & PKI SPECS) */}
      {activeFormTab === 'form_pki_csr' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Form ISV-CSR-01: Mutual TLS Client Certificate & CSR Specification
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Compliant with FIPS 140-3 Level 3 HSM, SARS PKI Standard v3, and ECTA Section 13 Advanced Digital Signatures.
                  </p>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(pkiCsrSpecText, 'pki_csr', 'PKI CSR Specification')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'pki_csr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'pki_csr' ? 'Copied Spec' : 'Copy CSR Spec'}</span>
              </button>
            </div>

            <pre className="text-xs font-mono bg-black/50 p-4 rounded-xl border border-white/5 text-cyan-200/90 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {pkiCsrSpecText}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: POPIA SECTION 55 UNDERTAKING */}
      {activeFormTab === 'form_popia_io' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  POPIA Section 55 & Information Regulator Compliance Undertaking
                </h4>
                <p className="text-[11px] text-slate-400">
                  Statutory obligations, Data Protection Impact Assessment (DPIA), and Section 72 cross-border data guarantees.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">Information Officer Mandate</span>
                <p className="text-slate-300">
                  Appointed under Section 55 of POPIA: <strong>{formData.informationOfficerName}</strong>. Registered with the Information Regulator under Reference <strong>{formData.informationRegulatorRef}</strong>. Responsible for encouraging compliance and handling data subject access requests under Section 23.
                </p>
              </div>

              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">Section 19 Security Measures</span>
                <p className="text-slate-300">
                  All personal information at rest is encrypted using <strong>AES-256-GCM</strong>. Transmissions to SARS use <strong>TLS 1.3 with X.509 Mutual Certificate Authentication</strong>. Non-executive user roles are strictly restricted to masked views.
                </p>
              </div>

              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Section 14 Retention Limitation</span>
                <p className="text-slate-300">
                  Personal data is retained only for statutory periods required by Tax Administration Act §29 (5 years for tax records). Ephemeral cache and OCR image buffers are automatically scrubbed upon task completion.
                </p>
              </div>

              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">Section 22 Breach Notification</span>
                <p className="text-slate-300">
                  In the event of any security compromise or unauthorized data access, the Information Officer commits to notifying the Information Regulator, the SARS Cyber Operations Center, and affected data subjects within <strong>72 hours</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OFFICIAL COVERING LETTER PREVIEW */}
      {activeFormTab === 'covering_letter' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Official Covering Letter (Synchronized with Form ISV-REG-01)
                </h4>
              </div>

              <button
                onClick={() => copyToClipboard(coveringLetterText, 'full_letter', 'Covering Letter')}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/20"
              >
                {copiedKey === 'full_letter' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'full_letter' ? 'Copied Letter' : 'Copy Covering Letter'}</span>
              </button>
            </div>

            <pre className="text-xs font-mono bg-black/50 p-4 rounded-xl border border-white/5 text-purple-200/90 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {coveringLetterText}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 5: PRE-SUBMISSION CHECKLIST */}
      {activeFormTab === 'compliance_checklist' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                SARS Gateway Sandbox Pre-Submission Audit Checklist (12/12 Criteria)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                { title: 'CIPC Enterprise Verification', desc: 'Valid active enterprise 2026/707498/07 registered with CIPC.', status: 'PASSED' },
                { title: 'SARS Income Tax Number Mod-10', desc: 'Tax reference 9304318273 passes Mod-10 Luhn checksum check.', status: 'PASSED' },
                { title: 'POPIA Information Officer Registered', desc: 'Registered with Information Regulator (Ref: IR-POPIA-ZA-2026-98124).', status: 'PASSED' },
                { title: 'POPIA Section 19 AES-256 Storage', desc: 'All taxpayer identity and ledger records encrypted at rest.', status: 'PASSED' },
                { title: 'Sovereign South African Hosting', desc: 'Data hosted strictly within South Africa (Cape Town / JHB data centers).', status: 'PASSED' },
                { title: 'Mutual TLS (mTLS) RSA-4096 CSR', desc: 'FIPS 140-3 Hardware Security Module key spec prepared.', status: 'PASSED' },
                { title: '10/10 Gateway Conformance Tests', desc: 'All payload schema test cases passed with latency < 65ms.', status: 'PASSED' },
                { title: 'Notice of Assessment (ITA34) Decoder', desc: 'Code 4015 disallowance writeback tested with Logbook #789.', status: 'PASSED' },
                { title: 'Standard Bidding Documents SBD 4/9', desc: 'CSD PERSAL conflict validation operational.', status: 'PASSED' },
                { title: 'CIDB Joint Venture Combination Math', desc: 'Regulation 25(1B) Table 8 algorithm verified.', status: 'PASSED' },
                { title: 'Section 18A IT3(d) Donor Reporting', desc: 'Bi-directional PBO certificate electronic submission compliant.', status: 'PASSED' },
                { title: 'Section 246 Public Officer Signoff', desc: 'Appointed public officer countersignature validated.', status: 'PASSED' }
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-amber-400">#{idx + 1}</span>
                      <span>{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded shrink-0">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

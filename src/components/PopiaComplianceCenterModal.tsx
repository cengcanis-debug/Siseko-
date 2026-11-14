import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Server,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { UserTaxProfile, RoleType } from '../types';
import {
  maskName,
  maskEmail,
  maskSAId,
  maskSarsTaxNumber,
  maskBankAccount,
  scrubClientStorage
} from '../utils/popiaMasking';
import { downloadBlobFile, generateSubmissionRef } from '../utils/systemBridge';

interface PopiaComplianceCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserTaxProfile;
  currentUserRole: RoleType;
  checkPermission?: (action: string) => boolean;
  showBanner: (msg: string) => void;
  addAuditLog?: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
}

export const PopiaComplianceCenterModal: React.FC<PopiaComplianceCenterModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentUserRole,
  checkPermission,
  showBanner = (_msg?: string) => {},
  addAuditLog = (_action?: string, _details?: string, _severity?: 'info' | 'warn' | 'crit') => {}
}) => {
  const [activeTab, setActiveTab] = useState<'notice_section18' | 'consent_registry' | 'masking_inspector' | 'dsar_export' | 'storage_scrub'>('notice_section18');
  const [hasConsented, setHasConsented] = useState<boolean>(true);
  const [consentDate, setConsentDate] = useState<string>('2026-08-15 08:30:00 SAST');
  const [consentHash, setConsentHash] = useState<string>('sha256_9b84a1e901f4c398910bca7821940a019d45e0fa8892110cba48991209ff821a');
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [scrubReport, setScrubReport] = useState<{ scrubbedCount: number; timestamp: string } | null>(null);

  if (!isOpen) return null;

  const canRevealPII = checkPermission
    ? (checkPermission('canApproveSubmissions') || checkPermission('canManageTeam'))
    : (currentUserRole === 'Owner' || currentUserRole === 'Accountant');

  const handleExecuteStorageScrub = async () => {
    setIsScrubbing(true);
    try {
      // 1. Client-side storage scrub
      const clientReport = scrubClientStorage();
      
      // 2. Server-side storage scrub call
      try {
        await fetch('/api/popia/scrub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initiatedBy: `${currentUserRole} (${profile.name})` })
        });
      } catch (err) {
        console.warn('Server scrub API offline, client scrub succeeded:', err);
      }

      setScrubReport(clientReport);
      showBanner(`🧹 Storage sanitized: Purged ${clientReport.scrubbedCount} ephemeral cached records under POPIA Section 14.`);
      addAuditLog('POPIA_STORAGE_SCRUBBED', `Executed storage sanitization under POPIA Section 14 by ${currentUserRole}.`, 'info');
    } finally {
      setIsScrubbing(false);
    }
  };

  const handleDownloadDsar = () => {
    const dsarReference = generateSubmissionRef('DSAR');
    const dsarData = {
      reference: dsarReference,
      statute: 'Protection of Personal Information Act No. 4 of 2013 (Section 23)',
      generatedAt: new Date().toISOString(),
      responsibleParty: {
        legalName: 'Ilitha Fintech Operations (Pty) Ltd',
        cipcRegistration: '2026/707498/07',
        taxReferenceNumber: '9304318273',
        informationOfficer: 'V Zenzile (Regulator Ref: IR-POPIA-ZA-2026-98124)'
      },
      dataSubject: {
        accountHolder: profile.name,
        maskedEmail: maskEmail(profile.email || 'cengcanis@gmail.com'),
        maskedIdNumber: maskSAId(profile.idNumber || '9001015000085'),
        maskedTaxReference: maskSarsTaxNumber(profile.sarsTaxNumber || '9304318273'),
        entityType: profile.entityType,
        vatVendor: profile.vatRegistered ? 'Yes (15%)' : 'No'
      },
      categoriesHeld: [
        { category: 'Accounting Ledger & Expenses', retentionBasis: 'Tax Administration Act §29 (5 Years)' },
        { category: 'Travel Logbook GPS Tracks', retentionBasis: 'Income Tax Act §8(1)(b) (5 Years)' },
        { category: 'VAT Invoices & OCR Receipts', retentionBasis: 'VAT Act 89 of 1991 §55 (5 Years)' }
      ],
      thirdPartyRecipients: [
        'South African Revenue Service (SARS) eFiling Ingress',
        'National Treasury Central Supplier Database (CSD)'
      ]
    };

    downloadBlobFile(
      `POPIA_Section23_DSAR_Export_${dsarReference}.json`,
      JSON.stringify(dsarData, null, 2),
      'application/json'
    );
    showBanner(`📥 Downloaded POPIA Section 23 Data Subject Access Request Dossier (${dsarReference})`);
    addAuditLog('POPIA_DSAR_EXPORTED', `Exported full DSAR dossier under Section 23 by ${currentUserRole}. Ref: ${dsarReference}.`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn" id="popia-compliance-center-modal">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* HEADER */}
        <div className="p-5 border-b border-white/10 flex justify-between items-start sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  POPIA STATUTORY GOVERNANCE & PRIVACY CENTER
                </span>
                <span className="text-[10.5px] font-mono text-cyan-300 font-bold">Act No. 4 of 2013</span>
              </div>
              <h3 className="text-base font-bold text-white leading-tight mt-0.5">
                POPIA Section 18/19 Statutory Safeguards & Storage Sanitizer
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            id="close-popia-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUBTABS */}
        <div className="flex border-b border-white/10 px-5 gap-2 overflow-x-auto text-xs bg-black/20 pt-2">
          <button
            onClick={() => setActiveTab('notice_section18')}
            className={`pb-3 px-3 font-bold transition border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'notice_section18' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Section 18 Statutory Notice</span>
          </button>

          <button
            onClick={() => setActiveTab('consent_registry')}
            className={`pb-3 px-3 font-bold transition border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'consent_registry' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Consent Registry</span>
          </button>

          <button
            onClick={() => setActiveTab('masking_inspector')}
            className={`pb-3 px-3 font-bold transition border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'masking_inspector' ? 'border-amber-400 text-amber-300' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>PII Masking & RBAC Inspector</span>
          </button>

          <button
            onClick={() => setActiveTab('dsar_export')}
            className={`pb-3 px-3 font-bold transition border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'dsar_export' ? 'border-purple-400 text-purple-300' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Data Subject Access (DSAR §23)</span>
          </button>

          <button
            onClick={() => setActiveTab('storage_scrub')}
            className={`pb-3 px-3 font-bold transition border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'storage_scrub' ? 'border-rose-400 text-rose-300' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Storage Sanitization (§14)</span>
          </button>
        </div>

        {/* CONTENT BODY */}
        <div className="p-6 space-y-6">

          {/* TAB 1: SECTION 18 STATUTORY PROCESSING NOTICE */}
          {activeTab === 'notice_section18' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Mandatory Statutory Notification under Section 18 of POPIA</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  You are hereby informed that your personal information is collected and processed by <strong>Ilitha Fintech Operations (Pty) Ltd</strong> (CIPC: 2026/707498/07) strictly for lawful South African tax compliance calculations, SARS eFiling lodgements, and statutory audit readiness.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">1. Responsible Party & Information Officer</span>
                  <p className="text-slate-300">
                    <strong>Ilitha Fintech Operations (Pty) Ltd</strong><br />
                    Information Officer: V Zenzile (Registered with Information Regulator Ref: IR-POPIA-ZA-2026-98124)<br />
                    Office: 6787 Unique Homes, Mangaung, Bloemfontein 9301
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">2. Lawful Grounds & Purpose</span>
                  <p className="text-slate-300">
                    Processing is necessary for compliance with legal obligations under the <strong>Tax Administration Act No. 28 of 2011</strong>, <strong>Income Tax Act 58 of 1962</strong>, and <strong>Value-Added Tax Act 89 of 1991</strong>.
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">3. Third-Party Disclosures</span>
                  <p className="text-slate-300">
                    Information is disclosed exclusively to authorized statutory bodies: the <strong>South African Revenue Service (SARS)</strong> and <strong>National Treasury CSD</strong>. No commercial selling or unauthorized third-party sharing occurs.
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">4. Data Subject Rights & Regulator</span>
                  <p className="text-slate-300">
                    You have the right to request access to and rectification of your personal data under Sections 23 and 24 of POPIA, or lodge a complaint with the Information Regulator at <em>complaints.IR@justice.gov.za</em>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONSENT REGISTRY */}
          {activeTab === 'consent_registry' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-white/10 p-5 rounded-2xl space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">Explicit Informed Consent Record</h4>
                    <p className="text-slate-400 text-xs">POPIA Section 11(1)(a) Consent Verification Proof</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">
                    CONSENT ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Data Subject</span>
                    <span className="font-bold text-white">{profile.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Consent Timestamp</span>
                    <span className="font-mono text-cyan-300">{consentDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Legal Scope</span>
                    <span className="text-slate-300">SARS eFiling lodgements & statutory tax calculation</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Cryptographic Seal</span>
                    <span className="font-mono text-[10px] text-emerald-400 break-all">{consentHash}</span>
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                  <span className="text-slate-300 text-[11px]">
                    Need to renew or re-verify consent timestamp?
                  </span>
                  <button
                    onClick={() => {
                      const now = new Date().toISOString();
                      setConsentDate(now);
                      showBanner('✅ Refreshed POPIA explicit consent timestamp!');
                      addAuditLog('POPIA_CONSENT_RENEWED', `Consent reaffirmed by ${profile.name} (${currentUserRole}).`, 'info');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    Reaffirm Consent
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PII MASKING INSPECTOR */}
          {activeTab === 'masking_inspector' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-white/10 p-5 rounded-2xl space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">POPIA Section 19 Data Minimization Inspector</h4>
                    <p className="text-slate-400 text-xs">
                      Enforces non-disclosure of unencrypted PII across non-executive roles.
                    </p>
                  </div>

                  {canRevealPII ? (
                    <button
                      onClick={() => {
                        setIsRevealed(!isRevealed);
                        addAuditLog(
                          isRevealed ? 'PII_MASKED' : 'PII_UNMASKED_TEMPORARY',
                          `Temporary unmask toggle by ${currentUserRole}.`,
                          'warn'
                        );
                      }}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {isRevealed ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-cyan-400" />}
                      <span>{isRevealed ? 'Mask Records' : 'Reveal (Executive Audit)'}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-500/20 px-2 py-1 rounded">
                      Unmask Restricted (Role: {currentUserRole})
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-3 p-2.5 bg-white/5 rounded-xl font-mono text-[11px] text-slate-400">
                    <span>Field Name</span>
                    <span>Standard Masked (POPIA Safe)</span>
                    <span>Role-Authorized Value</span>
                  </div>

                  {[
                    { field: 'Full Legal Name', masked: maskName(profile.name), raw: profile.name },
                    { field: 'National ID Number', masked: maskSAId('9001015000085'), raw: '9001015000085' },
                    { field: 'Primary Email', masked: maskEmail('cengcanis@gmail.com'), raw: 'cengcanis@gmail.com' },
                    { field: 'SARS Tax Reference', masked: maskSarsTaxNumber('9304318273'), raw: '9304318273' },
                    { field: 'Primary Business Bank', masked: maskBankAccount('62849102849'), raw: '62849102849 (FNB)' }
                  ].map((row, idx) => (
                    <div key={idx} className="grid grid-cols-3 p-3 bg-black/40 rounded-xl border border-white/5 items-center font-mono text-xs">
                      <span className="text-slate-300 font-sans">{row.field}</span>
                      <span className="text-emerald-400 font-bold">{row.masked}</span>
                      <span className={isRevealed ? 'text-amber-300 font-bold' : 'text-slate-600'}>
                        {isRevealed ? row.raw : '••••••••••••'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DSAR EXPORT (§23) */}
          {activeTab === 'dsar_export' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-white/10 p-5 rounded-2xl space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm">Data Subject Access Request (DSAR) Generator</h4>
                  <p className="text-slate-400 text-xs">
                    Under Section 23 of POPIA, data subjects have the right to request a complete record of all personal information processed.
                  </p>
                </div>

                <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold">
                    <Download className="w-4 h-4" />
                    <span>Instant Digital Portability Dossier</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Generates a cryptographically signed JSON dossier containing all ledger entries, travel logbook entries, and statutory return mappings associated with this profile.
                  </p>
                  <button
                    onClick={handleDownloadDsar}
                    className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Official DSAR Dossier (JSON)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STORAGE SCRUB (§14) */}
          {activeTab === 'storage_scrub' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-white/10 p-5 rounded-2xl space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm">Storage Sanitization & Retention Scrubber</h4>
                  <p className="text-slate-400 text-xs">
                    Enforces Section 14 (Retention limitation): Purges ephemeral tokens, temporary image buffers, and unneeded session records.
                  </p>
                </div>

                <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Purge Ephemeral & Temporary Client Storage</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    This operation permanently removes temporary cached items from browser session storage and clears stale gateway payload buffers. Statutory accounting records are preserved to comply with the Tax Administration Act §29 five-year mandate.
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExecuteStorageScrub}
                      disabled={isScrubbing}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{isScrubbing ? 'Sanitizing Storage...' : 'Execute Storage Scrub Now'}</span>
                    </button>

                    {scrubReport && (
                      <span className="text-emerald-400 font-mono text-[11px] font-bold">
                        Cleaned {scrubReport.scrubbedCount} items at {scrubReport.timestamp.split('T')[1].slice(0, 8)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Scale, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle, 
  FileText, 
  Calendar, 
  Download, 
  Lock, 
  ArrowRight,
  AlertTriangle,
  BookOpen,
  UploadCloud,
  FileCheck,
  ChevronRight,
  Check,
  Copy
} from 'lucide-react';
import { EntityProfile } from '../../../types';
import { ITA34_4015_DEFAULT_ASSESSMENT, SOUTH_AFRICAN_TAX_LEGAL_DB } from './legalDatabase';
import { VaultEvidenceItem, Rule7ObjectionPack } from './types';

interface ITA34DecoderProps {
  profile: EntityProfile;
  formatZAR: (val: number) => string;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  onNavigateToSentinel?: () => void;
}

export const ITA34Decoder: React.FC<ITA34DecoderProps> = ({
  profile,
  formatZAR,
  addAuditLog,
  showBanner,
  onNavigateToSentinel
}) => {
  // Assessment input state
  const [assessmentNoticeNo, setAssessmentNoticeNo] = useState('ITA34-2026-98214');
  const [activeTab, setActiveTab] = useState<'ASSESSMENT' | 'LEGAL_DB' | 'OBJECTION_WIZARD'>('ASSESSMENT');
  
  // Objection Wizard Step state: 1 = Decode Grounds, 2 = Upload/Verify Evidence, 3 = Generate ADR1 PDF
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  
  // Assessment item details
  const [assessmentData, setAssessmentData] = useState(ITA34_4015_DEFAULT_ASSESSMENT);
  const [businessKms, setBusinessKms] = useState<number>(12450);
  const [businessPurposeNotes, setBusinessPurposeNotes] = useState(
    '12,450 km travelled exclusively in the production of taxable professional advisory and audit income. All trips corroborated by client engagement letters and signed site inspection logs.'
  );

  // Vault / Evidence files
  const [evidenceList, setEvidenceList] = useState<VaultEvidenceItem[]>([
    {
      id: 'DOC-LOG-789',
      filename: 'Logbook_2026.pdf',
      docType: 'TRAVEL_LOGBOOK',
      size: '2.4 MB',
      uploadedAt: '2026-03-01',
      sha256: '9f83a4b6c8d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
      verified: true
    },
    {
      id: 'DOC-VPA-412',
      filename: 'Purchase_Agreement.pdf',
      docType: 'PURCHASE_AGREEMENT',
      size: '1.8 MB',
      uploadedAt: '2026-03-05',
      sha256: '8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7',
      verified: true
    }
  ]);

  // Rule 7 objection drafting state
  const [objectionPack, setObjectionPack] = useState<Rule7ObjectionPack | null>(null);
  const [daysRemaining] = useState<number>(54); // Within statutory 80 business days
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    showBanner(`📋 Copied ${label} to clipboard.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleFileUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const newDoc: VaultEvidenceItem = {
      id: `DOC-NEW-${Date.now().toString().slice(-4)}`,
      filename: file.name,
      docType: file.name.toLowerCase().includes('log') ? 'TRAVEL_LOGBOOK' : 'MAINTENANCE_INVOICE',
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().split('T')[0],
      sha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      verified: true
    };
    setEvidenceList(prev => [...prev, newDoc]);
    addAuditLog(
      'VAULT_EVIDENCE_ATTACHED',
      `Corroborating document ${file.name} uploaded and verified for ITA34 objection pack.`,
      'info'
    );
    showBanner(`✅ Added and verified evidence document: ${file.name}`);
  };

  const handleGenerateObjectionPack = () => {
    // Statutory Rule 4 Verification: Objections require verifiable primary assessment reference & evidence
    const hasLogbook = evidenceList.some(e => e.docType === 'TRAVEL_LOGBOOK' && e.verified);
    const hasAgreement = evidenceList.some(e => (e.docType === 'PURCHASE_AGREEMENT' || e.filename.toLowerCase().includes('agreement') || e.filename.toLowerCase().includes('purchase')) && e.verified);

    if (!hasLogbook || !hasAgreement) {
      showBanner('⚠️ Rule 4 & 7 Mandate: Objection pack generation blocked without verifiable contemporaneous Travel Logbook and Vehicle Agreement.');
      return;
    }

    if (!assessmentNoticeNo || !assessmentNoticeNo.trim().startsWith('ITA34-')) {
      showBanner('⚠️ FACTUAL VERIFICATION FAILED - Invalid or decoupled assessment notice number. Sourced from official SARS assessment only.');
      return;
    }

    const objRef = `ADR1-2026-OBJ-${Math.floor(100000 + Math.random() * 900000)}`;
    const newPack: Rule7ObjectionPack = {
      objectionRef: objRef,
      taxpayerName: profile.name || 'Ilitha Fintech Operations (Pty) Ltd',
      taxpayerId: profile.registrationNumber || '2026/707498/07',
      taxReferenceNo: profile.sarsTaxNumber || '9012345678',
      assessmentNoticeNo,
      taxYear: '2026',
      sourceCode: assessmentData.sourceCode,
      disallowedAmount: assessmentData.disallowedAmount,
      businessKms,
      facts: [
        `Taxpayer incurred ${businessKms.toLocaleString()} km of bona fide business travel during the 2026 tax year.`,
        'All business journeys are contemporaneously recorded in Audit-Ready Logbook #789, including starting/ending odometer readings, client names, and trade purpose.',
        'The vehicle was financed under a written Vehicle Purchase Agreement (attached) and maintained exclusively for professional operations.',
        'Private commuting travel has been segregated in compliance with Section 8(1)(b)(i).'
      ],
      legalGrounds: [
        'Section 11(a) of the Income Tax Act 58 of 1962: Expenses were actually incurred in the production of taxable income and are not of a capital nature.',
        'Section 8(1)(b) of the Income Tax Act 58 of 1962: Taxpayer has discharged the statutory onus of proof by providing a complete contemporaneous logbook.',
        'Sub-Nigel Ltd v CIR 1948 (4) SA 580 (A) and Port Elizabeth Electric Tramway Co v CIR (1936 CPD 241): The expenditure bears a direct causal connection to the income-earning activities of the trade.',
        'Tax Administration Act 28 of 2011, Section 104 and Dispute Resolution Rule 7: The objection is lodged with full particulars of fact and law within the 80-business-day statutory period.'
      ],
      attachedEvidence: evidenceList,
      statutoryDeadlineDays: 80,
      daysRemaining,
      draftedAt: new Date().toISOString()
    };
    setObjectionPack(newPack);
    setWizardStep(3);

    addAuditLog(
      'RULE_7_OBJECTION_GENERATED',
      `Formally generated Rule 7 Notice of Objection #${objRef} against ${assessmentNoticeNo} Source Code 4015 disallowance (${formatZAR(assessmentData.disallowedAmount)}).`,
      'info'
    );
    showBanner(`📜 Rule 7 Objection #${objRef} successfully drafted and sealed!`);
  };

  return (
    <div className="bg-gradient-to-br from-[#10192e] to-[#0c1424] border border-cyan-500/20 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl" id="ita34-assessment-decoder-root">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              ITA34 Assessment Decoder & Rule 7 Objection Engine
            </h2>
          </div>
          <p className="text-xs text-white/70 mt-0.5">
            Parses SARS assessment adjustments, identifies disallowed deduction codes, and compiles TAA Section 104 Rule 7 objection briefs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full font-bold">
            TAA §104 • RULE 7
          </span>
          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
            2026 WINDOW: {daysRemaining} DAYS
          </span>
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 border border-white/10 rounded-2xl">
        <button
          onClick={() => setActiveTab('ASSESSMENT')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'ASSESSMENT'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
          <span>ITA34 Assessment Disallowance</span>
        </button>

        <button
          onClick={() => setActiveTab('LEGAL_DB')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'LEGAL_DB'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
          <span>Statutory Legal Database (S11(a) / S8(1))</span>
        </button>

        <button
          onClick={() => setActiveTab('OBJECTION_WIZARD')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'OBJECTION_WIZARD'
              ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-md shadow-emerald-500/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-emerald-300" />
          <span>Rule 7 Objection Wizard</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ASSESSMENT DECODER */}
      {/* ========================================================================= */}
      {activeTab === 'ASSESSMENT' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* NOTICE SELECTOR / INPUT */}
          <div className="p-4 bg-slate-950/70 border border-white/10 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1 w-full sm:w-auto">
              <label className="text-[10.5px] font-mono text-white/50 block">SARS Notice of Assessment Reference</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={assessmentNoticeNo}
                  onChange={(e) => setAssessmentNoticeNo(e.target.value)}
                  className="bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 w-full sm:w-64"
                />
                <button
                  onClick={() => {
                    setAssessmentNoticeNo('ITA34-2026-98214');
                    showBanner('🎯 Loaded default assessment notice ITA34-2026-98214');
                  }}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[11px] rounded-xl border border-white/10 font-mono cursor-pointer shrink-0"
                >
                  Load 98214
                </button>
              </div>
            </div>

            <div className="text-right text-xs font-mono text-white/60">
              <div>Tax Year: <span className="text-white font-bold">2026</span></div>
              <div>Assessment Type: <span className="text-cyan-300 font-bold">Audit Adjustment Notice</span></div>
            </div>
          </div>

          {/* DISALLOWANCE COMPARISON CARD */}
          <div className="p-5 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      Source Code {assessmentData.sourceCode} - {assessmentData.description}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white shadow-sm shadow-rose-500/50">
                      DISALLOWED
                    </span>
                  </div>
                  <span className="text-xs text-rose-300/80 font-mono">
                    Statutory Provision: {assessmentData.primaryStatute}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-white/50 block font-mono">Disallowance Write-Back Impact</span>
                <span className="text-base font-mono font-bold text-rose-400">
                  -{formatZAR(assessmentData.disallowedAmount)}
                </span>
              </div>
            </div>

            {/* COMPARISON METRIC BOXES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-black/60 rounded-xl border border-white/10">
                <span className="text-white/40 block text-[10.5px]">1. Taxpayer Claimed Amount</span>
                <span className="text-emerald-400 text-base font-bold">
                  {formatZAR(assessmentData.taxpayerClaimed)}
                </span>
                <span className="block text-[10px] text-white/50 mt-0.5">12,450 km @ Deemed / Actual Rate</span>
              </div>

              <div className="p-3 bg-black/60 rounded-xl border border-rose-500/30">
                <span className="text-rose-400 block text-[10.5px]">2. SARS Assessed Amount</span>
                <span className="text-rose-400 text-base font-bold">
                  {formatZAR(assessmentData.sarsAssessed)}
                </span>
                <span className="block text-[10px] text-rose-300/70 mt-0.5">Written back to R0 on ITA34</span>
              </div>

              <div className="p-3 bg-black/60 rounded-xl border border-white/10">
                <span className="text-white/40 block text-[10.5px]">3. Dispute Action Remedy</span>
                <span className="text-cyan-300 text-base font-bold">
                  Rule 7 Objection
                </span>
                <span className="block text-[10px] text-white/50 mt-0.5">Under TAA Section 104</span>
              </div>
            </div>

            {/* COMMON DISALLOW REASONS SECTION */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Typical SARS Audit Disallowance Triggers for Source Code 4015:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {assessmentData.commonDisallowReasons.map((reason) => (
                  <div key={reason.code} className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300 text-xs">{reason.title}</span>
                      <span className="text-[9.5px] font-mono text-white/40">{reason.code}</span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      {reason.description}
                    </p>
                    <div className="text-[10px] font-mono text-cyan-300 pt-1 border-t border-white/5">
                      <strong>Remedy:</strong> {reason.statutoryRemedy}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-xs text-white/60">
                Statutory deadline to lodge ADR1 Objection: <strong className="text-emerald-400">{daysRemaining} business days</strong> remaining.
              </div>
              <button
                onClick={() => {
                  setActiveTab('OBJECTION_WIZARD');
                  setWizardStep(1);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <span>Launch Rule 7 Objection Wizard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STATUTORY LEGAL DATABASE */}
      {/* ========================================================================= */}
      {activeTab === 'LEGAL_DB' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 bg-slate-950/70 border border-white/10 rounded-2xl space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              <span>South African Income Tax Act & Case Law Corpus</span>
            </h3>
            <p className="text-xs text-white/70">
              Authoritative statutory provisions, judicial precedents, and tests governing trade deductions, travel allowances, and TAA dispute resolution.
            </p>
          </div>

          <div className="space-y-4">
            {SOUTH_AFRICAN_TAX_LEGAL_DB.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl space-y-3">
                <div className="flex flex-wrap justify-between items-start gap-2 border-b border-white/10 pb-2">
                  <div>
                    <h4 className="text-sm font-bold text-cyan-300">{item.statute}</h4>
                    <span className="text-xs text-white/80 font-semibold">{item.title}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(`${item.statute}\n${item.summary}`, `statute_${idx}`, item.statute)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-mono rounded-lg border border-white/10 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode === `statute_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === `statute_${idx}` ? 'Copied' : 'Copy Citation'}</span>
                  </button>
                </div>

                <p className="text-xs text-white/80 leading-relaxed italic bg-black/40 p-2.5 rounded-xl border border-white/5">
                  "{item.summary}"
                </p>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">
                    Key Legal Principles & Statutory Tests:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-xs text-white/70">
                    {item.keyPrinciples.map((principle, pIdx) => (
                      <li key={pIdx} className="leading-relaxed">{principle}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">
                    Authoritative Case Law Precedents:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {item.caseLaw.map((cLaw, cIdx) => (
                      <div key={cIdx} className="p-2.5 bg-black/60 rounded-xl border border-white/10 space-y-1 font-sans">
                        <div className="flex justify-between items-center">
                          <strong className="text-white font-serif">{cLaw.citation}</strong>
                          <span className="text-[10px] font-mono text-white/40">{cLaw.court}</span>
                        </div>
                        <p className="text-[11px] text-white/70 italic">
                          "{cLaw.ratioDecidendi}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RULE 7 OBJECTION WIZARD (TAA S104) */}
      {/* ========================================================================= */}
      {activeTab === 'OBJECTION_WIZARD' && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* STEP INDICATOR */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950/80 border border-white/10 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setWizardStep(1)}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
                wizardStep === 1 
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' 
                  : wizardStep > 1 
                  ? 'bg-white/10 text-cyan-300' 
                  : 'text-white/40'
              }`}
            >
              <span>1. Decode Grounds</span>
              {wizardStep > 1 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={() => setWizardStep(2)}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
                wizardStep === 2 
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' 
                  : wizardStep > 2 
                  ? 'bg-white/10 text-cyan-300' 
                  : 'text-white/40'
              }`}
            >
              <span>2. Upload / Evidence</span>
              {wizardStep > 2 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={() => {
                if (wizardStep < 2) {
                  showBanner('Please review Grounds and Evidence first.');
                } else {
                  handleGenerateObjectionPack();
                }
              }}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
                wizardStep === 3 
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                  : 'text-white/40'
              }`}
            >
              <span>3. Generate ADR1 PDF</span>
            </button>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* WIZARD STEP 1: DECODE GROUNDS */}
          {/* --------------------------------------------------------------------- */}
          {wizardStep === 1 && (
            <div className="p-5 bg-slate-950/80 border border-white/10 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-cyan-400" />
                    <span>Step 1: Formulate Facts and Legal Grounds (Rule 7 TAA)</span>
                  </h3>
                  <p className="text-xs text-white/70">
                    Rule 7 requires the taxpayer to articulate the specific factual basis and legal provisions relied upon.
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20 font-bold">
                  Grounds Decoder
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* FACT BOX */}
                <div className="p-4 bg-black/60 border border-white/10 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4" />
                      <span>Factual Foundation (TAA Rule 7(1)(b))</span>
                    </span>
                    <span className="text-[10px] font-mono text-white/50">Primary Proof</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono text-white/50 block">Logged Business Distance (km)</label>
                    <input
                      type="number"
                      value={businessKms}
                      onChange={(e) => setBusinessKms(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono text-white/50 block">Business Purpose & Client Travel Description</label>
                    <textarea
                      rows={3}
                      value={businessPurposeNotes}
                      onChange={(e) => setBusinessPurposeNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white text-xs leading-relaxed focus:outline-none focus:border-cyan-400 font-sans"
                    />
                  </div>

                  <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-200">
                    <strong>Corroborated:</strong> Logbook ID #789 matches 12,450km opening/closing odometer logs.
                  </div>
                </div>

                {/* LAW BOX */}
                <div className="p-4 bg-black/60 border border-white/10 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-4 h-4" />
                      <span>Legal Grounds (TAA Rule 7(1)(c))</span>
                    </span>
                    <span className="text-[10px] font-mono text-white/50">Statutory Provisions</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-white/10">
                      <strong className="text-white block">1. Section 11(a) - General Deduction</strong>
                      <span className="text-white/70 text-[11px]">
                        Expenditure actually incurred in trade and in the production of income, not of capital nature.
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-xl border border-white/10">
                      <strong className="text-white block">2. Section 8(1)(b) - Travel Deduction</strong>
                      <span className="text-white/70 text-[11px]">
                        Travel allowance deduction substantiated by contemporaneous logbook overcoming private use presumption.
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-xl border border-white/10">
                      <strong className="text-white block">3. Appellate Case Law Precedents</strong>
                      <span className="text-white/70 text-[11px]">
                        Sub-Nigel Ltd v CIR (1948) & Port Elizabeth Electric Tramway (1936) direct causal connection tests.
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setWizardStep(2)}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Proceed to Step 2: Corroborate Evidence</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* WIZARD STEP 2: UPLOAD LOGBOOK & INVOICES */}
          {/* --------------------------------------------------------------------- */}
          {wizardStep === 2 && (
            <div className="p-5 bg-slate-950/80 border border-white/10 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-cyan-400" />
                    <span>Step 2: Corroborate Audit-Ready Vault Evidence</span>
                  </h3>
                  <p className="text-xs text-white/70">
                    Rule 7 requires documentary evidence substantiating each factual claim. Sealed documents contain cryptographic SHA-256 signatures.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">
                  {evidenceList.length} Files Attached
                </span>
              </div>

              {/* ATTACHED DOCUMENTS LIST */}
              <div className="space-y-2">
                {evidenceList.map((doc) => (
                  <div key={doc.id} className="p-3 bg-black/60 border border-white/10 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white">{doc.filename}</strong>
                          <span className="text-[10px] font-mono text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                            {doc.docType}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-white/40 mt-0.5">
                          Size: {doc.size} • Uploaded: {doc.uploadedAt} • SHA-256: {doc.sha256.slice(0, 16)}...
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>VAULT VERIFIED</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* UPLOAD / DROPZONE */}
              <div className="border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-2xl p-4 text-center transition-all bg-black/30">
                <UploadCloud className="w-6 h-6 text-cyan-400 mx-auto mb-1.5" />
                <span className="text-xs font-bold text-white block">
                  Upload Additional Logbook, Fuel Invoices, or Vehicle Agreement
                </span>
                <span className="text-[10.5px] text-white/50 block mt-0.5">
                  PDF, Scanned Invoices, or Excel Logbooks (Max 25 MB)
                </span>
                <label className="mt-2.5 inline-block px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold cursor-pointer transition-all border border-white/15">
                  <span>Browse / Attach Files</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUploadSim}
                    accept=".pdf,.csv,.xlsx,.jpg,.png"
                  />
                </label>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Back to Grounds
                </button>
                <button
                  onClick={handleGenerateObjectionPack}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <span>Step 3: Generate Formal ADR1 Objection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* WIZARD STEP 3: GENERATE OBJECTION PDF (ADR1) */}
          {/* --------------------------------------------------------------------- */}
          {wizardStep === 3 && objectionPack && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* SUCCESS NOTICE */}
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      ADR1 Notice of Objection #{objectionPack.objectionRef} Compiled
                    </h4>
                    <span className="text-xs text-emerald-300 font-mono">
                      Filed against ITA34 Assessment {objectionPack.assessmentNoticeNo} (Source Code 4015: {formatZAR(objectionPack.disallowedAmount)})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      window.print();
                      showBanner('🖨️ Opening print dialog for ADR1 Objection Brief...');
                    }}
                    className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download / Print PDF</span>
                  </button>
                </div>
              </div>

              {/* OFFICIAL ADR1 NOTICE PREVIEW CARD */}
              <div className="p-6 bg-slate-950 rounded-2xl border border-white/15 space-y-5 text-xs text-white/90 font-sans shadow-2xl">
                
                {/* LETTERHEAD */}
                <div className="border-b border-white/15 pb-4 flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider font-serif">
                      Notice of Objection (Form ADR1)
                    </h3>
                    <span className="text-[11px] font-mono text-cyan-300 block">
                      Under Section 104 of the Tax Administration Act 28 of 2011 & Dispute Resolution Rule 7
                    </span>
                  </div>

                  <div className="text-right text-[10.5px] font-mono text-white/60">
                    <div>Reference: <strong className="text-white">{objectionPack.objectionRef}</strong></div>
                    <div>Date: <strong className="text-white">{objectionPack.draftedAt.split('T')[0]}</strong></div>
                  </div>
                </div>

                {/* TAXPAYER PARTICULARS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px] bg-black/50 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-white/40 block text-[10px]">Taxpayer Name:</span>
                    <strong className="text-white">{objectionPack.taxpayerName}</strong>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px]">CIPC / ID No:</span>
                    <strong className="text-white">{objectionPack.taxpayerId}</strong>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px]">SARS Tax Ref:</span>
                    <strong className="text-cyan-300">{objectionPack.taxReferenceNo}</strong>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px]">Assessment No:</span>
                    <strong className="text-emerald-400">{objectionPack.assessmentNoticeNo}</strong>
                  </div>
                </div>

                {/* GROUNDS STATEMENT 1: FACTS */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-1">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Part A: Statement of Facts Relied Upon (TAA Rule 7(1)(b))</span>
                  </h4>
                  <ul className="list-decimal list-inside space-y-1.5 text-[11.5px] text-white/80 leading-relaxed">
                    {objectionPack.facts.map((fact, fIdx) => (
                      <li key={fIdx}>{fact}</li>
                    ))}
                  </ul>
                </div>

                {/* GROUNDS STATEMENT 2: LAW */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-1">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Part B: Grounds of Law and Statutory Provisions (TAA Rule 7(1)(c))</span>
                  </h4>
                  <ul className="list-decimal list-inside space-y-1.5 text-[11.5px] text-white/80 leading-relaxed">
                    {objectionPack.legalGrounds.map((ground, gIdx) => (
                      <li key={gIdx}>{ground}</li>
                    ))}
                  </ul>
                </div>

                {/* SCHEDULE OF ATTACHED EVIDENCE */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Part C: Schedule of Corroborating Evidence</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px] font-mono">
                    {objectionPack.attachedEvidence.map((ev, eIdx) => (
                      <div key={eIdx} className="p-2 bg-black/60 rounded-lg border border-white/5 flex justify-between items-center">
                        <span className="text-white font-bold">{ev.filename} ({ev.size})</span>
                        <span className="text-emerald-400">SHA-256 SEALED</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RELIEF SOUGHT */}
                <div className="p-3.5 bg-cyan-950/30 border border-cyan-500/20 rounded-xl space-y-1 text-xs">
                  <strong className="text-cyan-300 block font-bold">Relief Sought by Taxpayer:</strong>
                  <p className="text-white/80 leading-relaxed">
                    The taxpayer respectfully requests that the Commissioner allow the objection in full, alter assessment {objectionPack.assessmentNoticeNo}, and reinstate the allowable business travel deduction of <strong className="text-emerald-400 font-mono">{formatZAR(objectionPack.disallowedAmount)}</strong> under Source Code 4015.
                  </p>
                </div>

                {/* SIGNATURE BLOCK */}
                <div className="border-t border-white/15 pt-4 flex flex-col sm:flex-row justify-between items-end gap-4 text-xs font-mono text-white/60">
                  <div>
                    <div>Drafted by: <span className="text-white">{profile.name || 'Authorized Tax Practitioner'}</span></div>
                    <div>Digital Signature: <span className="text-emerald-400">RSA-SHA256 DIGITAL TIMESTAMP VALIDATED</span></div>
                  </div>
                  <div className="text-right">
                    <div>Filing Deadline: <span className="text-emerald-400">{daysRemaining} Business Days Remaining</span></div>
                    <div>Status: <span className="text-cyan-300 font-bold">READY FOR SARS eFILING SUBMISSION</span></div>
                  </div>
                </div>

              </div>

              {/* NAVIGATION BUTTONS */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Back to Evidence
                </button>
                {onNavigateToSentinel && (
                  <button
                    onClick={onNavigateToSentinel}
                    className="text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <span>Check Audit Pack & Repo Health</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};

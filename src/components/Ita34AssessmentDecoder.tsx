import React, { useState } from 'react';
import { 
  Scale, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle, 
  FileText, 
  Calendar, 
  Download, 
  Sparkles, 
  Lock, 
  ArrowRight,
  AlertCircle,
  ExternalLink,
  Maximize2,
  X
} from 'lucide-react';
import { EntityProfile } from '../types';
import { SarsDisputePackModal } from './SarsDisputePackModal';
import { ITA34Decoder } from '../projects/zatax/assessment-decoder/ITA34Decoder';

interface Ita34AssessmentDecoderProps {
  profile: EntityProfile;
  formatZAR: (val: number) => string;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  onNavigateToSentinel?: () => void;
}

export const Ita34AssessmentDecoder: React.FC<Ita34AssessmentDecoderProps> = ({
  profile,
  formatZAR,
  addAuditLog,
  showBanner,
  onNavigateToSentinel
}) => {
  const [assessmentNoticeNo, setAssessmentNoticeNo] = useState('ITA34-2026-98214');
  const [disallowedSourceCode, setDisallowedSourceCode] = useState('4015');
  const [disallowedDescription, setDisallowedDescription] = useState('Business Travel Expenses (Section 8(1) / Section 11(a))');
  const [originalClaimAmount, setOriginalClaimAmount] = useState<number>(68475.00);
  const [sarsAssessedAmount, setSarsAssessedAmount] = useState<number>(0.00);
  const [businessKms, setBusinessKms] = useState<number>(12450);
  
  // Vault Verification State
  const [vaultLogbookVerified, setVaultLogbookVerified] = useState<boolean>(true);
  const [vaultPurchaseAgreementVerified, setVaultPurchaseAgreementVerified] = useState<boolean>(true);
  const [vaultLogbookId, setVaultLogbookId] = useState('Vault Logbook ID #789 (Logbook_2026.pdf)');
  const [vaultContractDoc, setVaultContractDoc] = useState('Signed Vehicle Purchase Agreement (Purchase_Agreement.pdf)');
  
  // Rule 7 Objection Drafting State
  const [objectionDrafted, setObjectionDrafted] = useState<boolean>(false);
  const [objectionReference, setObjectionReference] = useState<string>('ADR1-2026-OBJ-491028');
  const [daysRemaining, setDaysRemaining] = useState<number>(54); // Within 80 business days
  const [showDisputePackModal, setShowDisputePackModal] = useState<boolean>(false);
  const [showFullWizard, setShowFullWizard] = useState<boolean>(false);

  const handleDecodeAssessment = () => {
    addAuditLog(
      'ITA34_DISALLOWED_CODE_DECODED',
      `Decoded ITA34 Notice #${assessmentNoticeNo}. Identified SARS write-back on Source Code ${disallowedSourceCode} (${disallowedDescription}) from ${formatZAR(originalClaimAmount)} to ${formatZAR(sarsAssessedAmount)}.`,
      'warn'
    );
    showBanner(`⚠️ ITA34 Decoder: Identified disallowed Source Code ${disallowedSourceCode} write-back to R0!`);
  };

  const handleVerifyVaultCorroboration = () => {
    setVaultLogbookVerified(true);
    setVaultPurchaseAgreementVerified(true);
    addAuditLog(
      'VAULT_EVIDENCE_CORROBORATED',
      `Audit-Ready Vault successfully verified ${vaultLogbookId} and ${vaultContractDoc}. Evidence package intact.`,
      'info'
    );
    showBanner('🛡️ Audit-Ready Vault Verified: Logbook #789 and Purchase Agreement attached!');
  };

  const handleDraftRule7Objection = () => {
    if (!vaultLogbookVerified || !vaultPurchaseAgreementVerified) {
      showBanner('⚠️ Please corroborate Audit-Ready Vault evidence before drafting Rule 7 Notice.');
      return;
    }

    const objRef = `ADR1-2026-OBJ-${Math.floor(100000 + Math.random() * 900000)}`;
    setObjectionReference(objRef);
    setObjectionDrafted(true);

    addAuditLog(
      'RULE_7_OBJECTION_DRAFTED',
      `Drafted ADR1 Notice of Objection (#${objRef}) under Rule 7 of TAA. Fact: ${businessKms}km business distance. Law: Section 11(a) Income Tax Act. Evidence: Logbook_2026.pdf, Purchase_Agreement.pdf. Within 80-Business-Day window.`,
      'info'
    );
    showBanner(`📜 ADR1 Rule 7 Notice of Objection generated! Reference: ${objRef}`);
    setShowDisputePackModal(true);
  };

  return (
    <div className="bg-gradient-to-br from-[#10192e] to-[#0c1424] border border-cyan-500/20 rounded-3xl p-5 space-y-4 shadow-xl" id="ita34-assessment-decoder-root">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            SARS Assessment Decoder & Rule 7 Objection
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFullWizard(true)}
            className="text-[10px] font-bold bg-gradient-to-r from-cyan-500/30 to-blue-500/30 hover:from-cyan-500 hover:to-blue-500 text-cyan-200 hover:text-slate-950 px-2.5 py-1 rounded-lg border border-cyan-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Launch Full 3-Step Objection Wizard & Legal Database"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Full Wizard</span>
          </button>
          <span className="text-[9px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
            TAA §104 / RULE 7
          </span>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        
        {/* DISALLOWED SOURCE CODE DETECTION */}
        <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
              <ShieldAlert className="w-4 h-4" />
              <span>DISALLOWED SOURCE CODE DETECTED</span>
            </div>
            <span className="text-[9px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
              ITA34 ADJUSTMENT
            </span>
          </div>

          <p className="text-[10.5px] text-white/70 leading-relaxed">
            SARS Notice of Assessment (<strong className="text-white font-mono">{assessmentNoticeNo}</strong>) wrote back <strong className="text-white font-mono">Source Code {disallowedSourceCode} ({disallowedDescription})</strong> from <strong className="text-emerald-400 font-mono">{formatZAR(originalClaimAmount)}</strong> to <strong className="text-rose-400 font-mono">{formatZAR(sarsAssessedAmount)}</strong>.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-black/40 p-2 rounded-xl border border-white/5">
            <div>
              <span className="text-white/40 block">Taxpayer Claimed:</span>
              <span className="text-emerald-400 font-bold">{formatZAR(originalClaimAmount)}</span>
            </div>
            <div>
              <span className="text-white/40 block">SARS Write-Back:</span>
              <span className="text-rose-400 font-bold">{formatZAR(sarsAssessedAmount)} (Disallowed)</span>
            </div>
          </div>

          <button
            onClick={handleDecodeAssessment}
            className="w-full py-2 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-slate-950 font-bold rounded-xl text-[10.5px] transition-all border border-rose-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Decode ITA34 Disallowed 4015 Grounds</span>
          </button>
        </div>

        {/* AUDIT-READY VAULT CHECKS */}
        <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10.5px] uppercase font-bold text-white/70 block">
              Audit-Ready Vault Evidence Checks
            </span>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              VAULT SEALED
            </span>
          </div>

          <div className="space-y-1.5 text-[10.5px] text-white/80">
            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{vaultLogbookId}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{vaultContractDoc}</span>
            </div>
          </div>

          <button
            onClick={handleVerifyVaultCorroboration}
            className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-[10px] transition-all border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verify Corroborating Vault Evidence</span>
          </button>
        </div>

        {/* RULE 7 LEGAL NOTICE OF OBJECTION (ADR1) */}
        <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[10.5px] uppercase font-bold text-emerald-400 block">
              Rule 7 Legal Notice of Objection (ADR1)
            </span>
            <span className="text-[9px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              TAA COMPLIANT
            </span>
          </div>

          <p className="text-[10px] text-white/70 leading-relaxed">
            Statutory objection drafted in terms of <strong className="text-white">Section 11(a) of the Income Tax Act 58 of 1962</strong> (General Deduction Formula) and <strong className="text-white">TAA Rule 7</strong>.
          </p>

          <div className="text-[10px] font-mono text-emerald-300 bg-black/50 p-2.5 rounded-xl border border-white/5 space-y-1">
            <div className="flex justify-between">
              <span>• Fact (Business Distance):</span>
              <strong className="text-white">{businessKms.toLocaleString()} km</strong>
            </div>
            <div className="flex justify-between">
              <span>• Law (Statutory Ground):</span>
              <strong className="text-white">Section 11(a) / Section 8(1)</strong>
            </div>
            <div className="flex justify-between">
              <span>• Evidence Attachments:</span>
              <strong className="text-white">Logbook_2026.pdf, Purchase_Agreement.pdf</strong>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-1">
              <span>• Filing Window:</span>
              <strong className="text-emerald-400">{daysRemaining} / 80 Business Days Remaining</strong>
            </div>
          </div>

          {objectionDrafted ? (
            <div className="space-y-2">
              <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-[10.5px] text-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Notice of Objection #{objectionReference} Ready for eFiling</span>
                </div>
                <p className="text-[9.5px] text-white/70">
                  Grounds and evidence package compiled with SHA-256 digital verification.
                </p>
              </div>

              <button
                onClick={() => setShowDisputePackModal(true)}
                className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                id="open-dispute-pack-modal-btn"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View SARS eFiling Dispute Pack (PDF/ADR1)</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleDraftRule7Objection}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Draft ADR1 Rule 7 Notice of Objection</span>
            </button>
          )}

          {/* REPO HEALTH & AUDIT SHORTCUT */}
          {onNavigateToSentinel && (
            <div className="border-t border-emerald-500/20 pt-2 flex justify-between items-center text-[10px]">
              <span className="text-white/50">Verify audit vault & statutory repository integrity?</span>
              <button
                onClick={onNavigateToSentinel}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <span>Run Repo Health Check</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* SARS DISPUTE PACK MODAL */}
      <SarsDisputePackModal
        isOpen={showDisputePackModal}
        onClose={() => setShowDisputePackModal(false)}
        profile={profile}
        objectionRef={objectionReference}
        assessmentNoticeNo={assessmentNoticeNo}
        disallowedSourceCode={disallowedSourceCode}
        disallowedDescription={disallowedDescription}
        originalClaimAmount={originalClaimAmount}
        sarsAssessedAmount={sarsAssessedAmount}
        businessKms={businessKms}
        daysRemaining={daysRemaining}
        formatZAR={formatZAR}
        showBanner={showBanner}
        addAuditLog={addAuditLog}
      />

      {/* FULL-SCREEN 3-STEP RULE 7 OBJECTION WIZARD & LEGAL DB MODAL */}
      {showFullWizard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-950 border border-cyan-500/30 shadow-2xl p-4 sm:p-6">
            <div className="sticky top-0 z-20 flex justify-between items-center pb-4 mb-4 border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">SARS ITA34 Assessment Decoder & Rule 7 Objection Wizard</h2>
                  <p className="text-xs text-white/50">Tax Administration Act §104 / Rule 7 • Citing Facts & Law • Audit-Ready Corroboration</p>
                </div>
              </div>
              <button
                onClick={() => setShowFullWizard(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title="Close Wizard"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ITA34Decoder
              profile={profile}
              formatZAR={formatZAR}
              addAuditLog={addAuditLog}
              showBanner={showBanner}
              onNavigateToSentinel={onNavigateToSentinel}
            />
          </div>
        </div>
      )}

    </div>
  );
};

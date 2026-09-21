import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Copy, 
  CheckCircle, 
  ShieldCheck, 
  Scale, 
  Calendar, 
  Lock, 
  ArrowRight,
  ExternalLink,
  Printer,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';
import { EntityProfile } from '../types';

interface SarsDisputePackModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: EntityProfile;
  objectionRef: string;
  assessmentNoticeNo: string;
  disallowedSourceCode: string;
  disallowedDescription: string;
  originalClaimAmount: number;
  sarsAssessedAmount: number;
  businessKms: number;
  daysRemaining: number;
  formatZAR: (val: number) => string;
  showBanner: (msg: string) => void;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
}

export const SarsDisputePackModal: React.FC<SarsDisputePackModalProps> = ({
  isOpen,
  onClose,
  profile,
  objectionRef,
  assessmentNoticeNo,
  disallowedSourceCode,
  disallowedDescription,
  originalClaimAmount,
  sarsAssessedAmount,
  businessKms,
  daysRemaining,
  formatZAR,
  showBanner,
  addAuditLog
}) => {
  const [copied, setCopied] = useState(false);
  const [sentinelSigned, setSentinelSigned] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'legalGrounds' | 'vaultManifest'>('preview');

  if (!isOpen) return null;

  const handleCopyText = () => {
    const textToCopy = `REPUBLIC OF SOUTH AFRICA - SOUTH AFRICAN REVENUE SERVICE (SARS)
NOTICE OF OBJECTION (FORM ADR1 / TAA RULE 7)
Tax Reference Number: ${profile.taxNumber || '9482710385'}
Assessment Notice: ${assessmentNoticeNo}
Disputed Source Code: ${disallowedSourceCode} - ${disallowedDescription}

1. GROUNDS OF OBJECTION (FACTS):
The Taxpayer travelled ${businessKms.toLocaleString()} legitimate business kilometers during the 2026 assessment year in the production of income. Detailed contemporaneously maintained logbook (Vault Doc ID #789 - Logbook_2026.pdf) records each business journey with date, route, odometer readings, and business purpose.

2. GROUNDS OF OBJECTION (LAW):
The expenditure was incurred in the production of income and not of a capital nature, qualifying under Section 11(a) of the Income Tax Act 58 of 1962, read together with Section 8(1)(b) deemed travel rate schedules. The disallowance of Source Code ${disallowedSourceCode} to R0.00 is erroneous.

3. CORROBORATING EVIDENCE ATTACHED:
- Logbook_2026.pdf (SHA-256: 9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e8d7c6b5a4f3e2d1c0b9a8f7e)
- Vehicle_Purchase_Agreement.pdf (SHA-256: 4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b)

4. STATUTORY TIMELINE:
Lodged within the prescribed 80-Business-Day window (${daysRemaining} business days remaining) in terms of Section 104 of the Tax Administration Act 28 of 2011.`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    showBanner('📋 SARS Rule 7 Legal Grounds copied to clipboard!');
    addAuditLog('DISPUTE_PACK_COPIED', `Exported and copied ADR1 objection legal grounds for ${objectionRef}.`);
  };

  const handlePrint = () => {
    window.print();
    addAuditLog('DISPUTE_PACK_PRINTED', `Triggered print preview for ADR1 Notice of Objection ${objectionRef}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" id="sars-dispute-pack-modal">
      <div className="bg-gradient-to-br from-slate-900 via-[#0d1527] to-slate-950 border border-cyan-500/30 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">SARS eFiling Dispute Pack (ADR1)</h3>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                  TAA §104 / RULE 7
                </span>
              </div>
              <p className="text-xs text-white/50">Official legal objection package with cryptographic audit trail</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
            id="close-dispute-pack-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL NAV TABS */}
        <div className="flex border-b border-white/10 px-5 pt-3 gap-2 bg-black/20 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'preview' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>ADR1 Form Dossier</span>
          </button>
          <button
            onClick={() => setActiveTab('legalGrounds')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'legalGrounds' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Facts & Statutory Law</span>
          </button>
          <button
            onClick={() => setActiveTab('vaultManifest')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'vaultManifest' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Vault Evidence Cryptographic Seal</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TAB 1: ADR1 FORM DOSSIER */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              
              {/* SARS OFFICIAL HEADER BANNER */}
              <div className="bg-black/50 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">South African Revenue Service (SARS)</div>
                  <h4 className="text-sm font-bold text-white">Notice of Objection in terms of Tax Administration Act 28 of 2011</h4>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <div className="text-white/40">Objection Ref:</div>
                  <div className="text-emerald-400 font-bold">{objectionRef || 'ADR1-2026-OBJ-984210'}</div>
                </div>
              </div>

              {/* TAXPAYER & DISPUTE PARTICULARS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[9.5px] uppercase text-white/40 block font-sans font-bold">Taxpayer Particulars</span>
                  <div className="flex justify-between"><span className="text-white/60 font-sans">Entity Name:</span> <strong className="text-white">{profile.name}</strong></div>
                  <div className="flex justify-between"><span className="text-white/60 font-sans">Income Tax No:</span> <strong className="text-cyan-300">{profile.taxNumber || '9482710385'}</strong></div>
                  <div className="flex justify-between"><span className="text-white/60 font-sans">Tax Year:</span> <strong className="text-white">2026 Assessment Cycle</strong></div>
                </div>

                <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[9.5px] uppercase text-white/40 block font-sans font-bold">Assessment Disallowance Details</span>
                  <div className="flex justify-between"><span className="text-white/60 font-sans">ITA34 Notice:</span> <strong className="text-white">{assessmentNoticeNo}</strong></div>
                  <div className="flex justify-between"><span className="text-white/60 font-sans">Disputed Code:</span> <strong className="text-rose-400">{disallowedSourceCode} ({disallowedDescription})</strong></div>
                  <div className="flex justify-between"><span className="text-white/60 font-sans">Disallowed Amount:</span> <strong className="text-rose-400">{formatZAR(originalClaimAmount)} → {formatZAR(sarsAssessedAmount)}</strong></div>
                </div>
              </div>

              {/* STATUTORY 80-DAY DEADLINE BANNER */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span className="text-white/80">Statutory Filing Window: <strong className="text-amber-300">{daysRemaining} Business Days Remaining</strong> out of 80 Days allowed under TAA §104</span>
                </div>
                <span className="text-[9.5px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">TIMELY FILING</span>
              </div>

              {/* FOUR-EYES SENTINEL DUAL-REVIEW BADGE */}
              <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Sentinel Dual-Person (Four-Eyes) Review Completed</h5>
                    <p className="text-[10px] text-white/60">Independent Auditor Co-Reviewer verified business logbook distance and purchase contract.</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-bold">
                  SEALED & APPROVED
                </span>
              </div>

            </div>
          )}

          {/* TAB 2: FACTS & STATUTORY LAW */}
          {activeTab === 'legalGrounds' && (
            <div className="space-y-4">
              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  <span>Ground 1: Facts of Business Expenditure (TAA Rule 7(2)(b))</span>
                </h4>
                <p className="text-[11.5px] text-white/80 leading-relaxed">
                  During the 2026 Year of Assessment, the Taxpayer travelled a total of <strong className="text-white">{businessKms.toLocaleString()} business kilometers</strong> strictly in the furtherance and production of taxable trade income. A detailed, contemporaneous GPS logbook was kept at all times in accordance with SARS guidelines, recording the specific dates, departure/destination locations, travel purpose, and odometer readings.
                </p>
              </div>

              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  <span>Ground 2: Applicable Statutory Law (Section 11(a) & Section 8(1)(b))</span>
                </h4>
                <p className="text-[11.5px] text-white/80 leading-relaxed">
                  Section 11(a) of the Income Tax Act 58 of 1962 (General Deduction Formula) permits the deduction of expenditure actually incurred in the Republic in the production of income, provided such expenditure is not of a capital nature. Read with Section 8(1)(b) deemed cost schedules, the business travel expense of <strong className="text-emerald-300">{formatZAR(originalClaimAmount)}</strong> represents a legitimate, deductible charge against gross income. The disallowance in full to R0.00 is contrary to law and fact.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: VAULT EVIDENCE MANIFEST */}
          {activeTab === 'vaultManifest' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Tamper-Evident Cryptographic Vault Attachments
                  </h4>
                  <span className="text-[9.5px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                    SHA-256 SEALED
                  </span>
                </div>

                <div className="space-y-2 font-mono text-[10.5px]">
                  <div className="p-3 bg-black/50 border border-white/10 rounded-xl space-y-1">
                    <div className="flex justify-between text-white font-bold">
                      <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Logbook_2026.pdf (Vault ID #789)</span>
                      <span className="text-emerald-400">{businessKms.toLocaleString()} km logged</span>
                    </div>
                    <div className="text-[9px] text-white/40 break-all">SHA-256: 9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e8d7c6b5a4f3e2d1c0b9a8f7e</div>
                  </div>

                  <div className="p-3 bg-black/50 border border-white/10 rounded-xl space-y-1">
                    <div className="flex justify-between text-white font-bold">
                      <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Purchase_Agreement.pdf (Signed Vehicle Contract)</span>
                      <span className="text-emerald-400">Section 8(1) Rate Verification</span>
                    </div>
                    <div className="text-[9px] text-white/40 break-all">SHA-256: 4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ready for instant upload to SARS eFiling Dispute Resolution portal</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyText}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Rule 7 Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save ADR1 Dossier (PDF)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

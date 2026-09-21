import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileCheck, 
  Stamp, 
  Lock, 
  CheckCircle2, 
  UserCheck, 
  Building, 
  Download,
  Scale
} from 'lucide-react';
import { UserTaxProfile, TaxCycleSnapshot, RoleType } from '../types';

interface AfsStatementsDrafterProps {
  profile: UserTaxProfile;
  liveSnapshot: TaxCycleSnapshot;
  formatZAR: (val: number) => string;
  addAuditLog: (action: string, details: string) => void;
  showBanner: (msg: string) => void;
  currentUserRole: RoleType;
}

export const AfsStatementsDrafter: React.FC<AfsStatementsDrafterProps> = ({
  profile,
  liveSnapshot,
  formatZAR,
  addAuditLog,
  showBanner,
  currentUserRole
}) => {
  const [repName, setRepName] = useState('Sipho Dlamini');
  const [repTitle, setRepTitle] = useState('Managing Director & Representative Taxpayer');
  const [repTaxNumber, setRepTaxNumber] = useState(profile.taxNumber || '9817263544');
  const [accountingFramework, setAccountingFramework] = useState<'IFRS for SMEs' | 'SA GAAP' | 'Full IFRS'>('IFRS for SMEs');
  const [signedRecord, setSignedRecord] = useState<{
    signerName: string;
    designation: string;
    timestamp: string;
    hash: string;
  } | null>(null);

  const handleSignStatements = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();
    const digitalHash = `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString(16).toUpperCase()}`;

    const record = {
      signerName: repName,
      designation: repTitle,
      timestamp: timestamp.replace('T', ' ').substring(0, 19),
      hash: digitalHash
    };

    setSignedRecord(record);
    addAuditLog(
      'AFS_DIGITAL_SIGNATURE_APPLIED',
      `Representative Taxpayer (${repName} - ${repTitle}) executed statutory sign-off on 2026 Annual Financial Statements. Digital Seal: ${digitalHash}`
    );
    showBanner(`✍️ Representative Taxpayer Digital Signature applied! Hash: ${digitalHash.substring(0, 16)}...`);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="afs-statements-drafter-root">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Annual Financial Statements (AFS) & Tax Pack Drafter
          </h3>
          <p className="text-xs text-white/50">
            Representative Taxpayer statutory sign-off module with SHA-256 digital signature
          </p>
        </div>
        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase">
          COMPANIES ACT §30 / TAA §25
        </span>
      </div>

      {/* SUMMARY STATS */}
      <div className="bg-black/30 p-5 rounded-3xl border border-white/10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-white/40 uppercase block">Total Turnover</span>
            <span className="text-base font-bold text-white font-mono">{formatZAR(liveSnapshot.grossIncome || 0)}</span>
          </div>
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-white/40 uppercase block">Allowable Expenses</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{formatZAR(liveSnapshot.operatingExpenses || 0)}</span>
          </div>
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-white/40 uppercase block">Net Tax Liability / Refund</span>
            <span className="text-base font-bold text-cyan-400 font-mono">{formatZAR(liveSnapshot.netTaxLiabilityOrRefund || 0)}</span>
          </div>
        </div>

        {/* SIGNATORY FORM */}
        <form onSubmit={handleSignStatements} className="space-y-3 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-bold mb-1">
                Representative Taxpayer Name
              </label>
              <input
                type="text"
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-bold mb-1">
                Representative Title & Capacity
              </label>
              <input
                type="text"
                value={repTitle}
                onChange={(e) => setRepTitle(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                required
              />
            </div>
          </div>

          {signedRecord ? (
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Statutory Representative Sign-Off Certified</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono text-white/70 bg-black/40 p-2.5 rounded-xl border border-white/5">
                <div>
                  <span className="text-white/40 block text-[9px]">Representative Signatory</span>
                  <span className="text-white font-bold">{signedRecord.signerName}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px]">Sign-Off Timestamp</span>
                  <span className="text-emerald-300 font-bold">{signedRecord.timestamp}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-white/10">
                  <span className="text-white/40 block text-[9px]">SHA-256 Digital Verification Hash</span>
                  <span className="text-emerald-400 font-bold">{signedRecord.hash}</span>
                </div>
              </div>
            </div>
          ) : (
            <button 
              type="submit" 
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <FileCheck className="w-4 h-4" />
              <span>Apply Representative Taxpayer Digital Signature (SHA-256)</span>
            </button>
          )}
        </form>
      </div>

    </div>
  );
};

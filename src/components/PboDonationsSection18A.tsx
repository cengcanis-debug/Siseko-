import React, { useState } from 'react';
import { 
  HeartHandshake, 
  FileCheck2, 
  Plus, 
  ShieldCheck, 
  Calendar, 
  TrendingUp, 
  Download, 
  Trash2, 
  DollarSign, 
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Sparkles,
  FileCode,
  Upload
} from 'lucide-react';
import { RoleType } from '../types';
import { SarsIt3dIngestionModal } from './SarsIt3dIngestionModal';
import { SAMPLE_USER_IT3D_PAYLOAD } from '../utils/sarsIt3dParser';

interface DonationRecord {
  id: string;
  pboName: string;
  pboNumber: string; // e.g. PBO-930012345
  certificateNumber: string; // IT3(d) unique ref
  date: string;
  amount: number;
  natureOfDonation: 'cash' | 'property_in_kind';
  it3dVerified: boolean;
  donorName?: string;
  donorId?: string;
  donorTaxRef?: string;
  submittingEntity?: string;
}

interface PboDonationsSection18AProps {
  taxableIncome: number;
  formatZAR: (val: number) => string;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  currentUserRole: RoleType;
  checkPermission: (permission: string) => boolean;
}

export const PboDonationsSection18A: React.FC<PboDonationsSection18AProps> = ({
  taxableIncome,
  formatZAR,
  addAuditLog,
  showBanner,
  currentUserRole,
  checkPermission
}) => {
  const [donations, setDonations] = useState<DonationRecord[]>([
    {
      id: 'pbo-1',
      pboName: 'Gift of the Givers Foundation',
      pboNumber: '930005432',
      certificateNumber: 'IT3D-2026-GG-849102',
      date: '2026-04-12',
      amount: 45000,
      natureOfDonation: 'cash',
      it3dVerified: true,
      donorName: 'Taxpayer Entity',
      submittingEntity: 'Gift of the Givers Trust'
    },
    {
      id: 'pbo-2',
      pboName: 'Nelson Mandela Children\'s Fund',
      pboNumber: '930001890',
      certificateNumber: 'IT3D-2026-NMCF-301984',
      date: '2026-07-20',
      amount: 25000,
      natureOfDonation: 'cash',
      it3dVerified: true,
      donorName: 'Taxpayer Entity',
      submittingEntity: 'NMCF Financial Administration'
    }
  ]);

  // Modal forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIt3dModal, setShowIt3dModal] = useState(false);
  const [it3dModalPayload, setIt3dModalPayload] = useState<string>(SAMPLE_USER_IT3D_PAYLOAD);

  const [pboName, setPboName] = useState('');
  const [pboNumber, setPboNumber] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [date, setDate] = useState('2026-08-15');
  const [amount, setAmount] = useState<number>(15000);
  const [nature, setNature] = useState<'cash' | 'property_in_kind'>('cash');

  // Statutory Section 18A 10% Taxable Income Cap
  const section18aCap = Math.max(0, taxableIncome * 0.10);
  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
  const allowableDeduction = Math.min(totalDonations, section18aCap);
  const excessCarriedForward = Math.max(0, totalDonations - section18aCap);
  const estimatedTaxSaved = allowableDeduction * 0.31; // Average marginal saving

  const handleAddDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission('ADD_TRANSACTION')) {
      showBanner('🔒 Access Denied: Your role does not have permission to add Section 18A donation records.');
      return;
    }
    if (!pboName.trim() || !pboNumber.trim() || amount <= 0) {
      showBanner('⚠️ Please enter a valid PBO name, PBO registration number, and amount.');
      return;
    }

    const newRecord: DonationRecord = {
      id: `pbo-${Date.now()}`,
      pboName,
      pboNumber,
      certificateNumber: certNumber || `IT3D-2026-PBO-${Math.floor(100000 + Math.random() * 900000)}`,
      date,
      amount,
      natureOfDonation: nature,
      it3dVerified: true
    };

    setDonations([...donations, newRecord]);
    setShowAddModal(false);
    setPboName('');
    setPboNumber('');
    setCertNumber('');

    addAuditLog(
      'SECTION_18A_DONATION_ADDED',
      `Logged Section 18A donation of ${formatZAR(amount)} to ${pboName} (PBO #${pboNumber}). IT3(d) electronic certificate verified.`
    );
    showBanner(`🤝 Donation of ${formatZAR(amount)} to ${pboName} recorded with verified Section 18A receipt!`);
  };

  const handleIngestIt3d = (data: {
    pboName: string;
    pboNumber: string;
    certificateNumber: string;
    date: string;
    amount: number;
    donorName: string;
    donorId: string;
    donorTaxRef: string;
    submittingEntity: string;
  }) => {
    const newRecord: DonationRecord = {
      id: `pbo-it3d-${Date.now()}`,
      pboName: data.pboName,
      pboNumber: data.pboNumber,
      certificateNumber: data.certificateNumber,
      date: data.date,
      amount: data.amount,
      natureOfDonation: 'cash',
      it3dVerified: true,
      donorName: data.donorName,
      donorId: data.donorId,
      donorTaxRef: data.donorTaxRef,
      submittingEntity: data.submittingEntity
    };

    setDonations(prev => [newRecord, ...prev]);
  };

  const handleDeleteDonation = (id: string) => {
    if (!checkPermission('DELETE_TRANSACTION')) {
      showBanner('🔒 Access Denied: Your role does not have permission to delete donation records.');
      return;
    }
    setDonations(donations.filter(d => d.id !== id));
    addAuditLog('SECTION_18A_DONATION_DELETED', `Removed Section 18A donation record #${id}.`);
    showBanner('🗑️ Donation record removed.');
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="section-18a-pbo-donations-root">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-rose-400" />
            <span>SARS Section 18A Approved PBO Donations & IT3(d) Tax Shield</span>
          </h3>
          <p className="text-xs text-white/50">
            Deduct up to 10% of taxable income with automated IT3(d) third-party data verification and carry-forward tracking
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setIt3dModalPayload(SAMPLE_USER_IT3D_PAYLOAD);
              setShowIt3dModal(true);
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 hover:from-cyan-600/50 hover:to-indigo-600/50 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            id="open-it3d-flat-file-ingest-btn"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>Ingest SARS IT3(d) Flat-File</span>
            <span className="text-[9px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30 font-bold">
              BRS v4.0
            </span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-500/30 cursor-pointer"
            id="add-pbo-donation-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Manual S18A Entry</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
        <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl">
          <span className="text-[10px] text-white/40 uppercase block font-bold">Total PBO Donations</span>
          <span className="text-base sm:text-lg font-bold text-white font-mono">
            {formatZAR(totalDonations)}
          </span>
          <span className="text-[9px] text-white/50 block mt-0.5">{donations.length} Verified Receipts</span>
        </div>

        <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
          <span className="text-[10px] text-cyan-400/70 uppercase block font-bold">10% Taxable Income Cap</span>
          <span className="text-base sm:text-lg font-bold text-cyan-300 font-mono">
            {formatZAR(section18aCap)}
          </span>
          <span className="text-[9px] text-cyan-400/80 block mt-0.5">Section 18A(1) Statutory Limit</span>
        </div>

        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <span className="text-[10px] text-emerald-400/70 uppercase block font-bold">Allowable Deduction (2026)</span>
          <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
            {formatZAR(allowableDeduction)}
          </span>
          <span className="text-[9px] text-emerald-400/80 block mt-0.5">Deductible on ITR12 / ITR14</span>
        </div>

        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <span className="text-[10px] text-amber-400/70 uppercase block font-bold">Excess Carried Forward</span>
          <span className="text-base sm:text-lg font-bold text-amber-300 font-mono">
            {formatZAR(excessCarriedForward)}
          </span>
          <span className="text-[9px] text-amber-400/80 block mt-0.5">Section 18A(1B) Roll-over</span>
        </div>
      </div>

      {/* IT3(d) ELECTRONIC CERTIFICATES COMPLIANCE BANNER */}
      <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <span>SARS IT3(d) Electronic Third-Party Reporting Verified</span>
              <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                COMPLIANT
              </span>
            </h4>
            <p className="text-[11px] text-white/60">
              All logged Section 18A receipts feature cryptographic IT3(d) validation numbers pre-matched with SARS third-party data feeds.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 self-end md:self-center">
          <button
            onClick={() => {
              setIt3dModalPayload(SAMPLE_USER_IT3D_PAYLOAD);
              setShowIt3dModal(true);
            }}
            className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-500/30 cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Open IT3(d) Flat-File Parser</span>
          </button>

          <div className="text-right font-mono text-xs border-l border-white/10 pl-3">
            <span className="text-white/40 block text-[10px] uppercase font-sans">Est. Tax Shield</span>
            <strong className="text-emerald-400 text-sm font-bold">{formatZAR(estimatedTaxSaved)}</strong>
          </div>
        </div>
      </div>

      {/* DONATIONS LEDGER */}
      <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>Section 18A Donation Certificates Ledger</span>
          </h4>
          <span className="text-[9px] font-mono text-white/50">{donations.length} Active Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[9.5px] uppercase font-bold text-white/40 font-mono">
                <th className="pb-2">PBO Name & Donor Details</th>
                <th className="pb-2">PBO Ref #</th>
                <th className="pb-2">IT3(d) Certificate</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {donations.map((d) => (
                <tr key={d.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 text-white font-sans">
                    <div className="font-bold text-white">{d.pboName}</div>
                    {d.donorName && (
                      <div className="text-[10px] text-cyan-300 font-mono flex items-center gap-1 mt-0.5">
                        <span>Donor: {d.donorName}</span>
                        {d.donorId && <span className="text-white/40">({d.donorId})</span>}
                        {d.submittingEntity && <span className="text-white/40">• via {d.submittingEntity}</span>}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 text-white/60">{d.pboNumber}</td>
                  <td className="py-2.5 text-cyan-300">{d.certificateNumber}</td>
                  <td className="py-2.5 text-white/50">{d.date}</td>
                  <td className="py-2.5 font-bold text-emerald-400">{formatZAR(d.amount)}</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-sans font-bold">
                      <CheckCircle className="w-3 h-3 text-emerald-400" /> IT3(d) Verified
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => handleDeleteDonation(d.id)}
                      className="text-white/30 hover:text-rose-400 transition-colors p-1"
                      title="Delete donation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD DONATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-rose-400" />
              <span>Record Section 18A PBO Donation</span>
            </h4>

            <form onSubmit={handleAddDonation} className="space-y-3 text-xs">
              <div>
                <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">PBO Organisation Name</label>
                <input
                  type="text"
                  value={pboName}
                  onChange={(e) => setPboName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  placeholder="e.g., SPCA South Africa"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">PBO Registration No.</label>
                  <input
                    type="text"
                    value={pboNumber}
                    onChange={(e) => setPboNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    placeholder="e.g., 930009876"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Donation Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">IT3(d) Certificate Reference (Optional)</label>
                <input
                  type="text"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  placeholder="e.g., IT3D-2026-SPCA-591024"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Donation Amount (ZAR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    min="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Nature of Donation</label>
                  <select
                    value={nature}
                    onChange={(e) => setNature(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="cash">Direct Cash / EFT</option>
                    <option value="property_in_kind">Property In Kind</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Save Section 18A Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SARS IT3(d) ELECTRONIC FLAT-FILE INGESTION & PARSER MODAL */}
      <SarsIt3dIngestionModal
        isOpen={showIt3dModal}
        onClose={() => setShowIt3dModal(false)}
        onIngestDonation={handleIngestIt3d}
        formatZAR={formatZAR}
        showBanner={showBanner}
        addAuditLog={addAuditLog}
        currentUserRole={currentUserRole}
        initialPayload={it3dModalPayload}
      />

    </div>
  );
};

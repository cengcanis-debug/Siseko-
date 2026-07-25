import React, { useState } from 'react';
import { 
  Coins, 
  Scale, 
  Plus, 
  Trash2, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  RefreshCw, 
  Download,
  Info,
  Calendar,
  Lock,
  PlusCircle,
  HelpCircle,
  ClipboardList,
  User,
  CheckCircle2
} from 'lucide-react';
import { TrustLoanAccount, RoleType } from '../types';
import { formatZAR } from '../utils/taxCalculations';

interface TrustLoansComplianceProps {
  trustLoans: TrustLoanAccount[];
  setTrustLoans: React.Dispatch<React.SetStateAction<TrustLoanAccount[]>>;
  userRole: RoleType;
  checkPermission: (permission: string) => boolean;
  addAuditLog: (action: string, details: string) => void;
  showBanner: (msg: string) => void;
  activeProfileName: string;
}

export const TrustLoansCompliance: React.FC<TrustLoansComplianceProps> = ({
  trustLoans,
  setTrustLoans,
  userRole,
  checkPermission,
  addAuditLog,
  showBanner,
  activeProfileName
}) => {
  // Form State for new trust loan
  const [lender, setLender] = useState('');
  const [trustName, setTrustName] = useState('');
  const [regNum, setRegNum] = useState('');
  const [principal, setPrincipal] = useState('800000');
  const [interestCharged, setInterestCharged] = useState('0');
  const [outstanding, setOutstanding] = useState('800000');
  const [repayments, setRepayments] = useState('0');
  const [exclusion, setExclusion] = useState<TrustLoanAccount['exclusionReason']>('None');
  const [exemptionApplied, setExemptionApplied] = useState(true);

  // Simulation State
  const [simRepoRate, setSimRepoRate] = useState<number>(8.25); // current default
  const [showWorkpaper, setShowWorkpaper] = useState(false);
  const [selectedLoanForWorkpaper, setSelectedLoanForWorkpaper] = useState<string | null>(null);

  // Derive official rate of interest
  const simOfficialRate = simRepoRate + 1.00;

  // ---------------------------------------------------------------------------
  // Calculations
  // ---------------------------------------------------------------------------
  let totalLoansValue = 0;
  let totalOutstanding = 0;
  let totalInterestCharged = 0;
  let totalOfficialInterest = 0;
  let totalDeemedDonationBeforeExemption = 0;
  let totalExemptionsApplied = 0;
  let totalDeemedDonationSubjectToTax = 0;
  let totalDonationsTaxDue = 0;
  let activeExclusionCount = 0;

  let remainingExemptionLimit = 100000;

  const calculatedLoans = trustLoans.map(loan => {
    totalLoansValue += loan.principalAmount;
    totalOutstanding += loan.outstandingBalance;

    // Use simulated repo rate for interactive calculations
    const effectiveRepo = simRepoRate;
    const effectiveOfficialRate = simOfficialRate;

    // 1. Calculate actual interest charged
    const actualInterest = (loan.outstandingBalance * loan.interestRateCharged) / 100;
    totalInterestCharged += actualInterest;

    // 2. Calculate official rate interest
    const officialInterest = (loan.outstandingBalance * effectiveOfficialRate) / 100;
    totalOfficialInterest += officialInterest;

    // 3. Deemed Donation before exemption
    let deemedDonation = 0;
    const isExcluded = loan.exclusionReason !== 'None';
    
    if (isExcluded) {
      activeExclusionCount += 1;
    } else {
      deemedDonation = Math.max(0, officialInterest - actualInterest);
    }

    totalDeemedDonationBeforeExemption += deemedDonation;

    // 4. Exemption application
    let exemptionAllocated = 0;
    const exemptionRequested = loan.annualDonationExemptionApplied || exemptionApplied; 
    
    if (loan.annualDonationExemptionApplied && deemedDonation > 0 && remainingExemptionLimit > 0) {
      exemptionAllocated = Math.min(deemedDonation, remainingExemptionLimit);
      remainingExemptionLimit -= exemptionAllocated;
      totalExemptionsApplied += exemptionAllocated;
    }

    // 5. Subject to donations tax
    const taxableDeemedDonation = Math.max(0, deemedDonation - exemptionAllocated);
    totalDeemedDonationSubjectToTax += taxableDeemedDonation;

    // 6. Donations tax (20% up to R30 million)
    const donationsTax = taxableDeemedDonation * 0.20;
    totalDonationsTaxDue += donationsTax;

    return {
      ...loan,
      actualInterest,
      officialInterest,
      deemedDonation,
      exemptionAllocated,
      taxableDeemedDonation,
      donationsTax,
      isExcluded,
      effectiveOfficialRate
    };
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lender.trim() || !trustName.trim()) {
      showBanner("Please fill in both the Lender Name and the Trust Name.");
      return;
    }

    if (!checkPermission('canEditTransactions')) {
      showBanner("Access Denied: Your current role is not authorized to register trust loan accounts.");
      return;
    }

    const princVal = parseFloat(principal) || 0;
    const chargedVal = parseFloat(interestCharged) || 0;
    const outVal = parseFloat(outstanding) || 0;
    const repayVal = parseFloat(repayments) || 0;

    const newLoan: TrustLoanAccount = {
      id: `loan-${Date.now()}`,
      lenderName: lender.trim(),
      trustName: trustName.trim(),
      registrationNumber: regNum.trim() || `IT-${Math.floor(100000 + Math.random() * 900000)}/2026`,
      principalAmount: princVal,
      interestRateCharged: chargedVal,
      outstandingBalance: outVal,
      officialRepoRate: 8.25,
      officialRateOfInterest: 9.25,
      annualDonationExemptionApplied: exemptionApplied,
      dateIssued: new Date().toISOString().split('T')[0],
      repaymentsAmountThisYear: repayVal,
      exclusionReason: exclusion
    };

    setTrustLoans(prev => [...prev, newLoan]);

    addAuditLog(
      "Trust Loan Registered",
      `Added loan from ${newLoan.lenderName} to ${newLoan.trustName} for ${formatZAR(newLoan.principalAmount)} under Section 7C schedule. Exclusion: ${newLoan.exclusionReason}`
    );

    // Reset Form
    setLender('');
    setTrustName('');
    setRegNum('');
    setPrincipal('800000');
    setInterestCharged('0');
    setOutstanding('800000');
    setRepayments('0');
    setExclusion('None');
    setExemptionApplied(true);

    showBanner("Trust Loan Account successfully added to compliance register.");
  };

  const handleDeleteLoan = (id: string) => {
    if (!checkPermission('canEditTransactions')) {
      showBanner("Access Denied: Your current role is not authorized to delete trust loan accounts.");
      return;
    }

    const loanToDelete = trustLoans.find(l => l.id === id);
    if (!loanToDelete) return;

    setTrustLoans(prev => prev.filter(l => l.id !== id));

    addAuditLog(
      "Trust Loan Removed",
      `Removed loan from ${loanToDelete.lenderName} to ${loanToDelete.trustName} (${formatZAR(loanToDelete.principalAmount)}) from Section 7C schedule.`
    );

    showBanner("Trust Loan Account removed from compliance register.");
  };

  const handleCopyWorkpaper = (text: string) => {
    navigator.clipboard.writeText(text);
    showBanner("Section 7C Disclosure Workpaper copied to clipboard!");
  };

  // Generate disclosure workpaper text
  const getWorkpaperText = () => {
    const loan = calculatedLoans.find(l => l.id === (selectedLoanForWorkpaper || calculatedLoans[0]?.id));
    if (!loan) return "No trust loan selected.";

    return `======================================================================
SARS SECTION 7C COMPLIANCE & DISCLOSURE WORKPAPER (IT144 SUPPLEMENT)
======================================================================
COMPILATION DATE: ${new Date().toLocaleDateString('en-ZA')}
TAX YEAR OF ASSESSMENT: FY2026 (Year ended 28 February 2026)
TAXPAYER / LENDER PROFILE: ${activeProfileName}
----------------------------------------------------------------------

1. TRUST LOAN INFORMATION:
   - Trust Name: ${loan.trustName}
   - Trust Registration Number: ${loan.registrationNumber}
   - Lender Name: ${loan.lenderName}
   - Date of Loan Agreement: ${loan.dateIssued}
   - Original Loan Principal: ${formatZAR(loan.principalAmount)}
   - Outstanding Balance at Year-End: ${formatZAR(loan.outstandingBalance)}
   - Repayments Made in FY2026: ${formatZAR(loan.repaymentsAmountThisYear)}

2. INTEREST & SECTION 7C STATUS:
   - Interest Rate Charged: ${loan.interestRateCharged.toFixed(2)}% per annum
   - SARS Official Repo Rate: ${simRepoRate.toFixed(2)}%
   - SARS Official Rate of Interest: ${loan.effectiveOfficialRate.toFixed(2)}% (Repo + 1.00%)
   - Actual Interest Accrued/Charged: ${formatZAR(loan.actualInterest)}
   - Benchmark Interest at Official Rate: ${formatZAR(loan.officialInterest)}
   - Exclusion/Exemption Claimed: ${loan.exclusionReason}

3. CALCULATED DEEMED DONATION (SECTION 7C(3)):
   ${loan.isExcluded ? `
   * STATUTORY EXCLUSION REGISTERED *
   - Reason for Exclusion: ${loan.exclusionReason}
   - Provision Code: Income Tax Act No 58 of 1962, Sec 7C(5)
   - Net Deemed Donation: R0.00 (Exempt from Section 7C attribution)
   ` : `
   - Gross Deemed Donation: ${formatZAR(loan.deemedDonation)} (Official Rate - Charged Rate)
   - Annual Individual Donation Exemption Applied: ${loan.annualDonationExemptionApplied ? `Yes (${formatZAR(loan.exemptionAllocated)})` : 'No'}
   - Remaining Exemption Pool: ${formatZAR(remainingExemptionLimit)}
   - Net Taxable Deemed Donation: ${formatZAR(loan.taxableDeemedDonation)}
   - Projected Donations Tax Payable (20% rate): ${formatZAR(loan.donationsTax)}
   `}

4. LEGAL CITATION & DISCLOSURE STATEMENT:
   "In terms of Section 7C of the Income Tax Act, where a natural person has made an interest-free or low-interest loan to a trust, the foregone interest is treated as a deemed donation made by that person to the trust on the last day of the trust's year of assessment (28 February 2026). This amount is subject to Donations Tax at 20%, declarable via form IT144 and payable by 31 March 2026, subject to available Section 56(2)(b) annual exemptions of R100,000."

5. PRE-AUDIT SIGN-OFF STATUS:
   - Status: Audit-Ready Evidence Pack Compiled
   - Authorized Representative: ${userRole} Sign-off Verified
   - Vault Attachment Code: SEC7C-IT144-FY2026-NND

======================================================================
`;
  };

  return (
    <div className="space-y-6" id="trust-loans-workspace">
      
      {/* EXPLAINER HEADER BANNER */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 p-5 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-mono font-bold px-2 py-0.5 rounded border border-indigo-500/20 uppercase">
                Section 7C statutory Ledger
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                Anti-Avoidance Rules
              </span>
            </div>
            <h3 className="font-bold text-base text-white mt-1.5 font-display">
              Section 7C Trust Loan Ledger & Compliance Planner
            </h3>
            <p className="text-xs text-white/60 mt-0.5 max-w-2xl leading-relaxed">
              Section 7C of the South African Income Tax Act targets interest-free or low-interest loans made to Trusts. Any interest foregone below the <strong>SARS Official Rate of Interest (Repo + 1%)</strong> is treated as a <strong>Deemed Donation</strong>, subject to 20% Donations Tax by 31 March.
            </p>
          </div>
        </div>
      </div>

      {/* COMPLIANCE METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Trust Loans managed */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-1">
          <span className="text-[10px] text-white/40 uppercase font-mono block">Managed Loan Principal</span>
          <p className="text-xl font-bold font-mono text-white">{formatZAR(totalLoansValue)}</p>
          <div className="flex justify-between text-[10px] text-white/50">
            <span>Outstanding Balance:</span>
            <span className="font-mono text-white/70">{formatZAR(totalOutstanding)}</span>
          </div>
        </div>

        {/* Metric 2: Deemed Donation before exemption */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-1">
          <span className="text-[10px] text-white/40 uppercase font-mono block">Gross Deemed Donation</span>
          <p className="text-xl font-bold font-mono text-amber-400">{formatZAR(totalDeemedDonationBeforeExemption)}</p>
          <div className="flex justify-between text-[10px] text-white/50">
            <span>Interest Charged:</span>
            <span className="font-mono text-emerald-400">{formatZAR(totalInterestCharged)}</span>
          </div>
        </div>

        {/* Metric 3: Exemption applied */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-1">
          <span className="text-[10px] text-white/40 uppercase font-mono block">Sec 56 Exemption Applied</span>
          <p className="text-xl font-bold font-mono text-emerald-400">-{formatZAR(totalExemptionsApplied)}</p>
          <div className="flex justify-between text-[10px] text-white/50">
            <span>Remaining Individual Cap:</span>
            <span className="font-mono text-emerald-300">{formatZAR(remainingExemptionLimit)}</span>
          </div>
        </div>

        {/* Metric 4: Donations Tax Payable */}
        <div className={`p-4 rounded-xl border space-y-1 ${
          totalDonationsTaxDue > 0 
            ? 'bg-rose-500/10 border-rose-500/20' 
            : 'bg-emerald-500/5 border-emerald-500/10'
        }`}>
          <span className="text-[10px] text-white/40 uppercase font-mono block">Est. Section 7C Donations Tax</span>
          <p className={`text-xl font-bold font-mono ${totalDonationsTaxDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {formatZAR(totalDonationsTaxDue)}
          </p>
          <div className="flex justify-between text-[10px] text-white/50">
            <span>Donations Tax Rate:</span>
            <span className="font-mono text-white/70">20.00% (Flat)</span>
          </div>
        </div>

      </div>

      {/* DYNAMIC SIMULATION WORKSPACE */}
      <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin-slow" />
          Interactive Section 7C Compliance Sandbox & Simulation
        </h4>
        <p className="text-[11.5px] text-white/50 leading-relaxed">
          Repo rates in South Africa adjust periodically. Drag the slider to simulate monetary policy changes or evaluate how restructuring loan interest rates mitigates Donations Tax liability.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Slider for simulated repo rate */}
          <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white uppercase tracking-wider text-[10px]">SARS Official Repo Rate</span>
              <span className="font-mono font-bold text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded">
                {simRepoRate.toFixed(2)}%
              </span>
            </div>
            
            <input 
              type="range" 
              min="5.00" 
              max="12.00" 
              step="0.25"
              value={simRepoRate}
              onChange={(e) => setSimRepoRate(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            
            <div className="flex justify-between text-[10px] text-white/40 font-mono">
              <span>Min: 5.00%</span>
              <span>Repo + 1.00% = {simOfficialRate.toFixed(2)}% Official Rate</span>
              <span>Max: 12.00%</span>
            </div>
          </div>

          {/* Compliance Advisory Tips Card */}
          <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/15 flex flex-col justify-center space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
              <Info className="w-4 h-4 shrink-0" />
              <span>Section 7C Statutory Restructuring Advice</span>
            </div>
            <p className="text-[11px] text-white/70 leading-normal">
              {totalDonationsTaxDue > 0 ? (
                <>
                  Your current deemed donation triggers <strong className="text-rose-300">{formatZAR(totalDonationsTaxDue)}</strong> in Donations Tax. To reduce this liability to <strong>R0</strong>, consider restructuring the loan agreements to charge interest of at least <strong className="text-emerald-400">{simOfficialRate.toFixed(2)}%</strong> (matching the current official rate).
                </>
              ) : (
                <>
                  Congratulations! Your current Section 7C Trust Loan Ledger is fully optimized with <strong>R0.00</strong> Donations Tax liability. This is achieved either through statutory exclusions (such as primary residence ownership) or because charged interest rates meet or exceed the official rate of <strong className="text-emerald-400">{simOfficialRate.toFixed(2)}%</strong>.
                </>
              )}
            </p>
          </div>

        </div>
      </div>

      {/* REGISTER OF TRUST LOANS */}
      <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <h4 className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-widest flex items-center gap-1.5 font-display">
            <Coins className="w-4 h-4 text-indigo-400" /> Active Trust Loan Register (Section 7C Inventory)
          </h4>
          <span className="text-[10px] text-white/40 font-mono">FY2026 Year-End Attributions</span>
        </div>

        {calculatedLoans.length === 0 ? (
          <div className="text-center py-10 text-white/30 text-xs font-mono">
            No active trust loan records registered on this tax profile.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-white/40 uppercase text-[10px] border-b border-white/5">
                  <th className="py-2.5 pl-2">Trust Details</th>
                  <th className="py-2.5">Lender Name</th>
                  <th className="py-2.5 text-right">Principal / Outstanding</th>
                  <th className="py-2.5 text-center">Charged Rate</th>
                  <th className="py-2.5 text-right">Deemed Donation</th>
                  <th className="py-2.5 text-center">Exclusion/Exemption</th>
                  <th className="py-2.5 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {calculatedLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-3 pl-2">
                      <div className="font-bold text-white font-display text-[12px]">{loan.trustName}</div>
                      <div className="text-[9.5px] text-white/40 mt-0.5">{loan.registrationNumber}</div>
                    </td>
                    <td className="py-3 text-white/80">{loan.lenderName}</td>
                    <td className="py-3 text-right">
                      <div className="text-white font-bold">{formatZAR(loan.principalAmount)}</div>
                      <div className="text-[9.5px] text-white/40 mt-0.5">Bal: {formatZAR(loan.outstandingBalance)}</div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        loan.interestRateCharged >= simOfficialRate 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : loan.interestRateCharged === 0
                          ? 'bg-red-500/15 text-rose-300'
                          : 'bg-amber-500/10 text-amber-300'
                      }`}>
                        {loan.interestRateCharged.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {loan.isExcluded ? (
                        <span className="text-[9.5px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-wider">
                          EXCLUDED
                        </span>
                      ) : (
                        <div>
                          <div className={`font-bold ${loan.deemedDonation > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {formatZAR(loan.deemedDonation)}
                          </div>
                          {loan.exemptionAllocated > 0 && (
                            <div className="text-[9px] text-emerald-400">-{formatZAR(loan.exemptionAllocated)} Exemp</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-center text-[10.5px]">
                      {loan.isExcluded ? (
                        <div className="text-white/60 text-[10px] italic flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          {loan.exclusionReason}
                        </div>
                      ) : (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          loan.annualDonationExemptionApplied 
                            ? 'bg-emerald-500/15 text-emerald-300 font-bold' 
                            : 'bg-white/5 text-white/40'
                        }`}>
                          {loan.annualDonationExemptionApplied ? 'R100k Exemption Applied' : 'No Exemption'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right pr-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedLoanForWorkpaper(loan.id);
                            setShowWorkpaper(true);
                            addAuditLog("Generated Section 7C Disclosure", `Drafted official tax disclosure worksheet for trust loan to ${loan.trustName}.`);
                          }}
                          className="p-1 text-white/50 hover:text-indigo-400 bg-white/5 hover:bg-white/10 rounded transition-all cursor-pointer"
                          title="Generate SARS Disclosure Workpaper"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteLoan(loan.id)}
                          className="p-1 text-white/50 hover:text-rose-400 bg-white/5 hover:bg-white/10 rounded transition-all cursor-pointer"
                          title="Delete Loan from Ledger"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DISCLOSURE WORKPAPER GENERATION WINDOW */}
      {showWorkpaper && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-4 animate-fade-in animate-duration-300">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-400" />
              <h5 className="font-bold text-sm text-white font-display">
                SARS Section 7C / IT144 Supplemental Disclosure Workpaper
              </h5>
            </div>
            <button 
              onClick={() => setShowWorkpaper(false)}
              className="text-white/40 hover:text-white text-xs bg-white/5 px-2.5 py-1 rounded cursor-pointer"
            >
              Close
            </button>
          </div>

          <p className="text-[11px] text-white/50 leading-relaxed">
            This workspace compiles all necessary regulatory facts into a structured workpaper according to SARS guidelines for supplemental IT144 declarations. Ensure this file is saved inside your <strong>Audit-Ready Vault</strong> as corroborated evidence.
          </p>

          <pre className="bg-black/45 text-slate-300 p-4 rounded-xl text-[10.5px] font-mono leading-relaxed max-h-[350px] overflow-y-auto whitespace-pre border border-white/5 select-all">
            {getWorkpaperText()}
          </pre>

          <div className="flex justify-between items-center text-xs pt-1">
            <span className="text-white/40 italic font-mono">Click inside the workpaper to select all and copy</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopyWorkpaper(getWorkpaperText())}
                className="py-2 px-3.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
              >
                <ClipboardList className="w-4 h-4" /> Copy Disclosure Workpaper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLIANCE FORM: REGISTER TRUST LOAN ACCOUNT */}
      <div className="bg-gradient-to-b from-slate-900 to-indigo-950/20 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-display">
            <Plus className="w-4 h-4 text-emerald-400" /> Register New Trust Loan Account
          </h4>
          <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
            Sec 7C Statutory Attestation
          </span>
        </div>

        <form onSubmit={handleAddLoan} className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Lender Name */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-white/40 uppercase font-bold">Lender Full Name</label>
              <input 
                type="text"
                value={lender}
                onChange={(e) => setLender(e.target.value)}
                placeholder="e.g. Sipho Ndlalose"
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500 text-xs"
                required
              />
            </div>

            {/* Trust Name */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-white/40 uppercase font-bold">Trust Beneficiary Name</label>
              <input 
                type="text"
                value={trustName}
                onChange={(e) => setTrustName(e.target.value)}
                placeholder="e.g. Ndlalose Development Trust"
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500 text-xs"
                required
              />
            </div>

            {/* Registration Number */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-white/40 uppercase font-bold">Trust SARS Reg / Master's No.</label>
              <input 
                type="text"
                value={regNum}
                onChange={(e) => setRegNum(e.target.value)}
                placeholder="e.g. IT002495/2021"
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            {/* Principal Amount */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-white/40 uppercase font-bold">Original Principal (ZAR)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-white/40 text-[11px]">R</span>
                <input 
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  required
                />
              </div>
            </div>

            {/* Outstanding Balance */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-white/40 uppercase font-bold">Outstanding Balance (ZAR)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-white/40 text-[11px]">R</span>
                <input 
                  type="number"
                  value={outstanding}
                  onChange={(e) => setOutstanding(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  required
                />
              </div>
            </div>

            {/* Interest Rate Charged */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-white/40 uppercase font-bold">Lender Interest Charged (% p.a.)</label>
              <div className="relative">
                <input 
                  type="number"
                  step="0.1"
                  value={interestCharged}
                  onChange={(e) => setInterestCharged(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 pr-8 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
                <span className="absolute right-3 top-2 text-white/40">%</span>
              </div>
            </div>

            {/* Repayments */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-white/40 uppercase font-bold">Repayments Made This Year (ZAR)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-white/40 text-[11px]">R</span>
                <input 
                  type="number"
                  value={repayments}
                  onChange={(e) => setRepayments(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>
            </div>

            {/* Exclusion Reasons */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-white/40 uppercase font-bold">Sec 7C(5) Statutory Exclusion</label>
              <select 
                value={exclusion}
                onChange={(e) => setExclusion(e.target.value as TrustLoanAccount['exclusionReason'])}
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500 text-xs h-[34px]"
              >
                <option value="None">None (Section 7C Fully Applies)</option>
                <option value="Primary Residence">Sec 7C(5)(a) - Primary Residence acquisition</option>
                <option value="Special Trust Disability">Sec 7C(5)(c) - Special Trust for Disability</option>
                <option value="Public Benefit Organisation">Sec 7C(5)(d) - Public Benefit Organisation (PBO)</option>
                <option value="Vested Beneficiary Right">Vested right (beneficiary has vested right)</option>
              </select>
            </div>

            {/* Donation Exemption Toggles */}
            <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
              <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                <input 
                  type="checkbox"
                  checked={exemptionApplied}
                  onChange={(e) => setExemptionApplied(e.target.checked)}
                  className="rounded border-white/10 bg-slate-950 text-indigo-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                <span className="text-white/80 font-bold text-[10px] uppercase">
                  Apply R100k Individual Donation Exemption
                </span>
              </label>
            </div>

          </div>

          {/* Form Action Controls */}
          <div className="pt-2 border-t border-white/5 flex justify-end">
            {!checkPermission('canEditTransactions') ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-rose-300 rounded-xl flex items-center gap-2 w-full text-[11px]">
                <Lock className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Access Restricted:</strong> Your simulated role (<strong>{userRole}</strong>) is not authorized to register trust loan accounts. Select Owner or Accountant to submit.
                </span>
              </div>
            ) : (
              <button
                type="submit"
                className="py-2.5 px-5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/15"
              >
                <PlusCircle className="w-4 h-4" /> Register Section 7C Trust Loan
              </button>
            )}
          </div>

        </form>
      </div>

    </div>
  );
};

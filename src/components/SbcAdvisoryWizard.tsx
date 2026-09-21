import React, { useState } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Building2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { EntityProfile } from '../types';

interface SbcAdvisoryWizardProps {
  profile: EntityProfile;
  formatZAR: (val: number) => string;
  addAuditLog?: (action: string, details: string) => void;
  showBanner?: (msg: string) => void;
}

export const SbcAdvisoryWizard: React.FC<SbcAdvisoryWizardProps> = ({
  profile,
  formatZAR,
  addAuditLog,
  showBanner
}) => {
  const [sbcGrossIncome, setSbcGrossIncome] = useState<number>(profile.grossIncome || 8500000);
  const [naturalPersonsOnly, setNaturalPersonsOnly] = useState<boolean>(true);
  const [passiveIncomeRatio, setPassiveIncomeRatio] = useState<number>(0.35); // 0.35%
  const [personalServiceCompany, setPersonalServiceCompany] = useState<boolean>(false);
  const [fullTimeEmployees, setFullTimeEmployees] = useState<number>(4);

  // Section 12E Calculation
  // 2026/2027 SARS Section 12E SBC Brackets:
  // 0 - 95,750: 0%
  // 95,751 - 365,000: 7% of amount > 95,750
  // 365,001 - 550,000: R18,848 + 21% of amount > 365,000
  // 550,001+: R57,698 + 27% of amount > 550,000
  const standardCorporateTax = sbcGrossIncome * 0.27;

  let sbcTaxValue = 0;
  if (sbcGrossIncome <= 95750) {
    sbcTaxValue = 0;
  } else if (sbcGrossIncome <= 365000) {
    sbcTaxValue = (sbcGrossIncome - 95750) * 0.07;
  } else if (sbcGrossIncome <= 550000) {
    sbcTaxValue = 18848 + (sbcGrossIncome - 365000) * 0.21;
  } else {
    sbcTaxValue = 57698 + (sbcGrossIncome - 550000) * 0.27;
  }

  const sbcNetSavings = Math.max(0, standardCorporateTax - sbcTaxValue);

  // Statutory Qualification Criteria
  const qualifiesUnderCap = sbcGrossIncome <= 20000000;
  const qualifiesShareholders = naturalPersonsOnly;
  const qualifiesPassive = passiveIncomeRatio <= 20.0;
  const qualifiesService = !personalServiceCompany || fullTimeEmployees >= 3;

  const isEligible = qualifiesUnderCap && qualifiesShareholders && qualifiesPassive && qualifiesService;

  const handleApplySbcRestructuring = () => {
    if (addAuditLog) {
      addAuditLog('SBC_RESTRUCTURING_SIMULATION', `Simulated Section 12E SBC election for gross income ${formatZAR(sbcGrossIncome)}. Annual tax saved: ${formatZAR(sbcNetSavings)}`);
    }
    if (showBanner) {
      showBanner(`✨ Section 12E SBC Restructuring Saved ${formatZAR(sbcNetSavings)} in corporate tax!`);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn" id="sbc-advisory-wizard-root">
      
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" /> 
            Small Business Corporation (SBC) Bracket Advisor & Restructuring
          </h4>
          <p className="text-[11px] text-white/50 font-mono">
            Income Tax Act 58 of 1962 §12E (Progressive Marginal Corporate Rates vs Flat 27%)
          </p>
        </div>
        <span className="text-[9.5px] uppercase font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          SARS §12E WIZARD
        </span>
      </div>

      <p className="text-xs text-white/70 leading-relaxed">
        Qualifying South African businesses with turnover under R20,000,000 can elect <strong className="text-white">Section 12E SBC status</strong>, granting access to a <strong className="text-emerald-400">0% tax rate on the first R95,000</strong> and reduced 7% & 21% progressive brackets, alongside accelerated 100% upfront depreciation on manufacturing assets.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* INPUTS & QUALIFYING TESTS */}
        <div className="space-y-4 bg-black/30 p-4 rounded-2xl border border-white/10">
          <h5 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            Statutory Parameters & Tests
          </h5>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">
                Annual Taxable Income / Gross Receipts (ZAR)
              </label>
              <input 
                type="number"
                value={sbcGrossIncome}
                onChange={(e) => setSbcGrossIncome(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[9.5px] text-white/40 font-mono mt-0.5 block">
                SARS §12E Cap: Max R20,000,000 per tax year
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">
                Qualifying Statutory Checkpoints:
              </span>
              
              <label className="flex items-center gap-2 text-[11px] text-white/80 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={naturalPersonsOnly} 
                  onChange={(e) => setNaturalPersonsOnly(e.target.checked)}
                  className="rounded border-white/20 text-cyan-500 focus:ring-0"
                />
                <span>Shareholders are strictly natural persons throughout the tax year</span>
              </label>

              <div className="flex items-center justify-between text-[11px] text-white/80">
                <span>Investment / Passive Income Ratio:</span>
                <span className="font-mono text-cyan-300">{passiveIncomeRatio}% (Max 20%)</span>
              </div>

              <label className="flex items-center gap-2 text-[11px] text-white/80 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={personalServiceCompany} 
                  onChange={(e) => setPersonalServiceCompany(e.target.checked)}
                  className="rounded border-white/20 text-cyan-500 focus:ring-0"
                />
                <span>Classified as a Personal Service Provider (PSP)</span>
              </label>

              {personalServiceCompany && (
                <div className="pl-5 text-[10px] text-amber-300">
                  <span>Full-time non-connected employees: {fullTimeEmployees} (Requires ≥3 to qualify)</span>
                </div>
              )}
            </div>

            {/* STATUS BADGE */}
            <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              isEligible 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {isEligible ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span>{isEligible ? 'Meets all SARS Section 12E statutory tests' : 'Disqualified: Check statutory criteria'}</span>
            </div>
          </div>
        </div>

        {/* COMPARISON & SAVINGS ENGINE */}
        <div className="bg-gradient-to-br from-cyan-950/20 to-slate-900/40 p-4 rounded-2xl border border-cyan-500/20 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h5 className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Tax Comparison (Standard vs Section 12E)
            </h5>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-white/70 text-[11px] bg-black/20 p-2 rounded-xl">
                <span>Standard Corporate Tax (Flat 27%):</span>
                <strong className="text-rose-400 font-mono">{formatZAR(standardCorporateTax)}</strong>
              </div>
              <div className="flex justify-between text-white/70 text-[11px] bg-black/20 p-2 rounded-xl">
                <span>Section 12E Progressive SBC Tax:</span>
                <strong className="text-emerald-400 font-mono">{formatZAR(sbcTaxValue)}</strong>
              </div>
              <div className="flex justify-between border-t border-cyan-500/20 pt-2 text-white font-bold bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20">
                <span>Net Annual Retained Cashflow:</span>
                <strong className="text-emerald-300 font-mono text-sm">{formatZAR(sbcNetSavings)}</strong>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-[10.5px] text-white/80 leading-relaxed">
              🎉 Electing Section 12E SBC preserves <strong className="text-emerald-300 font-mono font-bold">{formatZAR(sbcNetSavings)}</strong> of working capital for business reinvestment, hiring, and growth.
            </div>
          </div>

          <button
            onClick={handleApplySbcRestructuring}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Apply Section 12E SBC Optimization</span>
          </button>
        </div>

      </div>
    </div>
  );
};

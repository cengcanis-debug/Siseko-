import React, { useState } from 'react';
import { 
  PiggyBank, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  ShieldCheck, 
  DollarSign, 
  Lock, 
  Unlock, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { EntityProfile } from '../types';

interface TwoPotRetirementSimulatorProps {
  profile: EntityProfile;
  formatZAR: (val: number) => string;
  addAuditLog: (action: string, details: string) => void;
  showBanner: (msg: string) => void;
}

export const TwoPotRetirementSimulator: React.FC<TwoPotRetirementSimulatorProps> = ({
  profile,
  formatZAR,
  addAuditLog,
  showBanner
}) => {
  const [totalFundValue, setTotalFundValue] = useState<number>(1200000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(6500);
  const [taxpayerMarginalRate, setTaxpayerMarginalRate] = useState<number>(36); // 36% marginal rate
  const [withdrawalAmount, setWithdrawalAmount] = useState<number>(25000);
  const [yearsToRetirement, setYearsToRetirement] = useState<number>(18);
  const [assumedAnnualReturn, setAssumedAnnualReturn] = useState<number>(9.5); // 9.5% annual return

  // Two-Pot Splits
  // Vested Pot (e.g. 70% of legacy fund)
  const vestedPotValue = totalFundValue * 0.65;
  // Savings Pot (1/3 of active savings + seeding)
  const savingsPotValue = totalFundValue * 0.12;
  // Retirement Pot (2/3 of active savings)
  const retirementPotValue = totalFundValue * 0.23;

  // Maximum allowable withdrawal from Savings Pot (minimum R2,000 once per tax year)
  const maxSavingsWithdrawal = Math.max(0, savingsPotValue);
  const clampedWithdrawal = Math.min(withdrawalAmount, maxSavingsWithdrawal);

  // Pre-retirement withdrawal tax calculation (Marginal rate)
  const sarsMarginalTaxDeduction = clampedWithdrawal * (taxpayerMarginalRate / 100);
  const netCashInPocket = clampedWithdrawal - sarsMarginalTaxDeduction;

  // Compound future value if NOT withdrawn
  // FV = P * (1 + r)^n
  const futureCompoundValue = clampedWithdrawal * Math.pow(1 + assumedAnnualReturn / 100, yearsToRetirement);
  const lostRetirementWealth = futureCompoundValue - clampedWithdrawal;

  // Retirement pot lump sum tax comparison (under SARS Retirement Lump Sum Table: first R550k tax-free)
  const taxAtRetirementEstimate = clampedWithdrawal > 550000 ? clampedWithdrawal * 0.18 : 0;

  const handleSimulateWithdrawal = () => {
    addAuditLog(
      'TWO_POT_WITHDRAWAL_SIMULATED',
      `Simulated Savings Pot withdrawal of ${formatZAR(clampedWithdrawal)}. Marginal Tax (SARS): ${formatZAR(sarsMarginalTaxDeduction)}. Opportunity cost at retirement: ${formatZAR(futureCompoundValue)}.`
    );
    showBanner(`💡 Two-Pot Simulation: Net cash ${formatZAR(netCashInPocket)} after ${taxpayerMarginalRate}% marginal tax.`);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="two-pot-retirement-simulator-root">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-emerald-400" />
            SARS Two-Pot Retirement System & Capital Preservation Engine
          </h3>
          <p className="text-xs text-white/50">
            Simulate pre-retirement Savings Pot withdrawals vs tax-free compound growth under Revenue Laws Amendment Act
          </p>
        </div>
        <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
          TWO-POT STATUTORY RULES
        </span>
      </div>

      {/* THREE POTS VISUAL ALLOCATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* SAVINGS POT */}
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Savings Pot (1/3)</span>
            </span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
              ACCESSIBLE
            </span>
          </div>
          <div className="text-lg font-bold text-white font-mono">{formatZAR(savingsPotValue)}</div>
          <p className="text-[10.5px] text-white/60 leading-relaxed">
            Accessible 1x per tax year (min R2,000). Taxed at your current <strong>marginal income tax bracket ({taxpayerMarginalRate}%)</strong>.
          </p>
        </div>

        {/* RETIREMENT POT */}
        <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Retirement Pot (2/3)</span>
            </span>
            <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">
              LOCKED TO 55+
            </span>
          </div>
          <div className="text-lg font-bold text-white font-mono">{formatZAR(retirementPotValue)}</div>
          <p className="text-[10.5px] text-white/60 leading-relaxed">
            Strictly preserved until retirement to purchase an annuity. Grows 100% tax-free inside the fund (Section 10(1)(k)).
          </p>
        </div>

        {/* VESTED POT */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase text-white/50 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-white/40" />
              <span>3. Vested Pot (Legacy)</span>
            </span>
            <span className="text-[9px] bg-white/10 text-white/60 px-2 py-0.5 rounded font-mono">
              PRE-2024 ACCRUALS
            </span>
          </div>
          <div className="text-lg font-bold text-white font-mono">{formatZAR(vestedPotValue)}</div>
          <p className="text-[10.5px] text-white/60 leading-relaxed">
            Protected rights from contributions prior to 1 September 2024. Subject to legacy withdrawal and retirement rules.
          </p>
        </div>

      </div>

      {/* INTERACTIVE WITHDRAWAL SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* INPUT PARAMETERS */}
        <div className="bg-black/30 border border-white/10 p-5 rounded-2xl space-y-4 text-xs">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Configure Savings Pot Withdrawal</span>
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Proposed Withdrawal Amount:</span>
                <strong className="text-emerald-400 font-mono">{formatZAR(clampedWithdrawal)}</strong>
              </div>
              <input
                type="range"
                min="2000"
                max={Math.max(2000, savingsPotValue)}
                step="1000"
                value={clampedWithdrawal}
                onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-white/40 font-mono mt-1">
                <span>Min: R2,000</span>
                <span>Max Available: {formatZAR(savingsPotValue)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Taxpayer Marginal Rate</label>
                <select
                  value={taxpayerMarginalRate}
                  onChange={(e) => setTaxpayerMarginalRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                >
                  <option value={18}>18% (Up to R237,100)</option>
                  <option value={26}>26% (R237,101 - R370,500)</option>
                  <option value={31}>31% (R370,501 - R512,800)</option>
                  <option value={36}>36% (R512,801 - R673,000)</option>
                  <option value={39}>39% (R673,001 - R857,900)</option>
                  <option value={41}>41% (R857,901 - R1,817,000)</option>
                  <option value={45}>45% (R1,817,001+)</option>
                </select>
              </div>

              <div>
                <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Years to Retirement</label>
                <input
                  type="number"
                  value={yearsToRetirement}
                  onChange={(e) => setYearsToRetirement(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  min="1"
                  max="40"
                />
              </div>
            </div>

            <button
              onClick={handleSimulateWithdrawal}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate SARS Directive & Tax Liability</span>
            </button>
          </div>
        </div>

        {/* COMPARISON EVALUATION & OPPORTUNITY COST */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between space-y-4 text-xs">
          <div>
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-3">
              Immediate Cash vs. Long-Term Compound Loss
            </h4>

            <div className="space-y-2.5">
              <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-white/70">Gross Withdrawal:</span>
                  <strong className="text-white font-mono">{formatZAR(clampedWithdrawal)}</strong>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-rose-400">SARS Marginal Tax ({taxpayerMarginalRate}%):</span>
                  <strong className="text-rose-400 font-mono">-{formatZAR(sarsMarginalTaxDeduction)}</strong>
                </div>
                <div className="flex justify-between items-center text-[11.5px] border-t border-white/10 pt-1 font-bold">
                  <span className="text-emerald-300">Net Cash Deposited in Bank:</span>
                  <strong className="text-emerald-300 font-mono">{formatZAR(netCashInPocket)}</strong>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-white/70">Compound Value at Retirement ({yearsToRetirement} yrs @ {assumedAnnualReturn}%):</span>
                  <strong className="text-amber-300 font-mono font-bold">{formatZAR(futureCompoundValue)}</strong>
                </div>
                <div className="text-[10px] text-amber-200/80 leading-relaxed">
                  ⚠️ Withdrawing {formatZAR(clampedWithdrawal)} today will forfeit <strong className="text-amber-300 font-mono">{formatZAR(lostRetirementWealth)}</strong> in tax-free investment growth at retirement.
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-white/40 border-t border-white/10 pt-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>SARS requires an automated electronic tax directive before fund administrators can pay out any Savings Pot lump sum.</span>
          </div>
        </div>

      </div>

    </div>
  );
};

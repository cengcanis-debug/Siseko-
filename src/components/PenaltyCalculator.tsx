import React, { useState, useMemo } from 'react';
import {
  Percent,
  Calendar,
  AlertTriangle,
  Scale,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Copy,
  Check,
  Download,
  Info,
  DollarSign,
  Clock,
  Sparkles,
  RefreshCw,
  FileText,
  Briefcase
} from 'lucide-react';
import { formatZAR } from '../utils/taxCalculations';
import { downloadBlobFile } from '../utils/systemBridge';

export type OverdueTaxType = 
  | 'PROVISIONAL_TAX' 
  | 'VAT201' 
  | 'PAYE_EMP201' 
  | 'CORPORATE_ITR14' 
  | 'INDIVIDUAL_ITR12';

export interface PenaltyCalculatorProps {
  initialOverdueAmount?: number;
  initialTaxType?: OverdueTaxType;
  showBanner?: (msg: string) => void;
  onNavigateToVdp?: () => void;
  onNavigateToTaxPro?: () => void;
}

export const PenaltyCalculator: React.FC<PenaltyCalculatorProps> = ({
  initialOverdueAmount = 45000,
  initialTaxType = 'PROVISIONAL_TAX',
  showBanner = (_msg?: string) => {},
  onNavigateToVdp,
  onNavigateToTaxPro
}) => {
  // 1. Core State
  const [overdueAmount, setOverdueAmount] = useState<number>(initialOverdueAmount);
  const [taxType, setTaxType] = useState<OverdueTaxType>(initialTaxType);
  const [sarsRatePercent, setSarsRatePercent] = useState<number>(11.75); // Current official SARS Prescribed Rate
  const [calculationMode, setCalculationMode] = useState<'DAILY_SIMPLE' | 'MONTHLY_COMPOUND'>('DAILY_SIMPLE');

  // Dates state
  // Default due date: 60 days ago
  const defaultDueDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return d.toISOString().split('T')[0];
  }, []);

  const [dueDate, setDueDate] = useState<string>(defaultDueDate);
  const [settlementDate, setSettlementDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Penalties state
  const [applyLatePaymentPenalty, setApplyLatePaymentPenalty] = useState<boolean>(true); // 10% statutory penalty
  const [understatementTier, setUnderstatementTier] = useState<
    'NONE' | 'VDP_ZERO' | 'STANDARD_CASE' | 'RECKLESS' | 'NO_REASONABLE_GROUNDS' | 'INTENTIONAL'
  >('NONE');

  const [copiedBreakdown, setCopiedBreakdown] = useState<boolean>(false);

  // 2. Calculations Engine (TAA §187, §189, §213, §223)
  const calculation = useMemo(() => {
    const due = new Date(dueDate);
    const settle = new Date(settlementDate);
    const diffTime = settle.getTime() - due.getTime();
    const daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const monthsOverdue = daysOverdue / 30.4167;

    const principal = Math.max(0, overdueAmount);
    const annualRateDecimal = sarsRatePercent / 100;

    // Daily interest rate
    const dailyRate = annualRateDecimal / 365;
    const dailyInterestZAR = principal * dailyRate;

    // Accrued Interest
    let accruedInterestZAR = 0;
    if (calculationMode === 'DAILY_SIMPLE') {
      accruedInterestZAR = principal * (annualRateDecimal * (daysOverdue / 365));
    } else {
      // Monthly compounding (TAA Section 187(2))
      const monthlyRate = annualRateDecimal / 12;
      accruedInterestZAR = principal * (Math.pow(1 + monthlyRate, monthsOverdue) - 1);
    }

    // 10% Late Payment Penalty (TAA Section 213, VAT Act Section 39, Para 27(1))
    const latePaymentPenaltyRate = applyLatePaymentPenalty ? 0.10 : 0.0;
    const latePaymentPenaltyZAR = principal * latePaymentPenaltyRate;

    // Understatement Penalty (TAA Section 223 Table)
    let understatementRate = 0;
    switch (understatementTier) {
      case 'VDP_ZERO':
        understatementRate = 0;
        break;
      case 'STANDARD_CASE':
        understatementRate = 0.10;
        break;
      case 'RECKLESS':
        understatementRate = 0.25;
        break;
      case 'NO_REASONABLE_GROUNDS':
        understatementRate = 0.50;
        break;
      case 'INTENTIONAL':
        understatementRate = 1.00;
        break;
      case 'NONE':
      default:
        understatementRate = 0.0;
        break;
    }

    const understatementPenaltyZAR = principal * understatementRate;

    // Total liabilities
    const totalPenaltiesZAR = latePaymentPenaltyZAR + understatementPenaltyZAR;
    const totalPayableZAR = principal + totalPenaltiesZAR + accruedInterestZAR;

    // VDP Savings calculation (TAA Section 229 wipes understatement penalties to 0%)
    const potentialVdpSavingsZAR = understatementPenaltyZAR + (latePaymentPenaltyZAR * 0.5); // VDP often allows partial/full penalty remission

    return {
      daysOverdue,
      monthsOverdue: monthsOverdue.toFixed(1),
      dailyInterestZAR,
      accruedInterestZAR,
      latePaymentPenaltyZAR,
      understatementRate,
      understatementPenaltyZAR,
      totalPenaltiesZAR,
      totalPayableZAR,
      potentialVdpSavingsZAR
    };
  }, [overdueAmount, dueDate, settlementDate, sarsRatePercent, calculationMode, applyLatePaymentPenalty, understatementTier]);

  // Quick preset helper
  const handleApplyDayPreset = (days: number) => {
    const due = new Date();
    due.setDate(due.getDate() - days);
    setDueDate(due.toISOString().split('T')[0]);
    setSettlementDate(new Date().toISOString().split('T')[0]);
    showBanner(`Applied ${days}-day overdue period`);
  };

  // Statutory Citations based on Tax Type
  const taxTypeDetails = useMemo(() => {
    switch (taxType) {
      case 'VAT201':
        return {
          title: 'Value-Added Tax (VAT201)',
          penaltyStatute: 'VAT Act 89 of 1991, Section 39(1)(a)(i) — Immediate 10% penalty on unpaid output tax.',
          interestStatute: 'VAT Act Section 39(1)(a)(ii) read with TAA Section 189 at Prescribed Rate.',
          deadlineRule: 'Due on the 25th of the month following the bi-monthly tax period (or last business day on eFiling).'
        };
      case 'PAYE_EMP201':
        return {
          title: 'Employees Tax / PAYE (EMP201)',
          penaltyStatute: 'Fourth Schedule to Income Tax Act, Paragraph 6(1) — 10% penalty for late payment of PAYE, SDL, or UIF.',
          interestStatute: 'Fourth Schedule Paragraph 6(2) read with TAA §187 Prescribed Rate.',
          deadlineRule: 'Due on or before the 7th day of the calendar month following the deduction.'
        };
      case 'CORPORATE_ITR14':
        return {
          title: 'Corporate Income Tax (ITR14)',
          penaltyStatute: 'Tax Administration Act Section 213 — 10% penalty on outstanding assessed tax liability.',
          interestStatute: 'Income Tax Act Section 89quat interest on underestimation of taxable income.',
          deadlineRule: 'Due 12 months after financial year-end closing.'
        };
      case 'INDIVIDUAL_ITR12':
        return {
          title: 'Individual Income Tax (ITR12)',
          penaltyStatute: 'Tax Administration Act Section 213 late payment penalty.',
          interestStatute: 'TAA Section 187 interest calculated from notice due date until settlement date.',
          deadlineRule: 'Due by annual tax season closing deadline (October for non-provisional).'
        };
      case 'PROVISIONAL_TAX':
      default:
        return {
          title: 'Provisional Tax (IRP6)',
          penaltyStatute: 'Fourth Schedule to Income Tax Act, Paragraph 27(1) — 10% penalty on late provisional tax payment.',
          interestStatute: 'Income Tax Act Section 89quat(2) interest on underestimation of provisional tax.',
          deadlineRule: 'Cycle 1 due 31 August; Cycle 2 due 28/29 February.'
        };
    }
  }, [taxType]);

  // Export CSV
  const handleExportCsv = () => {
    const csvContent = [
      'SARS Prescribed Interest & Penalty Calculation Schedule',
      `Taxpayer Reference:,"${taxTypeDetails.title}"`,
      `Statutory Authority:,"TAA Section 187-189 & PFMA"`,
      `Generated Date:,"${new Date().toISOString()}"`,
      '',
      'Parameter,Value',
      `Overdue Tax Principal,${formatZAR(overdueAmount)}`,
      `Tax Type,"${taxTypeDetails.title}"`,
      `Statutory Due Date,${dueDate}`,
      `Settlement / Payment Date,${settlementDate}`,
      `Days Elapsed,${calculation.daysOverdue} days`,
      `SARS Prescribed Rate,${sarsRatePercent}% p.a.`,
      `Calculation Method,"${calculationMode === 'DAILY_SIMPLE' ? 'Daily Simple (TAA §187)' : 'Monthly Compounded'}"`,
      `Daily Interest Accrual,${formatZAR(calculation.dailyInterestZAR)} / day`,
      `Accrued Statutory Interest,${formatZAR(calculation.accruedInterestZAR)}`,
      `10% Late Payment Penalty,${formatZAR(calculation.latePaymentPenaltyZAR)}`,
      `Understatement Penalty (${(calculation.understatementRate * 100).toFixed(0)}%),${formatZAR(calculation.understatementPenaltyZAR)}`,
      `Total Statutory Penalties,${formatZAR(calculation.totalPenaltiesZAR)}`,
      `TOTAL PAYABLE TO SARS,${formatZAR(calculation.totalPayableZAR)}`,
      `Potential VDP Section 227 Savings,${formatZAR(calculation.potentialVdpSavingsZAR)}`
    ].join('\n');

    downloadBlobFile(
      `SARS_Penalty_Interest_Schedule_${Date.now()}.csv`,
      csvContent,
      'text/csv;charset=utf-8;'
    );
    showBanner('📥 Downloaded SARS Penalty & Interest Calculation Schedule CSV');
  };

  // Copy breakdown to clipboard
  const handleCopyBreakdown = () => {
    const text = `SARS TAX SETTLEMENT BREAKDOWN:
Tax Type: ${taxTypeDetails.title}
Principal Overdue: ${formatZAR(overdueAmount)}
Days Overdue: ${calculation.daysOverdue} days (Due: ${dueDate} | Settle: ${settlementDate})
SARS Prescribed Rate: ${sarsRatePercent}% p.a.
- Accrued Interest: ${formatZAR(calculation.accruedInterestZAR)}
- 10% Late Penalty: ${formatZAR(calculation.latePaymentPenaltyZAR)}
- Understatement Penalty: ${formatZAR(calculation.understatementPenaltyZAR)}
TOTAL STATUTORY PAYABLE: ${formatZAR(calculation.totalPayableZAR)}
(Authority: Tax Administration Act 28 of 2011 §187, §189 & §213)`;

    navigator.clipboard.writeText(text);
    setCopiedBreakdown(true);
    setTimeout(() => setCopiedBreakdown(false), 3000);
    showBanner('📋 Copied SARS settlement breakdown to clipboard');
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="penalty-calculator-root">
      
      {/* 1. HEADER & REGULATORY NOTIFICATION BANNER */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-[#0A0E1A] border border-rose-500/30 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  TAA §187 & §189
                </span>
                <span className="text-[11px] font-mono text-cyan-300 font-semibold">
                  Official SARS Prescribed Interest Rate: {sarsRatePercent}% p.a.
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white tracking-wide mt-0.5">
                SARS Late Payment Interest & Statutory Penalty Calculator
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Download detailed computation schedule CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Schedule CSV</span>
            </button>

            <button
              onClick={handleCopyBreakdown}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Copy payment breakdown"
            >
              {copiedBreakdown ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-rose-400" />}
              <span>{copiedBreakdown ? 'Copied!' : 'Copy Breakdown'}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Under <strong>Section 187 of the Tax Administration Act 28 of 2011 (TAA)</strong>, interest accrues daily on any outstanding tax debt from the statutory due date until full settlement at the official <strong>Prescribed Rate (currently 11.75%)</strong>. Unpaid taxes also attract an immediate <strong>10% late payment penalty</strong> (TAA §213).
        </p>
      </div>

      {/* 2. DUAL COLUMN WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Calculation Parameters (7 Cols) */}
        <div className="lg:col-span-7 space-y-5 bg-[#0D1527] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              <span>1. Overdue Liability Configuration</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Live Mod-10 Calculator
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Tax Type Selector */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Tax Type & Statutory Governing Provision
              </label>
              <select
                value={taxType}
                onChange={(e) => setTaxType(e.target.value as OverdueTaxType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-rose-400 cursor-pointer"
              >
                <option value="PROVISIONAL_TAX">Provisional Tax (IRP6) — Para 27(1) 10% Penalty</option>
                <option value="VAT201">Value-Added Tax (VAT201) — S39(1)(a) 10% Penalty</option>
                <option value="PAYE_EMP201">Employees Tax / PAYE (EMP201) — Para 6(1) 10% Penalty</option>
                <option value="CORPORATE_ITR14">Corporate Income Tax (ITR14) — TAA §213 & S89quat</option>
                <option value="INDIVIDUAL_ITR12">Individual Income Tax (ITR12) — TAA §213 Penalty</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1 italic">
                {taxTypeDetails.penaltyStatute}
              </p>
            </div>

            {/* Overdue Principal Input */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Overdue Tax Principal (ZAR) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold">R</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={overdueAmount}
                  onChange={(e) => setOverdueAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-rose-400"
                  placeholder="45000"
                />
              </div>
            </div>

            {/* Dates: Due Date & Settlement Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Statutory Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-rose-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Filing/payment deadline
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Target Settlement Date *
                </label>
                <input
                  type="date"
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-rose-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Projected date of payment
                </span>
              </div>
            </div>

            {/* Quick Overdue Preset Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-slate-400 text-[11px] font-mono mr-1">Overdue presets:</span>
              {[30, 60, 90, 180, 365].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleApplyDayPreset(days)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-mono transition cursor-pointer"
                >
                  {days} Days
                </button>
              ))}
            </div>

            {/* Prescribed Rate Settings */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-rose-400" />
                  <span>SARS Prescribed Interest Rate (% p.a.)</span>
                </label>
                <span className="text-[10px] font-mono text-cyan-300">TAA §189 / PFMA</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="30"
                  value={sarsRatePercent}
                  onChange={(e) => setSarsRatePercent(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[11.75, 11.50, 11.25, 10.50].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setSarsRatePercent(rate)}
                      className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer transition ${
                        sarsRatePercent === rate
                          ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {rate}% {rate === 11.75 ? '(Current)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                <span>Calculation method:</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="calcMode"
                      checked={calculationMode === 'DAILY_SIMPLE'}
                      onChange={() => setCalculationMode('DAILY_SIMPLE')}
                      className="text-rose-500"
                    />
                    <span>Daily Simple (§187)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="calcMode"
                      checked={calculationMode === 'MONTHLY_COMPOUND'}
                      onChange={() => setCalculationMode('MONTHLY_COMPOUND')}
                      className="text-rose-500"
                    />
                    <span>Monthly Compound</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Penalties Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* 10% Late Payment Penalty Toggle */}
              <div
                onClick={() => setApplyLatePaymentPenalty(!applyLatePaymentPenalty)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                  applyLatePaymentPenalty
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    : 'bg-slate-900 border-white/5 text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={applyLatePaymentPenalty}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-rose-500 cursor-pointer pointer-events-none"
                />
                <div>
                  <span className="font-semibold text-white block">10% Late Payment Penalty</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Statutory levy under TAA §213 / Para 27.
                  </span>
                </div>
              </div>

              {/* Understatement Penalty Tier */}
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                <label className="font-semibold text-white block">
                  Understatement Penalty (TAA §223)
                </label>
                <select
                  value={understatementTier}
                  onChange={(e) => setUnderstatementTier(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white text-[11px] focus:outline-none"
                >
                  <option value="NONE">0% — Standard (No Audit Finding)</option>
                  <option value="VDP_ZERO">0% — VDP Relief (§229 Protection)</option>
                  <option value="STANDARD_CASE">10% — Standard Care-Less</option>
                  <option value="RECKLESS">25% — Lack of Reasonable Care</option>
                  <option value="NO_REASONABLE_GROUNDS">50% — Standard Audit Writeback</option>
                  <option value="INTENTIONAL">100% — Gross Negligence / Intentional</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Statutory Exposure Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 bg-[#0D1527] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-rose-400" />
                <span>2. Liability & Exposure Breakdown</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                {calculation.daysOverdue} Days Overdue
              </span>
            </div>

            {/* Total Payable Prominent Hero Metric */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-rose-950/60 via-slate-950 to-slate-900 border border-rose-500/40 space-y-1.5">
              <span className="text-[11px] uppercase font-mono text-slate-400 font-semibold block">
                Total Amount Payable to SARS
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
                {formatZAR(calculation.totalPayableZAR)}
              </div>
              <div className="text-[11px] text-rose-300 font-mono flex items-center gap-1.5 pt-1">
                <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Daily interest accrual: {formatZAR(calculation.dailyInterestZAR)} / day</span>
              </div>
            </div>

            {/* Line Item Breakdown */}
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                <div className="space-y-0.5">
                  <span className="text-white font-medium block">Principal Tax Overdue</span>
                  <span className="text-[10px] text-slate-400 font-mono">Original debt</span>
                </div>
                <span className="font-mono font-bold text-white text-sm">
                  {formatZAR(overdueAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                <div className="space-y-0.5">
                  <span className="text-white font-medium flex items-center gap-1">
                    <span>Statutory 10% Late Penalty</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-rose-500/20 text-rose-300">TAA §213</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {applyLatePaymentPenalty ? '10% flat levy' : 'Penalty waived'}
                  </span>
                </div>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  +{formatZAR(calculation.latePaymentPenaltyZAR)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                <div className="space-y-0.5">
                  <span className="text-white font-medium flex items-center gap-1">
                    <span>Accrued Prescribed Interest</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-300">§187</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {sarsRatePercent}% p.a. for {calculation.daysOverdue} days
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  +{formatZAR(calculation.accruedInterestZAR)}
                </span>
              </div>

              {calculation.understatementPenaltyZAR > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
                  <div className="space-y-0.5">
                    <span className="text-white font-medium flex items-center gap-1">
                      <span>Understatement Penalty</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-rose-500/20 text-rose-300">§223</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(calculation.understatementRate * 100).toFixed(0)}% audit exposure tier
                    </span>
                  </div>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    +{formatZAR(calculation.understatementPenaltyZAR)}
                  </span>
                </div>
              )}
            </div>

            {/* VDP Relief & Savings Opportunity Box */}
            <div className="mt-4 p-3.5 rounded-2xl bg-teal-950/40 border border-teal-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Proactive VDP Relief Potential</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                  TAA §227–229
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                By lodging an unprompted Voluntary Disclosure (VDP) before SARS audit notification, understatement penalties are reduced to <strong>0%</strong>, saving up to <strong>{formatZAR(calculation.potentialVdpSavingsZAR)}</strong> with full statutory prosecution immunity.
              </p>
              {onNavigateToVdp && (
                <button
                  onClick={onNavigateToVdp}
                  className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Open Voluntary Disclosure Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
            <button
              onClick={handleCopyBreakdown}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Copy Breakdown</span>
            </button>

            {onNavigateToTaxPro && (
              <button
                onClick={onNavigateToTaxPro}
                className="flex-1 py-2 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 font-medium border border-purple-500/40 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                <span>Consult Tax Pro</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 3. STATUTORY FOOTNOTE & REPO RATE CONTEXT */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Statutory Authority & Prescribed Rate Determinations</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          The SARS Prescribed Interest Rate is promulgated by the Minister of Finance under the Public Finance Management Act (PFMA) No. 1 of 1999 and applied under Section 189 of the Tax Administration Act No. 28 of 2011. The current rate is pegged to the South African Reserve Bank (SARB) repo rate plus the statutory margin. Interest continues to accrue until the payment reflects on the SARS core accounting ledger.
        </p>
      </div>

    </div>
  );
};

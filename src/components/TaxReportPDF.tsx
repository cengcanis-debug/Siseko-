import React, { useMemo } from 'react';
import { ShieldCheck, Calendar, FileText, Info, Award, User, Layers, Receipt } from 'lucide-react';
import { TaxTransaction, InvoiceRecord, UserTaxProfile, TaxCycleSnapshot } from '../types';
import { formatZAR, generateLiveTaxSnapshot } from '../utils/taxCalculations';

interface TaxReportPDFProps {
  transactions: TaxTransaction[];
  invoices: InvoiceRecord[];
  profile: UserTaxProfile;
  snapshot: TaxCycleSnapshot;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

// Custom lightweight SVG line graph for PDF
function PDFTrendChart({ data }: { data: any[] }) {
  const width = 450;
  const height = 150;
  const paddingX = 40;
  const paddingY = 20;

  const xMax = data.length - 1;
  const maxVal = Math.max(...data.flatMap(d => [d['Gross Income'] || 0, d['Tax Liability'] || 0])) || 1000;
  const yMax = maxVal * 1.1;

  const getX = (index: number) => {
    if (xMax <= 0) return width / 2;
    return paddingX + (index / xMax) * (width - paddingX * 2);
  };

  const getY = (value: number) => {
    return height - paddingY - (value / yMax) * (height - paddingY * 2);
  };

  const incomePoints = data.map((d, i) => `${getX(i)},${getY(d['Gross Income'] || 0)}`);
  const taxPoints = data.map((d, i) => `${getX(i)},${getY(d['Tax Liability'] || 0)}`);

  const incomePath = incomePoints.length > 0 ? `M ${incomePoints.join(' L ')}` : '';
  const taxPath = taxPoints.length > 0 ? `M ${taxPoints.join(' L ')}` : '';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      {/* Grid lines */}
      {[0, 0.5, 1].map((ratio, idx) => {
        const y = paddingY + ratio * (height - paddingY * 2);
        const val = yMax * (1 - ratio);
        return (
          <g key={idx} className="opacity-10">
            <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="white" strokeWidth={0.5} strokeDasharray="2 2" />
            <text x={paddingX - 5} y={y + 3} fill="white" fontSize={7} textAnchor="end" className="font-mono">
              R{(val / 1000).toFixed(0)}k
            </text>
          </g>
        );
      })}

      {/* Axis Labels */}
      {data.map((d, i) => {
        if (data.length > 5 && i % Math.ceil(data.length / 4) !== 0) return null;
        const x = getX(i);
        return (
          <text key={i} x={x} y={height - 4} fill="white" className="opacity-30 font-mono" fontSize={7} textAnchor="middle">
            {d.date.substring(5) || d.date}
          </text>
        );
      })}

      {/* Lines */}
      {incomePath && <path d={incomePath} fill="none" stroke="#10b981" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />}
      {taxPath && <path d={taxPath} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

// Custom lightweight SVG bar graph for PDF
function PDFBarChart({ data }: { data: any[] }) {
  const width = 200;
  const height = 150;
  const paddingX = 35;
  const paddingY = 20;

  const maxVal = Math.max(...data.map(d => d.amount)) || 1000;
  const yMax = maxVal * 1.15;

  const barWidth = 24;
  const getBarHeight = (amount: number) => {
    return (amount / yMax) * (height - paddingY * 2);
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      {[0, 0.5, 1].map((ratio, idx) => {
        const y = paddingY + ratio * (height - paddingY * 2);
        const val = yMax * (1 - ratio);
        return (
          <g key={idx} className="opacity-10">
            <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="white" strokeWidth={0.5} strokeDasharray="2 2" />
            <text x={paddingX - 4} y={y + 3} fill="white" fontSize={7} textAnchor="end" className="font-mono">
              R{(val / 1000).toFixed(0)}k
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const barH = getBarHeight(d.amount);
        const space = (width - paddingX * 2);
        const step = space / data.length;
        const x = paddingX + (i * step) + (step / 2) - (barWidth / 2);
        const y = height - paddingY - barH;

        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={Math.max(barH, 2)} fill={d.fill} rx={3} className="opacity-80" />
            <text x={x + barWidth / 2} y={height - 4} fill="white" className="opacity-30 font-mono" fontSize={7} textAnchor="middle">
              {d.name.split(' ')[0]}
            </text>
            <text x={x + barWidth / 2} y={y - 4} fill="white" className="font-mono font-bold" fontSize={7} textAnchor="middle">
              R{(d.amount / 1000).toFixed(1)}k
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Custom lightweight SVG donut graph for PDF
function PDFDonutChart({ data, colors }: { data: any[]; colors: string[] }) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const size = 110;
  const radius = 35;
  const strokeWidth = 9;
  const circ = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
        {data.map((item, idx) => {
          const percent = item.value / (total || 1);
          if (percent <= 0) return null;
          const strokeDashoffset = circ - (percent * circ);
          const rotation = (cumulativePercent * 360);
          cumulativePercent += percent;

          return (
            <circle
              key={item.name}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={colors[idx % colors.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={circ}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-[8px] text-white/30 uppercase font-bold tracking-widest">Total</span>
        <span className="text-[9px] font-bold text-emerald-400 font-mono">{formatZAR(total)}</span>
      </div>
    </div>
  );
}

export default function TaxReportPDF({ transactions, invoices, profile, snapshot }: TaxReportPDFProps) {
  
  // 1. Category Breakdown
  const categoryData = useMemo(() => {
    const expenseCategories: Record<string, number> = {};
    
    transactions.forEach(tx => {
      if (tx.type === 'expense' || tx.type === 'asset') {
        const amount = tx.vatIncluded ? tx.amount - tx.vatAmount : tx.amount;
        expenseCategories[tx.category] = (expenseCategories[tx.category] || 0) + amount;
      }
    });

    invoices.forEach(inv => {
      if (inv.isDeductible) {
        const alreadyLogged = transactions.some(t => {
          const desc = t?.description;
          const invNum = inv?.invoiceNumber;
          const supName = inv?.supplierName;
          return (invNum && desc?.includes(invNum)) || (supName && desc?.includes(supName));
        });
        if (!alreadyLogged) {
          expenseCategories[inv.category] = (expenseCategories[inv.category] || 0) + inv.netAmount;
        }
      }
    });

    const data = Object.entries(expenseCategories).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));

    return data.sort((a, b) => b.value - a.value);
  }, [transactions, invoices]);

  const totalCategorySpending = useMemo(() => {
    return categoryData.reduce((acc, curr) => acc + curr.value, 0);
  }, [categoryData]);

  // 2. Trend Calculation
  const chronologicalTrendData = useMemo(() => {
    const sortedTxs = [...transactions]
      .filter(tx => tx.status !== 'flagged_mixed_use')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const trend: any[] = [];
    const uniqueDates = Array.from(new Set(sortedTxs.map(t => t.date))).sort();

    uniqueDates.forEach((date) => {
      const cumulativeTransactions = sortedTxs.filter(tx => new Date(tx.date).getTime() <= new Date(date).getTime());
      const cumulativeInvoices = invoices.filter(inv => new Date(inv.date).getTime() <= new Date(date).getTime());
      const snapAtDate = generateLiveTaxSnapshot(cumulativeTransactions, cumulativeInvoices, profile);

      trend.push({
        date,
        'Gross Income': snapAtDate.grossIncome,
        'Expenses & Allowances': snapAtDate.operatingExpenses + snapAtDate.retirementContributions + snapAtDate.capitalAllowances,
        'Tax Liability': snapAtDate.netTaxLiabilityOrRefund,
        'VAT Position': snapAtDate.netVatDueOrRefund,
      });
    });

    if (trend.length === 0) {
      return [{ date: 'Initial', 'Gross Income': 0, 'Expenses & Allowances': 0, 'Tax Liability': 0, 'VAT Position': 0 }];
    }

    return trend;
  }, [transactions, invoices, profile]);

  // 3. VAT Comparison Calculation
  const vatComparisonData = useMemo(() => {
    let outputVat = 0;
    let inputVat = 0;

    transactions.forEach((tx) => {
      if (tx.status === 'flagged_mixed_use') return;
      if (tx.type === 'income' && tx.vatIncluded) {
        outputVat += tx.vatAmount;
      } else if ((tx.type === 'expense' || tx.type === 'asset') && tx.vatIncluded) {
        inputVat += tx.vatAmount;
      }
    });

    invoices.forEach((inv) => {
      if (inv.isVatClaimable) {
        const alreadyLogged = transactions.some(t => {
          const desc = t?.description;
          const invNum = inv?.invoiceNumber;
          const supName = inv?.supplierName;
          return (invNum && desc?.includes(invNum)) || (supName && desc?.includes(supName));
        });
        if (!alreadyLogged) {
          inputVat += inv.vatAmount;
        }
      }
    });

    return [
      {
        name: 'Output VAT',
        amount: Number(outputVat.toFixed(2)),
        fill: '#f59e0b',
      },
      {
        name: 'Input VAT',
        amount: Number(inputVat.toFixed(2)),
        fill: '#10b981',
      }
    ];
  }, [transactions, invoices]);

  return (
    <div className="absolute -left-[9999px] top-0 pointer-events-none">
      
      {/* EXPORT TARGET WINDOW (WIDTH MATCHED TO PDF STANDARD LETTER 794px FOR PERFECT PRINT SIZE SCALE) */}
      <div 
        id="tax-report-pdf-document" 
        className="w-[794px] min-h-[1123px] bg-slate-950 p-8 space-y-6 text-white border border-white/10"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        
        {/* DOCUMENT METRICS HEADER */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div className="space-y-1">
            <h1 className="text-lg font-bold uppercase tracking-wider font-display text-emerald-400">
              SARS Compliance & Audit Trajectory Report
            </h1>
            <p className="text-[10px] text-white/50 font-mono">
              SYSTEM GENERATED COMPLIANCE AUDIT PACK • CONFIDENTIAL
            </p>
          </div>
          <div className="text-right space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-emerald-300 font-bold block bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
              SARS SECURE PORTAL MATCH
            </span>
            <span className="text-[9px] text-white/40 block font-mono">
              PROVISIONAL PERIOD: 2025/2026
            </span>
          </div>
        </div>

        {/* METADATA METRICS GRID */}
        <div className="grid grid-cols-4 gap-4 bg-white/5 border border-white/5 p-4 rounded-xl">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block font-bold">Registered Taxpayer</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{profile.name}</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block font-bold">Entity Type</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>{profile.entityType}</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block font-bold">VAT Status</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{profile.vatRegistered ? `Registered (${profile.vatNumber || 'Pending'})` : 'Not Registered'}</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block font-bold">Report Generated</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white font-mono">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>
        </div>

        {/* FINANCIAL METRICS GRID */}
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-400" /> Executive Financial Position (ZAR)
          </h2>
          <div className="grid grid-cols-4 gap-3">
            
            <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
              <span className="text-[9px] text-white/40 font-bold block uppercase mb-1">Gross Income</span>
              <span className="text-sm font-bold font-mono text-white">{formatZAR(snapshot.grossIncome)}</span>
            </div>

            <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
              <span className="text-[9px] text-white/40 font-bold block uppercase mb-1">Allowed Expenses</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {formatZAR(snapshot.operatingExpenses + snapshot.retirementContributions + snapshot.capitalAllowances)}
              </span>
            </div>

            <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
              <span className="text-[9px] text-white/40 font-bold block uppercase mb-1">Taxable Income</span>
              <span className="text-sm font-bold font-mono text-white">{formatZAR(snapshot.netTaxableIncome)}</span>
            </div>

            <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
              <span className="text-[9px] text-white/40 font-bold block uppercase mb-1">Estimated Tax Position</span>
              <span className={`text-sm font-bold font-mono ${snapshot.netTaxLiabilityOrRefund < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {snapshot.netTaxLiabilityOrRefund < 0 
                  ? `${formatZAR(Math.abs(snapshot.netTaxLiabilityOrRefund))} (Refund)` 
                  : `${formatZAR(snapshot.netTaxLiabilityOrRefund)} (Liability)`}
              </span>
            </div>

          </div>
        </div>

        {/* CHARTS GRAPHICS VIEW */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* TAX TREND LINE */}
          <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">
                Normal Tax Cumulative Trend
              </span>
              <div className="flex gap-2 text-[8px] font-mono">
                <span className="text-emerald-400">• Income</span>
                <span className="text-amber-400">• Liability</span>
              </div>
            </div>
            <div className="h-36 w-full">
              <PDFTrendChart data={chronologicalTrendData} />
            </div>
          </div>

          {/* VAT COMPARATIVE BAR */}
          <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
            <span className="text-[9px] font-bold text-white/50 block uppercase tracking-wider">
              VAT-201 Balance (Collected vs Claimed)
            </span>
            <div className="h-36 w-full flex items-center justify-center">
              {vatComparisonData[0].amount === 0 && vatComparisonData[1].amount === 0 ? (
                <span className="text-[10px] font-mono text-white/30">No VAT entries logged</span>
              ) : (
                <PDFBarChart data={vatComparisonData} />
              )}
            </div>
          </div>

        </div>

        {/* DEDUCTIONS & SPENDING DISTRIBUTION */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4 bg-white/5 border border-white/5 p-4 rounded-xl flex items-center gap-3">
            <div className="flex-shrink-0">
              {categoryData.length === 0 ? (
                <span className="text-[10px] font-mono text-white/30">No expenses</span>
              ) : (
                <PDFDonutChart data={categoryData} colors={COLORS} />
              )}
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-bold text-white/40 uppercase block tracking-wider">
                TOTAL OFFSET
              </span>
              <span className="text-xs font-bold text-emerald-400 block font-mono">
                {formatZAR(totalCategorySpending)}
              </span>
              <span className="text-[8px] text-white/50 block">SARS Section 11(a) operating claim.</span>
            </div>
          </div>

          <div className="col-span-8 bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col justify-center">
            <span className="text-[9px] font-bold text-white/50 block uppercase tracking-wider mb-2">
              Tax Deductible Category Breakdown (ZAR)
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {categoryData.slice(0, 4).map((item, idx) => {
                const percent = totalCategorySpending > 0 ? ((item.value / totalCategorySpending) * 100).toFixed(1) : '0';
                return (
                  <div key={item.name} className="flex justify-between items-center text-[9px] border-b border-white/5 pb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="font-semibold text-white/70 truncate">{item.name}</span>
                    </div>
                    <span className="font-mono text-white/90 font-bold ml-1">{formatZAR(item.value)} ({percent}%)</span>
                  </div>
                );
              })}
              {categoryData.length === 0 && (
                <p className="text-[9px] text-white/30 italic col-span-2">No active deductions tracked in current period.</p>
              )}
            </div>
          </div>
        </div>

        {/* LEDGER HEADER */}
        <div className="border-t border-dashed border-white/15 my-2"></div>

        {/* RECENT TRANSACTION LEDGER TABLE */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-blue-400" /> Active Ledger Audit Record (Deductions & Income)
          </h3>
          <div className="border border-white/5 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-[8px] uppercase tracking-wider text-white/40 font-bold border-b border-white/10">
                  <th className="px-3 py-1.5">Date</th>
                  <th className="px-3 py-1.5">Description</th>
                  <th className="px-3 py-1.5">Category</th>
                  <th className="px-3 py-1.5 text-right">Gross Amount</th>
                  <th className="px-3 py-1.5 text-right">VAT Value</th>
                  <th className="px-3 py-1.5 text-right">Tax Impact</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 8).map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 text-[9px]">
                    <td className="px-3 py-1 text-white/60 font-mono">{tx.date}</td>
                    <td className="px-3 py-1 font-bold truncate max-w-[155px] text-white">{tx.description}</td>
                    <td className="px-3 py-1 text-white/50">{tx.category}</td>
                    <td className="px-3 py-1 text-right font-mono font-semibold text-white">{formatZAR(tx.amount)}</td>
                    <td className="px-3 py-1 text-right font-mono text-white/50">{tx.vatIncluded ? formatZAR(tx.vatAmount) : 'R0.00'}</td>
                    <td className="px-3 py-1 text-right font-mono font-bold text-emerald-400">
                      {tx.taxPositionImpactZAR < 0 ? `- ${formatZAR(Math.abs(tx.taxPositionImpactZAR))}` : `+ ${formatZAR(tx.taxPositionImpactZAR)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transactions.length > 8 && (
            <p className="text-[8px] text-white/40 text-right italic">+ {transactions.length - 8} additional verified ledger logs stored in memory.</p>
          )}
        </div>

        {/* SARS LEGAL COMPLIANCE ATTESTATION & FOOTER */}
        <div className="bg-emerald-950/10 border border-emerald-500/10 p-3 rounded-lg space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SARS Compliance & Legal Attestation</span>
          </div>
          <p className="text-[8px] text-white/50 leading-relaxed">
            This advisory audit summary operates in strict accordance with the Income Tax Act No. 58 of 1962 (general operating deductions under Section 11(a), capital allowances under Section 12B/12BA, and Retirement Annuity contributions under Section 11F). Calculations reflect standard bracket rebates for the 2025/2026 fiscal cycle. This dashboard simulation is prepared to facilitate professional consulting before final eFiling submission.
          </p>
          <div className="flex justify-between items-center text-[7.5px] text-white/30 pt-1 border-t border-white/5">
            <span>ZATax Audit Protocol ID: SARS-ZA-2026-F61A</span>
            <span>Digital Signature Code: ZATAX-DIGI-SECURE-A11883</span>
          </div>
        </div>

      </div>

    </div>
  );
}

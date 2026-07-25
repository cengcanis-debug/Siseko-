import React, { useMemo, useState } from 'react';
import { TrendingUp, FileText, PieChart as PieIcon, DollarSign, ArrowUpRight, ArrowDownRight, Info, ShieldCheck } from 'lucide-react';
import { TaxTransaction, InvoiceRecord, UserTaxProfile, TaxCycleSnapshot } from '../types';
import { formatZAR, generateLiveTaxSnapshot } from '../utils/taxCalculations';

interface TaxVisualsProps {
  transactions: TaxTransaction[];
  invoices: InvoiceRecord[];
  profile: UserTaxProfile;
  snapshot: TaxCycleSnapshot;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

// 1. PREMIUM CUSTOM SVG AREA CHART (REPLACES RECHARTS AREA CHART)
interface CustomAreaChartProps {
  data: any[];
}

function CustomAreaChart({ data }: CustomAreaChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 500;
  const height = 220;
  const paddingX = 55;
  const paddingY = 30;

  const xMax = data.length - 1;
  const maxVal = Math.max(...data.flatMap(d => [d['Gross Income'] || 0, d['Tax Liability'] || 0])) || 1000;
  const yMax = maxVal * 1.1; // Add 10% headroom

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

  const incomeArea = incomePoints.length > 0 
    ? `${incomePath} L ${getX(data.length - 1)},${height - paddingY} L ${getX(0)},${height - paddingY} Z`
    : '';
  const taxArea = taxPoints.length > 0 
    ? `${taxPath} L ${getX(data.length - 1)},${height - paddingY} L ${getX(0)},${height - paddingY} Z`
    : '';

  return (
    <div className="relative w-full select-none" style={{ minHeight: '220px' }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="svgIncomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="svgTaxGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingY + ratio * (height - paddingY * 2);
          const val = yMax * (1 - ratio);
          return (
            <g key={idx} className="opacity-15">
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="white" strokeWidth={1} strokeDasharray="3 3" />
              <text x={paddingX - 8} y={y + 3} fill="white" fontSize={8} textAnchor="end" className="font-mono">
                {val >= 1000 ? `R${(val / 1000).toFixed(0)}k` : `R${val.toFixed(0)}`}
              </text>
            </g>
          );
        })}

        {/* X-Axis labels */}
        {data.map((d, i) => {
          if (data.length > 6 && i % Math.ceil(data.length / 5) !== 0) return null;
          const x = getX(i);
          return (
            <text key={i} x={x} y={height - 8} fill="white" className="opacity-30 font-mono" fontSize={8} textAnchor="middle">
              {d.date.substring(5) || d.date}
            </text>
          );
        })}

        {/* Areas under curve */}
        {incomeArea && <path d={incomeArea} fill="url(#svgIncomeGrad)" />}
        {taxArea && <path d={taxArea} fill="url(#svgTaxGrad)" />}

        {/* Smooth trend lines */}
        {incomePath && <path d={incomePath} fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
        {taxPath && <path d={taxPath} fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}

        {/* Interactive hover overlays */}
        {data.map((d, i) => {
          const x = getX(i);
          const yInc = getY(d['Gross Income'] || 0);
          const yTax = getY(d['Tax Liability'] || 0);

          return (
            <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
              <rect x={x - 12} y={paddingY} width={24} height={height - paddingY * 2} fill="transparent" />
              {hoveredIdx === i && (
                <>
                  <line x1={x} y1={paddingY} x2={x} y2={height - paddingY} stroke="white" strokeWidth={1} className="opacity-25" />
                  <circle cx={x} cy={yInc} r={4.5} fill="#10b981" stroke="white" strokeWidth={1.5} />
                  <circle cx={x} cy={yTax} r={4.5} fill="#f59e0b" stroke="white" strokeWidth={1.5} />
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Interactive Tooltip Card */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div className="absolute top-1 right-1 bg-slate-950/95 border border-white/10 rounded-xl p-2.5 shadow-xl text-[10px] space-y-1 font-mono text-white pointer-events-none z-10">
          <p className="font-bold border-b border-white/10 pb-0.5 text-white/50">{data[hoveredIdx].date}</p>
          <p className="flex justify-between gap-4">
            <span className="text-emerald-400">Gross Income:</span>
            <span className="font-bold">{formatZAR(data[hoveredIdx]['Gross Income'])}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-amber-400">Tax Liability:</span>
            <span className="font-bold">{formatZAR(data[hoveredIdx]['Tax Liability'])}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// 2. PREMIUM CUSTOM SVG BAR CHART (REPLACES RECHARTS BAR CHART)
interface CustomBarChartProps {
  data: any[];
}

function CustomBarChart({ data }: CustomBarChartProps) {
  const width = 400;
  const height = 220;
  const paddingX = 55;
  const paddingY = 30;

  const maxVal = Math.max(...data.map(d => d.amount)) || 1000;
  const yMax = maxVal * 1.15;

  const barWidth = 36;
  const getBarHeight = (amount: number) => {
    return (amount / yMax) * (height - paddingY * 2);
  };

  return (
    <div className="relative w-full" style={{ minHeight: '220px' }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingY + ratio * (height - paddingY * 2);
          const val = yMax * (1 - ratio);
          return (
            <g key={idx} className="opacity-15">
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="white" strokeWidth={1} strokeDasharray="3 3" />
              <text x={paddingX - 8} y={y + 3} fill="white" fontSize={8} textAnchor="end" className="font-mono">
                R{val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Dynamic Column Bars */}
        {data.map((d, i) => {
          const barH = getBarHeight(d.amount);
          const space = (width - paddingX * 2);
          const step = space / data.length;
          const x = paddingX + (i * step) + (step / 2) - (barWidth / 2);
          const y = height - paddingY - barH;

          return (
            <g key={i} className="group">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 2)}
                fill={d.fill}
                rx={6}
                className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
              />
              <text x={x + barWidth / 2} y={height - 8} fill="white" className="opacity-40 font-mono" fontSize={8} textAnchor="middle">
                {d.name.replace(' (Collected)', '').replace(' (Claimed)', '')}
              </text>
              <text x={x + barWidth / 2} y={y - 8} fill="white" className="font-mono font-bold opacity-100 text-white/80" fontSize={8.5} textAnchor="middle">
                {formatZAR(d.amount)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 3. PREMIUM CUSTOM DONUT PIE CHART (REPLACES RECHARTS PIE CHART)
interface CustomDonutChartProps {
  data: any[];
  colors: string[];
}

function CustomDonutChart({ data, colors }: CustomDonutChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const size = 170;
  const radius = 55;
  const strokeWidth = 14;
  const circ = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="flex flex-col items-center justify-center p-2">
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
                className="transition-all duration-300 ease-out hover:opacity-85 cursor-pointer"
              >
                <title>{`${item.name}: ${formatZAR(item.value)}`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Deductions</span>
          <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5">{formatZAR(total)}</span>
        </div>
      </div>
    </div>
  );
}

export default function TaxVisuals({ transactions, invoices, profile, snapshot }: TaxVisualsProps) {
  
  // 1. DYNAMIC CATEGORY-WISE SPENDING CALCULATION
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

  // 2. CHRONOLOGICAL TREND OF TAX LIABILITY & CASHFLOW
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

  // 3. VAT COLLECTED VS CLAIMED BREAKDOWN
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
        name: 'Output VAT (Collected)',
        amount: Number(outputVat.toFixed(2)),
        fill: '#f59e0b', // Amber-500
      },
      {
        name: 'Input VAT (Claimed)',
        amount: Number(inputVat.toFixed(2)),
        fill: '#10b981', // Emerald-500
      }
    ];
  }, [transactions, invoices]);

  return (
    <div className="space-y-6" id="tax-visuals-panel">
      {/* Visual Analytics Banner */}
      <div className="bg-gradient-to-r from-blue-950 to-emerald-950 p-4 rounded-2xl border border-emerald-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider font-display text-emerald-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> SARS Pocket Intelligence Visualiser
          </h3>
          <p className="text-[11px] text-white/60 leading-relaxed mt-1">
            Real-time interactive graphs mapping your current active financial ledger. Compare claims, explore categories, and visualize provisional timelines under 2025/2026 tax brackets.
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-mono text-emerald-300 uppercase font-bold tracking-wider">Secure Native Engine</span>
        </div>
      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CHART 1: TAX LIABILITY & CASHFLOW TRENDS OVER TIME */}
        <div className="bg-white/5 border border-white/5 p-5 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Tax Liability & Cashflow Timeline
            </h4>
            <p className="text-[11px] text-white/50">
              Cumulative financial trajectory mapping net taxable positions across your logged history.
            </p>
          </div>

          <div className="w-full pt-2">
            <CustomAreaChart data={chronologicalTrendData} />
            <div className="flex justify-center gap-4 text-[10px] font-mono mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                <span className="text-white/60">Gross Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                <span className="text-white/60">Tax Liability</span>
              </div>
            </div>
          </div>

          <div className="bg-black/25 p-3 rounded-xl border border-white/5 flex items-center gap-2.5 text-[10px] text-white/70">
            <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p>
              Your cumulative tax liability represents Estimated Normal Tax minus provisional payments and medical aid offsets. Keep adding business deductions to lower the slope!
            </p>
          </div>
        </div>

        {/* CHART 2: VAT REMITTANCE AND RECLAIMS */}
        <div className="bg-white/5 border border-white/5 p-5 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              VAT Collected vs. Claimed Comparison
            </h4>
            <p className="text-[11px] text-white/50">
              {profile.vatRegistered 
                ? 'Authorized VAT-201 metrics comparing Output VAT on sales against claimable Input VAT.'
                : 'Simulated VAT model: If your business registered for VAT, this shows what you could claim.'
              }
            </p>
          </div>

          <div className="w-full pt-2">
            {vatComparisonData[0].amount === 0 && vatComparisonData[1].amount === 0 ? (
              <div className="h-44 w-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs text-white/40 font-mono">No VAT events tracked in active ledger.</p>
                <p className="text-[10px] text-emerald-400/70 mt-1 max-w-[200px]">
                  Log transactions or scan invoices with 15% VAT included to see comparative structures!
                </p>
              </div>
            ) : (
              <CustomBarChart data={vatComparisonData} />
            )}
          </div>

          <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-[10px] text-white/70">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{profile.vatRegistered ? 'SARS VAT-201 Snapshot' : 'Potential VAT Opportunity'}</span>
            </div>
            <p>
              {profile.vatRegistered 
                ? `Active VAT position: ${snapshot.netVatDueOrRefund <= 0 ? 'SARS owes you a refund of ' + formatZAR(Math.abs(snapshot.netVatDueOrRefund)) : 'You owe SARS ' + formatZAR(snapshot.netVatDueOrRefund)}.`
                : `By registering for VAT, you could claim back R${vatComparisonData[1].amount.toLocaleString()} in Input VAT from business purchases. Minimum threshold is R50,000 voluntary.`
              }
            </p>
          </div>
        </div>

        {/* CHART 3: CATEGORY-WISE SPENDING BREAKDOWN */}
        <div className="bg-white/5 border border-white/5 p-5 rounded-3xl space-y-4 md:col-span-2 flex flex-col md:flex-row gap-6">
          
          {/* Left panel of Category Spending */}
          <div className="flex-1 space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                <PieIcon className="w-3.5 h-3.5 text-emerald-400" />
                Deductions by Expense Category
              </h4>
              <p className="text-[11px] text-white/50">
                Visual slice of deductible spending, mapping your highest operating outflows under SARS rules.
              </p>
            </div>

            <div className="w-full flex items-center justify-center">
              {categoryData.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-xs text-white/40 font-mono">No expense records logged.</p>
                  <p className="text-[10px] text-white/30 mt-1">Add operating expenses to populate category maps.</p>
                </div>
              ) : (
                <CustomDonutChart data={categoryData} colors={COLORS} />
              )}
            </div>

            <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-[10px] text-white/70">
              <div className="flex items-center gap-1.5 text-blue-300 font-bold mb-0.5">
                <Info className="w-3.5 h-3.5" />
                <span>Maximized Section 11(a) Deductions</span>
              </div>
              <p>
                Operating deductions represent R{totalCategorySpending.toLocaleString()} in calculated business offsets, directly shielding gross corporate/sole-prop revenues from full tax brackets.
              </p>
            </div>
          </div>

          {/* Right panel list of categories with exact values */}
          <div className="w-full md:w-80 flex flex-col justify-between bg-black/20 p-4 rounded-2xl border border-white/5 max-h-[360px] overflow-y-auto">
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider block mb-3 pb-2 border-b border-white/5">
              Expense Distribution List
            </span>

            {categoryData.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-10 italic">No logged expenses.</p>
            ) : (
              <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                {categoryData.map((item, index) => {
                  const percent = totalCategorySpending > 0 ? ((item.value / totalCategorySpending) * 100).toFixed(1) : '0';
                  const color = COLORS[index % COLORS.length];

                  return (
                    <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
                        <span className="font-medium truncate text-white" title={item.name}>{item.name}</span>
                      </div>
                      <div className="text-right font-mono flex-shrink-0">
                        <span className="font-bold text-white">{formatZAR(item.value)}</span>
                        <span className="text-[10px] text-white/40 block">{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs font-bold text-white/80">
              <span>Total Operating Spend:</span>
              <span className="font-mono text-emerald-400">{formatZAR(totalCategorySpending)}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

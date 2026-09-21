import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle, 
  Calendar, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { RoleType } from '../types';

interface EtiEmployee {
  id: string;
  name: string;
  idNumber: string;
  age: number;
  monthlyWage: number;
  qualifyingMonthTier: 'first_12' | 'second_12';
  inSezOrDesignatedIndustry: boolean;
}

interface EtiCalculatorPanelProps {
  formatZAR: (val: number) => string;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  currentUserRole: RoleType;
  checkPermission: (permission: string) => boolean;
}

export const EtiCalculatorPanel: React.FC<EtiCalculatorPanelProps> = ({
  formatZAR,
  addAuditLog,
  showBanner,
  currentUserRole,
  checkPermission
}) => {
  const [employees, setEmployees] = useState<EtiEmployee[]>([
    {
      id: 'eti-1',
      name: 'Thabo Mokoena',
      idNumber: '010412-ENC-0082',
      age: 24,
      monthlyWage: 4200,
      qualifyingMonthTier: 'first_12',
      inSezOrDesignatedIndustry: false
    },
    {
      id: 'eti-2',
      name: 'Zanele Ndlovu',
      idNumber: '020824-ENC-3087',
      age: 23,
      monthlyWage: 5400,
      qualifyingMonthTier: 'first_12',
      inSezOrDesignatedIndustry: false
    },
    {
      id: 'eti-3',
      name: 'Liam van der Merwe',
      idNumber: '990315-ENC-2089',
      age: 26,
      monthlyWage: 3800,
      qualifyingMonthTier: 'second_12',
      inSezOrDesignatedIndustry: false
    }
  ]);

  // Add Employee Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [age, setAge] = useState<number>(22);
  const [wage, setWage] = useState<number>(4500);
  const [tier, setTier] = useState<'first_12' | 'second_12'>('first_12');
  const [isSez, setIsSez] = useState(false);

  // ETI Calculation Formula per employee per month
  const calculateIndividualEti = (emp: EtiEmployee): number => {
    const w = emp.monthlyWage;
    // Salary must be between R2,000 and R6,500 to qualify
    if (w < 2000 || w > 6500) return 0;
    if (emp.age < 18 || emp.age > 29 && !emp.inSezOrDesignatedIndustry) return 0;

    if (emp.qualifyingMonthTier === 'first_12') {
      if (w <= 4500) {
        return Math.min(1500, w * 0.75); // 75% of wage, capped at R1,500
      } else {
        // R4,501 to R6,500: R1,500 - [0.75 * (w - 4,500)]
        return Math.max(0, 1500 - 0.75 * (w - 4500));
      }
    } else {
      // Second 12 months
      if (w <= 4500) {
        return Math.min(750, w * 0.375); // 37.5% of wage, capped at R750
      } else {
        // R4,501 to R6,500: R750 - [0.375 * (w - 4,500)]
        return Math.max(0, 750 - 0.375 * (w - 4500));
      }
    }
  };

  const totalMonthlyEtiCredit = employees.reduce((sum, emp) => sum + calculateIndividualEti(emp), 0);
  const totalAnnualEtiCredit = totalMonthlyEtiCredit * 12;

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission('ADD_TRANSACTION')) {
      showBanner('🔒 Access Denied: Your role does not have permission to add employee records.');
      return;
    }
    if (!name.trim() || !idNumber.trim() || wage <= 0) {
      showBanner('⚠️ Please fill in employee name, ID number, and monthly remuneration.');
      return;
    }

    const newEmp: EtiEmployee = {
      id: `eti-${Date.now()}`,
      name,
      idNumber,
      age,
      monthlyWage: wage,
      qualifyingMonthTier: tier,
      inSezOrDesignatedIndustry: isSez
    };

    setEmployees([...employees, newEmp]);
    setShowAddModal(false);
    setName('');
    setIdNumber('');

    const claim = calculateIndividualEti(newEmp);
    addAuditLog(
      'ETI_EMPLOYEE_ADDED',
      `Registered youth employee ${name} (Age ${age}, Wage ${formatZAR(wage)}/mo) for ETI. Monthly credit generated: ${formatZAR(claim)}.`
    );
    showBanner(`🎉 ${name} enrolled for ETI! Monthly EMP201 credit: ${formatZAR(claim)}.`);
  };

  const handleDeleteEmployee = (id: string) => {
    if (!checkPermission('DELETE_TRANSACTION')) {
      showBanner('🔒 Access Denied: Your role does not have permission to delete employee records.');
      return;
    }
    setEmployees(employees.filter(e => e.id !== id));
    addAuditLog('ETI_EMPLOYEE_REMOVED', `Removed employee #${id} from ETI roll.`);
    showBanner('🗑️ Employee record removed from ETI roll.');
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="eti-calculator-panel-root">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            SARS Employment Tax Incentive (ETI) Youth Subsidy Engine
          </h3>
          <p className="text-xs text-white/50">
            Claim up to R1,500/month per qualifying employee (ages 18-29) directly off monthly EMP201 PAYE liability
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-500/30 cursor-pointer"
          id="add-eti-employee-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Add Youth Employee</span>
        </button>
      </div>

      {/* STATS SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
        <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl">
          <span className="text-[10px] text-white/40 uppercase block font-bold">Qualifying Youth Hires</span>
          <span className="text-base sm:text-lg font-bold text-white font-mono">{employees.length} Staff</span>
          <span className="text-[9px] text-white/50 block mt-0.5">Ages 18-29 on Payroll</span>
        </div>

        <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
          <span className="text-[10px] text-indigo-400/70 uppercase block font-bold">Monthly EMP201 Credit</span>
          <span className="text-base sm:text-lg font-bold text-indigo-300 font-mono">{formatZAR(totalMonthlyEtiCredit)}</span>
          <span className="text-[9px] text-indigo-400/80 block mt-0.5">Direct Cash Offset</span>
        </div>

        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <span className="text-[10px] text-emerald-400/70 uppercase block font-bold">Annualized ETI Subsidy</span>
          <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono">{formatZAR(totalAnnualEtiCredit)}</span>
          <span className="text-[9px] text-emerald-400/80 block mt-0.5">Annual Corporate Cash Inflow</span>
        </div>

        <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
          <span className="text-[10px] text-cyan-400/70 uppercase block font-bold">Statutory Compliance</span>
          <span className="text-base sm:text-lg font-bold text-cyan-300 font-mono">100% Tax Compliant</span>
          <span className="text-[9px] text-cyan-400/80 block mt-0.5">SARS TAA §104 Safe</span>
        </div>
      </div>

      {/* EMP201 INTEGRATION NOTICE */}
      <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Automated Monthly EMP201 PAYE Offset</h4>
            <p className="text-[11px] text-white/60">
              When filing your monthly EMP201 return on SARS eFiling, subtract <strong className="text-indigo-300 font-mono">{formatZAR(totalMonthlyEtiCredit)}</strong> directly from your gross PAYE payable.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/30 font-bold">
          CODE 4118 READY
        </span>
      </div>

      {/* EMPLOYEES ROSTER TABLE */}
      <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>ETI Enrolled Employees Payroll Register</span>
          </h4>
          <span className="text-[9px] font-mono text-white/50">{employees.length} Active Candidates</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[9.5px] uppercase font-bold text-white/40 font-mono">
                <th className="pb-2">Employee</th>
                <th className="pb-2">SA ID Number</th>
                <th className="pb-2">Age</th>
                <th className="pb-2">Monthly Wage</th>
                <th className="pb-2">ETI Cycle</th>
                <th className="pb-2">Monthly ETI Claim</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {employees.map((emp) => {
                const claim = calculateIndividualEti(emp);
                return (
                  <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 text-white font-sans font-bold">{emp.name}</td>
                    <td className="py-2.5 text-white/60">{emp.idNumber}</td>
                    <td className="py-2.5 text-white/80">{emp.age} yrs</td>
                    <td className="py-2.5 font-bold text-white">{formatZAR(emp.monthlyWage)}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold ${
                        emp.qualifyingMonthTier === 'first_12' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {emp.qualifyingMonthTier === 'first_12' ? 'Months 1-12 (Max R1.5k)' : 'Months 13-24 (Max R750)'}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-emerald-400">
                      +{formatZAR(claim)}/mo
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="text-white/30 hover:text-rose-400 transition-colors p-1"
                        title="Remove employee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Enroll Youth Employee for ETI</span>
            </h4>

            <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
              <div>
                <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  placeholder="e.g., Sipho Sithole"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">SA ID Number</label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    placeholder="e.g., 030514-ENC-0082"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Age (18-29)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    min="18"
                    max="65"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">Monthly Wage (ZAR)</label>
                  <input
                    type="number"
                    value={wage}
                    onChange={(e) => setWage(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    min="2000"
                    max="6500"
                    placeholder="R2,000 - R6,500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] text-white/40 uppercase font-bold mb-1">ETI Tenure Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="first_12">First 12 Months (75% Rate)</option>
                    <option value="second_12">Second 12 Months (37.5% Rate)</option>
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
                  className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Enroll Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Scale,
  CheckCircle2,
  X,
  FileWarning,
  DollarSign,
  Lock,
  ArrowRight,
  Sparkles,
  Download
} from 'lucide-react';
import { TransactionPreAuditResult, TaxTransaction, RoleType } from '../types';
import { formatZAR } from '../utils/taxCalculations';

interface ImmediatePreAuditModalProps {
  auditResult: TransactionPreAuditResult | null;
  transaction: Partial<TaxTransaction> | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmAddToLedger: (adjustedTx?: Partial<TaxTransaction>) => void;
  currentUserRole: RoleType;
  showBanner: (msg: string) => void;
  onInitiateVdp?: (tx: Partial<TaxTransaction>, auditResult: TransactionPreAuditResult) => void;
}

export const ImmediatePreAuditModal: React.FC<ImmediatePreAuditModalProps> = ({
  auditResult,
  transaction,
  isOpen,
  onClose,
  onConfirmAddToLedger,
  currentUserRole,
  showBanner,
  onInitiateVdp
}) => {
  if (!isOpen || !auditResult || !transaction) return null;

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL_DISALLOWANCE':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          label: 'CRITICAL SARS DISALLOWANCE RISK',
          icon: ShieldAlert
        };
      case 'HIGH_EXPOSURE':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          label: 'HIGH AUDIT EXPOSURE',
          icon: AlertTriangle
        };
      case 'MEDIUM_RISK':
        return {
          bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
          label: 'MEDIUM AUDIT SCRUTINY',
          icon: AlertTriangle
        };
      case 'LOW_RISK':
        return {
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          label: 'LOW AUDIT RISK',
          icon: CheckCircle2
        };
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          label: 'AUDIT-DEFENSIBLE & COMPLIANT',
          icon: ShieldCheck
        };
    }
  };

  const badge = getRiskBadge(auditResult.overallRisk);
  const BadgeIcon = badge.icon;

  const handleApplyApportionment = () => {
    const adjusted: Partial<TaxTransaction> = {
      ...transaction,
      deductiblePercentage: 80,
      explanation: `${transaction.explanation || ''} [Mitigated: Apportioned 80% business / 20% personal per SARS IN47].`
    };
    showBanner('🛡️ Applied 80/20 Safe Apportionment to mitigate Section 23(g) exposure.');
    onConfirmAddToLedger(adjusted);
  };

  const handleApplyNonDeductible = () => {
    const adjusted: Partial<TaxTransaction> = {
      ...transaction,
      isDeductible: false,
      deductiblePercentage: 0,
      vatIncluded: false,
      explanation: `${transaction.explanation || ''} [Mitigated: Reclassified as non-deductible to eliminate SARS TAA §222 penalty risk].`
    };
    showBanner('🛡️ Reclassified as non-deductible to eliminate penalty exposure.');
    onConfirmAddToLedger(adjusted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" id="immediate-preaudit-modal">
      <div className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-white/10 flex justify-between items-start sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${badge.bg}`}>
              <BadgeIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold border ${badge.bg}`}>
                  {badge.label}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Risk Score: <strong className={auditResult.riskScore > 50 ? 'text-rose-400' : 'text-emerald-400'}>{auditResult.riskScore}/100</strong>
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-tight mt-1">
                Immediate SARS Pre-Audit Defense Report
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Evaluated in real-time before SARS initiates audit or desk verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="Dismiss report"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-6 text-xs text-white/80">

          {/* SIMULATION & REGULATORY STATUS NOTICE */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-[11px] text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Simulated Pre-Audit Engine:</strong> Accreditations and official certifications are currently pending regulatory approval. This evaluation simulates real SARS audit algorithms, TAA Rule 7 write-backs, and Section 222 penalty matrices.
            </span>
          </div>

          {/* TRANSACTION PARTICULARS SUMMARY */}
          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Description</span>
              <p className="font-semibold text-white truncate">{transaction.description || 'Quick Entry'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Transaction Value</span>
              <p className="font-mono font-bold text-cyan-300">{formatZAR(transaction.amount || 0)}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">SARS Source Code</span>
              <p className="font-mono text-amber-300 truncate">{auditResult.sourceCodeAffected}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Claimed Deduction</span>
              <p className="font-mono text-slate-200">{formatZAR(auditResult.claimedDeductionAmountZAR)}</p>
            </div>
          </div>

          {/* QUANTITATIVE NEGATIVE IMPLICATIONS CARD */}
          <div className="bg-gradient-to-br from-rose-950/30 via-slate-950 to-slate-950 border border-rose-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  SARS Financial Exposure & Negative Implications Breakdown
                </h4>
              </div>
              <span className="text-[10px] font-mono text-rose-300 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                TAA §222 & §89quat Calculated
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block font-mono">Projected Disallowance</span>
                <span className="text-sm font-mono font-bold text-rose-400">
                  {formatZAR(auditResult.projectedDisallowedAmountZAR)}
                </span>
                <span className="text-[9.5px] text-slate-500 block mt-0.5">Written back to R0</span>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block font-mono">Additional Tax Assessed</span>
                <span className="text-sm font-mono font-bold text-amber-400">
                  {formatZAR(auditResult.estimatedAdditionalTaxPayableZAR)}
                </span>
                <span className="text-[9.5px] text-slate-500 block mt-0.5">At marginal rate</span>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block font-mono">TAA §222 Understatement</span>
                <span className="text-sm font-mono font-bold text-rose-300">
                  {formatZAR(auditResult.understatementPenaltyAmountZAR)}
                </span>
                <span className="text-[9.5px] text-rose-400/80 block mt-0.5">
                  {auditResult.understatementPenaltyPercentage}% Penalty Rate
                </span>
              </div>

              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/30">
                <span className="text-[10px] text-rose-300 block font-mono font-bold">Total Worst-Case Exposure</span>
                <span className="text-base font-mono font-black text-rose-300">
                  {formatZAR(auditResult.totalPotentialSarsExposureZAR)}
                </span>
                <span className="text-[9.5px] text-rose-400/80 block mt-0.5">Tax + Penalties + Interest</span>
              </div>
            </div>
          </div>

          {/* DETAILED STATUTORY NEGATIVE IMPLICATIONS LIST */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-amber-400" />
              <span>Specific Audit Risks & Statutory Violations Identified</span>
            </h4>

            {auditResult.negativeImplications.length === 0 ? (
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold">Zero Negative Implications Detected</p>
                  <p className="text-[11px] text-emerald-300/80">
                    This transaction strictly conforms to Section 11(a) of the Income Tax Act. It is substantiated for legitimate business purposes.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {auditResult.negativeImplications.map(imp => (
                  <div
                    key={imp.id}
                    className="p-3.5 bg-slate-950/70 border border-white/10 rounded-2xl space-y-1.5 hover:border-white/20 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{imp.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-amber-300 border border-white/10">
                          {imp.statutoryReference}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-rose-400 font-bold">
                        +{formatZAR(imp.estimatedFinancialExposureZAR)} Exposure
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-300 leading-relaxed">{imp.description}</p>
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] text-cyan-300 font-mono">
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                      <span>Mitigation: {imp.mitigationAdvice}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AUDIT-READY VAULT CORROBORATION CHECK */}
          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Audit-Ready Vault Corroborating Evidence Checklist
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Required Before SARS Request for Correction (RFC)
              </span>
            </div>

            <div className="space-y-2">
              {auditResult.requiredVaultEvidence.map((ev, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-white/5"
                >
                  <div className="flex items-center gap-2.5">
                    {ev.isAttachedInVault ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{ev.documentType}</span>
                        {ev.vaultRefId && (
                          <span className="text-[9.5px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800">
                            {ev.vaultRefId}
                          </span>
                        )}
                        {ev.mandatoryForDeduction && (
                          <span className="text-[9px] font-mono uppercase text-rose-400 font-bold">Mandatory</span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-400">{ev.description}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ${
                    ev.isAttachedInVault
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {ev.isAttachedInVault ? 'Verified in Vault' : 'MISSING FROM VAULT'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* PREVENTATIVE DEFENSIVE RECOMMENDATIONS */}
          <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Pre-Emptive Defensive Recommendations (Before Filing)</span>
            </h4>
            <ul className="space-y-1.5 pl-2">
              {auditResult.preventativeRecommendations.map((rec, i) => (
                <li key={i} className="text-[11.5px] text-slate-200 flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* MODAL FOOTER & ACTION BUTTONS */}
        <div className="p-5 border-t border-white/10 bg-slate-900/95 sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Acting as:</span>
            <span className="text-[11px] font-mono font-bold text-amber-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
              {currentUserRole}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Mitigation 1: Apportion 80/20 */}
            {auditResult.projectedDisallowedAmountZAR > 0 && (
              <button
                onClick={handleApplyApportionment}
                className="px-3 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition cursor-pointer"
              >
                Apply 80/20 Safe Split
              </button>
            )}

            {/* Quick Mitigation 2: Mark Non-Deductible */}
            {auditResult.overallRisk === 'CRITICAL_DISALLOWANCE' && (
              <button
                onClick={handleApplyNonDeductible}
                className="px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
              >
                Mark Non-Deductible (Zero Penalty)
              </button>
            )}

            {/* Quick Mitigation 3: Proactive Voluntary Disclosure (VDP §227 - 0% Penalty & Criminal Immunity) */}
            {auditResult.understatementPenaltyAmountZAR > 0 && onInitiateVdp && (
              <button
                onClick={() => onInitiateVdp(transaction, auditResult)}
                className="px-3.5 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Proactively disclose oversight under TAA Chapter 16 Part B to eliminate understatement penalties and secure criminal immunity."
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Proactive Disclosure (VDP §227 - 0% Penalty)</span>
              </button>
            )}

            {/* Commit to ledger as is */}
            <button
              onClick={() => onConfirmAddToLedger()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Commit to Ledger</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

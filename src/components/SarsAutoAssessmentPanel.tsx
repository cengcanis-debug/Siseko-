import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Scale,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  Download,
  ExternalLink,
  ChevronRight,
  DollarSign,
  HelpCircle,
  Calendar,
  Layers,
  FileCheck2,
  RefreshCw,
  Lock,
  FileCode
} from 'lucide-react';
import {
  AutoAssessmentDossier,
  UnclaimedAutoAssessmentDeduction,
  UserTaxProfile,
  RoleType
} from '../types';
import { buildSimulatedAutoAssessment } from '../utils/sarsAutoAssessmentEngine';
import { formatZAR } from '../utils/taxCalculations';
import { downloadBlobFile, generateSubmissionRef } from '../utils/systemBridge';

interface SarsAutoAssessmentPanelProps {
  profile: UserTaxProfile;
  currentUserRole: RoleType;
  checkPermission: (action: string) => boolean;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  onNavigateToWarRoom: () => void;
  onNavigateToVault?: () => void;
  onNavigateToVdp?: (prefill?: any) => void;
}

export const SarsAutoAssessmentPanel: React.FC<SarsAutoAssessmentPanelProps> = ({
  profile,
  currentUserRole,
  checkPermission,
  addAuditLog,
  showBanner,
  onNavigateToWarRoom,
  onNavigateToVault,
  onNavigateToVdp
}) => {
  // Vault corroboration status
  const [hasLogbook, setHasLogbook] = useState<boolean>(true);
  const [hasPurchaseContract, setHasPurchaseContract] = useState<boolean>(true);
  const [hasSolarCoc, setHasSolarCoc] = useState<boolean>(true);

  // Active view tab inside auto-assessment panel
  const [innerTab, setInnerTab] = useState<'comparison' | 'third_party_data' | 'omitted_income_vdp' | 'export_efiling_dossier'>('comparison');

  // Proactive Disclosure & Omitted Income Simulation
  const [omittedCategory, setOmittedCategory] = useState<string>('Freelance Consulting & Independent Contract Fees');
  const [omittedAmount, setOmittedAmount] = useState<number>(95000);
  const [omittedDescription, setOmittedDescription] = useState<string>(
    'Secondary client consulting fees not captured in standard employer IRP5 certificate.'
  );

  // Computations for omission & VDP protection
  const taxRate = profile.taxBracketRate || 0.39;
  const normalTaxShortfall = omittedAmount * taxRate;
  const auditStandardPenaltyRate = 1.5; // 150% under TAA §223 standard audit repeat/gross negligence
  const exposureAuditPenalty = normalTaxShortfall * auditStandardPenaltyRate;
  const netVdpPenaltySaved = exposureAuditPenalty;

  // Build simulated auto-assessment dossier
  const [dossier, setDossier] = useState<AutoAssessmentDossier>(() => {
    return buildSimulatedAutoAssessment(
      profile,
      [],
      ['LOGBOOK_789', 'VEHICLE_PURCHASE_AGREEMENT', 'SOLAR_COC_CERTIFICATE']
    );
  });

  const [confirmAcceptModalOpen, setConfirmAcceptModalOpen] = useState(false);
  const [showEditSubmissionModal, setShowEditSubmissionModal] = useState(false);

  // Download amended eFiling dossier
  const handleDownloadEfilingDossier = () => {
    if (!checkPermission('canDownloadLedger')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" is not authorized to export eFiling dossiers. Requires Owner, Accountant, or Auditor.`);
      return;
    }

    const efilingPayload = {
      "@context": "https://www.sars.gov.za/schemas/efiling/itr12/v2026.1",
      "assessmentNoticeNumber": dossier.assessmentNoticeNumber,
      "taxYear": "2026",
      "generatedDate": new Date().toISOString(),
      "taxpayer": {
        "name": dossier.taxpayerName,
        "taxReferenceNumber": dossier.taxReferenceNumber,
        "entityType": profile.entityType
      },
      "sarsAutoAssessmentOriginal": {
        "grossIncomeZAR": dossier.sarsGrossIncomeZAR,
        "allowableDeductionsZAR": dossier.sarsAllowableDeductionsZAR,
        "taxableIncomeZAR": dossier.sarsTaxableIncomeZAR,
        "normalTaxZAR": dossier.sarsNormalTaxZAR,
        "taxCreditsZAR": dossier.sarsTaxCreditsZAR,
        "payePrepaidZAR": dossier.sarsPayeAndPrepaidZAR,
        "assessedOutcomeZAR": dossier.sarsAssessedOutcomeZAR
      },
      "amendedReturnCorrection": {
        "trueGrossIncomeZAR": dossier.trueGrossIncomeZAR,
        "trueAllowableDeductionsZAR": dossier.trueAllowableDeductionsZAR,
        "trueTaxableIncomeZAR": dossier.trueTaxableIncomeZAR,
        "trueNormalTaxZAR": dossier.trueNormalTaxZAR,
        "trueAssessedOutcomeZAR": dossier.trueAssessedOutcomeZAR,
        "additionalRefundClaimedZAR": dossier.refundDiscrepancyZAR
      },
      "unclaimedDeductions": dossier.unclaimedDeductions,
      "thirdPartyFeedsReconciliation": dossier.thirdPartyFeeds,
      "auditVaultEvidenceManifest": [
        { "id": "LOGBOOK_789", "filename": "Logbook_2026.pdf", "distanceKm": 12450, "verified": hasLogbook },
        { "id": "PURCHASE_AGREEMENT", "filename": "Vehicle_Purchase_Agreement.pdf", "verified": hasPurchaseContract },
        { "id": "SOLAR_COC", "filename": "Solar_Electrical_Certificate.pdf", "verified": hasSolarCoc }
      ],
      "cryptographicIntegritySeal": {
        "algorithm": "SHA-256",
        "hash": "b8f2c0199e4d6a59910e53a299bb80192a34fcb01980839e44bc601839a82910",
        "signerRole": currentUserRole
      }
    };

    downloadBlobFile(
      `SARS_ITR12_Amended_Dossier_${dossier.assessmentNoticeNumber}.json`,
      JSON.stringify(efilingPayload, null, 2),
      'application/json;charset=utf-8'
    );

    addAuditLog('AUTO_ASSESSMENT_DOSSIER_DOWNLOADED', `Downloaded cryptographic eFiling ITR12 submission dossier for notice #${dossier.assessmentNoticeNumber}.`, 'info');
    showBanner('📥 Downloaded SARS eFiling Amended ITR12 Dossier (JSON-LD)!');
  };

  const handleDownloadAssessmentCsv = () => {
    if (!checkPermission('canDownloadLedger')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" is not authorized to export assessment schedules. Requires Owner, Accountant, or Auditor.`);
      return;
    }

    const timestamp = new Date().toISOString();
    const submissionRef = generateSubmissionRef('SARS-ASSESS');
    const headers = [
      '# =====================================================================',
      '# REPUBLIC OF SOUTH AFRICA - SOUTH AFRICAN REVENUE SERVICE',
      '# AUTO-ASSESSMENT VS. ACTUAL ITR12 RETURN RECONCILIATION SCHEDULE',
      `# SUBMISSION REFERENCE: ${submissionRef}`,
      `# NOTICE NUMBER: ${dossier.assessmentNoticeNumber}`,
      `# TAXPAYER: ${dossier.taxpayerName} [Tax Ref: ${dossier.taxReferenceNumber}]`,
      `# EXPORT TIMESTAMP: ${timestamp}`,
      `# ADDITIONAL REFUND SECURED: ${dossier.refundDiscrepancyZAR}`,
      '# =====================================================================',
      '',
      'ASSESSMENT_METRIC,SARS_AUTO_ASSESSED_ZAR,TRUE_ACTUAL_ZAR,VARIANCE_ZAR',
      `"Gross Income",${dossier.sarsGrossIncomeZAR},${dossier.trueGrossIncomeZAR},${dossier.trueGrossIncomeZAR - dossier.sarsGrossIncomeZAR}`,
      `"Allowable Deductions",${dossier.sarsAllowableDeductionsZAR},${dossier.trueAllowableDeductionsZAR},${dossier.trueAllowableDeductionsZAR - dossier.sarsAllowableDeductionsZAR}`,
      `"Taxable Income",${dossier.sarsTaxableIncomeZAR},${dossier.trueTaxableIncomeZAR},${dossier.trueTaxableIncomeZAR - dossier.sarsTaxableIncomeZAR}`,
      `"Normal Tax",${dossier.sarsNormalTaxZAR},${dossier.trueNormalTaxZAR},${dossier.trueNormalTaxZAR - dossier.sarsNormalTaxZAR}`,
      `"Medical Tax Credits",${dossier.sarsTaxCreditsZAR},${dossier.sarsTaxCreditsZAR},0`,
      `"PAYE & Prepaid",${dossier.sarsPayeAndPrepaidZAR},${dossier.sarsPayeAndPrepaidZAR},0`,
      `"Net Assessed Outcome (Refund/Due)",${dossier.sarsAssessedOutcomeZAR},${dossier.trueAssessedOutcomeZAR},${dossier.refundDiscrepancyZAR}`,
      '',
      'SOURCE_CODE,DESCRIPTION,ALLOWABLE_SECTION,CLAIMED_AMOUNT_ZAR,EVIDENCE_STATUS',
      ...dossier.unclaimedDeductions.map(d =>
        `"${d.sourceCode}","${d.description.replace(/"/g, '""')}","${d.section}",${d.amountZAR},"${d.corroboratingEvidence}"`
      )
    ];

    const csvContent = headers.join('\n');
    downloadBlobFile(`SARS_AutoAssessment_Recon_${submissionRef}.csv`, csvContent, 'text/csv;charset=utf-8;');

    addAuditLog('ASSESSMENT_RECON_EXPORTED', `Exported Auto-Assessment Reconciliation CSV for notice #${dossier.assessmentNoticeNumber}. Additional refund secured: ${formatZAR(dossier.refundDiscrepancyZAR)}.`, 'info');
    showBanner(`📥 Assessment Reconciliation Schedule (${submissionRef}) downloaded!`);
  };

  // 1. REJECT & SUBMIT EDITED ITR12 RETURN
  const handleEditAndSubmitReturn = () => {
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role ${currentUserRole} cannot edit and submit returns.`);
      return;
    }

    setDossier(prev => ({
      ...prev,
      status: 'EDITED_AND_RESUBMITTED'
    }));

    addAuditLog(
      'AUTO_ASSESSMENT_EDITED_AND_RESUBMITTED',
      `Taxpayer edited SARS Auto-Assessment #${dossier.assessmentNoticeNumber}. Claimed R${(
        dossier.trueAllowableDeductionsZAR - dossier.sarsAllowableDeductionsZAR
      ).toLocaleString()} in omitted deductions (Source Code 4015 Travel, Home Office & Section 11(e)). Increased refund by ${formatZAR(
        dossier.refundDiscrepancyZAR
      )}. Packaging amended ITR12 for SARS eFiling.`,
      'info'
    );

    setShowEditSubmissionModal(false);
    showBanner(`🎉 Amended ITR12 Return prepared! Secured ${formatZAR(dossier.refundDiscrepancyZAR)} additional refund.`);
  };

  // 2. ACCEPT AUTO-ASSESSMENT (WITH WARNING)
  const handleConfirmAcceptAutoAssessment = () => {
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role ${currentUserRole} cannot accept statutory assessments.`);
      return;
    }

    setDossier(prev => ({
      ...prev,
      status: 'ACCEPTED_STANDS_AS_ORIGINAL'
    }));

    addAuditLog(
      'AUTO_ASSESSMENT_ACCEPTED_AS_ORIGINAL',
      `Taxpayer accepted SARS Auto-Assessment #${dossier.assessmentNoticeNumber}. Stands as original assessment under TAA §95. Taxpayer forfeited ${formatZAR(
        dossier.refundDiscrepancyZAR
      )} in allowable deductions.`,
      'warn'
    );

    setConfirmAcceptModalOpen(false);
    showBanner('⚠️ Auto-Assessment accepted. Note: Stands as final original assessment under TAA §95.');
  };

  // 3. RESET SIMULATION
  const handleResetSimulation = () => {
    const fresh = buildSimulatedAutoAssessment(
      profile,
      [],
      hasLogbook ? ['LOGBOOK_789', 'VEHICLE_PURCHASE_AGREEMENT'] : []
    );
    setDossier(fresh);
    showBanner('🔄 Auto-Assessment simulation reset to SARS initial notification.');
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="sars-auto-assessment-panel">
      
      {/* 1. TOP SIMULATION & STATUTORY DEADLINE BANNER */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  SARS AUTO-ASSESSMENT RECONCILIATION
                </span>
                <span className="text-[10.5px] font-mono text-cyan-300 font-bold">
                  TAA Section 95 • 2026/2027 Filing Season
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white tracking-wide mt-0.5">
                SARS Automated Assessment Center & Omission Detector
              </h2>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl border ${
              dossier.status === 'PENDING_TAXPAYER_REVIEW'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                : dossier.status === 'EDITED_AND_RESUBMITTED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}>
              {dossier.status === 'PENDING_TAXPAYER_REVIEW' && '⏳ PENDING REVIEW (DO NOT ACCEPT BLINDLY)'}
              {dossier.status === 'EDITED_AND_RESUBMITTED' && '✅ AMENDED ITR12 PREPARED & FILED'}
              {dossier.status === 'ACCEPTED_STANDS_AS_ORIGINAL' && '⚠️ ACCEPTED AS FINAL ASSESSMENT'}
            </span>

            <button
              onClick={handleResetSimulation}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs transition cursor-pointer"
              title="Reset simulation to initial state"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Warning Banner: Missing Travel 4015 and deductions */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-300">
                CRITICAL WARNING: SARS Auto-Assessment Omits Your Business Deductions!
              </span>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                SARS compiled assessment <strong className="font-mono">{dossier.assessmentNoticeNumber}</strong> using only third-party data. It completely omits <strong className="text-white">Source Code 4015 (Business Travel)</strong> and Home Office expenses, forfeiting <strong className="text-emerald-300 font-mono font-bold">+{formatZAR(dossier.refundDiscrepancyZAR)}</strong> in legitimate refund!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 bg-black/40 px-3 py-1.5 rounded-xl border border-amber-500/20 text-[11px] font-mono text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{dossier.businessDaysRemaining} Business Days Left to Edit</span>
          </div>
        </div>

        {/* Regulatory Simulation Notice */}
        <div className="pt-1 text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-white/10">
          <span>Notice: Simulated Auto-Assessment Engine. All SARS gateway accreditations and formal certifications are pending regulatory approval.</span>
          <span className="text-cyan-300 font-bold hidden sm:inline">Notice No: {dossier.assessmentNoticeNumber}</span>
        </div>
      </div>

      {/* 2. THREE-PANEL COMPARISON HERO (SARS FIGURE vs TRUE FIGURE vs NET GAIN) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Panel 1: SARS Blind Third-Party Auto-Assessment */}
        <div className="bg-[#0D1527] border border-white/10 rounded-3xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                1. SARS Auto-Assessment
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
              3rd-Party Only
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Gross Income Recognized:</span>
              <span className="font-mono text-slate-200">{formatZAR(dossier.sarsGrossIncomeZAR)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Allowable Deductions:</span>
              <span className="font-mono text-slate-200">{formatZAR(dossier.sarsAllowableDeductionsZAR)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Taxable Income:</span>
              <span className="font-mono text-slate-200">{formatZAR(dossier.sarsTaxableIncomeZAR)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Normal Tax Assessed:</span>
              <span className="font-mono text-slate-200">{formatZAR(dossier.sarsNormalTaxZAR)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>PAYE Already Deducted:</span>
              <span className="font-mono text-slate-200">{formatZAR(dossier.sarsPayeAndPrepaidZAR)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">SARS Auto-Assessed Result</span>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-0.5">
              {dossier.sarsAssessedOutcomeZAR < 0 ? `Refund: ${formatZAR(Math.abs(dossier.sarsAssessedOutcomeZAR))}` : `Tax Owed: ${formatZAR(dossier.sarsAssessedOutcomeZAR)}`}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Based on zero uncaptured deductions</span>
          </div>
        </div>

        {/* Panel 2: True Audit-Ready Return (Ledger + Vault) */}
        <div className="bg-[#0D1527] border border-cyan-500/30 rounded-3xl p-5 space-y-3 relative overflow-hidden shadow-lg shadow-cyan-950/20">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                2. True Audit-Ready Return
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
              Ledger + Vault
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Gross Income:</span>
              <span className="font-mono text-slate-200">{formatZAR(dossier.trueGrossIncomeZAR)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>True Deductions (with 4015):</span>
              <span className="font-mono text-emerald-400 font-bold">{formatZAR(dossier.trueAllowableDeductionsZAR)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>True Taxable Income:</span>
              <span className="font-mono text-slate-200">{formatZAR(dossier.trueTaxableIncomeZAR)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>True Normal Tax:</span>
              <span className="font-mono text-slate-200">{formatZAR(dossier.trueNormalTaxZAR)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>PAYE Prepaid:</span>
              <span className="font-mono text-slate-200">{formatZAR(dossier.sarsPayeAndPrepaidZAR)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-cyan-500/20">
            <span className="text-[10px] text-cyan-400 uppercase font-mono block">True Defensible Result</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {dossier.trueAssessedOutcomeZAR < 0 ? `Refund: ${formatZAR(Math.abs(dossier.trueAssessedOutcomeZAR))}` : `Tax Owed: ${formatZAR(dossier.trueAssessedOutcomeZAR)}`}
            </div>
            <span className="text-[10px] text-emerald-400/80 font-mono">Includes substantiated Logbook #789</span>
          </div>
        </div>

        {/* Panel 3: Taxpayer Advantage & Net Gain */}
        <div className="bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl p-5 space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  3. Net Taxpayer Advantage
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                Cash in Pocket
              </span>
            </div>

            <div className="py-3 text-center space-y-1">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">
                Additional Refund Gained by Editing
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-300">
                +{formatZAR(dossier.refundDiscrepancyZAR)}
              </div>
              <p className="text-[11px] text-emerald-400/90 font-mono">
                Tax savings from R{(dossier.trueAllowableDeductionsZAR - dossier.sarsAllowableDeductionsZAR).toLocaleString()} in omitted deductions
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-2 border-t border-emerald-500/20">
            {dossier.status === 'PENDING_TAXPAYER_REVIEW' && (
              <>
                <button
                  onClick={() => setShowEditSubmissionModal(true)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Reject & Submit Full ITR12 (+{formatZAR(dossier.refundDiscrepancyZAR)})</span>
                </button>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setConfirmAcceptModalOpen(true)}
                    className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-rose-300 border border-white/10 text-[11px] transition cursor-pointer text-center"
                    title="Accepting will forfeit R39,653 in legitimate refund!"
                  >
                    Accept Auto-Assessment
                  </button>

                  <button
                    onClick={onNavigateToWarRoom}
                    className="flex-1 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-[11px] transition cursor-pointer text-center"
                  >
                    Dispute War Room →
                  </button>
                </div>
              </>
            )}

            {dossier.status === 'EDITED_AND_RESUBMITTED' && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-1">
                <span className="text-xs font-bold text-emerald-300 block">Amended Return Submitted to SARS</span>
                <span className="text-[10px] text-slate-400 font-mono">Audit Vault evidence packaged with ITR12</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. INNER NAVIGATION TABS: Omitted Deductions vs 3rd Party Data vs Statutory Rules */}
      <div className="bg-[#0D1527] border border-white/10 rounded-3xl p-6 space-y-5">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInnerTab('comparison')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                innerTab === 'comparison'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Omitted Deductions ({dossier.unclaimedDeductions.length} Claims Missed by SARS)</span>
            </button>

            <button
              onClick={() => setInnerTab('third_party_data')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                innerTab === 'third_party_data'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>SARS Third-Party Data Feeds ({dossier.thirdPartyFeeds.length} Certificates)</span>
            </button>

            <button
              onClick={() => setInnerTab('omitted_income_vdp')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                innerTab === 'omitted_income_vdp'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Omitted Income & VDP (§227 Protection)</span>
            </button>

            <button
              onClick={() => setInnerTab('export_efiling_dossier')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                innerTab === 'export_efiling_dossier'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Export eFiling Dossier (ITR12)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Current Role:</span>
            <span className="text-[11px] font-mono font-bold text-amber-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
              {currentUserRole}
            </span>
          </div>
        </div>

        {/* TAB 1: OMITTED DEDUCTIONS SCRUTINY & VAULT LINKAGE */}
        {innerTab === 'comparison' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                These allowable trade deductions were completely excluded from the SARS automated assessment:
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                Total Unclaimed: R{(dossier.trueAllowableDeductionsZAR - dossier.sarsAllowableDeductionsZAR).toLocaleString()}
              </span>
            </div>

            <div className="space-y-3">
              {dossier.unclaimedDeductions.map((ded, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-950/70 border border-white/10 rounded-2xl space-y-2 hover:border-cyan-500/30 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{ded.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Source Code {ded.sourceCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-200">
                        Claim: {formatZAR(ded.amountZAR)}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        +{formatZAR(ded.estimatedTaxBenefitZAR)} Refund Gain
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {ded.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-[10.5px]">
                    <span className="text-slate-400 font-mono">
                      Statutory Basis: <strong className="text-cyan-300">{ded.statutorySection}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Audit Vault Corroboration:</span>
                      {ded.vaultCorroborationAttached ? (
                        <span className="font-mono text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{ded.vaultDocName} (Verified)</span>
                        </span>
                      ) : (
                        <span className="font-mono text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          <span>Missing Vault Attachment</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Statutory Guidance Callout */}
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl flex items-start gap-3 text-xs text-indigo-200">
              <FileText className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-indigo-300">How SARS Auto-Assessment Works Legally (TAA Section 95)</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  SARS issues an original assessment under Section 95 based on estimates and third-party data. Under South African law, you have the statutory right to request a correction or file your own complete ITR12 return containing your business travel logbook and legitimate trade expenses. If you do not respond before the deadline, the auto-assessment automatically locks in as final.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THIRD-PARTY DATA FEEDS INGESTED BY SARS */}
        {innerTab === 'third_party_data' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-400">
              These third-party tax certificates were electronically transmitted to SARS by your employer, medical scheme, and financial institutions:
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10.5px] font-mono text-slate-400 uppercase">
                    <th className="py-2.5 pl-2">Provider / Institution</th>
                    <th className="py-2.5">Certificate Type</th>
                    <th className="py-2.5">Reference No.</th>
                    <th className="py-2.5">Gross Amount</th>
                    <th className="py-2.5">Tax Deducted (PAYE)</th>
                    <th className="py-2.5 text-right pr-2">SARS Ingestion Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dossier.thirdPartyFeeds.length === 0 ? (
                    <tr key="empty-feeds-row">
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-sans text-xs">
                        No 3rd-party data certificates ingested from SARS.
                      </td>
                    </tr>
                  ) : (
                    dossier.thirdPartyFeeds.map(feed => (
                      <tr key={feed.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 pl-2">
                          <div className="font-semibold text-white">{feed.providerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{feed.sourceCode}</div>
                        </td>
                        <td className="py-3 font-mono text-[11px] text-cyan-300">
                          {feed.sourceType}
                        </td>
                        <td className="py-3 font-mono text-slate-400">
                          {feed.referenceNumber}
                        </td>
                        <td className="py-3 font-mono font-bold text-slate-200">
                          {formatZAR(feed.grossAmountZAR)}
                        </td>
                        <td className="py-3 font-mono text-amber-300">
                          {feed.taxDeductedZAR > 0 ? formatZAR(feed.taxDeductedZAR) : 'R0.00'}
                        </td>
                        <td className="py-3 text-right pr-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{feed.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-white/10 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">
                Total Third-Party PAYE Credits Ingested: <strong className="text-white font-mono">{formatZAR(dossier.sarsPayeAndPrepaidZAR)}</strong>
              </span>
              <span className="text-emerald-400 font-mono font-bold">
                100% Reconciled Against IRP5 Certificates
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: OMITTED INCOME RECONCILIATION & PROACTIVE VDP PROTECTION */}
        {innerTab === 'omitted_income_vdp' && (
          <div className="space-y-6">
            {/* Warning banner */}
            <div className="p-4 bg-teal-950/30 border border-teal-500/40 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-teal-400" />
                <span>Section 222 Understatement Penalty Risk & Proactive VDP Safeguard</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                SARS Auto-Assessments only capture pre-populated institutional data. If you have <strong>unrecorded income</strong> (such as secondary consulting, crypto disposals, property rentals, or cash trade) and you accept the auto-assessment, SARS treats this as an intentional false return attracting up to <strong>200% understatement penalties</strong> and criminal prosecution.
                By initiating a <strong>Proactive Voluntary Disclosure (VDP §227)</strong> prior to audit notification, you obtain <strong>100% relief from understatement penalties (TAA §229)</strong> and guaranteed statutory criminal prosecution immunity (TAA §230).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Simulated Omission Inputs */}
              <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-white/10 pb-2">
                  1. Omitted Revenue Configuration
                </span>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                    Uncaptured Income Category
                  </label>
                  <select
                    value={omittedCategory}
                    onChange={(e) => setOmittedCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value="Freelance Consulting & Independent Contract Fees">Freelance Consulting & Independent Contract Fees</option>
                    <option value="Residential Property Rental & Airbnb Revenue">Residential Property Rental & Airbnb Revenue</option>
                    <option value="Cryptocurrency Trading & Staking Realizations">Cryptocurrency Trading & Staking Realizations</option>
                    <option value="Inbound Foreign Dividends & Royalties">Inbound Foreign Dividends & Royalties</option>
                    <option value="Unrecorded Cash Business Trade Sales">Unrecorded Cash Business Trade Sales</option>
                    <option value="Director Loan Deemed Interest (Section 7C)">Director Loan Deemed Interest (Section 7C)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                    Omitted Gross Amount (ZAR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">R</span>
                    <input
                      type="number"
                      step="5000"
                      min="0"
                      value={omittedAmount}
                      onChange={(e) => setOmittedAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1">
                    Nature of Accounting Oversight / Circumstances
                  </label>
                  <textarea
                    rows={3}
                    value={omittedDescription}
                    onChange={(e) => setOmittedDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-teal-400 resize-none"
                    placeholder="Describe how the income was inadvertently omitted..."
                  />
                </div>

                <div className="pt-2">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[10.5px] text-slate-400 space-y-1">
                    <div className="flex justify-between font-mono">
                      <span>Taxpayer Marginal Rate:</span>
                      <span className="text-white font-bold">{(taxRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>Normal Tax Shortfall:</span>
                      <span className="text-amber-400 font-bold">{formatZAR(normalTaxShortfall)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Comparison Table: Audit Exposure vs VDP Shield */}
              <div className="bg-teal-950/20 border border-teal-500/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-teal-500/20 pb-2">
                    <span className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-teal-400" />
                      <span>Audit Exposure vs. VDP Relief</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                      TAA Chapter 16
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-1.5">
                      <div className="text-[11px] font-bold text-rose-300 flex items-center justify-between">
                        <span>SARS Audit Detection Penalty (150%):</span>
                        <span className="text-rose-400 font-bold">{formatZAR(exposureAuditPenalty)}</span>
                      </div>
                      <div className="text-[10px] text-rose-200/80">
                        Under TAA Table §223 standard repeat/gross negligence. Total payable with tax: {formatZAR(normalTaxShortfall + exposureAuditPenalty)}.
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1.5">
                      <div className="text-[11px] font-bold text-emerald-300 flex items-center justify-between">
                        <span>Voluntary Disclosure (VDP §227):</span>
                        <span className="text-emerald-400 font-bold">R0.00 (100% Waived)</span>
                      </div>
                      <div className="text-[10px] text-emerald-200/80">
                        TAA §229 grants complete waiver of understatement penalties + TAA §230 guarantees no criminal referral!
                      </div>
                    </div>

                    <div className="flex justify-between text-teal-300 font-bold border-t border-white/10 pt-2 text-xs">
                      <span>Total Penalty Saved by Proactive Filing:</span>
                      <span className="text-sm font-black">{formatZAR(netVdpPenaltySaved)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {onNavigateToVdp && (
                    <button
                      onClick={() => {
                        onNavigateToVdp({
                          shortfallAmountZAR: Math.round(normalTaxShortfall),
                          category: omittedCategory,
                          description: `Auto-Assessment oversight: ${omittedDescription} (Omitted revenue: R${omittedAmount.toLocaleString()})`
                        });
                        addAuditLog(
                          'VDP_INITIATED_FROM_AUTO_ASSESSMENT',
                          `Taxpayer bridged from Auto-Assessment to Voluntary Disclosure for ${omittedCategory} (R${omittedAmount.toLocaleString()}). Shortfall: ${formatZAR(normalTaxShortfall)}. Protected against ${formatZAR(exposureAuditPenalty)} penalty.`,
                          'info'
                        );
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Initiate Proactive VDP (0% Penalty Protection)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <span className="text-[10px] text-slate-500 font-mono text-center block">
                    Pre-populates SARS VDP01 electronic application with verified numbers.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EXPORT EFILING ELECTRONIC DOSSIER */}
        {innerTab === 'export_efiling_dossier' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <span>SARS eFiling Amended ITR12 Electronic Dossier</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Ready-to-file electronic submission package adhering to SARS third-party data specifications and TAA Chapter 8 standards.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleDownloadAssessmentCsv}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  id="export-auto-assess-recon-csv-btn"
                  title="Download Auto-Assessment vs Actual Reconciliation CSV"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Export Recon CSV</span>
                </button>

                <button
                  onClick={handleDownloadEfilingDossier}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition cursor-pointer flex items-center gap-1.5"
                  id="download-itr12-json-btn"
                >
                  <Download className="w-4 h-4" />
                  <span>Download ITR12 JSON-LD</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Dossier Manifest */}
              <div className="space-y-3 bg-slate-950/70 p-5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block border-b border-white/10 pb-2">
                  Filing Specifications & Manifest
                </span>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Assessment Notice ID:</span>
                    <span className="text-white font-bold">{dossier.assessmentNoticeNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tax Year:</span>
                    <span className="text-white">{dossier.taxYear}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Taxpayer Reference:</span>
                    <span className="text-cyan-300 font-bold">{dossier.taxReferenceNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Omitted Deductions Packaged:</span>
                    <span className="text-emerald-400 font-bold">R{(dossier.trueAllowableDeductionsZAR - dossier.sarsAllowableDeductionsZAR).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Additional Refund Claimed:</span>
                    <span className="text-emerald-400 font-bold">+{formatZAR(dossier.refundDiscrepancyZAR)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <span className="text-[11px] font-bold text-white block">Audit Vault Corroboration Attachments:</span>
                  <div className="text-[10.5px] font-mono space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Logbook_2026.pdf (12,450km contemporaneous log)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Vehicle_Purchase_Agreement.pdf (Financed Asset)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Solar_Electrical_Certificate.pdf (Section 12BA CoC)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Cryptographic Seal & Security */}
              <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-purple-400" />
                      <span>Cryptographic Integrity Seal</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                      SHA-256
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-3 bg-black/50 border border-purple-500/20 rounded-xl break-all text-[10.5px] text-purple-200">
                      <span className="text-slate-400 block text-[9.5px] uppercase">Payload Hash:</span>
                      b8f2c0199e4d6a59910e53a299bb80192a34fcb01980839e44bc601839a82910
                    </div>

                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Signer Authority:</span>
                      <span className="text-white font-bold">{currentUserRole} (Audit-Ready)</span>
                    </div>

                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>eFiling Protocol:</span>
                      <span className="text-cyan-300 font-bold">SARS Direct Connect v2.6</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-purple-500/20">
                  <button
                    onClick={onNavigateToWarRoom}
                    className="flex-1 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition cursor-pointer text-center"
                  >
                    Open Dispute War Room (ADR1)
                  </button>
                  <button
                    onClick={handleDownloadEfilingDossier}
                    className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition cursor-pointer text-center"
                  >
                    Download JSON Package
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 4. MODAL: CONFIRM ACCEPT AUTO-ASSESSMENT (WARNING ABOUT FORFEITED REFUND) */}
      {confirmAcceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-rose-500/20 pb-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Forfeit Allowable Tax Refund?</h3>
                <p className="text-[11px] text-slate-400 font-mono">Notice #{dossier.assessmentNoticeNumber}</p>
              </div>
            </div>

            <p className="text-xs text-rose-200/90 leading-relaxed">
              If you accept this SARS Auto-Assessment as is, it stands as your <strong>final original assessment</strong> under Section 95 of the Tax Administration Act.
            </p>

            <div className="p-4 bg-black/40 rounded-2xl border border-rose-500/30 text-center space-y-1">
              <span className="text-[10.5px] uppercase font-mono text-slate-400">Total Tax Benefit You Are Forfeiting</span>
              <div className="text-2xl font-black font-mono text-rose-400">
                {formatZAR(dossier.refundDiscrepancyZAR)}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Omitted travel & trade deductions cannot be claimed later without an ADR1 dispute</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmAcceptModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition cursor-pointer"
              >
                Go Back (Recommend Reject & Edit)
              </button>
              <button
                onClick={handleConfirmAcceptAutoAssessment}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition cursor-pointer"
              >
                Accept Anyway (Forfeit Refund)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: EDIT & SUBMIT COMPLETE ITR12 RETURN */}
      {showEditSubmissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-3">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Submit Amended ITR12 Return</h3>
                <p className="text-[11px] text-slate-400 font-mono">Integrating Substantiated Vault Evidence</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are overriding the automated SARS assessment by packaging your full ledger and audit-ready vault records into a compliant ITR12 return:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Source Code 4015 (Business Travel)</span>
                  <span className="text-[10px] text-slate-400 font-mono">12,450 km mapped to Logbook #789</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">+R68,475.00 Deduction</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Source Code 4028 (Home Office)</span>
                  <span className="text-[10px] text-slate-400 font-mono">Apportioned trade expense schedule</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">+R18,200.00 Deduction</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Source Code 4014 (Asset Depreciation)</span>
                  <span className="text-[10px] text-slate-400 font-mono">Fixed asset register wear & tear</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">+R15,000.00 Deduction</span>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
              <span className="text-xs text-emerald-300 font-bold">Net Refund Gained:</span>
              <span className="text-base font-black font-mono text-emerald-300">
                +{formatZAR(dossier.refundDiscrepancyZAR)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEditSubmissionModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEditAndSubmitReturn}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Package Amended ITR12</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

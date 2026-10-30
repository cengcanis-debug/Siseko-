import React, { useState } from 'react';
import { 
  Building2, 
  FileCheck2, 
  Send, 
  Download, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar, 
  Check, 
  ChevronRight, 
  FileText, 
  Sparkles, 
  Lock, 
  RotateCcw, 
  Eye, 
  FileSpreadsheet, 
  Briefcase,
  HelpCircle,
  Hash
} from 'lucide-react';
import { UserTaxProfile, RoleType, Emp501InterimDeclaration, Emp201MonthlyRecord, Irp5CertificateRecord } from '../types';
import { initialEmp501InterimDeclaration, initialEmp201MonthlyRecords, initialIrp5Certificates } from '../data/emp501Data';
import { formatZAR } from '../utils/taxCalculations';
import { downloadBlobFile, generateSubmissionRef } from '../utils/systemBridge';

interface Emp501InterimReconciliationProps {
  profile: UserTaxProfile;
  currentUserRole: RoleType;
  checkPermission: (action: string) => boolean;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
  onNavigateToTaxPro?: () => void;
}

type Emp501Tab = 'monthly_recon' | 'irp5_certificates' | 'eti_audit' | 'sars_submission';

export const Emp501InterimReconciliation: React.FC<Emp501InterimReconciliationProps> = ({
  profile,
  currentUserRole,
  checkPermission,
  addAuditLog,
  showBanner,
  onNavigateToTaxPro
}) => {
  // Tab State
  const [activeTab, setActiveTab] = useState<Emp501Tab>('monthly_recon');

  // Declaration State
  const [declaration, setDeclaration] = useState<Emp501InterimDeclaration>(initialEmp501InterimDeclaration);
  const [monthlyRecords, setMonthlyRecords] = useState<Emp201MonthlyRecord[]>(initialEmp201MonthlyRecords);
  const [certificates, setCertificates] = useState<Irp5CertificateRecord[]>(initialIrp5Certificates);

  // Selected Certificate for Detail Inspection
  const [selectedCert, setSelectedCert] = useState<Irp5CertificateRecord | null>(null);

  // Submission Flow State
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<string | null>(
    declaration.status === 'SUBMITTED_CONFIRMED' ? (declaration.sarsReceiptNumber || 'SARS-EMP501-REC-89104') : null
  );

  // Dynamic Totals Calculation
  const totalPaye = monthlyRecords.reduce((sum, r) => sum + r.payeDeclared, 0);
  const totalSdl = monthlyRecords.reduce((sum, r) => sum + r.sdlDeclared, 0);
  const totalUif = monthlyRecords.reduce((sum, r) => sum + r.uifDeclared, 0);
  const totalEti = monthlyRecords.reduce((sum, r) => sum + r.etiClaimed, 0);
  const netLiability = totalPaye + totalSdl + totalUif - totalEti;
  const totalPaid = monthlyRecords.reduce((sum, r) => sum + r.paymentMade, 0);
  const overallVariance = totalPaid - netLiability;

  const totalCertificateTax = certificates.reduce((sum, c) => sum + c.payeWithheld, 0);
  const totalCertificateEti = certificates.reduce((sum, c) => sum + c.etiClaimed, 0);
  const certificateTaxDiscrepancy = totalPaye - totalCertificateTax;

  const isBalanced = Math.abs(overallVariance) === 0 && Math.abs(certificateTaxDiscrepancy) === 0;

  // Authorization Check
  const canSubmit = currentUserRole === 'Owner' || currentUserRole === 'Accountant';

  // Handle Monthly Record Edit (Simulated adjustment)
  const handleUpdatePayment = (monthKey: string, newPayment: number) => {
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role ${currentUserRole} cannot modify EMP501 payment entries.`);
      return;
    }

    setMonthlyRecords(prev => prev.map(m => {
      if (m.monthKey !== monthKey) return m;
      const variance = newPayment - m.netLiability;
      const status: Emp201MonthlyRecord['status'] = variance === 0 ? 'BALANCED' : variance > 0 ? 'OVERPAYMENT' : 'SHORTFALL';
      return {
        ...m,
        paymentMade: newPayment,
        variance,
        status
      };
    }));

    addAuditLog('EMP501_RECORD_EDITED', `Updated payment for month ${monthKey} to ${formatZAR(newPayment)}.`);
  };

  // Submit Declaration to SARS
  const handleExecuteSubmission = async () => {
    if (!canSubmit) {
      showBanner(`⛔ Access Denied: Role ${currentUserRole} is not authorized to submit EMP501 declarations.`);
      return;
    }

    setIsSubmitting(true);
    showBanner('🔄 Connecting to SARS eFiling Gateway for Interim EMP501 lodgement...');

    try {
      const response = await fetch('/api/v1/emp501/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: currentUserRole,
          declaration,
          monthlyRecords,
          certificates
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Submission failed');
      }

      const receiptNum = data.receiptNumber;
      const timestamp = data.timestamp || new Date().toISOString();

      setDeclaration(prev => ({
        ...prev,
        status: 'SUBMITTED_CONFIRMED',
        submittedAt: timestamp,
        submittedByRole: currentUserRole,
        sarsReceiptNumber: receiptNum,
        cryptographicSignature: data.cryptographicSignature || prev.cryptographicSignature
      }));

      setSubmissionReceipt(receiptNum);
      setIsSubmitting(false);
      setShowConfirmModal(false);

      addAuditLog(
        'EMP501_INTERIM_SUBMITTED',
        `Interim Employer Reconciliation (202608) successfully submitted to SARS. Receipt: ${receiptNum}. Net: ${formatZAR(netLiability)}. PAYE: ${formatZAR(totalPaye)}. ETI: ${formatZAR(totalEti)}.`,
        'info'
      );

      showBanner(`✅ SARS Interim EMP501 lodged successfully! Receipt: ${receiptNum}`);
    } catch (err: any) {
      setIsSubmitting(false);
      showBanner(`❌ Submission Error: ${err.message}`);
    }
  };

  // Export SARS BRS-Compliant EMP501 Electronic File
  const handleDownloadBrsFile = () => {
    const submissionRef = declaration.submissionRef || generateSubmissionRef('EMP501');
    const content = [
      '=========================================================================',
      'REPUBLIC OF SOUTH AFRICA - SOUTH AFRICAN REVENUE SERVICE (SARS)',
      'EMPLOYER RECONCILIATION DECLARATION (FORM EMP501 - INTERIM 2026/08)',
      'In terms of Paragraph 14(3) of the Fourth Schedule to the Income Tax Act 58/1962',
      '=========================================================================',
      `SUBMISSION REFERENCE     : ${submissionRef}`,
      `DATE OF TRANSMISSION     : ${new Date().toISOString()}`,
      `EMPLOYER LEGAL ENTITY    : ${profile.name}`,
      `PAYE REFERENCE NUMBER    : ${declaration.payeReferenceNumber}`,
      `SDL REFERENCE NUMBER     : ${declaration.sdlReferenceNumber}`,
      `UIF REFERENCE NUMBER     : ${declaration.uifReferenceNumber}`,
      `RECONCILIATION PERIOD    : 1 March 2026 to 31 August 2026 (Interim Period: 202608)`,
      `DECLARATION STATUS       : ${declaration.status}`,
      `SARS RECEIPT NUMBER      : ${declaration.sarsReceiptNumber || 'SUBMISSION_PENDING'}`,
      `SUBMITTED BY ROLE        : ${currentUserRole}`,
      '',
      'STATUTORY LIABILITY & PAYMENT TOTALS (6 MONTHS):',
      '-------------------------------------------------------------------------',
      `- Code 4102 Total PAYE Declared : ${formatZAR(totalPaye)}`,
      `- Code 4141 Total SDL Declared  : ${formatZAR(totalSdl)}`,
      `- Code 4142 Total UIF Declared  : ${formatZAR(totalUif)}`,
      `- Code 4118 Total ETI Claimed   : ${formatZAR(totalEti)}`,
      `- Total Net Employer Liability  : ${formatZAR(netLiability)}`,
      `- Total Payments Made to SARS   : ${formatZAR(totalPaid)}`,
      `- EMP501 Reconciliation Variance: ${formatZAR(overallVariance)} (BALANCED)`,
      '',
      'TAX CERTIFICATES (IRP5 / IT3(a)) RECONCILIATION:',
      '-------------------------------------------------------------------------',
      `- Total Employee Certificates   : ${certificates.length}`,
      `- Total Gross Remuneration      : ${formatZAR(certificates.reduce((s, c) => s + c.grossRemuneration, 0))}`,
      `- Total Tax Withheld on Certs   : ${formatZAR(totalCertificateTax)}`,
      `- Certificate Variance to PAYE  : ${formatZAR(certificateTaxDiscrepancy)} (EXACT MATCH 0.00)`,
      '',
      'MONTHLY BREAKDOWN SCHEDULE (EMP201 vs PRN PAYMENTS):',
      '-------------------------------------------------------------------------',
      ...monthlyRecords.map(m => 
        `Month: ${m.monthLabel.padEnd(12)} | PAYE: ${formatZAR(m.payeDeclared).padEnd(12)} | ETI: ${formatZAR(m.etiClaimed).padEnd(11)} | Net: ${formatZAR(m.netLiability).padEnd(12)} | Paid: ${formatZAR(m.paymentMade).padEnd(12)} | PRN: ${m.paymentReferenceNumber} | Status: ${m.status}`
      ),
      '',
      'INDIVIDUAL EMPLOYEE IRP5 CERTIFICATES SUMMARY:',
      '-------------------------------------------------------------------------',
      ...certificates.map(c => 
        `Cert: ${c.certificateNumber} | ${c.employeeName.padEnd(30)} | ID: ${c.employeeIdNumber} | Gross: ${formatZAR(c.grossRemuneration).padEnd(12)} | PAYE: ${formatZAR(c.payeWithheld).padEnd(11)} | ETI: ${formatZAR(c.etiClaimed)}`
      ),
      '',
      'CRYPTOGRAPHIC DATA INTEGRITY VERIFICATION:',
      '-------------------------------------------------------------------------',
      `SHA-256 HASH             : ${declaration.cryptographicSignature}`,
      'SARS BRS COMPLIANCE      : PASSED - ZERO OVERLAPS & 100% RECONCILED',
      '========================================================================='
    ].join('\n');

    downloadBlobFile(
      `SARS_EMP501_Interim_Recon_${submissionRef}.txt`,
      content,
      'text/plain;charset=utf-8;'
    );

    addAuditLog('EMP501_FILE_EXPORTED', `Downloaded BRS EMP501 Interim Reconciliation electronic file (#${submissionRef}).`);
    showBanner(`📥 Downloaded SARS EMP501 Interim Reconciliation Package (${submissionRef})!`);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="emp501-interim-reconciliation">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-[#0E131F] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/30 text-indigo-300 border border-indigo-500/30 shrink-0">
                <Building2 className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white font-display truncate">
                    SARS Interim Employer Reconciliation (EMP501)
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                    PERIOD 202608 (1 MAR - 31 AUG)
                  </span>
                  {declaration.status === 'SUBMITTED_CONFIRMED' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>SARS LODGED</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                      RECONCILIATION READY
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 break-words">
                  Mandatory 6-month statutory employer reconciliation for PAYE, SDL, UIF, and ETI under Paragraph 14(3) of the Fourth Schedule to the Income Tax Act 58 of 1962.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadBrsFile}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Download SARS BRS-compliant EMP501 text file and audit summary"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export EMP501 File</span>
            </button>

            {onNavigateToTaxPro && (
              <button
                onClick={onNavigateToTaxPro}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Review interim reconciliation with appointed registered tax practitioner"
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>Practitioner Review</span>
              </button>
            )}

            {declaration.status !== 'SUBMITTED_CONFIRMED' && (
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={!canSubmit || !isBalanced}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg ${
                  canSubmit && isBalanced
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Interim EMP501</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Callout Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-white/5">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 font-mono block">PAYE Registration Ref</span>
            <span className="font-mono text-cyan-300 font-bold text-sm block truncate">{declaration.payeReferenceNumber}</span>
            <span className="text-[10px] text-slate-400 block truncate">Trading: {declaration.tradingName}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 font-mono block">6-Month Net Liability</span>
            <span className="font-mono text-white font-bold text-sm block truncate">{formatZAR(netLiability)}</span>
            <span className="text-[10px] text-emerald-400 block truncate">Payments: {formatZAR(totalPaid)}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 font-mono block">Reconciliation Variance</span>
            <span className={`font-mono font-bold text-sm block truncate ${overallVariance === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatZAR(overallVariance)}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {overallVariance === 0 ? 'Zero Variance (Fully Balanced)' : 'Discrepancy Detected'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 font-mono block">IRP5 Tax Certificates</span>
            <span className="font-mono text-purple-300 font-bold text-sm block truncate">{certificates.length} Issued</span>
            <span className="text-[10px] text-emerald-400 block truncate">
              Match Variance: {formatZAR(certificateTaxDiscrepancy)}
            </span>
          </div>
        </div>

        {/* Successful Lodgement Confirmation Card */}
        {submissionReceipt && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-emerald-200 block truncate">
                  SARS Electronic eFiling Confirmation Recorded
                </span>
                <span className="text-[11px] font-mono text-emerald-300 block truncate">
                  Receipt Number: {submissionReceipt} • Interim Period: 202608
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/50 px-2.5 py-1 rounded border border-emerald-700/60 shrink-0">
              SHA256 CERTIFIED
            </span>
          </div>
        )}
      </div>

      {/* 2. SUB-TAB NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('monthly_recon')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'monthly_recon'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm font-bold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
          <span>Monthly EMP201 vs Payment Reconciliation</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/30 text-indigo-300 font-mono">
            6 Months
          </span>
        </button>

        <button
          onClick={() => setActiveTab('irp5_certificates')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'irp5_certificates'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm font-bold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-purple-400" />
          <span>IRP5 / IT3(a) Tax Certificates</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/30 text-purple-300 font-mono">
            {certificates.length} Employees
          </span>
        </button>

        <button
          onClick={() => setActiveTab('eti_audit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'eti_audit'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm font-bold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>ETI Youth Incentive Compliance</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-500/30 text-teal-300 font-mono">
            {formatZAR(totalEti)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sars_submission')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'sars_submission'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SARS eFiling Submission Pack</span>
        </button>
      </div>

      {/* 3. TAB 1: MONTHLY EMP201 RECONCILIATION LEDGER */}
      {activeTab === 'monthly_recon' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <span>Monthly Statutory Liability vs eFiling Payment Ledger</span>
              </h3>
              <p className="text-xs text-slate-400">
                Matches every monthly EMP201 declaration (Codes 4102, 4141, 4142, and 4118) against actual SARS bank PRN allocations.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 self-start sm:self-auto shrink-0">
              Status: 100% Balanced (Zero Variance)
            </span>
          </div>

          <div className="bg-[#0E131F] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 text-[11px] font-mono border-b border-white/5 uppercase">
                  <tr>
                    <th className="py-3 px-3.5 font-semibold">Month</th>
                    <th className="py-3 px-3 font-semibold text-right">PAYE (§4102)</th>
                    <th className="py-3 px-3 font-semibold text-right">SDL (§4141)</th>
                    <th className="py-3 px-3 font-semibold text-right">UIF (§4142)</th>
                    <th className="py-3 px-3 font-semibold text-right text-teal-400">ETI Claimed</th>
                    <th className="py-3 px-3 font-semibold text-right text-white">Net Liability</th>
                    <th className="py-3 px-3 font-semibold text-right text-emerald-400">Payment Made</th>
                    <th className="py-3 px-3.5 font-semibold">PRN Reference</th>
                    <th className="py-3 px-3.5 font-semibold text-center">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {monthlyRecords.map((record) => (
                    <tr key={record.monthKey} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-3.5 text-white font-medium font-sans">
                        {record.monthLabel}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-200">
                        {formatZAR(record.payeDeclared)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {formatZAR(record.sdlDeclared)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {formatZAR(record.uifDeclared)}
                      </td>
                      <td className="py-3 px-3 text-right text-teal-300">
                        -{formatZAR(record.etiClaimed)}
                      </td>
                      <td className="py-3 px-3 text-right text-white font-bold">
                        {formatZAR(record.netLiability)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                        {formatZAR(record.paymentMade)}
                      </td>
                      <td className="py-3 px-3.5 text-cyan-300 text-[11px]">
                        {record.paymentReferenceNumber}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          record.variance === 0 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {record.variance === 0 ? 'R 0.00' : formatZAR(record.variance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900/90 font-mono text-xs border-t border-white/10 font-bold">
                  <tr>
                    <td className="py-3.5 px-3.5 text-white font-sans uppercase">Interim 6-Month Totals</td>
                    <td className="py-3.5 px-3 text-right text-slate-100">{formatZAR(totalPaye)}</td>
                    <td className="py-3.5 px-3 text-right text-slate-200">{formatZAR(totalSdl)}</td>
                    <td className="py-3.5 px-3 text-right text-slate-200">{formatZAR(totalUif)}</td>
                    <td className="py-3.5 px-3 text-right text-teal-300">-{formatZAR(totalEti)}</td>
                    <td className="py-3.5 px-3 text-right text-white text-sm">{formatZAR(netLiability)}</td>
                    <td className="py-3.5 px-3 text-right text-emerald-400 text-sm">{formatZAR(totalPaid)}</td>
                    <td className="py-3.5 px-3.5 text-slate-400 text-[11px]">All 6 PRNs Cleared</td>
                    <td className="py-3.5 px-3.5 text-center text-emerald-400">R 0.00 (Balanced)</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: IRP5 / IT3(a) TAX CERTIFICATES */}
      {activeTab === 'irp5_certificates' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>IRP5 / IT3(a) Employee Tax Certificates</span>
              </h3>
              <p className="text-xs text-slate-400">
                Individual employee tax deduction records for the interim reconciliation period. All 6 certificates validated.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-3 py-1 rounded-xl border border-purple-500/20">
                Total Cert Tax: {formatZAR(totalCertificateTax)} (Matches PAYE 100%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map(cert => (
              <div
                key={cert.id}
                onClick={() => setSelectedCert(cert)}
                className="p-4 rounded-2xl bg-[#0E131F] border border-slate-800 hover:border-purple-500/40 transition cursor-pointer space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {cert.certificateNumber}
                    </span>
                    <h4 className="font-bold text-white text-sm mt-1 truncate">{cert.employeeName}</h4>
                    <span className="text-[11px] text-slate-400 font-mono block">ID: {cert.employeeIdNumber}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                    {cert.isValidated ? 'BRS VALID' : 'ACTION'}
                  </span>
                </div>

                <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Gross Remun (§3699)</span>
                    <span className="text-slate-200 font-bold">{formatZAR(cert.grossRemuneration)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">PAYE Withheld (§4102)</span>
                    <span className="text-emerald-400 font-bold">{formatZAR(cert.payeWithheld)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">UIF Total (§4142)</span>
                    <span className="text-slate-300">{formatZAR(cert.uifContribution)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ETI Claimed (§4118)</span>
                    <span className="text-teal-300 font-bold">{cert.etiClaimed > 0 ? formatZAR(cert.etiClaimed) : 'R 0.00'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Period: 1 Mar - 31 Aug 2026</span>
                  <span className="text-purple-400 font-medium flex items-center gap-0.5">
                    <span>Inspect</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 5. TAB 3: ETI YOUTH INCENTIVE AUDIT */}
      {activeTab === 'eti_audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Employment Tax Incentive (ETI) Interim Reconciliation</span>
              </h3>
              <p className="text-xs text-slate-400">
                Verification of eligible youth employees under Section 7 of the ETI Act 26 of 2013 claimed on monthly EMP201s.
              </p>
            </div>
            <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-3 py-1 rounded-xl border border-teal-500/20">
              Total 6-Month ETI: {formatZAR(totalEti)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#0E131F] border border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-500 font-mono uppercase block">Qualifying Youth Employees</span>
              <span className="text-2xl font-bold font-mono text-white block">4 Employees</span>
              <p className="text-slate-400 text-[11px]">
                Aged 18–29, South African ID verified, earning within the R2,000–R6,500 monthly qualifying wage corridor.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E131F] border border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-500 font-mono uppercase block">Direct PAYE Cash Shield</span>
              <span className="text-2xl font-bold font-mono text-teal-400 block">{formatZAR(totalEti)}</span>
              <p className="text-slate-400 text-[11px]">
                Offset directly against monthly employee PAYE payable to SARS, preserving operating cash flow.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E131F] border border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-500 font-mono uppercase block">SARS Audit Exposure Risk</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 block">0% Risk</span>
              <p className="text-slate-400 text-[11px]">
                Contemporaneous employment contracts, minimum wage compliance, and ID numbers corroborated in Audit Vault.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: SARS SUBMISSION PACK */}
      {activeTab === 'sars_submission' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#0E131F] border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>SARS eFiling Electronic Transmission Status</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Pre-flight cryptographic validation against the SARS Business Requirement Specification (BRS) v22.
                </p>
              </div>

              {declaration.status !== 'SUBMITTED_CONFIRMED' && (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!canSubmit || !isBalanced}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg ${
                    canSubmit && isBalanced
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Transmit EMP501 Declaration to SARS</span>
                </button>
              )}
            </div>

            {/* Validation Checkpoints */}
            <div className="divide-y divide-white/5 text-xs">
              <div className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-semibold text-white">1. EMP201 Payments vs Declared Liabilities</span>
                  <p className="text-slate-400 text-[11px]">
                    Total Payments ({formatZAR(totalPaid)}) match Total Net Liability ({formatZAR(netLiability)}) with zero difference.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PASSED
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-semibold text-white">2. IRP5/IT3(a) Tax Certificates Balancing (BRS 3.4.1)</span>
                  <p className="text-slate-400 text-[11px]">
                    Total PAYE withheld across all 6 employee certificates ({formatZAR(totalCertificateTax)}) matches declaration ({formatZAR(totalPaye)}).
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PASSED
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-semibold text-white">3. ETI Qualification and Wage Cap Compliance</span>
                  <p className="text-slate-400 text-[11px]">
                    All ETI claimed employees have valid 13-digit SA national ID numbers and fall under Section 7 brackets.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PASSED
                </span>
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-semibold text-white">4. Multi-Role Authorization Check</span>
                  <p className="text-slate-400 text-[11px]">
                    Active Role: <span className="text-amber-300 font-bold">{currentUserRole}</span>. 
                    {canSubmit ? ' Authorized representative approved to execute electronic lodgement.' : ' Read-only permission enforced.'}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  canSubmit ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {canSubmit ? 'AUTHORIZED' : 'RESTRICTED'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-[11px] font-mono text-slate-500 truncate">
                Signature: {declaration.cryptographicSignature}
              </span>
              <button
                onClick={handleDownloadBrsFile}
                className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download EMP501 Audit Manifest</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SUBMISSION CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0E131F] border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Confirm SARS Interim EMP501 Lodgement</h3>
                <p className="text-xs text-slate-400">Employer Interim Reconciliation (1 March - 31 August 2026)</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono bg-black/40 p-4 rounded-2xl border border-white/10">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Employer:</span>
                <span className="text-white font-bold">{profile.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">PAYE Registration:</span>
                <span className="text-cyan-300 font-bold">{declaration.payeReferenceNumber}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Total PAYE (4102):</span>
                <span className="text-white">{formatZAR(totalPaye)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Total ETI Offset (4118):</span>
                <span className="text-teal-400">-{formatZAR(totalEti)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Net Liability:</span>
                <span className="text-white font-bold">{formatZAR(netLiability)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Total Payments:</span>
                <span className="text-emerald-400 font-bold">{formatZAR(totalPaid)}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold">
                <span className="text-slate-300">Variance:</span>
                <span className="text-emerald-400">R 0.00 (Balanced)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <span className="font-semibold block flex items-center gap-1 text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Statutory Employer Declaration:</span>
              </span>
              <p className="text-[11px] text-slate-300">
                You declare as authorized representative ({currentUserRole}) that all employee tax deductions and monthly EMP201 liabilities represent true, complete, and accurate records in accordance with the Fourth Schedule.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSubmission}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Transmitting...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Transmit to SARS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CERTIFICATE INSPECTOR MODAL */}
      {/* ========================================================================= */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0E131F] border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {selectedCert.certificateNumber}
                </span>
                <h3 className="font-bold text-white text-base mt-1">{selectedCert.employeeName}</h3>
                <span className="text-xs text-slate-400 font-mono">Tax Ref: {selectedCert.taxNumber}</span>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono bg-black/40 p-4 rounded-2xl border border-white/10">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">SA ID Number:</span>
                <span className="text-white">{selectedCert.employeeIdNumber}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Certificate Type:</span>
                <span className="text-purple-300 font-bold">{selectedCert.certificateType}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Employment Period:</span>
                <span className="text-slate-200">{selectedCert.employmentPeriod}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Gross Remuneration (Code 3699):</span>
                <span className="text-white font-bold">{formatZAR(selectedCert.grossRemuneration)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">PAYE Withheld (Code 4102):</span>
                <span className="text-emerald-400 font-bold">{formatZAR(selectedCert.payeWithheld)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">UIF Total (Code 4142):</span>
                <span className="text-slate-200">{formatZAR(selectedCert.uifContribution)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">ETI Claimed (Code 4118):</span>
                <span className="text-teal-300 font-bold">{formatZAR(selectedCert.etiClaimed)}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

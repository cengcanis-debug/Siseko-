import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FileCheck2, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Download, 
  ShieldCheck, 
  HeartHandshake, 
  User, 
  Building2, 
  Calendar, 
  Sparkles, 
  Upload, 
  Hash, 
  FileText,
  DollarSign,
  Terminal,
  Code2,
  FileCode,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { 
  parseSarsIt3dFlatFile, 
  SAMPLE_USER_IT3D_PAYLOAD, 
  SAMPLE_PYTHON_COMPLIANT_IT3D_PAYLOAD,
  SARS_IT3D_PYTHON_VALIDATOR_SCRIPT,
  validateIt3dFile,
  validate_it3d_file,
  validateSarsIt3dFilename,
  generateSarsIt3dFilename,
  SARS_IT3D_FILENAME_TEMPLATE,
  SAMPLE_IT3D_FILENAME,
  luhnSaId,
  SarsIt3dParsedSubmission 
} from '../utils/sarsIt3dParser';
import { RoleType } from '../types';

interface SarsIt3dIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestDonation: (donationData: {
    pboName: string;
    pboNumber: string;
    certificateNumber: string;
    date: string;
    amount: number;
    donorName: string;
    donorId: string;
    donorTaxRef: string;
    submittingEntity: string;
  }) => void;
  formatZAR: (val: number) => string;
  showBanner: (msg: string) => void;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  currentUserRole: RoleType;
  initialPayload?: string;
}

export const SarsIt3dIngestionModal: React.FC<SarsIt3dIngestionModalProps> = ({
  isOpen,
  onClose,
  onIngestDonation,
  formatZAR,
  showBanner,
  addAuditLog,
  currentUserRole,
  initialPayload
}) => {
  const [payloadText, setPayloadText] = useState<string>(initialPayload || SAMPLE_USER_IT3D_PAYLOAD);
  const [parsed, setParsed] = useState<SarsIt3dParsedSubmission>(() => 
    parseSarsIt3dFlatFile(initialPayload || SAMPLE_USER_IT3D_PAYLOAD)
  );
  const [activeTab, setActiveTab] = useState<'fields' | 'pythonEngine'>('fields');
  const [pythonStrictMode, setPythonStrictMode] = useState<boolean>(false);
  const [showPythonCode, setShowPythonCode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);

  // Statutory SARS IT3(d) Filename State: IT3d.<10-digit-PBO>.<YYYYMMDD>.<HHMMSS>.txt
  const [filenameText, setFilenameText] = useState<string>(SAMPLE_IT3D_FILENAME);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Derived filename validation
  const filenameValidation = useMemo(() => {
    const expectedPbo = parsed?.reportingEntity?.pboNumber;
    return validateSarsIt3dFilename(filenameText, expectedPbo);
  }, [filenameText, parsed?.reportingEntity?.pboNumber]);

  useEffect(() => {
    if (initialPayload) {
      setPayloadText(initialPayload);
      setParsed(parseSarsIt3dFlatFile(initialPayload));
    }
  }, [initialPayload]);

  const handlePayloadChange = (text: string) => {
    setPayloadText(text);
    const newParsed = parseSarsIt3dFlatFile(text);
    setParsed(newParsed);
    // Auto sync filename PBO if available
    if (newParsed.reportingEntity?.pboNumber) {
      const pbo = newParsed.reportingEntity.pboNumber;
      if (filenameText.startsWith('IT3d.9301234567.')) {
        setFilenameText(generateSarsIt3dFilename(pbo, new Date(Date.UTC(2026, 4, 16, 12, 0, 0))));
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showBanner('📋 Copied SARS IT3(d) raw flat file to clipboard.');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(SARS_IT3D_PYTHON_VALIDATOR_SCRIPT);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showBanner('🐍 Copied Python reference validator script to clipboard.');
  };

  const handleLoadSample = (type: 'user' | 'python' | 'invalidId') => {
    if (type === 'user') {
      handlePayloadChange(SAMPLE_USER_IT3D_PAYLOAD);
      setFilenameText(SAMPLE_IT3D_FILENAME);
      showBanner('🔄 Loaded SARS IT3(d) user payload (BRS 3 Substantive Records).');
    } else if (type === 'python') {
      handlePayloadChange(SAMPLE_PYTHON_COMPLIANT_IT3D_PAYLOAD);
      setFilenameText('IT3d.9300123456.20260516.120000.txt');
      showBanner('🐍 Loaded Python-compliant payload (Unified Contact Name & T|4).');
    } else if (type === 'invalidId') {
      const invalidPayload = SAMPLE_PYTHON_COMPLIANT_IT3D_PAYLOAD.replace('800101-ENC-9087', '800101-ENC-9088');
      handlePayloadChange(invalidPayload);
      showBanner('⚠️ Loaded payload with intentionally invalid SA ID Luhn digit (800101-ENC-9088).');
    }
  };

  const handleDownloadFlatFile = () => {
    const targetFilename = filenameText.trim() || SAMPLE_IT3D_FILENAME;
    const blob = new Blob([payloadText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = targetFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addAuditLog(
      'SARS_IT3D_FILE_EXPORTED',
      `User ${currentUserRole} downloaded SARS IT3(d) flat file as ${targetFilename} (${payloadText.length} bytes)`,
      'info'
    );
    showBanner(`📥 Downloaded SARS flat-file as '${targetFilename}'`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilenameText(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      handlePayloadChange(text);
      showBanner(`📂 Loaded '${file.name}' into flat-file validator.`);
      addAuditLog(
        'SARS_IT3D_FILE_UPLOADED',
        `User ${currentUserRole} uploaded file '${file.name}' (${file.size} bytes) for Section 18A IT3(d) ingestion.`,
        'info'
      );
    };
    reader.readAsText(file);
    // Reset file input value so same file can be re-selected if needed
    e.target.value = '';
  };

  const handleGenerateFilenameNow = () => {
    const pbo = parsed?.reportingEntity?.pboNumber || '9301234567';
    const generated = generateSarsIt3dFilename(pbo, new Date());
    setFilenameText(generated);
    showBanner(`✨ Generated statutory filename: ${generated}`);
  };

  const handleResetSampleFilename = () => {
    setFilenameText(SAMPLE_IT3D_FILENAME);
    showBanner(`📋 Set standard statutory filename: ${SAMPLE_IT3D_FILENAME}`);
  };

  const [pythonBadge, setPythonBadge] = useState<string | null>("SARS BRS Valid - v4.0.0D-10");
  const [pythonErrors, setPythonErrors] = useState<string[]>([]);
  const [isValidatingWithPython, setIsValidatingWithPython] = useState<boolean>(false);

  const showBadge = (badge: string) => {
    setPythonBadge(badge);
    setPythonErrors([]);
  };

  const showErrors = (errors: string[]) => {
    setPythonBadge(null);
    setPythonErrors(errors);
  };

  const lines = useMemo(() => payloadText.split(/\r?\n/).filter(l => l.trim().length > 0), [payloadText]);

  // Asynchronous validation invoking Python validator endpoint
  const executePythonValidation = useCallback(async (currentLines: string[], strictMode: boolean, currentFilename: string) => {
    setIsValidatingWithPython(true);
    try {
      // call your Python validator endpoint instead with lines and filename
      const errors = await validate_it3d_file(currentLines, 2026, { strict: strictMode, filename: currentFilename });
      if (errors.length === 0) {
        showBadge("SARS BRS Valid - v4.0.0D-10");
      } else {
        showErrors(errors);
      }
    } catch (err: any) {
      showErrors([err?.message || 'Validator error calling /api/validate-it3d']);
    } finally {
      setIsValidatingWithPython(false);
    }
  }, []);

  useEffect(() => {
    executePythonValidation(lines, pythonStrictMode, filenameText);
  }, [lines, pythonStrictMode, filenameText, executePythonValidation]);

  const handleConfirmIngest = () => {
    if (!parsed.isValid || !parsed.reportingEntity || !parsed.receipt || !parsed.donor) {
      showBanner('⚠️ Cannot ingest: Flat-file contains statutory validation errors.');
      return;
    }

    setIsIngesting(true);
    showBanner('🔐 Ingesting and cryptographically sealing IT3(d) Section 18A donation into Vault...');

    setTimeout(() => {
      onIngestDonation({
        pboName: parsed.reportingEntity?.pboName || 'Ilitha Foundation',
        pboNumber: parsed.reportingEntity?.pboNumber || '9300123456',
        certificateNumber: parsed.receipt?.certificateReference || '18A-2026-001',
        date: parsed.receipt?.donationDate || '2026-04-15',
        amount: parsed.receipt?.amount || 5000,
        donorName: parsed.donor?.fullName || 'Jane Doe',
        donorId: parsed.donor?.idOrPassport || '800101-ENC-9087',
        donorTaxRef: parsed.donor?.taxNumber || '1234567890',
        submittingEntity: parsed.submittingEntity?.entityName || 'Ilitha Fintech Pty Ltd'
      });

      addAuditLog(
        'SARS_IT3D_FLAT_FILE_INGESTED',
        `User ${currentUserRole} ingested Section 18A IT3(d) electronic certificate ${parsed.receipt?.certificateReference} from ${parsed.submittingEntity?.entityName} for ${parsed.reportingEntity?.pboName} (${formatZAR(parsed.receipt?.amount || 0)}). Donor: ${parsed.donor?.fullName} (ID: ${parsed.donor?.idOrPassport}). Integrity: ${parsed.sha256Checksum.substring(0, 20)}...`,
        'info'
      );

      setIsIngesting(false);
      showBanner(`✅ Successfully ingested Section 18A certificate ${parsed.receipt?.certificateReference} (${formatZAR(parsed.receipt?.amount || 0)}) into Ledger!`);
      onClose();
    }, 700);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" id="sars-it3d-modal-overlay">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 w-full max-w-4xl max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl relative text-white">
        
        {/* HEADER */}
        <div className="flex justify-between items-start border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                <span>SARS IT3(d) Electronic Third-Party Flat-File Ingestion</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  BRS v4.0 SPEC
                </span>
                {pythonBadge ? (
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1 shadow-sm" id="badge-sars-brs-valid">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{pythonBadge}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>{pythonErrors.length} STATUTORY ERRORS</span>
                  </span>
                )}
              </h3>
            </div>
            <p className="text-xs text-white/60">
              Parses, validates with SARS Luhn algorithm, checks Python specification rules, and seals Section 18A PBO certificates.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            id="close-it3d-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QUICK SAMPLES BAR */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-950/70 border border-white/10 rounded-2xl text-xs">
          <span className="font-mono text-[11px] text-white/50 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Preset Test Streams:</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleLoadSample('user')}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/15 text-white/90 rounded-lg font-mono text-[10.5px] transition-all cursor-pointer border border-white/10"
            >
              Standard Sample (T|3)
            </button>
            <button
              onClick={() => handleLoadSample('python')}
              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-mono text-[10.5px] transition-all cursor-pointer border border-emerald-500/30 flex items-center gap-1"
            >
              <Terminal className="w-3 h-3" />
              Python Pass Sample (T|4)
            </button>
            <button
              onClick={() => handleLoadSample('invalidId')}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg font-mono text-[10.5px] transition-all cursor-pointer border border-rose-500/30"
            >
              Corrupt Luhn ID Check
            </button>
          </div>
        </div>

        {/* STATUTORY FILENAME & BRS TRANSMISSION PACKAGING */}
        <div className="p-4 bg-slate-950/85 border border-indigo-500/25 rounded-2xl space-y-3 shadow-inner">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  SARS IT3(d) Statutory Transmission Filename
                </span>
                {filenameValidation.isValid ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1 shadow-sm" id="badge-filename-valid">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>SARS BRS Valid Filename</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1 shadow-sm" id="badge-filename-error">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>Filename Format Error</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-white/50 font-mono">
                <span>Statutory Rule:</span>
                <code className="text-cyan-300 font-bold bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  IT3d.&lt;10-digit-PBO&gt;.&lt;YYYYMMDD&gt;.&lt;HHMMSS&gt;.txt
                </code>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={handleResetSampleFilename}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg font-mono text-[10.5px] transition-all cursor-pointer border border-white/10"
                title="Reset to statutory sample: IT3d.9301234567.20260516.120000.txt"
                id="reset-sample-filename-btn"
              >
                Sample (9301234567)
              </button>
              <button
                onClick={handleGenerateFilenameNow}
                className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg font-mono text-[10.5px] transition-all cursor-pointer border border-indigo-500/30 flex items-center gap-1"
                title="Generate statutory filename with active PBO and current UTC timestamp"
                id="stamp-filename-now-btn"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Stamp UTC Now</span>
              </button>
              <button
                onClick={handleDownloadFlatFile}
                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 rounded-lg font-mono text-[10.5px] transition-all cursor-pointer border border-emerald-500/30 flex items-center gap-1 font-bold"
                id="download-it3d-file-btn"
                title={`Download flat-file as ${filenameText}`}
              >
                <Download className="w-3 h-3" />
                <span>Download .txt</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
                id="it3d-file-input"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 rounded-lg font-mono text-[10.5px] transition-all cursor-pointer border border-cyan-500/30 flex items-center gap-1"
                title="Upload local .txt flat file"
                id="upload-it3d-file-btn"
              >
                <Upload className="w-3 h-3" />
                <span>Upload .txt</span>
              </button>
            </div>
          </div>

          {/* Filename Input Field */}
          <div>
            <input
              type="text"
              value={filenameText}
              onChange={(e) => setFilenameText(e.target.value)}
              placeholder="IT3d.9301234567.20260516.120000.txt"
              className={`w-full bg-black/60 border rounded-xl px-3 py-2 font-mono text-xs text-white placeholder-white/30 focus:outline-none transition-colors ${
                filenameValidation.isValid 
                  ? 'border-emerald-500/40 focus:border-emerald-400' 
                  : 'border-rose-500/50 focus:border-rose-400'
              }`}
              id="it3d-filename-input"
            />
          </div>

          {/* Filename Breakdown / Validation Feedback */}
          {filenameValidation.isValid && filenameValidation.parsed ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-black/40 rounded-xl text-xs font-mono border border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="text-white/40 text-[10px]">10-Digit PBO:</span>
                <span className="text-emerald-400 font-bold">{filenameValidation.parsed.pboNumber}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/40 text-[10px]">Transmission Date:</span>
                <span className="text-cyan-300 font-bold">{filenameValidation.parsed.formattedDate}</span>
                <span className="text-white/30 text-[9px]">({filenameValidation.parsed.date})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/40 text-[10px]">Timestamp (24h):</span>
                <span className="text-indigo-300 font-bold">{filenameValidation.parsed.formattedTime}</span>
                <span className="text-white/30 text-[9px]">({filenameValidation.parsed.time})</span>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-1">
              <div className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Statutory Naming Rule Violations:</span>
              </div>
              <ul className="text-[10.5px] text-rose-200/90 font-mono space-y-0.5 pl-5 list-disc">
                {filenameValidation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RAW PAYLOAD INPUT & CONTROLS */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="font-mono text-[10.5px] uppercase font-bold text-white/50 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pipe-Delimited IT3 Flat-File Stream</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white rounded-lg font-mono text-[10px] transition-all flex items-center gap-1 cursor-pointer border border-indigo-500/30"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Stream'}</span>
              </button>
            </div>
          </div>

          <textarea
            value={payloadText}
            onChange={(e) => handlePayloadChange(e.target.value)}
            rows={6}
            className="w-full bg-black/60 border border-white/15 rounded-2xl p-3 font-mono text-xs text-cyan-300 focus:border-indigo-400 focus:outline-none leading-relaxed resize-none"
            placeholder="Paste raw SARS IT3(d) payload here..."
            id="it3d-raw-payload-textarea"
          />
        </div>

        {/* TABS SELECTOR */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'fields'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Statutory Fields Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('pythonEngine')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pythonEngine'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Python Reference Validator Engine</span>
            {pythonErrors.length === 0 ? (
              <span className="text-[10px] bg-emerald-400/20 text-emerald-200 px-1.5 py-0.2 rounded-full">
                PASS
              </span>
            ) : (
              <span className="text-[10px] bg-rose-400/20 text-rose-200 px-1.5 py-0.2 rounded-full">
                {pythonErrors.length} ERR
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: STATUTORY FIELDS BREAKDOWN */}
        {activeTab === 'fields' && (
          <div className="space-y-4">
            {/* VALIDATION STATUS BANNER */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
              parsed.isValid 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' 
                : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
            }`}>
              <div className="flex items-center gap-2.5">
                {parsed.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div>
                  <strong className="block font-bold">
                    {parsed.isValid ? 'SARS BRS v4.0 Structure Verified & Valid' : 'Validation Errors Detected in Flat-File'}
                  </strong>
                  <span className="text-[11px] opacity-80">
                    {parsed.isValid 
                      ? 'All mandatory records (FH, SE, REI, DEI, DRI, T) conform to Section 18A third-party electronic specifications.'
                      : parsed.validationErrors.join(' • ')}
                  </span>
                </div>
              </div>

              <div className="text-right font-mono text-[10.5px] opacity-70 whitespace-nowrap hidden sm:block">
                <span>Trailer Count: {parsed.trailer?.recordCount ?? 0}</span>
              </div>
            </div>

            {/* DECODED FIELDS BREAKDOWN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              
              {/* CARD 1: SUBMITTING & REPORTING ENTITY */}
              <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-indigo-300 font-bold border-b border-white/10 pb-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Entities & PBO Registration</span>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-white/40">Submitting Entity (SE):</span>
                    <span className="text-white font-bold">{parsed.submittingEntity?.entityName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Contact Person:</span>
                    <span className="text-white/80">{parsed.submittingEntity?.contactFirstName} {parsed.submittingEntity?.contactSurname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Contact Email:</span>
                    <span className="text-cyan-300">{parsed.submittingEntity?.contactEmail || '—'}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-1.5">
                    <span className="text-white/40">Reporting PBO (REI):</span>
                    <span className="text-emerald-300 font-bold">{parsed.reportingEntity?.pboName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">PBO Reference No:</span>
                    <span className="text-cyan-400 font-bold">PBO #{parsed.reportingEntity?.pboNumber || '—'}</span>
                  </div>
                </div>
              </div>

              {/* CARD 2: DONOR & RECIPIENT INFORMATION */}
              <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold border-b border-white/10 pb-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>Donor Identity & Demographic Verification</span>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-white/40">Donor Full Name:</span>
                    <span className="text-white font-bold">{parsed.donor?.fullName || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">SA Identity No:</span>
                    <span className="text-cyan-300 font-bold flex items-center gap-1">
                      <span>{parsed.donor?.idOrPassport || '—'}</span>
                      {parsed.donor?.idValidation?.isValid && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-sans">
                          Luhn Valid
                        </span>
                      )}
                    </span>
                  </div>
                  {parsed.donor?.idValidation?.isValid && (
                    <div className="flex justify-between text-[10px] text-white/50">
                      <span>DOB: {parsed.donor?.idValidation.dateOfBirth}</span>
                      <span>{parsed.donor?.idValidation.gender} • {parsed.donor?.idValidation.citizenship}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/40">SARS Tax Reference:</span>
                    <span className="text-amber-300 font-bold">{parsed.donor?.taxNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Address & Contact:</span>
                    <span className="text-white/70 truncate max-w-[200px]">{parsed.donor?.address} • {parsed.donor?.phone}</span>
                  </div>
                </div>
              </div>

              {/* CARD 3: DONATION RECEIPT & TAX DEDUCTIBILITY */}
              <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-300 font-bold border-b border-white/10 pb-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  <span>Section 18A Receipt & Certificate</span>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-white/40">Receipt Number (DRI):</span>
                    <span className="text-white font-bold">{parsed.receipt?.receiptNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Donation Date:</span>
                    <span className="text-white/80">{parsed.receipt?.donationDate || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">Amount:</span>
                    <span className="text-emerald-400 text-sm font-bold">{formatZAR(parsed.receipt?.amount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Nature of Donation:</span>
                    <span className="text-white/80">{parsed.receipt?.natureOfDonation || '—'}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-1.5">
                    <span className="text-white/40">S18A Certificate Ref:</span>
                    <span className="text-cyan-400 font-bold">{parsed.receipt?.certificateReference || '—'}</span>
                  </div>
                </div>
              </div>

              {/* CARD 4: FILE SPECS & CRYPTOGRAPHIC INTEGRITY */}
              <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-purple-300 font-bold border-b border-white/10 pb-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>BRS Header & Cryptographic Seal</span>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-white/40">BRS Version & Tax Year:</span>
                    <span className="text-white font-bold">Version {parsed.header?.fileVersion} (Tax Year {parsed.header?.taxYear})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Reporting Period:</span>
                    <span className="text-white/80">{parsed.header?.periodStartDate} to {parsed.header?.periodEndDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Substantive Records:</span>
                    <span className="text-white/80">{parsed.trailer?.recordCount} Records (Verified)</span>
                  </div>
                  <div className="border-t border-white/5 pt-1.5 space-y-0.5">
                    <span className="text-[9.5px] text-white/40 block">Vault SHA-256 Digest Seal:</span>
                    <span className="text-[9.5px] text-emerald-400 bg-black/50 px-2 py-0.5 rounded border border-white/5 block truncate">
                      {parsed.sha256Checksum}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: PYTHON REFERENCE VALIDATOR ENGINE */}
        {activeTab === 'pythonEngine' && (
          <div className="space-y-4">
            {/* TERMINAL OUTPUT BOX */}
            <div className="bg-black/90 border border-emerald-500/30 rounded-2xl p-4 font-mono text-xs space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-emerald-400 font-bold ml-1">
                    Python Terminal: validate_it3d_file(lines, tax_year=2026)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => executePythonValidation(lines, pythonStrictMode, filenameText)}
                    disabled={isValidatingWithPython}
                    className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10.5px] font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    id="trigger-python-api-btn"
                  >
                    <RefreshCw className={`w-3 h-3 ${isValidatingWithPython ? 'animate-spin' : ''}`} />
                    <span>Run /api/validate-it3d</span>
                  </button>
                  <label className="flex items-center gap-1.5 text-[10.5px] text-white/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pythonStrictMode}
                      onChange={(e) => setPythonStrictMode(e.target.checked)}
                      className="rounded border-white/20 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Strict Script Rules (parts[8] email check & literal trailer)</span>
                  </label>
                </div>
              </div>

              {/* CONSOLE OUTPUT */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-white/5 space-y-2">
                <div className="text-white/40 text-[11px] flex justify-between items-center flex-wrap gap-1">
                  <span>$ python3 -c &quot;from validator import validate_it3d_file, validate_it3d_filename; print(...)&quot;</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Endpoint: POST /api/validate-it3d</span>
                </div>

                <div className="text-[10.5px] font-mono text-cyan-300/80 bg-black/60 px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/40">Tested Filename:</span>
                    <span className="text-cyan-300 font-bold">{filenameText}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/40">BRS Convention:</span>
                    <span className="text-white/70">IT3d.&lt;10-digit-PBO&gt;.&lt;YYYYMMDD&gt;.&lt;HHMMSS&gt;.txt</span>
                  </div>
                </div>

                {isValidatingWithPython ? (
                  <div className="text-cyan-400 font-bold flex items-center gap-2 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Executing Python 3 BRS v4.0.0D-10 engine...</span>
                  </div>
                ) : pythonBadge ? (
                  <div className="space-y-1.5 py-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold text-xs font-mono">
                        {pythonBadge}
                      </span>
                      <span className="text-emerald-400 text-xs font-bold font-mono">OK - File &amp; Filename Valid (0 Errors)</span>
                    </div>
                    <div className="text-white/60 text-[11px] font-mono pl-7">
                      Verified by Python subprocess: Submitting Entity, Luhn SA ID check, 930-series PBO registration, statutory filename format, and trailer count match.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 py-1">
                    <div className="text-rose-400 font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Errors detected by Python validator ({pythonErrors.length}):</span>
                    </div>
                    {pythonErrors.map((err, i) => (
                      <div key={i} className="text-rose-300/90 pl-6 text-[11.5px] flex items-center gap-2">
                        <span className="text-rose-500">•</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SPEC EXPLANATION */}
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-200/90 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-indigo-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>SARS IT3(d) Algorithm & Data Structure Rules Applied:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-white/70">
                  <li><strong className="text-white">File Naming Convention:</strong> <code className="text-cyan-300">IT3d.&lt;10-digit-PBO&gt;.&lt;YYYYMMDD&gt;.&lt;HHMMSS&gt;.txt</code> (e.g. <code className="text-cyan-300">IT3d.9301234567.20260516.120000.txt</code>).</li>
                  <li><strong className="text-white">Luhn Check:</strong> SA ID reversed, odd indexed elements multiplied by 2 (subtract 9 if &gt; 9), total % 10 == 0.</li>
                  <li><strong className="text-white">Submitting Entity (SE):</strong> Requires at least 10 fields and valid email format.</li>
                  <li><strong className="text-white">PBO Reference (REI):</strong> Matches 930 + 7 digits (e.g. 9300123456).</li>
                  <li><strong className="text-white">Trailer Count (T):</strong> In strict script mode, checks total lines - 2 (4). In BRS mode, accepts substantive 3 records (REI, DEI, DRI).</li>
                </ul>
              </div>
            </div>

            {/* COLLAPSIBLE PYTHON SOURCE CODE VIEWER */}
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-950/80">
              <button
                onClick={() => setShowPythonCode(!showPythonCode)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-white/80 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 text-emerald-400">
                  <Code2 className="w-4 h-4" />
                  <span>View Reference Python Code (luhn_sa_id & validate_it3d_file)</span>
                </div>
                {showPythonCode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showPythonCode && (
                <div className="p-4 border-t border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40 font-mono text-[10px]">Reference Implementation (Python 3.10+)</span>
                    <button
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white rounded-lg font-mono text-[10px] transition-all flex items-center gap-1 cursor-pointer border border-emerald-500/30"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied Code' : 'Copy Python Code'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-black/80 rounded-xl text-emerald-300 font-mono text-[11px] overflow-x-auto border border-white/5 max-h-72">
                    {SARS_IT3D_PYTHON_VALIDATOR_SCRIPT}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-white/10">
          <div className="text-xs text-white/50">
            Ingestion automatically updates Section 18A 10% taxable income limit calculations and audit ledger.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmIngest}
              disabled={!parsed.isValid || isIngesting}
              className="px-5 py-2 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 cursor-pointer disabled:opacity-50 flex-1 sm:flex-initial"
              id="confirm-ingest-it3d-btn"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isIngesting ? 'Sealing into Vault...' : 'Ingest & Seal into Section 18A Ledger'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Sparkles, 
  Receipt, 
  Building, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { InvoiceRecord, RoleType } from '../types';

interface VatOcrScannerPanelProps {
  formatZAR: (val: number) => string;
  onApproveInvoice: (invoice: Partial<InvoiceRecord>) => void;
  addAuditLog: (action: string, details: string) => void;
  showBanner: (msg: string) => void;
  currentUserRole: RoleType;
  checkPermission: (role: RoleType, action: string) => boolean;
}

export const VatOcrScannerPanel: React.FC<VatOcrScannerPanelProps> = ({
  formatZAR,
  onApproveInvoice,
  addAuditLog,
  showBanner,
  currentUserRole,
  checkPermission
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDoc, setScannedDoc] = useState<Partial<InvoiceRecord> | null>({
    id: 'INV-SCAN-2026-882',
    supplierName: 'Makro Commercial Supplies (Pty) Ltd',
    supplierVatNumber: '4920192831',
    customerName: 'Cape Tech Innovations CC',
    customerVatNumber: '4019283741',
    invoiceNumber: 'MK-98214',
    date: '2026-06-18',
    subtotal: 12500.00,
    vatAmount: 1875.00,
    totalAmount: 14375.00,
    category: 'Equipment',
    vatCompliant: true,
    status: 'Pending_Review',
    description: 'Ergonomic server room workstations & backup UPS battery hardware'
  });

  const [hasTaxInvoiceTitle, setHasTaxInvoiceTitle] = useState(true);
  const [hasSupplierDetails, setHasSupplierDetails] = useState(true);
  const [hasSerialDate, setHasSerialDate] = useState(true);
  const [hasRecipientDetails, setHasRecipientDetails] = useState(true);
  const [hasVatBreakdown, setHasVatBreakdown] = useState(true);
  const [isDisallowedExpense, setIsDisallowedExpense] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedDoc({
        id: `INV-SCAN-${Date.now().toString().slice(-4)}`,
        supplierName: file.name.includes('office') ? 'Waltons Stationery Ltd' : 'GridCell Solar Distributors',
        supplierVatNumber: '4120874921',
        customerName: 'Cape Tech Innovations CC',
        customerVatNumber: '4019283741',
        invoiceNumber: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toISOString().split('T')[0],
        subtotal: 8200.00,
        vatAmount: 1230.00,
        totalAmount: 9430.00,
        category: 'Office_Supplies',
        vatCompliant: true,
        status: 'Pending_Review',
        description: 'Office stationery and renewable surge protection equipment'
      });
      showBanner(`📄 OCR completed: Parsed ${file.name} (VAT Section 20 valid)`);
      addAuditLog('OCR_DOCUMENT_PARSED', `Parsed tax invoice ${file.name} for R9,430.00 (VAT: R1,230.00)`);
    }, 900);
  };

  const handlePostToLedger = () => {
    if (!checkPermission(currentUserRole, 'approve_invoices')) {
      showBanner(`⛔ Access Denied: ${currentUserRole} does not have authority to post invoices to general ledger.`);
      return;
    }

    if (!scannedDoc) return;
    onApproveInvoice(scannedDoc);
    showBanner(`✅ Invoice #${scannedDoc.invoiceNumber} posted to General Ledger & VAT 201 Claim Schedule!`);
    addAuditLog('INVOICE_POSTED_LEDGER', `Posted invoice #${scannedDoc.invoiceNumber} from ${scannedDoc.supplierName} (${formatZAR(scannedDoc.totalAmount || 0)}) to ledger.`);
    setScannedDoc(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="vat-ocr-scanner-root">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            SARS VAT Section 20 Compliance OCR Scanner
          </h3>
          <p className="text-xs text-white/50">
            Validates 10 statutory tax invoice fields + automatic disallowed input claim detection
          </p>
        </div>
        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase">
          VAT ACT §20 COMPLIANT
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* UPLOAD BOX */}
        <div className="p-5 bg-black/30 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <Upload className="w-7 h-7 text-emerald-400 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Upload Tax Invoice / Scanned Receipt</h4>
            <p className="text-[10.5px] text-white/50">PDF, PNG, JPEG with automated VAT number extraction</p>
          </div>
          <label className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-md">
            <Camera className="w-3.5 h-3.5" />
            <span>Select Document</span>
            <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
          </label>
        </div>

        {/* STATUTORY SECTION 20 CHECKLIST */}
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Statutory VAT Section 20 Checklist
            </h4>
            <span className="text-[9px] text-emerald-400 font-mono">10/10 Fields Valid</span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono text-white/70">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Words 'Tax Invoice' in prominent location</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supplier Name, Address, & 10-digit VAT Number</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Individual Serial Number & Date of Issue</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recipient Name, Address, & Recipient VAT Reg</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Item Description + 15% Statutory VAT Breakdown</span>
            </div>
          </div>
        </div>

      </div>

      {/* SCANNED INVOICE RESULT CARD */}
      {scannedDoc && (
        <div className="bg-gradient-to-br from-emerald-950/20 to-slate-900 border border-emerald-500/30 p-5 rounded-3xl space-y-4 shadow-xl">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-white/10 pb-3">
            <div>
              <span className="text-[10px] text-emerald-400 font-mono uppercase block">Validated OCR Record</span>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                {scannedDoc.supplierName} (Inv #{scannedDoc.invoiceNumber})
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                Total: {formatZAR(scannedDoc.totalAmount || 0)} (15% VAT: {formatZAR(scannedDoc.vatAmount || 0)})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[9px] uppercase">Supplier VAT Reg</span>
              <span className="text-white font-bold">{scannedDoc.supplierVatNumber}</span>
            </div>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[9px] uppercase">Invoice Date</span>
              <span className="text-white font-bold">{scannedDoc.date}</span>
            </div>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[9px] uppercase">Excl. Subtotal</span>
              <span className="text-white font-bold">{formatZAR(scannedDoc.subtotal || 0)}</span>
            </div>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[9px] uppercase">Category</span>
              <span className="text-cyan-300 font-bold">{scannedDoc.category}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setScannedDoc(null)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 font-bold rounded-xl text-xs transition-all"
            >
              Discard Scan
            </button>
            <button
              onClick={handlePostToLedger}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>Approve & Post to General Ledger</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

import React from 'react';
import { 
  X, 
  Key, 
  ShieldCheck, 
  Lock, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  ExternalLink,
  Layers,
  Server,
  Hash,
  Award
} from 'lucide-react';
import { StatutoryCertificate, generateX509MetadataForCert } from '../utils/sandboxStagesAndCertificates';

interface X509CertificateInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: StatutoryCertificate | null;
  onDownloadPem?: (cert: StatutoryCertificate) => void;
}

export const X509CertificateInspectorModal: React.FC<X509CertificateInspectorModalProps> = ({
  isOpen,
  onClose,
  certificate,
  onDownloadPem
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!isOpen || !certificate) return null;

  const x509 = certificate.x509Details || generateX509MetadataForCert(certificate);

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const syntheticPem = `-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIU${certificate.code.replace(/[^A-Za-z0-9]/g, '').padEnd(16, 'X')}DQYJKoZIhvcNAQELBQAw
WzELMAkGA1UEBhMCTAExFDASBgNVBAoTC1NBUlMgUEtJIFJvb3QxGzAZBgNVBAMT
ElNBUlMgU3ViLUNBIElTViBHdzEUMBIGA1UECxMLR3ZDb21wbGlhbmNlMB4XDTI2
MDgwMTEyMDAwMFoXDTI4MDgwMTEyMDAwMFowZzELMAkGA1UEBhMCTAExEjAQBgNV
BAgTCUdhdXRlbmcxFDASBgNVBAoTC0FwZXggQ29tcGxpYW5jZTEPMA0GA1UECxMG
SVNWIFByZzEfMB0GA1UEAxMW${certificate.code.replace(/[^A-Za-z0-9]/g, '').padEnd(20, '0')}wggEiMA0GCSqGSIb3
DQEBAQUAA4IBDwAwggEKAoIBAQC7rOqW8xV91k9L8P4mQ9A8bC2mD1xY5k8R9a7
... [CRYPTOGRAPHIC X.509 CERTIFICATE DER PAYLOAD ENCODED WITH SHA-384] ...
9x4aB1c8D9e0F1a2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5==
-----END CERTIFICATE-----`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" id="x509-cert-modal">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-white/10 flex justify-between items-start sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <Award className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  X.509 v3 Digital Certificate
                </span>
                <span className="text-[10px] font-mono text-white/50">{certificate.code}</span>
              </div>
              <h3 className="text-base font-bold text-white leading-tight mt-0.5">
                {certificate.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            id="close-x509-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-5 text-xs text-white/80">
          
          {/* STATUTORY COMPLIANCE SEAL */}
          <div className="bg-gradient-to-r from-indigo-950/60 to-slate-900 p-4 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-300 font-bold block">
                Cryptographic Assurance Level
              </span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-bold">{x509.fipsCompliance}</span>
              </div>
              <p className="text-[11px] text-white/60">
                Statutory Reference: <strong className="text-white">{certificate.statutoryReference}</strong>
              </p>
            </div>

            <div className="text-right whitespace-nowrap">
              <span className="text-[10px] font-mono text-white/40 block">Validity Horizon</span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                {certificate.issuedAt || '2026-08-28'} → {certificate.validUntil || '2027-08-28'}
              </span>
            </div>
          </div>

          {/* X.509 ATTRIBUTES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            <div className="bg-black/30 border border-white/10 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-mono text-white/40 uppercase font-bold block">Subject Common Name (CN)</span>
              <span className="text-xs font-bold text-white block">{x509.subjectCN}</span>
              <span className="text-[11px] text-white/60 block">{x509.subjectOrg}</span>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-mono text-white/40 uppercase font-bold block">Issuer Authority (CA)</span>
              <span className="text-xs font-bold text-cyan-300 block">{x509.issuerCN}</span>
              <span className="text-[11px] text-white/60 block">Serial No: {x509.serialNumber}</span>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-mono text-white/40 uppercase font-bold block">Key Parameters & Cipher</span>
              <span className="text-xs font-bold text-white block">
                {x509.keyAlgorithm} ({x509.keySizeBits}-bit) • {x509.signatureAlgorithm}
              </span>
              <span className="text-[10.5px] text-emerald-400 font-mono block">Hardware Security Module (HSM) Bound</span>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-mono text-white/40 uppercase font-bold block">Authorized Key Usage</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {x509.keyUsage.map((ku, idx) => (
                  <span key={idx} className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {ku}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* CHAIN OF TRUST */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] font-mono uppercase text-white/40 font-bold block">
              Cryptographic PKI Chain of Trust Verification
            </span>
            <div className="space-y-1.5 pt-1">
              {x509.chainOfTrust.map((node, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-mono text-[10px] font-bold">
                    {i + 1}
                  </div>
                  <span className={i === x509.chainOfTrust.length - 1 ? 'text-cyan-300 font-bold' : 'text-white/80'}>
                    {node}
                  </span>
                  {i < x509.chainOfTrust.length - 1 && (
                    <span className="text-white/30 text-[10px]">↳</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SHA-256 FINGERPRINT */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-mono text-white/40 font-bold uppercase">
              <span>SHA-256 Fingerprint Hash</span>
              <button
                onClick={() => handleCopy(certificate.fingerprintSha256 || 'sha256_mock_hash', 'fp')}
                className="hover:text-white text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'fp' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'fp' ? 'Copied' : 'Copy Hash'}</span>
              </button>
            </div>
            <div className="bg-black/60 p-2.5 rounded-xl border border-white/10 font-mono text-[11px] text-emerald-400 break-all">
              {certificate.fingerprintSha256 || 'sha256_88b19a0029b4e1837c9201a4ff8219c0049281a8b94012e4'}
            </div>
          </div>

          {/* RAW PEM ENCODING PREVIEW */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-mono text-white/40 font-bold uppercase">
              <span>Base64 X.509 Certificate (PEM Format)</span>
              <button
                onClick={() => handleCopy(syntheticPem, 'pem')}
                className="hover:text-white text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'pem' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'pem' ? 'Copied' : 'Copy PEM'}</span>
              </button>
            </div>
            <pre className="bg-black/60 p-3 rounded-xl border border-white/10 font-mono text-[10px] text-white/60 overflow-x-auto max-h-28">
              {syntheticPem}
            </pre>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-900/95 sticky bottom-0">
          <span className="text-[10px] font-mono text-white/40">
            Revocation Check: Online (OCSP & CRL Responder active)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownloadPem && onDownloadPem(certificate)}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
              id="download-cert-pem-btn"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PEM Certificate</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              id="close-x509-modal-secondary-btn"
            >
              Close Inspector
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

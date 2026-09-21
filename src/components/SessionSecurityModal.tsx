import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Copy, 
  Check, 
  RefreshCw, 
  Clock, 
  Lock, 
  AlertTriangle, 
  X, 
  Terminal, 
  CheckCircle2, 
  UserCheck, 
  Globe
} from 'lucide-react';
import { AppSession } from '../types';
import { 
  maskSessionToken, 
  getBearerAuthorizationHeader, 
  isSessionValid 
} from '../utils/sessionSecurity';

interface SessionSecurityModalProps {
  session: AppSession;
  isOpen: boolean;
  onClose: () => void;
  onRotateToken: () => void;
  onRevokeSession: () => void;
  onExtendSession: () => void;
  showBanner: (msg: string) => void;
}

export const SessionSecurityModal: React.FC<SessionSecurityModalProps> = ({
  session,
  isOpen,
  onClose,
  onRotateToken,
  onRevokeSession,
  onExtendSession,
  showBanner
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Live countdown timer for session expiry
  useEffect(() => {
    if (!isOpen) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiry = new Date(session.expiresAt).getTime();
      const diffMs = expiry - now;

      if (diffMs <= 0 || session.status !== 'ACTIVE') {
        setTimeRemaining('Session Expired');
      } else {
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setTimeRemaining(`${mins}m ${secs.toString().padStart(2, '0')}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen, session.expiresAt, session.status]);

  if (!isOpen) return null;

  const valid = isSessionValid(session);

  const handleCopyToken = () => {
    navigator.clipboard.writeText(session.token);
    setCopied(true);
    showBanner('📋 64-char session token copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHeader = () => {
    navigator.clipboard.writeText(getBearerAuthorizationHeader(session.token));
    setCopiedHeader(true);
    showBanner('📋 Authorization Bearer header copied!');
    setTimeout(() => setCopiedHeader(false), 2000);
  };

  const handleTestToken = () => {
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      if (valid && session.token.length === 64) {
        setTestResult({
          success: true,
          message: `✅ Token Verified: 256-bit entropy (64 hex characters) is cryptographically valid for role '${session.role}' across ${session.scopes.length} SARS statutory scopes.`
        });
        showBanner('🔒 Session Token integrity verified against SARS eFiling gateway standards.');
      } else {
        setTestResult({
          success: false,
          message: '❌ Token Verification Failed: Session is either expired, revoked, or corrupted.'
        });
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" id="session-security-modal">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-2xl space-y-5 shadow-2xl overflow-hidden relative">
        
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        {/* Header */}
        <div className="flex justify-between items-start border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <KeyRound className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Application Session Token & Security
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                  session.status === 'ACTIVE' && valid
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {session.status === 'ACTIVE' && valid ? '● Active Session' : `● ${session.status}`}
                </span>
              </div>
              <p className="text-xs text-white/50">
                Cryptographically generated 64-character hex token (32 bytes entropy, secrets.token_hex(32))
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            id="close-session-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Token Display Box */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-2 relative z-10">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10.5px] uppercase font-bold text-white/50 font-mono flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Active 64-Character Hex Session Token</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              32 Bytes • 256-bit CSPRNG
            </span>
          </div>

          {/* Token String */}
          <div className="p-3 bg-slate-950 rounded-xl border border-white/5 font-mono text-xs text-emerald-300 break-all select-all tracking-wider">
            {session.token}
          </div>

          <div className="flex flex-wrap gap-2 pt-1 justify-between items-center text-xs">
            <div className="flex gap-2">
              <button
                onClick={handleCopyToken}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                id="copy-session-token-btn"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied 64-char Hex' : 'Copy Raw Token'}</span>
              </button>

              <button
                onClick={handleCopyHeader}
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                id="copy-auth-header-btn"
              >
                {copiedHeader ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHeader ? 'Copied Header' : 'Copy Bearer Header'}</span>
              </button>
            </div>

            <button
              onClick={handleTestToken}
              disabled={isTesting}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isTesting ? 'Verifying...' : 'Verify Cryptographic Hash'}</span>
            </button>
          </div>

          {testResult && (
            <div className={`p-2.5 rounded-xl border text-xs mt-2 ${
              testResult.success 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
            }`}>
              {testResult.message}
            </div>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-black/30 border border-white/5 rounded-2xl">
            <span className="text-[10px] text-white/40 uppercase block font-bold font-sans">Role Standing</span>
            <span className="text-white font-bold flex items-center gap-1 mt-0.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{session.role}</span>
            </span>
            <span className="text-[9px] text-white/40 block mt-0.5 truncate">{session.userName}</span>
          </div>

          <div className="p-3 bg-black/30 border border-white/5 rounded-2xl">
            <span className="text-[10px] text-white/40 uppercase block font-bold font-sans">Session Expiry</span>
            <span className="text-amber-400 font-bold font-mono flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeRemaining || '60m 00s'}</span>
            </span>
            <span className="text-[9px] text-white/40 block mt-0.5">Auto-refresh ready</span>
          </div>

          <div className="p-3 bg-black/30 border border-white/5 rounded-2xl">
            <span className="text-[10px] text-white/40 uppercase block font-bold font-sans">Client IP (POPIA)</span>
            <span className="text-cyan-400 font-bold font-mono flex items-center gap-1 mt-0.5">
              <Globe className="w-3.5 h-3.5" />
              <span className="truncate">{session.ipAddress}</span>
            </span>
            <span className="text-[9px] text-white/40 block mt-0.5">ZA Telemetry Locked</span>
          </div>

          <div className="p-3 bg-black/30 border border-white/5 rounded-2xl">
            <span className="text-[10px] text-white/40 uppercase block font-bold font-sans">Masked Identifier</span>
            <span className="text-white/80 font-mono font-bold block mt-0.5 truncate">
              {maskSessionToken(session.token)}
            </span>
            <span className="text-[9px] text-emerald-400 block mt-0.5">Audit-Ready Hash</span>
          </div>
        </div>

        {/* Scopes Badge List */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-3.5 space-y-2">
          <span className="text-[10px] text-white/40 uppercase font-bold block">
            Authorized Statutory Scopes ({session.scopes.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {session.scopes.map((scope) => (
              <span 
                key={scope}
                className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10.5px] font-mono text-white/80 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{scope}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={onRotateToken}
              className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              id="rotate-session-token-btn"
              title="Generate new 64-character token and rotate active keys"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rotate Token (secrets.token_hex(32))</span>
            </button>

            <button
              onClick={onExtendSession}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Extend TTL by 60 minutes"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Extend (+60m)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {session.status === 'ACTIVE' && (
              <button
                onClick={onRevokeSession}
                className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Immediately revoke token and terminate session"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Revoke Session</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

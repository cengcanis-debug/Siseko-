import React, { useState } from 'react';
import { 
  Trophy, 
  Flame, 
  Shield, 
  CheckCircle, 
  Users, 
  Award, 
  Clock, 
  Target, 
  ChevronRight, 
  Sparkles, 
  Info,
  Zap,
  Check,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  FileCheck,
  ZapOff
} from 'lucide-react';
import { formatZAR } from '../utils/taxCalculations';

interface Badge {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  metric: string;
  xpValue: number;
  iconType: string;
}

interface Player {
  name: string;
  xp: number;
  level: string;
  isUser: boolean;
}

interface TaxGamificationPanelProps {
  currentXP: number;
  complianceScore: number;
  levelDetails: {
    currentLevel: string;
    levelNum: number;
    xpNeededForNext: number;
    xpInCurrentLevel: number;
    levelProgressPercentage: number;
  };
  badges: Badge[];
  leaderboard: Player[];
  userRank: number;
  onNavigateToTab: (tab: any) => void;
  onTriggerAction: (actionKey: string) => void;
  pendingInvoicesCount: number;
  ficaStatus: string;
  vatRegistered: boolean;
  hasLogbook: boolean;
}

export const TaxGamificationPanel: React.FC<TaxGamificationPanelProps> = ({
  currentXP,
  complianceScore,
  levelDetails,
  badges,
  leaderboard,
  userRank,
  onNavigateToTab,
  onTriggerAction,
  pendingInvoicesCount,
  ficaStatus,
  vatRegistered,
  hasLogbook
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [activeTab, setActiveTab] = useState<'badges' | 'quests'>('badges');

  // Derive compliance status label
  const getComplianceStatus = (score: number) => {
    if (score >= 90) return { label: 'Audit-Proof (Excellent)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 70) return { label: 'Compliant (Moderate)', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
    if (score >= 50) return { label: 'Vulnerable (Risk Gaps)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Non-Compliant (High Penalty Exposure)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  };

  const statusInfo = getComplianceStatus(complianceScore);

  const renderBadgeIcon = (iconType: string, unlocked: boolean) => {
    const baseClass = `w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
      unlocked 
        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse' 
        : 'bg-white/5 border-white/5 text-white/30'
    }`;

    switch (iconType) {
      case 'shield':
        return <div className={baseClass}><Shield className="w-4 h-4" /></div>;
      case 'ledger':
        return <div className={baseClass}><FileCheck className="w-4 h-4" /></div>;
      case 'travel':
        return <div className={baseClass}><Award className="w-4 h-4" /></div>;
      case 'vat':
        return <div className={baseClass}><Zap className="w-4 h-4" /></div>;
      case 'saving':
        return <div className={baseClass}><Trophy className="w-4 h-4" /></div>;
      case 'clock':
        return <div className={baseClass}><Clock className="w-4 h-4" /></div>;
      case 'target':
        return <div className={baseClass}><Target className="w-4 h-4" /></div>;
      default:
        return <div className={baseClass}><CheckCircle className="w-4 h-4" /></div>;
    }
  };

  return (
    <div className="glass-panel bg-gradient-to-br from-slate-950 to-slate-900/90 border border-white/10 rounded-3xl overflow-hidden transition-all duration-300">
      {/* HEADER SECTION */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 flex items-center justify-between cursor-pointer select-none border-b border-white/5 bg-black/20 hover:bg-black/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white font-display">
              Tax Compliance League
            </h3>
            <p className="text-[10px] text-white/40 font-mono">
              Level {levelDetails.levelNum} • {currentXP} XP • Rank #{userRank}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border font-mono ${statusInfo.color}`}>
            {complianceScore}% COMPLIANT
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="p-5 space-y-5 animate-fadeIn">
          {/* OVERALL COMPLIANCE SCORE PROGRESS BAR */}
          <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between items-baseline text-xs font-mono">
              <span className="text-white/60 flex items-center gap-1">
                Overall Compliance Status:
                <span className="text-[10px] font-sans font-bold text-emerald-300">({statusInfo.label})</span>
              </span>
              <span className="text-emerald-400 font-extrabold">{complianceScore}%</span>
            </div>

            <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-[1px] relative">
              <div 
                className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-700" 
                style={{ width: `${complianceScore}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[9px] text-white/30 font-mono">
              <span>0% Risk Area</span>
              <span>100% Audit-Proof</span>
            </div>
          </div>

          {/* LEVEL & XP PROGRESS BAR */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-xs font-mono">
              <span className="text-white/40 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Level {levelDetails.levelNum}: <strong className="text-white">{levelDetails.currentLevel}</strong>
              </span>
              <span className="text-amber-400 font-bold">
                {currentXP} <span className="text-white/20 text-[10px]">/ {levelDetails.xpNeededForNext} XP</span>
              </span>
            </div>

            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500" 
                style={{ width: `${levelDetails.levelProgressPercentage}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[9px] text-white/30 font-mono">
              <span>{levelDetails.currentLevel}</span>
              <span>{levelDetails.levelNum === 4 ? "Max Level" : `${100 - levelDetails.levelProgressPercentage}% to next level`}</span>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex border-b border-white/5 pb-1">
            <button
              onClick={() => setActiveTab('badges')}
              className={`flex-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeTab === 'badges' 
                  ? 'border-emerald-500 text-white' 
                  : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              Badges ({badges.filter(b => b.unlocked).length}/{badges.length})
            </button>
            <button
              onClick={() => setActiveTab('quests')}
              className={`flex-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                activeTab === 'quests' 
                  ? 'border-emerald-500 text-white' 
                  : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              XP Quests
            </button>
          </div>

          {/* TAB 1: BADGES GRID */}
          {activeTab === 'badges' && (
            <div className="grid grid-cols-4 gap-2.5">
              {badges.map((badge) => (
                <div 
                  key={badge.id}
                  className={`group relative p-2 rounded-xl border flex flex-col items-center text-center transition-all ${
                    badge.unlocked 
                      ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10' 
                      : 'bg-white/5 border-white/5 opacity-50 hover:opacity-80'
                  }`}
                  title={`${badge.title}: ${badge.description}`}
                >
                  {renderBadgeIcon(badge.iconType, badge.unlocked)}
                  <span className="text-[8px] font-bold text-white/80 mt-1.5 truncate max-w-full block">
                    {badge.title}
                  </span>
                  
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2.5 bg-slate-950 border border-white/10 rounded-xl text-left shadow-2xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50">
                    <p className="font-extrabold text-[10.5px] text-amber-400 flex justify-between items-center">
                      <span>{badge.title}</span>
                      <span className="text-[9px] text-emerald-400">+{badge.xpValue} XP</span>
                    </p>
                    <p className="text-[9.5px] text-white/70 leading-normal mt-1">{badge.description}</p>
                    <div className="border-t border-white/5 mt-1.5 pt-1 flex justify-between text-[8px] text-white/40 font-mono">
                      <span>Status:</span>
                      <span className={badge.unlocked ? 'text-emerald-400 font-bold' : 'text-amber-500'}>
                        {badge.metric}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: XP QUESTS CHECKLIST */}
          {activeTab === 'quests' && (
            <div className="space-y-2.5 text-xs">
              {/* Scan Invoice Quest */}
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-[11px] block">📷 Timely Invoice Scanning</span>
                  <span className="text-[10px] text-white/40 block">Scan vendor receipts & audit tax fields</span>
                </div>
                <div className="flex items-center gap-2">
                  {pendingInvoicesCount === 0 ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Done
                    </span>
                  ) : (
                    <>
                      <span className="text-[9px] text-emerald-400 font-mono font-bold">+150 XP</span>
                      <button 
                        onClick={() => onNavigateToTab('scanner')}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-white hover:text-slate-950 font-bold text-[10px] rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                      >
                        Scan
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Complete Profile Quest */}
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-[11px] block">👤 Complete Tax Profile</span>
                  <span className="text-[10px] text-white/40 block">Verify FICA status and details</span>
                </div>
                <div className="flex items-center gap-2">
                  {ficaStatus === 'Verified' ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Done
                    </span>
                  ) : (
                    <>
                      <span className="text-[9px] text-emerald-400 font-mono font-bold">+250 XP</span>
                      <button 
                        onClick={() => {
                          onNavigateToTab('welcome');
                          onTriggerAction('trigger_profile_edit');
                        }}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-white hover:text-slate-950 font-bold text-[10px] rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                      >
                        Verify
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Pay Provisional Tax Quest */}
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-[11px] block">💵 Pay Provisional Tax</span>
                  <span className="text-[10px] text-white/40 block">Calculate and submit safe-harbor IRP6</span>
                </div>
                <div className="flex items-center gap-2">
                  {badges.some(b => b.id === 'badge-timely-submissions' && b.unlocked) ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Done
                    </span>
                  ) : (
                    <>
                      <span className="text-[9px] text-emerald-400 font-mono font-bold">+350 XP</span>
                      <button 
                        onClick={() => {
                          onNavigateToTab('welcome');
                          onTriggerAction('trigger_irp6_pay');
                        }}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-white hover:text-slate-950 font-bold text-[10px] rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                      >
                        File
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Multi-User Role controls Quest */}
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-[11px] block">👑 Enforce Role Controls</span>
                  <span className="text-[10px] text-white/40 block">Simulate multi-user roles to verify S246 authority</span>
                </div>
                <div className="flex items-center gap-2">
                  {badges.some(b => b.id === 'badge-multi-user' && b.unlocked) ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Done
                    </span>
                  ) : (
                    <>
                      <span className="text-[9px] text-emerald-400 font-mono font-bold">+150 XP</span>
                      <button 
                        onClick={() => {
                          onNavigateToTab('advisor');
                          onTriggerAction('trigger_role_switching');
                        }}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-white hover:text-slate-950 font-bold text-[10px] rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                      >
                        Switch
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Decode ITA34 Notice Quest */}
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-[11px] block">📄 Decode SARS Assessment</span>
                  <span className="text-[10px] text-white/40 block">Audit ITA34 notice for disallowed travel expenses</span>
                </div>
                <div className="flex items-center gap-2">
                  {badges.some(b => b.id === 'badge-ita34-decoded' && b.unlocked) ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Done
                    </span>
                  ) : (
                    <>
                      <span className="text-[9px] text-emerald-400 font-mono font-bold">+250 XP</span>
                      <button 
                        onClick={() => {
                          onNavigateToTab('advisor');
                          onTriggerAction('trigger_ita34_decode');
                        }}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-white hover:text-slate-950 font-bold text-[10px] rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                      >
                        Decode
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Verify Vault Evidence Quest */}
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-[11px] block">🛡️ Verify Vault Evidence</span>
                  <span className="text-[10px] text-white/40 block">Validate travel logbook & purchase contract in vault</span>
                </div>
                <div className="flex items-center gap-2">
                  {badges.some(b => b.id === 'badge-vault-audit' && b.unlocked) ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Done
                    </span>
                  ) : (
                    <>
                      <span className="text-[9px] text-emerald-400 font-mono font-bold">+300 XP</span>
                      <button 
                        onClick={() => {
                          onNavigateToTab('advisor');
                          onTriggerAction('trigger_vault_verify');
                        }}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-white hover:text-slate-950 font-bold text-[10px] rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                      >
                        Verify
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Draft Rule 7 Objection Quest */}
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-[11px] block">⚖️ Draft Rule 7 Objection</span>
                  <span className="text-[10px] text-white/40 block">Compile formal ADR1 dispute with Section 11(a) citations</span>
                </div>
                <div className="flex items-center gap-2">
                  {badges.some(b => b.id === 'badge-rule7-objection' && b.unlocked) ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Done
                    </span>
                  ) : (
                    <>
                      <span className="text-[9px] text-emerald-400 font-mono font-bold">+400 XP</span>
                      <button 
                        onClick={() => {
                          onNavigateToTab('advisor');
                          onTriggerAction('trigger_rule7_draft');
                        }}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-white hover:text-slate-950 font-bold text-[10px] rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                      >
                        Draft
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* OPTIONAL LEADERBOARD SECTION */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider font-bold">
                🏆 SARS eFiling Compliance League
              </span>
              <button 
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 transition-all"
              >
                {showLeaderboard ? "HIDE LEAGUE" : "JOIN COMPETITIVE LEAGUE"}
              </button>
            </div>

            {showLeaderboard && (
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {leaderboard.map((player, idx) => (
                  <div 
                    key={player.name}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs border transition-all ${
                      player.isUser 
                        ? 'bg-emerald-500/10 border-emerald-500/30 shadow-md ring-1 ring-emerald-500/20' 
                        : 'bg-white/5 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${
                        idx === 0 ? 'bg-amber-500 text-slate-950' :
                        idx === 1 ? 'bg-slate-300 text-slate-950' :
                        idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-white/50'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`font-bold ${player.isUser ? 'text-emerald-300' : 'text-white/80'}`}>
                        {player.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <span className="text-[10px] text-white/40 font-mono">{player.level}</span>
                      <span className="font-mono text-emerald-400 font-bold">{player.xp} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

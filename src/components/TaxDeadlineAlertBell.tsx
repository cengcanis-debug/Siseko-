import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bell,
  CalendarClock,
  ChevronRight,
  Check,
  RotateCcw,
  AlertCircle,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { BusinessEntityWorkspace } from '../types';
import { getUpcomingTaxDeadlines, TaxDeadlineItem } from '../utils/taxDeadlines';

interface TaxDeadlineAlertBellProps {
  activeEntity: BusinessEntityWorkspace;
  pendingApprovalsCount: number;
  onNavigateTab: (tab: TaxDeadlineItem['targetTab']) => void;
  showBanner?: (message: string) => void;
  addAuditLog?: (action: string, details: string, severity?: 'info' | 'warning' | 'critical') => void;
}

const DISMISSED_STORAGE_KEY = 'zatax_dismissed_deadlines_v1';

export const TaxDeadlineAlertBell: React.FC<TaxDeadlineAlertBellProps> = ({
  activeEntity,
  pendingApprovalsCount,
  onNavigateTab,
  showBanner,
  addAuditLog
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'upcoming' | 'all'>('upcoming');
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(DISMISSED_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {
      // Ignore localStorage parse errors
    }
    return [];
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(dismissedIds));
      }
    } catch {
      // Ignore quota errors
    }
  }, [dismissedIds]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const allDeadlines = useMemo(
    () => getUpcomingTaxDeadlines(activeEntity, pendingApprovalsCount),
    [activeEntity, pendingApprovalsCount]
  );

  const activeUpcomingDeadlines = useMemo(
    () => allDeadlines.filter(item => item.daysRemaining <= 60 && !dismissedIds.includes(item.id)),
    [allDeadlines, dismissedIds]
  );

  const visibleDeadlines = useMemo(() => {
    const base = filterMode === 'upcoming'
      ? allDeadlines.filter(item => item.daysRemaining <= 60)
      : allDeadlines;
    return base.filter(item => !dismissedIds.includes(item.id));
  }, [allDeadlines, filterMode, dismissedIds]);

  const criticalCount = activeUpcomingDeadlines.filter(d => d.urgency === 'critical').length;
  const badgeCount = activeUpcomingDeadlines.length;
  const entityDismissedCount = allDeadlines.filter(d => dismissedIds.includes(d.id)).length;

  const handleSelectDeadline = (item: TaxDeadlineItem) => {
    setIsOpen(false);
    onNavigateTab(item.targetTab);
    showBanner?.(`Navigated to ${item.taxType} workspace: ${item.title} (${item.dueDateFormatted}).`);
    addAuditLog?.(
      'DEADLINE_ALERT_NAVIGATED',
      `Opened ${item.taxType} filing workspace for ${activeEntity.code} (${item.dueDateFormatted}).`,
      'info'
    );
  };

  const handleAcknowledge = (e: React.MouseEvent, item: TaxDeadlineItem) => {
    e.stopPropagation();
    setDismissedIds(prev => (prev.includes(item.id) ? prev : [...prev, item.id]));
    showBanner?.(`Acknowledged reminder: ${item.title}.`);
  };

  const handleResetDismissed = () => {
    const entityIds = new Set(allDeadlines.map(d => d.id));
    setDismissedIds(prev => prev.filter(id => !entityIds.has(id)));
    showBanner?.(`Restored all statutory deadline alerts for ${activeEntity.code}.`);
  };

  const getBadgeStyle = (urgency: TaxDeadlineItem['urgency']) => {
    if (urgency === 'critical') {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
    if (urgency === 'upcoming') {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
  };

  const getTypeStyle = (taxType: TaxDeadlineItem['taxType']) => {
    switch (taxType) {
      case 'VAT201':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'IRP6':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'EMP201':
      case 'EMP501':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'APPROVAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Upcoming tax deadline alerts (${badgeCount})`}
        title={`Upcoming SARS tax deadlines (${badgeCount} active within 60 days)`}
        id="header-tax-alerts-bell-btn"
        className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
          isOpen
            ? 'bg-amber-500/25 border-amber-400/60 text-amber-200 ring-1 ring-amber-400/30'
            : criticalCount > 0
            ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-200'
            : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
        }`}
      >
        <Bell className={`w-3.5 h-3.5 ${criticalCount > 0 ? 'text-rose-400' : 'text-amber-400'}`} />
        <span className="hidden sm:inline">Alerts</span>
        <span
          id="header-tax-alerts-count"
          className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-mono font-bold tabular-nums flex items-center justify-center ${
            badgeCount === 0
              ? 'bg-slate-700 text-slate-300'
              : criticalCount > 0
              ? 'bg-rose-500 text-white'
              : 'bg-amber-400 text-slate-950'
          }`}
        >
          {badgeCount}
        </span>
      </button>

      {isOpen && (
        <div
          id="tax-deadline-alerts-dropdown"
          className="absolute right-0 mt-2 w-[340px] sm:w-[400px] bg-[#0B1120] border border-white/15 rounded-2xl shadow-2xl shadow-black/70 z-50 overflow-hidden"
        >
          {/* Dropdown Header */}
          <div className="px-4 py-3 border-b border-white/10 bg-[#0E1629] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>SARS Filing Deadlines</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {activeEntity.code}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate max-w-[210px]">
                  {activeEntity.profile.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-900/90 border border-white/10 rounded-lg p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => setFilterMode('upcoming')}
                className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                  filterMode === 'upcoming'
                    ? 'bg-amber-500/20 text-amber-200'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ≤60d ({activeUpcomingDeadlines.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-cyan-500/20 text-cyan-200'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({allDeadlines.filter(d => !dismissedIds.includes(d.id)).length})
              </button>
            </div>
          </div>

          {/* Deadlines List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5">
            {visibleDeadlines.length === 0 ? (
              <div className="px-4 py-8 text-center space-y-2">
                <Clock className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-white">No active deadline alerts in this view</p>
                <p className="text-[11px] text-slate-400">
                  Switch to All cycles or restore acknowledged reminders below.
                </p>
              </div>
            ) : (
              visibleDeadlines.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleSelectDeadline(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectDeadline(item);
                    }
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-white/[0.04] transition cursor-pointer group flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${getTypeStyle(item.taxType)}`}>
                        {item.taxType}
                      </span>
                      <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${getBadgeStyle(item.urgency)}`}>
                        {item.daysRemaining === 0 ? 'Action Now' : `${item.daysRemaining}d left`}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.dueDateFormatted}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition flex items-center gap-1">
                      {item.urgency === 'critical' && (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span className="truncate">{item.title}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">
                      {item.description}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500">
                      {item.statutoryRef}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-2 shrink-0 pt-0.5">
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-300 transition" />
                    <button
                      type="button"
                      onClick={(e) => handleAcknowledge(e, item)}
                      title="Acknowledge & snooze reminder"
                      className="p-1 rounded-md bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 border border-white/10 transition cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="px-4 py-2.5 border-t border-white/10 bg-[#090D17] flex items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-cyan-400" />
              <span>Click any alert to open filing workspace</span>
            </span>
            {entityDismissedCount > 0 && (
              <button
                type="button"
                onClick={handleResetDismissed}
                className="text-cyan-300 hover:text-cyan-200 font-medium flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore ({entityDismissedCount})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

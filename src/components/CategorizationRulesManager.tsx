/**
 * @file CategorizationRulesManager.tsx
 * @description Categorization Rules Management Panel.
 * Allows taxpayers, accountants, and auditors to manually define, test, and save
 * recurring transaction patterns to override or complement the AI automated tagging engine.
 */

import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Download,
  Upload,
  Play,
  RotateCcw,
  Check,
  Tag,
  Info,
  Scale,
  Percent,
  Layers,
  FileCode,
  X
} from 'lucide-react';
import { CategorizationRule, RoleType } from '../types';
import { matchUserRule } from '../utils/automatedTaggingEngine';
import { downloadBlobFile, generateSubmissionRef } from '../utils/systemBridge';

interface CategorizationRulesManagerProps {
  rules: CategorizationRule[];
  setRules: React.Dispatch<React.SetStateAction<CategorizationRule[]>>;
  currentUserRole: RoleType;
  checkPermission: (action: string) => boolean;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  showBanner: (msg: string) => void;
}

const COMMON_SARS_CATEGORIES = [
  'Travel & Transport',
  'Computer & Office Equipment',
  'Telecommunications',
  'Medical Scheme',
  'Software & Cloud SaaS',
  'Consulting Fees',
  'Retirement Fund Contribution',
  'Office Stationery & Desks',
  'Professional Legal & Accounting',
  'Meals & Entertainment',
  'Advertising & Marketing',
  'Staff Training & Skills Development',
  'Rent & Workspace Utilities',
  'Bank & Merchant Charges',
  'Operating Expenses'
];

const COMMON_SARS_SECTIONS = [
  'Section 11(a) General Business Expense',
  'Section 11(e) / Section 12B Small Business Asset Allowance',
  'Section 6A Medical Scheme Fees Tax Credit',
  'Section 11F Retirement Funds Deduction',
  'Section 8(1)(b) Deemed Travel Allowance',
  'Section 11D Scientific Research & Development',
  'Gross Income (Section 1 definition)',
  'Section 12H Learnership Allowance',
  'Non-Deductible Entertainment (Section 23)'
];

export const CategorizationRulesManager: React.FC<CategorizationRulesManagerProps> = ({
  rules,
  setRules,
  currentUserRole,
  checkPermission,
  addAuditLog,
  showBanner
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  
  // Interactive Simulator State
  const [testDescription, setTestDescription] = useState('UBER TRIP TO JHB AIRPORT');
  const [testResult, setTestResult] = useState<CategorizationRule | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Form State
  const [ruleName, setRuleName] = useState('');
  const [pattern, setPattern] = useState('');
  const [matchType, setMatchType] = useState<'contains' | 'exact' | 'starts_with' | 'regex'>('contains');
  const [category, setCategory] = useState('Travel & Transport');
  const [customCategory, setCustomCategory] = useState('');
  const [sarsSection, setSarsSection] = useState('Section 11(a) General Business Expense');
  const [txType, setTxType] = useState<'expense' | 'income' | 'asset' | 'investment'>('expense');
  const [deductiblePct, setDeductiblePct] = useState<number>(100);
  const [priority, setPriority] = useState<number>(10);
  const [notes, setNotes] = useState('');

  // Run initial test
  const simulatedMatch = useMemo(() => {
    return matchUserRule(testDescription, rules);
  }, [testDescription, rules]);

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      const matchesSearch = 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = filterCategory === 'ALL' || r.category === filterCategory;

      return matchesSearch && matchesCategory;
    }).sort((a, b) => b.priority - a.priority);
  }, [rules, searchQuery, filterCategory]);

  // Reset form
  const resetForm = () => {
    setRuleName('');
    setPattern('');
    setMatchType('contains');
    setCategory('Travel & Transport');
    setCustomCategory('');
    setSarsSection('Section 11(a) General Business Expense');
    setTxType('expense');
    setDeductiblePct(100);
    setPriority(10);
    setNotes('');
    setEditingRuleId(null);
  };

  // Open modal for new rule
  const handleOpenCreateModal = () => {
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" cannot create categorization rules.`);
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal for editing rule
  const handleOpenEditModal = (rule: CategorizationRule) => {
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" cannot edit categorization rules.`);
      return;
    }
    setEditingRuleId(rule.id);
    setRuleName(rule.name);
    setPattern(rule.pattern);
    setMatchType(rule.matchType);
    if (COMMON_SARS_CATEGORIES.includes(rule.category)) {
      setCategory(rule.category);
      setCustomCategory('');
    } else {
      setCategory('CUSTOM');
      setCustomCategory(rule.category);
    }
    setSarsSection(rule.sarsSection || 'Section 11(a) General Business Expense');
    setTxType(rule.type || 'expense');
    setDeductiblePct(rule.deductiblePercentage ?? 100);
    setPriority(rule.priority);
    setNotes(rule.notes || '');
    setIsModalOpen(true);
  };

  // Save rule (Create or Update)
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" cannot save categorization rules.`);
      return;
    }

    if (!pattern.trim()) {
      showBanner('⚠️ Please specify a valid match pattern.');
      return;
    }

    const finalCategory = category === 'CUSTOM' ? (customCategory.trim() || 'General Expense') : category;

    if (editingRuleId) {
      // Update
      setRules(prev => prev.map(r => {
        if (r.id === editingRuleId) {
          return {
            ...r,
            name: ruleName.trim() || `Rule: ${pattern.trim()}`,
            pattern: pattern.trim(),
            matchType,
            category: finalCategory,
            sarsSection,
            type: txType,
            deductiblePercentage: deductiblePct,
            priority,
            notes: notes.trim()
          };
        }
        return r;
      }));

      addAuditLog('CATEGORIZATION_RULE_UPDATED', `Updated rule #${editingRuleId} ("${pattern}") -> ${finalCategory} (Priority ${priority}).`, 'info');
      showBanner(`✅ Updated categorization rule "${ruleName || pattern}"!`);
    } else {
      // Create
      const newRule: CategorizationRule = {
        id: `rule-${Date.now().toString(36)}`,
        name: ruleName.trim() || `Rule: ${pattern.trim()}`,
        pattern: pattern.trim(),
        matchType,
        category: finalCategory,
        sarsSection,
        type: txType,
        deductiblePercentage: deductiblePct,
        priority,
        enabled: true,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        matchCount: 0
      };

      setRules(prev => [newRule, ...prev]);
      addAuditLog('CATEGORIZATION_RULE_CREATED', `Created new recurring rule "${newRule.name}" (${matchType.toUpperCase()}: "${pattern}") -> ${finalCategory}.`, 'info');
      showBanner(`✨ Created new categorization rule "${newRule.name}"!`);
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Toggle rule enable/disable
  const handleToggleRule = (id: string) => {
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" cannot toggle categorization rules.`);
      return;
    }

    setRules(prev => prev.map(r => {
      if (r.id === id) {
        const nextState = !r.enabled;
        addAuditLog('CATEGORIZATION_RULE_TOGGLED', `${nextState ? 'Enabled' : 'Disabled'} rule "${r.name}" (${r.pattern}).`, 'info');
        showBanner(`${nextState ? '🟢 Enabled' : '⏸️ Paused'} rule "${r.name}".`);
        return { ...r, enabled: nextState };
      }
      return r;
    }));
  };

  // Delete rule
  const handleDeleteRule = (id: string, name: string) => {
    if (!checkPermission('canDeleteTransactions') && !checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" cannot delete categorization rules. Requires Owner or Accountant.`);
      return;
    }

    setRules(prev => prev.filter(r => r.id !== id));
    addAuditLog('CATEGORIZATION_RULE_DELETED', `Deleted categorization rule #${id} ("${name}").`, 'warn');
    showBanner(`🗑️ Deleted rule "${name}".`);
  };

  // Export rules to JSON
  const handleExportRules = () => {
    if (!checkPermission('canDownloadLedger')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" is not authorized to export rule configurations.`);
      return;
    }

    const ref = generateSubmissionRef('SARS-RULES');
    const content = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      reference: ref,
      rulesCount: rules.length,
      rules
    }, null, 2);

    downloadBlobFile(`SARS_Categorization_Rules_${ref}.json`, content, 'application/json;charset=utf-8;');
    addAuditLog('CATEGORIZATION_RULES_EXPORTED', `Exported ${rules.length} categorization rules backup (${ref}).`, 'info');
    showBanner(`📥 Exported ${rules.length} categorization rules!`);
  };

  // Load South African Standard SME Presets
  const handleLoadPresets = () => {
    if (!checkPermission('canEditTransactions')) {
      showBanner(`⛔ Access Denied: Role "${currentUserRole}" cannot modify categorization rules.`);
      return;
    }

    const defaultPresets: CategorizationRule[] = [
      {
        id: `preset-uber-${Date.now()}`,
        name: 'Uber Transport Apportionment',
        pattern: 'UBER',
        matchType: 'contains',
        category: 'Travel & Transport',
        sarsSection: 'Section 11(a) Travel Expense',
        type: 'expense',
        deductiblePercentage: 100,
        priority: 15,
        enabled: true,
        notes: 'Direct client travel with contemporaneous logbook corroboration.',
        createdAt: new Date().toISOString(),
        matchCount: 0
      },
      {
        id: `preset-fuel-${Date.now() + 1}`,
        name: 'Service Station Fuel (Sasol / Shell / Engen)',
        pattern: 'SASOL',
        matchType: 'contains',
        category: 'Travel & Transport',
        sarsSection: 'Section 8(1)(b) Deemed Travel Allowance',
        type: 'expense',
        deductiblePercentage: 100,
        priority: 14,
        enabled: true,
        notes: 'Business travel fuel claims.',
        createdAt: new Date().toISOString(),
        matchCount: 0
      },
      {
        id: `preset-cloud-${Date.now() + 2}`,
        name: 'Cloud Computing Infrastructure (AWS)',
        pattern: 'AWS',
        matchType: 'contains',
        category: 'Software & Cloud SaaS',
        sarsSection: 'Section 11(a) General Business Expense',
        type: 'expense',
        deductiblePercentage: 100,
        priority: 12,
        enabled: true,
        notes: 'Production server hosting.',
        createdAt: new Date().toISOString(),
        matchCount: 0
      },
      {
        id: `preset-telco-${Date.now() + 3}`,
        name: 'Vodacom Business Telecommunications',
        pattern: 'VODACOM',
        matchType: 'contains',
        category: 'Telecommunications',
        sarsSection: 'Section 11(a) General Business Expense',
        type: 'expense',
        deductiblePercentage: 80,
        priority: 11,
        enabled: true,
        notes: 'Apportioned 80% business use under IN47.',
        createdAt: new Date().toISOString(),
        matchCount: 0
      }
    ];

    setRules(prev => {
      const existingPatterns = new Set(prev.map(p => p.pattern.toUpperCase()));
      const newToAdd = defaultPresets.filter(dp => !existingPatterns.has(dp.pattern.toUpperCase()));
      return [...newToAdd, ...prev];
    });

    addAuditLog('CATEGORIZATION_PRESETS_LOADED', 'Loaded standard South African business recurring rules templates.', 'info');
    showBanner('✨ Standard South African SME recurring rules loaded!');
  };

  return (
    <div className="space-y-6" id="categorization-rules-manager-panel">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Sliders className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Categorization Rules & Pattern Overrides
              </h2>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                TAA §29 Compliant
              </span>
            </div>
            <p className="text-xs text-white/60 max-w-2xl leading-relaxed">
              Define deterministic recurring transaction patterns (e.g., <code className="text-indigo-300 bg-white/5 px-1 py-0.5 rounded">UBER &rarr; Travel</code>). 
              User rules take priority over the AI automated tagging engine to guarantee consistent statutory classifications.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleLoadPresets}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Load standard South African SME recurring pattern templates"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load SME Presets</span>
            </button>

            <button
              onClick={handleExportRules}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Export all categorization rules to JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Rules</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/25"
              id="create-new-rule-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Rule</span>
            </button>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
          <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] text-white/40 block font-mono">ACTIVE RULES</span>
            <span className="text-lg font-bold text-white">{rules.filter(r => r.enabled).length} / {rules.length}</span>
          </div>

          <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] text-white/40 block font-mono">TOTAL MATCHES LOGGED</span>
            <span className="text-lg font-bold text-indigo-400 font-mono">
              {rules.reduce((acc, curr) => acc + (curr.matchCount || 0), 0)}
            </span>
          </div>

          <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] text-white/40 block font-mono">PRECEDENCE HIERARCHY</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>User Rules Overrides AI</span>
            </span>
          </div>

          <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] text-white/40 block font-mono">RBAC ACCESS GUARD</span>
            <span className="text-xs font-mono font-bold text-slate-300 mt-1 block">
              {currentUserRole === 'Owner' || currentUserRole === 'Accountant' ? 'Authorized Editor' : 'Read-Only Viewer'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE RULE SIMULATOR */}
      <div className="bg-[#0D1527] border border-white/10 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Interactive Pattern Tester & Rule Simulator
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            Real-Time Evaluation
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={testDescription}
              onChange={(e) => setTestDescription(e.target.value)}
              placeholder="Enter prospective merchant string (e.g., UBER TRIP, VODACOM FIBRE, AMAZON AWS)..."
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition font-mono"
            />
          </div>

          <div className="sm:w-auto flex items-center">
            {simulatedMatch ? (
              <div className="bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 text-emerald-300 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Matches <strong>"{simulatedMatch.name}"</strong> &rarr; <span className="font-bold underline">{simulatedMatch.category}</span> ({simulatedMatch.sarsSection})
                </span>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 text-slate-400 font-mono">
                <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>No user rule matched. Falls back to AI historical keyword engine.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. RULES LIST & FILTER BAR */}
      <div className="bg-[#0D1527] border border-white/10 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Configured Categorization Rules ({filteredRules.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <div className="relative flex-1 md:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rule or pattern..."
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {COMMON_SARS_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* RULES GRID / LIST */}
        {filteredRules.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Sliders className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-mono">No categorization rules match your current filter.</p>
            <button
              onClick={handleOpenCreateModal}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition cursor-pointer"
            >
              Create New Rule
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  rule.enabled 
                    ? 'bg-slate-950/60 border-white/10 hover:border-indigo-500/30' 
                    : 'bg-black/40 border-white/5 opacity-60'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white text-sm">{rule.name}</span>
                    
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                      {rule.matchType.toUpperCase()}: "{rule.pattern}"
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                      Priority {rule.priority}
                    </span>

                    <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded uppercase ${
                      rule.type === 'income' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {rule.type || 'expense'} ({rule.deductiblePercentage ?? 100}%)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-indigo-400 font-semibold flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>{rule.category}</span>
                    </span>
                    <span className="text-slate-500">&bull;</span>
                    <span className="text-slate-400 text-[11px] font-mono">{rule.sarsSection}</span>
                    {rule.matchCount !== undefined && rule.matchCount > 0 && (
                      <>
                        <span className="text-slate-500">&bull;</span>
                        <span className="text-slate-400 text-[11px] font-mono">{rule.matchCount} matches logged</span>
                      </>
                    )}
                  </div>

                  {rule.notes && (
                    <p className="text-[11px] text-slate-400 italic leading-relaxed">{rule.notes}</p>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      rule.enabled 
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25' 
                        : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                    }`}
                    title={rule.enabled ? 'Pause rule' : 'Enable rule'}
                  >
                    {rule.enabled ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5" />
                        <span>Paused</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(rule)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
                    title="Edit rule parameters"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteRule(rule.id, rule.name)}
                    className="p-2 text-rose-400/70 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition cursor-pointer"
                    title="Delete rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. CREATE / EDIT RULE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn" id="rule-manager-modal">
          <div className="bg-[#0D1527] border border-indigo-500/30 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* MODAL HEADER */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingRuleId ? 'Edit Categorization Rule' : 'Create Recurring Categorization Rule'}
                  </h3>
                  <p className="text-xs text-white/50">Configure pattern matching, target category, and SARS section</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSaveRule} className="p-5 overflow-y-auto space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Rule Name</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g., Uber Sandton Travel Apportionment"
                  required
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Pattern / Keyword</label>
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="e.g., UBER, DISCOVERY, AWS"
                    required
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Match Type</label>
                  <select
                    value={matchType}
                    onChange={(e) => setMatchType(e.target.value as any)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="contains">Contains (Default)</option>
                    <option value="exact">Exact Match</option>
                    <option value="starts_with">Starts With</option>
                    <option value="regex">Regular Expression (Regex)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Target Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {COMMON_SARS_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="CUSTOM">Custom Category...</option>
                  </select>
                </div>

                {category === 'CUSTOM' && (
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Custom Category Name</label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g., Renewable Energy Maintenance"
                      required
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Transaction Type</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="expense">Operating Expense</option>
                    <option value="income">Gross Income</option>
                    <option value="asset">Capital Asset (Write-Off)</option>
                    <option value="investment">Retirement / Investment</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Applicable SARS Section</label>
                <select
                  value={sarsSection}
                  onChange={(e) => setSarsSection(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {COMMON_SARS_SECTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold flex justify-between">
                    <span>Deductible Apportionment</span>
                    <span className="font-mono text-cyan-300">{deductiblePct}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={deductiblePct}
                    onChange={(e) => setDeductiblePct(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <button type="button" onClick={() => setDeductiblePct(0)} className="hover:text-white">0% (Personal)</button>
                    <button type="button" onClick={() => setDeductiblePct(50)} className="hover:text-white">50%</button>
                    <button type="button" onClick={() => setDeductiblePct(80)} className="hover:text-white">80% (IN47)</button>
                    <button type="button" onClick={() => setDeductiblePct(100)} className="hover:text-white">100% (Full)</button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Priority (1 - 100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500">Higher priority rules take precedence over lower priority rules.</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Notes & Justification</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional compliance remarks (e.g., verified business travel, Section 11(a) invoice receipts on file)..."
                  rows={2}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* MODAL FOOTER */}
              <div className="pt-3 border-t border-white/10 flex justify-end items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition cursor-pointer shadow-lg shadow-indigo-600/25 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingRuleId ? 'Update Rule' : 'Save Rule'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
};

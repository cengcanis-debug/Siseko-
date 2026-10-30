import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  HelpCircle,
  ArrowRight,
  BookOpen,
  Scale,
  ShieldCheck,
  FileText,
  DollarSign,
  Car,
  Receipt,
  Building2,
  Users,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Zap,
  Clock,
  Mic,
  AlertCircle
} from 'lucide-react';
import { UserTaxProfile, RoleType, ChatMessage, TaxTopicPrompt, AppToolRecommendation } from '../types';
import { formatZAR } from '../utils/taxCalculations';
import { downloadBlobFile } from '../utils/systemBridge';

interface SarsAiTaxAssistantProps {
  profile: UserTaxProfile;
  currentUserRole: RoleType;
  showBanner: (msg: string) => void;
  addAuditLog: (action: string, details: string, severity?: 'info' | 'warn' | 'crit') => void;
  onNavigateTab: (tabKey: string) => void;
  liveGrossIncome?: number;
  liveDeductions?: number;
  liveNetLiability?: number;
}

const PRESET_TOPIC_PROMPTS: TaxTopicPrompt[] = [
  {
    id: 'sec81b_travel',
    title: 'Business Travel & Logbook (§8(1)(b))',
    category: 'DEDUCTIONS',
    prompt: 'How do I legally claim business travel deductions under Section 8(1)(b) and avoid SARS writing back Source Code 4015 to R0?',
    statutoryRef: 'Income Tax Act 58/1962 s 8(1)(b)'
  },
  {
    id: 'emp501_recon',
    title: 'Interim EMP501 Recon (Period 202608)',
    category: 'PAYROLL',
    prompt: 'How do I submit the interim 6-month EMP501 Employer Reconciliation for period 202608 and achieve zero-variance balancing?',
    statutoryRef: 'Fourth Schedule Par 14(3)'
  },
  {
    id: 'rule7_objection',
    title: 'Rule 7 TAA Legal Objection (ADR1)',
    category: 'DISPUTES',
    prompt: 'How do I formulate a legally compliant Rule 7 objection on Form ADR1 within the statutory 80-business-day window?',
    statutoryRef: 'Tax Administration Act 28/2011 s 104'
  },
  {
    id: 'sec12ba_solar',
    title: '125% Commercial Solar (§12BA)',
    category: 'DEDUCTIONS',
    prompt: 'What equipment qualifies under the Section 12BA 125% commercial solar deduction, and what audit documents must be kept in the vault?',
    statutoryRef: 'Income Tax Act 58/1962 s 12BA'
  },
  {
    id: 'sec12e_sbc',
    title: 'SBC Progressive Tax Relief (§12E)',
    category: 'COMPLIANCE',
    prompt: 'Does my business qualify as a Small Business Corporation (SBC) under Section 12E, and what are the progressive tax brackets for 2026?',
    statutoryRef: 'Income Tax Act 58/1962 s 12E'
  },
  {
    id: 'two_pot_tax',
    title: 'Two-Pot Retirement Withdrawals',
    category: 'DEDUCTIONS',
    prompt: 'How are savings pot withdrawals taxed under the 1 September 2024 Two-Pot retirement system, and can SARS withhold tax arrears?',
    statutoryRef: 'Revenue Laws Amendment Act 12/2024'
  },
  {
    id: 'vat201_apportionment',
    title: 'VAT201 & Apportionment (§17(1))',
    category: 'VAT',
    prompt: 'How does Section 17(1) input tax apportionment work for mixed supplies, and what are the mandatory Section 20 tax invoice requirements?',
    statutoryRef: 'VAT Act 89/1991 s 17(1)'
  },
  {
    id: 'app_tools_guide',
    title: 'How to Use App Tools Effectively',
    category: 'TOOLS',
    prompt: 'Give me an executive guide to all tools in this tax compliance app and how they work together seamlessly.',
    statutoryRef: 'ZAtax Compliance Companion Architecture'
  }
];

const INITIAL_GREETING: ChatMessage = {
  id: 'msg-welcome',
  sender: 'assistant',
  text: `### 🇿🇦 SARS AI Tax Compliance Assistant
Sawubona / Goeie Dag! I am your AI tax compliance co-pilot, trained on South African tax legislation (**Income Tax Act 58/1962**, **VAT Act 89/1991**, **Tax Administration Act 28/2011**), SARS practice notes, and all features of this application.

**How I can assist your business today**:
- **Statutory Deductions**: Section 11(a) General Deduction, Section 12BA 125% Solar write-offs, Section 12E SBC progressive rates, Section 11D 150% R&D super-deduction.
- **Employer Filing**: Interim 6-month EMP501 reconciliation (Period 202608), PRN zero-variance validation, and Section 7 ETI youth incentive verification.
- **SARS Disputes & Objections**: Citing precise **Facts & Law** for Rule 7 objections (Form ADR1) against travel claim writebacks (**Source Code 4015**) within 80 business days.
- **VAT & Invoicing**: Section 17(1) turnover apportionment and 10-point Section 20 tax invoice criteria.
- **Application Navigation**: Directing you to the exact tool or calculator for your task.

Ask any question below, or select a statutory topic chip to begin!`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  suggestedQuestions: [
    "How do I submit the interim EMP501 reconciliation for period 202608?",
    "How do I claim business travel under §8(1)(b) without audit penalties?",
    "What qualifies under Section 12BA 125% solar deduction?"
  ],
  recommendedAppTools: [
    { id: 'emp501_reconciliation', label: 'Interim EMP501 Recon', description: 'Reconcile 6-month PAYE, SDL, UIF and ETI returns', tabKey: 'emp501_reconciliation' },
    { id: 'overview', label: 'Cockpit Dashboard', description: 'Review your live compliance health and gross income', tabKey: 'overview' },
    { id: 'ai_deductions', label: 'AI Deductions Advisor', description: 'Discover legal tax write-offs across all statutory sections', tabKey: 'ai_deductions' }
  ],
  statutoryReferences: [
    "Income Tax Act 58 of 1962",
    "Tax Administration Act 28 of 2011",
    "Value-Added Tax Act 89 of 1991"
  ],
  modelUsed: 'gemini-3.8-flash'
};

export const SarsAiTaxAssistant: React.FC<SarsAiTaxAssistantProps> = ({
  profile,
  currentUserRole,
  showBanner,
  addAuditLog,
  onNavigateTab,
  liveGrossIncome = 650000,
  liveDeductions = 4500,
  liveNetLiability = 121475
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isSpeechSpeaking, setIsSpeechSpeaking] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSendMessage = async (userText: string) => {
    const textToSend = userText.trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/tax-assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          history: messages.slice(-6).map(m => ({ sender: m.sender, text: m.text })),
          profile: {
            name: profile.name,
            entityType: profile.entityType,
            vatRegistered: profile.vatRegistered,
            vatNumber: profile.vatNumber,
            sarsTaxNumber: profile.sarsTaxNumber,
            grossIncome: liveGrossIncome,
            totalDeductions: liveDeductions,
            netTaxLiability: liveNetLiability,
            taxBracketRate: profile.taxBracketRate || 0.27,
            currentUserRole
          }
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to receive AI tax response');
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: data.suggestedQuestions || [],
        recommendedAppTools: data.recommendedAppTools || [],
        statutoryReferences: data.statutoryReferences || [],
        modelUsed: data.modelUsed || 'gemini-3.8-flash'
      };

      setMessages(prev => [...prev, assistantMsg]);
      addAuditLog('AI_TAX_QUERY_EXECUTED', `Queried SARS AI Assistant: "${textToSend.substring(0, 50)}..."`);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: `### ⚠️ Connection Notice\nCould not query the live model (${err.message}). Utilizing the local South African tax rules engine:\n\nFor statutory queries, please review the **Tax Literacy Hub** or consult an accredited practitioner in **Tax Professional Connect**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: [
          "How do I claim business travel under §8(1)(b)?",
          "What qualifies under Section 12BA 125% solar deduction?",
          "How to submit interim EMP501 for period 202608?"
        ],
        recommendedAppTools: [
          { id: 'overview', label: 'Compliance Cockpit', description: 'Review your live financial health', tabKey: 'overview' },
          { id: 'tax_pro_connect', label: 'Tax Professional Connect', description: 'Consult with an accredited practitioner', tabKey: 'tax_pro_connect' }
        ],
        modelUsed: 'local-statutory-fallback'
      };
      setMessages(prev => [...prev, errorMsg]);
      showBanner(`⚠️ AI Assistant Fallback: ${err.message}`);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    showBanner('📋 Copied AI response to clipboard');
    setTimeout(() => setCopiedMessageId(null), 2500);
  };

  const handleToggleSpeak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showBanner('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeechSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeechSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/-\s/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText.substring(0, 600));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeechSpeaking(false);
    utterance.onerror = () => setIsSpeechSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeechSpeaking(true);
    showBanner('🔊 Reading tax advice aloud...');
  };

  const handleExportTranscript = () => {
    const transcript = [
      '=========================================================================',
      'REPUBLIC OF SOUTH AFRICA - TAX COMPLIANCE ADVISOR',
      'AI STATUTORY ADVISORY CHAT TRANSCRIPT',
      '=========================================================================',
      `TAXPAYER LEGAL ENTITY : ${profile.name}`,
      `ENTITY CLASSIFICATION : ${profile.entityType}`,
      `SARS TAX NUMBER       : ${profile.sarsTaxNumber || '9304318273'}`,
      `VAT REGISTRATION      : ${profile.vatRegistered ? profile.vatNumber : 'Not Registered'}`,
      `EXPORT TIMESTAMP      : ${new Date().toISOString()}`,
      `CONSULTED ROLE        : ${currentUserRole}`,
      '=========================================================================',
      '',
      ...messages.map(m => 
        `[${m.timestamp}] ${m.sender === 'user' ? 'TAXPAYER' : 'SARS AI ADVISOR'} (${m.modelUsed || 'model'}):\n${m.text}\n`
      ),
      '=========================================================================',
      'DISCLAIMER: Generated by ZAtax AI Assistant. Complies with TAA Section 240.',
      '========================================================================='
    ].join('\n');

    downloadBlobFile(
      `SARS_AI_Tax_Transcript_${Date.now()}.txt`,
      transcript,
      'text/plain;charset=utf-8;'
    );
    addAuditLog('AI_CHAT_TRANSCRIPT_EXPORTED', 'Downloaded AI tax consultation transcript dossier.');
    showBanner('📥 Exported AI Tax Advisory transcript!');
  };

  const handleClearChat = () => {
    setMessages([INITIAL_GREETING]);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeechSpeaking(false);
    showBanner('Chat history refreshed.');
  };

  const filteredTopics = selectedCategory === 'ALL'
    ? PRESET_TOPIC_PROMPTS
    : PRESET_TOPIC_PROMPTS.filter(t => t.category === selectedCategory);

  return (
    <div className="space-y-6 animate-fadeIn" id="sars-ai-tax-assistant">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-[#0E131F] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-600/30 text-cyan-300 border border-cyan-500/30 shrink-0">
                <Bot className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight truncate">
                SARS AI Tax Assistant
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>gemini-3.8-flash</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Statutory Counsel Online</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-3xl">
              Natural language South African tax intelligence trained on the Income Tax Act 58/1962, VAT Act 89/1991, 
              Tax Administration Act 28/2011, SARS interpretation notes, and app navigation.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportTranscript}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Download full chat transcript dossier"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Dossier</span>
            </button>
            <button
              onClick={handleClearChat}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Clear chat history and reset conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Live Taxpayer Context Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[11px] font-mono">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-0.5">
            <span className="text-slate-500 block">Entity Type</span>
            <span className="text-white font-bold truncate block">{profile.entityType}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-0.5">
            <span className="text-slate-500 block">Gross Income</span>
            <span className="text-emerald-400 font-bold block">{formatZAR(liveGrossIncome)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-0.5">
            <span className="text-slate-500 block">Estimated Tax Due</span>
            <span className="text-cyan-300 font-bold block">{formatZAR(liveNetLiability)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-0.5">
            <span className="text-slate-500 block">VAT Status</span>
            <span className="text-purple-300 font-bold truncate block">
              {profile.vatRegistered ? `Vendor (15%)` : `Not Registered`}
            </span>
          </div>
        </div>
      </div>

      {/* 2. STATUTORY TOPIC PROMPT CHIPS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Statutory Quick-Start Prompts & Legal Clauses
            </h3>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin text-[10px] font-medium">
            {['ALL', 'DEDUCTIONS', 'PAYROLL', 'DISPUTES', 'VAT', 'COMPLIANCE', 'TOOLS'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {filteredTopics.map(topic => (
            <button
              key={topic.id}
              onClick={() => handleSendMessage(topic.prompt)}
              disabled={isLoading}
              className="p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 text-left transition group cursor-pointer space-y-1.5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono font-bold text-cyan-400 px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/20">
                  {topic.category}
                </span>
                <span className="text-[9px] font-mono text-slate-500 truncate max-w-[120px]">
                  {topic.statutoryRef}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-200 group-hover:text-white line-clamp-1">
                {topic.title}
              </h4>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {topic.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 3. INTERACTIVE CHAT STREAM */}
      <div className="bg-[#0B101D] border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
        
        {/* Messages List Container */}
        <div className="space-y-4 max-h-[600px] min-h-[380px] overflow-y-auto scrollbar-thin pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Assistant Icon */}
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/30 to-indigo-600/30 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-300 shadow">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 space-y-3 ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-cyan-600 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow'
                }`}
              >
                {/* Bubble Header */}
                <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 pb-1 border-b border-white/5">
                  <span className="font-bold flex items-center gap-1 text-slate-300">
                    {msg.sender === 'user' ? (
                      <>
                        <User className="w-3 h-3" />
                        <span>You ({currentUserRole})</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3 text-cyan-400" />
                        <span>SARS AI Specialist</span>
                        {msg.modelUsed && (
                          <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                            {msg.modelUsed}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Body Content with Markdown Formatting */}
                <div className="prose prose-invert prose-xs max-w-none text-xs leading-relaxed space-y-2 whitespace-pre-line font-sans">
                  {msg.text}
                </div>

                {/* Statutory Citations Pills */}
                {msg.statutoryReferences && msg.statutoryReferences.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 block font-semibold">
                      Statutory Citations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.statutoryReferences.map((ref, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"
                        >
                          <Scale className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>{ref}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended App Tools Action Cards */}
                {msg.recommendedAppTools && msg.recommendedAppTools.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <span className="text-[10px] font-semibold text-cyan-300 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>Recommended Application Tools for This Task:</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.recommendedAppTools.map((tool) => (
                        <div
                          key={tool.id}
                          className="p-2.5 rounded-xl bg-black/40 border border-slate-700 hover:border-cyan-500/50 flex items-center justify-between gap-2 transition"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-white text-[11px] block truncate">
                              {tool.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {tool.description}
                            </span>
                          </div>
                          <button
                            onClick={() => onNavigateTab(tool.tabKey)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1 transition shrink-0 cursor-pointer shadow"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up Suggested Questions */}
                {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 block">
                      Suggested Next Inquiries:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          disabled={isLoading}
                          className="px-2.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 text-cyan-200 border border-white/10 hover:border-cyan-400/40 text-left transition cursor-pointer flex items-center gap-1"
                        >
                          <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bubble Action Bar for Assistant Messages */}
                {msg.sender === 'assistant' && (
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className="hover:text-white flex items-center gap-1 cursor-pointer transition"
                        title="Copy text"
                      >
                        {copiedMessageId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 text-[10px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleSpeak(msg.text)}
                        className="hover:text-white flex items-center gap-1 cursor-pointer transition"
                        title="Read aloud"
                      >
                        {isSpeechSpeaking ? (
                          <>
                            <VolumeX className="w-3 h-3 text-amber-400" />
                            <span className="text-amber-400 text-[10px]">Stop Audio</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px]">Read Aloud</span>
                          </>
                        )}
                      </button>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500">
                      TAA §240 Verified
                    </span>
                  </div>
                )}
              </div>

              {/* User Icon */}
              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-300 shadow">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 text-xs justify-start animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-300 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing South African Tax Legislation & Precedents...</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 4. CHAT INPUT BAR */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="pt-3 border-t border-white/5 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything about SARS deductions, objections, EMP501 recon, VAT201, or app tools..."
              disabled={isLoading}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shrink-0 ${
              inputText.trim() && !isLoading
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-950/40'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <span>Ask AI</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
          <span>Powered by Google Gemini 3.8 Flash • South Africa Tax Act No. 58 of 1962</span>
          <span>Encrypted Session • POPIA §19 Protected</span>
        </div>

      </div>

    </div>
  );
};

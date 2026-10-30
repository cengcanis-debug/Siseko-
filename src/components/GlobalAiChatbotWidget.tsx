import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  ArrowRight,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Scale
} from 'lucide-react';
import { UserTaxProfile, RoleType, ChatMessage } from '../types';

interface GlobalAiChatbotWidgetProps {
  profile: UserTaxProfile;
  currentUserRole: RoleType;
  onNavigateTab: (tabKey: string) => void;
  showBanner: (msg: string) => void;
  liveGrossIncome?: number;
  liveNetLiability?: number;
}

export const GlobalAiChatbotWidget: React.FC<GlobalAiChatbotWidgetProps> = ({
  profile,
  currentUserRole,
  onNavigateTab,
  showBanner,
  liveGrossIncome = 650000,
  liveNetLiability = 121475
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'widget-welcome',
      sender: 'assistant',
      text: `Hello! I am your SARS AI Tax Assistant. Need quick help with Section 11(a) deductions, Rule 7 objections, EMP501 interim reconciliation, or navigating the app? Ask me anything!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedQuestions: [
        "How do I claim business travel under §8(1)(b)?",
        "How to submit interim EMP501 for period 202608?",
        "What qualifies under Section 12BA 125% solar?"
      ],
      recommendedAppTools: [
        { id: 'emp501_reconciliation', label: 'Interim EMP501 Recon', description: 'Reconcile 6-month PAYE returns', tabKey: 'emp501_reconciliation' }
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (text: string) => {
    const q = text.trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
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
          question: q,
          history: messages.slice(-4).map(m => ({ sender: m.sender, text: m.text })),
          profile: {
            name: profile.name,
            entityType: profile.entityType,
            vatRegistered: profile.vatRegistered,
            vatNumber: profile.vatNumber,
            grossIncome: liveGrossIncome,
            netTaxLiability: liveNetLiability,
            currentUserRole
          }
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to query assistant');
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'No answer available.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: data.suggestedQuestions || [],
        recommendedAppTools: data.recommendedAppTools || [],
        statutoryReferences: data.statutoryReferences || [],
        modelUsed: data.modelUsed || 'gemini-3.8-flash'
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: `Consulting local statutory rules engine: Please use the full SARS AI Tax Assistant tab or consult an accredited Section 240 tax practitioner.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: [
          "How do I claim business travel under §8(1)(b)?",
          "What qualifies under Section 12BA 125% solar deduction?"
        ],
        recommendedAppTools: [
          { id: 'tax_pro_connect', label: 'Tax Professional Connect', description: 'Consult with registered tax practitioner', tabKey: 'tax_pro_connect' }
        ]
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showBanner('📋 Copied AI advice to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40" id="global-ai-chatbot-widget">
      
      {/* 1. EXPANDED CHAT PANEL */}
      {isOpen && (
        <div className="mb-3 w-[92vw] sm:w-[420px] max-h-[85vh] h-[550px] bg-[#0A0E1A] border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
          
          {/* Header */}
          <div className="px-4 py-3 bg-[#0E1527] border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                <Bot className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h4 className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                  <span>SARS AI Assistant</span>
                  <span className="text-[9px] font-mono px-1 rounded bg-cyan-500/30 text-cyan-200">gemini-3.8-flash</span>
                </h4>
                <p className="text-[10px] text-slate-400 truncate">
                  Trained on SA Tax Acts & App Features
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onNavigateTab('ai_assistant')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition cursor-pointer"
                title="Expand to Full Page Tab"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                title="Minimize Widget"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 space-y-2 ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed text-[11px]">
                    {m.text}
                  </p>

                  {/* App Tool Link */}
                  {m.recommendedAppTools && m.recommendedAppTools.length > 0 && (
                    <div className="pt-1.5 border-t border-white/5 space-y-1">
                      {m.recommendedAppTools.map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => {
                            onNavigateTab(tool.tabKey);
                            setIsOpen(false);
                          }}
                          className="w-full text-left p-1.5 rounded-lg bg-black/40 border border-slate-700 hover:border-cyan-500/50 flex items-center justify-between text-[10px] text-cyan-300 hover:text-white transition cursor-pointer"
                        >
                          <span className="truncate">{tool.label}</span>
                          <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick question chips */}
                  {m.suggestedQuestions && m.suggestedQuestions.length > 0 && (
                    <div className="pt-1 border-t border-white/5 flex flex-wrap gap-1">
                      {m.suggestedQuestions.slice(0, 2).map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(q)}
                          disabled={isLoading}
                          className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[10px] text-left truncate max-w-full transition cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {m.sender === 'assistant' && (
                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
                      <button
                        onClick={() => handleCopy(m.id, m.text)}
                        className="hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === m.id ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                        <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                      </button>
                      <span>{m.timestamp}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-center text-xs text-cyan-400 font-mono p-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>SARS AI analyzing statutory rules...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputText);
            }}
            className="p-2.5 bg-[#0E1527] border-t border-white/10 flex items-center gap-1.5 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about SARS deductions, objections, EMP501..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
                inputText.trim() && !isLoading
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

      {/* 2. FLOATING TRIGGER BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group px-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-2xl shadow-cyan-900/50 hover:shadow-cyan-500/40 transition-all transform hover:-translate-y-0.5 cursor-pointer border border-cyan-400/40 ring-2 ring-cyan-500/20"
          title="Open SARS AI Tax Compliance Assistant"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
          </span>
          <Bot className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition" />
          <span>SARS AI Assistant</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-cyan-200 border border-white/20">
            §Ask Tax Law
          </span>
        </button>
      )}

    </div>
  );
};

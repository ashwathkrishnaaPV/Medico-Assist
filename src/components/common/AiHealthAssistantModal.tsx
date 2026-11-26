import React, { useState } from 'react';
import { Bot, Send, X, Sparkles, ShieldAlert, Cpu, HelpCircle } from 'lucide-react';
import { aiService, AiResponse } from '../../services/aiService';

interface AiHealthAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion?: string;
  contextHint?: string;
}

interface MessageEntry {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  source?: 'LLM' | 'DETERMINISTIC_FALLBACK';
  model?: string;
  disclaimer?: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'What is considered a normal blood pressure reading?',
  'How is BMI calculated and what are its limits?',
  'When should a student visit the clinic for a fever?',
  'What is normal SpO2 oxygen saturation level?',
  'Quick energy, nut-free study snacks for college'
];

export const AiHealthAssistantModal: React.FC<AiHealthAssistantModalProps> = ({
  isOpen,
  onClose,
  initialQuestion = '',
  contextHint = ''
}) => {
  const [inputQuery, setInputQuery] = useState(initialQuestion);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<MessageEntry[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content:
        'Hello! I am your **MedicoAssist AI Health & Wellness Assistant**.\n\nI can explain medical terminology, provide evidence-based health education, and suggest balanced meal ideas. I am strictly non-diagnostic—for real symptoms, our campus medical team is here for you!',
      source: 'DETERMINISTIC_FALLBACK',
      model: 'CampusHealth-Safety-Assistant',
      disclaimer:
        'Educational and informational support only. Not a substitute for professional medical care, diagnosis, or clinical advice.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText !== undefined ? queryText : inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMsg: MessageEntry = {
      id: `usr_${crypto.randomUUID()}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const resp: AiResponse = await aiService.askHealthAssistant(textToSend, contextHint);
      const botMsg: MessageEntry = {
        id: `bot_${crypto.randomUUID()}`,
        sender: 'assistant',
        content: resp.text,
        source: resp.source,
        model: resp.model,
        disclaimer: resp.disclaimer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errMsg: MessageEntry = {
        id: `err_${crypto.randomUUID()}`,
        sender: 'assistant',
        content:
          'Unable to reach the assistant service at this moment. Please reach out to the campus clinic directly for immediate healthcare queries.',
        source: 'DETERMINISTIC_FALLBACK',
        model: 'Offline-Fallback',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-blue-50/50 via-white to-indigo-50/50 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Campus Health AI Assistant
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI v2.4
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evidence-informed health terminology &amp; educational wellness assistant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Non-Diagnostic Notice:</strong> Informational support only. For emergency or
            acute conditions, visit the campus medical centre or emergency department immediately.
          </span>
        </div>

        {/* Conversation Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed font-normal">
                  {m.content}
                </div>

                {m.source && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-blue-500" />
                      Source: {m.source === 'LLM' ? 'LLM (OpenAI Compatible)' : 'Deterministic Safety Engine'}
                    </span>
                    {m.model && <span className="opacity-75">Model: {m.model}</span>}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs py-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span className="italic">Assistant is processing evidence-based response…</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="shrink-0 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <HelpCircle className="w-3 h-3 text-blue-500" /> Suggestions:
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full text-[11px] bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about vitals, lab terms, nutrition, or general healthcare education..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>
      </div>
    </div>
  );
};

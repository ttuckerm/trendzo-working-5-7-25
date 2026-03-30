'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Sparkles, Mic } from 'lucide-react';
import PulseDot from './PulseDot';

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  'Who needs attention this week?',
  'Give me a content strategy for my top creator',
  'What trends should we jump on?',
  'Draft a client performance report',
];

export default function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const handleSend = useCallback(async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isLoading) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };
    setMessages((prev) => [...prev, userMsg]);

    // TODO: Wire up to Vercel AI SDK
    setIsLoading(false);
  }, [input, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[420px] flex flex-col bg-[#0a0a10] border-l border-[#1e1e2e] shadow-2xl animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7b2ff7] to-[#e63946] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-label uppercase tracking-[0.15em] text-[#00d4ff]">
                Trendzo Engine
              </span>
              <PulseDot color="#00d4ff" size="sm" />
            </div>
            <p className="text-xs text-[#7a7889] font-body">
              Your agency intelligence co-pilot
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a7889] hover:text-[#e8e6e3] hover:bg-[#1a1a28] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 opacity-60">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7b2ff7]/20 to-[#e63946]/20 border border-[#7b2ff7]/20 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-[#00d4ff]" />
            </div>
            <p className="text-sm text-[#e8e6e3]/50 font-body mb-1">
              Ask me anything about your creators, content performance, or strategy.
            </p>
            <p className="text-xs font-mono-label text-[#4a4858]">
              I can see your live dashboard data.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'user' ? (
              <div
                className="max-w-[85%] px-4 py-3 text-sm font-body leading-relaxed text-white"
                style={{
                  background: 'linear-gradient(135deg, #7b2ff7, #e63946)',
                  borderRadius: '18px 4px 18px 18px',
                }}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            ) : (
              <div className="max-w-[85%] bg-[#151520] border border-[#1e1e2e] rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-mono-label uppercase tracking-[0.15em] text-[#00d4ff]">
                    Trendzo Engine
                  </span>
                  <PulseDot color="#00d4ff" size="sm" />
                </div>
                <div className="text-sm font-body leading-relaxed text-[#e8e6e3]/85 whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#151520] border border-[#1e1e2e] rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] font-mono-label uppercase tracking-[0.15em] text-[#00d4ff]">
                  Trendzo Engine
                </span>
                <PulseDot color="#00d4ff" size="sm" />
              </div>
              <div className="flex items-center gap-2 text-[#7a7889]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs font-body">Analyzing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      {messages.length === 0 && !isLoading && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="px-3 py-1.5 text-[11px] font-body rounded-lg bg-[#151520] border border-[#1e1e2e] text-[#7a7889] hover:text-[#e8e6e3] hover:border-[#2a2a3e] transition-all duration-200"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-[#1e1e2e]">
        <div className="flex items-end gap-2 bg-[#151520] border border-[#2a2a3e] rounded-xl px-3 py-2 focus-within:border-[#7b2ff7]/50 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your creators, metrics..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#e8e6e3]/90 font-body placeholder:text-[#4a4858] resize-none outline-none max-h-[120px]"
            style={{
              height: 'auto',
              minHeight: '24px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />

          {/* Voice button */}
          <button className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[#4a4858] hover:text-[#7a7889] transition-colors">
            <Mic className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: input.trim()
                ? 'linear-gradient(135deg, #7b2ff7, #e63946)'
                : '#1a1a28',
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] font-mono-label text-[#4a4858] mt-2 text-center tracking-[0.06em]">
          Powered by Trendzo Engine &middot; Sees your live dashboard data
        </p>
      </div>
    </div>
  );
}

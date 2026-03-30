'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Sparkles } from 'lucide-react';

interface TrendzoChatPanelProps {
  open: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function TrendzoChatPanel({ open, onClose }: TrendzoChatPanelProps) {
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

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
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
    <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[420px] flex flex-col bg-[#0f0f16] border-l border-[#1e1e2e] shadow-2xl animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7b2ff7] to-[#e63946] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span
              className="text-[10px] uppercase tracking-[0.15em] text-[#00d4ff]"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Trendzo Engine
            </span>
            <p className="text-xs text-white/40" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Your agency intelligence co-pilot
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 opacity-60">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7b2ff7]/20 to-[#e63946]/20 border border-[#7b2ff7]/20 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-[#00d4ff]" />
            </div>
            <p
              className="text-sm text-white/50 mb-1"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Ask me anything about your creators, content performance, or strategy.
            </p>
            <p
              className="text-xs text-white/25"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              I can see your live dashboard data.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-[#7b2ff7] to-[#e63946] text-white'
                  : 'bg-[#151520] border border-[#1e1e2e] text-white/85'
              }`}
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {msg.role === 'assistant' && (
                <span
                  className="block text-[9px] uppercase tracking-[0.15em] text-[#00d4ff] mb-1.5"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  Trendzo Engine
                </span>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#151520] border border-[#1e1e2e] rounded-xl px-4 py-3">
              <span
                className="block text-[9px] uppercase tracking-[0.15em] text-[#00d4ff] mb-1.5"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                Trendzo Engine
              </span>
              <div className="flex items-center gap-2 text-white/40">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Thinking...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

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
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/25 resize-none outline-none max-h-[120px]"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              height: 'auto',
              minHeight: '24px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-r from-[#7b2ff7] to-[#e63946] flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p
          className="text-[10px] text-white/20 mt-2 text-center"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          Powered by Trendzo Engine &middot; Sees your live dashboard data
        </p>
      </div>
    </div>
  );
}

'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  useJsonRenderMessage,
  Renderer,
  StateProvider,
  ActionProvider,
  VisibilityProvider,
  ValidationProvider,
} from '@json-render/react';
import { registry } from '@/lib/trendzo-registry';

class RenderErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-400/60 text-xs font-mono p-2 border border-red-400/20 rounded-lg">
          Component render failed
        </div>
      );
    }
    return this.props.children;
  }
}

function ChatMessage({ message }: { message: UIMessage }) {
  const { spec, text, hasSpec } = useJsonRenderMessage(
    message.parts as Parameters<typeof useJsonRenderMessage>[0]
  );

  const isUser = message.role === 'user';

  // For user messages, extract text from parts
  const userText = isUser
    ? message.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('')
    : '';

  return (
    <div className={`mb-6 ${isUser ? 'flex justify-end' : ''}`}>
      {isUser ? (
        <div className="max-w-[70%] px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-rose-600 text-white font-sans">
          {userText || text}
        </div>
      ) : (
        <div className="w-full">
          {text && (
            <div className="mb-4 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <p className="text-gray-300 font-sans leading-relaxed">{text}</p>
            </div>
          )}
          {hasSpec && spec && (
            <div className="mt-4 ml-9">
              <RenderErrorBoundary>
                <Renderer spec={spec} registry={registry} />
              </RenderErrorBoundary>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const suggestions = [
  'Show me the morning brief',
  'How are my creators performing?',
  'Who needs attention this week?',
  'Compare my top creators side by side',
];

interface AgencyClientProps {
  initialState: Record<string, unknown>;
}

export default function AgencyClient({ initialState }: AgencyClientProps) {
  const [chatError, setChatError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/agency-chat' }) as any, []);
  const { messages, sendMessage, status } = useChat({
    transport,
    onError: (err) => {
      console.error('[agency-chat] Error:', err);
      // Try to extract detail from response body
      const msg = err.message || 'Something went wrong';
      setChatError(msg);
    },
  } as Parameters<typeof useChat>[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'streaming' || status === 'submitted';
  const [hasSentFirst, setHasSentFirst] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    if (!hasSentFirst) setHasSentFirst(true);
    setChatError(null);
    sendMessage({ text: inputValue });
    setInputValue('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setHasSentFirst(true);
    setChatError(null);
    sendMessage({ text: suggestion });
  };

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  const sendAsUser = useCallback((text: string) => {
    setHasSentFirst(true);
    setChatError(null);
    sendMessageRef.current({ text });
  }, []);

  const actionHandlers = useMemo(() => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analyze_creator: (params: any) => {
      const name = params?.creatorName || params?.name || params?.label || 'my creators';
      sendAsUser(`Give me a deep analysis of ${name}`);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generate_brief: (params: any) => {
      const name = params?.creatorName || params?.name || params?.label || 'my top creator';
      const topic = params?.topic ? ` about ${params.topic}` : '';
      sendAsUser(`Generate a content brief for ${name}${topic}`);
    },
    refresh_data: () => {
      window.location.reload();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export_report: (_params: any) => {
      console.log('[agency] Export requested:', _params);
      alert('Export coming soon');
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate_creator: (params: any) => {
      const id = params?.creatorId || params?.id || params?.label || '';
      sendAsUser(`Show me everything about ${id}'s profile`);
    },
  }), [sendAsUser]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.action) return;
      const h = actionHandlers[detail.action as keyof typeof actionHandlers];
      if (h) {
        h(detail);
      }
    };
    window.addEventListener('trendzo-action', handler);
    return () => window.removeEventListener('trendzo-action', handler);
  }, [actionHandlers]);

  return (
    <StateProvider initialState={initialState}>
      <VisibilityProvider>
        <ActionProvider handlers={actionHandlers}>
          <ValidationProvider customFunctions={{}}>
            <div className="min-h-screen bg-[#08080d] flex flex-col">
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2e]">
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl text-white tracking-tight">TRENDZO</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-mono text-green-400 uppercase tracking-wider">
                      Engine Active
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono text-gray-600">INTELLIGENT CLAY v1</span>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-6 py-8 max-w-5xl mx-auto w-full">
                {!hasSentFirst && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
                    <h1 className="font-display text-4xl text-white mb-3">What do you need?</h1>
                    <p className="text-gray-500 font-sans mb-10">
                      Your agency command center responds to you.
                    </p>
                    <div className="grid grid-cols-2 gap-3 max-w-lg">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSuggestionClick(s)}
                          className="px-4 py-3 rounded-xl border border-[#1e1e2e] bg-[#0f0f16] text-gray-400 text-sm font-sans hover:border-violet-500/50 hover:text-white transition-all text-left"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm mb-4">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Trendzo is thinking...
                  </div>
                )}

                {chatError && (
                  <div className="mb-4 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-mono">
                    {chatError}
                    <button
                      onClick={() => setChatError(null)}
                      className="ml-3 text-red-500 hover:text-red-300"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="px-6 py-4 border-t border-[#1e1e2e]">
                <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
                  <div className="relative group">
                    <input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Tell me what you need..."
                      disabled={isLoading}
                      className="w-full px-5 py-4 rounded-2xl bg-[#0f0f16] border border-[#1e1e2e] text-white font-sans placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !inputValue.trim()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-rose-600 text-white text-sm font-sans disabled:opacity-30 hover:opacity-90 transition-opacity"
                    >
                      {isLoading ? '...' : 'Send'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ValidationProvider>
        </ActionProvider>
      </VisibilityProvider>
    </StateProvider>
  );
}

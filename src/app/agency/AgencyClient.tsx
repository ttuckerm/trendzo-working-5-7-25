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
import EngineOrb from './components/EngineOrb';
import VoiceMicButton from './components/VoiceMicButton';
import {
  saveConversation,
  loadActiveConversation,
  startNewSession,
  type StoredMessage,
  type StoredMessagePart,
  type ConversationSession,
} from '@/lib/sessions/conversation-store';

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

const AUTO_GREETING = 'Good morning. Brief me on what needs my attention.';

const postAlertSuggestions = [
  'Deep dive on the flagged creator',
  'Generate briefs for upcoming events',
  'Show me the full calendar',
  'Compare my creators',
];

const defaultSuggestions = [
  'Show me my creators',
  "What's on the calendar?",
  'How are we performing?',
  'Any upcoming events?',
];

interface AgencyClientProps {
  initialState: Record<string, unknown>;
  userId: string;
  agencyId: string;
}

export default function AgencyClient({ initialState, userId, agencyId }: AgencyClientProps) {
  const [chatError, setChatError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [restoredSession, setRestoredSession] = useState<ConversationSession | null>(null);
  const [showRestoredToast, setShowRestoredToast] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/agency-chat' }) as any, []);
  const { messages, sendMessage, setMessages, status } = useChat({
    transport,
    onError: (err) => {
      console.error('[agency-chat] Error:', err);
      const msg = err.message || 'Something went wrong';
      setChatError(msg);
    },
  } as Parameters<typeof useChat>[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'streaming' || status === 'submitted';
  const [hasSentFirst, setHasSentFirst] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isInterimText, setIsInterimText] = useState(false);
  const [autoBriefing, setAutoBriefing] = useState(false);

  const orbState = useMemo<'idle' | 'thinking' | 'streaming' | 'error'>(() => {
    if (chatError) return 'error';
    if (isLoading) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'assistant' && lastMessage.parts?.some(
        (p) => p.type === 'text' && (p as { type: 'text'; text: string }).text.length > 0
      )) {
        return 'streaming';
      }
      return 'thinking';
    }
    return 'idle';
  }, [isLoading, chatError, messages]);

  // Session restoration on mount
  const autoGreetFired = useRef(false);
  const sessionInitialized = useRef(false);

  const fireAutoGreeting = useCallback(() => {
    if (autoGreetFired.current) return;
    autoGreetFired.current = true;
    setAutoBriefing(true);
    sendMessage({ text: AUTO_GREETING });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sessionInitialized.current) return;
    sessionInitialized.current = true;

    async function initSession() {
      setIsRestoringSession(true);

      // If no userId/agencyId, skip session restore but still fire auto-greeting
      if (!userId || !agencyId) {
        setIsRestoringSession(false);
        setTimeout(fireAutoGreeting, 800);
        return;
      }

      try {
        const active = await loadActiveConversation(userId, agencyId);

        if (active && active.messages.length > 0) {
          // Restore the previous session with full parts (including json-render specs)
          setSessionId(active.id);
          setRestoredSession(active);

          const restored = active.messages.map((m, i) => ({
            id: `restored-${i}`,
            role: m.role as 'user' | 'assistant',
            parts: m.parts && m.parts.length > 0
              ? m.parts
              : [{ type: 'text' as const, text: m.content }],
          })) as UIMessage[];
          setMessages(restored);
          setHasSentFirst(true);
          setIsRestoringSession(false);
        } else {
          // No active session — start fresh with auto-greeting
          setIsRestoringSession(false);
          setTimeout(fireAutoGreeting, 800);
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
        setIsRestoringSession(false);
        // Still fire auto-greeting on error so the page isn't blank
        setTimeout(fireAutoGreeting, 800);
      }
    }

    initSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear autoBriefing state when AI finishes responding
  useEffect(() => {
    if (autoBriefing && !isLoading && messages.length > 1) {
      setAutoBriefing(false);
    }
  }, [autoBriefing, isLoading, messages.length]);

  // Save conversation after each message exchange (debounced)
  useEffect(() => {
    if (isRestoringSession) return;
    if (messages.length === 0) return;
    if (!userId || !agencyId) return;

    const timer = setTimeout(() => {
      const storedMessages: StoredMessage[] = messages.map(m => {
        // Extract text for title generation / backwards compat
        const textContent = m.parts
          ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map(p => p.text)
          .join('') || '';

        // Serialize full parts array to preserve json-render specs
        const serializedParts: StoredMessagePart[] = (m.parts || []).map(p => {
          const part: StoredMessagePart = { type: p.type };
          if ('text' in p && p.text) part.text = p.text as string;
          if ('data' in p && p.data !== undefined) part.data = (p as { data: unknown }).data;
          return part;
        });

        return {
          role: m.role as 'user' | 'assistant' | 'system',
          content: textContent,
          parts: serializedParts,
          timestamp: new Date().toISOString(),
        };
      });
      saveConversation(sessionId, agencyId, userId, storedMessages);
    }, 1000);

    return () => clearTimeout(timer);
  }, [messages, sessionId, isRestoringSession, userId, agencyId]);

  // Show restored toast briefly
  useEffect(() => {
    if (restoredSession && !isRestoringSession) {
      setShowRestoredToast(true);
      const timer = setTimeout(() => setShowRestoredToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [restoredSession, isRestoringSession]);

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

  const handleVoiceTranscript = useCallback((text: string) => {
    setIsInterimText(false);
    setIsVoiceListening(false);
    if (!text.trim() || isLoading) return;
    setInputValue('');
    if (!hasSentFirst) setHasSentFirst(true);
    setChatError(null);
    sendMessage({ text });
  }, [isLoading, hasSentFirst, sendMessage]);

  const handleVoiceInterim = useCallback((text: string) => {
    setIsVoiceListening(true);
    setIsInterimText(true);
    setInputValue(text);
  }, []);

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

  const handleNewSession = useCallback(async () => {
    if (userId && agencyId) {
      await startNewSession(userId, agencyId);
    }
    const newId = crypto.randomUUID();
    setSessionId(newId);
    setRestoredSession(null);
    setMessages([]);
    setHasSentFirst(false);
    setChatError(null);
    autoGreetFired.current = false;
    setTimeout(fireAutoGreeting, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, agencyId, fireAutoGreeting]);

  if (isRestoringSession) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#08080d] gap-4">
        <EngineOrb state="thinking" size={48} />
        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
          Restoring your session...
        </span>
      </div>
    );
  }

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
                    <EngineOrb state={orbState} />
                    <span className="text-xs font-mono text-green-400 uppercase tracking-wider">
                      Engine Active
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleNewSession}
                    className="px-3 py-1.5 rounded-lg border border-[#1e1e2e] bg-transparent text-gray-500 text-[11px] font-mono uppercase tracking-wider hover:border-[#3f3f5e] hover:text-gray-200 transition-all"
                  >
                    + New Session
                  </button>
                  <span className="text-xs font-mono text-gray-600">INTELLIGENT CLAY v1</span>
                </div>
              </div>

              {/* Session restored toast */}
              {showRestoredToast && restoredSession && (
                <div className="fixed top-[60px] left-1/2 -translate-x-1/2 z-50 bg-[#0f0f16] border border-[#1e1e2e] rounded-lg px-4 py-2 text-xs font-sans text-gray-500 flex items-center gap-2">
                  <span className="text-[#2dd4a8]">●</span>
                  Session restored from {new Date(restoredSession.updated_at).toLocaleString()}
                </div>
              )}

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-6 py-8 max-w-5xl mx-auto w-full">
                {!hasSentFirst && messages.length === 0 && !autoBriefing && (
                  <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
                    <h1 className="font-display text-4xl text-white mb-3">What do you need?</h1>
                    <p className="text-gray-500 font-sans mb-10">
                      Your agency command center responds to you.
                    </p>
                    <div className="grid grid-cols-2 gap-3 max-w-lg">
                      {defaultSuggestions.map((s) => (
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

                {/* Show post-alert suggestions after auto-briefing completes */}
                {!hasSentFirst && !autoBriefing && !isLoading && messages.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto mt-4 mb-6">
                    {postAlertSuggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestionClick(s)}
                        className="px-4 py-3 rounded-xl border border-[#1e1e2e] bg-[#0f0f16] text-gray-400 text-sm font-sans hover:border-violet-500/50 hover:text-white transition-all text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((msg) => {
                  // Hide the auto-greeting from the chat
                  if (msg.role === 'user') {
                    const msgText = msg.parts
                      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                      .map((p) => p.text)
                      .join('');
                    if (msgText === AUTO_GREETING) return null;
                  }
                  return <ChatMessage key={msg.id} message={msg} />;
                })}

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
                  <div className="flex items-center gap-3">
                    <VoiceMicButton
                      onTranscript={handleVoiceTranscript}
                      onInterimTranscript={handleVoiceInterim}
                      disabled={isLoading}
                    />
                    <div className="relative flex-1">
                      <input
                        value={inputValue}
                        onChange={(e) => {
                          setIsInterimText(false);
                          setInputValue(e.target.value);
                        }}
                        placeholder={autoBriefing ? 'Scanning for updates...' : 'Tell me what you need...'}
                        disabled={isLoading}
                        style={isVoiceListening ? { borderLeft: '3px solid #e63946' } : undefined}
                        className={`w-full px-5 py-4 rounded-2xl bg-[#0f0f16] border border-[#1e1e2e] text-white font-sans placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all disabled:opacity-50 ${isInterimText ? 'italic text-gray-400' : ''}`}
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim() || isInterimText}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-rose-600 text-white text-sm font-sans disabled:opacity-30 hover:opacity-90 transition-opacity"
                      >
                        {isLoading ? '...' : 'Send'}
                      </button>
                    </div>
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

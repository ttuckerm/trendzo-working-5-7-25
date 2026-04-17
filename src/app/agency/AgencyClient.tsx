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
import { useSupabaseAuth } from '@/lib/supabase/auth-context';
import { useRouter } from 'next/navigation';
import AgencyDashboardHeader from '@/components/agency/AgencyDashboardHeader';
import EngineOrb from './components/EngineOrb';
import VoiceMicButton from './components/VoiceMicButton';
import { getComponentsForIntent, ClayComponentRenderer, ComponentType } from '@/lib/clay';
import {
  saveConversation,
  loadActiveConversation,
  startNewSession,
  type StoredMessage,
  type StoredMessagePart,
  type ConversationSession,
} from '@/lib/sessions/conversation-store';
import type { ActionConfirmationData } from '@/components/clay/ActionConfirmationCard';
import { UniversalSkeleton } from '@/components/clay/UniversalSkeleton';

// ── Neumorphic Design System ──────────────────────────────────────────
const NEU = {
  bg: '#1c1c24',
  raised: '-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6)',
  raisedSm: '-3px -3px 8px rgba(255,255,255,0.05), 3px 3px 8px rgba(0,0,0,0.5)',
  raisedLg: '-6px -6px 14px rgba(255,255,255,0.05), 6px 6px 14px rgba(0,0,0,0.65)',
  inset: 'inset -3px -3px 8px rgba(255,255,255,0.04), inset 3px 3px 8px rgba(0,0,0,0.6)',
  accent: '#f04a4d',
  accentGlow: '0 0 12px rgba(240, 74, 77, 0.4)',
  textPrimary: '#e8e8f0',
  textSecondary: '#8888a0',
  userBubbleShadow: '-3px -3px 8px rgba(255,255,255,0.08), 3px 3px 8px rgba(0,0,0,0.5), 0 0 10px rgba(240,74,77,0.25)',
  aiBubbleShadow: '-4px -4px 10px rgba(255,255,255,0.05), 4px 4px 10px rgba(0,0,0,0.55)',
  sendBtnShadow: '-3px -3px 8px rgba(255,255,255,0.1), 3px 3px 8px rgba(0,0,0,0.5), 0 0 12px rgba(240,74,77,0.3)',
  sendBtnActive: 'inset -2px -2px 5px rgba(255,255,255,0.1), inset 2px 2px 5px rgba(0,0,0,0.5)',
  navBarShadow: '0 4px 12px rgba(0,0,0,0.5)',
} as const;

// ── Animation System (Emil Kowalski principles) ─────────────────────
// Custom easing: cubic-bezier(0.22, 1, 0.36, 1) — ease-out-quint
// Only animate transform + opacity (GPU-accelerated)
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const CLAY_ANIMATIONS = `
  /* ── Ambient background — slow breathing radial gradient ── */
  @keyframes clayAmbientPulse {
    0%, 100% {
      opacity: 0.3;
      transform: scale(1) translate(-50%, -50%);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.15) translate(-50%, -50%);
    }
  }
  .clay-ambient {
    position: absolute;
    top: 30%;
    left: 50%;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(240,74,77,0.08) 0%, rgba(0,212,255,0.04) 40%, transparent 70%);
    transform: translate(-50%, -50%);
    animation: clayAmbientPulse 8s ease-in-out infinite;
    pointer-events: none;
    will-change: transform, opacity;
  }

  /* ── Hero title — clip reveal from left ────────────────── */
  @keyframes clayTitleReveal {
    from {
      clip-path: inset(0 100% 0 0);
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    to {
      clip-path: inset(0 0% 0 0);
      opacity: 1;
    }
  }
  .clay-hero-title {
    animation: clayTitleReveal 700ms ${EASE} both;
    will-change: clip-path, opacity;
  }

  /* Title underline sweep */
  @keyframes clayUnderlineSweep {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  .clay-title-underline {
    display: block;
    height: 3px;
    margin-top: 8px;
    border-radius: 2px;
    background: linear-gradient(90deg, #f04a4d, #f04a4d80, transparent);
    transform-origin: left center;
    animation: clayUnderlineSweep 500ms ${EASE} 400ms both;
  }

  /* ── Hero subtitle — fade + slide up, staggered ────────── */
  @keyframes claySubtitleIn {
    from { opacity: 0; transform: translateY(12px); filter: blur(4px); }
    to { opacity: 1; transform: translateY(0); filter: blur(0); }
  }
  .clay-hero-subtitle {
    animation: claySubtitleIn 500ms ${EASE} 250ms both;
    will-change: transform, opacity, filter;
  }
  .clay-hero-cards {
    animation: claySubtitleIn 500ms ${EASE} 350ms both;
    will-change: transform, opacity, filter;
  }

  /* ── Chat messages — distinctive per role ──────────────── */
  @keyframes clayUserBubbleIn {
    from { opacity: 0; transform: translateX(20px) scale(0.95); }
    60% { transform: translateX(-2px) scale(1.01); }
    to { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes clayAssistantIn {
    from { opacity: 0; transform: translateY(10px) scale(0.97); filter: blur(2px); }
    to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
  }
  .clay-user-msg {
    animation: clayUserBubbleIn 350ms ${EASE} both;
    will-change: transform, opacity;
  }
  .clay-ai-msg {
    animation: clayAssistantIn 400ms ${EASE} both;
    will-change: transform, opacity, filter;
  }

  /* ── Artifact card reveal — clip + scale ───────────────── */
  @keyframes clayArtifactReveal {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(8px);
      clip-path: inset(0 0 30% 0);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
      clip-path: inset(0 0 0 0);
    }
  }
  .clay-artifact {
    animation: clayArtifactReveal 450ms ${EASE} 80ms both;
    will-change: transform, opacity, clip-path;
  }

  /* ── Suggestion buttons — materialize from surface ─────── */
  @keyframes claySuggestionIn {
    from {
      opacity: 0;
      transform: translateY(16px) scale(0.92);
      box-shadow: none;
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  .clay-suggestion {
    transition: transform 180ms ${EASE},
                box-shadow 180ms ${EASE};
  }
  .clay-suggestion:hover {
    transform: translateY(-2px);
    box-shadow: -6px -6px 14px rgba(255,255,255,0.07),
                6px 6px 14px rgba(0,0,0,0.65),
                0 0 20px rgba(240,74,77,0.08) !important;
  }
  .clay-suggestion:active {
    transform: translateY(0) scale(0.97) !important;
    box-shadow: inset -3px -3px 8px rgba(255,255,255,0.04),
                inset 3px 3px 8px rgba(0,0,0,0.6) !important;
    transition-duration: 80ms;
  }

  /* ── Input bar — visible breathing glow ────────────────── */
  @keyframes clayInputGlow {
    0%, 100% {
      box-shadow: inset -3px -3px 8px rgba(255,255,255,0.04),
                  inset 3px 3px 8px rgba(0,0,0,0.6),
                  0 0 0 1px rgba(240,74,77,0.08);
    }
    50% {
      box-shadow: inset -3px -3px 8px rgba(255,255,255,0.04),
                  inset 3px 3px 8px rgba(0,0,0,0.6),
                  0 0 0 1px rgba(240,74,77,0.2),
                  0 0 20px rgba(240,74,77,0.08),
                  0 0 40px rgba(240,74,77,0.03);
    }
  }
  .clay-input {
    animation: clayInputGlow 3s ease-in-out infinite;
  }
  .clay-input:focus {
    animation: none;
    box-shadow: inset -3px -3px 8px rgba(255,255,255,0.04),
                inset 3px 3px 8px rgba(0,0,0,0.6),
                0 0 0 2px rgba(240,74,77,0.35),
                0 0 24px rgba(240,74,77,0.12),
                0 0 48px rgba(240,74,77,0.04) !important;
    transition: box-shadow 200ms ${EASE};
  }

  /* ── Send button — glow intensifies when input has text ── */
  @keyframes claySendPulse {
    0%, 100% { box-shadow: -3px -3px 8px rgba(255,255,255,0.1), 3px 3px 8px rgba(0,0,0,0.5), 0 0 12px rgba(240,74,77,0.3); }
    50% { box-shadow: -3px -3px 8px rgba(255,255,255,0.1), 3px 3px 8px rgba(0,0,0,0.5), 0 0 20px rgba(240,74,77,0.5); }
  }
  .clay-send-ready {
    animation: claySendPulse 2s ease-in-out infinite;
  }

  /* ── Send fly ──────────────────────────────────────────── */
  @keyframes claySendFly {
    0% { transform: translateX(0) scale(1); }
    30% { transform: translateX(6px) scale(0.9); opacity: 0.5; }
    100% { transform: translateX(0) scale(1); opacity: 1; }
  }
  .clay-send-flying span {
    animation: claySendFly 350ms ${EASE};
  }

  /* ── Thinking indicator — smoother dot pulse ───────────── */
  @keyframes clayDotBounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
    40% { transform: translateY(-5px); opacity: 1; }
  }
  .clay-dot-1 { animation: clayDotBounce 1.4s ${EASE} infinite; }
  .clay-dot-2 { animation: clayDotBounce 1.4s ${EASE} 0.15s infinite; }
  .clay-dot-3 { animation: clayDotBounce 1.4s ${EASE} 0.3s infinite; }

  /* ── Toast ─────────────────────────────────────────────── */
  @keyframes clayToastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.96); filter: blur(4px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); filter: blur(0); }
  }
  @keyframes clayToastOut {
    from { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    to { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.97); }
  }

  /* ── Mini card stagger ─────────────────────────────────── */
  @keyframes clayCardIn {
    from { opacity: 0; transform: translateY(14px) scale(0.94); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── AI dot pulse ──────────────────────────────────────── */
  @keyframes clayDotGlow {
    0%, 100% { box-shadow: 0 0 4px rgba(0,212,255,0.3); }
    50% { box-shadow: 0 0 10px rgba(0,212,255,0.6); }
  }
  .clay-ai-dot {
    animation: clayDotGlow 2s ease-in-out infinite;
  }

  /* ── Header entrance ───────────────────────────────────── */
  @keyframes clayHeaderIn {
    from { opacity: 0; transform: translateY(-8px); filter: blur(4px); }
    to { opacity: 1; transform: translateY(0); filter: blur(0); }
  }
  .clay-header {
    animation: clayHeaderIn 400ms ${EASE} both;
  }

  /* ── Error message entrance ──────────────────────────────── */
  @keyframes clayErrorIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── Clay component entry — staggered fade + slide ─────── */
  @keyframes clayComponentIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Critical alert slide from top ──────────────────────── */
  @keyframes clayCriticalAlertIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .clay-critical-alert {
    animation: clayCriticalAlertIn 300ms ${EASE} both;
  }

  /* ── Reduced motion ────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

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

// ── Clay Component Block — renders components with optional pre-fetched data ──
function ClayComponentBlock({
  types,
  prefetchedData,
  onAction,
}: {
  types: ComponentType[]
  prefetchedData?: Record<string, Record<string, unknown>>
  onAction?: (action: string, payload: unknown) => void
}) {
  const [componentData, setComponentData] = useState<Record<string, Record<string, unknown>>>(prefetchedData || {})
  const [fetched, setFetched] = useState(!!prefetchedData)
  const [loading, setLoading] = useState(!prefetchedData)

  useEffect(() => {
    if (fetched || types.length === 0) return
    setFetched(true)
    setLoading(true)

    fetch('/api/clay/component-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ types }),
    })
      .then((res) => res.ok ? res.json() : {})
      .then((data) => { setComponentData(data || {}); setLoading(false) })
      .catch(() => setLoading(false))
  }, [types, fetched])

  if (loading) {
    return (
      <>
        {types.map((type, i) => (
          <UniversalSkeleton key={type} index={i} />
        ))}
      </>
    )
  }

  return (
    <>
      {types.map((type, i) => (
        <div
          key={type}
          style={{
            opacity: 0,
            animation: `clayComponentIn 200ms ease-out ${i * 80}ms forwards`,
          }}
        >
          <ClayComponentRenderer
            type={type}
            data={(componentData[type] as Record<string, unknown>) || {}}
            onAction={onAction}
          />
        </div>
      ))}
    </>
  )
}

// ── Clay Classification Result ────────────────────────────────────────
// Note: renderStrategy is no longer read by the client (Phase 1 Turn 3)
// but the classify route may still emit it for backward compatibility.
interface ClayClassification {
  suggestedComponents: ComponentType[]
  componentData: Record<string, Record<string, unknown>>
  intents: string[]
}

// ── Chat Message ──────────────────────────────────────────────────────
function ChatMessage({
  message,
  userMessageText,
  onComponentAction,
  clayClassification,
}: {
  message: UIMessage
  userMessageText?: string
  onComponentAction?: (action: string, payload: unknown) => void
  clayClassification?: ClayClassification | null
}) {
  const { spec, text, hasSpec } = useJsonRenderMessage(
    message.parts as Parameters<typeof useJsonRenderMessage>[0]
  );

  const isUser = message.role === 'user';

  const userText = isUser
    ? message.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('')
    : '';

  const showArtifactInline = hasSpec && spec;

  // Phase 1 Turn 3: Clay is classification-only. The LLM's spec is the primary
  // rendering path. Clay's suggestedComponents remain as a fallback for when
  // the LLM hasn't emitted a spec — eventually the system prompt hint will
  // cover this and ClayComponentBlock can be fully retired.
  const hasClayComponents = clayClassification && clayClassification.suggestedComponents.length > 0

  const fallbackComponents = !hasClayComponents && userMessageText
    ? getComponentsForIntent(userMessageText)
    : []

  const componentsToRender = hasClayComponents
    ? clayClassification!.suggestedComponents
    : fallbackComponents

  const componentData = hasClayComponents ? clayClassification!.componentData : undefined

  // Render components block (fallback only — LLM spec takes precedence)
  const ComponentsBlock = componentsToRender.length > 0 ? (
    <div
      className="clay-artifact mt-4"
      style={{ margin: '12px 0 12px 36px', transformOrigin: 'top left' }}
    >
      <ClayComponentBlock
        types={componentsToRender}
        prefetchedData={componentData}
        onAction={onComponentAction}
      />
    </div>
  ) : null

  // Render text block
  const TextBlock = text ? (
    <div className="mb-4 flex items-start gap-3">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 clay-ai-dot"
        style={{ background: NEU.bg, boxShadow: NEU.raisedSm }}
      >
        <div className="w-2 h-2 rounded-full bg-[#00d4ff]" />
      </div>
      <p className="font-body text-[15px] leading-relaxed" style={{ color: NEU.textPrimary }}>{text}</p>
    </div>
  ) : null

  return (
    <div className={`mb-6 ${isUser ? 'flex justify-end' : ''}`}>
      {isUser ? (
        <div
          className="clay-user-msg max-w-[70%] px-[18px] py-[14px] font-body text-[15px] leading-relaxed text-white"
          style={{
            background: NEU.accent,
            boxShadow: NEU.userBubbleShadow,
            borderRadius: '16px 16px 4px 16px',
            transformOrigin: 'right center',
          }}
        >
          {userText || text}
        </div>
      ) : (
        <div className="clay-ai-msg w-full">
          {/* Phase 1 Turn 3: single render path — text first, then any Clay
              fallback components, then LLM-authored spec artifact. No more
              renderStrategy branching (lead-with-components / components-only). */}
          {TextBlock}
          {ComponentsBlock}
          {showArtifactInline && (
            <div
              className="clay-artifact mt-4"
              style={{
                background: NEU.bg,
                boxShadow: NEU.raisedLg,
                borderRadius: 20,
                padding: 20,
                margin: '12px 0 12px 36px',
                transformOrigin: 'top left',
              }}
            >
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

// Invisible marker: after a write action completes, the client injects a user-role
// message starting with this prefix + JSON. The system prompt tells the model to
// render a spec confirmation card in response. The filter below hides the directive
// from the rendered chat.
const ACTION_RESULT_MARKER = '[__TRENDZO_ACTION_RESULT__]';
const TRIAGE_MARKER = '[__TRENDZO_TRIAGE__]';

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

// ── Mini Card Preview ────────────────────────────────────────────────
function MiniCardPreview({ card, baseUrl }: {
  card: { share_id: string; creator_name: string; creator_niche: string; vps_score: number | null; total_views: number; total_leads: number };
  baseUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const vps = card.vps_score != null ? Math.round(card.vps_score) : null;
  const circumference = 2 * Math.PI * 28;
  const dashOffset = vps != null ? circumference - (circumference * Math.min(vps, 100)) / 100 : circumference;

  const handleShare = () => {
    navigator.clipboard.writeText(`${baseUrl}/t/${card.share_id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: NEU.bg, boxShadow: NEU.raised }}
    >
      {/* Hatched header */}
      <div
        className="h-12 relative"
        style={{
          background: 'repeating-linear-gradient(135deg, rgba(240,74,77,0.15), rgba(240,74,77,0.15) 4px, transparent 4px, transparent 8px)',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: NEU.textSecondary }}>
            {card.creator_niche}
          </span>
        </div>
      </div>
      {/* Body */}
      <div className="px-3 py-3 flex flex-col items-center gap-2 flex-1">
        {/* VPS ring */}
        <div className="relative w-14 h-14">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            {vps != null && (
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke={NEU.accent}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            )}
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-sm font-display font-bold tabular-nums"
            style={{ color: NEU.textPrimary }}
          >
            {vps ?? '—'}
          </span>
        </div>
        <p className="text-xs font-body font-semibold text-center truncate w-full" style={{ color: NEU.textPrimary }}>
          {card.creator_name}
        </p>
        {/* Actions */}
        <div className="flex gap-2 mt-auto w-full">
          <button
            onClick={handleShare}
            className="flex-1 text-[10px] py-1.5 rounded-lg transition"
            style={{ background: NEU.bg, boxShadow: NEU.raisedSm, color: copied ? '#10b981' : NEU.textSecondary }}
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
          <a
            href={`/t/${card.share_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-[10px] py-1.5 rounded-lg text-center transition"
            style={{ background: NEU.bg, boxShadow: NEU.raisedSm, color: NEU.textSecondary }}
          >
            Preview
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AgencyClient({ initialState, userId, agencyId }: AgencyClientProps) {
  const { signOut } = useSupabaseAuth();
  const router = useRouter();

  const modeChecked = true;

  const [chatError, setChatError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [restoredSession, setRestoredSession] = useState<ConversationSession | null>(null);
  const [showRestoredToast, setShowRestoredToast] = useState(false);

  // Clay: track recently rendered component types (last 2 assistant turns)
  const [recentComponents, setRecentComponents] = useState<ComponentType[]>([])
  // Clay: inline action confirmations
  const [inlineConfirmations, setInlineConfirmations] = useState<ActionConfirmationData[]>([]);
  // Clay: classification results keyed by user message text
  const [clayClassifications, setClayClassifications] = useState<Record<string, ClayClassification>>({});
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
  // Menu state removed — shared header handles its own menu

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
  // Guard C: true while a write action is dispatching or rendering its
  // confirmation card. Blocks fireAutoGreeting so the briefing can never
  // replace a confirmation surface.
  const actionInFlight = useRef(false);

  // Phase 1 Turn 4: morning greeting now reads from agency_triage (overnight
  // job) and injects a deterministic spec via the TRIAGE_MARKER short-circuit
  // in /api/agency-chat — no GPT cold-start. Falls back to the LLM path only
  // if the triage fetch fails entirely.
  const fireAutoGreeting = useCallback(async () => {
    if (autoGreetFired.current) return;
    if (actionInFlight.current) return;
    autoGreetFired.current = true;
    setAutoBriefing(true);

    try {
      // Pass agencyId explicitly — the route can't rely on auth when
      // NEXT_PUBLIC_DISABLE_AUTH is set (it gets a 'dev-user' id with no
      // membership). The page already resolved agencyId server-side.
      const url = agencyId
        ? `/api/triage/today?agency_id=${encodeURIComponent(agencyId)}`
        : '/api/triage/today';
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const triage = await res.json() as { items: unknown[]; stale: boolean; triage_date: string | null };
        // Only short-circuit the LLM if there's something to render. Empty
        // triage on a brand-new install would otherwise leave the operator
        // staring at "All quiet" forever — fall back to the LLM greeting
        // until Phase 2A introduces the proper guided first-run state.
        if (Array.isArray(triage.items) && triage.items.length > 0) {
          const marker = '[__TRENDZO_TRIAGE__] ' + JSON.stringify(triage);
          sendMessage({ text: marker });
          return;
        }
        // eslint-disable-next-line no-console
        console.info('[agency] triage empty, falling back to LLM greeting');
      } else {
        // eslint-disable-next-line no-console
        console.warn('[agency] triage fetch failed, falling back to LLM greeting', res.status);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[agency] triage fetch threw, falling back to LLM greeting', err);
    }

    // Fallback: original GPT greeting (only reached on triage fetch failure).
    classifyMessage(AUTO_GREETING);
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
        // Race session restore against a 5s timeout to prevent infinite hang
        const active = await Promise.race([
          loadActiveConversation(userId, agencyId),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
        ]);

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
          // No active session or timed out — start fresh with auto-greeting
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
    // Guard B: if the most recent user message is a hidden action-result
    // directive, this effect must not touch greeting state — the incoming
    // stream is a confirmation card, not a briefing response.
    const last = messages[messages.length - 1];
    if (last?.role === 'user') {
      const lastText = last.parts
        ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('') ?? '';
      if (lastText.startsWith(ACTION_RESULT_MARKER)) return;
      // Triage marker is also a hidden directive — treat like action-result.
      if (lastText.startsWith(TRIAGE_MARKER)) return;
    }
    if (autoBriefing && !isLoading && messages.length > 1) {
      setAutoBriefing(false);
    }
  }, [autoBriefing, isLoading, messages]);

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

  // Clay: track recent components from classifications
  useEffect(() => {
    const allClassifications = Object.values(clayClassifications)
    const lastTwo = allClassifications.slice(-2)
    const recent: ComponentType[] = []
    for (const cls of lastTwo) {
      recent.push(...cls.suggestedComponents)
    }
    setRecentComponents(recent)
  }, [clayClassifications])

  // Clay: handle component actions (approve, reject, select-variant, etc.)
  const handleComponentAction = useCallback(async (actionId: string, payload: unknown) => {
    const pl = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>
    // Phase 1 Turn 2 fix: enforce explicit type in payload. Silent fallback to
    // actionId previously hid bugs where the catalog omitted `type` and the
    // wrong handler ran. Tell the operator instead of guessing.
    if (!pl.type || typeof pl.type !== 'string') {
      console.error('[agency] Action invoked without payload.type', { actionId, payload })
      setInlineConfirmations((prev) => [
        ...prev,
        {
          actionId: `confirm-${Date.now()}`,
          actionType: 'unknown',
          actionLabel: 'Action',
          target: actionId,
          consequence: 'Action missing type — catalog bug. See console.',
          status: 'cancelled',
        },
      ])
      return
    }
    const actionType = pl.type as string

    // Guard C: block morning briefing while the write + confirmation is in flight.
    actionInFlight.current = true;

    // Add a pending confirmation immediately
    const confirmationId = `confirm-${Date.now()}`
    const pendingConfirmation: ActionConfirmationData = {
      actionId: confirmationId,
      actionType,
      actionLabel: actionType.replace(/_/g, ' ').replace(/-/g, ' '),
      target: (pl.briefId as string) || (pl.alertId as string) || actionId,
      consequence: 'Processing...',
      status: 'pending',
    }
    setInlineConfirmations((prev) => [...prev, pendingConfirmation])

    try {
      const res = await fetch('/api/clay/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, type: actionType, payload: pl }),
      })
      const result = await res.json()

      // Update the confirmation status
      setInlineConfirmations((prev) =>
        prev.map((c) =>
          c.actionId === confirmationId
            ? {
                ...c,
                status: result.success ? 'confirmed' as const : 'cancelled' as const,
                consequence: result.message || (result.success ? 'Done' : 'Failed'),
              }
            : c,
        ),
      )

      // If the write produced structured confirmation data, inject a hidden directive
      // into the chat so the model renders a spec-driven confirmation card.
      if (result.success && result.confirmation) {
        const directive = `${ACTION_RESULT_MARKER} ${JSON.stringify(result.confirmation)}`
        sendMessageRef.current({ text: directive })
        // Hold the in-flight guard briefly so streaming the confirmation card
        // can't race the greeting reset. Cleared after the response settles.
        setTimeout(() => { actionInFlight.current = false; }, 4000);
      } else {
        actionInFlight.current = false;
      }
    } catch (err) {
      actionInFlight.current = false;
      setInlineConfirmations((prev) =>
        prev.map((c) =>
          c.actionId === confirmationId
            ? { ...c, status: 'cancelled' as const, consequence: 'Network error — action may not have completed' }
            : c,
        ),
      )
    }
  }, [])

  // Clay: classify intent for a user message (fire-and-forget alongside chat)
  const classifyMessage = useCallback((text: string) => {
    fetch('/api/clay/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        recentComponents,
      }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((result) => {
        if (result) {
          setClayClassifications((prev) => ({ ...prev, [text]: result }))
        }
      })
      .catch(() => {})
  }, [recentComponents])

  const [sendAnimating, setSendAnimating] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    if (!hasSentFirst) setHasSentFirst(true);
    setChatError(null);
    setSendAnimating(true);
    setTimeout(() => setSendAnimating(false), 300);
    classifyMessage(inputValue);
    sendMessage({ text: inputValue });
    setInputValue('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setHasSentFirst(true);
    setChatError(null);
    classifyMessage(suggestion);
    sendMessage({ text: suggestion });
  };

  const handleVoiceTranscript = useCallback((text: string) => {
    setIsInterimText(false);
    setIsVoiceListening(false);
    if (!text.trim() || isLoading) return;
    setInputValue('');
    if (!hasSentFirst) setHasSentFirst(true);
    setChatError(null);
    classifyMessage(text);
    sendMessage({ text });
  }, [isLoading, hasSentFirst, sendMessage, classifyMessage]);

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
    // Write actions — route through the Clay action pipeline so action-handler.ts
    // runs the DB write and the hidden directive fires the confirmation spec.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update_brief_status: (params: any) => {
      const inner = params?.params || params;
      const briefId = inner?.briefId;
      if (!briefId) { console.error('[agency] update_brief_status missing briefId', params); return; }
      handleComponentAction(briefId, {
        type: 'update_brief_status',
        briefId,
        new_status: inner?.new_status,
        published_url: inner?.published_url,
      });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    log_performance: (params: any) => {
      const inner = params?.params || params;
      const briefId = inner?.briefId;
      if (!briefId) { console.error('[agency] log_performance missing briefId', params); return; }
      handleComponentAction(briefId, {
        type: 'log_performance',
        briefId,
        actual_views: inner?.actual_views,
        actual_engagement_rate: inner?.actual_engagement_rate,
      });
    },

    // ─────────────────────────────────────────────────────────────────
    // Phase 1 Turn 2 — previously dead handlers (11)
    // Registry: src/lib/clay/intelligent-clay-registry.ts
    // Each routes through /api/clay/action → action-handler.ts
    // ─────────────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    approve_brief: (params: any) => {
      const inner = params?.params || params;
      const briefId = inner?.briefId;
      if (!briefId) { console.error('[agency] approve_brief missing briefId', params); return; }
      handleComponentAction(briefId, { type: 'approve_brief', briefId });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send_invite: (params: any) => {
      const inner = params?.params || params;
      handleComponentAction(`invite-${Date.now()}`, {
        type: 'send_invite',
        creatorEmail: inner?.creatorEmail || inner?.email,
        creatorName: inner?.creatorName || inner?.name,
      });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nudge_creator: (params: any) => {
      const inner = params?.params || params;
      const briefId = inner?.briefId;
      if (!briefId) { console.error('[agency] nudge_creator missing briefId', params); return; }
      handleComponentAction(briefId, {
        type: 'nudge_creator',
        briefId,
        creatorId: inner?.creatorId,
      });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create_event: (params: any) => {
      const inner = params?.params || params;
      handleComponentAction(`event-${Date.now()}`, {
        type: 'create_event',
        eventName: inner?.eventName || inner?.name,
        eventDate: inner?.eventDate || inner?.date,
        category: inner?.category,
        description: inner?.description,
      });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    match_creators_to_event: (params: any) => {
      const inner = params?.params || params;
      const eventId = inner?.eventId;
      if (!eventId) { console.error('[agency] match_creators_to_event missing eventId', params); return; }
      handleComponentAction(eventId, { type: 'match_creators_to_event', eventId });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    push_brief_to_creators: (params: any) => {
      const inner = params?.params || params;
      const briefId = inner?.briefId;
      const creatorIds = inner?.creatorIds;
      if (!briefId || !Array.isArray(creatorIds)) {
        console.error('[agency] push_brief_to_creators missing briefId or creatorIds', params);
        return;
      }
      handleComponentAction(briefId, { type: 'push_brief_to_creators', briefId, creatorIds });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    check_push_status: (params: any) => {
      const inner = params?.params || params;
      const briefId = inner?.briefId;
      if (!briefId) { console.error('[agency] check_push_status missing briefId', params); return; }
      handleComponentAction(briefId, { type: 'check_push_status', briefId });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generate_batch_briefs: (params: any) => {
      const inner = params?.params || params;
      handleComponentAction(`batch-${Date.now()}`, {
        type: 'generate_batch_briefs',
        creatorIds: inner?.creatorIds,
        topic: inner?.topic,
      });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schedule_post: (params: any) => {
      const inner = params?.params || params;
      const briefId = inner?.briefId;
      if (!briefId) { console.error('[agency] schedule_post missing briefId', params); return; }
      handleComponentAction(briefId, {
        type: 'schedule_post',
        briefId,
        scheduledFor: inner?.scheduledFor,
      });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generate_report: (params: any) => {
      const inner = params?.params || params;
      handleComponentAction(`report-${Date.now()}`, {
        type: 'generate_report',
        timeWindow: inner?.timeWindow,
      });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reschedule_post: (params: any) => {
      const inner = params?.params || params;
      const briefId = inner?.briefId;
      if (!briefId) { console.error('[agency] reschedule_post missing briefId', params); return; }
      handleComponentAction(briefId, {
        type: 'reschedule_post',
        briefId,
        newScheduledFor: inner?.newScheduledFor,
      });
    },
  }), [sendAsUser, handleComponentAction]);

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

  const handleNewSession = useCallback(async (explicit: boolean = false) => {
    // Guard A: only an explicit operator click may reset the greeting flag.
    // Any programmatic caller (future refactors, stray handlers) must pass
    // `explicit: true`. This prevents message injection, state churn, or
    // re-renders from silently re-arming the morning briefing.
    if (!explicit) {
      console.warn('[agency] handleNewSession called without explicit=true — ignoring');
      return;
    }
    if (actionInFlight.current) {
      console.warn('[agency] handleNewSession blocked — action in flight');
      return;
    }
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

  const handleSignOut = useCallback(async () => {
    await signOut();
    window.location.href = '/login';
  }, [signOut]);

  if (!modeChecked || isRestoringSession) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-5" style={{ background: NEU.bg }}>
        <div style={{ animation: `clayLoadOrbIn 600ms cubic-bezier(0.22, 1, 0.36, 1) both` }}>
          <EngineOrb state="thinking" size={48} />
        </div>
        <span
          className="text-xs font-mono-label uppercase tracking-[0.15em]"
          style={{ color: NEU.textSecondary, animation: `clayLoadTextIn 500ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both` }}
        >
          {isRestoringSession ? 'Restoring your session' : 'Loading'}
        </span>
        <style>{`
          @keyframes clayLoadOrbIn {
            from { opacity: 0; transform: scale(0.7); filter: blur(8px); }
            to { opacity: 1; transform: scale(1); filter: blur(0); }
          }
          @keyframes clayLoadTextIn {
            from { opacity: 0; transform: translateY(6px); letter-spacing: 0.3em; }
            to { opacity: 1; transform: translateY(0); letter-spacing: 0.15em; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <StateProvider initialState={initialState}>
      <VisibilityProvider>
        <ActionProvider handlers={actionHandlers}>
          <ValidationProvider customFunctions={{}}>
            <div className="neu-scrollbar" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: NEU.bg, overflow: 'hidden' }}>
              <style>{CLAY_ANIMATIONS}</style>

              {/* ═══ ZONE 1 — SHARED HEADER ═══ */}
              <div className="clay-header">
                <AgencyDashboardHeader
                  mode="clay"
                  onSignOut={handleSignOut}
                  centerSlot={
                    <div className="flex items-center gap-1.5">
                      <EngineOrb state={orbState} />
                      <span className="text-xs font-mono text-[#00d4ff] uppercase tracking-wider">
                        Engine Active
                      </span>
                    </div>
                  }
                />
              </div>

              {/* Session restored toast — slides in, auto-dismisses */}
              {showRestoredToast && restoredSession && (
                <div
                  className="fixed top-[60px] left-1/2 z-50 rounded-2xl px-4 py-2 text-xs font-body flex items-center gap-2"
                  style={{
                    background: NEU.bg,
                    boxShadow: NEU.raised,
                    color: NEU.textSecondary,
                    animation: 'clayToastIn 300ms cubic-bezier(0.23, 1, 0.32, 1) both, clayToastOut 250ms cubic-bezier(0.23, 1, 0.32, 1) 3s forwards',
                    transformOrigin: 'top center',
                  }}
                >
                  <span className="text-[#00d4ff]">●</span>
                  Session restored from {new Date(restoredSession.updated_at).toLocaleString()}
                </div>
              )}

              {/* ═══ CHAT ═══ */}
              <div className="flex-1 overflow-y-auto px-6 py-4 neu-scrollbar">
              <div className="max-w-3xl mx-auto">
                {/* Critical proactive alerts — always rendered at top */}
                {(() => {
                  // Check if any classification has a critical proactive alert
                  for (const cls of Object.values(clayClassifications)) {
                    if (!cls.suggestedComponents.includes(ComponentType.PROACTIVE_ALERT)) continue
                    const alertData = cls.componentData[ComponentType.PROACTIVE_ALERT]
                    if (alertData && (alertData as Record<string, unknown>).severity === 'critical') {
                      return (
                        <div key="critical-alert-top" className="clay-critical-alert mb-4">
                          <ClayComponentRenderer
                            type={ComponentType.PROACTIVE_ALERT}
                            data={alertData}
                            onAction={handleComponentAction}
                          />
                        </div>
                      )
                    }
                  }
                  return null
                })()}

                {!hasSentFirst && messages.length === 0 && !autoBriefing && (
                  <div className="relative flex flex-col items-center justify-center min-h-[30vh]">
                    {/* Ambient background glow */}
                    <div className="clay-ambient" />

                    <h1 className="clay-hero-title font-display text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-1 relative" style={{ color: NEU.textPrimary }}>
                      What do you need?
                      <span className="clay-title-underline" />
                    </h1>
                    <p className="clay-hero-subtitle font-body text-base md:text-lg mb-10 relative" style={{ color: NEU.textSecondary }}>
                      Your agency command center responds to you.
                    </p>

                    {/* ═══ Creator Cards Section ═══ */}
                    {(() => {
                      const cs = initialState.cardsSummary as { totalCards: number; totalViews: number; totalLeads: number; topCards: { share_id: string; creator_name: string; creator_niche: string; vps_score: number | null; total_views: number; total_leads: number }[] } | undefined;
                      const agency = initialState.agency as { cardsShared?: number; leadsFromCards?: number } | undefined;
                      const topCards = cs?.topCards || [];
                      if (topCards.length === 0) return null;
                      const bUrl = typeof window !== 'undefined' ? window.location.origin : '';
                      return (
                        <div className="clay-hero-cards w-full max-w-2xl mb-8">
                          {/* Stats row */}
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-body font-semibold" style={{ color: NEU.textPrimary }}>Creator Cards</h2>
                            <div className="flex items-center gap-4 text-xs" style={{ color: NEU.textSecondary }}>
                              <span><span className="font-bold tabular-nums" style={{ color: NEU.textPrimary }}>{agency?.cardsShared ?? cs?.totalCards ?? 0}</span> Cards shared</span>
                              <span><span className="font-bold tabular-nums" style={{ color: NEU.textPrimary }}>{agency?.leadsFromCards ?? cs?.totalLeads ?? 0}</span> Leads from cards</span>
                            </div>
                          </div>
                          {/* Cards grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            {topCards.slice(0, 4).map((c, i) => (
                              <div key={c.share_id} style={{ animation: `clayCardIn 300ms cubic-bezier(0.23, 1, 0.32, 1) ${180 + i * 50}ms both` }}>
                                <MiniCardPreview card={c} baseUrl={bUrl} />
                              </div>
                            ))}
                          </div>
                          {/* Manage link */}
                          <div className="flex justify-center">
                            <a
                              href="/agency/cards"
                              className="text-xs font-body transition hover:text-[#f04a4d]"
                              style={{ color: NEU.textSecondary }}
                            >
                              Manage all cards &rarr;
                            </a>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-2 gap-4 max-w-lg relative">
                      {defaultSuggestions.map((s, i) => (
                        <button
                          key={s}
                          onClick={() => handleSuggestionClick(s)}
                          className="clay-suggestion px-4 py-3 rounded-2xl text-sm font-body text-left hover:text-[#f04a4d]"
                          style={{
                            background: NEU.bg,
                            boxShadow: NEU.raised,
                            color: NEU.textSecondary,
                            animation: `claySuggestionIn 400ms cubic-bezier(0.22, 1, 0.36, 1) ${400 + i * 80}ms both`,
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post-alert suggestions */}
                {!hasSentFirst && !autoBriefing && !isLoading && messages.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mt-4 mb-6">
                    {postAlertSuggestions.map((s, i) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestionClick(s)}
                        className="clay-suggestion px-4 py-3 rounded-2xl text-sm font-body text-left hover:text-[#f04a4d]"
                        style={{
                          background: NEU.bg,
                          boxShadow: NEU.raised,
                          color: NEU.textSecondary,
                          animation: `claySuggestionIn 400ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 80}ms both`,
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((msg, idx) => {
                  // Hide auto-greeting and action-result directives from chat
                  if (msg.role === 'user') {
                    const msgText = msg.parts
                      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                      .map((p) => p.text)
                      .join('');
                    if (msgText === AUTO_GREETING) return null;
                    if (msgText?.startsWith(ACTION_RESULT_MARKER)) return null;
                    if (msgText?.startsWith(TRIAGE_MARKER)) return null;
                  }

                  // For assistant messages, find the preceding user message text
                  // so Clay can suggest components based on user intent
                  let userMsgText: string | undefined
                  if (msg.role === 'assistant') {
                    for (let i = idx - 1; i >= 0; i--) {
                      if (messages[i].role === 'user') {
                        userMsgText = messages[i].parts
                          ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                          .map((p) => p.text)
                          .join('')
                        break
                      }
                    }
                  }

                  // Look up Clay classification for this user message
                  const classification = userMsgText ? clayClassifications[userMsgText] || null : null

                  return (
                    <div key={msg.id}>
                      <ChatMessage
                        message={msg}
                        userMessageText={userMsgText}
                        onComponentAction={handleComponentAction}
                        clayClassification={classification}
                      />
                    </div>
                  );
                })}

                {/* Inline action confirmations */}
                {inlineConfirmations.map((conf) => (
                  <div key={conf.actionId} className="clay-artifact mb-4" style={{ margin: '0 0 12px 36px' }}>
                    <ClayComponentRenderer
                      type={ComponentType.ACTION_CONFIRMATION}
                      data={conf as unknown as Record<string, unknown>}
                    />
                  </div>
                ))}

                {isLoading && (
                  <div className="clay-ai-msg flex items-center gap-3 font-mono text-sm mb-4" style={{ color: NEU.accent }}>
                    <div className="flex items-center gap-1">
                      <div className="clay-dot-1 w-2 h-2 rounded-full" style={{ background: NEU.accent }} />
                      <div className="clay-dot-2 w-2 h-2 rounded-full" style={{ background: NEU.accent }} />
                      <div className="clay-dot-3 w-2 h-2 rounded-full" style={{ background: NEU.accent }} />
                    </div>
                    <span style={{ opacity: 0.7 }}>Trendzo is thinking</span>
                  </div>
                )}

                {chatError && (
                  <div
                    className="mb-4 px-5 py-4 rounded-2xl text-sm"
                    style={{
                      background: NEU.bg,
                      boxShadow: `${NEU.raised}, inset 0 0 20px rgba(240,74,77,0.04)`,
                      borderLeft: '3px solid #f04a4d',
                      animation: `clayErrorIn 350ms ${EASE} both`,
                    }}
                  >
                    <p className="font-body text-[#f04a4d]/90 leading-relaxed">{chatError}</p>
                    <button
                      onClick={() => setChatError(null)}
                      className="mt-2 text-xs font-mono-label uppercase tracking-[0.1em] hover:opacity-70 transition-opacity"
                      style={{ color: NEU.textSecondary }}
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
              </div>

              {/* ═══ INPUT BAR (fixed at bottom) ═══ */}
              <div className="flex-shrink-0 px-6 py-4 relative" style={{ background: NEU.bg }}>
                {/* Gradient line above input */}
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(240,74,77,0.2) 30%, rgba(0,212,255,0.15) 70%, transparent)',
                  }}
                />
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
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
                        className={`clay-input w-full pl-5 pr-16 py-4 rounded-2xl font-body text-[15px] focus:outline-none disabled:opacity-50 ${isInterimText ? 'italic' : ''}`}
                        style={{
                          background: NEU.bg,
                          border: 'none',
                          color: NEU.textPrimary,
                          ...(isVoiceListening ? { borderLeft: `3px solid ${NEU.accent}` } : {}),
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim() || isInterimText}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-body disabled:opacity-30 active:scale-[0.97] ${sendAnimating ? 'clay-send-flying' : ''} ${inputValue.trim() && !isLoading ? 'clay-send-ready' : ''}`}
                        style={{
                          background: NEU.accent,
                          boxShadow: NEU.sendBtnShadow,
                          transition: 'transform 140ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 140ms cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                      >
                        <span>{isLoading ? '...' : '→'}</span>
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

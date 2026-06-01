'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import type { AgentContext } from '@/types/assessment'
import type { FreedomAgentMessage } from '@/types/freedom-agent'
import type {
  EmailCaptureResponse,
  EmailCaptureErrorResponse,
  EmailStatusResponse,
} from '@/types/email-capture'
import { AgentChip } from './AgentChip'
import { AgentInput } from './AgentInput'
import { AgentMessages } from './AgentMessages'
import { AgentIdentityGlyph } from './AgentIdentityGlyph'

interface Props {
  assessmentId: string // EA-X-XXX display ID
  shareToken: string
  agentContext: AgentContext
  // Operator first name from the assessment payload. Used to personalize the
  // hardcoded welcome message in the expanded chat surface. Falls back to a
  // nameless greeting when absent.
  operatorFirstName?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_ASK_THRESHOLD = 4
const ASK_FLAG_KEY_PREFIX = 'agent_email_asked:'
const HUD_DISMISS_KEY_PREFIX = 'assessmentEmailDismissed:'
const EMAIL_CAPTURED_EVENT = 'assessment:email-captured'

const EMAIL_ASK_PROMPT_TEXT =
  "Quick thing before we keep going — want me to send a recap of this conversation and your assessment to your email? It also gets you on the list for the next batch of codes. Drop your email below or just say 'no thanks' and we'll keep going."

// Locked-state chip-preview teasers. Topic-detected from the chip label
// (chips are LLM-generated per assessment, so exact-string matching is
// unreliable — we match on substring keywords). Falls back to a generic
// teaser when no topic keyword is present.
const TEASER_DAY1 =
  "Your Day 1 task is the foundation of the whole sprint — and it's specific to your situation. I can walk you through exactly what to do, what to avoid, and how it sets up Day 2. Drop your email below to read the full walkthrough →"
const TEASER_NICHE =
  "Your niche came out of three signals in your assessment — your background, your time available, and your Freedom Number. The reasoning behind it matters more than the niche itself. Drop your email below to see the full breakdown →"
const TEASER_PRICING =
  "Your pricing is calibrated to your Freedom Number, not industry averages. There's a specific way to test and adjust it without underselling. Drop your email below for the full method →"
const TEASER_GENERIC =
  "That's a real question and the answer is specific to your assessment. Drop your email below to keep the thread →"

function teaserForChip(label: string): string {
  const lower = label.toLowerCase()
  if (lower.includes('day 1') || lower.includes('day1')) return TEASER_DAY1
  if (lower.includes('niche')) return TEASER_NICHE
  if (lower.includes('pric') || lower.includes('offer')) return TEASER_PRICING
  return TEASER_GENERIC
}

function buildWelcomeMessage(firstName?: string): string {
  const trimmed = firstName?.trim()
  const greeting = trimmed ? `Hey ${trimmed} —` : 'Hey —'
  return `${greeting} I've read your full assessment. Ask me anything about your sprint, your pricing, your niche, or your next move.`
}

type EmailAskPhase = 'never' | 'shown' | 'submitting' | 'success' | 'dismissed'

export function AgentRail({
  assessmentId,
  shareToken,
  agentContext,
  operatorFirstName,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<FreedomAgentMessage[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  // Locked/unlocked state. `null` = not yet known (mount-time fetch in
  // flight). Treated as locked until proven otherwise.
  const [hasCapture, setHasCapture] = useState<boolean | null>(null)
  const locked = hasCapture !== true

  // Chip labels the user has previewed in the current pre-unlock session.
  // Dimmed in the rack; subsequent clicks on a previewed chip are no-ops.
  const [previewedChips, setPreviewedChips] = useState<Set<string>>(
    () => new Set(),
  )

  const [emailAskPhase, setEmailAskPhase] = useState<EmailAskPhase>('never')
  const [askEmail, setAskEmail] = useState('')
  const [askError, setAskError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)

  // Mount: fetch email-status once. Locked-state lives inside the rail now
  // (no external click-intercept wrapper), so this is the only source of
  // truth for the initial hasCapture value.
  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await fetch(
          `/api/assessment/email-status?assessmentId=${encodeURIComponent(assessmentId)}&shareToken=${encodeURIComponent(shareToken)}`,
          { method: 'GET', cache: 'no-store' },
        )
        if (!res.ok) {
          if (!cancelled) setHasCapture(false)
          return
        }
        const data = (await res.json()) as EmailStatusResponse
        if (!cancelled) setHasCapture(Boolean(data.hasCapture))
      } catch {
        if (!cancelled) setHasCapture(false)
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [assessmentId, shareToken])

  const loadHistory = useCallback(async () => {
    if (historyLoaded || isLoadingHistory) return
    setIsLoadingHistory(true)
    try {
      const res = await fetch(
        `/api/freedom-agent/conversation?assessmentId=${encodeURIComponent(assessmentId)}&shareToken=${encodeURIComponent(shareToken)}`,
        { method: 'GET', cache: 'no-store' },
      )
      if (res.ok) {
        const data = (await res.json()) as { messages?: FreedomAgentMessage[] }
        // Merge server history with any pre-unlock chip previews already in
        // local state. Previews stay visible after unlock per the brief.
        setMessages((prev) => {
          const previews = prev.filter((m) => m.preview)
          return [...(data.messages ?? []), ...previews]
        })
      }
    } catch {
      // Non-fatal — user can still send a new message; we just won't show history.
    } finally {
      setIsLoadingHistory(false)
      setHistoryLoaded(true)
    }
  }, [assessmentId, shareToken, historyLoaded, isLoadingHistory])

  const expand = useCallback(() => {
    setIsExpanded(true)
    // Only fetch server history once we know the user is unlocked. Locked
    // users have no conversation to load (server gates /chat with 403), so a
    // fetch would just return an empty list with no benefit.
    if (!historyLoaded && hasCapture === true) loadHistory()
  }, [historyLoaded, loadHistory, hasCapture])

  const collapse = useCallback(() => setIsExpanded(false), [])

  // Escape closes the rail.
  useEffect(() => {
    if (!isExpanded) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') collapse()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isExpanded, collapse])

  // Click outside (desktop only) collapses. The scrim is gone — this is the
  // sole click-outside mechanism now.
  useEffect(() => {
    if (!isExpanded) return
    function onClick(e: MouseEvent) {
      if (window.innerWidth < 768) return // mobile: ignore
      const el = containerRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) collapse()
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [isExpanded, collapse])

  // Expand when the AgentHeroBanner (or anything else) dispatches a focus
  // request. The banner is a fixed element so a scroll-into-view is a no-op;
  // this listener is the actual lever that lands the user in front of the
  // chat input (or the email gate, when locked).
  useEffect(() => {
    function onFocus() {
      expand()
    }
    window.addEventListener('assessment:agent-focus', onFocus)
    return () => window.removeEventListener('assessment:agent-focus', onFocus)
  }, [expand])

  // Listen for cross-component capture events. Flips local hasCapture so the
  // rail unlocks in place, and dismisses the conversational ask the same way
  // it always did.
  useEffect(() => {
    function onCaptured(e: Event) {
      const detail = (e as CustomEvent<{ assessmentId: string }>).detail
      if (!detail || detail.assessmentId !== assessmentId) return
      setHasCapture(true)
      try {
        window.localStorage.setItem(
          ASK_FLAG_KEY_PREFIX + assessmentId,
          'true',
        )
      } catch {
        /* quota — ignore */
      }
      setEmailAskPhase('dismissed')
    }
    window.addEventListener(EMAIL_CAPTURED_EVENT, onCaptured as EventListener)
    return () =>
      window.removeEventListener(
        EMAIL_CAPTURED_EVENT,
        onCaptured as EventListener,
      )
  }, [assessmentId])

  // After unlock, kick off the server history fetch if the rail is already
  // expanded. Covers the path where the user expanded while locked and then
  // unlocked via the inline gate.
  useEffect(() => {
    if (hasCapture === true && isExpanded && !historyLoaded) loadHistory()
  }, [hasCapture, isExpanded, historyLoaded, loadHistory])

  // Trigger the conversational email ask when the user has had a real
  // back-and-forth (post-unlock). Conditions: 4+ real user messages
  // (preview-flagged bubbles don't count), never asked before, no email
  // captured, not mid-stream. Preserved verbatim from prior behavior —
  // localStorage writes here predate this prompt and live on the
  // conversational-ask flow, not the gate.
  useEffect(() => {
    if (emailAskPhase !== 'never') return
    if (isStreaming) return
    if (hasCapture === null) return // wait for mount fetch before deciding
    const userCount = messages.filter(
      (m) => m.role === 'user' && !m.preview,
    ).length
    if (userCount < EMAIL_ASK_THRESHOLD) return

    let cancelled = false

    async function maybeShow() {
      try {
        const askedFlag =
          typeof window !== 'undefined' &&
          window.localStorage.getItem(ASK_FLAG_KEY_PREFIX + assessmentId) === 'true'
        if (askedFlag) {
          if (!cancelled) setEmailAskPhase('dismissed')
          return
        }
        if (hasCapture === true) {
          // Persist suppression so we never re-evaluate this on subsequent turns.
          try {
            window.localStorage.setItem(
              ASK_FLAG_KEY_PREFIX + assessmentId,
              'true',
            )
            window.localStorage.setItem(
              HUD_DISMISS_KEY_PREFIX + assessmentId,
              'true',
            )
          } catch {
            /* quota — ignore */
          }
          if (!cancelled) setEmailAskPhase('dismissed')
          return
        }
        if (!cancelled) setEmailAskPhase('shown')
      } catch {
        // Non-fatal — leave 'never' so it can retry next turn.
      }
    }
    maybeShow()
    return () => {
      cancelled = true
    }
  }, [messages, isStreaming, emailAskPhase, hasCapture, assessmentId])

  const dismissEmailAsk = useCallback(() => {
    try {
      window.localStorage.setItem(
        ASK_FLAG_KEY_PREFIX + assessmentId,
        'true',
      )
    } catch {
      /* quota — ignore */
    }
    setEmailAskPhase('dismissed')
  }, [assessmentId])

  const submitEmailAsk = useCallback(async () => {
    const trimmed = askEmail.trim()
    setAskError(null)
    if (!EMAIL_REGEX.test(trimmed)) {
      setAskError('That email looks off, try again.')
      return
    }
    setEmailAskPhase('submitting')
    try {
      const res = await fetch('/api/assessment/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId,
          shareToken,
          email: trimmed,
          source: 'agent_conversation',
          notifyOnCodes: true,
        }),
      })
      if (res.ok) {
        const data = (await res.json()) as EmailCaptureResponse
        if (data.ok) {
          try {
            window.localStorage.setItem(
              ASK_FLAG_KEY_PREFIX + assessmentId,
              'true',
            )
            // Also suppress the HUD panel since we now have an email.
            window.localStorage.setItem(
              HUD_DISMISS_KEY_PREFIX + assessmentId,
              'true',
            )
          } catch {
            /* quota — ignore */
          }
          window.dispatchEvent(
            new CustomEvent(EMAIL_CAPTURED_EVENT, {
              detail: { assessmentId, source: 'agent_conversation' },
            }),
          )
          setEmailAskPhase('success')
          return
        }
      }
      let friendly = 'That email looks off, try again.'
      try {
        const data = (await res.json()) as EmailCaptureErrorResponse
        if (data?.error) friendly = data.error
      } catch {
        /* leave generic */
      }
      setAskError(friendly)
      setEmailAskPhase('shown')
    } catch {
      setAskError("Couldn't save that just now. Try again in a moment.")
      setEmailAskPhase('shown')
    }
  }, [assessmentId, shareToken, askEmail])

  const send = useCallback(
    async (text: string) => {
      if (isStreaming) return
      setErrorBanner(null)

      const userMessage: FreedomAgentMessage = {
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])
      setIsStreaming(true)
      setStreamingContent('')

      try {
        const res = await fetch('/api/freedom-agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assessmentId, shareToken, message: text }),
        })

        if (!res.ok || !res.body) {
          // Try to read structured error.
          let friendly =
            'The Freedom Agent couldn’t reach the network. Try again.'
          try {
            const data = (await res.json()) as {
              code?: string
              error?: string
            }
            if (data?.code === 'AI_FAILURE' && data.error) friendly = data.error
            if (data?.code === 'ASSESSMENT_NOT_FOUND')
              friendly = 'This assessment was not found.'
          } catch {
            // body wasn't JSON — leave generic
          }
          setErrorBanner(friendly)
          // Roll back optimistic user message so they can retry without dupes.
          setMessages((prev) => prev.slice(0, -1))
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let acc = ''
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          acc += decoder.decode(value, { stream: true })
          setStreamingContent(acc)
        }
        // Flush any tail bytes.
        acc += decoder.decode()

        const assistantMessage: FreedomAgentMessage = {
          role: 'assistant',
          content: acc,
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } catch {
        setErrorBanner(
          'The Freedom Agent couldn’t reach the network. Try again.',
        )
        setMessages((prev) => prev.slice(0, -1))
      } finally {
        setIsStreaming(false)
        setStreamingContent('')
      }
    },
    [assessmentId, shareToken, isStreaming],
  )

  // Chip click splits on lock state. Pre-unlock: push a teaser pair into the
  // local message stream and dim the chip. Post-unlock: existing live-send
  // flow (expand, then send the chip label to the model).
  const onChipClick = useCallback(
    (label: string) => {
      if (locked) {
        if (previewedChips.has(label)) return
        const now = new Date().toISOString()
        const userBubble: FreedomAgentMessage = {
          role: 'user',
          content: label,
          timestamp: now,
          preview: true,
        }
        const teaserBubble: FreedomAgentMessage = {
          role: 'assistant',
          content: teaserForChip(label),
          timestamp: now,
          preview: true,
        }
        setMessages((prev) => [...prev, userBubble, teaserBubble])
        setPreviewedChips((prev) => {
          const next = new Set(prev)
          next.add(label)
          return next
        })
        if (!isExpanded) setIsExpanded(true)
        return
      }
      expand()
      send(label)
    },
    [locked, previewedChips, isExpanded, expand, send],
  )

  // Locked inline-gate success: flip local state. (The component itself
  // dispatches the assessment:email-captured event so other listeners stay
  // in sync — we don't need to repeat that here.)
  const onInlineUnlock = useCallback(() => {
    setHasCapture(true)
  }, [])

  const isAgentActive = isStreaming || isLoadingHistory
  const agentStatus: 'STANDBY' | 'ACTIVE' | 'LIVE' = isAgentActive
    ? 'ACTIVE'
    : messages.length > 0
    ? 'LIVE'
    : 'STANDBY'
  const statusLabel = `FREEDOM AGENT — ${agentStatus}`

  const lastTimestamp =
    messages.length > 0 ? messages[messages.length - 1].timestamp : null

  const welcomeMessage = buildWelcomeMessage(operatorFirstName)

  // Chip rack visibility: always shown in locked-expanded so the user can
  // preview each topic; in unlocked-expanded only when no real conversation
  // has started yet (preserved from prior behavior).
  const showChipRack =
    isExpanded && (locked || (messages.length === 0 && !isStreaming))

  return (
    <motion.div
      id="freedom-agent-rail"
      ref={containerRef}
      role="region"
      aria-label="Freedom Agent"
      onClick={(e) => {
        // Expand on rail click (collapsed only). Ignore clicks on chips/buttons.
        if (!isExpanded) {
          const target = e.target as HTMLElement
          if (target.closest('button, textarea, input, [data-no-expand]')) return
          expand()
        }
      }}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 4.0, ease: 'easeOut' }}
      className={[
        'agent-rail',
        isExpanded ? 'agent-rail-expanded hud-glass' : '',
        isAgentActive
          ? 'chassis-glow-medium'
          : isExpanded
          ? ''
          : 'chassis-glow-soft',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: isExpanded ? 'rgba(28, 28, 36, 0.72)' : '#22222c',
        borderTop: isExpanded
          ? '1px solid rgba(240, 74, 77, 0.35)'
          : '1px solid #7a2527',
        borderRadius: isExpanded ? '16px 16px 0 0' : 0,
        cursor: isExpanded ? 'default' : 'pointer',
      }}
    >
      <AnimatePresence initial={false} mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              maxWidth: 1280,
              margin: '0 auto',
            }}
          >
            <ExpandedHeader
              statusText={agentStatus}
              lastTimestamp={lastTimestamp}
              onClose={collapse}
              isAgentActive={isAgentActive}
            />

            {errorBanner && (
              <div
                role="alert"
                style={{
                  margin: '8px 16px 0',
                  padding: '8px 12px',
                  background: '#3a1a1c',
                  border: '1px solid #7a2527',
                  borderRadius: 6,
                  color: '#f4f4f6',
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 13,
                }}
              >
                {errorBanner}
              </div>
            )}

            <AgentMessages
              messages={messages}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              welcomeMessage={welcomeMessage}
            />

            {(emailAskPhase === 'shown' ||
              emailAskPhase === 'submitting' ||
              emailAskPhase === 'success') && (
              <EmailAskBlock
                phase={emailAskPhase}
                email={askEmail}
                error={askError}
                onChange={value => {
                  setAskEmail(value)
                  if (askError) setAskError(null)
                }}
                onSubmit={submitEmailAsk}
                onDismiss={dismissEmailAsk}
              />
            )}

            {showChipRack && (
              <div
                data-no-expand
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  padding: '0 16px 12px',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                }}
              >
                {agentContext.quickReplies.map((q, i) => {
                  const previewed = previewedChips.has(q)
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <AgentChip
                        label={q}
                        onClick={() => onChipClick(q)}
                        disabled={previewed || isStreaming}
                      />
                      {previewed && (
                        <span
                          style={{
                            fontFamily:
                              '"JetBrains Mono", ui-monospace, monospace',
                            fontSize: 9,
                            color: '#5b5b63',
                            letterSpacing: 1.0,
                            textTransform: 'uppercase',
                          }}
                        >
                          ← preview shown above
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {locked ? (
              <InlineEmailGate
                assessmentId={assessmentId}
                shareToken={shareToken}
                onSuccess={onInlineUnlock}
              />
            ) : (
              <AgentInput onSend={send} disabled={isStreaming} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              padding: '20px 24px',
              maxWidth: 1280,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              gap: 24,
              height: '100%',
            }}
            className="agent-rail-grid"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AgentIdentityGlyph size={48} active={isAgentActive} />
              <span
                style={{
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 10,
                  color: '#5b5b63',
                  letterSpacing: 1.4,
                  whiteSpace: 'nowrap',
                }}
              >
                {statusLabel}
              </span>
            </div>

            <div
              title={agentContext.greeting}
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 14,
                color: '#f4f4f6',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.5,
              }}
            >
              {agentContext.greeting}
            </div>

            <div
              data-no-expand
              style={{ display: 'flex', gap: 8, flexWrap: 'nowrap' }}
              className="agent-rail-chips"
            >
              {agentContext.quickReplies.map((q, i) => (
                <AgentChip
                  key={i}
                  label={q}
                  onClick={() => onChipClick(q)}
                  disabled={previewedChips.has(q)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .agent-rail {
          height: 120px;
        }
        .agent-rail.agent-rail-expanded {
          height: 520px;
          cursor: default;
        }
        @media (max-width: 767px) {
          .agent-rail { height: 88px; padding: 0; }
          .agent-rail.agent-rail-expanded { height: 72vh; }
          .agent-rail-grid { padding: 12px 16px !important; grid-template-columns: 1fr !important; gap: 4px !important; }
          .agent-rail-chips { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .agent-rail, .agent-rail * {
            transition-duration: 0.001ms !important;
            animation-duration: 0.001ms !important;
          }
        }
      `}</style>
    </motion.div>
  )
}

function ExpandedHeader({
  statusText,
  lastTimestamp,
  onClose,
  isAgentActive,
}: {
  statusText: 'STANDBY' | 'ACTIVE' | 'LIVE'
  lastTimestamp: string | null
  onClose: () => void
  isAgentActive: boolean
}) {
  const time = lastTimestamp
    ? new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(lastTimestamp))
    : null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderBottom: '1px solid rgba(240, 74, 77, 0.18)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <AgentIdentityGlyph size={56} active={isAgentActive} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 18,
              fontWeight: 700,
              color: '#f4f4f6',
              lineHeight: 1.1,
              textShadow: '0 0 12px rgba(240, 74, 77, 0.22)',
            }}
          >
            FREEDOM AGENT
          </span>
          <span
            style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 10,
              color: '#5b5b63',
              letterSpacing: 1.4,
            }}
          >
            {statusText}
            {time && <> · LAST {time}</>}
          </span>
        </div>
      </div>
      <button
        type="button"
        aria-label="Close Freedom Agent"
        onClick={onClose}
        style={{
          width: 28,
          height: 28,
          background: 'transparent',
          border: '1px solid #2a2a35',
          borderRadius: 6,
          color: '#9b9ba4',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
        }}
      >
        ×
      </button>
    </div>
  )
}

// ─── InlineEmailGate ────────────────────────────────────────────────────────
// Lives in the chat input's slot when the rail is expanded-locked. Crimson
// UNLOCK MY AGENT button (more prominent than the outline-style CTAs
// elsewhere because this is the conversion moment). Posts to
// /api/assessment/email-capture with source='rail_gate' and dispatches
// assessment:email-captured on success so other listeners stay in sync.

function InlineEmailGate({
  assessmentId,
  shareToken,
  onSuccess,
}: {
  assessmentId: string
  shareToken: string
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const trimmed = email.trim()
      setError(null)
      if (!EMAIL_REGEX.test(trimmed)) {
        setError('That email looks off, try again.')
        return
      }
      setSubmitting(true)
      try {
        const res = await fetch('/api/assessment/email-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId,
            shareToken,
            email: trimmed,
            source: 'rail_gate',
            notifyOnCodes: true,
          }),
        })
        if (res.ok) {
          const data = (await res.json()) as EmailCaptureResponse
          if (data.ok) {
            window.dispatchEvent(
              new CustomEvent(EMAIL_CAPTURED_EVENT, {
                detail: { assessmentId, source: 'rail_gate' },
              }),
            )
            onSuccess()
            return
          }
        }
        let friendly = "Couldn't save that just now. Try again in a moment."
        if (res.status >= 400 && res.status < 500) {
          try {
            const data = (await res.json()) as EmailCaptureErrorResponse
            if (data?.error) friendly = data.error
          } catch {
            /* leave generic */
          }
        }
        setError(friendly)
        setSubmitting(false)
      } catch {
        setError("Couldn't save that just now. Try again in a moment.")
        setSubmitting(false)
      }
    },
    [assessmentId, shareToken, email, onSuccess],
  )

  return (
    <div
      data-no-expand
      style={{
        padding: '12px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {error && (
        <div
          role="alert"
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 12,
            color: '#f04a4d',
          }}
        >
          {error}
        </div>
      )}
      <form
        onSubmit={onSubmit}
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'stretch',
          width: '100%',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError(null)
          }}
          placeholder="your@email.com"
          aria-label="Your email address"
          disabled={submitting}
          style={{
            flex: '1 1 220px',
            background: '#08080d',
            border: '1px solid #2a2a35',
            borderRadius: 999,
            padding: '11px 18px',
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 14,
            color: '#f4f4f6',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={submitting}
          style={{
            background: '#f04a4d',
            color: '#fff',
            border: '1px solid #f04a4d',
            borderRadius: 999,
            padding: '11px 22px',
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1.6,
            textTransform: 'uppercase',
            cursor: submitting ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 0 16px rgba(240, 74, 77, 0.3)',
          }}
        >
          {submitting ? 'UNLOCKING…' : 'UNLOCK MY AGENT'}
        </button>
      </form>
      <div
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 12,
          color: '#8a8a92',
          lineHeight: 1.5,
        }}
      >
        We&apos;ll email you sprint check-ins on day 3, 7, and 14. Unsubscribe
        anytime.
      </div>
    </div>
  )
}

// ─── EmailAskBlock ──────────────────────────────────────────────────────────
// Post-unlock conversational ask, triggered at msg 4+. Separate from the
// inline rail gate above — this is the "send me a recap" flow and predates
// this prompt. Preserved verbatim per the spec.

function EmailAskBlock({
  phase,
  email,
  error,
  onChange,
  onSubmit,
  onDismiss,
}: {
  phase: 'shown' | 'submitting' | 'success'
  email: string
  error: string | null
  onChange: (value: string) => void
  onSubmit: () => void
  onDismiss: () => void
}) {
  if (phase === 'success') {
    return (
      <div
        data-no-expand
        style={{
          padding: '0 16px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 4,
        }}
      >
        <div
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 10,
            color: '#5b5b63',
            letterSpacing: 1.2,
          }}
        >
          FREEDOM AGENT
        </div>
        <div
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 14,
            color: '#3aa67a',
            lineHeight: 1.5,
          }}
        >
          Got it. Recap on its way.
        </div>
      </div>
    )
  }

  return (
    <div
      data-no-expand
      style={{
        padding: '0 16px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      <div
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 10,
          color: '#5b5b63',
          letterSpacing: 1.2,
        }}
      >
        FREEDOM AGENT
      </div>
      <div
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 14,
          color: '#f4f4f6',
          lineHeight: 1.55,
          maxWidth: '84%',
        }}
      >
        {EMAIL_ASK_PROMPT_TEXT}
      </div>
      <form
        onSubmit={e => {
          e.preventDefault()
          onSubmit()
        }}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          width: '100%',
        }}
      >
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => onChange(e.target.value)}
          placeholder="your@email.com"
          aria-label="Your email"
          disabled={phase === 'submitting'}
          style={{
            flex: '1 1 200px',
            background: '#08080d',
            border: '1px solid #2a2a35',
            borderRadius: 8,
            padding: '8px 12px',
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 14,
            color: '#f4f4f6',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={phase === 'submitting'}
          style={{
            background: '#f04a4d',
            color: '#fff',
            border: '1px solid #f04a4d',
            borderRadius: 8,
            padding: '8px 14px',
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 13,
            fontWeight: 600,
            cursor: phase === 'submitting' ? 'wait' : 'pointer',
          }}
        >
          {phase === 'submitting' ? 'SENDING…' : 'Send recap'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={phase === 'submitting'}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '8px 4px',
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 13,
            color: '#9b9ba4',
            textDecoration: 'underline',
            cursor: phase === 'submitting' ? 'wait' : 'pointer',
          }}
        >
          No thanks
        </button>
      </form>
      {error && (
        <div
          role="alert"
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 12,
            color: '#f04a4d',
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}

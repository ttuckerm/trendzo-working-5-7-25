'use client'

// Email gate built as a click-trigger pattern. The Freedom Agent rail
// renders fully and looks identical to the unlocked state. Until an email
// is captured, a sibling <RailClickGate> wraps the rail and intercepts
// every click + focus on its children, popping the <AgentEmailModal>
// instead. Once the user submits a valid email, the wrapper detaches and
// the rail becomes natively interactive.
//
// Server-side enforcement (the 403 in /api/freedom-agent/chat) stays as the
// real gate — this UI is just the "show, don't hide" experience layer.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import type {
  EmailStatusResponse,
  EmailCaptureResponse,
  EmailCaptureErrorResponse,
} from '@/types/email-capture'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ASK_FLAG_KEY_PREFIX = 'agent_email_asked:'
const EMAIL_CAPTURED_EVENT = 'assessment:email-captured'

// ─── RailClickGate ──────────────────────────────────────────────────────────
// Wraps the agent rail. Intercepts clicks + focus while locked; transparent
// pass-through once unlocked. Decides locked/unlocked from the email-status
// endpoint on mount and listens for cross-component capture events.

interface RailClickGateProps {
  assessmentId: string
  shareToken: string
  children: ReactNode
}

export function RailClickGate({ assessmentId, shareToken, children }: RailClickGateProps) {
  const [hasCapture, setHasCapture] = useState<boolean | null>(null) // null = unknown
  const [modalOpen, setModalOpen] = useState(false)

  // Status check on mount.
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

  // Listen for captures from elsewhere (legacy panel, agent-conversation
  // ask path) and detach the interceptor when one fires.
  useEffect(() => {
    function onCaptured(e: Event) {
      const detail = (e as CustomEvent<{ assessmentId: string }>).detail
      if (!detail || detail.assessmentId !== assessmentId) return
      setHasCapture(true)
      setModalOpen(false)
    }
    window.addEventListener(EMAIL_CAPTURED_EVENT, onCaptured as EventListener)
    return () =>
      window.removeEventListener(EMAIL_CAPTURED_EVENT, onCaptured as EventListener)
  }, [assessmentId])

  const onSuccess = useCallback(() => {
    setHasCapture(true)
    setModalOpen(false)
  }, [])

  // Treat unknown-status the same as locked: deny clicks until we hear
  // back from /email-status. Status check is fast (single Supabase query).
  const locked = hasCapture !== true

  const onClickCapture = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!locked) return
      e.preventDefault()
      e.stopPropagation()
      setModalOpen(true)
    },
    [locked],
  )

  const onFocusCapture = useCallback(
    (e: ReactFocusEvent<HTMLDivElement>) => {
      if (!locked) return
      // Pull focus off the child (e.g. textarea) so the user can re-tab and
      // we re-trigger this branch cleanly. Otherwise the field stays focused
      // behind the modal.
      const target = e.target as HTMLElement
      if (typeof target?.blur === 'function') target.blur()
      setModalOpen(true)
    },
    [locked],
  )

  const onKeyDownCapture = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!locked) return
      // Block Enter/Space/typing into a child input from sneaking past the
      // click interceptor (rare but possible if focus-capture fired before
      // we attached and the user starts typing).
      if (
        e.key === 'Enter' ||
        e.key === ' ' ||
        (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey)
      ) {
        e.preventDefault()
        e.stopPropagation()
        setModalOpen(true)
      }
    },
    [locked],
  )

  return (
    <>
      <div
        // Wrapper exists in both states; only attaches handlers when locked
        // so React doesn't re-mount the rail on transition.
        onClickCapture={locked ? onClickCapture : undefined}
        onFocusCapture={locked ? onFocusCapture : undefined}
        onKeyDownCapture={locked ? onKeyDownCapture : undefined}
        // No visual styling: the rail must look identical to the unlocked
        // state. Wrapper is invisible.
        style={{ display: 'contents' }}
      >
        {children}
      </div>

      {locked && (
        <AgentEmailModal
          assessmentId={assessmentId}
          shareToken={shareToken}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={onSuccess}
        />
      )}
    </>
  )
}

// ─── AgentEmailModal ────────────────────────────────────────────────────────
// Centered modal with copy that matches the prior gate. Closeable via X,
// scrim click, or Escape — none of those unlock the rail.

interface AgentEmailModalProps {
  assessmentId: string
  shareToken: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type Phase = 'idle' | 'submitting'

export function AgentEmailModal({
  assessmentId,
  shareToken,
  isOpen,
  onClose,
  onSuccess,
}: AgentEmailModalProps) {
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Escape closes.
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Auto-focus the input when opened.
  useEffect(() => {
    if (!isOpen) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 30)
    return () => window.clearTimeout(t)
  }, [isOpen])

  // Reset transient state when closed.
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setPhase('idle')
    }
  }, [isOpen])

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const trimmed = email.trim()
      setError(null)
      if (!EMAIL_REGEX.test(trimmed)) {
        setError('That email looks off, try again.')
        return
      }
      setPhase('submitting')
      try {
        const res = await fetch('/api/assessment/email-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId,
            shareToken,
            email: trimmed,
            source: 'hud_panel',
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
            } catch {
              /* quota — ignore */
            }
            window.dispatchEvent(
              new CustomEvent(EMAIL_CAPTURED_EVENT, {
                detail: { assessmentId, source: 'hud_panel' },
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
        setPhase('idle')
      } catch {
        setError("Couldn't save that just now. Try again in a moment.")
        setPhase('idle')
      }
    },
    [assessmentId, shareToken, email, onSuccess],
  )

  if (!isOpen) return null

  const submitting = phase === 'submitting'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Unlock the Freedom Agent"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(8, 8, 13, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
    >
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={onSubmit}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          background: '#1c1c24',
          border: '1px solid rgba(240, 74, 77, 0.22)',
          borderRadius: 14,
          padding: '24px 22px',
          boxShadow:
            '0 16px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 28,
            height: 28,
            border: 'none',
            background: 'transparent',
            color: '#8b8b94',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
          }}
        >
          <CloseIcon />
        </button>

        <div
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 22,
            fontWeight: 600,
            color: '#f4f4f6',
            marginBottom: 6,
            letterSpacing: -0.2,
            textAlign: 'center',
            paddingRight: 24,
          }}
        >
          Meet your Freedom Agent.
        </div>
        <div
          style={{
            fontSize: 14,
            color: '#c5c5cc',
            lineHeight: 1.5,
            textAlign: 'center',
            marginBottom: 14,
          }}
        >
          Don&apos;t worry — still totally free, still unlimited. Where should I
          send your sprint updates?
        </div>

        <input
          ref={inputRef}
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => {
            setEmail(e.target.value)
            if (error) setError(null)
          }}
          placeholder="your@email.com"
          aria-label="Your email address"
          disabled={submitting}
          style={{
            width: '100%',
            background: '#08080d',
            border: '1px solid #2a2a35',
            borderRadius: 8,
            padding: '11px 13px',
            fontSize: 15,
            color: '#f4f4f6',
            outline: 'none',
            marginBottom: error ? 6 : 12,
            fontFamily: 'inherit',
          }}
        />
        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 10,
              fontSize: 12,
              color: '#f04a4d',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="glow-amber-pulse"
          style={{
            width: '100%',
            background: '#fbbf24',
            color: '#1c1306',
            borderRadius: 10,
            padding: '12px 14px',
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1.2,
            cursor: submitting ? 'wait' : 'pointer',
          }}
        >
          {submitting ? 'UNLOCKING…' : 'UNLOCK MY AGENT'}
        </button>

        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: '#5b5b63',
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          We&apos;ll email you sprint check-ins on day 3, 7, and 14. Unsubscribe
          anytime.
        </div>
      </form>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

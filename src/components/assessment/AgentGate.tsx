'use client'

// Non-dismissable visual gate that sits over the Freedom Agent rail until
// the user provides an email. Renders nothing when the email is already
// captured (status check on mount + cross-component event listener).
//
// The static assessment above is fully readable; this component only
// covers the bottom dock area where AgentRail floats. backdrop-filter on
// the overlay lets the user see the agent's shape (curiosity gap) without
// being able to read or interact with it.

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type {
  EmailStatusResponse,
  EmailCaptureResponse,
  EmailCaptureErrorResponse,
} from '@/types/email-capture'

interface Props {
  assessmentId: string // EA-X-XXX
  firstName?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ASK_FLAG_KEY_PREFIX = 'agent_email_asked:'
const EMAIL_CAPTURED_EVENT = 'assessment:email-captured'

type Phase = 'loading' | 'gated' | 'submitting' | 'unlocked'

export function AgentGate({ assessmentId, firstName }: Props) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Initial status check — skip the gate entirely for returning users.
  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await fetch(
          `/api/assessment/email-status?assessmentId=${encodeURIComponent(assessmentId)}`,
          { method: 'GET', cache: 'no-store' },
        )
        if (!res.ok) {
          if (!cancelled) setPhase('gated')
          return
        }
        const data = (await res.json()) as EmailStatusResponse
        if (!cancelled) setPhase(data.hasCapture ? 'unlocked' : 'gated')
      } catch {
        if (!cancelled) setPhase('gated')
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [assessmentId])

  // Unlock instantly if another component captures during this session.
  useEffect(() => {
    function onCaptured(e: Event) {
      const detail = (e as CustomEvent<{ assessmentId: string }>).detail
      if (!detail || detail.assessmentId !== assessmentId) return
      setPhase('unlocked')
    }
    window.addEventListener(EMAIL_CAPTURED_EVENT, onCaptured as EventListener)
    return () =>
      window.removeEventListener(EMAIL_CAPTURED_EVENT, onCaptured as EventListener)
  }, [assessmentId])

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
            setPhase('unlocked')
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
        setPhase('gated')
      } catch {
        setError("Couldn't save that just now. Try again in a moment.")
        setPhase('gated')
      }
    },
    [assessmentId, email],
  )

  if (phase === 'loading' || phase === 'unlocked') return null

  const submitting = phase === 'submitting'
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Unlock the Freedom Agent"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        // Cover at minimum the height of the collapsed agent rail; on desktop
        // we lift higher so the centred panel breathes.
        height: 'min(420px, 60vh)',
        zIndex: 60, // AgentRail is z-50; sit above it.
        // Frosted blur of whatever's underneath (the rail).
        background: 'rgba(8, 8, 13, 0.55)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        borderTop: '1px solid rgba(240, 74, 77, 0.20)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
      }}
    >
      {/* Blurred preview text peeks behind the panel for the curiosity gap */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
          padding: '24px',
          pointerEvents: 'none',
          opacity: 0.45,
          filter: 'blur(6px)',
          color: '#9b9ba4',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 14,
          lineHeight: 1.6,
          maxWidth: 720,
        }}
      >
        {greeting} I&apos;ve been reviewing your assessment — your Freedom Number,
        the sprint, the leads list. There&apos;s one thing I want to flag before
        you start Day 1…
      </div>

      <form
        onSubmit={onSubmit}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 520,
          background: '#1c1c24',
          border: '1px solid rgba(240, 74, 77, 0.22)',
          borderRadius: 14,
          padding: '24px 22px',
          boxShadow:
            '0 12px 40px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
          fontFamily: '"DM Sans", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 22,
            fontWeight: 600,
            color: '#f4f4f6',
            marginBottom: 6,
            letterSpacing: -0.2,
          }}
        >
          Meet your Freedom Agent.
        </div>
        <div
          style={{
            fontSize: 14,
            color: '#c5c5cc',
            marginBottom: 4,
            lineHeight: 1.5,
          }}
        >
          Trained on your specific situation. Unlimited messages. No credit card.
          Yours free.
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#8b8b94',
            marginBottom: 14,
            lineHeight: 1.5,
          }}
        >
          Just tell me where to send updates about your sprint.
        </div>

        <input
          type="email"
          autoComplete="email"
          autoFocus
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

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import type {
  EmailStatusResponse,
  EmailCaptureResponse,
  EmailCaptureErrorResponse,
} from '@/types/email-capture'

interface Props {
  assessmentId: string
  reducedMotion: boolean
  delayMs: number
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DISMISS_KEY_PREFIX = 'assessmentEmailDismissed:'
const ASK_FLAG_KEY_PREFIX = 'agent_email_asked:'
const SUCCESS_AUTO_HIDE_MS = 3000
export const EMAIL_CAPTURED_EVENT = 'assessment:email-captured'

type Phase = 'loading' | 'idle' | 'submitting' | 'success' | 'hidden'

export function EmailCapturePanel({
  assessmentId,
  reducedMotion,
  delayMs,
}: Props) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  // On mount, check capture status + localStorage dismissal flag.
  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const dismissed =
          typeof window !== 'undefined' &&
          window.localStorage.getItem(DISMISS_KEY_PREFIX + assessmentId) ===
            'true'
        if (dismissed) {
          if (!cancelled) setPhase('hidden')
          return
        }
        const res = await fetch(
          `/api/assessment/email-status?assessmentId=${encodeURIComponent(assessmentId)}`,
          { method: 'GET', cache: 'no-store' },
        )
        if (!res.ok) {
          if (!cancelled) setPhase('idle')
          return
        }
        const data = (await res.json()) as EmailStatusResponse
        if (!cancelled) setPhase(data.hasCapture ? 'hidden' : 'idle')
      } catch {
        if (!cancelled) setPhase('idle')
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [assessmentId])

  // Auto-hide after success.
  useEffect(() => {
    if (phase !== 'success') return
    const t = window.setTimeout(() => setPhase('hidden'), SUCCESS_AUTO_HIDE_MS)
    return () => window.clearTimeout(t)
  }, [phase])

  // Hide instantly if the Agent captures during this session.
  useEffect(() => {
    function onCaptured(e: Event) {
      const detail = (e as CustomEvent<{ assessmentId: string }>).detail
      if (!detail || detail.assessmentId !== assessmentId) return
      setPhase('hidden')
    }
    window.addEventListener(EMAIL_CAPTURED_EVENT, onCaptured as EventListener)
    return () =>
      window.removeEventListener(
        EMAIL_CAPTURED_EVENT,
        onCaptured as EventListener,
      )
  }, [assessmentId])

  const onDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY_PREFIX + assessmentId, 'true')
    } catch {
      /* quota — ignore */
    }
    setPhase('hidden')
  }, [assessmentId])

  const onSubmit = useCallback(
    async (e: { preventDefault: () => void }) => {
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
            // Suppress the Agent's inline ask + remember dismissal for next mount.
            try {
              window.localStorage.setItem(
                ASK_FLAG_KEY_PREFIX + assessmentId,
                'true',
              )
              window.localStorage.setItem(
                DISMISS_KEY_PREFIX + assessmentId,
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
            setPhase('success')
            return
          }
        }
        if (res.status >= 400 && res.status < 500) {
          let friendly = 'That email looks off, try again.'
          try {
            const data = (await res.json()) as EmailCaptureErrorResponse
            if (data?.error) friendly = data.error
          } catch {
            /* leave generic */
          }
          setError(friendly)
        } else {
          setError("Couldn't save that just now. Try again in a moment.")
        }
        setPhase('idle')
      } catch {
        setError("Couldn't save that just now. Try again in a moment.")
        setPhase('idle')
      }
    },
    [assessmentId, email],
  )

  if (phase === 'loading' || phase === 'hidden') return null

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 0.35, delay: delayMs / 1000, ease: 'easeOut' }
      }
      role="region"
      aria-label="Save your assessment"
      style={{
        background: '#1c1c24',
        borderTop: '1px solid rgba(240, 74, 77, 0.35)',
        borderBottom: '1px solid rgba(240, 74, 77, 0.35)',
        padding: '14px 24px',
      }}
      className="email-capture-panel"
    >
      <AnimatePresence mode="wait" initial={false}>
        {phase === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 14,
              color: '#3aa67a',
              minHeight: 36,
            }}
          >
            Got it — check your inbox shortly.
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onSubmit={onSubmit}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto auto',
              alignItems: 'center',
              gap: 16,
              maxWidth: 1280,
              margin: '0 auto',
            }}
            className="email-capture-grid"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minWidth: 0,
              }}
            >
              <EnvelopeIcon />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: '"DM Sans", system-ui, sans-serif',
                    fontSize: 14,
                    color: '#f4f4f6',
                    fontWeight: 600,
                  }}
                >
                  Want this assessment in your inbox?
                </div>
                <div
                  style={{
                    fontFamily: '"DM Sans", system-ui, sans-serif',
                    fontSize: 12,
                    color: '#5b5b63',
                  }}
                >
                  We&apos;ll also notify you when the next batch of codes
                  drops.
                </div>
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="your@email.com"
                aria-label="Your email"
                disabled={phase === 'submitting'}
                style={{
                  width: '100%',
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
              {error && (
                <div
                  role="alert"
                  style={{
                    marginTop: 4,
                    fontFamily: '"DM Sans", system-ui, sans-serif',
                    fontSize: 12,
                    color: '#f04a4d',
                  }}
                >
                  {error}
                </div>
              )}
            </div>

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
                letterSpacing: 0.6,
                cursor: phase === 'submitting' ? 'wait' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {phase === 'submitting' ? 'SAVING…' : 'SAVE MY ASSESSMENT'}
            </button>

            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss email capture"
              style={{
                width: 24,
                height: 24,
                background: 'transparent',
                border: 'none',
                color: '#5b5b63',
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CloseIcon />
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 767px) {
          .email-capture-grid {
            grid-template-columns: 1fr auto !important;
            grid-template-areas:
              "copy close"
              "input input"
              "submit submit" !important;
            gap: 10px !important;
          }
          .email-capture-grid > :nth-child(1) { grid-area: copy; }
          .email-capture-grid > :nth-child(2) { grid-area: input; }
          .email-capture-grid > :nth-child(3) { grid-area: submit; }
          .email-capture-grid > :nth-child(4) { grid-area: close; align-self: flex-start; }
        }
      `}</style>
    </motion.div>
  )
}

function EnvelopeIcon() {
  return (
    <svg
      aria-hidden
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#f04a4d"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
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

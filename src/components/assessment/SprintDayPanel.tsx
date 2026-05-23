'use client'

// Modal panel that shows the detailed brief for a single sprint day.
// Rendered by SprintGrid and (indirectly, via OPEN_DAY_PANEL_EVENT) by
// Day1Spotlight. All copy comes from payload.sprint.days[N]; sections whose
// fields don't exist on the current AssessmentPayload contract are omitted —
// the only exception is "Why this, today", which renders a placeholder line
// when no rationale field exists. Do NOT add fabricated content.

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import type { SprintDay } from '@/types/assessment'

// Cross-component channel: Day1Spotlight dispatches this so SprintGrid can
// open the shared panel without lifting state to AssessmentHUD.
export const OPEN_DAY_PANEL_EVENT = 'assessment:open-day-panel'

export interface OpenDayPanelDetail {
  dayNumber: number
}

// The current AssessmentPayload sprint days only carry { dayNumber, date,
// task, estimatedMinutes, category }. Anything beyond that is optional; we
// runtime-narrow with `in` checks so a future payload extension lights the
// sections up without a code change.
interface OptionalDayFields {
  rationale?: string
  why?: string
  steps?: string[]
  script?: string
  template?: string
  successCriteria?: string
  bar?: string
  completed?: boolean
}

type SprintDayWithExtras = SprintDay & OptionalDayFields

interface Props {
  day: SprintDayWithExtras | null
  onClose: () => void
  reducedMotion: boolean
}

function formatLongDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

function readOptional(day: SprintDayWithExtras, ...keys: (keyof OptionalDayFields)[]): string | string[] | null {
  for (const k of keys) {
    const v = day[k]
    if (typeof v === 'string' && v.trim().length > 0) return v
    if (Array.isArray(v) && v.length > 0) return v
  }
  return null
}

export function SprintDayPanel({ day, onClose, reducedMotion }: Props) {
  const open = day !== null
  const [copied, setCopied] = useState(false)

  // Reset the "COPIED" affordance every time the panel opens against a new day.
  useEffect(() => {
    if (!open) return
    setCopied(false)
  }, [open, day?.dayNumber])

  // ESC closes.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock body scroll while the modal is mounted.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const onCopyScript = useCallback(async (text: string) => {
    if (typeof window === 'undefined') return
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.setAttribute('readonly', '')
        ta.style.position = 'absolute'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* silently ignore — no fallback UI required */
    }
  }, [])

  const onAskAgent = useCallback(() => {
    if (!day) return
    window.dispatchEvent(
      new CustomEvent('assessment:agent-prompt', {
        detail: { prompt: `Walk me through Day ${day.dayNumber}` },
      }),
    )
    onClose()
  }, [day, onClose])

  return (
    <AnimatePresence>
      {open && day && (
        <motion.div
          key="sprint-day-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Day ${day.dayNumber} brief`}
          onClick={onClose}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.18 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            background: 'rgba(8, 8, 13, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            fontFamily: '"DM Sans", system-ui, sans-serif',
          }}
        >
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.99 }}
            transition={{ duration: reducedMotion ? 0 : 0.22, ease: 'easeOut' }}
            className="inner-glow-crimson"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 720,
              maxHeight: 'calc(100vh - 64px)',
              overflowY: 'auto',
              background: '#1c1c24',
              border: '1px solid rgba(240, 74, 77, 0.32)',
              borderRadius: 14,
              padding: '24px 26px 22px',
              boxShadow:
                '0 24px 64px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
              color: '#f4f4f6',
            }}
          >
            <PanelBody
              day={day}
              copied={copied}
              onCopyScript={onCopyScript}
              onAskAgent={onAskAgent}
              onClose={onClose}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PanelBody({
  day,
  copied,
  onCopyScript,
  onAskAgent,
  onClose,
}: {
  day: SprintDayWithExtras
  copied: boolean
  onCopyScript: (text: string) => void
  onAskAgent: () => void
  onClose: () => void
}) {
  const rationale = readOptional(day, 'rationale', 'why') as string | null
  const stepsValue = readOptional(day, 'steps') as string[] | null
  const scriptValue = readOptional(day, 'script', 'template') as string | null
  const successValue = readOptional(day, 'successCriteria', 'bar') as string | null

  const dateLong = formatLongDate(day.date)

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close day brief"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 30,
          height: 30,
          background: 'transparent',
          border: '1px solid #2a2a35',
          borderRadius: 8,
          color: '#9b9ba4',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        ×
      </button>

      {/* Tag line */}
      <div
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 11,
          letterSpacing: 1.4,
          color: day.completed ? '#3aa67a' : '#f04a4d',
          textTransform: 'uppercase',
          marginBottom: 10,
          paddingRight: 36,
        }}
      >
        DAY {day.dayNumber} · {dateLong}
        {day.completed ? ' · COMPLETED' : ''}
      </div>

      {/* Title */}
      <h2
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: 26,
          fontWeight: 700,
          color: '#f4f4f6',
          lineHeight: 1.2,
          margin: 0,
        }}
      >
        {day.task}
      </h2>

      {/* Date / duration meta — only renders if estimatedMinutes is present */}
      {typeof day.estimatedMinutes === 'number' && (
        <div
          style={{
            marginTop: 8,
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            color: '#5b5b63',
            letterSpacing: 1.2,
          }}
        >
          ~{day.estimatedMinutes} MIN
        </div>
      )}

      {/* Why this, today */}
      <Section label="WHY THIS, TODAY">
        {rationale ? (
          <Body>{rationale}</Body>
        ) : (
          <Body muted>Detailed daily rationale coming in a future update.</Body>
        )}
      </Section>

      {/* How to do it — only if payload supplies steps */}
      {stepsValue && stepsValue.length > 0 && (
        <Section label="HOW TO DO IT">
          <ol
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              counterReset: 'step',
            }}
          >
            {stepsValue.map((step, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 14,
                  color: '#f4f4f6',
                  lineHeight: 1.55,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: '1px solid #7a2527',
                    background: '#22222c',
                    color: '#f04a4d',
                    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                    fontSize: 11,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ flex: 1 }}>{step}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Script / template — only if payload supplies one */}
      {scriptValue && (
        <Section
          label="SCRIPT / TEMPLATE"
          rightSlot={
            <button
              type="button"
              onClick={() => onCopyScript(scriptValue)}
              style={{
                background: copied ? '#3aa67a' : 'transparent',
                border: `1px solid ${copied ? '#3aa67a' : '#7a2527'}`,
                color: copied ? '#08080d' : '#f04a4d',
                padding: '4px 10px',
                borderRadius: 6,
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 10,
                letterSpacing: 1.2,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {copied ? 'COPIED' : 'COPY'}
            </button>
          }
        >
          <pre
            style={{
              margin: 0,
              padding: 14,
              background: '#08080d',
              border: '1px solid #2a2a35',
              borderRadius: 8,
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 12.5,
              color: '#f4f4f6',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {scriptValue}
          </pre>
        </Section>
      )}

      {/* What 'done' looks like — only if payload supplies bar */}
      {successValue && (
        <Section label="WHAT 'DONE' LOOKS LIKE">
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: 'rgba(240, 74, 77, 0.08)',
              border: '1px solid rgba(240, 74, 77, 0.32)',
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 14,
              color: '#f4f4f6',
              lineHeight: 1.55,
            }}
          >
            {successValue}
          </div>
        </Section>
      )}

      {/* Agent hook — always present */}
      <div style={{ marginTop: 22 }}>
        <button
          type="button"
          onClick={onAskAgent}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid rgba(240, 74, 77, 0.4)',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: '#f4f4f6',
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 14,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(240, 74, 77, 0.08)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: '#f04a4d',
                boxShadow: '0 0 8px rgba(240, 74, 77, 0.7)',
                flexShrink: 0,
              }}
            />
            <span>Ask the Agent about Day {day.dayNumber}</span>
          </span>
          <span
            aria-hidden
            style={{
              color: '#f04a4d',
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 14,
            }}
          >
            →
          </span>
        </button>
      </div>
    </>
  )
}

function Section({
  label,
  rightSlot,
  children,
}: {
  label: string
  rightSlot?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{ marginTop: 22 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 10,
            letterSpacing: 1.4,
            color: '#5b5b63',
          }}
        >
          {label}
        </div>
        {rightSlot}
      </div>
      {children}
    </div>
  )
}

function Body({
  children,
  muted = false,
}: {
  children: React.ReactNode
  muted?: boolean
}) {
  return (
    <div
      style={{
        fontFamily: '"DM Sans", system-ui, sans-serif',
        fontSize: 14,
        color: muted ? '#9b9ba4' : '#f4f4f6',
        lineHeight: 1.6,
        fontStyle: muted ? 'italic' : 'normal',
      }}
    >
      {children}
    </div>
  )
}

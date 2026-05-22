'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import type { SprintDay } from '@/types/assessment'
import { SPRINT_TOGGLE_EVENT } from './SprintGrid'
import { Chassis } from './Chassis'

interface Props {
  assessmentId: string
  shareToken: string
  day1: SprintDay
  sprintStartDate: string
  initialCompleted: boolean
  reducedMotion: boolean
  delayMs: number
  onCompletionChange?: (completed: boolean) => void
}

const COLLAPSE_DELAY_MS = 1500

function parseStartDate(iso: string): Date {
  // Input is YYYY-MM-DD (UTC date string). Parse as UTC then format in local.
  const d = new Date(`${iso}T00:00:00Z`)
  return d
}

export function Day1Spotlight({
  assessmentId,
  shareToken,
  day1,
  sprintStartDate,
  initialCompleted,
  reducedMotion,
  delayMs,
  onCompletionChange,
}: Props) {
  const [completed, setCompleted] = useState<boolean>(initialCompleted)
  const [collapsed, setCollapsed] = useState<boolean>(initialCompleted)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // If completion state was initially true, render in collapsed form immediately.
  // If it transitions from false → true, wait COLLAPSE_DELAY_MS then collapse.
  useEffect(() => {
    if (!completed) {
      setCollapsed(false)
      return
    }
    if (collapsed) return
    const t = window.setTimeout(() => setCollapsed(true), COLLAPSE_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [completed, collapsed])

  // Listen for external toggles (e.g. from SprintGrid) so the spotlight stays in sync.
  useEffect(() => {
    function onExternalToggle(e: Event) {
      const detail = (e as CustomEvent<{ dayNumber: number; completed: boolean }>).detail
      if (!detail || detail.dayNumber !== day1.dayNumber) return
      setCompleted(detail.completed)
    }
    window.addEventListener(SPRINT_TOGGLE_EVENT, onExternalToggle as EventListener)
    return () =>
      window.removeEventListener(
        SPRINT_TOGGLE_EVENT,
        onExternalToggle as EventListener,
      )
  }, [day1.dayNumber])

  const toggle = useCallback(async () => {
    if (saving) return
    const next = !completed
    setCompleted(next)
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/assessment/sprint-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId,
          shareToken,
          dayNumber: day1.dayNumber,
          completed: next,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { ok: boolean }
      if (!data.ok) throw new Error('Server rejected update')
      window.dispatchEvent(
        new CustomEvent(SPRINT_TOGGLE_EVENT, {
          detail: { dayNumber: day1.dayNumber, completed: next },
        }),
      )
      onCompletionChange?.(next)
    } catch (e) {
      setCompleted(!next)
      setError(`Couldn't save Day ${day1.dayNumber}. Try again.`)
      window.setTimeout(() => setError(null), 3000)
    } finally {
      setSaving(false)
    }
  }, [assessmentId, shareToken, completed, day1.dayNumber, saving, onCompletionChange])

  const dateLabel = format(parseStartDate(sprintStartDate), 'EEEE, MMM d')

  return (
    <Chassis
      intensity="prominent"
      statusLabel={
        completed ? 'SPRINT://DAY_1 — COMPLETE' : 'SPRINT://DAY_1 — START_HERE'
      }
      status={completed ? 'complete' : 'active'}
      innerGlow
    >
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 0.35, delay: delayMs / 1000, ease: 'easeOut' }
      }
      className={completed ? '' : 'chassis-glow-medium'}
      style={{
        background: '#1c1c24',
        border: completed ? '1px solid #3aa67a' : '1px solid #f04a4d',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        minHeight: 0,
      }}
    >
      <AnimatePresence initial={false} mode="wait">
        {collapsed ? (
          <motion.div
            key="collapsed"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
            }}
          >
            <CompletedCheckbox onToggle={toggle} disabled={saving} />
            <CompletionSigil />
            <div
              style={{
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 11,
                color: '#3aa67a',
                letterSpacing: 1.4,
              }}
            >
              DAY 1 — COMPLETE
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 13,
                color: '#9b9ba4',
              }}
            >
              See Day 2 below
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              width: '100%',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 11,
                  color: '#5b5b63',
                  letterSpacing: 1.4,
                  marginBottom: 4,
                }}
              >
                START HERE — DAY 1
              </div>
              <div
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#f4f4f6',
                  lineHeight: 1.2,
                  marginBottom: 6,
                }}
              >
                {dateLabel}
              </div>
              <div
                style={{
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 16,
                  color: '#f4f4f6',
                  lineHeight: 1.45,
                  textDecoration: completed ? 'line-through' : 'none',
                  opacity: completed ? 0.7 : 1,
                }}
              >
                {day1.task}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 11,
                  color: '#5b5b63',
                }}
              >
                ~{day1.estimatedMinutes} minutes
              </div>
              {error && (
                <div
                  role="alert"
                  style={{
                    marginTop: 6,
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
              type="button"
              onClick={toggle}
              disabled={saving}
              aria-label={
                completed
                  ? 'Mark Day 1 not complete'
                  : 'Mark Day 1 complete'
              }
              aria-pressed={completed}
              style={{
                width: 24,
                height: 24,
                flexShrink: 0,
                borderRadius: 6,
                border: completed ? '1px solid #3aa67a' : '1px solid #5b5b63',
                background: completed ? '#3aa67a' : 'transparent',
                cursor: saving ? 'wait' : 'pointer',
                color: '#08080d',
                fontSize: 14,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              {completed ? '✓' : ''}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </Chassis>
  )
}

function CompletedCheckbox({
  onToggle,
  disabled,
}: {
  onToggle: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label="Mark Day 1 not complete"
      aria-pressed={true}
      style={{
        width: 20,
        height: 20,
        flexShrink: 0,
        borderRadius: 5,
        border: '1px solid #3aa67a',
        background: '#3aa67a',
        cursor: disabled ? 'wait' : 'pointer',
        color: '#08080d',
        fontSize: 12,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      ✓
    </button>
  )
}

function CompletionSigil() {
  return (
    <svg
      aria-hidden
      width={28}
      height={28}
      viewBox="0 0 32 32"
      style={{
        flexShrink: 0,
        filter: 'drop-shadow(0 0 8px rgba(58, 166, 122, 0.55))',
      }}
    >
      <defs>
        <radialGradient id="sigil-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3aa67a" />
          <stop offset="80%" stopColor="rgba(58, 166, 122, 0.5)" />
          <stop offset="100%" stopColor="rgba(240, 74, 77, 0.2)" />
        </radialGradient>
      </defs>
      <circle cx={16} cy={16} r={14} fill="none" stroke="url(#sigil-grad)" strokeWidth={1.5} />
      <path
        d="M 9 16 L 14 21 L 23 11"
        fill="none"
        stroke="#3aa67a"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

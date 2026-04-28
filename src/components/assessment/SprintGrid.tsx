'use client'

import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import type { SprintBlock, SprintDay } from '@/types/assessment'
import type { SprintProgressMap } from '@/lib/assessment/fetch-assessment'

interface Props {
  assessmentId: string
  sprint: SprintBlock
  initialProgress: SprintProgressMap
  reducedMotion: boolean
  delayMs: number
  interactionEnabled: boolean
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
    .format(d)
    .toUpperCase()
}

export const SPRINT_TOGGLE_EVENT = 'assessment:sprint-toggle'

interface SprintToggleDetail {
  dayNumber: number
  completed: boolean
}

export function SprintGrid({
  assessmentId,
  sprint,
  initialProgress,
  reducedMotion,
  delayMs,
  interactionEnabled,
}: Props) {
  const [progress, setProgress] = useState<SprintProgressMap>(initialProgress)
  const [toast, setToast] = useState<string | null>(null)

  // Listen for external toggles (e.g. Day1Spotlight) so this grid stays in sync.
  useEffect(() => {
    function onExternalToggle(e: Event) {
      const detail = (e as CustomEvent<SprintToggleDetail>).detail
      if (!detail || typeof detail.dayNumber !== 'number') return
      setProgress(prev => ({
        ...prev,
        [String(detail.dayNumber)]: {
          completed: detail.completed,
          completedAt: detail.completed ? new Date().toISOString() : null,
        },
      }))
    }
    window.addEventListener(SPRINT_TOGGLE_EVENT, onExternalToggle as EventListener)
    return () =>
      window.removeEventListener(
        SPRINT_TOGGLE_EVENT,
        onExternalToggle as EventListener,
      )
  }, [])

  const toggle = useCallback(
    async (day: SprintDay) => {
      if (!interactionEnabled) return
      const key = String(day.dayNumber)
      const wasCompleted = progress[key]?.completed === true
      const nextCompleted = !wasCompleted
      const optimistic: SprintProgressMap = {
        ...progress,
        [key]: {
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : null,
        },
      }
      setProgress(optimistic)
      try {
        const res = await fetch('/api/assessment/sprint-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId,
            dayNumber: day.dayNumber,
            completed: nextCompleted,
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as { ok: boolean; sprint_progress?: SprintProgressMap }
        if (!data.ok || !data.sprint_progress) throw new Error('Server rejected update')
        setProgress(data.sprint_progress)
        // Broadcast so the Day 1 spotlight (and any other listeners) can sync.
        window.dispatchEvent(
          new CustomEvent<SprintToggleDetail>(SPRINT_TOGGLE_EVENT, {
            detail: { dayNumber: day.dayNumber, completed: nextCompleted },
          }),
        )
      } catch (e) {
        // Revert
        setProgress(progress)
        setToast(`Couldn't save Day ${day.dayNumber}. Try again.`)
        window.setTimeout(() => setToast(null), 3000)
      }
    },
    [assessmentId, progress, interactionEnabled],
  )

  return (
    <motion.div
      id="sprint-grid"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 0.3, delay: delayMs / 1000, ease: 'easeOut' }
      }
      style={{
        background: '#1c1c24',
        border: '1px solid #22222c',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            color: '#5b5b63',
            letterSpacing: 1.4,
          }}
        >
          14-DAY SPRINT
        </div>
        <div
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            color: '#5b5b63',
          }}
        >
          STARTS {formatShortDate(sprint.startDate)}
        </div>
      </div>

      <div className="sprint-grid">
        {sprint.days.map((day, i) => {
          const key = String(day.dayNumber)
          const completed = progress[key]?.completed === true

          const cellDelayS = reducedMotion ? 0 : (delayMs + i * 50) / 1000
          return (
            <motion.div
              key={day.dayNumber}
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 0.25, delay: cellDelayS, ease: 'easeOut' }
              }
              style={{
                position: 'relative',
                background: '#22222c',
                border: '1px solid #2a2a35',
                borderLeft: completed ? '3px solid #3aa67a' : '1px solid #2a2a35',
                boxShadow: completed
                  ? 'inset 0 0 12px rgba(58, 166, 122, 0.18)'
                  : 'none',
                borderRadius: 8,
                padding: 12,
                minHeight: 130,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                    fontSize: 11,
                    color: '#5b5b63',
                    letterSpacing: 0.8,
                    lineHeight: 1.3,
                  }}
                >
                  DAY {day.dayNumber}
                  <br />
                  {formatShortDate(day.date)}
                </div>
                <button
                  type="button"
                  aria-label={
                    completed
                      ? `Day ${day.dayNumber} completed`
                      : `Mark Day ${day.dayNumber} complete`
                  }
                  aria-pressed={completed}
                  disabled={!interactionEnabled}
                  onClick={() => toggle(day)}
                  style={{
                    width: 18,
                    height: 18,
                    flexShrink: 0,
                    borderRadius: 4,
                    border: completed ? '1px solid #3aa67a' : '1px solid #5b5b63',
                    background: completed ? '#3aa67a' : 'transparent',
                    cursor: interactionEnabled ? 'pointer' : 'not-allowed',
                    opacity: interactionEnabled ? 1 : 0.5,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#08080d',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: 0,
                  }}
                >
                  {completed ? '✓' : ''}
                </button>
              </div>

              <div
                style={{
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 13,
                  color: '#f4f4f6',
                  lineHeight: 1.4,
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textDecoration: completed ? 'line-through' : 'none',
                  opacity: completed ? 0.6 : 1,
                }}
                title={day.task}
              >
                {day.task}
              </div>

              <div
                style={{
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 11,
                  color: '#5b5b63',
                }}
              >
                ~{day.estimatedMinutes} min
              </div>
            </motion.div>
          )
        })}
      </div>

      {toast && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            bottom: 140,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1c1c24',
            border: '1px solid #7a2527',
            color: '#f4f4f6',
            padding: '10px 14px',
            borderRadius: 8,
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 13,
            zIndex: 60,
          }}
        >
          {toast}
        </div>
      )}

      <style>{`
        .sprint-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 10px;
        }
        @media (max-width: 767px) {
          .sprint-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </motion.div>
  )
}

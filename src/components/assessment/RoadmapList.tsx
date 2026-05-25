'use client'

// 90-Day Roadmap rendered as a vertical timeline.
//
// Three months from payload.roadmap.months become rows on a single vertical
// crimson line. Month 1 carries the "active" marker treatment; Months 2 and
// 3 are dim. The section keeps its parent Chassis wrapper (mounted by
// AssessmentHUD); we only own the surface inside.
//
// We never fabricate copy: only fields that exist on RoadmapMonth in the
// AssessmentPayload contract are rendered. See src/types/assessment.ts.

import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import type { RoadmapBlock, RoadmapMonth } from '@/types/assessment'

interface Props {
  roadmap: RoadmapBlock
  reducedMotion: boolean
  delayMs: number
}

const currency0 = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(n))

const integer = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
    Math.round(n),
  )

// Per-row stagger after the section's TIMELINE slot fires. 0 / 150 / 300 ms.
const ROW_STAGGER_MS = 150

export function RoadmapList({ roadmap, reducedMotion, delayMs }: Props) {
  return (
    <div
      style={{
        background: '#1c1c24',
        border: '1px solid #22222c',
        borderRadius: 12,
        padding: '28px 24px 24px',
        height: '100%',
        // Breaks min-content propagation up to the parent grid cell in
        // AssessmentHUD's 12-col layout — without it, the new vertical-timeline
        // content (36px serif titles, 28px stat values, 88px row indent) forces
        // the roadmap cell beyond its allocated 4-of-12 fr share and crowds the
        // sprint cell next to it.
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
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
        90-DAY ROADMAP
      </div>

      {/* Timeline container — relative so the vertical line and markers
          can be absolutely positioned inside it. */}
      <div style={{ position: 'relative' }}>
        {/* Vertical line — sits behind the markers; markers punch it out
            with their 6px solid-background ring. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 32,
            top: 32,
            bottom: 32,
            width: 2,
            background:
              'linear-gradient(180deg, #f04a4d 0%, rgba(240, 74, 77, 0.3) 50%, rgba(42, 42, 53, 1) 100%)',
            pointerEvents: 'none',
          }}
        />

        {roadmap.months.map((m, i) => {
          const isLast = i === roadmap.months.length - 1
          const isActive = m.monthNumber === 1
          const rowDelayS = reducedMotion
            ? 0
            : (delayMs + i * ROW_STAGGER_MS) / 1000

          return (
            <motion.div
              key={m.monthNumber}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 0.35, delay: rowDelayS, ease: 'easeOut' }
              }
              style={{
                position: 'relative',
                paddingLeft: 88,
                marginBottom: isLast ? 0 : 56,
              }}
            >
              <TimelineMarker monthNumber={m.monthNumber} active={isActive} />
              <MonthHeader month={m} />
              <StatGrid month={m} />
              {m.keyMilestone && m.keyMilestone.trim().length > 0 && (
                <MilestoneCallout text={m.keyMilestone} />
              )}
            </motion.div>
          )
        })}
      </div>

      <style>{`
        .roadmap-stat-grid {
          display: grid;
          /* minmax(0, 1fr) — not bare 1fr — so each stat track can shrink
             below its content's min-content width. Without this the stat
             values' min-content (currency strings have no whitespace to
             break on) forces the inner grid wider than its column. */
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 639px) {
          .roadmap-stat-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

function TimelineMarker({
  monthNumber,
  active,
}: {
  monthNumber: RoadmapMonth['monthNumber']
  active: boolean
}) {
  // The 6px solid-background ring is what visually "punches" the marker out
  // of the line behind it — by matching the page background (#08080d), the
  // ring hides the segment of the line that would otherwise pass through.
  const borderColor = active ? '#f04a4d' : '#3a3a47'
  const textColor = active ? '#f04a4d' : '#6b6b78'
  const boxShadow = active
    ? '0 0 0 6px #08080d, 0 0 24px rgba(240, 74, 77, 0.22)'
    : '0 0 0 6px #08080d'

  const style: CSSProperties = {
    position: 'absolute',
    left: 16,
    top: 4,
    width: 34,
    height: 34,
    borderRadius: 999,
    background: '#1c1c24',
    border: `2px solid ${borderColor}`,
    color: textColor,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.4,
    boxShadow,
    zIndex: 1,
  }

  return (
    <span aria-hidden style={style}>
      M{monthNumber}
    </span>
  )
}

function MonthHeader({ month }: { month: RoadmapMonth }) {
  // Date range / thesis are not on the current payload contract — render only
  // what exists: the MONTH N tag and the title.
  return (
    <>
      <div
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 11,
          color: '#f04a4d',
          letterSpacing: 2.5,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        MONTH {month.monthNumber}
      </div>
      <h3
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: 36,
          fontWeight: 600,
          color: '#f4f4f6',
          lineHeight: 1.1,
          letterSpacing: -1,
          margin: '0 0 20px 0',
        }}
      >
        {month.title}
      </h3>
    </>
  )
}

function StatGrid({ month }: { month: RoadmapMonth }) {
  // Sub-labels only render when a real payload field supplies the context.
  // estimatedHoursPerWeek is a payload field, so we show "~{N}/wk" under the
  // HOURS card. SUBSCRIBERS and REVENUE have no analogous secondary field —
  // their sub-labels are omitted (no fabrication).
  const hoursPerWeekValid =
    typeof month.estimatedHoursPerWeek === 'number' &&
    Number.isFinite(month.estimatedHoursPerWeek) &&
    month.estimatedHoursPerWeek > 0

  return (
    <div className="roadmap-stat-grid">
      <StatCard label="SUBSCRIBERS" value={integer(month.subscriberGoal)} />
      <StatCard
        label="REVENUE"
        value={currency0(month.revenueTarget)}
        valueColor="#ffd700"
      />
      <StatCard
        label="HOURS"
        value={`${integer(month.hoursRequired)} hrs`}
        sub={hoursPerWeekValid ? `~${integer(month.estimatedHoursPerWeek)}/wk` : null}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  valueColor,
  sub,
}: {
  label: string
  value: string
  valueColor?: string
  sub?: string | null
}) {
  return (
    <div
      style={{
        background: '#14141c',
        border: '1px solid #2a2a35',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 9,
          color: '#6b6b78',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          // Sized down from 28px → 24px so $XX,XXX-range values fit inside
          // the constrained 4-of-12 column. No truncation; we shrink the
          // font instead of clipping the user's revenue number.
          fontSize: 24,
          fontWeight: 600,
          color: valueColor ?? '#f4f4f6',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            color: '#6b6b78',
            letterSpacing: 0.6,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}

function MilestoneCallout({ text }: { text: string }) {
  return (
    <div
      style={{
        marginTop: 16,
        padding: '12px 16px',
        background: 'rgba(240, 74, 77, 0.04)',
        border: '1px dashed rgba(240, 74, 77, 0.4)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          marginTop: 4,
          width: 6,
          height: 6,
          borderRadius: 999,
          background: '#f04a4d',
          boxShadow: '0 0 8px rgba(240, 74, 77, 0.55)',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 9,
            color: '#6b6b78',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}
        >
          Key Milestone
        </div>
        <div
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 13,
            color: '#f4f4f6',
            lineHeight: 1.55,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  )
}

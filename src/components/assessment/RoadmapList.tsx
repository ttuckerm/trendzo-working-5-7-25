'use client'

import { motion } from 'framer-motion'
import type { RoadmapBlock } from '@/types/assessment'

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
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n))

export function RoadmapList({ roadmap, reducedMotion, delayMs }: Props) {
  return (
    <div
      style={{
        background: '#1c1c24',
        border: '1px solid #22222c',
        borderRadius: 12,
        padding: 24,
        height: '100%',
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {roadmap.months.map((m, i) => {
          const cellDelayS = reducedMotion ? 0 : (delayMs + i * 130) / 1000
          return (
            <motion.div
              key={m.monthNumber}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 0.3, delay: cellDelayS, ease: 'easeOut' }
              }
              style={{
                background: '#22222c',
                border: '1px solid #2a2a35',
                borderRadius: 10,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                      fontSize: 11,
                      color: '#5b5b63',
                      letterSpacing: 1.2,
                      marginBottom: 2,
                    }}
                  >
                    MONTH {m.monthNumber}
                  </div>
                  <div
                    style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontSize: 22,
                      color: '#f4f4f6',
                      fontWeight: 700,
                      lineHeight: 1.1,
                    }}
                  >
                    {m.title}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                }}
              >
                <Stat label="SUBS" value={integer(m.subscriberGoal)} />
                <Stat label="REVENUE" value={currency0(m.revenueTarget)} />
                <Stat label="HOURS" value={`${integer(m.hoursRequired)} hrs`} />
              </div>

              <div
                style={{
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 13,
                  color: '#9b9ba4',
                  lineHeight: 1.5,
                  marginTop: 4,
                }}
              >
                {m.keyMilestone}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 11,
          color: '#5b5b63',
          letterSpacing: 1,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 14,
          color: '#f4f4f6',
          fontWeight: 500,
        }}
      >
        {value}
      </div>
    </div>
  )
}

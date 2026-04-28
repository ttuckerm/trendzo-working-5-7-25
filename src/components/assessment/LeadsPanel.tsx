'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import type { LeadsBlock } from '@/types/assessment'

interface Props {
  leads: LeadsBlock
  reducedMotion: boolean
  delayMs: number
}

export function LeadsPanel({ leads, reducedMotion, delayMs }: Props) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true, 1: false })

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 0.4, delay: delayMs / 1000, ease: 'easeOut' }
      }
      style={{
        background: '#1c1c24',
        border: '1px solid #22222c',
        borderRadius: 12,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            color: '#5b5b63',
            letterSpacing: 1.4,
            marginBottom: 12,
          }}
        >
          PLATFORMS
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {leads.platforms.map((p, i) => (
            <span
              key={i}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                background: '#22222c',
                border: '1px solid #7a2527',
                color: '#f4f4f6',
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            color: '#5b5b63',
            letterSpacing: 1.4,
            marginBottom: 12,
          }}
        >
          SEARCH SIGNALS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {leads.searchSignals.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 12,
                color: '#9b9ba4',
                lineHeight: 1.6,
              }}
            >
              <SearchIcon />
              <span>&ldquo;{s}&rdquo;</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            color: '#5b5b63',
            letterSpacing: 1.4,
            marginBottom: 12,
          }}
        >
          OUTREACH SCRIPTS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leads.scripts.map((s, i) => {
            const open = !!expanded[i]
            return (
              <div
                key={i}
                style={{
                  background: '#22222c',
                  border: '1px solid #2a2a35',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpanded(p => ({ ...p, [i]: !p[i] }))}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: '#9b9ba4',
                    padding: '12px 16px',
                    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                    fontSize: 11,
                    letterSpacing: 1.2,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  aria-expanded={open}
                >
                  <span>
                    {s.type.toUpperCase()} • {s.channel}
                  </span>
                  <span style={{ color: '#f04a4d' }}>{open ? '–' : '+'}</span>
                </button>
                {open && (
                  <div
                    style={{
                      borderTop: '1px solid #2a2a35',
                      padding: '14px 16px',
                      fontFamily: '"DM Sans", system-ui, sans-serif',
                      fontSize: 13,
                      color: '#f4f4f6',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {s.template}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

function SearchIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx={5} cy={5} r={3.5} stroke="#f04a4d" strokeWidth={1.2} />
      <line x1={7.7} y1={7.7} x2={11} y2={11} stroke="#f04a4d" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  )
}

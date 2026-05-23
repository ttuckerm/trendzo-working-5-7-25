'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { LeadsBlock } from '@/types/assessment'

interface Props {
  leads: LeadsBlock
  sprintCompletedCount: number
  reducedMotion: boolean
  delayMs: number
}

type OutreachState = 'cold' | 'warming' | 'active'
const STATE_ORDER: readonly OutreachState[] = ['cold', 'warming', 'active']

const STATE_LABELS: Record<OutreachState, string> = {
  cold: 'COLD',
  warming: 'WARMING',
  active: 'ACTIVE',
}

const STATE_SUBS: Record<OutreachState, string> = {
  cold: 'No replies yet',
  warming: 'Replies coming in',
  active: 'Closing deals',
}

const ADVANCE_TRIGGER: Record<OutreachState, string> = {
  cold: 'Send your first 5 DMs · Wait for 3+ replies',
  warming: 'First paid close → State advances to Active',
  active: 'System matures past 30 leads → Tracking gap emerges',
}

// Per-state palette — one identity color per state, with derived variants
// (active glow, completed dim-fill/border, completed label, CURRENT ribbon
// shadow, highlighted card border + inset glow). Single source of truth so
// the track and the comparison cards stay visually in lock-step.
interface StatePalette {
  base: string          // solid hex — used for active circle bg + label
  glow: string          // rgba 70% — active circle outer box-shadow
  dimFill: string       // rgba 45% — complete circle background
  dimBorder: string     // rgba 55% — complete circle border + highlighted card border
  labelComplete: string // rgba 65% — complete-state label color
  ribbonShadow: string  // rgba 45% — CURRENT ribbon drop shadow
  cardInset: string     // rgba 10% — highlighted card inset glow
}

const STATE_PALETTE: Record<OutreachState, StatePalette> = {
  cold: {
    base: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.7)',
    dimFill: 'rgba(59, 130, 246, 0.45)',
    dimBorder: 'rgba(59, 130, 246, 0.55)',
    labelComplete: 'rgba(59, 130, 246, 0.65)',
    ribbonShadow: 'rgba(59, 130, 246, 0.45)',
    cardInset: 'rgba(59, 130, 246, 0.10)',
  },
  warming: {
    base: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.7)',
    dimFill: 'rgba(251, 191, 36, 0.45)',
    dimBorder: 'rgba(251, 191, 36, 0.55)',
    labelComplete: 'rgba(251, 191, 36, 0.65)',
    ribbonShadow: 'rgba(251, 191, 36, 0.45)',
    cardInset: 'rgba(251, 191, 36, 0.10)',
  },
  active: {
    base: '#f04a4d',
    glow: 'rgba(240, 74, 77, 0.7)',
    dimFill: 'rgba(240, 74, 77, 0.45)',
    dimBorder: 'rgba(240, 74, 77, 0.55)',
    labelComplete: 'rgba(240, 74, 77, 0.65)',
    ribbonShadow: 'rgba(240, 74, 77, 0.45)',
    cardInset: 'rgba(240, 74, 77, 0.10)',
  },
}

interface ComparisonCardCopy {
  badge: string
  name: string
  description: string
  triggers: string
  exits: string
}

// Hardcoded scaffold copy — describes what each state MEANS, not what content
// the playbook contains in that state. Real per-state playbook content is a
// future generator concern; today we only own the framing.
const COMPARISON_COPY: Record<OutreachState, ComparisonCardCopy> = {
  cold: {
    badge: 'STATE 01',
    name: 'Cold',
    description:
      'No outreach sent yet. The goal: get the first 5 conversations started using your warm network.',
    triggers: 'Day 0',
    exits: '3+ replies received',
  },
  warming: {
    badge: 'STATE 02',
    name: 'Warming',
    description:
      'Replies are coming back. Scripts shift to discovery and follow-up. Calls get booked.',
    triggers: 'Days 1-5',
    exits: 'First paid close',
  },
  active: {
    badge: 'STATE 03',
    name: 'Active',
    description:
      'First paid customer closed. Scripts shift to qualification and referral. Volume requires real tracking.',
    triggers: 'Days 6+',
    exits: '30+ leads tracked',
  },
}

function deriveOutreachState(count: number): OutreachState {
  if (count === 0) return 'cold'
  if (count <= 5) return 'warming'
  return 'active'
}

type NodeState = 'complete' | 'active' | 'future'

function nodeStateFor(
  thisState: OutreachState,
  currentState: OutreachState,
): NodeState {
  const thisIdx = STATE_ORDER.indexOf(thisState)
  const currentIdx = STATE_ORDER.indexOf(currentState)
  if (thisIdx < currentIdx) return 'complete'
  if (thisIdx === currentIdx) return 'active'
  return 'future'
}

function connectorStateFor(
  idx: 0 | 1,
  currentState: OutreachState,
): NodeState {
  // idx 0 = between cold & warming, idx 1 = between warming & active.
  // "complete" once the user is at or past the node to the right of the
  // connector — anything to its right of currentIdx is still future.
  const currentIdx = STATE_ORDER.indexOf(currentState)
  return idx < currentIdx ? 'complete' : 'future'
}

export function LeadsPanel({
  leads,
  sprintCompletedCount,
  reducedMotion,
  delayMs,
}: Props) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true, 1: false })
  const currentState: OutreachState = deriveOutreachState(sprintCompletedCount)

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
        minWidth: 0,
      }}
    >
      <LeadsStateTrack
        currentState={currentState}
        reducedMotion={reducedMotion}
      />

      <div
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 11,
          color: '#5b5b63',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}
      >
        STATE: {STATE_LABELS[currentState]}
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

      <LeadsStateComparison currentState={currentState} />
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

// ─── State track ────────────────────────────────────────────────────────────
// Three nodes connected by two segments, plus an "ADVANCES ON" trigger box.
// Pure display indicator — no interaction. Reduced-motion is respected via
// instrument.css's @media rule (it silences .pulse-medium globally).

function LeadsStateTrack({
  currentState,
  reducedMotion,
}: {
  currentState: OutreachState
  reducedMotion: boolean
}) {
  return (
    <div className="leads-state-track">
      <div className="leads-state-track-row">
        <div className="leads-state-track-grid">
          {/* Row 1: circles + connectors */}
          <StateCircle
            thisState="cold"
            state={nodeStateFor('cold', currentState)}
            reducedMotion={reducedMotion}
          />
          <StateConnector
            toState="warming"
            state={connectorStateFor(0, currentState)}
          />
          <StateCircle
            thisState="warming"
            state={nodeStateFor('warming', currentState)}
            reducedMotion={reducedMotion}
          />
          <StateConnector
            toState="active"
            state={connectorStateFor(1, currentState)}
          />
          <StateCircle
            thisState="active"
            state={nodeStateFor('active', currentState)}
            reducedMotion={reducedMotion}
          />

          {/* Row 2: state labels (centered under each circle) */}
          <StateLabel
            thisState="cold"
            state={nodeStateFor('cold', currentState)}
          >
            {STATE_LABELS.cold}
          </StateLabel>
          <span aria-hidden />
          <StateLabel
            thisState="warming"
            state={nodeStateFor('warming', currentState)}
          >
            {STATE_LABELS.warming}
          </StateLabel>
          <span aria-hidden />
          <StateLabel
            thisState="active"
            state={nodeStateFor('active', currentState)}
          >
            {STATE_LABELS.active}
          </StateLabel>

          {/* Row 3: sub-labels */}
          <StateSubLabel>{STATE_SUBS.cold}</StateSubLabel>
          <span aria-hidden />
          <StateSubLabel>{STATE_SUBS.warming}</StateSubLabel>
          <span aria-hidden />
          <StateSubLabel>{STATE_SUBS.active}</StateSubLabel>
        </div>

        <div className="leads-state-advance">
          <div
            style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 9,
              color: '#6b6b78',
              letterSpacing: 1.5,
              marginBottom: 4,
            }}
          >
            ADVANCES ON
          </div>
          <div
            style={{
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 12,
              color: '#f4f4f6',
              lineHeight: 1.5,
            }}
          >
            {ADVANCE_TRIGGER[currentState]}
          </div>
        </div>
      </div>

      <style>{`
        .leads-state-track-row {
          display: flex;
          align-items: stretch;
          gap: 20px;
          min-width: 0;
        }
        .leads-state-track-grid {
          flex: 1 1 auto;
          min-width: 0;
          display: grid;
          grid-template-columns: auto 1fr auto 1fr auto;
          grid-template-rows: auto auto auto;
          align-items: center;
          justify-items: center;
          row-gap: 8px;
          padding: 4px 4px 0;
        }
        .leads-state-advance {
          flex: 0 0 auto;
          max-width: 240px;
          padding: 12px 14px;
          background: #14141c;
          border: 1px solid #2a2a35;
          border-radius: 10px;
          align-self: center;
          min-width: 0;
        }
        @media (max-width: 639px) {
          .leads-state-track-row {
            flex-direction: column;
            gap: 14px;
          }
          .leads-state-advance {
            max-width: none;
            align-self: stretch;
          }
        }
      `}</style>
    </div>
  )
}

function StateCircle({
  thisState,
  state,
  reducedMotion,
}: {
  thisState: OutreachState
  state: NodeState
  reducedMotion: boolean
}) {
  const palette = STATE_PALETTE[thisState]
  const base: CSSProperties = {
    width: 16,
    height: 16,
    borderRadius: 999,
    flexShrink: 0,
  }
  let stateStyle: CSSProperties
  let className = ''
  if (state === 'active') {
    stateStyle = {
      background: palette.base,
      border: `1px solid ${palette.base}`,
      boxShadow: `0 0 0 4px rgba(8, 8, 13, 1), 0 0 16px ${palette.glow}`,
    }
    if (!reducedMotion) className = 'pulse-medium'
  } else if (state === 'complete') {
    stateStyle = {
      background: palette.dimFill,
      border: `1px solid ${palette.dimBorder}`,
      boxShadow: '0 0 0 4px rgba(8, 8, 13, 1)',
    }
  } else {
    stateStyle = {
      background: 'transparent',
      border: '1px solid #3a3a47',
      boxShadow: '0 0 0 4px rgba(8, 8, 13, 1)',
    }
  }

  return (
    <span
      aria-hidden
      className={className}
      style={{ ...base, ...stateStyle }}
    />
  )
}

function StateConnector({
  toState,
  state,
}: {
  toState: OutreachState
  state: NodeState
}) {
  // A complete connector lights up in the color of the state it leads INTO —
  // so the trail visually "reaches" the current state in the same color you
  // see in that state's circle and label.
  const palette = STATE_PALETTE[toState]
  const background =
    state === 'future'
      ? '#2a2a35'
      : state === 'complete'
      ? palette.base
      : palette.dimBorder

  return (
    <span
      aria-hidden
      style={{
        width: '100%',
        height: 2,
        background,
        alignSelf: 'center',
        margin: '0 4px',
      }}
    />
  )
}

function StateLabel({
  thisState,
  state,
  children,
}: {
  thisState: OutreachState
  state: NodeState
  children: React.ReactNode
}) {
  const palette = STATE_PALETTE[thisState]
  const color =
    state === 'active'
      ? palette.base
      : state === 'complete'
      ? palette.labelComplete
      : '#6b6b78'
  return (
    <span
      style={{
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        fontSize: 11,
        color,
        letterSpacing: 1.6,
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function StateSubLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: '"DM Sans", system-ui, sans-serif',
        fontSize: 10,
        color: '#6b6b78',
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

// ─── Comparison section ─────────────────────────────────────────────────────
// "How the playbook evolves" — three side-by-side cards. The current state's
// card gets a crimson border + "CURRENT" ribbon. All copy is hardcoded scaffold
// (describes what the state means, not what the playbook content is).

function LeadsStateComparison({ currentState }: { currentState: OutreachState }) {
  return (
    <div
      style={{
        paddingTop: 22,
        borderTop: '1px solid rgba(240, 74, 77, 0.18)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 11,
          color: '#5b5b63',
          letterSpacing: 1.6,
          textAlign: 'center',
        }}
      >
        — HOW THE PLAYBOOK EVOLVES —
      </div>

      <div className="leads-comparison-grid">
        {STATE_ORDER.map(s => (
          <ComparisonCard
            key={s}
            state={s}
            copy={COMPARISON_COPY[s]}
            isCurrent={s === currentState}
          />
        ))}
      </div>

      <style>{`
        .leads-comparison-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 639px) {
          .leads-comparison-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

function ComparisonCard({
  state,
  copy,
  isCurrent,
}: {
  state: OutreachState
  copy: ComparisonCardCopy
  isCurrent: boolean
}) {
  // Each card represents a fixed state; the highlight uses that state's
  // palette so Cold's CURRENT ribbon is blue, Warming's is amber, Active's
  // is crimson — matching the track above.
  const palette = STATE_PALETTE[state]
  return (
    <div
      style={{
        position: 'relative',
        background: '#14141c',
        border: isCurrent
          ? `1px solid ${palette.dimBorder}`
          : '1px solid #2a2a35',
        borderRadius: 12,
        padding: '14px 16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 0,
        boxShadow: isCurrent ? `inset 0 0 14px ${palette.cardInset}` : 'none',
      }}
    >
      {isCurrent && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -8,
            right: 12,
            background: palette.base,
            color: '#08080d',
            padding: '2px 8px',
            borderRadius: 999,
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.4,
            boxShadow: `0 0 12px ${palette.ribbonShadow}`,
          }}
        >
          CURRENT
        </span>
      )}

      <div
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 9,
          color: '#6b6b78',
          letterSpacing: 1.5,
        }}
      >
        {copy.badge}
      </div>

      <div
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: 20,
          fontWeight: 600,
          color: '#f4f4f6',
          lineHeight: 1.1,
        }}
      >
        {copy.name}
      </div>

      <div
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 12.5,
          color: '#c5c5cc',
          lineHeight: 1.55,
        }}
      >
        {copy.description}
      </div>

      <div
        style={{
          marginTop: 4,
          paddingTop: 8,
          borderTop: '1px dashed #2a2a35',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 9,
          color: '#6b6b78',
          letterSpacing: 0.6,
        }}
      >
        <div>Triggers: {copy.triggers}</div>
        <div>Exits: {copy.exits}</div>
      </div>
    </div>
  )
}

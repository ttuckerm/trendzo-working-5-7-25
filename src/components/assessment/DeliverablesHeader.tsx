'use client'

import { motion } from 'framer-motion'
import { useCallback } from 'react'
import { Chassis } from './Chassis'

interface Props {
  firstName: string
  reducedMotion: boolean
  delayMs: number
}

interface JumpItem {
  label: string
  sysPath: string
  targetId: string
}

const ITEMS: JumpItem[] = [
  { label: 'Your Freedom Number',          sysPath: 'SYS://FREEDOM_NUMBER',  targetId: 'freedom-number-ring' },
  { label: 'Your Business Match',          sysPath: 'SYS://BUSINESS_MATCH',  targetId: 'business-match' },
  { label: 'Your 14-Day Sprint',           sysPath: 'SPRINT://14_DAY',       targetId: 'sprint-grid' },
  { label: 'Your 90-Day Roadmap',          sysPath: 'SYS://90_DAY_ROADMAP',  targetId: 'roadmap' },
  { label: 'Your Lead Generation Playbook',sysPath: 'SYS://LEADS_PLAYBOOK',  targetId: 'leads' },
]

function pulseTarget(targetId: string) {
  if (typeof document === 'undefined') return
  const el = document.getElementById(targetId)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  // Trigger a brief pulse via a data attribute the global style hook below picks up.
  el.setAttribute('data-flash', 'true')
  window.setTimeout(() => el.removeAttribute('data-flash'), 700)
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function DeliverablesHeader({ firstName, reducedMotion, delayMs }: Props) {
  const onClick = useCallback((targetId: string) => {
    return () => pulseTarget(targetId)
  }, [])

  return (
    <Chassis
      intensity="subtle"
      statusLabel="SYS://OVERVIEW"
      status="active"
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
      style={{
        background: '#1c1c24',
        border: '1px solid #22222c',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 28,
          fontWeight: 700,
          color: '#f4f4f6',
          lineHeight: 1.2,
          margin: 0,
          textShadow: '0 0 12px rgba(240, 74, 77, 0.18)',
        }}
      >
        Your Escape Assessment is ready, {firstName}.
      </h1>

      <p
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 14,
          color: '#9b9ba4',
          marginTop: 6,
          marginBottom: 16,
        }}
      >
        Here&apos;s what you got. Each item is below — click to jump.
      </p>

      <div className="deliverables-grid">
        {ITEMS.map(item => (
          <button
            type="button"
            key={item.targetId}
            onClick={onClick(item.targetId)}
            className="deliverables-jump"
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 2,
              background: 'rgba(34, 34, 44, 0.55)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: '1px solid rgba(240, 74, 77, 0.18)',
              borderLeft: '3px solid rgba(240, 74, 77, 0.35)',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#f4f4f6',
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition:
                'border-color 160ms ease, background 160ms ease, box-shadow 160ms ease',
              textAlign: 'left',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ color: '#f04a4d', display: 'inline-flex' }}>
                <CheckIcon />
              </span>
              {item.label}
            </span>
            <span
              style={{
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 9,
                color: '#5b5b63',
                letterSpacing: 1.2,
                marginLeft: 22,
              }}
            >
              {item.sysPath}
            </span>
          </button>
        ))}
      </div>

      <style>{`
        .deliverables-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .deliverables-jump:hover {
          border-color: #f04a4d !important;
          border-left-color: #f04a4d !important;
          background: rgba(42, 42, 53, 0.7) !important;
          box-shadow: 0 0 12px rgba(240, 74, 77, 0.25) !important;
        }
        .deliverables-jump:focus-visible {
          outline: 2px solid #f04a4d;
          outline-offset: 2px;
        }
        @media (max-width: 767px) {
          .deliverables-grid { flex-direction: column; }
          .deliverables-jump { width: 100%; }
        }
        [data-flash="true"] {
          animation: hudFlash 800ms ease-out;
        }
        @keyframes hudFlash {
          0%   { box-shadow: 0 0 0 0 rgba(240, 74, 77, 0.0); }
          25%  { box-shadow: 0 0 0 3px rgba(240, 74, 77, 0.65), 0 0 36px rgba(240, 74, 77, 0.45); }
          100% { box-shadow: 0 0 0 0 rgba(240, 74, 77, 0.0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-flash="true"] { animation: none; }
        }
      `}</style>
    </motion.div>
    </Chassis>
  )
}

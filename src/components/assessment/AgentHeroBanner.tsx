'use client'

// Hero entry-point banner for the Freedom Agent. Sits between the OVERVIEW
// (DeliverablesHeader) and the OPERATOR / FREEDOM_NUMBER row, lifting the
// Agent from a buried mention to a first-class touchpoint.
//
// Clicking anywhere on the banner smooth-scrolls to the AgentRail at the
// bottom of the page (#freedom-agent-rail) and dispatches a
// `assessment:agent-focus` window event. We do NOT change AgentRail's
// behavior — if no listener picks the event up, it's a no-op.

import { motion } from 'framer-motion'
import { useCallback } from 'react'
import { Chassis } from './Chassis'
import { AgentIdentityGlyph } from './AgentIdentityGlyph'

interface Props {
  reducedMotion: boolean
  delayMs: number
  // Optional name slot — reserved for a future personalized copy variant.
  // Intentionally unread today so v1 ships the generic line.
  operatorName?: string
}

export function AgentHeroBanner({ reducedMotion, delayMs }: Props) {
  const onActivate = useCallback(() => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('freedom-agent-rail')
      if (el) {
        el.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'center',
        })
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('assessment:agent-focus'))
    }
  }, [reducedMotion])

  return (
    <Chassis
      id="freedom-agent-banner"
      intensity="standard"
      statusLabel="SYS://FREEDOM_AGENT — READY"
      status="active"
      innerGlow
    >
      <motion.div
        role="button"
        tabIndex={0}
        aria-label="Open Freedom Agent"
        onClick={onActivate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onActivate()
          }
        }}
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.35, delay: delayMs / 1000, ease: 'easeOut' }
        }
        className="agent-hero-banner"
        style={{
          // Subtle crimson wash over the standard panel surface. With the
          // Chassis's gray corner brackets sitting outside the surface, the
          // 1px crimson inner border traces the surface edge cleanly and
          // doesn't visually compete (see DeliverablesHeader / others — same
          // bracket-outside + inner-border-on-surface pattern).
          background:
            'linear-gradient(180deg, rgba(240, 74, 77, 0.04) 0%, rgba(240, 74, 77, 0.02) 100%), #1c1c24',
          border: '1px solid rgba(240, 74, 77, 0.18)',
          borderRadius: 12,
          padding: '20px 24px',
          minWidth: 0,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: 24,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {/* Left: orb — reuses the rail's identity glyph so the visual
            language is identical at both touchpoints. */}
        <div
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AgentIdentityGlyph
            size={52}
            active
            reducedMotion={reducedMotion}
          />
        </div>

        {/* Center: status eyebrow + invitation line */}
        <div
          style={{
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 11,
              color: '#5b5b63',
              letterSpacing: 1.4,
              textTransform: 'uppercase',
            }}
          >
            SYS://FREEDOM_AGENT — READY
          </div>
          <div
            style={{
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 16,
              color: '#e8e8ec',
              lineHeight: 1.5,
            }}
          >
            Your advisor read the whole assessment. Ask it anything — about
            your sprint, your pricing, your niche, your next move.
          </div>
        </div>

        {/* Right: CTA. The whole banner is clickable, but the button keeps
            an obvious visible target. stopPropagation prevents the bubble
            from double-firing the outer handler. */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onActivate()
          }}
          onKeyDown={(e) => {
            // Swallow Enter/Space on the button so the outer motion.div's
            // keyhandler doesn't also fire.
            if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
          }}
          className="agent-hero-banner-cta"
          aria-label="Open Freedom Agent"
          style={{
            background: 'transparent',
            border: '1px solid rgba(240, 74, 77, 0.55)',
            color: '#f04a4d',
            padding: '12px 20px',
            borderRadius: 8,
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'background 0.15s ease, box-shadow 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          OPEN ADVISOR →
        </button>

        <style>{`
          .agent-hero-banner:focus-visible {
            outline: 2px solid #f04a4d;
            outline-offset: 3px;
          }
          .agent-hero-banner-cta:hover {
            background: rgba(240, 74, 77, 0.08) !important;
            box-shadow: 0 0 14px rgba(240, 74, 77, 0.22);
          }
          .agent-hero-banner-cta:focus-visible {
            outline: 2px solid #f04a4d;
            outline-offset: 2px;
          }
          @media (max-width: 767px) {
            .agent-hero-banner {
              grid-template-columns: 1fr !important;
              gap: 16px !important;
            }
            .agent-hero-banner-cta {
              width: 100%;
            }
          }
        `}</style>
      </motion.div>
    </Chassis>
  )
}

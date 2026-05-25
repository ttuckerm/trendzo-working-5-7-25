'use client'

// Hero entry-point banner for the Freedom Agent. Sits between the OVERVIEW
// (DeliverablesHeader) and the OPERATOR / FREEDOM_NUMBER row.
//
// Visually distinct from the surrounding HUD panels by design: this is the
// advisor introducing itself (a character), not another framed data section.
// No Chassis wrapper, no corner brackets, no status eyebrow — a centered,
// recessed crimson pill with the orb bleeding past its left edge.
//
// Clicking anywhere on the banner dispatches `assessment:agent-focus`, which
// AgentRail listens for and uses to expand into the chat input. The rail is
// `position: fixed`, so no scroll is needed (or possible).

import { motion } from 'framer-motion'
import { useCallback } from 'react'
import { AgentIdentityGlyph } from './AgentIdentityGlyph'

interface Props {
  reducedMotion: boolean
  delayMs: number
  // Reserved for a future personalized copy variant. Intentionally unread
  // today so v1 ships the generic line.
  operatorName?: string
}

export function AgentHeroBanner({ reducedMotion, delayMs }: Props) {
  const onActivate = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('assessment:agent-focus'))
    }
  }, [])

  return (
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
      className="agent-hero-banner chassis-glow-soft"
      style={{
        position: 'relative',
        // Centered in the span-12 cell with breathing room on each side.
        maxWidth: 760,
        margin: '0 auto',
        // Recessed crimson well: deeper than the #1c1c24 panels around it,
        // with a radial glow emanating from the left where the orb sits.
        background:
          'radial-gradient(120% 100% at 14% 50%, rgba(240, 74, 77, 0.22) 0%, rgba(240, 74, 77, 0.08) 30%, transparent 62%), #0a0a10',
        border: '1px solid rgba(240, 74, 77, 0.28)',
        borderRadius: 999,
        // Left padding reserves space for the absolutely-positioned orb.
        padding: '18px 28px 18px 100px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: 20,
        cursor: 'pointer',
        // Lets the orb halo bleed past the container's left edge.
        overflow: 'visible',
        outline: 'none',
      }}
    >
      {/* Orb — absolutely positioned, bleeds 14px past the container's left
          edge so it visually emits the banner rather than sitting inside it.
          The 110px halo wrapper carries a soft radial glow behind the 72px
          glyph. pointer-events: none keeps clicks falling through to the
          banner body. */}
      <div
        className="agent-hero-banner-orb"
        style={{
          position: 'absolute',
          left: -14,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 110,
          height: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle, rgba(240, 74, 77, 0.42) 0%, rgba(240, 74, 77, 0.14) 38%, transparent 70%)',
          pointerEvents: 'none',
        }}
      >
        <AgentIdentityGlyph
          size={72}
          active
          reducedMotion={reducedMotion}
        />
      </div>

      {/* Body line — no eyebrow. The orb + this sentence are enough. */}
      <div
        className="agent-hero-banner-body"
        style={{
          minWidth: 0,
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 16,
          lineHeight: 1.55,
          color: '#e8e8ec',
        }}
      >
        Your advisor read the whole assessment. Ask it anything — about
        your sprint, your pricing, your niche, your next move.
      </div>

      {/* CTA — pill matching the container. Outlined by default; on hover
          fills with a soft crimson + glow so it feels like the action of
          the banner. stopPropagation prevents the outer click from
          double-firing onActivate. */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onActivate()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
        }}
        className="agent-hero-banner-cta"
        aria-label="Open Freedom Agent"
        style={{
          background: 'transparent',
          border: '1px solid rgba(240, 74, 77, 0.6)',
          color: '#f04a4d',
          padding: '11px 22px',
          borderRadius: 999,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition:
            'background 0.18s ease, box-shadow 0.18s ease, color 0.18s ease',
          whiteSpace: 'nowrap',
        }}
      >
        OPEN ADVISOR →
      </button>

      <style>{`
        .agent-hero-banner:focus-visible {
          outline: 2px solid #f04a4d;
          outline-offset: 4px;
        }
        .agent-hero-banner-cta:hover {
          background: rgba(240, 74, 77, 0.18) !important;
          box-shadow: 0 0 18px rgba(240, 74, 77, 0.35);
          color: #ff8a8c !important;
        }
        .agent-hero-banner-cta:focus-visible {
          outline: 2px solid #f04a4d;
          outline-offset: 2px;
        }
        @media (max-width: 767px) {
          .agent-hero-banner {
            grid-template-columns: 1fr !important;
            padding: 28px 24px !important;
            border-radius: 28px !important;
            gap: 16px !important;
            background:
              radial-gradient(70% 50% at 50% 14%, rgba(240, 74, 77, 0.25) 0%, rgba(240, 74, 77, 0.08) 40%, transparent 70%),
              #0a0a10 !important;
            text-align: center;
          }
          .agent-hero-banner-orb {
            position: static !important;
            transform: none !important;
            left: auto !important;
            top: auto !important;
            margin: 0 auto !important;
            justify-self: center;
          }
          .agent-hero-banner-cta {
            width: 100%;
          }
        }
      `}</style>
    </motion.div>
  )
}

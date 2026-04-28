'use client'

import { motion } from 'framer-motion'
import type { BusinessMatch } from '@/types/assessment'

interface Props {
  businessMatch: BusinessMatch
  monthlyTarget: number
  reducedMotion: boolean
  delayMs: number
}

const currency0 = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(n))

function cadenceSuffix(c: BusinessMatch['firstOffer']['cadence']): string {
  if (c === 'monthly') return '/month'
  if (c === 'weekly') return '/week'
  return ' one-time'
}

export function BusinessMatchPanel({
  businessMatch,
  monthlyTarget,
  reducedMotion,
  delayMs,
}: Props) {
  const offer = businessMatch.firstOffer
  const ptf = businessMatch.pathToFreedom

  // Render whatever rationale array contains; warn (not throw) if it's not 3.
  const rationale = Array.isArray(businessMatch.rationale)
    ? businessMatch.rationale
    : []
  if (rationale.length !== 3) {
    // eslint-disable-next-line no-console
    console.warn(
      `[BusinessMatchPanel] expected 3 rationale lines, got ${rationale.length}`,
    )
  }

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
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 32,
      }}
      className="bm-panel"
    >
      <div>
        <div
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            color: '#5b5b63',
            letterSpacing: 1.4,
            marginBottom: 8,
          }}
        >
          RECOMMENDED PATH
        </div>
        <div
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 24,
            color: '#f4f4f6',
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: 20,
          }}
        >
          {businessMatch.businessName}
        </div>

        <div
          style={{
            background: '#22222c',
            border: '1px solid #2a2a35',
            borderRadius: 10,
            padding: 20,
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 11,
              color: '#5b5b63',
              letterSpacing: 1.2,
              marginBottom: 6,
            }}
          >
            FIRST OFFER
          </div>
          <div
            style={{
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 18,
              color: '#f4f4f6',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {offer.name}
          </div>
          <div
            style={{
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 16,
              color: '#f04a4d',
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            {currency0(offer.price)}
            <span style={{ color: '#9b9ba4', fontWeight: 400, fontSize: 14 }}>
              {cadenceSuffix(offer.cadence)}
            </span>
          </div>
          <div
            style={{
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 13,
              color: '#9b9ba4',
              lineHeight: 1.6,
            }}
          >
            {offer.description}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
            WHY THIS FITS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rationale.map((line, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 14,
                  color: '#f4f4f6',
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: '#f04a4d', fontWeight: 700 }}>›</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: '#22222c',
            border: '1px solid #2a2a35',
            borderRadius: 10,
            padding: 16,
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 11,
              color: '#5b5b63',
              letterSpacing: 1.4,
              marginBottom: 8,
            }}
          >
            PATH TO FREEDOM
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 14,
              color: '#f4f4f6',
            }}
          >
            {ptf.subscribersNeeded} subscribers × {currency0(ptf.revenuePerSubscriber)}/mo ={' '}
            <span style={{ color: '#f04a4d', fontWeight: 600 }}>
              {currency0(monthlyTarget)}/mo
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .bm-panel { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </motion.div>
  )
}

'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { FreedomNumber } from '@/types/assessment'
import { HolographicRing } from './HolographicRing'

interface Props {
  freedomNumber: FreedomNumber
  reducedMotion: boolean
  delayMs: number
}

const RING_SIZE = 280
const STROKE = 4
const RADIUS = (RING_SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const MAX_MULTIPLIER = 3 // payload constraint: freedomMultiplier ∈ [1, 3]

const currency0 = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(n))

function confidenceColor(conf: FreedomNumber['confidence']): string {
  // Muted to fit the palette; semantic but not loud.
  if (conf === 'HIGH') return '#3aa67a'
  if (conf === 'MEDIUM') return '#c08a3a'
  return '#9b3a3a'
}

export function FreedomNumberRing({ freedomNumber, reducedMotion, delayMs }: Props) {
  const fillRatio = Math.min(1, Math.max(0, freedomNumber.multiplier / MAX_MULTIPLIER))
  const targetOffset = CIRCUMFERENCE * (1 - fillRatio)

  const target = freedomNumber.monthlyTarget

  // Count-up — spring from 0 to target over ~800ms after the arc starts drawing.
  const mv = useMotionValue(reducedMotion ? target : 0)
  const spring = useSpring(mv, { stiffness: 70, damping: 22 })
  const display = useTransform(spring, (v) => currency0(v))

  const [resolvedDisplay, setResolvedDisplay] = useState<string>(currency0(reducedMotion ? target : 0))
  useEffect(() => {
    const unsub = display.on('change', (v) => setResolvedDisplay(v))
    return () => unsub()
  }, [display])

  useEffect(() => {
    if (reducedMotion) {
      mv.set(target)
      return
    }
    const t = window.setTimeout(() => mv.set(target), delayMs)
    return () => window.clearTimeout(t)
  }, [mv, target, delayMs, reducedMotion])

  const cColor = confidenceColor(freedomNumber.confidence)

  return (
    <motion.div
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
        padding: 28,
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 11,
          letterSpacing: 1.2,
          padding: '4px 10px',
          borderRadius: 999,
          color: cColor,
          border: `1px solid ${cColor}`,
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        {freedomNumber.confidence}
      </div>

      <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE }}>
        <HolographicRing size={RING_SIZE} reducedMotion={reducedMotion} />
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          style={{ display: 'block', position: 'relative', zIndex: 1 }}
        >
          {/* background ring */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="#22222c"
            strokeWidth={STROKE}
            fill="none"
          />
          {/* arc */}
          <motion.circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="#f04a4d"
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={
              reducedMotion
                ? { strokeDashoffset: targetOffset }
                : { strokeDashoffset: CIRCUMFERENCE }
            }
            animate={{ strokeDashoffset: targetOffset }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.8, delay: delayMs / 1000, ease: 'easeOut' }
            }
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 64,
              color: '#f04a4d',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {resolvedDisplay}
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: 13,
              color: '#5b5b63',
              letterSpacing: 1.5,
            }}
          >
            MONTHLY FREEDOM NUMBER
          </div>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        <Stat label="MULTIPLIER" value={`${freedomNumber.multiplier}×`} />
        <Stat label="RUNWAY" value={`${Math.round(freedomNumber.runwayMonths)} mo`} />
        <Stat label="TIMELINE" value={freedomNumber.timelineMonths} />
      </div>
    </motion.div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 11,
          color: '#5b5b63',
          letterSpacing: 1.2,
          marginBottom: 4,
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

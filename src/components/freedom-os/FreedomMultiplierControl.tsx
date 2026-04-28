'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  monthlyExpenses: number
  multiplier: number
  onChange: (value: number) => void
}

const TWEEN_MS = 300

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

export function FreedomMultiplierControl({
  monthlyExpenses,
  multiplier,
  onChange,
}: Props) {
  const targetValue =
    monthlyExpenses > 0 ? monthlyExpenses * multiplier : null

  const [displayValue, setDisplayValue] = useState<number>(targetValue ?? 0)
  const fromRef = useRef<number>(targetValue ?? 0)
  const startRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (targetValue === null) {
      // No expenses entered — nothing to tween.
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      setDisplayValue(targetValue)
      return
    }

    fromRef.current = displayValue
    startRef.current = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startRef.current
      const t = Math.min(1, elapsed / TWEEN_MS)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      const next = fromRef.current + (targetValue - fromRef.current) * eased
      setDisplayValue(next)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
      }
    }

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    // We intentionally exclude displayValue from deps — including it would
    // restart the tween every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetValue])

  const hasReadout = targetValue !== null
  const readoutLabel = hasReadout ? formatCurrency(displayValue) : '$ — — —'

  return (
    <div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 13,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        FREEDOM MULTIPLIER
      </div>

      <p
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 14,
          color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.5,
          marginBottom: 16,
        }}
      >
        How much above your monthly expenses do you want to earn? 1.5× = 50%
        more than expenses (a real margin). 2× = double your expenses (real
        freedom). The slider moves your Freedom Number live.
      </p>

      <div style={{ position: 'relative', marginBottom: 8, paddingTop: 22 }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: `calc(${((multiplier - 1.0) / 2.0) * 100}% - 12px)`,
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            color: 'rgba(255,255,255,0.45)',
            transition: 'left 80ms linear',
            minWidth: 36,
            textAlign: 'center',
          }}
        >
          {multiplier.toFixed(1)}×
        </div>
        <input
          type="range"
          min={1.0}
          max={3.0}
          step={0.1}
          value={multiplier}
          onChange={e => onChange(parseFloat(e.target.value))}
          aria-label="Freedom multiplier"
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#e50914]"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 11,
          color: 'rgba(255,255,255,0.35)',
          marginBottom: 18,
        }}
      >
        <span>1.0× — Break-even</span>
        <span>3.0× — Aggressive</span>
      </div>

      <div
        style={{
          textAlign: 'center',
          padding: '14px 12px',
          borderRadius: 12,
          background: 'rgba(229,9,20,0.04)',
          border: '1px solid rgba(229,9,20,0.18)',
          opacity: hasReadout ? 1 : 0.4,
          boxShadow: hasReadout ? '0 0 12px rgba(240, 74, 77, 0.25)' : 'none',
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 36,
            fontWeight: 700,
            color: hasReadout ? '#e50914' : 'rgba(255,255,255,0.35)',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
          }}
        >
          {readoutLabel}
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 11,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          Your Freedom Number (monthly target)
        </div>
      </div>
    </div>
  )
}

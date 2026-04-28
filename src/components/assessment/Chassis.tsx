'use client'

import { forwardRef, type ReactNode, type CSSProperties } from 'react'

export type ChassisIntensity = 'subtle' | 'standard' | 'prominent'
export type ChassisStatus = 'idle' | 'active' | 'complete'

interface ChassisProps {
  children: ReactNode
  intensity?: ChassisIntensity
  statusLabel?: string
  status?: ChassisStatus
  brackets?: boolean
  innerGlow?: boolean
  className?: string
  // Allow passing through an id (for jump-link anchors).
  id?: string
  // Forward arbitrary style overrides (rare — used for Day1Spotlight border tint).
  style?: CSSProperties
  // Allow chassis to expose a flash-LED via data-flash without remounting.
  flash?: boolean
}

const BRACKET_SIZE: Record<ChassisIntensity, number> = {
  subtle: 12,
  standard: 16,
  prominent: 20,
}

const BRACKET_OFFSET: Record<ChassisIntensity, number> = {
  subtle: -4,
  standard: -6,
  prominent: -8,
}

const OUTER_GLOW_CLASS: Record<ChassisIntensity, string> = {
  subtle: '',
  standard: '',
  prominent: 'chassis-glow-soft',
}

const STATUS_LED_COLOR: Record<ChassisStatus, string> = {
  idle: '#3a3a45',
  active: '#f04a4d',
  complete: '#3aa67a',
}

function CornerBracket({
  size,
  offset,
  position,
}: {
  size: number
  offset: number
  position: 'tl' | 'tr' | 'bl' | 'br'
}) {
  // Each L-bracket is two short strokes meeting at the corner.
  const stroke = '#3a3a45'
  const strokeWidth = 1.5
  const half = size

  // Path origin is the corner of the panel; we draw outward.
  const paths: Record<typeof position, string> = {
    tl: `M 0 ${half} L 0 0 L ${half} 0`,
    tr: `M 0 0 L ${half} 0 L ${half} ${half}`,
    bl: `M 0 0 L 0 ${half} L ${half} ${half}`,
    br: `M 0 0 L ${half} 0 L ${half} ${half} M 0 ${half} L ${half} ${half}`,
  }

  const cssPos: CSSProperties = {
    position: 'absolute',
    pointerEvents: 'none',
  }
  if (position === 'tl') Object.assign(cssPos, { top: offset, left: offset })
  if (position === 'tr') Object.assign(cssPos, { top: offset, right: offset })
  if (position === 'bl') Object.assign(cssPos, { bottom: offset, left: offset })
  if (position === 'br') Object.assign(cssPos, { bottom: offset, right: offset })

  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={cssPos}
    >
      <path
        d={paths[position]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

export const Chassis = forwardRef<HTMLDivElement, ChassisProps>(function Chassis(
  {
    children,
    intensity = 'standard',
    statusLabel,
    status = 'active',
    brackets = true,
    innerGlow = false,
    className,
    id,
    style,
    flash,
  },
  ref,
) {
  const size = BRACKET_SIZE[intensity]
  const offset = BRACKET_OFFSET[intensity]
  const ledColor = STATUS_LED_COLOR[status]
  const ledPulse = status === 'active' ? 'pulse-medium' : ''

  return (
    <div
      ref={ref}
      id={id}
      data-flash={flash ? 'true' : undefined}
      className={[
        'chassis-root',
        OUTER_GLOW_CLASS[intensity],
        innerGlow ? 'inner-glow-crimson' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        position: 'relative',
        borderRadius: 12,
        ...(style ?? {}),
      }}
    >
      {brackets && (
        <>
          <CornerBracket size={size} offset={offset} position="tl" />
          <CornerBracket size={size} offset={offset} position="tr" />
          <CornerBracket size={size} offset={offset} position="bl" />
          <CornerBracket size={size} offset={offset} position="br" />
        </>
      )}

      {(statusLabel || status) && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            left: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '2px 8px',
            background: '#08080d',
            borderRadius: 999,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <span
            aria-hidden
            className={ledPulse}
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: 999,
              background: ledColor,
              boxShadow:
                status === 'active'
                  ? '0 0 8px rgba(240, 74, 77, 0.7)'
                  : status === 'complete'
                  ? '0 0 6px rgba(58, 166, 122, 0.6)'
                  : 'none',
            }}
          />
          {statusLabel && (
            <span
              style={{
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 9,
                color: '#5b5b63',
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {statusLabel}
            </span>
          )}
        </div>
      )}

      {children}

      <style>{`
        .chassis-root[data-flash="true"] {
          animation: hudGlowSoftBreath 0.8s ease-out 1;
        }
      `}</style>
    </div>
  )
})

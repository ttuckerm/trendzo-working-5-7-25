'use client'

interface Props {
  size?: number
  active?: boolean
  reducedMotion?: boolean
}

const OUTER_DOTS = 6
const STAGGER_MS_TOTAL = 3200 // total cycle for staggered dot fade

export function AgentIdentityGlyph({
  size = 48,
  active = false,
  reducedMotion = false,
}: Props) {
  const cx = size / 2
  const cy = size / 2
  const outerRadius = size * 0.42
  const triRadius = size * 0.22
  const centerRadius = size * 0.07

  const triPeriod = active ? 4 : 12 // seconds for full rotation
  const ringFade = active ? '0.9s' : '1.6s'

  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        display: 'block',
        filter: active
          ? 'drop-shadow(0 0 12px rgba(240, 74, 77, 0.6))'
          : 'drop-shadow(0 0 6px rgba(240, 74, 77, 0.28))',
      }}
    >
      <defs>
        <radialGradient id="glyph-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff8a8c" />
          <stop offset="60%" stopColor="#f04a4d" />
          <stop offset="100%" stopColor="rgba(240, 74, 77, 0.4)" />
        </radialGradient>
      </defs>

      {/* 6 outer dots in a hexagon, each fades on a staggered cycle */}
      {Array.from({ length: OUTER_DOTS }).map((_, i) => {
        const angle = (i / OUTER_DOTS) * 2 * Math.PI - Math.PI / 2
        const x = cx + Math.cos(angle) * outerRadius
        const y = cy + Math.sin(angle) * outerRadius
        const delay = active
          ? '0s'
          : `${(i * STAGGER_MS_TOTAL) / OUTER_DOTS / 1000}s`
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={size * 0.04}
            fill="#f04a4d"
            style={{
              animation: reducedMotion
                ? 'none'
                : `hudPulseMedium ${ringFade} cubic-bezier(0.4, 0, 0.6, 1) infinite`,
              animationDelay: delay,
            }}
          />
        )
      })}

      {/* Inner rotating triangle */}
      <g
        className="hud-glyph-rotate"
        style={{
          transformOrigin: 'center',
          animation: reducedMotion
            ? 'none'
            : `hudGlyphRotateIdle ${triPeriod}s linear infinite`,
        }}
      >
        <polygon
          points={(() => {
            const pts: string[] = []
            for (let i = 0; i < 3; i++) {
              const a = (i / 3) * 2 * Math.PI - Math.PI / 2
              pts.push(
                `${cx + Math.cos(a) * triRadius},${cy + Math.sin(a) * triRadius}`,
              )
            }
            return pts.join(' ')
          })()}
          stroke="rgba(240, 74, 77, 0.75)"
          strokeWidth={1.2}
          fill="rgba(240, 74, 77, 0.05)"
          strokeLinejoin="round"
        />
      </g>

      {/* Central pulsing dot */}
      <circle
        cx={cx}
        cy={cy}
        r={centerRadius}
        fill="url(#glyph-center)"
        style={{
          transformOrigin: 'center',
          animation: reducedMotion
            ? 'none'
            : 'hudPulseMedium 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      />
    </svg>
  )
}

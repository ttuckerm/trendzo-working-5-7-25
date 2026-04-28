'use client'

interface Props {
  size: number
  reducedMotion: boolean
}

const SPOKE_COUNT = 24
const PARTICLE_RADII_RATIO = [0.42, 0.51, 0.6] as const // proportions of size/2
const PARTICLE_PERIODS = [6, 9, 14] as const // seconds
const SPOKE_PERIOD = 18 // seconds
const CORE_PERIOD = 12 // seconds

export function HolographicRing({ size, reducedMotion }: Props) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2

  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <radialGradient id="holo-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(240, 74, 77, 0.18)" />
          <stop offset="50%" stopColor="rgba(240, 74, 77, 0.04)" />
          <stop offset="100%" stopColor="rgba(240, 74, 77, 0)" />
        </radialGradient>
        <filter id="holo-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Breathing inner core */}
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.42}
        fill="url(#holo-core)"
        style={{
          transformOrigin: 'center',
          animation: reducedMotion
            ? 'none'
            : `hudCoreBreath ${CORE_PERIOD}s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
        }}
      />

      {/* Outer rotating spokes */}
      <g
        className="hud-holo-spokes"
        style={{
          transformOrigin: 'center',
          animation: reducedMotion
            ? 'none'
            : `hudRingSpokeRotate ${SPOKE_PERIOD}s linear infinite`,
        }}
      >
        {Array.from({ length: SPOKE_COUNT }).map((_, i) => {
          const angle = (i / SPOKE_COUNT) * 2 * Math.PI - Math.PI / 2
          const x1 = cx + Math.cos(angle) * (r * 0.94)
          const y1 = cy + Math.sin(angle) * (r * 0.94)
          const x2 = cx + Math.cos(angle) * (r * 0.99)
          const y2 = cy + Math.sin(angle) * (r * 0.99)
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(240, 74, 77, 0.45)"
              strokeWidth={1}
              strokeLinecap="round"
              filter="url(#holo-soft-glow)"
            />
          )
        })}
      </g>

      {/* Three orbiting particles, each at different radii and periods */}
      {PARTICLE_RADII_RATIO.map((ratio, i) => {
        const orbitR = r * ratio
        return (
          <g
            key={i}
            className="hud-holo-particle"
            style={{
              transformOrigin: 'center',
              animation: reducedMotion
                ? 'none'
                : `hudRingSpokeRotate ${PARTICLE_PERIODS[i]}s linear infinite`,
              animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
            }}
          >
            <circle
              cx={cx}
              cy={cy - orbitR}
              r={2}
              fill="#f04a4d"
              filter="url(#holo-soft-glow)"
              opacity={0.85}
            />
            {/* Trail — a faint extra dot a few degrees behind the head */}
            <circle
              cx={cx + Math.sin(-0.18) * orbitR}
              cy={cy - Math.cos(-0.18) * orbitR}
              r={1.2}
              fill="rgba(240, 74, 77, 0.4)"
            />
          </g>
        )
      })}
    </svg>
  )
}

// Skeleton matching the four primary HUD zones. No spinner — feels like the HUD
// is "booting up" with a subtle pulse on neumorphic dark surfaces.

import type { CSSProperties } from 'react'

export default function AssessmentLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#08080d',
        color: '#f4f4f6',
        padding: '32px 24px 152px',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 24,
        }}
      >
        <SkeletonZone style={{ gridColumn: 'span 6', height: 320 }} />
        <SkeletonZone style={{ gridColumn: 'span 6', height: 320 }} />
        <SkeletonZone style={{ gridColumn: 'span 12', height: 240 }} />
        <SkeletonZone style={{ gridColumn: 'span 8', height: 460 }} />
        <SkeletonZone style={{ gridColumn: 'span 4', height: 460 }} />
        <SkeletonZone style={{ gridColumn: 'span 12', height: 220 }} />
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background: '#22222c',
          borderTop: '1px solid #7a2527',
          opacity: 0.85,
        }}
      />

      <style>{`
        @keyframes hudPulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

function SkeletonZone({ style }: { style: CSSProperties }) {
  return (
    <div
      style={{
        background: '#1c1c24',
        border: '1px solid #22222c',
        borderRadius: 12,
        animation: 'hudPulse 1.6s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

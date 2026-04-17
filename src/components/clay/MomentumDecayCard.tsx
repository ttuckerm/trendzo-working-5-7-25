'use client'

import React from 'react'

export interface MomentumDecayData {
  creatorName: string
  creatorId: string
  lastPostDate: string
  daysSincePost: number
  projectedDecayPct: number
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendedAction: string
  estimatedRecoveryDays: number
}

const URGENCY_CONFIG = {
  critical: { label: 'Critical', color: '#e63946', bg: 'rgba(230,57,70,0.1)', pulse: true },
  high: { label: 'High', color: '#e63946', bg: 'rgba(230,57,70,0.1)', pulse: false },
  medium: { label: 'Medium', color: '#f4b942', bg: 'rgba(244,185,66,0.1)', pulse: false },
  low: { label: 'Low', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', pulse: false },
} as const

function decayBarColor(pct: number): string {
  if (pct < 30) return '#2dd4a8'
  if (pct < 60) return '#f4b942'
  return '#e63946'
}

export function MomentumDecayCard({
  data,
  onAction,
}: {
  data: MomentumDecayData
  onAction?: (action: string, payload: unknown) => void
}) {
  const urgency = URGENCY_CONFIG[data.urgencyLevel]
  const isActionable = data.urgencyLevel === 'critical' || data.urgencyLevel === 'high'
  const labelColor = isActionable ? '#e63946' : '#f4b942'

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 12,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: labelColor,
          }}
        >
          Momentum Alert
        </span>
        {/* Urgency badge */}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: urgency.color,
            background: urgency.bg,
            padding: '2px 8px',
            borderRadius: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            animation: urgency.pulse ? 'clayUrgencyPulse 2s ease-in-out infinite' : 'none',
          }}
        >
          {urgency.label}
        </span>
      </div>

      {/* Creator name */}
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20,
          fontWeight: 700,
          color: '#e8e8f0',
          margin: '0 0 14px 0',
          lineHeight: 1.3,
        }}
      >
        {data.creatorName}
      </h3>

      {/* Days since post + last date */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 36,
            fontWeight: 700,
            color: '#e63946',
            lineHeight: 1,
          }}
        >
          {data.daysSincePost}
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
          days since last post
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>
          {data.lastPostDate}
        </span>
      </div>

      {/* Decay bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
            Projected Decay
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: decayBarColor(data.projectedDecayPct) }}>
            {Math.round(data.projectedDecayPct)}%
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: 6,
            borderRadius: 3,
            background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(data.projectedDecayPct, 100)}%`,
              height: '100%',
              borderRadius: 3,
              background: `linear-gradient(90deg, #2dd4a8, ${decayBarColor(data.projectedDecayPct)})`,
              transition: 'width 600ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </div>
      </div>

      {/* Recommended action */}
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.5,
          margin: '0 0 12px 0',
        }}
      >
        {data.recommendedAction}
      </p>

      {/* Recovery estimate + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          Est. recovery: {data.estimatedRecoveryDays}d
        </span>
        <button
          onClick={() => onAction?.(data.creatorId, { type: 'generate-recovery-brief' })}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 500,
            padding: '6px 14px',
            borderRadius: 8,
            cursor: 'pointer',
            border: isActionable ? '1px solid rgba(230,57,70,0.4)' : '1px solid rgba(255,255,255,0.1)',
            color: isActionable ? '#e63946' : 'rgba(255,255,255,0.4)',
            background: isActionable ? 'rgba(230,57,70,0.06)' : 'transparent',
          }}
        >
          Generate recovery brief
        </button>
      </div>

      {/* Urgency pulse animation */}
      <style>{`
        @keyframes clayUrgencyPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

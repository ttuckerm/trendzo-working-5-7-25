'use client'

import React from 'react'

export interface AgencyScorecardData {
  agencyName: string
  period: string
  tier: string
  scores: Array<{ label: string; score: number; maxScore: number; color: string }>
  overallGrade: string
  trend: 'improving' | 'declining' | 'stable'
  topWin: string
  topRisk: string
}

const GRADE_COLORS: Record<string, string> = {
  A: '#2dd4a8',
  B: '#00d4ff',
  C: '#f4b942',
  D: '#e63946',
}

const TREND_CONFIG = {
  improving: { label: 'Improving', symbol: '\u2191', color: '#2dd4a8' },
  declining: { label: 'Declining', symbol: '\u2193', color: '#e63946' },
  stable: { label: 'Stable', symbol: '\u2192', color: 'rgba(255,255,255,0.4)' },
} as const

export function AgencyScorecardCard({ data }: { data: AgencyScorecardData }) {
  const gradeColor = GRADE_COLORS[data.overallGrade.charAt(0).toUpperCase()] || 'rgba(255,255,255,0.4)'
  const trend = TREND_CONFIG[data.trend]

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
            color: '#00d4ff',
          }}
        >
          Agency Scorecard
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: '#7b2ff7',
              background: 'rgba(123,47,247,0.1)',
              padding: '2px 7px',
              borderRadius: 4,
            }}
          >
            {data.tier}
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            {data.period}
          </span>
        </div>
      </div>

      {/* Agency name */}
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20,
          fontWeight: 700,
          color: '#e8e8f0',
          margin: '0 0 16px 0',
          lineHeight: 1.3,
        }}
      >
        {data.agencyName}
      </h3>

      {/* Score rows + Grade side by side */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
        {/* Score bars */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.scores.map((s) => {
            const pct = s.maxScore > 0 ? (s.score / s.maxScore) * 100 : 0
            return (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    {s.label}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    {s.score}/{s.maxScore}
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(pct, 100)}%`,
                      borderRadius: 2,
                      background: s.color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Overall grade */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            minWidth: 64,
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 40,
              fontWeight: 700,
              color: gradeColor,
              lineHeight: 1,
            }}
          >
            {data.overallGrade}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: trend.color,
              marginTop: 4,
            }}
          >
            {trend.symbol} {trend.label}
          </span>
        </div>
      </div>

      {/* Top win + risk */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {data.topWin && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#2dd4a8', lineHeight: 1.4 }}>
            Win: {data.topWin}
          </div>
        )}
        {data.topRisk && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#e63946', lineHeight: 1.4 }}>
            Risk: {data.topRisk}
          </div>
        )}
      </div>
    </div>
  )
}

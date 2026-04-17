'use client'

import React from 'react'

export interface TrendCardData {
  eventId: string
  trendName: string
  niche: string
  detectedAt: string
  velocity: 'rising' | 'peak' | 'fading'
  confidenceScore: number
  sourceSummary: string
  affectedFormats: string[]
  briefGenerated: boolean
}

const VELOCITY_CONFIG = {
  rising: { label: 'Rising', color: '#2dd4a8', pulse: true },
  peak: { label: 'Peak', color: '#f4b942', pulse: false },
  fading: { label: 'Fading', color: 'rgba(255,255,255,0.3)', pulse: false },
} as const

export function TrendCard({
  data,
  onAction,
}: {
  data: TrendCardData
  onAction?: (action: string, payload: unknown) => void
}) {
  const vel = VELOCITY_CONFIG[data.velocity]

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#f4b942',
          }}
        >
          Trend Radar
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {data.detectedAt}
        </span>
      </div>

      {/* Trend name + velocity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        {/* Velocity dot */}
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: vel.color,
            display: 'inline-block',
            flexShrink: 0,
            boxShadow: vel.pulse ? `0 0 8px ${vel.color}` : 'none',
            animation: vel.pulse ? 'clayTrendPulse 2s ease-in-out infinite' : 'none',
          }}
        />
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20,
            fontWeight: 700,
            color: '#e8e8f0',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {data.trendName}
        </h3>
      </div>

      {/* Niche + confidence + velocity label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
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
          {data.niche}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: vel.color,
            background: `${vel.color}15`,
            padding: '2px 7px',
            borderRadius: 4,
          }}
        >
          {vel.label}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: 'rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.05)',
            padding: '2px 7px',
            borderRadius: 4,
          }}
        >
          {Math.round(data.confidenceScore)}% confidence
        </span>
      </div>

      {/* Source summary */}
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.5,
          margin: '0 0 14px 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {data.sourceSummary}
      </p>

      {/* Affected formats */}
      {data.affectedFormats.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {data.affectedFormats.map((fmt) => (
            <span
              key={fmt}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '3px 10px',
              }}
            >
              {fmt}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => onAction?.(data.eventId, { type: data.briefGenerated ? 'view-brief' : 'generate-brief' })}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          fontWeight: 500,
          padding: '6px 14px',
          borderRadius: 8,
          cursor: 'pointer',
          border: data.briefGenerated
            ? '1px solid rgba(255,255,255,0.12)'
            : '1px solid rgba(0,212,255,0.4)',
          color: data.briefGenerated ? 'rgba(255,255,255,0.4)' : '#00d4ff',
          background: data.briefGenerated ? 'transparent' : 'rgba(0,212,255,0.06)',
        }}
      >
        {data.briefGenerated ? 'Brief exists \u00B7 View' : 'Generate brief from this trend'}
      </button>

      {/* Pulse animation for rising trends */}
      <style>{`
        @keyframes clayTrendPulse {
          0%, 100% { box-shadow: 0 0 4px #2dd4a8; }
          50% { box-shadow: 0 0 12px #2dd4a8, 0 0 24px rgba(45,212,168,0.3); }
        }
      `}</style>
    </div>
  )
}

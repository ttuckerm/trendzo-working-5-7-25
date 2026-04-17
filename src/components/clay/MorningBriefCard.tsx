'use client'

import React from 'react'

export interface MorningBriefData {
  date: string
  agentName: string
  detectedAt: string
  variant: 'outperformance' | 'decay' | 'opportunity'
  headline: string
  summary: string
  creatorsAffected: string[]
  vpsScore: number
  actions: Array<{ label: string; actionId: string; variant: 'approve' | 'dismiss' | 'view' }>
}

const VARIANT_CONFIG = {
  outperformance: { label: 'Outperformance', color: '#2dd4a8', bg: 'rgba(45,212,168,0.1)' },
  decay: { label: 'Decay Warning', color: '#e63946', bg: 'rgba(230,57,70,0.1)' },
  opportunity: { label: 'Opportunity', color: '#f4b942', bg: 'rgba(244,185,66,0.1)' },
} as const

function vpsColor(score: number): string {
  if (score > 70) return '#2dd4a8'
  if (score >= 50) return '#f4b942'
  return '#e63946'
}

export function MorningBriefCard({
  data,
  onAction,
}: {
  data: MorningBriefData
  onAction?: (action: string, payload: unknown) => void
}) {
  const variant = VARIANT_CONFIG[data.variant]
  const scoreColor = vpsColor(data.vpsScore)
  const circumference = 2 * Math.PI * 18
  const dashOffset = circumference - (circumference * Math.min(data.vpsScore, 100)) / 100

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
      {/* Header row */}
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
          Morning Brief
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          {data.date}
        </span>
      </div>

      {/* Agent attribution */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>
        {data.agentName} · detected {data.detectedAt}
      </div>

      {/* Variant badge + headline row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: variant.color,
            background: variant.bg,
            padding: '3px 8px',
            borderRadius: 6,
            flexShrink: 0,
          }}
        >
          {variant.label}
        </span>
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
          {data.headline}
        </h3>
      </div>

      {/* Summary */}
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
        {data.summary}
      </p>

      {/* Creators + VPS row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        {/* Creator chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {data.creatorsAffected.map((name) => (
            <span
              key={name}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                color: 'rgba(255,255,255,0.6)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '3px 10px',
              }}
            >
              {name}
            </span>
          ))}
        </div>

        {/* VPS circular badge */}
        <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0, marginLeft: 12 }}>
          <svg viewBox="0 0 44 44" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
            <circle
              cx="22" cy="22" r="18" fill="none"
              stroke={scoreColor}
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </svg>
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              fontWeight: 700,
              color: scoreColor,
            }}
          >
            {Math.round(data.vpsScore)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      {data.actions.length > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          {data.actions.map((action) => {
            const btnStyles: Record<string, React.CSSProperties> = {
              approve: {
                border: '1px solid rgba(45,212,168,0.4)',
                color: '#2dd4a8',
                background: 'rgba(45,212,168,0.06)',
              },
              dismiss: {
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.4)',
                background: 'transparent',
              },
              view: {
                border: '1px solid rgba(0,212,255,0.3)',
                color: '#00d4ff',
                background: 'rgba(0,212,255,0.06)',
              },
            }
            return (
              <button
                key={action.actionId}
                onClick={() => onAction?.(action.actionId, { type: action.variant })}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '6px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'opacity 150ms',
                  ...btnStyles[action.variant],
                }}
              >
                {action.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

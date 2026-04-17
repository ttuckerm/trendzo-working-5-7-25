'use client'

import React from 'react'

export interface CreatorProfileData {
  creatorId: string
  name: string
  handle: string
  niche: string
  followerCount: number
  avgVPS: number
  trend: 'up' | 'down' | 'flat'
  topFormats: string[]
  recentScore: number
  briefsThisWeek: number
  agencyName: string
  memoryFacts: string[]
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function vpsColor(score: number): string {
  if (score >= 80) return '#2dd4a8'
  if (score >= 70) return '#f4b942'
  return '#e63946'
}

const TREND_CONFIG = {
  up: { arrow: '\u2191', color: '#2dd4a8', label: 'Rising' },
  down: { arrow: '\u2193', color: '#e63946', label: 'Declining' },
  flat: { arrow: '\u2192', color: 'rgba(255,255,255,0.4)', label: 'Stable' },
} as const

export function CreatorProfileCard({
  data,
  onAction,
}: {
  data: CreatorProfileData
  onAction?: (action: string, payload: unknown) => void
}) {
  const trend = TREND_CONFIG[data.trend]
  const initials = data.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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
      {/* Top row: avatar + info */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {/* Avatar */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7b2ff7, #00d4ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>
            {initials}
          </span>
        </div>

        {/* Name + handle + niche */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 20,
              fontWeight: 700,
              color: '#e8e8f0',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {data.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#00d4ff' }}>
              {data.handle}
            </span>
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
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 14 }}>
        {/* Followers + trend */}
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>
            Followers
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#e8e8f0' }}>
              {formatCount(data.followerCount)}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: trend.color, fontWeight: 600 }}>
              {trend.arrow}
            </span>
          </div>
        </div>

        {/* Avg VPS */}
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>
            Avg VPS
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: vpsColor(data.avgVPS) }}>
            {Math.round(data.avgVPS)}
          </span>
        </div>

        {/* Briefs this week */}
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>
            Briefs / wk
          </div>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#e8e8f0' }}>
            {data.briefsThisWeek}
          </span>
        </div>
      </div>

      {/* Top formats */}
      {data.topFormats.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {data.topFormats.slice(0, 3).map((format) => (
            <span
              key={format}
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
              {format}
            </span>
          ))}
        </div>
      )}

      {/* Memory facts */}
      {data.memoryFacts.length > 0 && (
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.35)',
            lineHeight: 1.5,
            marginBottom: 14,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {data.memoryFacts.slice(0, 2).join(' · ')}
        </div>
      )}

      {/* Footer link */}
      <button
        onClick={() => onAction?.('navigate_creator', { creatorId: data.creatorId })}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: '#00d4ff',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        View full profile &rarr;
      </button>
    </div>
  )
}

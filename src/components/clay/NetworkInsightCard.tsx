'use client'

import React from 'react'

export interface NetworkInsightData {
  insightId: string
  pattern: string
  niche: string
  agencyCount: number
  confidenceScore: number
  anonymized: boolean
  enterpriseOnly: boolean
  recommendation: string
}

function confidenceColor(score: number): string {
  if (score >= 80) return '#2dd4a8'
  if (score >= 60) return '#f4b942'
  return 'rgba(255,255,255,0.4)'
}

export function NetworkInsightCard({
  data,
  onAction,
  isEnterpriseTier = false,
}: {
  data: NetworkInsightData
  onAction?: (action: string, payload: unknown) => void
  isEnterpriseTier?: boolean
}) {
  const confColor = confidenceColor(data.confidenceScore)
  const locked = data.enterpriseOnly && !isEnterpriseTier

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 12,
        backdropFilter: 'blur(12px)',
        position: 'relative',
        overflow: 'hidden',
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
            color: '#7b2ff7',
          }}
        >
          Network Intelligence
        </span>
        {data.enterpriseOnly && (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: '#f4b942',
              background: 'rgba(244,185,66,0.1)',
              padding: '2px 8px',
              borderRadius: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Enterprise
          </span>
        )}
      </div>

      {/* Pattern */}
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20,
          fontWeight: 700,
          color: '#e8e8f0',
          margin: '0 0 10px 0',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {data.pattern}
      </h3>

      {/* Niche + agency count + confidence */}
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
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          {data.anonymized
            ? `Seen across ${data.agencyCount} agencies`
            : `${data.agencyCount} agencies reporting`}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: confColor,
            background: `${confColor}15`,
            padding: '2px 7px',
            borderRadius: 4,
            marginLeft: 'auto',
          }}
        >
          {Math.round(data.confidenceScore)}%
        </span>
      </div>

      {/* Recommendation */}
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.5,
          margin: 0,
          fontStyle: 'italic',
        }}
      >
        {data.recommendation}
      </p>

      {/* Lock overlay */}
      {locked && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(10,10,15,0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            borderRadius: 16,
          }}
        >
          <span style={{ fontSize: 24 }}>&#128274;</span>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'center',
              maxWidth: 260,
              lineHeight: 1.5,
            }}
          >
            Upgrade to Enterprise to unlock network insights
          </span>
          <button
            onClick={() => onAction?.('upgrade', { insightId: data.insightId })}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              padding: '6px 18px',
              borderRadius: 8,
              cursor: 'pointer',
              border: '1px solid rgba(0,212,255,0.4)',
              color: '#00d4ff',
              background: 'rgba(0,212,255,0.06)',
            }}
          >
            Upgrade
          </button>
        </div>
      )}
    </div>
  )
}

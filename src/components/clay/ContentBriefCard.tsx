'use client'

import React, { useState } from 'react'

export interface ContentBriefData {
  briefId: string
  creatorName: string
  niche: string
  title: string
  hook: string
  format: string
  vpsScore: number
  criticScore?: number
  battleTested: boolean
  variantCount: number
  agentAttribution: string
  status: 'pending' | 'approved' | 'rejected'
}

function vpsColor(score: number): string {
  if (score >= 80) return '#2dd4a8'
  if (score >= 70) return '#f4b942'
  return '#e63946'
}

export function ContentBriefCard({
  data,
  onAction,
}: {
  data: ContentBriefData
  onAction?: (action: string, payload: unknown) => void
}) {
  const [localStatus, setLocalStatus] = useState(data.status)

  const statusBorderColor =
    localStatus === 'approved' ? 'rgba(45,212,168,0.5)' :
    localStatus === 'rejected' ? 'rgba(230,57,70,0.5)' :
    'rgba(255,255,255,0.08)'

  const handleAction = (actionId: string) => {
    if (actionId === 'approve') setLocalStatus('approved')
    if (actionId === 'reject') setLocalStatus('rejected')
    onAction?.(actionId, { briefId: data.briefId })
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${statusBorderColor}`,
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 12,
        backdropFilter: 'blur(12px)',
        transition: 'border-color 200ms',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#00d4ff',
            }}
          >
            Content Brief
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: '#7b2ff7',
              background: 'rgba(123,47,247,0.1)',
              padding: '2px 7px',
              borderRadius: 4,
              textTransform: 'lowercase',
            }}
          >
            {data.niche}
          </span>
        </div>
        {data.battleTested && (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: '#f4b942',
              background: 'rgba(244,185,66,0.1)',
              padding: '2px 8px',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 12 }}>&#9741;</span> Battle-tested
          </span>
        )}
      </div>

      {/* Creator name */}
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 15,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.6)',
          marginBottom: 4,
        }}
      >
        {data.creatorName}
      </div>

      {/* Agent attribution */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 14 }}>
        Trend Scout · {data.agentAttribution}
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20,
          fontWeight: 700,
          color: '#e8e8f0',
          margin: '0 0 8px 0',
          lineHeight: 1.3,
        }}
      >
        {data.title}
      </h3>

      {/* Hook */}
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.5,
          margin: '0 0 12px 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        &ldquo;{data.hook}&rdquo;
      </p>

      {/* Format chip */}
      <div style={{ marginBottom: 14 }}>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: 'rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '4px 10px',
            borderRadius: 6,
          }}
        >
          {data.format}
        </span>
      </div>

      {/* Scores row */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>
            VPS
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: vpsColor(data.vpsScore) }}>
            {Math.round(data.vpsScore)}
          </div>
        </div>
        {data.criticScore != null && (
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>
              Critic
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
              {Math.round(data.criticScore)}
            </div>
          </div>
        )}
      </div>

      {/* Actions or status label */}
      {localStatus === 'pending' ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => handleAction('approve')}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              padding: '6px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              border: '1px solid rgba(45,212,168,0.4)',
              color: '#2dd4a8',
              background: 'rgba(45,212,168,0.06)',
            }}
          >
            Approve
          </button>
          <button
            onClick={() => handleAction('reject')}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              padding: '6px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e63946',
              background: 'transparent',
            }}
          >
            Reject
          </button>
          {data.variantCount > 0 && (
            <button
              onClick={() => onAction?.('view_variants', { briefId: data.briefId })}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                padding: '6px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                border: 'none',
                color: '#00d4ff',
                background: 'transparent',
                marginLeft: 'auto',
              }}
            >
              See {data.variantCount} alternative{data.variantCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: localStatus === 'approved' ? '#2dd4a8' : '#e63946',
            padding: '6px 0',
          }}
        >
          {localStatus === 'approved' ? 'Approved' : 'Rejected'}
        </div>
      )}
    </div>
  )
}

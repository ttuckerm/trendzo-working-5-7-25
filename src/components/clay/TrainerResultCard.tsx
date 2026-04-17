'use client'

import React, { useState } from 'react'

export interface TrainerResultData {
  experimentId: string
  niche: string
  previousScore: number
  newScore: number
  improvement: number
  featuresAdded: string[]
  samplesUsed: number
  status: 'pending-approval' | 'approved' | 'rejected'
  isChairmanOnly: boolean
}

export function TrainerResultCard({
  data,
  onAction,
}: {
  data: TrainerResultData
  onAction?: (action: string, payload: unknown) => void
}) {
  const [localStatus, setLocalStatus] = useState(data.status)
  const isPositive = data.improvement > 0

  const handleAction = (type: 'approve' | 'reject') => {
    setLocalStatus(type === 'approve' ? 'approved' : 'rejected')
    onAction?.(data.experimentId, { type })
  }

  const maxChips = 3
  const overflowCount = data.featuresAdded.length - maxChips

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
            color: '#7b2ff7',
          }}
        >
          Trainer Engine
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {data.isChairmanOnly && (
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
              Chairman
            </span>
          )}
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

      {/* Score comparison */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>
            Previous
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
            {data.previousScore.toFixed(3)}
          </span>
        </div>

        {/* Arrow */}
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, color: 'rgba(255,255,255,0.2)' }}>
          &rarr;
        </span>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>
            New
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: '#e8e8f0' }}>
            {data.newScore.toFixed(3)}
          </span>
        </div>

        {/* Delta */}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            fontWeight: 600,
            color: isPositive ? '#2dd4a8' : '#e63946',
            background: isPositive ? 'rgba(45,212,168,0.1)' : 'rgba(230,57,70,0.1)',
            padding: '4px 10px',
            borderRadius: 6,
            marginLeft: 'auto',
          }}
        >
          {isPositive ? '+' : ''}{data.improvement.toFixed(4)}
        </span>
      </div>

      {/* Features added */}
      {data.featuresAdded.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 6 }}>
            Features
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {data.featuresAdded.slice(0, maxChips).map((feat) => (
              <span
                key={feat}
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
                {feat}
              </span>
            ))}
            {overflowCount > 0 && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.3)',
                  padding: '3px 6px',
                }}
              >
                +{overflowCount} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Samples */}
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          {data.samplesUsed.toLocaleString()} samples
        </span>
      </div>

      {/* Status-aware buttons */}
      {localStatus === 'pending-approval' ? (
        <div style={{ display: 'flex', gap: 8 }}>
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
            Approve & Deploy
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
          {localStatus === 'approved' ? 'Deployed \u2713' : 'Rejected'}
        </div>
      )}
    </div>
  )
}

'use client'

import React from 'react'

export interface ActionConfirmationData {
  actionId: string
  actionType: string
  actionLabel: string
  target: string
  consequence: string
  status: 'pending' | 'confirmed' | 'cancelled'
}

export function ActionConfirmationCard({
  data,
  onAction,
}: {
  data: ActionConfirmationData
  onAction?: (action: string, payload: unknown) => void
}) {
  const isPending = data.status === 'pending'
  const isConfirmed = data.status === 'confirmed'

  const statusIcon = isConfirmed ? '\u2713' : data.status === 'cancelled' ? '\u2717' : null
  const statusColor = isConfirmed ? '#2dd4a8' : '#e63946'
  const statusLabel = isConfirmed ? 'Confirmed' : 'Cancelled'

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '14px 18px',
        marginBottom: 12,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Status icon or spinner */}
        {isPending ? (
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.15)',
              borderTopColor: '#00d4ff',
              flexShrink: 0,
              animation: 'claySpinner 0.8s linear infinite',
            }}
          />
        ) : (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 16,
              fontWeight: 700,
              color: statusColor,
              flexShrink: 0,
              width: 20,
              textAlign: 'center',
            }}
          >
            {statusIcon}
          </span>
        )}

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#e8e8f0' }}>
              {data.actionLabel}
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              &middot; {data.target}
            </span>
          </div>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            {data.consequence}
          </span>
        </div>

        {/* Buttons or status */}
        {isPending ? (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => onAction?.(data.actionId, { type: 'confirm' })}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                padding: '5px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                border: '1px solid rgba(45,212,168,0.4)',
                color: '#2dd4a8',
                background: 'rgba(45,212,168,0.06)',
              }}
            >
              Confirm
            </button>
            <button
              onClick={() => onAction?.(data.actionId, { type: 'cancel' })}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                padding: '5px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.4)',
                background: 'transparent',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: statusColor,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}
          >
            {statusLabel}
          </span>
        )}
      </div>

      <style>{`
        @keyframes claySpinner {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

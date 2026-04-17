'use client'

import React from 'react'

export interface ProactiveAlertData {
  alertId: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  body: string
  affectedEntity: string
  detectedAt: string
  actions: Array<{ label: string; actionId: string }>
}

const SEVERITY_CONFIG = {
  info: { label: 'Info', color: '#00d4ff', borderColor: '#00d4ff', pulse: false },
  warning: { label: 'Warning', color: '#f4b942', borderColor: '#f4b942', pulse: false },
  critical: { label: 'Critical', color: '#e63946', borderColor: '#e63946', pulse: true },
} as const

export function ProactiveAlertCard({
  data,
  onAction,
}: {
  data: ProactiveAlertData
  onAction?: (action: string, payload: unknown) => void
}) {
  const sev = SEVERITY_CONFIG[data.severity]

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: `4px solid ${sev.borderColor}`,
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 12,
        backdropFilter: 'blur(12px)',
        animation: sev.pulse ? 'clayAlertPulse 2s ease-in-out infinite' : 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: sev.color,
          }}
        >
          Platform Alert
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: sev.color,
            background: `${sev.color}18`,
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          {sev.label}
        </span>
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

      {/* Body */}
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.6,
          margin: '0 0 12px 0',
        }}
      >
        {data.body}
      </p>

      {/* Affected entity + detected at */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span
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
          {data.affectedEntity}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          {data.detectedAt}
        </span>
      </div>

      {/* Action buttons */}
      {data.actions.length > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          {data.actions.map((action) => (
            <button
              key={action.actionId}
              onClick={() => onAction?.(action.actionId, { alertId: data.alertId })}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                padding: '6px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                border: `1px solid ${sev.color}66`,
                color: sev.color,
                background: `${sev.color}0a`,
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {sev.pulse && (
        <style>{`
          @keyframes clayAlertPulse {
            0%, 100% { border-left-color: #e63946; }
            50% { border-left-color: #e6394680; box-shadow: -4px 0 12px rgba(230,57,70,0.2); }
          }
        `}</style>
      )}
    </div>
  )
}

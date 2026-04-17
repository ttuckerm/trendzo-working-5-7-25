'use client'

import React from 'react'

export interface KPISummaryData {
  agencyName: string
  period: string
  metrics: Array<{ label: string; value: string; change: number; unit?: string }>
}

export function KPISummaryCard({ data }: { data: KPISummaryData }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '16px 24px 20px',
        marginBottom: 12,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#00d4ff',
          }}
        >
          KPI Summary
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {data.agencyName} · {data.period}
        </span>
      </div>

      {/* Metrics grid — wraps to 2-column on mobile */}
      <div
        className="clay-kpi-grid"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0,
          overflow: 'hidden',
        }}
      >
        {data.metrics.slice(0, 5).map((metric, i) => (
          <div
            key={metric.label}
            className="clay-kpi-cell"
            style={{
              flex: '1 1 auto',
              minWidth: 0,
              padding: '0 12px',
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            {/* Label */}
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {metric.label}
            </div>

            {/* Value */}
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: '#e8e8f0',
                lineHeight: 1.2,
                marginBottom: 4,
              }}
            >
              {metric.value}
              {metric.unit && (
                <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.3)', marginLeft: 2 }}>
                  {metric.unit}
                </span>
              )}
            </div>

            {/* Change pill */}
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 600,
                color: metric.change >= 0 ? '#2dd4a8' : '#e63946',
                background: metric.change >= 0 ? 'rgba(45,212,168,0.1)' : 'rgba(230,57,70,0.1)',
                padding: '2px 6px',
                borderRadius: 4,
                display: 'inline-block',
              }}
            >
              {metric.change >= 0 ? '+' : ''}{metric.change}%
            </span>
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 480px) {
          .clay-kpi-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 12px !important;
          }
          .clay-kpi-cell {
            border-left: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

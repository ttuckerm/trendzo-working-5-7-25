'use client'

import React from 'react'
import { LineChart, Line, Area, ResponsiveContainer, YAxis } from 'recharts'

export interface PerformanceTimelineData {
  creatorName: string
  period: string
  dataPoints: Array<{ date: string; vpsScore: number; actual?: number }>
  trend: 'improving' | 'declining' | 'stable'
  peakScore: number
  avgScore: number
}

const TREND_CONFIG = {
  improving: { arrow: '\u2191', color: '#2dd4a8', label: 'Improving' },
  declining: { arrow: '\u2193', color: '#e63946', label: 'Declining' },
  stable: { arrow: '\u2192', color: 'rgba(255,255,255,0.4)', label: 'Stable' },
} as const

function vpsColor(score: number): string {
  if (score >= 80) return '#2dd4a8'
  if (score >= 70) return '#f4b942'
  return '#e63946'
}

export function PerformanceTimelineCard({ data }: { data: PerformanceTimelineData }) {
  const trend = TREND_CONFIG[data.trend]
  const hasActual = data.dataPoints.some((dp) => dp.actual != null)

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#00d4ff',
          }}
        >
          Performance
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {data.period}
        </span>
      </div>

      {/* Creator name + trend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18,
            fontWeight: 700,
            color: '#e8e8f0',
            margin: 0,
          }}
        >
          {data.creatorName}
        </h3>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: trend.color,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          {trend.arrow} {trend.label}
        </span>
      </div>

      {/* Sparkline chart — 120px on mobile, 200px on desktop */}
      {data.dataPoints.length > 1 ? (
        <div className="clay-timeline-chart" style={{ width: '100%', height: 200, marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.dataPoints} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <defs>
                <linearGradient id="clayVpsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
              <Area
                type="monotone"
                dataKey="vpsScore"
                stroke="none"
                fill="url(#clayVpsFill)"
              />
              <Line
                type="monotone"
                dataKey="vpsScore"
                stroke="#00d4ff"
                strokeWidth={2}
                dot={false}
                activeDot={false}
              />
              {hasActual && (
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#f4b942"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          style={{
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: 'rgba(255,255,255,0.25)',
            marginBottom: 16,
          }}
        >
          Not enough data points for chart
        </div>
      )}

      {/* Legend */}
      {hasActual && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 2, background: '#00d4ff', borderRadius: 1 }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Predicted VPS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 2, background: '#f4b942', borderRadius: 1, borderTop: '1px dashed #f4b942' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Actual</span>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>
            Peak
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: vpsColor(data.peakScore) }}>
            {Math.round(data.peakScore)}
          </span>
        </div>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>
            Average
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: vpsColor(data.avgScore) }}>
            {Math.round(data.avgScore)}
          </span>
        </div>
      </div>
      <style>{`
        @media (max-width: 480px) {
          .clay-timeline-chart {
            height: 120px !important;
          }
        }
      `}</style>
    </div>
  )
}

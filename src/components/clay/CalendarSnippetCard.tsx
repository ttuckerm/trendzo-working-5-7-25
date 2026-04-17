'use client'

import React from 'react'

export interface CalendarSnippetData {
  date: string
  dayOfWeek: string
  scheduledActions: Array<{ time: string; label: string; type: string }>
  upcomingBriefs: number
  pendingApprovals: number
}

export function CalendarSnippetCard({ data }: { data: CalendarSnippetData }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '16px 20px',
        marginBottom: 12,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Horizontal layout: date | actions | stats */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        {/* Date block */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              fontWeight: 700,
              color: '#e8e8f0',
              lineHeight: 1.1,
            }}
          >
            {data.dayOfWeek}
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: 'rgba(255,255,255,0.35)',
              marginTop: 2,
            }}
          >
            {data.date}
          </div>
        </div>

        {/* Actions list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.scheduledActions.length > 0 ? (
            data.scheduledActions.map((action, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: '#00d4ff',
                    flexShrink: 0,
                    minWidth: 52,
                  }}
                >
                  {action.time}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  {action.label}
                </span>
              </div>
            ))
          ) : (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
              No scheduled actions
            </span>
          )}
        </div>

        {/* Stats badges */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          {data.upcomingBriefs > 0 && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: '#00d4ff',
                background: 'rgba(0,212,255,0.1)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              {data.upcomingBriefs} brief{data.upcomingBriefs !== 1 ? 's' : ''} due
            </span>
          )}
          {data.pendingApprovals > 0 && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: '#f4b942',
                background: 'rgba(244,185,66,0.1)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              {data.pendingApprovals} pending
            </span>
          )}
        </div>
      </div>

      {/* View full calendar link */}
      <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
        <a
          href="/agency/calendar"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: '#00d4ff',
            textDecoration: 'none',
          }}
        >
          View full calendar &rarr;
        </a>
      </div>
    </div>
  )
}

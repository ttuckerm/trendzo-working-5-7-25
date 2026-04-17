'use client'

import React from 'react'

export interface MemoryFactData {
  tier: 'hot' | 'warm' | 'cold'
  facts: Array<{ content: string; extractedAt: string; sourceType: string }>
  entityName: string
  entityType: 'creator' | 'agency' | 'niche'
}

const TIER_CONFIG = {
  hot: { label: 'Hot', color: '#e63946', bg: 'rgba(230,57,70,0.1)' },
  warm: { label: 'Warm', color: '#f4b942', bg: 'rgba(244,185,66,0.1)' },
  cold: { label: 'Cold', color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.05)' },
} as const

export function MemoryFactCard({ data }: { data: MemoryFactData }) {
  const tier = TIER_CONFIG[data.tier]
  const visibleFacts = data.facts.slice(0, 3)

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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          Memory
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: tier.color,
            background: tier.bg,
            padding: '2px 8px',
            borderRadius: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {tier.label}
        </span>
      </div>

      {/* Entity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#e8e8f0' }}>
          {data.entityName}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: 'rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.05)',
            padding: '2px 7px',
            borderRadius: 4,
          }}
        >
          {data.entityType}
        </span>
      </div>

      {/* Facts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: data.facts.length > 3 ? 12 : 0 }}>
        {visibleFacts.map((fact, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: 'rgba(255,255,255,0.45)',
                fontStyle: 'italic',
                lineHeight: 1.4,
                flex: 1,
              }}
            >
              {fact.content}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: 'rgba(255,255,255,0.2)',
                flexShrink: 0,
              }}
            >
              {fact.extractedAt}
            </span>
          </div>
        ))}
      </div>

      {/* View all link */}
      {data.facts.length > 3 && (
        <a
          href="/agency/memory"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: '#00d4ff',
            textDecoration: 'none',
          }}
        >
          View all in memory &rarr;
        </a>
      )}
    </div>
  )
}

'use client'

import React, { useRef } from 'react'

export interface VariantComparisonData {
  briefId: string
  primaryTitle: string
  variants: Array<{ variantId: string; title: string; hook: string; vpsDelta: number }>
}

export function VariantComparisonCard({
  data,
  onAction,
}: {
  data: VariantComparisonData
  onAction?: (action: string, payload: unknown) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Only render if at least one variant has vpsDelta > 5
  const hasSignificant = data.variants.some((v) => Math.abs(v.vpsDelta) > 5)
  if (!hasSignificant) return null

  const columnCount = Math.min(data.variants.length, 2)
  const isScrollable = data.variants.length > 2

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
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#f4b942',
          display: 'block',
          marginBottom: 10,
        }}
      >
        Brief Variants
      </span>

      {/* Primary title */}
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: 'rgba(255,255,255,0.4)',
          margin: '0 0 14px 0',
        }}
      >
        {data.primaryTitle} — vs.
      </p>

      {/* Variants grid — stacks vertically on mobile */}
      <div
        ref={scrollRef}
        className="clay-variant-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: isScrollable ? `repeat(${data.variants.length}, 240px)` : `repeat(${columnCount}, 1fr)`,
          gap: 12,
          overflowX: isScrollable ? 'auto' : 'visible',
          paddingBottom: isScrollable ? 4 : 0,
        }}
      >
        {data.variants.map((variant) => {
          const isPositive = variant.vpsDelta > 0
          const deltaColor = isPositive ? '#2dd4a8' : '#e63946'
          return (
            <div
              key={variant.variantId}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {/* Variant title + VPS delta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#e8e8f0', flex: 1 }}>
                  {variant.title}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    fontWeight: 600,
                    color: deltaColor,
                    background: `${deltaColor}15`,
                    padding: '2px 8px',
                    borderRadius: 4,
                    flexShrink: 0,
                  }}
                >
                  {isPositive ? '+' : ''}{variant.vpsDelta} VPS
                </span>
              </div>

              {/* Hook */}
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                  fontStyle: 'italic',
                  margin: 0,
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {variant.hook}
              </p>

              {/* Select button */}
              <button
                onClick={() => onAction?.(variant.variantId, { briefId: data.briefId, type: 'select-variant' })}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '5px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: '1px solid rgba(0,212,255,0.3)',
                  color: '#00d4ff',
                  background: 'transparent',
                  marginTop: 'auto',
                }}
              >
                Select this variant
              </button>
            </div>
          )
        })}
      </div>
      <style>{`
        @media (max-width: 480px) {
          .clay-variant-grid {
            grid-template-columns: 1fr !important;
            overflow-x: visible !important;
          }
        }
      `}</style>
    </div>
  )
}

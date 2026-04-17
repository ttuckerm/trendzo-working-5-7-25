'use client'

import React from 'react'

/**
 * Universal skeleton loader for Clay Formless UI components.
 * Shows an animated shimmer in the same card shell dimensions.
 */
export function UniversalSkeleton({ index = 0 }: { index?: number }) {
  const delay = index * 80

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 12,
        opacity: 0,
        animation: `claySkeletonFadeIn 300ms ease-out ${delay}ms forwards`,
      }}
    >
      {/* Label skeleton */}
      <div
        style={{
          width: 120,
          height: 12,
          borderRadius: 4,
          marginBottom: 14,
          background: 'rgba(255,255,255,0.05)',
          animation: 'clayShimmer 1.5s ease-in-out infinite',
        }}
      />
      {/* Title skeleton */}
      <div
        style={{
          width: '70%',
          height: 20,
          borderRadius: 4,
          marginBottom: 12,
          background: 'rgba(255,255,255,0.05)',
          animation: 'clayShimmer 1.5s ease-in-out 100ms infinite',
        }}
      />
      {/* Body lines */}
      <div
        style={{
          width: '100%',
          height: 14,
          borderRadius: 4,
          marginBottom: 8,
          background: 'rgba(255,255,255,0.05)',
          animation: 'clayShimmer 1.5s ease-in-out 200ms infinite',
        }}
      />
      <div
        style={{
          width: '85%',
          height: 14,
          borderRadius: 4,
          marginBottom: 16,
          background: 'rgba(255,255,255,0.05)',
          animation: 'clayShimmer 1.5s ease-in-out 300ms infinite',
        }}
      />
      {/* Action row skeleton */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div
          style={{
            width: 80,
            height: 28,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            animation: 'clayShimmer 1.5s ease-in-out 400ms infinite',
          }}
        />
        <div
          style={{
            width: 60,
            height: 28,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            animation: 'clayShimmer 1.5s ease-in-out 500ms infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes clayShimmer {
          0%, 100% { background: rgba(255,255,255,0.05); }
          50% { background: rgba(255,255,255,0.08); }
        }
        @keyframes claySkeletonFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

'use client';

import React from 'react';

interface GlassInsightCardProps {
  priority: 'high' | 'medium' | 'low';
  title: string;
  recommendation: string;
  creatorName?: string;
}

const PRIORITY_META = {
  high:   { color: '#f04a4d', border: '#f04a4d33', label: 'HIGH' },
  medium: { color: '#f4b942', border: '#f4b94233', label: 'MED' },
  low:    { color: '#00d4ff', border: '#00d4ff33', label: 'LOW' },
} as const;

export default function GlassInsightCard({ priority, title, recommendation, creatorName }: GlassInsightCardProps) {
  const { color, border, label } = PRIORITY_META[priority];

  return (
    <div
      className="relative rounded-xl p-4 overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: 'rgba(15, 15, 22, 0.55)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: `1px solid ${border}`,
      }}
    >
      {/* Top-edge highlight */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: `linear-gradient(90deg, ${color}55, transparent 50%)` }}
      />

      <div className="flex items-start gap-3">
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider flex-shrink-0 mt-0.5"
          style={{ background: `${color}18`, color, border: `1px solid ${color}25` }}
        >
          {label}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-display font-bold text-[#e8e8f0] mb-1">{title}</h4>
          <p className="text-[11px] text-[#8888a0] leading-relaxed">{recommendation}</p>
          {creatorName && (
            <p className="text-[10px] font-mono text-[#00d4ff] mt-1.5">Re: {creatorName}</p>
          )}
        </div>
      </div>
    </div>
  );
}

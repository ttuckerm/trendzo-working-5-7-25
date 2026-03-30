'use client';

import React from 'react';
import TrendItem from '../components/TrendItem';

interface TrendData {
  name: string;
  velocity: number;
  score: number;
}

export default function TrendRadar({ trends }: { trends: TrendData[] }) {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="animate-[fadeSlideUp_0.5s_ease-out_both]">
        <h1 className="text-3xl font-display font-bold text-[#e8e6e3] tracking-tight">
          Trend Radar
        </h1>
        <p className="text-sm text-[#7a7889] mt-2 font-body">
          Real-time trend signals from your niche
        </p>
      </div>

      {/* Trend list */}
      <div className="space-y-3">
        {trends.map((trend, i) => (
          <div key={trend.name} style={{ animationDelay: `${i * 80}ms` }}>
            <TrendItem
              name={trend.name}
              velocity={trend.velocity}
              score={trend.score}
            />
          </div>
        ))}
      </div>

      {/* FOMO Alert */}
      <div
        className="rounded-xl p-5 animate-[fadeSlideUp_0.6s_ease-out_0.4s_both]"
        style={{
          background: 'linear-gradient(135deg, rgba(230, 57, 70, 0.12), rgba(230, 57, 70, 0.04))',
          border: '1px solid rgba(230, 57, 70, 0.2)',
        }}
      >
        <p className="text-[10px] font-mono-label uppercase tracking-[0.12em] text-[#e63946] mb-2">
          FOMO Alert
        </p>
        <p className="text-sm font-body text-[#e8e6e3]/80 leading-relaxed">
          <span className="text-[#e63946] font-semibold">12 agencies</span> in your niche discovered{' '}
          <span className="text-[#e63946] font-semibold">&quot;{trends[0]?.name || 'trending content'}&quot;</span>{' '}
          before you. Early movers are seeing <span className="text-[#f4b942] font-semibold">3.2x</span> higher engagement.
        </p>
        <button className="mt-3 px-4 py-2 rounded-lg text-xs font-body font-medium bg-[#e63946]/15 border border-[#e63946]/25 text-[#e63946] hover:bg-[#e63946]/20 transition-colors">
          Catch Up Now
        </button>
      </div>
    </div>
  );
}

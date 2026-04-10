'use client';

import React from 'react';
import { T, stagger } from './tokens';
import type { AgencyCreator } from '@/lib/dashboard/queries';

interface TrendsViewProps {
  creators: AgencyCreator[];
}

// TODO: wire to real trend data source (e.g., trend_windows table, external API)
const MOCK_TRENDS = [
  { id: '1', name: 'POV Storytime', vps: 92, velocity: '+340%', window: '1d left', hot: true },
  { id: '2', name: 'Split Screen React', vps: 87, velocity: '+210%', window: '2d left', hot: true },
  { id: '3', name: 'Greenscreen Tutorial', vps: 78, velocity: '+145%', window: '4d left', hot: false },
  { id: '4', name: 'Duet Challenge', vps: 71, velocity: '+98%', window: '5d left', hot: false },
  { id: '5', name: 'Before/After Hook', vps: 65, velocity: '+76%', window: '6d left', hot: false },
];

export default function TrendsView({ creators }: TrendsViewProps) {
  const topTrend = MOCK_TRENDS[0];

  return (
    <div className="space-y-3">
      {MOCK_TRENDS.map((trend, i) => {
        const circumference = 2 * Math.PI * 18;
        const offset = circumference - (trend.vps / 100) * circumference;
        const color = trend.hot ? T.cyan : T.textSecondary;

        // Pick 2-3 random creators who could use this trend
        const candidates = creators.slice(0, Math.min(3, creators.length));

        return (
          <div
            key={trend.id}
            className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-300 hover:translate-y-[-1px]"
            style={{
              background: T.bgCard,
              border: `1px solid ${trend.hot ? T.cyan + '30' : T.border}`,
              boxShadow: trend.hot ? T.glowCyan : T.cardShadow,
              ...stagger(i),
            }}
          >
            {/* VPS ring */}
            <div className="relative w-11 h-11 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="none" stroke={T.border} strokeWidth="2.5" />
                <circle
                  cx="20" cy="20" r="18" fill="none" stroke={color} strokeWidth="2.5"
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-display font-bold" style={{ color }}>{trend.vps}</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-sm font-display font-bold" style={{ color: T.textPrimary }}>{trend.name}</h3>
                {trend.hot && (
                  <span
                    className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ background: `${T.crimson}20`, color: T.crimson }}
                  >
                    HOT
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: T.textSecondary }}>
                <span style={{ color: T.green }}>{trend.velocity}</span>
                <span style={{ color: trend.window.startsWith('1') ? T.crimson : T.gold }}>{trend.window}</span>
              </div>
            </div>

            {/* Creator chips */}
            <div className="flex items-center -space-x-1.5 flex-shrink-0">
              {candidates.map(c => (
                <div
                  key={c.userId}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-bold"
                  style={{ background: T.bgElevated, color: T.textSecondary, border: `2px solid ${T.bgCard}` }}
                  title={c.name}
                >
                  {c.name.split(' ').map(w => w[0]).join('').slice(0, 1)}
                </div>
              ))}
            </div>

            {/* Action */}
            <button
              className="flex-shrink-0 text-[10px] font-mono uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all duration-200 hover:brightness-125"
              style={{ background: `${T.cyan}12`, color: T.cyan, border: `1px solid ${T.cyan}25` }}
            >
              Generate for all →
            </button>
          </div>
        );
      })}

      {/* FOMO alert */}
      <div
        className="rounded-2xl p-5 mt-4"
        style={{
          background: `linear-gradient(135deg, ${T.crimson}08, ${T.bgCard})`,
          border: `1px solid ${T.crimson}30`,
          boxShadow: T.glowCrimson,
          ...stagger(MOCK_TRENDS.length),
        }}
      >
        <div className="flex items-start gap-3">
          <span className="text-lg">🔥</span>
          <div>
            <p className="text-xs font-display font-bold mb-1" style={{ color: T.crimson }}>
              Competitor Alert
            </p>
            <p className="text-[11px] font-sans leading-relaxed" style={{ color: T.textSecondary }}>
              <span style={{ color: T.textPrimary }}>12 agencies</span> in your niche already used{' '}
              <span style={{ color: T.cyan }}>{topTrend.name}</span> this week.
              Clients averaged <span style={{ color: T.green }}>34% above baseline</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

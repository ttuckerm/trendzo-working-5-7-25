'use client';

import React from 'react';
import { T, stagger } from './tokens';
import type { AgencyCreator } from '@/lib/dashboard/queries';

interface MomentumViewProps {
  creators: AgencyCreator[];
}

// Simulate days since last post from scriptCount (real: query generated_scripts.created_at)
function daysSilent(c: AgencyCreator): number {
  // TODO: wire to real last-post date from generated_scripts
  if (c.scriptCount === 0) return 14;
  if (c.status === 'inactive') return 7;
  if (c.status === 'onboarding') return 3;
  // Deterministic per-creator stub — Math.random here caused hydration mismatches.
  const key = (c.userId as string | undefined) || c.name || '';
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % 3;
}

function momentumScore(c: AgencyCreator): number {
  // TODO: wire to real engagement trajectory
  const base = Math.min(c.latestVPS, 100);
  const silence = daysSilent(c);
  return Math.max(0, Math.round(base - silence * 8));
}

export default function MomentumView({ creators }: MomentumViewProps) {
  const sorted = [...creators].sort((a, b) => daysSilent(b) - daysSilent(a));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {sorted.map((c, i) => {
        const silent = daysSilent(c);
        const momentum = momentumScore(c);
        const isUrgent = silent >= 3;
        const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const momColor = momentum >= 60 ? T.green : momentum >= 30 ? T.gold : T.crimson;

        // Progress ring
        const circumference = 2 * Math.PI * 18;
        const offset = circumference - (Math.min(momentum, 100) / 100) * circumference;

        // Fake 7-day engagement data
        // TODO: wire to real daily engagement from generated_scripts
        const bars = Array.from({ length: 7 }, () => 20 + Math.floor(Math.random() * 80));

        return (
          <div
            key={c.userId}
            className="relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:translate-y-[-2px]"
            style={{
              background: T.bgCard,
              border: `1px solid ${isUrgent ? T.crimson + '40' : T.border}`,
              borderLeft: isUrgent ? `3px solid ${T.crimson}` : `1px solid ${T.border}`,
              boxShadow: isUrgent ? T.glowCrimson : T.cardShadow,
              ...stagger(i),
            }}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: `${momColor}15`, color: momColor, border: `1px solid ${momColor}30` }}
              >
                {initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-display font-bold truncate" style={{ color: T.textPrimary }}>{c.name}</h3>
                <span
                  className="inline-block px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide rounded mt-0.5"
                  style={{ background: `${T.cyan}10`, color: T.cyan }}
                >
                  {c.niche}
                </span>
              </div>

              {/* Momentum ring */}
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="18" fill="none" stroke={T.border} strokeWidth="2.5" />
                  <circle
                    cx="20" cy="20" r="18" fill="none" stroke={momColor} strokeWidth="2.5"
                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-display font-bold" style={{ color: momColor }}>{momentum}</span>
                </div>
              </div>
            </div>

            {/* 7-day bar chart */}
            <div className="flex items-end gap-1 mt-4 h-8">
              {bars.map((val, j) => (
                <div
                  key={j}
                  className="flex-1 rounded-sm transition-all duration-300"
                  style={{
                    height: `${val}%`,
                    background: j === 6 ? momColor : `${momColor}30`,
                  }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[9px] font-mono" style={{ color: T.textDim }}>7-day engagement</span>
              <span className="text-[9px] font-mono" style={{ color: momColor }}>
                {momentum > 50 ? '+' : ''}{Math.round((momentum - 50) * 0.4)}%
              </span>
            </div>

            {/* Status + action */}
            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
              {isUrgent ? (
                <span
                  className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    color: T.crimson,
                    background: `${T.crimson}15`,
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                >
                  {silent}d SILENT
                </span>
              ) : silent === 0 ? (
                <span className="text-[10px] font-mono" style={{ color: T.green }}>● Posted today</span>
              ) : (
                <span className="text-[10px] font-mono" style={{ color: T.textDim }}>{silent}d ago</span>
              )}

              {isUrgent && (
                <button
                  className="text-[10px] font-mono uppercase tracking-wide px-2 py-1 rounded-lg transition-all duration-200 hover:brightness-125"
                  style={{ background: `${T.crimson}15`, color: T.crimson, border: `1px solid ${T.crimson}30` }}
                >
                  Generate rescue →
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

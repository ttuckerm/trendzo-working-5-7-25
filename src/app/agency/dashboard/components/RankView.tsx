'use client';

import React from 'react';
import { T, stagger } from './tokens';
import type { AgencyCreator } from '@/lib/dashboard/queries';

interface RankViewProps {
  creators: AgencyCreator[];
}

// TODO: wire to real competitive ranking data
function getRank(c: AgencyCreator) {
  const totalInNiche = 10 + Math.floor(Math.random() * 15);
  const rank = c.latestVPS >= 80 ? 1
    : c.latestVPS >= 65 ? Math.floor(Math.random() * 3) + 1
    : c.latestVPS >= 40 ? Math.floor(Math.random() * 5) + 3
    : Math.floor(Math.random() * 8) + 5;
  return { rank: Math.min(rank, totalInNiche), total: totalInNiche };
}

export default function RankView({ creators }: RankViewProps) {
  const ranked = creators.map(c => ({ ...c, ...getRank(c) })).sort((a, b) => a.rank - b.rank);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {ranked.map((c, i) => {
        const isDominant = c.rank <= 2;
        const isFirst = c.rank === 1;
        const positionPct = ((c.total - c.rank) / Math.max(c.total - 1, 1)) * 100;
        const vpsColor = c.latestVPS >= 65 ? T.green : c.latestVPS >= 40 ? T.gold : T.crimson;
        const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

        return (
          <div
            key={c.userId}
            className="relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:translate-y-[-2px]"
            style={{
              background: T.bgCard,
              border: `1px solid ${isFirst ? T.gold + '40' : T.border}`,
              boxShadow: isFirst ? T.glowGold : T.cardShadow,
              ...stagger(i),
            }}
          >
            {isFirst && (
              <div className="absolute top-0 left-3 right-3 h-[2px] rounded-full" style={{ background: T.gold }} />
            )}

            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: `${vpsColor}15`, color: vpsColor, border: `1px solid ${vpsColor}30` }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-display font-bold truncate" style={{ color: T.textPrimary }}>{c.name}</h3>
                <span className="text-[9px] font-mono uppercase" style={{ color: T.cyan }}>{c.niche}</span>
              </div>
              {/* Rank */}
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-xl font-display font-black" style={{ color: isFirst ? T.gold : T.textPrimary }}>
                    #{c.rank}
                  </span>
                  {isFirst && <span className="text-sm">👑</span>}
                </div>
                <p className="text-[9px] font-mono" style={{ color: T.textDim }}>of {c.total}</p>
              </div>
            </div>

            {/* Position bar */}
            <div className="mb-3">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: T.bgDeep }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${positionPct}%`,
                    background: isDominant
                      ? `linear-gradient(90deg, ${T.gold}, ${T.green})`
                      : `linear-gradient(90deg, ${T.cyan}60, ${T.cyan})`,
                  }}
                />
              </div>
            </div>

            {/* VPS + status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-display font-bold" style={{ color: vpsColor }}>{c.latestVPS || '--'}</span>
                <span className="text-[9px] font-mono uppercase" style={{ color: T.textDim }}>VPS</span>
              </div>
              <span
                className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  background: isDominant ? `${T.gold}15` : `${T.cyan}10`,
                  color: isDominant ? T.gold : T.cyan,
                }}
              >
                {isDominant ? 'Dominant' : 'Rising'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

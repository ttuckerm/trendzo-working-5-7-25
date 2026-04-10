'use client';

import React from 'react';
import { T, stagger } from './tokens';
import type { AgencyCreator } from '@/lib/dashboard/queries';

interface AccuracyViewProps {
  creators: AgencyCreator[];
}

// TODO: wire to real prediction accuracy data from prediction_runs + vps_evaluation
function generatePredictions(creators: AgencyCreator[]) {
  return creators.flatMap(c => {
    if (c.scriptCount === 0) return [];
    const count = Math.min(c.scriptCount, 3);
    return Array.from({ length: count }, (_, i) => {
      const predicted = c.avgVPS > 0 ? c.avgVPS + Math.floor(Math.random() * 20 - 10) : 50 + Math.floor(Math.random() * 30);
      const actual = predicted + Math.floor(Math.random() * 24 - 12);
      const diff = actual - predicted;
      const status: 'accurate' | 'outperformed' | 'missed' =
        Math.abs(diff) <= 5 ? 'accurate' : diff > 5 ? 'outperformed' : 'missed';
      return {
        id: `${c.userId}-${i}`,
        title: `Script #${c.scriptCount - i}`,
        creatorName: c.name,
        date: new Date(Date.now() - (i + 1) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        predicted: Math.max(0, Math.min(100, predicted)),
        actual: Math.max(0, Math.min(100, actual)),
        status,
      };
    });
  }).slice(0, 12);
}

const STATUS_BADGE = {
  accurate: { color: T.green, label: 'ACCURATE', bg: `${T.green}15` },
  outperformed: { color: T.cyan, label: 'OUTPERFORMED', bg: `${T.cyan}15` },
  missed: { color: T.crimson, label: 'MISSED', bg: `${T.crimson}15` },
} as const;

export default function AccuracyView({ creators }: AccuracyViewProps) {
  const predictions = generatePredictions(creators);
  const accurate = predictions.filter(p => p.status === 'accurate').length;
  const outperformed = predictions.filter(p => p.status === 'outperformed').length;
  const missed = predictions.filter(p => p.status === 'missed').length;
  const total = predictions.length;
  const accuracyPct = total > 0 ? Math.round(((accurate + outperformed) / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overall accuracy */}
        <div
          className="rounded-2xl p-5"
          style={{ background: T.bgCard, border: `1px solid ${T.border}`, boxShadow: T.cardShadow, ...stagger(0) }}
        >
          <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: T.textDim }}>Overall Accuracy</p>
          <p className="text-4xl font-display font-bold" style={{ color: T.violet }}>{accuracyPct}%</p>
          <p className="text-[10px] font-mono mt-1" style={{ color: T.textSecondary }}>{accurate + outperformed}/{total} within range</p>
        </div>

        {/* Breakdown */}
        <div
          className="rounded-2xl p-5"
          style={{ background: T.bgCard, border: `1px solid ${T.border}`, boxShadow: T.cardShadow, ...stagger(1) }}
        >
          <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: T.textDim }}>This Week</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-display font-bold" style={{ color: T.textPrimary }}>{total}</span>
            <span className="text-xs font-mono" style={{ color: T.textDim }}>predictions</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] font-mono">
            <span style={{ color: T.green }}>✓ {accurate}</span>
            <span style={{ color: T.cyan }}>↑ {outperformed}</span>
            <span style={{ color: T.crimson }}>✕ {missed}</span>
          </div>
        </div>

        {/* Streak */}
        <div
          className="rounded-2xl p-5"
          style={{ background: T.bgCard, border: `1px solid ${T.border}`, boxShadow: T.cardShadow, ...stagger(2) }}
        >
          <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: T.textDim }}>Accuracy Streak</p>
          <p className="text-4xl font-display font-bold" style={{ color: T.gold }}>
            {Math.max(1, accurate)}d
          </p>
          <p className="text-[10px] font-mono mt-1" style={{ color: T.gold }}>Top 15% of agencies</p>
        </div>
      </div>

      {/* Prediction list */}
      <div className="space-y-2">
        {predictions.map((p, i) => {
          const badge = STATUS_BADGE[p.status];
          return (
            <div
              key={p.id}
              className="flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 hover:translate-y-[-1px]"
              style={{ background: T.bgCard, border: `1px solid ${T.border}`, ...stagger(i, 200) }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-sans font-medium truncate" style={{ color: T.textPrimary }}>{p.title}</p>
                <p className="text-[10px] font-mono" style={{ color: T.textDim }}>{p.creatorName} · {p.date}</p>
              </div>

              {/* Predicted → Actual */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-mono" style={{ color: T.textDim }}>{p.predicted}</span>
                <span className="text-[10px]" style={{ color: T.textDim }}>→</span>
                <span className="text-sm font-display font-bold" style={{ color: badge.color }}>{p.actual}</span>
              </div>

              {/* Badge */}
              <span
                className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded flex-shrink-0"
                style={{ background: badge.bg, color: badge.color }}
              >
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

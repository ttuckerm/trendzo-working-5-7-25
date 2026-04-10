'use client';

import React from 'react';
import { T } from './tokens';

export type Dimension = 'momentum' | 'trends' | 'accuracy' | 'rank' | 'revenue';

interface DimensionButtonsProps {
  active: Dimension;
  onChange: (d: Dimension) => void;
}

const DIMENSIONS: { key: Dimension; icon: string; label: string; desc: string; color: string }[] = [
  { key: 'momentum', icon: '⚡', label: 'Momentum Pulse', desc: 'Posting cadence & engagement trajectory', color: T.green },
  { key: 'trends', icon: '◆', label: 'Trend Windows', desc: 'Niche opportunities closing soon', color: T.cyan },
  { key: 'accuracy', icon: '◎', label: 'Prediction Accuracy', desc: 'Predicted vs actual performance', color: T.violet },
  { key: 'rank', icon: '▲', label: 'Competitive Position', desc: 'Client niche standings', color: T.gold },
  { key: 'revenue', icon: '◈', label: 'Revenue Signal', desc: 'Content → business outcomes', color: T.crimson },
];

export default function DimensionButtons({ active, onChange }: DimensionButtonsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {DIMENSIONS.map(dim => {
        const isActive = active === dim.key;
        return (
          <button
            key={dim.key}
            onClick={() => onChange(dim.key)}
            className="flex-shrink-0 relative flex flex-col items-start gap-1 px-4 py-3 transition-all duration-250 text-left group"
            style={{
              borderRadius: 14,
              background: isActive ? 'rgba(15, 15, 22, 0.8)' : T.bgGlass,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${isActive ? dim.color + '40' : T.border}`,
              boxShadow: isActive ? `0 0 20px ${dim.color}15` : 'none',
              minWidth: 170,
            }}
          >
            {/* Top accent bar */}
            {isActive && (
              <div
                className="absolute top-0 left-3 right-3 h-[2px] rounded-full"
                style={{ background: dim.color }}
              />
            )}

            <div className="flex items-center gap-2">
              <span style={{ fontSize: 14, color: isActive ? dim.color : T.textDim }}>{dim.icon}</span>
              <span
                className="text-xs font-mono font-bold uppercase tracking-wide"
                style={{ color: isActive ? dim.color : T.textSecondary }}
              >
                {dim.label}
              </span>
            </div>
            <span
              className="text-[10px] font-sans leading-tight"
              style={{ color: isActive ? T.textSecondary : T.textDim }}
            >
              {dim.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}

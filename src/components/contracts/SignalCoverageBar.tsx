'use client';

import React, { useState } from 'react';

export interface SignalDetail {
  id: string;
  name: string;
  detail: string;
  status: 'measured' | 'partial' | 'missing';
}

export interface SignalCoverageBarProps {
  label: string;
  signalCount: number;
  coveragePercent: number;
  accentColor: string;
  icon?: React.ReactNode;
  signals?: SignalDetail[];
}

const STATUS_CONFIG = {
  measured: { label: 'Measured', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/25' },
  partial:  { label: 'Partial',  color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/25' },
  missing:  { label: 'Missing',  color: 'text-neutral-500', bg: 'bg-neutral-500/10', border: 'border-neutral-500/20' },
};

export function SignalCoverageBar({ label, signalCount, coveragePercent, accentColor, icon, signals }: SignalCoverageBarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => signals?.length && setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <div className="text-sm font-semibold text-neutral-200">{label}</div>
            <div className="text-xs text-neutral-400">{signalCount} signals</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${coveragePercent}%`, backgroundColor: accentColor }}
            />
          </div>
          <span className="text-xs font-mono w-8 text-right" style={{ color: accentColor }}>
            {coveragePercent}%
          </span>
        </div>
      </button>

      {expanded && signals && (
        <div className="border-t border-white/[0.04] px-4 pb-3">
          {signals.map((signal) => {
            const sc = STATUS_CONFIG[signal.status];
            return (
              <div key={signal.id} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="text-xs font-medium text-neutral-300">{signal.name}</div>
                  <div className="text-[10px] text-neutral-500 truncate">{signal.detail}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${sc.bg} ${sc.border} border ${sc.color} whitespace-nowrap`}>
                  {sc.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

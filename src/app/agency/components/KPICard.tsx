'use client';

import React from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  change?: string;
  accentColor: string;
}

export default function KPICard({ label, value, change, accentColor }: KPICardProps) {
  const isPositive = change && !change.startsWith('-');
  const changeColor = change
    ? change.startsWith('-')
      ? '#e63946'
      : change === '0' || change === '+0'
        ? '#f4b942'
        : '#2dd4a8'
    : undefined;

  return (
    <div className="relative bg-[#0f0f16] border border-[#1e1e2e] rounded-xl p-5 overflow-hidden animate-[materialize_0.5s_ease-out_both]">
      {/* Top gradient line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        }}
      />

      <p className="text-[10px] font-mono-label uppercase tracking-[0.15em] text-[#7a7889] mb-3">
        {label}
      </p>
      <p
        className="text-3xl font-display font-bold tracking-tight"
        style={{ color: accentColor }}
      >
        {value}
      </p>
      {change && (
        <p className="mt-2 text-xs font-mono-label" style={{ color: changeColor }}>
          {isPositive ? '↑' : '↓'} {change} vs last week
        </p>
      )}
    </div>
  );
}

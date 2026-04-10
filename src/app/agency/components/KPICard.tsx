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
      ? '#f04a4d'
      : change === '0' || change === '+0'
        ? '#f4b942'
        : '#2dd4a8'
    : undefined;

  return (
    <div className="relative rounded-2xl p-5 overflow-hidden" style={{ background: '#1c1c24', boxShadow: '-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6)', animation: 'materialize 350ms cubic-bezier(0.23, 1, 0.32, 1) both' }}>
      {/* Top gradient line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        }}
      />

      <p className="text-[10px] font-mono-label uppercase tracking-[0.15em] text-[#8888a0] mb-3">
        {label}
      </p>
      <p
        className="text-3xl font-display font-bold tracking-tight tabular-nums"
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

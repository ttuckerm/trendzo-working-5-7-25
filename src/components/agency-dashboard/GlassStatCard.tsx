'use client';

import React from 'react';

interface GlassStatCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; label?: string };
  accentColor?: string;
  icon?: React.ReactNode;
}

export default function GlassStatCard({
  label,
  value,
  trend,
  accentColor = '#00d4ff',
  icon,
}: GlassStatCardProps) {
  const trendColor = trend
    ? trend.value > 0 ? '#2dd4a8' : trend.value < 0 ? '#f04a4d' : '#8888a0'
    : undefined;
  const trendArrow = trend
    ? trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '→'
    : undefined;

  return (
    <div className="group relative rounded-2xl p-5 overflow-hidden transition-transform duration-300 hover:-translate-y-0.5"
      style={{
        background: 'rgba(15, 15, 22, 0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid #1e1e2e',
      }}
    >
      {/* Top-edge highlight */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: `linear-gradient(90deg, ${accentColor}88, transparent 70%)` }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#8888a0] mb-2">
            {label}
          </p>
          <p className="text-3xl font-display font-bold tracking-tight" style={{ color: accentColor }}>
            {value}
          </p>
          {trend && (
            <p className="mt-2 text-xs font-mono" style={{ color: trendColor }}>
              {trendArrow} {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ' vs last week'}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}20` }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Ambient glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ boxShadow: `inset 0 0 30px ${accentColor}08` }}
      />
    </div>
  );
}

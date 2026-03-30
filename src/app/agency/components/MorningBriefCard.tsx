'use client';

import React from 'react';
import MiniChart from './MiniChart';

export type BriefType = 'success' | 'warning' | 'info';

interface MorningBriefCardProps {
  type: BriefType;
  title: string;
  description: string;
  metric?: string;
  action?: { label: string; onClick: () => void };
  chartData?: number[];
}

const colorMap: Record<BriefType, { border: string; text: string; glow: string; chart: string; actionBg: string; actionBorder: string }> = {
  success: {
    border: '#2dd4a8',
    text: '#2dd4a8',
    glow: 'rgba(45, 212, 168, 0.06)',
    chart: '#2dd4a8',
    actionBg: 'rgba(45, 212, 168, 0.12)',
    actionBorder: 'rgba(45, 212, 168, 0.25)',
  },
  warning: {
    border: '#e63946',
    text: '#e63946',
    glow: 'rgba(230, 57, 70, 0.06)',
    chart: '#e63946',
    actionBg: 'rgba(230, 57, 70, 0.12)',
    actionBorder: 'rgba(230, 57, 70, 0.25)',
  },
  info: {
    border: '#00d4ff',
    text: '#00d4ff',
    glow: 'rgba(0, 212, 255, 0.06)',
    chart: '#00d4ff',
    actionBg: 'rgba(0, 212, 255, 0.12)',
    actionBorder: 'rgba(0, 212, 255, 0.25)',
  },
};

export default function MorningBriefCard({
  type,
  title,
  description,
  metric,
  action,
  chartData,
}: MorningBriefCardProps) {
  const colors = colorMap[type];

  return (
    <div
      className="relative bg-[#0f0f16] border border-[#1e1e2e] rounded-xl p-5 animate-[fadeSlideUp_0.5s_ease-out_both] overflow-hidden"
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: colors.border,
        background: `linear-gradient(135deg, ${colors.glow}, transparent 60%)`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3
            className="text-[11px] font-mono-label uppercase tracking-[0.12em] mb-2"
            style={{ color: colors.text }}
          >
            {title}
          </h3>
          <p className="text-sm text-[#e8e6e3]/70 font-body leading-relaxed">
            {description}
          </p>
          {metric && (
            <p className="mt-3 text-2xl font-display font-bold text-[#e8e6e3]">{metric}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-medium font-body transition-all duration-200 hover:brightness-110"
              style={{
                backgroundColor: colors.actionBg,
                border: `1px solid ${colors.actionBorder}`,
                color: colors.text,
              }}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Mini chart on right */}
        {chartData && chartData.length > 0 && (
          <div className="flex-shrink-0 mt-1">
            <MiniChart data={chartData} color={colors.chart} height={36} />
          </div>
        )}
      </div>
    </div>
  );
}

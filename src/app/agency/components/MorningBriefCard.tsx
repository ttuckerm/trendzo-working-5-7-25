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
  /** Agent persona name for attribution (e.g. "Trend Scout") */
  agentName?: string;
  /** Attribution action text (e.g. "detected 2:47am") */
  agentAction?: string;
  /** Stagger index for entry animation (0, 1, 2...) — 80ms delay per index */
  staggerIndex?: number;
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
    border: '#f04a4d',
    text: '#f04a4d',
    glow: 'rgba(230, 57, 70, 0.06)',
    chart: '#f04a4d',
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
  agentName,
  agentAction,
  staggerIndex = 0,
}: MorningBriefCardProps) {
  const colors = colorMap[type];

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        borderLeft: `3px solid ${colors.border}`,
        background: `linear-gradient(135deg, ${colors.glow}, #1c1c24 60%)`,
        boxShadow: '-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6)',
        animation: `fadeSlideUp 350ms cubic-bezier(0.23, 1, 0.32, 1) ${staggerIndex * 80}ms both`,
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
          <p className="text-sm text-[#e8e8f0]/70 font-body leading-relaxed">
            {description}
          </p>
          {metric && (
            <p className="mt-3 text-2xl font-display font-bold tabular-nums text-[#e8e8f0]">{metric}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-medium font-body hover:brightness-110"
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

      {/* Agent attribution line */}
      {agentName && (
        <div
          className="mt-3 pt-2 flex items-center gap-1 truncate"
          style={{ borderTop: `1px solid ${colors.border}15` }}
        >
          <span
            className="text-[11px] font-mono-label tracking-wide truncate"
            style={{ color: `${colors.text}99` }}
          >
            {agentName}{agentAction ? ` · ${agentAction}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';

interface GlassAlertItemProps {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  detail?: string;
  timestamp?: string;
}

const SEVERITY_META = {
  critical: { color: '#f04a4d', icon: '!', bg: '#f04a4d12' },
  warning:  { color: '#f4b942', icon: '⚠', bg: '#f4b94212' },
  info:     { color: '#00d4ff', icon: 'ℹ', bg: '#00d4ff12' },
} as const;

export default function GlassAlertItem({ severity, message, detail, timestamp }: GlassAlertItemProps) {
  const { color, icon, bg } = SEVERITY_META[severity];

  return (
    <div
      className="relative rounded-xl px-4 py-3 overflow-hidden transition-all duration-200 hover:brightness-110"
      style={{
        background: 'rgba(15, 15, 22, 0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid #1e1e2e',
      }}
    >
      {/* Left edge stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px]"
        style={{ background: color }}
      />

      <div className="flex items-start gap-3">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
          style={{ background: bg, color, border: `1px solid ${color}25` }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-sans font-medium text-[#e8e8f0]">{message}</p>
          {detail && (
            <p className="text-[10px] text-[#8888a0] mt-0.5 truncate">{detail}</p>
          )}
        </div>
        {timestamp && (
          <span className="text-[9px] font-mono text-[#8888a0] flex-shrink-0">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}

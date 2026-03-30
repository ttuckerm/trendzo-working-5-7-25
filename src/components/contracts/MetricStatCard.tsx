import React from 'react';

export interface MetricStatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
}

export function MetricStatCard({ icon, label, value, subtitle }: MetricStatCardProps) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
            {icon}
          </div>
        )}
        <span className="text-xs text-neutral-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold text-neutral-100">{value}</div>
      {subtitle && <div className="text-xs text-neutral-500">{subtitle}</div>}
    </div>
  );
}

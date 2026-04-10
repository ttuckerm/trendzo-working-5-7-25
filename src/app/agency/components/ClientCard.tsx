'use client';

import React from 'react';

interface ClientCardProps {
  name: string;
  niche: string | null;
  location?: string;
  lastVPS: number | null;
  status: 'active' | 'inactive' | 'warning';
  videoCount: number;
  engagementRate?: number;
}

function getVPSColor(vps: number | null): string {
  if (vps === null) return '#8888a0';
  if (vps >= 75) return '#2dd4a8';
  if (vps >= 50) return '#f4b942';
  return '#f04a4d';
}

function getStatusColor(status: string): string {
  if (status === 'active') return '#2dd4a8';
  if (status === 'warning') return '#f4b942';
  return '#f04a4d';
}

export default function ClientCard({
  name,
  niche,
  location,
  lastVPS,
  status,
  videoCount,
  engagementRate,
}: ClientCardProps) {
  const vpsColor = getVPSColor(lastVPS);
  const statusColor = getStatusColor(status);
  const vpsDisplay = lastVPS !== null ? Math.round(lastVPS) : '--';

  // SVG ring for VPS score
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = lastVPS !== null
    ? circumference - (lastVPS / 100) * circumference
    : circumference;

  return (
    <div
      className="group rounded-2xl p-5 cursor-pointer"
      style={{
        background: '#1c1c24',
        boxShadow: '-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6)',
        animation: 'materialize 350ms cubic-bezier(0.23, 1, 0.32, 1) both',
        transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 200ms cubic-bezier(0.23, 1, 0.32, 1)',
        willChange: 'transform',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = `-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6), 0 0 12px ${vpsColor}33`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = '-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6)';
      }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: name, niche, badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: statusColor }}
            />
            <h3 className="text-base font-display font-bold text-[#e8e8f0] truncate">
              {name}
            </h3>
          </div>
          <p className="text-[11px] font-mono-label uppercase tracking-[0.08em] text-[#8888a0] mb-3 truncate">
            {niche || 'No niche'}{location ? ` · ${location}` : ''}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono-label uppercase tracking-[0.08em] rounded-md bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/15">
              {videoCount} videos
            </span>
            {engagementRate !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono-label uppercase tracking-[0.08em] rounded-md bg-[#f04a4d]/10 text-[#f04a4d] border border-[#f04a4d]/15">
                {engagementRate.toFixed(1)}% eng
              </span>
            )}
          </div>
        </div>

        {/* Right: VPS ring */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="22" fill="none" stroke="#2a2a35" strokeWidth="2.5" />
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke={vpsColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-[stroke-dashoffset] duration-[400ms]"
              style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)', willChange: 'stroke-dashoffset' } as any}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-display font-bold tabular-nums" style={{ color: vpsColor }}>
              {vpsDisplay}
            </span>
            <span className="text-[8px] font-mono-label uppercase tracking-[0.12em] text-[#8888a0]">
              VPS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

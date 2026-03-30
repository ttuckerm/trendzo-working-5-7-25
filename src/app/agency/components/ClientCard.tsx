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
  if (vps === null) return '#4a4858';
  if (vps >= 75) return '#2dd4a8';
  if (vps >= 50) return '#f4b942';
  return '#e63946';
}

function getStatusColor(status: string): string {
  if (status === 'active') return '#2dd4a8';
  if (status === 'warning') return '#f4b942';
  return '#e63946';
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
      className="group bg-[#0f0f16] border border-[#1e1e2e] rounded-xl p-5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer animate-[materialize_0.5s_ease-out_both]"
      style={{
        // On hover, border color changes to VPS color via group-hover
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = vpsColor;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#1e1e2e';
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
            <h3 className="text-base font-display font-bold text-[#e8e6e3] truncate">
              {name}
            </h3>
          </div>
          <p className="text-[11px] font-mono-label uppercase tracking-[0.08em] text-[#7a7889] mb-3 truncate">
            {niche || 'No niche'}{location ? ` · ${location}` : ''}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono-label uppercase tracking-[0.06em] rounded-md bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/15">
              {videoCount} videos
            </span>
            {engagementRate !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono-label uppercase tracking-[0.06em] rounded-md bg-[#7b2ff7]/10 text-[#7b2ff7] border border-[#7b2ff7]/15">
                {engagementRate.toFixed(1)}% eng
              </span>
            )}
          </div>
        </div>

        {/* Right: VPS ring */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="22" fill="none" stroke="#1e1e2e" strokeWidth="2.5" />
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
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-display font-bold" style={{ color: vpsColor }}>
              {vpsDisplay}
            </span>
            <span className="text-[7px] font-mono-label uppercase tracking-[0.1em] text-[#7a7889]">
              VPS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

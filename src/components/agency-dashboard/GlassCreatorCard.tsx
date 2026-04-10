'use client';

import React from 'react';
import Link from 'next/link';

interface GlassCreatorCardProps {
  userId: string;
  name: string;
  niche: string;
  status: 'active' | 'inactive' | 'onboarding';
  latestVPS: number;
  avgVPS: number;
  scriptCount: number;
}

const VPS_COLOR = (vps: number) =>
  vps >= 65 ? '#2dd4a8' : vps >= 40 ? '#f4b942' : vps > 0 ? '#f04a4d' : '#3a3a4a';

const STATUS_META: Record<string, { color: string; label: string }> = {
  active:     { color: '#2dd4a8', label: 'Active' },
  onboarding: { color: '#f4b942', label: 'Onboarding' },
  inactive:   { color: '#f04a4d', label: 'Inactive' },
};

export default function GlassCreatorCard({
  userId,
  name,
  niche,
  status,
  latestVPS,
  avgVPS,
  scriptCount,
}: GlassCreatorCardProps) {
  const vpsColor = VPS_COLOR(latestVPS);
  const { color: statusColor, label: statusLabel } = STATUS_META[status] || STATUS_META.inactive;

  const circumference = 2 * Math.PI * 20;
  const offset = latestVPS > 0
    ? circumference - (Math.min(latestVPS, 100) / 100) * circumference
    : circumference;

  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/agency?focus=${userId}`}
      className="group relative block rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1"
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
        style={{ background: `linear-gradient(90deg, ${vpsColor}66, transparent 60%)` }}
      />

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
          style={{
            background: `linear-gradient(135deg, ${vpsColor}44, ${vpsColor}22)`,
            border: `1px solid ${vpsColor}33`,
          }}
        >
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-display font-bold text-[#e8e8f0] truncate">{name}</h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}66` }}
              />
              <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: statusColor }}>
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Niche badge */}
          <span className="inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide rounded-md mb-3"
            style={{ background: '#00d4ff0d', color: '#00d4ff', border: '1px solid #00d4ff18' }}
          >
            {niche}
          </span>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wide text-[#8888a0]">
            <span>{scriptCount} scripts</span>
            <span>avg {avgVPS || '--'}</span>
          </div>
        </div>

        {/* VPS ring */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="20" fill="none" stroke="#1e1e2e" strokeWidth="2" />
            <circle
              cx="22" cy="22" r="20"
              fill="none"
              stroke={vpsColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-display font-bold" style={{ color: vpsColor }}>
              {latestVPS > 0 ? latestVPS : '--'}
            </span>
            <span className="text-[7px] font-mono uppercase tracking-widest text-[#8888a0]">VPS</span>
          </div>
        </div>
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: `inset 0 0 40px ${vpsColor}08, 0 4px 20px ${vpsColor}10` }}
      />
    </Link>
  );
}

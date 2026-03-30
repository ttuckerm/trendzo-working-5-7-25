'use client';

import React from 'react';

interface CreatorRowProps {
  name: string;
  niche: string | null;
  lastVPS: number | null;
  lastActive: string | null;
  status: 'active' | 'inactive';
}

function getVPSColor(vps: number | null): string {
  if (vps === null) return 'text-white/30';
  if (vps >= 75) return 'text-[#2dd4a8]';
  if (vps >= 50) return 'text-[#f4b942]';
  return 'text-[#e63946]';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CreatorRow({ name, niche, lastVPS, lastActive, status }: CreatorRowProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/[0.03] transition-colors group">
      {/* Avatar placeholder */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7b2ff7] to-[#e63946] flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-white">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Name + niche */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{name}</p>
        <p className="text-xs text-white/40 truncate">{niche || 'No niche'}</p>
      </div>

      {/* VPS */}
      <div className="text-right shrink-0 w-16">
        <p className={`text-lg font-display font-bold ${getVPSColor(lastVPS)}`}>
          {lastVPS !== null ? lastVPS.toFixed(0) : '--'}
        </p>
        <p className="text-[9px] font-mono-label uppercase tracking-wider text-white/30">VPS</p>
      </div>

      {/* Last active */}
      <div className="text-right shrink-0 w-20 hidden sm:block">
        <p className="text-xs text-white/50">{formatDate(lastActive)}</p>
      </div>

      {/* Status dot */}
      <div className="shrink-0">
        <div
          className={`w-2 h-2 rounded-full ${
            status === 'active' ? 'bg-[#2dd4a8]' : 'bg-white/20'
          }`}
        />
      </div>
    </div>
  );
}

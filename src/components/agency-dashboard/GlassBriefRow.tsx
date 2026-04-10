'use client';

import React from 'react';

interface GlassBriefRowProps {
  title: string;
  creatorName: string;
  status: 'draft' | 'in-progress' | 'approved' | 'published';
  createdAt: string;
  niche?: string;
}

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  'draft':       { color: '#8888a0', bg: '#8888a012', label: 'Draft' },
  'in-progress': { color: '#f4b942', bg: '#f4b94212', label: 'In Progress' },
  'approved':    { color: '#00d4ff', bg: '#00d4ff12', label: 'Approved' },
  'published':   { color: '#2dd4a8', bg: '#2dd4a812', label: 'Published' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function GlassBriefRow({ title, creatorName, status, createdAt, niche }: GlassBriefRowProps) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.draft;

  return (
    <div
      className="flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 hover:brightness-110"
      style={{
        background: 'rgba(15, 15, 22, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid #1e1e2e',
      }}
    >
      {/* Status badge */}
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wide flex-shrink-0"
        style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}20` }}
      >
        {s.label}
      </span>

      {/* Title + creator */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-sans font-medium text-[#e8e8f0] truncate">{title}</p>
        <p className="text-[10px] text-[#8888a0] truncate">
          {creatorName}{niche ? ` · ${niche}` : ''}
        </p>
      </div>

      {/* Date */}
      <span className="text-[10px] font-mono text-[#8888a0] flex-shrink-0">
        {timeAgo(createdAt)}
      </span>
    </div>
  );
}

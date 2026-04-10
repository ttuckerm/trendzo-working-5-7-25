'use client';

import React from 'react';
import { Play } from 'lucide-react';

interface ConceptCardProps {
  title: string;
  tags: string[];
  vpsScore: number;
  gradientFrom?: string;
  gradientTo?: string;
}

function getVPSColor(vps: number): string {
  if (vps >= 80) return '#2dd4a8';
  if (vps >= 60) return '#f4b942';
  return '#f04a4d';
}

export default function ConceptCard({
  title,
  tags,
  vpsScore,
  gradientFrom = '#f04a4d',
  gradientTo = '#f04a4d',
}: ConceptCardProps) {
  const vpsColor = getVPSColor(vpsScore);

  return (
    <div className="group rounded-2xl overflow-hidden cursor-pointer" style={{ background: '#1c1c24', boxShadow: '-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6)', animation: 'materialize 350ms cubic-bezier(0.23, 1, 0.32, 1) both', transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1)', willChange: 'transform' }}>
      {/* Thumbnail area */}
      <div
        className="relative h-36 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}33, ${gradientTo}33)`,
        }}
      >
        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110" style={{ transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1)' }}>
          <Play className="w-5 h-5 text-white ml-0.5" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h4 className="text-sm font-body font-medium text-[#e8e8f0] line-clamp-2 leading-snug">
          {title}
        </h4>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[10px] font-mono-label uppercase tracking-[0.08em] rounded-md bg-[#f04a4d]/20 text-[#f04a4d] border border-[#f04a4d]/20"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* VPS prediction */}
        <div className="flex items-center justify-between pt-1 border-t border-[#2a2a35]">
          <span className="text-[9px] font-mono-label uppercase tracking-[0.12em] text-[#8888a0]">
            Virality Prediction
          </span>
          <span className="text-sm font-display font-bold tabular-nums" style={{ color: vpsColor }}>
            {vpsScore}
          </span>
        </div>
      </div>
    </div>
  );
}

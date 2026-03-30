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
  return '#e63946';
}

export default function ConceptCard({
  title,
  tags,
  vpsScore,
  gradientFrom = '#7b2ff7',
  gradientTo = '#e63946',
}: ConceptCardProps) {
  const vpsColor = getVPSColor(vpsScore);

  return (
    <div className="group bg-[#0f0f16] border border-[#1e1e2e] rounded-xl overflow-hidden hover:border-[#2a2a3e] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer animate-[materialize_0.5s_ease-out_both]">
      {/* Thumbnail area */}
      <div
        className="relative h-36 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}33, ${gradientTo}33)`,
        }}
      >
        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Play className="w-5 h-5 text-white ml-0.5" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h4 className="text-sm font-body font-medium text-[#e8e6e3] line-clamp-2 leading-snug">
          {title}
        </h4>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[10px] font-mono-label uppercase tracking-[0.08em] rounded-md bg-[#7b2ff7]/20 text-[#7b2ff7] border border-[#7b2ff7]/20"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* VPS prediction */}
        <div className="flex items-center justify-between pt-1 border-t border-[#1e1e2e]">
          <span className="text-[9px] font-mono-label uppercase tracking-[0.12em] text-[#7a7889]">
            Virality Prediction
          </span>
          <span className="text-sm font-display font-bold" style={{ color: vpsColor }}>
            {vpsScore}
          </span>
        </div>
      </div>
    </div>
  );
}

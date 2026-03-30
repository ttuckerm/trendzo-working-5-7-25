'use client';

import React from 'react';

interface TrendItemProps {
  name: string;
  velocity: number;
  score: number;
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#e63946';
  if (score >= 70) return '#f4b942';
  return '#00d4ff';
}

export default function TrendItem({ name, velocity, score }: TrendItemProps) {
  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="group flex items-center justify-between px-5 py-4 bg-[#0f0f16] border border-[#1e1e2e] rounded-xl hover:border-[#2a2a3e] transition-all duration-200 cursor-pointer animate-[materialize_0.5s_ease-out_both]">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-body font-medium text-[#e8e6e3] truncate">{name}</h4>
        <p className="text-xs font-mono-label uppercase tracking-[0.08em] mt-1" style={{ color }}>
          +{velocity}% velocity
        </p>
      </div>

      {/* Circular score indicator */}
      <div className="relative w-11 h-11 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="#1e1e2e" strokeWidth="2.5" />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-xs font-display font-bold"
          style={{ color }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}

'use client';

import React from 'react';

interface TrendItemProps {
  name: string;
  velocity: number;
  score: number;
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#f04a4d';
  if (score >= 70) return '#f4b942';
  return '#00d4ff';
}

export default function TrendItem({ name, velocity, score }: TrendItemProps) {
  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="group flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer" style={{ background: '#1c1c24', boxShadow: '-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6)', animation: 'materialize 350ms cubic-bezier(0.23, 1, 0.32, 1) both' }}>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-body font-medium text-[#e8e8f0] truncate">{name}</h4>
        <p className="text-xs font-mono-label uppercase tracking-[0.08em] mt-1" style={{ color }}>
          +{velocity}% velocity
        </p>
      </div>

      {/* Circular score indicator */}
      <div className="relative w-11 h-11 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="#2a2a35" strokeWidth="2.5" />
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
            className="transition-[stroke-dashoffset] duration-[400ms]"
            style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)', willChange: 'stroke-dashoffset' } as any}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-xs font-display font-bold tabular-nums"
          style={{ color }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}

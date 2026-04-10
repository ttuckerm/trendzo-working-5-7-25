'use client';

import React from 'react';
import type { AgencyCreator } from '@/lib/dashboard/queries';

interface AgencyScorecardProps {
  creators: AgencyCreator[];
}

function computeGrade(creators: AgencyCreator[]): { grade: string; color: string; score: number } {
  if (creators.length === 0) return { grade: '--', color: '#3a3a4a', score: 0 };

  const activeRatio = creators.filter(c => c.status === 'active').length / creators.length;
  const avgVPS = creators.reduce((s, c) => s + c.latestVPS, 0) / creators.length;
  const contentRatio = creators.filter(c => c.scriptCount > 0).length / creators.length;

  const score = Math.round(activeRatio * 30 + (avgVPS / 100) * 40 + contentRatio * 30);

  if (score >= 85) return { grade: 'A', color: '#2dd4a8', score };
  if (score >= 70) return { grade: 'B', color: '#00d4ff', score };
  if (score >= 55) return { grade: 'C', color: '#f4b942', score };
  if (score >= 40) return { grade: 'D', color: '#f4b942', score };
  return { grade: 'F', color: '#f04a4d', score };
}

interface BarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

function Bar({ label, value, max, color }: BarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-wide text-[#8888a0]">{label}</span>
        <span className="text-[10px] font-mono" style={{ color }}>{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#1e1e2e] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function AgencyScorecard({ creators }: AgencyScorecardProps) {
  const { grade, color, score } = computeGrade(creators);
  const activeCount = creators.filter(c => c.status === 'active').length;
  const avgVPS = creators.length > 0
    ? creators.reduce((s, c) => s + c.latestVPS, 0) / creators.length
    : 0;
  const contentCoverage = creators.length > 0
    ? (creators.filter(c => c.scriptCount > 0).length / creators.length) * 100
    : 0;

  return (
    <div
      className="rounded-2xl p-4 overflow-hidden"
      style={{
        background: 'rgba(15, 15, 22, 0.5)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid #1e1e2e',
      }}
    >
      <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#8888a0] mb-3">
        Agency Scorecard
      </h3>

      {/* Grade */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-display font-bold"
          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
        >
          {grade}
        </div>
        <div>
          <p className="text-sm font-display font-bold text-[#e8e8f0]">Overall Score</p>
          <p className="text-[10px] font-mono text-[#8888a0]">{score}/100</p>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        <Bar label="Active Creators" value={activeCount} max={creators.length || 1} color="#2dd4a8" />
        <Bar label="Avg VPS" value={avgVPS} max={100} color="#00d4ff" />
        <Bar label="Content Coverage" value={contentCoverage} max={100} color="#f4b942" />
      </div>
    </div>
  );
}

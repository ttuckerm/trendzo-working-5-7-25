'use client';

import React from 'react';
import Link from 'next/link';
import { getAgencySkills } from '@/lib/skills/agency-skills';

const T = {
  bg: '#08080d',
  card: '#1c1c24',
  glass: 'rgba(15, 15, 22, 0.6)',
  accent: '#f04a4d',
  cyan: '#00d4ff',
  green: '#2dd4a8',
  amber: '#f4b942',
  violet: '#7b2ff7',
  textPrimary: '#e8e8f0',
  textSecondary: '#8888a0',
  textDim: '#55556a',
  border: '#1e1e2e',
  blur: 'blur(16px)',
  raised: '-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6)',
  raisedSm: '-3px -3px 8px rgba(255,255,255,0.05), 3px 3px 8px rgba(0,0,0,0.5)',
  navShadow: '0 4px 12px rgba(0,0,0,0.5)',
} as const;

const TREND_ICON: Record<string, { symbol: string; color: string }> = {
  up: { symbol: '↑', color: T.green },
  down: { symbol: '↓', color: T.accent },
  stable: { symbol: '→', color: T.amber },
};

const BRIEF_STATUS: Record<string, { color: string; label: string }> = {
  draft: { color: T.textSecondary, label: 'Draft' },
  'in-progress': { color: T.amber, label: 'In Progress' },
  active: { color: T.amber, label: 'Active' },
  approved: { color: T.cyan, label: 'Approved' },
  published: { color: T.green, label: 'Published' },
  pending: { color: T.textSecondary, label: 'Pending' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface CreatorHomeProps {
  creatorName: string;
  niche: string | null;
  latestVPS: number | null;
  avgVPS: number | null;
  trendDirection: 'up' | 'down' | 'stable';
  totalScripts: number;
  recentScripts: { id: string; title: string; vpsScore: number | null; status: string; createdAt: string }[];
  briefs: { id: string; title: string; status: string; createdAt: string }[];
  predictionCount: number;
}

export default function CreatorHomeClient({
  creatorName,
  niche,
  latestVPS,
  avgVPS,
  trendDirection,
  totalScripts,
  recentScripts,
  briefs,
  predictionCount,
}: CreatorHomeProps) {
  const skills = getAgencySkills(niche || 'default');
  const trend = TREND_ICON[trendDirection];
  const circumference = 2 * Math.PI * 42;
  const vpsOffset = latestVPS != null
    ? circumference - (circumference * Math.min(latestVPS, 100)) / 100
    : circumference;
  const vpsColor = latestVPS != null
    ? latestVPS >= 65 ? T.green : latestVPS >= 40 ? T.amber : T.accent
    : T.textDim;

  return (
    <div className="min-h-screen" style={{ background: T.bg }}>
      {/* Nav */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6"
        style={{ background: T.bg, boxShadow: T.navShadow, height: 56 }}
      >
        <div className="flex items-center gap-3">
          <span className="font-display text-xl tracking-tight" style={{ color: T.accent }}>TRENDZO</span>
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: T.textSecondary }}>Creator</span>
        </div>
        <Link
          href="/studio/creator"
          className="px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wide transition hover:brightness-125"
          style={{ background: T.card, boxShadow: T.raisedSm, color: T.cyan }}
        >
          Studio
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Hero: Name + VPS ring */}
        <div
          className="rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 overflow-hidden relative"
          style={{ background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: `1px solid ${T.border}` }}
        >
          <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, ${vpsColor}66, transparent 60%)` }} />

          {/* VPS Ring */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="42" fill="none" stroke={T.border} strokeWidth="3" />
              {latestVPS != null && (
                <circle
                  cx="48" cy="48" r="42" fill="none" stroke={vpsColor} strokeWidth="3"
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={vpsOffset}
                  className="transition-all duration-700"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums" style={{ color: vpsColor }}>
                {latestVPS ?? '--'}
              </span>
              <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: T.textSecondary }}>VPS</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold mb-1" style={{ color: T.textPrimary }}>{creatorName}</h1>
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              {niche && (
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide rounded-md"
                  style={{ background: `${T.cyan}0d`, color: T.cyan, border: `1px solid ${T.cyan}18` }}
                >
                  {niche.replace(/-/g, ' ')}
                </span>
              )}
              <span className="text-sm font-mono" style={{ color: trend.color }}>
                {trend.symbol} {trendDirection}
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-lg font-bold tabular-nums" style={{ color: T.textPrimary }}>{avgVPS ?? '--'}</p>
              <p className="text-[9px] font-mono uppercase" style={{ color: T.textSecondary }}>Avg VPS</p>
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums" style={{ color: T.textPrimary }}>{totalScripts}</p>
              <p className="text-[9px] font-mono uppercase" style={{ color: T.textSecondary }}>Scripts</p>
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums" style={{ color: T.textPrimary }}>{predictionCount}</p>
              <p className="text-[9px] font-mono uppercase" style={{ color: T.textSecondary }}>Predictions</p>
            </div>
          </div>
        </div>

        {/* Two column: Briefs + Coaching */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Briefs */}
          <section
            className="rounded-2xl p-5 overflow-hidden"
            style={{ background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: `1px solid ${T.border}` }}
          >
            <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] mb-4" style={{ color: T.textSecondary }}>
              Active Briefs
            </h2>
            {briefs.length > 0 ? (
              <div className="space-y-2">
                {briefs.map(b => {
                  const s = BRIEF_STATUS[b.status] || BRIEF_STATUS.draft;
                  return (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:brightness-110"
                      style={{ background: T.bg, border: `1px solid ${T.border}` }}
                    >
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wide flex-shrink-0"
                        style={{ background: `${s.color}12`, color: s.color }}
                      >
                        {s.label}
                      </span>
                      <p className="text-xs truncate flex-1" style={{ color: T.textPrimary }}>{b.title}</p>
                      <span className="text-[10px] font-mono flex-shrink-0" style={{ color: T.textDim }}>{timeAgo(b.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs" style={{ color: T.textDim }}>No briefs assigned yet.</p>
            )}
          </section>

          {/* Coaching Recommendations */}
          <section
            className="rounded-2xl p-5 overflow-hidden"
            style={{ background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: `1px solid ${T.border}` }}
          >
            <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] mb-4" style={{ color: T.textSecondary }}>
              Coaching Focus
            </h2>
            <div className="space-y-3">
              {skills.coachingFocus.map((focus, i) => (
                <div
                  key={focus}
                  className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: T.bg, border: `1px solid ${T.border}` }}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
                    style={{ background: `${T.violet}15`, color: T.violet }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: T.textPrimary }}>{focus}</p>
                </div>
              ))}
            </div>

            {/* Suggested formats */}
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
              <p className="text-[9px] font-mono uppercase tracking-wide mb-2" style={{ color: T.textDim }}>
                Suggested formats
              </p>
              <div className="flex flex-wrap gap-1.5">
                {skills.contentFormats.map(fmt => (
                  <span
                    key={fmt}
                    className="px-2 py-0.5 rounded text-[9px] font-mono capitalize"
                    style={{ background: `${T.amber}0d`, color: T.amber, border: `1px solid ${T.amber}18` }}
                  >
                    {fmt.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Recent Content */}
        <section
          className="rounded-2xl p-5 overflow-hidden"
          style={{ background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: `1px solid ${T.border}` }}
        >
          <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] mb-4" style={{ color: T.textSecondary }}>
            Recent Content
          </h2>
          {recentScripts.length > 0 ? (
            <div className="space-y-2">
              {recentScripts.map(s => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 rounded-xl px-3 py-2.5"
                  style={{ background: T.bg, border: `1px solid ${T.border}` }}
                >
                  <span
                    className="text-sm font-bold tabular-nums w-10 text-center"
                    style={{ color: s.vpsScore != null ? (s.vpsScore >= 65 ? T.green : s.vpsScore >= 40 ? T.amber : T.accent) : T.textDim }}
                  >
                    {s.vpsScore != null ? Math.round(s.vpsScore) : '--'}
                  </span>
                  <p className="text-xs truncate flex-1" style={{ color: T.textPrimary }}>{s.title || 'Untitled'}</p>
                  <span className="text-[10px] font-mono flex-shrink-0" style={{ color: T.textDim }}>{timeAgo(s.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: T.textDim }}>No content yet. Head to the Studio to create your first piece.</p>
          )}
        </section>
      </main>
    </div>
  );
}

'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { T, ANIMATION_CSS } from './components/tokens';
import AgencyDashboardHeader from '@/components/agency/AgencyDashboardHeader';
import { getAgencySkills } from '@/lib/skills/agency-skills';
import DimensionButtons, { type Dimension } from './components/DimensionButtons';
import TrendsView from './components/TrendsView';
import AccuracyView from './components/AccuracyView';
import RankView from './components/RankView';
import RevenueView from './components/RevenueView';
import ClayPanel from './components/ClayPanel';
import type {
  AgencyStats,
  AgencyCreator,
  AgencyAlert,
  AgencyBrief,
  BriefVariant,
  CoachingInsight,
} from '@/lib/dashboard/queries';
import { getAgentForBriefCard, AGENT_PERSONAS } from '@/lib/agents/agent-personas';

// ── Helpers ──────────────────────────────────────────────────────────
const VPS_COLOR = (vps: number) =>
  vps >= 65 ? T.green : vps >= 40 ? T.amber : vps > 0 ? T.accent : T.textDim;

const STATUS_META: Record<string, { color: string; label: string }> = {
  active: { color: T.green, label: 'Active' },
  onboarding: { color: T.amber, label: 'Onboarding' },
  inactive: { color: T.accent, label: 'Inactive' },
};

const BRIEF_STATUS: Record<string, { color: string; label: string }> = {
  draft: { color: T.textSecondary, label: 'Draft' },
  'in-progress': { color: T.amber, label: 'In Progress' },
  approved: { color: T.cyan, label: 'Approved' },
  published: { color: T.green, label: 'Published' },
};

const SEVERITY_META = {
  critical: { color: T.accent, icon: '!' },
  warning: { color: T.amber, icon: '⚠' },
  info: { color: T.cyan, icon: 'ℹ' },
} as const;

const PRIORITY_META = {
  high: { color: T.accent, label: 'HIGH' },
  medium: { color: T.amber, label: 'MED' },
  low: { color: T.cyan, label: 'LOW' },
} as const;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getWeekDays() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateStr: d.toISOString().slice(0, 10),
      isToday: d.toDateString() === now.toDateString(),
      dayNum: d.getDate(),
    };
  });
}

function daysSilent(c: AgencyCreator): number {
  // TODO: wire to real last-post date from generated_scripts.created_at
  if (c.scriptCount === 0) return 14;
  if (c.status === 'inactive') return 7;
  if (c.status === 'onboarding') return 3;
  return Math.floor(Math.random() * 3);
}

function computeGrade(creators: AgencyCreator[]) {
  if (creators.length === 0) return { grade: '--', color: T.textDim, score: 0 };
  const activeRatio = creators.filter(c => c.status === 'active').length / creators.length;
  const avgVPS = creators.reduce((s, c) => s + c.latestVPS, 0) / creators.length;
  const contentRatio = creators.filter(c => c.scriptCount > 0).length / creators.length;
  const score = Math.round(activeRatio * 30 + (avgVPS / 100) * 40 + contentRatio * 30);
  if (score >= 85) return { grade: 'A', color: T.green, score };
  if (score >= 70) return { grade: 'B', color: T.cyan, score };
  if (score >= 55) return { grade: 'C', color: T.amber, score };
  if (score >= 40) return { grade: 'D', color: T.amber, score };
  return { grade: 'F', color: T.accent, score };
}

// ── Filter Pill ──────────────────────────────────────────────────────
function FilterPill({ label, active, onClick, count }: {
  label: string; active: boolean; onClick: () => void; count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide transition-all duration-200"
      style={{
        padding: '6px 14px',
        borderRadius: 20,
        background: T.bg,
        boxShadow: active ? T.inset : T.raisedSm,
        color: active ? T.cyan : T.textSecondary,
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {label}
      {count !== undefined && (
        <span className="text-[10px] font-bold rounded-full px-1.5" style={{ background: active ? `${T.cyan}20` : `${T.textDim}30`, color: active ? T.cyan : T.textDim }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Stat Counter ─────────────────────────────────────────────────────
function StatCounter({ value, label, color, delay }: {
  value: string | number; label: string; color: string; delay: number;
}) {
  return (
    <div style={{ animation: 'neuFadeUp 0.45s ease both', animationDelay: `${delay}ms` }} className="flex items-baseline gap-2">
      <span className="text-3xl font-display font-bold tracking-tight" style={{ color }}>{value}</span>
      <span className="text-xs font-mono uppercase tracking-wide" style={{ color: T.textSecondary }}>{label}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ── MAIN DASHBOARD ───────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

interface DashboardClientProps {
  stats: AgencyStats;
  creators: AgencyCreator[];
  alerts: AgencyAlert[];
  briefs: AgencyBrief[];
  insights: CoachingInsight[];
}

const AGENCY_ID = '62cb020e-5303-452e-8cf2-83368c912b6e';

export default function DashboardClient({ stats, creators, alerts, briefs: initialBriefs, insights }: DashboardClientProps) {
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'active' | 'onboarding' | 'inactive'>('all');
  const [briefFilter, setBriefFilter] = useState<'all' | 'draft' | 'in-progress' | 'approved' | 'published'>('all');
  const [activeDimension, setActiveDimension] = useState<Dimension>('momentum');
  const [clayOpen, setClayOpen] = useState(false);
  const [briefs, setBriefs] = useState<AgencyBrief[]>(initialBriefs);
  const [expandedAlts, setExpandedAlts] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApproveBrief = useCallback(async (briefId: string, variantLabel?: string) => {
    setActionLoading(briefId);
    try {
      await fetch('/api/agency/brief-review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(briefId), action: 'approve', variant_label: variantLabel || 'A' }),
      });
      setBriefs(prev => prev.filter(b => b.id !== briefId));
    } catch { console.error('Approve failed'); }
    setActionLoading(null);
  }, []);

  const handleRejectBrief = useCallback(async (briefId: string) => {
    setActionLoading(briefId);
    try {
      await fetch('/api/agency/brief-review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(briefId), action: 'reject', rejection_reason: rejectReason }),
      });
      setBriefs(prev => prev.filter(b => b.id !== briefId));
      setRejectingId(null);
      setRejectReason('');
    } catch { console.error('Reject failed'); }
    setActionLoading(null);
  }, [rejectReason]);

  const handleGenerateBriefs = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/agency/batch-briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agency_id: AGENCY_ID }),
      });
      const data = await res.json();
      if (data.success) {
        // Reload briefs from review endpoint
        const reviewRes = await fetch(`/api/agency/brief-review?agency_id=${AGENCY_ID}`);
        const reviewData = await reviewRes.json();
        if (reviewData.briefs) {
          const newPending: AgencyBrief[] = reviewData.briefs.map((b: any) => ({
            id: String(b.id),
            creatorName: b.client_name || 'Unknown',
            clientId: b.client_id,
            title: b.brief_content?.title || 'Untitled',
            status: 'draft' as const,
            createdAt: b.generated_at,
            niche: b.niche,
            briefContent: b.brief_content,
            vpsScore: b.vps_score,
            priorityType: b.priority_type,
            eventTitle: b.event_title,
            source: 'pre_generated' as const,
            variants: b.variants,
            hasMeaningfulAlternatives: b.has_meaningful_alternatives,
          }));
          setBriefs(prev => {
            const nonPending = prev.filter(b => b.source !== 'pre_generated');
            return [...newPending, ...nonPending];
          });
        }
      }
    } catch { console.error('Generation failed'); }
    setGenerating(false);
  }, []);

  const toggleAlts = (id: string) => {
    setExpandedAlts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // Resolve agency skill set from most common creator niche
  const nicheCounts = new Map<string, number>();
  for (const c of creators) {
    if (c.niche) nicheCounts.set(c.niche, (nicheCounts.get(c.niche) || 0) + 1);
  }
  const primaryNiche = [...nicheCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'default';
  const skills = getAgencySkills(primaryNiche);

  const filteredCreators = creatorFilter === 'all' ? creators : creators.filter(c => c.status === creatorFilter);
  const filteredBriefs = briefFilter === 'all' ? briefs : briefs.filter(b => b.status === briefFilter);

  const weekDays = getWeekDays();
  const briefsByDay = new Map<string, AgencyBrief[]>();
  for (const brief of briefs) {
    const dayKey = brief.createdAt.slice(0, 10);
    const existing = briefsByDay.get(dayKey) || [];
    existing.push(brief);
    briefsByDay.set(dayKey, existing);
  }

  const { grade, color: gradeColor, score: gradeScore } = computeGrade(creators);
  const activeCount = creators.filter(c => c.status === 'active').length;
  const avgVPS = creators.length > 0 ? Math.round(creators.reduce((s, c) => s + c.latestVPS, 0) / creators.length) : 0;
  const contentCoverage = creators.length > 0 ? Math.round((creators.filter(c => c.scriptCount > 0).length / creators.length) * 100) : 0;

  const creatorStatusCounts = {
    all: creators.length,
    active: creators.filter(c => c.status === 'active').length,
    onboarding: creators.filter(c => c.status === 'onboarding').length,
    inactive: creators.filter(c => c.status === 'inactive').length,
  };
  const briefStatusCounts = {
    all: briefs.length,
    draft: briefs.filter(b => b.status === 'draft').length,
    'in-progress': briefs.filter(b => b.status === 'in-progress').length,
    approved: briefs.filter(b => b.status === 'approved').length,
    published: briefs.filter(b => b.status === 'published').length,
  };

  return (
    <>
      <style>{ANIMATION_CSS}</style>
      <div className="flex h-screen overflow-hidden" style={{ background: T.bg }}>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* ═══ TOP NAV BAR (shared header) ═══ */}
          <AgencyDashboardHeader
            mode="grid"
            centerSlot={
              <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: T.bg, boxShadow: T.inset }}>
                {weekDays.map(day => {
                  const dayBriefsForDay = briefsByDay.get(day.dateStr) || [];
                  const hasContent = dayBriefsForDay.length > 0;
                  return (
                    <div
                      key={day.dateStr}
                      className="flex flex-col items-center px-2 py-1 rounded-lg transition-all duration-200"
                      style={{ background: day.isToday ? `${T.cyan}15` : 'transparent', minWidth: 40 }}
                      title={`${day.label} — ${hasContent ? `${dayBriefsForDay.length} brief${dayBriefsForDay.length > 1 ? 's' : ''}` : 'No content'}`}
                    >
                      <span className="text-[9px] font-mono uppercase" style={{ color: day.isToday ? T.cyan : T.textDim }}>{day.label}</span>
                      <div
                        className="w-2 h-2 rounded-full mt-0.5"
                        style={{
                          background: hasContent ? T.green : day.isToday ? T.cyan : T.textDim,
                          boxShadow: hasContent ? `0 0 6px ${T.green}60` : 'none',
                          opacity: hasContent || day.isToday ? 1 : 0.3,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            }
          />

          {/* ═══ SCROLLABLE CONTENT ═══ */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
            <div className="max-w-[1440px] mx-auto space-y-6">

              {/* WORKSPACE header + stats */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex items-center gap-4" style={{ animation: 'neuFadeUp 0.5s ease both' }}>
                  <h1 className="text-5xl sm:text-6xl font-display font-black tracking-tighter" style={{ color: T.textPrimary }}>
                    WORKSPACE
                  </h1>
                  <Link
                    href="/agency"
                    className="flex items-center gap-1.5 px-4 py-2 font-mono text-xs uppercase tracking-wide transition-all duration-200"
                    style={{ borderRadius: 14, background: T.bg, boxShadow: T.raisedSm, color: T.green }}
                  >
                    <span style={{ fontSize: 16 }}>+</span> New Brief
                  </Link>
                </div>
                <div className="flex items-center gap-6 flex-wrap">
                  <StatCounter value={stats.activeCreators} label="Creators" color={T.cyan} delay={100} />
                  <StatCounter value={stats.avgVPS || '--'} label="Avg VPS" color={T.green} delay={200} />
                  <StatCounter value={stats.contentThisWeek} label="This Week" color={T.amber} delay={300} />
                  <StatCounter value={stats.briefsPending} label="Pending" color={T.accent} delay={400} />
                  <StatCounter value={skills.kpiPriority[0]?.replace(/_/g, ' ') || 'engagement'} label="Top KPI" color={T.violet} delay={500} />
                </div>
              </div>

              {/* ═══ 5 MONITORING DIMENSION BUTTONS ═══ */}
              <div style={{ animation: 'neuFadeUp 0.45s ease both', animationDelay: '150ms' }}>
                <DimensionButtons active={activeDimension} onChange={setActiveDimension} />
              </div>

              {/* ═══ DIMENSION VIEWS ═══ */}
              <div key={activeDimension} style={{ animation: 'neuFadeUp 0.35s ease both' }}>

                {/* MOMENTUM PULSE = existing Creator Roster + Briefs + Coaching/Alerts */}
                {activeDimension === 'momentum' && (
                  <div className="space-y-6">

                    {/* Creator Roster — Horizontal Scroll */}
                    <section>
                      <div className="flex items-center gap-4 mb-4 flex-wrap">
                        <h2 className="text-sm font-display font-bold tracking-wide" style={{ color: T.textPrimary }}>Creator Roster</h2>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: `${T.cyan}15`, color: T.cyan }}>
                          {creators.length} Creators
                        </span>
                        <div className="flex items-center gap-2 ml-auto overflow-x-auto no-scrollbar">
                          {(['all', 'active', 'onboarding', 'inactive'] as const).map(f => (
                            <FilterPill key={f} label={f === 'all' ? 'All' : STATUS_META[f]?.label || f} active={creatorFilter === f} onClick={() => setCreatorFilter(f)} count={creatorStatusCounts[f]} />
                          ))}
                        </div>
                      </div>

                      {filteredCreators.length > 0 ? (
                        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                          {filteredCreators.map((c, i) => {
                            const vpsColor = VPS_COLOR(c.latestVPS);
                            const { color: statusColor, label: statusLabel } = STATUS_META[c.status] || STATUS_META.inactive;
                            const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                            const silent = daysSilent(c);
                            const isUrgent = silent >= 3;
                            const circumference = 2 * Math.PI * 20;
                            const offset = c.latestVPS > 0 ? circumference - (Math.min(c.latestVPS, 100) / 100) * circumference : circumference;

                            return (
                              <Link
                                key={c.userId}
                                href={`/agency?focus=${c.userId}`}
                                className="group flex-shrink-0 relative block rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                                style={{
                                  minWidth: 280,
                                  background: T.bgGlass,
                                  backdropFilter: T.blur,
                                  WebkitBackdropFilter: T.blur,
                                  border: `1px solid ${isUrgent ? T.crimson + '40' : T.border}`,
                                  borderLeft: isUrgent ? `3px solid ${T.crimson}` : undefined,
                                  animation: 'neuFadeUp 0.45s ease both',
                                  animationDelay: `${200 + i * 80}ms`,
                                }}
                              >
                                {/* Top accent bar */}
                                <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, ${vpsColor}66, transparent 60%)` }} />

                                <div className="flex items-start gap-4">
                                  {/* Avatar */}
                                  <div
                                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                                    style={{ background: `linear-gradient(135deg, ${vpsColor}44, ${vpsColor}22)`, border: `1px solid ${vpsColor}33` }}
                                  >
                                    {initials}
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="text-sm font-display font-bold text-[#e8e8f0] truncate">{c.name}</h3>
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}66` }} />
                                        <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: statusColor }}>{statusLabel}</span>
                                      </div>
                                    </div>

                                    {/* Niche badge + content format tags */}
                                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                                      <span className="inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide rounded-md"
                                        style={{ background: '#00d4ff0d', color: '#00d4ff', border: '1px solid #00d4ff18' }}
                                      >
                                        {c.niche}
                                      </span>
                                      {getAgencySkills(c.niche).contentFormats.slice(0, 2).map(fmt => (
                                        <span key={fmt} className="inline-block px-1.5 py-0.5 text-[9px] font-mono rounded"
                                          style={{ background: `${T.amber}0d`, color: T.amber, border: `1px solid ${T.amber}18` }}
                                        >
                                          {fmt}
                                        </span>
                                      ))}
                                    </div>

                                    {/* Stats row */}
                                    <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wide" style={{ color: T.textSecondary }}>
                                      <span>{c.scriptCount} scripts</span>
                                      <span>avg {c.avgVPS || '--'}</span>
                                    </div>
                                  </div>

                                  {/* VPS ring */}
                                  <div className="relative w-14 h-14 flex-shrink-0">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                                      <circle cx="22" cy="22" r="20" fill="none" stroke="#1e1e2e" strokeWidth="2" />
                                      <circle
                                        cx="22" cy="22" r="20" fill="none" stroke={vpsColor} strokeWidth="2"
                                        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                                        className="transition-all duration-700"
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      <span className="text-base font-display font-bold" style={{ color: vpsColor }}>
                                        {c.latestVPS > 0 ? c.latestVPS : '--'}
                                      </span>
                                      <span className="text-[7px] font-mono uppercase tracking-widest text-[#8888a0]">VPS</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Last posted indicator */}
                                <div className="mt-3 pt-2 flex items-center justify-between" style={{ borderTop: `1px solid ${T.border}` }}>
                                  {isUrgent ? (
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                                      style={{ color: T.crimson, background: `${T.crimson}15`, animation: 'pulse 2s ease-in-out infinite' }}
                                    >
                                      {silent}d SILENT
                                    </span>
                                  ) : silent === 0 ? (
                                    <span className="text-[10px] font-mono" style={{ color: T.green }}>● Posted today</span>
                                  ) : (
                                    <span className="text-[10px] font-mono" style={{ color: T.textDim }}>Last post {silent}d ago</span>
                                  )}
                                  {isUrgent && (
                                    <span className="text-[9px] font-mono" style={{ color: T.crimson }}>Generate rescue →</span>
                                  )}
                                </div>

                                {/* Hover glow */}
                                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                  style={{ boxShadow: `inset 0 0 40px ${vpsColor}08, 0 4px 20px ${vpsColor}10` }}
                                />
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-2xl p-8 text-center" style={{ background: T.bgGlass, border: `1px solid ${T.border}` }}>
                          <p className="text-sm" style={{ color: T.textSecondary }}>No creators match this filter.</p>
                        </div>
                      )}
                    </section>

                    {/* Active Briefs */}
                    <section>
                      <div className="flex items-center gap-4 mb-4 flex-wrap">
                        <h2 className="text-sm font-display font-bold tracking-wide" style={{ color: T.textPrimary }}>Active Briefs</h2>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: `${T.amber}15`, color: T.amber }}>{briefs.length} Briefs</span>
                        <button
                          onClick={handleGenerateBriefs}
                          disabled={generating}
                          className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide transition-all duration-200"
                          style={{ padding: '6px 14px', borderRadius: 14, background: T.bg, boxShadow: T.raisedSm, color: T.green, border: 'none', cursor: 'pointer', opacity: generating ? 0.5 : 1 }}
                        >
                          {generating ? '◌ Generating...' : '+ Generate Briefs'}
                        </button>
                        <div className="flex items-center gap-2 ml-auto overflow-x-auto no-scrollbar">
                          {(['all', 'draft', 'in-progress', 'approved', 'published'] as const).map(f => (
                            <FilterPill key={f} label={f === 'all' ? 'All' : BRIEF_STATUS[f]?.label || f} active={briefFilter === f} onClick={() => setBriefFilter(f)} count={briefStatusCounts[f]} />
                          ))}
                        </div>
                      </div>
                      {filteredBriefs.length > 0 ? (
                        <div className="space-y-3">
                          {filteredBriefs.map(b => {
                            const s = BRIEF_STATUS[b.status] || BRIEF_STATUS.draft;
                            const isPending = b.source === 'pre_generated' && b.status === 'draft';
                            const alternatives = (b.variants || []).filter((v: BriefVariant) => v.variant_label !== 'A');
                            const showAlts = b.hasMeaningfulAlternatives && alternatives.length > 0;
                            const isAltOpen = expandedAlts.has(b.id);

                            return (
                              <div key={b.id} className="rounded-xl overflow-hidden transition-all duration-200" style={{ background: T.bgGlass, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: `1px solid ${isPending ? T.cyan + '30' : T.border}` }}>
                                <div className="flex items-start gap-4 px-4 py-3">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wide flex-shrink-0 mt-0.5" style={{ background: `${s.color}12`, color: s.color, border: `1px solid ${s.color}20` }}>{s.label}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <p className="text-xs font-sans font-medium text-[#e8e8f0] truncate">{b.title}</p>
                                      {b.vpsScore != null && (
                                        <span className="text-[10px] font-mono flex-shrink-0" style={{ color: VPS_COLOR(b.vpsScore) }}>VPS {b.vpsScore}</span>
                                      )}
                                      {b.priorityType === 'outperformance_alert' && (
                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${T.green}15`, color: T.green }}>OUTPERFORM</span>
                                      )}
                                      {b.priorityType === 'decay_warning' && (
                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${T.amber}15`, color: T.amber }}>DECAY</span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-[#8888a0] truncate">{b.creatorName}{b.niche ? ` · ${b.niche}` : ''}{b.eventTitle ? ` · ${b.eventTitle}` : ''}</p>

                                    {/* Agent attribution */}
                                    {isPending && (() => {
                                      const agent = getAgentForBriefCard(b.priorityType || 'trend_opportunity');
                                      return (
                                        <p className="text-[10px] mt-0.5 truncate" style={{ color: `${agent.color}88`, fontFamily: "'JetBrains Mono', monospace" }}>
                                          {agent.name} · drafted{b.vpsScore ? ` · VPS ${b.vpsScore}` : ''}
                                        </p>
                                      );
                                    })()}

                                    {/* Expanded brief details for pending review */}
                                    {isPending && b.briefContent && (
                                      <div className="mt-2 space-y-1.5">
                                        <div className="rounded-lg px-3 py-2" style={{ background: `${T.bg}` }}>
                                          <p className="text-[10px] font-mono uppercase mb-0.5" style={{ color: T.textDim }}>Hook</p>
                                          <p className="text-[11px] text-[#c0c0d0] italic">&quot;{b.briefContent.hook}&quot;</p>
                                        </div>
                                        <div className="flex gap-3 text-[10px]" style={{ color: T.textSecondary }}>
                                          <span>Format: {b.briefContent.format}</span>
                                          <span>CTA: {b.briefContent.cta}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {isPending ? (
                                      <>
                                        {rejectingId === b.id ? (
                                          <div className="flex flex-col gap-1.5">
                                            <input
                                              value={rejectReason}
                                              onChange={e => setRejectReason(e.target.value)}
                                              placeholder="Reason (optional)"
                                              className="text-[10px] px-2 py-1 rounded border bg-transparent text-[#c0c0d0]"
                                              style={{ borderColor: T.border, width: 160 }}
                                            />
                                            <div className="flex gap-1">
                                              <button
                                                onClick={() => handleRejectBrief(b.id)}
                                                disabled={actionLoading === b.id}
                                                className="text-[10px] font-mono px-2 py-1 rounded transition-all"
                                                style={{ background: `${T.accent}20`, color: T.accent, opacity: actionLoading === b.id ? 0.5 : 1 }}
                                              >Reject</button>
                                              <button
                                                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                                className="text-[10px] font-mono px-2 py-1 rounded"
                                                style={{ color: T.textDim }}
                                              >Cancel</button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <button
                                              onClick={() => handleApproveBrief(b.id, 'A')}
                                              disabled={actionLoading === b.id}
                                              className="text-[10px] font-mono font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all duration-200"
                                              style={{ background: `${T.green}18`, color: T.green, border: `1px solid ${T.green}30`, cursor: 'pointer', opacity: actionLoading === b.id ? 0.5 : 1 }}
                                            >Approve</button>
                                            <button
                                              onClick={() => setRejectingId(b.id)}
                                              className="text-[10px] font-mono uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all duration-200"
                                              style={{ background: `${T.accent}12`, color: T.accent, border: `1px solid ${T.accent}20`, cursor: 'pointer' }}
                                            >Reject</button>
                                          </>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-[10px] font-mono flex-shrink-0" style={{ color: T.textSecondary }}>{timeAgo(b.createdAt)}</span>
                                    )}
                                  </div>
                                </div>

                                {/* Variant Alternatives */}
                                {showAlts && (
                                  <div className="px-4 pb-3">
                                    <button
                                      onClick={() => toggleAlts(b.id)}
                                      className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide transition-colors"
                                      style={{ color: T.cyan, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                                    >
                                      {isAltOpen ? '▾' : '▸'} {isAltOpen ? 'Hide' : 'See'} {alternatives.length} alternative{alternatives.length !== 1 ? 's' : ''}
                                    </button>

                                    {isAltOpen && (
                                      <div className="mt-2 space-y-2">
                                        {alternatives.map((v: BriefVariant) => {
                                          const dims = v.feature_dimensions_varied;
                                          const changeLabel = dims.hook_type
                                            ? `Hook: ${dims.changed_from} → ${dims.hook_type}`
                                            : dims.content_format
                                              ? `Format: ${dims.changed_from} → ${dims.content_format}`
                                              : 'Modified';

                                          return (
                                            <div key={v.variant_label} className="rounded-lg px-3 py-2.5 flex items-start gap-3" style={{ background: `${T.cyan}08`, border: `1px solid ${T.cyan}18` }}>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: `${T.cyan}18`, color: T.cyan }}>Variant {v.variant_label}</span>
                                                  <span className="text-[10px] font-mono" style={{ color: VPS_COLOR(v.vps_score) }}>VPS {v.vps_score}</span>
                                                  <span className="text-[9px] font-mono" style={{ color: T.textDim }}>{changeLabel}</span>
                                                </div>
                                                <p className="text-[11px] text-[#c0c0d0] font-medium">{v.brief_content.title}</p>
                                                <p className="text-[10px] text-[#8888a0] italic mt-0.5">&quot;{v.brief_content.hook}&quot;</p>
                                              </div>
                                              <button
                                                onClick={() => handleApproveBrief(b.id, v.variant_label)}
                                                disabled={actionLoading === b.id}
                                                className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg flex-shrink-0 transition-all"
                                                style={{ background: `${T.cyan}18`, color: T.cyan, border: `1px solid ${T.cyan}30`, cursor: 'pointer', opacity: actionLoading === b.id ? 0.5 : 1 }}
                                              >Approve {v.variant_label}</button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-2xl p-6 text-center" style={{ background: T.bgGlass, border: `1px solid ${T.border}` }}>
                          <p className="text-sm" style={{ color: T.textSecondary }}>{briefFilter === 'all' ? 'No briefs yet. Click "Generate Briefs" to create some.' : 'No briefs match this filter.'}</p>
                        </div>
                      )}
                    </section>

                    {/* Bottom: Coaching + Alerts sidebar */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                      <section>
                        <div className="flex items-center gap-3 mb-3">
                          <h2 className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: T.textSecondary }}>Coaching Insights</h2>
                          {skills.coachingFocus.slice(0, 2).map(f => (
                            <span key={f} className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${T.violet}12`, color: T.violet, border: `1px solid ${T.violet}20` }}>
                              {f}
                            </span>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {insights.map(ins => {
                            const p = PRIORITY_META[ins.priority];
                            return (
                              <div key={ins.id} className="relative rounded-xl p-4 overflow-hidden transition-all duration-300 hover:-translate-y-0.5" style={{ background: T.bgGlass, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: `1px solid ${p.color}33` }}>
                                <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, ${p.color}55, transparent 50%)` }} />
                                <div className="flex items-start gap-3">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider flex-shrink-0 mt-0.5" style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}25` }}>{p.label}</span>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-display font-bold text-[#e8e8f0] mb-1">{ins.title}</h4>
                                    <p className="text-[11px] text-[#8888a0] leading-relaxed">{ins.recommendation}</p>
                                    {ins.creatorName && <p className="text-[10px] font-mono text-[#00d4ff] mt-1.5">Re: {ins.creatorName}</p>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>

                      <aside className="space-y-4">
                        <div>
                          <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] mb-3" style={{ color: T.textSecondary }}>Alerts</h2>
                          <div className="space-y-2">
                            {alerts.map(a => {
                              const sev = SEVERITY_META[a.severity];
                              return (
                                <div key={a.id} className="relative rounded-xl px-4 py-3 overflow-hidden transition-all duration-200 hover:brightness-110" style={{ background: T.bgGlass, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${T.border}` }}>
                                  <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: sev.color }} />
                                  <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold" style={{ background: `${sev.color}12`, color: sev.color, border: `1px solid ${sev.color}25` }}>{sev.icon}</div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-sans font-medium text-[#e8e8f0]">{a.message}</p>
                                      {a.detail && <p className="text-[10px] text-[#8888a0] mt-0.5 truncate">{a.detail}</p>}
                                      <p className="text-[9px] mt-1 truncate" style={{ color: a.severity === 'critical' ? `${AGENT_PERSONAS.performance_analyst.color}77` : a.severity === 'warning' ? `${AGENT_PERSONAS.performance_analyst.color}77` : `${AGENT_PERSONAS.trend_scout.color}77`, fontFamily: "'JetBrains Mono', monospace" }}>
                                        {a.severity === 'info' ? 'Trend Scout' : 'Performance Analyst'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Agency Scorecard */}
                        <div className="rounded-2xl p-4 overflow-hidden" style={{ background: T.bgGlass, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: `1px solid ${T.border}` }}>
                          <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] mb-3" style={{ color: T.textSecondary }}>Agency Scorecard</h3>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-display font-bold" style={{ background: `${gradeColor}15`, color: gradeColor, border: `1px solid ${gradeColor}30` }}>{grade}</div>
                            <div>
                              <p className="text-sm font-display font-bold text-[#e8e8f0]">Overall Score</p>
                              <p className="text-[10px] font-mono" style={{ color: T.textSecondary }}>{gradeScore}/100</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {[
                              { label: 'Active Creators', value: activeCount, max: creators.length || 1, color: T.green },
                              { label: 'Avg VPS', value: avgVPS, max: 100, color: T.cyan },
                              { label: 'Content Coverage', value: contentCoverage, max: 100, color: T.amber },
                            ].map(bar => {
                              const pct = bar.max > 0 ? Math.min((bar.value / bar.max) * 100, 100) : 0;
                              return (
                                <div key={bar.label}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-mono uppercase tracking-wide" style={{ color: T.textSecondary }}>{bar.label}</span>
                                    <span className="text-[10px] font-mono" style={{ color: bar.color }}>{Math.round(bar.value)}</span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-[#1e1e2e] overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: bar.color }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Weekly Calendar */}
                        <div className="rounded-2xl p-4 overflow-hidden" style={{ background: T.bgGlass, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: `1px solid ${T.border}` }}>
                          <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] mb-3" style={{ color: T.textSecondary }}>Weekly Calendar</h3>
                          <div className="grid grid-cols-7 gap-1">
                            {weekDays.map(day => {
                              const dayBriefs = briefsByDay.get(day.dateStr) || [];
                              const hasContent = dayBriefs.length > 0;
                              return (
                                <div key={day.dateStr} className="text-center">
                                  <p className={`text-[9px] font-mono uppercase mb-1 ${day.isToday ? 'text-[#00d4ff]' : 'text-[#8888a0]'}`}>{day.label}</p>
                                  <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-mono ${day.isToday ? 'ring-1 ring-[#00d4ff44]' : ''}`} style={{ background: hasContent ? '#2dd4a818' : '#f04a4d08', border: `1px solid ${hasContent ? '#2dd4a825' : '#f04a4d15'}`, color: hasContent ? T.green : '#3a3a4a' }}>
                                    {hasContent ? dayBriefs.length : '·'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {weekDays.filter(d => !(briefsByDay.get(d.dateStr)?.length)).length >= 4 && (
                            <p className="text-[9px] font-mono mt-2" style={{ color: T.amber }}>⚠ {weekDays.filter(d => !(briefsByDay.get(d.dateStr)?.length)).length} days with no content scheduled</p>
                          )}
                        </div>
                      </aside>
                    </div>
                  </div>
                )}

                {/* Other dimension views */}
                {activeDimension === 'trends' && <TrendsView creators={creators} />}
                {activeDimension === 'accuracy' && <AccuracyView creators={creators} />}
                {activeDimension === 'rank' && <RankView creators={creators} />}
                {activeDimension === 'revenue' && <RevenueView creators={creators} />}
              </div>
            </div>
          </main>
        </div>

        {/* ═══ CLAY RIGHT PANEL (toggleable) ═══ */}
        {clayOpen && (
          <ClayPanel creators={creators} briefs={briefs} stats={stats} insights={insights} />
        )}
      </div>
    </>
  );
}

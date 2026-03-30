'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Target,
  TrendingUp,
  Database,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  RefreshCw,
  Copy,
  BarChart3,
  Clock,
  Flag,
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  Cell,
} from 'recharts';

// ─── Types (matching API response) ──────────────────────────────────────────

interface OverviewMetrics {
  spearman_rho: number | null;
  p_value: number | null;
  n: number;
  mae: number | null;
  within_range_pct: number | null;
  computed_at: string | null;
}

interface ScatterPoint {
  run_id: string;
  predicted_vps: number;
  actual_vps: number;
  prediction_error: number;
  within_range: boolean;
  niche: string | null;
  created_at: string;
}

interface NicheAccuracy {
  niche: string;
  n: number;
  spearman_rho: number;
  mae: number;
  within_range_pct: number;
}

interface EvaluationSnapshot {
  computed_at: string;
  n: number;
  spearman_rho: number;
  mae: number;
  within_range_pct: number;
}

interface MilestoneTarget {
  target: number;
  remaining: number;
  est_weeks: number | null;
  est_date: string | null;
  trigger_label: string;
}

interface AccuracyData {
  overview: OverviewMetrics;
  scatterPoints: ScatterPoint[];
  byNiche: NicheAccuracy[];
  evaluationHistory: EvaluationSnapshot[];
  milestones: {
    current: number;
    weekly_rate: number;
    targets: MilestoneTarget[];
  };
  worstPredictions: Array<{
    run_id: string;
    predicted_vps: number;
    actual_vps: number;
    abs_error: number;
    niche: string | null;
    created_at: string;
  }>;
  queriedAt: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function rhoColor(rho: number | null): string {
  if (rho == null) return 'text-neutral-500';
  const abs = Math.abs(rho);
  if (abs >= 0.7) return 'text-green-400';
  if (abs >= 0.4) return 'text-yellow-400';
  if (abs >= 0.2) return 'text-orange-400';
  return 'text-red-400';
}

function rhoQuality(rho: number | null): string {
  if (rho == null) return 'Insufficient data';
  const abs = Math.abs(rho);
  if (abs >= 0.7) return 'Strong';
  if (abs >= 0.4) return 'Moderate';
  if (abs >= 0.2) return 'Weak';
  return 'Very weak';
}

function errorColor(absError: number): string {
  if (absError > 20) return 'text-red-400';
  if (absError > 10) return 'text-orange-400';
  if (absError > 5) return 'text-yellow-400';
  return 'text-green-400';
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AccuracyDashboardPage() {
  const [data, setData] = useState<AccuracyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/operations/accuracy', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-8 max-w-[1400px] mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/operations"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <Target className="w-6 h-6 text-emerald-500" />
              Prediction Accuracy
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              VPS prediction quality metrics and trend analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-neutral-500">
              Updated {timeAgo(lastRefresh.toISOString())}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          Failed to load accuracy data: {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
          <div className="h-[400px] rounded-xl bg-white/5 animate-pulse" />
        </div>
      )}

      {data && (
        <>
          {/* Early data banner */}
          {data.overview.n < 10 && data.overview.n > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Early data: Only {data.overview.n} labeled videos. Metrics will become more reliable as labeled data grows.
            </div>
          )}

          {/* ─── Section 1: Overview Cards ─────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              icon={<TrendingUp className={`w-5 h-5 ${rhoColor(data.overview.spearman_rho)}`} />}
              label="Spearman Rank Correlation"
              value={data.overview.spearman_rho != null ? data.overview.spearman_rho.toFixed(3) : 'N/A'}
              sub={rhoQuality(data.overview.spearman_rho)}
              valueColor={rhoColor(data.overview.spearman_rho)}
            />
            <SummaryCard
              icon={<Database className="w-5 h-5 text-blue-400" />}
              label="Labeled Videos"
              value={data.overview.n}
              sub="Minimum 50 for reliable correlation"
            />
            <SummaryCard
              icon={<Target className={`w-5 h-5 ${
                data.overview.mae != null && data.overview.mae <= 10 ? 'text-green-400' : 'text-amber-400'
              }`} />}
              label="Mean Absolute Error"
              value={data.overview.mae != null ? `${data.overview.mae.toFixed(1)} VPS` : 'N/A'}
              sub="Average prediction miss in VPS points"
            />
            <SummaryCard
              icon={<CheckCircle className={`w-5 h-5 ${
                data.overview.within_range_pct != null && data.overview.within_range_pct >= 60
                  ? 'text-green-400'
                  : data.overview.within_range_pct != null && data.overview.within_range_pct >= 40
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`} />}
              label="Within Prediction Range"
              value={data.overview.within_range_pct != null ? `${data.overview.within_range_pct.toFixed(1)}%` : 'N/A'}
              sub="Actual VPS fell within predicted range"
            />
          </div>

          {/* ─── Section 2: Scatter Plot ───────────────────────────────────── */}
          <Section title="Predicted vs Actual VPS" icon={<BarChart3 className="w-4 h-4" />}>
            {data.scatterPoints.length < 3 ? (
              <InsufficientData message="Scatter plot requires at least 3 labeled predictions. Currently have" count={data.scatterPoints.length} />
            ) : (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-4 mb-3 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Within range
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Outside range
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 border-t border-dashed border-neutral-500 inline-block" /> Perfect prediction
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      type="number"
                      dataKey="predicted_vps"
                      name="Predicted VPS"
                      domain={[0, 100]}
                      stroke="#4b5563"
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      label={{ value: 'Predicted VPS', position: 'bottom', fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="actual_vps"
                      name="Actual VPS"
                      domain={[0, 100]}
                      stroke="#4b5563"
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      label={{ value: 'Actual VPS', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
                    />
                    <ReferenceLine
                      segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
                      stroke="#6b7280"
                      strokeDasharray="6 4"
                      strokeWidth={1}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p = payload[0].payload as ScatterPoint;
                        return (
                          <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-3 text-xs space-y-1 shadow-xl">
                            <div className="text-neutral-300 font-mono">{p.run_id.slice(0, 8)}...</div>
                            <div>Predicted: <span className="text-blue-400 font-bold">{p.predicted_vps.toFixed(1)}</span></div>
                            <div>Actual: <span className="text-emerald-400 font-bold">{p.actual_vps.toFixed(1)}</span></div>
                            <div>Error: <span className={errorColor(Math.abs(p.prediction_error))}>{p.prediction_error > 0 ? '+' : ''}{p.prediction_error.toFixed(1)}</span></div>
                            {p.niche && <div className="text-neutral-500">{p.niche}</div>}
                            <div className="text-neutral-600">{formatDate(p.created_at)}</div>
                          </div>
                        );
                      }}
                    />
                    <Scatter data={data.scatterPoints} fill="#10b981">
                      {data.scatterPoints.map((point, i) => (
                        <Cell
                          key={i}
                          fill={point.within_range ? '#10b981' : '#ef4444'}
                          fillOpacity={0.8}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>

          {/* ─── Section 3: Per-Niche Accuracy ─────────────────────────────── */}
          <Section title="Per-Niche Accuracy" icon={<BarChart3 className="w-4 h-4" />}>
            <NicheAccuracyTable niches={data.byNiche} />
          </Section>

          {/* ─── Section 4: Accuracy Over Time ─────────────────────────────── */}
          <Section title="Accuracy Over Time" icon={<TrendingUp className="w-4 h-4" />}>
            {data.evaluationHistory.length < 2 ? (
              <InsufficientData message="Trend chart appears after 2+ weekly evaluations. Next scheduled: Sunday 05:00 UTC. Currently have" count={data.evaluationHistory.length} />
            ) : (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={data.evaluationHistory.map(e => ({
                      ...e,
                      date: formatDate(e.computed_at),
                    }))}
                    margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="date"
                      stroke="#4b5563"
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                    />
                    <YAxis
                      domain={[-1, 1]}
                      stroke="#4b5563"
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      label={{ value: 'Spearman rho', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
                    />
                    <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="3 3" />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const e = payload[0].payload as EvaluationSnapshot & { date: string };
                        return (
                          <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-3 text-xs space-y-1 shadow-xl">
                            <div className="text-neutral-300 font-medium">{e.date}</div>
                            <div>Spearman rho: <span className={`font-bold ${rhoColor(e.spearman_rho)}`}>{e.spearman_rho.toFixed(3)}</span></div>
                            <div>MAE: <span className="text-amber-400">{e.mae.toFixed(1)}</span></div>
                            <div>Within range: <span className="text-blue-400">{e.within_range_pct.toFixed(1)}%</span></div>
                            <div>N: <span className="text-neutral-300">{e.n}</span></div>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="spearman_rho"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>

          {/* ─── Section 5: Milestone Tracker ──────────────────────────────── */}
          <Section title="Data Milestones" icon={<Flag className="w-4 h-4" />}>
            <MilestoneTracker milestones={data.milestones} />
          </Section>

          {/* ─── Section 6: Worst Predictions ──────────────────────────────── */}
          <Section title="Worst Predictions" icon={<AlertTriangle className="w-4 h-4" />}>
            <WorstPredictionsTable predictions={data.worstPredictions} />
          </Section>
        </>
      )}
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  sub,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  valueColor?: string;
}) {
  return (
    <div className="p-4 rounded-xl border bg-white/[0.02] border-white/[0.06]">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-neutral-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl font-bold ${valueColor || 'text-neutral-100'}`}>{value}</div>
      <div className="text-[11px] text-neutral-500 mt-0.5">{sub}</div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-neutral-300 flex items-center gap-2 mb-3">
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

function InsufficientData({ message, count }: { message: string; count: number }) {
  return (
    <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
      <Database className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
      <p className="text-sm text-neutral-400">
        {message} <span className="text-neutral-300 font-bold">{count}</span>.
      </p>
    </div>
  );
}

function NicheAccuracyTable({ niches }: { niches: NicheAccuracy[] }) {
  const qualifying = niches.filter(n => n.n >= 5);
  const belowMin = niches.filter(n => n.n < 5);

  if (qualifying.length === 0) {
    return (
      <InsufficientData
        message="No niche has 5+ labeled videos yet. Per-niche breakdown will appear when individual niches reach this threshold. Currently tracking"
        count={niches.length}
      />
    );
  }

  // Find best and worst
  const sorted = [...qualifying].sort((a, b) => b.spearman_rho - a.spearman_rho);
  const bestNiche = sorted[0]?.niche;
  const worstNiche = sorted[sorted.length - 1]?.niche;

  return (
    <div className="overflow-x-auto rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-wider text-neutral-500">
            <th className="py-2.5 px-4">Niche</th>
            <th className="py-2.5 px-4">N</th>
            <th className="py-2.5 px-4">Spearman rho</th>
            <th className="py-2.5 px-4">MAE</th>
            <th className="py-2.5 px-4">Within Range</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(n => (
            <tr
              key={n.niche}
              className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${
                n.niche === bestNiche && qualifying.length > 1
                  ? 'border-l-2 border-l-green-500'
                  : n.niche === worstNiche && qualifying.length > 1
                  ? 'border-l-2 border-l-red-500'
                  : ''
              }`}
            >
              <td className="py-2.5 px-4 text-neutral-200">{n.niche}</td>
              <td className="py-2.5 px-4 font-mono text-neutral-400">{n.n}</td>
              <td className={`py-2.5 px-4 font-mono font-bold ${rhoColor(n.spearman_rho)}`}>
                {n.spearman_rho.toFixed(3)}
              </td>
              <td className="py-2.5 px-4 font-mono text-neutral-300">{n.mae.toFixed(1)}</td>
              <td className="py-2.5 px-4 font-mono text-neutral-300">{n.within_range_pct.toFixed(1)}%</td>
            </tr>
          ))}
          {belowMin.length > 0 && (
            <tr className="border-t border-white/[0.06]">
              <td colSpan={5} className="py-2.5 px-4 text-[11px] text-neutral-500">
                {belowMin.length} niche{belowMin.length > 1 ? 's' : ''} below minimum (N {'<'} 5): {belowMin.map(n => `${n.niche} (${n.n})`).join(', ')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MilestoneTracker({ milestones }: { milestones: AccuracyData['milestones'] }) {
  const maxTarget = milestones.targets[milestones.targets.length - 1]?.target || 500;
  const progressPct = Math.min(100, (milestones.current / maxTarget) * 100);

  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-4">
      {/* Overall progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-300">
            <span className="text-lg font-bold text-neutral-100">{milestones.current}</span> labeled videos
          </span>
          <span className="text-xs text-neutral-500">
            {milestones.weekly_rate > 0 ? `~${milestones.weekly_rate}/week` : 'No recent labeling'}
          </span>
        </div>
        <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
          {/* Milestone markers */}
          {milestones.targets.map(t => (
            <div
              key={t.target}
              className="absolute top-0 h-full w-px bg-white/20"
              style={{ left: `${(t.target / maxTarget) * 100}%` }}
            />
          ))}
        </div>
        <div className="relative mt-1">
          {milestones.targets.map(t => (
            <span
              key={t.target}
              className={`absolute text-[10px] -translate-x-1/2 ${milestones.current >= t.target ? 'text-emerald-400' : 'text-neutral-500'}`}
              style={{ left: `${(t.target / maxTarget) * 100}%` }}
            >
              {t.target}
            </span>
          ))}
        </div>
      </div>

      {/* Individual milestone cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {milestones.targets.map(t => {
          const reached = milestones.current >= t.target;
          return (
            <div
              key={t.target}
              className={`p-3 rounded-lg border ${
                reached
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-white/[0.02] border-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {reached ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                )}
                <span className={`text-lg font-bold ${reached ? 'text-emerald-400' : 'text-neutral-200'}`}>
                  {t.target}
                </span>
              </div>
              <div className="text-[10px] text-neutral-400 mb-1">{t.trigger_label}</div>
              {reached ? (
                <div className="text-[10px] text-emerald-400 font-medium">Reached</div>
              ) : (
                <div className="text-[10px] text-neutral-500">
                  {t.remaining} remaining
                  {t.est_date && <span className="block">Est. {t.est_date}</span>}
                  {!t.est_date && <span className="block">No projection</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorstPredictionsTable({ predictions }: { predictions: AccuracyData['worstPredictions'] }) {
  if (predictions.length === 0) {
    return <InsufficientData message="No labeled predictions yet. Worst predictions table will appear when data is available. Currently have" count={0} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-wider text-neutral-500">
            <th className="py-2.5 px-4">#</th>
            <th className="py-2.5 px-4">Run ID</th>
            <th className="py-2.5 px-4">Niche</th>
            <th className="py-2.5 px-4">Predicted VPS</th>
            <th className="py-2.5 px-4">Actual VPS</th>
            <th className="py-2.5 px-4">Error</th>
            <th className="py-2.5 px-4">Date</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((p, i) => (
            <tr
              key={p.run_id}
              className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-2.5 px-4 text-neutral-500 font-mono">{i + 1}</td>
              <td className="py-2.5 px-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-neutral-300">{p.run_id.slice(0, 8)}</span>
                  <button
                    onClick={() => copyToClipboard(p.run_id)}
                    className="p-0.5 rounded hover:bg-white/10 transition-colors text-neutral-500 hover:text-neutral-300"
                    title="Copy full run ID"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </td>
              <td className="py-2.5 px-4 text-neutral-300">{p.niche || '—'}</td>
              <td className="py-2.5 px-4 font-mono text-blue-400">{p.predicted_vps.toFixed(1)}</td>
              <td className="py-2.5 px-4 font-mono text-emerald-400">{p.actual_vps.toFixed(1)}</td>
              <td className={`py-2.5 px-4 font-mono font-bold ${errorColor(p.abs_error)}`}>
                {p.abs_error.toFixed(1)}
              </td>
              <td className="py-2.5 px-4 text-[11px] text-neutral-500">{timeAgo(p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

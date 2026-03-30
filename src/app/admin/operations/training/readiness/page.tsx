'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
  Activity,
  ArrowRight,
  Layers,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ShieldCheck,
  Target,
  Clock,
  TrendingUp,
  Zap,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface NicheSummary {
  niche: string;
  total_runs: number;
  completed_runs: number;
  labeled_runs: number;
  training_ready_runs: number;
  missing_components: number;
  missing_raw_result: number;
  missing_actual_dps: number;
  non_completed: number;
}

interface FixablePreview {
  total: number;
  by_strategy: {
    status_fix: number;
    synthesize_raw_result: number;
    needs_rerun: number;
  };
}

interface DashboardData {
  summary: NicheSummary[];
  fixable: FixablePreview;
}

interface FixDetail {
  run_id: string;
  video_id: string;
  strategy: string;
  success: boolean;
  error?: string;
}

interface FixResult {
  success: boolean;
  counts: {
    attempted: number;
    quick_fixed: number;
    synthesized: number;
    rerun_succeeded: number;
    rerun_failed: number;
    total_fixed: number;
  };
  details: FixDetail[];
  elapsed_ms: number;
  error?: string;
  message?: string;
}

interface PipelineStatus {
  jobs: Record<string, string | null>;
  labeled: {
    total: number;
    auto_cron: number;
    last_7d: number;
    last_30d: number;
    weekly_rate: number;
  };
  schedules: {
    pending: number;
    awaiting_label: number;
  };
  milestones: {
    target_100: { current: number; remaining: number; est_weeks: number | null; est_date: string | null };
    target_300: { current: number; remaining: number; est_weeks: number | null; est_date: string | null };
    target_500: { current: number; remaining: number; est_weeks: number | null; est_date: string | null };
  };
  latest_evaluation: {
    n: number;
    spearman_rho: number;
    p_value: number;
    mae: number;
    within_range_pct: number;
    computed_at: string;
  } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(n: number, d: number): string {
  if (d === 0) return '0';
  return ((n / d) * 100).toFixed(0);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrainingReadinessPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedNiche, setSelectedNiche] = useState<string>('side_hustles');
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);

  // ── Fetch pipeline status ─────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/training/pipeline-status')
      .then(r => r.json())
      .then(data => { if (data.success) setPipelineStatus(data.pipeline); })
      .catch(() => {});
  }, []);

  // ── Fetch dashboard data ────────────────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const url = selectedNiche
        ? `/api/admin/reprocess-queue?niche=${selectedNiche}`
        : '/api/admin/reprocess-queue';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDashboard(data);
      } else {
        setError(data.error || 'Failed to load dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedNiche]);

  useEffect(() => {
    setLoading(true);
    setFixResult(null);
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Fix handler ─────────────────────────────────────────────────────────

  const handleFix = async () => {
    setFixing(true);
    setFixResult(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/reprocess-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: selectedNiche || undefined,
          limit: 25,
        }),
      });

      const data: FixResult = await res.json();
      setFixResult(data);

      // Refresh dashboard to show updated counts
      if (data.success && data.counts.total_fixed > 0) {
        await fetchDashboard();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFixing(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-gray-500 text-sm tracking-wide">Loading readiness data...</p>
        </div>
      </div>
    );
  }

  const summary = dashboard?.summary || [];
  const fixable = dashboard?.fixable || { total: 0, by_strategy: { status_fix: 0, synthesize_raw_result: 0, needs_rerun: 0 } };
  const currentNicheSummary = summary.find(s => s.niche === selectedNiche);

  const totalReady = summary.reduce((sum, s) => sum + s.training_ready_runs, 0);
  const totalRuns = summary.reduce((sum, s) => sum + s.total_runs, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Training Readiness
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-[52px]">
            Monitor and fix prediction runs to maximize training data quality
          </p>
        </div>

        {/* ── Error Banner ─────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* ── Global Stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Enriched Runs"
            value={totalRuns}
            icon={<Database className="w-4 h-4" />}
            color="gray"
          />
          <StatCard
            label="Training Ready"
            value={totalReady}
            subtitle={`${pct(totalReady, totalRuns)}% of total`}
            icon={<CheckCircle2 className="w-4 h-4" />}
            color="emerald"
          />
          <StatCard
            label="Fixable Now"
            value={fixable.total}
            subtitle={fixable.total > 0 ? 'click below to fix' : 'all good'}
            icon={<Wrench className="w-4 h-4" />}
            color="amber"
          />
          <StatCard
            label="Niches Tracked"
            value={summary.length}
            icon={<Layers className="w-4 h-4" />}
            color="blue"
          />
        </div>

        {/* ── Milestone Progress ──────────────────────────────────────── */}
        {pipelineStatus && (
          <MilestoneTracker
            current={pipelineStatus.labeled.total}
            milestones={pipelineStatus.milestones}
            weeklyRate={pipelineStatus.labeled.weekly_rate}
          />
        )}

        {/* ── Automation Health + Collection Rate ───────────────────── */}
        {pipelineStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <AutomationHealth jobs={pipelineStatus.jobs} />
            <CollectionRate
              labeled={pipelineStatus.labeled}
              schedules={pipelineStatus.schedules}
              evaluation={pipelineStatus.latest_evaluation}
            />
          </div>
        )}

        {/* ── Per-Niche Table ──────────────────────────────────────────── */}
        <div className="mb-8 rounded-xl border border-gray-800/60 bg-gray-900/30 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800/60 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-500" />
              Readiness by Niche
            </h2>
            <button
              onClick={() => { setLoading(true); fetchDashboard(); }}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-medium">Niche</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Completed</th>
                  <th className="px-4 py-3 text-right font-medium">Labeled</th>
                  <th className="px-4 py-3 text-right font-medium">Ready</th>
                  <th className="px-4 py-3 text-right font-medium">Gap</th>
                  <th className="px-4 py-3 text-right font-medium">Readiness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {summary.map(row => {
                  const gap = row.labeled_runs - row.training_ready_runs;
                  const readiness = row.labeled_runs > 0
                    ? ((row.training_ready_runs / row.labeled_runs) * 100).toFixed(0)
                    : '—';

                  return (
                    <tr
                      key={row.niche}
                      className={`hover:bg-gray-800/20 cursor-pointer transition-colors ${
                        row.niche === selectedNiche ? 'bg-emerald-500/5' : ''
                      }`}
                      onClick={() => setSelectedNiche(row.niche)}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-gray-200">{row.niche}</span>
                        {row.niche === selectedNiche && (
                          <span className="ml-2 text-xs text-emerald-400">selected</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right text-gray-400">{row.total_runs}</td>
                      <td className="px-4 py-3.5 text-right text-gray-400">{row.completed_runs}</td>
                      <td className="px-4 py-3.5 text-right text-gray-400">{row.labeled_runs}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-emerald-400 font-medium">{row.training_ready_runs}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {gap > 0 ? (
                          <span className="text-amber-400">{gap}</span>
                        ) : (
                          <span className="text-gray-600">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <ReadinessBadge pct={readiness} />
                      </td>
                    </tr>
                  );
                })}
                {summary.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-gray-600">
                      No enriched runs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Fix Panel ────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-800/60 bg-gray-900/30 overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-gray-800/60">
            <h2 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              Fix Training Gaps
              {selectedNiche && (
                <span className="text-xs text-gray-500 font-normal">
                  — {selectedNiche}
                </span>
              )}
            </h2>
          </div>

          <div className="p-5">
            {/* Strategy breakdown */}
            {fixable.total > 0 ? (
              <div className="mb-5 space-y-3">
                <p className="text-sm text-gray-400 mb-3">
                  <span className="text-amber-400 font-medium">{fixable.total}</span> runs can be fixed:
                </p>

                <StrategyRow
                  icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
                  label="Status fix"
                  description="Has components + raw_result, just needs status → completed"
                  count={fixable.by_strategy.status_fix}
                  color="emerald"
                />
                <StrategyRow
                  icon={<Layers className="w-4 h-4 text-blue-400" />}
                  label="Synthesize raw_result"
                  description="Has component data, raw_result will be reconstructed"
                  count={fixable.by_strategy.synthesize_raw_result}
                  color="blue"
                />
                <StrategyRow
                  icon={<RotateCcw className="w-4 h-4 text-orange-400" />}
                  label="Full re-run"
                  description="No component data, will re-run prediction pipeline"
                  count={fixable.by_strategy.needs_rerun}
                  color="orange"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-5">
                No fixable runs for {selectedNiche || 'any niche'}. All labeled runs are training_ready.
              </p>
            )}

            {/* Action button */}
            <button
              onClick={handleFix}
              disabled={fixing || fixable.total === 0}
              className={`
                w-full py-3 px-5 rounded-lg font-medium text-sm transition-all
                flex items-center justify-center gap-2
                ${fixable.total > 0 && !fixing
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {fixing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing {fixable.total} runs...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  Fix {fixable.total} Training Gaps
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Fix Results ──────────────────────────────────────────────── */}
        {fixResult && (
          <div className={`rounded-xl border overflow-hidden mb-8 ${
            fixResult.success
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-red-500/30 bg-red-500/5'
          }`}>
            <div className="px-5 py-4 border-b border-gray-800/40 flex items-center gap-2">
              {fixResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <h3 className="text-sm font-medium text-gray-200">
                {fixResult.success
                  ? `Fixed ${fixResult.counts.total_fixed} of ${fixResult.counts.attempted} runs`
                  : fixResult.error || 'Fix failed'}
              </h3>
              {fixResult.elapsed_ms && (
                <span className="text-xs text-gray-500 ml-auto">
                  {(fixResult.elapsed_ms / 1000).toFixed(1)}s
                </span>
              )}
            </div>

            {fixResult.success && fixResult.counts.attempted > 0 && (
              <div className="p-5">
                {/* Summary counters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <MiniStat label="Status Fixes" value={fixResult.counts.quick_fixed} color="emerald" />
                  <MiniStat label="Synthesized" value={fixResult.counts.synthesized} color="blue" />
                  <MiniStat label="Re-run OK" value={fixResult.counts.rerun_succeeded} color="purple" />
                  <MiniStat label="Re-run Failed" value={fixResult.counts.rerun_failed} color="red" />
                </div>

                {/* Detail rows */}
                <details className="group">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 flex items-center gap-1">
                    <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                    Show {fixResult.details.length} details
                  </summary>
                  <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto">
                    {fixResult.details.map((d, i) => (
                      <div
                        key={i}
                        className="text-xs font-mono flex items-center gap-2 py-1 px-2 rounded bg-gray-800/30"
                      >
                        {d.success ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        )}
                        <span className="text-gray-400">{d.run_id.slice(0, 8)}…</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          d.strategy === 'status_fix' ? 'bg-emerald-500/15 text-emerald-400' :
                          d.strategy === 'synthesize_raw_result' ? 'bg-blue-500/15 text-blue-400' :
                          'bg-orange-500/15 text-orange-400'
                        }`}>
                          {d.strategy.replace(/_/g, ' ')}
                        </span>
                        {d.error && (
                          <span className="text-red-400 truncate">{d.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {fixResult.message && (
              <div className="px-5 py-3 text-sm text-gray-400">
                {fixResult.message}
              </div>
            )}
          </div>
        )}

        {/* ── Niche Failure Breakdown ──────────────────────────────────── */}
        {currentNicheSummary && (
          <div className="rounded-xl border border-gray-800/60 bg-gray-900/30 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800/60">
              <h2 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gray-500" />
                Failure Breakdown — {selectedNiche}
              </h2>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              <FailureCard
                label="Non-completed"
                count={currentNicheSummary.non_completed}
                total={currentNicheSummary.total_runs}
              />
              <FailureCard
                label="Missing actual_dps"
                count={currentNicheSummary.missing_actual_dps}
                total={currentNicheSummary.total_runs}
              />
              <FailureCard
                label="Missing components"
                count={currentNicheSummary.missing_components}
                total={currentNicheSummary.total_runs}
              />
              <FailureCard
                label="Missing raw_result"
                count={currentNicheSummary.missing_raw_result}
                total={currentNicheSummary.total_runs}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, subtitle, icon, color }: {
  label: string; value: number; subtitle?: string;
  icon: React.ReactNode; color: 'gray' | 'emerald' | 'amber' | 'blue';
}) {
  const colors = {
    gray: 'text-gray-400 border-gray-800/60',
    emerald: 'text-emerald-400 border-emerald-500/20',
    amber: 'text-amber-400 border-amber-500/20',
    blue: 'text-blue-400 border-blue-500/20',
  };

  return (
    <div className={`rounded-xl border bg-gray-900/30 p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="opacity-60">{icon}</span>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value.toLocaleString()}</p>
      {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function StrategyRow({ icon, label, description, count, color }: {
  icon: React.ReactNode; label: string; description: string;
  count: number; color: 'emerald' | 'blue' | 'orange';
}) {
  if (count === 0) return null;

  const bgColors = {
    emerald: 'bg-emerald-500/8',
    blue: 'bg-blue-500/8',
    orange: 'bg-orange-500/8',
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${bgColors[color]}`}>
      {icon}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-200">{label}</span>
        <span className="text-xs text-gray-500 ml-2 hidden sm:inline">{description}</span>
      </div>
      <span className="text-sm font-semibold text-gray-300 tabular-nums">{count}</span>
    </div>
  );
}

function MiniStat({ label, value, color }: {
  label: string; value: number; color: 'emerald' | 'blue' | 'purple' | 'red';
}) {
  const textColors = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
  };

  return (
    <div className="text-center py-2 px-3 rounded-lg bg-gray-800/30">
      <p className={`text-lg font-semibold ${textColors[color]}`}>{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function FailureCard({ label, count, total }: { label: string; count: number; total: number }) {
  return (
    <div className="text-center py-3 px-2">
      <p className={`text-xl font-semibold tabular-nums ${count > 0 ? 'text-amber-400' : 'text-gray-600'}`}>
        {count}
      </p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {count > 0 && total > 0 && (
        <p className="text-[10px] text-gray-600 mt-0.5">{pct(count, total)}% of total</p>
      )}
    </div>
  );
}

function ReadinessBadge({ pct: value }: { pct: string }) {
  const num = parseFloat(value);
  const color = isNaN(num) ? 'text-gray-600 bg-gray-800/40'
    : num >= 80 ? 'text-emerald-400 bg-emerald-500/10'
    : num >= 50 ? 'text-amber-400 bg-amber-500/10'
    : 'text-red-400 bg-red-500/10';

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {value === '—' ? '—' : `${value}%`}
    </span>
  );
}

// ── Pipeline Automation Components ──────────────────────────────────────────

function MilestoneTracker({ current, milestones, weeklyRate }: {
  current: number;
  milestones: PipelineStatus['milestones'];
  weeklyRate: number;
}) {
  const targets = [
    { label: '100', target: 100, data: milestones.target_100, color: 'emerald' as const },
    { label: '300', target: 300, data: milestones.target_300, color: 'blue' as const },
    { label: '500', target: 500, data: milestones.target_500, color: 'purple' as const },
  ];

  const maxTarget = 500;
  const barPct = Math.min((current / maxTarget) * 100, 100);

  return (
    <div className="mb-8 rounded-xl border border-gray-800/60 bg-gray-900/30 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800/60">
        <h2 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          Labeled Video Milestones
          <span className="text-xs text-gray-500 font-normal ml-auto">
            {weeklyRate > 0 ? `~${weeklyRate}/week` : 'no data yet'}
          </span>
        </h2>
      </div>

      <div className="p-5">
        {/* Progress bar */}
        <div className="relative mb-5">
          <div className="h-3 bg-gray-800/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${barPct}%` }}
            />
          </div>
          {/* Milestone markers */}
          <div className="relative mt-1">
            {targets.map(t => {
              const pos = (t.target / maxTarget) * 100;
              return (
                <div
                  key={t.target}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${pos}%` }}
                >
                  <div className={`w-0.5 h-2 mx-auto ${current >= t.target ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                  <span className={`text-[10px] font-medium ${current >= t.target ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {t.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Current count badge */}
          <div
            className="absolute top-0 -translate-x-1/2 -translate-y-full pb-1"
            style={{ left: `${barPct}%` }}
          >
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              {current}
            </span>
          </div>
        </div>

        {/* Milestone cards */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {targets.map(t => {
            const reached = current >= t.target;
            const colorMap = {
              emerald: reached ? 'text-emerald-400 border-emerald-500/20' : 'text-gray-400 border-gray-800/60',
              blue: reached ? 'text-blue-400 border-blue-500/20' : 'text-gray-400 border-gray-800/60',
              purple: reached ? 'text-purple-400 border-purple-500/20' : 'text-gray-400 border-gray-800/60',
            };

            return (
              <div key={t.target} className={`rounded-lg border p-3 text-center ${colorMap[t.color]}`}>
                <p className="text-lg font-semibold tabular-nums">{t.target}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {reached ? 'reached' : t.data.remaining + ' to go'}
                </p>
                {!reached && t.data.est_weeks !== null && (
                  <p className="text-[10px] text-gray-600 mt-1">
                    ~{t.data.est_weeks}w ({t.data.est_date || '?'})
                  </p>
                )}
                {!reached && t.data.est_weeks === null && (
                  <p className="text-[10px] text-gray-600 mt-1">collecting data...</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AutomationHealth({ jobs }: { jobs: Record<string, string | null> }) {
  const jobConfigs = [
    { key: 'schedule_backfill', label: 'Schedule Backfill', expectedHours: 24 },
    { key: 'metric_collector', label: 'Metric Collector', expectedHours: 12 },
    { key: 'auto_labeler', label: 'Auto-Labeler', expectedHours: 24 },
    { key: 'spearman_eval', label: 'Spearman Eval', expectedHours: 168 },
  ];

  function getStatus(lastRun: string | null, expectedHours: number): 'green' | 'amber' | 'red' | 'gray' {
    if (!lastRun) return 'gray';
    const hoursSince = (Date.now() - new Date(lastRun).getTime()) / (3600 * 1000);
    if (hoursSince <= expectedHours * 1.5) return 'green';
    if (hoursSince <= expectedHours * 3) return 'amber';
    return 'red';
  }

  function formatAge(lastRun: string | null): string {
    if (!lastRun) return 'never';
    const hours = (Date.now() - new Date(lastRun).getTime()) / (3600 * 1000);
    if (hours < 1) return `${Math.round(hours * 60)}m ago`;
    if (hours < 24) return `${Math.round(hours)}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  }

  const statusColors = {
    green: 'bg-emerald-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    gray: 'bg-gray-600',
  };

  return (
    <div className="rounded-xl border border-gray-800/60 bg-gray-900/30 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800/60">
        <h2 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Automation Health
        </h2>
      </div>
      <div className="p-4 space-y-2.5">
        {jobConfigs.map(jc => {
          const lastRun = jobs[jc.key];
          const status = getStatus(lastRun, jc.expectedHours);

          return (
            <div key={jc.key} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800/20">
              <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
              <span className="text-sm text-gray-300 flex-1">{jc.label}</span>
              <span className="text-xs text-gray-500 tabular-nums">{formatAge(lastRun)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CollectionRate({ labeled, schedules, evaluation }: {
  labeled: PipelineStatus['labeled'];
  schedules: PipelineStatus['schedules'];
  evaluation: PipelineStatus['latest_evaluation'];
}) {
  return (
    <div className="rounded-xl border border-gray-800/60 bg-gray-900/30 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800/60">
        <h2 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          Collection Rate
        </h2>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center py-2 px-3 rounded-lg bg-gray-800/30">
            <p className="text-lg font-semibold text-emerald-400 tabular-nums">{labeled.last_7d}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">This Week</p>
          </div>
          <div className="text-center py-2 px-3 rounded-lg bg-gray-800/30">
            <p className="text-lg font-semibold text-blue-400 tabular-nums">{labeled.last_30d}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Last 30d</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/20">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-400 flex-1">Pending schedules</span>
          <span className="text-xs text-gray-300 font-medium tabular-nums">{schedules.pending}</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/20">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-400 flex-1">Awaiting label</span>
          <span className="text-xs text-gray-300 font-medium tabular-nums">{schedules.awaiting_label}</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/20">
          <Zap className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-400 flex-1">Auto-labeled</span>
          <span className="text-xs text-emerald-400 font-medium tabular-nums">{labeled.auto_cron}</span>
        </div>

        {/* Latest Spearman evaluation */}
        {evaluation && (
          <div className="mt-2 pt-3 border-t border-gray-800/40">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Latest Evaluation</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className={`text-sm font-semibold tabular-nums ${
                  evaluation.spearman_rho > 0.5 ? 'text-emerald-400' :
                  evaluation.spearman_rho > 0.3 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {evaluation.spearman_rho.toFixed(3)}
                </p>
                <p className="text-[9px] text-gray-600">Spearman rho</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-300 tabular-nums">{evaluation.mae.toFixed(1)}</p>
                <p className="text-[9px] text-gray-600">MAE</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-300 tabular-nums">{evaluation.within_range_pct.toFixed(0)}%</p>
                <p className="text-[9px] text-gray-600">In Range</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

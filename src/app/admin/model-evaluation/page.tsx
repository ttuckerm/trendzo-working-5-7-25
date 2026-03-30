'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Target,
  Layers,
  Play,
  ArrowUp,
  ArrowDown,
  Minus,
  FlaskConical,
  AlertTriangle,
  CheckCircle,
  ScrollText,
  Trophy,
  Info,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface VideoPrediction {
  video_id: string;
  actual_dps: number;
  predicted_vps: number;
  error: number;
  tier_match: boolean;
  actual_tier: string;
  predicted_tier: string;
  features_provided: number;
  features_total: number;
}

interface EvaluationRun {
  id: string;
  model_version: string;
  run_at: string;
  spearman_rho: number;
  mae: number;
  within_5_pct: number;
  within_10_pct: number;
  tier_accuracy_pct: number;
  notes: string | null;
  feature_importance_top10: Array<{ feature: string; importance: number }> | null;
  predictions: VideoPrediction[] | null;
}

interface ExperimentEntry {
  id: string;
  experiment_name: string;
  experiment_type: string;
  description: string | null;
  model_version_before: string | null;
  model_version_after: string | null;
  metrics_before: { spearman_rho: number; mae: number; within_10: number; tier_accuracy: number } | null;
  metrics_after: { spearman_rho: number; mae: number; within_10: number; tier_accuracy: number } | null;
  delta: { spearman_rho: number; mae: number; within_10: number; tier_accuracy: number } | null;
  verdict: 'kept' | 'reverted' | 'inconclusive';
  features_changed: string[] | null;
  created_at: string;
  created_by: string;
}

interface BenchmarkInfo {
  id: string;
  video_id: string;
  actual_dps: number;
  niche: string;
  creator_followers: number | null;
  duration_seconds: number | null;
}

interface ApiResponse {
  runs: EvaluationRun[];
  benchmarks: BenchmarkInfo[];
  experiments: ExperimentEntry[];
  queriedAt: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Safely format a number that might be null/undefined from the DB */
function safeFixed(val: number | null | undefined, digits: number): string {
  if (val == null || isNaN(val)) return '\u2014';
  return Number(val).toFixed(digits);
}

function metricDelta(current: number, previous: number, higherIsBetter: boolean): React.ReactNode {
  const diff = current - previous;
  if (Math.abs(diff) < 0.001) return <Minus className="w-3 h-3 text-neutral-500 inline" />;
  const improved = higherIsBetter ? diff > 0 : diff < 0;
  const Icon = diff > 0 ? ArrowUp : ArrowDown;
  const color = improved ? 'text-green-400' : 'text-red-400';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${color}`}>
      <Icon className="w-3 h-3" />
      {Math.abs(diff).toFixed(2)}
    </span>
  );
}

function deltaColorClass(val: number, higherIsBetter: boolean): string {
  if (Math.abs(val) < 0.001) return 'text-neutral-500';
  const improved = higherIsBetter ? val > 0 : val < 0;
  return improved ? 'text-green-400' : 'text-red-400';
}

function verdictBadge(verdict: string): React.ReactNode {
  const colors: Record<string, string> = {
    kept: 'bg-green-500/20 text-green-400',
    reverted: 'bg-red-500/20 text-red-400',
    inconclusive: 'bg-neutral-500/20 text-neutral-400',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors[verdict] || colors.inconclusive}`}>
      {verdict}
    </span>
  );
}

function typeBadge(type: string): React.ReactNode {
  const colors: Record<string, string> = {
    feature_added: 'bg-blue-500/20 text-blue-400',
    feature_removed: 'bg-orange-500/20 text-orange-400',
    feature_modified: 'bg-yellow-500/20 text-yellow-400',
    hyperparameter_change: 'bg-purple-500/20 text-purple-400',
    model_retrain: 'bg-cyan-500/20 text-cyan-400',
    bug_fix: 'bg-pink-500/20 text-pink-400',
    data_change: 'bg-emerald-500/20 text-emerald-400',
  };
  const label = type.replace(/_/g, ' ');
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap ${colors[type] || 'bg-neutral-500/20 text-neutral-400'}`}>
      {label}
    </span>
  );
}

const EXPERIMENT_TYPES = [
  'feature_added', 'feature_removed', 'feature_modified',
  'hyperparameter_change', 'model_retrain', 'bug_fix', 'data_change',
] as const;

// ─── Reusable Components ────────────────────────────────────────────────────

function Section({ title, icon: Icon, hint, children }: {
  title: string;
  icon: React.ElementType;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-neutral-400" />
        <h2 className="text-lg font-semibold text-neutral-200">{title}</h2>
        {hint && (
          <span className="group relative ml-1">
            <Info className="w-3.5 h-3.5 text-neutral-600 hover:text-neutral-400 cursor-help transition-colors" />
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 w-56 rounded-md bg-neutral-800 border border-white/10 px-3 py-2 text-xs text-neutral-300 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
              {hint}
            </span>
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function MetricCard({ label, value, unit, subtext, hint }: {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  hint?: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xs text-neutral-500 uppercase tracking-wider">{label}</span>
        {hint && (
          <span className="group relative">
            <Info className="w-3 h-3 text-neutral-600 hover:text-neutral-400 cursor-help transition-colors" />
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 w-48 rounded-md bg-neutral-800 border border-white/10 px-3 py-2 text-xs text-neutral-300 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
              {hint}
            </span>
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white">
        {value}
        {unit && <span className="text-sm text-neutral-400 ml-1">{unit}</span>}
      </div>
      {subtext && <div className="text-xs text-neutral-500 mt-1">{subtext}</div>}
    </div>
  );
}

// ─── Custom Tooltip for Experiment Timeline ─────────────────────────────────

function TimelineTooltip({ active, payload, label, experiments }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const dateExperiments = (experiments || []).filter(
    (e: ExperimentEntry) => formatShortDate(e.created_at) === label
  );

  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-sm max-w-xs">
      <div className="text-neutral-300 font-medium mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
          <span className="text-neutral-400">{p.name}:</span>
          <span className="text-white font-mono">{typeof p.value === 'number' ? p.value.toFixed(4) : p.value}</span>
        </div>
      ))}
      {dateExperiments.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/10">
          {dateExperiments.map((e: ExperimentEntry) => (
            <div key={e.id} className="mb-1">
              <div className="text-neutral-200 text-xs font-medium">{e.experiment_name}</div>
              {e.description && <div className="text-neutral-500 text-[10px] mt-0.5 line-clamp-2">{e.description}</div>}
              {e.delta && e.delta.spearman_rho != null && (
                <div className="text-[10px] mt-0.5">
                  <span className={deltaColorClass(e.delta.spearman_rho, true)}>
                    Spearman: {e.delta.spearman_rho > 0 ? '+' : ''}{safeFixed(e.delta.spearman_rho, 4)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ModelEvaluationPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [showExperimentForm, setShowExperimentForm] = useState(false);
  const [savingExperiment, setSavingExperiment] = useState(false);

  // Experiment form state
  const [expName, setExpName] = useState('');
  const [expType, setExpType] = useState<string>('model_retrain');
  const [expDesc, setExpDesc] = useState('');
  const [expFeatures, setExpFeatures] = useState('');
  const [expVerdict, setExpVerdict] = useState<string>('inconclusive');
  const [expModelBefore, setExpModelBefore] = useState('');
  const [expModelAfter, setExpModelAfter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/model-evaluation', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse = await res.json();
      setData(json);
      if (json.runs.length > 0 && !selectedRunId) {
        setSelectedRunId(json.runs[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedRunId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runEvaluation = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/model-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_evaluation', notes }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setNotes('');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const saveExperiment = async () => {
    if (!expName.trim() || !expType) return;
    setSavingExperiment(true);
    setError(null);
    try {
      const featuresArr = expFeatures.trim()
        ? expFeatures.split(',').map(f => f.trim()).filter(Boolean)
        : null;

      const res = await fetch('/api/admin/model-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_experiment',
          experiment_name: expName.trim(),
          experiment_type: expType,
          description: expDesc.trim() || null,
          model_version_before: expModelBefore.trim() || null,
          model_version_after: expModelAfter.trim() || null,
          features_changed: featuresArr,
          verdict: expVerdict,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      // Reset form
      setExpName('');
      setExpType('model_retrain');
      setExpDesc('');
      setExpFeatures('');
      setExpVerdict('inconclusive');
      setExpModelBefore('');
      setExpModelAfter('');
      setShowExperimentForm(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingExperiment(false);
    }
  };

  const runs = data?.runs || [];
  const experiments = data?.experiments || [];
  const selectedRun = runs.find(r => r.id === selectedRunId) || runs[0] || null;
  const previousRun = selectedRun ? runs[runs.indexOf(selectedRun) + 1] || null : null;

  // ─── Regression Detection ────────────────────────────────────────────────

  const latestRun = runs[0] || null;
  const secondLatestRun = runs[1] || null;
  const lastExperiment = experiments[0] || null;

  let regressionBanner: React.ReactNode = null;
  if (latestRun && secondLatestRun && latestRun.spearman_rho != null && secondLatestRun.spearman_rho != null && latestRun.mae != null && secondLatestRun.mae != null) {
    const spearmanDiff = latestRun.spearman_rho - secondLatestRun.spearman_rho;
    const maeDiff = latestRun.mae - secondLatestRun.mae;

    if (spearmanDiff < -0.02 || maeDiff > 1.0) {
      regressionBanner = (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-red-400 font-medium text-sm">Regression detected</div>
            <div className="text-red-400/80 text-xs mt-1">
              Spearman dropped from {safeFixed(secondLatestRun.spearman_rho, 4)} to{' '}
              {safeFixed(latestRun.spearman_rho, 4)} ({spearmanDiff > 0 ? '+' : ''}{spearmanDiff.toFixed(4)})
              {maeDiff > 1.0 && <>, MAE increased by {maeDiff.toFixed(2)}</>}
              {lastExperiment && <> — Last experiment: <strong>{lastExperiment.experiment_name}</strong></>}
            </div>
          </div>
        </div>
      );
    } else if (spearmanDiff > 0.02) {
      regressionBanner = (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-green-400 font-medium text-sm">Improvement detected</div>
            <div className="text-green-400/80 text-xs mt-1">
              Spearman increased from {safeFixed(secondLatestRun.spearman_rho, 4)} to{' '}
              {safeFixed(latestRun.spearman_rho, 4)} (+{spearmanDiff.toFixed(4)})
              {lastExperiment && <> — Last experiment: <strong>{lastExperiment.experiment_name}</strong></>}
            </div>
          </div>
        </div>
      );
    }
  }

  // ─── Chart data with experiment markers ───────────────────────────────────

  const chartData = [...runs].reverse().map(r => ({
    date: formatShortDate(r.run_at),
    'Spearman rho': r.spearman_rho,
    MAE: r.mae,
  }));

  // Find experiment dates for ReferenceLine markers
  const experimentDates = experiments.map(e => ({
    date: formatShortDate(e.created_at),
    name: e.experiment_name,
    verdict: e.verdict,
  }));

  // Deduplicate experiment dates that appear in chartData
  const uniqueExpDates = experimentDates.filter(
    (e, i, arr) => arr.findIndex(x => x.date === e.date) === i
  );

  // ─── Cumulative Progress ──────────────────────────────────────────────────

  const firstRun = runs.length > 0 ? runs[runs.length - 1] : null;
  const totalExperiments = experiments.length;
  const keptExperiments = experiments.filter(e => e.verdict === 'kept').length;
  const revertedExperiments = experiments.filter(e => e.verdict === 'reverted').length;

  const totalFeaturesAdded = experiments
    .filter(e => e.verdict === 'kept' && e.experiment_type === 'feature_added')
    .reduce((sum, e) => sum + (e.features_changed?.length || 0), 0);

  const netSpearmanImprovement = firstRun && latestRun
    ? latestRun.spearman_rho - firstRun.spearman_rho
    : 0;

  // Find best experiment (largest positive spearman delta)
  const bestExperiment = experiments
    .filter(e => e.delta && e.delta.spearman_rho > 0)
    .sort((a, b) => (b.delta?.spearman_rho || 0) - (a.delta?.spearman_rho || 0))[0] || null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/operations"
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Experiment Tracking</h1>
            <p className="text-sm text-neutral-500">
              Model evaluation, experiment log, and regression detection
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Regression Banner */}
      {regressionBanner}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white/[0.03] rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {selectedRun && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricCard
                label="Spearman rho"
                value={safeFixed(selectedRun.spearman_rho, 4)}
                subtext="Rank correlation"
                hint="Measures if the model ranks videos in the right order. 1.0 = perfect ranking."
              />
              <MetricCard
                label="MAE"
                value={safeFixed(selectedRun.mae, 2)}
                unit="pts"
                subtext="Mean absolute error"
                hint="Average distance between predicted VPS and actual DPS. Lower is better."
              />
              <MetricCard
                label="Within +/-5"
                value={safeFixed(selectedRun.within_5_pct, 1)}
                unit="%"
                subtext="+/-5 DPS accuracy"
                hint="% of predictions within 5 points of actual. Strict accuracy measure."
              />
              <MetricCard
                label="Within +/-10"
                value={safeFixed(selectedRun.within_10_pct, 1)}
                unit="%"
                subtext="+/-10 DPS accuracy"
                hint="% of predictions within 10 points of actual. Practical accuracy measure."
              />
              <MetricCard
                label="Tier Accuracy"
                value={safeFixed(selectedRun.tier_accuracy_pct, 1)}
                unit="%"
                subtext="Correct tier predicted"
                hint="% of videos placed in the correct tier (low/average/good/viral/mega-viral)."
              />
            </div>
          )}

          {/* Section 1: Experiment Timeline (upgraded Accuracy Over Time) */}
          {chartData.length > 0 && (
            <Section title="Experiment Timeline" icon={TrendingUp} hint="Spearman and MAE over time. Dashed lines mark experiments. Click a point to select that run.">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="date"
                      stroke="#737373"
                      fontSize={12}
                      tick={{ fill: '#a3a3a3' }}
                    />
                    <YAxis
                      yAxisId="spearman"
                      stroke="#737373"
                      fontSize={12}
                      tick={{ fill: '#a3a3a3' }}
                      domain={['auto', 'auto']}
                      label={{ value: 'Spearman', angle: -90, position: 'insideLeft', fill: '#22c55e', fontSize: 11 }}
                    />
                    <YAxis
                      yAxisId="mae"
                      orientation="right"
                      stroke="#737373"
                      fontSize={12}
                      tick={{ fill: '#a3a3a3' }}
                      reversed
                      domain={['auto', 'auto']}
                      label={{ value: 'MAE (lower=better)', angle: 90, position: 'insideRight', fill: '#ef4444', fontSize: 11 }}
                    />
                    <Tooltip content={<TimelineTooltip experiments={experiments} />} />
                    <Legend />

                    {/* Experiment markers as vertical dashed lines */}
                    {uniqueExpDates
                      .filter(e => chartData.some(d => d.date === e.date))
                      .map((e, i) => (
                        <ReferenceLine
                          key={`exp-${i}`}
                          x={e.date}
                          yAxisId="spearman"
                          stroke={
                            e.verdict === 'kept' ? '#22c55e' :
                            e.verdict === 'reverted' ? '#ef4444' : '#737373'
                          }
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: e.name.length > 20 ? e.name.slice(0, 20) + '...' : e.name,
                            position: 'top',
                            fill: e.verdict === 'kept' ? '#22c55e' :
                                  e.verdict === 'reverted' ? '#ef4444' : '#737373',
                            fontSize: 9,
                          }}
                        />
                      ))}

                    <Line
                      type="monotone"
                      dataKey="Spearman rho"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#22c55e' }}
                      yAxisId="spearman"
                    />
                    <Line
                      type="monotone"
                      dataKey="MAE"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#ef4444' }}
                      yAxisId="mae"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}

          {/* Section 2: Run History Table */}
          <Section title="Evaluation Run History" icon={BarChart3} hint="Each row is a benchmark run against 50 fixed videos. Click a row to see its details below.">
            {runs.length === 0 ? (
              <p className="text-neutral-500 text-sm">
                No evaluation runs yet. Run your first evaluation below.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-neutral-500 text-xs uppercase tracking-wider border-b border-white/[0.06]">
                      <th className="text-left py-2 px-3">Date</th>
                      <th className="text-left py-2 px-3">Model</th>
                      <th className="text-right py-2 px-3">Spearman rho</th>
                      <th className="text-right py-2 px-3">MAE</th>
                      <th className="text-right py-2 px-3">Within +/-10</th>
                      <th className="text-right py-2 px-3">Tier Acc</th>
                      <th className="text-left py-2 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run, idx) => {
                      const prev = runs[idx + 1] || null;
                      const isSelected = run.id === selectedRunId;
                      return (
                        <tr
                          key={run.id}
                          onClick={() => setSelectedRunId(run.id)}
                          className={`border-b border-white/[0.03] cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-purple-500/10 border-purple-500/20'
                              : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-neutral-300">
                            {formatDateTime(run.run_at)}
                            {idx === 0 && (
                              <span className="ml-2 text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
                                LATEST
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-neutral-300">{run.model_version}</td>
                          <td className="py-2.5 px-3 text-right text-neutral-200">
                            {safeFixed(run.spearman_rho, 4)}
                            {prev && run.spearman_rho != null && prev.spearman_rho != null && <span className="ml-1.5">{metricDelta(run.spearman_rho, prev.spearman_rho, true)}</span>}
                          </td>
                          <td className="py-2.5 px-3 text-right text-neutral-200">
                            {safeFixed(run.mae, 2)}
                            {prev && run.mae != null && prev.mae != null && <span className="ml-1.5">{metricDelta(run.mae, prev.mae, false)}</span>}
                          </td>
                          <td className="py-2.5 px-3 text-right text-neutral-200">
                            {safeFixed(run.within_10_pct, 1)}%
                            {prev && run.within_10_pct != null && prev.within_10_pct != null && <span className="ml-1.5">{metricDelta(run.within_10_pct, prev.within_10_pct, true)}</span>}
                          </td>
                          <td className="py-2.5 px-3 text-right text-neutral-200">
                            {safeFixed(run.tier_accuracy_pct, 1)}%
                            {prev && run.tier_accuracy_pct != null && prev.tier_accuracy_pct != null && <span className="ml-1.5">{metricDelta(run.tier_accuracy_pct, prev.tier_accuracy_pct, true)}</span>}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-400 max-w-[200px] truncate">
                            {run.notes || '\u2014'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* Section 3: Feature Changelog */}
          {experiments.length > 0 && (
            <Section title="Feature Changelog" icon={ScrollText} hint="Log of feature experiments: what was added/removed, how it affected Spearman, and whether it was kept.">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-neutral-500 text-xs uppercase tracking-wider border-b border-white/[0.06]">
                      <th className="text-left py-2 px-3">Date</th>
                      <th className="text-left py-2 px-3">Experiment</th>
                      <th className="text-left py-2 px-3">Type</th>
                      <th className="text-left py-2 px-3">Features Changed</th>
                      <th className="text-right py-2 px-3">Spearman Before</th>
                      <th className="text-right py-2 px-3">Spearman After</th>
                      <th className="text-right py-2 px-3">Delta</th>
                      <th className="text-center py-2 px-3">Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {experiments.map(exp => (
                      <tr key={exp.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 text-neutral-400 text-xs whitespace-nowrap">
                          {formatShortDate(exp.created_at)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-neutral-200 text-xs font-medium">{exp.experiment_name}</div>
                          {exp.description && (
                            <div className="text-neutral-500 text-[10px] mt-0.5 max-w-[250px] truncate">
                              {exp.description}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">{typeBadge(exp.experiment_type)}</td>
                        <td className="py-2.5 px-3 text-neutral-400 text-xs max-w-[200px]">
                          {exp.features_changed && exp.features_changed.length > 0 ? (
                            <span className="font-mono truncate block">
                              {exp.features_changed.slice(0, 3).join(', ')}
                              {exp.features_changed.length > 3 && ` +${exp.features_changed.length - 3}`}
                            </span>
                          ) : (
                            '\u2014'
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-neutral-400 font-mono text-xs">
                          {exp.metrics_before?.spearman_rho?.toFixed(4) || '\u2014'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-neutral-400 font-mono text-xs">
                          {exp.metrics_after?.spearman_rho?.toFixed(4) || '\u2014'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs">
                          {exp.delta && exp.delta.spearman_rho != null ? (
                            <span className={deltaColorClass(exp.delta.spearman_rho, true)}>
                              {exp.delta.spearman_rho > 0 ? '+' : ''}{safeFixed(exp.delta.spearman_rho, 4)}
                            </span>
                          ) : '\u2014'}
                        </td>
                        <td className="py-2.5 px-3 text-center">{verdictBadge(exp.verdict)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Section 4: Per-Video Breakdown */}
          {selectedRun?.predictions && selectedRun.predictions.length > 0 && (
            <Section title="Per-Video Breakdown" icon={Target} hint="Prediction vs actual for each benchmark video. Sorted by largest error to spot where the model struggles.">
              <p className="text-xs text-neutral-500 mb-3">
                Showing {selectedRun.predictions.length} benchmark videos for{' '}
                <span className="font-mono text-neutral-300">{selectedRun.model_version}</span>{' '}
                — sorted by largest error
              </p>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-black">
                    <tr className="text-neutral-500 text-xs uppercase tracking-wider border-b border-white/[0.06]">
                      <th className="text-left py-2 px-3">Video ID</th>
                      <th className="text-right py-2 px-3">Actual DPS</th>
                      <th className="text-right py-2 px-3">Predicted VPS</th>
                      <th className="text-right py-2 px-3">Error</th>
                      <th className="text-center py-2 px-3">Tier Match</th>
                      <th className="text-left py-2 px-3">Actual Tier</th>
                      <th className="text-left py-2 px-3">Predicted Tier</th>
                      <th className="text-right py-2 px-3">Features</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedRun.predictions]
                      .sort((a, b) => Math.abs(b.error) - Math.abs(a.error))
                      .map((p) => {
                        const absErr = Math.abs(p.error);
                        const errColor = absErr <= 5
                          ? 'text-green-400'
                          : absErr <= 10
                            ? 'text-yellow-400'
                            : 'text-red-400';
                        return (
                          <tr
                            key={p.video_id}
                            className="border-b border-white/[0.03] hover:bg-white/[0.02]"
                          >
                            <td className="py-2 px-3 font-mono text-xs text-neutral-300 max-w-[160px] truncate">
                              {p.video_id}
                            </td>
                            <td className="py-2 px-3 text-right text-neutral-200">{safeFixed(p.actual_dps, 1)}</td>
                            <td className="py-2 px-3 text-right text-neutral-200">{safeFixed(p.predicted_vps, 1)}</td>
                            <td className={`py-2 px-3 text-right font-mono ${errColor}`}>
                              {p.error > 0 ? '+' : ''}{safeFixed(p.error, 1)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {p.tier_match ? (
                                <span className="text-green-400 text-xs">Yes</span>
                              ) : (
                                <span className="text-red-400 text-xs">No</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-neutral-400 text-xs">{p.actual_tier}</td>
                            <td className="py-2 px-3 text-neutral-400 text-xs">{p.predicted_tier}</td>
                            <td className="py-2 px-3 text-right text-neutral-500 text-xs">
                              {p.features_provided}/{p.features_total}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Section 5: Feature Importance Changes */}
          {selectedRun?.feature_importance_top10 && selectedRun.feature_importance_top10.length > 0 && (
            <Section title="Feature Importance (Top 10)" icon={Layers} hint="How often each feature is used as a split in the XGBoost trees. Higher = more influential for predictions.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                    {selectedRun.model_version}
                  </h3>
                  <div className="space-y-1.5">
                    {selectedRun.feature_importance_top10.map((f, i) => {
                      const prevFeature = previousRun?.feature_importance_top10?.find(
                        pf => pf.feature === f.feature,
                      );
                      const barWidth = Math.max(f.importance * 100 * 5, 2);
                      return (
                        <div key={f.feature} className="flex items-center gap-2 text-xs">
                          <span className="w-4 text-neutral-600 text-right">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-neutral-300 truncate">{f.feature}</span>
                              <span className="text-neutral-500">{(f.importance * 100).toFixed(1)}%</span>
                              {prevFeature && (
                                <span className="text-neutral-600">
                                  {metricDelta(f.importance, prevFeature.importance, true)}
                                </span>
                              )}
                            </div>
                            <div className="h-1.5 bg-white/[0.05] rounded-full mt-0.5">
                              <div
                                className="h-full bg-purple-500/60 rounded-full"
                                style={{ width: `${Math.min(barWidth, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {previousRun?.feature_importance_top10 && previousRun.feature_importance_top10.length > 0 && (
                  <div>
                    <h3 className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                      {previousRun.model_version} (previous)
                    </h3>
                    <div className="space-y-1.5">
                      {previousRun.feature_importance_top10.map((f, i) => {
                        const barWidth = Math.max(f.importance * 100 * 5, 2);
                        return (
                          <div key={f.feature} className="flex items-center gap-2 text-xs">
                            <span className="w-4 text-neutral-600 text-right">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-neutral-400 truncate">{f.feature}</span>
                                <span className="text-neutral-600">{(f.importance * 100).toFixed(1)}%</span>
                              </div>
                              <div className="h-1.5 bg-white/[0.05] rounded-full mt-0.5">
                                <div
                                  className="h-full bg-neutral-600/60 rounded-full"
                                  style={{ width: `${Math.min(barWidth, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Section 6: Run Evaluation + Log Experiment */}
          <Section title="Run New Evaluation" icon={Play} hint="Run the model against all benchmark videos to get fresh metrics, or log an experiment to track feature changes.">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What changed? e.g. 'v8: removed metadata features, 48 content-only features'"
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40"
              />
              <button
                onClick={runEvaluation}
                disabled={running}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                {running ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Evaluation
                  </>
                )}
              </button>
            </div>
            {running && (
              <p className="text-xs text-neutral-500 mt-2">
                Running XGBoost predictions against {data?.benchmarks?.length || 50} benchmark videos...
              </p>
            )}

            {/* Log Experiment (expandable) */}
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <button
                onClick={() => setShowExperimentForm(!showExperimentForm)}
                className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
              >
                <FlaskConical className="w-4 h-4" />
                Log Experiment
                {showExperimentForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showExperimentForm && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Name */}
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Experiment Name *</label>
                      <input
                        type="text"
                        value={expName}
                        onChange={(e) => setExpName(e.target.value)}
                        placeholder="e.g. add-visual-hook-feature"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40"
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Type *</label>
                      <select
                        value={expType}
                        onChange={(e) => setExpType(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/40"
                      >
                        {EXPERIMENT_TYPES.map(t => (
                          <option key={t} value={t} className="bg-[#1a1a1a]">
                            {t.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Description</label>
                    <textarea
                      value={expDesc}
                      onChange={(e) => setExpDesc(e.target.value)}
                      placeholder="What was tried and why..."
                      rows={3}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Features changed */}
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Features Changed (comma-separated)</label>
                      <input
                        type="text"
                        value={expFeatures}
                        onChange={(e) => setExpFeatures(e.target.value)}
                        placeholder="feature_a, feature_b"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40"
                      />
                    </div>

                    {/* Model versions */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-neutral-500 block mb-1">Model Before</label>
                        <input
                          type="text"
                          value={expModelBefore}
                          onChange={(e) => setExpModelBefore(e.target.value)}
                          placeholder="v7"
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-500 block mb-1">Model After</label>
                        <input
                          type="text"
                          value={expModelAfter}
                          onChange={(e) => setExpModelAfter(e.target.value)}
                          placeholder="v8"
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40"
                        />
                      </div>
                    </div>

                    {/* Verdict */}
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Verdict</label>
                      <select
                        value={expVerdict}
                        onChange={(e) => setExpVerdict(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/40"
                      >
                        <option value="inconclusive" className="bg-[#1a1a1a]">Inconclusive</option>
                        <option value="kept" className="bg-[#1a1a1a]">Kept</option>
                        <option value="reverted" className="bg-[#1a1a1a]">Reverted</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-600 mt-1">
                    Metrics will be auto-populated from the two most recent evaluation runs.
                  </div>

                  <button
                    onClick={saveExperiment}
                    disabled={savingExperiment || !expName.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                  >
                    {savingExperiment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FlaskConical className="w-4 h-4" />
                        Save Experiment
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </Section>

          {/* Section 7: Cumulative Progress Summary */}
          {firstRun && (
            <Section title="Progress Since Baseline" icon={Trophy} hint="Cumulative impact of all experiments: net Spearman change, features kept vs reverted, and best single experiment.">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Net Spearman Change</div>
                  <div className={`text-2xl font-bold ${netSpearmanImprovement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {netSpearmanImprovement >= 0 ? '+' : ''}{safeFixed(netSpearmanImprovement, 4)}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {safeFixed(firstRun.spearman_rho, 4)} {'->'} {safeFixed(latestRun?.spearman_rho, 4)}
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Experiments</div>
                  <div className="text-2xl font-bold text-white">{totalExperiments}</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    <span className="text-green-400">{keptExperiments} kept</span>
                    {' / '}
                    <span className="text-red-400">{revertedExperiments} reverted</span>
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Features Added</div>
                  <div className="text-2xl font-bold text-white">{totalFeaturesAdded}</div>
                  <div className="text-xs text-neutral-500 mt-1">From kept experiments</div>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                  <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Best Experiment</div>
                  {bestExperiment ? (
                    <>
                      <div className="text-sm font-medium text-white truncate">{bestExperiment.experiment_name}</div>
                      <div className="text-xs text-green-400 mt-1">
                        +{safeFixed(bestExperiment.delta?.spearman_rho, 4)} Spearman
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-neutral-500">No positive experiments yet</div>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* Benchmark Set Info */}
          <div className="text-xs text-neutral-600 text-center py-4">
            Benchmark set: {data?.benchmarks?.length || 0} videos
            {data?.benchmarks && data.benchmarks.length > 0 && (
              <> — DPS range: {safeFixed(Math.min(...data.benchmarks.map(b => b.actual_dps)), 0)} to {safeFixed(Math.max(...data.benchmarks.map(b => b.actual_dps)), 0)}</>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

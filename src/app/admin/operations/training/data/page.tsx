'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  RefreshCw,
  Download,
  Wrench,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  ChevronDown,
  BarChart3,
  FileStack,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
export const dynamic = 'force-dynamic';

// ── Types ────────────────────────────────────────────────────────────────────

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
  details: Array<{
    run_id: string;
    video_id: string;
    strategy: string;
    success: boolean;
    error?: string;
  }>;
  elapsed_ms: number;
  message?: string;
  error?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TrainingDataPage() {
  const [niche, setNiche] = useState('side_hustles');
  const [summary, setSummary] = useState<NicheSummary | null>(null);
  const [allSummaries, setAllSummaries] = useState<NicheSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);

  // ── Fetch readiness summary ──────────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/training/readiness-summary?niche=${niche}`);
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Failed to fetch readiness summary');
        return;
      }
      const rows: NicheSummary[] = json.data || [];
      setAllSummaries(rows);
      setSummary(rows.find((r) => r.niche === niche) || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [niche]);

  // Also fetch ALL niches on mount for the niche picker
  const fetchAllNiches = useCallback(async () => {
    try {
      const res = await fetch('/api/training/readiness-summary');
      const json = await res.json();
      if (json.success) setAllSummaries(json.data || []);
    } catch {
      /* ignore — niche picker will still show defaults */
    }
  }, []);

  useEffect(() => {
    fetchAllNiches();
  }, [fetchAllNiches]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // ── Export handler ──────────────────────────────────────────────────────

  const handleExport = async () => {
    setExporting(true);
    setExportResult(null);
    try {
      const res = await fetch(`/api/training/export?niche=${niche}`);

      // If the response is JSON, it's an error or empty result
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        setExportResult({
          success: false,
          message: json.message || json.error || 'No data to export',
        });
        return;
      }

      // CSV response — trigger download
      const rowCount = res.headers.get('x-row-count') || '?';
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        res.headers
          .get('content-disposition')
          ?.match(/filename="(.+)"/)?.[1] ||
        `training_${niche}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setExportResult({
        success: true,
        message: `Downloaded ${rowCount} training rows as CSV`,
      });
    } catch (err: any) {
      setExportResult({ success: false, message: err.message });
    } finally {
      setExporting(false);
    }
  };

  // ── Fix handler ─────────────────────────────────────────────────────────

  const handleFix = async () => {
    setFixing(true);
    setFixResult(null);
    try {
      const res = await fetch('/api/admin/reprocess-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, limit: 25 }),
      });
      const data: FixResult = await res.json();
      setFixResult(data);
      // Refresh summary after fixing
      if (data.success && data.counts.total_fixed > 0) {
        await fetchSummary();
      }
    } catch (err: any) {
      setFixResult({
        success: false,
        counts: {
          attempted: 0,
          quick_fixed: 0,
          synthesized: 0,
          rerun_succeeded: 0,
          rerun_failed: 0,
          total_fixed: 0,
        },
        details: [],
        elapsed_ms: 0,
        error: err.message,
      });
    } finally {
      setFixing(false);
    }
  };

  // ── Derived values ──────────────────────────────────────────────────────

  const readyPct =
    summary && summary.total_runs > 0
      ? ((summary.training_ready_runs / summary.total_runs) * 100).toFixed(0)
      : '0';

  const canExport = (summary?.training_ready_runs ?? 0) > 0;

  // Compute fixable: non_completed + missing_components + missing_raw_result
  // (excluding missing_actual_dps since those need labeling, not fixing)
  const fixable =
    (summary?.non_completed ?? 0) +
    (summary?.missing_components ?? 0) +
    (summary?.missing_raw_result ?? 0);

  // Available niche options: from API + hardcoded defaults
  const nicheOptions = [
    ...new Set([
      'side_hustles',
      'gaming',
      ...allSummaries.map((s) => s.niche),
    ]),
  ];

  // ── Loading state ─────────────────────────────────────────────────────

  if (loading && !summary) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileStack className="w-6 h-6 text-purple-400" />
            Training Data
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Readiness stats from{' '}
            <code className="text-xs bg-gray-800 px-1.5 py-0.5 rounded">
              training_readiness_summary
            </code>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Niche selector */}
          <div className="relative">
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="appearance-none bg-[#111118] border border-[#1a1a2e] rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
            >
              {nicheOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="p-2 rounded-lg border border-[#1a1a2e] bg-[#111118] hover:border-gray-600 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin text-gray-500' : 'text-gray-400'}
            />
          </button>

          {/* Fix Training Gaps */}
          <button
            onClick={handleFix}
            disabled={fixing || fixable === 0}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
              fixing || fixable === 0
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30'
            }`}
          >
            {fixing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Fixing...
              </>
            ) : (
              <>
                <Wrench size={16} />
                Fix {fixable > 0 ? `${fixable} Gaps` : 'Gaps'}
              </>
            )}
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={!canExport || exporting}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
              !canExport || exporting
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
            }`}
          >
            {exporting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {/* Export result banner */}
      {exportResult && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            exportResult.success
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}
        >
          {exportResult.success ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <span
            className={
              exportResult.success ? 'text-emerald-300 text-sm' : 'text-red-300 text-sm'
            }
          >
            {exportResult.message}
          </span>
          <button
            onClick={() => setExportResult(null)}
            className="ml-auto text-gray-500 hover:text-gray-300 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Fix result banner */}
      {fixResult && (
        <div
          className={`rounded-xl border overflow-hidden ${
            fixResult.success
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-red-500/30 bg-red-500/5'
          }`}
        >
          <div className="px-5 py-4 flex items-center gap-2">
            {fixResult.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
            <span className="text-sm font-medium text-gray-200">
              {fixResult.success
                ? `Fixed ${fixResult.counts.total_fixed} of ${fixResult.counts.attempted} runs`
                : fixResult.error || 'Fix failed'}
            </span>
            {fixResult.elapsed_ms > 0 && (
              <span className="text-xs text-gray-500 ml-auto">
                {(fixResult.elapsed_ms / 1000).toFixed(1)}s
              </span>
            )}
            <button
              onClick={() => setFixResult(null)}
              className="text-gray-500 hover:text-gray-300 text-xs ml-2"
            >
              ✕
            </button>
          </div>
          {fixResult.success && fixResult.counts.attempted > 0 && (
            <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MiniStat
                label="Status Fixes"
                value={fixResult.counts.quick_fixed}
                color="emerald"
              />
              <MiniStat
                label="Synthesized"
                value={fixResult.counts.synthesized}
                color="blue"
              />
              <MiniStat
                label="Re-run OK"
                value={fixResult.counts.rerun_succeeded}
                color="purple"
              />
              <MiniStat
                label="Re-run Failed"
                value={fixResult.counts.rerun_failed}
                color="red"
              />
            </div>
          )}
        </div>
      )}

      {/* No data for this niche */}
      {!summary && !loading && (
        <div className="text-center py-12">
          <Database className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            No readiness data for <strong>{niche}</strong>. Run predictions and
            label DPS first.
          </p>
        </div>
      )}

      {summary && (
        <>
          {/* Readiness gauge */}
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Readiness Overview — {niche}
              </h2>
              <ReadinessBadge pct={readyPct} />
            </div>

            <div className="h-3 bg-[#1a1a2e] rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(parseFloat(readyPct), 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {summary.training_ready_runs.toLocaleString()} of{' '}
              {summary.total_runs.toLocaleString()} runs are training-ready
            </p>
          </div>

          {/* Stat cards — row 1: pipeline stages */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Runs"
              value={summary.total_runs}
              icon={<Database className="w-5 h-5" />}
              color="gray"
            />
            <StatCard
              label="Completed"
              value={summary.completed_runs}
              icon={<CheckCircle className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              label="Labeled"
              value={summary.labeled_runs}
              icon={<BarChart3 className="w-5 h-5" />}
              color="purple"
            />
            <StatCard
              label="Training Ready"
              value={summary.training_ready_runs}
              icon={<ShieldCheck className="w-5 h-5" />}
              color="emerald"
              highlight
            />
          </div>

          {/* Stat cards — row 2: gaps */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Non-Completed"
              value={summary.non_completed}
              icon={<AlertTriangle className="w-5 h-5" />}
              color={summary.non_completed > 0 ? 'amber' : 'gray'}
            />
            <StatCard
              label="Missing Components"
              value={summary.missing_components}
              icon={<AlertTriangle className="w-5 h-5" />}
              color={summary.missing_components > 0 ? 'amber' : 'gray'}
            />
            <StatCard
              label="Missing raw_result"
              value={summary.missing_raw_result}
              icon={<AlertTriangle className="w-5 h-5" />}
              color={summary.missing_raw_result > 0 ? 'amber' : 'gray'}
            />
            <StatCard
              label="Missing actual_dps"
              value={summary.missing_actual_dps}
              icon={<XCircle className="w-5 h-5" />}
              color={summary.missing_actual_dps > 0 ? 'red' : 'gray'}
            />
          </div>

          {/* Pipeline funnel visualization */}
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-6">
            <h2 className="text-sm font-medium text-gray-300 mb-5 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Pipeline Funnel
            </h2>
            <div className="space-y-3">
              <FunnelRow
                label="Total Runs"
                value={summary.total_runs}
                max={summary.total_runs}
                color="bg-gray-500"
              />
              <FunnelRow
                label="Completed"
                value={summary.completed_runs}
                max={summary.total_runs}
                color="bg-blue-500"
              />
              <FunnelRow
                label="Labeled (has actual_dps)"
                value={summary.labeled_runs}
                max={summary.total_runs}
                color="bg-purple-500"
              />
              <FunnelRow
                label="Training Ready"
                value={summary.training_ready_runs}
                max={summary.total_runs}
                color="bg-emerald-500"
              />
            </div>
          </div>

          {/* All niches table (if multiple) */}
          {allSummaries.length > 1 && (
            <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1a1a2e]">
                <h2 className="text-sm font-medium text-gray-300">
                  All Niches
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-[#1a1a2e]">
                      <th className="px-5 py-3 text-left font-medium">Niche</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Total
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Completed
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Labeled
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Ready
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Readiness
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a2e]">
                    {allSummaries.map((row) => {
                      const pct =
                        row.total_runs > 0
                          ? (
                              (row.training_ready_runs / row.total_runs) *
                              100
                            ).toFixed(0)
                          : '—';
                      return (
                        <tr
                          key={row.niche}
                          className={`hover:bg-[#0a0a0f]/50 cursor-pointer transition-colors ${
                            row.niche === niche ? 'bg-emerald-500/5' : ''
                          }`}
                          onClick={() => setNiche(row.niche)}
                        >
                          <td className="px-5 py-3">
                            <span className="font-medium text-gray-200">
                              {row.niche}
                            </span>
                            {row.niche === niche && (
                              <span className="ml-2 text-xs text-emerald-400">
                                selected
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-400">
                            {row.total_runs}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-400">
                            {row.completed_runs}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-400">
                            {row.labeled_runs}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-emerald-400 font-medium">
                              {row.training_ready_runs}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ReadinessBadge pct={pct} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'gray' | 'emerald' | 'amber' | 'blue' | 'purple' | 'red';
  highlight?: boolean;
}) {
  const borderColors: Record<string, string> = {
    gray: 'border-[#1a1a2e]',
    emerald: 'border-emerald-500/30',
    amber: 'border-amber-500/30',
    blue: 'border-blue-500/30',
    purple: 'border-purple-500/30',
    red: 'border-red-500/30',
  };
  const iconColors: Record<string, string> = {
    gray: 'text-gray-500',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
  };

  return (
    <div
      className={`bg-[#111118] border rounded-xl p-4 ${borderColors[color]} ${
        highlight ? 'ring-1 ring-emerald-500/20' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={iconColors[color]}>{icon}</span>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p
        className={`text-2xl font-semibold tracking-tight ${
          value > 0 ? iconColors[color] : 'text-gray-600'
        }`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function FunnelRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-48 text-sm text-gray-400 shrink-0 flex items-center gap-1.5">
        <ArrowRight size={12} className="text-gray-600" />
        {label}
      </div>
      <div className="flex-1 h-5 bg-[#1a1a2e] rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-20 text-right text-sm tabular-nums">
        <span className="text-white">{value.toLocaleString()}</span>
        <span className="text-gray-600 ml-1">
          ({pct.toFixed(0)}%)
        </span>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'emerald' | 'blue' | 'purple' | 'red';
}) {
  const textColors = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
  };
  return (
    <div className="text-center py-2 px-3 rounded-lg bg-[#0a0a0f]">
      <p className={`text-lg font-semibold ${textColors[color]}`}>{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

function ReadinessBadge({ pct }: { pct: string }) {
  const num = parseFloat(pct);
  const cls = isNaN(num)
    ? 'text-gray-600 bg-gray-800/40'
    : num >= 80
      ? 'text-emerald-400 bg-emerald-500/10'
      : num >= 50
        ? 'text-amber-400 bg-amber-500/10'
        : 'text-red-400 bg-red-500/10';

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {pct === '—' ? '—' : `${pct}%`}
    </span>
  );
}

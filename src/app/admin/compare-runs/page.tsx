'use client';

import React, { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase client ──────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface RunSummary {
  id: string;
  video_id: string;
  status: string;
  predicted_dps_7d: number | null;
  predicted_tier_7d: string | null;
  confidence: number | null;
  latency_ms_total: number | null;
  transcription_source: string | null;
  qc_flags: string[] | null;
  llm_spread: number | null;
  llm_influence_applied: boolean | null;
  score_version: string | null;
  coach_version: string | null;
  llm_excluded_reason: string | null;
  created_at: string;
}

interface ComponentRow {
  run_id: string;
  component_id: string;
  success: boolean;
  prediction: number | null;
  confidence: number | null;
  latency_ms: number | null;
  error: string | null;
  skipped: boolean;
}

interface CompareData {
  runs: RunSummary[];
  components: ComponentRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tierColor(tier: string | null): string {
  switch (tier) {
    case 'Viral Potential': return 'text-fuchsia-400';
    case 'Excellent - Top 10%': return 'text-green-400';
    case 'Good - Top 25%': return 'text-emerald-400';
    case 'Average': return 'text-yellow-400';
    case 'Needs Work': return 'text-red-400';
    default: return 'text-zinc-500';
  }
}

function deltaClass(delta: number | null): string {
  if (delta === null) return '';
  if (Math.abs(delta) > 10) return 'text-red-400 font-bold';
  if (Math.abs(delta) > 5) return 'text-yellow-400';
  return 'text-zinc-500';
}

function fmtNum(v: number | null | undefined, decimals = 1): string {
  if (v === null || v === undefined) return '—';
  return v.toFixed(decimals);
}

function statusBadge(row: ComponentRow): { label: string; cls: string } {
  if (row.skipped) return { label: 'SKIP', cls: 'bg-zinc-700 text-zinc-300' };
  if (row.success) return { label: 'OK', cls: 'bg-emerald-900/60 text-emerald-300' };
  if (row.error?.includes('disabled') || row.error?.includes('not registered'))
    return { label: 'OFF', cls: 'bg-zinc-800 text-zinc-500' };
  return { label: 'FAIL', cls: 'bg-red-900/60 text-red-300' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CompareRunsPage() {
  const [inputIds, setInputIds] = useState('');
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentRuns, setRecentRuns] = useState<RunSummary[] | null>(null);

  // Load recent runs for quick selection
  const loadRecent = useCallback(async () => {
    const { data: runs } = await supabase
      .from('prediction_runs')
      .select('id, video_id, status, predicted_dps_7d, predicted_tier_7d, confidence, latency_ms_total, transcription_source, qc_flags, llm_spread, llm_influence_applied, score_version, coach_version, llm_excluded_reason, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(20);
    if (runs) setRecentRuns(runs);
  }, []);

  // Fetch comparison data
  const fetchComparison = useCallback(async (ids: string[]) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch run summaries
      const { data: runs, error: runErr } = await supabase
        .from('prediction_runs')
        .select('id, video_id, status, predicted_dps_7d, predicted_tier_7d, confidence, latency_ms_total, transcription_source, qc_flags, llm_spread, llm_influence_applied, score_version, coach_version, llm_excluded_reason, created_at')
        .in('id', ids)
        .order('created_at', { ascending: true });

      if (runErr) throw new Error(runErr.message);
      if (!runs || runs.length === 0) throw new Error('No runs found for those IDs');

      // Fetch component results
      const { data: comps, error: compErr } = await supabase
        .from('run_component_results')
        .select('run_id, component_id, success, prediction, confidence, latency_ms, error, skipped')
        .in('run_id', ids)
        .order('component_id');

      if (compErr) throw new Error(compErr.message);

      setData({ runs, components: comps ?? [] });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCompare = () => {
    const ids = inputIds
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (ids.length < 2 || ids.length > 5) {
      setError('Enter 2-5 run IDs');
      return;
    }
    fetchComparison(ids);
  };

  // Toggle run selection from recent list
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  };

  const compareSelected = () => {
    const ids = Array.from(selectedIds);
    setInputIds(ids.join(', '));
    fetchComparison(ids);
  };

  // Build component comparison grid
  const allComponentIds = data
    ? [...new Set(data.components.map(c => c.component_id))].sort()
    : [];

  const getComp = (runId: string, compId: string): ComponentRow | undefined =>
    data?.components.find(c => c.run_id === runId && c.component_id === compId);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pl-24">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compare Runs</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Select 2-5 prediction runs to compare side-by-side
          </p>
        </div>

        {/* Input bar */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 mb-1">Run IDs (comma or space separated)</label>
            <input
              value={inputIds}
              onChange={e => setInputIds(e.target.value)}
              placeholder="paste run_id_1, run_id_2, ..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
            />
          </div>
          <button
            onClick={handleCompare}
            disabled={loading}
            className="px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-lg hover:bg-zinc-200 transition disabled:opacity-40"
          >
            {loading ? 'Loading...' : 'Compare'}
          </button>
          <button
            onClick={loadRecent}
            className="px-4 py-2.5 bg-zinc-800 text-zinc-300 text-sm rounded-lg hover:bg-zinc-700 transition"
          >
            Recent Runs
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Recent runs picker */}
        {recentRuns && !data && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-400">Select runs to compare (click rows, then Compare Selected)</h3>
              {selectedIds.size >= 2 && (
                <button
                  onClick={compareSelected}
                  className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-500 transition"
                >
                  Compare {selectedIds.size} Selected
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-600 border-b border-zinc-800">
                    <th className="py-2 text-left w-8"></th>
                    <th className="py-2 text-left font-mono">Run ID</th>
                    <th className="py-2 text-left">DPS</th>
                    <th className="py-2 text-left">Tier</th>
                    <th className="py-2 text-left">Confidence</th>
                    <th className="py-2 text-left">Transcript</th>
                    <th className="py-2 text-left">QC Flags</th>
                    <th className="py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map(run => (
                    <tr
                      key={run.id}
                      onClick={() => toggleSelect(run.id)}
                      className={`border-b border-zinc-800/50 cursor-pointer transition ${
                        selectedIds.has(run.id) ? 'bg-emerald-900/20' : 'hover:bg-zinc-800/50'
                      }`}
                    >
                      <td className="py-2">
                        <div className={`w-4 h-4 rounded border ${
                          selectedIds.has(run.id)
                            ? 'bg-emerald-500 border-emerald-400'
                            : 'border-zinc-700'
                        }`} />
                      </td>
                      <td className="py-2 font-mono text-zinc-400">{run.id.substring(0, 8)}…</td>
                      <td className="py-2 font-semibold">{fmtNum(run.predicted_dps_7d)}</td>
                      <td className={`py-2 ${tierColor(run.predicted_tier_7d)}`}>{run.predicted_tier_7d ?? '—'}</td>
                      <td className="py-2">{fmtNum(run.confidence, 2)}</td>
                      <td className="py-2 text-zinc-500">{run.transcription_source ?? '—'}</td>
                      <td className="py-2">
                        {(run.qc_flags ?? []).map(f => (
                          <span key={f} className="inline-block bg-yellow-900/40 text-yellow-400 text-[10px] px-1.5 py-0.5 rounded mr-1">{f}</span>
                        ))}
                      </td>
                      <td className="py-2 text-zinc-600">{new Date(run.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ Comparison Results ═══ */}
        {data && (
          <>
            {/* Run-level summary */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Run Summary</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-600 border-b border-zinc-800">
                      <th className="py-2 text-left">Field</th>
                      {data.runs.map(r => (
                        <th key={r.id} className="py-2 text-left font-mono text-xs text-zinc-400">
                          {r.id.substring(0, 8)}…
                          <br />
                          <span className="text-zinc-600 font-normal">
                            {new Date(r.created_at).toLocaleString()}
                          </span>
                        </th>
                      ))}
                      {data.runs.length === 2 && (
                        <th className="py-2 text-left text-zinc-600">Delta</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {/* DPS (Score Lane) */}
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-2 text-zinc-500">
                        Final DPS
                        <span className="ml-1.5 text-[10px] bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded">Score Lane</span>
                      </td>
                      {data.runs.map(r => (
                        <td key={r.id} className="py-2 font-bold text-lg">{fmtNum(r.predicted_dps_7d)}</td>
                      ))}
                      {data.runs.length === 2 && (
                        <td className={`py-2 font-semibold ${deltaClass((data.runs[1].predicted_dps_7d ?? 0) - (data.runs[0].predicted_dps_7d ?? 0))}`}>
                          {((data.runs[1].predicted_dps_7d ?? 0) - (data.runs[0].predicted_dps_7d ?? 0)) >= 0 ? '+' : ''}
                          {fmtNum((data.runs[1].predicted_dps_7d ?? 0) - (data.runs[0].predicted_dps_7d ?? 0))}
                        </td>
                      )}
                    </tr>
                    {/* LLMs Excluded from DPS */}
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-2 text-zinc-500">LLMs excluded from DPS</td>
                      {data.runs.map(r => {
                        const excluded = !!r.llm_excluded_reason;
                        return (
                          <td key={r.id} className="py-2">
                            {excluded
                              ? <span className="text-orange-400 text-xs font-semibold">YES <span className="text-zinc-500 font-normal">({r.llm_excluded_reason})</span></span>
                              : <span className="text-emerald-400 text-xs font-semibold">NO</span>
                            }
                          </td>
                        );
                      })}
                      {data.runs.length === 2 && <td />}
                    </tr>
                    {/* Score / Coach Version */}
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-2 text-zinc-500">Versions</td>
                      {data.runs.map(r => (
                        <td key={r.id} className="py-2 text-zinc-500 text-xs font-mono">
                          {r.score_version ?? '—'} / {r.coach_version ?? '—'}
                        </td>
                      ))}
                      {data.runs.length === 2 && <td />}
                    </tr>
                    {/* Tier */}
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-2 text-zinc-500">Tier</td>
                      {data.runs.map(r => (
                        <td key={r.id} className={`py-2 font-semibold ${tierColor(r.predicted_tier_7d)}`}>{r.predicted_tier_7d ?? '—'}</td>
                      ))}
                      {data.runs.length === 2 && <td />}
                    </tr>
                    {/* Confidence */}
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-2 text-zinc-500">Confidence</td>
                      {data.runs.map(r => (
                        <td key={r.id} className="py-2">{fmtNum(r.confidence, 2)}</td>
                      ))}
                      {data.runs.length === 2 && (
                        <td className={`py-2 ${deltaClass(((data.runs[1].confidence ?? 0) - (data.runs[0].confidence ?? 0)) * 100)}`}>
                          {fmtNum((data.runs[1].confidence ?? 0) - (data.runs[0].confidence ?? 0), 2)}
                        </td>
                      )}
                    </tr>
                    {/* Transcript */}
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-2 text-zinc-500">Transcript source</td>
                      {data.runs.map(r => (
                        <td key={r.id} className="py-2 text-zinc-400">{r.transcription_source ?? '—'}</td>
                      ))}
                      {data.runs.length === 2 && <td />}
                    </tr>
                    {/* Latency */}
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-2 text-zinc-500">Latency</td>
                      {data.runs.map(r => (
                        <td key={r.id} className="py-2 text-zinc-400">
                          {r.latency_ms_total ? `${(r.latency_ms_total / 1000).toFixed(1)}s` : '—'}
                        </td>
                      ))}
                      {data.runs.length === 2 && <td />}
                    </tr>
                    {/* QC Flags */}
                    <tr>
                      <td className="py-2 text-zinc-500">QC Flags</td>
                      {data.runs.map(r => (
                        <td key={r.id} className="py-2">
                          {(r.qc_flags ?? []).length === 0
                            ? <span className="text-emerald-500 text-xs">✓ clean</span>
                            : (r.qc_flags ?? []).map(f => (
                                <span key={f} className="inline-block bg-yellow-900/40 text-yellow-400 text-[10px] px-1.5 py-0.5 rounded mr-1 mb-0.5">{f}</span>
                              ))
                          }
                        </td>
                      ))}
                      {data.runs.length === 2 && <td />}
                    </tr>
                    {/* LLM Spread (Coach Lane) */}
                    <tr className="border-b border-zinc-800/50">
                      <td className="py-2 text-zinc-500">
                        LLM Spread
                        <span className="ml-1.5 text-[10px] bg-purple-900/40 text-purple-400 px-1.5 py-0.5 rounded">Coach Lane</span>
                      </td>
                      {data.runs.map(r => {
                        const spread = r.llm_spread;
                        const cls = spread === null || spread === undefined ? 'text-zinc-600'
                          : spread > 10 ? 'text-red-400 font-semibold'
                          : spread > 5 ? 'text-yellow-400'
                          : 'text-emerald-400';
                        return (
                          <td key={r.id} className={`py-2 ${cls}`}>
                            {spread !== null && spread !== undefined ? `${spread.toFixed(1)} DPS` : '—'}
                          </td>
                        );
                      })}
                      {data.runs.length === 2 && <td />}
                    </tr>
                    {/* LLM Influence (Coach Lane) */}
                    <tr>
                      <td className="py-2 text-zinc-500">
                        LLM Influence on DPS
                        <span className="ml-1.5 text-[10px] bg-purple-900/40 text-purple-400 px-1.5 py-0.5 rounded">Coach Lane</span>
                      </td>
                      {data.runs.map(r => {
                        const applied = r.llm_influence_applied;
                        if (applied === null || applied === undefined) {
                          return <td key={r.id} className="py-2 text-zinc-600">—</td>;
                        }
                        return (
                          <td key={r.id} className="py-2">
                            {applied
                              ? <span className="text-blue-400 text-xs font-semibold">YES (contributed to DPS)</span>
                              : <span className="text-orange-400 text-xs font-semibold">NO (coaching only)</span>
                            }
                          </td>
                        );
                      })}
                      {data.runs.length === 2 && <td />}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Component-level comparison */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                Component Breakdown ({allComponentIds.length} components)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-600 border-b border-zinc-800">
                      <th className="py-2 text-left">Component</th>
                      {data.runs.map(r => (
                        <th key={r.id} colSpan={3} className="py-2 text-center font-mono text-zinc-500 border-l border-zinc-800">
                          {r.id.substring(0, 8)}…
                        </th>
                      ))}
                      {data.runs.length === 2 && (
                        <th className="py-2 text-center border-l border-zinc-800 text-zinc-600">Δ pred</th>
                      )}
                    </tr>
                    <tr className="text-zinc-700 border-b border-zinc-800">
                      <th />
                      {data.runs.map(r => (
                        <React.Fragment key={r.id}>
                          <th className="py-1 text-center border-l border-zinc-800/50">status</th>
                          <th className="py-1 text-center">pred</th>
                          <th className="py-1 text-center">conf</th>
                        </React.Fragment>
                      ))}
                      {data.runs.length === 2 && <th />}
                    </tr>
                  </thead>
                  <tbody>
                    {allComponentIds.map(compId => {
                      const cells = data.runs.map(r => getComp(r.id, compId));
                      const preds = cells.map(c => c?.prediction ?? null);
                      const delta = data.runs.length === 2 && preds[0] !== null && preds[1] !== null
                        ? preds[1]! - preds[0]!
                        : null;

                      return (
                        <tr key={compId} className="border-b border-zinc-800/30 hover:bg-zinc-800/30 transition">
                          <td className="py-1.5 font-mono text-zinc-400 pr-4">{compId}</td>
                          {cells.map((c, i) => {
                            if (!c) {
                              return (
                                <React.Fragment key={data.runs[i].id}>
                                  <td className="py-1.5 text-center border-l border-zinc-800/50">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-600">N/A</span>
                                  </td>
                                  <td className="py-1.5 text-center text-zinc-700">—</td>
                                  <td className="py-1.5 text-center text-zinc-700">—</td>
                                </React.Fragment>
                              );
                            }
                            const badge = statusBadge(c);
                            return (
                              <React.Fragment key={data.runs[i].id}>
                                <td className="py-1.5 text-center border-l border-zinc-800/50">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                                </td>
                                <td className="py-1.5 text-center font-semibold">{fmtNum(c.prediction)}</td>
                                <td className="py-1.5 text-center text-zinc-500">{fmtNum(c.confidence, 2)}</td>
                              </React.Fragment>
                            );
                          })}
                          {data.runs.length === 2 && (
                            <td className={`py-1.5 text-center border-l border-zinc-800 font-semibold ${deltaClass(delta)}`}>
                              {delta !== null ? `${delta >= 0 ? '+' : ''}${fmtNum(delta)}` : '—'}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={() => { setData(null); setSelectedIds(new Set()); }}
              className="text-sm text-zinc-600 hover:text-zinc-400 transition"
            >
              ← Clear &amp; start over
            </button>
          </>
        )}
      </div>
    </div>
  );
}


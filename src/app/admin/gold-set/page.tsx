'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ── Types ────────────────────────────────────────────────────────────────────

interface GoldRow {
  run_id: string;
  video_id: string;
  niche: string;
  created_at: string;
  // Scoring stages (extracted from raw_result JSONB — always available)
  pre_adjustment_aggregate: number | null;
  niche_factor: number | null;
  account_factor: number | null;
  orchestrator_vps: number | null;
  final_vps: number | null;
  confidence: number | null;
  // Actuals (from dedicated columns — available after migration 20260311)
  actual_vps: number | null;
  actual_views: number | null;
  actual_likes: number | null;
  actual_saves: number | null;
  actual_tier: string | null;
  prediction_error: number | null;
  labeling_mode: string | null;
  // QC (from dedicated columns — available after migration 20260311)
  qc_flags: string[];
  llm_spread: number | null;
  llm_excluded_reason: string | null;
  components_used: string[];
  // Ranks (computed client-side)
  rank_final?: number;
  rank_actual?: number;
}

type SortKey = 'final_vps' | 'actual_vps' | 'actual_views' | 'prediction_error' | 'pre_adjustment_aggregate' | 'created_at';

// ── Column sets ──────────────────────────────────────────────────────────────

// Columns guaranteed by CREATE TABLE + ALTER TABLE migrations
const BASE_COLUMNS = `
  id, video_id, predicted_dps_7d, confidence, raw_result,
  components_used, created_at, labeling_mode
`;

// Extended columns added by migration 20260311
const EXTENDED_COLUMNS = `
  id, video_id, predicted_dps_7d, confidence, raw_result,
  actual_dps, actual_views, actual_likes, actual_saves, actual_tier,
  prediction_error, labeling_mode,
  qc_flags, llm_spread, llm_excluded_reason, components_used, created_at
`;

// ── Page ─────────────────────────────────────────────────────────────────────

export default function GoldSetPage() {
  const [rows, setRows] = useState<GoldRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemaNote, setSchemaNote] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('final_vps');
  const [sortAsc, setSortAsc] = useState(false);
  const [runIdInput, setRunIdInput] = useState('');
  const [limit, setLimit] = useState(20);
  const [filterLabeled, setFilterLabeled] = useState(false);

  /**
   * Two-phase query: try extended columns first, fall back to base if schema missing.
   * This ensures the page loads even before the 20260311 migration runs.
   */
  async function queryRuns(
    buildQuery: (cols: string) => any,
  ): Promise<{ data: any[]; usedExtended: boolean }> {
    // Phase 1: Try extended columns
    const { data: extData, error: extErr } = await buildQuery(EXTENDED_COLUMNS);
    if (!extErr && extData) {
      return { data: extData, usedExtended: true };
    }

    // Phase 2: Fall back to base columns (schema missing columns)
    console.warn('[GoldSet] Extended query failed, falling back to base columns:', extErr?.message);
    const { data: baseData, error: baseErr } = await buildQuery(BASE_COLUMNS);
    if (baseErr) throw new Error(baseErr.message);
    return { data: baseData || [], usedExtended: false };
  }

  const loadRecent = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSchemaNote(null);
    try {
      const { data: runs, usedExtended } = await queryRuns((cols) =>
        supabase
          .from('prediction_runs')
          .select(cols)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(limit),
      );

      if (!usedExtended) {
        setSchemaNote('Some columns missing — run migration 20260311_prediction_runs_missing_columns.sql for full evaluation data.');
      }

      if (runs.length === 0) {
        setRows([]);
        return;
      }

      const nicheMap = await fetchNiches(runs);
      setRows(runs.map((r: any) => parseRun(r, nicheMap)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const loadByIds = useCallback(async () => {
    const ids = runIdInput
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return;

    setLoading(true);
    setError(null);
    setSchemaNote(null);
    try {
      const { data: runs, usedExtended } = await queryRuns((cols) =>
        supabase
          .from('prediction_runs')
          .select(cols)
          .in('id', ids),
      );

      if (!usedExtended) {
        setSchemaNote('Some columns missing — run migration 20260311_prediction_runs_missing_columns.sql for full evaluation data.');
      }

      if (runs.length === 0) {
        setRows([]);
        return;
      }

      const nicheMap = await fetchNiches(runs);
      setRows(runs.map((r: any) => parseRun(r, nicheMap)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [runIdInput]);

  // Sort and rank
  const displayRows = useMemo(() => {
    const filtered = filterLabeled ? rows.filter(r => r.actual_vps != null) : rows;
    const s = [...filtered].sort((a, b) => {
      const av = a[sortBy] ?? -Infinity;
      const bv = b[sortBy] ?? -Infinity;
      return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    // Assign ranks by final_vps and actual_vps
    const byFinal = [...filtered].sort((a, b) => (b.final_vps ?? -1) - (a.final_vps ?? -1));
    const byActual = [...filtered].sort((a, b) => (b.actual_vps ?? -1) - (a.actual_vps ?? -1));
    const rankFinal = new Map(byFinal.map((r, i) => [r.run_id, i + 1]));
    const rankActual = new Map(byActual.filter(r => r.actual_vps != null).map((r, i) => [r.run_id, i + 1]));
    for (const r of s) {
      r.rank_final = rankFinal.get(r.run_id);
      r.rank_actual = rankActual.get(r.run_id);
    }
    return s;
  }, [rows, sortBy, sortAsc, filterLabeled]);

  // Stats for rows with actuals
  const stats = useMemo(() => {
    const paired = rows.filter(r => r.final_vps != null && r.actual_vps != null);
    if (paired.length < 2) return null;

    // Spearman rho
    const byPred = [...paired].sort((a, b) => (b.final_vps ?? 0) - (a.final_vps ?? 0));
    const byAct = [...paired].sort((a, b) => (b.actual_vps ?? 0) - (a.actual_vps ?? 0));
    const predRank = new Map(byPred.map((r, i) => [r.run_id, i + 1]));
    const actRank = new Map(byAct.map((r, i) => [r.run_id, i + 1]));
    const n = paired.length;
    let d2sum = 0;
    for (const r of paired) {
      const d = (predRank.get(r.run_id) ?? 0) - (actRank.get(r.run_id) ?? 0);
      d2sum += d * d;
    }
    const rho = n > 1 ? 1 - (6 * d2sum) / (n * (n * n - 1)) : null;

    // MAE
    let absErrorSum = 0;
    for (const r of paired) {
      absErrorSum += Math.abs((r.final_vps ?? 0) - (r.actual_vps ?? 0));
    }
    const mae = absErrorSum / n;

    // Within-range count
    const withinFive = paired.filter(r => Math.abs((r.final_vps ?? 0) - (r.actual_vps ?? 0)) <= 5).length;
    const withinTen = paired.filter(r => Math.abs((r.final_vps ?? 0) - (r.actual_vps ?? 0)) <= 10).length;

    return { rho, mae, n, withinFive, withinTen };
  }, [rows]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  };

  const arrow = (key: SortKey) => sortBy === key ? (sortAsc ? ' ▲' : ' ▼') : '';

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', fontSize: 13, background: '#0a0a0a', color: '#e0e0e0', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 18, marginBottom: 4 }}>Gold Set Verification Harness</h1>
      <p style={{ fontSize: 11, color: '#666', marginBottom: 16 }}>
        Compare predicted VPS vs actual VPS for labeled runs. Actual VPS comes from scraped metrics via auto-labeler, metric-attacher, or scrape-ingest.
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#888', marginBottom: 4 }}>Recent completed runs</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={limit} onChange={e => setLimit(Number(e.target.value))}
              style={{ background: '#1a1a1a', color: '#e0e0e0', border: '1px solid #333', padding: '4px 8px' }}>
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button onClick={loadRecent} disabled={loading}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '4px 12px', cursor: 'pointer' }}>
              {loading ? '...' : 'Load Recent'}
            </button>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#888', marginBottom: 4 }}>Or paste run IDs (comma/newline separated)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={runIdInput} onChange={e => setRunIdInput(e.target.value)}
              placeholder="run_id_1, run_id_2, ..."
              style={{ flex: 1, background: '#1a1a1a', color: '#e0e0e0', border: '1px solid #333', padding: '4px 8px' }} />
            <button onClick={loadByIds} disabled={loading || !runIdInput.trim()}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '4px 12px', cursor: 'pointer' }}>
              Load IDs
            </button>
          </div>
        </div>
        {rows.length > 0 && (
          <label style={{ fontSize: 11, color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={filterLabeled} onChange={e => setFilterLabeled(e.target.checked)} />
            Only labeled
          </label>
        )}
      </div>

      {error && <div style={{ color: '#f87171', marginBottom: 12 }}>Error: {error}</div>}
      {schemaNote && <div style={{ color: '#facc15', marginBottom: 12, fontSize: 11 }}>{schemaNote}</div>}

      {/* Summary stats */}
      {rows.length > 0 && (
        <div style={{ display: 'flex', gap: 24, marginBottom: 16, fontSize: 12, color: '#aaa', flexWrap: 'wrap' }}>
          <span>{rows.length} runs loaded</span>
          <span>{rows.filter(r => r.actual_vps != null).length} with actual VPS</span>
          {stats && (
            <>
              <span>MAE: <b style={{ color: stats.mae < 10 ? '#4ade80' : stats.mae < 20 ? '#facc15' : '#f87171' }}>{stats.mae.toFixed(1)}</b></span>
              {stats.rho != null && (
                <span style={{ color: stats.rho > 0.5 ? '#4ade80' : stats.rho > 0 ? '#facc15' : '#f87171' }}>
                  Spearman: {stats.rho.toFixed(3)}
                  {stats.rho > 0.7 ? ' (strong)' : stats.rho > 0.4 ? ' (moderate)' : ' (weak)'}
                </span>
              )}
              <span>Within 5: {stats.withinFive}/{stats.n} ({Math.round(stats.withinFive / stats.n * 100)}%)</span>
              <span>Within 10: {stats.withinTen}/{stats.n} ({Math.round(stats.withinTen / stats.n * 100)}%)</span>
            </>
          )}
        </div>
      )}

      {/* Table */}
      {displayRows.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={th}>#</th>
                <th style={th}>Run ID</th>
                <th style={th}>Niche</th>
                <th style={{ ...th, cursor: 'pointer' }} onClick={() => handleSort('pre_adjustment_aggregate')}>
                  Raw{arrow('pre_adjustment_aggregate')}
                </th>
                <th style={th}>NF</th>
                <th style={th}>AF</th>
                <th style={{ ...th, cursor: 'pointer' }} onClick={() => handleSort('final_vps')}>
                  Pred VPS{arrow('final_vps')}
                </th>
                <th style={th}>Conf</th>
                <th style={th}>R(P)</th>
                <th style={{ ...th, cursor: 'pointer' }} onClick={() => handleSort('actual_vps')}>
                  Actual VPS{arrow('actual_vps')}
                </th>
                <th style={{ ...th, cursor: 'pointer' }} onClick={() => handleSort('actual_views')}>
                  Views{arrow('actual_views')}
                </th>
                <th style={th}>R(A)</th>
                <th style={{ ...th, cursor: 'pointer' }} onClick={() => handleSort('prediction_error')}>
                  Error{arrow('prediction_error')}
                </th>
                <th style={th}>Label</th>
                <th style={th}>Flags</th>
                <th style={{ ...th, cursor: 'pointer' }} onClick={() => handleSort('created_at')}>
                  Date{arrow('created_at')}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r, i) => {
                const rankDiff = (r.rank_final != null && r.rank_actual != null) ? r.rank_final - r.rank_actual : null;
                const absErr = (r.final_vps != null && r.actual_vps != null) ? r.final_vps - r.actual_vps : null;
                return (
                  <tr key={r.run_id} style={{ borderBottom: '1px solid #222', background: i % 2 === 0 ? '#0f0f0f' : '#141414' }}>
                    <td style={td}>{i + 1}</td>
                    <td style={{ ...td, fontSize: 10 }} title={r.run_id}>{r.run_id.slice(0, 8)}</td>
                    <td style={td}>{r.niche}</td>
                    <td style={tdNum}>{fmt(r.pre_adjustment_aggregate)}</td>
                    <td style={tdNum}>{r.niche_factor != null ? r.niche_factor.toFixed(2) : '-'}</td>
                    <td style={tdNum}>{r.account_factor != null ? r.account_factor.toFixed(2) : '-'}</td>
                    <td style={{ ...tdNum, fontWeight: 'bold', color: vpsColor(r.final_vps) }}>{fmt(r.final_vps)}</td>
                    <td style={tdNum}>{r.confidence != null ? r.confidence.toFixed(2) : '-'}</td>
                    <td style={tdNum}>{r.rank_final ?? '-'}</td>
                    <td style={{ ...tdNum, fontWeight: 'bold', color: vpsColor(r.actual_vps) }}>{fmt(r.actual_vps)}</td>
                    <td style={tdNum}>{r.actual_views != null ? fmtViews(r.actual_views) : '-'}</td>
                    <td style={tdNum} title={rankDiff != null ? `Rank diff: ${rankDiff}` : ''}>
                      {r.rank_actual ?? '-'}
                    </td>
                    <td style={{ ...tdNum, color: absErr != null ? (Math.abs(absErr) <= 5 ? '#4ade80' : Math.abs(absErr) <= 10 ? '#facc15' : '#f87171') : '#666' }}>
                      {absErr != null ? (absErr > 0 ? `+${absErr.toFixed(1)}` : absErr.toFixed(1)) : '-'}
                    </td>
                    <td style={{ ...td, fontSize: 9, color: '#888' }}>{labelAbbr(r.labeling_mode)}</td>
                    <td style={{ ...td, fontSize: 10, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title={(r.qc_flags || []).join(', ')}>
                      {(r.qc_flags || []).filter(f => f !== 'TWO_LANE_ACTIVE').join(', ') || '-'}
                    </td>
                    <td style={{ ...td, fontSize: 10 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rows.length === 0 && !loading && (
        <div style={{ color: '#666', padding: 40, textAlign: 'center' }}>Load runs to begin verification</div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchNiches(runs: any[]): Promise<Map<string, string>> {
  const videoIds = [...new Set(runs.map((r: any) => r.video_id).filter(Boolean))];
  if (videoIds.length === 0) return new Map();
  const { data: vFiles } = await supabase
    .from('video_files')
    .select('id, niche')
    .in('id', videoIds);
  return new Map((vFiles || []).map((v: any) => [v.id, v.niche || 'unknown']));
}

function parseRun(r: any, nicheMap: Map<string, string>): GoldRow {
  const raw = r.raw_result || {};
  const adj = raw.adjustments || {};

  return {
    run_id: r.id,
    video_id: r.video_id,
    niche: nicheMap.get(r.video_id) || 'unknown',
    created_at: r.created_at,
    // Scoring stages — always available from raw_result JSONB
    pre_adjustment_aggregate: adj.rawScore ?? null,
    niche_factor: adj.nicheFactor ?? null,
    account_factor: adj.accountFactor ?? null,
    orchestrator_vps: raw.vps ?? null,
    final_vps: r.predicted_dps_7d,
    confidence: r.confidence,
    // Actuals — available when migration 20260311 is applied
    actual_vps: r.actual_dps ?? null,
    actual_views: r.actual_views ?? null,
    actual_likes: r.actual_likes ?? null,
    actual_saves: r.actual_saves ?? null,
    actual_tier: r.actual_tier ?? null,
    prediction_error: r.prediction_error ?? null,
    labeling_mode: r.labeling_mode ?? null,
    // QC — from dedicated columns or fallback to raw_result
    qc_flags: r.qc_flags ?? raw.qc_flags ?? [],
    llm_spread: r.llm_spread ?? raw.llm_spread ?? null,
    llm_excluded_reason: r.llm_excluded_reason ?? null,
    components_used: r.components_used || [],
  };
}

function fmt(n: number | null): string {
  return n != null ? n.toFixed(1) : '-';
}

function fmtViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function vpsColor(vps: number | null): string {
  if (vps == null) return '#666';
  if (vps >= 80) return '#4ade80';
  if (vps >= 60) return '#facc15';
  if (vps >= 40) return '#fb923c';
  return '#f87171';
}

function labelAbbr(mode: string | null): string {
  if (!mode) return '-';
  if (mode === 'scrape_ingest') return 'scrape';
  if (mode === 'auto_cron') return 'auto';
  if (mode === 'manual') return 'manual';
  return mode.slice(0, 6);
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 8px',
  color: '#888',
  fontSize: 11,
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

const td: React.CSSProperties = {
  padding: '5px 8px',
  whiteSpace: 'nowrap',
};

const tdNum: React.CSSProperties = {
  ...td,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};

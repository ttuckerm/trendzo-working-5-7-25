/**
 * VPS Diagnostic Baseline — Pre-rebuild snapshot
 *
 * Reads the clean labeled rows (actual_follower_count > 0 AND dps_v2_display_score IS NOT NULL)
 * and extracts:
 * - Current VPS (predicted_dps_7d)
 * - DPS actual (dps_v2_display_score)
 * - XGBoost raw prediction (from raw_result.paths[].results[] where componentId === 'xgboost-virality-ml')
 * - All component scores (from raw_result.paths[].results[])
 *
 * Computes:
 * - Spearman rho: current VPS vs DPS actuals
 * - Spearman rho: XGBoost raw vs DPS actuals
 * - Score ranges for VPS, XGBoost, and DPS
 *
 * Outputs: data/vps-baseline-before.json + console summary table
 *
 * Usage: npx tsx scripts/diagnostic-baseline-vps.ts
 */

import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

// ── Spearman Rank Correlation ───────────────────────────────────────────────

function rankArray(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);

  const ranks = new Array<number>(values.length);
  let i = 0;
  while (i < indexed.length) {
    // Find tied group
    let j = i;
    while (j < indexed.length && indexed[j].v === indexed[i].v) j++;
    // Assign average rank to ties
    const avgRank = (i + j + 1) / 2; // 1-based average rank
    for (let k = i; k < j; k++) {
      ranks[indexed[k].i] = avgRank;
    }
    i = j;
  }
  return ranks;
}

function spearmanRho(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return NaN;

  const rankX = rankArray(x);
  const rankY = rankArray(y);

  let sumD2 = 0;
  for (let i = 0; i < n; i++) {
    const d = rankX[i] - rankY[i];
    sumD2 += d * d;
  }

  return 1 - (6 * sumD2) / (n * (n * n - 1));
}

// ── Main ────────────────────────────────────────────────────────────────────

interface ComponentScore {
  componentId: string;
  prediction: number;
}

interface BaselineRow {
  id: string;
  video_id: string;
  vps_current: number | null;
  xgboost_raw: number | null;
  xgboost_raw_prediction: number | null;
  dps_actual: number | null;
  component_scores: Record<string, number>;
}

async function main() {
  console.log('\n=== VPS Diagnostic Baseline — Pre-rebuild Snapshot ===\n');

  // Fetch clean rows
  const { data: rows, error } = await supabase
    .from('prediction_runs')
    .select('id, video_id, predicted_dps_7d, dps_v2_display_score, actual_follower_count, raw_result')
    .gt('actual_follower_count', 0)
    .not('dps_v2_display_score', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.error('No clean rows found!');
    process.exit(1);
  }

  console.log(`Found ${rows.length} clean labeled rows\n`);

  // Extract data from each row
  const baselineRows: BaselineRow[] = [];

  for (const row of rows) {
    const raw = row.raw_result as any;

    // Extract all component scores from paths[].results[]
    const componentScores: Record<string, number> = {};
    let xgboostPrediction: number | null = null;
    let xgboostRawPrediction: number | null = null;

    if (raw?.paths) {
      for (const p of raw.paths) {
        if (!p.results) continue;
        for (const r of p.results) {
          if (r.prediction != null && r.success) {
            componentScores[r.componentId] = r.prediction;
          }
          if (r.componentId === 'xgboost-virality-ml' && r.success) {
            xgboostPrediction = r.prediction ?? null;
            xgboostRawPrediction = r.features?.raw_prediction ?? null;
          }
        }
      }
    }

    baselineRows.push({
      id: row.id,
      video_id: row.video_id,
      vps_current: row.predicted_dps_7d,
      xgboost_raw: xgboostPrediction,
      xgboost_raw_prediction: xgboostRawPrediction,
      dps_actual: row.dps_v2_display_score,
      component_scores: componentScores,
    });
  }

  // ── Compute Spearman Rho ──────────────────────────────────────────────────

  // VPS vs DPS (only rows where both exist)
  const vpsDpsPairs = baselineRows.filter(r => r.vps_current != null && r.dps_actual != null);
  const vpsValues = vpsDpsPairs.map(r => r.vps_current!);
  const dpsValues = vpsDpsPairs.map(r => r.dps_actual!);
  const rhoVps = vpsDpsPairs.length >= 3 ? spearmanRho(vpsValues, dpsValues) : null;

  // XGBoost vs DPS (only rows where both exist)
  const xgbDpsPairs = baselineRows.filter(r => r.xgboost_raw != null && r.dps_actual != null);
  const xgbValues = xgbDpsPairs.map(r => r.xgboost_raw!);
  const xgbDpsValues = xgbDpsPairs.map(r => r.dps_actual!);
  const rhoXgb = xgbDpsPairs.length >= 3 ? spearmanRho(xgbValues, xgbDpsValues) : null;

  // ── Score Ranges ──────────────────────────────────────────────────────────

  function computeRange(values: number[]): { min: number; max: number; spread: number } | null {
    if (values.length === 0) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { min: +min.toFixed(1), max: +max.toFixed(1), spread: +(max - min).toFixed(1) };
  }

  const vpsRange = computeRange(baselineRows.filter(r => r.vps_current != null).map(r => r.vps_current!));
  const xgbRange = computeRange(baselineRows.filter(r => r.xgboost_raw != null).map(r => r.xgboost_raw!));
  const dpsRange = computeRange(baselineRows.filter(r => r.dps_actual != null).map(r => r.dps_actual!));

  // ── Console Table ─────────────────────────────────────────────────────────

  const pad = (s: string, n: number) => s.padStart(n);

  console.log(
    pad('Video ID', 10) + ' | ' +
    pad('VPS (cur)', 9) + ' | ' +
    pad('XGB Raw', 9) + ' | ' +
    pad('DPS Act', 9) + ' | ' +
    pad('VPS Gap', 9) + ' | ' +
    pad('XGB Gap', 9),
  );
  console.log('-'.repeat(67));

  for (const row of baselineRows) {
    const vid = row.video_id?.slice(0, 8) ?? '????????';
    const vps = row.vps_current != null ? row.vps_current.toFixed(1) : '   —';
    const xgb = row.xgboost_raw != null ? row.xgboost_raw.toFixed(1) : '   —';
    const dps = row.dps_actual != null ? row.dps_actual.toFixed(1) : '   —';
    const vpsGap = row.vps_current != null && row.dps_actual != null
      ? (row.vps_current - row.dps_actual).toFixed(1) : '   —';
    const xgbGap = row.xgboost_raw != null && row.dps_actual != null
      ? (row.xgboost_raw - row.dps_actual).toFixed(1) : '   —';

    console.log(
      pad(vid, 10) + ' | ' +
      pad(vps, 9) + ' | ' +
      pad(xgb, 9) + ' | ' +
      pad(dps, 9) + ' | ' +
      pad(vpsGap, 9) + ' | ' +
      pad(xgbGap, 9),
    );
  }

  console.log();
  console.log(`Spearman rho (current VPS vs DPS): ${rhoVps != null ? rhoVps.toFixed(4) : 'N/A'} (n=${vpsDpsPairs.length})`);
  console.log(`Spearman rho (XGBoost raw vs DPS): ${rhoXgb != null ? rhoXgb.toFixed(4) : 'N/A'} (n=${xgbDpsPairs.length})`);
  console.log();
  console.log(`VPS range:     ${vpsRange ? `${vpsRange.min} - ${vpsRange.max} (${vpsRange.spread} points)` : 'N/A'}`);
  console.log(`XGBoost range: ${xgbRange ? `${xgbRange.min} - ${xgbRange.max} (${xgbRange.spread} points)` : 'N/A'}`);
  console.log(`DPS range:     ${dpsRange ? `${dpsRange.min} - ${dpsRange.max} (${dpsRange.spread} points)` : 'N/A'}`);

  // ── Save JSON ─────────────────────────────────────────────────────────────

  const output = {
    snapshot_date: new Date().toISOString(),
    clean_rows: baselineRows.length,
    spearman_rho_current_vps: rhoVps != null ? +rhoVps.toFixed(6) : null,
    spearman_rho_xgboost_raw: rhoXgb != null ? +rhoXgb.toFixed(6) : null,
    vps_range: vpsRange,
    xgboost_range: xgbRange,
    dps_range: dpsRange,
    rows: baselineRows,
  };

  const outPath = path.resolve(__dirname, '..', 'data', 'vps-baseline-before.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to ${outPath}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * Autoresearch Sandbox Snapshot Export
 *
 * Exports labeled prediction_runs + run_component_results to a local JSON file
 * under autoresearch/data/. This is a one-time snapshot; no writes back to Supabase.
 *
 * By default, exports ONLY DPS v2-eligible rows (dps_formula_version LIKE '2%',
 * trust != 'untrusted', training_weight > 0). Legacy rows are excluded to prevent
 * downstream analysis from being poisoned by pre-v2 labels.
 *
 * Pass --include-legacy to export ALL labeled rows (for comparison/audit).
 *
 * Run:
 *   cd C:\Projects\CleanCopy
 *   npx tsx autoresearch/export-snapshot.ts                  # v2-only (default)
 *   npx tsx autoresearch/export-snapshot.ts --include-legacy # all labeled rows
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import {
  classifyLabelCategory,
  computeLabelBreakdown,
  type LabelCategory,
} from '../src/lib/training/training-eligibility';

// ── Load env ──────────────────────────────────────────────────────────────────
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ── CLI flags ──────────────────────────────────────────────────────────────────

const INCLUDE_LEGACY = process.argv.includes('--include-legacy');

// ── Types (inline to avoid import resolution issues at script level) ──────────

interface ExportedComponentResult {
  run_id: string;
  component_id: string;
  success: boolean;
  prediction: number | null;
  confidence: number | null;
  features: Record<string, any> | null;
}

interface DpsV2ExportFields {
  dps_formula_version: string | null;
  dps_label_trust: string | null;
  dps_training_weight: number | null;
  label_category: LabelCategory;
  actual_tier: string | null;
  // Six signal values
  actual_completion_rate: number | null;
  actual_share_rate: number | null;
  actual_save_rate: number | null;
  actual_velocity_score: number | null;
  actual_view_to_follower_ratio: number | null;
  actual_comment_rate: number | null;
  // Signal quality
  dps_signal_confidence: number | null;
  confidence_level: string | null;
  dps_signal_availability: Record<string, boolean> | null;
  dps_weight_redistribution: Record<string, number> | null;
  // Cohort context
  dps_cohort_sample_size: number | null;
  dps_threshold_version: string | null;
  dps_within_cohort_percentile: number | null;
  dps_population_percentile: number | null;
  // Decomposition (extracted from breakdown JSONB for stratification)
  composite_engagement: number | null;
  viral_score: number | null;
  time_adjusted_score: number | null;
  decay_factor: number | null;
  shrinkage_weight: number | null;
  effective_median: number | null;
  effective_spread: number | null;
  // Timing
  actual_hours_since_post: number | null;
  actual_posted_at: string | null;
  actual_collected_at: string | null;
  // Full breakdown
  dps_v2_breakdown: Record<string, any> | null;
}

interface ExportedRun {
  id: string;
  video_id: string;
  predicted_dps_7d: number;
  actual_dps: number;
  prediction_range_low: number | null;
  prediction_range_high: number | null;
  confidence: number;
  components_used: string[];
  labeling_mode: string | null;
  created_at: string;
  cohort_key: string | null;
  niche: string | null;
  account_size: string | null;
  adjustments_rawScore: number | null;
  adjustments_nicheFactor: number | null;
  adjustments_accountFactor: number | null;
  score_lane_vps: number | null;
  llm_spread: number | null;
  llm_influence_applied: boolean | null;
  transcription_source: string | null;
  transcription_skipped: boolean | null;
  components: ExportedComponentResult[];
  // DPS v2 breakdown fields
  dps_v2: DpsV2ExportFields;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const filterMode = INCLUDE_LEGACY ? 'ALL labeled (including legacy)' : 'v2-eligible only';
  console.log('═══════════════════════════════════════════════════');
  console.log('  Autoresearch Export — Labeled Prediction Runs');
  console.log(`  Filter: ${filterMode}`);
  console.log('═══════════════════════════════════════════════════\n');

  // Step 1: Fetch labeled prediction_runs
  const selectCols = `
      id, video_id, predicted_dps_7d, actual_dps,
      prediction_range_low, prediction_range_high, confidence,
      components_used, labeling_mode, created_at,
      cohort_key, raw_result,
      transcription_source, transcription_skipped,
      dps_formula_version, dps_label_trust, dps_training_weight,
      actual_tier,
      actual_completion_rate, actual_share_rate, actual_save_rate,
      actual_velocity_score, actual_view_to_follower_ratio, actual_comment_rate,
      dps_signal_confidence, dps_signal_availability, dps_weight_redistribution,
      dps_cohort_sample_size, dps_threshold_version,
      dps_within_cohort_percentile, dps_population_percentile,
      actual_hours_since_post, actual_posted_at, actual_collected_at,
      dps_v2_breakdown
    `;

  let query = supabase
    .from('prediction_runs')
    .select(selectCols)
    .not('actual_dps', 'is', null)
    .not('predicted_dps_7d', 'is', null)
    .order('created_at', { ascending: true });

  // Default: v2-eligible only. --include-legacy exports everything.
  if (!INCLUDE_LEGACY) {
    query = query
      .like('dps_formula_version', '2%')
      .neq('dps_label_trust', 'untrusted')
      .gt('dps_training_weight', 0);
  }

  console.log(`[1/3] Fetching prediction_runs (${filterMode})...`);
  const { data: runs, error: runsError } = await query;

  if (runsError) {
    console.error('Failed to fetch prediction_runs:', runsError.message);
    process.exit(1);
  }

  if (!runs || runs.length === 0) {
    console.error('No qualifying runs found. Nothing to export.');
    process.exit(1);
  }

  console.log(`  Found ${runs.length} runs.\n`);

  // Step 2: Fetch all run_component_results for these runs
  const runIds = runs.map((r: any) => r.id);
  console.log(`[2/3] Fetching run_component_results for ${runIds.length} runs...`);

  // Supabase .in() has a limit, so batch if needed
  const BATCH_SIZE = 100;
  const allComponents: any[] = [];

  for (let i = 0; i < runIds.length; i += BATCH_SIZE) {
    const batch = runIds.slice(i, i + BATCH_SIZE);
    const { data: compRows, error: compError } = await supabase
      .from('run_component_results')
      .select('run_id, component_id, success, prediction, confidence, features')
      .in('run_id', batch);

    if (compError) {
      console.error(`Failed to fetch component results (batch ${i}):`, compError.message);
      process.exit(1);
    }

    if (compRows) allComponents.push(...compRows);
  }

  console.log(`  Found ${allComponents.length} component result rows.\n`);

  // Step 3: Assemble exported runs
  console.log('[3/3] Assembling export...');

  // Index component results by run_id
  const compByRun = new Map<string, ExportedComponentResult[]>();
  for (const c of allComponents) {
    const list = compByRun.get(c.run_id) || [];
    list.push({
      run_id: c.run_id,
      component_id: c.component_id,
      success: c.success,
      prediction: c.prediction,
      confidence: c.confidence,
      features: c.features,
    });
    compByRun.set(c.run_id, list);
  }

  const exportedRuns: ExportedRun[] = [];
  let truncatedCount = 0;
  let missingComponentsCount = 0;

  for (const run of runs as any[]) {
    const rawResult = run.raw_result || {};
    const isTruncated = rawResult._truncated === true;
    if (isTruncated) truncatedCount++;

    // Parse niche from cohort_key (format: "niche:accountSize")
    let niche: string | null = null;
    let accountSize: string | null = null;
    if (run.cohort_key) {
      const parts = run.cohort_key.split(':');
      niche = parts[0] !== 'unknown' ? parts[0] : null;
      accountSize = parts[1] !== 'unknown' ? parts[1] : null;
    }

    // Fallback: try raw_result adjustments
    if (!niche && rawResult.adjustments?.nicheFactor) {
      // Can't recover niche name from factor alone, but log it
    }
    if (!accountSize && rawResult.adjustments?.accountSize) {
      accountSize = rawResult.adjustments.accountSize;
    }

    const components = compByRun.get(run.id) || [];
    if (components.length === 0) missingComponentsCount++;

    const v2Breakdown = run.dps_v2_breakdown || null;
    const dpsV2: DpsV2ExportFields = {
      dps_formula_version: run.dps_formula_version ?? null,
      dps_label_trust: run.dps_label_trust ?? null,
      dps_training_weight: run.dps_training_weight ?? null,
      label_category: classifyLabelCategory(run),
      actual_tier: run.actual_tier ?? null,
      actual_completion_rate: run.actual_completion_rate ?? null,
      actual_share_rate: run.actual_share_rate ?? null,
      actual_save_rate: run.actual_save_rate ?? null,
      actual_velocity_score: run.actual_velocity_score ?? null,
      actual_view_to_follower_ratio: run.actual_view_to_follower_ratio ?? null,
      actual_comment_rate: run.actual_comment_rate ?? null,
      dps_signal_confidence: run.dps_signal_confidence ?? null,
      confidence_level: v2Breakdown?.confidence?.level ?? null,
      dps_signal_availability: run.dps_signal_availability ?? null,
      dps_weight_redistribution: run.dps_weight_redistribution ?? null,
      dps_cohort_sample_size: run.dps_cohort_sample_size ?? null,
      dps_threshold_version: run.dps_threshold_version ?? null,
      dps_within_cohort_percentile: run.dps_within_cohort_percentile ?? null,
      dps_population_percentile: run.dps_population_percentile ?? null,
      // Decomposition from breakdown JSONB — enables stratification by score components
      composite_engagement: v2Breakdown?.composite_engagement ?? null,
      viral_score: v2Breakdown?.viral_score ?? null,
      time_adjusted_score: v2Breakdown?.time_adjusted_score ?? null,
      decay_factor: v2Breakdown?.decay_factor ?? null,
      shrinkage_weight: v2Breakdown?.shrinkage_weight ?? null,
      effective_median: v2Breakdown?.effective_median ?? null,
      effective_spread: v2Breakdown?.effective_spread ?? null,
      actual_hours_since_post: run.actual_hours_since_post ?? null,
      actual_posted_at: run.actual_posted_at ?? null,
      actual_collected_at: run.actual_collected_at ?? null,
      dps_v2_breakdown: v2Breakdown,
    };

    exportedRuns.push({
      id: run.id,
      video_id: run.video_id,
      predicted_dps_7d: run.predicted_dps_7d,
      actual_dps: run.actual_dps,
      prediction_range_low: run.prediction_range_low,
      prediction_range_high: run.prediction_range_high,
      confidence: run.confidence,
      components_used: run.components_used || [],
      labeling_mode: run.labeling_mode,
      created_at: run.created_at,
      cohort_key: run.cohort_key,
      niche,
      account_size: accountSize,
      adjustments_rawScore: rawResult.adjustments?.rawScore ?? null,
      adjustments_nicheFactor: rawResult.adjustments?.nicheFactor ?? null,
      adjustments_accountFactor: rawResult.adjustments?.accountFactor ?? null,
      score_lane_vps: rawResult.score_lane_vps ?? null,
      llm_spread: rawResult.llm_spread ?? null,
      llm_influence_applied: rawResult.llm_influence_applied ?? null,
      transcription_source: run.transcription_source,
      transcription_skipped: run.transcription_skipped,
      components,
      dps_v2: dpsV2,
    });
  }

  // Write snapshot
  const dateStr = new Date().toISOString().split('T')[0];
  const outDir = path.resolve(__dirname, 'data');
  const outPath = path.join(outDir, `snapshot-${dateStr}.json`);

  // Compute label category breakdown
  const labelBreakdown = computeLabelBreakdown(runs as any[]);

  const snapshot = {
    exported_at: new Date().toISOString(),
    filter: INCLUDE_LEGACY
      ? 'actual_dps IS NOT NULL AND predicted_dps_7d IS NOT NULL (all labels)'
      : 'v2-eligible: dps_formula_version LIKE 2%, trust != untrusted, weight > 0',
    v2_only: !INCLUDE_LEGACY,
    run_count: exportedRuns.length,
    label_breakdown: labelBreakdown,
    runs: exportedRuns,
  };

  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2), 'utf-8');

  // Print summary
  const niches = new Map<string, number>();
  for (const r of exportedRuns) {
    const n = r.niche || 'unknown';
    niches.set(n, (niches.get(n) || 0) + 1);
  }

  const avgComponents = exportedRuns.length > 0
    ? (exportedRuns.reduce((s, r) => s + r.components.length, 0) / exportedRuns.length).toFixed(1)
    : '0';

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  EXPORT COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Output:            ${outPath}`);
  console.log(`  Labeled runs:      ${exportedRuns.length}`);
  console.log(`  Component rows:    ${allComponents.length}`);
  console.log(`  Avg components/run: ${avgComponents}`);
  console.log(`  Truncated raw_result: ${truncatedCount} (component results still available)`);
  console.log(`  Runs missing components: ${missingComponentsCount}`);
  console.log(`\n  Niche distribution:`);
  for (const [niche, count] of [...niches.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${niche.padEnd(25)} ${count}`);
  }
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

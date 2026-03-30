#!/usr/bin/env npx tsx
/**
 * Backfill Training-Ready Status
 *
 * Finds prediction runs that are labeled (have actual_dps) but NOT training_ready,
 * diagnoses each one, and optionally marks the corresponding video for reprocessing.
 *
 * Run:
 *   npx tsx scripts/backfill-training-ready.ts --dry-run
 *   npx tsx scripts/backfill-training-ready.ts --niche side_hustles --dry-run
 *   npx tsx scripts/backfill-training-ready.ts --niche gaming --fix
 *
 * Flags:
 *   --dry-run   Print diagnosis only, do not modify any data (default)
 *   --fix       For fixable runs, attempt to mark videos for reprocessing
 *   --niche X   Filter to a specific niche (default: all niches)
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// ── Env ───────────────────────────────────────────────────────────────────────
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

// ── CLI ───────────────────────────────────────────────────────────────────────

function getCliArg(flag: string): string | undefined {
  const args = process.argv.slice(2);
  const eq = args.find(a => a.startsWith(`${flag}=`));
  if (eq) return eq.split('=')[1];
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

const DRY_RUN = !process.argv.includes('--fix');
const NICHE_FILTER = getCliArg('--niche') ?? null;

// ── Types ─────────────────────────────────────────────────────────────────────

interface EnrichedRun {
  id: string;
  video_id: string;
  status: string;
  niche: string;
  actual_dps: number | null;
  predicted_dps_7d: number | null;
  has_components: boolean;
  has_raw_result: boolean;
  component_rows_count: number;
  training_ready: boolean;
  created_at: string;
}

type IssueType =
  | 'not_completed'
  | 'missing_actual_dps'
  | 'missing_components'
  | 'missing_raw_result'
  | 'missing_components_and_raw_result';

interface Diagnosis {
  run: EnrichedRun;
  issues: IssueType[];
  plain: string; // human-readable diagnosis
  fixable: boolean;
}

// ── Diagnosis logic ───────────────────────────────────────────────────────────

function diagnoseRun(run: EnrichedRun): Diagnosis {
  const issues: IssueType[] = [];
  const parts: string[] = [];

  if (run.status !== 'completed') {
    issues.push('not_completed');
    parts.push(`status="${run.status}" (not completed)`);
  }

  if (run.actual_dps == null) {
    issues.push('missing_actual_dps');
    parts.push('no actual_dps label');
  }

  if (!run.has_components && !run.has_raw_result) {
    issues.push('missing_components_and_raw_result');
    parts.push('no component results AND no raw_result stored');
  } else {
    if (!run.has_components) {
      issues.push('missing_components');
      parts.push(`no component results (0 rows in run_component_results)`);
    }
    if (!run.has_raw_result) {
      issues.push('missing_raw_result');
      parts.push('raw_result is NULL');
    }
  }

  // A run is fixable if the only issue is missing data that a re-prediction would fill.
  // Runs with status='success' (old format) or missing components/raw_result are fixable
  // by triggering a new prediction for the same video.
  const fixable =
    issues.length > 0 &&
    !issues.includes('missing_actual_dps'); // can't fix labels automatically

  return {
    run,
    issues,
    plain: parts.length > 0 ? parts.join('; ') : 'unknown',
    fixable,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║       Backfill Training-Ready Diagnosis          ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  mode  : ${DRY_RUN ? 'DRY RUN (--dry-run)' : 'FIX MODE (--fix)'}`);
  console.log(`  niche : ${NICHE_FILTER ?? 'all'}\n`);

  // ── Step 1: Print the readiness dashboard ─────────────────────────────────

  const { data: summary, error: summErr } = await supabase
    .from('training_readiness_summary')
    .select('*');

  if (summErr) {
    console.error('Failed to fetch training_readiness_summary:', summErr.message);
    process.exit(1);
  }

  console.log('  ── Training Readiness Dashboard ──────────────────');
  console.log('  Niche             Total  Done  Labeled  Ready  Gap');
  console.log('  ─────────────────────────────────────────────────');
  for (const row of summary || []) {
    const gap = row.labeled_runs - row.training_ready_runs;
    console.log(
      `  ${(row.niche || '???').padEnd(18)} ${String(row.total_runs).padStart(5)}` +
      `  ${String(row.completed_runs).padStart(4)}` +
      `  ${String(row.labeled_runs).padStart(7)}` +
      `  ${String(row.training_ready_runs).padStart(5)}` +
      `  ${String(gap).padStart(4)}`,
    );
  }
  console.log();

  // ── Step 2: Find NOT training_ready runs ──────────────────────────────────

  let query = supabase
    .from('prediction_runs_enriched')
    .select('id, video_id, status, niche, actual_dps, predicted_dps_7d, has_components, has_raw_result, component_rows_count, training_ready, created_at')
    .eq('training_ready', false);

  if (NICHE_FILTER) {
    query = query.eq('niche', NICHE_FILTER);
  }

  const { data: runs, error: runErr } = await query.order('created_at', { ascending: false });
  if (runErr) {
    console.error('Failed to fetch enriched runs:', runErr.message);
    process.exit(1);
  }

  if (!runs || runs.length === 0) {
    console.log('  All runs are training_ready. Nothing to backfill.');
    return;
  }

  console.log(`  Found ${runs.length} non-training-ready runs.\n`);

  // ── Step 3: Diagnose each run ─────────────────────────────────────────────

  const diagnoses = runs.map(r => diagnoseRun(r as EnrichedRun));

  // Group by issue type
  const byIssue = new Map<IssueType, Diagnosis[]>();
  for (const d of diagnoses) {
    for (const issue of d.issues) {
      if (!byIssue.has(issue)) byIssue.set(issue, []);
      byIssue.get(issue)!.push(d);
    }
  }

  console.log('  ── Issue Summary ──────────────────────────────────');
  const issueLabels: Record<IssueType, string> = {
    not_completed: 'Not completed (wrong status)',
    missing_actual_dps: 'Missing actual_dps label',
    missing_components: 'Missing component results',
    missing_raw_result: 'Missing raw_result',
    missing_components_and_raw_result: 'Missing both components AND raw_result',
  };
  for (const [issue, label] of Object.entries(issueLabels)) {
    const count = byIssue.get(issue as IssueType)?.length ?? 0;
    if (count > 0) {
      console.log(`    ${label}: ${count} runs`);
    }
  }
  console.log();

  // ── Step 4: Print per-run diagnosis ───────────────────────────────────────

  console.log('  ── Per-Run Diagnosis ─────────────────────────────');
  for (const d of diagnoses.slice(0, 50)) { // cap output at 50
    const r = d.run;
    const fixTag = d.fixable ? ' [FIXABLE]' : '';
    console.log(
      `  ${r.id.slice(0, 8)}… [${r.niche}] status=${r.status}` +
      ` comps=${r.component_rows_count} raw=${r.has_raw_result ? 'YES' : 'NO'}` +
      ` actual_dps=${r.actual_dps ?? 'NULL'}${fixTag}`,
    );
    console.log(`    → ${d.plain}`);
  }
  if (diagnoses.length > 50) {
    console.log(`    ... and ${diagnoses.length - 50} more runs`);
  }
  console.log();

  // ── Step 5: Fix (if --fix mode) ───────────────────────────────────────────

  if (DRY_RUN) {
    const fixableCount = diagnoses.filter(d => d.fixable).length;
    console.log(`  ${fixableCount} runs are fixable. Run with --fix to mark their videos for reprocessing.`);
    console.log('  (DRY RUN — no changes made)\n');
    return;
  }

  // Fix strategy: mark the video in scraped_videos as needs_processing=true
  // so the next prediction cycle picks it up and creates a new (complete) run.
  const fixable = diagnoses.filter(d => d.fixable);
  if (fixable.length === 0) {
    console.log('  No fixable runs found.');
    return;
  }

  const videoIds = [...new Set(fixable.map(d => d.run.video_id))];
  console.log(`  Marking ${videoIds.length} videos for reprocessing in scraped_videos...\n`);

  let markedCount = 0;
  let notFoundCount = 0;

  for (const videoId of videoIds) {
    // Try scraped_videos first (most common path)
    const { data: sv } = await supabase
      .from('scraped_videos')
      .select('video_id')
      .eq('video_id', videoId)
      .limit(1);

    if (sv && sv.length > 0) {
      const { error: updateErr } = await supabase
        .from('scraped_videos')
        .update({ needs_processing: true })
        .eq('video_id', videoId);

      if (updateErr) {
        console.log(`    ✗ ${videoId}: ${updateErr.message}`);
      } else {
        markedCount++;
        console.log(`    ✓ ${videoId}: marked needs_processing=true`);
      }
    } else {
      notFoundCount++;
      console.log(`    ○ ${videoId}: not in scraped_videos (manual upload — skip)`);
    }
  }

  console.log(`\n  Marked: ${markedCount} | Not in scraped_videos: ${notFoundCount}`);
  console.log('  Next steps: run the prediction pipeline to process these videos.\n');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

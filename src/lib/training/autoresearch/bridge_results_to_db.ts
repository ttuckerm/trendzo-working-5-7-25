/**
 * Autoresearch bridge — orchestrates a single Python experiment end-to-end.
 *
 * Flow:
 *   1. Acquire sandbox lock in training_experiments (30-min scoped, same
 *      pattern as trainer-engine.ts).
 *   2. Spawn `autoresearch_run.py` with the CLI flags we received.
 *   3. Wait for the Python process to exit cleanly.
 *   4. Read results.json from the experiment's output directory.
 *   5. Update the lock row with the real metrics + release the lock.
 *
 * The lock is INSERT'd first so an orphaned Python crash still gets recorded
 * (result='error'), visible in the sandbox viewer. Successful runs flip the
 * row to 'improved' / 'no_change' / 'degraded' based on delta vs v15.
 *
 * Example:
 *   npx tsx src/lib/training/autoresearch/bridge_results_to_db.ts \
 *     --experiment-id auto-001 \
 *     --hypothesis "Dropping redundant music_is_original" \
 *     --drop-features music_is_original
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import * as path from 'path';

// ── Baseline we're comparing against
const V15_HOLDOUT_SPEARMAN = 0.6805;
const V15_CV_SPEARMAN = 0.6200;
const IMPROVEMENT_THRESHOLD = 0.005; // v15 trainer-program's global threshold

// ── CLI parsing (kept minimal — no yargs dependency) ────────────────────────

interface Cli {
  experimentId: string;
  hypothesis: string;
  dropFeatures: string;
  addFeatures: string;
  excludeRowsWhere: string;
  optunaTrials: string;
  maxDepthRange: string;
  learningRateRange: string;
  outputDir: string;
  trainingCsv?: string;
  holdoutCsv?: string;
  skipPython: boolean;
}

function parseArgs(): Cli {
  const args = process.argv.slice(2);
  const get = (flag: string, fallback = '') => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
  };
  const has = (flag: string) => args.includes(flag);

  const experimentId = get('--experiment-id');
  if (!experimentId) {
    console.error('Usage: bridge_results_to_db.ts --experiment-id <id> --hypothesis "..." [...]');
    process.exit(1);
  }
  return {
    experimentId,
    hypothesis: get('--hypothesis', ''),
    dropFeatures: get('--drop-features', ''),
    addFeatures: get('--add-features', ''),
    excludeRowsWhere: get('--exclude-rows-where', 'none'),
    optunaTrials: get('--optuna-trials', '100'),
    maxDepthRange: get('--max-depth-range', '3,10'),
    learningRateRange: get('--learning-rate-range', '0.01,0.3'),
    outputDir: get('--output-dir', `results-autoresearch/${experimentId}`),
    trainingCsv: get('--training-csv'),
    holdoutCsv: get('--holdout-csv'),
    skipPython: has('--skip-python'),
  };
}

// ── Supabase client ─────────────────────────────────────────────────────────

function dbClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Lock — mirrors trainer-engine.ts:acquireLock/releaseLock but with an
//          experiment-id pinned into the description so it is easy to find.
//          Scope is 'sandbox' so we don't block the feedback-based trainer.

async function acquireSandboxLock(
  db: SupabaseClient,
  experimentId: string,
  hypothesis: string,
): Promise<string> {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: running } = await db
    .from('training_experiments')
    .select('id, description, locked_at')
    .not('locked_at', 'is', null)
    .gte('locked_at', thirtyMinAgo)
    .eq('experiment_mode', 'sandbox')
    .limit(1);

  if (running && running.length > 0) {
    const r = running[0] as { id: string; description: string; locked_at: string };
    throw new Error(
      `sandbox lock already held by experiment ${r.id} (desc: ${r.description}, `
      + `locked_at: ${r.locked_at})`,
    );
  }

  const { data: lock, error } = await db
    .from('training_experiments')
    .insert({
      experiment_type: 'retrain',
      experiment_mode: 'sandbox',
      description: `[autoresearch] ${experimentId}: ${hypothesis || '(no hypothesis)'}`,
      training_data_rows: 0,
      result: 'error', // default until we finalize
      locked_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !lock) throw new Error(`Lock insert failed: ${error?.message || 'no row'}`);
  return lock.id as string;
}

async function finalizeRun(
  db: SupabaseClient,
  lockId: string,
  cli: Cli,
  results: AutoresearchResults,
): Promise<string> {
  const delta = results.holdout_spearman - V15_HOLDOUT_SPEARMAN;
  let resultTag: 'improved' | 'no_change' | 'degraded';
  if (delta > IMPROVEMENT_THRESHOLD) resultTag = 'improved';
  else if (delta < -IMPROVEMENT_THRESHOLD) resultTag = 'degraded';
  else resultTag = 'no_change';

  const modelArtifactPath = results.model_path || null;
  const description =
    `[autoresearch] ${cli.experimentId}: ${cli.hypothesis || results.hypothesis || ''}`
      .slice(0, 500);

  const { error } = await db
    .from('training_experiments')
    .update({
      description,
      features_used: results.features_used,
      hyperparams: results.optuna_best_params,
      training_data_rows: results.rows_used,
      validation_spearman: results.cv_spearman_mean,
      baseline_spearman: V15_HOLDOUT_SPEARMAN,
      delta,
      result: resultTag,
      model_artifact_path: modelArtifactPath,
      locked_at: null,
    })
    .eq('id', lockId);

  if (error) throw new Error(`Finalize update failed: ${error.message}`);
  return resultTag;
}

async function markLockFailed(
  db: SupabaseClient,
  lockId: string,
  errorMessage: string,
): Promise<void> {
  await db
    .from('training_experiments')
    .update({
      result: 'error',
      error_message: errorMessage.slice(0, 2000),
      locked_at: null,
    })
    .eq('id', lockId);
}

// ── Python runner ───────────────────────────────────────────────────────────

function runPython(cli: Cli): Promise<void> {
  const scriptPath = path.resolve(
    __dirname.replace(/\\/g, '/'),
    'autoresearch_run.py',
  );

  const args = [
    scriptPath,
    '--experiment-id', cli.experimentId,
    '--hypothesis', cli.hypothesis || `Autoresearch ${cli.experimentId}`,
    '--drop-features', cli.dropFeatures,
    '--add-features', cli.addFeatures,
    '--exclude-rows-where', cli.excludeRowsWhere,
    '--optuna-trials', cli.optunaTrials,
    '--max-depth-range', cli.maxDepthRange,
    '--learning-rate-range', cli.learningRateRange,
    '--output-dir', cli.outputDir,
  ];
  if (cli.trainingCsv) args.push('--training-csv', cli.trainingCsv);
  if (cli.holdoutCsv) args.push('--holdout-csv', cli.holdoutCsv);

  console.log(`[bridge] spawning: python ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    const proc = spawn('python', args, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    });
    proc.on('error', (err) => reject(new Error(`spawn failed: ${err.message}`)));
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`python exited ${code}`));
    });
  });
}

// ── Results shape ───────────────────────────────────────────────────────────

interface AutoresearchResults {
  experiment_id: string;
  hypothesis: string;
  parent_baseline: string;
  cv_spearman_mean: number;
  cv_spearman_std: number;
  holdout_spearman: number;
  holdout_mae: number;
  features_used: string[];
  features_dropped: string[];
  features_added: string[];
  rows_used: number;
  rows_excluded: number;
  optuna_best_params: Record<string, unknown>;
  top_10_features: Array<{ feature: string; gain: number }>;
  banned_columns_verified: boolean;
  training_csv: string;
  holdout_csv: string;
  model_path?: string;
  timestamp: string;
}

function readResults(outputDir: string): AutoresearchResults {
  const p = path.resolve(outputDir, 'results.json');
  if (!existsSync(p)) throw new Error(`results.json missing at ${p}`);
  const raw = JSON.parse(readFileSync(p, 'utf-8'));
  if (typeof raw.holdout_spearman !== 'number') {
    throw new Error('results.json has no holdout_spearman');
  }
  if (raw.banned_columns_verified !== true) {
    throw new Error(
      'results.json claims banned_columns_verified=false — refusing to land',
    );
  }
  return raw as AutoresearchResults;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const cli = parseArgs();
  const db = dbClient();

  console.log(`[bridge] experiment=${cli.experimentId}`);
  console.log(`[bridge] hypothesis=${cli.hypothesis}`);

  const lockId = await acquireSandboxLock(db, cli.experimentId, cli.hypothesis);
  console.log(`[bridge] acquired sandbox lock id=${lockId}`);

  try {
    if (!cli.skipPython) {
      await runPython(cli);
    } else {
      console.log('[bridge] --skip-python: assuming results.json already on disk');
    }
    const results = readResults(cli.outputDir);
    console.log(
      `[bridge] parsed results: cv=${results.cv_spearman_mean.toFixed(4)} `
      + `holdout=${results.holdout_spearman.toFixed(4)} mae=${results.holdout_mae.toFixed(2)} `
      + `features=${results.features_used.length} rows=${results.rows_used}`,
    );
    const tag = await finalizeRun(db, lockId, cli, results);
    console.log(`[bridge] row finalized as result='${tag}' (delta ${
      (results.holdout_spearman - V15_HOLDOUT_SPEARMAN).toFixed(4)
    } vs v15)`);
    console.log(`[bridge] training_experiments.id = ${lockId}`);
  } catch (err: any) {
    console.error(`[bridge] FAILED: ${err.message}`);
    await markLockFailed(db, lockId, err.message || String(err));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[bridge] FATAL (outside lock guard):', err);
  process.exit(1);
});

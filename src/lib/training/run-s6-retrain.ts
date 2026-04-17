/**
 * S6 Retrain orchestrator.
 *
 * Shells out to retrain_s6.py: trains 5 XGBoost variants with Optuna,
 * evaluates against the locked holdout, and persists per-variant rows
 * into `training_experiments` (all as model_version='v15', status='pending-approval').
 */

import { spawn, spawnSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const TRAINING_DIR = path.join(process.cwd(), 'src', 'lib', 'training');
const PY_SCRIPT = path.join(TRAINING_DIR, 'retrain_s6.py');
const DATA_DIR = path.join(TRAINING_DIR, 'data');
const RESULTS_DIR = path.join(TRAINING_DIR, 'results');
const PY_PKGS = ['xgboost', 'optuna', 'pandas', 'numpy', 'scipy', 'scikit-learn'];

export interface VariantResult {
  variant: string;
  cv_spearman: number;
  holdout_spearman: number;
  holdout_mae: number;
  feature_importance_top15: Array<{ feature: string; gain: number }>;
  best_params: Record<string, unknown>;
  training_rows: number;
  feature_count: number;
}

export interface RetrainResult {
  experimentName: string;
  modelVersion: 'v15';
  winner: string;
  variants: VariantResult[];
  decisions: string[];
  logTail: string;
}

function getServiceDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase service credentials not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

function resolvePython(): string {
  for (const candidate of ['python3', 'python']) {
    const probe = spawnSync(candidate, ['--version']);
    if (probe.status === 0) return candidate;
  }
  throw new Error('Python 3 not found on PATH. Install Python 3 and retry.');
}

function ensurePackages(py: string) {
  const check = spawnSync(py, ['-c', `import ${PY_PKGS.map((p) => (p === 'scikit-learn' ? 'sklearn' : p)).join(', ')}`]);
  if (check.status === 0) return;
  const install = spawnSync(
    py,
    ['-m', 'pip', 'install', ...PY_PKGS, '--break-system-packages'],
    { stdio: 'inherit' },
  );
  if (install.status !== 0) {
    throw new Error('Failed to install Python dependencies for S6 retrain');
  }
}

function runPython(py: string, onLog: (line: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(py, [PY_SCRIPT, '--data-dir', DATA_DIR, '--output-dir', RESULTS_DIR], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const handle = (buf: Buffer) => buf.toString().split(/\r?\n/).forEach((l) => l && onLog(l));
    proc.stdout.on('data', handle);
    proc.stderr.on('data', handle);
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`retrain_s6.py exited with code ${code}`));
    });
  });
}

export async function runS6Retrain(): Promise<RetrainResult> {
  const py = resolvePython();
  ensurePackages(py);
  await fs.mkdir(RESULTS_DIR, { recursive: true });

  const logBuf: string[] = [];
  await runPython(py, (line) => {
    logBuf.push(line);
    if (logBuf.length > 2000) logBuf.splice(0, logBuf.length - 2000);
  });

  const summaryRaw = await fs.readFile(path.join(RESULTS_DIR, 'results_summary.json'), 'utf8');
  const summary = JSON.parse(summaryRaw) as {
    model_version: 'v15';
    winner: string;
    variants: VariantResult[];
    decisions: string[];
  };

  const experimentName = `s6_retrain_${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const db = getServiceDb();
  const rows = summary.variants.map((v) => ({
    experiment_name: experimentName,
    model_version: summary.model_version,
    variant: v.variant,
    cv_spearman: v.cv_spearman,
    holdout_spearman: v.holdout_spearman,
    holdout_mae: v.holdout_mae,
    feature_importance_top15: v.feature_importance_top15,
    hyperparameters: v.best_params,
    training_rows: v.training_rows,
    feature_count: v.feature_count,
    status: 'pending-approval',
  }));

  const { error } = await db.from('s6_training_experiments').insert(rows);
  if (error) throw new Error(`Failed to persist s6_training_experiments: ${error.message}`);

  return {
    experimentName,
    modelVersion: summary.model_version,
    winner: summary.winner,
    variants: summary.variants,
    decisions: summary.decisions,
    logTail: logBuf.slice(-200).join('\n'),
  };
}

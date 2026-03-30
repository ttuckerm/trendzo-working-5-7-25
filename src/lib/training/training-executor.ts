/**
 * Phase 81: Training Pipeline v2 — Training Executor
 *
 * Orchestrates the training pipeline:
 *   1. Run contamination audit (Gate 2)
 *   2. Spawn Python training script
 *   3. Stream progress updates
 *   4. Write model_versions + model_performance_segments
 *
 * Feature flag: TRAINING_V2_ENABLED
 */

import { spawn } from 'child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { validateTrainingFeatures } from './contamination-validator';
import { TRAINING_V2_ENABLED } from './feature-availability-matrix';
import { emitEvent } from '@/lib/events/emit';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrainingExecutionResult {
  success: boolean;
  model_version_id?: string;
  audit_id?: string;
  metrics?: TrainingMetrics;
  error?: string;
  simulated: boolean;
}

export interface TrainingMetrics {
  SIMULATED_METRICS: boolean;
  accuracy: number;
  mae: number;
  rmse: number;
  calibration: number;
  train_samples: number;
  validation_samples: number;
  feature_importance: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );
}

async function updateJobProgress(jobId: string, progress: number, step?: string) {
  const supabase = getSupabase();
  const update: Record<string, unknown> = { progress };
  if (step) update.current_step = step;
  await supabase.from('training_jobs').update(update).eq('id', jobId);
}

// ---------------------------------------------------------------------------
// Main executor
// ---------------------------------------------------------------------------

/**
 * Execute a training job.
 *
 * @param jobId   UUID of the training_jobs row (already created with status='queued')
 * @param config  Hyperparameters etc.  (passed through to Python script in the future)
 */
export async function executeTrainingJob(
  jobId: string,
  config: Record<string, unknown> = {},
): Promise<TrainingExecutionResult> {
  const supabase = getSupabase();

  // ─── 0. Mark as running ─────────────────────────────────────────────
  await supabase
    .from('training_jobs')
    .update({ status: 'running', started_at: new Date().toISOString(), progress: 0 })
    .eq('id', jobId);

  // ─── 1. Contamination audit (Gate 2) ────────────────────────────────
  if (TRAINING_V2_ENABLED()) {
    const { data: rows, error: fetchErr } = await supabase
      .from('training_data')
      .select('features')
      .eq('included_in_training', true)
      .limit(5000);

    if (fetchErr) {
      await markFailed(jobId, `Audit fetch failed: ${fetchErr.message}`);
      return { success: false, error: fetchErr.message, simulated: true };
    }

    const featureRows = (rows || [])
      .map((r: any) => r.features)
      .filter((f: unknown): f is Record<string, unknown> => !!f && typeof f === 'object');

    const auditResult = validateTrainingFeatures(featureRows);

    // Write audit log
    const { data: audit, error: auditWriteErr } = await supabase
      .from('contamination_audit_log')
      .insert({
        job_id: jobId,
        features_checked: auditResult.features_checked,
        contaminated_features: auditResult.contaminated,
        passed: auditResult.passed,
        auditor: 'system',
        details: auditResult.details,
      })
      .select('id')
      .single();

    if (auditWriteErr) {
      console.error('[training-executor] Audit write failed:', auditWriteErr);
    }

    if (!auditResult.passed) {
      await markFailed(jobId, `Contamination audit FAILED: ${auditResult.summary}`);
      return {
        success: false,
        audit_id: audit?.id,
        error: auditResult.summary,
        simulated: true,
      };
    }

    // ─── 2. Spawn Python training stub ──────────────────────────────────
    const metrics = await runPythonTraining(jobId);

    if (!metrics) {
      await markFailed(jobId, 'Python training script returned no metrics');
      return { success: false, audit_id: audit?.id, error: 'No metrics', simulated: true };
    }

    // ─── 3. Create model version ────────────────────────────────────────
    const versionStr = `xgboost-v2.0.${Date.now() % 10000}`;

    const { data: model, error: modelErr } = await supabase
      .from('model_versions')
      .insert({
        version: versionStr,
        model_type: (config.modelType as string) || 'xgboost',
        status: 'testing',
        training_job_id: jobId,
        accuracy: metrics.accuracy,
        mae: metrics.mae,
        rmse: metrics.rmse,
        calibration: metrics.calibration,
        train_samples: metrics.train_samples,
        feature_importance: metrics.feature_importance,
        hyperparameters: config,
        contamination_audit_id: audit?.id || null,
      })
      .select('id')
      .single();

    if (modelErr) {
      console.error('[training-executor] Model version write failed:', modelErr);
    }

    // ─── 4. Mark completed ──────────────────────────────────────────────
    await supabase
      .from('training_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress: 100,
        results: {
          ...metrics,
          model_version_id: model?.id,
          audit_id: audit?.id,
        },
      })
      .eq('id', jobId);

    // Emit platform event (fire-and-forget)
    emitEvent({
      eventType: 'model.retrained',
      payload: {
        modelVersion: versionStr,
        spearmanCV: (metrics as any).spearman_cv ?? null,
        spearmanHoldout: (metrics as any).spearman_holdout ?? null,
        nSamples: metrics.train_samples,
        featuresCount: Object.keys(metrics.feature_importance || {}).length,
      },
      entityType: 'model_version',
      entityId: model?.id ?? undefined,
    }).catch(() => {});

    return {
      success: true,
      model_version_id: model?.id,
      audit_id: audit?.id,
      metrics,
      simulated: metrics.SIMULATED_METRICS === true,
    };
  }

  // ─── TRAINING_V2_ENABLED=false fallback (legacy behavior) ───────────
  // Keep the old simulated behavior but with fixed (not random) values.
  const fixedMetrics: TrainingMetrics = {
    SIMULATED_METRICS: true,
    accuracy: 0.72,
    mae: 8.5,
    rmse: 11.2,
    calibration: 0.96,
    train_samples: 0,
    validation_samples: 0,
    feature_importance: {},
  };

  await supabase
    .from('training_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress: 100,
      results: fixedMetrics,
    })
    .eq('id', jobId);

  return { success: true, metrics: fixedMetrics, simulated: true };
}

// ---------------------------------------------------------------------------
// Python subprocess
// ---------------------------------------------------------------------------

async function runPythonTraining(jobId: string): Promise<TrainingMetrics | null> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'train_model.py');

    const proc = spawn('python', [scriptPath, `--job-id=${jobId}`], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let lastJson: string | null = null;

    proc.stdout.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          lastJson = line;

          // Forward progress updates to DB
          if (parsed.progress !== undefined) {
            updateJobProgress(jobId, parsed.progress, parsed.step).catch(() => {});
          }
        } catch {
          // Non-JSON stdout line — ignore
        }
      }
    });

    proc.stderr.on('data', (data: Buffer) => {
      console.error('[train_model.py stderr]', data.toString());
    });

    proc.on('close', (code) => {
      if (code !== 0 || !lastJson) {
        console.error(`[training-executor] Python exited with code ${code}`);
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(lastJson) as TrainingMetrics);
      } catch {
        resolve(null);
      }
    });

    proc.on('error', (err) => {
      console.error('[training-executor] Spawn error:', err);
      resolve(null);
    });
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function markFailed(jobId: string, errorMessage: string) {
  const supabase = getSupabase();
  await supabase
    .from('training_jobs')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq('id', jobId);
}

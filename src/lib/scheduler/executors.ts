/**
 * Prompt 40 — Scheduled-action executors
 *
 * One function per action_type. The hourly processor picks up due
 * rows and dispatches them via `executeScheduledAction()`. Each
 * executor returns a JSON-serializable result that gets persisted
 * into scheduled_actions.output. Executors throw on failure — the
 * processor wraps the throw into error_message + status='failed'.
 *
 * Honest scope note:
 *   Several executors are intentionally light-weight — they log the
 *   event and write a diagnostic row but do NOT kick off the real
 *   heavy work (e.g. a real XGBoost retrain). Wiring the heavy work
 *   is per-subsystem and belongs in those subsystems' own prompts.
 *   This module proves the scheduling pattern end to end.
 *
 * Where a real follow-through exists and is safe, it's wired:
 *   - emergency_retrain → dispatches a coordinator batch_dps_regen
 *     task so at least SOME real DB-touching work happens.
 *   - memory_audit      → reads memory_extractions + returns a count
 *     report. Cheap read-only diagnostic.
 *   - niche_baseline_scan → records the request. The cultural scanner
 *     runs on its own cron so the "scan" happens via that pathway.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { startTask } from '@/lib/coordinator/dispatcher';
import type { CoordinatorTaskType } from '@/lib/coordinator/types';

export interface ExecutorContext {
  db: SupabaseClient;
  action: {
    id: string;
    action_type: string;
    trigger_condition: string;
    source_subsystem: string;
    params: Record<string, unknown> | null;
    scheduled_for: string;
  };
}

export type ExecutorResult = Record<string, unknown>;

export async function executeScheduledAction(
  ctx: ExecutorContext,
): Promise<ExecutorResult> {
  const { action } = ctx;
  switch (action.action_type) {
    case 'retrain':
    case 'retrain_expanded':
      return runRetrainStub(ctx);
    case 'emergency_retrain':
      return runEmergencyRetrain(ctx);
    case 'promotion_validation':
      return runPromotionValidation(ctx);
    case 'niche_scan':
    case 'niche_baseline_scan':
      return runNicheScanStub(ctx);
    case 'engagement_check':
      return runEngagementCheck(ctx);
    case 'churn_alert':
      return runChurnAlertStub(ctx);
    case 'memory_audit':
      return runMemoryAudit(ctx);
    case 'feature_experiment':
      return runFeatureExperimentStub(ctx);
    default:
      throw new Error(`Unknown action_type: ${action.action_type}`);
  }
}

// ── Individual executors ────────────────────────────────────────────────

async function runRetrainStub(ctx: ExecutorContext): Promise<ExecutorResult> {
  // Stub: does not actually retrain. Real retrain is heavy and
  // belongs in the trainer engine's own triggered pathway. Here we
  // just record the fact that we would have.
  return {
    skeleton: true,
    note: 'retrain stub — real retrain is not wired in Prompt 40. Implement in the trainer engine cron.',
    would_have_used_params: ctx.action.params || null,
  };
}

async function runEmergencyRetrain(ctx: ExecutorContext): Promise<ExecutorResult> {
  // Real wiring: dispatches a coordinator batch_dps_regen task as a
  // proxy for "touch the prediction_runs rows." This is not a real
  // retrain — it's just the closest safe real work we can trigger
  // without breaking anything. The trigger_condition in the action
  // row tells the Chairman what actually prompted this.
  const { taskId } = await startTask({
    taskType: 'batch_dps_regen' as CoordinatorTaskType,
    params: { max_batches: 1, reason: 'emergency_retrain', source_action: ctx.action.id },
    createdBy: 'scheduled_action:emergency_retrain',
    db: ctx.db,
  });
  return {
    dispatched_coordinator_task_id: taskId,
    note: 'emergency_retrain dispatched a batch_dps_regen coordinator task as a real-work proxy. Real XGBoost retrain wiring is a separate prompt.',
  };
}

async function runPromotionValidation(ctx: ExecutorContext): Promise<ExecutorResult> {
  // Read-only diagnostic: report how many model_variants are currently
  // pending activation and what their spearman scores look like.
  // This is what a human "post-promotion check" would want to see.
  const { data: variants, error } = await ctx.db
    .from('model_variants')
    .select('id, model_version, spearman_score, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) throw new Error(`model_variants read failed: ${error.message}`);

  return {
    variants_checked: variants?.length ?? 0,
    active_count: (variants || []).filter((v: any) => v.is_active).length,
    pending_count: (variants || []).filter((v: any) => !v.is_active).length,
    recent_variants: variants || [],
    note: 'promotion_validation is a read-only snapshot. Flag for Chairman review if delta < threshold.',
  };
}

async function runNicheScanStub(ctx: ExecutorContext): Promise<ExecutorResult> {
  // Stub: records the request. The real cultural scanner runs on
  // its own cron (supabase/functions/cultural-scanner). Wiring this
  // executor to directly invoke it would require HTTP round-tripping
  // and is out of scope. We record the intent and let the scanner's
  // own cron pick up the next natural run.
  const niche = ctx.action.params?.niche as string | undefined;
  return {
    skeleton: true,
    requested_niche: niche || null,
    note: 'niche scan will be picked up by the cultural scanner cron. No direct dispatch from this executor.',
  };
}

async function runEngagementCheck(ctx: ExecutorContext): Promise<ExecutorResult> {
  // Cheap diagnostic read: count recent prediction_runs.
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { count, error } = await ctx.db
    .from('prediction_runs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since);
  if (error) throw new Error(`prediction_runs count failed: ${error.message}`);
  return {
    window_days: 7,
    completed_predictions_in_window: count ?? 0,
  };
}

async function runChurnAlertStub(_ctx: ExecutorContext): Promise<ExecutorResult> {
  return {
    skeleton: true,
    note: 'churn_alert stub — churn signal wiring is a separate prompt.',
  };
}

async function runMemoryAudit(ctx: ExecutorContext): Promise<ExecutorResult> {
  // Read-only diagnostic: count hot-tier rows and recent contradictions.
  const [{ count: hotCount, error: hotErr }, { data: recentCons, error: consErr }] =
    await Promise.all([
      ctx.db
        .from('memory_extractions')
        .select('id', { count: 'exact', head: true })
        .eq('tier', 'hot'),
      ctx.db
        .from('memory_consolidation_log')
        .select('agency_id, run_date, contradictions_resolved, emergency_drops')
        .order('run_date', { ascending: false })
        .limit(5),
    ]);
  if (hotErr) throw new Error(`memory_extractions count failed: ${hotErr.message}`);
  if (consErr) throw new Error(`memory_consolidation_log read failed: ${consErr.message}`);
  const totalContradictions = (recentCons || []).reduce(
    (sum: number, r: any) => sum + (r.contradictions_resolved ?? 0),
    0,
  );
  return {
    hot_tier_rows: hotCount ?? 0,
    recent_consolidations_checked: recentCons?.length ?? 0,
    contradictions_in_recent_window: totalContradictions,
    recent: recentCons || [],
  };
}

async function runFeatureExperimentStub(ctx: ExecutorContext): Promise<ExecutorResult> {
  return {
    skeleton: true,
    note: 'feature_experiment stub — hand off to the trainer engine experiment runner.',
    would_have_used_params: ctx.action.params || null,
  };
}

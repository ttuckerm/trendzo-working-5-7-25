/**
 * Prompt 40 — Self-Scheduler helper
 *
 * Atlas subsystems call `scheduleActionSafe()` at decision points
 * to schedule follow-up actions without the caller needing to
 * handle errors. The helper:
 *
 *   1. Opens its own Supabase client (so callers don't need to pass one).
 *   2. Writes one row to scheduled_actions.
 *   3. Swallows every error and logs a console warning — a failed
 *      schedule must NEVER break the host subsystem.
 *
 * This is the safest possible wiring pattern: a hook added to
 * trainer-engine.ts, platform-monitor.ts, etc. is a one-line
 * `void scheduleActionSafe({...})` that can never throw.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type ScheduledActionType =
  | 'retrain'
  | 'retrain_expanded'
  | 'emergency_retrain'
  | 'promotion_validation'
  | 'niche_scan'
  | 'niche_baseline_scan'
  | 'engagement_check'
  | 'churn_alert'
  | 'memory_audit'
  | 'feature_experiment'
  | 'feature_discovery_review'
  | 'cross_niche_review';

export type SourceSubsystem =
  | 'trainer'
  | 'proactive'
  | 'cultural'
  | 'memory'
  | 'chairman'
  | 'test';

export interface ScheduleActionInput {
  actionType: ScheduledActionType;
  triggerCondition: string;
  scheduledFor: Date | string;
  sourceSubsystem: SourceSubsystem;
  params?: Record<string, unknown>;
  createdBySystem?: boolean;
  /** Caller-supplied client (optional — helper will open one if absent). */
  db?: SupabaseClient;
}

export interface ScheduleActionResult {
  ok: boolean;
  id?: string;
  error?: string;
}

function getServiceDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...(init || {}), cache: 'no-store' }),
    },
  });
}

/**
 * The safe version. Swallows all errors. Use this from subsystem hooks.
 */
export async function scheduleActionSafe(
  input: ScheduleActionInput,
): Promise<ScheduleActionResult> {
  try {
    return await scheduleAction(input);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[scheduler] scheduleActionSafe failed (${input.actionType}):`, msg);
    return { ok: false, error: msg };
  }
}

/**
 * The strict version. Throws on validation / DB errors. Use this
 * from tests and Chairman-triggered flows where you want the error
 * surfaced to the user.
 */
export async function scheduleAction(
  input: ScheduleActionInput,
): Promise<ScheduleActionResult> {
  const db = input.db || getServiceDb();
  if (!db) throw new Error('Database not configured');

  const scheduledForIso =
    typeof input.scheduledFor === 'string'
      ? input.scheduledFor
      : input.scheduledFor.toISOString();

  const { data, error } = await db
    .from('scheduled_actions')
    .insert({
      action_type: input.actionType,
      trigger_condition: input.triggerCondition,
      scheduled_for: scheduledForIso,
      source_subsystem: input.sourceSubsystem,
      params: input.params || {},
      created_by_system: input.createdBySystem !== false,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`scheduled_actions insert failed: ${error?.message}`);
  }

  return { ok: true, id: data.id };
}

/**
 * Convenience: build a Date N hours in the future from now.
 * Used by hook callers so they don't need to repeat the arithmetic.
 */
export function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 3600_000);
}

/**
 * Convenience: build a Date for "tonight" — 03:00 UTC the next time
 * it's in the future. Used for emergency overnight retraining.
 */
export function tonightAt3AmUtc(): Date {
  const now = new Date();
  const target = new Date(now);
  target.setUTCHours(3, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  return target;
}

/**
 * Prompt 40 — Scheduled action processor
 *
 * Picks up rows from scheduled_actions where status='pending' and
 * scheduled_for <= now(), runs their executor via executors.ts,
 * and marks each row executed/failed.
 *
 * Run hourly via the cron registered in src/lib/cron/scheduler.ts
 * and on-demand via POST /api/cron/process-scheduled-actions.
 *
 * Safety invariants:
 *   - Each action is run in isolation — one throwing executor does
 *     not abort the batch.
 *   - We NEVER re-run an action that's already in a terminal status
 *     (the pending-status filter in the picker query enforces this).
 *   - Executors that take a while are fine — there's no batch-level
 *     timeout. The hourly cadence means worst-case an action waits
 *     one hour past its scheduled_for.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { executeScheduledAction } from './executors';

export interface ProcessResult {
  picked_up: number;
  executed: number;
  failed: number;
  results: Array<{
    id: string;
    action_type: string;
    outcome: 'executed' | 'failed';
    error?: string;
  }>;
}

export async function processPendingActions(
  db: SupabaseClient,
  options: { limit?: number } = {},
): Promise<ProcessResult> {
  const limit = options.limit ?? 50;
  const nowIso = new Date().toISOString();

  const { data: due, error } = await db
    .from('scheduled_actions')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', nowIso)
    .order('scheduled_for', { ascending: true })
    .limit(limit);

  if (error) throw new Error(`picker query failed: ${error.message}`);

  const actions = due || [];
  const result: ProcessResult = {
    picked_up: actions.length,
    executed: 0,
    failed: 0,
    results: [],
  };

  for (const action of actions) {
    try {
      const output = await executeScheduledAction({
        db,
        action: {
          id: action.id,
          action_type: action.action_type,
          trigger_condition: action.trigger_condition,
          source_subsystem: action.source_subsystem,
          params: action.params,
          scheduled_for: action.scheduled_for,
        },
      });

      const { error: updErr } = await db
        .from('scheduled_actions')
        .update({
          status: 'executed',
          output,
          executed_at: new Date().toISOString(),
        })
        .eq('id', action.id)
        .eq('status', 'pending'); // defensive: don't clobber a Chairman cancel that raced us

      if (updErr) {
        result.failed++;
        result.results.push({
          id: action.id,
          action_type: action.action_type,
          outcome: 'failed',
          error: `update to executed failed: ${updErr.message}`,
        });
      } else {
        result.executed++;
        result.results.push({
          id: action.id,
          action_type: action.action_type,
          outcome: 'executed',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.failed++;
      await db
        .from('scheduled_actions')
        .update({
          status: 'failed',
          error_message: message,
          executed_at: new Date().toISOString(),
        })
        .eq('id', action.id)
        .eq('status', 'pending');
      result.results.push({
        id: action.id,
        action_type: action.action_type,
        outcome: 'failed',
        error: message,
      });
    }
  }

  return result;
}

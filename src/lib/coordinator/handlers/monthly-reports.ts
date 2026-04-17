/**
 * Prompt 36 — monthly_reports handler
 *
 * Breakdown: one subtask per agency. If params.agency_ids is provided,
 * use that list; otherwise report on all active agencies.
 *
 * Per-subtask work: aggregate agency-scoped stats for the last 30 days.
 * We can cleanly scope creators to an agency (creators.agency_id), but
 * prediction_runs does NOT have agency_id (see platform-signals.ts
 * comment — deferred). So the "videos predicted" count is done via
 * creators.user_id → prediction_runs.user_id where that link exists,
 * and we note any gap honestly in the result instead of faking numbers.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CoordinatorHandler, Subtask } from '../types';

const WINDOW_DAYS = 30;

export const monthlyReportsHandler: CoordinatorHandler = {
  async breakdown(params, db) {
    const explicit = Array.isArray(params.agency_ids)
      ? (params.agency_ids as unknown[]).filter((v): v is string => typeof v === 'string')
      : null;

    let agencyIds: string[];
    if (explicit && explicit.length > 0) {
      agencyIds = explicit;
    } else {
      // agencies.status enum; treat anything non-suspended as reportable.
      const { data, error } = await db
        .from('agencies')
        .select('id, status');
      if (error) throw new Error(`Failed to list agencies: ${error.message}`);
      agencyIds = (data || [])
        .filter((r: { status: string | null }) => r.status !== 'suspended')
        .map((r: { id: string }) => r.id);
    }

    const subtasks: Subtask[] = agencyIds.map((id) => ({
      label: `agency:${id}`,
      params: { agency_id: id },
    }));

    return {
      subtasks,
      meta: {
        window_days: WINDOW_DAYS,
        source: explicit ? 'explicit_agency_ids' : 'all_active_agencies',
        total_agencies: subtasks.length,
      },
    };
  },

  async runSubtask(subtaskParams, db) {
    const agencyId = subtaskParams.agency_id as string;
    if (!agencyId || typeof agencyId !== 'string') {
      throw new Error('agency_id is required');
    }

    const since = new Date(Date.now() - WINDOW_DAYS * 86400_000).toISOString();

    // Fetch agency row. A bogus id becomes a subtask-level failure here —
    // exactly what Promise.allSettled in the dispatcher is designed for.
    const { data: agency, error: aErr } = await db
      .from('agencies')
      .select('id, name, tier, status, created_at')
      .eq('id', agencyId)
      .maybeSingle();
    if (aErr) throw new Error(`agencies lookup failed: ${aErr.message}`);
    if (!agency) throw new Error(`agency not found: ${agencyId}`);

    // Creator count for this agency
    const { count: totalCreators, error: cErr } = await db
      .from('creators')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId);
    if (cErr) throw new Error(`creators count failed: ${cErr.message}`);

    // New creators in the window
    const { count: newCreators, error: ncErr } = await db
      .from('creators')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .gte('created_at', since);
    if (ncErr) throw new Error(`new creators count failed: ${ncErr.message}`);

    // Prediction-run stats via creators.user_id → prediction_runs.user_id.
    // This is best-effort: if either column is missing or empty we report
    // zeros with a _note rather than failing the whole report.
    let videosPredicted: number | null = null;
    let avgPredictedDps: number | null = null;
    let predictionNote: string | null = null;

    const { data: creatorUsers, error: cuErr } = await db
      .from('creators')
      .select('user_id')
      .eq('agency_id', agencyId)
      .not('user_id', 'is', null);

    if (cuErr) {
      predictionNote = `creator user_id lookup failed: ${cuErr.message}`;
    } else {
      const userIds = (creatorUsers || [])
        .map((r: { user_id: string | null }) => r.user_id)
        .filter((v): v is string => !!v);

      if (userIds.length === 0) {
        videosPredicted = 0;
        avgPredictedDps = null;
        predictionNote = 'no creators with linked user_id';
      } else {
        const { data: runs, error: rErr } = await db
          .from('prediction_runs')
          .select('predicted_dps_7d')
          .in('user_id', userIds)
          .gte('created_at', since)
          .eq('status', 'completed');

        if (rErr) {
          // prediction_runs.user_id may not exist — degrade gracefully.
          videosPredicted = 0;
          predictionNote = `prediction_runs query unavailable: ${rErr.message}`;
        } else {
          videosPredicted = runs?.length ?? 0;
          const vals = (runs || [])
            .map((r: { predicted_dps_7d: number | null }) => r.predicted_dps_7d)
            .filter((v): v is number => typeof v === 'number');
          avgPredictedDps = vals.length > 0
            ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100
            : null;
        }
      }
    }

    return {
      agency_id: agency.id,
      agency_name: agency.name,
      tier: agency.tier,
      status: agency.status,
      window_days: WINDOW_DAYS,
      total_creators: totalCreators ?? 0,
      new_creators_in_window: newCreators ?? 0,
      videos_predicted: videosPredicted,
      avg_predicted_dps: avgPredictedDps,
      ...(predictionNote ? { _note: predictionNote } : {}),
    };
  },
};

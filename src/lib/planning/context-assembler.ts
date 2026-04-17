/**
 * Prompt 38 — Context assembler for planning sessions
 *
 * Gathers a compact snapshot of "what the requester can see" so we
 * can hand it to Opus alongside the free-text prompt. Two scopes:
 *
 *   platform (Chairman):
 *     Total counts + recent alerts + recent coordinator runs. Keep
 *     this tight — Opus will read the full history from its own
 *     tools if we build that later. For v1 the snapshot is counts
 *     only, so input tokens stay predictable.
 *
 *   agency (agency operator):
 *     Per-agency counts + recent alerts scoped to that agency.
 *
 * This deliberately does NOT pull every row of every table — that
 * would blow up input tokens and cost. If an Opus session needs to
 * dig deeper, it should be via tool use (separate prompt, not 38).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContextSnapshot } from './types';

export async function assemblePlatformContext(
  db: SupabaseClient,
): Promise<ContextSnapshot> {
  const [agencies, creators, predictions, alertsCount, recentAlerts, recentTasks] =
    await Promise.all([
      db.from('agencies').select('id', { count: 'exact', head: true }),
      db.from('creators').select('id', { count: 'exact', head: true }),
      db
        .from('prediction_runs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),
      db
        .from('chairman_alerts')
        .select('id', { count: 'exact', head: true })
        .in('status', ['open', 'acknowledged']),
      db
        .from('chairman_alerts')
        .select('alert_type, severity, title, created_at')
        .in('status', ['open', 'acknowledged'])
        .order('created_at', { ascending: false })
        .limit(10),
      db
        .from('coordinator_tasks')
        .select('task_type, status, completed_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

  return {
    scope: 'platform',
    collected_at: new Date().toISOString(),
    agency_id: null,
    agency_name: null,
    platform: {
      agencies_total: agencies.count ?? 0,
      creators_total: creators.count ?? 0,
      completed_predictions_total: predictions.count ?? 0,
      live_chairman_alerts: alertsCount.count ?? 0,
    },
    agency_stats: null,
    recent_alerts: (recentAlerts.data || []) as ContextSnapshot['recent_alerts'],
    recent_coordinator_tasks: (recentTasks.data || []) as ContextSnapshot['recent_coordinator_tasks'],
  };
}

export async function assembleAgencyContext(
  db: SupabaseClient,
  agencyId: string,
): Promise<ContextSnapshot> {
  const [agency, creators, recentAlerts] = await Promise.all([
    db
      .from('agencies')
      .select('id, name, tier, total_creators, total_videos, avg_dps')
      .eq('id', agencyId)
      .maybeSingle(),
    db
      .from('creators')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId),
    db
      .from('chairman_alerts')
      .select('alert_type, severity, title, created_at')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (!agency.data) {
    throw new Error(`agency not found: ${agencyId}`);
  }

  return {
    scope: 'agency',
    collected_at: new Date().toISOString(),
    agency_id: agency.data.id,
    agency_name: agency.data.name,
    platform: {
      agencies_total: 0,
      creators_total: 0,
      completed_predictions_total: 0,
      live_chairman_alerts: 0,
    },
    agency_stats: {
      tier: agency.data.tier,
      total_creators: creators.count ?? agency.data.total_creators ?? 0,
      total_videos: agency.data.total_videos ?? 0,
      avg_dps: agency.data.avg_dps,
    },
    recent_alerts: (recentAlerts.data || []) as ContextSnapshot['recent_alerts'],
    recent_coordinator_tasks: [],
  };
}

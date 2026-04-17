/**
 * Prompt 36 — platform_audit handler
 *
 * Single-subtask task: a platform-wide snapshot of counts.
 * The "parallel" fan-out is degenerate here (one subtask) but going
 * through the same dispatcher keeps it visible alongside the other
 * coordinator tasks in the dashboard and uses the same result shape.
 */

import type { CoordinatorHandler, Subtask } from '../types';

export const platformAuditHandler: CoordinatorHandler = {
  async breakdown() {
    const subtasks: Subtask[] = [{ label: 'platform:global', params: {} }];
    return { subtasks };
  },

  async runSubtask(_subtaskParams, db) {
    const [agencies, creators, predictions, alerts] = await Promise.all([
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
    ]);

    const problems: string[] = [];
    if (agencies.error) problems.push(`agencies: ${agencies.error.message}`);
    if (creators.error) problems.push(`creators: ${creators.error.message}`);
    if (predictions.error) problems.push(`prediction_runs: ${predictions.error.message}`);
    if (alerts.error) problems.push(`chairman_alerts: ${alerts.error.message}`);

    return {
      snapshot_at: new Date().toISOString(),
      agencies_total: agencies.count ?? null,
      creators_total: creators.count ?? null,
      completed_predictions_total: predictions.count ?? null,
      live_chairman_alerts: alerts.count ?? null,
      ...(problems.length > 0 ? { _problems: problems } : {}),
    };
  },
};

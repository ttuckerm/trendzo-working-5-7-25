/**
 * Chairman Alerts Summary Metrics (Prompt 35)
 *
 * GET /api/admin/chairman-alerts/summary
 *
 * Returns the 3 summary cards shown at the top of the Platform Health panel:
 *   - active_agencies: COUNT(*) FROM agencies WHERE is_active = true
 *   - platform_spearman: latest row from vps_evaluation
 *   - alerts_this_week: open/acknowledged alerts created in last 7d,
 *                       plus breakdown by severity
 *
 * All three queries are parallelized. Target latency: <500ms.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(_request: NextRequest) {
  const db = getServiceDb()
  if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const startTime = Date.now()
  const weekAgoIso = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()

  const [
    activeAgenciesRes,
    latestEvalRes,
    alertsThisWeekRes,
  ] = await Promise.all([
    db
      .from('agencies')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    db
      .from('vps_evaluation')
      .select('computed_at, spearman_rho, n, mae, within_range_pct')
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from('chairman_alerts')
      .select('severity, status, created_at')
      .gte('created_at', weekAgoIso),
  ])

  const activeAgenciesCount = activeAgenciesRes.count ?? 0

  const latestEval = latestEvalRes.data || null

  const weekAlerts = (alertsThisWeekRes.data || []) as Array<{
    severity: string
    status: string
  }>
  const byStatus: Record<string, number> = {}
  const bySeverity: Record<string, number> = {}
  for (const a of weekAlerts) {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1
    bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1
  }

  return NextResponse.json({
    computed_at: new Date().toISOString(),
    elapsed_ms: Date.now() - startTime,
    active_agencies: activeAgenciesCount,
    platform_spearman: latestEval
      ? {
          rho: latestEval.spearman_rho,
          n: latestEval.n,
          mae: latestEval.mae,
          within_range_pct: latestEval.within_range_pct,
          computed_at: latestEval.computed_at,
        }
      : null,
    alerts_this_week: {
      total: weekAlerts.length,
      by_severity: {
        critical: bySeverity.critical || 0,
        warning: bySeverity.warning || 0,
        info: bySeverity.info || 0,
      },
      by_status: {
        open: byStatus.open || 0,
        acknowledged: byStatus.acknowledged || 0,
        snoozed: byStatus.snoozed || 0,
        resolved: byStatus.resolved || 0,
        dismissed: byStatus.dismissed || 0,
      },
    },
  })
}

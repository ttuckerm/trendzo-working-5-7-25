/**
 * Phase 83: Metric Collection v1 — POST /api/admin/metric-collector/run
 *
 * Chairman-gated endpoint to trigger metric collection for due schedules.
 * Fetches actual TikTok metrics via Apify and stores them in
 * metric_check_schedule.actual_metrics (NEVER in feature columns).
 *
 * Body (all optional):
 *   { run_id?: uuid, limit?: number, dry_run?: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { METRIC_COLLECTOR_ENABLED } from '@/lib/training/feature-availability-matrix';
import { runMetricCollector } from '@/lib/training/metric-collector';
import type { MetricCollectorRequest } from '@/lib/training/training-ingest-types';

export async function POST(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a4f9accb-2f2f-4c36-b371-f1fb1eca536b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1c9eeb'},body:JSON.stringify({sessionId:'1c9eeb',location:'metric-collector/run/route.ts:POST-entry',message:'metric-collector/run POST called',data:{METRIC_COLLECTOR_ENABLED_raw:process.env.METRIC_COLLECTOR_ENABLED,METRIC_COLLECTOR_ENABLED_result:METRIC_COLLECTOR_ENABLED()},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  // 1. Admin auth gate
  const auth = await verifyAdminAuth(request);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // 2. Feature flag gate
  if (!METRIC_COLLECTOR_ENABLED()) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a4f9accb-2f2f-4c36-b371-f1fb1eca536b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1c9eeb'},body:JSON.stringify({sessionId:'1c9eeb',location:'metric-collector/run/route.ts:flag-blocked',message:'METRIC_COLLECTOR_ENABLED is false - returning 403',data:{envVal:process.env.METRIC_COLLECTOR_ENABLED},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return NextResponse.json(
      { error: 'Metric collector is not enabled (METRIC_COLLECTOR_ENABLED=false)' },
      { status: 403 }
    );
  }

  try {
    // 3. Parse optional body
    let body: MetricCollectorRequest = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine — all fields are optional
    }

    // 4. Run collector
    const result = await runMetricCollector({
      runId: body.run_id,
      limit: body.limit,
      dryRun: body.dry_run,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    const msg = error.message || String(error) || 'Unknown error';
    console.error('[MetricCollectorAPI] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

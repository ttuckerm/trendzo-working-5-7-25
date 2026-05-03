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

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // 1. Admin auth gate
  const auth = await verifyAdminAuth(request);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // 2. Feature flag gate
  if (!METRIC_COLLECTOR_ENABLED()) {
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

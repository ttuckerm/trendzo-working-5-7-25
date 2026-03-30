/**
 * Feature #3: Metric Attach API — POST /api/admin/metric-attach
 *
 * Attaches collected metrics from metric_check_schedule to prediction_runs.actual_* fields.
 * Enforces contamination lock, deterministic checkpoint selection, and cohort freeze.
 *
 * Body: { run_id?: string, batch?: boolean, force?: boolean }
 * Returns: MetricAttachResult
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { METRIC_COLLECTOR_ENABLED } from '@/lib/training/feature-availability-matrix';
import { attachMetricsForRun, attachMetricsBatch } from '@/lib/training/metric-attacher';
import type { MetricAttachResult } from '@/lib/training/training-ingest-types';

export const dynamic = 'force-dynamic';

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
      { status: 403 },
    );
  }

  try {
    let body: { run_id?: string; batch?: boolean; force?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }

    const opts = { force: body.force };

    let result: MetricAttachResult;

    if (body.run_id) {
      // Single run attach
      const itemResult = await attachMetricsForRun(body.run_id, opts);
      result = {
        processed: 1,
        attached: itemResult.status === 'attached' ? 1 : 0,
        skipped: itemResult.status === 'skipped' ? 1 : 0,
        failed: itemResult.status === 'failed' ? 1 : 0,
        details: [itemResult],
      };
    } else if (body.batch) {
      // Batch attach
      result = await attachMetricsBatch(opts);
    } else {
      return NextResponse.json(
        { error: 'Either run_id or batch=true is required' },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[MetricAttachAPI] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

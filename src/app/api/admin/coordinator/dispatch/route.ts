/**
 * Prompt 37 — Coordinator dispatch API (v2, fire-and-forget)
 *
 * POST /api/admin/coordinator/dispatch
 *   Body: { task_type, params?, created_by? }
 *   Returns: { success: true, task_id } — the task starts running
 *     in the background. The UI polls /api/admin/coordinator/tasks
 *     to see progress.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { startTask } from '@/lib/coordinator/dispatcher';
import type { CoordinatorTaskType } from '@/lib/coordinator/types';

export const dynamic = 'force-dynamic';

const VALID_TASK_TYPES: CoordinatorTaskType[] = [
  'batch_dps_regen',
  'platform_audit',
  'monthly_reports',
  'niche_analysis',
  'feature_experiment',
  'feature_discovery',
  'cross_niche_transfer',
];

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  // no-store: see tasks/route.ts comment.
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...(init || {}), cache: 'no-store' }),
    },
  });
}

export async function POST(request: NextRequest) {
  const db = getServiceDb();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON' }, { status: 400 });
  }

  const taskType = body?.task_type as CoordinatorTaskType | undefined;
  if (!taskType || !VALID_TASK_TYPES.includes(taskType)) {
    return NextResponse.json(
      { error: `task_type must be one of: ${VALID_TASK_TYPES.join(', ')}` },
      { status: 400 },
    );
  }

  const params =
    body?.params && typeof body.params === 'object' && !Array.isArray(body.params)
      ? body.params
      : {};
  const createdBy = typeof body?.created_by === 'string' ? body.created_by : 'chairman';

  try {
    const { taskId } = await startTask({
      taskType,
      params,
      createdBy,
      db,
    });
    return NextResponse.json({ success: true, task_id: taskId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

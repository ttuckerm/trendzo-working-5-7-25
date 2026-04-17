/**
 * Prompt 37 — Re-run a single failed subtask.
 *
 * POST /api/admin/coordinator/rerun-subtask
 *   Body: { task_id: string, subtask_label: string }
 *
 * Looks up the original task, finds the failed subtask by label,
 * pulls the subtask_params we persisted at run time, and dispatches
 * a fresh coordinator_tasks row with the `_rerun_subtask` marker so
 * the dispatcher skips breakdown() and runs only that one subtask.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { startTask } from '@/lib/coordinator/dispatcher';
import type { CoordinatorTaskType } from '@/lib/coordinator/types';

export const dynamic = 'force-dynamic';

function getServiceDb() {
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

export async function POST(request: NextRequest) {
  const db = getServiceDb();
  if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON' }, { status: 400 });
  }

  const taskId = body?.task_id as string | undefined;
  const subtaskLabel = body?.subtask_label as string | undefined;
  if (!taskId || !subtaskLabel) {
    return NextResponse.json(
      { error: 'task_id and subtask_label are required' },
      { status: 400 },
    );
  }

  const { data: original, error: loadErr } = await db
    .from('coordinator_tasks')
    .select('id, task_type, output_result')
    .eq('id', taskId)
    .maybeSingle();

  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!original) return NextResponse.json({ error: 'task not found' }, { status: 404 });

  const errors = (original.output_result as any)?.errors as
    | Array<{ label: string; subtask_params: Record<string, unknown> }>
    | undefined;
  const match = errors?.find((e) => e.label === subtaskLabel);

  if (!match) {
    return NextResponse.json(
      { error: `no failed subtask with label "${subtaskLabel}" in task ${taskId}` },
      { status: 404 },
    );
  }

  if (!match.subtask_params || typeof match.subtask_params !== 'object') {
    return NextResponse.json(
      { error: 'failed subtask has no stored subtask_params (task run before Prompt 37)' },
      { status: 409 },
    );
  }

  try {
    const { taskId: newId } = await startTask({
      taskType: original.task_type as CoordinatorTaskType,
      params: {
        _rerun_subtask: true,
        _rerun_of: taskId,
        _rerun_label: subtaskLabel,
        _subtask_params: match.subtask_params,
      },
      createdBy: 'chairman:rerun-subtask',
      db,
    });
    return NextResponse.json({ success: true, task_id: newId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

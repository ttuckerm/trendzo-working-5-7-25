/**
 * Prompt 37 — Re-run an entire task.
 *
 * POST /api/admin/coordinator/rerun-task
 *   Body: { task_id: string }
 *
 * Loads the original task, strips any rerun markers from its
 * input_params, and starts a fresh task of the same type with the
 * same user-supplied params. This gives you a completely clean run
 * (new breakdown, new subtasks) — not a resumption.
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
  if (!taskId) {
    return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
  }

  const { data: original, error: loadErr } = await db
    .from('coordinator_tasks')
    .select('id, task_type, input_params')
    .eq('id', taskId)
    .maybeSingle();

  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!original) return NextResponse.json({ error: 'task not found' }, { status: 404 });

  // Strip rerun markers so we don't accidentally re-run a single
  // subtask when the user wanted a full re-run.
  const cleanParams = { ...(original.input_params as Record<string, unknown>) };
  delete cleanParams._rerun_subtask;
  delete cleanParams._rerun_of;
  delete cleanParams._rerun_label;
  delete cleanParams._subtask_params;

  try {
    const { taskId: newId } = await startTask({
      taskType: original.task_type as CoordinatorTaskType,
      params: cleanParams,
      createdBy: 'chairman:rerun-task',
      db,
    });
    return NextResponse.json({ success: true, task_id: newId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

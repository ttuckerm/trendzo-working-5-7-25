/**
 * Prompt 37 — Coordinator tasks list API (v2, searchable)
 *
 * GET /api/admin/coordinator/tasks
 *   Query params (all optional):
 *     status      — queued | running | completed | failed (comma list allowed)
 *     task_type   — one of the five types (comma list allowed)
 *     since       — ISO date; created_at >= since
 *     until       — ISO date; created_at <= until
 *     q           — text search in error_message (ILIKE)
 *     limit       — default 20, max 200
 *
 * Always returns most-recent-first. No pagination beyond `limit`;
 * the Operations panel shows a rolling window, not a full browse.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  // Override Supabase's internal fetch to disable Next.js Data Cache —
  // otherwise GET reads during polling return stale rows (see
  // MEMORY.md: "Next.js Data Cache caches Supabase fetch()").
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...(init || {}), cache: 'no-store' }),
    },
  });
}

export async function GET(request: NextRequest) {
  const db = getServiceDb();
  if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 200);

  let query = db
    .from('coordinator_tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  const status = searchParams.get('status');
  if (status) {
    const list = status.split(',').map((s) => s.trim()).filter(Boolean);
    query = list.length === 1 ? query.eq('status', list[0]) : query.in('status', list);
  }

  const taskType = searchParams.get('task_type');
  if (taskType) {
    const list = taskType.split(',').map((s) => s.trim()).filter(Boolean);
    query = list.length === 1 ? query.eq('task_type', list[0]) : query.in('task_type', list);
  }

  const since = searchParams.get('since');
  if (since) query = query.gte('created_at', since);

  const until = searchParams.get('until');
  if (until) query = query.lte('created_at', until);

  const q = searchParams.get('q');
  if (q) {
    const pattern = `%${q.replace(/[%_]/g, '\\$&')}%`;
    query = query.ilike('error_message', pattern);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tasks: data || [] });
}

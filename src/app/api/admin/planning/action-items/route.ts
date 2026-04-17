/**
 * Prompt 39 — Planning action items API
 *
 * GET /api/admin/planning/action-items
 *   ?status=open         — filter by status (comma list allowed)
 *   ?session_id=<uuid>   — only items from this session
 *   ?agency_id=<uuid>    — only items scoped to this agency
 *                          (pass "null" to fetch platform-scoped items)
 *   ?limit=20
 *
 * PATCH /api/admin/planning/action-items
 *   Body: { id: string, status: 'open'|'in_progress'|'done'|'cancelled' }
 *   Sets completed_at when transitioning to done/cancelled.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['open', 'in_progress', 'done', 'cancelled'] as const;
type ActionItemStatus = (typeof VALID_STATUSES)[number];

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

export async function GET(request: NextRequest) {
  const db = getServiceDb();
  if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 200);

  let query = db
    .from('planning_action_items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  const status = searchParams.get('status');
  if (status) {
    const list = status.split(',').map((s) => s.trim()).filter(Boolean);
    query = list.length === 1 ? query.eq('status', list[0]) : query.in('status', list);
  }

  const sessionId = searchParams.get('session_id');
  if (sessionId) query = query.eq('session_id', sessionId);

  const agencyId = searchParams.get('agency_id');
  if (agencyId === 'null') {
    query = query.is('agency_id', null);
  } else if (agencyId) {
    query = query.eq('agency_id', agencyId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ action_items: data || [] });
}

export async function PATCH(request: NextRequest) {
  const db = getServiceDb();
  if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  let body: { id?: string; status?: ActionItemStatus };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON' }, { status: 400 });
  }

  if (!body.id || !body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `id and status (one of ${VALID_STATUSES.join(', ')}) are required` },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = {
    status: body.status,
    updated_at: new Date().toISOString(),
  };
  if (body.status === 'done' || body.status === 'cancelled') {
    update.completed_at = new Date().toISOString();
  } else {
    update.completed_at = null;
  }

  const { data, error } = await db
    .from('planning_action_items')
    .update(update)
    .eq('id', body.id)
    .select('*')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'action item not found' }, { status: 404 });

  return NextResponse.json({ success: true, action_item: data });
}

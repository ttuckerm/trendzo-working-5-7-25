/**
 * Prompt 38 — List / get planning sessions.
 *
 * GET /api/admin/planning/sessions
 *   ?limit=10 &status=... &id=<uuid> &agency_id=<uuid>
 *
 * When ?id is given, returns a single session by id (for polling a
 * specific run). Otherwise returns a recent list.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function GET(request: NextRequest) {
  const db = getServiceDb();
  if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    const { data, error } = await db
      .from('planning_sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ session: data });
  }

  const limit = Math.min(Number(searchParams.get('limit')) || 10, 50);

  let query = db
    .from('planning_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  const status = searchParams.get('status');
  if (status) {
    const list = status.split(',').map((s) => s.trim()).filter(Boolean);
    query = list.length === 1 ? query.eq('status', list[0]) : query.in('status', list);
  }

  const agencyId = searchParams.get('agency_id');
  if (agencyId) query = query.eq('agency_id', agencyId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sessions: data || [] });
}

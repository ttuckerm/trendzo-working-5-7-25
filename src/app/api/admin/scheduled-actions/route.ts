/**
 * Prompt 40 — Chairman-facing scheduled-actions API.
 *
 * GET /api/admin/scheduled-actions
 *   ?status=pending,executed   — filter (comma list allowed)
 *   ?source_subsystem=trainer  — filter
 *   ?action_type=retrain       — filter
 *   ?limit=50
 *
 * POST /api/admin/scheduled-actions
 *   Body: { action_type, trigger_condition, scheduled_for, params?, source_subsystem? }
 *   Manual Chairman-created action. created_by_system=false.
 *
 * PATCH /api/admin/scheduled-actions
 *   Body: { id, op: 'cancel' | 'reschedule', scheduled_for?, cancelled_by? }
 *   Terminal-state rows (executed/cancelled/failed) return 409.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scheduleAction } from '@/lib/scheduler/schedule-action';

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
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);

  let query = db
    .from('scheduled_actions')
    .select('*')
    .order('scheduled_for', { ascending: true })
    .limit(limit);

  const status = searchParams.get('status');
  if (status) {
    const list = status.split(',').map((s) => s.trim()).filter(Boolean);
    query = list.length === 1 ? query.eq('status', list[0]) : query.in('status', list);
  }

  const source = searchParams.get('source_subsystem');
  if (source) query = query.eq('source_subsystem', source);

  const actionType = searchParams.get('action_type');
  if (actionType) query = query.eq('action_type', actionType);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ actions: data || [] });
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

  if (!body?.action_type || !body?.trigger_condition || !body?.scheduled_for) {
    return NextResponse.json(
      { error: 'action_type, trigger_condition, and scheduled_for are required' },
      { status: 400 },
    );
  }

  try {
    const result = await scheduleAction({
      actionType: body.action_type,
      triggerCondition: body.trigger_condition,
      scheduledFor: body.scheduled_for,
      sourceSubsystem: body.source_subsystem || 'chairman',
      params: body.params,
      createdBySystem: false, // manual Chairman action
      db,
    });
    return NextResponse.json({ success: true, id: result.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const db = getServiceDb();
  if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON' }, { status: 400 });
  }

  const id = body?.id as string | undefined;
  const op = body?.op as 'cancel' | 'reschedule' | undefined;
  if (!id || (op !== 'cancel' && op !== 'reschedule')) {
    return NextResponse.json(
      { error: 'id and op (cancel|reschedule) are required' },
      { status: 400 },
    );
  }

  const { data: existing, error: loadErr } = await db
    .from('scheduled_actions')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();
  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (existing.status !== 'pending') {
    return NextResponse.json(
      { error: `cannot ${op} an action in status "${existing.status}"` },
      { status: 409 },
    );
  }

  let update: Record<string, unknown>;
  if (op === 'cancel') {
    update = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: body.cancelled_by || 'chairman',
    };
  } else {
    if (!body.scheduled_for) {
      return NextResponse.json(
        { error: 'scheduled_for is required when op=reschedule' },
        { status: 400 },
      );
    }
    update = { scheduled_for: body.scheduled_for };
  }

  const { data, error } = await db
    .from('scheduled_actions')
    .update(update)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json({ success: true, action: data });
}

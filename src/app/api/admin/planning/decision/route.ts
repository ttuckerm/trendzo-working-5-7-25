/**
 * Prompt 38 + 39 — Chairman approve/reject decision on a session.
 *
 * POST /api/admin/planning/decision
 *   Body: {
 *     session_id: string,
 *     decision: 'approve' | 'reject',
 *     edited_text?: string,           // Prompt 39: optional edit-then-approve
 *     edited_action_items?: Array<{ title, description? }>, // Prompt 39: user-curated items
 *     reject_reason?: string,         // Prompt 39: optional note on reject
 *   }
 *
 * On approve (Prompt 39):
 *   1. If edited_text is provided, overwrite plan_output.text with it.
 *   2. Extract recommendations (or use edited_action_items if given).
 *   3. Insert one planning_action_items row per recommendation.
 *   4. For agency-scoped sessions only, also write each recommendation
 *      as a hot-tier row in memory_extractions with source='planning_session'.
 *      Chairman platform sessions skip memory because memory_extractions
 *      requires a non-null agency_id.
 *
 * On reject: just flip the status and persist the reason in error_message
 * (reusing the column so we don't need a schema change).
 *
 * Only sessions in status='reviewing' can be decided. Already-approved
 * or already-rejected sessions return 409.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractRecommendations } from '@/lib/planning/extract-recommendations';

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

interface DecisionBody {
  session_id?: string;
  decision?: 'approve' | 'reject';
  edited_text?: string;
  edited_action_items?: Array<{ title: string; description?: string | null }>;
  reject_reason?: string;
}

export async function POST(request: NextRequest) {
  const db = getServiceDb();
  if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  let body: DecisionBody;
  try {
    body = (await request.json()) as DecisionBody;
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON' }, { status: 400 });
  }

  const sessionId = body.session_id;
  const decision = body.decision;
  if (!sessionId || (decision !== 'approve' && decision !== 'reject')) {
    return NextResponse.json(
      { error: 'session_id and decision (approve|reject) are required' },
      { status: 400 },
    );
  }

  const { data: existing, error: loadErr } = await db
    .from('planning_sessions')
    .select('id, status, agency_id, requester_role, plan_output')
    .eq('id', sessionId)
    .maybeSingle();
  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'session not found' }, { status: 404 });

  if (existing.status !== 'reviewing') {
    return NextResponse.json(
      { error: `cannot decide a session in status "${existing.status}"` },
      { status: 409 },
    );
  }

  // ── Reject path ──
  if (decision === 'reject') {
    const { data: updated, error: updErr } = await db
      .from('planning_sessions')
      .update({
        status: 'rejected',
        error_message: body.reject_reason || null,
      })
      .eq('id', sessionId)
      .select('*')
      .single();
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    return NextResponse.json({ success: true, session: updated });
  }

  // ── Approve path ──
  // 1. Optionally overwrite the plan text with Chairman edits.
  let finalPlanOutput: any = existing.plan_output;
  if (typeof body.edited_text === 'string' && body.edited_text.length > 0) {
    finalPlanOutput = {
      ...(finalPlanOutput || {}),
      text: body.edited_text,
      edited_at: new Date().toISOString(),
    };
  }

  // 2. Resolve the action-item list.
  let actionItems: Array<{ title: string; description: string | null }> = [];
  if (Array.isArray(body.edited_action_items) && body.edited_action_items.length > 0) {
    actionItems = body.edited_action_items
      .filter((x): x is { title: string; description?: string | null } => !!x && typeof x.title === 'string')
      .map((x) => ({ title: x.title.trim(), description: x.description?.toString() ?? null }))
      .filter((x) => x.title.length > 0);
  } else {
    const text = (finalPlanOutput?.text as string) || '';
    actionItems = extractRecommendations(text).map((r) => ({
      title: r.title,
      description: r.description,
    }));
  }

  // 3. Flip session to approved and persist the (possibly edited) plan.
  const { data: approved, error: apprErr } = await db
    .from('planning_sessions')
    .update({
      status: 'approved',
      plan_output: finalPlanOutput,
    })
    .eq('id', sessionId)
    .select('*')
    .single();
  if (apprErr) return NextResponse.json({ error: apprErr.message }, { status: 500 });

  // 4. Insert action items (best-effort — an insert failure here should
  //    not roll back the approve; the user can always edit items later).
  let itemsInserted = 0;
  if (actionItems.length > 0) {
    const rows = actionItems.map((item, i) => ({
      session_id: sessionId,
      agency_id: existing.agency_id,
      title: item.title,
      description: item.description,
      order_index: i,
    }));
    const { error: insErr, count } = await db
      .from('planning_action_items')
      .insert(rows, { count: 'exact' });
    if (insErr) {
      console.warn('[planning/decision] action item insert failed:', insErr.message);
    } else {
      itemsInserted = count ?? rows.length;
    }
  }

  // 5. For agency sessions, mirror the recommendations into hot memory.
  //    Chairman platform sessions have agency_id=NULL and memory_extractions
  //    requires a non-null agency_id — skip them honestly rather than
  //    synthesize a placeholder.
  let memoryWritten = 0;
  let memoryNote: string | null = null;
  if (existing.agency_id && actionItems.length > 0) {
    const memRows = actionItems.map((item) => ({
      agency_id: existing.agency_id,
      fact: item.description ? `${item.title} — ${item.description}` : item.title,
      source: 'planning_session',
      tier: 'hot' as const,
      confidence: 0.9,
    }));
    const { error: memErr, count } = await db
      .from('memory_extractions')
      .insert(memRows, { count: 'exact' });
    if (memErr) {
      memoryNote = `memory insert failed: ${memErr.message}`;
    } else {
      memoryWritten = count ?? memRows.length;
    }
  } else if (!existing.agency_id) {
    memoryNote = 'chairman platform session — no agency_id, memory skipped';
  }

  return NextResponse.json({
    success: true,
    session: approved,
    action_items_inserted: itemsInserted,
    memory_rows_written: memoryWritten,
    ...(memoryNote ? { memory_note: memoryNote } : {}),
  });
}

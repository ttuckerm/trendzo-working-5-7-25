/**
 * Prompt 38 — Start a planning session.
 *
 * POST /api/admin/planning/start
 *   Body: {
 *     requester_role: 'chairman' | 'agency',
 *     agency_id?: string,           // required when requester_role=agency
 *     input_prompt: string,
 *     test_mode?: boolean,          // default true (safe)
 *     caps?: { maxSeconds?, maxOutputTokens?, maxCostUsd? }
 *   }
 *   Returns: { success: true, session_id }
 *
 * Chairman requests are never gated. Agency requests go through the
 * tier-gating helper, which consumes one credit on success.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { startSession } from '@/lib/planning/worker';
import { checkAndConsumeAgencyCredit } from '@/lib/planning/tier-gating';
import type { RequesterRole } from '@/lib/planning/types';

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

  const requesterRole = body?.requester_role as RequesterRole | undefined;
  if (requesterRole !== 'chairman' && requesterRole !== 'agency') {
    return NextResponse.json(
      { error: 'requester_role must be "chairman" or "agency"' },
      { status: 400 },
    );
  }

  const inputPrompt = typeof body?.input_prompt === 'string' ? body.input_prompt : '';
  if (!inputPrompt.trim()) {
    return NextResponse.json({ error: 'input_prompt is required' }, { status: 400 });
  }

  const agencyId = typeof body?.agency_id === 'string' ? body.agency_id : null;
  const testMode = body?.test_mode !== false; // default true

  // Tier gate for agency sessions. Chairman is unlimited.
  if (requesterRole === 'agency') {
    if (!agencyId) {
      return NextResponse.json(
        { error: 'agency_id is required when requester_role=agency' },
        { status: 400 },
      );
    }
    const gate = await checkAndConsumeAgencyCredit(db, agencyId);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.reason, tier: gate.tier },
        { status: 402 }, // 402 Payment Required — semantically accurate
      );
    }
  }

  try {
    const { sessionId } = await startSession({
      requesterRole,
      agencyId,
      inputPrompt,
      testMode,
      caps: body?.caps,
      db,
    });
    return NextResponse.json({ success: true, session_id: sessionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

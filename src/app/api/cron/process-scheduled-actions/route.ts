/**
 * Prompt 40 — Hourly cron: process scheduled actions.
 *
 * GET /api/cron/process-scheduled-actions
 *   Returns: ProcessResult { picked_up, executed, failed, results[] }
 *
 * GET is accepted so the Chairman can trigger a run by pasting the
 * URL into the browser address bar (same pattern as other cron routes
 * in this codebase — see /api/admin/platform-monitor).
 *
 * Also registered as an in-process cron in src/lib/cron/scheduler.ts
 * at the top of every hour.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processPendingActions } from '@/lib/scheduler/processor';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

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

async function handle(_request: NextRequest) {
  const db = getServiceDb();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }
  const startedAt = Date.now();
  try {
    const result = await processPendingActions(db);
    return NextResponse.json({
      ok: true,
      elapsed_ms: Date.now() - startedAt,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

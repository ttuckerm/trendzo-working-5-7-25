import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { commonRateLimiters } from '@/lib/security/rate-limiter'

async function ensureTables(db: any) {
  try { await (db as any).rpc?.('exec_sql', { query: `
    create table if not exists process_events (
      id bigserial primary key,
      user_id text,
      session_id text,
      ts timestamptz not null default now(),
      step text not null,
      meta jsonb
    );
    create index if not exists idx_process_events_ts on process_events(ts);
    create index if not exists idx_process_events_session on process_events(session_id);
  ` }) } catch {}
}

export async function POST(req: NextRequest) {
  const limited = await commonRateLimiters.strict(req)
  if (limited) return limited
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureTables(db)
  let body: any = {}
  try { body = await req.json() } catch {}
  const step = String(body?.step||'')
  const allowed = ['ingest_started','template_picked','script_generated','edit_made','score_checked','publish_ready']
  if (!allowed.includes(step)) {
    return NextResponse.json({ ok: false, error: 'invalid_step' }, { status: 400 })
  }
  const row = {
    user_id: body?.user_id ? String(body.user_id) : null,
    session_id: body?.session_id ? String(body.session_id) : null,
    step,
    ts: body?.ts_iso ? new Date(body.ts_iso).toISOString() : new Date().toISOString(),
    meta: typeof body?.meta === 'object' ? body.meta : null
  }
  const { error } = await db.from('process_events').insert(row as any)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}



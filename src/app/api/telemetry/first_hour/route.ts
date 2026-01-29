import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { validateTelemetryKeyFromRequest } from '@/lib/security/telemetry-keys'

type Body = {
  video_id: string
  ts_iso: string
  views: number
  unique_viewers: number
  avg_watch_pct: number
  completion_rate: number
  rewatches: number
  shares: number
  saves: number
  comments: number
  source?: string
}

async function ensureFirstHourTelemetryTable(db: any) {
  const sql = `
  create table if not exists first_hour_telemetry (
    video_id text not null,
    ts timestamptz not null,
    views int,
    unique_viewers int,
    avg_watch_pct numeric,
    completion_rate numeric,
    rewatches int,
    shares int,
    saves int,
    comments int,
    source text,
    created_at timestamptz default now(),
    primary key(video_id, ts)
  );
  create index if not exists idx_first_hour_telemetry_video_ts on first_hour_telemetry (video_id, ts);
  `
  try { await (db as any).rpc('exec_sql', { query: sql }) } catch {}
}

export async function POST(req: NextRequest) {
  // Flipboard guard: live vs mock gate
  if (process.env.TELEMETRY_GATE !== 'live') {
    return new NextResponse(null, { status: 202 })
  }
  const ok = await validateTelemetryKeyFromRequest(req)
  if (!ok) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureFirstHourTelemetryTable(db)
  const body = await req.json().catch(()=>({})) as Body
  if (!body?.video_id || !body?.ts_iso) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 })
  }
  const row: any = {
    video_id: String(body.video_id),
    ts: new Date(body.ts_iso).toISOString(),
    views: Number(body.views ?? 0),
    unique_viewers: Number(body.unique_viewers ?? 0),
    avg_watch_pct: Number(body.avg_watch_pct ?? 0),
    completion_rate: Number(body.completion_rate ?? 0),
    rewatches: Number(body.rewatches ?? 0),
    shares: Number(body.shares ?? 0),
    saves: Number(body.saves ?? 0),
    comments: Number(body.comments ?? 0),
    source: body.source ? String(body.source) : null
  }
  const ins = await db.from('first_hour_telemetry').upsert(row, { onConflict: 'video_id,ts' }).select('*').limit(1)
  if (ins.error) {
    return NextResponse.json({ ok: false, error: ins.error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, row: ins.data?.[0] || null })
}



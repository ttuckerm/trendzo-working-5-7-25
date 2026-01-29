import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { validateTelemetryKeyFromRequest, enforceTelemetryQuota } from '@/lib/security/telemetry-keys'
import { requireFeature } from '@/lib/flags/requireFeature'

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
    id uuid default gen_random_uuid(),
    video_id text not null,
    ts timestamptz not null,
    ts_iso timestamptz,
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
  alter table first_hour_telemetry add column if not exists id uuid default gen_random_uuid();
  alter table first_hour_telemetry add column if not exists ts_iso timestamptz;
  `
  try { await (db as any).rpc('exec_sql', { query: sql }) } catch {}
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key'
    }
  })
}

// No GET handler for this route; POST only

export async function POST(req: NextRequest) {
  const guard = await (requireFeature('live_telemetry_plugin'))(req)
  if (guard) return guard

  const ok = await validateTelemetryKeyFromRequest(req)
  if (!ok) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const quota = await enforceTelemetryQuota(req, '/api/telemetry/first_hour_plugin', 'telemetry:plugin')
  if (!quota.allowed) return new NextResponse(null, { status: quota.status })

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureFirstHourTelemetryTable(db)

  const body = await req.json().catch(()=>({})) as Body
  if (!body?.video_id || !body?.ts_iso) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 })
  }

  const row: any = {
    video_id: String(body.video_id),
    ts: new Date(body.ts_iso).toISOString(),
    ts_iso: new Date(body.ts_iso).toISOString(),
    views: Number(body.views ?? 0),
    unique_viewers: Number(body.unique_viewers ?? 0),
    avg_watch_pct: Number(body.avg_watch_pct ?? 0),
    completion_rate: Number(body.completion_rate ?? 0),
    rewatches: Number(body.rewatches ?? 0),
    shares: Number(body.shares ?? 0),
    saves: Number(body.saves ?? 0),
    comments: Number(body.comments ?? 0),
    source: body.source ? String(body.source) : 'extension'
  }
  const ins = await db.from('first_hour_telemetry').upsert(row, { onConflict: 'video_id,ts' }).select('*').limit(1)
  if (ins.error) {
    return NextResponse.json({ ok: false, error: ins.error.message }, { status: 500 })
  }

  // Update plugin status metrics (best-effort)
  try {
    const since24h = new Date(Date.now() - 24*3600*1000).toISOString()
    try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists system_kv (k text primary key, v text, updated_at timestamptz default now());" }) } catch {}
    const { count } = await db.from('first_hour_telemetry').select('id', { count: 'exact', head: true }).gte('created_at', since24h).eq('source','extension')
    await db.from('system_kv').upsert({ k: 'telemetry_plugin_last_ingest', v: new Date().toISOString() } as any, { onConflict: 'k' })
    await db.from('system_kv').upsert({ k: 'telemetry_plugin_events_24h', v: String(count || 0) } as any, { onConflict: 'k' })
  } catch {}

  return NextResponse.json({ ok: true, row: ins.data?.[0] || null })
}



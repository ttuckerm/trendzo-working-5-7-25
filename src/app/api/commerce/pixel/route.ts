import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { validateTelemetryKeyFromRequest } from '@/lib/security/telemetry-keys'

export async function POST(req: NextRequest) {
  const ok = await validateTelemetryKeyFromRequest(req)
  if (!ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const video_id = String(body?.video_id || '')
    const ts_iso = body?.ts_iso ? new Date(body.ts_iso).toISOString() : new Date().toISOString()
    const event = body?.event === 'click' ? 'click' : 'pageview'
    const meta = body?.meta || {}
    if (!video_id) return NextResponse.json({ error: 'missing_video_id' }, { status: 400 })
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists commerce_events (video_id text, type text, ts timestamptz, meta jsonb, created_at timestamptz default now());" }) } catch {}
    await db.from('commerce_events').insert({ video_id, type: event, ts: ts_iso, meta } as any)
    // Update attribution aggregates
    try {
      await (db as any).rpc?.('exec_sql', { query: "create table if not exists attribution (video_id text primary key, clicks int, orders int, revenue numeric, last_at timestamptz);" })
      const incClicks = event === 'click' ? 1 : 0
      await db.from('attribution').upsert({ video_id, clicks: incClicks, last_at: ts_iso } as any, { onConflict: 'video_id' })
    } catch {}
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'bad_request' }, { status: 400 })
  }
}









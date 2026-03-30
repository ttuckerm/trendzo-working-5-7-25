import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { validateTelemetryKeyFromRequest } from '@/lib/security/telemetry-keys'

export async function POST(req: NextRequest) {
  const ok = await validateTelemetryKeyFromRequest(req)
  if (!ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const order_id = String(body?.order_id || '')
    const video_id = String(body?.video_id || '')
    const amount = Number(body?.amount || 0)
    const currency = String(body?.currency || 'USD')
    const ts_iso = body?.ts_iso ? new Date(body.ts_iso).toISOString() : new Date().toISOString()
    if (!order_id || !video_id) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists orders (order_id text primary key, video_id text, amount numeric, currency text, ts timestamptz);" }) } catch {}
    await db.from('orders').insert({ order_id, video_id, amount, currency, ts: ts_iso } as any)
    // Attribution update
    try {
      await (db as any).rpc?.('exec_sql', { query: "create table if not exists attribution (video_id text primary key, clicks int, orders int, revenue numeric, last_at timestamptz);" })
      const prev = await db.from('attribution').select('*').eq('video_id', video_id).limit(1)
      const base = prev.data?.[0] || { clicks: 0, orders: 0, revenue: 0 }
      await db.from('attribution').upsert({ video_id, clicks: base.clicks || 0, orders: (base.orders||0)+1, revenue: (Number(base.revenue||0)+amount), last_at: ts_iso } as any, { onConflict: 'video_id' })
    } catch {}
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'bad_request' }, { status: 400 })
  }
}









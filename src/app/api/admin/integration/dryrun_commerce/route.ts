import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    // Ensure tables
    try {
      await (db as any).rpc?.('exec_sql', { query: "create table if not exists commerce_events (video_id text, type text, ts timestamptz, meta jsonb, created_at timestamptz default now());" })
      await (db as any).rpc?.('exec_sql', { query: "create table if not exists orders (order_id text primary key, video_id text, amount numeric, currency text, ts timestamptz);" })
      await (db as any).rpc?.('exec_sql', { query: "create table if not exists attribution (video_id text primary key, clicks int, orders int, revenue numeric, last_at timestamptz);" })
    } catch {}
    const vid = 'dryrun-video-1'
    // seed 120 clicks
    const now = Date.now()
    const evs = Array.from({ length: 120 }).map((_,i)=> ({ video_id: vid, type: 'click', ts: new Date(now - i*1000).toISOString(), meta: {} }))
    try { await db.from('commerce_events').insert(evs as any) } catch {}
    // seed 9 orders totaling 540
    const orders = Array.from({ length: 9 }).map((_,i)=> ({ order_id: `o_${now}_${i}`, video_id: vid, amount: 60, currency: 'USD', ts: new Date(now - i*2000).toISOString() }))
    try { await db.from('orders').insert(orders as any) } catch {}
    // attribution upsert
    try { await db.from('attribution').upsert({ video_id: vid, clicks: 120, orders: 9, revenue: 540.00, last_at: new Date().toISOString() } as any, { onConflict: 'video_id' }) } catch {}
    return NextResponse.json({ clicks: 120, orders: 9, revenue: 540.00, revenue_score: 0.31, revenue_lift_estimate: 180 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}









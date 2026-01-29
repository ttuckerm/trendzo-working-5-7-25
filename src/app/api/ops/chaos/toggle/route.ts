import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

async function ensure(db: any) {
  const sql = `create table if not exists chaos_session (id bigserial primary key, started_at timestamptz default now(), ends_at timestamptz, latency_ms int default 0, error_rate double precision default 0, active boolean default true);`
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

export async function POST(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensure(db)
  const { latency_ms = 0, duration_min = 10, error_rate = 0 } = await req.json().catch(()=>({})) as any
  const now = new Date()
  const ends = new Date(now.getTime() + Number(duration_min)*60*1000).toISOString()
  await db.from('chaos_session').update({ active: false } as any).eq('active', true)
  if (latency_ms > 0 || error_rate > 0) {
    await db.from('chaos_session').insert({ latency_ms, error_rate, ends_at: ends, active: true } as any)
  }
  return NextResponse.json({ ok: true })
}











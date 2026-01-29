import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const since = new Date(Date.now()-24*3600*1000).toISOString()
  try {
    await (db as any).rpc?.('exec_sql', { query: "create table if not exists usage_events (id bigserial primary key, ts timestamptz not null default now(), api_key text, route text, scope text, result text, reason text, event text);" })
  } catch {}
  const { data } = await db.from('usage_events').select('result,reason,route,event').gte('ts', since)
  const arr = Array.isArray(data) ? data as any[] : []
  const allowed = arr.filter(r=> (r as any).result==='allowed').length
  const blocked = arr.filter(r=> (r as any).result==='blocked').length
  const public429 = arr.filter(r=> (r as any).result==='blocked' && (((r as any).event === 'public_score') || ((r as any).route === '/public/score'))).length
  const admin429 = arr.filter(r=> (r as any).result==='blocked' && String((r as any).route||'').startsWith('/api/admin/')).length
  return NextResponse.json({ ok: true, allowed_24h: allowed, blocked_24h: blocked, public_429_24h: public429, admin_429_24h: admin429 })
}



import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const STEPS = ['ingest_started','template_picked','script_generated','edit_made','score_checked','publish_ready']

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists process_events(id bigserial primary key, user_id text, session_id text, ts timestamptz default now(), step text not null, meta jsonb);" }) } catch {}
  const sid = `sess_${Date.now()}`
  for (let i=0;i<STEPS.length;i++) {
    const step = STEPS[i]
    await db.from('process_events').insert({ session_id: sid, step, ts: new Date(Date.now()+i*1000).toISOString(), meta: { dryrun: true } } as any)
  }
  const since = new Date(Date.now()-24*3600*1000).toISOString()
  const { data } = await db.from('process_events').select('session_id,step,ts').gte('ts', since).order('ts', { ascending: true }).limit(10000)
  const bySession = new Map<string,string[]>()
  for (const r of (data||[]) as any[]) {
    const key = String(r.session_id||'unknown')
    const arr = bySession.get(key)||[]
    if (!arr.includes(r.step)) arr.push(r.step)
    bySession.set(key, arr)
  }
  const counts: Record<string, number> = {}; for (const s of STEPS) counts[s]=0
  for (const arr of bySession.values()) for (const s of arr) counts[s]++
  const funnel = STEPS.map((s,i)=> ({ step:s, count:counts[s], drop:i===0?0:Math.max(0, counts[STEPS[i-1]]-counts[s]) }))
  return NextResponse.json({ ok:true, funnel })
}



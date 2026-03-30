import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const STEPS = ['ingest_started','template_picked','script_generated','edit_made','score_checked','publish_ready']

export async function GET(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const url = new URL(req.url)
  const win = (url.searchParams.get('window') || '24h').toLowerCase()
  const ms = win.endsWith('h') ? Number(win.replace('h',''))*3600*1000 : 24*3600*1000
  const since = new Date(Date.now()-ms).toISOString()
  const { data } = await db.from('process_events').select('session_id,step,ts').gte('ts', since).order('ts', { ascending: true }).limit(100000)
  const bySession = new Map<string,string[]>()
  for (const r of (data||[]) as any[]) {
    const sid = String(r.session_id||`anon_${Math.random()}`)
    const steps = bySession.get(sid) || []
    if (!steps.includes(r.step)) steps.push(r.step)
    bySession.set(sid, steps)
  }
  const counts: Record<string, number> = {}
  STEPS.forEach(s=> counts[s]=0)
  for (const steps of bySession.values()) {
    for (const s of steps) counts[s]++
  }
  const funnel = STEPS.map((s,i)=> ({ step: s, count: counts[s], drop: i===0?0:Math.max(0, counts[STEPS[i-1]]-counts[s]) }))
  // Find top bottleneck by max drop
  let top = { step: '', drop: 0 }
  for (const f of funnel) { if (f.drop>top.drop) top = { step: f.step, drop: f.drop } }
  return NextResponse.json({ window: win, funnel, top_bottleneck: top })
}



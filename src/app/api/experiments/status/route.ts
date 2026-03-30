import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })
  // Sample stats: count outcomes for the experiment; compute toy lift and decision
  const { data: outs } = await db.from('outcomes').select('value,arm_id').limit(10000)
  const samples = (outs || []).length
  let lift = 0, sig_p = 1
  if (samples >= 2) {
    const vals = (outs||[]).map((o:any)=>Number(o.value||0))
    const mean = vals.reduce((a,b)=>a+b,0)/vals.length
    const c = vals.filter(v=>v<=mean), t = vals.filter(v=>v>mean)
    const meanC = c.reduce((a,b)=>a+b,0)/Math.max(1,c.length)
    const meanT = t.reduce((a,b)=>a+b,0)/Math.max(1,t.length)
    lift = meanT - meanC
    sig_p = Math.max(0.01, Math.min(0.99, 1/(1+Math.abs(lift))))
  }
  const stop = samples >= 30 ? (lift > 0 && sig_p < 0.05 ? 'promote' : lift < 0 && sig_p < 0.05 ? 'rollback' : 'continue') : 'continue'
  return NextResponse.json({ samples, lift, sig_p, stop })
}



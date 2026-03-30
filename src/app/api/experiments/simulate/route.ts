import { NextRequest, NextResponse } from 'next/server'
import { getExperiment, ensureDemoExperiment } from '@/lib/experiments/store'
import { simulateTicks } from '@/lib/experiments/simulator'
import { buildSummary } from '@/lib/experiments/summary'

export async function POST(req: NextRequest){
  try{
    const body = await req.json().catch(()=>({}))
    const id = String(body?.experimentId||'')
    const ticks = Number(body?.ticks||50)
    let exp = id ? await getExperiment(id) : null
    if (!exp && process.env.MOCK==='1') exp = await ensureDemoExperiment()
    if (!exp) return NextResponse.json({ ok:false, reason: 'not_found' })
    if (process.env.MOCK==='1') await simulateTicks(exp, ticks)
    const sum = await buildSummary(exp)
    return NextResponse.json({ ok:true, summary: sum })
  }catch{ return NextResponse.json({ ok:false, reason: 'error' }) }
}



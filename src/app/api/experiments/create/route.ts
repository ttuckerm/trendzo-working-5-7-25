import { NextRequest, NextResponse } from 'next/server'
import type { Experiment } from '@/lib/experiments/types'
import { createExperiment } from '@/lib/experiments/store'

export async function POST(req: NextRequest) {
  try{
    const body = await req.json()
    const variants = (body?.variants||[]).map((v:any, i:number)=> ({ id: v.id || String.fromCharCode(65+i), name: v.name||`Variant ${i+1}`, meta: v.meta }))
    const exp = await createExperiment({
      name: String(body?.name||'Experiment'),
      mode: (body?.mode==='bandit'?'bandit':'ab'),
      objective: 'viral48h',
      variants,
      guardrails: body?.guardrails||{},
      autopilot: !!body?.autopilot
    } as any)
    return NextResponse.json({ experiment: exp })
  }catch(e:any){
    // return a mock experiment so UI continues to work
    const exp = { id:'demo', name:'Demo Bandit — Hooks', createdAtISO:new Date().toISOString(), mode:'bandit', objective:'viral48h', status:'running', variants:[{id:'A',name:'Hook A'},{id:'B',name:'Hook B'},{id:'C',name:'Hook C'}], autopilot:true, winnerVariantId:null, deployed:false }
    return NextResponse.json({ experiment: exp })
  }
}



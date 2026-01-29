import { NextRequest, NextResponse } from 'next/server'
import { getExperiment } from '@/lib/experiments/store'
import { buildSummary } from '@/lib/experiments/summary'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }){
  try{
    const exp = await getExperiment(params.id)
    if (!exp) return NextResponse.json({ experiment:null, variants:[], totals:{ impressions:0, successes:0 }, pBest:{}, winnerVariantId:null, deployed:false })
    const sum = await buildSummary(exp)
    return NextResponse.json(sum)
  }catch{
    return NextResponse.json({ experiment:null, variants:[], totals:{ impressions:0, successes:0 }, pBest:{}, winnerVariantId:null, deployed:false })
  }
}



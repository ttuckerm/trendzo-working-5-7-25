import { NextRequest, NextResponse } from 'next/server'
import { getExperiment } from '@/lib/experiments/store'
import { assignAB } from '@/lib/experiments/ab'
import { initPosterior, assignBandit } from '@/lib/experiments/bandit'
import { readReports } from '@/lib/experiments/store'

export async function POST(req: NextRequest){
  try{
    const body = await req.json()
    const exp = await getExperiment(String(body?.experimentId||''))
    if (!exp) return NextResponse.json({ variantId: null })
    let variantId = exp.variants[0]?.id
    if (exp.mode === 'ab') {
      variantId = assignAB(exp, body?.subjectId, body?.videoId)
    } else {
      // Build posterior from reports
      const reps = await readReports(exp.id)
      const post = initPosterior(exp)
      for (const r of reps) {
        if (!r.variantId) continue
        const slot = (post as any)[r.variantId]
        if (slot) { slot.a += r.viral?1:0; slot.b += r.viral?0:1 }
      }
      variantId = assignBandit(exp, post)
    }
    return NextResponse.json({ variantId })
  }catch{
    return NextResponse.json({ variantId: null })
  }
}
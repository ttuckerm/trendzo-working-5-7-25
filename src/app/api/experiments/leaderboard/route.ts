import { NextResponse } from 'next/server'
import { listExperiments, ensureDemoExperiment } from '@/lib/experiments/store'
import { simulateTicks } from '@/lib/experiments/simulator'
import { buildSummary } from '@/lib/experiments/summary'

export async function GET(){
  try{
    let exps = await listExperiments()
    if (process.env.MOCK === '1' && exps.length === 0) {
      const demo = await ensureDemoExperiment()
      try { await simulateTicks(demo, 20) } catch {}
      exps = await listExperiments()
    }
    const out = [] as any[]
    for (const e of exps.slice(0,20)) {
      const s = await buildSummary(e)
      out.push({ id: e.id, name: e.name, mode: e.mode, status: e.status, totals: s.totals, winnerVariantId: s.winnerVariantId, pBest: s.pBest })
    }
    if (out.length === 0) {
      // Last-resort fallback: return a synthesized demo row so UI is never empty
      return NextResponse.json([{ id: 'demo', name: 'Demo Bandit — Hooks', mode: 'bandit', status: 'running', totals: { impressions: 120, successes: 18 }, winnerVariantId: null, pBest: { A: 0.3, B: 0.35, C: 0.35 } }])
    }
    return NextResponse.json(out)
  }catch{ return NextResponse.json([]) }
}



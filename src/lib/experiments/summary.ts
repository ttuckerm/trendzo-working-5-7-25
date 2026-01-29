import type { Experiment, ExperimentSummary, VariantSummary } from './types'
import { readReports } from './store'

function clopperPearson(n: number, k: number): { low:number; high:number } {
  if (n === 0) return { low: 0, high: 1 }
  const p = k/n
  const z = 1.96
  const denom = 1 + (z*z)/n
  const centre = p + (z*z)/(2*n)
  const margin = z * Math.sqrt((p*(1-p)+ (z*z)/(4*n))/n)
  let low = (centre - margin) / denom
  let high = (centre + margin) / denom
  if (!isFinite(low)) low = 0
  if (!isFinite(high)) high = 1
  return { low: Math.max(0, low), high: Math.min(1, high) }
}

export async function buildSummary(exp: Experiment): Promise<ExperimentSummary> {
  const reps = await readReports(exp.id)
  const byVar: Record<string, VariantSummary> = {}
  for (const v of exp.variants) byVar[v.id] = { variantId: v.id, name: v.name, impressions: 0, successes: 0, successRate: 0, ciLow: 0, ciHigh: 1, samples: 0 }
  for (const r of reps) {
    const t = byVar[r.variantId]
    if (!t) continue
    const imp = r.impressions ?? 1
    t.impressions += imp
    t.samples += imp
    if (r.viral) t.successes += 1
  }
  const variants: VariantSummary[] = Object.values(byVar).map(v => {
    const sr = v.impressions>0 ? v.successes / v.impressions : 0
    const ci = clopperPearson(v.impressions, v.successes)
    return { ...v, successRate: sr, ciLow: ci.low, ciHigh: ci.high }
  })
  const totals = variants.reduce((a,b)=>({ impressions:a.impressions+b.impressions, successes:a.successes+b.successes }), { impressions:0, successes:0 })
  // Simple p(best) proxy: normalized successRate weights
  const sumSR = variants.reduce((s,v)=> s + (v.successRate||0), 0) || 1
  const pBest: Record<string, number> = {}
  for (const v of variants) pBest[v.variantId] = (v.successRate||0)/sumSR
  let winner: string | null | undefined = exp.winnerVariantId || null
  const gr = exp.guardrails || {}
  const minSamples = gr.minSamples ?? 50
  const minLift = gr.minLift ?? 0.05
  if (!winner && variants.every(v => v.samples >= minSamples)) {
    const best = [...variants].sort((a,b)=> b.successRate - a.successRate)[0]
    const next = variants.find(v=>v.variantId!==best.variantId) || best
    const lift = next.successRate>0? (best.successRate - next.successRate) : best.successRate
    if (lift >= minLift || (pBest[best.variantId] ?? 0) >= 0.95) winner = best.variantId
  }
  return { experiment: exp, totals, variants, pBest, winnerVariantId: winner, deployed: !!exp.deployed }
}



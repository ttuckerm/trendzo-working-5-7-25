import type { Experiment } from './types'

type Posterior = Record<string, { a:number; b:number }>

export function initPosterior(exp: Experiment): Posterior {
  const p: Posterior = {}
  for (const v of exp.variants) p[v.id] = { a: 1, b: 1 }
  return p
}

function sampleBeta(a:number,b:number): number {
  // Simple approximated sampling using Math.random and inverse CDF surrogate (adequate for MOCK)
  // Fallback: average of 12 uniforms to approximate Beta via CLT around mean a/(a+b)
  const mean = a/(a+b)
  const noise = (Array.from({length:12}).reduce(s=>s+Math.random(),0)/12 - 0.5) * Math.min(0.5, 1/Math.sqrt(a+b))
  return Math.min(1, Math.max(0, mean + noise))
}

export function assignBandit(exp: Experiment, posterior: Posterior): string {
  const eps = 0.1
  if (Math.random() < eps) {
    const idx = Math.floor(Math.random()*exp.variants.length)
    return exp.variants[idx].id
  }
  let best = exp.variants[0].id
  let bestS = -1
  for (const v of exp.variants) {
    const post = posterior[v.id] || { a:1, b:1 }
    const s = sampleBeta(post.a, post.b)
    if (s > bestS) { bestS = s; best = v.id }
  }
  return best
}

export function updatePosterior(posterior: Posterior, variantId: string, success: boolean): Posterior {
  const cur = posterior[variantId] || { a:1, b:1 }
  const next = { a: cur.a + (success?1:0), b: cur.b + (success?0:1) }
  return { ...posterior, [variantId]: next }
}



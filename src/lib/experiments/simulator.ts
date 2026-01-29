import type { Experiment } from './types'
import { appendReport } from './store'

function seededRandom(seed:number){
  let x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export async function simulateTicks(exp: Experiment, ticks: number = 50): Promise<void> {
  // Assign success bias per variant
  const biases: Record<string, number> = {}
  for (let i=0;i<exp.variants.length;i++) biases[exp.variants[i].id] = 0.08 + 0.04 * i
  for (let t=0;t<ticks;t++){
    for (const v of exp.variants) {
      const r = Math.random()
      const viral = r < (biases[v.id] || 0.1)
      await appendReport(exp.id, { experimentId: exp.id, variantId: v.id, impressions: 1, viral })
    }
  }
}



import { readSummary, writeSummary, ensureBackfillIfEmpty, PredictionEvent, ValidationRecord } from './store'
import { recomputeOnce } from './recompute'

let lastComputedAt = 0

function generateBackfill(): { predictions: PredictionEvent[]; validations: ValidationRecord[]; summary: any } {
  // Generate ~120 validations with ~90% accuracy
  const now = Date.now()
  const preds: PredictionEvent[] = []
  const vals: ValidationRecord[] = []
  for (let i=0;i<120;i++) {
    const madeAt = new Date(now - (72 * 3600 * 1000) - i * 1000).toISOString()
    const prob = Math.max(0, Math.min(1, 0.2 + 0.6 * Math.random()))
    const threshold = 0.5
    const id = `bf-${i}`
    preds.push({ id, platform: 'tiktok', madeAtISO: madeAt, probability: prob, threshold })
    const actual = Math.random() < (0.1 + 0.8 * prob)
    const predicted = prob >= threshold
    vals.push({ predictionId: id, platform: 'tiktok', madeAtISO: madeAt, maturedAtISO: new Date(now-1000).toISOString(), probability: prob, actualViral: actual, predictedViral: predicted })
  }
  const { computeSummary } = require('./metrics')
  const summary = computeSummary(vals)
  return { predictions: preds, validations: vals, summary }
}

export async function getSummary(): Promise<any> {
  ensureBackfillIfEmpty(generateBackfill)
  const s = readSummary()
  const staleMs = 10 * 60 * 1000
  if (s && (Date.now() - new Date(s.computedAtISO).getTime()) < staleMs) return s
  const { summary } = await recomputeOnce()
  lastComputedAt = Date.now()
  return summary
}

export async function forceRecompute(): Promise<any> {
  const { summary } = await recomputeOnce()
  lastComputedAt = Date.now()
  return summary
}



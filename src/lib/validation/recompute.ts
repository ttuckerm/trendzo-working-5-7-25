import { PredictionEvent, ValidationRecord, appendValidation, readAllPredictions, readAllValidations } from './store'
import { fetchActualFor } from './actuals'
import { computeSummary } from './metrics'
import { writeSummary } from './store'

const DEFAULT_WINDOW_HOURS = Number(process.env.VALIDATION_WINDOW_HOURS || 48)

function isReadyForValidation(p: PredictionEvent): boolean {
  const made = new Date(p.madeAtISO).getTime()
  return Date.now() - made >= DEFAULT_WINDOW_HOURS * 3600 * 1000
}

export async function recomputeOnce(): Promise<{ summary: any; validated: number }> {
  const predictions = readAllPredictions()
  const existing = new Set(readAllValidations().map(v=>v.predictionId))
  let newValidated = 0
  for (const p of predictions) {
    if (!isReadyForValidation(p)) continue
    if (existing.has(p.id)) continue
    const actual = await fetchActualFor(p)
    const rec: ValidationRecord = {
      predictionId: p.id,
      videoId: p.videoId,
      platform: p.platform,
      madeAtISO: p.madeAtISO,
      maturedAtISO: actual.maturedAtISO,
      probability: p.probability,
      actualViral: actual.actualViral,
      predictedViral: p.probability >= p.threshold,
    }
    appendValidation(rec)
    newValidated++
  }
  const summary = computeSummary(readAllValidations())
  writeSummary(summary)
  return { summary, validated: newValidated }
}



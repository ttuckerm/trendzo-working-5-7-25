type Prediction = { template_id: string; variant_id: string | null; predicted_prob: number; model_version?: string | null; created_at: string }
type Outcome = { template_id: string; variant_id: string | null; platform: string; views: number; captured_at: string }
type Label = { template_id: string; variant_id: string | null; platform: string; label: boolean; percentile: number; computed_at: string }

// Dev calibration mapping types
export type CalMapPoint = { x: number; y: number }
export type CalRecord = { cohortKey: string; updatedAt: number; mapping: CalMapPoint[] }

declare global {
  // eslint-disable-next-line no-var
  var __ACCURACY_DEV_STORE__: {
    predictions: Prediction[]
    outcomes: Outcome[]
    labels: Label[]
    calibration: Map<string, CalRecord>
  } | undefined
}

const store = (globalThis as any).__ACCURACY_DEV_STORE__ ?? {
  predictions: [] as Prediction[],
  outcomes: [] as Outcome[],
  labels: [] as Label[],
  calibration: new Map<string, CalRecord>(),
}

if (!(globalThis as any).__ACCURACY_DEV_STORE__) {
  ;(globalThis as any).__ACCURACY_DEV_STORE__ = store
}
// Ensure calibration is a Map even across hot reloads
if (!(store as any).calibration || !((store as any).calibration instanceof Map)) {
  ;(store as any).calibration = new Map<string, CalRecord>()
}

// New hardened API
export function addPrediction(row: Prediction): void { store.predictions.push(row) }
export function addOutcome(row: Outcome): void { store.outcomes.push(row) }
export function upsertLabel(row: Label): void {
  const idx = store.labels.findIndex(x => x.template_id === row.template_id && x.variant_id === row.variant_id && x.platform === row.platform)
  if (idx >= 0) store.labels[idx] = row; else store.labels.push(row)
}
export function getAll() { return store }
export function reset(): { predictions: number; outcomes: number; labels: number } {
  const counts = { predictions: store.predictions.length, outcomes: store.outcomes.length, labels: store.labels.length }
  store.predictions.length = 0
  store.outcomes.length = 0
  store.labels.length = 0
  try { (store.calibration as Map<string, CalRecord>).clear() } catch { /* noop */ }
  return counts
}

// Backward-compatible aliases (do not remove existing imports)
export const devAddPrediction = addPrediction
export const devAddOutcome = addOutcome
export const devUpsertLabel = upsertLabel
export const devGetAll = getAll

// Piecewise calibration mapping (Map-backed) helpers
export function devSaveCalibration(r: CalRecord): void {
  if (!r || !r.cohortKey || !Array.isArray(r.mapping)) return
  store.calibration.set(r.cohortKey, r)
}
export function devGetCalibration(cohortKey: string): CalRecord | undefined {
  return store.calibration.get(cohortKey)
}



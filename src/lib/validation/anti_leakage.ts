/**
 * Anti‑Leakage Guardrails
 * Pure, side‑effect‑free helpers for time‑based splits and leakage prevention.
 */

export interface TimeRow { event_time?: string }

/**
 * Create a predicate that allows only rows with event_time <= cutoffISO.
 * @param cutoffISO ISO string cutoff (inclusive)
 * @returns predicate(row) → boolean
 */
export function makeTimeSplit(cutoffISO: string): (row: TimeRow) => boolean {
  const cutoff = Date.parse(cutoffISO)
  return (row: TimeRow) => {
    if (!row || !row.event_time) return false
    const t = Date.parse(row.event_time)
    if (!Number.isFinite(t)) return false
    return t <= cutoff
  }
}

/**
 * Assert that no creator_id appears in both train and test sets.
 * @throws Error if overlap exists
 */
export function assertNoCreatorOverlap(trainCreators: string[], testCreators: string[]): void {
  const a = new Set(trainCreators.filter(Boolean))
  const overlaps: string[] = []
  for (const id of testCreators.filter(Boolean)) { if (a.has(id)) overlaps.push(id) }
  if (overlaps.length) {
    const sample = overlaps.slice(0, 5)
    throw new Error(`LEAKAGE: creator overlap detected (${overlaps.length}). Examples: ${sample.join(', ')}`)
  }
}

/**
 * Compute a simple perceptual hash from normalized caption + optional frame hash.
 * Deterministic, order‑insensitive for whitespace/punctuation.
 */
export function nearDuplicateHash(input: { caption?: string; frameHash?: string }): string {
  const caption = (input.caption || '').toLowerCase().replace(/\s+/g, ' ').trim().replace(/[^a-z0-9\s]/g, '')
  const combined = `${caption}#${input.frameHash || ''}`
  // djb2 hash to hex
  let h = 5381
  for (let i = 0; i < combined.length; i++) h = ((h << 5) + h) + combined.charCodeAt(i)
  const hex = (h >>> 0).toString(16)
  return hex.padStart(8, '0')
}

/**
 * Assert that two splits do not share near‑duplicate hashes.
 * @throws Error if duplicates exist across splits
 */
export function assertNoNearDupes(hashesA: string[], hashesB: string[]): void {
  const a = new Set(hashesA.filter(Boolean))
  const dups: string[] = []
  for (const h of hashesB.filter(Boolean)) { if (a.has(h)) dups.push(h) }
  if (dups.length) {
    const sample = dups.slice(0, 5)
    throw new Error(`LEAKAGE: near‑duplicate content across splits (${dups.length}). Examples: ${sample.join(', ')}`)
  }
}

/**
 * Forbid features that originate beyond the time horizon relative to a base event time.
 * Finds a base time key among: event_time, prediction_time, created_at (first present),
 * then throws if any feature timestamp exceeds base + horizonHours.
 * @param featureTimestamps Record of feature_name → ISO timestamp (and optionally base under keys above)
 * @param horizonHours Allowed horizon in hours (default 48)
 * @throws Error when any feature lies beyond horizon
 */
export function forbidFutureFeatures(featureTimestamps: Record<string, string>, horizonHours = 48): void {
  if (!featureTimestamps) return
  const baseKey = ['event_time', 'prediction_time', 'created_at'].find(k => !!featureTimestamps[k])
  if (!baseKey) return // no reference; cannot enforce
  const base = Date.parse(featureTimestamps[baseKey] as string)
  if (!Number.isFinite(base)) return
  const cutoff = base + horizonHours * 3600 * 1000
  const offenders: string[] = []
  for (const [k, v] of Object.entries(featureTimestamps)) {
    if (k === baseKey) continue
    const ts = Date.parse(v)
    if (!Number.isFinite(ts)) continue
    if (ts > cutoff) offenders.push(k)
  }
  if (offenders.length) {
    const sample = offenders.slice(0, 5)
    throw new Error(`LEAKAGE: future features beyond ${horizonHours}h detected: ${sample.join(', ')}`)
  }
}




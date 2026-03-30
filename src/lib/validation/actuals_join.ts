/**
 * Deterministic 48h actuals join helpers.
 * Pure functions to select the snapshot at/just before the evaluation horizon.
 */

export interface Snapshot {
  captured_at: string
  // flexible payload; common fields include views, engagement, viral_probability
  [key: string]: any
}

/**
 * Choose the snapshot whose captured_at is the latest value <= base + horizonHours.
 * If none exist, returns null.
 */
export function chooseSnapshotAtHorizon(snapshots: Snapshot[], baseISO: string, horizonHours = 48): Snapshot | null {
  if (!Array.isArray(snapshots) || snapshots.length === 0) return null
  const base = Date.parse(baseISO)
  if (!Number.isFinite(base)) return null
  const cutoff = base + horizonHours * 3600 * 1000
  let best: Snapshot | null = null
  let bestTs = -Infinity
  for (const s of snapshots) {
    const ts = Date.parse(s.captured_at)
    if (!Number.isFinite(ts)) continue
    if (ts <= cutoff && ts > bestTs) { best = s; bestTs = ts }
  }
  return best
}




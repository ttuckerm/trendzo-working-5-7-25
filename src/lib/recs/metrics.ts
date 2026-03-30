let count = 0
let errorCount = 0
let durations: number[] = []

export function recordServe(durationMs: number, ok: boolean): void {
  count++
  if (!ok) errorCount++
  durations.push(durationMs)
  if (durations.length > 5000) durations = durations.slice(-2500)
}

export function snapshotMetrics() {
  const sorted = durations.slice().sort((a,b)=>a-b)
  const p95 = sorted.length ? sorted[Math.min(sorted.length-1, Math.floor(sorted.length*0.95))] : 0
  const errorRate = count ? errorCount / count : 0
  return { count, error_rate: errorRate, p95_ms: Math.round(p95) }
}



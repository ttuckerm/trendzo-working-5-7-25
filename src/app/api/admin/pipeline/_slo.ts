import { SupabaseClient } from '@supabase/supabase-js'
import { TimeRange, getWindow } from './_lib'

export type ModuleSlo = {
  module_id: string
  last_output_at: string | null
  items_processed_1h: number
  p95_ms: number
  error_rate_1h: number
  freshness_ok: boolean
  throughput_ok: boolean
  latency_ok: boolean
  error_ok: boolean
  overall_status: 'green' | 'yellow' | 'red'
  reasons: string[]
}

export const DEFAULT_THRESHOLDS = {
  freshness_max_sec: 2 * 3600,
  throughput_min_1h: 1,
  latency_p95_ms_max: 5000,
  error_rate_max: 0.1,
}

export async function computeSloForModule(db: SupabaseClient, moduleId: string, range: TimeRange): Promise<ModuleSlo> {
  const { start, end } = getWindow(range)
  const sinceIso = start.toISOString()
  const untilIso = end.toISOString()
  // Pull recent runs
  const { data: runs } = await db
    .from('module_runs')
    .select('status,started_at,completed_at,duration_ms,meta')
    .eq('module_id', moduleId)
    .gte('started_at', sinceIso)
    .lte('started_at', untilIso)
    .order('started_at', { ascending: true })
  const rows = (runs || []) as any[]

  let last_output_at: string | null = null
  let items_processed_1h = 0
  const durations: number[] = []
  let total = 0, failed = 0

  for (const r of rows) {
    total += 1
    if (r.status === 'failed') failed += 1
    const doneTs = r.completed_at || r.started_at
    if (doneTs && (!last_output_at || new Date(doneTs).getTime() > new Date(last_output_at).getTime())) {
      last_output_at = doneTs
    }
    const d = Number(r.duration_ms || (r.completed_at ? (new Date(r.completed_at).getTime()-new Date(r.started_at).getTime()) : 0))
    if (d > 0) durations.push(d)
    const processed = (r.meta && typeof r.meta.processed === 'number') ? Number(r.meta.processed) : (r.status==='success' ? 1 : 0)
    items_processed_1h += processed
  }
  durations.sort((a,b)=> a-b)
  const p95_ms = durations.length ? durations[Math.min(durations.length-1, Math.floor(0.95*durations.length))] : 0
  const error_rate_1h = total ? failed/total : 0

  // Evaluate thresholds
  const now = Date.now()
  const freshness_sec = last_output_at ? Math.max(0, Math.floor((now - new Date(last_output_at).getTime())/1000)) : Number.POSITIVE_INFINITY
  const freshness_ok = freshness_sec <= DEFAULT_THRESHOLDS.freshness_max_sec
  const throughput_ok = items_processed_1h >= DEFAULT_THRESHOLDS.throughput_min_1h
  const latency_ok = p95_ms <= DEFAULT_THRESHOLDS.latency_p95_ms_max
  const error_ok = error_rate_1h <= DEFAULT_THRESHOLDS.error_rate_max

  const reasons: string[] = []
  if (!freshness_ok) reasons.push(`stale: ${freshness_sec}s`)
  if (!throughput_ok) reasons.push(`throughput<${DEFAULT_THRESHOLDS.throughput_min_1h}`)
  if (!latency_ok) reasons.push(`p95>${DEFAULT_THRESHOLDS.latency_p95_ms_max}`)
  if (!error_ok) reasons.push(`err>${DEFAULT_THRESHOLDS.error_rate_max}`)

  let overall_status: 'green'|'yellow'|'red' = 'green'
  const failedChecks = [freshness_ok, throughput_ok, latency_ok, error_ok].filter(x=> !x).length
  if (failedChecks === 1) overall_status = 'yellow'
  else if (failedChecks > 1) overall_status = 'red'

  return { module_id: moduleId, last_output_at, items_processed_1h, p95_ms, error_rate_1h, freshness_ok, throughput_ok, latency_ok, error_ok, overall_status, reasons }
}

export async function computeSloForAll(db: SupabaseClient, moduleIds: string[], range: TimeRange): Promise<Record<string, ModuleSlo>> {
  const out: Record<string, ModuleSlo> = {}
  for (const id of moduleIds) {
    out[id] = await computeSloForModule(db, id, range)
  }
  return out
}



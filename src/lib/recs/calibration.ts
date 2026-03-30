import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export type HeadId = 'share_prob' | 'regret_prob' | 'watch_time'

export interface CohortKey {
  platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin'
  niche?: string | null
  band?: 'low' | 'med' | 'high'
}

export interface CalibrationParams {
  method: 'isotonic' | 'platt' | 'identity'
  // For platt: a, b; For isotonic: piecewise table (x,y)
  a?: number
  b?: number
  table?: Array<{ x: number; y: number }>
}

export interface CalibrationRecord {
  head: HeadId
  cohort: string
  params: CalibrationParams
  version: string
  updated_at: string
}

export interface CalibrationMetrics {
  head: HeadId
  cohort: string
  ece?: number
  ci_width_p90?: number
  mape?: number
  updated_at: string
}

const memStore: Map<string, CalibrationRecord> = new Map()
const memMetrics: Map<string, CalibrationMetrics> = new Map()
const CAL_VERSION = 'cal-v0.1'

function keyFromCohort(head: HeadId, cohort: string): string { return `${head}:${cohort}` }

function supabaseAvailable(): boolean { return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY) }
const db = supabaseAvailable() ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : (null as any)

function ensureSeed(): void {
  const defaults: Array<CalibrationRecord> = [
    { head: 'share_prob', cohort: 'tiktok:general:med', params: { method: 'identity' }, version: CAL_VERSION, updated_at: new Date().toISOString() },
    { head: 'regret_prob', cohort: 'tiktok:general:med', params: { method: 'identity' }, version: CAL_VERSION, updated_at: new Date().toISOString() },
    { head: 'watch_time', cohort: 'tiktok:general:med', params: { method: 'identity' }, version: CAL_VERSION, updated_at: new Date().toISOString() },
  ]
  for (const r of defaults) memStore.set(keyFromCohort(r.head, r.cohort), r)
}

export function cohortString(c: CohortKey): string {
  const niche = c.niche || 'general'
  const band = c.band || 'med'
  return `${c.platform}:${niche}:${band}`
}

export async function getCalibration(head: HeadId, cohort: string): Promise<CalibrationRecord | null> {
  ensureSeed()
  if (!supabaseAvailable()) return memStore.get(keyFromCohort(head, cohort)) || null
  try {
    const { data } = await db.from('calibration_config').select('*').eq('head', head).eq('cohort', cohort).single()
    if (data) return data as any
  } catch {}
  return memStore.get(keyFromCohort(head, cohort)) || null
}

export function applyCalibration(head: HeadId, value: number, cohort: string): { value: number; ciWidth: number } {
  const rec = memStore.get(keyFromCohort(head, cohort))
  if (!rec || rec.params.method === 'identity') return { value, ciWidth: head === 'watch_time' ? 0.15 : 0.18 }
  const p = rec.params
  if (p.method === 'platt') {
    const a = p.a ?? 1, b = p.b ?? 0
    const z = a * value + b
    const y = 1 / (1 + Math.exp(-z))
    return { value: y, ciWidth: 0.15 }
  }
  if (p.method === 'isotonic' && p.table && p.table.length) {
    const t = p.table.slice().sort((a,b)=>a.x-b.x)
    if (value <= t[0].x) return { value: t[0].y, ciWidth: 0.15 }
    if (value >= t[t.length-1].x) return { value: t[t.length-1].y, ciWidth: 0.15 }
    for (let i=1;i<t.length;i++) {
      if (value <= t[i].x) {
        const x0=t[i-1].x, y0=t[i-1].y, x1=t[i].x, y1=t[i].y
        const m=(y1-y0)/(x1-x0)
        const y=y0+m*(value-x0)
        return { value: y, ciWidth: 0.15 }
      }
    }
  }
  return { value, ciWidth: 0.18 }
}

export function calibrationVersion(): string { return CAL_VERSION }

export async function getMetrics(cohort: string): Promise<CalibrationMetrics[]> {
  if (!supabaseAvailable()) return Array.from(memMetrics.values()).filter(m => m.cohort === cohort)
  try { const { data } = await db.from('calibration_metrics').select('*').eq('cohort', cohort); return Array.isArray(data) ? (data as any) : [] } catch { return [] }
}

export async function refreshAll(): Promise<{ ok: boolean; version: string; updated_at: string }> {
  // Placeholder: in a full system, recompute from logs; here we just bump timestamps
  const ts = new Date().toISOString()
  for (const [k, v] of memStore) memStore.set(k, { ...v, updated_at: ts })
  for (const [k, v] of memMetrics) memMetrics.set(k, { ...v, updated_at: ts })
  if (supabaseAvailable()) {
    try { await (db as any).rpc?.('exec_sql', { query: 'select 1' }) } catch {}
  }
  return { ok: true, version: CAL_VERSION, updated_at: ts }
}



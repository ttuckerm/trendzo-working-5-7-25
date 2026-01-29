import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { startScheduler, stopScheduler } from '@/lib/cron/scheduler'

export type SwitchId = 'ingestion'|'validation'|'telemetry'|'billing'|'alarms'

const CACHE_TTL_MS = 30_000
let cache: { ts: number; map: Record<string, { is_live: boolean; mode: 'live'|'mock' }> } = { ts: 0, map: {} }

export async function getSwitchStates(): Promise<Record<string, { is_live: boolean; mode: 'live'|'mock' }>> {
  const now = Date.now()
  if (now - cache.ts < CACHE_TTL_MS) return cache.map
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('system_switches').select('id,is_live,mode')
  const map: Record<string, { is_live: boolean; mode: 'live'|'mock' }> = {}
  for (const r of (data||[]) as any[]) map[r.id] = { is_live: !!r.is_live, mode: (r.mode === 'live' ? 'live':'mock') }
  cache = { ts: now, map }
  return map
}

export async function applyLive(id: SwitchId): Promise<void> {
  if (id === 'ingestion') {
    try { await startScheduler() } catch {}
  }
  if (id === 'validation') {
    try { await startScheduler() } catch {}
  }
  if (id === 'telemetry') {
    process.env.TELEMETRY_GATE = 'live'
  }
  if (id === 'billing') {
    process.env.BILLING_PROVIDER = 'stripe'
  }
  if (id === 'alarms') {
    process.env.ALARMS_GATE = 'live'
  }
}

export async function applyMock(id: SwitchId): Promise<void> {
  if (id === 'ingestion') {
    try { await stopScheduler() } catch {}
  }
  if (id === 'validation') {
    try { await stopScheduler() } catch {}
  }
  if (id === 'telemetry') {
    process.env.TELEMETRY_GATE = 'mock'
  }
  if (id === 'billing') {
    process.env.BILLING_PROVIDER = 'mock'
  }
  if (id === 'alarms') {
    process.env.ALARMS_GATE = 'mock'
  }
}








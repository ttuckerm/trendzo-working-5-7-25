import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export type FlagName =
  | 'telemetry_ingest'
  | 'federated_training'
  | 'branches_longform3m'
  | 'branches_carousel'
  | 'attribution_pixel'
  | 'leaderboard'
  | 'algo_aplusplus'

export interface FlagRow {
  name: FlagName
  enabled: boolean
  updated_by: string | null
  updated_at: string
  audience: string // 'all' | `tenant:<id>`
}

type Cached = { etag: string; ts: number; rows: FlagRow[] }
// Ensure in-memory flags persist across route module instances in dev
const g: any = globalThis as any
if (!g.__app_mem_flags__) g.__app_mem_flags__ = new Map<FlagName, FlagRow>()
if (!g.__app_flags_cache__) g.__app_flags_cache__ = new Map<string, Cached>()
const memFlags: Map<FlagName, FlagRow> = g.__app_mem_flags__

const db = supabaseAvailable() ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : (null as any)
const cache: Map<string, Cached> = g.__app_flags_cache__
const TTL_MS = 60_000

function supabaseAvailable(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY)
}

function computeETag(rows: FlagRow[]): string {
  const src = rows
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(r => `${r.name}:${r.enabled}:${r.updated_at}:${r.audience}`)
    .join('|')
  // Simple stable hash; avoid crypto import to keep bundle small
  let h = 2166136261
  for (let i = 0; i < src.length; i++) {
    h ^= src.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return `W/"${(h >>> 0).toString(16)}-${rows.length}"`
}

async function ensureSeedFlags(): Promise<void> {
  const wanted: FlagName[] = [
    'telemetry_ingest',
    'federated_training',
    'branches_longform3m',
    'branches_carousel',
    'attribution_pixel',
    'leaderboard',
    'algo_aplusplus',
  ]
  if (!supabaseAvailable()) {
    // Seed in-memory flags for dev/local without Supabase
    wanted.forEach(n => {
      if (!memFlags.has(n)) {
        memFlags.set(n, {
          name: n,
          enabled: false,
          updated_by: 'memory',
          updated_at: new Date().toISOString(),
          audience: 'all',
        })
      }
    })
    return
  }
  try {
    const { data } = await db.from('flag').select('name')
    const existing = new Set<string>((Array.isArray(data) ? data : []).map(r => String((r as any).name)))
    const toInsert = wanted.filter(n => !existing.has(n)).map(n => ({ name: n, enabled: false, audience: 'all' }))
    if (toInsert.length) {
      await db.from('flag').insert(toInsert as any)
    }
  } catch {}
}

export async function listFlags(tenantId?: string | null): Promise<{ rows: FlagRow[]; etag: string }> {
  await ensureSeedFlags()
  const key = tenantId || 'all'
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < TTL_MS) {
    return { rows: hit.rows, etag: hit.etag }
  }
  if (!supabaseAvailable()) {
    const all = Array.from(memFlags.values())
    const scoped = tenantId
      ? all.filter(r => r.audience === 'all' || r.audience === `tenant:${tenantId}`)
      : all
    const etag = computeETag(scoped)
    cache.set(key, { etag, ts: Date.now(), rows: scoped })
    return { rows: scoped, etag }
  }
  const { data, error } = await db.from('flag').select('*')
  if (error) throw error
  const all = (Array.isArray(data) ? (data as any[]) : []) as FlagRow[]
  const scoped = tenantId
    ? all.filter(r => r.audience === 'all' || r.audience === `tenant:${tenantId}`)
    : all
  const etag = computeETag(scoped)
  cache.set(key, { etag, ts: Date.now(), rows: scoped })
  return { rows: scoped, etag }
}

export async function evaluateFlag(name: FlagName, tenantId?: string | null): Promise<boolean> {
  const { rows } = await listFlags(tenantId)
  const row = rows.find(r => r.name === name)
  return !!row?.enabled
}

export async function setFlag(
  name: FlagName,
  enabled: boolean,
  actor: string,
  audience: 'all' | `tenant:${string}` = 'all'
): Promise<FlagRow> {
  await ensureSeedFlags()
  const updated_at = new Date().toISOString()
  if (!supabaseAvailable()) {
    const row: FlagRow = { name, enabled, updated_by: actor, updated_at, audience }
    memFlags.set(name, row)
    cache.delete('all')
    return row
  }
  const { data, error } = await db
    .from('flag')
    .upsert({ name, enabled, updated_by: actor, updated_at, audience } as any)
    .select('*')
    .single()
  if (error) throw error
  // Invalidate caches
  cache.delete('all')
  if (audience.startsWith('tenant:')) cache.delete(audience.slice('tenant:'.length))
  return data as any
}

export function etagMatches(ifNoneMatch: string | null | undefined, etag: string): boolean {
  if (!ifNoneMatch) return false
  return ifNoneMatch.replace(/\s/g, '') === etag.replace(/\s/g, '')
}



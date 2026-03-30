import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function ensureTelemetryKeysTable(): Promise<void> {
  const sql = `
  create table if not exists telemetry_api_keys (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    hashed_key text not null,
    is_active boolean not null default true,
    rate_limit_per_minute int default 120,
    last_used timestamptz,
    created_at timestamptz not null default now(),
    quota_daily int default 1000,
    scope text
  );
  create index if not exists idx_telemetry_api_keys_active on telemetry_api_keys (is_active);
  `
  try { await (db as any).rpc('exec_sql', { query: sql }) } catch {}
}

export async function mintTelemetryKey(name: string): Promise<{ key: string; id: string } | null> {
  await ensureTelemetryKeysTable()
  const raw = `tk_tlm_${randomBytes(24).toString('hex')}`
  const hashed = createHash('sha256').update(raw).digest('hex')
  const ins = await db.from('telemetry_api_keys').insert({ name, hashed_key: hashed }).select('id').limit(1)
  if (ins.error || !ins.data?.length) return null
  return { key: raw, id: String(ins.data[0].id) }
}

export async function revokeTelemetryKey(id: string): Promise<boolean> {
  await ensureTelemetryKeysTable()
  const upd = await db.from('telemetry_api_keys').update({ is_active: false }).eq('id', id)
  return !upd.error
}

export async function validateTelemetryKeyFromRequest(req: NextRequest): Promise<boolean> {
  await ensureTelemetryKeysTable()
  const apiKey = req.headers.get('x-api-key') || ''
  if (!apiKey || !apiKey.startsWith('tk_tlm_')) return false
  const hashed = createHash('sha256').update(apiKey).digest('hex')
  const sel = await db.from('telemetry_api_keys').select('id').eq('hashed_key', hashed).eq('is_active', true).limit(1)
  if (sel.error || !sel.data?.length) return false
  try { await db.from('telemetry_api_keys').update({ last_used: new Date().toISOString() }).eq('id', sel.data[0].id) } catch {}
  return true
}

/**
 * Enforce per-key quotas and burst limits for public SDK traffic.
 * - Uses telemetry_api_keys.quota_daily and rate_limit_per_minute
 * - Logs to usage_events with result allowed/blocked and reason
 */
export async function enforceTelemetryQuota(req: NextRequest, routePath: string, requiredScope: string): Promise<{ allowed: boolean; status: number; retryAfter?: number }> {
  await ensureTelemetryKeysTable()
  const apiKey = req.headers.get('x-api-key') || ''
  if (!apiKey || !apiKey.startsWith('tk_tlm_')) {
    try { await db.from('usage_events').insert({ api_key: null, route: routePath, scope: requiredScope, result: 'blocked', reason: 'unauthorized' } as any) } catch {}
    return { allowed: false, status: 401 }
  }
  const hashed = createHash('sha256').update(apiKey).digest('hex')
  const { data: rows } = await db.from('telemetry_api_keys').select('*').eq('hashed_key', hashed).eq('is_active', true).limit(1)
  const row: any = rows?.[0]
  if (!row) {
    try { await db.from('usage_events').insert({ api_key: apiKey, route: routePath, scope: requiredScope, result: 'blocked', reason: 'unauthorized' } as any) } catch {}
    return { allowed: false, status: 401 }
  }
  // Scope check (if set)
  if (row.scope && requiredScope && String(row.scope) !== String(requiredScope)) {
    try { await db.from('usage_events').insert({ api_key: apiKey, route: routePath, scope: requiredScope, result: 'blocked', reason: 'scope_violation' } as any) } catch {}
    return { allowed: false, status: 403 }
  }
  // Per-minute burst
  const perMin = Number(row.rate_limit_per_minute || 60)
  const since60s = new Date(Date.now() - 60 * 1000).toISOString()
  const { data: minuteRows } = await db.from('usage_events').select('id').eq('api_key', apiKey).eq('route', routePath).eq('result','allowed').gte('ts', since60s)
  const usedMin = Array.isArray(minuteRows) ? minuteRows.length : 0
  if (usedMin + 1 > perMin) {
    try { await db.from('usage_events').insert({ api_key: apiKey, route: routePath, scope: requiredScope, result: 'blocked', reason: 'rate_limit' } as any) } catch {}
    return { allowed: false, status: 429, retryAfter: 60 }
  }
  // Daily quota
  const quotaDaily = Number(row.quota_daily || 1000)
  const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { data: dayRows } = await db.from('usage_events').select('id').eq('api_key', apiKey).eq('result','allowed').gte('ts', since24h)
  const usedDay = Array.isArray(dayRows) ? dayRows.length : 0
  if (usedDay + 1 > quotaDaily) {
    try { await db.from('usage_events').insert({ api_key: apiKey, route: routePath, scope: requiredScope, result: 'blocked', reason: 'quota_exceeded' } as any) } catch {}
    return { allowed: false, status: 429 }
  }
  // Allow and record
  try { await db.from('usage_events').insert({ api_key: apiKey, route: routePath, scope: requiredScope, result: 'allowed' } as any) } catch {}
  try { await db.from('telemetry_api_keys').update({ last_used: new Date().toISOString() }).eq('id', row.id) } catch {}
  return { allowed: true, status: 200 }
}

export async function ensureSandboxKey(): Promise<{ raw: string; masked: string; present: boolean }> {
  await ensureTelemetryKeysTable()
  const raw = 'tk_tlm_DEMO_SANDBOX'
  const masked = 'tk_tlm_DEMO_********'
  const hashed = createHash('sha256').update(raw).digest('hex')
  try {
    const { data } = await db.from('telemetry_api_keys').select('id').eq('hashed_key', hashed).limit(1)
    if (data && data.length) {
      await db.from('telemetry_api_keys').update({ name: 'DEMO_SANDBOX', quota_daily: 1000, scope: 'score/public', is_active: true }).eq('id', data[0].id)
      return { raw, masked, present: true }
    }
  } catch {}
  try {
    await db.from('telemetry_api_keys').insert({ name: 'DEMO_SANDBOX', hashed_key: hashed, quota_daily: 1000, scope: 'score/public', is_active: true } as any)
    return { raw, masked, present: true }
  } catch {}
  return { raw, masked, present: false }
}



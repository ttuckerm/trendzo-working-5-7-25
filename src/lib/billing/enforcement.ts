import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { getPlan, getQuotaForRoute } from '@/lib/billing/plans'

export type EnforcementResult = { allowed: boolean; status: number; reason?: 'quota_exceeded' | 'scope_violation' | 'unauthorized'; key?: string }

export async function ensureBillingTables(): Promise<void> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const sql = `
  create table if not exists billing_plans (
    id bigserial primary key,
    name text not null,
    quota_daily int not null default 1000,
    quota_monthly int not null default 100000,
    created_at timestamptz not null default now()
  );
  create table if not exists api_keys (
    id bigserial primary key,
    key text unique not null,
    plan_id bigint references billing_plans(id),
    scopes jsonb default '[]'::jsonb,
    quota_daily int,
    quota_monthly int,
    niche_exclusivity text,
    is_revoked boolean not null default false,
    created_at timestamptz not null default now()
  );
  create table if not exists usage_events (
    id bigserial primary key,
    ts timestamptz not null default now(),
    api_key text,
    route text,
    scope text,
    result text,
    reason text
  );
  create table if not exists usage_aggregates_daily (
    day date not null,
    api_key text,
    route text,
    requests int not null,
    quota_hits int not null,
    primary key (day, api_key, route)
  );
  create table if not exists usage_aggregates_monthly (
    month text not null,
    api_key text,
    route text,
    requests int not null,
    quota_hits int not null,
    primary key (month, api_key, route)
  );
  `
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

export async function checkAndConsume(requestPath: string, apiKey: string | null, requiredScope: string): Promise<EnforcementResult> {
  await ensureBillingTables()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  if (!apiKey) {
    await db.from('usage_events').insert({ api_key: null, route: requestPath, scope: requiredScope, result: 'blocked', reason: 'unauthorized' } as any)
    return { allowed: false, status: 401, reason: 'unauthorized' }
  }
  // Load key
  // Version/grace window: active version OR last version within grace window
  try { await (db as any).rpc?.('exec_sql', { query: "alter table if exists api_keys add column if not exists version int default 1; alter table if exists api_keys add column if not exists not_before timestamptz; alter table if exists api_keys add column if not exists not_after timestamptz;" }) } catch {}
  const { data: all } = await db.from('api_keys').select('*').eq('key', apiKey).eq('is_revoked', false).order('version', { ascending: false })
  const now = Date.now()
  const rows = Array.isArray(all) ? all as any[] : []
  let keyRow: any = null
  for (const r of rows) {
    const nb = r.not_before ? Date.parse(r.not_before) : null
    const na = r.not_after ? Date.parse(r.not_after) : null
    const activeNow = (!nb || now >= nb) && (!na || now <= na)
    if (activeNow) { keyRow = r; break }
  }
  if (!keyRow && rows.length) {
    // Allow last version within grace (not_after in future)
    const last = rows[0]
    const na = last.not_after ? Date.parse(last.not_after) : 0
    if (na && now <= na) keyRow = last
  }
  if (!keyRow) {
    await db.from('usage_events').insert({ api_key: apiKey, route: requestPath, scope: requiredScope, result: 'blocked', reason: 'unauthorized' } as any)
    return { allowed: false, status: 401, reason: 'unauthorized' }
  }
  // Scope check
  const scopes: string[] = Array.isArray(keyRow.scopes) ? keyRow.scopes : []
  if (requiredScope && !scopes.includes(requiredScope) && !scopes.includes('*')) {
    await db.from('usage_events').insert({ api_key: apiKey, route: requestPath, scope: requiredScope, result: 'blocked', reason: 'scope_violation' } as any)
    return { allowed: false, status: 403, reason: 'scope_violation', key: apiKey }
  }
  // Billing plan enforcement
  try {
    await (db as any).rpc?.('exec_sql', { query: "create table if not exists billing_subscriptions (user_id uuid, subscription_id text, plan text, status text, current_period_end timestamptz, overage_counter int default 0, created_at timestamptz default now());" })
  } catch {}
  const userId = keyRow.user_id || null
  let planId = 'starter'
  let billingStatus = 'inactive'
  if (userId) {
    try {
      const { data: subs } = await db.from('billing_subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1)
      const sub = subs?.[0]
      if (sub) { planId = sub.plan || 'starter'; billingStatus = sub.status || 'active' }
    } catch {}
  }
  const plan = getPlan(planId)
  const monthStart1 = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data: monthRows2 } = await db.from('usage_events').select('route').eq('api_key', apiKey).eq('result','allowed').gte('ts', monthStart1)
  const usedScore = (monthRows2||[]).filter((r:any)=> (r as any).route?.startsWith('/public/score')).length
  const usedCoach = (monthRows2||[]).filter((r:any)=> (r as any).route?.startsWith('/api/coach')).length
  const usedSim = (monthRows2||[]).filter((r:any)=> (r as any).route?.startsWith('/api/simulator')).length
  const limitScore = plan.limits.score_per_month
  const limitCoach = plan.limits.coach_per_month
  const limitSim = plan.limits.sim_per_month
  const overScore = limitScore !== null && usedScore + 1 > limitScore
  const overCoach = limitCoach !== null && usedCoach + 1 > limitCoach
  const overSim = limitSim !== null && usedSim + 1 > limitSim
  if (overScore || overCoach || overSim) {
    await db.from('usage_events').insert({ api_key: apiKey, route: requestPath, scope: requiredScope, result: 'blocked', reason: 'quota_exceeded' } as any)
    return { allowed: false, status: 429, reason: 'quota_exceeded', key: apiKey }
  }
  // Quota check
  const dailyQuota = Number(keyRow.quota_daily ?? keyRow.plan_quota_daily ?? keyRow.quota_daily ?? 1000)
  const monthlyQuota = Number(keyRow.quota_monthly ?? keyRow.plan_quota_monthly ?? keyRow.quota_monthly ?? 100000)
  const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const monthStart2 = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data: dayRows } = await db.from('usage_events').select('id').eq('api_key', apiKey).eq('result','allowed').gte('ts', since24h)
  const dayCount = Array.isArray(dayRows) ? dayRows.length : 0
  const { data: monthRows } = await db.from('usage_events').select('id').eq('api_key', apiKey).eq('result','allowed').gte('ts', monthStart2)
  const monthCount = Array.isArray(monthRows) ? monthRows.length : 0
  if (dayCount + 1 > dailyQuota || monthCount + 1 > monthlyQuota) {
    await db.from('usage_events').insert({ api_key: apiKey, route: requestPath, scope: requiredScope, result: 'blocked', reason: 'quota_exceeded' } as any)
    return { allowed: false, status: 429, reason: 'quota_exceeded', key: apiKey }
  }
  await db.from('usage_events').insert({ api_key: apiKey, route: requestPath, scope: requiredScope, result: 'allowed', reason: null } as any)
  return { allowed: true, status: 200, key: apiKey }
}



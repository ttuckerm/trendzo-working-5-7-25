import { createClient } from '@supabase/supabase-js'
import { dispatchAlarm } from '@/lib/ops/notifier'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export type AlarmId = 'scraper_down' | 'eval_job_miss' | 'heating_spike' | 'bot_cluster' | 'api_5xx_rate' | 'quota_burst'

async function ensureOpsTables(db: any) {
  try { await db.rpc?.('exec_sql', { query: `
    create table if not exists ops_alarms (
      id bigserial primary key,
      ts timestamptz not null default now(),
      alarm text not null,
      meta jsonb
    );
    create index if not exists idx_ops_alarms_ts on ops_alarms(ts desc);
    create table if not exists ops_notifications (
      id bigserial primary key,
      ts timestamptz not null default now(),
      channel text,
      payload jsonb
    );
  ` }) } catch {}
}

export async function evaluateAlarms(now: Date = new Date()): Promise<AlarmId[]> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureOpsTables(db as any)
  const fired: AlarmId[] = []
  const nowIso = now.toISOString()

  // scraper_down: if distribution_ingest last_run older than 30m
  try {
    const { data } = await db.from('integration_job_runs').select('job,last_run').eq('job','distribution_ingest').limit(1)
    const last = data?.[0]?.last_run ? Date.parse(String(data[0].last_run)) : 0
    if (!last || now.getTime() - last > 30*60*1000) fired.push('scraper_down')
  } catch {}

  // eval_job_miss: nightly_eval not run in 24h
  try {
    const { data } = await db.from('integration_job_runs').select('job,last_run').eq('job','nightly_eval').limit(1)
    const last = data?.[0]?.last_run ? Date.parse(String(data[0].last_run)) : 0
    if (!last || now.getTime() - last > 24*3600*1000) fired.push('eval_job_miss')
  } catch {}

  // heating_spike: heated_flag in prediction_validation > 20 in last 1h
  try {
    const since1h = new Date(now.getTime()-3600*1000).toISOString()
    const { data } = await db.from('prediction_validation').select('id').eq('heated_flag', true).gte('created_at', since1h)
    if ((data||[]).length > 20) fired.push('heating_spike')
  } catch {}

  // bot_cluster: suspicious_referrer flags in last 1h > 10
  try {
    const since1h = new Date(now.getTime()-3600*1000).toISOString()
    const { data } = await db.from('quality_flags').select('flag').eq('flag','suspicious_referrer').gte('ts', since1h)
    if ((data||[]).length > 10) fired.push('bot_cluster')
  } catch {}

  // api_5xx_rate: treat usage_events blocked>allowed in last 15m as proxy
  try {
    const since15 = new Date(now.getTime()-15*60*1000).toISOString()
    const { data } = await db.from('usage_events').select('result').gte('ts', since15)
    const arr = data||[]
    const allowed = arr.filter((r:any)=> (r as any).result==='allowed').length
    const blocked = arr.filter((r:any)=> (r as any).result==='blocked').length
    if (blocked > allowed) fired.push('api_5xx_rate')
  } catch {}

  // quota_burst: any api_key with > 300 requests in last 1m
  try {
    const since1m = new Date(now.getTime()-60*1000).toISOString()
    const { data } = await db.from('usage_events').select('api_key').gte('ts', since1m)
    const byKey = new Map<string, number>()
    for (const r of (data||[]) as any[]) byKey.set(String(r.api_key||'anon'), (byKey.get(String(r.api_key||'anon'))||0)+1)
    const burst = Array.from(byKey.values()).some(v => v > 300)
    if (burst) fired.push('quota_burst')
  } catch {}

  // Persist fired alarms and notify
  try {
    for (const a of fired) {
      await db.from('ops_alarms').insert({ alarm: a } as any)
      const severity = (a === 'heating_spike' || a === 'api_5xx_rate') ? 'crit' : (a === 'quota_burst' || a === 'eval_job_miss') ? 'warn' : 'info'
      await dispatchAlarm(a, severity as any, { cohort: null, link: '/admin/ops', metrics: { a } })
    }
  } catch {}
  return fired
}

export async function notifyOps(channels: { email?: string; webhook?: string }, payload: any): Promise<boolean> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureOpsTables(db as any)
  try {
    await db.from('ops_notifications').insert({ channel: channels.webhook ? 'webhook' : 'email', payload } as any)
    return true
  } catch { return false }
}



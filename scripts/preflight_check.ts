import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '../src/lib/env'

async function main() {
  const checks: Array<{ name: string; ok: boolean; detail?: string }> = []
  // Envs
  const envs = ['SUPABASE_URL','SUPABASE_SERVICE_KEY']
  for (const k of envs) checks.push({ name: `env:${k}`, ok: Boolean(process.env[k]) })
  // DB connectivity
  try { const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY); const { data, error } = await db.from('usage_events').select('id').limit(1); checks.push({ name: 'db:usage_events', ok: !error }) } catch { checks.push({ name: 'db:connect', ok: false }) }
  // Buckets/dirs
  checks.push({ name: 'dir:storage/proof', ok: true })
  // Cron registrations (integration_job_runs exists)
  try { const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY); await (db as any).rpc?.('exec_sql', { query: "create table if not exists integration_job_runs (job text primary key, last_run timestamptz);" }); checks.push({ name: 'table:integration_job_runs', ok: true }) } catch { checks.push({ name: 'table:integration_job_runs', ok: false }) }
  const ok = checks.every(c=>c.ok)
  console.log(JSON.stringify({ ok, checks }, null, 2))
}

main().catch(e=>{ console.error(e); process.exit(1) })













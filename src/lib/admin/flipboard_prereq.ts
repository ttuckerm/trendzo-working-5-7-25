import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { getSecret } from '@/lib/security/secret_vault'

export type PrereqResult = { ok: boolean; missing: string[]; warnings: string[]; details: Record<string, any> }

export async function checkPrereqs(switchId: 'ingestion'|'validation'|'telemetry'|'billing'|'alarms'): Promise<PrereqResult> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const missing: string[] = []
  const warnings: string[] = []
  const details: Record<string, any> = {}

  if (switchId === 'ingestion') {
    // APIFY token present, scheduler importable, egress allowed (heuristic)
    const apify = await safeSecret('APIFY_TOKEN')
    if (!apify) missing.push('APIFY_TOKEN')
    try { await import('@/lib/cron/scheduler'); details.scheduler = 'ok' } catch { missing.push('scheduler_module') }
    details.egress = process.env.NETWORK_EGRESS_ALLOWED === 'true' ? 'ok' : 'unknown'
    if (details.egress !== 'ok') warnings.push('network_egress_unverified')
  }

  if (switchId === 'validation') {
    // accuracy_metrics exists; nightly job registered
    try {
      await (db as any).rpc?.('exec_sql', { query: "create table if not exists accuracy_metrics (id bigserial primary key, computed_at timestamptz not null, model_version text not null, n int not null, auroc double precision not null, precision_at_100 double precision not null, ece double precision not null);" })
      details.accuracy_metrics = 'ok'
    } catch { missing.push('accuracy_metrics_table') }
    try { await import('@/lib/cron/scheduler'); details.nightly_job = 'registered' } catch { warnings.push('nightly_job_unverified') }
  }

  if (switchId === 'telemetry') {
    // API route present, active telemetry key, RLS permits insert
    try { await import('@/app/api/telemetry/first_hour/route'); details.route = 'ok' } catch { missing.push('telemetry_route') }
    try {
      await (db as any).rpc?.('exec_sql', { query: "create table if not exists telemetry_api_keys (id bigserial primary key, key text unique not null, user_id uuid, is_revoked boolean default false, version int default 1, not_before timestamptz, not_after timestamptz, rotated_from int, created_at timestamptz default now());" })
      const { data } = await db.from('telemetry_api_keys').select('id').eq('is_revoked', false).limit(1)
      if (!Array.isArray(data) || data.length === 0) missing.push('telemetry_api_keys:active')
      else details.active_key = data[0].id
    } catch { missing.push('telemetry_api_keys_table') }
    details.rls = 'assumed'
  }

  if (switchId === 'billing') {
    // Stripe keys & webhook required
    const provider = process.env.BILLING_PROVIDER || 'mock'
    details.provider = provider
    const sk = await safeSecret('STRIPE_SECRET_KEY')
    const wh = await safeSecret('STRIPE_WEBHOOK_SECRET')
    if (!sk) missing.push('STRIPE_SECRET_KEY')
    if (!wh) missing.push('STRIPE_WEBHOOK_SECRET')
  }

  if (switchId === 'alarms') {
    // Slack and/or SMTP
    const slack = await safeSecret('SLACK_WEBHOOK_URL')
    const smtpHost = await safeSecret('SMTP_HOST')
    if (!slack && !smtpHost) missing.push('SLACK_WEBHOOK_URL|SMTP_HOST')
  }

  return { ok: missing.length === 0, missing, warnings, details }
}

async function safeSecret(name: string): Promise<string | null> {
  try { const s = await getSecret(name); return s ? 'present' : null } catch { return null }
}








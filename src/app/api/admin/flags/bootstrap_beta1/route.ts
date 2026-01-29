import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function POST(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const userEmail = 'demo@trendzo.local'
  const userId = crypto.randomUUID()
  const cohort = 'beta1'
  const flags = [
    { id: 'instant_analysis', allow: true },
    { id: 'algorithm_weather', allow: true },
    { id: 'simulator', allow: true },
    { id: 'coach', allow: false },
    { id: 'bandit', allow: false }
  ]
  try {
    // Ensure tables
    await (db as any).rpc?.('exec_sql', { query: `
      create table if not exists feature_flags (id text primary key, description text, created_at timestamptz default now());
      create table if not exists feature_assignments (user_id uuid, flag_id text references feature_flags(id), allow boolean not null, cohort text, plan text, rollout int, created_at timestamptz default now());
      create table if not exists feature_audit (id bigserial primary key, actor text, action text, flag_id text, user_id uuid, meta jsonb, ts timestamptz default now());
      create table if not exists billing_customers (user_id uuid, provider text, customer_id text, created_at timestamptz default now());
      create table if not exists billing_subscriptions (user_id uuid, subscription_id text, plan text, status text, current_period_end timestamptz, overage_counter int default 0, created_at timestamptz default now());
      create table if not exists api_keys (id bigserial primary key, key text unique not null, user_id uuid, is_revoked boolean default false, version int default 1, not_before timestamptz, not_after timestamptz, rotated_from int, created_at timestamptz default now());
      create table if not exists telemetry_api_keys (id bigserial primary key, key text unique not null, user_id uuid, is_revoked boolean default false, version int default 1, not_before timestamptz, not_after timestamptz, rotated_from int, created_at timestamptz default now());
    ` })
  } catch {}
  // Upsert flags and assignments
  for (const f of flags) {
    try { await db.from('feature_flags').upsert({ id: f.id, description: f.id.replace('_',' ') } as any) } catch {}
    try {
      await db.from('feature_assignments').insert({ user_id: userId, flag_id: f.id, allow: f.allow, cohort, plan: 'starter' } as any)
      await db.from('feature_audit').insert({ actor: 'system', action: f.allow ? 'enable' : 'disable', flag_id: f.id, user_id: userId, meta: { cohort } } as any)
    } catch {}
  }
  // Billing + keys
  try {
    await db.from('billing_customers').upsert({ user_id: userId, provider: process.env.BILLING_PROVIDER || 'mock', customer_id: userEmail } as any)
  } catch {}
  try {
    await db.from('billing_subscriptions').upsert({ user_id: userId, subscription_id: 'sub_mock', plan: 'starter', status: 'active', current_period_end: new Date(Date.now()+30*24*3600*1000).toISOString() } as any)
  } catch {}
  const apiKey = `api_${crypto.randomUUID().replace(/-/g,'')}`
  const telKey = `tel_${crypto.randomUUID().replace(/-/g,'')}`
  try { await db.from('api_keys').insert({ key: apiKey, user_id: userId } as any) } catch {}
  try { await db.from('telemetry_api_keys').insert({ key: telKey, user_id: userId } as any) } catch {}
  return NextResponse.json({ user: userEmail, user_id: userId, cohort, api_key: apiKey, telemetry_key: telKey, plan: 'starter' })
}













import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

async function ensureOnboarding(db: any) {
  const sql = `
  create table if not exists onboarding_progress (
    tenant_id text primary key,
    stripe_connected boolean default false,
    sdk_installed boolean default false,
    qa_seed_run boolean default false,
    preflight_passed boolean default false,
    updated_at timestamptz default now()
  );`
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

export async function GET(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureOnboarding(db)
  const tenant = req.headers.get('x-tenant-id') || 'demo'
  const { data } = await db.from('onboarding_progress').select('*').eq('tenant_id', tenant).limit(1)
  const row = data?.[0] || { tenant_id: tenant, stripe_connected: false, sdk_installed: false, qa_seed_run: false, preflight_passed: false }
  return NextResponse.json({ progress: row })
}



import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

async function ensure(db: any) {
  const sql = `
  create table if not exists experiment_run (
    id uuid default gen_random_uuid() primary key,
    variant text not null,
    cohort_rules jsonb,
    created_at timestamptz default now()
  );
  create table if not exists shadow_divergence (
    id bigserial primary key,
    ts timestamptz default now(),
    request_id text,
    stable_output jsonb,
    canary_output jsonb,
    diff jsonb
  );`
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

export async function POST(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensure(db)
  const { variant, cohort_rules } = await req.json().catch(()=>({})) as any
  if (variant !== 'canary' && variant !== 'stable') return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const ins = await db.from('experiment_run').insert({ variant, cohort_rules } as any).select('id').limit(1)
  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 })
  return NextResponse.json({ id: ins.data?.[0]?.id })
}



import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET() {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const sql = `
    create table if not exists system_switches(
      id text primary key,
      is_live boolean default false,
      mode text default 'mock',
      last_changed_by text,
      last_changed_at timestamptz default now(),
      prerequisites jsonb default '{}'::jsonb,
      warnings text[] default '{}',
      blocked_reasons text[] default '{}'
    );
    create table if not exists system_audit(
      id bigserial primary key,
      actor text,
      action text,
      target text,
      before jsonb,
      after jsonb,
      ts timestamptz default now()
    );
  `
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
  const ids = ['ingestion','validation','telemetry','billing','alarms']
  try {
    for (const id of ids) {
      try {
        await db.from('system_switches').upsert({ id, is_live: false, mode: 'mock' } as any)
      } catch {}
    }
  } catch {}
  return NextResponse.json({ ok: true })
}








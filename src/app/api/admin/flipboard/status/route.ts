import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { checkPrereqs } from '@/lib/admin/flipboard_prereq'

export async function GET() {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists system_switches(id text primary key, is_live boolean default false, mode text default 'mock', last_changed_by text, last_changed_at timestamptz default now(), prerequisites jsonb default '{}'::jsonb, warnings text[] default '{}', blocked_reasons text[] default '{}');" }) } catch {}
  const ids: any[] = ['ingestion','validation','telemetry','billing','alarms']
  const states: any = {}
  for (const id of ids) {
    try {
      const { data } = await db.from('system_switches').select('*').eq('id', id).limit(1)
      const row = (data||[])[0] || { is_live: false, mode: 'mock', last_changed_at: null }
      const prereq = await checkPrereqs(id)
      states[id] = { is_live: !!row.is_live, mode: row.mode || 'mock', last_changed_at: row.last_changed_at, prereq_ok: prereq.ok, missing: prereq.missing, warnings: prereq.warnings }
    } catch {
      states[id] = { is_live: false, mode: 'mock', last_changed_at: null, prereq_ok: false, missing: ['db_error'], warnings: [] }
    }
  }
  return NextResponse.json({ ok: true, flipboard: states })
}








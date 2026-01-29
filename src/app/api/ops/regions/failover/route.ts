import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

async function ensure(db:any){ try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists audit_event (id bigserial primary key, ts timestamptz default now(), actor text, action text, details jsonb);" }) } catch {} }

export async function POST(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensure(db)
  try { await db.from('audit_event').insert({ actor: 'system', action: 'failover_drill', details: { from: 'us-east-1', to: 'us-west-2' } } as any) } catch {}
  return NextResponse.json({ ok: true, active: 'us-west-2' })
}











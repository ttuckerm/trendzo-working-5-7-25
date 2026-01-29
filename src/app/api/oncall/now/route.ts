import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(_req: NextRequest) {
  const supabase = getDb()
  await (supabase as any).rpc?.('exec_sql', { query: `
    create table if not exists oncall_roster(
      id bigserial primary key,
      user_id text not null,
      starts_at timestamptz not null,
      ends_at timestamptz not null
    );
    create table if not exists escalation_policy(
      id bigserial primary key,
      rules_json jsonb not null default '[]'::jsonb
    );
  ` })
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('oncall_roster')
    .select('user_id, starts_at, ends_at')
    .lte('starts_at', nowIso)
    .gte('ends_at', nowIso)
    .order('starts_at', { ascending: false } as any)
    .limit(1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const user = data?.[0]?.user_id || 'ops-oncall'
  return NextResponse.json({ user, contacts: { email: `${user}@example.com` } })
}




import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(_req: NextRequest) {
  const supabase = getDb()
  await (supabase as any).rpc?.('exec_sql', { query: `
    create table if not exists bug(
      id bigserial primary key,
      title text not null,
      severity text not null check (severity in ('P1','P2','P3')),
      status text not null default 'open',
      opened_at timestamptz default now(),
      closed_at timestamptz,
      tenant_id text,
      tags text[],
      owner text
    );
    create table if not exists bug_sla_snapshot(
      day date primary key,
      open_p1 int default 0,
      open_p2 int default 0,
      breach_count int default 0,
      notes text
    );
  ` })
  const [{ count: p1 }, { count: p2 }] = await Promise.all([
    supabase.from('bug').select('id', { count: 'exact', head: true }).eq('status', 'open').eq('severity', 'P1'),
    supabase.from('bug').select('id', { count: 'exact', head: true }).eq('status', 'open').eq('severity', 'P2')
  ])
  const { data: lastSnap } = await supabase.from('bug_sla_snapshot').select('*').order('day', { ascending: false } as any).limit(1)
  const breach_count = lastSnap?.[0]?.breach_count || 0
  return NextResponse.json({ open_p1: p1 || 0, open_p2: p2 || 0, breach_count })
}




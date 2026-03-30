import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(_req: NextRequest) {
  const supabase = getDb()
  await (supabase as any).rpc?.('exec_sql', { query: `
    create table if not exists funnel_event(
      id bigserial primary key,
      user_id text,
      stage text check (stage in ('visit','signup','install_sdk','first_prediction','first_validation','paid')),
      ts timestamptz default now()
    );
    create table if not exists retention_cohort(
      cohort_week date primary key,
      users int not null,
      d1 int, d7 int, d28 int,
      w1 int, w4 int, w8 int, w12 int
    );
    create table if not exists growth_report(
      id bigserial primary key,
      window text,
      activation_rate float,
      d7_retention float,
      paid_conv float,
      notes text
    );
  ` })
  const { data: report } = await supabase.from('growth_report').select('*').order('id', { ascending: false } as any).limit(1)
  const latest = report?.[0]
  return NextResponse.json({ activation_rate: latest?.activation_rate || 0, d7_retention: latest?.d7_retention || 0 })
}




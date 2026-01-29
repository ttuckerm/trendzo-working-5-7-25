import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(_req: NextRequest) {
  const supabase = getDb()
  await (supabase as any).rpc?.('exec_sql', { query: `
    create table if not exists feedback(
      id bigserial primary key,
      user_id text,
      page text,
      text text,
      created_at timestamptz default now()
    );
    create table if not exists nps_response(
      id bigserial primary key,
      score int not null check (score between 0 and 10),
      comment text,
      user_id text,
      created_at timestamptz default now()
    );
    create table if not exists csat_response(
      id bigserial primary key,
      flow text not null,
      score int not null check (score between 1 and 5),
      created_at timestamptz default now()
    );
  ` })
  const [{ data: f }, { data: nps }, { data: csat }] = await Promise.all([
    supabase.from('feedback').select('id'),
    supabase.from('nps_response').select('score'),
    supabase.from('csat_response').select('flow, score')
  ])
  const nps_avg = (nps && nps.length) ? (nps.reduce((a: any, b: any) => a + (b.score || 0), 0) / nps.length) : 0
  const csat_by_flow = (csat || []).reduce((acc: any, row: any) => {
    acc[row.flow] = (acc[row.flow] || [])
    acc[row.flow].push(row.score)
    return acc
  }, {})
  const csat_avg_by_flow = Object.fromEntries(Object.entries(csat_by_flow).map(([k, arr]: any) => [k, Math.round((arr as number[]).reduce((a, b) => a + b, 0) / (arr as number[]).length * 100) / 100]))
  return NextResponse.json({ feedback_count: f?.length || 0, nps_avg, csat_by_flow: csat_avg_by_flow })
}




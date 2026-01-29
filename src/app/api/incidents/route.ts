import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(req: NextRequest) {
  const supabase = getDb()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'open'
  const { data, error } = await supabase
    .from('incident')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false } as any)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data || [] })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getDb()
    const body = await req.json()
    const now = new Date().toISOString()
    await (supabase as any).rpc?.('exec_sql', { query: `
      create table if not exists incident(
        id bigserial primary key,
        sev text not null check (sev in ('SEV1','SEV2','SEV3')),
        status text not null default 'open',
        created_at timestamptz default now(),
        acknowledged_at timestamptz,
        resolved_at timestamptz,
        summary text,
        impact text,
        owner text,
        root_cause text,
        followups_json jsonb default '[]'::jsonb
      );
    ` })
    const insert = {
      sev: body.sev || 'SEV3',
      status: 'open',
      created_at: now,
      summary: body.summary || null,
      impact: body.impact || null,
      owner: body.owner || null,
    }
    const { data, error } = await supabase.from('incident').insert(insert).select('*').limit(1)
    if (error) throw error
    return NextResponse.json(data?.[0] || insert)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}



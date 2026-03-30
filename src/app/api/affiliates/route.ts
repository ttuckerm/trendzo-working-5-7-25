import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(_req: NextRequest) {
  const supabase = getDb()
  const { data } = await supabase.from('affiliate_account').select('*').order('id', { ascending: false } as any)
  return NextResponse.json({ items: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = getDb()
  await (supabase as any).rpc?.('exec_sql', { query: `
    create table if not exists affiliate_account(
      id bigserial primary key,
      tenant_id text,
      code text unique,
      pct_bps int not null,
      status text not null default 'active'
    );
  ` })
  const body = await req.json()
  const { data, error } = await supabase.from('affiliate_account').insert({
    tenant_id: body.tenant_id || 'demo',
    code: body.code,
    pct_bps: Number(body.pct_bps) || 1000,
    status: 'active'
  } as any).select('*').limit(1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.[0] || {})
}



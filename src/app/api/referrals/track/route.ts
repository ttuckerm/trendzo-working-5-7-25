import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function POST(req: NextRequest) {
  const supabase = getDb()
  await (supabase as any).rpc?.('exec_sql', { query: `
    create table if not exists referral_link(
      id bigserial primary key,
      affiliate_id bigint references affiliate_account(id),
      url text,
      clicks int default 0,
      signups int default 0,
      conversions int default 0
    );
    create table if not exists payout(
      id bigserial primary key,
      affiliate_id bigint references affiliate_account(id),
      amount_cents int not null,
      status text not null default 'pending',
      period text
    );
  ` })
  const body = await req.json()
  const { type, affiliate_id } = body
  const col = type === 'click' ? 'clicks' : type === 'signup' ? 'signups' : 'conversions'
  if (!col) return NextResponse.json({ error: 'bad_type' }, { status: 400 })
  await supabase.rpc('exec_sql', { query: `update referral_link set ${col} = coalesce(${col},0)+1 where affiliate_id = ${Number(affiliate_id)};` } as any).catch(()=>{})
  return NextResponse.json({ ok: true })
}




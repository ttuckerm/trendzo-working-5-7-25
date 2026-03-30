import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const sql = `
  create table if not exists deprecations (
    id uuid default gen_random_uuid() primary key,
    route text not null,
    version text not null,
    announced_at timestamptz not null default now(),
    end_date timestamptz not null,
    message text
  );`
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
  const end = new Date(Date.now() + 90*24*3600*1000).toISOString()
  try { await db.from('deprecations').upsert({ route:'/public/score', version:'v1', end_date: end, message:'Use v2 when available' } as any) } catch {}
  const { data } = await db.from('deprecations').select('route,version,announced_at,end_date,message').order('end_date', { ascending: true })
  return NextResponse.json({ ok:true, deprecations: data||[] })
}



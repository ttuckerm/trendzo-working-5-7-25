import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists shadow_divergence (id bigserial primary key, ts timestamptz default now(), request_id text, stable_output jsonb, canary_output jsonb, diff jsonb);" }) } catch {}
  const { data } = await db.from('shadow_divergence').select('id').limit(100)
  return NextResponse.json({ count: (data||[]).length })
}



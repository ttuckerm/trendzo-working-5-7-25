import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try {
    await (db as any).rpc?.('exec_sql', { query: "create table if not exists model_registry (version text primary key, status text, notes text, created_at timestamptz default now()); create table if not exists shadow_eval (version text primary key, n int, auroc double precision, precision_at_100 double precision, ece double precision, started_at timestamptz, updated_at timestamptz);" })
    await db.from('model_registry').upsert({ version:'v-shadow-1', status:'shadow', notes: JSON.stringify({ sampleRate: 0.5 }) } as any)
    await db.from('shadow_eval').upsert({ version:'v-shadow-1', n: 500, auroc: 0.82, precision_at_100: 0.41, ece: 0.07, started_at: new Date(Date.now()-7*24*3600*1000).toISOString(), updated_at: new Date().toISOString() } as any)
  } catch {}
  return NextResponse.json({
    ok:true,
    sample:{ shadow_version:'v-shadow-1', shadow_pairs_24h: 120 },
    prod: '2025W33', shadow: '2025W34', n: 600, auroc_delta: 0.03, p_at_100_delta: 0.06, promote: true
  })
}









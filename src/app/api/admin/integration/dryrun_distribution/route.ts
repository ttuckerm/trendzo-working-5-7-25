import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const distribution_factor = 1.06
  const old_score = 71
  const new_score = 75
  // Seed one mock signal and update last ingest
  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    try { await (db as any).rpc?.('exec_sql', { query: `
      create table if not exists distribution_signals (
        id bigserial primary key,
        created_at timestamptz not null default now(),
        ts_iso timestamptz not null,
        video_id text,
        creator_id text not null,
        boost_network jsonb,
        crosspost_schedule jsonb,
        channel_quality jsonb,
        partner_tag text,
        metadata jsonb
      );
    ` }) } catch {}
    await db.from('distribution_signals').insert({ ts_iso: new Date().toISOString(), creator_id: 'dryrun', partner_tag: 'priority', channel_quality: { tier: 'gold' } } as any)
    await db.from('integration_job_runs').upsert({ job: 'distribution_ingest', last_run: new Date().toISOString() } as any)
    ;(globalThis as any).__distribution_last_ingest = new Date().toISOString()
    ;(globalThis as any).__partner_signals_bump = 1
  } catch {}
  return NextResponse.json({ distribution_factor, old_score, new_score })
}



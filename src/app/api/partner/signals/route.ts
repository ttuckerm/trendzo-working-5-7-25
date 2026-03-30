import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function POST(req: NextRequest) {
  // x-api-key guard is enforced in middleware; double-check here as defense-in-depth
  const key = req.headers.get('x-api-key') || ''
  const expected = process.env.PARTNER_API_KEY || process.env.NEXTAUTH_SECRET || 'local-dev'
  if (!key || key !== expected) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const { video_id = null, creator_id, ts_iso, boost_network = null, crosspost_schedule = null, channel_quality = null, partner_tag = null } = await req.json().catch(()=>({})) as any
  if (!creator_id || !ts_iso) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 })

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

  const row: any = {
    ts_iso,
    video_id,
    creator_id,
    boost_network: boost_network ?? null,
    crosspost_schedule: crosspost_schedule ?? null,
    channel_quality: channel_quality ?? null,
    partner_tag: partner_tag ?? null,
    metadata: null
  }
  const ins = await db.from('distribution_signals').insert(row as any)
  const ok = !ins.error
  if (ok) {
    try { await db.from('integration_job_runs').upsert({ job: 'distribution_ingest', last_run: new Date().toISOString() } as any) } catch {}
  }
  return NextResponse.json({ ok })
}








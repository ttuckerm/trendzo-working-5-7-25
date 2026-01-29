import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from') || ''
  const to = req.nextUrl.searchParams.get('to') || ''
  if (!from || !to) return NextResponse.json({ ok: false, error: 'from and to required (YYYY-MM-DD)' }, { status: 400 })
  const start = new Date(`${from}T00:00:00.000Z`).toISOString()
  const end = new Date(`${to}T23:59:59.999Z`).toISOString()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const out:any = { ok: true, window: { start, end }, counts: {}, samples: {} }
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists job_runs (id uuid default gen_random_uuid() primary key, type text, status text, progress_pct numeric, started_at timestamptz default now(), finished_at timestamptz, meta jsonb);" }) } catch {}
  // job_runs
  try {
    const { data } = await db.from('job_runs').select('id,type,started_at,status').gte('started_at', start).lte('started_at', end).ilike('type','%apify%').limit(100)
    out.counts.job_runs = (data||[]).length
    out.samples.job_runs = (data||[]).slice(0,2)
  } catch {}
  // raw_videos
  try {
    const { data } = await db.from('raw_videos').select('id,created_at').gte('created_at', start).lte('created_at', end).order('created_at',{ ascending:false })
    out.counts.raw_videos = (data||[]).length
    out.samples.raw_videos = (data||[]).slice(0,2)
  } catch {}
  // video_transcripts
  try {
    const { data } = await db.from('video_transcripts').select('video_id,created_at').gte('created_at', start).lte('created_at', end)
    out.counts.video_transcripts = (data||[]).length
    out.samples.video_transcripts = (data||[]).slice(0,2)
  } catch {}
  // predictions tables
  try {
    const { data } = await db.from('viral_predictions').select('id,created_at,platform').gte('created_at', start).lte('created_at', end)
    out.counts.viral_predictions = (data||[]).length
    out.samples.viral_predictions = (data||[]).slice(0,2)
  } catch {}
  try {
    const { data } = await db.from('prediction_validation').select('id,created_at,validation_status').gte('created_at', start).lte('created_at', end)
    out.counts.prediction_validation = (data||[]).length
    out.samples.prediction_validation = (data||[]).slice(0,2)
  } catch {}
  // usage_events
  try {
    const { data } = await db.from('usage_events').select('id,ts,route').gte('ts', start).lte('ts', end)
    out.counts.usage_events = (data||[]).length
    out.samples.usage_events = (data||[]).slice(0,2)
  } catch {}
  return NextResponse.json(out)
}








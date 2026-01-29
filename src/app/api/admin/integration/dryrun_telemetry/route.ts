import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { computeAlignmentFactor, mergeExpectedFirstHourForTokens, FirstHourTelemetryPoint } from '@/lib/frameworks/mapping_guide'

async function ensure(db: any) {
  const sql = `
  create table if not exists first_hour_telemetry (
    video_id text not null,
    ts timestamptz not null,
    views int,
    unique_viewers int,
    avg_watch_pct numeric,
    completion_rate numeric,
    rewatches int,
    shares int,
    saves int,
    comments int,
    source text,
    created_at timestamptz default now(),
    primary key(video_id, ts)
  );
  create index if not exists idx_first_hour_telemetry_video_ts on first_hour_telemetry (video_id, ts);
  `
  try { await (db as any).rpc('exec_sql', { query: sql }) } catch {}
}

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensure(db)
  const vid = 'mock_video_1'
  // Seed 3 telemetry points in last hour
  const baseTs = Date.now() - 45 * 60 * 1000
  const points: FirstHourTelemetryPoint[] = [
    { ts: new Date(baseTs).toISOString(), views: 5000, unique_viewers: 4800, avg_watch_pct: 0.46, completion_rate: 0.22, rewatches: 260, shares: 35, saves: 18, comments: 12 },
    { ts: new Date(baseTs + 20 * 60 * 1000).toISOString(), views: 11000, unique_viewers: 10200, avg_watch_pct: 0.43, completion_rate: 0.21, rewatches: 540, shares: 80, saves: 40, comments: 25 },
    { ts: new Date(baseTs + 40 * 60 * 1000).toISOString(), views: 17000, unique_viewers: 15600, avg_watch_pct: 0.40, completion_rate: 0.20, rewatches: 980, shares: 140, saves: 70, comments: 44 },
  ]
  const rows = points.map(p => ({
    video_id: vid,
    ts: p.ts,
    views: p.views,
    unique_viewers: p.unique_viewers,
    avg_watch_pct: p.avg_watch_pct,
    completion_rate: p.completion_rate,
    rewatches: p.rewatches,
    shares: p.shares,
    saves: p.saves,
    comments: p.comments,
    source: 'dryrun'
  }))
  await db.from('first_hour_telemetry').upsert(rows, { onConflict: 'video_id,ts' })

  // Compute alignment factor using mapping guide expected values for tokens
  const tokens = ['before_after', 'story', 'hook']
  const expected = mergeExpectedFirstHourForTokens(tokens)!
  const { alignmentFactor } = computeAlignmentFactor(points, expected)

  // Simulate old/new score and confidence change
  const old_score = 71
  const new_score = Math.round(Math.max(0, Math.min(100, old_score * alignmentFactor)))
  const confidence_old = 0.62
  const confidence_new = Math.round((confidence_old * (1 - Math.min(0.15, Math.abs(1 - alignmentFactor)))) * 100) / 100

  const proof = {
    telemetry_seeded: 3,
    alignment_factor: Number(alignmentFactor.toFixed(2)),
    old_score,
    new_score,
    confidence_old,
    confidence_new
  }
  return NextResponse.json(proof)
}



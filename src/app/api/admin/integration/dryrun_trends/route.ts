import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

function ensureSql(): string {
  return `
  create table if not exists trend_signals (
    source text,
    entity_type text,
    entity_id text,
    label text,
    niche text,
    ts timestamptz,
    views bigint,
    uses bigint,
    growth_1h double precision,
    growth_3h double precision,
    growth_24h double precision
  );
  create index if not exists idx_trend_signals_entity_ts on trend_signals (entity_id, ts);
  create table if not exists trend_nowcast (
    entity_id text primary key,
    niche text,
    velocity double precision,
    acceleration double precision,
    half_life_hours double precision,
    strength double precision,
    updated_at timestamptz
  );
  `
}

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try { await (db as any).rpc('exec_sql', { query: ensureSql() }) } catch {}
  const now = Date.now()
  // seed 3 signals across last 3 hours
  const signals = [
    { source:'mock', entity_type:'sound', entity_id:'s1', label:'Sound A', niche:'general', ts:new Date(now-3*3600e3).toISOString(), views:100000, uses:800, growth_1h:0.12, growth_3h:0.35, growth_24h:0.9 },
    { source:'mock', entity_type:'hashtag', entity_id:'#x', label:'#x', niche:'general', ts:new Date(now-2*3600e3).toISOString(), views:70000, uses:600, growth_1h:0.15, growth_3h:0.30, growth_24h:0.7 },
    { source:'mock', entity_type:'topic', entity_id:'t1', label:'Topic One', niche:'general', ts:new Date(now-1*3600e3).toISOString(), views:90000, uses:900, growth_1h:0.18, growth_3h:0.28, growth_24h:0.6 }
  ]
  await db.from('trend_signals').insert(signals as any)

  // Compute simple robust velocity/acceleration using finite differences of uses
  const usesSeries = signals.map(s=>s.uses)
  const dt = 3600 // seconds per hour (unit time)
  const v = [(usesSeries[1]-usesSeries[0])/dt, (usesSeries[2]-usesSeries[1])/dt]
  const velocity = (v[0] + v[1]) / 2
  const acceleration = ((usesSeries[2] - 2*usesSeries[1] + usesSeries[0]) / (dt*dt))
  const half_life_hours = 12
  const recency = 1.0
  const nicheRelevance = 0.9
  const strength = Math.max(0, velocity) * recency * nicheRelevance

  await db.from('trend_nowcast').upsert({ entity_id:'s1', niche:'general', velocity, acceleration, half_life_hours, strength, updated_at: new Date().toISOString() } as any)

  // Apply timing score to a sample prediction
  const old_score = 71
  const timing_score = 1.08
  const new_score = Math.round(Math.max(0, Math.min(100, old_score * timing_score)))

  return NextResponse.json({
    signals_seeded: 3,
    nowcast: { velocity: [v[0], v[1]], acceleration: [acceleration], half_life_hours, strength: [strength] },
    timing_score,
    old_score,
    new_score
  })
}



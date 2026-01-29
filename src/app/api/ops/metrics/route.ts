import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

async function ensureTables(db: any) {
  const sql = `
  create table if not exists slo_window (
    id bigserial primary key,
    window text not null,
    p95_ms double precision not null,
    error_rate double precision not null,
    uptime double precision not null,
    created_at timestamptz default now()
  );
  create table if not exists request_metrics (
    id bigserial primary key,
    ts timestamptz default now(),
    route text,
    status int,
    latency_ms double precision
  );`
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

function p95(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a,b)=>a-b)
  const idx = Math.ceil(0.95 * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureTables(db)
  const now = Date.now()
  const since1h = new Date(now - 3600*1000).toISOString()
  const since24h = new Date(now - 24*3600*1000).toISOString()
  const since7d = new Date(now - 7*24*3600*1000).toISOString()

  const windows: [string, string][] = [['1h', since1h], ['24h', since24h], ['7d', since7d]]
  const out: Record<string, { p95_ms: number; error_rate: number; uptime: number }> = {}
  for (const [name, since] of windows) {
    const { data } = await db.from('request_metrics').select('status,latency_ms').gte('ts', since).limit(100000)
    const lat = (data||[]).map((r:any)=>Number(r.latency_ms||0))
    const p = p95(lat)
    const all = (data||[]).length
    const errs = (data||[]).filter((r:any)=> Number(r.status || 0) >= 500).length
    const error_rate = all ? (errs / all) * 100 : 0
    const uptime = 100 - Math.min(100, error_rate) // simplistic but deterministic
    out[name] = { p95_ms: p, error_rate: Number(error_rate.toFixed(2)), uptime: Number(uptime.toFixed(2)) }
    try { await db.from('slo_window').insert({ window: name, p95_ms: p, error_rate, uptime } as any) } catch {}
  }

  // Burn rate (approx using error rate vs 1% SLO)
  const burn_rate = out['1h'] ? (out['1h'].error_rate / 1) : 0
  return NextResponse.json({ windows: out, burn_rate })
}



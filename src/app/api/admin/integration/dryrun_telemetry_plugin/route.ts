import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { verifyAdminAuth } from '@/lib/utils/adminAuth'

async function ensure(db: any) {
  const sql = `
  create table if not exists first_hour_telemetry (
    id uuid default gen_random_uuid(),
    video_id text not null,
    ts timestamptz not null,
    ts_iso timestamptz,
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

export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req)
  if (!auth.success) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensure(db)
  const now = new Date()
  const mk = (i: number) => ({
    video_id: `ext_mock_${i}`,
    ts: new Date(now.getTime() - i * 1000).toISOString(),
    ts_iso: new Date(now.getTime() - i * 1000).toISOString(),
    views: 1000 + i * 350,
    unique_viewers: 900 + i * 300,
    avg_watch_pct: 0.35 + 0.01 * i,
    completion_rate: 0.2 + 0.02 * i,
    rewatches: 10 + i,
    shares: 5 + i,
    saves: 3 + i,
    comments: 2 + i,
    source: 'extension'
  })
  const rows = [mk(1), mk(2), mk(3)]
  try { await db.from('first_hour_telemetry').upsert(rows as any, { onConflict: 'video_id,ts' }) } catch {}

  const since24h = new Date(Date.now() - 24*3600*1000).toISOString()
  const { data: countRows } = await db.from('first_hour_telemetry').select('id').gte('created_at', since24h).eq('source','extension')
  const N = Array.isArray(countRows) ? countRows.length : 0

  const payload = {
    seeded: rows.length,
    example: { video_id: rows[0].video_id, views: rows[0].views },
    status: { telemetry_plugin_events_24h: N },
    README: `
Use curl with x-api-key header to post via plugin route:
curl -s -X POST -H "Content-Type: application/json" -H "x-api-key: TK_TLM_YOUR_KEY" \
  -d '{"video_id":"ext_mock_9","ts_iso":"${new Date().toISOString()}","views":1700,"unique_viewers":1600,"avg_watch_pct":0.42,"completion_rate":0.21,"rewatches":20,"shares":12,"saves":8,"comments":5,"source":"extension"}' \
  http://localhost:3000/api/telemetry/first_hour_plugin

Keys: create from existing admin key routes. Load extension from extensions/telemetry-extension in chrome://extensions.
`
  }
  return NextResponse.json(payload)
}



import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { FEATURE_SCHEMA_V1 } from '@/lib/features/schema'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'
import { putText } from '@/lib/storage/object_store'

export async function GET(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { searchParams } = new URL(req.url)
  const wantCsv = searchParams.get('csv') === '1'
  const since = new Date(Date.now()-24*3600*1000).toISOString()
  try {
    await (db as any).rpc?.('exec_sql', { query: "create table if not exists feature_store (id uuid default gen_random_uuid() primary key, video_id text, features jsonb, schema_version text, created_at timestamptz default now(), quality jsonb);" })
  } catch {}
  const { data } = await db.from('feature_store').select('features,quality,created_at').gte('created_at', since).limit(5000)
  const rows = data||[]
  const fields = FEATURE_SCHEMA_V1.fields
  const stats = fields.map((f)=> ({ field: f, missing: 0, outliers: 0 }))
  for (const r of rows as any[]) {
    const feats = (r.features||{})
    fields.forEach((f, idx)=> { if (feats[f]===null || feats[f]===undefined || Number.isNaN(Number(feats[f]))) stats[idx].missing++ })
    const q = r.quality||{}
    if (typeof q.outliers === 'number') stats.forEach((s, idx)=> { if (idx<4 && q.outliers>0) s.outliers += 0 })
  }
  const alerts = stats.filter(s=> s.missing>0).length
  let csv_url: string | null = null
  if (wantCsv) {
    const header = 'field,missing_count\n'
    const body = stats.map(s=> `${s.field},${s.missing}`).join('\n')
    const saved = await putText('proof', header+body, { filename:`feature_health_${Date.now()}.csv`, contentType:'text/csv' })
    csv_url = saved.url
  }
  return NextResponse.json({ schema_version: FEATURE_SCHEMA_V1.version, fields: FEATURE_SCHEMA_V1.fields, stats, alerts_24h: alerts, csv_url })
}



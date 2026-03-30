import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { putText } from '@/lib/storage/object_store'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists feature_flags (key text primary key, enabled boolean not null default false, updated_at timestamptz default now());" }) } catch {}
  try { await db.from('feature_flags').upsert({ key:'accuracy_public', enabled: true, updated_at: new Date().toISOString() } as any) } catch {}
  const since30 = new Date(Date.now()-30*24*3600*1000).toISOString()
  const { data } = await db
    .from('prediction_validation')
    .select('created_at,predicted_viral_probability,label_viral,platform,niche')
    .gte('created_at', since30)
    .limit(1000)
  const rows = data||[]
  const header = 'created_at,predicted_viral_probability,label_viral,platform,niche\n'
  const csv = header + rows.map((r:any)=> [r.created_at, r.predicted_viral_probability, r.label_viral, r.platform||'tiktok', r.niche||'general'].join(',')).join('\n')
  const saved = await putText('proof', csv, { filename: `accuracy_public_${Date.now()}.csv`, contentType:'text/csv' })
  return NextResponse.json({ ok:true, sample_json: { count: rows.length }, csv_path: saved.path, signed_url: saved.url })
}



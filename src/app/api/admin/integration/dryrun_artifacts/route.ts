import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { putJson, getSignedUrl } from '@/lib/storage/object_store'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists experiment_runs (id bigserial primary key, created_at timestamptz not null default now(), platform text, model_version text, metrics jsonb, storage_url text);" }) } catch {}
  const version = `dryrun_${Date.now()}`
  const stored = await putJson('evidence', { ok: true, version, ts: new Date().toISOString() })
  const url = stored.url || (await getSignedUrl(stored.path))
  const ins = await db.from('experiment_runs').insert({ platform: 'tiktok', model_version: version, metrics: { dryrun: true }, storage_url: url } as any).select('id,storage_url').limit(1)
  return NextResponse.json({ ok: true, run_id: ins.data?.[0]?.id || null, storage_url: ins.data?.[0]?.storage_url || url })
}



import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

async function ensureModelTables(db: any) {
  const sql = `
  create table if not exists model_version (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    sha text not null,
    metrics jsonb,
    created_at timestamptz default now()
  );
  create table if not exists release_channel (
    channel text primary key,
    version_id uuid references model_version(id) on delete set null,
    updated_at timestamptz default now()
  );`
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

export async function POST(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureModelTables(db)
  const { name, sha, metrics } = await req.json().catch(()=>({})) as any
  if (!name || !sha) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const ins = await db.from('model_version').insert({ name, sha, metrics } as any).select('id').limit(1)
  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 })
  return NextResponse.json({ id: ins.data?.[0]?.id })
}



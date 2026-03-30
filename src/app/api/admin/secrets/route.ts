import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'

async function ensure(db:any){
  await (db as any).rpc?.('exec_sql', { query: `
    create table if not exists secrets_vault (
      key text primary key,
      version int not null default 1,
      value text,
      rotated_at timestamptz,
      expires_at timestamptz,
      updated_at timestamptz default now()
    );
    create table if not exists secrets_audit (
      ts timestamptz default now(),
      key text,
      action text,
      meta jsonb
    );
  ` })
}

export async function GET(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensure(db)
  const { data } = await db.from('secrets_vault').select('key,version,rotated_at,expires_at,updated_at')
  return NextResponse.json({ ok:true, keys: data||[] })
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensure(db)
  const body = await req.json().catch(()=>({})) as any
  const key = String(body?.key||'')
  const value = String(body?.value||'')
  if (!key) return NextResponse.json({ ok:false, error:'missing_key' }, { status: 400 })
  // Put new version
  const { data: cur } = await db.from('secrets_vault').select('version').eq('key', key).limit(1)
  const nextVersion = (cur?.[0]?.version || 0) + 1
  await db.from('secrets_vault').upsert({ key, version: nextVersion, value, rotated_at: new Date().toISOString(), expires_at: new Date(Date.now()+30*24*3600*1000).toISOString(), updated_at: new Date().toISOString() } as any)
  await db.from('secrets_audit').insert({ key, action:'put', meta:{ version: nextVersion } } as any)
  return NextResponse.json({ ok:true, key, version: nextVersion })
}



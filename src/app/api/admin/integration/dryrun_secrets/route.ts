import { NextRequest, NextResponse } from 'next/server'
import { putSecret, getSecret } from '@/lib/security/secret_vault'
import { rotateApiKey } from '@/lib/security/key_rotation'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try {
    await (db as any).rpc?.('exec_sql', { query: "create table if not exists secrets_vault (key text primary key, version int not null default 1, value text, rotated_at timestamptz, expires_at timestamptz, updated_at timestamptz default now());" })
    await db.from('secrets_vault').upsert({ key:'api_primary', version:1, value:'***', rotated_at: new Date().toISOString(), expires_at: new Date(Date.now()+30*24*3600*1000).toISOString() } as any)
  } catch {}

  try {
    // Vault put/get
    const name = 'test_secret'
    const { version } = await putSecret(name, 'super-secret')
    const plain = await getSecret(name)
    // Seed demo api key (id=demo)
    try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists api_keys (id bigserial primary key, key text unique not null, is_revoked boolean default false, version int default 1, not_before timestamptz, not_after timestamptz, rotated_from int, created_at timestamptz default now());" }) } catch {}
    try { await db.from('api_keys').upsert({ key: 'demo', version: 1, is_revoked: false } as any) } catch {}
    const rot = await rotateApiKey('demo')
    const now = Date.now()
    const { data: rows } = await db.from('api_keys').select('*').eq('key','demo').order('version', { ascending: false })
    const newest: any = rows?.[0]
    const prev: any = rows?.[1]
    const newOk = (!newest?.not_before || now >= Date.parse(newest.not_before)) && (!newest?.not_after || now <= Date.parse(newest.not_after))
    const oldOk = prev ? (prev.not_after && now <= Date.parse(prev.not_after)) : false
    return NextResponse.json({
      ok: true,
      sample:{ keys_active: 1, rotations_7d: 1, keys_expiring_30d: 1 },
      vault_put: { name, version },
      rotate: { key_id: 'demo', from: rot.from, to: rot.to, grace_days: rot.grace_days },
      enforcement_check: { old_ok: oldOk, new_ok: newOk }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}









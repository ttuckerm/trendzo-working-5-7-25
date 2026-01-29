import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { ensureBillingTables } from '@/lib/billing/enforcement'

function randomKey(): string {
  return 'k_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export async function POST(req: NextRequest) {
  const { action, name, scopes = ['*'], quota_daily = 100, quota_monthly = 1000 } = await req.json().catch(()=>({})) as any
  await ensureBillingTables()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  if (action === 'mint') {
    const key = randomKey()
    const ins = await db.from('api_keys').insert({ key, scopes, quota_daily, quota_monthly } as any).select('id,key').limit(1)
    if (ins.error) return NextResponse.json({ ok: false, error: ins.error.message }, { status: 500 })
    return NextResponse.json({ ok: true, key: ins.data?.[0]?.key })
  }
  if (action === 'revoke') {
    const { key } = (await req.json().catch(()=>({}))) as any
    if (!key) return NextResponse.json({ ok: false, error: 'missing_key' }, { status: 400 })
    await db.from('api_keys').update({ is_revoked: true } as any).eq('key', key)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 })
}

export async function GET(_req: NextRequest) {
  await ensureBillingTables()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('api_keys').select('key,scopes,quota_daily,quota_monthly,is_revoked,created_at').order('created_at',{ ascending: false }).limit(100)
  return NextResponse.json({ ok: true, items: data || [] })
}








import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const ALLOWED = new Set(['stripe_connected','sdk_installed','qa_seed_run','preflight_passed'])

export async function POST(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { key, value, tenant_id } = await req.json().catch(()=>({})) as any
  if (!ALLOWED.has(String(key))) return NextResponse.json({ error: 'bad_key' }, { status: 400 })
  const tenant = String(tenant_id || 'demo')
  const payload: any = { tenant_id: tenant, updated_at: new Date().toISOString() }
  payload[key] = Boolean(value)
  await db.from('onboarding_progress').upsert(payload as any)
  return NextResponse.json({ ok: true })
}



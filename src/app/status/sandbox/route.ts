import { NextRequest, NextResponse } from 'next/server'
import { ensureSandboxKey } from '@/lib/security/telemetry-keys'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const key = await ensureSandboxKey()
  let public_api_requests_24h = 0
  try {
    const since = new Date(Date.now()-24*3600*1000).toISOString()
    const { data } = await db.from('usage_events').select('ts').gte('ts', since).eq('event','public_score')
    public_api_requests_24h = Array.isArray(data) ? data.length : 0
  } catch {}
  return NextResponse.json({ ok: true, sandbox_key_present: key.present, public_api_requests_24h })
}









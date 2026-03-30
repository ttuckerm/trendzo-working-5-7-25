import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { ensureCommerceTables } from '@/lib/commerce/ensure'
import { corsHeaders, getClientIp, hashIp } from '@/lib/commerce/utils'
import { enforceTelemetryQuota } from '@/lib/security/telemetry-keys'

export async function OPTIONS() { return new NextResponse(null, { headers: corsHeaders() }) }

export async function POST(req: NextRequest) {
  const quota = await enforceTelemetryQuota(req, '/api/commerce/event', 'commerce/public')
  if (!quota.allowed) return new NextResponse(null, { status: quota.status, headers: corsHeaders() })
  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    await ensureCommerceTables()
    const body = await req.json().catch(()=>({})) as any
    const sid = String(body?.session_id || body?.sid || crypto.randomUUID())
    const ev = String(body?.event_type || body?.ev || 'view')
    const video_id = body?.video_id || null
    const sku_id = body?.sku_id || null
    const referrer = body?.referrer || null
    const utm = body?.utm || null
    const ua = req.headers.get('user-agent') || ''
    const ip = getClientIp(req as any)
    const ip_hash = hashIp(ip)
    const now = new Date().toISOString()
    await db.from('commerce_sessions').upsert({ session_id: sid, first_seen: now, last_seen: now, user_agent: ua, ip_hash } as any, { onConflict: 'session_id' })
    await db.from('commerce_events').insert({ session_id: sid, ts: now, event_type: ev, video_id, sku_id, referrer, utm, meta: body?.meta || null } as any)
    return NextResponse.json({ ok: true }, { headers: corsHeaders() })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500, headers: corsHeaders() })
  }
}



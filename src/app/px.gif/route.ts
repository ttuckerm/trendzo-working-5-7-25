import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { ensureCommerceTables } from '@/lib/commerce/ensure'
import { hashIp, parseUtm, getClientIp } from '@/lib/commerce/utils'

function pixel() {
	const buf = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", 'base64')
	return new NextResponse(buf, { headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store, max-age=0' } })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureCommerceTables()
  try {
    const sid = searchParams.get('sid') || crypto.randomUUID()
    const ev = searchParams.get('ev') || 'view'
    const video_id = searchParams.get('video_id') || null
    const sku_id = searchParams.get('sku_id') || null
    const ref = searchParams.get('ref') || req.headers.get('referer') || null
    const ua = req.headers.get('user-agent') || ''
    const ip = getClientIp(req as any)
    const ip_hash = hashIp(ip)
    const utm = parseUtm(searchParams)
    const now = new Date().toISOString()
    await db.from('commerce_sessions').upsert({ session_id: sid, first_seen: now, last_seen: now, user_agent: ua, ip_hash, country: req.headers.get('cf-ipcountry') || null } as any, { onConflict: 'session_id' })
    await db.from('commerce_events').insert({ session_id: sid, ts: now, event_type: ev, video_id, sku_id, referrer: ref, utm, meta: null } as any)
  } catch {}
  return pixel()
}

export async function OPTIONS() { return pixel() }



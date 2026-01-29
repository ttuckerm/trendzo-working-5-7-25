import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { ensureCommerceTables } from '@/lib/commerce/ensure'
import { corsHeaders } from '@/lib/commerce/utils'
import { enforceTelemetryQuota } from '@/lib/security/telemetry-keys'

export async function OPTIONS() { return new NextResponse(null, { headers: corsHeaders() }) }

export async function POST(req: NextRequest) {
  const quota = await enforceTelemetryQuota(req, '/api/commerce/order', 'commerce/server')
  if (!quota.allowed) return new NextResponse(null, { status: quota.status, headers: corsHeaders() })
  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    await ensureCommerceTables()
    const body = await req.json().catch(()=>({})) as any
    if (!body?.order_id) return NextResponse.json({ error: 'missing_order_id' }, { status: 400, headers: corsHeaders() })
    const row: any = {
      order_id: String(body.order_id),
      session_id: body.session_id || null,
      ts: body.ts || new Date().toISOString(),
      sku_id: body.sku_id || null,
      qty: Number(body.qty || 1),
      revenue_cents: Number(body.revenue_cents || 0),
      currency: body.currency || 'USD',
      video_id: body.video_id || null
    }
    await db.from('orders').upsert(row as any, { onConflict: 'order_id' })
    // Also append an order_confirm event
    try { await db.from('commerce_events').insert({ session_id: row.session_id, ts: row.ts, event_type: 'order_confirm', video_id: row.video_id, sku_id: row.sku_id, referrer: null, utm: null, meta: { order_id: row.order_id, revenue_cents: row.revenue_cents, currency: row.currency, qty: row.qty } } as any) } catch {}
    return NextResponse.json({ ok: true }, { headers: corsHeaders() })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500, headers: corsHeaders() })
  }
}



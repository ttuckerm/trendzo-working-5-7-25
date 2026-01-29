import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

function sign(secret: string, payload: any): string {
  const body = JSON.stringify(payload)
  return createHmac('sha256', secret).update(body).digest('hex')
}

export async function POST(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { event, payload } = await req.json().catch(()=>({})) as any
  if (!event) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const { data: endpoints } = await db.from('webhook_endpoint').select('id,url,secret,events')
  let delivered = 0
  for (const ep of endpoints || []) {
    if (Array.isArray((ep as any).events) && !(ep as any).events.includes(event)) continue
    const url = (ep as any).url
    const secret = (ep as any).secret
    const sig = sign(secret, payload)
    let status = 0, error: string | null = null
    try {
      const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-TZ-Signature': sig }, body: JSON.stringify(payload) })
      status = resp.status
    } catch (e: any) {
      error = e?.message || 'network_error'
    }
    await db.from('webhook_delivery').insert({ endpoint_id: (ep as any).id, event, payload, status, error } as any)
    if (!status || status >= 500) {
      await db.from('webhook_dlq').insert({ endpoint_id: (ep as any).id, event, payload, reason: error || `status_${status}` } as any)
    } else if (status >= 200 && status < 300) {
      delivered++
    }
  }
  return NextResponse.json({ ok: true, delivered })
}



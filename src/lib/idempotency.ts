import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function withIdempotency(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const key = req.headers.get('idempotency-key') || req.headers.get('Idempotency-Key')
  if (!key) return handler()
  const bodyText = req.method === 'GET' ? '' : await req.text()
  const hash = createHash('sha256').update(`${req.method} ${new URL(req.url).pathname}\n${bodyText}`).digest('hex')
  const { data } = await db.from('idempotency_store').select('*').eq('idempotency_key', key).limit(1)
  const row = Array.isArray(data) && data.length ? (data as any)[0] : null
  if (row && row.request_hash === hash) {
    return new NextResponse(JSON.stringify(row.response_json || {}), {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-idempotent-replayed': '1' }
    })
  }
  // Need to reconstruct req body for downstream since we consumed text
  const rebuilt = new Request(req.url, { method: req.method, headers: req.headers as any, body: bodyText || undefined })
  const downstream = await handlerProxy(handler, rebuilt)
  const clone = downstream.clone()
  const json = await clone.json().catch(() => ({}))
  try { await db.from('idempotency_store').upsert({ idempotency_key: key, request_hash: hash, response_json: json }) } catch {}
  return downstream
}

async function handlerProxy(handler: () => Promise<NextResponse>, _rebuilt: Request): Promise<NextResponse> {
  // The handler closure should capture the correct request context in Next.js route handler usage
  return handler()
}



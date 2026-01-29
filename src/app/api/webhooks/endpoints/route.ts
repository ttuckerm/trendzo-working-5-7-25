import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

async function ensureWebhookTables(db: any) {
  const sql = `
  create table if not exists webhook_endpoint (
    id uuid default gen_random_uuid() primary key,
    tenant_id text,
    url text not null,
    secret text not null,
    events text[] not null default '{}',
    created_at timestamptz default now()
  );
  create table if not exists webhook_delivery (
    id bigserial primary key,
    endpoint_id uuid references webhook_endpoint(id) on delete cascade,
    event text,
    payload jsonb,
    status int,
    attempt int default 1,
    error text,
    created_at timestamptz default now()
  );
  create table if not exists webhook_dlq (
    id bigserial primary key,
    endpoint_id uuid,
    event text,
    payload jsonb,
    reason text,
    created_at timestamptz default now()
  );`
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

function sign(secret: string, payload: any): string {
  const body = JSON.stringify(payload)
  return createHmac('sha256', secret).update(body).digest('hex')
}

export async function GET(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureWebhookTables(db)
  const tenant = req.headers.get('x-tenant-id') || null
  const { data } = tenant
    ? await db.from('webhook_endpoint').select('*').eq('tenant_id', tenant)
    : await db.from('webhook_endpoint').select('*')
  return NextResponse.json({ endpoints: data || [] })
}

export async function POST(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureWebhookTables(db)
  const body = await req.json().catch(()=>({})) as any
  const url = String(body?.url || '')
  const secret = String(body?.secret || '')
  const events = Array.isArray(body?.events) ? body.events.map(String) : []
  const tenant = String(body?.tenant_id || req.headers.get('x-tenant-id') || '')
  if (!url || !secret || events.length === 0) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const ins = await db.from('webhook_endpoint').insert({ url, secret, events, tenant_id: tenant } as any).select('*').limit(1)
  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 })
  // Test delivery
  const payload = { type: 'test', ts: new Date().toISOString() }
  const sig = sign(secret, payload)
  let status = 0, err: string | null = null
  try {
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-TZ-Signature': sig }, body: JSON.stringify(payload) })
    status = resp.status
  } catch (e: any) {
    status = 0; err = e?.message || 'network_error'
  }
  await db.from('webhook_delivery').insert({ endpoint_id: ins.data?.[0]?.id, event: 'test', payload, status, error: err } as any)
  if (status < 200 || status >= 300) {
    await db.from('webhook_dlq').insert({ endpoint_id: ins.data?.[0]?.id, event: 'test', payload, reason: err || `status_${status}` } as any)
  }
  return NextResponse.json({ ok: true, test_status: status })
}



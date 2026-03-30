import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes, createHash } from 'crypto'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

async function ensureInviteTables(db: any) {
  const sql = `
  create table if not exists invite (
    id uuid default gen_random_uuid() primary key,
    tenant_id text not null,
    email text not null,
    role text not null,
    token text not null,
    expires_at timestamptz not null,
    accepted_at timestamptz,
    created_by text,
    created_at timestamptz default now()
  );`
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

export async function GET(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureInviteTables(db)
  const tenant = req.headers.get('x-tenant-id') || null
  const q = tenant ? db.from('invite').select('*').eq('tenant_id', tenant) : db.from('invite').select('*')
  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invites: data || [] })
}

export async function POST(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureInviteTables(db)
  const { email, role, tenant_id } = await req.json().catch(()=>({})) as any
  if (!email || !role || !tenant_id) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const raw = randomBytes(24).toString('hex')
  const token = createHash('sha256').update(raw).digest('hex')
  const expires_at = new Date(Date.now() + 7*24*3600*1000).toISOString()
  const ins = await db.from('invite').insert({ email, role, tenant_id, token, expires_at } as any).select('id').limit(1)
  if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 })
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists email_queue (id bigserial primary key, template text, to_email text, payload jsonb, created_at timestamptz default now());" }) } catch {}
  try { await db.from('email_queue').insert({ template: 'invite', to_email: email, payload: { role, tenant_id, token: raw } } as any) } catch {}
  return NextResponse.json({ ok: true, token: raw })
}



import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({})) as any
  const version = String(body?.version || '')
  const sampleRate = Number(body?.sampleRate || 0.1)
  if (!version) return NextResponse.json({ error: 'missing_version' }, { status: 400 })
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists model_registry (version text primary key, status text, notes text, created_at timestamptz default now());" }) } catch {}
  await db.from('model_registry').upsert({ version, status: 'shadow', notes: JSON.stringify({ sampleRate }) } as any)
  return NextResponse.json({ ok: true, version, sampleRate })
}













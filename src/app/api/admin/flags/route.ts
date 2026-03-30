import type { NextRequest } from 'next/server'
import { NextResponse as NRes } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { requireRole } from '@/lib/auth/server-auth'

export async function GET(req: NextRequest){
  const guard = await requireRole(req, ['chairman'])
  if (guard) return guard
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data, error } = await db.from('features').select('key, description, default_state').order('key')
  if (error) return NRes.json({ error: error.message }, { status: 500 })
  return NRes.json({ rows: data || [] })
}

export async function POST(req: NextRequest){
  const guard = await requireRole(req, ['chairman'])
  if (guard) return guard
  const body = await req.json()
  const { key, default_state, description, action } = body || {}
  if (!key) return NRes.json({ error: 'key required' }, { status: 400 })
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const before = await db.from('features').select('*').eq('key', key).limit(1)
  const { data, error } = await db.from('features').upsert({ key, default_state, description } as any).select('*').single()
  if (error) return NRes.json({ error: error.message }, { status: 500 })
  try { await db.from('flag_audit').insert({ feature_key: key, action: action || 'toggled', actor_id: 'admin', before: (before.data||[])[0]||null, after: data as any } as any) } catch {}
  return NRes.json({ ok: true, data })
}



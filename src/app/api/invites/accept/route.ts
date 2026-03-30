import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function POST(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { token } = await req.json().catch(()=>({})) as any
  if (!token) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const hashed = createHash('sha256').update(String(token)).digest('hex')
  const { data: inv } = await db.from('invite').select('*').eq('token', hashed).limit(1)
  const row = inv?.[0]
  if (!row) return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
  if (row.accepted_at) return NextResponse.json({ ok: true, already: true })
  await db.from('invite').update({ accepted_at: new Date().toISOString() } as any).eq('id', row.id)
  // Real user creation would happen here; for now, mark accepted
  return NextResponse.json({ ok: true })
}



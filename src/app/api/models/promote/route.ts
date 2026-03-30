import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function POST(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { version_id, channel } = await req.json().catch(()=>({})) as any
  if (!version_id || (channel !== 'canary' && channel !== 'stable')) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  await db.from('release_channel').upsert({ channel, version_id, updated_at: new Date().toISOString() } as any)
  return NextResponse.json({ ok: true })
}



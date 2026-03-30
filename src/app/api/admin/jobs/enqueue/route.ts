import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const type = body.type || 'test'
  const payload = body.payload || {}
  await db.from('job_queue').insert({ type, payload, status: 'queued' })
  return NextResponse.json({ ok: true })
}



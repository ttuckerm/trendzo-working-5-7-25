import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const type = body.type || 'test'
  const payload = body.payload || {}
  await db.from('job_queue').insert({ type, payload, status: 'queued' })
  return NextResponse.json({ ok: true })
}



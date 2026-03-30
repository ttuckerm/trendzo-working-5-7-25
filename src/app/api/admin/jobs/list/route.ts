import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function GET(_req: NextRequest) {
  const { data: queued } = await db.from('job_queue').select('id').eq('status','queued')
  const { data: jobs } = await db.from('job_queue').select('*').order('created_at', { ascending: false }).limit(20)
  return NextResponse.json({ queue_depth: (queued||[]).length, jobs: jobs || [] })
}



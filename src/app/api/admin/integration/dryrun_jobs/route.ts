import { NextRequest, NextResponse } from 'next/server'
import { runWithProgress } from '@/app/api/admin/jobs/runner'
import { getSignedUrl } from '@/lib/storage/object_store'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const { job_id } = await runWithProgress('dryrun_scrape', { dryrun: true }, [
    { name: 'stage1', fn: async ()=>{ await new Promise(r=>setTimeout(r,150)); } },
    { name: 'stage2', fn: async ()=>{ await new Promise(r=>setTimeout(r,150)); } },
    { name: 'stage3', fn: async ()=>{ await new Promise(r=>setTimeout(r,150)); } }
  ])
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('job_runs').select('*').eq('id', job_id).limit(1)
  // Example status: try to sign latest artifact path if any known location is persisted later
  let latest_artifact_url: string | null = null
  try {
    // This is an optional demonstration; if you store paths in DB later, fetch and sign them here
    latest_artifact_url = null
  } catch {}
  return NextResponse.json({ ok: true, job_id, sse: `/api/admin/ws?job_id=${job_id}`, row: Array.isArray(data)&&data.length?data[0]:null, latest_artifact_url })
}



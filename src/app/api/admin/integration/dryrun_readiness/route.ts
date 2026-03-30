import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { putJson } from '@/lib/storage/object_store'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  // Status fields
  let accuracy_last_computed_at: string | null = null
  let baseline_last_run: string | null = null
  try {
    const { data } = await db.from('accuracy_metrics').select('computed_at').order('computed_at', { ascending: false }).limit(1)
    accuracy_last_computed_at = Array.isArray(data)&&data.length ? (data[0] as any).computed_at : null
  } catch {}
  try {
    const { data } = await db.from('integration_job_runs').select('last_run').eq('job','baseline_public').limit(1)
    baseline_last_run = data?.[0]?.last_run || null
  } catch {}

  const now = new Date().toISOString()
  const payload = {
    ts: now,
    status: { accuracy_last_computed_at, baseline_last_run },
    ok: true
  }
  const saved = await putJson('proof', payload, { filename: `readiness_${Date.now()}.json` })
  return NextResponse.json({ ok: true, url: saved.url, proof_path: saved.path, status: payload.status })
}



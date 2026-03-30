import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/utils/adminAuth'
import { runWithProgress } from '@/app/api/admin/jobs/runner'
import { aggregateTemplates } from '@/lib/templates/aggregate'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req)
  if (!auth.success) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const window = Number(searchParams.get('window') || 30)
  const { job_id } = await runWithProgress('templates:aggregate', { window }, [
    { name: 'aggregate', fn: async () => {
      const out = await aggregateTemplates(window)
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists integration_job_runs (job text primary key, last_run timestamptz);" }) } catch {}
      await db.from('integration_job_runs').upsert({ job: 'templates_aggregate', last_run: new Date().toISOString() } as any)
    } }
  ])
  return NextResponse.json({ ok: true, job_id })
}



import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/utils/adminAuth'
import { runWithProgress } from '@/app/api/admin/jobs/runner'
import { runAttribution } from '@/lib/commerce/attribution'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { dispatchAlarm } from '@/lib/ops/notifier'

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req)
  if (!auth.success) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const window_h = Number(searchParams.get('window_h') || 168)
  const model = (searchParams.get('model') || 'last_touch_decay') as any
  const lambda = Number(searchParams.get('λ') || searchParams.get('lambda') || 0.1)

  const { job_id } = await runWithProgress('commerce_attribution', { window_h, model, lambda }, [
    { name: 'compute', fn: async () => {
      const out = await runAttribution(window_h, model, lambda)
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists integration_job_runs (job text primary key, last_run timestamptz not null);" }) } catch {}
      await db.from('integration_job_runs').upsert({ job: 'commerce_attribution', last_run: new Date().toISOString() } as any)
      try { await dispatchAlarm('commerce_attribution_done', 'info', { message: `Attribution run complete: ${out.rows} rows` }) } catch {}
    } }
  ])

  return NextResponse.json({ ok: true, job_id })
}



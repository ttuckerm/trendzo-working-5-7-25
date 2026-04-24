/**
 * Overnight Triage — Agency Morning Briefing Populator
 * Phase 1 Turn 4
 *
 * GET /api/cron/overnight-triage
 *
 * Runs runTriageForAllAgencies() which scans overdue briefs, performance
 * highlights, and trend opportunities for every agency, ranks by urgency,
 * and upserts the top-5 items into agency_triage (unique on agency_id +
 * triage_date). The /agency morning brief reads this table at 8 AM so
 * the briefing is a deterministic DB read, not a GPT cold-start.
 *
 * Previously registered via node-cron in src/lib/cron/scheduler.ts:212,
 * which does not run on Vercel. This handler wires the same job to
 * Vercel's managed cron dispatcher (vercel.json `crons` entry).
 */

import { NextRequest, NextResponse } from 'next/server'
import { runTriageForAllAgencies } from '@/lib/triage/overnight-triage'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  console.info('[cron:overnight-triage] Starting…')

  try {
    const result = await runTriageForAllAgencies()

    // Track job run (best-effort, matches cultural-scan / classify-events pattern).
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
    if (supabaseUrl && supabaseKey) {
      try {
        const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
        await db.from('integration_job_runs').upsert({ job: 'overnight_triage', last_run: new Date().toISOString() } as any)
      } catch {}
    }

    const elapsed = Date.now() - startTime
    console.info(
      `[cron:overnight-triage] Done: agencies=${result.agencies_processed} items=${result.items_written} errors=${result.errors.length} in ${(elapsed / 1000).toFixed(1)}s`,
    )

    return NextResponse.json({
      ok: true,
      agenciesProcessed: result.agencies_processed,
      itemsWritten: result.items_written,
      at: result.ran_at,
      elapsed_ms: elapsed,
      errors: result.errors.length > 0 ? result.errors : undefined,
    })
  } catch (err: any) {
    const elapsed = Date.now() - startTime
    console.error('[cron:overnight-triage] Error:', err?.message || err)
    return NextResponse.json(
      {
        ok: false,
        error: String(err?.message || err),
        elapsed_ms: elapsed,
        at: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

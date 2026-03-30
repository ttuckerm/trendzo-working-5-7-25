import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { getCalibrationVersion } from '@/lib/calibration/calibration'
import { commonRateLimiters } from '@/lib/security/rate-limiter'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'

export async function GET(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const limited = await commonRateLimiters.admin(req)
  if (limited) return limited

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const since30 = new Date(Date.now()-30*24*3600*1000).toISOString()

  // calibration version
  const calibration_version = await getCalibrationVersion()

  // heated excluded from accuracy_metrics (latest within 30d)
  let heated_excluded_30d = 0
  let accuracy_last_computed_at: string | null = null
  try {
    const { data } = await db
      .from('accuracy_metrics')
      .select('heated_excluded_count,computed_at')
      .gte('computed_at', since30)
      .order('computed_at', { ascending: false })
      .limit(1)
    if (Array.isArray(data) && data.length) {
      heated_excluded_30d = Number((data[0] as any).heated_excluded_count||0)
      accuracy_last_computed_at = (data[0] as any).computed_at || null
    }
  } catch {}

  // cohort version: use weekly cohort from predictions/meta when available; fallback to calibration_version
  let cohort_version: string | null = null
  try {
    const { data } = await db.from('viral_predictions').select('cohort_version').order('created_at', { ascending: false }).limit(1)
    cohort_version = (Array.isArray(data) && data.length) ? (data[0] as any).cohort_version || null : null
  } catch {}
  cohort_version = cohort_version || calibration_version || null

  // timing index from trend_nowcast (avg strength of top 50)
  let timing_index = 0
  try {
    const { data } = await db.from('trend_nowcast').select('strength').order('updated_at', { ascending: false }).limit(50)
    if (Array.isArray(data) && data.length) {
      const avg = (data as any[]).reduce((s,r)=> s + Number((r as any).strength||0), 0)/data.length
      // normalize to 0..1 assuming strength up to ~1000
      timing_index = Math.max(0, Math.min(1, avg/1000))
    }
  } catch {}

  // last runs from integration_job_runs + baselines_state
  const last_runs: any = { baseline: null, calibration: null, trends: null }
  let baseline_version: string | null = null
  let baseline_last_run: string | null = null
  try {
    await (db as any).rpc?.('exec_sql', { query: "create table if not exists baselines_state (id int primary key default 1, baseline_version text, baseline_last_run timestamptz);" })
  } catch {}
  try {
    const { data: bs } = await db.from('baselines_state').select('baseline_version,baseline_last_run').eq('id', 1).limit(1)
    baseline_version = bs?.[0]?.baseline_version || null
    baseline_last_run = bs?.[0]?.baseline_last_run || null
  } catch {}
  try {
    const { data: b } = await db.from('integration_job_runs').select('last_run').eq('job','baseline_public').limit(1)
    last_runs.baseline = b?.[0]?.last_run || null
  } catch {}
  try {
    const { data: c } = await db.from('integration_job_runs').select('last_run').eq('job','calibration').limit(1)
    last_runs.calibration = c?.[0]?.last_run || accuracy_last_computed_at || null
  } catch {}
  try {
    const { data: t } = await db.from('integration_job_runs').select('last_run').eq('job','baseline_public').limit(1)
    // The trends health section uses 'baseline_public' for baselines and separate trend_nowcast
    last_runs.trends = last_runs.trends || null
  } catch {}
  try {
    const { data: tr } = await db.from('integration_job_runs').select('last_run').eq('job','trend_nowcast').limit(1)
    last_runs.trends = tr?.[0]?.last_run || last_runs.trends
  } catch {}

  return NextResponse.json({ cohort_version, calibration_version, heated_excluded_30d, timing_index, last_runs, baseline_version, baseline_last_run })
}



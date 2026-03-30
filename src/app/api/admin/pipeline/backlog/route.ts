import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, guardAdmin, parseRange, getWindow, withCache } from '../_lib'
import { synthBacklog } from '../_synthetic'

export async function GET(req: NextRequest) {
  const denied = await guardAdmin(req)
  if (denied) return denied
  let db
  try { db = getAdminDb() } catch (e: any) {
    return withCache(synthBacklog(), 5)
  }
  const range = parseRange(req)
  const { start } = getWindow(range)
  const sinceIso = start.toISOString()

  const [queued, recentIngest, cron] = await Promise.all([
    db.from('scraping_jobs').select('id', { count: 'exact', head: true }).eq('status','queued'),
    db.from('videos').select('created_at').gte('created_at', sinceIso),
    db.from('scheduler_logs').select('*').gte('created_at', sinceIso).order('created_at', { ascending: false }).limit(200)
  ])

  // Compute current rate from recent 15m window
  const fifteen = new Date(Date.now() - 15*60*1000).toISOString()
  const recent15 = (recentIngest.data || []).filter((r:any)=> r.created_at >= fifteen).length
  const ratePerSec = recent15 / (15*60)
  const backlog = queued.count || 0
  const drainEtaSec = ratePerSec > 0 ? Math.ceil(backlog / ratePerSec) : null

  // Cron status by job_name
  const byJob: Record<string, { last_run: string | null; last_status: string | null; misses: number }> = {}
  if (Array.isArray(cron.data)) {
    for (const row of cron.data as any[]) {
      const j = row.job_name
      const cur = byJob[j] || (byJob[j] = { last_run: null, last_status: null, misses: 0 })
      if (!cur.last_run || new Date(row.created_at).getTime() > new Date(cur.last_run).getTime()) {
        cur.last_run = row.completed_at || row.started_at || row.scheduled_at || row.created_at
        cur.last_status = row.status
      }
      if (row.miss) cur.misses += 1
    }
  }

  return withCache({ backlog, rate_per_sec: Number(ratePerSec.toFixed(4)), drain_eta_sec: drainEtaSec, cron: byJob }, 5)
}



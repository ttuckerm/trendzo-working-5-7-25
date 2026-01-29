import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, guardAdmin, parseRange, withCache } from '../_lib'
import { synthModules } from '../_synthetic'
import { computeSloForAll } from '../_slo'

export async function GET(req: NextRequest) {
  const denied = await guardAdmin(req)
  if (denied) return denied
  let db
  try { db = getAdminDb() } catch (e: any) {
    return withCache(synthModules(), 5)
  }
  const range = parseRange(req)
  const sinceIso = new Date(Date.now() - 24*3600*1000).toISOString()

  const [mods, runs] = await Promise.all([
    db.from('pipeline_modules').select('*').order('id'),
    db.from('module_runs').select('module_id,status,started_at,completed_at,duration_ms').gte('started_at', sinceIso)
  ])

  const byModule: Record<string, { total: number; ok: number; last_status?: string; last_run_at?: string | null }> = {}
  if (Array.isArray(runs.data)) {
    for (const r of runs.data as any[]) {
      const m = r.module_id
      const cur = byModule[m] || (byModule[m] = { total: 0, ok: 0, last_status: undefined, last_run_at: null })
      cur.total += 1
      if (r.status === 'success') cur.ok += 1
      cur.last_status = r.status
      const t = r.completed_at || r.started_at
      if (t && (!cur.last_run_at || new Date(t).getTime() > new Date(cur.last_run_at).getTime())) cur.last_run_at = t
    }
  }
  const moduleIds = (mods.data || []).map((m:any)=> m.id)
  const sloMap = await computeSloForAll(db, moduleIds, range)

  let items = (mods.data || []).map((m:any)=>{
    const s = byModule[m.id] || { total: 0, ok: 0, last_status: 'unknown', last_run_at: null }
    const uptime = s.total ? Number((s.ok / s.total * 100).toFixed(2)) : 100
    const processed = s.ok
    const slo = sloMap[m.id]
    return {
      id: m.id, name: m.name, version: m.version, enabled: m.enabled,
      uptime_percent: uptime, last_status: s.last_status, last_run_at: slo?.last_output_at || s.last_run_at, processed,
      p95_ms: slo?.p95_ms || 0, error_rate_1h: slo?.error_rate_1h || 0, items_processed_1h: slo?.items_processed_1h || processed,
      overall_status: slo?.overall_status || 'green', reasons: slo?.reasons || []
    }
  })

  // If DB returned zero modules in dev, fall back to synthetic so UI always shows 12 tiles
  if (!items.length) {
    const synth = synthModules()
    items = synth.items
  }
  return withCache({ items }, 5)
}



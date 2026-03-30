import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, guardAdmin, parseRange, getWindow, toBuckets, withCache } from '../_lib'
import { synthThroughput } from '../_synthetic'

export async function GET(req: NextRequest) {
  const denied = await guardAdmin(req)
  if (denied) return denied
  let db
  try { db = getAdminDb() } catch (e: any) {
    return withCache(synthThroughput(), 5)
  }
  const range = parseRange(req)
  const { start, end, bucketSec } = getWindow(range)
  const sinceIso = start.toISOString()

  // Ingest/sec => videos created per bucket
  const { data: vids } = await db
    .from('videos')
    .select('created_at')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: true })

  // Latency and error rate from module_runs
  const { data: runs } = await db
    .from('module_runs')
    .select('started_at, completed_at, status, duration_ms')
    .gte('started_at', sinceIso)
    .order('started_at', { ascending: true })

  const buckets = toBuckets(start, end, bucketSec)
  const ingest = buckets.map(b => ({ t: b.t, count: 0 }))
  const p95 = buckets.map(b => ({ t: b.t, ms: 0 }))
  const p99 = buckets.map(b => ({ t: b.t, ms: 0 }))
  const errorRate = buckets.map(b => ({ t: b.t, rate: 0 }))

  function idx(ts: string) {
    const t = new Date(ts).getTime()
    const base = start.getTime()
    const k = Math.floor((t - base) / (bucketSec*1000))
    return Math.min(Math.max(k, 0), buckets.length-1)
  }

  if (Array.isArray(vids)) {
    for (const v of vids) {
      const i = idx((v as any).created_at)
      ingest[i].count += 1
    }
  }

  if (Array.isArray(runs)) {
    const byBucket: Record<number, number[]> = {}
    const statusByBucket: Record<number, { total: number; failed: number }> = {}
    for (const r of runs as any[]) {
      const i = idx(r.started_at)
      const arr = byBucket[i] || (byBucket[i] = [])
      const d = Number(r.duration_ms || (r.completed_at ? (new Date(r.completed_at).getTime()-new Date(r.started_at).getTime()) : 0))
      if (d > 0) arr.push(d)
      const s = statusByBucket[i] || (statusByBucket[i] = { total: 0, failed: 0 })
      s.total += 1
      if (String(r.status) === 'failed') s.failed += 1
    }
    for (let i = 0; i < buckets.length; i++) {
      const list = byBucket[i] || []
      if (list.length) {
        const sorted = list.slice().sort((a,b)=>a-b)
        const q = (p: number) => sorted[Math.min(sorted.length-1, Math.floor(p*sorted.length))]
        p95[i].ms = q(0.95)
        p99[i].ms = q(0.99)
      }
      const s = statusByBucket[i]
      if (s && s.total) errorRate[i].rate = Number((s.failed / s.total).toFixed(4))
    }
  }

  return withCache({ range, bucket_sec: bucketSec, ingest_per_bucket: ingest, p95_ms: p95, p99_ms: p99, error_rate: errorRate }, 5)
}



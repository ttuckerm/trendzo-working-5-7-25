import { NextResponse } from 'next/server'
import IORedis from 'ioredis'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

let _redis: IORedis | null = null
function getRedis() {
  if (!_redis) _redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { lazyConnect: true, maxRetriesPerRequest: 0, retryStrategy: () => null })
  return _redis
}

const moduleKeys = [
  'scraper','patternAnalyzer','templateDiscovery','draftAnalyzer','scriptIntel',
  'recipeBook','predictor','validator','marketing','dashboard','systemHealth','processIntel'
] as const

type ModuleKey = typeof moduleKeys[number]

export async function GET() {
  const r = getRedis()
  const stats: Record<ModuleKey, any> = {} as any
  let totalProcessed24h = 0
  let totalErrors24h = 0
  for (const k of moduleKeys) {
    const status = (await r.get(`health:${k}:status`)) || 'green'
    const lastRestartAt = await r.lindex(`restarts:${k}`, 0)
    const errorRate = Number(await r.get(`metrics:${k}:errorRate`)) || 0
    const p95IngestMs = Number(await r.get(`metrics:${k}:p95Ms`)) || 0
    const dlqCount = Number(await r.hlen(`dlq:${k}:reasons`)) || 0
    const backlog = Number(await r.get(`metrics:${k}:queued`)) || 0
    const rps = Number(await r.get(`metrics:${k}:rate_per_min`)) || 0
    const processed24h = Number(await r.get(`metrics:${k}:processed:${new Date().toISOString().slice(0,10)}`)) || 0
    stats[k] = { status, lastRestartAt, errorRate, p95IngestMs, dlqCount, backlog, rps, processed24h }
    totalProcessed24h += processed24h
    totalErrors24h += Number(await r.get(`metrics:${k}:errors24h`)) || 0
  }
  const costEstimateUSD = Number((totalProcessed24h * 0.0001).toFixed(4))
  return NextResponse.json({ modules: stats, totalProcessed24h, totalErrors24h, costEstimateUSD })
}



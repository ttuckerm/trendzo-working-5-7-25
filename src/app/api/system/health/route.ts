import { NextResponse } from 'next/server'
import IORedis from 'ioredis'

const redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

const moduleKeys = [
  'scraper','patternAnalyzer','templateDiscovery','draftAnalyzer','scriptIntel',
  'recipeBook','predictor','validator','marketing','dashboard','systemHealth','processIntel'
] as const

type ModuleKey = typeof moduleKeys[number]

export async function GET() {
  const stats: Record<ModuleKey, any> = {} as any
  let totalProcessed24h = 0
  let totalErrors24h = 0
  for (const k of moduleKeys) {
    const status = (await redis.get(`health:${k}:status`)) || 'green'
    const lastRestartAt = await redis.lindex(`restarts:${k}`, 0)
    const errorRate = Number(await redis.get(`metrics:${k}:errorRate`)) || 0
    const p95IngestMs = Number(await redis.get(`metrics:${k}:p95Ms`)) || 0
    const dlqCount = Number(await redis.hlen(`dlq:${k}:reasons`)) || 0
    const backlog = Number(await redis.get(`metrics:${k}:queued`)) || 0
    const rps = Number(await redis.get(`metrics:${k}:rate_per_min`)) || 0
    const processed24h = Number(await redis.get(`metrics:${k}:processed:${new Date().toISOString().slice(0,10)}`)) || 0
    stats[k] = { status, lastRestartAt, errorRate, p95IngestMs, dlqCount, backlog, rps, processed24h }
    totalProcessed24h += processed24h
    totalErrors24h += Number(await redis.get(`metrics:${k}:errors24h`)) || 0
  }
  const costEstimateUSD = Number((totalProcessed24h * 0.0001).toFixed(4))
  return NextResponse.json({ modules: stats, totalProcessed24h, totalErrors24h, costEstimateUSD })
}



import { NextResponse } from 'next/server'
import IORedis from 'ioredis'

const redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

const moduleKeys = new Set([
  'scraper','patternAnalyzer','templateDiscovery','draftAnalyzer','scriptIntel',
  'recipeBook','predictor','validator','marketing','dashboard','systemHealth','processIntel'
])

export async function GET(_: Request, ctx: { params: { moduleKey: string } }) {
  const { moduleKey } = ctx.params
  if (!moduleKeys.has(moduleKey)) return NextResponse.json({ error: 'unknown module' }, { status: 404 })
  const status = (await redis.get(`health:${moduleKey}:status`)) || 'green'
  const lastRestartAt = await redis.lindex(`restarts:${moduleKey}`, 0)
  const errorRate = Number(await redis.get(`metrics:${moduleKey}:errorRate`)) || 0
  const p95IngestMs = Number(await redis.get(`metrics:${moduleKey}:p95Ms`)) || 0
  const dlqCount = Number(await redis.hlen(`dlq:${moduleKey}:reasons`)) || 0
  const backlog = Number(await redis.get(`metrics:${moduleKey}:queued`)) || 0
  const rps = Number(await redis.get(`metrics:${moduleKey}:rate_per_min`)) || 0
  const processed24h = Number(await redis.get(`metrics:${moduleKey}:processed:${new Date().toISOString().slice(0,10)}`)) || 0
  return NextResponse.json({ status, lastRestartAt, errorRate, p95IngestMs, dlqCount, backlog, rps, processed24h })
}



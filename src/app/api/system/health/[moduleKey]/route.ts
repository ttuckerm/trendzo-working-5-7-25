import { NextResponse } from 'next/server'
import IORedis from 'ioredis'
export const dynamic = 'force-dynamic';

let _redis: IORedis | null = null
function getRedis() {
  if (!_redis) _redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { lazyConnect: true, maxRetriesPerRequest: 0, retryStrategy: () => null })
  return _redis
}

const moduleKeys = new Set([
  'scraper','patternAnalyzer','templateDiscovery','draftAnalyzer','scriptIntel',
  'recipeBook','predictor','validator','marketing','dashboard','systemHealth','processIntel'
])

export async function GET(_: Request, ctx: { params: { moduleKey: string } }) {
  const { moduleKey } = ctx.params
  if (!moduleKeys.has(moduleKey)) return NextResponse.json({ error: 'unknown module' }, { status: 404 })
  const r = getRedis()
  const status = (await r.get(`health:${moduleKey}:status`)) || 'green'
  const lastRestartAt = await r.lindex(`restarts:${moduleKey}`, 0)
  const errorRate = Number(await r.get(`metrics:${moduleKey}:errorRate`)) || 0
  const p95IngestMs = Number(await r.get(`metrics:${moduleKey}:p95Ms`)) || 0
  const dlqCount = Number(await r.hlen(`dlq:${moduleKey}:reasons`)) || 0
  const backlog = Number(await r.get(`metrics:${moduleKey}:queued`)) || 0
  const rps = Number(await r.get(`metrics:${moduleKey}:rate_per_min`)) || 0
  const processed24h = Number(await r.get(`metrics:${moduleKey}:processed:${new Date().toISOString().slice(0,10)}`)) || 0
  return NextResponse.json({ status, lastRestartAt, errorRate, p95IngestMs, dlqCount, backlog, rps, processed24h })
}



import { NextResponse } from 'next/server'
import IORedis from 'ioredis'

let _redis: IORedis | null = null
function getRedis() {
  if (!_redis) _redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { lazyConnect: true, maxRetriesPerRequest: 0, retryStrategy: () => null })
  return _redis
}

export async function GET() {
  const r = getRedis()
  const queued = Number((await r.get('metrics:ingest:queued')) || 0)
  const completed = Number((await r.get('metrics:ingest:completed')) || 0)
  const failed = Number((await r.get('metrics:ingest:failed')) || 0)
  const rate = Number((await r.get('metrics:ingest:rate_per_min')) || 0)
  return NextResponse.json({ queued, completed, failed, rate })
}



import { NextResponse } from 'next/server'
import IORedis from 'ioredis'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

let _redis: IORedis | null = null
function getRedis() {
  if (!_redis) _redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { lazyConnect: true, maxRetriesPerRequest: 0, retryStrategy: () => null })
  return _redis
}

export async function GET() {
  const r = getRedis()
  const keys = await r.keys('metrics:*')
  const out: Record<string, any> = {}
  for (const k of keys) {
    const t = await r.type(k)
    if (t === 'string') out[k] = await r.get(k)
    else if (t === 'hash') out[k] = await r.hgetall(k)
    else if (t === 'list') out[k] = await r.lrange(k, 0, 10)
    else if (t === 'zset') out[k] = (await r.zrevrange(k, 0, 10))
  }
  return NextResponse.json(out)
}



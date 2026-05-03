import { NextRequest, NextResponse } from 'next/server'
import IORedis from 'ioredis'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

let _redis: IORedis | null = null
function getRedis() {
  if (!_redis) _redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { lazyConnect: true, maxRetriesPerRequest: 0, retryStrategy: () => null })
  return _redis
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const moduleKey = body?.module || 'ingest'
  const reason = body?.reason || 'test'
  const entry = { ts: new Date().toISOString(), reason }
  await getRedis().lpush(`restarts:${moduleKey}`, JSON.stringify(entry))
  await getRedis().ltrim(`restarts:${moduleKey}`, 0, 49)
  return NextResponse.json({ ok: true })
}



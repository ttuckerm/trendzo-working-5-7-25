import { NextRequest, NextResponse } from 'next/server'
import IORedis from 'ioredis'

let _redis: IORedis | null = null
function getRedis() {
  if (!_redis) _redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { lazyConnect: true, maxRetriesPerRequest: 0, retryStrategy: () => null })
  return _redis
}

export async function POST(req: NextRequest) {
  const { action } = await req.json().catch(() => ({}))
  if (!action) return NextResponse.json({ error: 'missing action' }, { status: 400 })
  if (action === 'pause') { await getRedis().set('controls:ingest:paused', '1') }
  if (action === 'resume') { await getRedis().del('controls:ingest:paused') }
  return NextResponse.json({ ok: true })
}



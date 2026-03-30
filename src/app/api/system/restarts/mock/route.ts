import { NextRequest, NextResponse } from 'next/server'
import IORedis from 'ioredis'

const redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const moduleKey = body?.module || 'ingest'
  const reason = body?.reason || 'test'
  const entry = { ts: new Date().toISOString(), reason }
  await redis.lpush(`restarts:${moduleKey}`, JSON.stringify(entry))
  await redis.ltrim(`restarts:${moduleKey}`, 0, 49)
  return NextResponse.json({ ok: true })
}



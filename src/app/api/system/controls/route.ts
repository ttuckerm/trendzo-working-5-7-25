import { NextRequest, NextResponse } from 'next/server'
import IORedis from 'ioredis'

const redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

export async function POST(req: NextRequest) {
  const { action } = await req.json().catch(() => ({}))
  if (!action) return NextResponse.json({ error: 'missing action' }, { status: 400 })
  if (action === 'pause') { await redis.set('controls:ingest:paused', '1') }
  if (action === 'resume') { await redis.del('controls:ingest:paused') }
  return NextResponse.json({ ok: true })
}



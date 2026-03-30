import { NextRequest, NextResponse } from 'next/server'
import IORedis from 'ioredis'

const redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({})) as any
  const mode = json?.mode
  if (mode !== 'DRY_RUN' && mode !== 'SAMPLE_LIVE' && mode !== 'FULL_LIVE') {
    return NextResponse.json({ error: 'invalid mode' }, { status: 400 })
  }
  await redis.set('controls:mode', mode)
  if (mode !== 'FULL_LIVE') await redis.del('controls:ingest:paused')
  return NextResponse.json({ ok: true, mode })
}

export async function GET() {
  const mode = (await redis.get('controls:mode')) || process.env.TRENDZO_MODE || 'DRY_RUN'
  return NextResponse.json({ mode })
}



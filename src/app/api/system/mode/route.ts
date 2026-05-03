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
  const json = await req.json().catch(() => ({})) as any
  const mode = json?.mode
  if (mode !== 'DRY_RUN' && mode !== 'SAMPLE_LIVE' && mode !== 'FULL_LIVE') {
    return NextResponse.json({ error: 'invalid mode' }, { status: 400 })
  }
  await getRedis().set('controls:mode', mode)
  if (mode !== 'FULL_LIVE') await getRedis().del('controls:ingest:paused')
  return NextResponse.json({ ok: true, mode })
}

export async function GET() {
  const mode = (await getRedis().get('controls:mode')) || process.env.TRENDZO_MODE || 'DRY_RUN'
  return NextResponse.json({ mode })
}



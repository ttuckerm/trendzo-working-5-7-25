import { NextResponse } from 'next/server'
import IORedis from 'ioredis'

const redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

export async function GET() {
  const queued = Number((await redis.get('metrics:ingest:queued')) || 0)
  const completed = Number((await redis.get('metrics:ingest:completed')) || 0)
  const failed = Number((await redis.get('metrics:ingest:failed')) || 0)
  const rate = Number((await redis.get('metrics:ingest:rate_per_min')) || 0)
  return NextResponse.json({ queued, completed, failed, rate })
}



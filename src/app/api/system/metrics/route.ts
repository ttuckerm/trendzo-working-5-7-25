import { NextResponse } from 'next/server'
import IORedis from 'ioredis'

const redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

export async function GET() {
  const keys = await redis.keys('metrics:*')
  const out: Record<string, any> = {}
  for (const k of keys) {
    const t = await redis.type(k)
    if (t === 'string') out[k] = await redis.get(k)
    else if (t === 'hash') out[k] = await redis.hgetall(k)
    else if (t === 'list') out[k] = await redis.lrange(k, 0, 10)
    else if (t === 'zset') out[k] = (await redis.zrevrange(k, 0, 10))
  }
  return NextResponse.json(out)
}



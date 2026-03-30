import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import IORedis from 'ioredis'
import { devUpsertStore } from '@/lib/dev/upsertStore'
import { VITSchema, VIT_UPSERT_KEY } from '@trendzo/shared'
import { upsertVit } from '@/lib/db/pg'

// In-memory store keyed by (platform, videoId) for local dev; replace with Postgres in production
const store = new Map<string, any>()
const redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

const Payload = z.object({
  vit: VITSchema,
  vitVersion: z.string(),
})

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}))
  const parsed = Payload.safeParse(json)
  if (!parsed.success) {
    // Record schema DLQ for visibility
    try {
      await redis.hincrby('dlq:ingest:reasons', 'schema', 1)
      await redis.lpush('dlq:ingest:entries', JSON.stringify({ module: 'ingest', reason: 'schema', firstSeenAt: new Date().toISOString(), count: 1, sample: json }))
      await redis.ltrim('dlq:ingest:entries', 0, 199)
    } catch {}
    return NextResponse.json({ error: 'invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }
  const { vit } = parsed.data
  // Circuit breaker: pause if flagged
  const paused = await redis.get('controls:ingest:paused')
  if (paused) return NextResponse.json({ error: 'paused' }, { status: 503 })
  const key = VIT_UPSERT_KEY(vit.ids.platform, vit.ids.videoId)
  // Local short-circuit: shared in-memory store during dev
  if (process.env.LOCAL_UPSERT === '1') {
    try {
      // Write to Redis hash for cross-process visibility
      await redis.hset('local:upserts', key, JSON.stringify({ ...vit, vitVersion: parsed.data.vitVersion }))
    } catch {}
    devUpsertStore.upsert(key, { ...vit, vitVersion: parsed.data.vitVersion })
  } else {
    // idempotent upsert in Postgres (source of truth)
    await upsertVit(vit.ids.platform, vit.ids.videoId, vit)
  }
  // Update metrics
  await redis.decrby('metrics:ingest:queued', 1)
  await redis.incrby('metrics:ingest:completed', 1)
  await redis.set('metrics:ingest:rate_per_min', Math.max(1, Math.floor(Math.random() * 20)))
  return NextResponse.json({ ok: true, key })
}

export async function GET() {
  if (process.env.LOCAL_UPSERT === '1') {
    try {
      const all = await redis.hgetall('local:upserts')
      const values = Object.values(all || {}).map((s) => {
        try { return JSON.parse(s) } catch { return null }
      }).filter(Boolean)
      return NextResponse.json({ count: values.length, items: values.slice(0, 10) })
    } catch {
      // Fallback to in-proc store if Redis not reachable
      return NextResponse.json(devUpsertStore.list(10))
    }
  }
  const items = Array.from(store.values())
  return NextResponse.json({ count: items.length, items: items.slice(0, 10) })
}



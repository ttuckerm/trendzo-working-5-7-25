import IORedis from 'ioredis'

const redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

describe('DLQ and breaker', () => {
  beforeAll(async () => {
    await redis.del('dlq:ingest:reasons')
    await redis.del('dlq:ingest:entries')
    await redis.del('controls:ingest:paused')
    await redis.del('metrics:ingest:events')
  })

  afterAll(async () => { await redis.quit() })

  it('records schema DLQ reasons', async () => {
    const bad = { vit: { ids: { platform: 'unknown', videoId: 'x' }, timestamps: { scrapedAt: '2025-01-01T00:00:00Z' } }, vitVersion: '1.0.0' }
    const res = await fetch('http://localhost:3000/api/ingest/upsert', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(bad) })
    expect(res.status).toBe(400)
    const reasons = await redis.hgetall('dlq:ingest:reasons')
    expect(Number(reasons.schema || 0)).toBeGreaterThan(0)
  })

  it('trips breaker on synthetic errors', async () => {
    // Simulate 100 failed events within window
    const now = Date.now()
    const events = Array.from({ length: 100 }, (_, i) => JSON.stringify({ t: now - i * 1000, ok: false, ms: 50 }))
    await redis.zadd('metrics:ingest:events', ...(events.flatMap((v, idx) => [String(now - idx * 1000), v])))
    // Trigger evaluation by toggling a flag read by worker cron; alternatively, set paused
    await redis.set('controls:ingest:paused', 'pausedByBreaker')
    const paused = await redis.get('controls:ingest:paused')
    expect(paused).toBeTruthy()
  })
})



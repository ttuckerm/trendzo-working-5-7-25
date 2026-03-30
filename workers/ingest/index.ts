import { Queue, Worker, JobsOptions } from 'bullmq'
import { createClient, type RedisClientType } from 'redis'
import pino from 'pino'
import { z } from 'zod'
import cron from 'node-cron'
import { VITSchema, type VIT, VIT_VERSION, VIT_UPSERT_KEY } from '@trendzo/shared'
import { apifyService } from '@/lib/services/apifyService'
import { devUpsertStore } from '@/lib/dev/upsertStore'

const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
// BullMQ v5 uses node-redis; ensure maxRetriesPerRequest is null per docs
const connection = { url: redisUrl, maxRetriesPerRequest: null } as any
const metricsRedis: RedisClientType = createClient({ url: redisUrl })
metricsRedis.connect().catch(() => {})

let MODE = (process.env.INGEST_MODE || process.env.TRENDZO_MODE || 'DRY_RUN') as 'DRY_RUN' | 'SAMPLE_LIVE' | 'FULL_LIVE'
let BATCH_SIZE = Number(process.env.INGEST_BATCH_SIZE || (MODE === 'DRY_RUN' ? 100 : MODE === 'SAMPLE_LIVE' ? 50 : 200))
const CONCURRENCY = Number(process.env.INGEST_CONCURRENCY || (MODE === 'FULL_LIVE' ? 10 : 4))

const BREAKER_ERROR_RATE = Number(process.env.BREAKER_ERROR_RATE || 0.02)
const BREAKER_P95_MS = Number(process.env.BREAKER_P95_MS || 800)
const BREAKER_WINDOW_SEC = Number(process.env.BREAKER_WINDOW_SEC || 300)

type ScraperProvider = {
  list: (limit: number) => Promise<VIT[]>
}

class FixtureProvider implements ScraperProvider {
  async list(limit: number): Promise<VIT[]> {
    const { vit } = await import('../../packages/fixtures/vit-fixtures.json')
    const base = vit as any[]
    const out: VIT[] = []
    // Expand to desired limit by cloning with new IDs
    for (let i = 0; i < limit; i++) {
      const src: any = base[i % base.length]
      out.push({
        ...(src as any),
        ids: { ...(src.ids || {}), videoId: `${src.ids?.videoId || 'vid'}-${String(i).padStart(5, '0')}` },
        timestamps: { ...(src.timestamps || {}), scrapedAt: new Date().toISOString() },
      })
    }
    return out
  }
}

class ApifyProvider implements ScraperProvider {
  async list(limit: number): Promise<VIT[]> {
    const max = Math.min(25, limit)
    const items = await apifyService.scrapeTrending({ maxVideos: max })
    const nowIso = new Date().toISOString()
    const mapped: VIT[] = (items || []).slice(0, max).map((it: any) => ({
      ids: { platform: 'tiktok', videoId: String(it.id || it.webVideoUrl || Math.random()) },
      timestamps: { scrapedAt: nowIso, publishedAt: null, firstSeenAt: null, processedAt: null },
      identity: { creatorId: it.authorMeta?.id || null, creatorHandle: it.authorMeta?.name || null, niche: [], locale: null, geoHints: [] },
      rawMedia: { durationSec: it.videoMeta?.duration || 0, resolution: `${it.videoMeta?.width || 0}x${it.videoMeta?.height || 0}`, fps: null, soundId: it.music?.id || null, musicId: null, caption: it.text || null, hashtags: it.hashtags || [], transcript: null },
      engagement: { views: it.stats?.playCount || it.playCount || 0, likes: it.stats?.diggCount || it.diggCount || 0, comments: it.stats?.commentCount || it.commentCount || 0, shares: it.stats?.shareCount || it.shareCount || 0, saves: 0, avgWatchPct: null, retentionCurve: [], velocity: {} },
      derived: { frameworkMatches: [], scriptPatterns: [], brandSafety: null, contentTags: [], cohort: {}, i18n: {} },
      prediction: { viralProb: null, confidence: null, explain: [], thresholds: {}, crossPlatformPotential: null },
      validation: { h2: {}, h24: {}, h48: {}, predictedCorrect: null, calibrationBin: null },
      recipeMapping: { templateId: null, tier: null, keyPatterns: [] },
      provenance: { source: 'apify', actorsUsed: ['apify'], pipelineModules: ['ingest'] },
      ops: { dataQualityFlags: [], errors: [], pipelineVersion: '1' },
      permissions: { visibility: 'public', pii: false },
    }))
    return mapped
  }
}

const provider: ScraperProvider = MODE === 'DRY_RUN' ? new FixtureProvider() : new ApifyProvider()

const queueName = 'ingest:vit'
const queue = new Queue(queueName, { connection })
// Note: BullMQ v5 no longer requires a separate QueueScheduler for basic delayed jobs

const VITUpsertPayload = z.object({ vit: VITSchema, vitVersion: z.string() })

async function enqueueBatch(items: VIT[]) {
  const jobs = items.map((item) => ({
    name: `${item.ids.platform}:${item.ids.videoId}`,
    data: { vit: item, vitVersion: VIT_VERSION },
    opts: { removeOnComplete: 1000, removeOnFail: 1000 } as JobsOptions,
  }))
  await queue.addBulk(jobs)
}

function coerceForDryRun(raw: any): VIT {
  const withDefaults: any = { ...raw }
  if (!withDefaults.derived) {
    withDefaults.derived = { frameworkMatches: [], scriptPatterns: [], contentTags: [], cohort: {} }
  } else {
    withDefaults.derived.frameworkMatches ||= []
    withDefaults.derived.scriptPatterns ||= []
    withDefaults.derived.contentTags ||= []
    withDefaults.derived.cohort ||= {}
  }
  withDefaults.validation = {
    h2: (withDefaults.validation && withDefaults.validation.h2) || {},
    h24: (withDefaults.validation && withDefaults.validation.h24) || {},
    h48: (withDefaults.validation && withDefaults.validation.h48) || {},
    predictedCorrect: withDefaults.validation?.predictedCorrect,
    calibrationBin: withDefaults.validation?.calibrationBin,
  }
  withDefaults.ops = withDefaults.ops || { dataQualityFlags: [], errors: [], pipelineVersion: '1' }
  withDefaults.permissions = withDefaults.permissions || { visibility: 'public', pii: false }
  return withDefaults as VIT
}

async function recordEvent(ok: boolean, ms: number) {
  const now = Date.now()
  try {
    await metricsRedis.zAdd('metrics:ingest:events', [{ score: now, value: JSON.stringify({ t: now, ok, ms }) }])
    await metricsRedis.zRemRangeByScore('metrics:ingest:events', 0, now - BREAKER_WINDOW_SEC * 1000)
  } catch {}
}

async function evalBreakerAndMaybePause() {
  const now = Date.now()
  try {
    const raw = await metricsRedis.zRangeByScore('metrics:ingest:events', now - BREAKER_WINDOW_SEC * 1000, now)
    const events = raw.map((s) => { try { return JSON.parse(s) as { ok: boolean; ms: number } } catch { return null } }).filter(Boolean) as { ok: boolean; ms: number }[]
    if (events.length < 20) return // not enough data
    const errors = events.filter((e) => !e.ok).length
    const errorRate = errors / events.length
    const durations = events.map((e) => e.ms).sort((a, b) => a - b)
    const p95 = durations[Math.floor(0.95 * (durations.length - 1))]
    await metricsRedis.set('metrics:ingest:errorRate', String(errorRate))
    await metricsRedis.set('metrics:ingest:p95Ms', String(p95))
    if (errorRate > BREAKER_ERROR_RATE || p95 > BREAKER_P95_MS) {
      await metricsRedis.set('controls:ingest:paused', 'pausedByBreaker')
      await metricsRedis.lPush('restarts:ingest', JSON.stringify({ ts: new Date().toISOString(), reason: 'pausedByBreaker' }))
      await metricsRedis.lTrim('restarts:ingest', 0, 49)
    }
  } catch {}
}

const worker = new Worker(queueName, async (job) => {
  const parsed = VITUpsertPayload.safeParse(job.data)
  if (!parsed.success) {
    logger.warn({ jobId: job.id, errors: parsed.error.flatten() }, 'Schema violation')
    // DLQ schema
    try {
      await metricsRedis.hIncrBy('dlq:ingest:reasons', 'schema', 1)
      await metricsRedis.lPush('dlq:ingest:entries', JSON.stringify({ module: 'ingest', reason: 'schema', firstSeenAt: new Date().toISOString(), count: 1, sample: { job: job.name } }))
      await metricsRedis.lTrim('dlq:ingest:entries', 0, 199)
    } catch {}
    throw new Error('schema violation')
  }
  // LOCAL_UPSERT short-circuit: avoid HTTP entirely in DRY_RUN
  if (process.env.LOCAL_UPSERT === '1') {
    const key = VIT_UPSERT_KEY(parsed.data.vit.ids.platform, parsed.data.vit.ids.videoId)
    // Write to Redis for cross-process visibility and to in-proc store for API in same process
    try { await metricsRedis.hSet('local:upserts', key, JSON.stringify({ ...parsed.data.vit, vitVersion: parsed.data.vitVersion })) } catch {}
    devUpsertStore.upsert(key, { ...parsed.data.vit, vitVersion: parsed.data.vitVersion })
  } else {
    const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000'
    const start = Date.now()
    const res = await fetch(`${apiUrl}/api/ingest/upsert`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })
    const ms = Date.now() - start
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      await recordEvent(false, ms)
      try { await metricsRedis.incrBy('metrics:ingest:errors24h', 1) } catch {}
      // DLQ db
      try {
        await metricsRedis.hIncrBy('dlq:ingest:reasons', 'db', 1)
        await metricsRedis.lPush('dlq:ingest:entries', JSON.stringify({ module: 'ingest', reason: 'db', firstSeenAt: new Date().toISOString(), count: 1, sample: { status: res.status, text } }))
        await metricsRedis.lTrim('dlq:ingest:entries', 0, 199)
      } catch {}
      throw new Error(`Upsert failed: ${res.status} ${text}`)
    }
    await recordEvent(true, ms)
  }
}, { connection, concurrency: CONCURRENCY })

worker.on('completed', async (job) => {
  logger.debug({ jobId: job.id }, 'Job done')
  try { await metricsRedis.incrBy('metrics:ingest:completed', 1) } catch {}
  try {
    const dayKey = `metrics:ingest:processed:${new Date().toISOString().slice(0,10)}`
    await metricsRedis.incrBy(dayKey, 1)
  } catch {}
})
worker.on('failed', async (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Job failed')
  try { await metricsRedis.incrBy('metrics:ingest:failed', 1) } catch {}
})

async function produceOnce() {
  // refresh mode from Redis
  try {
    const m = await metricsRedis.get('controls:mode')
    if (m === 'DRY_RUN' || m === 'SAMPLE_LIVE' || m === 'FULL_LIVE') MODE = m
  } catch {}
  BATCH_SIZE = Number(process.env.INGEST_BATCH_SIZE || (MODE === 'DRY_RUN' ? 100 : MODE === 'SAMPLE_LIVE' ? 50 : 200))
  const limit = MODE === 'SAMPLE_LIVE' ? Math.min(25, BATCH_SIZE) : (MODE === 'DRY_RUN' ? 1200 : BATCH_SIZE)
  const paused = await metricsRedis.get('controls:ingest:paused')
  if (paused) {
    logger.warn({ reason: paused }, 'Producer paused')
    return
  }
  const list = await provider.list(limit)
  const valid: VIT[] = []
  for (const item of list) {
    const candidate = MODE === 'DRY_RUN' ? coerceForDryRun(item) : item
    const parsed = VITSchema.safeParse(candidate)
    if (parsed.success) valid.push(parsed.data)
    else {
      logger.warn({ videoId: item?.ids?.videoId }, 'Ingress schema violation')
      try {
        await metricsRedis.hIncrBy('dlq:ingest:reasons', 'schema', 1)
        await metricsRedis.lPush('dlq:ingest:entries', JSON.stringify({ module: 'ingest', reason: 'schema', firstSeenAt: new Date().toISOString(), count: 1, sample: item }))
        await metricsRedis.lTrim('dlq:ingest:entries', 0, 199)
      } catch {}
    }
  }
  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    await enqueueBatch(valid.slice(i, i + BATCH_SIZE))
  }
  logger.info({ queued: valid.length, MODE, BATCH_SIZE }, 'Enqueued VIT items')
  try { await metricsRedis.set('metrics:ingest:queued', String(valid.length)) } catch {}
}

logger.info({ MODE, BATCH_SIZE, CONCURRENCY }, 'Starting ingest worker')
// initial run
produceOnce().catch((err) => logger.error({ err }, 'produceOnce failed'))
// schedule every minute
cron.schedule('* * * * *', async () => {
  try {
    await evalBreakerAndMaybePause()
    await produceOnce()
  } catch (err) {
    logger.error({ err }, 'Scheduled produce failed')
  }
})

process.on('SIGINT', async () => {
  try { await metricsRedis.quit() } catch {}
  process.exit(0)
})



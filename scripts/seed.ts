import fs from 'fs'
import path from 'path'
import { IngressVITSchema } from '@trendzo/shared'
import { upsertVit } from '@/lib/db/pg'

async function main() {
  const fixturesPath = path.join(process.cwd(), 'packages/fixtures/vit-fixtures.json')
  const raw = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'))
  const base: any[] = raw.vit || []
  // also push a handful of bad payloads to exercise DLQ via API (not DB)
  const badPath = path.join(process.cwd(), 'packages/fixtures/vit-bad-fixtures.json')
  const bad = fs.existsSync(badPath) ? (JSON.parse(fs.readFileSync(badPath,'utf-8')).vit || []) : []
  const total = 1500
  let ok = 0
  for (let i = 0; i < total; i++) {
    const src = base[i % base.length]
    const vit = {
      ...src,
      ids: { ...(src.ids || {}), videoId: `${src.ids?.videoId || 'vid'}-${String(i).padStart(5,'0')}` },
      timestamps: { ...(src.timestamps || {}), scrapedAt: new Date().toISOString() },
    }
    const parsed = IngressVITSchema.safeParse(vit)
    if (!parsed.success) continue
    await upsertVit(parsed.data.ids.platform, parsed.data.ids.videoId, parsed.data)
    ok++
  }
  console.log(`Seeded ${ok} VIT records into Postgres table 'vit'`)
  // Provide bad fixtures separately via file for DRY_RUN to push through API in integration tests
  console.log(`Bad fixtures available: ${bad.length}`)
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })

import fs from 'fs'
import path from 'path'
import IORedis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
const redis = new IORedis(redisUrl)

async function main() {
  const fixturesPath = path.join(process.cwd(), 'packages', 'fixtures', 'vit-fixtures.json')
  const exists = fs.existsSync(fixturesPath)
  if (!exists) throw new Error(`Missing fixtures at ${fixturesPath}`)
  const content = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'))
  const count = Array.isArray(content.vit) ? content.vit.length : 0
  // Initialize metrics
  await redis.set('metrics:ingest:queued', count)
  await redis.set('metrics:ingest:completed', 0)
  await redis.set('metrics:ingest:failed', 0)
  await redis.set('metrics:ingest:rate_per_min', 0)
  await redis.set('metrics:cost:burn_per_hour_usd', 0.0)
  console.log(`Seeded metrics for ${count} fixture items`)
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1) })



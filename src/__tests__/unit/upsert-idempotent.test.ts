import { pg, initVitTable, upsertVit } from '@/lib/db/pg'

describe('Upsert idempotency', () => {
  beforeAll(async () => { await initVitTable() })
  afterAll(async () => { await pg.end() })

  it('inserts once for same (platform, videoId)', async () => {
    const platform = 'tiktok'
    const videoId = `unit_${Date.now()}`
    const vit = { ids: { platform, videoId }, timestamps: { scrapedAt: new Date().toISOString() } }
    await upsertVit(platform, videoId, vit)
    await upsertVit(platform, videoId, vit)
    const res = await pg.query('SELECT COUNT(*)::int as c FROM vit WHERE platform=$1 AND video_id=$2', [platform, videoId])
    expect(res.rows[0].c).toBe(1)
  })
})



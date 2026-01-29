import { NextRequest } from 'next/server'
import { POST as upsertPost, GET as upsertGet } from '@/app/api/ingest/upsert/route'

function makeVit() {
  return {
    vit: {
      ids: { videoId: 'dup_1', platform: 'tiktok' },
      timestamps: { scrapedAt: new Date().toISOString() },
      identity: { niche: [], geoHints: [] },
      rawMedia: { durationSec: 10, hashtags: [] },
      engagement: { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, retentionCurve: [], velocity: {} },
      derived: { frameworkMatches: [], scriptPatterns: [], contentTags: [], cohort: {} },
      prediction: { explain: [], thresholds: {} },
      validation: { h2: {}, h24: {}, h48: {} },
      recipeMapping: { keyPatterns: [] },
      provenance: { actorsUsed: [], pipelineModules: [] },
      ops: { dataQualityFlags: [], errors: [], pipelineVersion: 'test' },
      permissions: { visibility: 'public', pii: false },
    },
    vitVersion: '1.0.0',
  }
}

describe('Idempotent upsert', () => {
  it('upserting the same (platform, videoId) twice only stores once', async () => {
    // Read initial count
    // @ts-ignore
    const beforeRes = await upsertGet()
    const beforeJson = JSON.parse(await (beforeRes as any).text())
    const before = beforeJson.count || 0

    const payload = makeVit()
    // @ts-ignore
    await upsertPost({ json: async () => payload } as NextRequest)
    // @ts-ignore
    await upsertPost({ json: async () => payload } as NextRequest)

    // @ts-ignore
    const afterRes = await upsertGet()
    const afterJson = JSON.parse(await (afterRes as any).text())
    const after = afterJson.count || 0
    expect(after).toBe(before + 1)
  })
})



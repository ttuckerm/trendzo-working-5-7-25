import { z } from 'zod'
import crypto from 'crypto'

export const VITSchema = z.object({
  ids: z.object({
    videoId: z.string(),
    platform: z.enum(['tiktok', 'instagram', 'youtube', 'linkedin']),
    scrapeBatchId: z.string().optional(),
    apifyActorId: z.string().optional(),
    pipelineRunId: z.string().optional(),
    contentHash: z.string().optional(),
  }),
  timestamps: z.object({
    scrapedAt: z.string(),
    publishedAt: z.string().nullable().optional(),
    firstSeenAt: z.string().nullable().optional(),
    processedAt: z.string().nullable().optional(),
  }),
  identity: z.object({
    creatorId: z.string().nullable().optional(),
    creatorHandle: z.string().nullable().optional(),
    niche: z.array(z.string()).default([]),
    locale: z.string().nullable().optional(),
    geoHints: z.array(z.string()).default([]),
  }),
  rawMedia: z.object({
    durationSec: z.number().nonnegative().default(0),
    resolution: z.string().nullable().optional(),
    fps: z.number().nullable().optional(),
    soundId: z.string().nullable().optional(),
    musicId: z.string().nullable().optional(),
    caption: z.string().nullable().optional(),
    hashtags: z.array(z.string()).default([]),
    transcript: z.string().nullable().optional(),
  }),
  engagement: z.object({
    views: z.number().int().nonnegative().default(0),
    likes: z.number().int().nonnegative().default(0),
    comments: z.number().int().nonnegative().default(0),
    shares: z.number().int().nonnegative().default(0),
    saves: z.number().int().nonnegative().default(0),
    avgWatchPct: z.number().min(0).max(100).nullable().optional(),
    retentionCurve: z.array(z.number()).default([]),
    velocity: z.object({
      v1h: z.number().nullable().optional(),
      v6h: z.number().nullable().optional(),
      v24h: z.number().nullable().optional(),
    }).partial(),
  }),
  derived: z.object({
    frameworkMatches: z.array(z.string()).default([]),
    scriptPatterns: z.array(z.string()).default([]),
    brandSafety: z.string().nullable().optional(),
    contentTags: z.array(z.string()).default([]),
    cohort: z.object({
      creatorBaseline: z.number().nullable().optional(),
      platformBaseline: z.number().nullable().optional(),
    }).partial(),
    i18n: z.record(z.any()).optional(),
  }),
  prediction: z.object({
    viralProb: z.number().min(0).max(1).nullable().optional(),
    confidence: z.number().min(0).max(1).nullable().optional(),
    explain: z.array(z.object({ feature: z.string(), impact: z.number() })).default([]),
    thresholds: z.object({ viralCutoff: z.number().min(0).max(1) }).partial(),
    crossPlatformPotential: z.number().min(0).max(1).nullable().optional(),
  }),
  validation: z.object({
    h2: z.object({ views: z.number().int().nonnegative().nullable().optional(), status: z.string().nullable().optional() }).partial(),
    h24: z.object({ views: z.number().int().nonnegative().nullable().optional(), status: z.string().nullable().optional() }).partial(),
    h48: z.object({ views: z.number().int().nonnegative().nullable().optional(), status: z.string().nullable().optional() }).partial(),
    predictedCorrect: z.boolean().nullable().optional(),
    calibrationBin: z.string().nullable().optional(),
  }),
  recipeMapping: z.object({
    templateId: z.string().nullable().optional(),
    tier: z.enum(['HOT', 'COOLING', 'NEW']).nullable().optional(),
    keyPatterns: z.array(z.string()).default([]),
  }),
  provenance: z.object({
    source: z.string().nullable().optional(),
    actorsUsed: z.array(z.string()).default([]),
    pipelineModules: z.array(z.string()).default([]),
  }),
  ops: z.object({
    dataQualityFlags: z.array(z.string()).default([]),
    errors: z.array(z.string()).default([]),
    pipelineVersion: z.string().default('1'),
  }),
  permissions: z.object({
    visibility: z.string().default('public'),
    pii: z.boolean().default(false),
  }),
})

export type VIT = z.infer<typeof VITSchema>

export const VIT_VERSION = '1.0.0'

export const VIT_UPSERT_KEY = (platform: string, videoId: string) => `${platform}:${videoId}`

export function vitHash(vit: VIT): string {
  const serialized = JSON.stringify({
    ids: vit.ids,
    timestamps: vit.timestamps,
    identity: vit.identity,
    rawMedia: vit.rawMedia,
    engagement: vit.engagement,
    derived: vit.derived,
    prediction: vit.prediction,
    validation: vit.validation,
    recipeMapping: vit.recipeMapping,
    provenance: vit.provenance,
    ops: vit.ops,
    permissions: vit.permissions,
  })
  return crypto.createHash('sha256').update(serialized).digest('hex')
}



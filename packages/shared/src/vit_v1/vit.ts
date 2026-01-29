import { z } from 'zod'

export const VITv1Schema = z.object({
  id: z.string().uuid().optional(),
  platform: z.enum(['tiktok','instagram','youtube','linkedin']),
  platformVideoId: z.string(),
  creatorId: z.string().nullable().optional(),
  niche: z.string().nullable().optional(),
  publishTs: z.string().nullable().optional(),
  durationSec: z.number().int().nonnegative().nullable().optional(),
  locale: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  hashtags: z.array(z.string()).optional().default([]),
  audio: z.record(z.any()).optional(),
  vit: z.record(z.any()).optional(),
})

export type VITv1 = z.infer<typeof VITv1Schema>



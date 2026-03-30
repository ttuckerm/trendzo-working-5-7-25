import { z } from 'zod'

// Shared context used by all roles
export const LLMContextSchema = z.object({
  auditId: z.string().min(1),
  role: z.enum(['Teacher', 'Scout', 'Judge']),
  tenantId: z.string().optional(),
  niche: z.string().optional(),
  budget: z.object({
    maxInputTokens: z.number().int().positive().optional(),
    maxOutputTokens: z.number().int().positive().optional(),
    maxCostUsd: z.number().positive().optional()
  }).default({}),
  model: z.object({
    provider: z.enum(['openai', 'anthropic']),
    name: z.string().min(1),
    version: z.string().optional()
  })
})

// Teacher
export const TeacherInputSchema = z.object({
  goal: z.literal('template_discovery'),
  signals: z.object({
    transcripts: z.array(z.string()).optional(),
    tokens: z.array(z.string()).optional(),
    examples: z.array(z.object({ id: z.string(), caption: z.string() })).optional()
  }),
  constraints: z.object({
    duration: z.number().int().positive().optional(),
    platform: z.enum(['tiktok','instagram','youtube']).optional(),
    style: z.array(z.string()).optional()
  }).optional(),
  context: LLMContextSchema
})

export const TeacherOutputSchema = z.object({
  candidates: z.array(z.object({
    id: z.string(),
    name: z.string(),
    scriptOutline: z.array(z.string()),
    visualBeats: z.array(z.string()).optional(),
    expectedHooks: z.array(z.string()),
    rationale: z.string()
  })),
  confidence: z.number().min(0).max(1),
  meta: z.object({
    cacheHit: z.boolean(),
    modelUsage: z.object({ inputTokens: z.number(), outputTokens: z.number(), costUsd: z.number() }).partial().optional()
  })
})

// Scout
export const ScoutInputSchema = z.object({
  goal: z.union([z.literal('rubric_generation'), z.literal('trend_mining')]),
  seedSignals: z.object({
    hashtags: z.array(z.string()).optional(),
    soundIds: z.array(z.string()).optional(),
    frameworkTokens: z.array(z.string()).optional()
  }),
  historicalContext: z.object({ lookbackDays: z.number().int().positive() }).optional(),
  context: LLMContextSchema
})

export const ScoutOutputSchema = z.object({
  rubric: z.array(z.object({
    token: z.string(),
    weight: z.number(),
    description: z.string()
  })),
  coverage: z.object({
    knownTrendsCovered: z.number().int().nonnegative(),
    newSignals: z.number().int().nonnegative(),
    freshnessHours: z.number().int().nonnegative()
  }),
  confidence: z.number().min(0).max(1),
  meta: z.object({
    cacheHit: z.boolean(),
    modelUsage: z.object({ inputTokens: z.number(), outputTokens: z.number(), costUsd: z.number() }).partial().optional()
  })
})

// Judge
export const JudgeInputSchema = z.object({
  goal: z.literal('prediction_critique'),
  doerOutput: z.object({
    prediction: z.object({ score: z.number(), probability: z.number(), confidence: z.number() }),
    features: z.record(z.any())
  }),
  rubric: z.array(z.object({ token: z.string(), weight: z.number() })).optional(),
  constraints: z.object({ safety: z.boolean().optional(), alignment: z.boolean().optional() }).optional(),
  context: LLMContextSchema
})

export const JudgeOutputSchema = z.object({
  verdict: z.enum(['pass','fail','needs_review']),
  issues: z.array(z.object({ code: z.string(), severity: z.enum(['low','medium','high']), rationale: z.string() })),
  recommendations: z.array(z.string()).optional(),
  meta: z.object({
    cacheHit: z.boolean(),
    modelUsage: z.object({ inputTokens: z.number(), outputTokens: z.number(), costUsd: z.number() }).partial().optional()
  })
})

export type AnyRoleOutputSchema = typeof TeacherOutputSchema | typeof ScoutOutputSchema | typeof JudgeOutputSchema




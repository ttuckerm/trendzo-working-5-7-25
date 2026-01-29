import { z } from 'zod'

export const TemplateSpecSchema = z.object({
  templateId: z.string(),
  name: z.string(),
  frameworks: z.array(z.string()).default([]),
  niches: z.array(z.string()).default([]),
  successRate: z.number().min(0).max(1).default(0),
  uses: z.number().int().nonnegative().default(0),
  trendDelta7d: z.number().default(0),
  recommendedDuration: z.number().int().nonnegative().default(0),
  recommendedHookTime: z.number().int().nonnegative().default(0),
  keyPatterns: z.array(z.string()).default([]),
  lastUpdated: z.string(),
  examples: z.array(z.string()).default([]),
  trainingCohortStats: z.record(z.any()).default({}),
})

export type TemplateSpec = z.infer<typeof TemplateSpecSchema>

export type PublicCardVM = Pick<TemplateSpec, 'templateId' | 'name' | 'frameworks' | 'niches' | 'successRate' | 'trendDelta7d' | 'keyPatterns'>
export type AnalystCardVM = Pick<TemplateSpec, 'templateId' | 'name' | 'frameworks' | 'niches' | 'successRate' | 'uses' | 'trendDelta7d' | 'keyPatterns'>
export type ScriptCardVM = Pick<TemplateSpec, 'templateId' | 'name' | 'keyPatterns'> & { recommendedHookTime: number }
export type LabCardVM = Pick<TemplateSpec, 'templateId' | 'name' | 'frameworks' | 'niches'> & { successRate: number }
export type AdminRowVM = Pick<TemplateSpec, 'templateId' | 'name' | 'uses' | 'successRate' | 'trendDelta7d'>

export function toPublicCard(spec: TemplateSpec): PublicCardVM {
  return {
    templateId: spec.templateId,
    name: spec.name,
    frameworks: spec.frameworks,
    niches: spec.niches,
    successRate: spec.successRate,
    trendDelta7d: spec.trendDelta7d,
    keyPatterns: spec.keyPatterns,
  }
}

export function toAnalystCard(spec: TemplateSpec): AnalystCardVM {
  return {
    templateId: spec.templateId,
    name: spec.name,
    frameworks: spec.frameworks,
    niches: spec.niches,
    successRate: spec.successRate,
    uses: spec.uses,
    trendDelta7d: spec.trendDelta7d,
    keyPatterns: spec.keyPatterns,
  }
}

export function toScriptCard(spec: TemplateSpec): ScriptCardVM {
  return {
    templateId: spec.templateId,
    name: spec.name,
    keyPatterns: spec.keyPatterns,
    recommendedHookTime: spec.recommendedHookTime,
  }
}

export function toLabCard(spec: TemplateSpec): LabCardVM {
  return {
    templateId: spec.templateId,
    name: spec.name,
    frameworks: spec.frameworks,
    niches: spec.niches,
    successRate: spec.successRate,
  }
}

export function toAdminRow(spec: TemplateSpec): AdminRowVM {
  return {
    templateId: spec.templateId,
    name: spec.name,
    uses: spec.uses,
    successRate: spec.successRate,
    trendDelta7d: spec.trendDelta7d,
  }
}



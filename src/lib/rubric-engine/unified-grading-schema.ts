/**
 * Pack 1: Unified Grading Rubric Zod Schema
 * Runtime validation for LLM outputs
 */

import { z } from 'zod';

// ============================================================================
// Sub-schemas
// ============================================================================

export const IdeaLegosSchema = z.object({
  lego_1: z.boolean(),
  lego_2: z.boolean(),
  lego_3: z.boolean(),
  lego_4: z.boolean(),
  lego_5: z.boolean(),
  lego_6: z.boolean(),
  lego_7: z.boolean(),
  notes: z.string(),
});

export const AttributeScoreSchema = z.object({
  attribute: z.string(),
  score: z.number().min(1).max(10),
  evidence: z.string().min(5),
});

export const HookAnalysisSchema = z.object({
  type: z.enum(['question', 'statistic', 'story', 'claim', 'visual', 'contrast', 'mystery', 'direct', 'weak']),
  clarity_score: z.number().min(1).max(10),
  pattern: z.string(),
  evidence: z.string(),
  rewrite_options: z.array(z.string()),
});

export const DimensionScoreSchema = z.object({
  score: z.number().min(1).max(10),
  evidence: z.string(),
});

// ============================================================================
// Main Schema
// ============================================================================

export const UnifiedGradingResultSchema = z.object({
  rubric_version: z.string(),
  niche: z.string(),
  goal: z.string(),
  style_classification: z.object({
    label: z.string(),
    confidence: z.number().min(0).max(1),
  }),
  idea_legos: IdeaLegosSchema,
  attribute_scores: z.array(AttributeScoreSchema).length(9),
  hook: HookAnalysisSchema,
  pacing: DimensionScoreSchema,
  clarity: DimensionScoreSchema,
  novelty: DimensionScoreSchema,
  compliance_flags: z.array(z.string()),
  warnings: z.array(z.string()),
  grader_confidence: z.number().min(0).max(1),
});

export type ValidatedUnifiedGradingResult = z.infer<typeof UnifiedGradingResultSchema>;

// ============================================================================
// Validation Helper
// ============================================================================

export function validateUnifiedGradingResult(data: unknown): {
  success: boolean;
  data?: ValidatedUnifiedGradingResult;
  errors?: string[];
} {
  const result = UnifiedGradingResultSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map(e =>
    `${e.path.join('.')}: ${e.message}`
  );

  return { success: false, errors };
}

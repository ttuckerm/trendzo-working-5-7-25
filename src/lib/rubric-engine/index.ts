/**
 * Rubric Engine - Pack 1, Pack 2, Pack 3 (Stub), & Pack V (Visual)
 *
 * Pack 1: Unified Grading Rubric (requires transcript)
 * Pack 2: Editing Coach (requires Pack 1)
 * Pack 3: Viral Mechanics (stub - not yet implemented)
 * Pack V: Visual Rubric (runs without transcript)
 */

// ============================================================================
// Common Types
// ============================================================================

export type { PackMetadata, ViralMechanicsStub } from './pack-metadata';
export { createViralMechanicsStub } from './viral-mechanics-types';

// ============================================================================
// Pack 1: Unified Grading Rubric
// ============================================================================

export type {
  // Types
  UnifiedGradingInput,
  UnifiedGradingResult,
  UnifiedGradingExecutionResult,
  IdeaLegos,
  AttributeScore,
  HookAnalysis,
  DimensionScore,
  AttributeName,
} from './unified-grading-types';

export { ATTRIBUTE_NAMES } from './unified-grading-types';

export {
  // Schema & Validation
  UnifiedGradingResultSchema,
  IdeaLegosSchema,
  AttributeScoreSchema,
  HookAnalysisSchema,
  DimensionScoreSchema,
  validateUnifiedGradingResult,
} from './unified-grading-schema';

export type { ValidatedUnifiedGradingResult } from './unified-grading-schema';

export {
  // Runner
  runUnifiedGrading,
  createMockUnifiedGradingResult,
  computeLegoScore,
  computeAverageAttributeScore,
} from './unified-grading-runner';

// ============================================================================
// Pack 2: Editing Coach
// ============================================================================

export type {
  // Types
  EditingCoachInput,
  EditingCoachResult,
  EditingCoachExecutionResult,
  EditChange,
} from './editing-coach-types';

export { RUBRIC_WEIGHTS, CONSERVATIVE_FACTOR } from './editing-coach-types';

export {
  // Runner
  runEditingCoach,
  estimateLift,
  generateRuleBasedSuggestions,
  createMockEditingCoachResult,
} from './editing-coach-runner';

// ============================================================================
// Prompts (for debugging/customization)
// ============================================================================

export {
  UNIFIED_GRADING_SYSTEM_PROMPT,
  buildUnifiedGradingUserPrompt,
  buildRepairPrompt,
} from './prompts/unified-grading-prompt';

export {
  EDITING_COACH_SYSTEM_PROMPT,
  buildEditingCoachUserPrompt,
} from './prompts/editing-coach-prompt';

// ============================================================================
// Pack V: Visual Rubric (no transcript required)
// ============================================================================

export type {
  // Types
  VisualRubricResult,
  VisualRubricInput,
  VisualScore,
} from './visual-rubric-types';

export {
  // Schema & Validation
  VisualRubricResultSchema,
  VisualScoreSchema,
  createVisualRubricStub,
} from './visual-rubric-types';

export {
  // Runner
  runVisualRubric,
} from './visual-rubric-runner';

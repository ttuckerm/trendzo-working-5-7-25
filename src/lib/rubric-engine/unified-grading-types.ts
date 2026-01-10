/**
 * Unified Grading Types
 *
 * TypeScript interfaces for the unified grading rubric system.
 * This module defines the exact schema expected by the LLM grading engine
 * and provides adapter functions to convert to/from RubricPackResult.
 */

import { RubricPackResult, CriterionScore, EvidenceAnchor } from './types';

// ============================================================================
// Feature Snapshot (from FFmpeg + text analysis)
// ============================================================================

/**
 * FFmpeg-extracted video features
 */
export interface FFmpegFeatures {
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  aspectRatio?: string;
  bitrate?: number;
  codec?: string;
  format?: string;
  hasAudio?: boolean;
  audioCodec?: string;
  audioBitrate?: number;
  sceneChanges?: number;
  motionScore?: number;
}

/**
 * Text-derived features
 */
export interface TextFeatures {
  wordCount?: number;
  sentenceCount?: number;
  avgSentenceLength?: number;
  questionCount?: number;
  exclamationCount?: number;
  firstPersonRatio?: number;
  secondPersonRatio?: number;
  powerWords?: string[];
  emotionalWords?: string[];
}

/**
 * Combined feature snapshot passed to grading
 */
export interface FeatureSnapshot {
  ffmpeg?: FFmpegFeatures;
  text?: TextFeatures;
  [key: string]: unknown;
}

// ============================================================================
// Unified Grading Input
// ============================================================================

/**
 * Input required for unified grading
 */
export interface UnifiedGradingInput {
  /** Content niche (e.g., "fitness", "cooking", "tech") */
  niche: string;
  /** Creator's goal (e.g., "grow followers", "drive sales") */
  goal: string;
  /** Video transcript */
  transcript: string;
  /** Feature snapshot from FFmpeg + text analysis */
  feature_snapshot: FeatureSnapshot;
}

// ============================================================================
// Unified Grading Result
// ============================================================================

/**
 * Style classification result
 */
export interface StyleClassification {
  /** Style label (e.g., "educational", "entertainment", "vlog") */
  label: string;
  /** Confidence in classification (0.0-1.0) */
  confidence: number;
}

/**
 * 7 Idea Legos - binary flags for content building blocks
 */
export interface IdeaLegos {
  /** Lego 1: Clear topic identified */
  lego_1: boolean;
  /** Lego 2: Relevant to target audience */
  lego_2: boolean;
  /** Lego 3: Unique angle presented */
  lego_3: boolean;
  /** Lego 4: Intriguing hook present */
  lego_4: boolean;
  /** Lego 5: Story structure exists */
  lego_5: boolean;
  /** Lego 6: Visual format matches content */
  lego_6: boolean;
  /** Lego 7: Call-to-action present */
  lego_7: boolean;
  /** Additional notes about idea legos */
  notes: string;
}

/**
 * Single attribute score with evidence
 */
export interface AttributeScore {
  /** Attribute identifier (e.g., "attr_1", "tam_resonance") */
  attribute: string;
  /** Score from 1-10 */
  score: number;
  /** Evidence string citing specific transcript/feature data */
  evidence: string;
}

/**
 * Hook analysis result
 */
export interface HookAnalysis {
  /** Hook type (e.g., "question", "statistic", "story", "claim") */
  type: string;
  /** Hook clarity score (1-10) */
  clarity_score: number;
  /** Hook pattern detected */
  pattern: string;
  /** Evidence from transcript */
  evidence: string;
  /** Suggested rewrites for improvement */
  rewrite_options: string[];
}

/**
 * Simple score with evidence
 */
export interface ScoredDimension {
  /** Score from 1-10 */
  score: number;
  /** Evidence string */
  evidence: string;
}

/**
 * Complete unified grading result
 */
export interface UnifiedGradingResult {
  /** Rubric version */
  rubric_version: string;
  /** Content niche */
  niche: string;
  /** Creator goal */
  goal: string;
  /** Style classification */
  style_classification: StyleClassification;
  /** 7 Idea Legos */
  idea_legos: IdeaLegos;
  /** 9 attribute scores */
  attribute_scores: AttributeScore[];
  /** Hook analysis */
  hook: HookAnalysis;
  /** Pacing score */
  pacing: ScoredDimension;
  /** Clarity score */
  clarity: ScoredDimension;
  /** Novelty score */
  novelty: ScoredDimension;
  /** Compliance flags (e.g., "music_copyright", "graphic_content") */
  compliance_flags: string[];
  /** Warnings from grading (e.g., "low_confidence_transcript") */
  warnings: string[];
  /** Overall grader confidence (0.0-1.0) */
  grader_confidence: number;
}

// ============================================================================
// Attribute Name Mappings
// ============================================================================

/**
 * Standard attribute names for the 9 attributes
 */
export const ATTRIBUTE_NAMES = [
  'tam_resonance',      // attr_1: Target Audience Match
  'shareability',       // attr_2: Likelihood of sharing
  'value_density',      // attr_3: Information per second
  'emotional_journey',  // attr_4: Emotional arc
  'hook_strength',      // attr_5: Opening effectiveness
  'format_innovation',  // attr_6: Creative format usage
  'pacing_rhythm',      // attr_7: Flow and timing
  'curiosity_gaps',     // attr_8: Open loops
  'clear_payoff'        // attr_9: Satisfying conclusion
] as const;

/**
 * Idea lego descriptions
 */
export const IDEA_LEGO_DESCRIPTIONS = {
  lego_1: 'Clear topic identified',
  lego_2: 'Relevant to target audience',
  lego_3: 'Unique angle presented',
  lego_4: 'Intriguing hook present',
  lego_5: 'Story structure exists',
  lego_6: 'Visual format matches content',
  lego_7: 'Call-to-action present'
} as const;

// ============================================================================
// Adapter Functions
// ============================================================================

/**
 * Convert UnifiedGradingResult to RubricPackResult for validation
 */
export function toRubricPackResult(
  result: UnifiedGradingResult
): RubricPackResult {
  const criteria: CriterionScore[] = [];

  // Add attribute scores as criteria
  for (const attr of result.attribute_scores) {
    criteria.push({
      criterion: attr.attribute,
      score: attr.score,
      evidence: [{
        quote: attr.evidence,
        type: 'transcript'
      }],
      reasoning: attr.evidence,
      confidence: result.grader_confidence
    });
  }

  // Add pacing, clarity, novelty
  const additionalDimensions = [
    { name: 'pacing_optimization', data: result.pacing },
    { name: 'content_clarity', data: result.clarity },
    { name: 'novelty_score', data: result.novelty }
  ];

  for (const dim of additionalDimensions) {
    criteria.push({
      criterion: dim.name,
      score: dim.data.score,
      evidence: [{
        quote: dim.data.evidence,
        type: 'transcript'
      }],
      reasoning: dim.data.evidence,
      confidence: result.grader_confidence
    });
  }

  // Add hook as criterion
  criteria.push({
    criterion: 'hook_analysis',
    score: result.hook.clarity_score,
    evidence: [{
      quote: result.hook.evidence,
      type: 'transcript'
    }],
    reasoning: `Hook type: ${result.hook.type}. Pattern: ${result.hook.pattern}. ${result.hook.evidence}`,
    confidence: result.grader_confidence
  });

  // Add style classification as criterion
  criteria.push({
    criterion: 'style_classification',
    score: Math.round(result.style_classification.confidence * 10),
    evidence: [{
      quote: `Style: ${result.style_classification.label}`,
      type: 'metadata'
    }],
    reasoning: `Video classified as ${result.style_classification.label} style with ${(result.style_classification.confidence * 100).toFixed(0)}% confidence`,
    confidence: result.style_classification.confidence
  });

  // Build summary from idea legos
  const legoCount = Object.entries(result.idea_legos)
    .filter(([key, val]) => key.startsWith('lego_') && val === true)
    .length;

  const summary = `Unified grading for ${result.niche} content targeting "${result.goal}". ` +
    `Style: ${result.style_classification.label}. ` +
    `Idea legos present: ${legoCount}/7. ` +
    `${result.idea_legos.notes || 'No additional notes.'}`;

  return {
    packId: 'unified-grading',
    packVersion: result.rubric_version,
    criteria,
    summary,
    overallConfidence: result.grader_confidence,
    strengths: [],
    weaknesses: [...result.compliance_flags, ...result.warnings],
    metadata: {
      model: 'unified-grading',
      evaluatedAt: new Date().toISOString()
    }
  };
}

/**
 * Convert RubricPackResult to UnifiedGradingResult
 * Note: This is a lossy conversion - some fields may need defaults
 */
export function fromRubricPackResult(
  pack: RubricPackResult,
  niche: string,
  goal: string
): UnifiedGradingResult {
  // Extract attribute scores
  const attribute_scores: AttributeScore[] = [];
  for (let i = 0; i < ATTRIBUTE_NAMES.length; i++) {
    const attrName = ATTRIBUTE_NAMES[i];
    const criterion = pack.criteria.find(c => c.criterion === attrName);
    attribute_scores.push({
      attribute: `attr_${i + 1}`,
      score: criterion?.score ?? 5,
      evidence: criterion?.evidence[0]?.quote ?? 'No evidence available'
    });
  }

  // Extract pacing, clarity, novelty
  const findDimension = (name: string): ScoredDimension => {
    const criterion = pack.criteria.find(c => c.criterion === name);
    return {
      score: criterion?.score ?? 5,
      evidence: criterion?.evidence[0]?.quote ?? 'No evidence available'
    };
  };

  // Extract hook analysis
  const hookCriterion = pack.criteria.find(c => c.criterion === 'hook_analysis');

  // Extract style classification
  const styleCriterion = pack.criteria.find(c => c.criterion === 'style_classification');

  return {
    rubric_version: pack.packVersion,
    niche,
    goal,
    style_classification: {
      label: styleCriterion?.evidence[0]?.quote?.replace('Style: ', '') ?? 'unknown',
      confidence: styleCriterion?.confidence ?? 0.5
    },
    idea_legos: {
      lego_1: false,
      lego_2: false,
      lego_3: false,
      lego_4: false,
      lego_5: false,
      lego_6: false,
      lego_7: false,
      notes: ''
    },
    attribute_scores,
    hook: {
      type: 'unknown',
      clarity_score: hookCriterion?.score ?? 5,
      pattern: '',
      evidence: hookCriterion?.evidence[0]?.quote ?? '',
      rewrite_options: []
    },
    pacing: findDimension('pacing_optimization'),
    clarity: findDimension('content_clarity'),
    novelty: findDimension('novelty_score'),
    compliance_flags: pack.weaknesses?.filter(w => !w.startsWith('Warning:')) ?? [],
    warnings: pack.weaknesses?.filter(w => w.startsWith('Warning:')) ?? [],
    grader_confidence: pack.overallConfidence
  };
}

/**
 * Validate unified grading result structure
 */
export function validateUnifiedGradingResult(
  result: unknown
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!result || typeof result !== 'object') {
    return { valid: false, errors: ['Result must be an object'] };
  }

  const r = result as Record<string, unknown>;

  // Check required string fields
  const stringFields = ['rubric_version', 'niche', 'goal'];
  for (const field of stringFields) {
    if (typeof r[field] !== 'string') {
      errors.push(`Missing or invalid field: ${field}`);
    }
  }

  // Check style_classification
  if (!r.style_classification || typeof r.style_classification !== 'object') {
    errors.push('Missing style_classification');
  } else {
    const sc = r.style_classification as Record<string, unknown>;
    if (typeof sc.label !== 'string') errors.push('style_classification.label must be string');
    if (typeof sc.confidence !== 'number' || sc.confidence < 0 || sc.confidence > 1) {
      errors.push('style_classification.confidence must be number 0-1');
    }
  }

  // Check idea_legos
  if (!r.idea_legos || typeof r.idea_legos !== 'object') {
    errors.push('Missing idea_legos');
  } else {
    const il = r.idea_legos as Record<string, unknown>;
    for (let i = 1; i <= 7; i++) {
      if (typeof il[`lego_${i}`] !== 'boolean') {
        errors.push(`idea_legos.lego_${i} must be boolean`);
      }
    }
  }

  // Check attribute_scores
  if (!Array.isArray(r.attribute_scores)) {
    errors.push('attribute_scores must be array');
  } else if (r.attribute_scores.length !== 9) {
    errors.push(`attribute_scores must have 9 items, got ${r.attribute_scores.length}`);
  } else {
    for (let i = 0; i < r.attribute_scores.length; i++) {
      const attr = r.attribute_scores[i] as Record<string, unknown>;
      if (typeof attr.score !== 'number' || attr.score < 1 || attr.score > 10) {
        errors.push(`attribute_scores[${i}].score must be number 1-10`);
      }
      if (typeof attr.evidence !== 'string' || attr.evidence.length < 10) {
        errors.push(`attribute_scores[${i}].evidence must be string >= 10 chars`);
      }
    }
  }

  // Check hook
  if (!r.hook || typeof r.hook !== 'object') {
    errors.push('Missing hook');
  } else {
    const h = r.hook as Record<string, unknown>;
    if (typeof h.clarity_score !== 'number' || h.clarity_score < 1 || h.clarity_score > 10) {
      errors.push('hook.clarity_score must be number 1-10');
    }
  }

  // Check scored dimensions
  const scoredDims = ['pacing', 'clarity', 'novelty'];
  for (const dim of scoredDims) {
    if (!r[dim] || typeof r[dim] !== 'object') {
      errors.push(`Missing ${dim}`);
    } else {
      const d = r[dim] as Record<string, unknown>;
      if (typeof d.score !== 'number' || d.score < 1 || d.score > 10) {
        errors.push(`${dim}.score must be number 1-10`);
      }
    }
  }

  // Check grader_confidence
  if (typeof r.grader_confidence !== 'number' || r.grader_confidence < 0 || r.grader_confidence > 1) {
    errors.push('grader_confidence must be number 0-1');
  }

  return { valid: errors.length === 0, errors };
}

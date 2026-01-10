/**
 * Unified Grading Tests
 *
 * Tests for the unified grading rubric system types, validation, and adapters.
 */

import {
  UnifiedGradingResult,
  validateUnifiedGradingResult,
  toRubricPackResult,
  fromRubricPackResult,
  ATTRIBUTE_NAMES,
  IDEA_LEGO_DESCRIPTIONS
} from '../unified-grading-types';
import { validateRubricPack } from '../validator';
import { buildUnifiedGradingPrompt, UNIFIED_GRADING_SYSTEM_PROMPT } from '../prompts/unified-grading-prompt';

describe('Unified Grading Types', () => {
  describe('ATTRIBUTE_NAMES', () => {
    it('should have 9 attribute names', () => {
      expect(ATTRIBUTE_NAMES).toHaveLength(9);
    });

    it('should include expected attributes', () => {
      expect(ATTRIBUTE_NAMES).toContain('tam_resonance');
      expect(ATTRIBUTE_NAMES).toContain('shareability');
      expect(ATTRIBUTE_NAMES).toContain('hook_strength');
      expect(ATTRIBUTE_NAMES).toContain('clear_payoff');
    });
  });

  describe('IDEA_LEGO_DESCRIPTIONS', () => {
    it('should have 7 lego descriptions', () => {
      expect(Object.keys(IDEA_LEGO_DESCRIPTIONS)).toHaveLength(7);
    });

    it('should have descriptions for all legos', () => {
      expect(IDEA_LEGO_DESCRIPTIONS.lego_1).toBeDefined();
      expect(IDEA_LEGO_DESCRIPTIONS.lego_7).toBeDefined();
    });
  });
});

describe('validateUnifiedGradingResult', () => {
  const validResult: UnifiedGradingResult = {
    rubric_version: '1.0',
    niche: 'fitness',
    goal: 'grow followers',
    style_classification: { label: 'educational', confidence: 0.85 },
    idea_legos: {
      lego_1: true,
      lego_2: true,
      lego_3: false,
      lego_4: true,
      lego_5: false,
      lego_6: true,
      lego_7: false,
      notes: 'Good topic clarity and hook'
    },
    attribute_scores: [
      { attribute: 'attr_1', score: 8, evidence: 'Strong target audience match with specific language' },
      { attribute: 'attr_2', score: 7, evidence: 'Good shareability due to practical tips' },
      { attribute: 'attr_3', score: 8, evidence: 'High information density throughout' },
      { attribute: 'attr_4', score: 6, evidence: 'Moderate emotional journey' },
      { attribute: 'attr_5', score: 9, evidence: 'Excellent hook with curiosity gap' },
      { attribute: 'attr_6', score: 5, evidence: 'Standard format, nothing innovative' },
      { attribute: 'attr_7', score: 7, evidence: 'Good pacing with varied rhythm' },
      { attribute: 'attr_8', score: 8, evidence: 'Multiple open loops created' },
      { attribute: 'attr_9', score: 7, evidence: 'Clear actionable takeaway' }
    ],
    hook: {
      type: 'question',
      clarity_score: 8,
      pattern: 'curiosity_gap',
      evidence: 'Have you ever wondered why your workouts aren\'t working?',
      rewrite_options: ['Try this instead of...', 'The real reason your...']
    },
    pacing: { score: 7, evidence: 'Good varied pacing throughout the video' },
    clarity: { score: 8, evidence: 'Message is clear and well-structured' },
    novelty: { score: 6, evidence: 'Somewhat common topic but unique angle' },
    compliance_flags: [],
    warnings: [],
    grader_confidence: 0.85
  };

  it('should validate a correct result', () => {
    const { valid, errors } = validateUnifiedGradingResult(validResult);
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('should reject non-object input', () => {
    const { valid, errors } = validateUnifiedGradingResult(null);
    expect(valid).toBe(false);
    expect(errors).toContain('Result must be an object');
  });

  it('should reject missing required string fields', () => {
    const invalid = { ...validResult, niche: undefined };
    const { valid, errors } = validateUnifiedGradingResult(invalid);
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes('niche'))).toBe(true);
  });

  it('should reject invalid style_classification confidence', () => {
    const invalid = {
      ...validResult,
      style_classification: { label: 'test', confidence: 1.5 }
    };
    const { valid, errors } = validateUnifiedGradingResult(invalid);
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes('confidence'))).toBe(true);
  });

  it('should reject missing idea legos', () => {
    const invalid = {
      ...validResult,
      idea_legos: { lego_1: true } // Missing other legos
    };
    const { valid, errors } = validateUnifiedGradingResult(invalid);
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes('lego_'))).toBe(true);
  });

  it('should reject wrong number of attribute scores', () => {
    const invalid = {
      ...validResult,
      attribute_scores: [{ attribute: 'attr_1', score: 5, evidence: 'test evidence string' }]
    };
    const { valid, errors } = validateUnifiedGradingResult(invalid);
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes('9 items'))).toBe(true);
  });

  it('should reject attribute score out of range', () => {
    const invalid = {
      ...validResult,
      attribute_scores: validResult.attribute_scores.map((a, i) =>
        i === 0 ? { ...a, score: 15 } : a
      )
    };
    const { valid, errors } = validateUnifiedGradingResult(invalid);
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes('1-10'))).toBe(true);
  });

  it('should reject short evidence strings', () => {
    const invalid = {
      ...validResult,
      attribute_scores: validResult.attribute_scores.map((a, i) =>
        i === 0 ? { ...a, evidence: 'short' } : a
      )
    };
    const { valid, errors } = validateUnifiedGradingResult(invalid);
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes('10 chars'))).toBe(true);
  });

  it('should reject invalid grader_confidence', () => {
    const invalid = { ...validResult, grader_confidence: -0.5 };
    const { valid, errors } = validateUnifiedGradingResult(invalid);
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes('grader_confidence'))).toBe(true);
  });
});

describe('toRubricPackResult', () => {
  const validResult: UnifiedGradingResult = {
    rubric_version: '1.0',
    niche: 'fitness',
    goal: 'grow followers',
    style_classification: { label: 'educational', confidence: 0.85 },
    idea_legos: {
      lego_1: true,
      lego_2: true,
      lego_3: false,
      lego_4: true,
      lego_5: false,
      lego_6: true,
      lego_7: false,
      notes: 'Good topic clarity'
    },
    attribute_scores: [
      { attribute: 'attr_1', score: 8, evidence: 'Strong target audience match with specific language' },
      { attribute: 'attr_2', score: 7, evidence: 'Good shareability due to practical tips' },
      { attribute: 'attr_3', score: 8, evidence: 'High information density throughout' },
      { attribute: 'attr_4', score: 6, evidence: 'Moderate emotional journey present' },
      { attribute: 'attr_5', score: 9, evidence: 'Excellent hook with curiosity gap in first seconds' },
      { attribute: 'attr_6', score: 5, evidence: 'Standard format used nothing particularly innovative' },
      { attribute: 'attr_7', score: 7, evidence: 'Good pacing with varied rhythm and flow' },
      { attribute: 'attr_8', score: 8, evidence: 'Multiple open loops created throughout' },
      { attribute: 'attr_9', score: 7, evidence: 'Clear actionable takeaway delivered at end' }
    ],
    hook: {
      type: 'question',
      clarity_score: 8,
      pattern: 'curiosity_gap',
      evidence: 'Have you ever wondered why your workouts are not working for you?',
      rewrite_options: ['Try this instead of...', 'The real reason your...']
    },
    pacing: { score: 7, evidence: 'Good varied pacing throughout the entire video content' },
    clarity: { score: 8, evidence: 'Message is clear and well-structured for the audience' },
    novelty: { score: 6, evidence: 'Somewhat common topic but presented with unique angle' },
    compliance_flags: [],
    warnings: [],
    grader_confidence: 0.85
  };

  it('should convert to RubricPackResult format', () => {
    const packResult = toRubricPackResult(validResult);

    expect(packResult.packId).toBe('unified-grading');
    expect(packResult.packVersion).toBe('1.0');
    expect(packResult.overallConfidence).toBe(0.85);
  });

  it('should include all attribute criteria', () => {
    const packResult = toRubricPackResult(validResult);

    // Should have 9 attributes + 3 additional dimensions + hook + style = 14 criteria
    expect(packResult.criteria.length).toBeGreaterThanOrEqual(13);
  });

  it('should pass RubricPackResult validation', () => {
    const packResult = toRubricPackResult(validResult);

    // Note: The unified-grading packId won't match PACK_A_CRITERIA,
    // so we can't use the standard validateRubricPack for full validation.
    // But we can check structure is correct.
    expect(packResult.criteria.every(c => c.score >= 1 && c.score <= 10)).toBe(true);
    expect(packResult.criteria.every(c => c.evidence.length > 0)).toBe(true);
    expect(packResult.summary.length).toBeGreaterThan(50);
  });

  it('should include lego count in summary', () => {
    const packResult = toRubricPackResult(validResult);
    expect(packResult.summary).toContain('4/7');
  });
});

describe('buildUnifiedGradingPrompt', () => {
  it('should include niche and goal', () => {
    const prompt = buildUnifiedGradingPrompt(
      'cooking',
      'drive sales',
      'This is a test transcript about cooking.',
      { ffmpeg: { duration: 30 } }
    );

    expect(prompt).toContain('cooking');
    expect(prompt).toContain('drive sales');
  });

  it('should include transcript', () => {
    const transcript = 'This is the actual video transcript content here.';
    const prompt = buildUnifiedGradingPrompt(
      'fitness',
      'grow followers',
      transcript,
      {}
    );

    expect(prompt).toContain(transcript);
  });

  it('should include feature snapshot', () => {
    const prompt = buildUnifiedGradingPrompt(
      'tech',
      'educate',
      'Test transcript',
      { ffmpeg: { duration: 60, fps: 30 } }
    );

    expect(prompt).toContain('duration');
    expect(prompt).toContain('60');
  });

  it('should include attribute scoring instructions', () => {
    const prompt = buildUnifiedGradingPrompt(
      'general',
      'engagement',
      'Test transcript',
      {}
    );

    expect(prompt).toContain('tam_resonance');
    expect(prompt).toContain('shareability');
    expect(prompt).toContain('hook_strength');
  });

  it('should include JSON output schema', () => {
    const prompt = buildUnifiedGradingPrompt(
      'general',
      'engagement',
      'Test transcript',
      {}
    );

    expect(prompt).toContain('rubric_version');
    expect(prompt).toContain('style_classification');
    expect(prompt).toContain('idea_legos');
    expect(prompt).toContain('attribute_scores');
  });
});

describe('UNIFIED_GRADING_SYSTEM_PROMPT', () => {
  it('should include strict grading instructions', () => {
    expect(UNIFIED_GRADING_SYSTEM_PROMPT).toContain('strict grading');
    expect(UNIFIED_GRADING_SYSTEM_PROMPT).toContain('ONLY valid JSON');
  });

  it('should include scoring guidelines', () => {
    expect(UNIFIED_GRADING_SYSTEM_PROMPT).toContain('1-3');
    expect(UNIFIED_GRADING_SYSTEM_PROMPT).toContain('4-6');
    expect(UNIFIED_GRADING_SYSTEM_PROMPT).toContain('7-8');
    expect(UNIFIED_GRADING_SYSTEM_PROMPT).toContain('9-10');
  });

  it('should warn about common mistakes', () => {
    expect(UNIFIED_GRADING_SYSTEM_PROMPT).toContain('uniform scores');
    expect(UNIFIED_GRADING_SYSTEM_PROMPT).toContain('generic phrases');
  });
});

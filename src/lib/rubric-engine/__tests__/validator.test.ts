/**
 * Rubric Validator Tests
 *
 * Tests validation logic with good and bad rubric outputs.
 * Ticket R1
 */

import {
  validateRubricPack,
  validateRawOutput,
  formatValidationErrors
} from '../validator';
import {
  RubricPackResult,
  CriterionScore,
  PACK_A_CRITERIA
} from '../types';

describe('Rubric Validator', () => {
  /**
   * Helper: Create a valid criterion score
   */
  function createValidCriterion(criterion: string, score: number): CriterionScore {
    return {
      criterion,
      score,
      evidence: [
        {
          quote: 'This is a sufficient evidence quote from the transcript that is at least 10 characters long.',
          type: 'transcript' as const,
          startSeconds: 5,
          endSeconds: 10
        }
      ],
      reasoning: 'This is a detailed reasoning explanation that is at least 50 characters long and provides specific justification for the score based on evidence.',
      confidence: 0.85
    };
  }

  /**
   * Helper: Create a valid Pack A result
   */
  function createValidPackAResult(): RubricPackResult {
    // Create varied scores to avoid uniform score detection
    // Use scores from 5-9 with variation
    const scores = [7, 8, 6, 7, 9, 6, 8, 7, 5, 8, 6];

    return {
      packId: 'content-quality',
      packVersion: '1.0.0',
      criteria: PACK_A_CRITERIA.map((c, i) => createValidCriterion(c, scores[i])),
      summary: 'This is a comprehensive summary of the evaluation that is at least 100 characters long and provides meaningful insights about the content quality assessment.',
      overallConfidence: 0.8,
      strengths: ['Strong hook', 'Clear topic', 'Good pacing'],
      weaknesses: ['Low shareability', 'Generic angle'],
      metadata: {
        model: 'gpt-4o-mini',
        evaluatedAt: '2026-01-05T12:00:00Z',
        latencyMs: 1500
      }
    };
  }

  describe('validateRawOutput', () => {
    it('should pass for valid JSON string', () => {
      const validJson = JSON.stringify({ criteria: [], summary: 'test', overallConfidence: 0.8 });
      const result = validateRawOutput(validJson);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for empty string', () => {
      const result = validateRawOutput('');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('invalid_json');
      expect(result.errors[0].message).toContain('empty');
    });

    it('should fail for invalid JSON', () => {
      const result = validateRawOutput('{ invalid json }');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('invalid_json');
    });

    it('should fail for non-JSON text', () => {
      const result = validateRawOutput('This is just plain text, not JSON');

      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('invalid_json');
    });
  });

  describe('validateRubricPack - Valid Cases', () => {
    it('should pass for valid Pack A result', () => {
      const validResult = createValidPackAResult();
      const result = validateRubricPack(validResult);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass with varied scores', () => {
      const validResult = createValidPackAResult();
      // Vary scores to avoid uniform detection
      validResult.criteria[0].score = 5;
      validResult.criteria[1].score = 8;
      validResult.criteria[2].score = 6;

      const result = validateRubricPack(validResult);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass with minimum valid values', () => {
      const validResult = createValidPackAResult();
      validResult.criteria[0].score = 1; // Minimum valid score
      validResult.criteria[0].confidence = 0.0; // Minimum valid confidence
      validResult.overallConfidence = 0.0;

      const result = validateRubricPack(validResult);

      expect(result.valid).toBe(true);
    });

    it('should pass with maximum valid values', () => {
      const validResult = createValidPackAResult();
      validResult.criteria[0].score = 10; // Maximum valid score
      validResult.criteria[0].confidence = 1.0; // Maximum valid confidence
      validResult.overallConfidence = 1.0;

      const result = validateRubricPack(validResult);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateRubricPack - Missing Criteria', () => {
    it('should fail when required criteria are missing', () => {
      const invalidResult = createValidPackAResult();
      // Remove first 3 criteria
      invalidResult.criteria = invalidResult.criteria.slice(3);

      const result = validateRubricPack(invalidResult);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.type === 'missing_criteria')).toBe(true);
    });

    it('should fail when all criteria are missing', () => {
      const invalidResult = createValidPackAResult();
      invalidResult.criteria = [];

      const result = validateRubricPack(invalidResult);

      expect(result.valid).toBe(false);
      expect(result.errors.filter(e => e.type === 'missing_criteria')).toHaveLength(PACK_A_CRITERIA.length);
    });
  });

  describe('validateRubricPack - Score Range', () => {
    it('should fail for score below minimum (< 1)', () => {
      const invalidResult = createValidPackAResult();
      invalidResult.criteria[0].score = 0;

      const result = validateRubricPack(invalidResult);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'score_out_of_range')).toBe(true);
    });

    it('should fail for score above maximum (> 10)', () => {
      const invalidResult = createValidPackAResult();
      invalidResult.criteria[0].score = 11;

      const result = validateRubricPack(invalidResult);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'score_out_of_range')).toBe(true);
    });

    it('should fail for negative score', () => {
      const invalidResult = createValidPackAResult();
      invalidResult.criteria[0].score = -5;

      const result = validateRubricPack(invalidResult);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'score_out_of_range')).toBe(true);
    });
  });

  describe('validateRubricPack - Confidence Range', () => {
    it('should fail for confidence below minimum (< 0)', () => {
      const invalidResult = createValidPackAResult();
      invalidResult.criteria[0].confidence = -0.1;

      const result = validateRubricPack(invalidResult);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'confidence_out_of_range')).toBe(true);
    });

    it('should fail for confidence above maximum (> 1)', () => {
      const invalidResult = createValidPackAResult();
      invalidResult.criteria[0].confidence = 1.5;

      const result = validateRubricPack(invalidResult);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'confidence_out_of_range')).toBe(true);
    });

    it('should fail for invalid overall confidence', () => {
      const invalidResult = createValidPackAResult();
      invalidResult.overallConfidence = 2.0;

      const result = validateRubricPack(invalidResult);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'confidence_out_of_range')).toBe(true);
    });
  });

  describe('validateRubricPack - Evidence', () => {
    it('should fail when evidence is missing', () => {
      const invalidResult = createValidPackAResult();
      invalidResult.criteria[0].evidence = [];

      const result = validateRubricPack(invalidResult);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'missing_evidence')).toBe(true);
    });

    it('should fail when evidence quote is too short', () => {
      const invalidResult = createValidPackAResult();
      invalidResult.criteria[0].evidence[0].quote = 'short';

      const result = validateRubricPack(invalidResult);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'missing_evidence')).toBe(true);
    });

    it('should fail when timestamp range is invalid', () => {
      const invalidResult = createValidPackAResult();
      invalidResult.criteria[0].evidence[0].startSeconds = 20;
      invalidResult.criteria[0].evidence[0].endSeconds = 10; // end < start

      const result = validateRubricPack(invalidResult);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'missing_evidence')).toBe(true);
    });
  });

  describe('validateRubricPack - Low Effort Detection', () => {
    it('should fail when reasoning is too short', () => {
      const invalidResult = createValidPackAResult();
      invalidResult.criteria[0].reasoning = 'Too short';

      const result = validateRubricPack(invalidResult);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'low_effort')).toBe(true);
    });

    it('should fail when summary is too short', () => {
      const invalidResult = createValidPackAResult();
      invalidResult.summary = 'Short summary';

      const result = validateRubricPack(invalidResult);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'low_effort' && e.message.includes('Summary'))).toBe(true);
    });

    it('should fail when scores are suspiciously uniform', () => {
      const invalidResult = createValidPackAResult();
      // Set 90% of scores to 8 (above 70% threshold)
      invalidResult.criteria.forEach((c, i) => {
        if (i < 10) c.score = 8; // 10 out of 11 = 91%
      });

      const result = validateRubricPack(invalidResult);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'low_effort' && e.message.includes('uniform'))).toBe(true);
    });

    it('should warn on generic reasoning phrases', () => {
      const invalidResult = createValidPackAResult();
      invalidResult.criteria[0].reasoning = 'This is good content that seems fine and looks pretty good overall with decent execution.';

      const result = validateRubricPack(invalidResult);

      // Should not fail (warnings are non-blocking)
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    });
  });

  describe('formatValidationErrors', () => {
    it('should format valid result', () => {
      const validResult = { valid: true, errors: [] };
      const formatted = formatValidationErrors(validResult);

      expect(formatted).toBe('Validation passed');
    });

    it('should format errors with criterion info', () => {
      const invalidResult = {
        valid: false,
        errors: [
          {
            type: 'score_out_of_range' as const,
            criterion: 'tam_resonance',
            message: 'Score out of range',
            expected: [1, 10],
            actual: 15
          }
        ]
      };
      const formatted = formatValidationErrors(invalidResult);

      expect(formatted).toContain('Rubric validation failed');
      expect(formatted).toContain('score_out_of_range');
      expect(formatted).toContain('tam_resonance');
    });

    it('should format warnings', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: ['Warning 1', 'Warning 2']
      };
      const formatted = formatValidationErrors(result);

      expect(formatted).toContain('Warnings:');
      expect(formatted).toContain('Warning 1');
      expect(formatted).toContain('Warning 2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strengths/weaknesses', () => {
      const validResult = createValidPackAResult();
      delete validResult.strengths;
      delete validResult.weaknesses;

      const result = validateRubricPack(validResult);

      expect(result.valid).toBe(true);
    });

    it('should handle multiple evidence anchors', () => {
      const validResult = createValidPackAResult();
      validResult.criteria[0].evidence.push({
        quote: 'Additional evidence quote that is sufficiently long',
        type: 'visual',
        startSeconds: 15,
        endSeconds: 20
      });

      const result = validateRubricPack(validResult);

      expect(result.valid).toBe(true);
    });

    it('should handle evidence without timestamps', () => {
      const validResult = createValidPackAResult();
      delete validResult.criteria[0].evidence[0].startSeconds;
      delete validResult.criteria[0].evidence[0].endSeconds;

      const result = validateRubricPack(validResult);

      expect(result.valid).toBe(true);
    });
  });
});

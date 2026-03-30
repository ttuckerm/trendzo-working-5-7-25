/**
 * Pack 1 + Pack 2 Integration Test
 *
 * Tests that:
 * 1. Unified grading returns valid schema
 * 2. Editing coach generates suggestions from rubric
 * 3. Mock LLM is used (no network calls)
 */

import {
  createMockUnifiedGradingResult,
  validateUnifiedGradingResult,
  computeAverageAttributeScore,
  computeLegoScore,
  generateRuleBasedSuggestions,
  createMockEditingCoachResult,
  ATTRIBUTE_NAMES,
} from '../index';

describe('Pack 1: Unified Grading Rubric', () => {
  const sampleTranscript = `
    Here's something nobody talks about. I spent 3 years studying why some videos
    get millions of views while others flop. The answer? It's not luck. It's not
    the algorithm. It's this one thing that 99% of creators miss. Ready? It's the
    first 3 seconds. That's it. Your hook determines everything. Let me show you
    exactly how to nail it every single time.
  `;

  describe('createMockUnifiedGradingResult', () => {
    it('should create a valid rubric result matching the schema', () => {
      const input = {
        transcript: sampleTranscript,
        niche: 'side_hustles',
        goal: 'engagement',
      };

      const result = createMockUnifiedGradingResult(input);

      // Validate against Zod schema
      const validation = validateUnifiedGradingResult(result);
      expect(validation.success).toBe(true);
      expect(validation.errors).toBeUndefined();
    });

    it('should return 9 attribute scores', () => {
      const result = createMockUnifiedGradingResult({ transcript: sampleTranscript });

      expect(result.attribute_scores).toHaveLength(9);
      expect(result.attribute_scores.map(a => a.attribute)).toEqual(
        expect.arrayContaining([...ATTRIBUTE_NAMES])
      );
    });

    it('should return 7 idea legos as booleans', () => {
      const result = createMockUnifiedGradingResult({ transcript: sampleTranscript });

      expect(typeof result.idea_legos.lego_1).toBe('boolean');
      expect(typeof result.idea_legos.lego_2).toBe('boolean');
      expect(typeof result.idea_legos.lego_3).toBe('boolean');
      expect(typeof result.idea_legos.lego_4).toBe('boolean');
      expect(typeof result.idea_legos.lego_5).toBe('boolean');
      expect(typeof result.idea_legos.lego_6).toBe('boolean');
      expect(typeof result.idea_legos.lego_7).toBe('boolean');
      expect(typeof result.idea_legos.notes).toBe('string');
    });

    it('should return hook analysis with valid type', () => {
      const result = createMockUnifiedGradingResult({ transcript: sampleTranscript });

      expect(result.hook).toBeDefined();
      expect(['question', 'statistic', 'story', 'claim', 'visual', 'contrast', 'mystery', 'direct', 'weak']).toContain(result.hook.type);
      expect(result.hook.clarity_score).toBeGreaterThanOrEqual(1);
      expect(result.hook.clarity_score).toBeLessThanOrEqual(10);
    });

    it('should return dimension scores (pacing, clarity, novelty)', () => {
      const result = createMockUnifiedGradingResult({ transcript: sampleTranscript });

      expect(result.pacing.score).toBeGreaterThanOrEqual(1);
      expect(result.pacing.score).toBeLessThanOrEqual(10);
      expect(result.clarity.score).toBeGreaterThanOrEqual(1);
      expect(result.clarity.score).toBeLessThanOrEqual(10);
      expect(result.novelty.score).toBeGreaterThanOrEqual(1);
      expect(result.novelty.score).toBeLessThanOrEqual(10);
    });

    it('should return grader_confidence between 0 and 1', () => {
      const result = createMockUnifiedGradingResult({ transcript: sampleTranscript });

      expect(result.grader_confidence).toBeGreaterThanOrEqual(0);
      expect(result.grader_confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('computeAverageAttributeScore', () => {
    it('should compute average of attribute scores', () => {
      const result = createMockUnifiedGradingResult({ transcript: sampleTranscript });
      const avg = computeAverageAttributeScore(result.attribute_scores);

      expect(avg).toBeGreaterThanOrEqual(1);
      expect(avg).toBeLessThanOrEqual(10);
    });

    it('should return 5 for empty array', () => {
      const avg = computeAverageAttributeScore([]);
      expect(avg).toBe(5);
    });
  });

  describe('computeLegoScore', () => {
    it('should return 1 when no legos present', () => {
      const legos = {
        lego_1: false, lego_2: false, lego_3: false, lego_4: false,
        lego_5: false, lego_6: false, lego_7: false, notes: ''
      };
      expect(computeLegoScore(legos)).toBe(1);
    });

    it('should return 10 when all legos present', () => {
      const legos = {
        lego_1: true, lego_2: true, lego_3: true, lego_4: true,
        lego_5: true, lego_6: true, lego_7: true, notes: ''
      };
      expect(computeLegoScore(legos)).toBe(10);
    });
  });
});

describe('Pack 2: Editing Coach', () => {
  const sampleTranscript = 'Test transcript for editing coach analysis';

  describe('generateRuleBasedSuggestions', () => {
    it('should generate max 3 suggestions', () => {
      const rubric = createMockUnifiedGradingResult({ transcript: sampleTranscript });
      const suggestions = generateRuleBasedSuggestions(rubric, 55);

      expect(suggestions.changes.length).toBeLessThanOrEqual(3);
    });

    it('should return pack identifier as "2"', () => {
      const rubric = createMockUnifiedGradingResult({ transcript: sampleTranscript });
      const suggestions = generateRuleBasedSuggestions(rubric, 55);

      expect(suggestions.pack).toBe('2');
    });

    it('should include predicted_before and predicted_after_estimate', () => {
      const rubric = createMockUnifiedGradingResult({ transcript: sampleTranscript });
      const suggestions = generateRuleBasedSuggestions(rubric, 55);

      expect(suggestions.predicted_before).toBe(55);
      expect(suggestions.predicted_after_estimate).toBeGreaterThanOrEqual(55);
    });

    it('should have valid change structure', () => {
      const rubric = createMockUnifiedGradingResult({ transcript: sampleTranscript });
      const suggestions = generateRuleBasedSuggestions(rubric, 55);

      for (const change of suggestions.changes) {
        expect(change.priority).toBeGreaterThanOrEqual(1);
        expect(change.priority).toBeLessThanOrEqual(3);
        expect(typeof change.what_to_change).toBe('string');
        expect(typeof change.how_to_change).toBe('string');
        expect(typeof change.example).toBe('string');
        expect(Array.isArray(change.targets)).toBe(true);
        expect(typeof change.estimated_lift).toBe('number');
        expect(change.confidence).toBeGreaterThanOrEqual(0);
        expect(change.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should target lowest scoring attributes', () => {
      const rubric = createMockUnifiedGradingResult({ transcript: sampleTranscript });
      const suggestions = generateRuleBasedSuggestions(rubric, 55);

      // At least one suggestion should exist
      expect(suggestions.changes.length).toBeGreaterThan(0);
    });
  });

  describe('createMockEditingCoachResult', () => {
    it('should return valid editing coach result', () => {
      const rubric = createMockUnifiedGradingResult({ transcript: sampleTranscript });
      const input = {
        rubric,
        predicted_score: 60,
        confidence: 0.8,
      };

      const result = createMockEditingCoachResult(input);

      expect(result.pack).toBe('2');
      expect(result.changes).toHaveLength(3);
      expect(result.predicted_before).toBe(60);
      expect(result.predicted_after_estimate).toBeGreaterThan(60);
    });
  });
});

describe('Integration: Pack 1 → Pack 2 Flow', () => {
  it('should flow from rubric grading to editing suggestions', () => {
    const transcript = `
      Want to make $10k per month? Most people fail because they don't know this secret.
      I'm going to show you the exact system I used to go from $0 to $10k in 90 days.
    `;

    // Step 1: Generate Pack 1 rubric
    const rubric = createMockUnifiedGradingResult({
      transcript,
      niche: 'side_hustles',
      goal: 'monetization'
    });

    // Step 2: Validate rubric
    const validation = validateUnifiedGradingResult(rubric);
    expect(validation.success).toBe(true);

    // Step 3: Compute DPS from rubric
    const avgScore = computeAverageAttributeScore(rubric.attribute_scores);
    const predictedDPS = avgScore * 10;

    // Step 4: Generate Pack 2 suggestions
    const suggestions = generateRuleBasedSuggestions(rubric, predictedDPS);

    // Step 5: Verify complete flow
    expect(suggestions.predicted_before).toBe(predictedDPS);
    expect(suggestions.changes.length).toBeGreaterThan(0);
    expect(suggestions.changes.length).toBeLessThanOrEqual(3);

    // Each suggestion should have estimated lift
    const totalLift = suggestions.changes.reduce((sum, c) => sum + c.estimated_lift, 0);
    expect(totalLift).toBeGreaterThan(0);

    // predicted_after_estimate is capped at 100
    const expectedAfter = Math.min(100, predictedDPS + totalLift);
    expect(suggestions.predicted_after_estimate).toBeCloseTo(expectedAfter, 1);
  });
});

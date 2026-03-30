/**
 * Tests for prediction calibrator
 */

import {
  calibratePrediction,
  CalibrationInput,
} from '../prediction-calibrator';

describe('calibratePrediction', () => {
  describe('Rule 1: Confidence penalty for no speech', () => {
    it('should reduce confidence by 0.7 when transcription is skipped', () => {
      const input: CalibrationInput = {
        rawDps: 75,
        rawConfidence: 0.8,
        transcriptionSource: 'none',
        transcriptionSkipped: true,
        transcriptionSkippedReason: 'no_speech_detected',
        audioPresent: true,
        packV: null,
        videoId: 'test1',
        runId: 'run1',
      };

      const result = calibratePrediction(input);

      expect(result.calibratedConfidence).toBeCloseTo(0.56, 2); // 0.8 * 0.7
      expect(result.calibratedDps).toBe(75); // DPS unchanged by Rule 1
      expect(result.adjustments.length).toBe(1);
      expect(result.adjustments[0].rule).toBe('confidence_penalty_no_speech');
    });

    it('should NOT reduce confidence when transcription succeeds', () => {
      const input: CalibrationInput = {
        rawDps: 75,
        rawConfidence: 0.8,
        transcriptionSource: 'whisper',
        transcriptionSkipped: false,
        audioPresent: true,
        packV: null,
        videoId: 'test2',
        runId: 'run2',
      };

      const result = calibratePrediction(input);

      expect(result.calibratedConfidence).toBe(0.8);
      expect(result.adjustments.length).toBe(0);
    });
  });

  describe('Rule 2: Silent video DPS cap', () => {
    it('should cap DPS for silent videos with low Pack V score', () => {
      const input: CalibrationInput = {
        rawDps: 75,
        rawConfidence: 0.8,
        transcriptionSource: 'none',
        transcriptionSkipped: true,
        audioPresent: false, // Silent video
        packV: { overall_visual_score: 40 } as any, // Below threshold of 50
        videoId: 'test3',
        runId: 'run3',
      };

      const result = calibratePrediction(input);

      // DPS should be capped toward 55
      expect(result.calibratedDps).toBeLessThan(75);
      expect(result.calibratedDps).toBeGreaterThanOrEqual(55);
      expect(result.adjustments.some(a => a.rule === 'silent_video_dps_cap')).toBe(true);
    });

    it('should NOT cap DPS for videos with audio', () => {
      const input: CalibrationInput = {
        rawDps: 75,
        rawConfidence: 0.8,
        transcriptionSource: 'whisper',
        transcriptionSkipped: false,
        audioPresent: true, // Has audio
        packV: { overall_visual_score: 40 } as any,
        videoId: 'test4',
        runId: 'run4',
      };

      const result = calibratePrediction(input);

      expect(result.calibratedDps).toBe(75);
      expect(result.adjustments.some(a => a.rule === 'silent_video_dps_cap')).toBe(false);
    });

    it('should NOT cap DPS for silent videos with high Pack V score', () => {
      const input: CalibrationInput = {
        rawDps: 75,
        rawConfidence: 0.8,
        transcriptionSource: 'none',
        transcriptionSkipped: true,
        audioPresent: false, // Silent video
        packV: { overall_visual_score: 60 } as any, // Above threshold of 50
        videoId: 'test5',
        runId: 'run5',
      };

      const result = calibratePrediction(input);

      expect(result.calibratedDps).toBe(75);
      expect(result.adjustments.some(a => a.rule === 'silent_video_dps_cap')).toBe(false);
    });
  });

  describe('Guardrail 1: Language signal protection', () => {
    it('should NOT cap DPS for silent videos WITH transcript (language signal)', () => {
      const input: CalibrationInput = {
        rawDps: 80,
        rawConfidence: 0.8,
        transcriptionSource: 'user_provided', // Has transcript
        transcriptionSkipped: false,
        resolvedTranscriptLength: 150, // Valid transcript
        audioPresent: false, // Silent video
        packV: { overall_visual_score: 35 } as any, // Low visual score
        videoId: 'guardrail1_test',
        runId: 'guardrail1_run',
      };

      const result = calibratePrediction(input);

      // DPS should NOT be capped because transcript exists
      expect(result.calibratedDps).toBe(80);
      expect(result.adjustments.some(a => a.rule === 'silent_video_dps_cap')).toBe(false);
    });

    it('should cap DPS for silent videos WITHOUT transcript (no language signal)', () => {
      const input: CalibrationInput = {
        rawDps: 80,
        rawConfidence: 0.8,
        transcriptionSource: 'none',
        transcriptionSkipped: true,
        resolvedTranscriptLength: 0, // No transcript
        audioPresent: false, // Silent video
        packV: { overall_visual_score: 35 } as any, // Low visual score
        videoId: 'guardrail1_test2',
        runId: 'guardrail1_run2',
      };

      const result = calibratePrediction(input);

      // DPS SHOULD be capped because no language signal
      expect(result.calibratedDps).toBeLessThan(80);
      expect(result.adjustments.some(a => a.rule === 'silent_video_dps_cap')).toBe(true);
    });
  });

  describe('Guardrail 2: Visual-first niche/style looser cap', () => {
    it('should use looser cap (65) for visual-first niche fallback (satisfying, no style)', () => {
      const input: CalibrationInput = {
        rawDps: 80,
        rawConfidence: 0.8,
        transcriptionSource: 'none',
        transcriptionSkipped: true,
        resolvedTranscriptLength: 0,
        audioPresent: false,
        packV: { overall_visual_score: 40 } as any,
        // detectedStyle is missing - triggers niche fallback
        niche: 'satisfying', // Visual-first niche (in fallback list)
        videoId: 'guardrail2_test',
        runId: 'guardrail2_run',
      };

      const result = calibratePrediction(input);

      // DPS should be capped toward 65 (not 55) via niche fallback
      expect(result.calibratedDps).toBeGreaterThan(65); // Soft cap, so above 65
      expect(result.calibratedDps).toBeLessThan(80);
      expect(result.adjustments[1].reason).toContain('niche_fallback');
    });

    it('should use looser cap (65) for visual-first style (meme_edit)', () => {
      const input: CalibrationInput = {
        rawDps: 80,
        rawConfidence: 0.8,
        transcriptionSource: 'none',
        transcriptionSkipped: true,
        resolvedTranscriptLength: 0,
        audioPresent: false,
        packV: { overall_visual_score: 40 } as any,
        detectedStyle: 'meme_edit', // Visual-first style
        videoId: 'guardrail2_test2',
        runId: 'guardrail2_run2',
      };

      const result = calibratePrediction(input);

      // DPS should be capped toward 65 (not 55)
      expect(result.calibratedDps).toBeGreaterThan(65);
      expect(result.calibratedDps).toBeLessThan(80);
      expect(result.adjustments[1].reason).toContain('visual-first');
    });

    it('should use standard cap (55) for non-visual-first niche', () => {
      const input: CalibrationInput = {
        rawDps: 80,
        rawConfidence: 0.8,
        transcriptionSource: 'none',
        transcriptionSkipped: true,
        resolvedTranscriptLength: 0,
        audioPresent: false,
        packV: { overall_visual_score: 40 } as any,
        niche: 'finance', // NOT visual-first
        videoId: 'guardrail2_test3',
        runId: 'guardrail2_run3',
      };

      const result = calibratePrediction(input);

      // DPS should be capped toward 55 (standard cap) - soft cap formula
      // With packV=40 (10 below threshold of 50), capStrength = 10/30 = 0.33
      // newDps = 80 - (80-55) * 0.33 = 80 - 8.3 = 71.7
      expect(result.calibratedDps).toBeLessThan(75);
      expect(result.adjustments[1].reason).not.toContain('looser cap');
    });

    it('should use standard cap when detected_style is non-visual-first, even with visual-first niche', () => {
      // This tests the tightened guardrail: style takes priority over niche
      const input: CalibrationInput = {
        rawDps: 80,
        rawConfidence: 0.8,
        transcriptionSource: 'none',
        transcriptionSkipped: true,
        resolvedTranscriptLength: 0,
        audioPresent: false,
        packV: { overall_visual_score: 40 } as any,
        detectedStyle: 'talking_head', // Non-visual-first style
        niche: 'satisfying', // Would be visual-first as fallback, but style overrides
        videoId: 'guardrail2_test4',
        runId: 'guardrail2_run4',
      };

      const result = calibratePrediction(input);

      // Should use standard cap (55) because style is present but not in allowlist
      // Niche should NOT be checked as fallback when style is present
      expect(result.calibratedDps).toBeLessThan(75);
      expect(result.adjustments[1].reason).not.toContain('looser cap');
      expect(result.adjustments[1].reason).not.toContain('visual-first');
    });

    it('should use niche fallback only when detected_style is missing', () => {
      const input: CalibrationInput = {
        rawDps: 80,
        rawConfidence: 0.8,
        transcriptionSource: 'none',
        transcriptionSkipped: true,
        resolvedTranscriptLength: 0,
        audioPresent: false,
        packV: { overall_visual_score: 40 } as any,
        // detectedStyle is undefined/missing
        niche: 'satisfying', // Visual-first niche (in fallback list)
        videoId: 'guardrail2_test5',
        runId: 'guardrail2_run5',
      };

      const result = calibratePrediction(input);

      // Should use looser cap via niche fallback
      expect(result.calibratedDps).toBeGreaterThan(65);
      expect(result.calibratedDps).toBeLessThan(80);
      expect(result.adjustments[1].reason).toContain('niche_fallback');
    });
  });

  describe('Combined rules', () => {
    it('should apply both confidence penalty and DPS cap for silent videos with no speech', () => {
      const input: CalibrationInput = {
        rawDps: 80,
        rawConfidence: 0.9,
        transcriptionSource: 'none',
        transcriptionSkipped: true,
        transcriptionSkippedReason: 'no_speech_detected',
        audioPresent: false,
        packV: { overall_visual_score: 35 } as any,
        videoId: 'test6',
        runId: 'run6',
      };

      const result = calibratePrediction(input);

      // Rule 1: Confidence penalty
      expect(result.calibratedConfidence).toBeCloseTo(0.63, 2); // 0.9 * 0.7

      // Rule 2: DPS cap
      expect(result.calibratedDps).toBeLessThan(80);

      // Both rules applied
      expect(result.adjustments.length).toBe(2);
    });
  });

  describe('Training features extraction', () => {
    it('should extract Pack V features for training', () => {
      const input: CalibrationInput = {
        rawDps: 70,
        rawConfidence: 0.85,
        transcriptionSource: 'whisper',
        transcriptionSkipped: false,
        audioPresent: true,
        packV: {
          overall_visual_score: 55,
          visual_hook_score: { score: 6 },
          pacing_score: { score: 5 },
          pattern_interrupts_score: { score: 4 },
          visual_clarity_score: { score: 7 },
          style_fit_score: { score: 6 },
        } as any,
        videoId: 'test7',
        runId: 'run7',
      };

      const result = calibratePrediction(input);

      expect(result.trainingFeatures.packV_overall).toBe(55);
      expect(result.trainingFeatures.packV_visual_hook).toBe(6);
      expect(result.trainingFeatures.packV_pacing).toBe(5);
      expect(result.trainingFeatures.packV_pattern_interrupts).toBe(4);
      expect(result.trainingFeatures.packV_visual_clarity).toBe(7);
      expect(result.trainingFeatures.packV_style_fit).toBe(6);
      expect(result.trainingFeatures.transcription_skipped).toBe(false);
      expect(result.trainingFeatures.audio_present).toBe(true);
    });
  });
});

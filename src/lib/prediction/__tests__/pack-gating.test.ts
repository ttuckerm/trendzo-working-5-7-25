/**
 * E2E Test: Pack 1/2 Gating with Transcription Pipeline
 *
 * Tests that:
 * 1. Videos with audio get Pack 1/2 results (not skipped)
 * 2. Silent videos get Pack 1/2 skipped with correct reason
 * 3. User-provided transcripts work correctly
 * 4. Resolved transcript is passed to orchestrator
 */

import { runPredictionPipeline } from '../runPredictionPipeline';
import * as fs from 'fs';
import * as path from 'path';

// Mock Supabase to avoid actual DB calls
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

// Mock the transcription pipeline for controlled testing
jest.mock('../../services/transcription-pipeline', () => ({
  runTranscriptionPipeline: jest.fn(),
  TranscriptSource: {
    user_provided: 'user_provided',
    whisper: 'whisper',
    none: 'none',
  },
}));

// Mock the orchestrator
jest.mock('../../orchestration/kai-orchestrator', () => ({
  KaiOrchestrator: jest.fn().mockImplementation(() => ({
    predict: jest.fn().mockResolvedValue({
      success: true,
      dps: 65.5,
      viralPotential: 'Good - Top 25%',
      confidence: 0.75,
      componentsUsed: ['unified-grading', 'editing-coach'],
      paths: [
        {
          path: 'pattern_based',
          results: [
            {
              componentId: 'unified-grading',
              success: true,
              prediction: 65,
              features: {
                attribute_scores: [],
                idea_legos: {},
                hook: { type: 'question', clarity_score: 7 },
                pacing: { score: 7 },
                clarity: { score: 8 },
                novelty: { score: 6 },
                grader_confidence: 0.85,
                warnings: [],
                _meta: { source: 'real', provider: 'google-ai', latency_ms: 1200 },
              },
            },
            {
              componentId: 'editing-coach',
              success: true,
              prediction: 72,
              features: {
                pack: 'editing-coach',
                predicted_before: 65,
                predicted_after_estimate: 72,
                changes: [],
                notes: 'Test suggestions',
                _meta: { source: 'real', provider: 'rule-based', latency_ms: 50 },
              },
            },
          ],
        },
      ],
    }),
  })),
}));

import { runTranscriptionPipeline } from '../../services/transcription-pipeline';
import { KaiOrchestrator } from '../../orchestration/kai-orchestrator';

const mockTranscriptionPipeline = runTranscriptionPipeline as jest.MockedFunction<typeof runTranscriptionPipeline>;
const MockKaiOrchestrator = KaiOrchestrator as jest.MockedClass<typeof KaiOrchestrator>;

describe('Pack 1/2 Gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when video has audio (Whisper returns transcript)', () => {
    it('should pass resolved transcript to orchestrator and return Pack 1/2 results', async () => {
      const whisperTranscript = 'This is a test video about making money online. Here are five side hustles you can start today with no money.';

      mockTranscriptionPipeline.mockResolvedValue({
        transcript: whisperTranscript,
        source: 'whisper',
        confidence: 0.85,
        processingTimeMs: 3500,
        skipped: false,
      });

      const result = await runPredictionPipeline('test-video-123', {
        videoFilePath: '/path/to/video-with-audio.mp4',
        niche: 'side_hustles',
        goal: 'engagement',
      });

      // Verify transcription pipeline was called
      expect(mockTranscriptionPipeline).toHaveBeenCalledWith(
        expect.objectContaining({
          videoPath: '/path/to/video-with-audio.mp4',
        })
      );

      // Verify Pack 1/2 are NOT skipped
      expect(result.success).toBe(true);
      expect(result.qualitative_analysis.pack1).not.toBeNull();
      expect(result.qualitative_analysis.pack2).not.toBeNull();
      expect(result.transcription_status?.skipped).toBe(false);
      expect(result.transcription_status?.source).toBe('whisper');

      // Verify debug info
      expect(result.debug?.resolved_transcript_length).toBe(whisperTranscript.length);
      expect(result.debug?.transcript_source).toBe('whisper');
    });
  });

  describe('when video is silent (Whisper returns empty)', () => {
    it('should skip Pack 1/2 with correct reason', async () => {
      mockTranscriptionPipeline.mockResolvedValue({
        transcript: null,
        source: 'none',
        confidence: 0,
        processingTimeMs: 2000,
        skipped: true,
        skipped_reason: 'no_speech_detected',
      });

      // Mock orchestrator to return failed Pack 1/2 (transcript check fails)
      MockKaiOrchestrator.mockImplementation(() => ({
        predict: jest.fn().mockResolvedValue({
          success: true,
          dps: 45.0,
          viralPotential: 'Average',
          confidence: 0.6,
          componentsUsed: ['visual-analysis', 'trend-timing'],
          paths: [
            {
              path: 'pattern_based',
              results: [
                {
                  componentId: 'unified-grading',
                  success: false,
                  error: 'Transcript required for unified grading (min 10 chars)',
                },
                {
                  componentId: 'editing-coach',
                  success: false,
                  error: 'Editing Coach requires unified-grading result',
                },
              ],
            },
          ],
        }),
      } as any));

      const result = await runPredictionPipeline('test-video-silent', {
        videoFilePath: '/path/to/silent-video.mp4',
        niche: 'dance',
        goal: 'engagement',
      });

      // Verify transcription was skipped
      expect(result.transcription_status?.skipped).toBe(true);
      expect(result.transcription_status?.skippedReason).toBe('no_speech_detected');
      expect(result.transcription_status?.source).toBe('none');

      // Verify Pack 1/2 are null
      expect(result.qualitative_analysis.pack1).toBeNull();
      expect(result.qualitative_analysis.pack2).toBeNull();

      // Verify debug info shows no transcript
      expect(result.debug?.resolved_transcript_length).toBe(0);
      expect(result.debug?.transcript_source).toBe('none');
    });
  });

  describe('when user provides valid transcript', () => {
    it('should use user transcript and skip Whisper', async () => {
      const userTranscript = 'This is my manually typed transcript for the video. It explains how to start a business from home.';

      const result = await runPredictionPipeline('test-video-user-transcript', {
        transcript: userTranscript,
        videoFilePath: '/path/to/video.mp4',
        niche: 'side_hustles',
        goal: 'engagement',
      });

      // Verify transcription pipeline was NOT called (user provided transcript)
      expect(mockTranscriptionPipeline).not.toHaveBeenCalled();

      // Verify transcription status shows user_provided
      expect(result.transcription_status?.source).toBe('user_provided');
      expect(result.transcription_status?.confidence).toBe(1.0);
      expect(result.transcription_status?.skipped).toBe(false);

      // Verify debug info
      expect(result.debug?.resolved_transcript_length).toBe(userTranscript.length);
      expect(result.debug?.transcript_source).toBe('user_provided');
      expect(result.debug?.user_transcript_length).toBe(userTranscript.length);
    });
  });

  describe('when user provides short transcript', () => {
    it('should run Whisper as fallback', async () => {
      const shortTranscript = 'Hi';
      const whisperTranscript = 'Welcome to my channel! Today I will show you how to make passive income online with these simple strategies.';

      mockTranscriptionPipeline.mockResolvedValue({
        transcript: whisperTranscript,
        source: 'whisper',
        confidence: 0.9,
        processingTimeMs: 2800,
        skipped: false,
      });

      const result = await runPredictionPipeline('test-video-short-transcript', {
        transcript: shortTranscript,
        videoFilePath: '/path/to/video.mp4',
        niche: 'side_hustles',
        goal: 'engagement',
      });

      // Verify transcription pipeline WAS called (user transcript too short)
      expect(mockTranscriptionPipeline).toHaveBeenCalled();

      // Verify Whisper transcript was used
      expect(result.debug?.resolved_transcript_length).toBe(whisperTranscript.length);
      expect(result.debug?.transcript_source).toBe('whisper');
      expect(result.debug?.user_transcript_length).toBe(shortTranscript.length);
    });
  });
});

/**
 * Pack V Tests - Visual Rubric (no transcript required)
 */
describe('Pack V Visual Rubric', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when video is silent (no transcript)', () => {
    it('should still return Pack V with non-null scores', async () => {
      // Mock transcription to return no transcript (silent video)
      mockTranscriptionPipeline.mockResolvedValue({
        transcript: null,
        source: 'none',
        confidence: 0,
        processingTimeMs: 2000,
        skipped: true,
        skipped_reason: 'no_speech_detected',
      });

      // Mock orchestrator to return Pack V but not Pack 1/2
      MockKaiOrchestrator.mockImplementation(() => ({
        predict: jest.fn().mockResolvedValue({
          success: true,
          dps: 55.0,
          viralPotential: 'Average',
          confidence: 0.65,
          componentsUsed: ['ffmpeg', 'visual-rubric'],
          paths: [
            {
              path: 'pattern_based',
              results: [
                {
                  componentId: 'ffmpeg',
                  success: true,
                  features: {
                    duration_seconds: 15,
                    fps: 30,
                    resolution: { width: 1080, height: 1920 },
                    scene_count: 5,
                  },
                },
                {
                  componentId: 'unified-grading',
                  success: false,
                  error: 'Transcript required for unified grading (min 10 chars)',
                },
                {
                  componentId: 'editing-coach',
                  success: false,
                  error: 'Editing Coach requires unified-grading result',
                },
                {
                  componentId: 'visual-rubric',
                  success: true,
                  prediction: 62,
                  features: {
                    pack: 'V',
                    visual_hook_score: { score: 7, evidence: 'Good thumbnail quality' },
                    pacing_score: { score: 6, evidence: 'Moderate scene pacing' },
                    pattern_interrupts_score: { score: 5, evidence: '5 scene changes detected' },
                    visual_clarity_score: { score: 8, evidence: 'HD quality (1080x1920)' },
                    style_fit_score: { score: 6, evidence: 'Style fits niche' },
                    overall_visual_score: 62,
                    _meta: { source: 'real', provider: 'rule-based', latency_ms: 15 },
                  },
                },
              ],
            },
          ],
        }),
      } as any));

      const result = await runPredictionPipeline('test-video-silent-packv', {
        videoFilePath: '/path/to/silent-video.mp4',
        niche: 'dance',
        goal: 'engagement',
      });

      // Pack 1/2 should be null (no transcript)
      expect(result.qualitative_analysis.pack1).toBeNull();
      expect(result.qualitative_analysis.pack2).toBeNull();

      // Pack V should be present with non-null scores
      expect(result.qualitative_analysis.packV).not.toBeNull();
      expect(result.qualitative_analysis.packV?.pack).toBe('V');
      expect(result.qualitative_analysis.packV?.overall_visual_score).toBeGreaterThan(0);
      expect(result.qualitative_analysis.packV?.visual_hook_score.score).toBeGreaterThanOrEqual(1);
      expect(result.qualitative_analysis.packV?.visual_hook_score.score).toBeLessThanOrEqual(10);
      expect(result.qualitative_analysis.packV?.pacing_score.score).toBeGreaterThanOrEqual(1);
      expect(result.qualitative_analysis.packV?.pattern_interrupts_score.score).toBeGreaterThanOrEqual(1);
      expect(result.qualitative_analysis.packV?.visual_clarity_score.score).toBeGreaterThanOrEqual(1);
      expect(result.qualitative_analysis.packV?.style_fit_score.score).toBeGreaterThanOrEqual(1);

      // Pack V should have _meta
      expect(result.qualitative_analysis.packV?._meta.source).toBe('real');
      expect(result.qualitative_analysis.packV?._meta.provider).toBe('rule-based');
    });
  });

  describe('when video has speech (with transcript)', () => {
    it('should return both Pack 1/2 AND Pack V', async () => {
      const whisperTranscript = 'This is a video with speech about making money online with side hustles.';

      mockTranscriptionPipeline.mockResolvedValue({
        transcript: whisperTranscript,
        source: 'whisper',
        confidence: 0.9,
        processingTimeMs: 3000,
        skipped: false,
      });

      // Mock orchestrator to return ALL packs
      MockKaiOrchestrator.mockImplementation(() => ({
        predict: jest.fn().mockResolvedValue({
          success: true,
          dps: 72.0,
          viralPotential: 'Good - Top 25%',
          confidence: 0.8,
          componentsUsed: ['ffmpeg', 'unified-grading', 'editing-coach', 'visual-rubric'],
          paths: [
            {
              path: 'pattern_based',
              results: [
                {
                  componentId: 'ffmpeg',
                  success: true,
                  features: { duration_seconds: 20, fps: 30 },
                },
                {
                  componentId: 'unified-grading',
                  success: true,
                  prediction: 70,
                  features: {
                    attribute_scores: [{ attribute: 'hook', score: 8, evidence: 'Strong opener' }],
                    idea_legos: { lego_1: true, lego_2: false },
                    hook: { type: 'question', clarity_score: 8 },
                    pacing: { score: 7 },
                    clarity: { score: 8 },
                    novelty: { score: 6 },
                    grader_confidence: 0.85,
                    warnings: [],
                    _meta: { source: 'real', provider: 'google-ai', latency_ms: 1500 },
                  },
                },
                {
                  componentId: 'editing-coach',
                  success: true,
                  prediction: 75,
                  features: {
                    pack: 'editing-coach',
                    predicted_before: 70,
                    predicted_after_estimate: 75,
                    changes: [{ target_field: 'hook', suggestion: 'Make hook more urgent', estimated_lift: 3, priority: 1 }],
                    notes: 'Good content with room for improvement',
                    _meta: { source: 'real', provider: 'rule-based', latency_ms: 20 },
                  },
                },
                {
                  componentId: 'visual-rubric',
                  success: true,
                  prediction: 68,
                  features: {
                    pack: 'V',
                    visual_hook_score: { score: 8, evidence: 'Face detected, good thumbnail' },
                    pacing_score: { score: 7, evidence: 'Good scene pacing (3s avg)' },
                    pattern_interrupts_score: { score: 6, evidence: '7 transitions' },
                    visual_clarity_score: { score: 8, evidence: 'HD quality' },
                    style_fit_score: { score: 7, evidence: 'Talking head fits side hustles' },
                    overall_visual_score: 68,
                    _meta: { source: 'real', provider: 'rule-based', latency_ms: 12 },
                  },
                },
              ],
            },
          ],
        }),
      } as any));

      const result = await runPredictionPipeline('test-video-speech-all-packs', {
        videoFilePath: '/path/to/speech-video.mp4',
        niche: 'side_hustles',
        goal: 'engagement',
      });

      // All packs should be present
      expect(result.qualitative_analysis.pack1).not.toBeNull();
      expect(result.qualitative_analysis.pack2).not.toBeNull();
      expect(result.qualitative_analysis.packV).not.toBeNull();

      // Verify Pack 1
      expect(result.qualitative_analysis.pack1?.grader_confidence).toBe(0.85);
      expect(result.qualitative_analysis.pack1?._meta?.source).toBe('real');

      // Verify Pack 2
      expect(result.qualitative_analysis.pack2?.predicted_after_estimate).toBe(75);
      expect(result.qualitative_analysis.pack2?._meta?.source).toBe('real');

      // Verify Pack V
      expect(result.qualitative_analysis.packV?.overall_visual_score).toBe(68);
      expect(result.qualitative_analysis.packV?._meta?.source).toBe('real');
      expect(result.qualitative_analysis.packV?._meta?.provider).toBe('rule-based');
    });
  });
});

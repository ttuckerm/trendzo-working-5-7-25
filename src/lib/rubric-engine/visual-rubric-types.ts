/**
 * Pack V: Visual Rubric Types
 *
 * Visual-only analysis that runs even when transcript is missing.
 * Uses FFmpeg-derived signals and existing visual component outputs.
 */

import { z } from 'zod';
import { PackMetadata } from './pack-metadata';

// ============================================================================
// Zod Schemas
// ============================================================================

export const VisualScoreSchema = z.object({
  score: z.number().min(1).max(10),
  evidence: z.string(),
});

export const VisualRubricResultSchema = z.object({
  pack: z.literal('V'),

  // Core visual scores (1-10 each)
  visual_hook_score: VisualScoreSchema,
  pacing_score: VisualScoreSchema,
  pattern_interrupts_score: VisualScoreSchema,
  visual_clarity_score: VisualScoreSchema,
  style_fit_score: VisualScoreSchema,

  // Aggregate score (0-100)
  overall_visual_score: z.number().min(0).max(100),

  // Metadata
  _meta: z.object({
    source: z.enum(['real', 'mock']),
    provider: z.string(),
    latency_ms: z.number(),
  }),

  // Optional signal coverage debug block
  signal_coverage: z.any().optional(),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export interface VisualScore {
  score: number; // 1-10
  evidence: string;
}

export interface VisualRubricResult {
  pack: 'V';

  visual_hook_score: VisualScore;
  pacing_score: VisualScore;
  pattern_interrupts_score: VisualScore;
  visual_clarity_score: VisualScore;
  style_fit_score: VisualScore;

  overall_visual_score: number; // 0-100

  _meta: PackMetadata;

  // Debug: Signal coverage tracking
  signal_coverage?: PackVSignalCoverage;
}

// ============================================================================
// Input Types (from other components)
// ============================================================================

export interface VisualRubricInput {
  videoId: string;
  videoPath?: string;

  // From ffmpeg component
  ffmpegFeatures?: {
    duration_seconds?: number;
    fps?: number;
    resolution?: { width: number; height: number };
    scene_count?: number;
    avg_scene_duration?: number;
    motion_intensity?: number;
    brightness_avg?: number;
    contrast_ratio?: number;
  };

  // From 24-styles component
  styleFeatures?: {
    detected_style?: string;
    style_confidence?: number;
    visual_elements?: string[];
  };

  // From thumbnail-analyzer component
  thumbnailFeatures?: {
    thumbnail_score?: number;
    has_face?: boolean;
    has_text?: boolean;
    color_vibrancy?: number;
    composition_score?: number;
  };

  // From visual-scene-detector component
  sceneFeatures?: {
    scene_transitions?: number;
    avg_shot_length?: number;
    visual_variety?: number;
    dominant_colors?: string[];
  };

  // From audio-analyzer component (visual sync aspects)
  audioFeatures?: {
    has_music?: boolean;
    beat_aligned?: boolean;
    audio_visual_sync?: number;
  };

  // From hook-scorer (visual hook aspects, if available)
  hookFeatures?: {
    hook_visual_score?: number;
    opening_frame_quality?: number;
  };

  // Niche for style fit evaluation
  niche?: string;
}

// ============================================================================
// Signal Coverage Types (Debug Block)
// ============================================================================

export interface SignalCoverageComponent {
  component: string;
  executed: boolean;
  fieldsAvailable: string[];
  fieldsConsumed: string[];
  status: 'used' | 'partial' | 'executed-but-unused' | 'not-executed';
}

export interface PackVSignalCoverage {
  run_id?: string;
  timestamp: string;

  // Per-component breakdown
  components: SignalCoverageComponent[];

  // Summary metrics
  summary: {
    total_components: number;
    executed_count: number;
    used_count: number;
    partial_count: number;
    unused_count: number;
    total_fields_available: number;
    total_fields_consumed: number;
    coverage_percent: number;
  };

  // Key signals actually used
  signals_used: {
    field: string;
    source: string;
    value: string | number | boolean;
    used_in_score: string;
  }[];
}

// ============================================================================
// Stub Factory (for when no visual data available)
// ============================================================================

export function createVisualRubricStub(): VisualRubricResult {
  return {
    pack: 'V',
    visual_hook_score: { score: 5, evidence: 'No visual data available for analysis' },
    pacing_score: { score: 5, evidence: 'No visual data available for analysis' },
    pattern_interrupts_score: { score: 5, evidence: 'No visual data available for analysis' },
    visual_clarity_score: { score: 5, evidence: 'No visual data available for analysis' },
    style_fit_score: { score: 5, evidence: 'No visual data available for analysis' },
    overall_visual_score: 50,
    _meta: {
      source: 'mock',
      provider: 'mock',
      latency_ms: 0,
    },
  };
}

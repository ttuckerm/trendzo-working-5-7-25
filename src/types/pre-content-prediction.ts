/**
 * FEAT-007: Pre-Content Prediction Types
 * Types for script/storyboard analysis and viral prediction before filming
 */

import { z } from 'zod';

// ============================================================================
// Input Schemas
// ============================================================================

export const PreContentPredictionRequestSchema = z.object({
  script: z.string().min(10, 'Script must be at least 10 characters'),
  storyboard: z.string().optional(),
  niche: z.string().min(1, 'Niche is required'),
  platform: z.enum(['tiktok', 'instagram', 'youtube', 'twitter', 'linkedin']),
  creatorFollowers: z.number().int().min(0).optional(),
  // Planned Visual Specifications (Enhancement: FEAT-001 Integration)
  plannedVisuals: z.object({
    resolution: z.string().optional(), // e.g., "1080x1920", "4k"
    fps: z.number().optional(), // e.g., 30, 60
    plannedHookCuts: z.number().optional(), // Number of cuts planned for first 3 seconds
  }).optional(),
});

export type PreContentPredictionRequest = z.infer<typeof PreContentPredictionRequestSchema>;

// ============================================================================
// Idea Legos (7 Core Elements)
// ============================================================================

export interface IdeaLegos {
  topic: string;                // What is this about?
  angle: string;                // Unique perspective/premise
  hookStructure: string;        // How does it start?
  storyStructure: string;       // How does it flow?
  visualFormat: string;         // What will we see?
  keyVisuals: string;           // Specific visual elements
  audio: string;                // Music/sound style
}

export const IdeaLegosSchema = z.object({
  topic: z.string(),
  angle: z.string(),
  hookStructure: z.string(),
  storyStructure: z.string(),
  visualFormat: z.string(),
  keyVisuals: z.string(),
  audio: z.string(),
});

// ============================================================================
// LLM Consensus Scoring
// ============================================================================

export interface LLMScores {
  gpt4?: number;        // 0-100 score from GPT-4
  claude?: number;      // 0-100 score from Claude
  gemini?: number;      // 0-100 score from Gemini
}

export interface LLMConsensusResult {
  scores: LLMScores;
  consensusScore: number;   // Average of available scores
  confidence: number;       // 1 - (stddev / mean), 0-1
  failedProviders: string[]; // List of LLMs that failed
}

// ============================================================================
// Pattern Matching
// ============================================================================

export interface PatternMatch {
  type: string;             // e.g., 'hook_structure', 'topic', 'visual_format'
  description: string;      // Pattern description
  successRate: number;      // 0-1
  avgDPS: number;          // Average DPS of this pattern
  matchScore: number;       // How well this script matches (0-100)
}

export interface PatternMatchingResult {
  overallScore: number;     // Weighted average of all pattern matches (0-100)
  topPatterns: PatternMatch[];
}

// ============================================================================
// Predictions
// ============================================================================

export interface PredictionEstimates {
  estimatedViews: string;           // e.g., "450K-600K"
  estimatedLikes: string;           // e.g., "32K-45K"
  estimatedDPSPercentile: string;   // e.g., "Top 5%"
}

export interface PredictionBreakdown {
  patternMatchScore: number;    // 0-100
  llmConsensusScore: number;    // 0-100
  llmScores: LLMScores;
}

// ============================================================================
// Tier-Based Classification (NEW)
// ============================================================================

export type ViralTier = 'mega_viral' | 'hyper_viral' | 'viral' | 'strong' | 'average';

export interface TierProbabilities {
  mega_viral: number;
  hyper_viral: number;
  viral: number;
  strong: number;
  average: number;
}

// ============================================================================
// Response Schema
// ============================================================================

export interface PreContentPredictionResponse {
  // NEW TIER-BASED FORMAT
  predictedTier: ViralTier;             // Primary tier prediction
  confidence: number;                   // Confidence in predicted tier (0-1)
  tierProbabilities: TierProbabilities; // Probability distribution across all tiers
  reasoning: string;                    // Human-readable explanation

  // LEGACY (kept for backward compatibility but deprecated)
  /** @deprecated Use predictedTier instead */
  predictedViralScore?: number;         // 0-100 (deprecated)
  /** @deprecated Use tierProbabilities instead */
  predictedDPS?: number;                // Predicted Dynamic Performance Score (deprecated)

  predictions: PredictionEstimates;
  breakdown: PredictionBreakdown;
  ideaLegos: IdeaLegos;
  recommendations: string[];            // Improvement suggestions
  topMatchingPatterns: PatternMatch[];
}

export const PreContentPredictionResponseSchema = z.object({
  // NEW TIER-BASED FIELDS
  predictedTier: z.enum(['mega_viral', 'hyper_viral', 'viral', 'strong', 'average']),
  confidence: z.number().min(0).max(1),
  tierProbabilities: z.object({
    mega_viral: z.number(),
    hyper_viral: z.number(),
    viral: z.number(),
    strong: z.number(),
    average: z.number(),
  }),
  reasoning: z.string(),

  // LEGACY FIELDS (deprecated but kept for backward compatibility)
  predictedViralScore: z.number().int().min(0).max(100).optional(),
  predictedDPS: z.number().min(0).max(100).optional(),

  predictions: z.object({
    estimatedViews: z.string(),
    estimatedLikes: z.string(),
    estimatedDPSPercentile: z.string(),
  }),
  breakdown: z.object({
    patternMatchScore: z.number(),
    llmConsensusScore: z.number(),
    llmScores: z.object({
      gpt4: z.number().optional(),
      claude: z.number().optional(),
      gemini: z.number().optional(),
    }),
  }),
  ideaLegos: IdeaLegosSchema,
  recommendations: z.array(z.string()),
  topMatchingPatterns: z.array(z.object({
    type: z.string(),
    description: z.string(),
    successRate: z.number(),
    avgDPS: z.number(),
    matchScore: z.number().optional(),
  })),
});

// ============================================================================
// Database Model
// ============================================================================

export interface PreContentPredictionRecord {
  id: string;
  script: string;
  storyboard?: string;
  niche: string;
  platform: string;
  creator_followers?: number;
  
  // NEW TIER-BASED FIELDS
  predicted_tier: ViralTier;
  tier_probabilities: TierProbabilities;
  tier_confidence: number;
  tier_reasoning: string;
  
  // LEGACY FIELDS (deprecated but kept for backward compatibility)
  predicted_viral_score?: number;
  predicted_dps?: number;
  
  confidence: number;
  llm_scores: LLMScores;
  llm_consensus_score: number;
  pattern_match_score: number;
  pattern_lego_match_count?: number; // How many of 9 Legos matched
  top_matching_patterns: PatternMatch[];
  idea_legos: IdeaLegos;
  predictions: PredictionEstimates;
  recommendations: string[];
  feature_flag: string;
  created_at: string;
  updated_at: string;
  
  // ACTUAL PERFORMANCE (for accuracy tracking)
  actual_content_video_id?: string;
  actual_dps?: number;
  actual_tier?: ViralTier;  // NEW: Actual tier classification
  tier_prediction_correct?: boolean; // NEW: Did we predict the tier correctly?
}

// ============================================================================
// Service Layer Types
// ============================================================================

export interface LLMProvider {
  name: 'gpt4' | 'claude' | 'gemini';
  scoreScript: (script: string, platform: string, niche: string) => Promise<number>;
}

export interface IdeaLegosExtractor {
  extract: (script: string, storyboard?: string) => Promise<IdeaLegos>;
}

export interface PatternMatcher {
  findMatches: (legos: IdeaLegos, niche: string, platform: string) => Promise<PatternMatchingResult>;
}

export interface DPSPredictor {
  predict: (
    patternScore: number,
    consensusScore: number,
    niche: string,
    platform: string,
    followers?: number
  ) => Promise<{
    predictedDPS: number;
    estimates: PredictionEstimates;
  }>;
}

export interface RecommendationGenerator {
  generate: (
    legos: IdeaLegos,
    topPatterns: PatternMatch[],
    patternScore: number
  ) => string[];
}

/**
 * Enhanced Pattern Extraction Types (v2)
 * Detailed 9-field breakdown per video
 */

import { z } from 'zod';

// =====================================================
// Enhanced Video Pattern Types
// =====================================================

/**
 * Detailed pattern breakdown for a single video
 * Represents all 7 Idea Legos with Hook split into 3 components
 */
export interface VideoPatternDetailed {
  id: string;
  videoId: string;
  niche: string;
  platform: string;
  
  // DPS Metrics
  dpsScore: number | null;
  dpsPercentile: number | null;
  
  // 9-Field Breakdown
  topic: string;                           // Core subject matter
  angle: string;                           // Unique perspective/approach
  hookSpoken: string;                      // Exact/paraphrased verbal hook
  hookText: string;                        // On-screen text in hook
  hookVisual: string;                      // Visual elements in hook
  storyStructure: string;                  // Narrative structure type
  visualFormat: string;                    // Overall visual format/style
  keyVisualElements: string[];             // Array of specific visual elements
  audioDescription: string;                // Music/sound description
  
  // Metadata
  extractionConfidence: number | null;
  extractedAt: string;
  extractionBatchId: string | null;
  extractionVersion: string;
  
  // Cached Video Metadata
  videoTitle: string | null;
  creatorUsername: string | null;
  viewsCount: number | null;
  likesCount: number | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Pattern extracted from LLM (before storage)
 */
export interface ExtractedVideoPattern {
  videoId: string;
  topic: string;
  angle: string;
  hookSpoken: string;
  hookText: string;
  hookVisual: string;
  storyStructure: string;
  visualFormat: string;
  keyVisualElements: string[];
  audioDescription: string;
  confidence: number;
}

/**
 * LLM response schema for detailed extraction
 */
export interface EnhancedLLMExtractionResponse {
  video_id: string;
  topic: string;
  angle: string;
  hook_spoken: string;
  hook_text: string;
  hook_visual: string;
  story: string;
  visuals: string;
  key_elements: string[];
  audio: string;
  confidence: number;
}

/**
 * Zod schema for LLM response validation
 */
export const EnhancedLLMExtractionResponseSchema = z.object({
  video_id: z.string(),
  topic: z.string().min(3).max(500),
  angle: z.string().min(3).max(500),
  hook_spoken: z.string().min(3).max(1000),
  hook_text: z.string().max(500),
  hook_visual: z.string().min(3).max(500),
  story: z.string().min(3).max(500),
  visuals: z.string().min(3).max(500),
  key_elements: z.array(z.string()).min(1).max(20),
  audio: z.string().min(3).max(500),
  confidence: z.number().min(0).max(1),
});

/**
 * Batch response from LLM
 */
export const EnhancedBatchExtractionResponseSchema = z.object({
  patterns: z.array(EnhancedLLMExtractionResponseSchema),
  summary: z.string().optional(),
});

export type EnhancedBatchExtractionResponse = z.infer<typeof EnhancedBatchExtractionResponseSchema>;

// =====================================================
// API Request/Response Types
// =====================================================

/**
 * Enhanced pattern extraction request
 */
export interface EnhancedPatternExtractionRequest {
  niche: string;
  minDPSScore: number;
  dateRange: string;
  limit?: number;
}

/**
 * Enhanced pattern extraction response
 */
export interface EnhancedPatternExtractionResponse {
  success: boolean;
  patterns: VideoPatternDetailed[];
  totalVideosAnalyzed: number;
  patternsExtracted: number;
  batchId: string;
  processingTimeMs: number;
  llmCallsCount: number;
  llmTokensUsed: number;
  llmCostUsd: number;
}

// =====================================================
// Configuration
// =====================================================

export interface EnhancedPatternExtractionConfig {
  maxVideosPerBatch: number;
  maxVideosPerLLMCall: number;
  llmModel: string;
  llmTemperature: number;
  llmMaxTokens: number;
  minConfidenceScore: number;
}

export const DEFAULT_ENHANCED_PATTERN_CONFIG: EnhancedPatternExtractionConfig = {
  maxVideosPerBatch: 100,
  maxVideosPerLLMCall: 10,  // Process fewer videos at once for detailed extraction
  llmModel: 'gpt-4-turbo-preview',
  llmTemperature: 0.2,  // Lower temperature for more consistent extraction
  llmMaxTokens: 4000,   // More tokens for detailed responses
  minConfidenceScore: 0.7,
};

// =====================================================
// Video Data for Extraction
// =====================================================

export interface VideoForDetailedExtraction {
  videoId: string;
  title: string | null;
  description: string | null;
  transcript: string | null;
  hashtags: string[] | null;
  creatorUsername: string | null;
  viewsCount: number;
  likesCount: number | null;
  dpsScore: number;
  dpsPercentile: number;
  platform: string;
  niche: string;
}


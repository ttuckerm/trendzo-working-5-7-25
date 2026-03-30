/**
 * FEAT-003: Pattern Extraction System - Type Definitions
 * 
 * Types for viral pattern extraction from high-DPS videos
 * @module pattern-extraction/types
 */

// =====================================================
// Core Pattern Types
// =====================================================

/**
 * The 7 Idea Legos (pattern types)
 */
export type PatternType =
  | 'topic'
  | 'angle'
  | 'hook_structure'
  | 'story_structure'
  | 'visual_format'
  | 'key_visuals'
  | 'audio';

/**
 * Viral pattern record from database
 */
export interface ViralPattern {
  id: string;
  niche: string;
  patternType: PatternType;
  patternDescription: string;
  patternDetails?: Record<string, any>;
  frequencyCount: number;
  avgDpsScore: number | null;
  successRate: number | null;
  totalVideosAnalyzed: number;
  viralVideosCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
  extractionVersion: string;
}

/**
 * Pattern video association (junction table)
 */
export interface PatternVideoAssociation {
  id: string;
  patternId: string;
  videoId: string;
  confidenceScore: number | null;
  extractedAt: string;
  extractionBatchId: string | null;
}

/**
 * Video data for pattern extraction
 */
export interface VideoForExtraction {
  videoId: string;
  title: string | null;
  description: string | null;
  hashtags: string[] | null;
  creatorUsername: string | null;
  viewsCount: number;
  likesCount: number | null;
  commentsCount: number | null;
  sharesCount: number | null;
  dpsScore: number;
  dpsPercentile: number;
  dpsClassification: string;
  platform: string;
  // FFmpeg Visual Intelligence (Enhancement: FEAT-001 Integration)
  visualData?: {
    durationMs?: number;
    resolution?: string; // e.g., "1080x1920"
    fps?: number;
    hookSceneChanges?: number;
    qualityScore?: number;
  };
}

// =====================================================
// LLM Request/Response Types
// =====================================================

/**
 * Extracted pattern from LLM
 */
export interface ExtractedPattern {
  type: PatternType;
  description: string;
  confidence: number;
  details?: Record<string, any>;
}

/**
 * LLM extraction response schema
 */
export interface LLMExtractionResponse {
  patterns: ExtractedPattern[];
  summary?: string;
}

/**
 * Video metadata for LLM prompt
 */
export interface VideoMetadataForLLM {
  title: string;
  description: string;
  hashtags: string[];
  dpsScore: number;
  engagement: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  // FFmpeg Visual Intelligence (Enhancement: FEAT-001 Integration)
  visual?: {
    durationMs?: number;
    resolution?: string;
    fps?: number;
    hookSceneChanges?: number;
    qualityScore?: number;
  };
}

// =====================================================
// API Request/Response Types
// =====================================================

/**
 * Pattern extraction request body
 */
export interface PatternExtractionRequest {
  niche: string;
  minDPSScore: number;
  dateRange: string; // e.g., "30d", "7d", "90d"
  limit?: number; // Max videos to process (default: 500)
}

/**
 * Pattern extraction response
 */
export interface PatternExtractionResponse {
  success: boolean;
  patterns: PatternSummary[];
  totalVideosAnalyzed: number;
  batchId: string;
  processingTimeMs: number;
  llmCallsCount: number;
  llmTokensUsed: number;
  llmCostUsd: number;
}

/**
 * Pattern summary for API response
 */
export interface PatternSummary {
  type: PatternType;
  description: string;
  frequency: number;
  avgDPSScore: number;
  successRate: number;
  viralVideosCount: number;
  totalVideosAnalyzed: number;
  lastSeenAt: string;
}

// =====================================================
// Service Types
// =====================================================

/**
 * Pattern extraction job status
 */
export type PatternJobStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Pattern extraction job record
 */
export interface PatternExtractionJob {
  id: string;
  batchId: string;
  niche: string;
  minDpsScore: number;
  dateRangeDays: number;
  status: PatternJobStatus;
  totalVideosQueried: number;
  videosProcessed: number;
  patternsExtracted: number;
  patternsUpdated: number;
  errorsCount: number;
  processingTimeMs: number | null;
  llmCallsCount: number;
  llmTokensUsed: number;
  llmCostUsd: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  errorMessage: string | null;
  errorStack: string | null;
}

/**
 * Pattern extraction error record
 */
export interface PatternExtractionError {
  id: string;
  batchId: string;
  videoId: string;
  errorCode: string;
  errorMessage: string;
  errorStack: string | null;
  videoData: Record<string, any> | null;
  llmResponse: string | null;
  failedAt: string;
  retryCount: number;
}

/**
 * Batch processing result
 */
export interface BatchExtractionResult {
  batchId: string;
  totalVideos: number;
  successCount: number;
  failureCount: number;
  patternsExtracted: number;
  patternsUpdated: number;
  patterns: ExtractedPattern[];
  errors: Array<{
    videoId: string;
    error: string;
  }>;
  llmCallsCount: number;
  llmTokensUsed: number;
  llmCostUsd: number;
  processingTimeMs: number;
}

// =====================================================
// Error Codes
// =====================================================

export const PATTERN_ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  NO_VIDEOS_FOUND: 'NO_VIDEOS_FOUND',
  LLM_TIMEOUT: 'LLM_TIMEOUT',
  LLM_INVALID_RESPONSE: 'LLM_INVALID_RESPONSE',
  MISSING_VIDEO_DATA: 'MISSING_VIDEO_DATA',
  DB_ERROR: 'DB_ERROR',
  BATCH_SIZE_EXCEEDED: 'BATCH_SIZE_EXCEEDED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type PatternErrorCode = typeof PATTERN_ERROR_CODES[keyof typeof PATTERN_ERROR_CODES];

// =====================================================
// Configuration
// =====================================================

/**
 * Pattern extraction configuration
 */
export interface PatternExtractionConfig {
  maxVideosPerBatch: number;
  maxVideosPerLLMCall: number;
  llmModel: string;
  llmTemperature: number;
  llmMaxTokens: number;
  cacheResultsHours: number;
  minConfidenceScore: number;
  similarityThreshold: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_PATTERN_CONFIG: PatternExtractionConfig = {
  maxVideosPerBatch: 500,
  maxVideosPerLLMCall: 50,
  llmModel: 'gpt-4-turbo-preview',
  llmTemperature: 0.3,
  llmMaxTokens: 2000,
  cacheResultsHours: 1,
  minConfidenceScore: 0.7,
  similarityThreshold: 0.7,
};


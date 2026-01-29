/**
 * FEAT-003: Pattern Extraction Service
 * 
 * High-level orchestration service that coordinates:
 * - Video querying and filtering
 * - Pattern extraction via LLM
 * - Pattern storage and deduplication
 * - Job tracking and error handling
 * 
 * @module pattern-extraction-service
 */

import {
  extractPatternsFromVideos,
  deduplicatePatterns,
  generateBatchId,
} from './pattern-extraction-engine';

import {
  queryVideosForExtraction,
  findExistingPattern,
  findSimilarPatterns,
  createPattern,
  incrementPatternFrequency,
  updatePatternStatistics,
  associatePatternWithVideo,
  createExtractionJob,
  updateJobStatus,
  logExtractionError,
  getTopPatternsByNiche,
} from './pattern-database-service';

import type {
  PatternExtractionRequest,
  PatternExtractionResponse,
  BatchExtractionResult,
  ExtractedPattern,
  VideoForExtraction,
  PatternSummary,
  PATTERN_ERROR_CODES,
  PatternExtractionConfig,
} from './types';

import { DEFAULT_PATTERN_CONFIG } from './types';

// =====================================================
// Constants
// =====================================================

export const MAX_BATCH_SIZE = 500;
export const DEFAULT_CACHE_HOURS = 1;

// =====================================================
// Main Extraction Function
// =====================================================

/**
 * Extract viral patterns from high-DPS videos
 * 
 * This is the main entry point for pattern extraction.
 * It orchestrates the entire process from querying videos to storing patterns.
 * 
 * @param request - Extraction request parameters
 * @param config - Optional extraction configuration
 * @returns Extraction result with patterns and metadata
 */
export async function extractPatterns(
  request: PatternExtractionRequest,
  config: PatternExtractionConfig = DEFAULT_PATTERN_CONFIG
): Promise<PatternExtractionResponse> {
  const startTime = Date.now();
  const batchId = generateBatchId();

  // Validate request
  validateExtractionRequest(request);

  // Parse date range
  const dateRangeDays = parseDateRange(request.dateRange);

  // Create job record
  await createExtractionJob(
    batchId,
    request.niche,
    request.minDPSScore,
    dateRangeDays
  );

  try {
    // Update job status to processing
    await updateJobStatus(batchId, 'processing');

    // Step 1: Query videos matching criteria
    const limit = Math.min(request.limit || config.maxVideosPerBatch, config.maxVideosPerBatch);
    const videos = await queryVideosForExtraction(
      request.niche,
      request.minDPSScore,
      dateRangeDays,
      limit
    );

    if (videos.length === 0) {
      await updateJobStatus(batchId, 'completed', {
        totalVideosQueried: 0,
        videosProcessed: 0,
        patternsExtracted: 0,
        patternsUpdated: 0,
        processingTimeMs: Date.now() - startTime,
      });

      return {
        success: true,
        patterns: [],
        totalVideosAnalyzed: 0,
        batchId,
        processingTimeMs: Date.now() - startTime,
        llmCallsCount: 0,
        llmTokensUsed: 0,
        llmCostUsd: 0,
      };
    }

    // Step 2: Extract patterns using LLM
    const extractionResult = await extractPatternsFromVideos(
      videos,
      request.niche,
      config
    );

    // Step 3: Deduplicate patterns
    const uniquePatterns = deduplicatePatterns(
      extractionResult.patterns,
      config.similarityThreshold
    );

    // Step 4: Store patterns and create associations
    const storageResult = await storeExtractedPatterns(
      uniquePatterns,
      videos,
      request.niche,
      batchId,
      config
    );

    // Step 5: Retrieve top patterns for response
    const topPatterns = await getTopPatternsByNiche(request.niche);

    // Step 6: Update job status to completed
    await updateJobStatus(batchId, 'completed', {
      totalVideosQueried: videos.length,
      videosProcessed: videos.length,
      patternsExtracted: storageResult.patternsCreated,
      patternsUpdated: storageResult.patternsUpdated,
      errorsCount: storageResult.errorsCount,
      processingTimeMs: Date.now() - startTime,
      llmCallsCount: extractionResult.llmCallsCount,
      llmTokensUsed: extractionResult.llmTokensUsed,
      llmCostUsd: extractionResult.llmCostUsd,
    });

    return {
      success: true,
      patterns: topPatterns,
      totalVideosAnalyzed: videos.length,
      batchId,
      processingTimeMs: Date.now() - startTime,
      llmCallsCount: extractionResult.llmCallsCount,
      llmTokensUsed: extractionResult.llmTokensUsed,
      llmCostUsd: extractionResult.llmCostUsd,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Update job status to failed
    await updateJobStatus(batchId, 'failed', {
      errorMessage,
      errorStack,
      processingTimeMs: Date.now() - startTime,
    });

    throw new Error(`Pattern extraction failed: ${errorMessage}`);
  }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Store extracted patterns in database with deduplication
 */
async function storeExtractedPatterns(
  patterns: ExtractedPattern[],
  videos: VideoForExtraction[],
  niche: string,
  batchId: string,
  config: PatternExtractionConfig
): Promise<{
  patternsCreated: number;
  patternsUpdated: number;
  errorsCount: number;
}> {
  let patternsCreated = 0;
  let patternsUpdated = 0;
  let errorsCount = 0;

  // Group patterns by video for association
  const patternsByVideo = new Map<string, ExtractedPattern[]>();
  
  // For each pattern, associate it with all relevant videos
  for (const pattern of patterns) {
    try {
      // Check if pattern already exists
      let existingPattern = await findExistingPattern(
        niche,
        pattern.type,
        pattern.description
      );

      // If not exact match, check for similar patterns
      if (!existingPattern) {
        const similarPatterns = await findSimilarPatterns(
          niche,
          pattern.type,
          pattern.description,
          config.similarityThreshold
        );

        if (similarPatterns.length > 0) {
          // Use the most similar pattern
          existingPattern = similarPatterns[0];
        }
      }

      let patternId: string;

      if (existingPattern) {
        // Update existing pattern
        patternId = existingPattern.id;
        await incrementPatternFrequency(patternId);
        patternsUpdated++;
      } else {
        // Create new pattern
        const newPattern = await createPattern(
          niche,
          pattern.type,
          pattern.description,
          pattern.details
        );
        patternId = newPattern.id;
        patternsCreated++;
      }

      // Associate pattern with all videos in batch
      // (simplified - in reality, you'd track which videos have which patterns)
      for (const video of videos) {
        try {
          await associatePatternWithVideo(
            patternId,
            video.videoId,
            pattern.confidence,
            batchId
          );
        } catch (error) {
          // Log but don't fail the whole process
          console.error(`Failed to associate pattern with video ${video.videoId}:`, error);
        }
      }

      // Update pattern statistics
      await updatePatternStatistics(patternId);

    } catch (error) {
      errorsCount++;
      console.error(`Error storing pattern:`, error);
      
      // Log error to database
      await logExtractionError(
        batchId,
        'batch', // No specific video for pattern storage errors
        'PATTERN_STORAGE_ERROR',
        error instanceof Error ? error.message : 'Unknown error',
        { pattern },
        undefined,
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  return {
    patternsCreated,
    patternsUpdated,
    errorsCount,
  };
}

/**
 * Validate extraction request
 */
function validateExtractionRequest(request: PatternExtractionRequest): void {
  if (!request.niche || request.niche.trim().length === 0) {
    throw new Error('Niche is required');
  }

  if (request.minDPSScore < 0 || request.minDPSScore > 100) {
    throw new Error('minDPSScore must be between 0 and 100');
  }

  if (!request.dateRange || !isValidDateRange(request.dateRange)) {
    throw new Error('Invalid dateRange format. Use format like "30d", "7d", "90d"');
  }

  if (request.limit && (request.limit < 1 || request.limit > MAX_BATCH_SIZE)) {
    throw new Error(`Limit must be between 1 and ${MAX_BATCH_SIZE}`);
  }
}

/**
 * Check if date range string is valid
 */
function isValidDateRange(dateRange: string): boolean {
  const match = dateRange.match(/^(\d+)d$/);
  return match !== null;
}

/**
 * Parse date range string to days
 */
function parseDateRange(dateRange: string): number {
  const match = dateRange.match(/^(\d+)d$/);
  if (!match) {
    throw new Error('Invalid date range format');
  }
  return parseInt(match[1], 10);
}

// =====================================================
// Additional Service Functions
// =====================================================

/**
 * Get top patterns for a niche (with caching)
 * 
 * @param niche - Content niche
 * @param limit - Maximum number of patterns to return
 * @returns Top patterns sorted by success rate
 */
export async function getTopPatterns(
  niche: string,
  limit: number = 10
): Promise<PatternSummary[]> {
  return getTopPatternsByNiche(niche, undefined, limit);
}

/**
 * Get patterns by type for a niche
 * 
 * @param niche - Content niche
 * @param patternType - Specific pattern type
 * @param limit - Maximum number of patterns to return
 * @returns Patterns of specified type sorted by success rate
 */
export async function getPatternsByType(
  niche: string,
  patternType: string,
  limit: number = 10
): Promise<PatternSummary[]> {
  return getTopPatternsByNiche(niche, patternType as any, limit);
}

/**
 * Batch extract patterns for multiple niches
 * 
 * @param requests - Array of extraction requests
 * @param config - Optional extraction configuration
 * @returns Array of extraction results
 */
export async function batchExtractPatterns(
  requests: PatternExtractionRequest[],
  config: PatternExtractionConfig = DEFAULT_PATTERN_CONFIG
): Promise<PatternExtractionResponse[]> {
  const results: PatternExtractionResponse[] = [];

  for (const request of requests) {
    try {
      const result = await extractPatterns(request, config);
      results.push(result);

      // Add delay between batches to avoid overwhelming the system
      if (requests.length > 1) {
        await sleep(2000);
      }
    } catch (error) {
      console.error(`Failed to extract patterns for niche ${request.niche}:`, error);
      // Continue with next request
    }
  }

  return results;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================
// Exports
// =====================================================

export const PatternExtractionService = {
  extractPatterns,
  getTopPatterns,
  getPatternsByType,
  batchExtractPatterns,
};

export default PatternExtractionService;


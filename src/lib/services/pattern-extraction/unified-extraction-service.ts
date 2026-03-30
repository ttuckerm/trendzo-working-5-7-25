/**
 * Unified Pattern Extraction Service
 * Combines enhanced pattern extraction with quality filtering
 *
 * This service integrates:
 * - Enhanced pattern extraction (9-field breakdown)
 * - LLM quality filtering
 * - Niche-specific criteria from viral-prediction
 */

import { randomUUID } from 'crypto';
import { extractEnhancedPatternsFromVideos } from './enhanced-extraction-engine';
import {
  queryVideosForDetailedExtraction,
  storeVideoPatternsBatch,
} from './enhanced-database-service';
import {
  assessVideosQuality,
  getQualityStatistics,
  type QualityAssessment,
} from './quality-filter-integration';
import type {
  EnhancedPatternExtractionRequest,
  EnhancedPatternExtractionResponse,
  EnhancedPatternExtractionConfig,
  ExtractedVideoPattern,
} from './types-enhanced';
import { DEFAULT_ENHANCED_PATTERN_CONFIG } from './types-enhanced';
import {
  createExtractionJob,
  updateJobStatus,
} from './pattern-database-service';

export interface UnifiedExtractionOptions {
  videos?: import('./types-enhanced').VideoForDetailedExtraction[]; // Provide videos directly
  batchId?: string; // Optional batch ID
  niche?: string; // Optional when videos provided
  minDPSScore?: number; // Optional when videos provided
  dateRange?: string; // Optional when videos provided
  limit?: number;
  enableQualityFilter?: boolean; // Whether to apply quality filtering
  minQualityScore?: number; // Minimum quality score (0-100)
  maxConcurrentQualityChecks?: number; // Max concurrent LLM calls for quality
  extractionConfig?: import('./types-enhanced').EnhancedPatternExtractionConfig;
}

export interface UnifiedExtractionResponse extends EnhancedPatternExtractionResponse {
  qualityStats?: {
    total: number;
    included: number;
    rejected: number;
    averageQuality: number;
    highQuality: number;
    mediumQuality: number;
    lowQuality: number;
  };
}

/**
 * Extract patterns with optional quality filtering
 */
export async function extractPatternsWithQualityFilter(
  options: UnifiedExtractionOptions,
  config: EnhancedPatternExtractionConfig = DEFAULT_ENHANCED_PATTERN_CONFIG
): Promise<UnifiedExtractionResponse> {
  const startTime = Date.now();
  const batchId = options.batchId || `unified_batch_${Date.now()}_${randomUUID().substring(0, 8)}`;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 UNIFIED PATTERN EXTRACTION STARTED`);
  console.log(`   Batch ID: ${batchId}`);
  console.log(`   Niche: ${options.niche || 'N/A (direct videos)'}`);
  console.log(`   Min DPS: ${options.minDPSScore ?? 'N/A'}`);
  console.log(`   Quality Filter: ${options.enableQualityFilter ? 'ENABLED' : 'DISABLED'}`);
  if (options.enableQualityFilter) {
    console.log(`   Min Quality Score: ${options.minQualityScore || 60}`);
  }
  console.log(`${'='.repeat(80)}\n`);

  const dateRangeDays = options.dateRange ? parseInt(options.dateRange.replace('d', '')) : 30;

  // Create job record only if we have niche info
  if (options.niche && options.minDPSScore !== undefined) {
    await createExtractionJob(
      batchId,
      options.niche,
      options.minDPSScore,
      dateRangeDays
    );
  }

  try {
    await updateJobStatus(batchId, 'processing');

    // Step 1: Get videos (either provided directly or query from database)
    let videos: import('./types-enhanced').VideoForDetailedExtraction[];

    if (options.videos && options.videos.length > 0) {
      console.log('📊 Step 1: Using provided videos...');
      videos = options.videos;
    } else {
      console.log('📊 Step 1: Querying videos with transcripts...');
      const limit = Math.min(
        options.limit || config.maxVideosPerBatch,
        config.maxVideosPerBatch
      );

      videos = await queryVideosForDetailedExtraction(
        options.niche,
        options.minDPSScore,
        dateRangeDays,
        limit
      );
    }

    if (videos.length === 0) {
      console.log('⚠️  No videos found matching criteria');

      await updateJobStatus(batchId, 'completed', {
        totalVideosQueried: 0,
        videosProcessed: 0,
      });

      return {
        success: true,
        patterns: [],
        totalVideosAnalyzed: 0,
        patternsExtracted: 0,
        llmCallsCount: 0,
        llmTokensUsed: 0,
        llmCostUsd: 0,
        processingTimeMs: Date.now() - startTime,
      };
    }

    console.log(`✅ Found ${videos.length} videos with transcripts\n`);

    // Step 2: Optional Quality Filtering (NEW)
    let filteredVideos = videos;
    let qualityAssessments: Map<string, QualityAssessment> | undefined;
    let qualityStats: UnifiedExtractionResponse['qualityStats'];

    if (options.enableQualityFilter) {
      console.log('🔍 Step 2: Applying quality filter...');

      qualityAssessments = await assessVideosQuality(
        videos.map(v => ({
          videoId: v.videoId,
          title: v.title || '',
          description: v.description || '',
          caption: v.caption || '',
          hashtags: v.hashtags || [],
          transcript: v.transcript || '',
          detectedNiche: options.niche, // Use requested niche
        })),
        {
          maxConcurrent: options.maxConcurrentQualityChecks || 5,
          onProgress: (processed, total) => {
            if (processed % 10 === 0 || processed === total) {
              console.log(`   Progress: ${processed}/${total} videos assessed`);
            }
          }
        }
      );

      const minQuality = options.minQualityScore || 60;
      filteredVideos = videos.filter(v => {
        const assessment = qualityAssessments!.get(v.videoId);
        return assessment && assessment.shouldInclude && assessment.qualityScore >= minQuality;
      });

      qualityStats = getQualityStatistics(qualityAssessments);

      console.log(`✅ Quality filter complete:`);
      console.log(`   Included: ${qualityStats.included} (avg quality: ${qualityStats.averageQuality.toFixed(1)})`);
      console.log(`   Rejected: ${qualityStats.rejected}`);
      console.log(`   High Quality (80+): ${qualityStats.highQuality}`);
      console.log(`   Medium Quality (60-79): ${qualityStats.mediumQuality}`);
      console.log(`   Low Quality (<60): ${qualityStats.lowQuality}\n`);
    }

    if (filteredVideos.length === 0) {
      console.log('⚠️  No videos passed quality filter');

      await updateJobStatus(batchId, 'completed', {
        totalVideosQueried: videos.length,
        videosProcessed: 0,
        rejectedByQualityFilter: videos.length,
      });

      return {
        success: true,
        patterns: [],
        totalVideosAnalyzed: videos.length,
        patternsExtracted: 0,
        llmCallsCount: 0,
        llmTokensUsed: 0,
        llmCostUsd: 0,
        processingTimeMs: Date.now() - startTime,
        qualityStats,
      };
    }

    // Step 3: Extract patterns (existing logic)
    console.log(`📝 Step ${options.enableQualityFilter ? 3 : 2}: Extracting detailed patterns...`);
    console.log(`   Videos to process: ${filteredVideos.length}\n`);

    const extractionResult = await extractEnhancedPatternsFromVideos(
      filteredVideos,
      options.niche,
      config
    );

    console.log(`✅ Pattern extraction complete:`);
    console.log(`   Patterns extracted: ${extractionResult.patterns.length}`);
    console.log(`   LLM calls: ${extractionResult.llmCallsCount}`);
    console.log(`   Tokens used: ${extractionResult.llmTokensUsed.toLocaleString()}`);
    console.log(`   Estimated cost: $${extractionResult.llmCostUsd.toFixed(4)}\n`);

    // Step 4: Store patterns with quality scores
    console.log(`💾 Step ${options.enableQualityFilter ? 4 : 3}: Storing patterns in database...`);

    // Enhance patterns with quality scores if available
    const patternsToStore = extractionResult.patterns.map(pattern => {
      const qualityAssessment = qualityAssessments?.get(pattern.videoId);
      if (qualityAssessment) {
        return {
          ...pattern,
          qualityScore: qualityAssessment.qualityScore,
          qualitySignals: qualityAssessment.qualitySignals,
        };
      }
      return pattern;
    });

    await storeVideoPatternsBatch(patternsToStore as any, filteredVideos, batchId);
    console.log(`✅ Stored ${patternsToStore.length} patterns\n`);

    // Step 5: Update job status
    await updateJobStatus(batchId, 'completed', {
      totalVideosQueried: videos.length,
      videosProcessed: filteredVideos.length,
      patternsExtracted: extractionResult.patterns.length,
      llmTokensUsed: extractionResult.llmTokensUsed,
      rejectedByQualityFilter: options.enableQualityFilter ? (videos.length - filteredVideos.length) : 0,
    });

    const processingTime = Date.now() - startTime;

    console.log(`${'='.repeat(80)}`);
    console.log(`✅ UNIFIED EXTRACTION COMPLETE`);
    console.log(`   Total Time: ${(processingTime / 1000).toFixed(1)}s`);
    console.log(`   Videos Analyzed: ${videos.length}`);
    if (options.enableQualityFilter) {
      console.log(`   Passed Quality Filter: ${filteredVideos.length}`);
      console.log(`   Rejected: ${videos.length - filteredVideos.length}`);
    }
    console.log(`   Patterns Extracted: ${extractionResult.patterns.length}`);
    console.log(`   Cost: $${extractionResult.llmCostUsd.toFixed(4)}`);
    console.log(`${'='.repeat(80)}\n`);

    return {
      success: true,
      patterns: patternsToStore as any,
      totalVideosAnalyzed: videos.length,
      patternsExtracted: extractionResult.patterns.length,
      llmCallsCount: extractionResult.llmCallsCount,
      llmTokensUsed: extractionResult.llmTokensUsed,
      llmCostUsd: extractionResult.llmCostUsd,
      processingTimeMs: processingTime,
      qualityStats,
    };

  } catch (error: any) {
    console.error('❌ Extraction failed:', error.message);

    await updateJobStatus(batchId, 'failed', {
      error: error.message,
    });

    throw error;
  }
}

/**
 * Helper: Create default unified extraction options
 */
export function createUnifiedExtractionOptions(
  niche: string,
  options?: Partial<UnifiedExtractionOptions>
): UnifiedExtractionOptions {
  return {
    niche,
    minDPSScore: options?.minDPSScore || 70,
    dateRange: options?.dateRange || '365d',
    limit: options?.limit || 100,
    enableQualityFilter: options?.enableQualityFilter ?? true,
    minQualityScore: options?.minQualityScore || 60,
    maxConcurrentQualityChecks: options?.maxConcurrentQualityChecks || 5,
  };
}

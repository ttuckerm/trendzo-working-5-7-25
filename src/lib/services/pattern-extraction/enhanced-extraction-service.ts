/**
 * Enhanced Pattern Extraction Service (v2)
 * Main orchestrator for detailed per-video pattern extraction
 */

import { randomUUID } from 'crypto';
import { extractEnhancedPatternsFromVideos } from './enhanced-extraction-engine';
import {
  queryVideosForDetailedExtraction,
  storeVideoPatternsBatch,
  getTopVideoPatterns,
} from './enhanced-database-service';
import type {
  EnhancedPatternExtractionRequest,
  EnhancedPatternExtractionResponse,
  EnhancedPatternExtractionConfig,
} from './types-enhanced';
import { DEFAULT_ENHANCED_PATTERN_CONFIG } from './types-enhanced';
import {
  createExtractionJob,
  updateJobStatus,
} from './pattern-database-service';

// =====================================================
// Main Extraction Function
// =====================================================

/**
 * Extract detailed patterns from high-performing videos
 */
export async function extractEnhancedPatterns(
  request: EnhancedPatternExtractionRequest,
  config: EnhancedPatternExtractionConfig = DEFAULT_ENHANCED_PATTERN_CONFIG
): Promise<EnhancedPatternExtractionResponse> {
  const startTime = Date.now();
  const batchId = `enhanced_batch_${Date.now()}_${randomUUID().substring(0, 8)}`;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 ENHANCED PATTERN EXTRACTION STARTED`);
  console.log(`   Batch ID: ${batchId}`);
  console.log(`   Niche: ${request.niche}`);
  console.log(`   Min DPS: ${request.minDPSScore}`);
  console.log(`   Date Range: ${request.dateRange}`);
  console.log(`${'='.repeat(80)}\n`);

  // Parse date range
  const dateRangeDays = parseInt(request.dateRange.replace('d', ''));

  // Create job record (reuse existing job tracking)
  await createExtractionJob(
    batchId,
    request.niche,
    request.minDPSScore,
    dateRangeDays
  );

  try {
    // Update job status to processing
    await updateJobStatus(batchId, 'processing');

    // Step 1: Query videos with transcripts
    console.log('📊 Step 1: Querying videos with transcripts...');
    const limit = Math.min(
      request.limit || config.maxVideosPerBatch,
      config.maxVideosPerBatch
    );
    
    const videos = await queryVideosForDetailedExtraction(
      request.niche,
      request.minDPSScore,
      dateRangeDays,
      limit
    );

    if (videos.length === 0) {
      console.log('⚠️  No videos found matching criteria');
      
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
        patternsExtracted: 0,
        batchId,
        processingTimeMs: Date.now() - startTime,
        llmCallsCount: 0,
        llmTokensUsed: 0,
        llmCostUsd: 0,
      };
    }

    console.log(`✅ Found ${videos.length} videos with transcripts\n`);

    // Step 2: Extract detailed patterns using GPT-4
    console.log('🤖 Step 2: Extracting detailed patterns with GPT-4...');
    const extractionResult = await extractEnhancedPatternsFromVideos(
      videos,
      request.niche,
      config
    );

    console.log(`✅ Extracted ${extractionResult.patterns.length} detailed patterns\n`);

    // Step 3: Store patterns in database
    console.log('💾 Step 3: Storing patterns in database...');
    const storageResult = await storeVideoPatternsBatch(
      extractionResult.patterns,
      videos,
      batchId
    );

    console.log(`✅ Stored ${storageResult.successCount} patterns successfully`);
    if (storageResult.errorCount > 0) {
      console.log(`⚠️  ${storageResult.errorCount} patterns failed to store`);
    }
    console.log('');

    // Step 4: Retrieve stored patterns for response
    console.log('📦 Step 4: Retrieving stored patterns...');
    const storedPatterns = await getTopVideoPatterns(
      request.niche,
      request.minDPSScore,
      limit
    );

    console.log(`✅ Retrieved ${storedPatterns.length} patterns\n`);

    // Step 5: Update job status
    await updateJobStatus(batchId, 'completed', {
      totalVideosQueried: videos.length,
      videosProcessed: videos.length,
      patternsExtracted: storageResult.successCount,
      patternsUpdated: 0,  // v2 uses upsert
      errorsCount: storageResult.errorCount,
      processingTimeMs: Date.now() - startTime,
      llmCallsCount: extractionResult.llmCallsCount,
      llmTokensUsed: extractionResult.llmTokensUsed,
      llmCostUsd: extractionResult.llmCostUsd,
    });

    const totalTime = Date.now() - startTime;

    console.log(`${'='.repeat(80)}`);
    console.log(`✅ ENHANCED PATTERN EXTRACTION COMPLETE`);
    console.log(`   Videos Analyzed: ${videos.length}`);
    console.log(`   Patterns Extracted: ${storageResult.successCount}`);
    console.log(`   LLM Calls: ${extractionResult.llmCallsCount}`);
    console.log(`   Tokens Used: ${extractionResult.llmTokensUsed.toLocaleString()}`);
    console.log(`   Cost: $${extractionResult.llmCostUsd.toFixed(4)}`);
    console.log(`   Time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`${'='.repeat(80)}\n`);

    return {
      success: true,
      patterns: storedPatterns,
      totalVideosAnalyzed: videos.length,
      patternsExtracted: storageResult.successCount,
      batchId,
      processingTimeMs: totalTime,
      llmCallsCount: extractionResult.llmCallsCount,
      llmTokensUsed: extractionResult.llmTokensUsed,
      llmCostUsd: extractionResult.llmCostUsd,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('\n❌ ENHANCED PATTERN EXTRACTION FAILED');
    console.error('   Error:', errorMessage);
    console.error('');

    // Update job status to failed
    await updateJobStatus(batchId, 'failed', {
      errorMessage,
      errorStack,
      processingTimeMs: Date.now() - startTime,
    });

    throw new Error(`Enhanced pattern extraction failed: ${errorMessage}`);
  }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Generate batch ID
 */
function generateBatchId(): string {
  return `enhanced_batch_${Date.now()}_${randomUUID().substring(0, 8)}`;
}

/**
 * Validate extraction request
 */
function validateExtractionRequest(request: EnhancedPatternExtractionRequest): void {
  if (!request.niche || request.niche.length === 0) {
    throw new Error('Niche is required');
  }

  if (request.minDPSScore < 0 || request.minDPSScore > 100) {
    throw new Error('minDPSScore must be between 0 and 100');
  }

  if (!request.dateRange.match(/^\d+d$/)) {
    throw new Error('dateRange must be in format "30d", "7d", etc.');
  }
}


/**
 * Unified Viral Content Pipeline
 * End-to-end system combining scraping, filtering, and pattern extraction
 *
 * PIPELINE FLOW:
 * 1. Apify Scraping (by niche keywords)
 * 2. FFmpeg Visual Analysis (FEAT-001)
 * 3. DPS Calculation (FEAT-002)
 * 4. Quality Filtering (LLM-based)
 * 5. Enhanced Pattern Extraction (FEAT-003 + quality)
 *
 * This unifies:
 * - @APIFY_TIKTOK_PIPELINE_SUMMARY.md
 * - @ENHANCED_PATTERN_EXTRACTION_GUIDE.md
 * - niche-framework-definitions.ts
 * - quality-filter-integration.ts
 */

import { scrapeTikTokBatch } from './apifyScraper';
import {
  extractPatternsWithQualityFilter,
  createUnifiedExtractionOptions,
  type UnifiedExtractionOptions,
  type UnifiedExtractionResponse,
} from './pattern-extraction/unified-extraction-service';
import {
  VIRAL_NICHES,
  getNicheById,
  type NicheDefinition,
} from './viral-prediction/niche-framework-definitions';

export interface UnifiedPipelineConfig {
  // Scraping config
  niches: string[]; // Niche IDs to scrape
  videosPerNiche: number; // Videos to scrape per niche

  // Quality filter config
  enableQualityFilter: boolean;
  minQualityScore: number; // 0-100

  // Pattern extraction config
  enablePatternExtraction: boolean;
  minDPSScore: number; // Minimum DPS for pattern extraction
  dateRange: string; // e.g., "365d"

  // Performance config
  maxConcurrentQualityChecks: number;
  pauseBetweenNiches: number; // milliseconds
}

export interface UnifiedPipelineResult {
  totalNiches: number;
  results: NichePipelineResult[];
  totalVideosScraped: number;
  totalPatternsExtracted: number;
  totalDuration: number;
  errors: string[];
}

export interface NichePipelineResult {
  niche: string;
  nicheName: string;
  videosScraped: number;
  scrapingDuration: number;
  patternsExtracted?: number;
  qualityStats?: UnifiedExtractionResponse['qualityStats'];
  extractionDuration?: number;
  error?: string;
}

/**
 * Run the complete unified pipeline
 */
export async function runUnifiedPipeline(
  config: UnifiedPipelineConfig
): Promise<UnifiedPipelineResult> {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     UNIFIED VIRAL CONTENT PIPELINE                         ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📋 Pipeline Configuration:');
  console.log(`   Niches: ${config.niches.length}`);
  console.log(`   Videos per niche: ${config.videosPerNiche}`);
  console.log(`   Quality Filter: ${config.enableQualityFilter ? 'ENABLED' : 'DISABLED'}`);
  console.log(`   Pattern Extraction: ${config.enablePatternExtraction ? 'ENABLED' : 'DISABLED'}`);
  console.log('');

  const startTime = Date.now();
  const results: NichePipelineResult[] = [];
  const errors: string[] = [];

  // Process each niche
  for (const nicheId of config.niches) {
    try {
      const nicheResult = await processNiche(nicheId, config);
      results.push(nicheResult);

      // Pause between niches to avoid rate limits
      if (config.niches.indexOf(nicheId) < config.niches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, config.pauseBetweenNiches));
      }

    } catch (error: any) {
      console.error(`❌ Error processing niche ${nicheId}:`, error.message);
      errors.push(`${nicheId}: ${error.message}`);

      results.push({
        niche: nicheId,
        nicheName: getNicheById(nicheId)?.name || nicheId,
        videosScraped: 0,
        scrapingDuration: 0,
        error: error.message,
      });
    }
  }

  const totalDuration = Date.now() - startTime;

  // Calculate totals
  const totalVideosScraped = results.reduce((sum, r) => sum + r.videosScraped, 0);
  const totalPatternsExtracted = results.reduce((sum, r) => sum + (r.patternsExtracted || 0), 0);

  // Print summary
  printPipelineSummary({
    totalNiches: config.niches.length,
    results,
    totalVideosScraped,
    totalPatternsExtracted,
    totalDuration,
    errors,
  });

  return {
    totalNiches: config.niches.length,
    results,
    totalVideosScraped,
    totalPatternsExtracted,
    totalDuration,
    errors,
  };
}

/**
 * Process a single niche through the pipeline
 */
async function processNiche(
  nicheId: string,
  config: UnifiedPipelineConfig
): Promise<NichePipelineResult> {
  const niche = getNicheById(nicheId);
  if (!niche) {
    throw new Error(`Niche not found: ${nicheId}`);
  }

  console.log(`\n${'═'.repeat(80)}`);
  console.log(`📌 Processing Niche: ${niche.name}`);
  console.log(`${'═'.repeat(80)}\n`);

  // Step 1: Scrape videos using Apify
  console.log('📥 Step 1: Scraping videos with Apify...');
  const scrapingStartTime = Date.now();

  const scrapingResult = await scrapeTikTokBatch(niche.keywords, {
    maxVideos: config.videosPerNiche,
    resultsPerPage: 50,
  });

  const scrapingDuration = Date.now() - scrapingStartTime;
  console.log(`✅ Scraped ${scrapingResult.totalProcessed} videos in ${(scrapingDuration / 1000).toFixed(1)}s\n`);

  // Step 2: Optional Pattern Extraction with Quality Filter
  let patternsExtracted: number | undefined;
  let qualityStats: UnifiedExtractionResponse['qualityStats'] | undefined;
  let extractionDuration: number | undefined;

  if (config.enablePatternExtraction && scrapingResult.totalProcessed > 0) {
    console.log('📝 Step 2: Extracting patterns with quality filter...\n');
    const extractionStartTime = Date.now();

    const extractionOptions = createUnifiedExtractionOptions(nicheId, {
      minDPSScore: config.minDPSScore,
      dateRange: config.dateRange,
      limit: scrapingResult.totalProcessed,
      enableQualityFilter: config.enableQualityFilter,
      minQualityScore: config.minQualityScore,
      maxConcurrentQualityChecks: config.maxConcurrentQualityChecks,
    });

    const extractionResult = await extractPatternsWithQualityFilter(extractionOptions);

    extractionDuration = Date.now() - extractionStartTime;
    patternsExtracted = extractionResult.patternsExtracted;
    qualityStats = extractionResult.qualityStats;

    console.log(`✅ Extracted ${patternsExtracted} patterns in ${(extractionDuration / 1000).toFixed(1)}s\n`);
  }

  return {
    niche: nicheId,
    nicheName: niche.name,
    videosScraped: scrapingResult.totalProcessed,
    scrapingDuration,
    patternsExtracted,
    qualityStats,
    extractionDuration,
  };
}

/**
 * Print pipeline summary
 */
function printPipelineSummary(result: UnifiedPipelineResult): void {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     UNIFIED PIPELINE COMPLETE                              ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📊 Overall Statistics:');
  console.log(`   Total Niches Processed:     ${result.totalNiches}`);
  console.log(`   Total Videos Scraped:       ${result.totalVideosScraped}`);
  console.log(`   Total Patterns Extracted:   ${result.totalPatternsExtracted}`);
  console.log(`   Total Duration:             ${(result.totalDuration / 1000).toFixed(1)}s`);
  console.log('');

  if (result.results.length > 0) {
    console.log('📌 By Niche:');
    for (const nicheResult of result.results) {
      console.log(`\n   ${nicheResult.nicheName}:`);
      console.log(`     Videos Scraped: ${nicheResult.videosScraped}`);

      if (nicheResult.patternsExtracted !== undefined) {
        console.log(`     Patterns Extracted: ${nicheResult.patternsExtracted}`);
      }

      if (nicheResult.qualityStats) {
        console.log(`     Quality Stats:`);
        console.log(`       - Avg Quality: ${nicheResult.qualityStats.averageQuality.toFixed(1)}`);
        console.log(`       - High Quality (80+): ${nicheResult.qualityStats.highQuality}`);
        console.log(`       - Rejected: ${nicheResult.qualityStats.rejected}`);
      }

      if (nicheResult.error) {
        console.log(`     ❌ Error: ${nicheResult.error}`);
      }
    }
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log('⚠️  Errors:', result.errors.length);
    result.errors.slice(0, 5).forEach(err => console.log(`   - ${err}`));
    console.log('');
  }
}

/**
 * Create default pipeline configuration
 */
export function createDefaultPipelineConfig(): UnifiedPipelineConfig {
  return {
    niches: ['personal-finance', 'tech-ai', 'self-improvement'], // Start with 3 high-value niches
    videosPerNiche: 50,
    enableQualityFilter: true,
    minQualityScore: 60,
    enablePatternExtraction: true,
    minDPSScore: 70,
    dateRange: '365d',
    maxConcurrentQualityChecks: 5,
    pauseBetweenNiches: 3000, // 3 seconds
  };
}

/**
 * Create configuration for all 20 niches
 */
export function createFullPipelineConfig(): UnifiedPipelineConfig {
  return {
    niches: VIRAL_NICHES.map(n => n.id),
    videosPerNiche: 100,
    enableQualityFilter: true,
    minQualityScore: 60,
    enablePatternExtraction: true,
    minDPSScore: 70,
    dateRange: '365d',
    maxConcurrentQualityChecks: 5,
    pauseBetweenNiches: 5000, // 5 seconds between niches
  };
}

/**
 * Create configuration for testing (small batch)
 */
export function createTestPipelineConfig(): UnifiedPipelineConfig {
  return {
    niches: ['personal-finance'], // Just one niche
    videosPerNiche: 10,
    enableQualityFilter: true,
    minQualityScore: 60,
    enablePatternExtraction: true,
    minDPSScore: 70,
    dateRange: '30d',
    maxConcurrentQualityChecks: 3,
    pauseBetweenNiches: 2000,
  };
}

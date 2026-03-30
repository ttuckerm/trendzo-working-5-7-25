/**
 * Test Quality Filter + Pattern Extraction on Existing Videos
 *
 * This script:
 * 1. Queries existing videos from scraped_videos table
 * 2. Runs LLM quality filter on them
 * 3. Extracts patterns from high-quality videos
 *
 * Usage:
 * npx tsx scripts/test-quality-filter-extraction.ts [options]
 *
 * Options:
 * --limit 20              Number of videos to process (default: 20)
 * --min-quality 60        Minimum quality score (default: 60)
 * --min-dps 70            Minimum DPS score (default: 70)
 * --date-range 30d        Date range for videos (default: 30d)
 * --skip-quality-filter   Skip quality filtering step
 * --skip-pattern-extraction Skip pattern extraction step
 */

// Load environment variables
import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '../src/lib/env';
import {
  assessVideosQuality,
  getQualityStatistics,
  type VideoForQualityCheck,
} from '../src/lib/services/pattern-extraction/quality-filter-integration';
import {
  extractPatternsWithQualityFilter,
} from '../src/lib/services/pattern-extraction/unified-extraction-service';
import type { VideoForDetailedExtraction } from '../src/lib/services/pattern-extraction/types-enhanced';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse CLI arguments
const args = process.argv.slice(2);
const options: any = {
  limit: 20,
  minQuality: 60,
  minDps: 70,
  dateRange: '30d',
  skipQualityFilter: false,
  skipPatternExtraction: false,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const key = arg.substring(2);
    const value = args[i + 1];

    if (key === 'skip-quality-filter') {
      options.skipQualityFilter = true;
    } else if (key === 'skip-pattern-extraction') {
      options.skipPatternExtraction = true;
    } else if (value && !value.startsWith('--')) {
      if (key === 'limit' || key === 'min-quality' || key === 'min-dps') {
        options[key.replace('-', '')] = parseInt(value);
      } else {
        options[key.replace('-', '')] = value;
      }
      i++;
    }
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     QUALITY FILTER + PATTERN EXTRACTION TEST               ║');
  console.log('║                                                            ║');
  console.log('║     Testing on Existing Database Videos                   ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📋 Configuration:');
  console.log(`   Video Limit: ${options.limit}`);
  console.log(`   Min Quality Score: ${options.minQuality}`);
  console.log(`   Min DPS Score: ${options.minDps}`);
  console.log(`   Date Range: ${options.dateRange}`);
  console.log(`   Quality Filter: ${options.skipQualityFilter ? 'DISABLED' : 'ENABLED'}`);
  console.log(`   Pattern Extraction: ${options.skipPatternExtraction ? 'DISABLED' : 'ENABLED'}`);
  console.log('');

  const startTime = Date.now();

  // Step 1: Query existing videos from database
  console.log('📥 Step 1: Querying existing videos from database...');

  const dateFilter = parseDateRange(options.dateRange);

  const { data: videos, error: queryError } = await supabase
    .from('scraped_videos')
    .select('*')
    .gte('inserted_at', dateFilter)
    .not('transcript_text', 'is', null) // Only videos with transcripts
    .order('dps_score', { ascending: false }) // Highest DPS first
    .limit(options.limit);

  if (queryError) {
    console.error('❌ Error querying videos:', queryError.message);
    process.exit(1);
  }

  if (!videos || videos.length === 0) {
    console.log('⚠️  No videos found in database matching criteria');
    console.log('   Try adjusting --date-range or check if videos have transcripts');
    process.exit(0);
  }

  console.log(`✅ Found ${videos.length} videos`);
  console.log(`   DPS Range: ${Math.min(...videos.map(v => v.dps_score || 0))} - ${Math.max(...videos.map(v => v.dps_score || 0))}`);
  console.log('');

  // Step 2: Quality Filter
  let qualityFilteredVideos = videos;

  if (!options.skipQualityFilter) {
    console.log('🔍 Step 2: Running LLM Quality Filter...');

    const videosForQualityCheck: VideoForQualityCheck[] = videos.map(v => ({
      videoId: v.video_id,
      title: v.title || v.description || 'Untitled',
      transcript: v.transcript_text || '',
      description: v.description || '',
      creatorUsername: v.creator_username || 'unknown',
      viewsCount: v.views_count || 0,
      likesCount: v.likes_count || 0,
      dpsScore: v.dps_score,
    }));

    const qualityResults = await assessVideosQuality(videosForQualityCheck, {
      maxConcurrent: 5,
    });

    // Get statistics
    const stats = getQualityStatistics(qualityResults);

    console.log(`✅ Quality filtering complete`);
    console.log(`   Included: ${stats.included}/${stats.total} (${(stats.included / stats.total * 100).toFixed(1)}%)`);
    console.log(`   Rejected: ${stats.rejected}`);
    console.log(`   Avg Quality Score: ${stats.averageQuality.toFixed(1)}`);
    console.log('');
    console.log('📊 Quality Distribution:');
    console.log(`   High Quality (80+): ${stats.highQuality}`);
    console.log(`   Medium Quality (60-79): ${stats.mediumQuality}`);
    console.log(`   Low Quality (<60): ${stats.lowQuality}`);
    console.log('');

    // Filter to only high-quality videos
    const passedVideoIds = new Set<string>();
    for (const [videoId, assessment] of qualityResults.entries()) {
      if (assessment.shouldInclude) {
        passedVideoIds.add(videoId);
      }
    }

    qualityFilteredVideos = videos.filter(v => passedVideoIds.has(v.video_id));

    console.log(`✅ ${qualityFilteredVideos.length} videos passed quality filter`);
    console.log('');
  } else {
    console.log('⏭️  Step 2: Quality filter SKIPPED\n');
  }

  // Step 3: Pattern Extraction
  if (!options.skipPatternExtraction) {
    console.log('🎨 Step 3: Extracting Patterns...');

    if (qualityFilteredVideos.length === 0) {
      console.log('⚠️  No videos available for pattern extraction');
      process.exit(0);
    }

    // Convert to VideoForDetailedExtraction format
    const videosForExtraction: VideoForDetailedExtraction[] = qualityFilteredVideos.map(v => ({
      videoId: v.video_id,
      title: v.title || v.description || 'Untitled',
      description: v.description || '',
      transcript: v.transcript_text || '',
      creatorUsername: v.creator_username || 'unknown',
      viewsCount: v.views_count || 0,
      likesCount: v.likes_count || 0,
      dpsScore: v.dps_score,
      dpsPercentile: v.dps_percentile || 0,
    }));

    const extractionResult = await extractPatternsWithQualityFilter({
      videos: videosForExtraction,
      batchId: `test-${Date.now()}`,
      enableQualityFilter: false, // Already filtered
      minQualityScore: 0,
      extractionConfig: {
        includeConfidence: true,
        maxConcurrent: 3,
      },
    });

    console.log(`✅ Pattern extraction complete`);
    console.log(`   Patterns Extracted: ${extractionResult.patternsExtracted}`);
    console.log(`   Success Rate: ${(extractionResult.patternsExtracted / extractionResult.totalVideosAnalyzed * 100).toFixed(1)}%`);
    console.log(`   Duration: ${(extractionResult.processingTimeMs / 1000).toFixed(1)}s`);
    console.log(`   LLM Calls: ${extractionResult.llmCallsCount}`);
    console.log(`   LLM Tokens: ${extractionResult.llmTokensUsed.toLocaleString()}`);
    console.log(`   LLM Cost: $${extractionResult.llmCostUsd.toFixed(4)}`);
    console.log('');

    // Show sample patterns
    if (extractionResult.patterns && extractionResult.patterns.length > 0) {
      console.log('📋 Sample Extracted Patterns:\n');
      extractionResult.patterns.slice(0, 3).forEach((pattern, idx) => {
        console.log(`${idx + 1}. Video: ${pattern.videoId}`);
        console.log(`   Topic: ${pattern.topic}`);
        console.log(`   Angle: ${pattern.angle}`);
        console.log(`   Hook (Spoken): ${pattern.hookSpoken?.substring(0, 100) || 'N/A'}...`);
        console.log(`   Confidence: ${pattern.confidence || 'N/A'}`);
        console.log('');
      });
    }
  } else {
    console.log('⏭️  Step 3: Pattern extraction SKIPPED\n');
  }

  // Final Summary
  const totalDuration = Date.now() - startTime;

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     ✅ TEST COMPLETE!                                      ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📊 Final Statistics:');
  console.log(`   Videos Queried:         ${videos.length}`);
  console.log(`   Videos After Filter:    ${qualityFilteredVideos.length}`);
  console.log(`   Total Duration:         ${(totalDuration / 1000).toFixed(1)}s`);
  console.log('');
  console.log('💡 Next Steps:');
  console.log('   1. Check video_patterns_detailed table for extracted patterns');
  console.log('   2. Run full unified pipeline with --test flag');
  console.log('   3. Adjust quality thresholds based on results\n');
}

function parseDateRange(range: string): string {
  const match = range.match(/^(\d+)([dhm])$/);
  if (!match) {
    throw new Error(`Invalid date range: ${range}. Use format like "30d", "7d", "24h"`);
  }

  const [, amount, unit] = match;
  const now = new Date();

  switch (unit) {
    case 'd':
      now.setDate(now.getDate() - parseInt(amount));
      break;
    case 'h':
      now.setHours(now.getHours() - parseInt(amount));
      break;
    case 'm':
      now.setMonth(now.getMonth() - parseInt(amount));
      break;
  }

  return now.toISOString();
}

main().catch(err => {
  console.error('\n❌ Test failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});

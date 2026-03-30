/**
 * Unified Viral Content Pipeline CLI
 * Run end-to-end scraping + filtering + pattern extraction
 *
 * Usage:
 * npx tsx scripts/run-unified-pipeline.ts [options]
 *
 * Options:
 * --test                    Test mode (10 videos, 1 niche)
 * --default                 Default mode (50 videos, 3 niches)
 * --full                    Full mode (100 videos, all 20 niches)
 * --niches "niche1,niche2"  Specific niches
 * --videos 50               Videos per niche
 * --no-quality-filter       Disable quality filtering
 * --no-pattern-extraction   Disable pattern extraction
 * --min-quality 60          Minimum quality score
 * --min-dps 70              Minimum DPS score
 */

// Load environment variables
import { config } from 'dotenv';
config();

import {
  runUnifiedPipeline,
  createDefaultPipelineConfig,
  createFullPipelineConfig,
  createTestPipelineConfig,
  type UnifiedPipelineConfig,
} from '../src/lib/services/unified-viral-pipeline';
import { VIRAL_NICHES } from '../src/lib/services/viral-prediction/niche-framework-definitions';

const args = process.argv.slice(2);
const options: any = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const key = arg.substring(2);
    const value = args[i + 1];

    if (key === 'test' || key === 'default' || key === 'full' || key === 'no-quality-filter' || key === 'no-pattern-extraction') {
      options[key] = true;
    } else if (value && !value.startsWith('--')) {
      options[key] = value;
      i++;
    }
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     UNIFIED VIRAL CONTENT PIPELINE                         ║');
  console.log('║                                                            ║');
  console.log('║     Scraping → FFmpeg → DPS → Quality → Patterns           ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (options.help || options.h) {
    showHelp();
    return;
  }

  // Build configuration
  let config: UnifiedPipelineConfig;

  if (options.test) {
    console.log('🧪 TEST MODE: 10 videos, 1 niche\n');
    config = createTestPipelineConfig();
  } else if (options.full) {
    console.log('🚀 FULL MODE: 100 videos, ALL 20 niches\n');
    config = createFullPipelineConfig();
  } else if (options.niches) {
    const nicheIds = options.niches.split(',').map((n: string) => n.trim());
    console.log(`📌 CUSTOM MODE: ${nicheIds.length} niches\n`);
    config = {
      ...createDefaultPipelineConfig(),
      niches: nicheIds,
    };
  } else {
    console.log('📌 DEFAULT MODE: 50 videos, 3 niches\n');
    config = createDefaultPipelineConfig();
  }

  // Apply CLI overrides
  if (options.videos) {
    config.videosPerNiche = parseInt(options.videos);
  }

  if (options['no-quality-filter']) {
    config.enableQualityFilter = false;
  }

  if (options['no-pattern-extraction']) {
    config.enablePatternExtraction = false;
  }

  if (options['min-quality']) {
    config.minQualityScore = parseInt(options['min-quality']);
  }

  if (options['min-dps']) {
    config.minDPSScore = parseInt(options['min-dps']);
  }

  // Show configuration
  console.log('📋 Pipeline Configuration:');
  console.log(`   Niches: ${config.niches.length} (${config.niches.slice(0, 3).join(', ')}${config.niches.length > 3 ? '...' : ''})`);
  console.log(`   Videos per niche: ${config.videosPerNiche}`);
  console.log(`   Quality Filter: ${config.enableQualityFilter ? 'ENABLED' : 'DISABLED'}`);
  if (config.enableQualityFilter) {
    console.log(`   Min Quality Score: ${config.minQualityScore}`);
  }
  console.log(`   Pattern Extraction: ${config.enablePatternExtraction ? 'ENABLED' : 'DISABLED'}`);
  if (config.enablePatternExtraction) {
    console.log(`   Min DPS Score: ${config.minDPSScore}`);
    console.log(`   Date Range: ${config.dateRange}`);
  }
  console.log('');

  // Confirm for large runs
  if (!options.test && !options.y) {
    console.log('⚠️  This will scrape videos and may consume API credits.');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Run pipeline
  try {
    const result = await runUnifiedPipeline(config);

    // Final summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║     ✅ PIPELINE COMPLETE!                                  ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📊 Final Statistics:');
    console.log(`   Niches Processed:       ${result.totalNiches}`);
    console.log(`   Videos Scraped:         ${result.totalVideosScraped}`);
    console.log(`   Patterns Extracted:     ${result.totalPatternsExtracted}`);
    console.log(`   Total Duration:         ${(result.totalDuration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`   Success Rate:           ${((result.totalNiches - result.errors.length) / result.totalNiches * 100).toFixed(1)}%`);
    console.log('');

    if (result.errors.length > 0) {
      console.log(`⚠️  Encountered ${result.errors.length} errors`);
    }

    console.log('💡 Next Steps:');
    console.log('   1. View patterns in database (video_patterns_detailed table)');
    console.log('   2. Run DPS calculation if not already done');
    console.log('   3. Use patterns for content creation\n');

  } catch (error: any) {
    console.error('\n❌ Pipeline failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function showHelp() {
  console.log('Unified Viral Content Pipeline\n');
  console.log('Usage:');
  console.log('  npx tsx scripts/run-unified-pipeline.ts [options]\n');
  console.log('Options:');
  console.log('  --test                    Test mode (10 videos, 1 niche)');
  console.log('  --default                 Default mode (50 videos, 3 niches) [DEFAULT]');
  console.log('  --full                    Full mode (100 videos, all 20 niches)');
  console.log('  --niches "niche1,niche2"  Specific niches');
  console.log('  --videos 50               Videos per niche');
  console.log('  --no-quality-filter       Disable quality filtering');
  console.log('  --no-pattern-extraction   Disable pattern extraction');
  console.log('  --min-quality 60          Minimum quality score (0-100)');
  console.log('  --min-dps 70              Minimum DPS score for patterns');
  console.log('  --help                    Show this help message\n');
  console.log('Available Niches:');
  VIRAL_NICHES.forEach(n => {
    console.log(`  ${n.id.padEnd(25)} - ${n.name}`);
  });
  console.log('\nExamples:');
  console.log('  # Test with 10 videos');
  console.log('  npx tsx scripts/run-unified-pipeline.ts --test\n');
  console.log('  # Scrape specific niches');
  console.log('  npx tsx scripts/run-unified-pipeline.ts --niches "personal-finance,tech-ai"\n');
  console.log('  # Full pipeline (all niches)');
  console.log('  npx tsx scripts/run-unified-pipeline.ts --full\n');
  console.log('  # Scrape without quality filter');
  console.log('  npx tsx scripts/run-unified-pipeline.ts --no-quality-filter\n');
}

main();

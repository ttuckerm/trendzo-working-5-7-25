/**
 * CLI Script: Populate Training Data
 * 
 * Run with: npx ts-node scripts/populate-training-data.ts
 * 
 * Or with options:
 *   npx ts-node scripts/populate-training-data.ts --limit=100 --min-quality=60
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Import after dotenv to ensure env vars are loaded
import { 
  populateTrainingData, 
  getTrainingDataStats,
  getVideoSelectionStats 
} from '../src/lib/services/training';

// Parse command line arguments
function parseArgs(): Record<string, string | number | boolean> {
  const args: Record<string, string | number | boolean> = {};
  
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (value === undefined) {
        args[key] = true;
      } else if (!isNaN(Number(value))) {
        args[key] = Number(value);
      } else if (value === 'true') {
        args[key] = true;
      } else if (value === 'false') {
        args[key] = false;
      } else {
        args[key] = value;
      }
    }
  });
  
  return args;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('         TRAINING DATA PREPARATION PIPELINE                 ');
  console.log('═══════════════════════════════════════════════════════════\n');

  const args = parseArgs();
  
  if (args.help) {
    console.log('Usage: npx ts-node scripts/populate-training-data.ts [options]\n');
    console.log('Options:');
    console.log('  --limit=N          Max videos to process (default: all)');
    console.log('  --min-quality=N    Minimum quality score 0-100 (default: 50)');
    console.log('  --require-transcript  Only process videos with transcripts');
    console.log('  --source=NAME      Only process videos from specific source');
    console.log('  --split=TYPE       Force data split: train, validation, test, auto');
    console.log('  --clear            Clear all existing training data first');
    console.log('  --dry-run          Show what would be processed without doing it');
    console.log('  --help             Show this help message');
    return;
  }

  // Check current state
  console.log('📊 Checking current state...\n');

  const sourceStats = await getVideoSelectionStats();
  console.log('Source Videos (scraped_videos):');
  console.log(`  Total: ${sourceStats.total}`);
  console.log(`  With transcript: ${sourceStats.withTranscript} (${(sourceStats.withTranscript / sourceStats.total * 100).toFixed(1)}%)`);
  console.log(`  With DPS: ${sourceStats.withDPS} (${(sourceStats.withDPS / sourceStats.total * 100).toFixed(1)}%)`);
  console.log('  By classification:');
  Object.entries(sourceStats.byClassification).forEach(([tier, count]) => {
    console.log(`    ${tier}: ${count}`);
  });
  console.log('  By source:');
  Object.entries(sourceStats.bySource).forEach(([source, count]) => {
    console.log(`    ${source}: ${count}`);
  });
  console.log(`  Already processed: ${sourceStats.alreadyProcessed}`);
  console.log(`  Ready for processing: ${sourceStats.readyForProcessing}\n`);

  if (sourceStats.readyForProcessing === 0) {
    console.log('✅ All videos already processed. Nothing to do.\n');
    console.log('   Use --clear flag to reset training data and reprocess.');
    return;
  }

  if (args['dry-run']) {
    console.log('🔍 DRY RUN - Would process up to', args.limit || sourceStats.readyForProcessing, 'videos');
    console.log('   Min quality:', args['min-quality'] || 50);
    console.log('   Require transcript:', args['require-transcript'] || false);
    console.log('   Source filter:', args.source || 'all');
    console.log('   Data split:', args.split || 'auto');
    return;
  }

  // Run population
  console.log('🚀 Starting training data population...\n');

  const startTime = Date.now();
  let lastProgress = 0;

  const result = await populateTrainingData({
    selectionCriteria: {
      limit: args.limit as number || undefined,
      requireTranscript: args['require-transcript'] as boolean || false,
      source: args.source as string || undefined
    },
    minQualityScore: (args['min-quality'] as number) || 50,
    dataSplit: (args.split as 'train' | 'validation' | 'test' | 'auto') || 'auto',
    onProgress: (stage, current, total) => {
      const pct = Math.round((current / total) * 100);
      if (pct !== lastProgress) {
        process.stdout.write(`\r${stage}: ${current}/${total} (${pct}%)`);
        lastProgress = pct;
      }
    }
  });

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('                        RESULTS                              ');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Status: ${result.success ? '✅ SUCCESS' : '⚠️ COMPLETED WITH ERRORS'}`);
  console.log(`Processed: ${result.processed}`);
  console.log(`Inserted: ${result.inserted}`);
  console.log(`Skipped: ${result.skipped}`);
  console.log(`Failed: ${result.failed}`);
  console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`);
  console.log(`\nDistribution of inserted videos:`);
  Object.entries(result.distribution).forEach(([tier, count]) => {
    console.log(`  ${tier}: ${count}`);
  });

  if (result.errors.length > 0) {
    console.log(`\n⚠️ Errors (${result.errors.length}):`);
    result.errors.slice(0, 10).forEach(err => {
      console.log(`  - ${err.videoId}: ${err.error}`);
    });
    if (result.errors.length > 10) {
      console.log(`  ... and ${result.errors.length - 10} more`);
    }
  }

  // Final stats
  console.log('\n📊 Final Training Data Stats:');
  const finalStats = await getTrainingDataStats();
  console.log(`  Total samples: ${finalStats.total}`);
  console.log('  By tier:');
  Object.entries(finalStats.byTier).forEach(([tier, count]) => {
    const pct = finalStats.total > 0 ? ((count as number) / finalStats.total * 100).toFixed(1) : '0';
    console.log(`    ${tier}: ${count} (${pct}%)`);
  });
  console.log('  By split:');
  Object.entries(finalStats.bySplit).forEach(([split, count]) => {
    const pct = finalStats.total > 0 ? ((count as number) / finalStats.total * 100).toFixed(1) : '0';
    console.log(`    ${split}: ${count} (${pct}%)`);
  });
  console.log(`  Avg quality: ${finalStats.avgQuality.toFixed(1)}%`);
  console.log(`  Avg coverage: ${finalStats.avgCoverage.toFixed(1)}%`);
  console.log(`  With transcript: ${finalStats.withTranscript}`);

  // Training readiness
  const viralCount = (finalStats.byTier['mega-viral'] || 0) + (finalStats.byTier['viral'] || 0);
  const viralPct = finalStats.total > 0 ? (viralCount / finalStats.total * 100) : 0;
  
  console.log('\n🎯 Training Readiness:');
  console.log(`  Minimum samples (500): ${finalStats.total >= 500 ? '✅' : '❌'} (${finalStats.total})`);
  console.log(`  Viral balance (10%): ${viralPct >= 10 ? '✅' : '❌'} (${viralPct.toFixed(1)}%)`);
  console.log(`  Good quality (70%): ${finalStats.avgQuality >= 70 ? '✅' : '❌'} (${finalStats.avgQuality.toFixed(1)}%)`);
  console.log(`  Good coverage (50%): ${finalStats.avgCoverage >= 50 ? '✅' : '❌'} (${finalStats.avgCoverage.toFixed(1)}%)`);

  const isReady = finalStats.total >= 500 && viralPct >= 10 && finalStats.avgQuality >= 70;
  console.log(`\n${isReady ? '✅ READY FOR ML TRAINING!' : '⚠️ Not ready for training yet'}`);

  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error('❌ Pipeline failed:', err);
  process.exit(1);
});
























































































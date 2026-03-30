#!/usr/bin/env npx tsx
/**
 * Extract Training Features Script
 *
 * Processes scraped_videos → training_features table.
 * Downloads each video, runs deterministic analyzers, writes flat feature rows.
 *
 * Usage:
 *   npx tsx scripts/extract-training-features.ts
 *   npx tsx scripts/extract-training-features.ts --limit 10
 *   npx tsx scripts/extract-training-features.ts --batch-size 3
 *   npx tsx scripts/extract-training-features.ts --summary-only
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// CLI arg helper
function getCliArg(flag: string): string | undefined {
  const args = process.argv.slice(2);
  const eq = args.find(a => a.startsWith(`${flag}=`));
  if (eq) return eq.split('=')[1];
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

function hasCliFlag(flag: string): boolean {
  return process.argv.slice(2).includes(flag);
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Training Feature Extraction Pipeline           ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // Dynamic import to avoid Next.js module resolution issues in script context
  const { runFeatureExtraction, getExtractionSummary } = await import(
    '../src/lib/training/feature-extractor'
  );

  // Summary-only mode
  if (hasCliFlag('--summary-only')) {
    const summary = await getExtractionSummary(supabase);
    console.log('  Current extraction summary:');
    console.log(`    Total rows:              ${summary.totalRows}`);
    console.log(`    Avg features populated:  ${summary.avgFeaturesPopulated} / 68`);
    console.log(`    Latest extraction:       ${summary.latestExtraction || 'never'}`);
    console.log(`    Version counts:          ${JSON.stringify(summary.versionCounts)}`);

    // Count scraped_videos for comparison
    const { count } = await supabase
      .from('scraped_videos')
      .select('video_id', { count: 'exact', head: true });

    console.log(`    Scraped videos total:    ${count}`);
    console.log(`    Remaining:               ${(count || 0) - summary.totalRows}`);
    process.exit(0);
  }

  const limit = getCliArg('--limit') ? parseInt(getCliArg('--limit')!) : 0;
  const batchSize = getCliArg('--batch-size') ? parseInt(getCliArg('--batch-size')!) : 5;

  console.log(`  Config:`);
  console.log(`    Limit:       ${limit || 'all'}`);
  console.log(`    Batch size:  ${batchSize}`);
  console.log('');

  const result = await runFeatureExtraction(supabase, {
    limit,
    batchSize,
    onProgress: (progress) => {
      const pct = progress.total > 0
        ? ((progress.processed / progress.total) * 100).toFixed(1)
        : '0';
      process.stdout.write(
        `\r  Progress: ${progress.processed}/${progress.total} (${pct}%) | ` +
        `OK: ${progress.succeeded} | Failed: ${progress.failed} | ` +
        `Current: ${progress.currentVideoId?.slice(0, 12) || '...'}`
      );
    },
  });

  console.log('\n');
  console.log('  ════════════════════════════════════════════════');
  console.log('  EXTRACTION COMPLETE');
  console.log('  ════════════════════════════════════════════════');
  console.log(`    Total processed:     ${result.totalProcessed}`);
  console.log(`    Succeeded:           ${result.succeeded}`);
  console.log(`    Failed:              ${result.failed}`);
  console.log(`    Skipped:             ${result.skipped}`);
  console.log(`    Features per video:  ${result.featuresPerVideo}`);
  console.log(`    Duration:            ${(result.durationMs / 1000).toFixed(1)}s`);

  if (result.errors.length > 0) {
    console.log(`\n  Errors (${result.errors.length}):`);
    for (const err of result.errors.slice(0, 20)) {
      console.log(`    ${err.videoId}: ${err.error}`);
    }
    if (result.errors.length > 20) {
      console.log(`    ... and ${result.errors.length - 20} more`);
    }
  }

  // Print summary
  const summary = await getExtractionSummary(supabase);
  console.log('\n  Post-extraction summary:');
  console.log(`    Total rows in training_features:  ${summary.totalRows}`);
  console.log(`    Avg features populated:           ${summary.avgFeaturesPopulated} / 68`);

  process.exit(result.failed > 0 && result.succeeded === 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

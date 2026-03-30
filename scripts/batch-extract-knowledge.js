#!/usr/bin/env node

/**
 * FEAT-060: Batch Knowledge Extraction
 * Process all videos with DPS scores through the knowledge extraction pipeline
 *
 * Usage:
 *   node scripts/batch-extract-knowledge.js [options]
 *
 * Options:
 *   --limit N          Process only N videos (default: all)
 *   --classification X Only process videos with classification X (mega-viral, viral, normal)
 *   --min-dps N        Only process videos with DPS >= N
 *   --force-refresh    Re-extract even if already processed
 *   --parallel N       Number of parallel extractions (default: 3, max: 5)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ═══════════════════════════════════════════════════════════════
// CLI ARGUMENT PARSING
// ═══════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const config = {
  limit: null,
  classification: null,
  minDps: null,
  forceRefresh: false,
  parallel: 3
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--limit':
      config.limit = parseInt(args[++i], 10);
      break;
    case '--classification':
      config.classification = args[++i];
      break;
    case '--min-dps':
      config.minDps = parseFloat(args[++i]);
      break;
    case '--force-refresh':
      config.forceRefresh = true;
      break;
    case '--parallel':
      config.parallel = Math.min(parseInt(args[++i], 10), 5);
      break;
  }
}

// ═══════════════════════════════════════════════════════════════
// FETCH VIDEOS TO PROCESS
// ═══════════════════════════════════════════════════════════════

async function fetchVideosToProcess() {
  console.log('\n🔍 Fetching videos to process...\n');

  let query = supabase
    .from('scraped_videos')
    .select('video_id, dps_score, classification, transcript, caption')
    .not('dps_score', 'is', null)
    .order('dps_score', { ascending: false });

  // Apply filters
  if (config.classification) {
    query = query.eq('classification', config.classification);
  }

  if (config.minDps !== null) {
    query = query.gte('dps_score', config.minDps);
  }

  if (config.limit) {
    query = query.limit(config.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Failed to fetch videos:', error);
    process.exit(1);
  }

  // Filter out videos without transcript or caption
  const validVideos = data.filter(v => v.transcript || v.caption);

  console.log(`📊 Found ${validVideos.length} videos to process`);
  if (config.classification) {
    console.log(`   Classification: ${config.classification}`);
  }
  if (config.minDps !== null) {
    console.log(`   Min DPS: ${config.minDps}`);
  }
  console.log(`   Parallel: ${config.parallel}`);
  console.log(`   Force Refresh: ${config.forceRefresh}\n`);

  return validVideos;
}

// ═══════════════════════════════════════════════════════════════
// EXTRACT KNOWLEDGE FOR ONE VIDEO
// ═══════════════════════════════════════════════════════════════

async function extractForVideo(video) {
  const startTime = Date.now();

  try {
    const response = await fetch(`http://localhost:3002/api/knowledge/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id: video.video_id,
        force_refresh: config.forceRefresh
      })
    });

    const result = await response.json();

    if (!result.success) {
      console.error(`   ❌ ${video.video_id}: ${result.error}`);
      return { success: false, video_id: video.video_id, error: result.error };
    }

    const elapsed = Date.now() - startTime;
    const cached = result.cached ? '(cached)' : '';

    console.log(
      `   ✅ ${video.video_id} ${cached} | ` +
      `Agreement: ${(result.llm_agreement * 100).toFixed(0)}% | ` +
      `Confidence: ${(result.confidence * 100).toFixed(0)}% | ` +
      `${elapsed}ms`
    );

    return { success: true, video_id: video.video_id, result };

  } catch (error) {
    console.error(`   ❌ ${video.video_id}: ${error.message}`);
    return { success: false, video_id: video.video_id, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// PARALLEL BATCH PROCESSOR
// ═══════════════════════════════════════════════════════════════

async function processBatch(videos) {
  const results = {
    total: videos.length,
    success: 0,
    failed: 0,
    cached: 0,
    totalCost: 0,
    totalTime: 0,
    errors: []
  };

  const batchStartTime = Date.now();

  // Process in chunks of config.parallel
  for (let i = 0; i < videos.length; i += config.parallel) {
    const chunk = videos.slice(i, i + config.parallel);
    const chunkNum = Math.floor(i / config.parallel) + 1;
    const totalChunks = Math.ceil(videos.length / config.parallel);

    console.log(`\n📦 Batch ${chunkNum}/${totalChunks} (${chunk.length} videos)`);

    const promises = chunk.map(video => extractForVideo(video));
    const chunkResults = await Promise.all(promises);

    // Aggregate results
    chunkResults.forEach(r => {
      if (r.success) {
        results.success++;
        if (r.result?.cached) {
          results.cached++;
        }
      } else {
        results.failed++;
        results.errors.push({ video_id: r.video_id, error: r.error });
      }
    });

    // Rate limiting: wait 2 seconds between batches to avoid API throttling
    if (i + config.parallel < videos.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  results.totalTime = Date.now() - batchStartTime;

  return results;
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   FEAT-060: Batch Knowledge Extraction');
  console.log('═══════════════════════════════════════════════════════════════');

  const videos = await fetchVideosToProcess();

  if (videos.length === 0) {
    console.log('\n⚠️  No videos to process\n');
    return;
  }

  const results = await processBatch(videos);

  // ═══════════════════════════════════════════════════════════════
  // FINAL REPORT
  // ═══════════════════════════════════════════════════════════════

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   EXTRACTION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`📊 Results:`);
  console.log(`   Total:        ${results.total}`);
  console.log(`   ✅ Success:   ${results.success} (${((results.success / results.total) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Failed:    ${results.failed}`);
  console.log(`   💾 Cached:    ${results.cached}`);
  console.log(`   ⏱️  Total Time: ${(results.totalTime / 1000).toFixed(1)}s`);
  console.log(`   📈 Avg Time:  ${(results.totalTime / results.total / 1000).toFixed(2)}s/video\n`);

  if (results.errors.length > 0) {
    console.log('❌ Errors:');
    results.errors.forEach(e => {
      console.log(`   ${e.video_id}: ${e.error}`);
    });
    console.log('');
  }

  // Query final stats from database
  const { data: stats } = await supabase
    .from('extracted_knowledge')
    .select('agreement_score, confidence_score, is_novel_pattern');

  if (stats && stats.length > 0) {
    const avgAgreement = stats.reduce((sum, s) => sum + s.agreement_score, 0) / stats.length;
    const avgConfidence = stats.reduce((sum, s) => sum + s.confidence_score, 0) / stats.length;
    const novelPatterns = stats.filter(s => s.is_novel_pattern).length;

    console.log('📈 Quality Metrics:');
    console.log(`   Avg Agreement:  ${(avgAgreement * 100).toFixed(1)}%`);
    console.log(`   Avg Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`   Novel Patterns: ${novelPatterns}\n`);
  }

  console.log('═══════════════════════════════════════════════════════════════\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * DEBUG: Pattern Extraction with Verbose Logging
 * Tests pattern extraction step-by-step with detailed output
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const API_URL = 'http://localhost:3002/api/patterns/extract';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('\n🔍 PATTERN EXTRACTION DEBUG\n');
console.log('=' .repeat(70));

async function step1_checkHighDPSVideos() {
  console.log('\n📊 STEP 1: Check for high-DPS videos in database\n');

  // Check dps_calculations table
  const { data: calcs, error: calcError } = await supabase
    .from('dps_calculations')
    .select('video_id, viral_score, classification')
    .gte('viral_score', 70)
    .order('viral_score', { ascending: false })
    .limit(20);

  if (calcError) {
    console.error('❌ Error querying dps_calculations:', calcError.message);
    return { count: 0, videos: [] };
  }

  console.log(`✅ Found ${calcs?.length || 0} calculations with viral_score >= 70\n`);

  if (calcs && calcs.length > 0) {
    console.log('Top scores:');
    calcs.slice(0, 5).forEach((c, i) => {
      console.log(`  ${i + 1}. Video ${c.video_id}: Score ${c.viral_score} (${c.classification})`);
    });
    console.log('');
  }

  // Now check if these videos have transcripts
  if (calcs && calcs.length > 0) {
    const videoIds = calcs.map(c => c.video_id);
    const { data: videos, error: videoError } = await supabase
      .from('scraped_videos')
      .select('video_id, title, transcript, platform')
      .in('video_id', videoIds);

    if (videoError) {
      console.error('❌ Error fetching videos:', videoError.message);
      return { count: 0, videos: [] };
    }

    const withTranscripts = videos?.filter(v => v.transcript) || [];
    console.log(`📝 Videos with transcripts: ${withTranscripts.length}/${videos?.length || 0}\n`);

    if (withTranscripts.length > 0) {
      console.log('Sample:');
      withTranscripts.slice(0, 3).forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.video_id}: ${v.title?.substring(0, 50) || 'No title'}...`);
        console.log(`     Transcript length: ${v.transcript?.length || 0} chars`);
      });
      console.log('');
    }

    return { count: withTranscripts.length, videos: withTranscripts };
  }

  return { count: 0, videos: [] };
}

async function step2_checkEnvironment() {
  console.log('\n🔑 STEP 2: Check environment variables\n');

  const checks = {
    'OPENAI_API_KEY': !!process.env.OPENAI_API_KEY,
    'NEXT_PUBLIC_SUPABASE_URL': !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    'SUPABASE_SERVICE_KEY': !!process.env.SUPABASE_SERVICE_KEY,
  };

  Object.entries(checks).forEach(([key, exists]) => {
    console.log(`  ${exists ? '✅' : '❌'} ${key}: ${exists ? 'SET' : 'MISSING'}`);
  });

  if (!checks.OPENAI_API_KEY) {
    console.log('\n⚠️  WARNING: OPENAI_API_KEY not found - pattern extraction will fail!');
  }

  console.log('');
}

async function step3_testAPICall() {
  console.log('\n🚀 STEP 3: Call pattern extraction API with minimal DPS threshold\n');

  const requestBody = {
    niche: 'personal-finance',
    minDPSScore: 1, // Very low threshold to catch any videos
    dateRange: '365d',
    limit: 50,
  };

  console.log('Request:');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('\nCalling API...\n');

  const startTime = Date.now();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const duration = Date.now() - startTime;
    const responseText = await response.text();

    console.log(`Response status: ${response.status} (${duration}ms)\n`);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse response as JSON:');
      console.log(responseText.substring(0, 500));
      return null;
    }

    console.log('📋 API Response:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');

    if (result.success) {
      console.log(`✅ Success: ${result.totalVideosAnalyzed} videos analyzed`);
      console.log(`   Patterns extracted: ${result.patterns?.length || 0}`);
      console.log(`   LLM calls: ${result.llmCallsCount}`);
      console.log(`   LLM cost: $${result.llmCostUsd?.toFixed(4) || '0.00'}`);
      console.log(`   Processing time: ${result.processingTimeMs}ms`);

      if (result.patterns && result.patterns.length > 0) {
        console.log('\n🎯 Extracted Patterns:');
        result.patterns.forEach((p, i) => {
          console.log(`  ${i + 1}. [${p.pattern_type}] ${p.pattern_description}`);
          console.log(`     Success rate: ${(p.success_rate * 100).toFixed(1)}% | Avg DPS: ${p.avg_dps_score}`);
        });
      }
    } else {
      console.log(`❌ API returned error: ${result.error}`);
      if (result.details) {
        console.log('Details:', result.details);
      }
    }

    return result;

  } catch (error) {
    console.error('❌ API call failed:', error.message);
    return null;
  }
}

async function step4_checkDatabasePatterns() {
  console.log('\n\n💾 STEP 4: Check patterns in database\n');

  const { data, error } = await supabase
    .from('viral_patterns')
    .select('*')
    .order('frequency_count', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error querying viral_patterns:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No patterns found in viral_patterns table');
    return;
  }

  console.log(`✅ Found ${data.length} patterns in database\n`);

  data.forEach((p, i) => {
    console.log(`${i + 1}. [${p.pattern_type}] ${p.pattern_description}`);
    console.log(`   Frequency: ${p.frequency_count} | Success rate: ${(p.success_rate * 100).toFixed(1)}%`);
    console.log(`   Avg DPS: ${p.avg_dps_score} | Niche: ${p.niche}`);
    console.log('');
  });
}

async function step5_checkExtractionJobs() {
  console.log('\n📋 STEP 5: Check extraction job history\n');

  const { data, error } = await supabase
    .from('pattern_extraction_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error querying jobs:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('ℹ️  No extraction jobs found');
    return;
  }

  console.log(`Found ${data.length} recent jobs:\n`);

  data.forEach((job, i) => {
    console.log(`${i + 1}. Job ${job.batch_id} - ${job.status.toUpperCase()}`);
    console.log(`   Niche: ${job.niche} | Min DPS: ${job.min_dps_score}`);
    console.log(`   Videos: ${job.total_videos_queried || 0} queried, ${job.videos_processed || 0} processed`);
    console.log(`   Patterns: ${job.patterns_extracted || 0} extracted, ${job.patterns_updated || 0} updated`);
    if (job.error_message) {
      console.log(`   ❌ Error: ${job.error_message}`);
    }
    console.log(`   Created: ${new Date(job.created_at).toLocaleString()}`);
    console.log('');
  });
}

async function main() {
  try {
    const videosResult = await step1_checkHighDPSVideos();
    await step2_checkEnvironment();

    if (videosResult.count === 0) {
      console.log('\n⚠️  No high-DPS videos with transcripts found.');
      console.log('   Cannot proceed with pattern extraction.');
      console.log('\n💡 Next steps:');
      console.log('   1. Ensure DPS calculation has been run');
      console.log('   2. Verify videos have transcripts');
      console.log('   3. Check if any videos scored >= 70');
      return;
    }

    const apiResult = await step3_testAPICall();
    await step4_checkDatabasePatterns();
    await step5_checkExtractionJobs();

    console.log('\n' + '=' .repeat(70));
    console.log('✅ DEBUG COMPLETE\n');

  } catch (error) {
    console.error('\n❌ Debug script failed:', error);
    process.exit(1);
  }
}

main();

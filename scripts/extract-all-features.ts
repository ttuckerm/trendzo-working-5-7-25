/**
 * Extract Features from All Videos with Transcripts
 *
 * This script:
 * 1. Queries ALL videos with transcripts from scraped_videos table
 * 2. Extracts 120 features from each video in batches
 * 3. Saves features to JSON file for analysis
 * 4. Prepares data for database storage
 *
 * Usage:
 * npx tsx scripts/extract-all-features.ts [options]
 *
 * Options:
 * --batch-size 50         Videos per batch (default: 50)
 * --max-concurrent 10     Concurrent extractions (default: 10)
 * --output features.json  Output file (default: extracted_features.json)
 * --min-dps 0             Minimum DPS score (default: 0 - all videos)
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import {
  extractFeaturesFromVideos,
  flattenFeatureVector,
  getFeatureNames,
} from '../src/lib/services/feature-extraction/feature-extraction-service';
import type {
  FeatureExtractionInput,
  VideoFeatureVector,
} from '../src/lib/services/feature-extraction/types';
import * as fs from 'fs';
import * as path from 'path';

// Get Supabase credentials directly from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse CLI arguments
const args = process.argv.slice(2);
const options: any = {
  batchSize: 50,
  maxConcurrent: 10,
  output: 'extracted_features.json',
  minDps: 0,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const key = arg.substring(2).replace('-', '');
    const value = args[i + 1];

    if (value && !value.startsWith('--')) {
      if (key === 'batchsize' || key === 'maxconcurrent' || key === 'mindps') {
        options[key === 'batchsize' ? 'batchSize' : key === 'maxconcurrent' ? 'maxConcurrent' : 'minDps'] = parseFloat(value);
      } else {
        options[key] = value;
      }
      i++;
    }
  }
}

interface ExtractedFeatureData {
  videoId: string;
  features: VideoFeatureVector;
  featureVector: number[];
  metadata: {
    dpsScore: number;
    viewsCount: number;
    engagementRate: number;
    creatorUsername: string;
    extractedAt: string;
  };
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     BATCH FEATURE EXTRACTION - ALL VIDEOS                  ║');
  console.log('║                                                            ║');
  console.log('║     Extract 120 features from all videos                  ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📋 Configuration:');
  console.log(`   Batch Size: ${options.batchSize} videos`);
  console.log(`   Max Concurrent: ${options.maxConcurrent}`);
  console.log(`   Output File: ${options.output}`);
  console.log(`   Min DPS Score: ${options.minDps}`);
  console.log('');

  const overallStartTime = Date.now();

  // Step 1: Count total videos with transcripts
  console.log('📊 Step 1: Counting videos with transcripts...');
  console.log(`   Filtering by: DPS >= ${options.minDps}`);

  const { count: totalCount, error: countError } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })
    .not('transcript_text', 'is', null)
    .gte('dps_score', options.minDps);

  if (countError) {
    console.error('❌ Error counting videos:', countError.message);
    console.error('   Full error:', countError);
    process.exit(1);
  }

  console.log(`✅ Found ${totalCount} videos with transcripts`);
  console.log('');

  if (!totalCount || totalCount === 0) {
    console.log('⚠️  No videos found. Exiting.');
    process.exit(0);
  }

  // Step 2: Query all videos with transcripts
  console.log('📥 Step 2: Querying all videos from database...');

  const { data: videos, error: queryError } = await supabase
    .from('scraped_videos')
    .select('*')
    .not('transcript_text', 'is', null)
    .gte('dps_score', options.minDps)
    .order('dps_score', { ascending: false });

  if (queryError) {
    console.error('❌ Error querying videos:', queryError.message);
    process.exit(1);
  }

  if (!videos || videos.length === 0) {
    console.log('⚠️  No videos found in database');
    process.exit(0);
  }

  console.log(`✅ Retrieved ${videos.length} videos`);
  console.log(`   DPS Range: ${Math.min(...videos.map(v => v.dps_score || 0)).toFixed(1)} - ${Math.max(...videos.map(v => v.dps_score || 0)).toFixed(1)}`);
  console.log(`   Avg DPS: ${(videos.reduce((sum, v) => sum + (v.dps_score || 0), 0) / videos.length).toFixed(1)}`);
  console.log('');

  // Step 3: Convert to FeatureExtractionInput format
  console.log('🔄 Step 3: Preparing videos for feature extraction...');

  const inputs: FeatureExtractionInput[] = videos.map(v => ({
    videoId: v.video_id,
    transcript: v.transcript_text || '',
    title: v.title || v.description || 'Untitled',
    description: v.description || '',
    caption: v.caption || '',
    hashtags: v.hashtags || [],
    location: v.location,
    videoDurationSeconds: v.video_duration,
    uploadedAt: v.create_time,
    viewsCount: v.views_count || 0,
    likesCount: v.likes_count || 0,
    commentsCount: v.comments_count || 0,
    sharesCount: v.shares_count || 0,
    savesCount: v.saves_count || 0,
    dpsScore: v.dps_score,
    creatorUsername: v.creator_username || 'unknown',
    creatorFollowerCount: v.creator_follower_count,
  }));

  console.log(`✅ Prepared ${inputs.length} videos`);
  console.log('');

  // Step 4: Extract features in batches
  console.log('🎯 Step 4: Extracting features from all videos...');
  console.log('');

  const allExtractedFeatures: ExtractedFeatureData[] = [];
  let totalProcessed = 0;

  // Process in batches to manage memory
  for (let i = 0; i < inputs.length; i += options.batchSize) {
    const batchNum = Math.floor(i / options.batchSize) + 1;
    const totalBatches = Math.ceil(inputs.length / options.batchSize);
    const batch = inputs.slice(i, i + options.batchSize);

    console.log(`\n┌─────────────────────────────────────────────────────────┐`);
    console.log(`│  BATCH ${batchNum}/${totalBatches} (${batch.length} videos)                              │`);
    console.log(`└─────────────────────────────────────────────────────────┘\n`);

    const batchStartTime = Date.now();

    const result = await extractFeaturesFromVideos(batch, undefined, {
      maxConcurrent: options.maxConcurrent,
      onProgress: (processed, total) => {
        // Progress is logged by the service
      },
    });

    const batchDuration = Date.now() - batchStartTime;

    // Process successful extractions
    for (const extractionResult of result.results) {
      if (extractionResult.success && extractionResult.features) {
        const features = extractionResult.features;
        const featureVector = flattenFeatureVector(features);

        allExtractedFeatures.push({
          videoId: features.videoId,
          features,
          featureVector,
          metadata: {
            dpsScore: features.historicalPerformance.dps_score,
            viewsCount: features.historicalPerformance.views_count,
            engagementRate: features.historicalPerformance.engagement_rate,
            creatorUsername: inputs.find(i => i.videoId === features.videoId)?.creatorUsername || 'unknown',
            extractedAt: features.extractedAt,
          },
        });
      }
    }

    totalProcessed += batch.length;

    console.log(`\n✅ Batch ${batchNum} Complete:`);
    console.log(`   Duration: ${(batchDuration / 1000).toFixed(1)}s`);
    console.log(`   Success: ${result.successfulExtractions}/${batch.length}`);
    console.log(`   Total Progress: ${totalProcessed}/${inputs.length} (${(totalProcessed / inputs.length * 100).toFixed(1)}%)`);
  }

  console.log('');

  // Step 5: Calculate statistics
  console.log('📊 Step 5: Calculating feature statistics...\n');

  const featureNames = getFeatureNames();
  const allFeatureVectors = allExtractedFeatures.map(f => f.featureVector);

  // Calculate statistics for each feature
  const featureStats: any = {};

  for (let i = 0; i < featureNames.length; i++) {
    const featureName = featureNames[i];
    const values = allFeatureVectors.map(v => v[i]);

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];

    featureStats[featureName] = {
      mean: parseFloat(mean.toFixed(4)),
      std: parseFloat(std.toFixed(4)),
      min: parseFloat(min.toFixed(4)),
      max: parseFloat(max.toFixed(4)),
      median: parseFloat(median.toFixed(4)),
    };
  }

  // Step 6: Save to JSON file
  console.log('💾 Step 6: Saving features to file...\n');

  const outputData = {
    metadata: {
      extractedAt: new Date().toISOString(),
      totalVideos: allExtractedFeatures.length,
      featureCount: featureNames.length,
      configuration: options,
    },
    featureNames,
    featureStats,
    features: allExtractedFeatures,
  };

  const outputPath = path.resolve(process.cwd(), options.output);
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

  console.log(`✅ Features saved to: ${outputPath}`);
  console.log(`   File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
  console.log('');

  // Step 7: Display summary statistics
  console.log('📈 Step 7: Feature Extraction Summary\n');

  const totalDuration = Date.now() - overallStartTime;
  const successRate = (allExtractedFeatures.length / inputs.length * 100).toFixed(1);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     ✅ FEATURE EXTRACTION COMPLETE!                        ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📊 Overall Statistics:');
  console.log(`   Total Videos Queried:       ${inputs.length}`);
  console.log(`   Successful Extractions:     ${allExtractedFeatures.length}`);
  console.log(`   Failed Extractions:         ${inputs.length - allExtractedFeatures.length}`);
  console.log(`   Success Rate:               ${successRate}%`);
  console.log(`   Features Per Video:         ${featureNames.length}`);
  console.log(`   Total Duration:             ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`   Avg Time Per Video:         ${(totalDuration / inputs.length).toFixed(0)}ms`);
  console.log('');

  // Show interesting feature statistics
  console.log('📋 Interesting Feature Statistics:\n');

  const interestingFeatures = [
    'word_count',
    'lexical_diversity',
    'sentiment_polarity',
    'curiosity_word_count',
    'call_to_action_count',
    'engagement_rate',
    'dps_score',
  ];

  for (const featureName of interestingFeatures) {
    if (featureStats[featureName]) {
      const stats = featureStats[featureName];
      console.log(`${featureName}:`);
      console.log(`  Mean: ${stats.mean.toFixed(2)}, Std: ${stats.std.toFixed(2)}, Range: [${stats.min.toFixed(2)}, ${stats.max.toFixed(2)}]`);
    }
  }

  console.log('');
  console.log('💡 Next Steps:');
  console.log('   1. Review extracted_features.json');
  console.log('   2. Create database table (video_features)');
  console.log('   3. Import features into database');
  console.log('   4. Train ML model using features');
  console.log('   5. Evaluate model performance\n');

  // Show DPS distribution
  console.log('📊 DPS Score Distribution:\n');
  const dpsScores = allExtractedFeatures.map(f => f.metadata.dpsScore);
  const dpsBuckets = {
    '90-100': dpsScores.filter(s => s >= 90).length,
    '80-89': dpsScores.filter(s => s >= 80 && s < 90).length,
    '70-79': dpsScores.filter(s => s >= 70 && s < 80).length,
    '60-69': dpsScores.filter(s => s >= 60 && s < 70).length,
    '50-59': dpsScores.filter(s => s >= 50 && s < 60).length,
    '<50': dpsScores.filter(s => s < 50).length,
  };

  for (const [range, count] of Object.entries(dpsBuckets)) {
    const pct = (count / dpsScores.length * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(count / dpsScores.length * 50));
    console.log(`  ${range}: ${count.toString().padStart(3)} (${pct.padStart(5)}%) ${bar}`);
  }

  console.log('');
}

main().catch(err => {
  console.error('\n❌ Feature extraction failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});

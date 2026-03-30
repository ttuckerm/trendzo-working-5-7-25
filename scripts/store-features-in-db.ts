/**
 * Store Extracted Features in Database
 *
 * This script:
 * 1. Reads extracted_features.json
 * 2. Creates video_features table if it doesn't exist
 * 3. Inserts all features into the database
 *
 * Usage:
 * npx tsx scripts/store-features-in-db.ts [input-file]
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Get environment variables directly
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const inputFile = process.argv[2] || 'extracted_features.json';

async function createTableIfNotExists() {
  console.log('📊 Checking if video_features table exists...\n');

  // Try to query the table - if it fails, create it
  const { error } = await supabase
    .from('video_features')
    .select('count')
    .limit(1);

  if (error && error.message.includes('relation "video_features" does not exist')) {
    console.log('⚠️  Table does not exist. Creating video_features table...\n');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS video_features (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        video_id TEXT NOT NULL REFERENCES scraped_videos(video_id) ON DELETE CASCADE,
        extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        feature_count INTEGER NOT NULL,
        features JSONB NOT NULL,
        feature_vector FLOAT8[] NOT NULL,
        dps_score FLOAT8,
        engagement_rate FLOAT8,
        word_count INTEGER,
        sentiment_polarity FLOAT8,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(video_id)
      );

      CREATE INDEX IF NOT EXISTS idx_video_features_video_id ON video_features(video_id);
      CREATE INDEX IF NOT EXISTS idx_video_features_extracted_at ON video_features(extracted_at);
      CREATE INDEX IF NOT EXISTS idx_video_features_dps_score ON video_features(dps_score DESC);
      CREATE INDEX IF NOT EXISTS idx_video_features_features_gin ON video_features USING GIN (features);
    `;

    // Execute via RPC (Supabase SQL editor function)
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL }) as any;

    if (createError) {
      console.log('⚠️  Could not create table via RPC. Table might already exist or need manual creation.');
      console.log('   Please run the migration file manually or continue if table exists.\n');
    } else {
      console.log('✅ Table created successfully\n');
    }
  } else if (error) {
    console.log('⚠️  Error checking table:', error.message);
    console.log('   Assuming table exists and continuing...\n');
  } else {
    console.log('✅ Table already exists\n');
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     STORE FEATURES IN DATABASE                             ║');
  console.log('║                                                            ║');
  console.log('║     Import extracted features to video_features table     ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Step 1: Read JSON file
  console.log('📥 Step 1: Reading extracted features from file...\n');

  const inputPath = path.resolve(process.cwd(), inputFile);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(inputPath, 'utf-8');
  const data = JSON.parse(fileContent);

  console.log(`✅ Loaded features from: ${inputPath}`);
  console.log(`   Total Videos: ${data.features.length}`);
  console.log(`   Features Per Video: ${data.featureCount}`);
  console.log('');

  // Step 2: Create table if needed
  await createTableIfNotExists();

  // Step 3: Prepare data for insertion
  console.log('🔄 Step 3: Preparing data for database insertion...\n');

  const records = data.features.map((item: any) => ({
    video_id: item.videoId,
    extracted_at: item.features.extractedAt,
    feature_count: data.metadata.featureCount || 119, // Use metadata.featureCount
    features: item.features,
    feature_vector: item.featureVector,
    dps_score: item.metadata.dpsScore,
    engagement_rate: item.metadata.engagementRate,
    word_count: item.features.basicTextMetrics?.word_count || null,
    sentiment_polarity: item.features.emotionalPowerWords?.sentiment_polarity || null,
  }));

  console.log(`✅ Prepared ${records.length} records\n`);

  // Step 4: Insert in batches
  console.log('💾 Step 4: Inserting features into database...\n');

  const batchSize = 100;
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(records.length / batchSize);

    console.log(`   Batch ${batchNum}/${totalBatches}: Processing ${batch.length} records...`);

    const { data: insertedData, error } = await supabase
      .from('video_features')
      .upsert(batch, {
        onConflict: 'video_id',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) {
      console.error(`   ❌ Error inserting batch ${batchNum}:`, error.message);
      failed += batch.length;
    } else {
      const count = insertedData?.length || batch.length;
      inserted += count;
      console.log(`   ✅ Batch ${batchNum}: ${count} records inserted/updated`);
    }
  }

  console.log('');

  // Step 5: Verify insertion
  console.log('📊 Step 5: Verifying database insertion...\n');

  const { count, error: countError } = await supabase
    .from('video_features')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error counting records:', countError.message);
  } else {
    console.log(`✅ Total records in video_features table: ${count}`);
  }

  console.log('');

  // Step 6: Summary
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     ✅ DATABASE STORAGE COMPLETE!                          ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📊 Storage Summary:');
  console.log(`   Records Processed:  ${records.length}`);
  console.log(`   Successfully Stored: ${inserted}`);
  console.log(`   Failed:             ${failed}`);
  console.log(`   Success Rate:       ${(inserted / records.length * 100).toFixed(1)}%`);
  console.log('');
  console.log('💡 Next Steps:');
  console.log('   1. Query features: SELECT * FROM video_features LIMIT 10;');
  console.log('   2. Analyze feature distributions');
  console.log('   3. Train ML model using feature_vector column');
  console.log('   4. Evaluate model performance\n');

  // Show sample query
  console.log('📋 Sample Query:\n');
  console.log('   -- Get features for high-DPS videos');
  console.log('   SELECT video_id, dps_score, word_count, sentiment_polarity');
  console.log('   FROM video_features');
  console.log('   WHERE dps_score > 70');
  console.log('   ORDER BY dps_score DESC');
  console.log('   LIMIT 10;\n');

  console.log('   -- Get feature vector for ML training');
  console.log('   SELECT video_id, feature_vector, dps_score');
  console.log('   FROM video_features');
  console.log('   WHERE dps_score IS NOT NULL;\n');
}

main().catch(err => {
  console.error('\n❌ Database storage failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});

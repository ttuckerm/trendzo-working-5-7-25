/**
 * Simple Feature Storage Script
 *
 * Stores features in video_features table with minimal schema
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '../src/lib/env';
import * as fs from 'fs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('\n📥 Loading extracted features...\n');

  const fileContent = fs.readFileSync('extracted_features.json', 'utf-8');
  const data = JSON.parse(fileContent);

  console.log(`✅ Loaded ${data.features.length} feature vectors\n`);

  console.log('💾 Inserting features into database...\n');

  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < data.features.length; i += batchSize) {
    const batch = data.features.slice(i, i + batchSize);

    const records = batch.map((item: any) => ({
      video_id: item.videoId,
      features: item.features,
      feature_vector: item.featureVector,
    }));

    const { data: result, error } = await supabase
      .from('video_features')
      .upsert(records, { onConflict: 'video_id' })
      .select('id');

    if (error) {
      console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
    } else {
      inserted += result?.length || batch.length;
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: ${result?.length || batch.length} records`);
    }
  }

  console.log(`\n✅ Inserted ${inserted} feature vectors\n`);

  // Verify
  const { count } = await supabase
    .from('video_features')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total records in database: ${count}\n`);
}

main().catch(console.error);

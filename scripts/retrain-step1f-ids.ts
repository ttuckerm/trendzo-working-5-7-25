#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

async function main() {
  // Sample IDs from each table
  const { data: tf } = await supabase.from('training_features').select('video_id').limit(5);
  const { data: sv } = await supabase.from('scraped_videos').select('video_id').limit(5);
  const { data: pr } = await supabase.from('prediction_runs').select('video_id').not('actual_dps', 'is', null).limit(5);

  console.log('training_features sample IDs:', tf?.map(r => r.video_id));
  console.log('scraped_videos sample IDs:', sv?.map(r => r.video_id));
  console.log('prediction_runs sample video_ids:', pr?.map(r => r.video_id));

  // Check if training_features has a dps_score column directly
  const { data: tfFull } = await supabase.from('training_features').select('*').limit(1);
  if (tfFull && tfFull.length > 0) {
    const cols = Object.keys(tfFull[0]);
    console.log(`\ntraining_features columns (${cols.length}):`, cols.join(', '));
    // Check for any DPS-related columns
    const dpsCols = cols.filter(c => c.includes('dps') || c.includes('score') || c.includes('target') || c.includes('actual'));
    console.log('DPS-related columns:', dpsCols);
  }

  // Check scraped_videos columns
  const { data: svFull } = await supabase.from('scraped_videos').select('*').limit(1);
  if (svFull && svFull.length > 0) {
    const cols = Object.keys(svFull[0]);
    console.log(`\nscraped_videos columns (${cols.length}):`, cols.join(', '));
  }

  // Try: do training_features IDs appear in scraped_videos?
  if (tf && tf.length > 0 && sv && sv.length > 0) {
    const tfIds = tf.map(r => r.video_id);
    const { data: crossMatch } = await supabase
      .from('scraped_videos')
      .select('video_id')
      .in('video_id', tfIds);
    console.log(`\nCross-match training_features[0:5] → scraped_videos: ${crossMatch?.length || 0} matches`);
    if (crossMatch && crossMatch.length > 0) {
      console.log('Matched IDs:', crossMatch.map(r => r.video_id));
    }
  }

  // Check training_features for DPS target data stored directly
  if (tfFull && tfFull.length > 0) {
    const row = tfFull[0] as any;
    // Check if there's a target/dps column
    const potentialTargets = ['dps_score', 'actual_dps', 'target_dps', 'dps_display_score', 'target_score'];
    for (const col of potentialTargets) {
      if (row[col] !== undefined) {
        console.log(`training_features.${col}: ${row[col]}`);
      }
    }
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

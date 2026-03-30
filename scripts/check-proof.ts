import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data, error } = await supabase
    .from('validation_predictions')
    .select('video_id, predicted_dps, actual_dps, locked_at, actuals_updated_at')
    .not('actuals_updated_at', 'is', null)
    .order('locked_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('NO PROOF: No predictions with actual results found.');
    console.log('This means: Either no predictions were made, or actuals were never fetched.');
    process.exit(0);
  }

  console.log(`Found ${data.length} predictions with actual results:\n`);

  for (const row of data) {
    const locked = new Date(row.locked_at);
    const updated = row.actuals_updated_at ? new Date(row.actuals_updated_at) : null;
    const hoursGap = updated ? (updated.getTime() - locked.getTime()) / (1000 * 60 * 60) : 0;

    console.log(`Video: ${row.video_id}`);
    console.log(`  Predicted DPS: ${row.predicted_dps}`);
    console.log(`  Actual DPS: ${row.actual_dps || 'NULL'}`);
    console.log(`  Locked at: ${locked.toISOString()}`);
    console.log(`  Actuals updated: ${updated?.toISOString() || 'NULL'}`);
    console.log(`  Time gap: ${hoursGap.toFixed(1)} hours`);

    if (hoursGap >= 12) {
      console.log(`  ✓ PROOF: Prediction made ${hoursGap.toFixed(1)} hours before actual results`);
    } else if (hoursGap > 0) {
      console.log(`  ⚠ WEAK: Only ${hoursGap.toFixed(1)} hours gap (could be retroactive)`);
    } else {
      console.log(`  ✗ NO PROOF: Same timestamp (definitely retroactive)`);
    }
    console.log('');
  }
})();

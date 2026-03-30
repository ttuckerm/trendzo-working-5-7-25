/**
 * Mark historical DPS v2 rows that were scored without follower count.
 *
 * These rows have dps_v2_display_score set but actual_follower_count is NULL/0,
 * meaning view_to_follower_ratio (weight 0.12 in Tier 1) was silently skipped.
 *
 * DRY RUN by default — set DRY_RUN=false to execute.
 *
 * Usage:
 *   npx tsx scripts/mark-contaminated-dps-rows.ts
 *   DRY_RUN=false npx tsx scripts/mark-contaminated-dps-rows.ts
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const DRY_RUN = process.env.DRY_RUN !== 'false';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

async function main() {
  console.log(`\n=== Mark Contaminated DPS Rows ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (set DRY_RUN=false to execute)' : 'LIVE — will update rows'}\n`);

  // Find all prediction_runs where:
  // - dps_v2_display_score IS NOT NULL (has a DPS v2 score)
  // - actual_follower_count IS NULL OR actual_follower_count = 0 (no follower data)
  const { data: contaminated, error } = await supabase
    .from('prediction_runs')
    .select('id, video_id, actual_follower_count, dps_v2_display_score, actual_tier, dps_formula_version')
    .not('dps_v2_display_score', 'is', null)
    .or('actual_follower_count.is.null,actual_follower_count.eq.0');

  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }

  const rows = contaminated || [];
  console.log(`Found ${rows.length} contaminated rows (scored without follower count)\n`);

  if (rows.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  // Show sample of 5 rows
  console.log('Sample rows:');
  const sample = rows.slice(0, 5);
  for (const row of sample) {
    console.log(
      `  ${row.id} | video=${row.video_id} | ` +
      `display_score=${row.dps_v2_display_score} | tier=${row.actual_tier} | ` +
      `follower_count=${row.actual_follower_count ?? 'NULL'}`,
    );
  }
  if (rows.length > 5) {
    console.log(`  ... and ${rows.length - 5} more\n`);
  }

  if (DRY_RUN) {
    console.log('\nDRY RUN complete. No rows were updated.');
    console.log(`Run with DRY_RUN=false to mark ${rows.length} rows as dps_v2_incomplete=true.`);
    return;
  }

  // Mark all contaminated rows
  const ids = rows.map(r => r.id);
  const BATCH_SIZE = 100;
  let updated = 0;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const { error: updateErr } = await supabase
      .from('prediction_runs')
      .update({
        dps_v2_incomplete: true,
        dps_v2_incomplete_reason: 'Historical: scored without follower count',
      })
      .in('id', batch);

    if (updateErr) {
      console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, updateErr.message);
    } else {
      updated += batch.length;
    }
  }

  console.log(`\nDone. Updated ${updated} of ${rows.length} rows.`);
  console.log('Note: dps_v2_display_score was NOT nulled out — old scores kept for reference.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

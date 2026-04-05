#!/usr/bin/env npx tsx
/**
 * Step 1e: Audit training_features + scraped_videos (the ACTUAL trainable data)
 */

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
  console.log('━━━ TRAINING DATA AUDIT ━━━\n');

  // 1. Get all training_features
  const { data: tfAll, error: tfErr } = await supabase
    .from('training_features')
    .select('video_id')
    .limit(10000);

  if (tfErr) { console.error('training_features error:', tfErr.message); return; }
  console.log(`training_features total: ${tfAll!.length}`);

  // 2. Get scraped_videos with DPS scores (batch to avoid limits)
  const tfVideoIds = tfAll!.map((r: any) => r.video_id);

  // Query in batches of 500
  const batchSize = 500;
  const allScraped: any[] = [];
  for (let i = 0; i < tfVideoIds.length; i += batchSize) {
    const batch = tfVideoIds.slice(i, i + batchSize);
    const { data } = await supabase
      .from('scraped_videos')
      .select('video_id, dps_score, niche, views, likes, shares, comments, saves, follower_count, caption')
      .in('video_id', batch);
    if (data) allScraped.push(...data);
  }

  console.log(`scraped_videos matched: ${allScraped.length}/${tfAll!.length}`);

  // 3. Filter to those with DPS scores
  const withDps = allScraped.filter((r: any) => r.dps_score != null);
  console.log(`  With dps_score: ${withDps.length}`);

  // 4. Analyze DPS scores
  const dpsScores = withDps.map((r: any) => Number(r.dps_score)).sort((a, b) => a - b);
  console.log(`\n  DPS score analysis:`);
  console.log(`    Min:    ${dpsScores[0]?.toFixed(2)}`);
  console.log(`    Q1:     ${dpsScores[Math.floor(dpsScores.length * 0.25)]?.toFixed(2)}`);
  console.log(`    Median: ${dpsScores[Math.floor(dpsScores.length * 0.5)]?.toFixed(2)}`);
  console.log(`    Q3:     ${dpsScores[Math.floor(dpsScores.length * 0.75)]?.toFixed(2)}`);
  console.log(`    Max:    ${dpsScores[dpsScores.length - 1]?.toFixed(2)}`);
  console.log(`    Mean:   ${(dpsScores.reduce((s, v) => s + v, 0) / dpsScores.length).toFixed(2)}`);

  // Check scale
  const negative = dpsScores.filter(s => s < 0).length;
  const below10 = dpsScores.filter(s => s < 10).length;
  const above90 = dpsScores.filter(s => s > 90).length;
  console.log(`    Negative: ${negative}, <10: ${below10}, >90: ${above90}`);
  console.log(`    Scale: ${negative > 0 ? 'Z-SCORES' : 'DISPLAY SCORES (0-100)'}`);

  // 5. Niche distribution
  const niches = new Map<string, number>();
  for (const r of withDps) {
    niches.set(r.niche || 'unknown', (niches.get(r.niche || 'unknown') || 0) + 1);
  }
  console.log(`\n  Niche distribution:`);
  for (const [n, c] of [...niches.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${n}: ${c}`);
  }

  // 6. Follower count
  const withFollowers = withDps.filter((r: any) => r.follower_count > 0);
  console.log(`\n  With follower_count: ${withFollowers.length}/${withDps.length}`);

  // 7. Compare with v10 training set
  console.log(`\n━━━ COMPARISON WITH v10 ━━━`);
  console.log(`  v10 training rows: 863 (side-hustles only)`);
  console.log(`  v10 target range: 11.58 - 91.44 (display scores)`);
  console.log(`  Available now: ${withDps.length} rows`);
  console.log(`  Delta: +${withDps.length - 863} rows (${((withDps.length / 863 - 1) * 100).toFixed(0)}% more)`);

  // 8. PREDICTION_RUNS evaluation set (separate from training)
  console.log('\n━━━ EVALUATION SET (prediction_runs) ━━━');
  const { data: evalRuns } = await supabase
    .from('prediction_runs')
    .select('id, predicted_dps_7d, dps_v2_display_score, actual_tier, dps_v2_incomplete')
    .not('dps_v2_display_score', 'is', null)
    .neq('dps_v2_incomplete', true);

  if (evalRuns) {
    const predicted = evalRuns.map((r: any) => Number(r.predicted_dps_7d)).filter(v => !isNaN(v));
    const actual = evalRuns.map((r: any) => Number(r.dps_v2_display_score)).filter(v => !isNaN(v));

    if (predicted.length >= 3 && actual.length >= 3) {
      // Compute Spearman on existing predictions
      const n = Math.min(predicted.length, actual.length);
      const { rho } = spearmanCorrelation(predicted.slice(0, n), actual.slice(0, n));
      console.log(`  Rows with both predicted + actual display score: ${n}`);
      console.log(`  Current v10 Spearman ρ (on these rows): ${rho.toFixed(4)}`);

      // MAE
      let maeSum = 0;
      for (let i = 0; i < n; i++) {
        maeSum += Math.abs(predicted[i] - actual[i]);
      }
      console.log(`  Current v10 MAE: ${(maeSum / n).toFixed(2)}`);
    }
  }

  console.log('\n✅ Data audit complete.');
}

function spearmanCorrelation(x: number[], y: number[]): { rho: number } {
  const n = x.length;
  if (n < 3) return { rho: 0 };

  const rx = assignRanks(x);
  const ry = assignRanks(y);

  const meanRx = rx.reduce((s, v) => s + v, 0) / n;
  const meanRy = ry.reduce((s, v) => s + v, 0) / n;

  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = rx[i] - meanRx;
    const dy = ry[i] - meanRy;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  return { rho: denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : 0 };
}

function assignRanks(arr: number[]): number[] {
  const n = arr.length;
  const indexed = arr.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);

  const ranks = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n - 1 && indexed[j + 1].v === indexed[i].v) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[indexed[k].i] = avgRank;
    i = j + 1;
  }
  return ranks;
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

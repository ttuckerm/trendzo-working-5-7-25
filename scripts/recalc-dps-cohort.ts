/**
 * One-time script: Recalculate DPS for the 16 clean labeled prediction_runs
 * against the expanded scraped_videos cohort (2,670 videos).
 *
 * Usage: npx tsx scripts/recalc-dps-cohort.ts
 */

import { createClient } from '@supabase/supabase-js';
import { computeDpsV2FromRows, type ScrapedVideoRow, type DpsV2RawMetrics } from '../src/lib/training/dps-v2';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

async function fetchCohort(niche: string): Promise<ScrapedVideoRow[]> {
  const cohort: ScrapedVideoRow[] = [];
  let offset = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('scraped_videos')
      .select('views_count, likes_count, comments_count, shares_count, saves_count, creator_followers_count')
      .eq('niche', niche)
      .not('views_count', 'is', null)
      .gt('views_count', 0)
      .range(offset, offset + PAGE - 1);

    if (error || !data || data.length === 0) break;

    for (const r of data as any[]) {
      cohort.push({
        views: r.views_count ?? 0,
        likes: r.likes_count ?? 0,
        comments: r.comments_count ?? 0,
        shares: r.shares_count ?? 0,
        saves: r.saves_count ?? 0,
        follower_count: r.creator_followers_count ?? 0,
      });
    }

    if (data.length < PAGE) break;
    offset += PAGE;
  }

  return cohort;
}

async function main() {
  // 1. Fetch the 16 clean labeled rows
  const { data: rows, error } = await supabase
    .from('prediction_runs')
    .select('id, video_id, actual_views, actual_likes, actual_comments, actual_shares, actual_saves, actual_follower_count, actual_hours_since_post, dps_v2_display_score, actual_tier, dps_cohort_sample_size, predicted_dps_7d, prediction_range_low, prediction_range_high, labeling_mode, dps_label_trust, dps_training_weight')
    .gt('actual_follower_count', 0)
    .not('dps_v2_display_score', 'is', null)
    .order('dps_v2_display_score', { ascending: false });

  if (error || !rows) {
    console.error('Failed to fetch rows:', error);
    process.exit(1);
  }

  console.log(`Found ${rows.length} clean labeled rows`);

  // 2. Fetch expanded cohort
  const cohort = await fetchCohort('side-hustles');
  console.log(`Cohort size: ${cohort.length} videos\n`);

  // 3. Recalculate and update
  const results: Array<{
    id: string;
    oldDps: number;
    newDps: number;
    delta: number;
    oldTier: string;
    newTier: string;
    oldCohort: number;
  }> = [];

  for (const row of rows as any[]) {
    const rawMetrics: DpsV2RawMetrics = {
      views: row.actual_views,
      likes: row.actual_likes,
      comments: row.actual_comments,
      shares: row.actual_shares,
      saves: row.actual_saves,
      follower_count: row.actual_follower_count ?? 0,
      hours_since_post: row.actual_hours_since_post ?? 0,
    };

    const v2Result = computeDpsV2FromRows(rawMetrics, cohort);

    const oldDps = Number(row.dps_v2_display_score);
    const newDps = v2Result.display_score ?? 0;
    const oldTier = row.actual_tier || 'unknown';
    const newTier = v2Result.tier;

    results.push({
      id: row.id,
      oldDps,
      newDps,
      delta: Math.round((newDps - oldDps) * 10) / 10,
      oldTier,
      newTier,
      oldCohort: row.dps_cohort_sample_size ?? 0,
    });

    // LIVE UPDATE — write new DPS to prediction_runs
    const { error: updateErr } = await supabase
      .from('prediction_runs')
      .update({
        actual_dps: v2Result.score,
        actual_tier: v2Result.tier,
        dps_v2_display_score: v2Result.display_score,
        dps_v2_breakdown: v2Result.breakdown,
        dps_cohort_sample_size: cohort.length,
        dps_formula_version: '2.1.0',
        actuals_entered_at: new Date().toISOString(),
        // Recompute prediction error against new DPS
        ...(row.predicted_dps_7d != null && v2Result.display_score != null ? {
          prediction_error: Math.round((v2Result.display_score - row.predicted_dps_7d) * 100) / 100,
          prediction_error_pct: row.predicted_dps_7d > 0
            ? Math.round(((v2Result.display_score - row.predicted_dps_7d) / row.predicted_dps_7d) * 10000) / 100
            : 0,
          within_range: row.prediction_range_low != null && row.prediction_range_high != null
            ? v2Result.display_score >= row.prediction_range_low && v2Result.display_score <= row.prediction_range_high
            : null,
        } : {}),
        // Update signal fields from breakdown
        ...(v2Result.breakdown ? {
          actual_reach_score: v2Result.breakdown.signals.reach_score,
          actual_view_percentile_within_cohort: v2Result.breakdown.signals.view_percentile_within_cohort,
          dps_v2_weight_tier: v2Result.breakdown.weight_tier,
          dps_signal_confidence: v2Result.breakdown.confidence.level === 'high' ? 1.0
            : v2Result.breakdown.confidence.level === 'medium' ? 0.6 : 0.3,
          dps_signal_availability: v2Result.breakdown.signal_availability,
          dps_weight_redistribution: v2Result.breakdown.weight_was_redistributed
            ? v2Result.breakdown.effective_weights : null,
          dps_threshold_version: v2Result.breakdown.threshold_version,
          actual_completion_rate: v2Result.breakdown.signals.completion_rate,
          actual_share_rate: v2Result.breakdown.signals.share_rate,
          actual_save_rate: v2Result.breakdown.signals.save_rate,
          actual_velocity_score: v2Result.breakdown.signals.velocity_score,
          actual_view_to_follower_ratio: v2Result.breakdown.signals.view_to_follower_ratio,
          actual_comment_rate: v2Result.breakdown.signals.comment_rate,
        } : {}),
      })
      .eq('id', row.id);

    if (updateErr) {
      console.error(`  ERROR updating ${row.id}: ${updateErr.message}`);
    }
  }

  // 4. Print comparison table
  console.log('| Video ID | Old DPS | New DPS | Delta | Old Tier | New Tier | Old Cohort |');
  console.log('|----------|---------|---------|-------|----------|----------|------------|');

  for (const r of results) {
    const idShort = r.id.substring(0, 8);
    const deltaStr = r.delta >= 0 ? `+${r.delta.toFixed(1)}` : r.delta.toFixed(1);
    const tierChanged = r.oldTier !== r.newTier ? ' *' : '';
    console.log(
      `| ${idShort} | ${r.oldDps.toFixed(1).padStart(7)} | ${r.newDps.toFixed(1).padStart(7)} | ${deltaStr.padStart(5)} | ${r.oldTier.padEnd(8)} | ${r.newTier.padEnd(8)}${tierChanged} | ${String(r.oldCohort).padStart(10)} |`
    );
  }

  // 5. Summary stats
  const wentUp = results.filter(r => r.delta > 0).length;
  const wentDown = results.filter(r => r.delta < 0).length;
  const stayed = results.filter(r => r.delta === 0).length;
  const newScores = results.map(r => r.newDps);
  const oldAt100 = results.filter(r => r.oldDps === 100).length;
  const newAt100 = results.filter(r => r.newDps === 100).length;
  const tierChanges = results.filter(r => r.oldTier !== r.newTier).length;

  console.log('\n--- Summary ---');
  console.log(`Scores went UP:   ${wentUp}`);
  console.log(`Scores went DOWN: ${wentDown}`);
  console.log(`Scores unchanged: ${stayed}`);
  console.log(`New score range:  ${Math.min(...newScores).toFixed(1)} – ${Math.max(...newScores).toFixed(1)}`);
  console.log(`Old 100.0 count:  ${oldAt100}`);
  console.log(`New 100.0 count:  ${newAt100} ${newAt100 < oldAt100 ? '(ceiling saturation IMPROVED)' : newAt100 === oldAt100 ? '(unchanged)' : '(worse)'}`);
  console.log(`Tier changes:     ${tierChanges}`);
  console.log(`Cohort:           old=${results[0]?.oldCohort ?? '?'} → new=${cohort.length}`);
}

main().catch(console.error);

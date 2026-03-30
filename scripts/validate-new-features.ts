/**
 * Validation script for new pre-publication features (2026-03-18)
 *
 * Generates docs/FEATURE_VALIDATION_REPORT.md with:
 * - Non-null counts, min, max, mean, median per feature
 * - Spearman r against dps_score
 * - Spearman r against creator_deviation (video dps - creator mean dps)
 * - Retrain recommendation
 *
 * Usage: npx tsx scripts/validate-new-features.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const NEW_FEATURES = [
  'specificity_score',
  'instructional_density',
  'has_step_structure',
  'hedge_word_density',
  'vocal_confidence_composite',
  'visual_proof_ratio',
  'talking_head_ratio',
  'visual_to_verbal_ratio',
  'text_overlay_density',
] as const;

// ============================================================================
// Spearman Rank Correlation
// ============================================================================

function spearmanR(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0;
  const n = x.length;

  function rankArray(arr: number[]): number[] {
    const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(n);
    let i = 0;
    while (i < n) {
      let j = i;
      while (j < n - 1 && sorted[j + 1].v === sorted[j].v) j++;
      const avgRank = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) ranks[sorted[k].i] = avgRank;
      i = j + 1;
    }
    return ranks;
  }

  const rx = rankArray(x);
  const ry = rankArray(y);

  let sumD2 = 0;
  for (let i = 0; i < n; i++) {
    const d = rx[i] - ry[i];
    sumD2 += d * d;
  }

  return 1 - (6 * sumD2) / (n * (n * n - 1));
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Fetching training_features + scraped_videos...');

  // Fetch training features
  const { data: features, error: fErr } = await supabase
    .from('training_features')
    .select(`video_id, ${NEW_FEATURES.join(', ')}`);

  if (fErr) { console.error(fErr.message); process.exit(1); }

  // Fetch dps_score and creator info for deviation calculation
  const { data: videos, error: vErr } = await supabase
    .from('scraped_videos')
    .select('video_id, dps_score, creator_username');

  if (vErr) { console.error(vErr.message); process.exit(1); }

  const dpsMap = new Map<string, number>();
  const creatorVideos = new Map<string, { videoId: string; dps: number }[]>();

  for (const v of (videos || [])) {
    if (v.dps_score != null) {
      dpsMap.set(v.video_id, v.dps_score);
      const cid = v.creator_username || 'unknown';
      if (!creatorVideos.has(cid)) creatorVideos.set(cid, []);
      creatorVideos.get(cid)!.push({ videoId: v.video_id, dps: v.dps_score });
    }
  }

  // Compute creator mean DPS
  const creatorMeanDps = new Map<string, number>();
  for (const [cid, vids] of creatorVideos) {
    const avg = vids.reduce((s, v) => s + v.dps, 0) / vids.length;
    creatorMeanDps.set(cid, avg);
  }

  // Build deviation map: video_id -> (video_dps - creator_mean_dps)
  const deviationMap = new Map<string, number>();
  for (const v of (videos || [])) {
    if (v.dps_score != null && v.creator_username) {
      const creatorMean = creatorMeanDps.get(v.creator_username);
      if (creatorMean !== undefined) {
        deviationMap.set(v.video_id, v.dps_score - creatorMean);
      }
    }
  }

  console.log(`Total training rows: ${(features || []).length}`);
  console.log(`Videos with DPS: ${dpsMap.size}`);
  console.log(`Videos with deviation: ${deviationMap.size}`);

  // Build report
  const lines: string[] = [];
  lines.push('# Feature Validation Report — New Pre-Publication Features');
  lines.push('');
  lines.push(`**Date:** ${new Date().toISOString().split('T')[0]}`);
  lines.push(`**Total training rows:** ${(features || []).length}`);
  lines.push(`**Videos with DPS:** ${dpsMap.size}`);
  lines.push(`**Videos with creator deviation:** ${deviationMap.size}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  const featureResults: { name: string; count: number; rDps: number; rDev: number }[] = [];

  for (const feat of NEW_FEATURES) {
    lines.push(`## ${feat}`);
    lines.push('');

    const values: { videoId: string; value: number }[] = [];
    for (const row of (features || [])) {
      const v = (row as any)[feat];
      if (v !== null && v !== undefined) {
        // Convert booleans to 0/1
        const numV = typeof v === 'boolean' ? (v ? 1 : 0) : Number(v);
        if (!isNaN(numV)) values.push({ videoId: row.video_id, value: numV });
      }
    }

    const numericValues = values.map(v => v.value);
    lines.push(`- **Non-null count:** ${values.length}`);

    if (values.length === 0) {
      lines.push('- *No data available*');
      lines.push('');
      featureResults.push({ name: feat, count: 0, rDps: 0, rDev: 0 });
      continue;
    }

    lines.push(`- **Min:** ${Math.min(...numericValues).toFixed(4)}`);
    lines.push(`- **Max:** ${Math.max(...numericValues).toFixed(4)}`);
    lines.push(`- **Mean:** ${mean(numericValues).toFixed(4)}`);
    lines.push(`- **Median:** ${median(numericValues).toFixed(4)}`);

    // Spearman r against dps_score
    const dpsAligned = values.filter(v => dpsMap.has(v.videoId));
    const rDps = dpsAligned.length >= 10
      ? spearmanR(dpsAligned.map(v => v.value), dpsAligned.map(v => dpsMap.get(v.videoId)!))
      : 0;

    lines.push(`- **Spearman r (DPS):** ${rDps.toFixed(4)} (n=${dpsAligned.length})`);

    // Spearman r against creator deviation
    const devAligned = values.filter(v => deviationMap.has(v.videoId));
    const rDev = devAligned.length >= 10
      ? spearmanR(devAligned.map(v => v.value), devAligned.map(v => deviationMap.get(v.videoId)!))
      : 0;

    lines.push(`- **Spearman r (deviation):** ${rDev.toFixed(4)} (n=${devAligned.length})`);

    if (Math.abs(rDev) < 0.05) {
      lines.push('- **FLAG: weak — consider dropping before retrain**');
    }
    lines.push('');

    featureResults.push({ name: feat, count: values.length, rDps, rDev });
  }

  // Summary table
  lines.push('---');
  lines.push('');
  lines.push('## Summary Table');
  lines.push('');
  lines.push('| Feature | N | r(DPS) | r(deviation) | Status |');
  lines.push('|---------|---|--------|-------------|--------|');
  for (const f of featureResults) {
    const status = Math.abs(f.rDev) >= 0.10 ? 'STRONG' : Math.abs(f.rDev) >= 0.05 ? 'MODERATE' : 'WEAK';
    lines.push(`| ${f.name} | ${f.count} | ${f.rDps.toFixed(3)} | ${f.rDev.toFixed(3)} | ${status} |`);
  }
  lines.push('');

  // Recommendation
  const strongFeatures = featureResults.filter(f => Math.abs(f.rDev) >= 0.10);
  const moderateFeatures = featureResults.filter(f => Math.abs(f.rDev) >= 0.05 && Math.abs(f.rDev) < 0.10);
  const weakFeatures = featureResults.filter(f => Math.abs(f.rDev) < 0.05 && f.count > 0);

  lines.push('---');
  lines.push('');
  lines.push('## Recommendation: Proceed to retrain?');
  lines.push('');

  if (strongFeatures.length >= 3) {
    lines.push('**Y — Proceed to retrain.**');
    lines.push('');
    lines.push(`${strongFeatures.length} features show strong deviation correlation (|r| >= 0.10):`);
    for (const f of strongFeatures) lines.push(`- ${f.name}: r(dev)=${f.rDev.toFixed(3)}`);
  } else if (strongFeatures.length + moderateFeatures.length >= 3) {
    lines.push('**Y — Proceed to retrain with caution.**');
    lines.push('');
    lines.push(`${strongFeatures.length} strong + ${moderateFeatures.length} moderate features.`);
  } else {
    lines.push('**N — Do not retrain yet.**');
    lines.push('');
    lines.push('Insufficient features with meaningful deviation correlation.');
  }

  if (weakFeatures.length > 0) {
    lines.push('');
    lines.push('Consider dropping before retrain:');
    for (const f of weakFeatures) lines.push(`- ${f.name}: r(dev)=${f.rDev.toFixed(3)}`);
  }

  lines.push('');

  const reportPath = path.resolve(__dirname, '../docs/FEATURE_VALIDATION_REPORT.md');
  fs.writeFileSync(reportPath, lines.join('\n'));
  console.log(`\nReport written to: ${reportPath}`);

  // Print summary to console
  console.log('\n=== SUMMARY ===');
  for (const f of featureResults) {
    const status = Math.abs(f.rDev) >= 0.10 ? '✓ STRONG' : Math.abs(f.rDev) >= 0.05 ? '~ MODERATE' : '✗ WEAK';
    console.log(`  ${f.name}: n=${f.count}, r(dps)=${f.rDps.toFixed(3)}, r(dev)=${f.rDev.toFixed(3)} ${status}`);
  }
}

main().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});

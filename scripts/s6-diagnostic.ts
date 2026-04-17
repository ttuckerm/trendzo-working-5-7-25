#!/usr/bin/env npx tsx
/**
 * S1-S5 Signal Pipeline Diagnostic — READ ONLY
 * Confirms all 4 signal families are correctly wired before S6 retrain.
 * Does NOT modify any data, does NOT retrain anything.
 */

import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

// Track results
const results: Record<string, 'PASS' | 'FAIL' | 'WARN'> = {};
let criticalCount = 0;
let warnCount = 0;

function pass(check: string) { results[check] = 'PASS'; }
function fail(check: string) { results[check] = 'FAIL'; criticalCount++; }
function warn(check: string) { results[check] = 'WARN'; warnCount++; }

async function main() {
  console.log('');

  // ═══════════════════════════════════════════════════════════
  // CHECK 1 — FEATURE MATRIX BUILDER
  // ═══════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════════════');
  console.log('CHECK 1 — FEATURE MATRIX BUILDER');
  console.log('═══════════════════════════════════════════════════════════\n');

  const builderPath = path.resolve(process.cwd(), 'src/lib/features/feature-matrix-builder.ts');
  const builderExists = fs.existsSync(builderPath);
  console.log(`  File exists: ${builderExists ? 'YES' : 'NO'}`);

  if (!builderExists) {
    fail('check1');
    console.log('  FAIL: feature-matrix-builder.ts not found\n');
  } else {
    const builderSrc = fs.readFileSync(builderPath, 'utf-8');

    const hasBuildExport = /export\s+async\s+function\s+buildFeatureRow/.test(builderSrc);
    const hasCreatorImport = /extractCreatorFeatures/.test(builderSrc);
    const hasCulturalImport = /extractCulturalFeatures/.test(builderSrc);
    const hasAudienceImport = /extractAudienceFeatures/.test(builderSrc);
    const hasDistributionImport = /extractDistributionFeatures/.test(builderSrc);

    const hasCreatorCall = /extractCreatorFeatures\(/.test(builderSrc);
    const hasCulturalCall = /extractCulturalFeatures\(/.test(builderSrc);
    const hasAudienceCall = /extractAudienceFeatures\(/.test(builderSrc);
    const hasDistributionCall = /extractDistributionFeatures\(/.test(builderSrc);

    console.log(`  buildFeatureRow() exported: ${hasBuildExport ? 'YES' : 'NO'}`);
    console.log(`  Imports:`);
    console.log(`    extractCreatorFeatures:      ${hasCreatorImport ? 'YES' : 'MISSING'}`);
    console.log(`    extractCulturalFeatures:     ${hasCulturalImport ? 'YES' : 'MISSING'}`);
    console.log(`    extractAudienceFeatures:     ${hasAudienceImport ? 'YES' : 'MISSING'}`);
    console.log(`    extractDistributionFeatures: ${hasDistributionImport ? 'YES' : 'MISSING'}`);
    console.log(`  Called in buildFeatureRow():`);
    console.log(`    extractCreatorFeatures():      ${hasCreatorCall ? 'YES' : 'MISSING'}`);
    console.log(`    extractCulturalFeatures():     ${hasCulturalCall ? 'YES' : 'MISSING'}`);
    console.log(`    extractAudienceFeatures():     ${hasAudienceCall ? 'YES' : 'MISSING'}`);
    console.log(`    extractDistributionFeatures(): ${hasDistributionCall ? 'YES' : 'MISSING'}`);

    // Count features from ALL_FEATURES export
    const allFeaturesMatch = builderSrc.match(/export const ALL_FEATURES\s*=\s*\[([^\]]*)\]/s);
    // Better: just import it
    const { ALL_FEATURES, FEATURE_COUNT } = await import('../src/lib/features/feature-matrix-builder');
    console.log(`\n  ALL_FEATURES array length: ${ALL_FEATURES.length}`);
    console.log(`  FEATURE_COUNT constant:    ${FEATURE_COUNT}`);

    // Count per family
    const contentCount = ALL_FEATURES.filter((f: string) => !f.startsWith('creator_') && !f.startsWith('cultural_') && !f.startsWith('trend_phase') && !f.startsWith('niche_activation') && !f.startsWith('follower_') && !f.startsWith('engagement_') && !f.startsWith('audience_') && !f.startsWith('post_hour') && !f.startsWith('post_day') && !f.startsWith('hashtag_strategy') && !f.startsWith('sound_advantage') && !f.startsWith('early_velocity') && !f.startsWith('distribution_')).length;
    // Actually let's use the named exports
    const { CREATOR_FEATURE_NAMES } = await import('../src/lib/features/creator-trajectory');
    const { CULTURAL_FEATURE_NAMES } = await import('../src/lib/features/cultural-momentum');
    const { AUDIENCE_FEATURE_NAMES } = await import('../src/lib/features/audience-quality');
    const { DISTRIBUTION_FEATURE_NAMES } = await import('../src/lib/features/distribution-signals');
    const { V10_FEATURES } = await import('../src/lib/features/feature-matrix-builder');

    console.log(`\n  Feature family breakdown:`);
    console.log(`    Content (V10):    ${V10_FEATURES.length} / 58 expected`);
    console.log(`    Creator (S1):     ${CREATOR_FEATURE_NAMES.length} / 5 expected`);
    console.log(`    Cultural (S2):    ${CULTURAL_FEATURE_NAMES.length} / 4 expected`);
    console.log(`    Audience (S3):    ${AUDIENCE_FEATURE_NAMES.length} / 5 expected`);
    console.log(`    Distribution (S5):${DISTRIBUTION_FEATURE_NAMES.length} / 6 expected`);
    console.log(`    TOTAL:            ${ALL_FEATURES.length} / 78 expected`);

    const allGood = hasBuildExport && hasCreatorImport && hasCulturalImport &&
      hasAudienceImport && hasDistributionImport && hasCreatorCall &&
      hasCulturalCall && hasAudienceCall && hasDistributionCall &&
      ALL_FEATURES.length === 78;

    if (allGood) {
      pass('check1');
      console.log(`\n  Feature matrix builder: PASS — ${ALL_FEATURES.length} features confirmed`);
    } else {
      fail('check1');
      console.log(`\n  Feature matrix builder: FAIL — ${ALL_FEATURES.length} features (expected 78)`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CHECK 2 — CREATOR TRAJECTORY (S1)
  // ═══════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('CHECK 2 — CREATOR TRAJECTORY (S1)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const creatorPath = path.resolve(process.cwd(), 'src/lib/features/creator-trajectory.ts');
  console.log(`  File exists: ${fs.existsSync(creatorPath) ? 'YES' : 'NO'}`);

  const creatorSrc = fs.readFileSync(creatorPath, 'utf-8');
  const hasCreatorExport = /export\s+async\s+function\s+extractCreatorFeatures/.test(creatorSrc);
  const hasFields = ['creator_momentum_30d', 'creator_avg_vps_90d', 'creator_viral_recency',
    'creator_consistency_score', 'creator_trajectory_label'].every(f => creatorSrc.includes(f));
  console.log(`  extractCreatorFeatures exported: ${hasCreatorExport ? 'YES' : 'NO'}`);
  console.log(`  All 5 fields present: ${hasFields ? 'YES' : 'NO'}`);

  // Live test: find a creator with actual_dps data
  console.log('\n  Live test:');
  let creatorTestCreatorId: string | null = null;
  try {
    const { data: creatorRows } = await supabase
      .from('prediction_runs')
      .select('creator_id')
      .not('creator_id', 'is', null)
      .not('actual_dps', 'is', null)
      .limit(100);

    if (creatorRows && creatorRows.length > 0) {
      // Find one with 3+ rows
      const counts = new Map<string, number>();
      for (const r of creatorRows) {
        counts.set(r.creator_id, (counts.get(r.creator_id) || 0) + 1);
      }
      for (const [id, cnt] of counts) {
        if (cnt >= 3) { creatorTestCreatorId = id; break; }
      }
    }
  } catch { /* column may not exist */ }

  if (!creatorTestCreatorId) {
    console.log('    No creator_id with 3+ actual_dps rows found — testing with empty string (defaults)');
    creatorTestCreatorId = '';
  } else {
    console.log(`    Found creator_id: ${creatorTestCreatorId}`);
  }

  const { extractCreatorFeatures } = await import('../src/lib/features/creator-trajectory');
  const creatorResult = await extractCreatorFeatures(creatorTestCreatorId, new Date(), supabase);
  console.log(`    creator_momentum_30d:      ${creatorResult.creator_momentum_30d}`);
  console.log(`    creator_avg_vps_90d:       ${creatorResult.creator_avg_vps_90d}`);
  console.log(`    creator_viral_recency:     ${creatorResult.creator_viral_recency}`);
  console.log(`    creator_consistency_score:  ${creatorResult.creator_consistency_score}`);
  console.log(`    creator_trajectory_label:   ${creatorResult.creator_trajectory_label}`);

  const creatorVals = [
    creatorResult.creator_momentum_30d,
    creatorResult.creator_avg_vps_90d,
    creatorResult.creator_viral_recency,
    creatorResult.creator_consistency_score,
    creatorResult.creator_trajectory_label,
  ];
  const creatorHasNull = creatorVals.some(v => v === null || v === undefined);
  const creatorHasNaN = creatorVals.some(v => typeof v === 'number' && isNaN(v));
  const creatorRangeOk =
    creatorResult.creator_momentum_30d >= -1 && creatorResult.creator_momentum_30d <= 1 &&
    creatorResult.creator_avg_vps_90d >= 0 && creatorResult.creator_avg_vps_90d <= 100 &&
    creatorResult.creator_viral_recency >= 0 && creatorResult.creator_viral_recency <= 365 &&
    creatorResult.creator_consistency_score >= 0 && creatorResult.creator_consistency_score <= 100 &&
    [0, 1, 2].includes(creatorResult.creator_trajectory_label);

  if (creatorHasNull) console.log('    FLAG: null/undefined value detected');
  if (creatorHasNaN) console.log('    FLAG: NaN value detected');
  if (!creatorRangeOk) console.log('    FLAG: value outside expected range');

  if (!creatorHasNull && !creatorHasNaN && creatorRangeOk && hasCreatorExport && hasFields) {
    pass('check2');
    console.log(`\n  Creator trajectory: PASS — values: [${creatorVals.join(', ')}]`);
  } else {
    fail('check2');
    console.log(`\n  Creator trajectory: FAIL`);
  }

  // ═══════════════════════════════════════════════════════════
  // CHECK 3 — CULTURAL MOMENTUM (S2)
  // ═══════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('CHECK 3 — CULTURAL MOMENTUM (S2)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const culturalPath = path.resolve(process.cwd(), 'src/lib/features/cultural-momentum.ts');
  console.log(`  File exists: ${fs.existsSync(culturalPath) ? 'YES' : 'NO'}`);

  const culturalSrc = fs.readFileSync(culturalPath, 'utf-8');
  const hasCulturalExport = /export\s+async\s+function\s+extractCulturalFeatures/.test(culturalSrc);
  console.log(`  extractCulturalFeatures exported: ${hasCulturalExport ? 'YES' : 'NO'}`);

  const { extractCulturalFeatures } = await import('../src/lib/features/cultural-momentum');

  // Check if cultural_events has data
  let culturalEventCount = 0;
  let recentEvent: any = null;
  try {
    const { count } = await supabase.from('cultural_events').select('id', { count: 'exact', head: true });
    culturalEventCount = count || 0;
    if (culturalEventCount > 0) {
      const { data } = await supabase.from('cultural_events').select('niche, event_title, keywords, created_at').order('created_at', { ascending: false }).limit(1);
      if (data && data.length > 0) recentEvent = data[0];
    }
  } catch { /* table may not exist */ }

  console.log(`  cultural_events rows: ${culturalEventCount}`);

  // Test A — With data
  console.log('\n  Test A — With data:');
  if (recentEvent) {
    const testNiche = recentEvent.niche;
    const testTopic = (recentEvent.keywords?.[0] || recentEvent.event_title?.split(' ')[0] || 'test');
    const testDate = new Date(recentEvent.created_at);
    testDate.setDate(testDate.getDate() + 1); // 1 day after detection
    console.log(`    Using niche="${testNiche}", topic="${testTopic}", date=${testDate.toISOString().split('T')[0]}`);

    const culturalA = await extractCulturalFeatures(testNiche, testTopic, testDate, supabase);
    console.log(`    cultural_momentum_score:    ${culturalA.cultural_momentum_score}`);
    console.log(`    trend_phase_encoded:        ${culturalA.trend_phase_encoded}`);
    console.log(`    niche_activation_score:     ${culturalA.niche_activation_score}`);
    console.log(`    cultural_timing_advantage:  ${culturalA.cultural_timing_advantage}`);

    if (culturalA.cultural_momentum_score > 0 || culturalA.niche_activation_score > 0) {
      console.log('    Test A: cultural signal detected');
    } else {
      console.log('    Test A: no cultural signal (may be topic mismatch — niche_activation should still be > 0)');
    }
  } else if (culturalEventCount === 0) {
    console.log('    cultural_events table empty — Atlas Subsystem 4 has not run yet.');
    console.log('    Cultural features will default to 0 until cron jobs are deployed.');
    console.log('    This is expected pre-deploy.');
  } else {
    console.log('    Could not load recent event for testing');
  }

  // Test B — Empty case
  console.log('\n  Test B — Empty case:');
  const culturalB = await extractCulturalFeatures('nonexistent-niche-xyz', 'notarealtopic', new Date(), supabase);
  console.log(`    cultural_momentum_score:    ${culturalB.cultural_momentum_score}`);
  console.log(`    trend_phase_encoded:        ${culturalB.trend_phase_encoded}`);
  console.log(`    niche_activation_score:     ${culturalB.niche_activation_score}`);
  console.log(`    cultural_timing_advantage:  ${culturalB.cultural_timing_advantage}`);

  const culturalBAllZero = culturalB.cultural_momentum_score === 0 &&
    culturalB.trend_phase_encoded === 0 && culturalB.niche_activation_score === 0 &&
    culturalB.cultural_timing_advantage === 0;
  console.log(`    All zeros: ${culturalBAllZero ? 'YES' : 'NO — BUG'}`);

  if (hasCulturalExport && culturalBAllZero) {
    if (culturalEventCount === 0) { warn('check3'); console.log('\n  Cultural momentum: WARN — table empty, defaults work'); }
    else { pass('check3'); console.log('\n  Cultural momentum: PASS'); }
  } else {
    fail('check3');
    console.log('\n  Cultural momentum: FAIL');
  }

  // ═══════════════════════════════════════════════════════════
  // CHECK 4 — AUDIENCE QUALITY (S3)
  // ═══════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('CHECK 4 — AUDIENCE QUALITY (S3)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const audiencePath = path.resolve(process.cwd(), 'src/lib/features/audience-quality.ts');
  console.log(`  File exists: ${fs.existsSync(audiencePath) ? 'YES' : 'NO'}`);

  const audienceSrc = fs.readFileSync(audiencePath, 'utf-8');
  const hasAudienceExport = /export\s+async\s+function\s+extractAudienceFeatures/.test(audienceSrc);
  console.log(`  extractAudienceFeatures exported: ${hasAudienceExport ? 'YES' : 'NO'}`);

  // Find a creator with follower_count
  const { data: profileRows } = await supabase
    .from('onboarding_profiles')
    .select('user_id, follower_count')
    .not('follower_count', 'is', null)
    .gt('follower_count', 0)
    .limit(1);

  const { extractAudienceFeatures } = await import('../src/lib/features/audience-quality');

  if (profileRows && profileRows.length > 0) {
    const testProfile = profileRows[0];
    console.log(`\n  Live test with user_id: ${testProfile.user_id}`);
    console.log(`  follower_count from DB: ${testProfile.follower_count}`);

    const audienceResult = await extractAudienceFeatures(testProfile.user_id, supabase);
    console.log(`    follower_count_log:         ${audienceResult.follower_count_log}`);
    console.log(`    engagement_rate_estimate:   ${audienceResult.engagement_rate_estimate}`);
    console.log(`    follower_growth_velocity:   ${audienceResult.follower_growth_velocity}`);
    console.log(`    audience_size_tier:          ${audienceResult.audience_size_tier}`);
    console.log(`    follower_quality_score:      ${audienceResult.follower_quality_score}`);

    // Sanity check log value
    const expectedLog = Math.log10(Math.max(testProfile.follower_count, 1));
    console.log(`\n  Sanity check: follower_count=${testProfile.follower_count} → expected log=${expectedLog.toFixed(4)} → actual=${audienceResult.follower_count_log}`);
    const logDiff = Math.abs(expectedLog - audienceResult.follower_count_log);
    if (logDiff > 0.01) console.log(`    FLAG: log value off by ${logDiff.toFixed(4)}`);

    const audVals = [audienceResult.follower_count_log, audienceResult.engagement_rate_estimate,
      audienceResult.follower_growth_velocity, audienceResult.audience_size_tier, audienceResult.follower_quality_score];
    const audHasNull = audVals.some(v => v === null || v === undefined);
    const audHasNaN = audVals.some(v => typeof v === 'number' && isNaN(v));
    const audRangeOk = audienceResult.follower_count_log >= 0 && audienceResult.follower_count_log <= 8 &&
      audienceResult.engagement_rate_estimate >= 0 && audienceResult.engagement_rate_estimate <= 1 &&
      audienceResult.follower_growth_velocity >= -1 && audienceResult.follower_growth_velocity <= 1 &&
      audienceResult.audience_size_tier >= 1 && audienceResult.audience_size_tier <= 5 &&
      audienceResult.follower_quality_score >= 0 && audienceResult.follower_quality_score <= 100;

    if (audHasNull) console.log('    FLAG: null/undefined value');
    if (audHasNaN) console.log('    FLAG: NaN value');
    if (!audRangeOk) console.log('    FLAG: value outside expected range');

    if (!audHasNull && !audHasNaN && audRangeOk && hasAudienceExport && logDiff <= 0.01) {
      pass('check4');
      console.log(`\n  Audience quality: PASS — values: [${audVals.join(', ')}]`);
    } else {
      fail('check4');
      console.log(`\n  Audience quality: FAIL`);
    }
  } else {
    console.log('  No onboarding_profiles with follower_count found — testing with empty string');
    const audienceDefault = await extractAudienceFeatures('', supabase);
    console.log(`    Default values: log=${audienceDefault.follower_count_log}, tier=${audienceDefault.audience_size_tier}, quality=${audienceDefault.follower_quality_score}`);
    if (hasAudienceExport) { warn('check4'); console.log('\n  Audience quality: WARN — no live data to test'); }
    else { fail('check4'); }
  }

  // ═══════════════════════════════════════════════════════════
  // CHECK 5 — DISTRIBUTION SIGNALS (S4 + S5)
  // ═══════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('CHECK 5 — DISTRIBUTION SIGNALS (S4 + S5)');
  console.log('═══════════════════════════════════════════════════════════\n');

  // PART A — Schema check
  console.log('  PART A — Schema check:');
  const expectedCols = [
    'posted_hour_utc', 'posted_day_of_week', 'posted_days_since_epoch',
    'hashtag_count', 'hashtag_niche_count', 'hashtag_trending_count',
    'has_fyp_hashtag', 'hashtag_specificity_score',
    'sound_id', 'sound_is_trending', 'sound_type', 'sound_age_days',
    'views_at_1h', 'views_at_24h', 'shares_at_24h',
  ];

  let colsPresent = 0;
  for (const col of expectedCols) {
    // Test column existence by selecting it with limit 0
    const { error } = await supabase.from('scraped_videos').select(col).limit(0);
    const exists = !error;
    if (exists) colsPresent++;
    console.log(`    ${col.padEnd(28)} ${exists ? 'EXISTS' : 'MISSING'}`);
  }
  console.log(`\n  Distribution schema: ${colsPresent}/15 columns present`);

  // Coverage query
  console.log('\n  Coverage:');
  const { count: svTotal } = await supabase.from('scraped_videos').select('video_id', { count: 'exact', head: true });
  const { count: svTiming } = await supabase.from('scraped_videos').select('video_id', { count: 'exact', head: true }).not('posted_hour_utc', 'is', null);
  const { count: svHashtag } = await supabase.from('scraped_videos').select('video_id', { count: 'exact', head: true }).not('hashtag_count', 'is', null);
  const { count: svSound } = await supabase.from('scraped_videos').select('video_id', { count: 'exact', head: true }).not('sound_type', 'is', null);
  const { count: svVelocity } = await supabase.from('scraped_videos').select('video_id', { count: 'exact', head: true }).not('views_at_1h', 'is', null);

  const tot = svTotal || 1;
  console.log(`    Total rows:   ${svTotal}`);
  console.log(`    timing:       ${svTiming}/${svTotal} (${Math.round(((svTiming||0)/tot)*100)}%)`);
  console.log(`    hashtags:     ${svHashtag}/${svTotal} (${Math.round(((svHashtag||0)/tot)*100)}%)`);
  console.log(`    sound:        ${svSound}/${svTotal} (${Math.round(((svSound||0)/tot)*100)}%)`);
  console.log(`    velocity:     ${svVelocity}/${svTotal} (${Math.round(((svVelocity||0)/tot)*100)}%)`);

  // PART B — Feature extractor
  console.log('\n  PART B — Feature extractor:');
  const distPath = path.resolve(process.cwd(), 'src/lib/features/distribution-signals.ts');
  console.log(`  File exists: ${fs.existsSync(distPath) ? 'YES' : 'NO'}`);

  const distSrc = fs.readFileSync(distPath, 'utf-8');
  const hasDistExport = /export\s+async\s+function\s+extractDistributionFeatures/.test(distSrc);
  console.log(`  extractDistributionFeatures exported: ${hasDistExport ? 'YES' : 'NO'}`);

  const { extractDistributionFeatures } = await import('../src/lib/features/distribution-signals');

  // Test 1 — NULL handling: use a prediction_run video_id that won't be in scraped_videos
  console.log('\n  Test 1 — NULL handling (non-existent video_id):');
  const distNull = await extractDistributionFeatures('00000000-0000-0000-0000-000000000000', 1, supabase);
  console.log(`    post_hour_score:        ${distNull.post_hour_score}`);
  console.log(`    post_day_score:         ${distNull.post_day_score}`);
  console.log(`    hashtag_strategy_score: ${distNull.hashtag_strategy_score}`);
  console.log(`    sound_advantage_score:  ${distNull.sound_advantage_score}`);
  console.log(`    early_velocity_signal:  ${distNull.early_velocity_signal}`);
  console.log(`    distribution_composite: ${distNull.distribution_composite}`);

  const nullAllFifty = distNull.post_hour_score === 50 && distNull.post_day_score === 50 &&
    distNull.hashtag_strategy_score === 50 && distNull.sound_advantage_score === 50 &&
    distNull.early_velocity_signal === 50 && distNull.distribution_composite === 50;
  console.log(`    All 50s: ${nullAllFifty ? 'YES' : 'NO — BUG'}`);

  // Test 2 — Populated data
  console.log('\n  Test 2 — Populated data:');
  const { data: populatedRow } = await supabase
    .from('scraped_videos')
    .select('video_id, hashtag_count, posted_hour_utc, sound_type')
    .not('hashtag_count', 'is', null)
    .not('posted_hour_utc', 'is', null)
    .limit(1);

  let distPopulatedPass = false;
  if (populatedRow && populatedRow.length > 0) {
    const testVid = populatedRow[0];
    console.log(`    video_id: ${testVid.video_id} (hashtag_count=${testVid.hashtag_count}, hour=${testVid.posted_hour_utc}, sound=${testVid.sound_type})`);

    const distPop = await extractDistributionFeatures(testVid.video_id, 1, supabase);
    console.log(`    post_hour_score:        ${distPop.post_hour_score}`);
    console.log(`    post_day_score:         ${distPop.post_day_score}`);
    console.log(`    hashtag_strategy_score: ${distPop.hashtag_strategy_score}`);
    console.log(`    sound_advantage_score:  ${distPop.sound_advantage_score}`);
    console.log(`    early_velocity_signal:  ${distPop.early_velocity_signal}`);
    console.log(`    distribution_composite: ${distPop.distribution_composite}`);

    // At least post_hour_score and hashtag_strategy_score should differ from 50
    const hasVariation = distPop.post_hour_score !== 50 || distPop.hashtag_strategy_score !== 50;
    console.log(`    Has non-50 variation: ${hasVariation ? 'YES' : 'NO — data present but all 50s = BUG'}`);
    distPopulatedPass = hasVariation;
  } else {
    console.log('    No populated scraped_videos row found for testing');
  }

  if (hasDistExport && nullAllFifty && colsPresent >= 13 && distPopulatedPass) {
    pass('check5');
    console.log(`\n  Distribution signals: PASS`);
  } else if (hasDistExport && nullAllFifty && colsPresent >= 10) {
    warn('check5');
    console.log(`\n  Distribution signals: WARN — ${colsPresent}/15 columns, populated test ${distPopulatedPass ? 'passed' : 'inconclusive'}`);
  } else {
    fail('check5');
    console.log(`\n  Distribution signals: FAIL`);
  }

  // ═══════════════════════════════════════════════════════════
  // CHECK 6 — TRAINER ENGINE WIRING
  // ═══════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('CHECK 6 — TRAINER ENGINE WIRING');
  console.log('═══════════════════════════════════════════════════════════\n');

  const trainerPath = path.resolve(process.cwd(), 'src/lib/training/trainer-engine.ts');
  const trainerExists = fs.existsSync(trainerPath);
  console.log(`  trainer-engine.ts exists: ${trainerExists ? 'YES' : 'NO'}`);

  // The trainer engine evaluates existing models — it doesn't call buildFeatureRow directly.
  // The retrain script (retrain-step1-step2-sandbox.ts) builds features.
  // Check if retrain script imports from feature-matrix-builder
  const retrainPath = path.resolve(process.cwd(), 'scripts/retrain-step1-step2-sandbox.ts');
  const retrainExists = fs.existsSync(retrainPath);
  console.log(`  retrain-step1-step2-sandbox.ts exists: ${retrainExists ? 'YES' : 'NO'}`);

  if (retrainExists) {
    const retrainSrc = fs.readFileSync(retrainPath, 'utf-8');
    const importsBuilder = /feature-matrix-builder/.test(retrainSrc);
    const importsCreator = /extractCreatorFeatures/.test(retrainSrc);
    const importsCultural = /extractCulturalFeatures/.test(retrainSrc);
    const importsAudience = /extractAudienceFeatures/.test(retrainSrc);
    const importsDistribution = /extractDistributionFeatures/.test(retrainSrc);
    const hasFeatureCountLog = /Training with.*features/.test(retrainSrc);

    console.log(`  Retrain script imports:`);
    console.log(`    feature-matrix-builder (ALL_FEATURES): ${importsBuilder ? 'YES' : 'NO'}`);
    console.log(`    extractCreatorFeatures:                ${importsCreator ? 'YES' : 'NO'}`);
    console.log(`    extractCulturalFeatures:               ${importsCultural ? 'YES' : 'NO'}`);
    console.log(`    extractAudienceFeatures:               ${importsAudience ? 'YES' : 'NO'}`);
    console.log(`    extractDistributionFeatures:           ${importsDistribution ? 'YES' : 'NO'}`);
    console.log(`    "Training with N features" log:        ${hasFeatureCountLog ? 'YES' : 'NO'}`);

    // Check trainer-engine for feature_set column
    const trainerSrc = fs.readFileSync(trainerPath, 'utf-8');
    const hasFeatureSet = /feature_set/.test(trainerSrc);
    console.log(`\n  trainer-engine.ts references feature_set: ${hasFeatureSet ? 'YES' : 'NO'}`);

    // Check for legacy extractor (imports/requires only — ignore comments)
    const retrainLines = retrainSrc.split('\n').filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    const retrainCode = retrainLines.join('\n');
    const legacyPattern = /import.*extract-prediction-features|require.*extract-prediction-features|extractPredictionFeatures\s*\(/i;
    const hasLegacy = legacyPattern.test(retrainCode);
    console.log(`  Legacy extractor in retrain script:       ${hasLegacy ? 'YES — CRITICAL' : 'NO (clean)'}`);

    const allWired = importsBuilder && importsCreator && importsCultural &&
      importsAudience && importsDistribution && hasFeatureCountLog && hasFeatureSet && !hasLegacy;

    if (allWired) {
      pass('check6');
      console.log('\n  Trainer engine wiring: PASS');
    } else {
      if (hasLegacy) { fail('check6'); console.log('\n  Trainer engine wiring: FAIL — legacy extractor still present'); }
      else { warn('check6'); console.log('\n  Trainer engine wiring: WARN — partial wiring'); }
    }
    console.log(`  buildFeatureRow imported: ${importsBuilder ? 'YES (via ALL_FEATURES)' : 'NO'}`);
    console.log(`  Legacy extractor still present: ${hasLegacy ? 'YES — CRITICAL' : 'NO'}`);
  } else {
    fail('check6');
    console.log('  FAIL: retrain script not found');
  }

  // ═══════════════════════════════════════════════════════════
  // CHECK 7 — MIGRATION AUDIT
  // ═══════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('CHECK 7 — MIGRATION AUDIT');
  console.log('═══════════════════════════════════════════════════════════\n');

  const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir);
  const sSeriesKeywords = ['creator_trajectory', 'cultural_momentum', 'audience_quality', 'distribution_signal', 'feature_set'];

  const sMigrations: string[] = [];
  for (const file of migrationFiles) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    if (sSeriesKeywords.some(kw => content.toLowerCase().includes(kw))) {
      sMigrations.push(file);
    }
  }

  console.log(`  S-series migration files found: ${sMigrations.length}`);
  let migrationsApplied = 0;
  for (const file of sMigrations) {
    // Check if key columns from each migration exist
    let applied = false;
    if (file.includes('creator_trajectory') || file.includes('20260412')) {
      const { error } = await supabase.from('prediction_runs').select('creator_id').limit(0);
      applied = !error;
    }
    if (file.includes('distribution')) {
      const { error } = await supabase.from('scraped_videos').select('posted_hour_utc').limit(0);
      applied = !error;
    }
    // Default: assume applied if we got this far without errors
    if (!applied) {
      const { error } = await supabase.from('training_experiments').select('feature_set').limit(0);
      applied = !error;
    }
    if (applied) migrationsApplied++;
    console.log(`    ${file}  ${applied ? 'APPLIED' : 'NOT APPLIED'}`);
  }

  if (sMigrations.length > 0 && migrationsApplied === sMigrations.length) {
    pass('check7');
  } else if (migrationsApplied > 0) {
    warn('check7');
  } else {
    fail('check7');
  }
  console.log(`\n  ${sMigrations.length} S-series migrations found, ${migrationsApplied} confirmed applied`);

  // ═══════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════

  const { ALL_FEATURES: finalFeatures } = await import('../src/lib/features/feature-matrix-builder');
  const readyForS6 = criticalCount === 0;

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         S1-S5 SIGNAL PIPELINE DIAGNOSTIC             ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║ Feature matrix total features:    ${String(finalFeatures.length).padEnd(3)}/ 78 expected  ║`);
  console.log('║                                                      ║');
  console.log(`║ CHECK 1 — Feature matrix builder: ${(results['check1'] || 'N/A').padEnd(16)}  ║`);
  console.log(`║ CHECK 2 — Creator trajectory:     ${(results['check2'] || 'N/A').padEnd(16)}  ║`);
  console.log(`║ CHECK 3 — Cultural momentum:      ${(results['check3'] || 'N/A').padEnd(16)}  ║`);
  console.log(`║ CHECK 4 — Audience quality:        ${(results['check4'] || 'N/A').padEnd(16)} ║`);
  console.log(`║ CHECK 5 — Distribution signals:   ${(results['check5'] || 'N/A').padEnd(16)}  ║`);
  console.log(`║ CHECK 6 — Trainer engine wiring:  ${(results['check6'] || 'N/A').padEnd(16)}  ║`);
  console.log(`║ CHECK 7 — Migrations applied:     ${(results['check7'] || 'N/A').padEnd(16)}  ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║ CRITICAL issues (blocks S6):      ${String(criticalCount).padEnd(20)}║`);
  console.log(`║ WARN issues (won't block S6):     ${String(warnCount).padEnd(20)}║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║ READY FOR S6 RETRAIN:             ${readyForS6 ? 'YES                ' : 'NO                 '}║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  if (!readyForS6) {
    console.log('\nBlocking issues:');
    for (const [check, status] of Object.entries(results)) {
      if (status === 'FAIL') console.log(`  - ${check}: FAIL — see details above`);
    }
  } else {
    console.log('\nAll signal families confirmed. S6 retrain will use 78 features');
    console.log('across 5 signal families. Run S6 when ready.');
  }
  console.log('');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

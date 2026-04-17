#!/usr/bin/env npx tsx
/**
 * Check distribution signal coverage in scraped_videos.
 * Run after migration to see backfill results.
 *
 * Usage: npx tsx scripts/check-distribution-coverage.ts
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { checkDistributionCoverage } from '../src/lib/features/distribution-signals-check';

async function main() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Distribution Signal Coverage Report                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const cov = await checkDistributionCoverage(db);

  console.log(`  Total scraped videos:       ${cov.totalScraped}`);
  console.log(`  Overall coverage:           ${cov.coveragePct}%\n`);

  console.log('  ── Post Timing ──');
  console.log(`    posted_hour_utc:          ${cov.details.posted_hour_utc}/${cov.totalScraped} (${pct(cov.details.posted_hour_utc, cov.totalScraped)}%)`);
  console.log(`    posted_day_of_week:       ${cov.details.posted_day_of_week}/${cov.totalScraped} (${pct(cov.details.posted_day_of_week, cov.totalScraped)}%)`);

  console.log('\n  ── Hashtag Strategy ──');
  console.log(`    hashtag_count:            ${cov.details.hashtag_count}/${cov.totalScraped} (${pct(cov.details.hashtag_count, cov.totalScraped)}%)`);
  console.log(`    has_fyp_hashtag:          ${cov.details.has_fyp_hashtag}/${cov.totalScraped} (${pct(cov.details.has_fyp_hashtag, cov.totalScraped)}%)`);
  console.log(`    hashtag_niche_count:      ${cov.details.hashtag_niche_count}/${cov.totalScraped} (${pct(cov.details.hashtag_niche_count, cov.totalScraped)}%)`);

  console.log('\n  ── Sound Data ──');
  console.log(`    sound_type:               ${cov.details.sound_type}/${cov.totalScraped} (${pct(cov.details.sound_type, cov.totalScraped)}%)`);

  console.log('\n  ── Engagement Velocity (aspirational) ──');
  console.log(`    views_at_1h:              ${cov.details.views_at_1h}/${cov.totalScraped} (${pct(cov.details.views_at_1h, cov.totalScraped)}%)`);
  console.log(`    views_at_24h:             ${cov.details.views_at_24h}/${cov.totalScraped} (${pct(cov.details.views_at_24h, cov.totalScraped)}%)`);

  console.log('\n  ── Summary ──');
  console.log(`    With post timing:         ${cov.withPostTiming} (${pct(cov.withPostTiming, cov.totalScraped)}%)`);
  console.log(`    With hashtag data:        ${cov.withHashtagData} (${pct(cov.withHashtagData, cov.totalScraped)}%)`);
  console.log(`    With sound data:          ${cov.withSoundData} (${pct(cov.withSoundData, cov.totalScraped)}%)`);
  console.log(`    With engagement velocity: ${cov.withEngagementVelocity} (${pct(cov.withEngagementVelocity, cov.totalScraped)}%)`);
}

function pct(n: number, total: number): string {
  return total > 0 ? Math.round((n / total) * 100).toString() : '0';
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

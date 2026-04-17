/**
 * Scraped Video Quality Gate
 *
 * Filters the scraped_videos table (the XGBoost training source) by marking
 * unusable rows training_eligible = false with a disqualification reason.
 *
 * Filters (in order):
 *   1. no_dps_score        — dps_score IS NULL
 *   2. followers_below_1k  — best-available follower count is null or < 1000
 *   3. high_null_rate      — 2+ null values across the 10 core training columns
 *
 * After filtering, produces a coverage report over the remaining eligible rows.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const FOLLOWER_THRESHOLD = 1000;

const CORE_COLUMNS = [
  'views_count',
  'likes_count',
  'comments_count',
  'shares_count',
  'duration_seconds',
  'dps_score',
  'niche',
  'hashtags',
  'posted_hour_utc',
  'posted_day_of_week',
] as const;

const HIGH_NULL_THRESHOLD = 2;

const REASON = {
  NO_DPS_SCORE: 'no_dps_score',
  FOLLOWERS_BELOW_1K: 'followers_below_1k',
  HIGH_NULL_RATE: 'high_null_rate',
} as const;

const COVERAGE_GROUPS: Record<string, string[]> = {
  Engagement: ['views_count', 'likes_count', 'comments_count', 'shares_count', 'saves_count'],
  Creator: ['creator_followers_count', 'creator_followers', 'creator_verified'],
  Content: [
    'duration_seconds',
    'caption',
    'description',
    'hashtags',
    'hashtag_count',
    'hashtag_niche_count',
    'hashtag_trending_count',
    'has_fyp_hashtag',
    'hashtag_specificity_score',
    'transcript_text',
  ],
  Timing: ['posted_hour_utc', 'posted_day_of_week', 'posted_days_since_epoch'],
  Sound: ['sound_is_trending', 'sound_type', 'sound_age_days', 'music_is_original'],
  DPS: ['dps_score', 'dps_percentile', 'dps_classification', 'dps_z_score', 'dps_confidence', 'dps_breakdown'],
  'Early Velocity': ['views_at_1h', 'views_at_24h', 'shares_at_24h'],
  Meta: ['niche', 'performance_tier', 'source'],
};

export interface ColumnCoverage {
  column_name: string;
  group: string;
  non_null_count: number;
  fill_rate_percent: number;
}

export interface GroupCoverage {
  group_name: string;
  column_count: number;
  average_fill_rate: number;
}

export interface ScrapedQualityGateReport {
  totalRows: number;
  disqualified: {
    no_dps_score: number;
    followers_below_1k: number;
    high_null_rate: number;
    total: number;
  };
  eligible: number;
  verdict: 'PASS' | 'WARNING' | 'FAIL';
  verdictMessage: string;
  coverage: ColumnCoverage[];
  groupSummary: GroupCoverage[];
  warnings: string[];
  errors: string[];
}

function getServiceDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase service credentials not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function totalRowCount(db: SupabaseClient): Promise<number> {
  const { count, error } = await db
    .from('scraped_videos')
    .select('video_id', { count: 'exact', head: true });
  if (error) throw new Error(`count scraped_videos: ${error.message}`);
  return count ?? 0;
}

async function eligibleCount(db: SupabaseClient): Promise<number> {
  const { count, error } = await db
    .from('scraped_videos')
    .select('video_id', { count: 'exact', head: true })
    .eq('training_eligible', true);
  if (error) throw new Error(`count eligible: ${error.message}`);
  return count ?? 0;
}

/**
 * Count how many rows currently have training_eligible = false. Used to decide
 * whether the reset step is needed on this run.
 */
async function ineligibleCount(db: SupabaseClient): Promise<number> {
  const { count, error } = await db
    .from('scraped_videos')
    .select('video_id', { count: 'exact', head: true })
    .eq('training_eligible', false);
  if (error) throw new Error(`count ineligible: ${error.message}`);
  return count ?? 0;
}

/**
 * Reset training_eligible → true across every currently-ineligible row, batched
 * by video_id. Supabase has a statement timeout that can kill a single bulk
 * UPDATE against 6k+ rows, so we page through the ineligible rows in chunks.
 */
async function resetEligibility(db: SupabaseClient): Promise<number> {
  let total = 0;
  const PAGE = 500;
  for (;;) {
    // Always pull from offset 0 — each batch flips those rows to true so they
    // drop out of the eq(false) filter on the next iteration.
    const { data, error } = await db
      .from('scraped_videos')
      .select('video_id')
      .eq('training_eligible', false)
      .range(0, PAGE - 1);
    if (error) throw new Error(`reset fetch: ${error.message}`);
    if (!data || data.length === 0) break;
    const ids = data.map((r) => (r as { video_id: string }).video_id);
    const { error: updErr } = await db
      .from('scraped_videos')
      .update({ training_eligible: true, training_disqualified_reason: null })
      .in('video_id', ids);
    if (updErr) throw new Error(`reset update: ${updErr.message}`);
    total += ids.length;
    if (data.length < PAGE) break;
  }
  return total;
}

/**
 * Paginate over scraped_videos rows that are currently training_eligible = true,
 * selecting the requested columns.
 */
async function fetchEligibleRows<T>(
  db: SupabaseClient,
  columns: string,
): Promise<T[]> {
  const rows: T[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from('scraped_videos')
      .select(columns)
      .eq('training_eligible', true)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`fetch eligible rows: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as unknown as T[]));
    if (data.length < PAGE) break;
  }
  return rows;
}

async function markIdsDisqualified(
  db: SupabaseClient,
  videoIds: string[],
  reason: string,
): Promise<void> {
  if (videoIds.length === 0) return;
  const BATCH = 500;
  for (let i = 0; i < videoIds.length; i += BATCH) {
    const batch = videoIds.slice(i, i + BATCH);
    const { error } = await db
      .from('scraped_videos')
      .update({ training_eligible: false, training_disqualified_reason: reason })
      .in('video_id', batch);
    if (error) throw new Error(`mark ${reason}: ${error.message}`);
  }
}

/** Non-null count among training_eligible = true rows for a given column. */
async function countNonNullEligible(db: SupabaseClient, column: string): Promise<number> {
  const { count, error } = await db
    .from('scraped_videos')
    .select('video_id', { count: 'exact', head: true })
    .eq('training_eligible', true)
    .not(column, 'is', null);
  if (error) {
    // Column may not exist — report as 0 so the report still completes.
    console.warn(`[ScrapedQualityGate] coverage skipped for "${column}": ${error.message}`);
    return 0;
  }
  return count ?? 0;
}

export interface RunScrapedVideoQualityGateOptions {
  /**
   * Skip the pre-filter reset that flips all rows back to training_eligible = true.
   * Pass true on the very first run (no disqualified rows yet) to avoid the
   * unnecessary batched UPDATE. If false (default), the gate auto-detects and
   * skips the reset when no rows are currently ineligible.
   */
  skipReset?: boolean;
}

export async function runScrapedVideoQualityGate(
  options: RunScrapedVideoQualityGateOptions = {},
): Promise<ScrapedQualityGateReport> {
  const db = getServiceDb();
  const warnings: string[] = [];
  const errors: string[] = [];

  if (options.skipReset) {
    console.log('[ScrapedQualityGate] skipReset=true — skipping reset step.');
  } else {
    const priorIneligible = await ineligibleCount(db);
    if (priorIneligible === 0) {
      console.log('[ScrapedQualityGate] No prior ineligible rows — skipping reset.');
    } else {
      console.log(
        `[ScrapedQualityGate] Resetting training_eligible on ${priorIneligible} rows (batched)…`,
      );
      const resetCount = await resetEligibility(db);
      console.log(`[ScrapedQualityGate] Reset complete: ${resetCount} rows.`);
    }
  }

  const totalRows = await totalRowCount(db);
  console.log(`[ScrapedQualityGate] Total scraped_videos rows: ${totalRows}`);

  // ── Filter 1: no_dps_score ────────────────────────────────────────────────
  // Fetch the offending video_ids first, then batch the UPDATE via
  // markIdsDisqualified to avoid hitting Supabase's statement timeout on a
  // single large UPDATE.
  console.log('[ScrapedQualityGate] Filter 1: checking DPS score…');
  const noDpsIds: string[] = [];
  {
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await db
        .from('scraped_videos')
        .select('video_id')
        .eq('training_eligible', true)
        .is('dps_score', null)
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`filter 1 fetch: ${error.message}`);
      if (!data || data.length === 0) break;
      for (const r of data) noDpsIds.push((r as { video_id: string }).video_id);
      if (data.length < PAGE) break;
    }
  }
  await markIdsDisqualified(db, noDpsIds, REASON.NO_DPS_SCORE);
  const filter1Count = noDpsIds.length;
  console.log(`Filter 1: ${filter1Count} rows disqualified — no DPS score`);

  // ── Filter 2: followers_below_1k ──────────────────────────────────────────
  console.log('[ScrapedQualityGate] Filter 2: checking creator follower counts…');
  type FollowerRow = {
    video_id: string;
    creator_followers_count: number | null;
    creator_followers: number | null;
  };
  const followerRows = await fetchEligibleRows<FollowerRow>(
    db,
    'video_id, creator_followers_count, creator_followers',
  );
  const lowFollowerIds: string[] = [];
  for (const r of followerRows) {
    const primary = r.creator_followers_count;
    const fallback = r.creator_followers;
    const followers =
      primary != null && Number(primary) > 0
        ? Number(primary)
        : fallback != null && Number(fallback) > 0
          ? Number(fallback)
          : null;
    if (followers == null || followers < FOLLOWER_THRESHOLD) {
      lowFollowerIds.push(r.video_id);
    }
  }
  await markIdsDisqualified(db, lowFollowerIds, REASON.FOLLOWERS_BELOW_1K);
  const filter2Count = lowFollowerIds.length;
  console.log(`Filter 2: ${filter2Count} rows disqualified — under 1K followers`);

  // ── Filter 3: high_null_rate ──────────────────────────────────────────────
  console.log('[ScrapedQualityGate] Filter 3: checking core-column null rate…');
  type CoreRow = { video_id: string } & Record<(typeof CORE_COLUMNS)[number], unknown>;
  const coreRows = await fetchEligibleRows<CoreRow>(
    db,
    ['video_id', ...CORE_COLUMNS].join(', '),
  );
  const highNullIds: string[] = [];
  for (const r of coreRows) {
    let nullCount = 0;
    for (const col of CORE_COLUMNS) {
      const v = (r as Record<string, unknown>)[col];
      if (v === null || v === undefined) nullCount += 1;
    }
    if (nullCount >= HIGH_NULL_THRESHOLD) highNullIds.push(r.video_id);
  }
  await markIdsDisqualified(db, highNullIds, REASON.HIGH_NULL_RATE);
  const filter3Count = highNullIds.length;
  console.log(`Filter 3: ${filter3Count} rows disqualified — too many null core columns`);

  // ── Coverage report ───────────────────────────────────────────────────────
  const eligible = await eligibleCount(db);
  console.log(`[ScrapedQualityGate] Eligible rows after filters: ${eligible}`);

  const coverage: ColumnCoverage[] = [];
  for (const [group, cols] of Object.entries(COVERAGE_GROUPS)) {
    for (const column of cols) {
      const nonNull = eligible === 0 ? 0 : await countNonNullEligible(db, column);
      const fillRate = eligible === 0 ? 0 : (nonNull / eligible) * 100;
      coverage.push({
        column_name: column,
        group,
        non_null_count: nonNull,
        fill_rate_percent: Math.round(fillRate * 100) / 100,
      });
    }
  }

  const groupSummary: GroupCoverage[] = Object.entries(COVERAGE_GROUPS).map(([group, cols]) => {
    const groupCols = coverage.filter((c) => c.group === group);
    const avg =
      groupCols.length === 0
        ? 0
        : groupCols.reduce((s, c) => s + c.fill_rate_percent, 0) / groupCols.length;
    return {
      group_name: group,
      column_count: cols.length,
      average_fill_rate: Math.round(avg * 100) / 100,
    };
  });

  console.log('[ScrapedQualityGate] Coverage report:');
  for (const g of groupSummary) {
    console.log(`  ${g.group_name} (${g.column_count} cols): ${g.average_fill_rate}% avg fill`);
    for (const c of coverage.filter((x) => x.group === g.group_name)) {
      console.log(`    - ${c.column_name}: ${c.non_null_count} (${c.fill_rate_percent}%)`);
    }
  }

  // ── Verdict ───────────────────────────────────────────────────────────────
  let verdict: 'PASS' | 'WARNING' | 'FAIL';
  let verdictMessage: string;
  if (eligible > 1500) {
    verdict = 'PASS';
    verdictMessage = 'PASS — sufficient training data';
  } else if (eligible >= 1000) {
    verdict = 'WARNING';
    verdictMessage = 'WARNING — marginal, consider loosening filters';
    warnings.push(verdictMessage);
  } else {
    verdict = 'FAIL';
    verdictMessage = 'FAIL — insufficient training data';
    errors.push(verdictMessage);
  }

  const disqualifiedTotal = filter1Count + filter2Count + filter3Count;
  console.log(
    `[ScrapedQualityGate] FINAL: total=${totalRows} disqualified=${disqualifiedTotal} ` +
      `(no_dps=${filter1Count}, low_followers=${filter2Count}, high_null=${filter3Count}) ` +
      `eligible=${eligible} → ${verdictMessage}`,
  );

  return {
    totalRows,
    disqualified: {
      no_dps_score: filter1Count,
      followers_below_1k: filter2Count,
      high_null_rate: filter3Count,
      total: disqualifiedTotal,
    },
    eligible,
    verdict,
    verdictMessage,
    coverage,
    groupSummary,
    warnings,
    errors,
  };
}

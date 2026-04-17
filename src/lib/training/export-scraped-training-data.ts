/**
 * Export Scraped Training Data
 *
 * Reads training_eligible rows from scraped_videos and writes two CSVs
 * (training + holdout) plus a feature-metadata JSON. Consumed by the Python
 * XGBoost training script. Read-only: no writes to scraped_videos.
 *
 * Null handling: we never zero-fill. XGBoost handles NaN natively, so empty
 * CSV cells propagate as missing values. Boolean columns become 1/0/empty.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import {
  CONTENT_BINARY_COLUMNS,
  CONTENT_CATEGORICAL_COLUMNS,
  CONTENT_FEATURE_COLUMNS,
  contentFeatureGroup,
  sanityCheckContentColumns,
  type ContentFeatureSanityChecks,
} from '@/lib/training/training-features-export-columns';

const DATA_DIR = path.join(process.cwd(), 'src/lib/training/data');
const TRAINING_PATH = path.join(DATA_DIR, 'training_data.csv');
const HOLDOUT_PATH = path.join(DATA_DIR, 'holdout_data.csv');
const METADATA_PATH = path.join(DATA_DIR, 'feature_metadata.json');

// Ordered feature list (CSV column order).
const FEATURE_COLUMNS = [
  // Raw engagement
  'views_count',
  'likes_count',
  'comments_count',
  'shares_count',
  'saves_count',
  // Derived engagement
  'like_rate',
  'comment_rate',
  'share_rate',
  'save_rate',
  'engagement_total',
  'engagement_rate',
  'views_per_follower',
  // Creator
  'creator_followers_count',
  'creator_verified',
  // Content
  'duration_seconds',
  'hashtag_count',
  'hashtag_niche_count',
  'hashtag_trending_count',
  'has_fyp_hashtag',
  'hashtag_specificity_score',
  // Timing
  'posted_hour_utc',
  'posted_day_of_week',
  'posted_days_since_epoch',
  // Sound
  'sound_is_trending',
  'sound_type',
  'sound_age_days',
  'music_is_original',
  // Early velocity (potential cheat codes — exported for ablation)
  'views_at_1h',
  'views_at_24h',
  'shares_at_24h',
  // Cohort flag (bimodal detection)
  'dps_cohort',
] as const;

const TARGET_COLUMN = 'dps_score';
const IDENTIFIER_COLUMNS = ['video_id', 'niche', 'source'] as const;

const BINARY_COLUMNS = new Set([
  'creator_verified',
  'has_fyp_hashtag',
  'sound_is_trending',
  'music_is_original',
]);

const CATEGORICAL_COLUMNS = new Set(['sound_type', 'niche']);

const FEATURE_GROUPS: Record<string, string> = {
  views_count: 'raw_engagement',
  likes_count: 'raw_engagement',
  comments_count: 'raw_engagement',
  shares_count: 'raw_engagement',
  saves_count: 'raw_engagement',
  like_rate: 'derived_engagement',
  comment_rate: 'derived_engagement',
  share_rate: 'derived_engagement',
  save_rate: 'derived_engagement',
  engagement_total: 'derived_engagement',
  engagement_rate: 'derived_engagement',
  views_per_follower: 'derived_engagement',
  creator_followers_count: 'creator',
  creator_verified: 'creator',
  duration_seconds: 'content',
  hashtag_count: 'content',
  hashtag_niche_count: 'content',
  hashtag_trending_count: 'content',
  has_fyp_hashtag: 'content',
  hashtag_specificity_score: 'content',
  posted_hour_utc: 'timing',
  posted_day_of_week: 'timing',
  posted_days_since_epoch: 'timing',
  sound_is_trending: 'sound',
  sound_type: 'sound',
  sound_age_days: 'sound',
  music_is_original: 'sound',
  views_at_1h: 'early_velocity',
  views_at_24h: 'early_velocity',
  shares_at_24h: 'early_velocity',
  dps_cohort: 'cohort',
};

/** Metadata + derived engagement features (scraped_videos) — CSV order before content columns */
const ALL_FEATURE_COLUMNS = [...FEATURE_COLUMNS, ...CONTENT_FEATURE_COLUMNS] as const;

const TRAINING_FEATURES_SELECT = ['video_id', ...CONTENT_FEATURE_COLUMNS].join(', ');

const SELECT_COLUMNS = [
  'video_id',
  'niche',
  'source',
  'scraped_at',
  'dps_score',
  'views_count',
  'likes_count',
  'comments_count',
  'shares_count',
  'saves_count',
  'creator_followers_count',
  'creator_verified',
  'duration_seconds',
  'hashtag_count',
  'hashtag_niche_count',
  'hashtag_trending_count',
  'has_fyp_hashtag',
  'hashtag_specificity_score',
  'posted_hour_utc',
  'posted_day_of_week',
  'posted_days_since_epoch',
  'sound_is_trending',
  'sound_type',
  'sound_age_days',
  'music_is_original',
  'views_at_1h',
  'views_at_24h',
  'shares_at_24h',
].join(', ');

type RawRow = Record<string, unknown>;

export interface ExportResult {
  training_rows: number;
  holdout_rows: number;
  /** Total model feature columns (metadata + content); excludes identifiers + target */
  features: number;
  metadata_feature_count: number;
  content_feature_count: number;
  training_rows_full_join: number;
  training_rows_metadata_only: number;
  holdout_rows_full_join: number;
  holdout_rows_metadata_only: number;
  content_feature_coverage_training_pct: number;
  content_feature_coverage_holdout_pct: number;
  content_features_added: string[];
  content_feature_sanity: ContentFeatureSanityChecks;
  bimodal_detected: boolean;
  bimodal_details?: { cohortA: { mean: number; count: number }; cohortB: { mean: number; count: number } };
  file_paths: { training: string; holdout: string; metadata: string };
}

function getServiceDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase service credentials not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchRows(db: SupabaseClient, isHoldout: boolean): Promise<RawRow[]> {
  const rows: RawRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from('scraped_videos')
      .select(SELECT_COLUMNS)
      .eq('training_eligible', true)
      .eq('is_holdout', isHoldout)
      .order('video_id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`fetch ${isHoldout ? 'holdout' : 'training'}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as unknown as RawRow[]));
    if (data.length < PAGE) break;
  }
  return rows;
}

/** All training_features rows (paginated); join is keyed by video_id. */
async function fetchTrainingFeaturesMap(db: SupabaseClient): Promise<Map<string, RawRow>> {
  const map = new Map<string, RawRow>();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from('training_features')
      .select(TRAINING_FEATURES_SELECT)
      .order('video_id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`fetch training_features: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data as unknown as RawRow[]) {
      const id = row.video_id;
      if (id != null && id !== '') map.set(String(id), row);
    }
    if (data.length < PAGE) break;
  }
  return map;
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toBool01(v: unknown): 0 | 1 | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') return v ? 1 : 0;
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim();
    if (s === 'true' || s === 't' || s === '1' || s === 'yes') return 1;
    if (s === 'false' || s === 'f' || s === '0' || s === 'no') return 0;
  }
  return null;
}

function safeDiv(num: number | null, denom: number | null): number | null {
  if (num === null || denom === null || denom === 0) return null;
  return num / denom;
}

/**
 * Detect a bimodal DPS split across cohorts defined by the `source` column.
 * Assigns dps_cohort = 0 to the lower-mean cohort and 1 to the higher-mean
 * cohort. Falls back to all-zeros when no split qualifies.
 */
function detectBimodalCohorts(rows: RawRow[]): {
  bimodal: boolean;
  cohortBySource: Map<string, 0 | 1>;
  details?: { cohortA: { mean: number; count: number }; cohortB: { mean: number; count: number } };
} {
  const bySource = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const src = (r.source ?? 'unknown') as string;
    const d = toNumber(r.dps_score);
    if (d === null) continue;
    const agg = bySource.get(src) || { sum: 0, count: 0 };
    agg.sum += d;
    agg.count += 1;
    bySource.set(src, agg);
  }

  const qualifying = [...bySource.entries()]
    .filter(([, a]) => a.count > 50)
    .map(([source, a]) => ({ source, mean: a.sum / a.count, count: a.count }))
    .sort((a, b) => a.mean - b.mean);

  if (qualifying.length < 2) {
    return { bimodal: false, cohortBySource: new Map() };
  }

  const lowest = qualifying[0];
  const highest = qualifying[qualifying.length - 1];
  if (highest.mean - lowest.mean <= 15) {
    return { bimodal: false, cohortBySource: new Map() };
  }

  // Binary split on median mean: assign each source to 0 or 1 based on which
  // pole its mean is closer to.
  const midpoint = (lowest.mean + highest.mean) / 2;
  const cohortBySource = new Map<string, 0 | 1>();
  for (const q of qualifying) {
    cohortBySource.set(q.source, q.mean < midpoint ? 0 : 1);
  }
  // Sources that did not qualify (too few rows) default to cohort 0.
  for (const [source] of bySource) {
    if (!cohortBySource.has(source)) cohortBySource.set(source, 0);
  }

  let sumA = 0;
  let countA = 0;
  let sumB = 0;
  let countB = 0;
  for (const r of rows) {
    const src = (r.source ?? 'unknown') as string;
    const d = toNumber(r.dps_score);
    if (d === null) continue;
    const cohort = cohortBySource.get(src) ?? 0;
    if (cohort === 0) {
      sumA += d;
      countA += 1;
    } else {
      sumB += d;
      countB += 1;
    }
  }

  return {
    bimodal: true,
    cohortBySource,
    details: {
      cohortA: { mean: countA > 0 ? sumA / countA : 0, count: countA },
      cohortB: { mean: countB > 0 ? sumB / countB : 0, count: countB },
    },
  };
}

function projectTrainingFeatureColumns(tf: RawRow | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const col of CONTENT_FEATURE_COLUMNS) {
    if (!tf) {
      out[col] = null;
      continue;
    }
    const v = tf[col];
    if (CONTENT_BINARY_COLUMNS.has(col)) {
      out[col] = toBool01(v);
    } else {
      out[col] = toNumber(v);
    }
  }
  return out;
}

function projectRow(
  r: RawRow,
  cohortBySource: Map<string, 0 | 1>,
  tfByVideoId: Map<string, RawRow>,
): Record<string, unknown> {
  const views = toNumber(r.views_count);
  const likes = toNumber(r.likes_count);
  const comments = toNumber(r.comments_count);
  const shares = toNumber(r.shares_count);
  const saves = toNumber(r.saves_count);
  const followers = toNumber(r.creator_followers_count);

  const engagementTotal =
    likes !== null || comments !== null || shares !== null
      ? (likes ?? 0) + (comments ?? 0) + (shares ?? 0) + (saves ?? 0)
      : null;

  const source = (r.source ?? 'unknown') as string;
  const cohort = cohortBySource.size > 0 ? (cohortBySource.get(source) ?? 0) : 0;

  const vid = r.video_id != null && r.video_id !== '' ? String(r.video_id) : '';
  const tfRow = vid ? tfByVideoId.get(vid) : undefined;

  return {
    // Identifiers
    video_id: r.video_id ?? null,
    niche: r.niche ?? null,
    source: r.source ?? null,
    // Target
    dps_score: toNumber(r.dps_score),
    // Raw engagement
    views_count: views,
    likes_count: likes,
    comments_count: comments,
    shares_count: shares,
    saves_count: saves,
    // Derived engagement
    like_rate: safeDiv(likes, views),
    comment_rate: safeDiv(comments, views),
    share_rate: safeDiv(shares, views),
    save_rate: safeDiv(saves, views),
    engagement_total: engagementTotal,
    engagement_rate: safeDiv(engagementTotal, views),
    views_per_follower: safeDiv(views, followers),
    // Creator
    creator_followers_count: followers,
    creator_verified: toBool01(r.creator_verified),
    // Content
    duration_seconds: toNumber(r.duration_seconds),
    hashtag_count: toNumber(r.hashtag_count),
    hashtag_niche_count: toNumber(r.hashtag_niche_count),
    hashtag_trending_count: toNumber(r.hashtag_trending_count),
    has_fyp_hashtag: toBool01(r.has_fyp_hashtag),
    hashtag_specificity_score: toNumber(r.hashtag_specificity_score),
    // Timing
    posted_hour_utc: toNumber(r.posted_hour_utc),
    posted_day_of_week: toNumber(r.posted_day_of_week),
    posted_days_since_epoch: toNumber(r.posted_days_since_epoch),
    // Sound
    sound_is_trending: toBool01(r.sound_is_trending),
    sound_type: r.sound_type ?? null,
    sound_age_days: toNumber(r.sound_age_days),
    music_is_original: toBool01(r.music_is_original),
    // Early velocity
    views_at_1h: toNumber(r.views_at_1h),
    views_at_24h: toNumber(r.views_at_24h),
    shares_at_24h: toNumber(r.shares_at_24h),
    // Cohort
    dps_cohort: cohort,
    ...projectTrainingFeatureColumns(tfRow),
  };
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = typeof v === 'string' ? v : String(v);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildCsv(rows: Array<Record<string, unknown>>): string {
  const header = [...IDENTIFIER_COLUMNS, TARGET_COLUMN, ...ALL_FEATURE_COLUMNS];
  const lines: string[] = [header.join(',')];
  for (const row of rows) {
    lines.push(header.map((col) => csvEscape(row[col])).join(','));
  }
  return lines.join('\n') + '\n';
}

function buildMetadata(): Array<{
  name: string;
  group: string;
  is_binary: boolean;
  is_categorical: boolean;
}> {
  return ALL_FEATURE_COLUMNS.map((name) => ({
    name,
    group: FEATURE_GROUPS[name] || contentFeatureGroup(name),
    is_binary: BINARY_COLUMNS.has(name) || CONTENT_BINARY_COLUMNS.has(name),
    is_categorical: CATEGORICAL_COLUMNS.has(name) || CONTENT_CATEGORICAL_COLUMNS.has(name),
  }));
}

function countJoinCoverage(
  rows: Array<Record<string, unknown>>,
  tfByVideoId: Map<string, RawRow>,
): { fullJoin: number; metadataOnly: number } {
  let fullJoin = 0;
  let metadataOnly = 0;
  for (const row of rows) {
    const id = row.video_id != null && row.video_id !== '' ? String(row.video_id) : '';
    if (id && tfByVideoId.has(id)) fullJoin += 1;
    else metadataOnly += 1;
  }
  return { fullJoin, metadataOnly };
}

export async function exportScrapedTrainingData(): Promise<ExportResult> {
  const db = getServiceDb();

  console.log('[ExportScraped] Fetching training_features for LEFT JOIN…');
  const tfByVideoId = await fetchTrainingFeaturesMap(db);
  console.log(`[ExportScraped] training_features rows loaded: ${tfByVideoId.size}`);

  console.log('[ExportScraped] Fetching training rows…');
  const trainingRaw = await fetchRows(db, false);
  console.log(`[ExportScraped] Training rows fetched: ${trainingRaw.length}`);

  console.log('[ExportScraped] Fetching holdout rows…');
  const holdoutRaw = await fetchRows(db, true);
  console.log(`[ExportScraped] Holdout rows fetched: ${holdoutRaw.length}`);

  // Bimodal detection runs on training rows only. The same cohort map is
  // applied to holdout rows so both CSVs share the same dps_cohort encoding.
  const { bimodal, cohortBySource, details } = detectBimodalCohorts(trainingRaw);
  if (bimodal && details) {
    console.warn(
      `[ExportScraped] WARNING: Bimodal DPS detected — cohort A mean: ${details.cohortA.mean.toFixed(2)} ` +
        `(n=${details.cohortA.count}), cohort B mean: ${details.cohortB.mean.toFixed(2)} (n=${details.cohortB.count})`,
    );
  } else {
    console.log('[ExportScraped] No bimodal DPS split detected — dps_cohort = 0 for all rows.');
  }

  const trainingRows = trainingRaw.map((r) => projectRow(r, cohortBySource, tfByVideoId));
  const holdoutRows = holdoutRaw.map((r) => projectRow(r, cohortBySource, tfByVideoId));

  const trainingCov = countJoinCoverage(trainingRows, tfByVideoId);
  const holdoutCov = countJoinCoverage(holdoutRows, tfByVideoId);
  const metadataFeatureCount = FEATURE_COLUMNS.length;
  const contentFeatureCount = CONTENT_FEATURE_COLUMNS.length;
  const totalFeatures = ALL_FEATURE_COLUMNS.length;
  const pctTrain =
    trainingRows.length > 0 ? Math.round((trainingCov.fullJoin / trainingRows.length) * 1000) / 10 : 0;
  const pctHold =
    holdoutRows.length > 0 ? Math.round((holdoutCov.fullJoin / holdoutRows.length) * 1000) / 10 : 0;
  const contentSanity = sanityCheckContentColumns();

  console.log('[ExportScraped] — export summary —');
  console.log(`[ExportScraped] Total training rows: ${trainingRows.length}`);
  console.log(`[ExportScraped] Total holdout rows: ${holdoutRows.length}`);
  console.log(
    `[ExportScraped] Training: full join (metadata + training_features): ${trainingCov.fullJoin}; metadata-only: ${trainingCov.metadataOnly}`,
  );
  console.log(
    `[ExportScraped] Holdout: full join: ${holdoutCov.fullJoin}; metadata-only: ${holdoutCov.metadataOnly}`,
  );
  console.log(
    `[ExportScraped] Feature counts — metadata: ${metadataFeatureCount}, content: ${contentFeatureCount}, total: ${totalFeatures}`,
  );
  console.log(`[ExportScraped] Content coverage (training): ${pctTrain}%`);
  console.log(`[ExportScraped] Content coverage (holdout): ${pctHold}%`);
  console.log(
    `[ExportScraped] Content sanity — hook=${contentSanity.hook_column}, loudness=${contentSanity.loudness_column}, scene=${contentSanity.scene_column}, readability=${contentSanity.readability_column}, contrast=${contentSanity.contrast_column}, resolution=${contentSanity.resolution_column}`,
  );
  if (contentSanity.missing_categories.length > 0) {
    console.warn(`[ExportScraped] Missing expected content categories: ${contentSanity.missing_categories.join(', ')}`);
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(TRAINING_PATH, buildCsv(trainingRows), 'utf8');
  await fs.writeFile(HOLDOUT_PATH, buildCsv(holdoutRows), 'utf8');

  const metadata = buildMetadata();
  await fs.writeFile(METADATA_PATH, JSON.stringify(metadata, null, 2), 'utf8');

  console.log(
    `[ExportScraped] Wrote CSVs — ${trainingRows.length} training rows, ${holdoutRows.length} holdout rows, ${totalFeatures} feature columns`,
  );

  return {
    training_rows: trainingRows.length,
    holdout_rows: holdoutRows.length,
    features: totalFeatures,
    metadata_feature_count: metadataFeatureCount,
    content_feature_count: contentFeatureCount,
    training_rows_full_join: trainingCov.fullJoin,
    training_rows_metadata_only: trainingCov.metadataOnly,
    holdout_rows_full_join: holdoutCov.fullJoin,
    holdout_rows_metadata_only: holdoutCov.metadataOnly,
    content_feature_coverage_training_pct: pctTrain,
    content_feature_coverage_holdout_pct: pctHold,
    content_features_added: [...CONTENT_FEATURE_COLUMNS],
    content_feature_sanity: contentSanity,
    bimodal_detected: bimodal,
    bimodal_details: details,
    file_paths: {
      training: TRAINING_PATH,
      holdout: HOLDOUT_PATH,
      metadata: METADATA_PATH,
    },
  };
}

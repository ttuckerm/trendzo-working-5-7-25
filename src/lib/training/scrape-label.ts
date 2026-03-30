/**
 * Scrape-Label: Label-on-scrape for mature TikTok videos
 *
 * When a scraped video is older than 48 hours, its engagement metrics
 * are already mature enough to serve as ground truth. This module
 * computes actual_dps via the canonical DPS v2 module and writes
 * labels through the single v2 write path.
 *
 * Called from /api/kai/predict AFTER runPredictionPipeline returns.
 */

import { createClient } from '@supabase/supabase-js';
import {
  computeDpsV2FromRows,
  labelPredictionRunWithDpsV2,
  type DpsV2RawMetrics,
  type ScrapedVideoRow,
} from './dps-v2';

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
const COHORT_PAGE_SIZE = 1000;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

export interface ScrapedMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface ScrapeLabeResult {
  labeled: boolean;
  isMature: boolean;
  videoAgeHours: number;
  actual_dps?: number | null;
  actual_tier?: string;
  metrics?: ScrapedMetrics;
  error?: string;
}

/**
 * Extract engagement metrics from a raw Apify item.
 */
export function extractApifyMetrics(rawItem: any): ScrapedMetrics | null {
  if (!rawItem) return null;

  const stats = rawItem.stats || rawItem.statsV2 || {};

  const views = Number(rawItem.playCount ?? stats.playCount ?? 0);
  const likes = Number(rawItem.diggCount ?? stats.diggCount ?? 0);
  const comments = Number(rawItem.commentCount ?? stats.commentCount ?? 0);
  const shares = Number(rawItem.shareCount ?? stats.shareCount ?? 0);
  const saves = Number(rawItem.collectCount ?? stats.collectCount ?? 0);

  if (views === 0 && likes === 0 && comments === 0) return null;

  return { views, likes, comments, shares, saves };
}

/**
 * Extract the video creation timestamp from a raw Apify item.
 */
export function extractApifyCreateTime(rawItem: any): number | null {
  if (!rawItem) return null;
  const ct = rawItem.createTime ?? rawItem.createTimeISO;
  if (!ct) return null;

  if (typeof ct === 'number') {
    return ct > 1e12 ? ct : ct * 1000;
  }
  if (typeof ct === 'string') {
    const parsed = new Date(ct).getTime();
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Check if a video is older than 48 hours based on its createTime.
 */
export function isVideoMature(createTimeMs: number): boolean {
  return (Date.now() - createTimeMs) >= FORTY_EIGHT_HOURS_MS;
}

/**
 * Label a prediction run with scraped metrics from a mature video.
 * Uses the canonical DPS v2 module and writes through the single v2 path.
 *
 * SAFETY: This runs AFTER the prediction pipeline has already completed,
 * so scraped engagement metrics cannot contaminate the prediction inputs.
 */
export async function labelOnScrape(
  runId: string,
  metrics: ScrapedMetrics,
  createTimeMs: number,
  niche: string,
  followerCount?: number,
): Promise<ScrapeLabeResult> {
  const videoAgeHours = Math.round(((Date.now() - createTimeMs) / 3600000) * 100) / 100;
  const isMature = isVideoMature(createTimeMs);

  if (!isMature) {
    return { labeled: false, isMature: false, videoAgeHours };
  }

  const supabase = getSupabase();

  try {
    // Fetch cohort for v2 computation
    const cohort = await fetchCohort(supabase, niche);

    if (cohort.length === 0) {
      console.warn(`[ScrapeLabel] Empty cohort for niche "${niche}", skipping label for run ${runId}`);
      return { labeled: false, isMature: true, videoAgeHours, error: 'empty_cohort' };
    }

    // Build raw metrics for v2
    const rawMetrics: DpsV2RawMetrics = {
      views: metrics.views,
      likes: metrics.likes,
      comments: metrics.comments,
      shares: metrics.shares,
      saves: metrics.saves,
      follower_count: followerCount ?? 0,
      hours_since_post: videoAgeHours,
      posted_at: new Date(createTimeMs).toISOString(),
      collected_at: new Date().toISOString(),
    };

    // Compute DPS v2
    const v2Result = computeDpsV2FromRows(rawMetrics, cohort);

    // Fetch predicted DPS for error computation
    const { data: runData } = await supabase
      .from('prediction_runs')
      .select('predicted_dps_7d, prediction_range_low, prediction_range_high')
      .eq('id', runId)
      .single();

    // Write via canonical v2 writer
    const writeResult = await labelPredictionRunWithDpsV2(
      supabase,
      {
        run_id: runId,
        raw_metrics: rawMetrics,
        breakdown: v2Result.breakdown,
        dps_score: v2Result.score,
        tier: v2Result.tier,
        label_trust: v2Result.dps_v2_incomplete ? 'untrusted' : 'low',
        training_weight: v2Result.dps_v2_incomplete ? 0 : 0.5,
        source_tag: 'scrape_ingest',
        predicted_dps: (runData as any)?.predicted_dps_7d,
        prediction_range_low: (runData as any)?.prediction_range_low,
        prediction_range_high: (runData as any)?.prediction_range_high,
        dps_v2_incomplete: v2Result.dps_v2_incomplete,
        dps_v2_incomplete_reason: v2Result.dps_v2_incomplete_reason,
      },
    );

    if (!writeResult.success) {
      console.error(`[ScrapeLabel] Failed to write v2 labels for run ${runId}: ${writeResult.error}`);
      return { labeled: false, isMature: true, videoAgeHours, error: writeResult.error };
    }

    console.log(
      `[ScrapeLabel] Labeled run ${runId}: VPS=${v2Result.score?.toFixed(4) ?? 'INCOMPLETE'}, tier=${v2Result.tier}, ` +
      `age=${videoAgeHours}h, cohort=${cohort.length}, views=${metrics.views}`,
    );

    return {
      labeled: true,
      isMature: true,
      videoAgeHours,
      actual_dps: v2Result.score,
      actual_tier: v2Result.tier,
      metrics,
    };
  } catch (err: any) {
    console.error(`[ScrapeLabel] Error labeling run ${runId}: ${err.message}`);
    return { labeled: false, isMature: true, videoAgeHours, error: err.message };
  }
}

async function fetchCohort(supabase: any, niche: string): Promise<ScrapedVideoRow[]> {
  const cohort: ScrapedVideoRow[] = [];
  let offset = 0;

  while (true) {
    const { data: page, error } = await supabase
      .from('scraped_videos')
      .select('views_count, likes_count, comments_count, shares_count, saves_count, creator_followers_count')
      .eq('niche', niche)
      .not('views_count', 'is', null)
      .gt('views_count', 0)
      .range(offset, offset + COHORT_PAGE_SIZE - 1);

    if (error) {
      console.error(`[ScrapeLabel] Cohort fetch error for ${niche}: ${error.message}`);
      break;
    }
    if (!page || page.length === 0) break;

    for (const r of page) {
      cohort.push({
        views: (r as any).views_count ?? 0,
        likes: (r as any).likes_count ?? 0,
        comments: (r as any).comments_count ?? 0,
        shares: (r as any).shares_count ?? 0,
        saves: (r as any).saves_count ?? 0,
        follower_count: (r as any).creator_followers_count ?? 0,
      });
    }

    if (page.length < COHORT_PAGE_SIZE) break;
    offset += COHORT_PAGE_SIZE;
  }

  return cohort;
}

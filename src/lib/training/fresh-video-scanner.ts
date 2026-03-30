/**
 * Fresh Video Discovery Scanner
 *
 * Discovers freshly-posted TikTok videos in target niches, runs initial VPS
 * predictions, and creates metric schedules (4h/24h/48h/7d) for tracking.
 *
 * Replaces the old niche-creator-scraper which randomly scraped top creators
 * with no useful training data output.
 *
 * Control: All configuration is in the discovery_scan_config DB table,
 * editable via the Command Center dashboard.
 *
 * Budget safety: max_apify_calls_per_day enforced per niche.
 * Concurrency safety: Atomic DB-level locking via next_poll_at (no in-memory flags).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { callApifyScraperSync } from '@/lib/services/apify-tiktok-client';
import { createMetricSchedules } from '@/lib/training/metric-scheduler';
import { runPredictionPipeline } from '@/lib/prediction/runPredictionPipeline';
import { NICHE_HASHTAGS } from '@/lib/prediction/system-registry';

// =============================================================================
// Constants
// =============================================================================

/**
 * PAID actor required for hashtag/search discovery.
 * The FREE actor (default in apify-tiktok-client.ts) only supports fetching
 * metrics for individual video URLs (used by metric-collector.ts).
 * Discovery search REQUIRES the paid actor.
 */
const DISCOVERY_ACTOR = 'clockworks/tiktok-scraper';

const INTER_CALL_DELAY_MS = 2500;
const LOG_PREFIX = '[DiscoveryScanner]';

// =============================================================================
// Types
// =============================================================================

export interface DiscoveryScanResult {
  niches_scanned: number;
  total_videos_found: number;
  total_fresh: number;
  total_new: number;
  total_predicted: number;
  total_schedules: number;
  apify_calls_made: number;
  budget_limited_niches: string[];
  errors: string[];
  scan_details: ScanRunDetail[];
}

interface ScanRunDetail {
  niche_key: string;
  scan_run_id: string;
  status: 'completed' | 'failed';
  videos_found: number;
  videos_fresh: number;
  videos_new: number;
  videos_predicted: number;
  schedules_created: number;
  apify_calls: number;
  error?: string;
}

interface ScanConfig {
  id: string;
  niche_key: string;
  enabled: boolean;
  search_mode: 'hashtag' | 'search_query' | 'both';
  hashtags: string[];
  search_queries: string[];
  max_age_minutes: number;
  min_hearts: number;
  min_views: number;
  poll_interval_minutes: number;
  last_polled_at: string | null;
  next_poll_at: string | null;
  max_apify_calls_per_day: number;
  apify_calls_today: number;
  apify_calls_reset_at: string;
  results_per_page: number;
  apify_actor: string;
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Run discovery scan for enabled niches that are due for polling.
 *
 * @param opts.nicheKey - Scan only this niche (skip due-time check if provided)
 * @param opts.dryRun - Report what would happen without writing
 */
export async function runDiscoveryScan(opts?: {
  nicheKey?: string;
  dryRun?: boolean;
}): Promise<DiscoveryScanResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { db: { schema: 'public' }, auth: { persistSession: false } },
  );

  const result: DiscoveryScanResult = {
    niches_scanned: 0,
    total_videos_found: 0,
    total_fresh: 0,
    total_new: 0,
    total_predicted: 0,
    total_schedules: 0,
    apify_calls_made: 0,
    budget_limited_niches: [],
    errors: [],
    scan_details: [],
  };

  try {
    // Load configs
    let query = supabase.from('discovery_scan_config').select('*').eq('enabled', true);
    if (opts?.nicheKey) {
      query = supabase.from('discovery_scan_config').select('*').eq('niche_key', opts.nicheKey);
    }
    const { data: configs, error: cfgErr } = await query;

    if (cfgErr || !configs?.length) {
      if (cfgErr) result.errors.push(`Config fetch error: ${cfgErr.message}`);
      return result;
    }

    for (const config of configs as ScanConfig[]) {
      try {
        const detail = await scanNiche(supabase, config, opts?.dryRun ?? false);
        result.scan_details.push(detail);
        result.niches_scanned++;
        result.total_videos_found += detail.videos_found;
        result.total_fresh += detail.videos_fresh;
        result.total_new += detail.videos_new;
        result.total_predicted += detail.videos_predicted;
        result.total_schedules += detail.schedules_created;
        result.apify_calls_made += detail.apify_calls;
        if (detail.error) result.errors.push(`${config.niche_key}: ${detail.error}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`${config.niche_key}: ${msg}`);
      }
    }

    // Log to integration_job_runs for pipeline-status visibility
    if (!opts?.dryRun) {
      try {
        await supabase.from('integration_job_runs').upsert({
          job: 'discovery_scanner',
          last_run: new Date().toISOString(),
        });
      } catch {}
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Top-level error: ${msg}`);
  }

  console.log(
    `${LOG_PREFIX} Scan complete: ${result.niches_scanned} niches, ` +
    `${result.total_new} new videos, ${result.total_predicted} predicted, ` +
    `${result.total_schedules} schedules, ${result.apify_calls_made} Apify calls`
  );

  return result;
}

// =============================================================================
// Per-Niche Scan
// =============================================================================

async function scanNiche(
  supabase: SupabaseClient,
  config: ScanConfig,
  dryRun: boolean,
): Promise<ScanRunDetail> {
  const detail: ScanRunDetail = {
    niche_key: config.niche_key,
    scan_run_id: '',
    status: 'completed',
    videos_found: 0,
    videos_fresh: 0,
    videos_new: 0,
    videos_predicted: 0,
    schedules_created: 0,
    apify_calls: 0,
  };

  // ── Budget Check ──────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  let callsToday = config.apify_calls_today;

  // Reset daily counter if needed
  if (config.apify_calls_reset_at < today && !dryRun) {
    await supabase
      .from('discovery_scan_config')
      .update({ apify_calls_today: 0, apify_calls_reset_at: today })
      .eq('id', config.id);
    callsToday = 0;
  }

  if (callsToday >= config.max_apify_calls_per_day) {
    detail.status = 'completed';
    detail.error = `Budget limit reached (${callsToday}/${config.max_apify_calls_per_day} calls today)`;
    console.log(`${LOG_PREFIX} ${config.niche_key}: ${detail.error}`);
    return detail;
  }

  // ── Atomic Claim via next_poll_at ─────────────────────────────────────────
  // Prevents double-scan if two cron invocations race.
  // Only claim if next_poll_at is in the past (or null).
  if (!dryRun) {
    const now = new Date().toISOString();
    const nextPoll = new Date(Date.now() + config.poll_interval_minutes * 60000).toISOString();

    let claimQuery = supabase
      .from('discovery_scan_config')
      .update({
        next_poll_at: nextPoll,
        last_polled_at: now,
      })
      .eq('id', config.id)
      .eq('enabled', true);

    // If next_poll_at exists, only claim if it's due
    if (config.next_poll_at) {
      claimQuery = claimQuery.lte('next_poll_at', now);
    }

    const { data: claimed } = await claimQuery.select().single();

    if (!claimed) {
      detail.status = 'completed';
      detail.error = 'Skipped — not yet due or claimed by another instance';
      return detail;
    }
  }

  // ── Create scan run record ────────────────────────────────────────────────
  let scanRunId = 'dry-run';
  if (!dryRun) {
    const { data: scanRun } = await supabase
      .from('discovery_scan_runs')
      .insert({
        config_id: config.id,
        niche_key: config.niche_key,
        status: 'running',
        search_params: {
          search_mode: config.search_mode,
          hashtags: config.hashtags,
          search_queries: config.search_queries,
          max_age_minutes: config.max_age_minutes,
          min_hearts: config.min_hearts,
          min_views: config.min_views,
        },
      })
      .select('id')
      .single();
    scanRunId = scanRun?.id || 'unknown';
  }
  detail.scan_run_id = scanRunId;

  try {
    // ── Build search terms ────────────────────────────────────────────────────
    const searchTerms: string[] = [];

    if (config.search_mode === 'hashtag' || config.search_mode === 'both') {
      const hashtags = config.hashtags?.length
        ? config.hashtags
        : NICHE_HASHTAGS[config.niche_key] || [];
      searchTerms.push(...hashtags);
    }
    if (config.search_mode === 'search_query' || config.search_mode === 'both') {
      searchTerms.push(...(config.search_queries || []));
    }

    if (searchTerms.length === 0) {
      throw new Error('No hashtags or search queries configured');
    }

    // ── Call Apify (PAID actor) ───────────────────────────────────────────────
    const allItems: any[] = [];
    const remainingBudget = config.max_apify_calls_per_day - callsToday;
    const termsToSearch = searchTerms.slice(0, remainingBudget);

    for (const term of termsToSearch) {
      if (dryRun) {
        console.log(`${LOG_PREFIX} [DRY RUN] Would search: "${term}" for ${config.niche_key}`);
        detail.apify_calls++;
        continue;
      }

      try {
        console.log(`${LOG_PREFIX} Searching: "${term}" for ${config.niche_key}`);
        const items = await callApifyScraperSync(
          {
            hashtags: [term],
            resultsPerPage: config.results_per_page,
          },
          { actor: DISCOVERY_ACTOR, timeoutSecs: 120 },
        );
        allItems.push(...items);
        detail.apify_calls++;

        // Rate limit between calls
        if (termsToSearch.indexOf(term) < termsToSearch.length - 1) {
          await new Promise(r => setTimeout(r, INTER_CALL_DELAY_MS));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`${LOG_PREFIX} Apify call failed for "${term}": ${msg}`);
      }
    }

    if (dryRun) {
      detail.videos_found = 0;
      detail.error = `[DRY RUN] Would search ${termsToSearch.length} terms`;
      return detail;
    }

    detail.videos_found = allItems.length;

    // ── Update budget counter ─────────────────────────────────────────────────
    await supabase
      .from('discovery_scan_config')
      .update({ apify_calls_today: callsToday + detail.apify_calls })
      .eq('id', config.id);

    // ── Freshness Filter ──────────────────────────────────────────────────────
    const nowSecs = Date.now() / 1000;
    const maxAgeSecs = config.max_age_minutes * 60;
    const freshItems = allItems.filter((item: any) => {
      const createTime = item.createTime || item.createTimeISO
        ? new Date(item.createTimeISO || item.createTime * 1000).getTime() / 1000
        : 0;
      return createTime > 0 && (nowSecs - createTime) <= maxAgeSecs;
    });
    detail.videos_fresh = freshItems.length;

    // ── Engagement Filter ─────────────────────────────────────────────────────
    const filtered = freshItems.filter((item: any) => {
      const hearts = item.diggCount || item.stats?.diggCount || 0;
      const views = item.playCount || item.stats?.playCount || 0;
      if (config.min_hearts > 0 && hearts < config.min_hearts) return false;
      if (config.min_views > 0 && views < config.min_views) return false;
      return true;
    });

    // ── Deduplication ─────────────────────────────────────────────────────────
    const videoIds = filtered.map((item: any) => String(item.id)).filter(Boolean);
    let existingIds = new Set<string>();
    if (videoIds.length > 0) {
      const { data: existing } = await supabase
        .from('scraped_videos')
        .select('video_id')
        .in('video_id', videoIds);
      existingIds = new Set((existing || []).map((r: any) => r.video_id));
    }

    const newItems = filtered.filter((item: any) => !existingIds.has(String(item.id)));
    detail.videos_new = newItems.length;

    // ── Process Each New Video ────────────────────────────────────────────────
    // TEXT-ONLY PREDICTION LIMITATIONS (Discovery Scan):
    // - Pack V (Visual Rubric): returns stub — no visual analysis possible
    // - FFmpeg, audio-analyzer, visual-scene-detector, thumbnail-analyzer: all skip
    // - Pack 1/2 run with caption text only (often short, lower confidence)
    // - XGBoost runs with many missing features
    // - Initial predicted VPS will be low-confidence. This is EXPECTED.
    // - The real value is the metric collection at 4h/24h/48h/7d checkpoints,
    //   which measures ACTUAL performance regardless of prediction quality.

    for (const item of newItems) {
      try {
        const tiktokId = String(item.id);
        const authorName = item.authorMeta?.name || item.author?.uniqueId || '';
        const webVideoUrl = item.webVideoUrl ||
          (authorName && tiktokId ? `https://www.tiktok.com/@${authorName}/video/${tiktokId}` : '');

        if (!webVideoUrl) {
          console.warn(`${LOG_PREFIX} Skipping video without URL: ${tiktokId}`);
          continue;
        }

        // Build transcript from caption + subtitles
        let transcript = item.text || item.desc || '';
        if (Array.isArray(item.subtitles) && item.subtitles.length > 0) {
          const subtitleText = item.subtitles
            .map((s: any) => s.text || '')
            .filter(Boolean)
            .join(' ');
          if (subtitleText) {
            transcript = transcript ? `${transcript}\n\n${subtitleText}` : subtitleText;
          }
        }

        // Extract metrics (for scraped_videos record, NOT for prediction)
        const views = item.playCount || item.stats?.playCount || 0;
        const likes = item.diggCount || item.stats?.diggCount || 0;
        const comments = item.commentCount || item.stats?.commentCount || 0;
        const shares = item.shareCount || item.stats?.shareCount || 0;
        const saves = item.collectCount || item.stats?.collectCount || 0;
        const followers = item.authorMeta?.fans || item.author?.fans || 0;

        // 1. Insert into scraped_videos
        await supabase.from('scraped_videos').upsert({
          video_id: tiktokId,
          url: webVideoUrl,
          platform: 'tiktok',
          tiktok_id: tiktokId,
          creator_username: authorName,
          creator_nickname: item.authorMeta?.nickName || item.author?.nickname || null,
          creator_followers_count: followers,
          caption: item.text || item.desc || '',
          transcript_text: transcript || null,
          hashtags: (item.hashtags || []).map((h: any) => h.name || h.title || '').filter(Boolean),
          duration_seconds: item.videoMeta?.duration || item.video?.duration || null,
          views_count: views,
          likes_count: likes,
          comments_count: comments,
          shares_count: shares,
          saves_count: saves,
          niche: config.niche_key,
          source: 'discovery_scan',
          scraped_at: new Date().toISOString(),
        }, { onConflict: 'video_id' });

        // 2. Create video_files record
        const accountSizeBand = deriveAccountSizeBand(followers);
        const { data: videoRecord } = await supabase
          .from('video_files')
          .insert({
            storage_path: null,
            tiktok_url: webVideoUrl,
            niche: config.niche_key,
            goal: 'discover',
            account_size_band: accountSizeBand,
            platform: 'discovery_scan',
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (!videoRecord?.id) {
          console.warn(`${LOG_PREFIX} Failed to create video_files record for ${tiktokId}`);
          continue;
        }

        // 3. Run prediction pipeline (text-only)
        const pipelineResult = await runPredictionPipeline(videoRecord.id, {
          mode: 'standard',
          videoFilePath: null,
          transcript: transcript || null,
          niche: config.niche_key,
          goal: 'discover',
          accountSize: accountSizeBand,
          source: 'training_ingest',
          sourceMeta: {
            route: 'discovery_scan',
            discovery_scan_run_id: scanRunId,
            tiktok_url: webVideoUrl,
            tiktok_video_id: tiktokId,
            creator: authorName,
          },
        });

        if (pipelineResult?.success) {
          detail.videos_predicted++;

          // Update prediction_runs with discovery_scan_run_id
          await supabase
            .from('prediction_runs')
            .update({ discovery_scan_run_id: scanRunId })
            .eq('id', pipelineResult.run_id);

          // 4. Create metric schedules with REAL TikTok URL
          const schedCount = await createMetricSchedules(
            pipelineResult.run_id,
            videoRecord.id,
            { platformVideoId: webVideoUrl, source: 'discovery_scan' },
          );
          detail.schedules_created += schedCount;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`${LOG_PREFIX} Error processing video: ${msg}`);
      }
    }

    detail.status = 'completed';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    detail.status = 'failed';
    detail.error = msg;
    console.error(`${LOG_PREFIX} Niche ${config.niche_key} scan failed: ${msg}`);
  }

  // ── Update scan run record ──────────────────────────────────────────────────
  if (!dryRun && scanRunId !== 'dry-run' && scanRunId !== 'unknown') {
    await supabase
      .from('discovery_scan_runs')
      .update({
        status: detail.status,
        completed_at: new Date().toISOString(),
        videos_found: detail.videos_found,
        videos_fresh: detail.videos_fresh,
        videos_new: detail.videos_new,
        videos_predicted: detail.videos_predicted,
        schedules_created: detail.schedules_created,
        apify_calls_made: detail.apify_calls,
        error_message: detail.error || null,
      })
      .eq('id', scanRunId);
  }

  console.log(
    `${LOG_PREFIX} ${config.niche_key}: found=${detail.videos_found} fresh=${detail.videos_fresh} ` +
    `new=${detail.videos_new} predicted=${detail.videos_predicted} schedules=${detail.schedules_created}`
  );

  return detail;
}

// =============================================================================
// Helpers
// =============================================================================

function deriveAccountSizeBand(followers: number): string {
  if (followers >= 1_000_000) return 'mega (1M+)';
  if (followers >= 100_000) return 'large (100K-1M)';
  if (followers >= 10_000) return 'established (10K-100K)';
  if (followers >= 1_000) return 'growing (1K-10K)';
  return 'small (0-1K)';
}

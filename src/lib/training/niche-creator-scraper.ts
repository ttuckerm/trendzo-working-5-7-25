/**
 * @deprecated Replaced by fresh-video-scanner.ts (Discovery Scanner) as of 2026-03-05.
 * This scraper burned Apify budget with no usable training data — it scraped random
 * top creators across 20 niches instead of tracking freshly-posted individual videos.
 * DO NOT re-enable. Use the Command Center dashboard to manage discovery scans.
 * NICHE_HASHTAGS has been moved to src/lib/prediction/system-registry.ts.
 *
 * Original description:
 * Niche Creator Scraper — Pre-scrape top creators per niche for training data matching.
 * Uses Apify TikTok scraper with searchQueries to find niche-related content,
 * then aggregates creator metrics to identify the top performers.
 */

import { createClient } from '@supabase/supabase-js';
import { callApifyScraperSync } from '@/lib/services/apify-tiktok-client';
import { NICHE_REGISTRY, getNicheByKey } from '@/lib/prediction/system-registry';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// The paid scraper supports hashtags param and returns 20+ results per query
const PAID_ACTOR = 'clockworks~tiktok-scraper';
const INTER_CALL_DELAY_MS = 2500;
const DEFAULT_MAX_CREATORS = 20;
const DEFAULT_MAX_VIDEOS_PER_HASHTAG = 50;
const MAX_VIDEO_IDS_PER_CREATOR = 10;
const LOG_PREFIX = '[NicheCreatorScraper]';

// ---------------------------------------------------------------------------
// Niche-to-Hashtags Mapping
// ---------------------------------------------------------------------------

export const NICHE_HASHTAGS: Record<string, string[]> = {
  'side-hustles':     ['sidehustle', 'makemoneyonline', 'sidehustleideas'],
  'personal-finance': ['personalfinance', 'investing101', 'moneytips'],
  'fitness':          ['fitness', 'gymtok', 'homeworkout'],
  'business':         ['entrepreneur', 'smallbusiness', 'businesstips'],
  'food-nutrition':   ['foodtok', 'nutrition', 'healthyfood'],
  'beauty':           ['beautytok', 'skincare', 'makeuptutorial'],
  'real-estate':      ['realestate', 'realestateinvesting', 'homebuying'],
  'self-improvement': ['selfimprovement', 'productivity', 'growthmindset'],
  'dating':           ['datingadvice', 'relationships', 'datingtips'],
  'education':        ['studytok', 'studytips', 'learnontiktok'],
  'career':           ['careertips', 'jobsearch', 'careeradvice'],
  'parenting':        ['parentingtips', 'momtok', 'parentinghacks'],
  'tech':             ['techtok', 'techreview', 'techtips'],
  'fashion':          ['fashiontok', 'ootd', 'styletips'],
  'health':           ['healthtips', 'mentalhealth', 'wellness'],
  'cooking':          ['cookingtok', 'recipe', 'easyrecipe'],
  'psychology':       ['psychologyfacts', 'therapytok', 'psychologytips'],
  'travel':           ['traveltok', 'travelguide', 'budgettravel'],
  'diy':              ['diy', 'homeimprovement', 'diycrafts'],
  'language':         ['languagelearning', 'learnenglish', 'polyglot'],
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NicheCreatorScrapeOpts {
  niches?: string[];
  maxCreatorsPerNiche?: number;
  maxVideosPerHashtag?: number;
  dryRun?: boolean;
}

export interface NicheCreatorScrapeResult {
  processed_niches: number;
  total_creators_found: number;
  total_creators_stored: number;
  total_apify_calls: number;
  errors: string[];
  niche_results: NicheScrapeDetail[];
}

interface NicheScrapeDetail {
  niche_key: string;
  hashtags_searched: string[];
  videos_found: number;
  unique_creators: number;
  creators_stored: number;
  errors: string[];
}

interface CreatorAggregate {
  username: string;
  follower_count: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  video_count: number;
  video_ids: string[];
  raw_author_meta: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ---------------------------------------------------------------------------
// Core Logic
// ---------------------------------------------------------------------------

/**
 * Scrape top creators for the specified niches (or all 20 niches).
 * For each niche, searches related hashtags via Apify, aggregates creator
 * metrics, and stores the top N creators in `niche_top_creators`.
 */
export async function scrapeNicheCreators(
  opts?: NicheCreatorScrapeOpts
): Promise<NicheCreatorScrapeResult> {
  const maxCreators = opts?.maxCreatorsPerNiche ?? DEFAULT_MAX_CREATORS;
  const maxVideos = opts?.maxVideosPerHashtag ?? DEFAULT_MAX_VIDEOS_PER_HASHTAG;
  const dryRun = opts?.dryRun ?? false;

  // Determine which niches to process
  const nicheKeys = opts?.niches?.length
    ? opts.niches.filter(k => {
        const found = getNicheByKey(k);
        if (!found) console.warn(`${LOG_PREFIX} Unknown niche key: ${k}, skipping`);
        return !!found;
      })
    : NICHE_REGISTRY.map(n => n.key);

  console.log(`${LOG_PREFIX} Starting scrape for ${nicheKeys.length} niches (dryRun=${dryRun}, maxCreators=${maxCreators}, maxVideos=${maxVideos})`);

  const result: NicheCreatorScrapeResult = {
    processed_niches: 0,
    total_creators_found: 0,
    total_creators_stored: 0,
    total_apify_calls: 0,
    errors: [],
    niche_results: [],
  };

  const supabase = dryRun ? null : getSupabase();

  for (const nicheKey of nicheKeys) {
    const nicheDetail = await scrapeOneNiche(nicheKey, {
      maxCreators,
      maxVideos,
      dryRun,
      supabase,
      callCounter: result,
    });
    result.niche_results.push(nicheDetail);
    result.processed_niches++;
    result.total_creators_found += nicheDetail.unique_creators;
    result.total_creators_stored += nicheDetail.creators_stored;
    if (nicheDetail.errors.length) {
      result.errors.push(...nicheDetail.errors.map(e => `[${nicheKey}] ${e}`));
    }
  }

  console.log(
    `${LOG_PREFIX} Complete: ${result.processed_niches} niches, ` +
    `${result.total_creators_found} creators found, ` +
    `${result.total_creators_stored} stored, ` +
    `${result.total_apify_calls} API calls, ` +
    `${result.errors.length} errors`
  );

  return result;
}

async function scrapeOneNiche(
  nicheKey: string,
  ctx: {
    maxCreators: number;
    maxVideos: number;
    dryRun: boolean;
    supabase: ReturnType<typeof getSupabase> | null;
    callCounter: { total_apify_calls: number };
  }
): Promise<NicheScrapeDetail> {
  const hashtags = NICHE_HASHTAGS[nicheKey];
  const detail: NicheScrapeDetail = {
    niche_key: nicheKey,
    hashtags_searched: [],
    videos_found: 0,
    unique_creators: 0,
    creators_stored: 0,
    errors: [],
  };

  if (!hashtags || hashtags.length === 0) {
    detail.errors.push('No hashtags mapped for this niche');
    console.warn(`${LOG_PREFIX} No hashtags for niche: ${nicheKey}`);
    return detail;
  }

  // Step 1: Fetch videos for each hashtag
  const allItems: any[] = [];

  for (const hashtag of hashtags) {
    try {
      console.log(`${LOG_PREFIX} [${nicheKey}] Searching hashtag: #${hashtag}`);

      const items = await callApifyScraperSync(
        { hashtags: [hashtag], resultsPerPage: ctx.maxVideos },
        { actor: PAID_ACTOR, timeoutSecs: 120 }
      );

      ctx.callCounter.total_apify_calls++;
      detail.hashtags_searched.push(hashtag);
      allItems.push(...items);
      detail.videos_found += items.length;

      console.log(`${LOG_PREFIX} [${nicheKey}] #${hashtag}: ${items.length} videos`);
    } catch (err: any) {
      const msg = `Hashtag #${hashtag} failed: ${err.message}`;
      detail.errors.push(msg);
      console.error(`${LOG_PREFIX} [${nicheKey}] ${msg}`);
    }

    // Rate limit between calls
    await sleep(INTER_CALL_DELAY_MS);
  }

  if (allItems.length === 0) {
    detail.errors.push('No videos found across all hashtags');
    return detail;
  }

  // Step 2: Aggregate by creator
  const creatorMap = new Map<string, CreatorAggregate>();

  for (const item of allItems) {
    const authorMeta = item.authorMeta || {};
    const stats = item.stats || {};
    const username = authorMeta.name || authorMeta.nickName;
    if (!username) continue;

    const videoId = String(item.id || '');
    const views = stats.playCount ?? item.playCount ?? 0;
    const likes = stats.diggCount ?? item.diggCount ?? 0;
    const comments = stats.commentCount ?? item.commentCount ?? 0;
    const shares = stats.shareCount ?? item.shareCount ?? 0;
    const followers = authorMeta.fans ?? 0;

    let agg = creatorMap.get(username);
    if (!agg) {
      agg = {
        username,
        follower_count: followers,
        total_views: 0,
        total_likes: 0,
        total_comments: 0,
        total_shares: 0,
        video_count: 0,
        video_ids: [],
        raw_author_meta: authorMeta,
      };
      creatorMap.set(username, agg);
    }

    agg.total_views += views;
    agg.total_likes += likes;
    agg.total_comments += comments;
    agg.total_shares += shares;
    agg.video_count++;
    if (agg.video_ids.length < MAX_VIDEO_IDS_PER_CREATOR && videoId) {
      agg.video_ids.push(videoId);
    }
    // Keep max follower count (may vary between items)
    if (followers > agg.follower_count) {
      agg.follower_count = followers;
    }
  }

  detail.unique_creators = creatorMap.size;
  console.log(`${LOG_PREFIX} [${nicheKey}] ${creatorMap.size} unique creators from ${allItems.length} videos`);

  // Step 3: Rank and select top N
  // Hashtag scrapes may not include view/engagement stats, so we rank by:
  //   - Follower count (primary signal of established creator)
  //   - Video count in results (appears in multiple hashtag results = more relevant)
  const ranked = Array.from(creatorMap.values())
    .filter(c => c.follower_count > 0)
    .map(c => {
      const hasViews = c.total_views > 0;
      return {
        ...c,
        avg_views: hasViews ? Math.round(c.total_views / c.video_count) : 0,
        avg_engagement_rate: hasViews
          ? (c.total_likes + c.total_comments + c.total_shares) / c.total_views
          : 0,
      };
    })
    .sort((a, b) => {
      // If we have engagement data, use it; otherwise rank by followers + appearances
      if (a.avg_engagement_rate > 0 && b.avg_engagement_rate > 0) {
        return b.avg_engagement_rate - a.avg_engagement_rate;
      }
      // Weight: follower count + bonus for appearing in multiple hashtag results
      const scoreA = a.follower_count + a.video_count * 100000;
      const scoreB = b.follower_count + b.video_count * 100000;
      return scoreB - scoreA;
    })
    .slice(0, ctx.maxCreators);

  if (ranked.length === 0) {
    detail.errors.push('No creators with followers found');
    return detail;
  }

  // Step 4: Upsert to database
  if (ctx.dryRun) {
    detail.creators_stored = ranked.length;
    console.log(`${LOG_PREFIX} [${nicheKey}] DRY RUN: would store ${ranked.length} creators`);
    return detail;
  }

  const now = new Date().toISOString();
  const rows = ranked.map(c => ({
    niche_key: nicheKey,
    creator_username: c.username,
    platform: 'tiktok',
    follower_count: c.follower_count,
    avg_views: c.avg_views,
    avg_engagement_rate: c.avg_engagement_rate,
    top_video_ids: c.video_ids,
    sample_video_count: c.video_count,
    last_scraped_at: now,
    raw_profile_data: c.raw_author_meta,
  }));

  const { error } = await ctx.supabase!
    .from('niche_top_creators')
    .upsert(rows, { onConflict: 'niche_key,creator_username,platform' });

  if (error) {
    const msg = `DB upsert failed: ${error.message}`;
    detail.errors.push(msg);
    console.error(`${LOG_PREFIX} [${nicheKey}] ${msg}`);
  } else {
    detail.creators_stored = ranked.length;
    console.log(`${LOG_PREFIX} [${nicheKey}] Stored ${ranked.length} creators`);
  }

  return detail;
}

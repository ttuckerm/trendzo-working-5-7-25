/**
 * TikTok Channel Verification Service
 *
 * Uses Apify free TikTok scraper to fetch a creator's profile data,
 * aggregate metrics from recent videos, and infer their content niche.
 */

import { callApifyScraperSync, getApifyToken } from '@/lib/services/apify-tiktok-client';
import { getNicheByKey, NICHE_HASHTAGS } from '@/lib/prediction/system-registry';
import { analyzeDeliveryBaseline, type DeliveryBaseline } from './delivery-analyzer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChannelVerificationResult {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followerCount: number | null;
  followingCount: number | null;
  videoCount: number | null;
  recentVideoCount: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgEngagementRate: number;
  inferredNicheKey: string | null;
  inferredNicheLabel: string | null;
  inferredNicheConfidence: number;
  topHashtags: string[];
  accountSizeBand: string;
  region: string | null;
  rawAuthorMeta: Record<string, unknown> | null;
  deliveryBaseline: DeliveryBaseline | null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Verify a TikTok channel by scraping recent videos via Apify.
 * Returns aggregated channel metrics and inferred niche.
 */
export async function verifyTikTokChannel(
  rawInput: string
): Promise<ChannelVerificationResult> {
  const token = getApifyToken();
  if (!token) {
    throw new Error('Channel verification is temporarily unavailable (no API token configured)');
  }

  const username = sanitizeTikTokUsername(rawInput);
  if (!username) {
    throw new Error('Please enter a valid TikTok username or profile URL');
  }

  const profileUrl = `https://www.tiktok.com/@${username}`;
  console.log(`[ChannelVerifier] Verifying channel: ${profileUrl}`);

  let items: any[];
  try {
    items = await callApifyScraperSync(
      {
        profiles: [username],
        resultsPerPage: 10,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        shouldDownloadSubtitles: false,
      },
      { timeoutSecs: 60 }
    );
  } catch (err: any) {
    console.error('[ChannelVerifier] Apify call failed:', err.message);
    throw new Error(`Could not fetch TikTok profile for @${username}. Please check the username and try again.`);
  }

  if (!items || items.length === 0) {
    throw new Error(`Could not find TikTok account @${username}. Check the username and try again.`);
  }

  // Extract author meta from first video
  const firstItem = items[0];
  const authorMeta = firstItem.authorMeta || firstItem.author || {};

  const followerCount = authorMeta.fans ?? authorMeta.followers ?? null;
  const followingCount = authorMeta.following ?? null;
  const videoCountFromProfile = authorMeta.video ?? authorMeta.videoCount ?? null;

  // Aggregate metrics from all returned videos
  const videoStats = items
    .map((item: any) => {
      const stats = item.stats || item.videoMeta || {};
      return {
        views: stats.playCount ?? stats.viewCount ?? item.playCount ?? 0,
        likes: stats.diggCount ?? stats.likeCount ?? item.diggCount ?? 0,
        comments: stats.commentCount ?? item.commentCount ?? 0,
        shares: stats.shareCount ?? item.shareCount ?? 0,
      };
    })
    .filter((s: any) => s.views > 0);

  const recentVideoCount = videoStats.length;
  const totalViews = videoStats.reduce((sum: number, s: any) => sum + s.views, 0);
  const totalLikes = videoStats.reduce((sum: number, s: any) => sum + s.likes, 0);
  const totalComments = videoStats.reduce((sum: number, s: any) => sum + s.comments, 0);
  const totalShares = videoStats.reduce((sum: number, s: any) => sum + s.shares, 0);

  const avgViews = recentVideoCount > 0 ? Math.round(totalViews / recentVideoCount) : 0;
  const avgLikes = recentVideoCount > 0 ? Math.round(totalLikes / recentVideoCount) : 0;
  const avgComments = recentVideoCount > 0 ? Math.round(totalComments / recentVideoCount) : 0;
  const avgEngagementRate = totalViews > 0
    ? Number(((totalLikes + totalComments + totalShares) / totalViews).toFixed(4))
    : 0;

  // Infer niche from hashtags
  const { nicheKey, confidence, topHashtags } = inferNicheFromHashtags(items);
  const nicheEntry = nicheKey ? getNicheByKey(nicheKey) : null;

  // Select top 2-3 videos by views for delivery analysis
  const sortedByViews = [...items]
    .map((item: any) => ({
      url: item.videoUrl || item.video?.downloadAddr || item.video?.playAddr || null,
      views: item.stats?.playCount ?? item.playCount ?? 0,
    }))
    .filter(v => v.url)
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  let deliveryBaseline: DeliveryBaseline | null = null;
  if (sortedByViews.length > 0) {
    try {
      deliveryBaseline = await analyzeDeliveryBaseline(sortedByViews.map(v => v.url));
    } catch (err: any) {
      console.warn(`[ChannelVerifier] Delivery analysis failed (non-blocking): ${err.message}`);
    }
  }

  // Extract region from Apify author metadata (country code, e.g. "US", "GB")
  const region: string | null = authorMeta.region ?? authorMeta.country ?? null;

  console.log(`[ChannelVerifier] @${username}: ${followerCount} followers, ${recentVideoCount} recent videos, niche=${nicheKey} (${(confidence * 100).toFixed(0)}%), region=${region ?? 'unknown'}, delivery=${deliveryBaseline ? 'analyzed' : 'skipped'}`);

  return {
    username,
    displayName: authorMeta.nickName ?? authorMeta.nickname ?? authorMeta.name ?? null,
    avatarUrl: authorMeta.avatar ?? authorMeta.avatarThumb ?? null,
    bio: authorMeta.signature ?? null,
    followerCount,
    followingCount,
    videoCount: videoCountFromProfile,
    recentVideoCount,
    avgViews,
    avgLikes,
    avgComments,
    avgEngagementRate,
    inferredNicheKey: nicheKey,
    inferredNicheLabel: nicheEntry?.label ?? null,
    inferredNicheConfidence: confidence,
    topHashtags,
    accountSizeBand: followerCountToAccountSizeBand(followerCount),
    region,
    rawAuthorMeta: authorMeta,
    deliveryBaseline,
  };
}

// ---------------------------------------------------------------------------
// Niche Inference
// ---------------------------------------------------------------------------

function inferNicheFromHashtags(
  items: any[]
): { nicheKey: string | null; confidence: number; topHashtags: string[] } {
  // Collect all hashtags across videos
  const hashtagFreq: Record<string, number> = {};
  for (const item of items) {
    const hashtags: any[] = item.hashtags || item.challenges || [];
    for (const tag of hashtags) {
      const name = (typeof tag === 'string' ? tag : tag.name || tag.title || '').toLowerCase().replace('#', '');
      if (name) {
        hashtagFreq[name] = (hashtagFreq[name] || 0) + 1;
      }
    }
  }

  if (Object.keys(hashtagFreq).length === 0) {
    return { nicheKey: null, confidence: 0, topHashtags: [] };
  }

  // Score each niche by how many of its target hashtags appear
  const nicheScores: Record<string, number> = {};
  let maxScore = 0;
  let bestNiche: string | null = null;

  for (const [nicheKey, targetHashtags] of Object.entries(NICHE_HASHTAGS)) {
    let score = 0;
    for (const tag of targetHashtags) {
      const tagLower = tag.toLowerCase();
      if (hashtagFreq[tagLower]) {
        score += hashtagFreq[tagLower];
      }
    }
    nicheScores[nicheKey] = score;
    if (score > maxScore) {
      maxScore = score;
      bestNiche = nicheKey;
    }
  }

  // Confidence: ratio of best score to total hashtag count
  const totalHashtagCount = Object.values(hashtagFreq).reduce((a, b) => a + b, 0);
  const confidence = totalHashtagCount > 0 ? Math.min(maxScore / totalHashtagCount, 1) : 0;

  // Top hashtags by frequency (max 10)
  const topHashtags = Object.entries(hashtagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  return {
    nicheKey: maxScore > 0 ? bestNiche : null,
    confidence,
    topHashtags,
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function followerCountToAccountSizeBand(followers: number | null): string {
  if (followers == null) return 'small (0-10K)';
  if (followers >= 1_000_000) return 'mega (1M+)';
  if (followers >= 100_000) return 'large (100K-1M)';
  if (followers >= 10_000) return 'medium (10K-100K)';
  return 'small (0-10K)';
}

export function sanitizeTikTokUsername(input: string): string | null {
  if (!input) return null;

  let cleaned = input.trim();

  // Handle full TikTok URLs
  const urlMatch = cleaned.match(/tiktok\.com\/@([a-zA-Z0-9_.]+)/);
  if (urlMatch) return urlMatch[1];

  // Handle short URLs (vm.tiktok.com) — can't extract username, return null
  if (cleaned.includes('vm.tiktok.com')) return null;

  // Strip @ prefix
  if (cleaned.startsWith('@')) cleaned = cleaned.slice(1);

  // Validate: TikTok usernames are alphanumeric + underscores + dots, 1-24 chars
  if (/^[a-zA-Z0-9_.]{1,24}$/.test(cleaned)) return cleaned;

  return null;
}

export function formatFollowerCount(count: number | null): string {
  if (count == null) return '0';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

/**
 * Apify Integration Service
 *
 * Handles all interactions with Apify API for scraping TikTok videos.
 * Uses the TikTok Scraper actor to fetch fresh videos from creators and hashtags.
 */

import { ApifyClient } from 'apify-client';

const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';
const TIKTOK_SCRAPER_ACTOR_ID = 'clockworks/tiktok-scraper';

if (!APIFY_TOKEN) {
  console.warn('⚠️  APIFY_API_TOKEN not set - Apify scraping will not work');
}

const client = new ApifyClient({ token: APIFY_TOKEN });

// ============================================================================
// TYPES
// ============================================================================

export interface ApifyScrapingInput {
  profiles?: string[];  // List of @usernames
  hashtags?: string[];  // List of #hashtags
  resultsPerPage?: number;
  maxRequestsPerCrawl?: number;
  shouldDownloadVideos?: boolean;
  shouldDownloadCovers?: boolean;
  shouldDownloadSubtitles?: boolean;
  shouldDownloadSlideshowImages?: boolean;
}

export interface ApifyVideoResult {
  id: string;
  text: string;
  createTime: number;
  createTimeISO: string;
  authorMeta: {
    id: string;
    name: string;
    nickName: string;
    verified: boolean;
    signature: string;
    avatar: string;
    fans: number;
  };
  musicMeta: {
    musicId: string;
    musicName: string;
    musicAuthor: string;
  };
  videoMeta: {
    height: number;
    width: number;
    duration: number;
    coverUrl: string;
    downloadAddr: string;
    format: string;
  };
  diggCount: number;
  shareCount: number;
  playCount: number;
  commentCount: number;
  hashtags: Array<{
    id: string;
    name: string;
    title: string;
  }>;
  webVideoUrl: string;
  videoUrl: string;
}

// ============================================================================
// APIFY CLIENT
// ============================================================================

export class ApifyIntegration {
  private client: ApifyClient;

  constructor() {
    this.client = client;
  }

  /**
   * Scrape videos from specific TikTok profiles
   *
   * @param usernames - List of @usernames to scrape (without @)
   * @param maxResults - Max videos per profile
   */
  async scrapeProfiles(
    usernames: string[],
    maxResults: number = 10
  ): Promise<ApifyVideoResult[]> {
    console.log(`📥 Scraping ${usernames.length} TikTok profiles...`);

    const input: ApifyScrapingInput = {
      profiles: usernames.map(u => `https://www.tiktok.com/@${u}`),
      resultsPerPage: maxResults,
      maxRequestsPerCrawl: usernames.length * 2,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSubtitles: true,
      shouldDownloadSlideshowImages: false
    };

    try {
      // Run the actor
      const run = await this.client.actor(TIKTOK_SCRAPER_ACTOR_ID).call(input);

      // Fetch results
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

      console.log(`   ✅ Scraped ${items.length} videos`);
      return items as ApifyVideoResult[];

    } catch (error) {
      console.error('   ❌ Apify scraping error:', error);
      throw error;
    }
  }

  /**
   * Scrape videos from specific hashtags
   *
   * @param hashtags - List of hashtags to scrape (without #)
   * @param maxResults - Max videos per hashtag
   */
  async scrapeHashtags(
    hashtags: string[],
    maxResults: number = 10
  ): Promise<ApifyVideoResult[]> {
    console.log(`📥 Scraping ${hashtags.length} TikTok hashtags...`);

    const input: ApifyScrapingInput = {
      hashtags: hashtags.map(h => `#${h}`),
      resultsPerPage: maxResults,
      maxRequestsPerCrawl: hashtags.length * 2,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSubtitles: true,
      shouldDownloadSlideshowImages: false
    };

    try {
      // Run the actor
      const run = await this.client.actor(TIKTOK_SCRAPER_ACTOR_ID).call(input);

      // Fetch results
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

      console.log(`   ✅ Scraped ${items.length} videos`);
      return items as ApifyVideoResult[];

    } catch (error) {
      console.error('   ❌ Apify scraping error:', error);
      throw error;
    }
  }

  /**
   * Get fresh video metrics (re-scrape a specific video)
   *
   * @param videoId - TikTok video ID
   */
  async getVideoMetrics(videoId: string): Promise<ApifyVideoResult | null> {
    console.log(`📥 Fetching metrics for video ${videoId}...`);

    const input: ApifyScrapingInput = {
      profiles: [`https://www.tiktok.com/@placeholder/video/${videoId}`],
      resultsPerPage: 1,
      maxRequestsPerCrawl: 1,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSubtitles: false,
      shouldDownloadSlideshowImages: false
    };

    try {
      // Run the actor
      const run = await this.client.actor(TIKTOK_SCRAPER_ACTOR_ID).call(input);

      // Fetch results
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

      if (items.length === 0) {
        console.log(`   ⚠️  Video ${videoId} not found`);
        return null;
      }

      console.log(`   ✅ Fetched metrics for ${videoId}`);
      return items[0] as ApifyVideoResult;

    } catch (error) {
      console.error('   ❌ Apify fetch error:', error);
      return null;
    }
  }

  /**
   * Filter videos by freshness
   *
   * @param videos - List of scraped videos
   * @param maxAgeMinutes - Maximum age in minutes
   */
  filterFreshVideos(
    videos: ApifyVideoResult[],
    maxAgeMinutes: number
  ): ApifyVideoResult[] {
    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    return videos.filter(video => {
      const videoAge = now - (video.createTime * 1000);
      return videoAge <= maxAgeMs;
    });
  }

  /**
   * Filter videos by view count range
   *
   * @param videos - List of scraped videos
   * @param minViews - Minimum views
   * @param maxViews - Maximum views
   */
  filterByViews(
    videos: ApifyVideoResult[],
    minViews: number,
    maxViews: number
  ): ApifyVideoResult[] {
    return videos.filter(video => {
      return video.playCount >= minViews && video.playCount <= maxViews;
    });
  }

  /**
   * Filter videos by duration
   *
   * @param videos - List of scraped videos
   * @param minDuration - Minimum duration in seconds
   * @param maxDuration - Maximum duration in seconds
   */
  filterByDuration(
    videos: ApifyVideoResult[],
    minDuration: number,
    maxDuration: number
  ): ApifyVideoResult[] {
    return videos.filter(video => {
      return video.videoMeta.duration >= minDuration &&
             video.videoMeta.duration <= maxDuration;
    });
  }

  /**
   * Convert Apify result to our FreshVideo format
   */
  convertToFreshVideo(video: ApifyVideoResult) {
    const now = new Date();
    const publishedAt = new Date(video.createTime * 1000);
    const ageMinutes = (now.getTime() - publishedAt.getTime()) / (1000 * 60);

    return {
      videoId: video.id,
      url: video.webVideoUrl,
      platform: 'tiktok' as const,
      creatorUsername: video.authorMeta.name,
      creatorFollowers: video.authorMeta.fans,

      // Metadata
      title: undefined,
      caption: video.text,
      hashtags: video.hashtags.map(h => h.name),
      soundId: video.musicMeta.musicId,
      duration: video.videoMeta.duration,

      // Timestamps
      publishedAt,
      scrapedAt: now,
      ageMinutes,

      // Initial metrics
      initialViews: video.playCount,
      initialLikes: video.diggCount,
      initialComments: video.commentCount,
      initialShares: video.shareCount,

      // Content
      transcript: undefined, // Will be extracted from subtitles
      thumbnailUrl: video.videoMeta.coverUrl,
      videoUrl: video.videoUrl
    };
  }
}

// Singleton export
export const apifyIntegration = new ApifyIntegration();

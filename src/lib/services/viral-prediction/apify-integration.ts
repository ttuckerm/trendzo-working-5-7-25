/**
 * Apify TikTok Integration Service
 * Handles scraping TikTok data through Apify API for real-time viral prediction
 */

import { createClient } from '@supabase/supabase-js';

interface ApifyTikTokData {
  id: string;
  webVideoUrl: string;
  text: string;
  authorMeta: {
    id: string;
    name: string;
    nickName: string;
    followerCount: number;
    followingCount: number;
  };
  stats: {
    diggCount: number;
    shareCount: number;
    commentCount: number;
    playCount: number;
  };
  musicMeta?: {
    musicId: string;
    musicName: string;
    musicAuthor: string;
  };
  hashtags: Array<{
    id: string;
    name: string;
    title: string;
  }>;
  createTime: string;
  videoDuration: number;
  covers: {
    default: string;
    origin: string;
    dynamic: string;
  };
}

interface ProcessedVideoData {
  id: string;
  tiktok_id: string;
  url: string;
  author: string;
  description: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  duration: number;
  upload_date: string;
  hashtags: string[];
  music_id?: string;
  engagement_rate: number;
  niche?: string;
  creator_username: string;
  creator_followers: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  caption: string;
  upload_timestamp: string;
  duration_seconds: number;
}

export class ApifyTikTokIntegration {
  private apifyToken: string;
  private supabase: any;

  constructor() {
    this.apifyToken = process.env.APIFY_API_TOKEN || '';
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  /**
   * Scrape a single TikTok video using Apify
   */
  async scrapeTikTokVideo(url: string): Promise<ApifyTikTokData | null> {
    if (!this.apifyToken) {
      console.warn('⚠️ Apify API token not configured, using fallback');
      return null;
    }

    try {
      console.log('🔍 Starting Apify TikTok scrape for:', url);

      const response = await fetch('https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper/run-sync-get-dataset-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apifyToken}`,
        },
        body: JSON.stringify({
          startUrls: [{ url }],
          resultsPerPage: 1,
          shouldDownloadVideos: false,
          shouldDownloadCovers: false,
          shouldDownloadSlideshow: false,
          shouldDownloadSubtitles: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Apify API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        console.log('✅ Successfully scraped TikTok data');
        try {
          const first = data[0];
          const subs: Array<any> = first?.subtitles || []
          const { upsertTranscript } = await import('@/lib/transcripts/store')
          if (Array.isArray(subs) && subs.length) {
            for (const s of subs) {
              await upsertTranscript({ video_id: String(first.id), lang: String(s.language || s.lang || ''), text: String(s.text || ''), source: 'apify' })
            }
          } else {
            await upsertTranscript({ video_id: String(first.id), lang: null, text: null, source: 'apify' })
          }
        } catch {}
        return data[0];
      }

      console.log('⚠️ No data returned from Apify');
      return null;

    } catch (error) {
      console.error('❌ Apify scraping failed:', error);
      return null;
    }
  }

  /**
   * Scrape multiple TikTok videos in batch
   */
  async scrapeTikTokBatch(urls: string[], maxResults: number = 50): Promise<ApifyTikTokData[]> {
    if (!this.apifyToken) {
      console.warn('⚠️ Apify API token not configured, using fallback');
      return [];
    }

    try {
      console.log(`🔍 Starting Apify batch scrape for ${urls.length} URLs`);

      const startUrls = urls.slice(0, maxResults).map(url => ({ url }));

      const response = await fetch('https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper/run-sync-get-dataset-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apifyToken}`,
        },
        body: JSON.stringify({
          startUrls,
          resultsPerPage: maxResults,
          shouldDownloadVideos: false,
          shouldDownloadCovers: false,
          shouldDownloadSlideshow: false,
          shouldDownloadSubtitles: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Apify API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      try {
        const { upsertTranscript } = await import('@/lib/transcripts/store')
        if (Array.isArray(data)) {
          for (const v of data) {
            const subs: Array<any> = v?.subtitles || []
            if (Array.isArray(subs) && subs.length) {
              for (const s of subs) {
                await upsertTranscript({ video_id: String(v.id), lang: String(s.language || s.lang || ''), text: String(s.text || ''), source: 'apify' })
              }
            } else {
              await upsertTranscript({ video_id: String(v.id), lang: null, text: null, source: 'apify' })
            }
          }
        }
      } catch {}
      console.log(`✅ Successfully scraped ${data.length} TikTok videos`);
      return data || [];

    } catch (error) {
      console.error('❌ Apify batch scraping failed:', error);
      return [];
    }
  }

  /**
   * Scrape trending TikTok content for a specific niche
   */
  async scrapeTrendingContent(niche: string, count: number = 100): Promise<ApifyTikTokData[]> {
    if (!this.apifyToken) {
      console.warn('⚠️ Apify API token not configured, using fallback');
      return [];
    }

    try {
      console.log(`🔍 Scraping trending ${niche} content (${count} videos)`);

      // Use hashtag search for niche-specific content
      const hashtags = this.getNicheHashtags(niche);
      const searchQueries = hashtags.map(tag => `#${tag}`);

      const response = await fetch('https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper/run-sync-get-dataset-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apifyToken}`,
        },
        body: JSON.stringify({
          searchQueries,
          resultsPerPage: count,
          shouldDownloadVideos: false,
          shouldDownloadCovers: false,
          shouldDownloadSlideshow: false,
          shouldDownloadSubtitles: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Apify API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Successfully scraped ${data.length} trending ${niche} videos`);
      return data || [];

    } catch (error) {
      console.error('❌ Apify trending scraping failed:', error);
      return [];
    }
  }

  /**
   * Process and store Apify data in our database
   */
  async processAndStoreVideo(apifyData: ApifyTikTokData): Promise<string | null> {
    try {
      const processedData = this.transformApifyData(apifyData);
      
      // Store in database
      const { data, error } = await this.supabase
        .from('videos')
        .upsert(processedData, { onConflict: 'tiktok_id' })
        .select()
        .single();

      if (error) {
        console.error('Database storage error:', error);
        return null;
      }

      console.log('✅ Video data stored with ID:', data.id);
      return data.id;

    } catch (error) {
      console.error('❌ Failed to process and store video:', error);
      return null;
    }
  }

  /**
   * Process and store multiple videos from Apify batch
   */
  async processAndStoreBatch(apifyDataArray: ApifyTikTokData[]): Promise<string[]> {
    const processedIds: string[] = [];

    for (const apifyData of apifyDataArray) {
      const videoId = await this.processAndStoreVideo(apifyData);
      if (videoId) {
        processedIds.push(videoId);
      }
    }

    console.log(`✅ Successfully processed ${processedIds.length}/${apifyDataArray.length} videos`);
    return processedIds;
  }

  /**
   * Transform Apify data format to our database schema
   */
  private transformApifyData(apifyData: ApifyTikTokData): ProcessedVideoData {
    const engagementRate = apifyData.stats.playCount > 0 ? 
      (apifyData.stats.diggCount + apifyData.stats.commentCount + apifyData.stats.shareCount) / apifyData.stats.playCount : 0;

    const hashtags = apifyData.hashtags?.map(h => h.name) || [];
    const niche = this.detectNiche(apifyData.text, hashtags);

    return {
      id: crypto.randomUUID(),
      tiktok_id: apifyData.id,
      url: apifyData.webVideoUrl,
      author: apifyData.authorMeta.nickName || apifyData.authorMeta.name,
      description: apifyData.text || '',
      views: apifyData.stats.playCount || 0,
      likes: apifyData.stats.diggCount || 0,
      shares: apifyData.stats.shareCount || 0,
      comments: apifyData.stats.commentCount || 0,
      duration: apifyData.videoDuration || 0,
      upload_date: new Date(parseInt(apifyData.createTime) * 1000).toISOString(),
      hashtags,
      music_id: apifyData.musicMeta?.musicId,
      engagement_rate: Math.round(engagementRate * 10000) / 100, // Convert to percentage
      niche,
      // Legacy format compatibility
      creator_username: apifyData.authorMeta.nickName || apifyData.authorMeta.name,
      creator_followers: apifyData.authorMeta.followerCount || 0,
      view_count: apifyData.stats.playCount || 0,
      like_count: apifyData.stats.diggCount || 0,
      comment_count: apifyData.stats.commentCount || 0,
      share_count: apifyData.stats.shareCount || 0,
      caption: apifyData.text || '',
      upload_timestamp: new Date(parseInt(apifyData.createTime) * 1000).toISOString(),
      duration_seconds: apifyData.videoDuration || 0,
    };
  }

  /**
   * Detect niche based on content and hashtags
   */
  private detectNiche(text: string, hashtags: string[]): string {
    const nicheKeywords = {
      'fitness': ['workout', 'gym', 'fitness', 'exercise', 'muscle', 'bodybuilding', 'crossfit'],
      'food': ['recipe', 'cooking', 'food', 'chef', 'delicious', 'foodie', 'yummy'],
      'business': ['entrepreneur', 'business', 'startup', 'marketing', 'sales', 'money'],
      'beauty': ['makeup', 'skincare', 'beauty', 'cosmetics', 'glowup', 'selfcare'],
      'tech': ['technology', 'gadget', 'iphone', 'android', 'computer', 'ai', 'coding'],
      'education': ['learn', 'education', 'school', 'study', 'teacher', 'knowledge'],
      'entertainment': ['funny', 'comedy', 'joke', 'laugh', 'meme', 'viral', 'trending'],
      'lifestyle': ['life', 'daily', 'routine', 'vlog', 'lifestyle', 'motivation'],
      'fashion': ['outfit', 'style', 'fashion', 'clothing', 'ootd', 'trend'],
      'travel': ['travel', 'vacation', 'trip', 'explore', 'adventure', 'destination']
    };

    const contentText = (text + ' ' + hashtags.join(' ')).toLowerCase();

    for (const [niche, keywords] of Object.entries(nicheKeywords)) {
      if (keywords.some(keyword => contentText.includes(keyword))) {
        return niche;
      }
    }

    return 'general';
  }

  /**
   * Get relevant hashtags for a specific niche
   */
  private getNicheHashtags(niche: string): string[] {
    const nicheHashtags = {
      'fitness': ['fitness', 'workout', 'gym', 'bodybuilding', 'muscle', 'exercise'],
      'food': ['food', 'cooking', 'recipe', 'chef', 'foodie', 'yummy'],
      'business': ['business', 'entrepreneur', 'startup', 'success', 'money', 'mindset'],
      'beauty': ['beauty', 'makeup', 'skincare', 'glowup', 'cosmetics', 'selfcare'],
      'tech': ['tech', 'technology', 'gadget', 'iphone', 'android', 'ai'],
      'education': ['education', 'learn', 'study', 'school', 'knowledge', 'facts'],
      'entertainment': ['funny', 'comedy', 'viral', 'trending', 'meme', 'joke'],
      'lifestyle': ['lifestyle', 'life', 'motivation', 'inspiration', 'daily', 'routine'],
      'fashion': ['fashion', 'style', 'outfit', 'ootd', 'clothing', 'trend'],
      'travel': ['travel', 'vacation', 'adventure', 'explore', 'trip', 'destination']
    };

    return nicheHashtags[niche] || ['fyp', 'viral', 'trending'];
  }

  /**
   * Update system metrics after successful data ingestion
   */
  async updateIngestionMetrics(videosProcessed: number, successfulCount: number): Promise<void> {
    try {
      await this.supabase.from('system_metrics').insert([
        {
          metric_type: 'processing',
          metric_name: 'videos_ingested_batch',
          metric_value: videosProcessed,
          metric_data: {
            successful: successfulCount,
            failed: videosProcessed - successfulCount,
            success_rate: (successfulCount / videosProcessed) * 100,
            source: 'apify'
          }
        }
      ]);

      // Update daily totals
      const today = new Date().toISOString().split('T')[0];
      const { data: todayMetric } = await this.supabase
        .from('system_metrics')
        .select('*')
        .eq('metric_type', 'processing')
        .eq('metric_name', 'videos_processed_today')
        .gte('recorded_at', today + 'T00:00:00')
        .single();

      const newTotal = (todayMetric?.metric_value || 0) + successfulCount;

      await this.supabase.from('system_metrics').upsert({
        metric_type: 'processing',
        metric_name: 'videos_processed_today',
        metric_value: newTotal,
        metric_data: { date: today }
      });

    } catch (error) {
      console.error('Failed to update ingestion metrics:', error);
    }
  }
}
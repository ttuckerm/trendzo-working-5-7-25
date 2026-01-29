/**
 * Apify Scraper Manager
 * Manages all 7 Apify actors for comprehensive TikTok data collection
 * Integrates with viral prediction pipeline for real-world testing
 */

import { ApifyClient } from 'apify-client';
import { withRetry } from '@/lib/utils/retry';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, logSupabaseRuntimeEnv } from '@/lib/env';

export interface ApifyScraperConfig {
  apiToken: string;
  defaultMaxItems?: number;
  useProxy?: boolean;
  proxyConfiguration?: {
    useApifyProxy: boolean;
    apifyProxyGroups?: string[];
    apifyProxyCountry?: string;
  };
}

export interface ScraperActors {
  trendingVideos: string;
  fastApi: string;
  dataExtractor: string;
  comments: string;
  trendingHashtags: string;
  trendingSounds: string;
  transcripts: string;
}

export interface ScrapingJob {
  id: string;
  type: 'trending' | 'specific' | 'hashtag' | 'sound' | 'batch';
  actors: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  videosProcessed?: number;
  errors?: string[];
  results?: any;
}

export class ApifyScraperManager {
  private client: ApifyClient;
  private supabase;
  private actors: ScraperActors;
  private activeJobs: Map<string, ScrapingJob>;
  
  constructor(config: ApifyScraperConfig) {
    this.client = new ApifyClient({
      token: config.apiToken || process.env.APIFY_API_TOKEN
    });
    
    logSupabaseRuntimeEnv();
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Actor IDs (would be in env vars in production)
    this.actors = {
      trendingVideos: process.env.APIFY_TRENDING_VIDEOS_ACTOR || 'GdWCkxzABDOZaHoVT',
      fastApi: process.env.APIFY_FAST_API_ACTOR || 'uesAJWkuLhLgfPawS',
      dataExtractor: process.env.APIFY_DATA_EXTRACTOR_ACTOR || 'BDiUQYh9HLNr7TZXQ',
      comments: process.env.APIFY_COMMENTS_ACTOR || 'uTbyYiGkrEEEfKgfW',
      trendingHashtags: process.env.APIFY_HASHTAGS_ACTOR || 'JgXcWxmZRaVQMKxsV',
      trendingSounds: process.env.APIFY_SOUNDS_ACTOR || 'qSFGDnFNZxSnCRYYo',
      transcripts: process.env.APIFY_TRANSCRIPTS_ACTOR || 'aYG89mhUJqgsPeHaH'
    };
    
    this.activeJobs = new Map();
  }

  /**
   * Scrape trending videos with all metadata
   */
  public async scrapeTrendingVideos(options?: {
    maxItems?: number;
    region?: string;
    includeComments?: boolean;
    includeTranscripts?: boolean;
  }): Promise<ScrapingJob> {
    const jobId = `job_trending_${Date.now()}`;
    const job: ScrapingJob = {
      id: jobId,
      type: 'trending',
      actors: ['trendingVideos'],
      status: 'pending'
    };
    
    this.activeJobs.set(jobId, job);
    
    try {
      console.log('🎬 Starting trending videos scrape...');
      job.status = 'running';
      job.startedAt = new Date().toISOString();
      
      // Run trending videos scraper
      const trendingRun = await withRetry(() => this.client.actor(this.actors.trendingVideos).call({
        maxItems: options?.maxItems || 100,
        region: options?.region || 'US',
        proxyConfiguration: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL']
        }
      }));
      
      // Get results
      const { items: videos } = await withRetry(() => this.client.dataset(trendingRun.defaultDatasetId).listItems());
      console.log(`📊 Found ${videos.length} trending videos`);
      
      // Process and store videos
      const processedVideos = await this.processAndStoreVideos(videos);
      
      // Optional: Scrape comments for top videos
      if (options?.includeComments) {
        job.actors.push('comments');
        const topVideos = processedVideos.slice(0, 20); // Top 20 videos
        await this.scrapeCommentsForVideos(topVideos.map(v => v.tiktok_id));
      }
      
      // Optional: Get transcripts
      if (options?.includeTranscripts) {
        job.actors.push('transcripts');
        await this.scrapeTranscriptsForVideos(processedVideos.map(v => v.video_url));
      }
      
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.videosProcessed = processedVideos.length;
      job.results = {
        totalVideos: processedVideos.length,
        stored: processedVideos.length,
        withComments: options?.includeComments ? 20 : 0,
        withTranscripts: options?.includeTranscripts ? processedVideos.length : 0
      };
      
      console.log(`✅ Trending videos scrape completed: ${processedVideos.length} videos`);
      return job;
      
    } catch (error) {
      console.error('Trending videos scrape error:', error);
      job.status = 'failed';
      job.errors = [error instanceof Error ? error.message : 'Unknown error'];
      throw error;
    }
  }

  /**
   * Scrape videos by hashtag
   */
  public async scrapeHashtagVideos(hashtag: string, maxItems?: number): Promise<ScrapingJob> {
    const jobId = `job_hashtag_${Date.now()}`;
    const job: ScrapingJob = {
      id: jobId,
      type: 'hashtag',
      actors: ['fastApi'],
      status: 'pending'
    };
    
    this.activeJobs.set(jobId, job);
    
    try {
      console.log(`#️⃣ Scraping videos for hashtag: ${hashtag}`);
      job.status = 'running';
      job.startedAt = new Date().toISOString();
      
      // Use Fast API for hashtag search
      const hashtagRun = await withRetry(() => this.client.actor(this.actors.fastApi).call({
        hashtags: [hashtag],
        maxItems: maxItems || 50,
        proxyConfiguration: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL']
        }
      }));
      
      const { items: videos } = await withRetry(() => this.client.dataset(hashtagRun.defaultDatasetId).listItems());
      const processedVideos = await this.processAndStoreVideos(videos);
      
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.videosProcessed = processedVideos.length;
      
      console.log(`✅ Hashtag scrape completed: ${processedVideos.length} videos`);
      return job;
      
    } catch (error) {
      console.error('Hashtag scrape error:', error);
      job.status = 'failed';
      job.errors = [error instanceof Error ? error.message : 'Unknown error'];
      throw error;
    }
  }

  /**
   * Scrape trending hashtags
   */
  public async scrapeTrendingHashtags(): Promise<{hashtags: any[], job: ScrapingJob}> {
    const jobId = `job_hashtags_${Date.now()}`;
    const job: ScrapingJob = {
      id: jobId,
      type: 'hashtag',
      actors: ['trendingHashtags'],
      status: 'pending'
    };
    
    try {
      console.log('📍 Scraping trending hashtags...');
      job.status = 'running';
      job.startedAt = new Date().toISOString();
      
      const hashtagRun = await withRetry(() => this.client.actor(this.actors.trendingHashtags).call({
        days: 7, // Last 7 days
        region: 'US'
      }));
      
      const { items: hashtags } = await withRetry(() => this.client.dataset(hashtagRun.defaultDatasetId).listItems());
      
      // Store trending hashtags
      await this.storeTrendingHashtags(hashtags);
      
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.results = { totalHashtags: hashtags.length };
      
      console.log(`✅ Found ${hashtags.length} trending hashtags`);
      return { hashtags, job };
      
    } catch (error) {
      console.error('Trending hashtags scrape error:', error);
      job.status = 'failed';
      throw error;
    }
  }

  /**
   * Scrape trending sounds
   */
  public async scrapeTrendingSounds(): Promise<{sounds: any[], job: ScrapingJob}> {
    const jobId = `job_sounds_${Date.now()}`;
    const job: ScrapingJob = {
      id: jobId,
      type: 'sound',
      actors: ['trendingSounds'],
      status: 'pending'
    };
    
    try {
      console.log('🎵 Scraping trending sounds...');
      job.status = 'running';
      job.startedAt = new Date().toISOString();
      
      const soundRun = await withRetry(() => this.client.actor(this.actors.trendingSounds).call({
        days: 7,
        region: 'US'
      }));
      
      const { items: sounds } = await withRetry(() => this.client.dataset(soundRun.defaultDatasetId).listItems());
      
      // Store trending sounds
      await this.storeTrendingSounds(sounds);
      
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.results = { totalSounds: sounds.length };
      
      console.log(`✅ Found ${sounds.length} trending sounds`);
      return { sounds, job };
      
    } catch (error) {
      console.error('Trending sounds scrape error:', error);
      job.status = 'failed';
      throw error;
    }
  }

  /**
   * Scrape comments for specific videos
   */
  private async scrapeCommentsForVideos(videoIds: string[]): Promise<void> {
    try {
      console.log(`💬 Scraping comments for ${videoIds.length} videos...`);
      
      const commentRun = await withRetry(() => this.client.actor(this.actors.comments).call({
        videoIds,
        maxCommentsPerVideo: 100,
        proxyConfiguration: {
          useApifyProxy: true,
          apifyProxyGroups: ['RESIDENTIAL']
        }
      }));
      
      const { items: comments } = await withRetry(() => this.client.dataset(commentRun.defaultDatasetId).listItems());
      
      // Store comments
      await this.storeComments(comments);
      
      console.log(`✅ Scraped ${comments.length} comments`);
    } catch (error) {
      console.error('Comments scrape error:', error);
    }
  }

  /**
   * Scrape transcripts for videos
   */
  private async scrapeTranscriptsForVideos(videoUrls: string[]): Promise<void> {
    try {
      console.log(`📝 Scraping transcripts for ${videoUrls.length} videos...`);
      
      const transcriptRun = await withRetry(() => this.client.actor(this.actors.transcripts).call({
        videoUrls,
        languages: ['en'], // English transcripts
        generateIfMissing: true
      }));
      
      const { items: transcripts } = await withRetry(() => this.client.dataset(transcriptRun.defaultDatasetId).listItems());
      
      // Update videos with transcripts
      await this.updateVideosWithTranscripts(transcripts);
      
      console.log(`✅ Scraped ${transcripts.length} transcripts`);
    } catch (error) {
      console.error('Transcripts scrape error:', error);
    }
  }

  /**
   * Process and store videos in database
   */
  private async processAndStoreVideos(videos: any[]): Promise<any[]> {
    const processedVideos = [];
    
    for (const video of videos) {
      try {
        const processedVideo = {
          tiktok_id: video.id,
          video_url: video.webVideoUrl || video.videoUrl,
          caption: video.text || video.desc || '',
          upload_timestamp: video.createTimeISO || new Date(video.createTime * 1000).toISOString(),
          view_count: video.stats?.playCount || video.playCount || 0,
          like_count: video.stats?.diggCount || video.diggCount || 0,
          comment_count: video.stats?.commentCount || video.commentCount || 0,
          share_count: video.stats?.shareCount || video.shareCount || 0,
          creator_id: video.authorMeta?.id || video.author?.id,
          creator_username: video.authorMeta?.name || video.author?.uniqueId,
          creator_followers: video.authorMeta?.fans || video.author?.followerCount || 0,
          hashtags: this.extractHashtags(video),
          sound_id: video.musicMeta?.musicId || video.music?.id,
          sound_title: video.musicMeta?.musicName || video.music?.title,
          duration_seconds: video.videoMeta?.duration || video.video?.duration || 0,
          platform: 'tiktok',
          scraped_at: new Date().toISOString()
        };
        
        // Store in database
        const { data, error } = await this.supabase
          .from('videos')
          .upsert(processedVideo, { onConflict: 'tiktok_id' })
          .select()
          .single();
        
        if (!error && data) {
          processedVideos.push(data);
        }
        
      } catch (error) {
        console.error(`Error processing video ${video.id}:`, error);
      }
    }
    
    console.log(`📊 Stored ${processedVideos.length} videos in database`);
    return processedVideos;
  }

  /**
   * Extract hashtags from video data
   */
  private extractHashtags(video: any): string[] {
    const hashtags: string[] = [];
    
    // From hashtags array
    if (video.hashtags && Array.isArray(video.hashtags)) {
      hashtags.push(...video.hashtags.map((h: any) => h.name || h.title));
    }
    
    // From text/caption
    if (video.text || video.desc) {
      const text = video.text || video.desc;
      const hashtagMatches = text.match(/#\w+/g) || [];
      hashtags.push(...hashtagMatches);
    }
    
    // Remove duplicates and clean
    return [...new Set(hashtags.map(h => h.replace('#', '').toLowerCase()))];
  }

  /**
   * Store trending hashtags
   */
  private async storeTrendingHashtags(hashtags: any[]): Promise<void> {
    try {
      const hashtagData = hashtags.map(hashtag => ({
        name: hashtag.name,
        title: hashtag.title,
        view_count: hashtag.views || 0,
        video_count: hashtag.videoCount || 0,
        trend_score: hashtag.trendScore || 0,
        platform: 'tiktok',
        scraped_at: new Date().toISOString()
      }));
      
      await this.supabase
        .from('trending_hashtags')
        .upsert(hashtagData, { onConflict: 'name,platform' });
        
      console.log(`📍 Stored ${hashtagData.length} trending hashtags`);
    } catch (error) {
      console.error('Error storing hashtags:', error);
    }
  }

  /**
   * Store trending sounds
   */
  private async storeTrendingSounds(sounds: any[]): Promise<void> {
    try {
      const soundData = sounds.map(sound => ({
        sound_id: sound.id,
        title: sound.title,
        author: sound.author,
        play_url: sound.playUrl,
        video_count: sound.videoCount || 0,
        trend_score: sound.trendScore || 0,
        platform: 'tiktok',
        scraped_at: new Date().toISOString()
      }));
      
      await this.supabase
        .from('trending_sounds')
        .upsert(soundData, { onConflict: 'sound_id,platform' });
        
      console.log(`🎵 Stored ${soundData.length} trending sounds`);
    } catch (error) {
      console.error('Error storing sounds:', error);
    }
  }

  /**
   * Store comments
   */
  private async storeComments(comments: any[]): Promise<void> {
    try {
      const commentData = comments.map(comment => ({
        comment_id: comment.cid,
        video_id: comment.videoId,
        text: comment.text,
        author: comment.author,
        likes: comment.diggCount || 0,
        replies: comment.replyCount || 0,
        created_at: new Date(comment.createTime * 1000).toISOString(),
        platform: 'tiktok'
      }));
      
      await this.supabase
        .from('video_comments')
        .upsert(commentData, { onConflict: 'comment_id' });
        
      console.log(`💬 Stored ${commentData.length} comments`);
    } catch (error) {
      console.error('Error storing comments:', error);
    }
  }

  /**
   * Update videos with transcripts
   */
  private async updateVideosWithTranscripts(transcripts: any[]): Promise<void> {
    try {
      for (const transcript of transcripts) {
        const videoUrl = transcript.videoUrl;
        const transcriptText = transcript.transcript || transcript.text;
        
        if (transcriptText) {
          await this.supabase
            .from('videos')
            .update({ transcript: transcriptText })
            .eq('video_url', videoUrl);
        }
      }
      
      console.log(`📝 Updated ${transcripts.length} videos with transcripts`);
    } catch (error) {
      console.error('Error updating transcripts:', error);
    }
  }

  /**
   * Get job status
   */
  public getJobStatus(jobId: string): ScrapingJob | undefined {
    return this.activeJobs.get(jobId);
  }

  /**
   * Get all active jobs
   */
  public getActiveJobs(): ScrapingJob[] {
    return Array.from(this.activeJobs.values())
      .filter(job => job.status === 'running' || job.status === 'pending');
  }

  /**
   * Daily automated scraping routine
   */
  public async runDailyScraping(cap?: number): Promise<{
    trending: ScrapingJob;
    hashtags: any[];
    sounds: any[];
    totalVideos: number;
  }> {
    console.log('🚀 Starting daily scraping routine...');
    
    // Remaining videos we are allowed to ingest in this run (optional cap)
    let remainingCap = typeof cap === 'number' && cap >= 0 ? cap : Number.POSITIVE_INFINITY;

    // 1. Scrape trending hashtags and sounds
    const [hashtagResults, soundResults] = await Promise.all([
      this.scrapeTrendingHashtags(),
      this.scrapeTrendingSounds()
    ]);
    
    // 2. Scrape trending videos with comments and transcripts
    const trendingMax = Math.min(100, Math.max(0, remainingCap));
    const trendingJob = await this.scrapeTrendingVideos({
      maxItems: trendingMax || 0,
      includeComments: true,
      includeTranscripts: true
    });
    const trendingProcessed = trendingJob.videosProcessed || 0;
    remainingCap = isFinite(remainingCap)
      ? Math.max(0, remainingCap - trendingProcessed)
      : remainingCap;
    
    // 3. Scrape videos from top hashtags
    const topHashtags = hashtagResults.hashtags.slice(0, 5);
    const hashtagJobs: ScrapingJob[] = [];
    for (const hashtag of topHashtags) {
      if (remainingCap <= 0) break;
      // Distribute remaining cap across remaining hashtags, max 20 each
      const remainingHashtags = topHashtags.length - hashtagJobs.length;
      const perHashtag = Math.min(20, Math.max(0, Math.floor(remainingCap / remainingHashtags)) || 0);
      if (perHashtag <= 0) break;
      const job = await this.scrapeHashtagVideos(hashtag.name, perHashtag);
      hashtagJobs.push(job);
      const processed = job.videosProcessed || 0;
      if (isFinite(remainingCap)) remainingCap = Math.max(0, remainingCap - processed);
    }
    
    const totalVideos = (trendingJob.videosProcessed || 0) + 
      hashtagJobs.reduce((sum, job) => sum + (job.videosProcessed || 0), 0);
    
    console.log(`✅ Daily scraping complete! Total videos: ${totalVideos}`);
    
    return {
      trending: trendingJob,
      hashtags: hashtagResults.hashtags,
      sounds: soundResults.sounds,
      totalVideos
    };
  }
}
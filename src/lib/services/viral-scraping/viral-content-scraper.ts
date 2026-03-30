/**
 * Viral Content Scraper Service
 * 
 * Purpose: Scrape verified viral videos (100K+ likes) to balance ML training data
 * 
 * Current Problem:
 * - 788 total videos in scraped_videos
 * - Only 13 viral/mega-viral (1.6%)
 * - 775 normal (98.4%)
 * 
 * Goal: Scrape 200-500 videos with 100K+ hearts to train the model on viral patterns
 */

import { createClient } from '@supabase/supabase-js';
import { analyzeVideoImmediately } from '@/lib/services/immediate-video-analyzer';
import { callApifyScraperAsync, getApifyToken } from '@/lib/services/apify-tiktok-client';

// ============================================================================
// TYPES
// ============================================================================

export interface ViralScrapeConfig {
  searchQueries: string[];
  resultsPerPage: number;
  minHearts: number;
  publishedAfter: string;
  shouldDownloadSubtitles: boolean;
  shouldDownloadVideos: boolean;
  excludePinnedPosts: boolean;
  searchSection: string;
  scrapeRelatedVideos: boolean;
  maxItems?: number;
}

export interface ApifyViralVideo {
  id: string;
  webVideoUrl: string;
  text: string;
  createTimeISO: string;
  createTime: number;
  authorMeta: {
    id: string;
    name: string;
    nickName: string;
    fans: number;
    verified: boolean;
    signature?: string;
    avatar?: string;
  };
  musicMeta?: {
    musicId?: string;
    musicName?: string;
    musicAuthor?: string;
    musicOriginal?: boolean;
    playUrl?: string;
  };
  videoMeta?: {
    duration: number;
    width?: number;
    height?: number;
    coverUrl?: string;
  };
  diggCount: number;
  playCount: number;
  commentCount: number;
  shareCount: number;
  collectCount?: number;
  hashtags?: Array<{ id: string; name: string; title: string }>;
  subtitleLinks?: Array<{ url: string; language: string }>;
  subtitles?: Array<{ text: string; language: string }>;
  covers?: string[];
}

export interface ScrapeJobResult {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalScraped: number;
  totalImported: number;
  duplicatesSkipped: number;
  errors: string[];
  breakdown: {
    megaViral: number;
    viral: number;
    normal: number;
  };
  startedAt: Date;
  completedAt?: Date;
}

export interface ImportResult {
  videoId: string;
  success: boolean;
  error?: string;
  isDuplicate: boolean;
}

// ============================================================================
// DEFAULT SEARCH QUERIES (Personal Finance/Investing Niche)
// ============================================================================

export const DEFAULT_SEARCH_QUERIES = [
  "personal finance",
  "best finance influencers",
  "personal finance management",
  "personal finance influencers",
  "finance mindset",
  "personal finance books",
  "personal finance over 50",
  "honest personal finance",
  "money mindset and finance",
  "personal finance tips and tricks",
  "finance tips",
  "how to improve finance management",
  "personal finance management app",
  "how to learn personal finance management",
  "business finance management",
  "earn to learn personal finance training",
  "how to learn personal finance",
  "what do you learn from personal finance",
  "how to invest and get monthly income",
  "how to invest for beginners",
  "how to invest money",
  "money tips",
  "passive income",
  "financial freedom",
  "money hack",
  "investing tips"
];

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_VIRAL_SCRAPE_CONFIG: ViralScrapeConfig = {
  searchQueries: DEFAULT_SEARCH_QUERIES,
  resultsPerPage: 50,
  minHearts: 100000,
  publishedAfter: "2025-07-01",
  shouldDownloadSubtitles: true,  // CRITICAL for ML features
  shouldDownloadVideos: false,
  excludePinnedPosts: false,
  searchSection: "/video",
  scrapeRelatedVideos: false,
};

// ============================================================================
// VIRAL CONTENT SCRAPER SERVICE
// ============================================================================

export class ViralContentScraperService {
  private supabase: ReturnType<typeof createClient>;
  private activeJobs: Map<string, ScrapeJobResult> = new Map();

  constructor() {
    // Initialize Supabase
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!
    );

    // Check Apify token availability (actual client managed by shared module)
    if (getApifyToken()) {
      console.log('✅ Apify token available (shared client)');
    } else {
      console.warn('⚠️ APIFY_API_TOKEN not set - will use mock data in development');
    }
  }

  /**
   * Start a viral content scraping job
   */
  async startViralScrape(config: Partial<ViralScrapeConfig> = {}): Promise<string> {
    const fullConfig: ViralScrapeConfig = { 
      ...DEFAULT_VIRAL_SCRAPE_CONFIG, 
      ...config,
      // Ensure boolean defaults are applied correctly
      shouldDownloadSubtitles: config.shouldDownloadSubtitles ?? DEFAULT_VIRAL_SCRAPE_CONFIG.shouldDownloadSubtitles,
      shouldDownloadVideos: config.shouldDownloadVideos ?? DEFAULT_VIRAL_SCRAPE_CONFIG.shouldDownloadVideos,
      excludePinnedPosts: config.excludePinnedPosts ?? DEFAULT_VIRAL_SCRAPE_CONFIG.excludePinnedPosts,
      scrapeRelatedVideos: config.scrapeRelatedVideos ?? DEFAULT_VIRAL_SCRAPE_CONFIG.scrapeRelatedVideos,
    };
    
    const jobId = `viral_scrape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: ScrapeJobResult = {
      jobId,
      status: 'pending',
      totalScraped: 0,
      totalImported: 0,
      duplicatesSkipped: 0,
      errors: [],
      breakdown: { megaViral: 0, viral: 0, normal: 0 },
      startedAt: new Date()
    };

    this.activeJobs.set(jobId, job);

    // Start scraping asynchronously
    this.executeViralScrape(jobId, fullConfig).catch(err => {
      console.error(`Viral scrape job ${jobId} failed:`, err);
      const job = this.activeJobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.errors.push(err.message);
      }
    });

    return jobId;
  }

  /**
   * Execute the viral scraping job
   */
  private async executeViralScrape(jobId: string, config: ViralScrapeConfig): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    job.status = 'running';
    console.log(`🚀 Starting viral scrape job ${jobId}`);
    console.log(`   Config: ${config.searchQueries.length} search queries, minHearts: ${config.minHearts}`);
    console.log(`   Subtitles: ${config.shouldDownloadSubtitles}, Videos: ${config.shouldDownloadVideos}`);

    try {
      let allVideos: ApifyViralVideo[] = [];

      if (getApifyToken()) {
        // REAL APIFY SCRAPE (via shared apify-tiktok-client)
        console.log('🔍 Running real Apify scrape...');

        // Build Apify input with ALL parameters
        const input = {
          searchQueries: config.searchQueries,
          resultsPerPage: config.resultsPerPage,
          minHearts: config.minHearts,
          publishedAfter: config.publishedAfter,
          searchSection: config.searchSection,
          excludePinnedPosts: config.excludePinnedPosts,
          // CRITICAL: Subtitles for ML feature extraction
          shouldDownloadSubtitles: config.shouldDownloadSubtitles,
          shouldDownloadVideos: config.shouldDownloadVideos,
          // Additional options
          shouldDownloadAvatars: false,
          shouldDownloadCovers: false,
          shouldDownloadMusicCovers: false,
          shouldDownloadSlideshowImages: false,
          // Max items if specified
          ...(config.maxItems ? { maxItems: config.maxItems } : {}),
        };

        console.log('📤 Apify input:', JSON.stringify(input, null, 2));

        // Run via shared Apify client (async mode for long-running scrapes)
        const items = await callApifyScraperAsync(input, {
          actor: 'clockworks/tiktok-scraper',
          waitSecs: 300,
        });
        allVideos = items as ApifyViralVideo[];

        console.log(`   ✅ Scraped ${allVideos.length} videos from Apify`);
      } else {
        // MOCK DATA FOR DEVELOPMENT
        console.log('🎭 Using mock data (no Apify token)');
        allVideos = this.generateMockViralVideos(50);
      }

      job.totalScraped = allVideos.length;

      // Filter to ensure minimum hearts (belt and suspenders)
      const viralVideos = allVideos.filter(v => v.diggCount >= config.minHearts);
      console.log(`   📊 ${viralVideos.length} videos have ${config.minHearts}+ hearts`);

      // Import to database
      for (const video of viralVideos) {
        const result = await this.importVideo(video);
        
        if (result.success) {
          if (result.isDuplicate) {
            job.duplicatesSkipped++;
          } else {
            job.totalImported++;
          }
        } else {
          job.errors.push(`${video.id}: ${result.error}`);
        }

        // Rate limiting
        await this.sleep(100);
      }

      // Calculate DPS for new imports
      if (job.totalImported > 0) {
        console.log(`🧮 Calculating DPS for ${job.totalImported} new videos...`);
        await this.triggerDPSCalculation(jobId);
      }

      // Get final breakdown
      const breakdown = await this.getClassificationBreakdown(jobId);
      job.breakdown = breakdown;

      job.status = 'completed';
      job.completedAt = new Date();

      console.log(`✅ Viral scrape job ${jobId} completed!`);
      console.log(`   Total scraped: ${job.totalScraped}`);
      console.log(`   Total imported: ${job.totalImported}`);
      console.log(`   Duplicates skipped: ${job.duplicatesSkipped}`);
      console.log(`   Errors: ${job.errors.length}`);
      console.log(`   Breakdown: mega-viral=${breakdown.megaViral}, viral=${breakdown.viral}, normal=${breakdown.normal}`);

    } catch (error) {
      job.status = 'failed';
      job.errors.push(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Import a single video to the database
   */
  private async importVideo(video: ApifyViralVideo): Promise<ImportResult> {
    try {
      // Check for duplicate
      const { data: existing } = await this.supabase
        .from('scraped_videos')
        .select('video_id')
        .eq('video_id', video.id)
        .single();

      if (existing) {
        return { videoId: video.id, success: true, isDuplicate: true };
      }

      // Extract transcript from subtitles
      let transcriptText: string | null = null;
      if (video.subtitles && video.subtitles.length > 0) {
        transcriptText = video.subtitles.map(s => s.text).join(' ');
      } else if (video.subtitleLinks && video.subtitleLinks.length > 0) {
        // Subtitles need to be fetched separately
        transcriptText = null; // Mark for later processing
      }

      // Extract hashtags
      const hashtags = video.hashtags?.map(h => h.name) || [];

      // Map Apify data to scraped_videos schema
      const videoRecord = {
        video_id: video.id,
        url: video.webVideoUrl,
        caption: video.text,
        upload_timestamp: video.createTimeISO,
        creator_username: video.authorMeta?.name,
        creator_nickname: video.authorMeta?.nickName,
        creator_id: video.authorMeta?.id,
        creator_followers_count: video.authorMeta?.fans || 0,
        creator_verified: video.authorMeta?.verified || false,
        likes_count: video.diggCount,
        views_count: video.playCount,
        comments_count: video.commentCount,
        shares_count: video.shareCount,
        saves_count: video.collectCount || 0,
        duration_seconds: video.videoMeta?.duration || 0,
        transcript_text: transcriptText,
        hashtags: hashtags,
        music_name: video.musicMeta?.musicName,
        music_author: video.musicMeta?.musicAuthor,
        music_is_original: video.musicMeta?.musicOriginal,
        thumbnail_url: video.covers?.[0] || video.videoMeta?.coverUrl,
        platform: 'tiktok',
        source: 'apify_viral_scrape',
        niche: 'Personal Finance/Investing',
        scraped_at: new Date().toISOString(),
        needs_processing: true,
        raw_scraping_data: video
      };

      const { error } = await this.supabase
        .from('scraped_videos')
        .insert(videoRecord);

      if (error) {
        return { videoId: video.id, success: false, error: error.message, isDuplicate: false };
      }

      // =====================================================
      // IMMEDIATE FFmpeg ANALYSIS (while CDN URL is fresh!)
      // =====================================================
      try {
        console.log(`[Viral Scraper] Running FFmpeg for ${video.id}...`);
        const ffmpegResult = await analyzeVideoImmediately(video.webVideoUrl, video.id, video.text || '');
        if (ffmpegResult.success) {
          console.log(`[Viral Scraper] ✅ FFmpeg ${video.id}: ${ffmpegResult.analysis?.height}p`);
        } else {
          console.warn(`[Viral Scraper] ⚠️ FFmpeg ${video.id}: ${ffmpegResult.error}`);
        }
      } catch (ffmpegError: any) {
        console.warn(`[Viral Scraper] FFmpeg error ${video.id}: ${ffmpegError.message}`);
        // Continue - FFmpeg failure shouldn't stop import
      }

      return { videoId: video.id, success: true, isDuplicate: false };

    } catch (error) {
      return {
        videoId: video.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        isDuplicate: false
      };
    }
  }

  /**
   * Trigger DPS calculation for newly imported videos
   */
  private async triggerDPSCalculation(jobId: string): Promise<void> {
    try {
      // Get videos that need DPS calculation
      const { data: videos, error } = await this.supabase
        .from('scraped_videos')
        .select('*')
        .eq('source', 'apify_viral_scrape')
        .is('dps_score', null);

      if (error || !videos || videos.length === 0) {
        console.log('   No videos need DPS calculation');
        return;
      }

      console.log(`   Processing ${videos.length} videos for DPS...`);

      // Calculate cohort stats for these videos
      const viewCounts = videos.map(v => v.views_count || 0);
      const cohortMean = viewCounts.reduce((a, b) => a + b, 0) / viewCounts.length;
      const cohortStdDev = Math.sqrt(
        viewCounts.reduce((sq, n) => sq + Math.pow(n - cohortMean, 2), 0) / viewCounts.length
      );

      for (const video of videos) {
        try {
          // Calculate DPS score
          const dpsResult = this.calculateSimpleDPS(video, cohortMean, cohortStdDev);

          // Update the record
          await this.supabase
            .from('scraped_videos')
            .update({
              dps_score: dpsResult.viralScore,
              dps_percentile: dpsResult.percentile,
              dps_classification: dpsResult.classification,
              dps_calculated_at: new Date().toISOString(),
              needs_processing: false
            })
            .eq('video_id', video.video_id);

        } catch (err) {
          console.error(`   Failed to calculate DPS for ${video.video_id}:`, err);
        }
      }

      console.log('   ✅ DPS calculation complete');

    } catch (error) {
      console.error('   DPS calculation error:', error);
    }
  }

  /**
   * Simple DPS calculation for viral videos
   */
  private calculateSimpleDPS(
    video: any,
    cohortMean: number,
    cohortStdDev: number
  ): { viralScore: number; percentile: number; classification: string } {
    const viewCount = video.views_count || 0;
    const likeCount = video.likes_count || 0;
    const commentCount = video.comments_count || 0;
    const shareCount = video.shares_count || 0;
    const followerCount = video.creator_followers_count || 10000;

    // Z-score calculation
    const zScore = cohortStdDev > 0 ? (viewCount - cohortMean) / cohortStdDev : 0;

    // Engagement rate
    const engagementRate = viewCount > 0 
      ? (likeCount + commentCount + shareCount) / viewCount 
      : 0;

    // View-to-follower ratio (viral coefficient)
    const viralCoefficient = followerCount > 0 
      ? viewCount / followerCount 
      : 1;

    // Calculate base score
    let viralScore = 50; // Base score

    // Z-score contribution (±30 points)
    viralScore += Math.min(30, Math.max(-30, zScore * 10));

    // Engagement contribution (0-20 points)
    viralScore += Math.min(20, engagementRate * 200);

    // Viral coefficient contribution (0-20 points)
    if (viralCoefficient > 10) viralScore += 20;
    else if (viralCoefficient > 5) viralScore += 15;
    else if (viralCoefficient > 2) viralScore += 10;
    else if (viralCoefficient > 1) viralScore += 5;

    // Like count bonus for verified viral (100K+ likes)
    if (likeCount >= 1000000) viralScore += 15;
    else if (likeCount >= 500000) viralScore += 10;
    else if (likeCount >= 100000) viralScore += 5;

    // Clamp to 0-100
    viralScore = Math.max(0, Math.min(100, viralScore));

    // Calculate percentile (simplified)
    const percentile = Math.min(99.9, 50 + (zScore * 15));

    // Determine classification
    let classification: string;
    if (viralScore >= 85 || likeCount >= 500000) {
      classification = 'mega-viral';
    } else if (viralScore >= 70 || likeCount >= 100000) {
      classification = 'viral';
    } else {
      classification = 'normal';
    }

    return { viralScore, percentile, classification };
  }

  /**
   * Get classification breakdown for a job
   */
  private async getClassificationBreakdown(jobId: string): Promise<{
    megaViral: number;
    viral: number;
    normal: number;
  }> {
    const { data, error } = await this.supabase
      .from('scraped_videos')
      .select('dps_classification')
      .eq('source', 'apify_viral_scrape');

    if (error || !data) {
      return { megaViral: 0, viral: 0, normal: 0 };
    }

    return {
      megaViral: data.filter(v => v.dps_classification === 'mega-viral').length,
      viral: data.filter(v => v.dps_classification === 'viral').length,
      normal: data.filter(v => v.dps_classification === 'normal').length
    };
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): ScrapeJobResult | null {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Get all jobs
   */
  getAllJobs(): ScrapeJobResult[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Get current training data distribution
   */
  async getTrainingDataDistribution(): Promise<{
    total: number;
    megaViral: number;
    viral: number;
    normal: number;
    percentViral: number;
  }> {
    const { data, error } = await this.supabase
      .from('scraped_videos')
      .select('dps_classification')
      .not('dps_classification', 'is', null);

    if (error || !data) {
      return { total: 0, megaViral: 0, viral: 0, normal: 0, percentViral: 0 };
    }

    const megaViral = data.filter(v => v.dps_classification === 'mega-viral').length;
    const viral = data.filter(v => v.dps_classification === 'viral').length;
    const normal = data.filter(v => v.dps_classification === 'normal').length;
    const total = data.length;
    const percentViral = total > 0 ? ((megaViral + viral) / total) * 100 : 0;

    return { total, megaViral, viral, normal, percentViral };
  }

  /**
   * Generate mock viral videos for development
   */
  private generateMockViralVideos(count: number): ApifyViralVideo[] {
    const videos: ApifyViralVideo[] = [];
    const creators = [
      'financebro', 'moneymindset', 'investorjoe', 'wealthbuilder', 'stocksandchill',
      'passiveincome101', 'sidehustlequeen', 'budgetboss', 'retireyoung', 'cryptoking'
    ];

    for (let i = 0; i < count; i++) {
      const likeCount = 100000 + Math.floor(Math.random() * 900000); // 100K - 1M likes
      const viewCount = likeCount * (8 + Math.random() * 12); // 8-20x likes
      
      videos.push({
        id: `mock_viral_${Date.now()}_${i}`,
        webVideoUrl: `https://www.tiktok.com/@${creators[i % creators.length]}/video/${Date.now()}${i}`,
        text: `This financial tip changed my life! 💰 #personalfinance #moneytips #investing`,
        createTimeISO: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        createTime: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 30 * 24 * 60 * 60),
        authorMeta: {
          id: `creator_${i}`,
          name: creators[i % creators.length],
          nickName: creators[i % creators.length].charAt(0).toUpperCase() + creators[i % creators.length].slice(1),
          fans: 50000 + Math.floor(Math.random() * 950000),
          verified: Math.random() > 0.7
        },
        musicMeta: {
          musicId: `music_${i}`,
          musicName: 'Original Sound',
          musicAuthor: creators[i % creators.length],
          musicOriginal: true
        },
        videoMeta: {
          duration: 15 + Math.floor(Math.random() * 45),
          width: 1080,
          height: 1920,
          coverUrl: `https://p16-sign.tiktokcdn-us.com/thumb_${i}.jpeg`
        },
        diggCount: likeCount,
        playCount: Math.floor(viewCount),
        commentCount: Math.floor(likeCount * 0.02),
        shareCount: Math.floor(likeCount * 0.05),
        collectCount: Math.floor(likeCount * 0.03),
        hashtags: [
          { id: '1', name: 'personalfinance', title: 'Personal Finance' },
          { id: '2', name: 'moneytips', title: 'Money Tips' },
          { id: '3', name: 'investing', title: 'Investing' }
        ],
        subtitles: [
          { text: 'Hey, let me tell you about this amazing financial tip...', language: 'en' }
        ]
      });
    }

    return videos;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton
export const viralContentScraper = new ViralContentScraperService();

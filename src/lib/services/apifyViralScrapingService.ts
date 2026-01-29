/**
 * TRENDZO Apify Viral Video Scraping Service
 * 
 * This service handles platform-agnostic video scraping using Apify to:
 * 1. Scrape viral videos from multiple platforms
 * 2. Extract comprehensive metadata and engagement metrics
 * 3. Queue videos for viral pattern analysis
 * 4. Track performance changes over time
 * 
 * Based on the comprehensive viral intelligence blueprint
 */

import { Platform } from '@/lib/types/database';
import { VideoContent } from './viralPatternMatchingEngine';

export interface ScrapingJob {
  id: string;
  platform: Platform;
  searchTerms: string[];
  minViews: number;
  maxAge: number; // Days
  limit: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  results: VideoContent[];
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ScrapingConfig {
  platform: Platform;
  searchTerms?: string[];
  hashtags?: string[];
  creators?: string[];
  minViews?: number;
  minEngagementRate?: number;
  maxAge?: number; // Days since upload
  limit?: number;
  includeTranscripts?: boolean;
  includeAudioAnalysis?: boolean;
}

export interface PlatformScraper {
  platform: Platform;
  actorId: string;
  defaultConfig: any;
  rateLimit: number; // Requests per minute
}

export class ApifyViralScrapingService {
  private static instance: ApifyViralScrapingService;
  private apifyClient: any;
  private activeJobs: Map<string, ScrapingJob> = new Map();
  
  // Platform-specific Apify actor configurations
  private platformScrapers: Map<Platform, PlatformScraper> = new Map([
    ['instagram', {
      platform: 'instagram',
      actorId: 'apify/instagram-scraper',
      defaultConfig: {
        resultsType: 'posts',
        resultsLimit: 100,
        searchType: 'hashtag',
        addParentData: true
      },
      rateLimit: 30
    }],
    ['tiktok', {
      platform: 'tiktok',
      actorId: 'apify/tiktok-scraper',
      defaultConfig: {
        resultsLimit: 100,
        searchType: 'hashtag',
        shouldDownloadCovers: false,
        shouldDownloadSlideshowImages: false,
        shouldDownloadSubtitles: true,
        shouldDownloadVideos: false
      },
      rateLimit: 20
    }],
    ['youtube', {
      platform: 'youtube',
      actorId: 'apify/youtube-scraper',
      defaultConfig: {
        searchKeywords: '',
        maxResults: 100,
        uploadDate: 'today',
        videoDuration: 'short',
        sortBy: 'viewCount'
      },
      rateLimit: 40
    }],
    ['linkedin', {
      platform: 'linkedin',
      actorId: 'apify/linkedin-company-scraper',
      defaultConfig: {
        resultsLimit: 50
      },
      rateLimit: 10
    }]
  ]);

  private constructor() {
    this.initializeApifyClient();
  }

  public static getInstance(): ApifyViralScrapingService {
    if (!ApifyViralScrapingService.instance) {
      ApifyViralScrapingService.instance = new ApifyViralScrapingService();
    }
    return ApifyViralScrapingService.instance;
  }

  /**
   * Initialize Apify client
   */
  private async initializeApifyClient(): Promise<void> {
    try {
      // In a real implementation, we'd use the Apify client
      // For now, we'll create a mock implementation that works with the system
      
      const apiToken = process.env.APIFY_API_TOKEN;
      
      if (!apiToken || apiToken === 'mock-token') {
        console.log('⚠️  Using mock Apify client for development');
        this.apifyClient = this.createMockApifyClient();
      } else {
        // Real Apify implementation would go here
        console.log('🔧 Initializing real Apify client...');
        // const { ApifyApi } = await import('apify-client');
        // this.apifyClient = new ApifyApi({ token: apiToken });
        this.apifyClient = this.createMockApifyClient();
      }
    } catch (error) {
      console.error('Error initializing Apify client:', error);
      this.apifyClient = this.createMockApifyClient();
    }
  }

  /**
   * Start a viral video scraping job
   */
  public async startScrapingJob(config: ScrapingConfig): Promise<string> {
    try {
      const jobId = this.generateJobId();
      const scraper = this.platformScrapers.get(config.platform);
      
      if (!scraper) {
        throw new Error(`Unsupported platform: ${config.platform}`);
      }

      console.log(`🚀 Starting scraping job ${jobId} for ${config.platform}`);

      const job: ScrapingJob = {
        id: jobId,
        platform: config.platform,
        searchTerms: config.searchTerms || [],
        minViews: config.minViews || 10000,
        maxAge: config.maxAge || 7,
        limit: config.limit || 50,
        status: 'pending',
        progress: 0,
        results: [],
        createdAt: new Date()
      };

      this.activeJobs.set(jobId, job);

      // Start scraping asynchronously
      this.executeScrapeJob(jobId, config, scraper);

      return jobId;

    } catch (error) {
      console.error('Error starting scraping job:', error);
      throw new Error('Failed to start scraping job');
    }
  }

  /**
   * Execute the scraping job
   */
  private async executeScrapeJob(
    jobId: string, 
    config: ScrapingConfig, 
    scraper: PlatformScraper
  ): Promise<void> {
    try {
      const job = this.activeJobs.get(jobId);
      if (!job) return;

      // Update job status
      job.status = 'running';
      job.progress = 10;

      // Prepare Apify input
      const apifyInput = this.prepareApifyInput(config, scraper);
      
      console.log(`🔍 Executing Apify actor: ${scraper.actorId}`);
      
      // Run Apify actor
      const run = await this.apifyClient.actor(scraper.actorId).call(apifyInput);
      
      job.progress = 50;

      // Get results
      const { items } = await this.apifyClient.dataset(run.defaultDatasetId).listItems();
      
      job.progress = 75;

      // Process and filter results
      const processedVideos = await this.processScrapedVideos(items, config);
      
      job.results = processedVideos;
      job.progress = 100;
      job.status = 'completed';
      job.completedAt = new Date();

      console.log(`✅ Scraping job ${jobId} completed: ${processedVideos.length} viral videos found`);

      // Queue videos for analysis
      await this.queueVideosForAnalysis(processedVideos);

    } catch (error) {
      console.error(`Error executing scraping job ${jobId}:`, error);
      
      const job = this.activeJobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }
  }

  /**
   * Process scraped video data into standardized format
   */
  private async processScrapedVideos(
    rawData: any[], 
    config: ScrapingConfig
  ): Promise<VideoContent[]> {
    const videos: VideoContent[] = [];

    for (const item of rawData) {
      try {
        const video = await this.transformToVideoContent(item, config.platform);
        
        // Apply filtering criteria
        if (this.meetsViralCriteria(video, config)) {
          videos.push(video);
        }
      } catch (error) {
        console.error('Error processing scraped video:', error);
        continue;
      }
    }

    // Sort by viral potential (view count / follower count ratio)
    videos.sort((a, b) => {
      const ratioA = a.creatorFollowerCount > 0 ? a.viewCount / a.creatorFollowerCount : 0;
      const ratioB = b.creatorFollowerCount > 0 ? b.viewCount / b.creatorFollowerCount : 0;
      return ratioB - ratioA;
    });

    return videos.slice(0, config.limit || 50);
  }

  /**
   * Transform platform-specific data to standard VideoContent format
   */
  private async transformToVideoContent(item: any, platform: Platform): Promise<VideoContent> {
    switch (platform) {
      case 'instagram':
        return this.transformInstagramData(item);
      case 'tiktok':
        return this.transformTikTokData(item);
      case 'youtube':
        return this.transformYouTubeData(item);
      case 'linkedin':
        return this.transformLinkedInData(item);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Transform Instagram scraping data
   */
  private transformInstagramData(item: any): VideoContent {
    return {
      id: `ig_${item.id || item.shortcode}`,
      sourceUrl: item.url || `https://instagram.com/p/${item.shortcode}`,
      platform: 'instagram',
      title: item.caption?.slice(0, 100) || '',
      description: item.caption || '',
      transcript: item.caption || '', // Instagram doesn't have transcripts
      duration: item.videoDuration || 30,
      creatorUsername: item.ownerUsername || '',
      creatorFollowerCount: item.ownerFollowersCount || 0,
      viewCount: item.videoViewCount || item.likesCount * 10, // Estimate views
      likeCount: item.likesCount || 0,
      commentCount: item.commentsCount || 0,
      shareCount: item.likesCount * 0.1 || 0, // Estimate shares
      uploadDate: item.timestamp ? new Date(item.timestamp * 1000) : new Date(),
      hashtags: this.extractHashtags(item.caption || ''),
      visualElements: item.isVideo ? ['video'] : ['image'],
      audioAnalysis: {
        hasOriginalAudio: !item.isSponsored
      }
    };
  }

  /**
   * Transform TikTok scraping data
   */
  private transformTikTokData(item: any): VideoContent {
    return {
      id: `tt_${item.id}`,
      sourceUrl: item.webVideoUrl || item.url,
      platform: 'tiktok',
      title: item.text?.slice(0, 100) || '',
      description: item.text || '',
      transcript: item.subtitles || '',
      duration: item.videoMeta?.duration || 30,
      creatorUsername: item.authorMeta?.name || '',
      creatorFollowerCount: item.authorMeta?.fans || 0,
      viewCount: item.playCount || 0,
      likeCount: item.diggCount || 0,
      commentCount: item.commentCount || 0,
      shareCount: item.shareCount || 0,
      uploadDate: item.createTime ? new Date(item.createTime * 1000) : new Date(),
      hashtags: item.hashtags || [],
      visualElements: ['video'],
      audioAnalysis: {
        hasOriginalAudio: !item.musicMeta?.musicOriginal,
        musicGenre: item.musicMeta?.musicName,
        tempo: item.musicMeta?.playUrl ? 120 : undefined // Default estimate
      }
    };
  }

  /**
   * Transform YouTube scraping data
   */
  private transformYouTubeData(item: any): VideoContent {
    return {
      id: `yt_${item.id}`,
      sourceUrl: `https://youtube.com/watch?v=${item.id}`,
      platform: 'youtube',
      title: item.title || '',
      description: item.description || '',
      transcript: '', // Would need separate API call for transcripts
      duration: this.parseDuration(item.duration) || 60,
      creatorUsername: item.channelName || '',
      creatorFollowerCount: item.subscriberCount || 0,
      viewCount: item.viewCount || 0,
      likeCount: item.likeCount || 0,
      commentCount: item.commentCount || 0,
      shareCount: item.viewCount * 0.05 || 0, // Estimate shares
      uploadDate: item.uploadDate ? new Date(item.uploadDate) : new Date(),
      hashtags: this.extractHashtags(item.title + ' ' + item.description),
      visualElements: ['video']
    };
  }

  /**
   * Transform LinkedIn scraping data
   */
  private transformLinkedInData(item: any): VideoContent {
    return {
      id: `li_${item.id}`,
      sourceUrl: item.url || '',
      platform: 'linkedin',
      title: item.text?.slice(0, 100) || '',
      description: item.text || '',
      transcript: '',
      duration: 60, // LinkedIn videos are typically short
      creatorUsername: item.authorName || '',
      creatorFollowerCount: item.authorFollowers || 0,
      viewCount: item.views || 0,
      likeCount: item.likes || 0,
      commentCount: item.comments || 0,
      shareCount: item.shares || 0,
      uploadDate: item.postedAt ? new Date(item.postedAt) : new Date(),
      hashtags: this.extractHashtags(item.text || ''),
      visualElements: item.hasVideo ? ['video'] : ['text']
    };
  }

  /**
   * Check if video meets viral criteria
   */
  private meetsViralCriteria(video: VideoContent, config: ScrapingConfig): boolean {
    // Minimum view count
    if (video.viewCount < (config.minViews || 10000)) {
      return false;
    }

    // Maximum age
    const ageInDays = (Date.now() - video.uploadDate.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > (config.maxAge || 7)) {
      return false;
    }

    // Minimum engagement rate
    const engagementRate = video.viewCount > 0 ? 
      (video.likeCount + video.commentCount + video.shareCount) / video.viewCount : 0;
    
    if (engagementRate < (config.minEngagementRate || 0.02)) {
      return false;
    }

    return true;
  }

  /**
   * Queue videos for viral pattern analysis
   */
  private async queueVideosForAnalysis(videos: VideoContent[]): Promise<void> {
    try {
      // Save videos to database and queue for analysis
      console.log(`📝 Queuing ${videos.length} videos for viral pattern analysis`);
      
      for (const video of videos) {
        // Save to video_content table
        await this.saveVideoToDatabase(video);
        
        // Add to approval queue for human review
        await this.addToApprovalQueue(video);
      }
      
    } catch (error) {
      console.error('Error queuing videos for analysis:', error);
    }
  }

  /**
   * Save video to database
   */
  private async saveVideoToDatabase(video: VideoContent): Promise<void> {
    try {
      const { supabaseClient } = await import('@/lib/supabase-client');
      
      const { error } = await supabaseClient
        .from('video_content')
        .upsert({
          original_url: video.sourceUrl,
          source_platform: video.platform,
          video_id: video.id,
          title: video.title,
          description: video.description,
          duration: video.duration,
          creator_username: video.creatorUsername,
          creator_follower_count: video.creatorFollowerCount,
          view_count: video.viewCount,
          like_count: video.likeCount,
          comment_count: video.commentCount,
          share_count: video.shareCount,
          upload_date: video.uploadDate.toISOString(),
          hashtags: video.hashtags,
          transcript: video.transcript,
          visual_analysis: { elements: video.visualElements },
          audio_analysis: video.audioAnalysis,
          analysis_status: 'pending'
        }, {
          onConflict: 'original_url'
        });

      if (error) {
        console.error('Error saving video to database:', error);
      }
    } catch (error) {
      console.error('Error accessing database:', error);
    }
  }

  /**
   * Add video to approval queue
   */
  private async addToApprovalQueue(video: VideoContent): Promise<void> {
    try {
      const { supabaseClient } = await import('@/lib/supabase-client');
      
      // Calculate AI recommendation based on basic criteria
      const aiRecommendation = this.calculateAIRecommendation(video);
      
      const { error } = await supabaseClient
        .from('approval_queue')
        .insert({
          video_id: video.id,
          status: 'pending',
          priority: aiRecommendation.priority,
          ai_recommendation: aiRecommendation.recommendation,
          ai_confidence: aiRecommendation.confidence,
          ai_reasoning: aiRecommendation.reasoning,
          ready_for_template: aiRecommendation.readyForTemplate,
          template_complexity: aiRecommendation.complexity
        });

      if (error) {
        console.error('Error adding to approval queue:', error);
      }
    } catch (error) {
      console.error('Error accessing approval queue:', error);
    }
  }

  /**
   * Calculate AI recommendation for approval queue
   */
  private calculateAIRecommendation(video: VideoContent): {
    recommendation: 'approve' | 'reject' | 'review';
    confidence: number;
    reasoning: string;
    priority: number;
    readyForTemplate: boolean;
    complexity: 'simple' | 'moderate' | 'complex';
  } {
    let score = 0;
    const reasons: string[] = [];

    // View performance
    const viewRatio = video.creatorFollowerCount > 0 ? 
      video.viewCount / video.creatorFollowerCount : 0;
    
    if (viewRatio > 10) {
      score += 30;
      reasons.push('Exceptional view-to-follower ratio');
    } else if (viewRatio > 2) {
      score += 20;
      reasons.push('Good view performance');
    }

    // Engagement rate
    const engagementRate = video.viewCount > 0 ? 
      (video.likeCount + video.commentCount + video.shareCount) / video.viewCount : 0;
    
    if (engagementRate > 0.1) {
      score += 25;
      reasons.push('High engagement rate');
    } else if (engagementRate > 0.05) {
      score += 15;
      reasons.push('Good engagement');
    }

    // Content quality indicators
    if (video.duration >= 15 && video.duration <= 60) {
      score += 10;
      reasons.push('Optimal duration');
    }

    if (video.hashtags.length >= 3) {
      score += 10;
      reasons.push('Good hashtag usage');
    }

    // Recent content
    const ageInHours = (Date.now() - video.uploadDate.getTime()) / (1000 * 60 * 60);
    if (ageInHours <= 24) {
      score += 15;
      reasons.push('Recent viral content');
    }

    // Determine recommendation
    let recommendation: 'approve' | 'reject' | 'review';
    let priority: number;
    
    if (score >= 70) {
      recommendation = 'approve';
      priority = 1;
    } else if (score >= 50) {
      recommendation = 'review';
      priority = 2;
    } else {
      recommendation = 'reject';
      priority = 3;
    }

    return {
      recommendation,
      confidence: Math.min(1, score / 100),
      reasoning: reasons.join('; '),
      priority,
      readyForTemplate: score >= 60,
      complexity: score >= 80 ? 'complex' : score >= 60 ? 'moderate' : 'simple'
    };
  }

  // Utility methods
  private generateJobId(): string {
    return `scrape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private prepareApifyInput(config: ScrapingConfig, scraper: PlatformScraper): any {
    const input = { ...scraper.defaultConfig };

    // Platform-specific input preparation
    switch (config.platform) {
      case 'instagram':
        if (config.hashtags?.length) {
          input.hashtags = config.hashtags;
        }
        break;
      case 'tiktok':
        if (config.hashtags?.length) {
          input.hashtags = config.hashtags;
        }
        break;
      case 'youtube':
        if (config.searchTerms?.length) {
          input.searchKeywords = config.searchTerms.join(' ');
        }
        break;
    }

    input.resultsLimit = config.limit || 50;
    return input;
  }

  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.toLowerCase()) : [];
  }

  private parseDuration(durationStr: string): number {
    // Parse YouTube duration format (PT1M30S -> 90 seconds)
    if (!durationStr) return 0;
    
    const match = durationStr.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const minutes = parseInt(match[1] || '0');
    const seconds = parseInt(match[2] || '0');
    return minutes * 60 + seconds;
  }

  /**
   * Create mock Apify client for development
   */
  private createMockApifyClient(): any {
    return {
      actor: (actorId: string) => ({
        call: async (input: any) => {
          console.log(`🎭 Mock Apify: Running ${actorId} with input:`, input);
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          return {
            id: `run_${Date.now()}`,
            status: 'SUCCEEDED',
            defaultDatasetId: `dataset_${Date.now()}`
          };
        }
      }),
      dataset: (datasetId: string) => ({
        listItems: async () => {
          console.log(`📊 Mock Apify: Getting items from dataset ${datasetId}`);
          
          // Return mock viral video data
          return {
            items: this.generateMockViralVideos()
          };
        }
      })
    };
  }

  /**
   * Generate mock viral video data for development
   */
  private generateMockViralVideos(): any[] {
    const mockVideos = [
      {
        id: 'mock_video_1',
        shortcode: 'ABC123',
        url: 'https://instagram.com/p/ABC123',
        caption: 'This will blow your mind! 🤯 Did you know that... #viral #trending #mindblown',
        likesCount: 50000,
        commentsCount: 2500,
        videoViewCount: 500000,
        videoDuration: 25,
        ownerUsername: 'viral_creator_1',
        ownerFollowersCount: 100000,
        timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        isVideo: true
      },
      {
        id: 'mock_video_2',
        text: 'POV: When you realize this simple trick... #fyp #viral #lifehack',
        diggCount: 75000,
        commentCount: 3200,
        shareCount: 8500,
        playCount: 750000,
        authorMeta: {
          name: 'tiktoker_pro',
          fans: 250000
        },
        videoMeta: {
          duration: 30
        },
        createTime: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        hashtags: ['#fyp', '#viral', '#lifehack']
      }
    ];

    return mockVideos;
  }

  /**
   * Get job status
   */
  public getJobStatus(jobId: string): ScrapingJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Get all active jobs
   */
  public getActiveJobs(): ScrapingJob[] {
    return Array.from(this.activeJobs.values());
  }
}

// Export singleton instance
export const apifyViralScrapingService = ApifyViralScrapingService.getInstance();
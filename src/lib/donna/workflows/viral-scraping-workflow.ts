/**
 * Viral Scraping Workflow - Framework 1
 *
 * This workflow:
 * 1. Monitors viral creators and hashtags via Apify
 * 2. Scrapes fresh videos (<15 min old)
 * 3. The Donna predicts DPS immediately
 * 4. Tracks performance at intervals: 5min, 30min, 1hr, 24hr, 7day
 * 5. Validates predictions against actual results
 */

import { createClient } from '@supabase/supabase-js';
import { apifyIntegration, ApifyVideoResult } from '../services/apify-integration';
import { VIRAL_CREATORS, VIRAL_HASHTAGS } from './viral-creator-config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// TYPES
// ============================================================================

export interface ViralCreator {
  username: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  followerCount: number;
  niche: string;
  historicalDPS: number; // Average DPS of their past content
  lastChecked?: Date;
}

export interface ViralHashtag {
  tag: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  niche: string;
  avgDPS: number;
}

export interface ScrapingConfig {
  // Viral creators to monitor
  creators: ViralCreator[];

  // Viral hashtags to track
  hashtags: ViralHashtag[];

  // Scraping frequency (minutes)
  pollingInterval: number; // Default: 5 minutes

  // Freshness threshold (minutes)
  maxAgeMinutes: number; // Default: 15 minutes

  // Filters
  minViews: number; // Default: 0 (for fresh videos)
  maxViews: number; // Default: 10000 (indicates fresh, not yet viral)
  minDuration: number; // Default: 7 seconds
  maxDuration: number; // Default: 45 seconds
}

export interface FreshVideo {
  videoId: string;
  url: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  creatorUsername: string;
  creatorFollowers: number;

  // Metadata
  title?: string;
  caption: string;
  hashtags: string[];
  soundId?: string;
  duration: number;

  // Timestamps
  publishedAt: Date;
  scrapedAt: Date;
  ageMinutes: number;

  // Initial metrics (should be minimal)
  initialViews: number;
  initialLikes: number;
  initialComments: number;
  initialShares: number;

  // Content
  transcript?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
}

export interface DonnaPrediction {
  videoId: string;
  predictedDPS: number;
  confidence: number;
  predictionRange: [number, number];

  // What The Donna identified
  identifiedPatterns: string[];
  viralScore: number;
  recommendations: string[];

  // Metadata
  predictedAt: Date;
  modelsUsed: string[];
  processingTime: number; // milliseconds
}

export interface TrackingCheckpoint {
  videoId: string;
  checkpointTime: '5min' | '30min' | '1hr' | '4hr' | '24hr' | '7day';
  scheduledFor: Date;
  completedAt?: Date;

  // Metrics at this checkpoint
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;

  // Calculated at checkpoint
  actualDPS: number;
  velocity: number; // Views per hour
}

export interface ValidationResult {
  videoId: string;

  // Prediction
  predictedDPS: number;
  predictedAt: Date;

  // Actuals at different checkpoints
  checkpoints: TrackingCheckpoint[];

  // Final validation (24hr or 7day)
  finalDPS: number;
  finalCheckpoint: '24hr' | '7day';

  // Accuracy metrics
  error: number; // Absolute error in DPS points
  percentError: number; // Percentage error
  withinRange: boolean; // Was actual within predicted range?

  // Classification accuracy
  predictedViral: boolean; // Predicted DPS >= 70
  actualViral: boolean; // Actual DPS >= 70
  correctClassification: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const DEFAULT_SCRAPING_CONFIG: ScrapingConfig = {
  creators: [], // To be populated
  hashtags: [], // To be populated
  pollingInterval: 5, // Check every 5 minutes
  maxAgeMinutes: 15, // Videos must be <15 min old
  minViews: 0,
  maxViews: 10000, // Fresh videos only
  minDuration: 7,
  maxDuration: 45
};

// ============================================================================
// VIRAL SCRAPING WORKFLOW
// ============================================================================

export class ViralScrapingWorkflow {
  private static instance: ViralScrapingWorkflow;
  private config: ScrapingConfig;
  private running: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private stats = {
    totalCycles: 0,
    totalVideosScraped: 0,
    totalPredictions: 0,
    lastCycleAt: null as Date | null,
    errors: 0
  };

  private constructor(config: Partial<ScrapingConfig> = {}) {
    this.config = {
      ...DEFAULT_SCRAPING_CONFIG,
      creators: VIRAL_CREATORS,
      hashtags: VIRAL_HASHTAGS,
      ...config
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<ScrapingConfig>): ViralScrapingWorkflow {
    if (!ViralScrapingWorkflow.instance) {
      ViralScrapingWorkflow.instance = new ViralScrapingWorkflow(config);
    }
    return ViralScrapingWorkflow.instance;
  }

  /**
   * Check if workflow is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get workflow status
   */
  async getStatus() {
    // Get database stats
    const { data: totalPredictions } = await supabase
      .from('prediction_validations')
      .select('*', { count: 'exact', head: true });

    const { data: completedValidations } = await supabase
      .from('prediction_validations')
      .select('*', { count: 'exact', head: true })
      .eq('tracking_status', 'completed');

    const { data: pendingCheckpoints } = await supabase
      .from('tracking_checkpoints')
      .select('*', { count: 'exact', head: true })
      .eq('completed', false);

    return {
      running: this.running,
      config: {
        pollingInterval: this.config.pollingInterval,
        maxAgeMinutes: this.config.maxAgeMinutes,
        creatorsMonitored: this.config.creators.length,
        hashtagsTracked: this.config.hashtags.length
      },
      statistics: {
        ...this.stats,
        totalPredictions: totalPredictions?.length || 0,
        completedValidations: completedValidations?.length || 0,
        pendingCheckpoints: pendingCheckpoints?.length || 0
      },
      lastCycle: this.stats.lastCycleAt?.toISOString() || null
    };
  }

  /**
   * Start the viral scraping workflow
   * Runs continuously, polling every N minutes
   */
  async start(): Promise<void> {
    if (this.running) {
      console.log('⚠️  Workflow already running');
      return;
    }

    this.running = true;
    console.log('🚀 Starting Viral Scraping Workflow');
    console.log(`   Polling every ${this.config.pollingInterval} minutes`);
    console.log(`   Monitoring ${this.config.creators.length} creators`);
    console.log(`   Tracking ${this.config.hashtags.length} hashtags`);

    // Initial run
    await this.runScrapingCycle();

    // Schedule periodic runs
    const intervalMs = this.config.pollingInterval * 60 * 1000;
    this.intervalId = setInterval(async () => {
      if (this.running) {
        await this.runScrapingCycle();
      }
    }, intervalMs);
  }

  /**
   * Stop the workflow
   */
  async stop(): Promise<void> {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('🛑 Stopping Viral Scraping Workflow');
  }

  /**
   * Run a single scraping cycle
   */
  private async runScrapingCycle(): Promise<void> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 SCRAPING CYCLE STARTED');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      this.stats.totalCycles++;

      // Step 1: Scrape fresh videos
      const freshVideos = await this.scrapeFreshVideos();
      console.log(`✅ Scraped ${freshVideos.length} fresh videos`);
      this.stats.totalVideosScraped += freshVideos.length;

      if (freshVideos.length === 0) {
        console.log('   No new videos found this cycle\n');
        this.stats.lastCycleAt = new Date();
        return;
      }

      // Step 2: The Donna predicts for each video
      const predictions = await this.predictAllVideos(freshVideos);
      console.log(`✅ Generated ${predictions.length} predictions`);
      this.stats.totalPredictions += predictions.length;

      // Step 3: Store predictions and schedule tracking
      await this.storePredictionsAndScheduleTracking(freshVideos, predictions);
      console.log(`✅ Stored predictions and scheduled tracking\n`);

      this.stats.lastCycleAt = new Date();

    } catch (error) {
      console.error('❌ Error in scraping cycle:', error);
      this.stats.errors++;
    }
  }

  /**
   * Scrape fresh videos from monitored creators and hashtags
   */
  private async scrapeFreshVideos(): Promise<FreshVideo[]> {
    console.log('📥 Step 1: Scraping fresh videos...');

    const freshVideos: FreshVideo[] = [];

    // Scrape from viral creators
    for (const creator of this.config.creators) {
      const videos = await this.scrapeCreator(creator);
      freshVideos.push(...videos);
    }

    // Scrape from viral hashtags
    for (const hashtag of this.config.hashtags) {
      const videos = await this.scrapeHashtag(hashtag);
      freshVideos.push(...videos);
    }

    // Remove duplicates
    const uniqueVideos = this.deduplicateVideos(freshVideos);

    return uniqueVideos;
  }

  /**
   * Scrape videos from a specific creator
   */
  private async scrapeCreator(creator: ViralCreator): Promise<FreshVideo[]> {
    console.log(`   Checking creator: @${creator.username}`);

    try {
      // Scrape using Apify
      const apifyVideos = await apifyIntegration.scrapeProfiles(
        [creator.username],
        10 // Get latest 10 videos
      );

      // Filter for fresh videos only
      let freshVideos = apifyIntegration.filterFreshVideos(
        apifyVideos,
        this.config.maxAgeMinutes
      );

      // Filter by view count (fresh = low views)
      freshVideos = apifyIntegration.filterByViews(
        freshVideos,
        this.config.minViews,
        this.config.maxViews
      );

      // Filter by duration
      freshVideos = apifyIntegration.filterByDuration(
        freshVideos,
        this.config.minDuration,
        this.config.maxDuration
      );

      // Convert to our format
      const videos = freshVideos.map(v => apifyIntegration.convertToFreshVideo(v));

      console.log(`      Found ${videos.length} fresh videos`);
      return videos;

    } catch (error) {
      console.error(`      Error scraping @${creator.username}:`, error);
      return [];
    }
  }

  /**
   * Scrape videos from a hashtag
   */
  private async scrapeHashtag(hashtag: ViralHashtag): Promise<FreshVideo[]> {
    console.log(`   Checking hashtag: #${hashtag.tag}`);

    try {
      // Scrape using Apify
      const apifyVideos = await apifyIntegration.scrapeHashtags(
        [hashtag.tag],
        20 // Get latest 20 videos per hashtag
      );

      // Filter for fresh videos only
      let freshVideos = apifyIntegration.filterFreshVideos(
        apifyVideos,
        this.config.maxAgeMinutes
      );

      // Filter by view count (fresh = low views)
      freshVideos = apifyIntegration.filterByViews(
        freshVideos,
        this.config.minViews,
        this.config.maxViews
      );

      // Filter by duration
      freshVideos = apifyIntegration.filterByDuration(
        freshVideos,
        this.config.minDuration,
        this.config.maxDuration
      );

      // Convert to our format
      const videos = freshVideos.map(v => apifyIntegration.convertToFreshVideo(v));

      console.log(`      Found ${videos.length} fresh videos`);
      return videos;

    } catch (error) {
      console.error(`      Error scraping #${hashtag.tag}:`, error);
      return [];
    }
  }

  /**
   * Remove duplicate videos
   */
  private deduplicateVideos(videos: FreshVideo[]): FreshVideo[] {
    const seen = new Set<string>();
    return videos.filter(video => {
      if (seen.has(video.videoId)) {
        return false;
      }
      seen.add(video.videoId);
      return true;
    });
  }

  /**
   * Generate predictions for all scraped videos
   */
  private async predictAllVideos(videos: FreshVideo[]): Promise<DonnaPrediction[]> {
    console.log('🎯 Step 2: Generating predictions...');

    const predictions: DonnaPrediction[] = [];

    for (const video of videos) {
      try {
        const prediction = await this.predictVideo(video);
        predictions.push(prediction);

        console.log(`   ✓ ${video.videoId}: DPS ${prediction.predictedDPS} (confidence: ${(prediction.confidence * 100).toFixed(0)}%)`);
      } catch (error) {
        console.error(`   ✗ Failed to predict ${video.videoId}:`, error);
      }
    }

    return predictions;
  }

  /**
   * Generate prediction for a single video using The Donna
   */
  private async predictVideo(video: FreshVideo): Promise<DonnaPrediction> {
    const startTime = Date.now();

    try {
      // Call The Donna's universal reasoning API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/donna/reason`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: {
            type: 'fresh_video',
            data: {
              transcript: video.transcript,
              caption: video.caption,
              hashtags: video.hashtags,
              duration: video.duration,
              creatorFollowers: video.creatorFollowers,
              initialViews: video.initialViews
            }
          },
          mode: 'balanced'
        })
      });

      if (!response.ok) {
        throw new Error(`The Donna API error: ${response.statusText}`);
      }

      const result = await response.json();

      // Convert API response to DonnaPrediction format
      const prediction: DonnaPrediction = {
        videoId: video.videoId,
        predictedDPS: result.prediction.predictedDPS,
        confidence: result.prediction.confidence,
        predictionRange: result.prediction.predictionRange,
        identifiedPatterns: result.analysis.identifiedPatterns,
        viralScore: result.prediction.predictedDPS / 100, // Convert DPS to 0-1 scale
        recommendations: result.recommendations,
        predictedAt: new Date(result.prediction.predictedAt),
        modelsUsed: result.analysis.modelsUsed,
        processingTime: Date.now() - startTime
      };

      return prediction;

    } catch (error) {
      console.error(`Error predicting video ${video.videoId}:`, error);

      // Fallback to basic heuristic if API fails
      return {
        videoId: video.videoId,
        predictedDPS: 50,
        confidence: 0.5,
        predictionRange: [40, 60],
        identifiedPatterns: ['api-unavailable'],
        viralScore: 0.5,
        recommendations: ['The Donna API unavailable - using fallback prediction'],
        predictedAt: new Date(),
        modelsUsed: ['fallback-heuristic'],
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Store predictions and schedule tracking checkpoints
   */
  private async storePredictionsAndScheduleTracking(
    videos: FreshVideo[],
    predictions: DonnaPrediction[]
  ): Promise<void> {
    console.log('💾 Step 3: Storing predictions and scheduling tracking...');

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const prediction = predictions[i];

      if (!prediction) continue;

      try {
        // Store in database
        await this.storePrediction(video, prediction);

        // Schedule tracking checkpoints
        await this.scheduleTrackingCheckpoints(video, prediction);

      } catch (error) {
        console.error(`   Error storing ${video.videoId}:`, error);
      }
    }
  }

  /**
   * Store prediction in database
   */
  private async storePrediction(
    video: FreshVideo,
    prediction: DonnaPrediction
  ): Promise<void> {
    // Store in prediction_validations table
    const { error } = await supabase
      .from('prediction_validations')
      .insert({
        video_id: video.videoId,
        video_url: video.url,
        platform: video.platform,
        creator_username: video.creatorUsername,
        creator_followers: video.creatorFollowers,

        // Prediction
        predicted_dps: prediction.predictedDPS,
        prediction_confidence: prediction.confidence,
        prediction_range_min: prediction.predictionRange[0],
        prediction_range_max: prediction.predictionRange[1],
        predicted_at: prediction.predictedAt.toISOString(),

        // Initial state
        initial_views: video.initialViews,
        initial_likes: video.initialLikes,
        initial_comments: video.initialComments,
        initial_shares: video.initialShares,

        // Metadata
        identified_patterns: prediction.identifiedPatterns,
        models_used: prediction.modelsUsed,
        processing_time_ms: prediction.processingTime,

        // Tracking status
        tracking_status: 'scheduled',
        next_checkpoint: '5min'
      });

    if (error) {
      throw new Error(`Failed to store prediction: ${error.message}`);
    }
  }

  /**
   * Schedule tracking checkpoints for a video
   */
  private async scheduleTrackingCheckpoints(
    video: FreshVideo,
    prediction: DonnaPrediction
  ): Promise<void> {
    const now = new Date();

    const checkpoints: { time: string; delayMinutes: number }[] = [
      { time: '5min', delayMinutes: 5 },
      { time: '30min', delayMinutes: 30 },
      { time: '1hr', delayMinutes: 60 },
      { time: '4hr', delayMinutes: 240 },
      { time: '24hr', delayMinutes: 1440 },
      { time: '7day', delayMinutes: 10080 }
    ];

    for (const checkpoint of checkpoints) {
      const scheduledFor = new Date(now.getTime() + checkpoint.delayMinutes * 60 * 1000);

      await supabase
        .from('tracking_checkpoints')
        .insert({
          video_id: video.videoId,
          checkpoint_time: checkpoint.time,
          scheduled_for: scheduledFor.toISOString(),
          completed: false
        });
    }
  }
}

// ============================================================================
// TRACKING SYSTEM
// ============================================================================

export class TrackingSystem {
  private static instance: TrackingSystem;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): TrackingSystem {
    if (!TrackingSystem.instance) {
      TrackingSystem.instance = new TrackingSystem();
    }
    return TrackingSystem.instance;
  }

  /**
   * Process due tracking checkpoints
   * Should be run every 1-5 minutes
   */
  async processDueCheckpoints(): Promise<any[]> {
    console.log('\n🔍 Processing due tracking checkpoints...');

    // Get all due checkpoints
    const { data: dueCheckpoints, error } = await supabase
      .from('tracking_checkpoints')
      .select('*')
      .eq('completed', false)
      .lte('scheduled_for', new Date().toISOString())
      .limit(100);

    if (error) {
      console.error('Error fetching due checkpoints:', error);
      return [];
    }

    if (!dueCheckpoints || dueCheckpoints.length === 0) {
      console.log('   No due checkpoints');
      return [];
    }

    console.log(`   Found ${dueCheckpoints.length} due checkpoints`);

    const results = [];
    for (const checkpoint of dueCheckpoints) {
      try {
        await this.processCheckpoint(checkpoint);
        results.push({
          videoId: checkpoint.video_id,
          checkpoint: checkpoint.checkpoint_time,
          success: true
        });
      } catch (error) {
        console.error(`   Error processing checkpoint ${checkpoint.id}:`, error);
        results.push({
          videoId: checkpoint.video_id,
          checkpoint: checkpoint.checkpoint_time,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Process a single tracking checkpoint
   */
  private async processCheckpoint(checkpoint: any): Promise<void> {
    console.log(`   Processing ${checkpoint.video_id} @ ${checkpoint.checkpoint_time}`);

    // Fetch current metrics for this video
    const metrics = await this.fetchVideoMetrics(checkpoint.video_id);

    if (!metrics) {
      console.log(`   ⚠️  Could not fetch metrics for ${checkpoint.video_id}`);
      return;
    }

    // Calculate DPS at this checkpoint
    const dps = this.calculateDPS(metrics);

    // Store checkpoint results
    await supabase
      .from('tracking_checkpoints')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        views: metrics.views,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        saves: metrics.saves,
        actual_dps: dps,
        velocity: metrics.views / this.getCheckpointHours(checkpoint.checkpoint_time)
      })
      .eq('id', checkpoint.id);

    // If this is a final checkpoint (24hr or 7day), create validation result
    if (checkpoint.checkpoint_time === '24hr' || checkpoint.checkpoint_time === '7day') {
      await this.createValidationResult(checkpoint.video_id, checkpoint.checkpoint_time);
    }

    console.log(`   ✓ DPS at ${checkpoint.checkpoint_time}: ${dps.toFixed(1)}`);
  }

  /**
   * Fetch current video metrics
   */
  private async fetchVideoMetrics(videoId: string): Promise<any | null> {
    try {
      // Use Apify to fetch fresh metrics for this video
      const video = await apifyIntegration.getVideoMetrics(videoId);

      if (!video) {
        return null;
      }

      return {
        views: video.playCount,
        likes: video.diggCount,
        comments: video.commentCount,
        shares: video.shareCount,
        saves: 0 // TikTok API doesn't provide saves count
      };
    } catch (error) {
      console.error(`      Error fetching metrics for ${videoId}:`, error);
      return null;
    }
  }

  /**
   * Calculate DPS from metrics
   */
  private calculateDPS(metrics: any): number {
    // Simplified DPS calculation
    const engagement = metrics.likes + metrics.comments + metrics.shares;
    return (engagement / metrics.views) * 100;
  }

  /**
   * Get hours for checkpoint
   */
  private getCheckpointHours(checkpoint: string): number {
    const map: Record<string, number> = {
      '5min': 5 / 60,
      '30min': 0.5,
      '1hr': 1,
      '4hr': 4,
      '24hr': 24,
      '7day': 168
    };
    return map[checkpoint] || 1;
  }

  /**
   * Create validation result after final checkpoint
   */
  private async createValidationResult(
    videoId: string,
    finalCheckpoint: '24hr' | '7day'
  ): Promise<void> {
    // Fetch prediction
    const { data: prediction } = await supabase
      .from('prediction_validations')
      .select('*')
      .eq('video_id', videoId)
      .single();

    if (!prediction) {
      console.error(`   No prediction found for ${videoId}`);
      return;
    }

    // Fetch all checkpoints
    const { data: checkpoints } = await supabase
      .from('tracking_checkpoints')
      .select('*')
      .eq('video_id', videoId)
      .eq('completed', true)
      .order('checkpoint_time');

    if (!checkpoints || checkpoints.length === 0) {
      console.error(`   No checkpoints found for ${videoId}`);
      return;
    }

    // Get final DPS
    const finalCheckpointData = checkpoints.find(c => c.checkpoint_time === finalCheckpoint);
    const finalDPS = finalCheckpointData?.actual_dps || 0;

    // Calculate accuracy metrics
    const error = Math.abs(prediction.predicted_dps - finalDPS);
    const percentError = (error / finalDPS) * 100;
    const withinRange = finalDPS >= prediction.prediction_range_min &&
                        finalDPS <= prediction.prediction_range_max;

    const predictedViral = prediction.predicted_dps >= 70;
    const actualViral = finalDPS >= 70;
    const correctClassification = predictedViral === actualViral;

    // Update prediction validation record
    await supabase
      .from('prediction_validations')
      .update({
        final_dps: finalDPS,
        final_checkpoint: finalCheckpoint,
        error: error,
        percent_error: percentError,
        within_range: withinRange,
        predicted_viral: predictedViral,
        actual_viral: actualViral,
        correct_classification: correctClassification,
        validated_at: new Date().toISOString(),
        tracking_status: 'completed'
      })
      .eq('video_id', videoId);

    console.log(`   ✅ Validation complete for ${videoId}`);
    console.log(`      Predicted: ${prediction.predicted_dps.toFixed(1)} | Actual: ${finalDPS.toFixed(1)} | Error: ${error.toFixed(1)}`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ViralScrapingWorkflow;

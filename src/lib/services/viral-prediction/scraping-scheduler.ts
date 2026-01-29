/**
 * Scraping Scheduler
 * Manages 24/7 automated scraping operations
 * Coordinates all Apify actors for continuous data collection
 */

import { ApifyScraperManager } from './apify-scraper-manager';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';

export interface ScheduleConfig {
  dailyScrapingTime: string; // Format: "HH:MM" (24-hour)
  trendingInterval: number; // Hours between trending scrapes
  hashtagInterval: number; // Hours between hashtag updates
  soundInterval: number; // Hours between sound updates
  maxConcurrentJobs: number;
  enabled: boolean;
  // New: daily caps to control spend
  dailyIngestCap?: number; // max videos to ingest per day
  dailyPredictionCap?: number; // max predictions to run per day
}

export interface ScheduleJob {
  id: string;
  name: string;
  schedule: string;
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'running';
  results?: any;
}

export class ScrapingScheduler {
  private scraperManager: ApifyScraperManager;
  private supabase;
  private schedules: Map<string, any>; // cron.ScheduledTask
  private config: ScheduleConfig;
  private isRunning: boolean;

  constructor(config?: Partial<ScheduleConfig>) {
    this.scraperManager = new ApifyScraperManager({
      apiToken: process.env.APIFY_API_TOKEN!
    });
    
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    
    this.schedules = new Map();
    this.isRunning = false;
    
    this.config = {
      dailyScrapingTime: '02:00', // 2 AM
      trendingInterval: 6, // Every 6 hours
      hashtagInterval: 24, // Daily
      soundInterval: 24, // Daily
      maxConcurrentJobs: 3,
      enabled: true,
      dailyIngestCap: 150,
      dailyPredictionCap: 60,
      ...config
    };
  }

  /**
   * Start all scheduled jobs
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Scheduler is already running');
      return;
    }

    console.log('🚀 Starting scraping scheduler...');
    this.isRunning = true;

    // Schedule daily comprehensive scraping (with cap)
    this.scheduleDailyScraping();

    // Schedule trending video updates
    this.scheduleTrendingUpdates();

    // Schedule hashtag and sound updates
    this.scheduleMetadataUpdates();

    // Log scheduler status
    await this.logSchedulerStatus('started');
    
    console.log('✅ Scraping scheduler started successfully');
  }

  /**
   * Stop all scheduled jobs
   */
  public async stop(): Promise<void> {
    console.log('🛑 Stopping scraping scheduler...');
    
    // Stop all cron jobs
    for (const [jobId, task] of this.schedules) {
      task.stop();
      console.log(`⏹️ Stopped job: ${jobId}`);
    }
    
    this.schedules.clear();
    this.isRunning = false;
    
    await this.logSchedulerStatus('stopped');
    console.log('✅ Scraping scheduler stopped');
  }

  /**
   * Schedule daily comprehensive scraping
   */
  private scheduleDailyScraping(): void {
    const [hour, minute] = this.config.dailyScrapingTime.split(':');
    const cronExpression = `${minute} ${hour} * * *`; // Daily at specified time

    const task = cron.schedule(cronExpression, async () => {
      console.log('🌅 Starting daily comprehensive scraping...');
      
      try {
        await this.logJobStart('daily_comprehensive');
        
        // Run comprehensive daily scraping with daily ingest cap
        const cap = this.config.dailyIngestCap ?? 150;
        const results = await this.scraperManager.runDailyScraping(cap);
        
        // Store results
        await this.storeScrapingResults('daily_comprehensive', results);
        
        // Trigger viral prediction analysis but respect daily prediction cap
        const predictionsRemaining = await this.getRemainingPredictionAllowance();
        const toPredict = Math.max(0, Math.min(predictionsRemaining, results.totalVideos));
        if (toPredict > 0) {
          await this.triggerViralAnalysis(toPredict);
        } else {
          console.log('⏸️ Prediction cap reached for today; skipping analysis trigger');
        }
        
        await this.logJobComplete('daily_comprehensive', results);
        
        console.log(`✅ Daily scraping complete: ${results.totalVideos} videos processed`);
        
      } catch (error) {
        console.error('Daily scraping error:', error);
        await this.logJobError('daily_comprehensive', error);
      }
    });

    task.start();
    this.schedules.set('daily_comprehensive', task);
    console.log(`📅 Scheduled daily scraping at ${this.config.dailyScrapingTime}`);
  }

  /**
   * Schedule trending video updates
   */
  private scheduleTrendingUpdates(): void {
    const cronExpression = `0 */${this.config.trendingInterval} * * *`; // Every N hours

    const task = cron.schedule(cronExpression, async () => {
      console.log('📈 Starting trending videos update...');
      
      try {
        await this.logJobStart('trending_update');
        
        // Scrape latest trending videos
        const job = await this.scraperManager.scrapeTrendingVideos({
          maxItems: 50, // Smaller batch for frequent updates
          includeComments: true,
          includeTranscripts: false // Save on compute
        });
        
        await this.logJobComplete('trending_update', job);
        
        console.log(`✅ Trending update complete: ${job.videosProcessed} videos`);
        
      } catch (error) {
        console.error('Trending update error:', error);
        await this.logJobError('trending_update', error);
      }
    });

    task.start();
    this.schedules.set('trending_update', task);
    console.log(`📅 Scheduled trending updates every ${this.config.trendingInterval} hours`);
  }

  /**
   * Schedule hashtag and sound metadata updates
   */
  private scheduleMetadataUpdates(): void {
    // Hashtag updates
    const hashtagCron = `0 0 */${this.config.hashtagInterval} * * *`;
    
    const hashtagTask = cron.schedule(hashtagCron, async () => {
      console.log('#️⃣ Updating trending hashtags...');
      
      try {
        await this.logJobStart('hashtag_update');
        
        const { hashtags, job } = await this.scraperManager.scrapeTrendingHashtags();
        
        // Scrape videos for top 3 new hashtags
        const topHashtags = hashtags.slice(0, 3);
        for (const hashtag of topHashtags) {
          await this.scraperManager.scrapeHashtagVideos(hashtag.name, 20);
        }
        
        await this.logJobComplete('hashtag_update', { hashtags: hashtags.length });
        
        console.log(`✅ Hashtag update complete: ${hashtags.length} hashtags`);
        
      } catch (error) {
        console.error('Hashtag update error:', error);
        await this.logJobError('hashtag_update', error);
      }
    });

    hashtagTask.start();
    this.schedules.set('hashtag_update', hashtagTask);

    // Sound updates
    const soundCron = `0 30 */${this.config.soundInterval} * * *`;
    
    const soundTask = cron.schedule(soundCron, async () => {
      console.log('🎵 Updating trending sounds...');
      
      try {
        await this.logJobStart('sound_update');
        
        const { sounds, job } = await this.scraperManager.scrapeTrendingSounds();
        
        await this.logJobComplete('sound_update', { sounds: sounds.length });
        
        console.log(`✅ Sound update complete: ${sounds.length} sounds`);
        
      } catch (error) {
        console.error('Sound update error:', error);
        await this.logJobError('sound_update', error);
      }
    });

    soundTask.start();
    this.schedules.set('sound_update', soundTask);
    
    console.log('📅 Scheduled metadata updates');
  }

  /**
   * Trigger viral prediction analysis for new videos
   */
  private async triggerViralAnalysis(videoCount: number): Promise<void> {
    try {
      console.log(`🧪 Triggering viral analysis for ${videoCount} new videos...`);
      
      // Call viral prediction API to analyze new videos
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/viral-prediction/batch-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
        },
        body: JSON.stringify({
          source: 'scheduled_scraping',
          videoCount,
          priority: 'normal'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Viral analysis triggered: ${result.jobId}`);
      } else {
        console.error('Failed to trigger viral analysis');
      }
      
    } catch (error) {
      console.error('Error triggering viral analysis:', error);
    }
  }

  /**
   * Get scheduler status
   */
  public getStatus(): {
    isRunning: boolean;
    config: ScheduleConfig;
    jobs: ScheduleJob[];
  } {
    const jobs: ScheduleJob[] = [];
    
    for (const [jobId, task] of this.schedules) {
      jobs.push({
        id: jobId,
        name: this.getJobName(jobId),
        schedule: this.getJobSchedule(jobId),
        status: 'active',
        lastRun: undefined, // Would be tracked in production
        nextRun: this.getNextRunTime(jobId)
      });
    }
    
    return {
      isRunning: this.isRunning,
      config: this.config,
      jobs
    };
  }

  /**
   * Update scheduler configuration
   */
  public async updateConfig(newConfig: Partial<ScheduleConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    // Restart scheduler with new config
    if (this.isRunning) {
      await this.stop();
      await this.start();
    }
    
    console.log('✅ Scheduler configuration updated');
  }

  // Helper methods for logging and tracking
  private async logSchedulerStatus(status: string): Promise<void> {
    try {
      await this.supabase
        .from('scheduler_logs')
        .insert({
          event: 'scheduler_status',
          status,
          config: JSON.stringify(this.config),
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging scheduler status:', error);
    }
  }

  private async logJobStart(jobId: string): Promise<void> {
    try {
      await this.supabase
        .from('scraping_jobs')
        .insert({
          job_id: `${jobId}_${Date.now()}`,
          job_type: jobId,
          status: 'running',
          started_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging job start:', error);
    }
  }

  private async logJobComplete(jobId: string, results: any): Promise<void> {
    try {
      await this.supabase
        .from('scraping_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          results: JSON.stringify(results)
        })
        .eq('job_type', jobId)
        .order('started_at', { ascending: false })
        .limit(1);
    } catch (error) {
      console.error('Error logging job completion:', error);
    }
  }

  private async logJobError(jobId: string, error: any): Promise<void> {
    try {
      await this.supabase
        .from('scraping_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('job_type', jobId)
        .order('started_at', { ascending: false })
        .limit(1);
    } catch (error) {
      console.error('Error logging job error:', error);
    }
  }

  private async storeScrapingResults(jobType: string, results: any): Promise<void> {
    try {
      await this.supabase
        .from('scraping_results')
        .insert({
          job_type: jobType,
          videos_processed: results.totalVideos || 0,
          hashtags_found: results.hashtags?.length || 0,
          sounds_found: results.sounds?.length || 0,
          results_data: JSON.stringify(results),
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error storing scraping results:', error);
    }
  }

  private getJobName(jobId: string): string {
    const names = {
      'daily_comprehensive': 'Daily Comprehensive Scraping',
      'trending_update': 'Trending Videos Update',
      'hashtag_update': 'Trending Hashtags Update',
      'sound_update': 'Trending Sounds Update'
    };
    return names[jobId as keyof typeof names] || jobId;
  }

  private getJobSchedule(jobId: string): string {
    const schedules = {
      'daily_comprehensive': `Daily at ${this.config.dailyScrapingTime}`,
      'trending_update': `Every ${this.config.trendingInterval} hours`,
      'hashtag_update': `Every ${this.config.hashtagInterval} hours`,
      'sound_update': `Every ${this.config.soundInterval} hours`
    };
    return schedules[jobId as keyof typeof schedules] || 'Unknown';
  }

  private getNextRunTime(jobId: string): string {
    // Simplified - would calculate actual next run time in production
    const now = new Date();
    if (jobId === 'daily_comprehensive') {
      const [hour, minute] = this.config.dailyScrapingTime.split(':');
      const next = new Date(now);
      next.setHours(parseInt(hour), parseInt(minute), 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next.toISOString();
    }
    return new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour from now
  }

  // ==== Caps accounting helpers ====
  private async getRemainingPredictionAllowance(): Promise<number> {
    try {
      const cap = this.config.dailyPredictionCap ?? 60;
      if (!isFinite(cap) || cap <= 0) return 0;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // Count predictions created today
      const { data, error, count } = await this.supabase
        .from('viral_predictions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString());

      if (error) {
        console.warn('Prediction count failed; assuming full cap available', error);
        return cap;
      }

      const used = count ?? 0;
      return Math.max(0, cap - used);
    } catch (err) {
      console.warn('Prediction allowance check failed; defaulting to cap', err);
      return this.config.dailyPredictionCap ?? 60;
    }
  }
}
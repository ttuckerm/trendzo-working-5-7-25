/**
 * Data Ingestion Pipeline Service
 * 
 * Coordinates the ingestion of social media data into the viral prediction system.
 * Handles data collection, processing, validation, and storage.
 */

import { TikTokScraper, type TikTokVideoData } from './tiktok-scraper'
import ViralPredictionDB from '@/lib/database/supabase-viral-prediction'
import { FeatureExtractor } from './feature-extractor'
import { ViralPredictionModel } from './viral-prediction-model'

export interface IngestionJob {
  id: string
  type: 'trending' | 'hashtag' | 'user' | 'manual'
  source: 'tiktok' | 'instagram' | 'youtube'
  parameters: {
    hashtags?: string[]
    usernames?: string[]
    maxVideos?: number
    minViews?: number
  }
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: {
    total: number
    processed: number
    successful: number
    failed: number
  }
  startedAt?: string
  completedAt?: string
  error?: string
  results?: {
    videosCollected: number
    featuresExtracted: number
    predictionsGenerated: number
    duplicatesSkipped: number
  }
}

export interface IngestionMetrics {
  totalVideosProcessed: number
  averageProcessingTime: number
  successRate: number
  errorRate: number
  duplicateRate: number
  dataQualityScore: number
}

export class DataIngestionPipeline {
  private static activeJobs = new Map<string, IngestionJob>()
  private static readonly MAX_CONCURRENT_JOBS = 3
  private static readonly BATCH_SIZE = 10

  /**
   * Start a new ingestion job
   */
  static async startIngestionJob(
    type: IngestionJob['type'],
    source: IngestionJob['source'],
    parameters: IngestionJob['parameters']
  ): Promise<IngestionJob> {
    
    // Check concurrent job limit
    const runningJobs = Array.from(this.activeJobs.values())
      .filter(job => job.status === 'running').length
    
    if (runningJobs >= this.MAX_CONCURRENT_JOBS) {
      throw new Error(`Maximum concurrent jobs (${this.MAX_CONCURRENT_JOBS}) reached`)
    }

    const job: IngestionJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      source,
      parameters,
      status: 'pending',
      progress: {
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0
      }
    }

    this.activeJobs.set(job.id, job)
    console.log(`🚀 Starting ingestion job: ${job.id}`)

    // Run job asynchronously
    this.runIngestionJob(job).catch(error => {
      console.error(`❌ Job ${job.id} failed:`, error)
      job.status = 'failed'
      job.error = error.message
      job.completedAt = new Date().toISOString()
    })

    return job
  }

  /**
   * Get job status
   */
  static getJobStatus(jobId: string): IngestionJob | null {
    return this.activeJobs.get(jobId) || null
  }

  /**
   * Get all active jobs
   */
  static getActiveJobs(): IngestionJob[] {
    return Array.from(this.activeJobs.values())
  }

  /**
   * Cancel a running job
   */
  static cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId)
    if (job && job.status === 'running') {
      job.status = 'failed'
      job.error = 'Cancelled by user'
      job.completedAt = new Date().toISOString()
      return true
    }
    return false
  }

  /**
   * Run the actual ingestion job
   */
  private static async runIngestionJob(job: IngestionJob): Promise<void> {
    try {
      job.status = 'running'
      job.startedAt = new Date().toISOString()
      
      console.log(`🎬 Running ${job.type} ingestion from ${job.source}`)

      // Step 1: Collect videos
      const videos = await this.collectVideos(job)
      job.progress.total = videos.length

      // Step 2: Process videos in batches
      const results = {
        videosCollected: videos.length,
        featuresExtracted: 0,
        predictionsGenerated: 0,
        duplicatesSkipped: 0
      }

      for (let i = 0; i < videos.length; i += this.BATCH_SIZE) {
        const batch = videos.slice(i, i + this.BATCH_SIZE)
        await this.processBatch(batch, job, results)
        
        // Update progress
        job.progress.processed = Math.min(i + this.BATCH_SIZE, videos.length)
        
        // Small delay between batches to avoid overwhelming the system
        await this.delay(1000)
      }

      // Step 3: Complete job
      job.status = 'completed'
      job.completedAt = new Date().toISOString()
      job.results = results

      console.log(`✅ Job ${job.id} completed successfully`)
      console.log(`📊 Results:`, results)

    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      job.completedAt = new Date().toISOString()
      throw error
    }
  }

  /**
   * Collect videos based on job parameters
   */
  private static async collectVideos(job: IngestionJob): Promise<TikTokVideoData[]> {
    const { type, source, parameters } = job

    if (source !== 'tiktok') {
      throw new Error(`Source ${source} not yet implemented`)
    }

    console.log(`📡 Collecting videos: ${type}`)

    switch (type) {
      case 'trending':
        return await TikTokScraper.scrapeTrendingVideos({
          maxVideos: parameters.maxVideos || 50,
          minViews: parameters.minViews || 10000,
          maxAge: 7,
          excludeAds: true,
          includeAnalysis: true
        })

      case 'hashtag':
        if (!parameters.hashtags?.length) {
          throw new Error('Hashtags required for hashtag ingestion')
        }
        return await TikTokScraper.scrapeByHashtags(parameters.hashtags, {
          maxVideos: parameters.maxVideos || 30,
          minViews: parameters.minViews || 5000,
          includeAnalysis: true
        })

      case 'user':
        if (!parameters.usernames?.length) {
          throw new Error('Usernames required for user ingestion')
        }
        return await TikTokScraper.scrapeUserVideos(parameters.usernames, {
          maxVideos: parameters.maxVideos || 20,
          includeAnalysis: true
        })

      default:
        throw new Error(`Ingestion type ${type} not implemented`)
    }
  }

  /**
   * Process a batch of videos
   */
  private static async processBatch(
    videos: TikTokVideoData[],
    job: IngestionJob,
    results: IngestionJob['results']
  ): Promise<void> {
    
    for (const video of videos) {
      try {
        // Check if video already exists
        const existingVideo = await this.checkVideoExists(video.id, video.url)
        if (existingVideo) {
          results!.duplicatesSkipped++
          continue
        }

        // Store video data
        const storedVideo = await this.storeVideoData(video)
        
        // Extract features and generate prediction
        if (video.content.videoUrl) {
          const features = await FeatureExtractor.extractAllFeatures(video.content.videoUrl)
          results!.featuresExtracted++

          const prediction = await ViralPredictionModel.predict(features)
          
          await ViralPredictionDB.createPrediction({
            video_id: storedVideo.id,
            viral_probability: prediction.viralProbability,
            confidence_score: prediction.confidence,
            predicted_views: prediction.predictedViews,
            predicted_engagement_rate: prediction.predictedEngagement,
            hook_score: prediction.breakdown.hookScore,
            content_score: prediction.breakdown.contentScore,
            timing_score: prediction.breakdown.timingScore,
            platform_fit_score: prediction.breakdown.platformFitScore,
            model_version: prediction.modelVersion,
            model_confidence: prediction.confidence,
            prediction_factors: prediction.factors,
            prediction_date: new Date().toISOString()
          })

          results!.predictionsGenerated++
        }

        job.progress.successful++

      } catch (error) {
        console.error(`❌ Failed to process video ${video.id}:`, error)
        job.progress.failed++
        continue
      }
    }
  }

  /**
   * Check if video already exists in database
   */
  private static async checkVideoExists(videoId: string, videoUrl: string): Promise<boolean> {
    try {
      // Check by external ID first
      const existingByExternalId = await ViralPredictionDB.getVideoByExternalId(videoId)
      if (existingByExternalId) return true

      // Check by URL as fallback
      const existingByUrl = await ViralPredictionDB.getVideoByUrl(videoUrl)
      if (existingByUrl) return true

      return false
    } catch (error) {
      console.error('Error checking video existence:', error)
      return false
    }
  }

  /**
   * Store video data in database
   */
  private static async storeVideoData(video: TikTokVideoData): Promise<any> {
    const videoData = {
      external_id: video.id,
      title: video.content.description.substring(0, 500),
      description: video.content.description,
      platform: 'tiktok' as const,
      file_url: video.content.videoUrl,
      thumbnail_url: `https://example.com/thumb_${video.id}.jpg`,
      duration: video.content.duration,
      upload_date: new Date(video.metadata.uploadDate).toISOString(),
      processing_status: 'completed' as const,
      metadata: {
        author: video.author,
        hashtags: video.content.hashtags,
        mentions: video.content.mentions,
        musicInfo: video.content.musicInfo,
        analysis: video.analysis,
        originalMetrics: video.metrics
      }
    }

    return await ViralPredictionDB.createVideo(videoData)
  }

  /**
   * Get ingestion metrics
   */
  static async getIngestionMetrics(timeRange?: {
    startDate: string
    endDate: string
  }): Promise<IngestionMetrics> {
    
    // Get completed jobs in time range
    const completedJobs = Array.from(this.activeJobs.values())
      .filter(job => {
        if (job.status !== 'completed') return false
        if (!timeRange) return true
        
        const jobDate = new Date(job.completedAt!)
        const start = new Date(timeRange.startDate)
        const end = new Date(timeRange.endDate)
        
        return jobDate >= start && jobDate <= end
      })

    if (completedJobs.length === 0) {
      return {
        totalVideosProcessed: 0,
        averageProcessingTime: 0,
        successRate: 0,
        errorRate: 0,
        duplicateRate: 0,
        dataQualityScore: 0
      }
    }

    // Calculate metrics
    const totalVideos = completedJobs.reduce((sum, job) => 
      sum + (job.results?.videosCollected || 0), 0
    )
    
    const totalSuccessful = completedJobs.reduce((sum, job) => 
      sum + job.progress.successful, 0
    )
    
    const totalFailed = completedJobs.reduce((sum, job) => 
      sum + job.progress.failed, 0
    )
    
    const totalDuplicates = completedJobs.reduce((sum, job) => 
      sum + (job.results?.duplicatesSkipped || 0), 0
    )

    const avgProcessingTime = completedJobs.reduce((sum, job) => {
      if (!job.startedAt || !job.completedAt) return sum
      const duration = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
      return sum + duration
    }, 0) / completedJobs.length

    const successRate = totalVideos > 0 ? (totalSuccessful / totalVideos) * 100 : 0
    const errorRate = totalVideos > 0 ? (totalFailed / totalVideos) * 100 : 0
    const duplicateRate = totalVideos > 0 ? (totalDuplicates / totalVideos) * 100 : 0

    // Calculate data quality score based on various factors
    const dataQualityScore = Math.max(0, Math.min(100, 
      successRate * 0.5 + 
      (100 - errorRate) * 0.3 + 
      (duplicateRate < 20 ? 100 - duplicateRate : 80) * 0.2
    ))

    return {
      totalVideosProcessed: totalVideos,
      averageProcessingTime: avgProcessingTime,
      successRate,
      errorRate,
      duplicateRate,
      dataQualityScore
    }
  }

  /**
   * Schedule regular ingestion jobs
   */
  static scheduleRegularIngestion(config: {
    trendingFrequency?: number // hours
    hashtagRefreshFrequency?: number // hours
    popularHashtags?: string[]
    maxDailyVideos?: number
  }): void {
    const {
      trendingFrequency = 6, // Every 6 hours
      hashtagRefreshFrequency = 12, // Every 12 hours
      popularHashtags = ['viral', 'trending', 'fyp', 'foryou', 'business', 'tips'],
      maxDailyVideos = 200
    } = config

    console.log('⏰ Scheduling regular ingestion jobs...')

    // Schedule trending ingestion
    setInterval(async () => {
      try {
        console.log('🔥 Running scheduled trending ingestion...')
        await this.startIngestionJob('trending', 'tiktok', {
          maxVideos: Math.floor(maxDailyVideos / (24 / trendingFrequency)),
          minViews: 50000
        })
      } catch (error) {
        console.error('❌ Scheduled trending ingestion failed:', error)
      }
    }, trendingFrequency * 60 * 60 * 1000)

    // Schedule hashtag ingestion
    setInterval(async () => {
      try {
        console.log('🏷️ Running scheduled hashtag ingestion...')
        const randomHashtags = popularHashtags
          .sort(() => 0.5 - Math.random())
          .slice(0, 3) // Pick 3 random hashtags
        
        await this.startIngestionJob('hashtag', 'tiktok', {
          hashtags: randomHashtags,
          maxVideos: Math.floor(maxDailyVideos / (24 / hashtagRefreshFrequency)),
          minViews: 10000
        })
      } catch (error) {
        console.error('❌ Scheduled hashtag ingestion failed:', error)
      }
    }, hashtagRefreshFrequency * 60 * 60 * 1000)

    console.log('✅ Regular ingestion jobs scheduled')
  }

  /**
   * Clean up old completed jobs
   */
  static cleanupOldJobs(maxAge: number = 24): void {
    const cutoffTime = Date.now() - (maxAge * 60 * 60 * 1000)
    
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        const completedTime = job.completedAt ? new Date(job.completedAt).getTime() : 0
        if (completedTime < cutoffTime) {
          this.activeJobs.delete(jobId)
        }
      }
    }
  }

  /**
   * Helper delay function
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
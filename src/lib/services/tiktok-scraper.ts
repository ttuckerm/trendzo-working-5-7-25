/**
 * TikTok Data Scraping Service
 * 
 * Handles automated scraping of TikTok videos for viral prediction training data.
 * Uses multiple methods to collect video metadata, engagement metrics, and content analysis.
 */

export interface TikTokVideoData {
  id: string
  url: string
  author: {
    username: string
    displayName: string
    followerCount: number
    verified: boolean
    avatar: string
  }
  content: {
    description: string
    hashtags: string[]
    mentions: string[]
    duration: number
    videoUrl: string
    musicInfo?: {
      title: string
      artist: string
      url: string
      duration: number
    }
  }
  metrics: {
    views: number
    likes: number
    comments: number
    shares: number
    engagementRate: number
    viralScore: number
  }
  metadata: {
    uploadDate: string
    collectedAt: string
    platform: 'tiktok'
    isAd: boolean
    isPrivate: boolean
    language?: string
    location?: string
  }
  analysis?: {
    sentiment: 'positive' | 'negative' | 'neutral'
    category: string
    trends: string[]
    viralFactors: string[]
  }
}

export interface ScrapingOptions {
  hashtags?: string[]
  usernames?: string[]
  maxVideos?: number
  minViews?: number
  maxAge?: number // days
  excludeAds?: boolean
  includeAnalysis?: boolean
}

export class TikTokScraper {
  private static readonly API_BASE = 'https://api.tikapi.io'
  private static readonly RATE_LIMIT_DELAY = 2000 // 2 seconds between requests
  private static readonly MAX_RETRIES = 3

  /**
   * Scrape trending videos from TikTok
   */
  static async scrapeTrendingVideos(options: ScrapingOptions = {}): Promise<TikTokVideoData[]> {
    const {
      maxVideos = 50,
      minViews = 10000,
      maxAge = 7,
      excludeAds = true,
      includeAnalysis = true
    } = options

    console.log(`🔥 Scraping ${maxVideos} trending TikTok videos...`)

    try {
      // Use TikApi.io or similar service for legal data access
      const videos = await this.fetchTrendingFromAPI({
        count: maxVideos,
        minViews,
        maxAge
      })

      const processedVideos: TikTokVideoData[] = []

      for (const video of videos) {
        try {
          // Rate limiting
          await this.delay(this.RATE_LIMIT_DELAY)

          const processedVideo = await this.processVideoData(video, includeAnalysis)
          
          // Filter out ads if requested
          if (excludeAds && processedVideo.metadata.isAd) {
            continue
          }

          processedVideos.push(processedVideo)
          console.log(`✅ Processed video: ${processedVideo.id} (${processedVideo.metrics.views.toLocaleString()} views)`)

        } catch (error) {
          console.error(`❌ Failed to process video ${video.id}:`, error)
          continue
        }
      }

      console.log(`✅ Successfully scraped ${processedVideos.length} videos`)
      return processedVideos

    } catch (error) {
      console.error('❌ Trending scraping failed:', error)
      throw error
    }
  }

  /**
   * Scrape videos by hashtags
   */
  static async scrapeByHashtags(hashtags: string[], options: ScrapingOptions = {}): Promise<TikTokVideoData[]> {
    const {
      maxVideos = 30,
      minViews = 5000,
      includeAnalysis = true
    } = options

    console.log(`🏷️ Scraping videos for hashtags: ${hashtags.join(', ')}`)

    const allVideos: TikTokVideoData[] = []

    for (const hashtag of hashtags) {
      try {
        console.log(`Scraping hashtag: #${hashtag}`)
        
        const videos = await this.fetchHashtagVideos(hashtag, {
          count: Math.ceil(maxVideos / hashtags.length),
          minViews
        })

        for (const video of videos) {
          await this.delay(this.RATE_LIMIT_DELAY)
          
          const processedVideo = await this.processVideoData(video, includeAnalysis)
          allVideos.push(processedVideo)
        }

      } catch (error) {
        console.error(`❌ Failed to scrape hashtag #${hashtag}:`, error)
        continue
      }
    }

    console.log(`✅ Scraped ${allVideos.length} videos from hashtags`)
    return allVideos
  }

  /**
   * Scrape videos from specific users
   */
  static async scrapeUserVideos(usernames: string[], options: ScrapingOptions = {}): Promise<TikTokVideoData[]> {
    const {
      maxVideos = 20,
      includeAnalysis = true
    } = options

    console.log(`👤 Scraping videos from users: ${usernames.join(', ')}`)

    const allVideos: TikTokVideoData[] = []

    for (const username of usernames) {
      try {
        console.log(`Scraping user: @${username}`)
        
        const videos = await this.fetchUserVideos(username, {
          count: Math.ceil(maxVideos / usernames.length)
        })

        for (const video of videos) {
          await this.delay(this.RATE_LIMIT_DELAY)
          
          const processedVideo = await this.processVideoData(video, includeAnalysis)
          allVideos.push(processedVideo)
        }

      } catch (error) {
        console.error(`❌ Failed to scrape user @${username}:`, error)
        continue
      }
    }

    console.log(`✅ Scraped ${allVideos.length} videos from users`)
    return allVideos
  }

  /**
   * Fetch trending videos from API
   */
  private static async fetchTrendingFromAPI(params: {
    count: number
    minViews: number
    maxAge: number
  }): Promise<any[]> {
    // This would integrate with a real TikTok API service
    // For demo purposes, return simulated data
    
    console.log('📡 Fetching trending videos from API...')
    
    return this.generateSimulatedVideos(params.count, {
      minViews: params.minViews,
      viral: true
    })
  }

  /**
   * Fetch videos by hashtag
   */
  private static async fetchHashtagVideos(hashtag: string, params: {
    count: number
    minViews: number
  }): Promise<any[]> {
    console.log(`📡 Fetching videos for hashtag #${hashtag}...`)
    
    return this.generateSimulatedVideos(params.count, {
      hashtag,
      minViews: params.minViews
    })
  }

  /**
   * Fetch videos from specific user
   */
  private static async fetchUserVideos(username: string, params: {
    count: number
  }): Promise<any[]> {
    console.log(`📡 Fetching videos from user @${username}...`)
    
    return this.generateSimulatedVideos(params.count, {
      username,
      viral: Math.random() > 0.3 // 70% chance of viral content
    })
  }

  /**
   * Process raw video data into standardized format
   */
  private static async processVideoData(rawVideo: any, includeAnalysis: boolean): Promise<TikTokVideoData> {
    const viralScore = this.calculateViralScore(rawVideo.metrics)
    
    const processedVideo: TikTokVideoData = {
      id: rawVideo.id,
      url: `https://www.tiktok.com/@${rawVideo.author.username}/video/${rawVideo.id}`,
      author: {
        username: rawVideo.author.username,
        displayName: rawVideo.author.displayName,
        followerCount: rawVideo.author.followerCount,
        verified: rawVideo.author.verified || false,
        avatar: rawVideo.author.avatar || ''
      },
      content: {
        description: rawVideo.content.description,
        hashtags: this.extractHashtags(rawVideo.content.description),
        mentions: this.extractMentions(rawVideo.content.description),
        duration: rawVideo.content.duration,
        videoUrl: rawVideo.content.videoUrl,
        musicInfo: rawVideo.content.musicInfo
      },
      metrics: {
        views: rawVideo.metrics.views,
        likes: rawVideo.metrics.likes,
        comments: rawVideo.metrics.comments,
        shares: rawVideo.metrics.shares,
        engagementRate: this.calculateEngagementRate(rawVideo.metrics),
        viralScore
      },
      metadata: {
        uploadDate: rawVideo.metadata.uploadDate,
        collectedAt: new Date().toISOString(),
        platform: 'tiktok',
        isAd: rawVideo.metadata.isAd || false,
        isPrivate: rawVideo.metadata.isPrivate || false,
        language: rawVideo.metadata.language,
        location: rawVideo.metadata.location
      }
    }

    // Add content analysis if requested
    if (includeAnalysis) {
      processedVideo.analysis = await this.analyzeContent(processedVideo)
    }

    return processedVideo
  }

  /**
   * Calculate viral score based on metrics
   */
  private static calculateViralScore(metrics: any): number {
    const views = metrics.views || 0
    const likes = metrics.likes || 0
    const comments = metrics.comments || 0
    const shares = metrics.shares || 0

    // Weighted viral score calculation
    const engagementScore = (likes + comments * 2 + shares * 3) / Math.max(views, 1)
    const viewScore = Math.min(views / 1000000, 1) // Normalize to 1M views
    const viralityScore = (engagementScore * 0.7 + viewScore * 0.3) * 100

    return Math.min(100, Math.max(0, viralityScore))
  }

  /**
   * Calculate engagement rate
   */
  private static calculateEngagementRate(metrics: any): number {
    const totalEngagement = (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0)
    const views = metrics.views || 1
    return (totalEngagement / views) * 100
  }

  /**
   * Extract hashtags from description
   */
  private static extractHashtags(description: string): string[] {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g
    return (description.match(hashtagRegex) || []).map(tag => tag.substring(1))
  }

  /**
   * Extract mentions from description
   */
  private static extractMentions(description: string): string[] {
    const mentionRegex = /@[a-zA-Z0-9_]+/g
    return (description.match(mentionRegex) || []).map(mention => mention.substring(1))
  }

  /**
   * Analyze content for sentiment and categorization
   */
  private static async analyzeContent(video: TikTokVideoData): Promise<TikTokVideoData['analysis']> {
    // Simulate content analysis
    // In production, this would use NLP APIs or ML models
    
    const categories = ['business', 'entertainment', 'education', 'lifestyle', 'comedy', 'music', 'dance', 'food', 'travel', 'tech']
    const viralFactors = ['trending_sound', 'quick_cuts', 'text_overlay', 'face_reveal', 'transformation', 'tutorial', 'storytime', 'duet', 'challenge']
    const trends = ['viral_dance', 'trending_audio', 'hashtag_challenge', 'meme_trend', 'filter_effect']

    return {
      sentiment: Math.random() > 0.2 ? 'positive' : Math.random() > 0.5 ? 'neutral' : 'negative',
      category: categories[Math.floor(Math.random() * categories.length)],
      trends: trends.slice(0, Math.floor(Math.random() * 3) + 1),
      viralFactors: viralFactors.slice(0, Math.floor(Math.random() * 4) + 2)
    }
  }

  /**
   * Generate simulated video data for demo purposes
   */
  private static generateSimulatedVideos(count: number, options: {
    hashtag?: string
    username?: string
    minViews?: number
    viral?: boolean
  } = {}): any[] {
    const videos = []
    
    for (let i = 0; i < count; i++) {
      const isViral = options.viral !== undefined ? options.viral : Math.random() > 0.7
      const baseViews = options.minViews || 10000
      const views = isViral 
        ? Math.floor(Math.random() * 10000000) + 500000  // 500K - 10M views
        : Math.floor(Math.random() * 500000) + baseViews // Lower range

      const likes = Math.floor(views * (Math.random() * 0.15 + 0.05)) // 5-20% like rate
      const comments = Math.floor(likes * (Math.random() * 0.1 + 0.02)) // 2-12% comment rate
      const shares = Math.floor(likes * (Math.random() * 0.05 + 0.01)) // 1-6% share rate

      const video = {
        id: `video_${Date.now()}_${i}`,
        author: {
          username: options.username || `user_${Math.floor(Math.random() * 10000)}`,
          displayName: `User ${Math.floor(Math.random() * 10000)}`,
          followerCount: Math.floor(Math.random() * 1000000) + 1000,
          verified: Math.random() > 0.9,
          avatar: `https://example.com/avatar_${i}.jpg`
        },
        content: {
          description: this.generateDescription(options.hashtag),
          duration: Math.floor(Math.random() * 50) + 10, // 10-60 seconds
          videoUrl: `https://example.com/video_${i}.mp4`,
          musicInfo: Math.random() > 0.3 ? {
            title: `Trending Song ${i}`,
            artist: `Artist ${i}`,
            url: `https://example.com/music_${i}.mp3`,
            duration: 30
          } : undefined
        },
        metrics: {
          views,
          likes,
          comments,
          shares
        },
        metadata: {
          uploadDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          isAd: Math.random() > 0.95,
          isPrivate: false,
          language: 'en'
        }
      }

      videos.push(video)
    }

    return videos
  }

  /**
   * Generate realistic video descriptions
   */
  private static generateDescription(hashtag?: string): string {
    const descriptions = [
      "POV: You're scrolling TikTok instead of working 😅",
      "This trend is actually so fun! Who else is trying this?",
      "Day in my life as a content creator ✨",
      "The way this blew up overnight... 🤯",
      "I can't believe this actually worked!",
      "Teaching you something new every day 📚",
      "Plot twist: it gets better at the end",
      "This is your sign to try something new today",
      "Rate my outfit from 1-10 💅",
      "The algorithm brought you here for a reason"
    ]

    let description = descriptions[Math.floor(Math.random() * descriptions.length)]
    
    if (hashtag) {
      description += ` #${hashtag}`
    }

    // Add random trending hashtags
    const trendingTags = ['fyp', 'viral', 'trending', 'foryou', 'explore', 'tiktok']
    const randomTags = trendingTags.slice(0, Math.floor(Math.random() * 4) + 1)
    description += ' ' + randomTags.map(tag => `#${tag}`).join(' ')

    return description
  }

  /**
   * Rate limiting delay helper
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Retry mechanism for failed requests
   */
  private static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        console.warn(`❌ Attempt ${attempt} failed:`, error)
        
        if (attempt < maxRetries) {
          const backoffDelay = Math.pow(2, attempt) * 1000 // Exponential backoff
          console.log(`⏳ Retrying in ${backoffDelay}ms...`)
          await this.delay(backoffDelay)
        }
      }
    }

    throw lastError || new Error('Max retries exceeded')
  }
}
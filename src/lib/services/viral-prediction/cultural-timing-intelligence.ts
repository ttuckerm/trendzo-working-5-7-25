// Cultural Timing Intelligence - 24-48 hour trend window detection

import { createClient } from '@supabase/supabase-js';
import { CulturalTiming } from '@/lib/types/viral-prediction';

export class CulturalTimingIntelligence {
  private supabase;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  async analyzeCulturalTiming(video: {
    id: string;
    caption: string;
    hashtags: string[];
    upload_timestamp: string;
    sound_id?: string;
  }): Promise<CulturalTiming> {
    
    // 1. Trend Lifecycle Analysis
    const trendAnalysis = await this.analyzeTrendLifecycle(video);
    
    // 2. Cultural Moment Alignment
    const culturalAlignment = await this.assessCulturalAlignment(video);
    
    // 3. Platform Peak Times Analysis
    const peakTimes = await this.analyzePlatformPeakTimes();

    const timingAnalysis: CulturalTiming = {
      trendStage: trendAnalysis.stage,
      hoursUntilPeak: trendAnalysis.hoursUntilPeak,
      culturalRelevanceScore: culturalAlignment.relevanceScore,
      seasonalAlignment: culturalAlignment.seasonalScore,
      platformPeakTimes: peakTimes
    };

    // Store analysis
    await this.storeCulturalTiming(video.id, timingAnalysis, {
      trendAnalysis,
      culturalAlignment
    });

    return timingAnalysis;
  }

  private async analyzeTrendLifecycle(video: any): Promise<{
    stage: 'emerging' | 'rising' | 'peak' | 'declining';
    hoursUntilPeak: number;
    lifecyclePosition: number;
  }> {
    const hashtags = video.hashtags || [];
    const soundId = video.sound_id;
    const uploadTime = new Date(video.upload_timestamp);
    const now = new Date();
    
    let stage: 'emerging' | 'rising' | 'peak' | 'declining' = 'emerging';
    let hoursUntilPeak = 24; // Default estimate
    let lifecyclePosition = 0.1; // 0-1 scale

    // Analyze hashtag trends
    for (const hashtag of hashtags) {
      const hashtagTrend = await this.getHashtagTrendData(hashtag);
      
      if (hashtagTrend) {
        const trendAge = now.getTime() - new Date(hashtagTrend.first_seen).getTime();
        const ageInHours = trendAge / (1000 * 60 * 60);
        
        // Trend lifecycle stages based on usage pattern
        if (ageInHours < 12 && hashtagTrend.growth_rate > 2.0) {
          stage = 'emerging';
          hoursUntilPeak = Math.max(24 - ageInHours, 0);
          lifecyclePosition = ageInHours / 72; // 72-hour lifecycle
        } else if (ageInHours < 48 && hashtagTrend.growth_rate > 1.2) {
          stage = 'rising';
          hoursUntilPeak = Math.max(36 - ageInHours, 0);
          lifecyclePosition = ageInHours / 72;
        } else if (ageInHours < 72 && hashtagTrend.growth_rate > 0.5) {
          stage = 'peak';
          hoursUntilPeak = 0;
          lifecyclePosition = 0.7;
        } else {
          stage = 'declining';
          hoursUntilPeak = 0;
          lifecyclePosition = Math.min(ageInHours / 72, 1);
        }
        
        break; // Use first trending hashtag found
      }
    }

    // Analyze sound trend if available
    if (soundId) {
      const soundTrend = await this.getSoundTrendData(soundId);
      
      if (soundTrend) {
        const soundAge = now.getTime() - new Date(soundTrend.first_viral).getTime();
        const ageInHours = soundAge / (1000 * 60 * 60);
        
        // Sound trends often peak faster than hashtag trends
        if (ageInHours < 6 && soundTrend.usage_velocity > 100) {
          stage = 'emerging';
          hoursUntilPeak = Math.max(12 - ageInHours, 0);
        } else if (ageInHours < 24 && soundTrend.usage_velocity > 50) {
          stage = 'rising';
          hoursUntilPeak = Math.max(18 - ageInHours, 0);
        } else if (ageInHours < 48) {
          stage = 'peak';
          hoursUntilPeak = 0;
        } else {
          stage = 'declining';
          hoursUntilPeak = 0;
        }
      }
    }

    return {
      stage,
      hoursUntilPeak,
      lifecyclePosition
    };
  }

  private async getHashtagTrendData(hashtag: string): Promise<{
    first_seen: string;
    growth_rate: number;
    peak_usage: number;
    current_usage: number;
  } | null> {
    // Query recent hashtag usage
    const { data } = await this.supabase
      .from('videos')
      .select('upload_timestamp, hashtags')
      .contains('hashtags', [hashtag])
      .gte('upload_timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('upload_timestamp');

    if (!data || data.length < 2) return null;

    // Calculate trend metrics
    const firstSeen = data[0].upload_timestamp;
    const usageByHour = this.calculateHourlyUsage(data, hashtag);
    const growthRate = this.calculateGrowthRate(usageByHour);
    
    return {
      first_seen: firstSeen,
      growth_rate: growthRate,
      peak_usage: Math.max(...usageByHour),
      current_usage: usageByHour[usageByHour.length - 1] || 0
    };
  }

  private async getSoundTrendData(soundId: string): Promise<{
    first_viral: string;
    usage_velocity: number;
    peak_hour: string;
  } | null> {
    const { data } = await this.supabase
      .from('videos')
      .select('upload_timestamp, view_count')
      .eq('sound_id', soundId)
      .gte('upload_timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('upload_timestamp');

    if (!data || data.length < 5) return null;

    // Find when sound first went viral (>100k views in 24h)
    const viralThreshold = 100000;
    let firstViral = data[0].upload_timestamp;
    
    for (const video of data) {
      if (video.view_count > viralThreshold) {
        firstViral = video.upload_timestamp;
        break;
      }
    }

    // Calculate usage velocity (videos per hour using this sound)
    const velocity = data.length / 24; // Rough estimate

    return {
      first_viral: firstViral,
      usage_velocity: velocity,
      peak_hour: data[Math.floor(data.length / 2)].upload_timestamp
    };
  }

  private calculateHourlyUsage(data: any[], hashtag: string): number[] {
    const usage: number[] = [];
    const now = new Date();
    
    // Count usage for each hour in last 48 hours
    for (let i = 47; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const hourUsage = data.filter(video => {
        const uploadTime = new Date(video.upload_timestamp);
        return uploadTime >= hourStart && uploadTime < hourEnd;
      }).length;
      
      usage.push(hourUsage);
    }
    
    return usage;
  }

  private calculateGrowthRate(usageByHour: number[]): number {
    if (usageByHour.length < 12) return 0;
    
    // Compare last 12 hours to previous 12 hours
    const recent = usageByHour.slice(-12).reduce((a, b) => a + b, 0);
    const previous = usageByHour.slice(-24, -12).reduce((a, b) => a + b, 0);
    
    if (previous === 0) return recent > 0 ? 10 : 0;
    
    return recent / previous;
  }

  private async assessCulturalAlignment(video: any): Promise<{
    relevanceScore: number;
    seasonalScore: number;
    alignedEvents: string[];
  }> {
    const caption = video.caption.toLowerCase();
    const hashtags = video.hashtags || [];
    const uploadDate = new Date(video.upload_timestamp);
    const alignedEvents: string[] = [];
    
    let relevanceScore = 0.5; // Base score
    let seasonalScore = 0.5;

    // Current events alignment (would need real-time news API)
    const currentEvents = await this.getCurrentTrendingEvents();
    
    currentEvents.forEach(event => {
      const eventKeywords = event.keywords.map((k: string) => k.toLowerCase());
      const hasKeyword = eventKeywords.some(keyword => 
        caption.includes(keyword) || 
        hashtags.some(tag => tag.toLowerCase().includes(keyword))
      );
      
      if (hasKeyword) {
        relevanceScore += 0.2;
        alignedEvents.push(event.name);
      }
    });

    // Seasonal alignment
    const month = uploadDate.getMonth();
    const seasonalEvents = this.getSeasonalEvents(month);
    
    seasonalEvents.forEach(event => {
      const hasReference = event.keywords.some(keyword =>
        caption.includes(keyword.toLowerCase()) ||
        hashtags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
      );
      
      if (hasReference) {
        seasonalScore += 0.1;
        alignedEvents.push(event.name);
      }
    });

    // Weekly cycles (weekends vs weekdays)
    const dayOfWeek = uploadDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      if (caption.includes('weekend') || caption.includes('saturday') || caption.includes('sunday')) {
        relevanceScore += 0.1;
      }
    }

    return {
      relevanceScore: Math.min(relevanceScore, 1),
      seasonalScore: Math.min(seasonalScore, 1),
      alignedEvents
    };
  }

  private async getCurrentTrendingEvents(): Promise<Array<{
    name: string;
    keywords: string[];
    relevanceScore: number;
  }>> {
    // In a real implementation, this would call news APIs or trend tracking services
    // For now, return some common evergreen trends
    return [
      { name: 'Monday Motivation', keywords: ['monday', 'motivation', 'week'], relevanceScore: 0.8 },
      { name: 'Throwback', keywords: ['throwback', 'remember', 'nostalgia'], relevanceScore: 0.7 },
      { name: 'Life Hack', keywords: ['hack', 'tip', 'trick'], relevanceScore: 0.9 },
      { name: 'Behind Scenes', keywords: ['behind', 'secret', 'process'], relevanceScore: 0.8 }
    ];
  }

  private getSeasonalEvents(month: number): Array<{
    name: string;
    keywords: string[];
  }> {
    const seasonalEvents: { [key: number]: Array<{ name: string; keywords: string[] }> } = {
      0: [{ name: 'New Year', keywords: ['resolution', 'new year', 'fresh start'] }],
      1: [{ name: 'Valentine\'s Day', keywords: ['valentine', 'love', 'relationship'] }],
      2: [{ name: 'Spring', keywords: ['spring', 'fresh', 'renewal'] }],
      3: [{ name: 'Easter/Spring', keywords: ['easter', 'spring break', 'bloom'] }],
      4: [{ name: 'Mother\'s Day', keywords: ['mother', 'mom', 'maternal'] }],
      5: [{ name: 'Summer Start', keywords: ['summer', 'vacation', 'beach'] }],
      6: [{ name: 'Mid Summer', keywords: ['summer', 'hot', 'vacation'] }],
      7: [{ name: 'Back to School Prep', keywords: ['school', 'preparation', 'august'] }],
      8: [{ name: 'Back to School', keywords: ['school', 'student', 'learn'] }],
      9: [{ name: 'Halloween', keywords: ['halloween', 'spooky', 'costume'] }],
      10: [{ name: 'Thanksgiving', keywords: ['thanksgiving', 'grateful', 'family'] }],
      11: [{ name: 'Holidays', keywords: ['christmas', 'holiday', 'gift'] }]
    };

    return seasonalEvents[month] || [];
  }

  private async analyzePlatformPeakTimes(): Promise<Record<string, string[]>> {
    // Analyze historical data to find optimal posting times
    const { data } = await this.supabase
      .from('videos')
      .select('upload_timestamp, viral_score')
      .gte('viral_score', 50) // Only viral content
      .gte('upload_timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const peakHours: { [key: string]: number[] } = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    data?.forEach(video => {
      const uploadTime = new Date(video.upload_timestamp);
      const dayName = dayNames[uploadTime.getDay()];
      const hour = uploadTime.getHours();
      
      peakHours[dayName].push(hour);
    });

    // Find most common hours for each day
    const peakTimes: Record<string, string[]> = {};
    
    Object.entries(peakHours).forEach(([day, hours]) => {
      const hourCounts: { [key: number]: number } = {};
      hours.forEach(hour => {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      
      // Get top 3 hours
      const topHours = Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => `${hour}:00`);
        
      peakTimes[day] = topHours;
    });

    return peakTimes;
  }

  private async storeCulturalTiming(
    videoId: string,
    analysis: CulturalTiming,
    details: any
  ) {
    await this.supabase.from('cultural_timing').insert({
      video_id: videoId,
      trend_stage: analysis.trendStage,
      hours_until_peak_estimate: analysis.hoursUntilPeak,
      trend_lifecycle_position: details.trendAnalysis.lifecyclePosition,
      cultural_relevance_score: analysis.culturalRelevanceScore,
      aligned_events: details.culturalAlignment.alignedEvents,
      seasonal_alignment: analysis.seasonalAlignment,
      platform_peak_times: analysis.platformPeakTimes,
      analyzed_at: new Date().toISOString()
    });
  }

  // Calculate God Mode accuracy boost from cultural timing
  calculateAccuracyBoost(analysis: CulturalTiming): number {
    let boost = 0;

    // Emerging trend bonus (24-48 hour window)
    if (analysis.trendStage === 'emerging' && analysis.hoursUntilPeak <= 48) {
      boost += 0.05; // +5%
    }
    
    // Cultural relevance boost
    if (analysis.culturalRelevanceScore > 0.7) boost += 0.03; // +3%
    
    // Seasonal alignment boost
    if (analysis.seasonalAlignment > 0.6) boost += 0.02; // +2%

    return Math.min(boost, 0.1); // Max 10% boost
  }
}
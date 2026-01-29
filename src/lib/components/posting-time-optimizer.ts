/**
 * Posting Time Optimizer (Component 21)
 *
 * Optimizes posting time recommendations based on:
 * - Historical performance by hour of day
 * - Day of week patterns
 * - Niche-specific engagement windows
 * - Account size and audience timezone considerations
 * - Competitive analysis (when competitors post)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

export interface PostingTimeResult {
  success: boolean;
  optimalHours: number[]; // Top 4 hours (0-23 UTC)
  optimalDays: string[]; // Top 3 days
  engagementMultiplierByHour: Record<number, number>; // Hour -> multiplier (1.0 = average)
  engagementMultiplierByDay: Record<string, number>; // Day -> multiplier
  avoidHours: number[]; // Worst performing hours
  peakWindow: { start: number; end: number } | null; // Best posting window
  timingScore: number; // 0-10
  confidence: number; // 0-1
  insights: string[];
  features: {
    sampleSize: number;
    avgDPSByHour?: Record<number, number>;
    competitorPostingHours?: number[];
  };
  error?: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Posting Time Optimizer
 */
export class PostingTimeOptimizer {
  /**
   * Analyze optimal posting times based on historical data
   */
  public static async analyze(
    niche?: string,
    goal?: string,
    accountSize?: string
  ): Promise<PostingTimeResult> {
    const insights: string[] = [];

    try {
      // Step 1: Query historical video performance with timestamps from MARKET data
      const { data: historicalVideos, error } = await supabase
        .from('scraped_videos')
        .select('dps_score, views_count, likes_count, upload_timestamp, description')
        .not('dps_score', 'is', null)
        .order('views_count', { ascending: false }) // Focus on high views
        .limit(1000);

      if (error) {
        console.warn('Error fetching historical videos:', error);
      }

      // Filter by niche if provided
      let relevantVideos: any[] = [];
      if (historicalVideos) {
        relevantVideos = historicalVideos.map(v => ({
            ...v,
            actual_dps: parseFloat(v.dps_score),
            actual_views: v.views_count,
            actual_likes: v.likes_count,
            created_at: v.upload_timestamp || new Date().toISOString(), // Fallback
            niche: v.description // Use description for matching since niche col missing
        }));
      }

      if (niche && relevantVideos.length > 0) {
        const nicheFiltered = relevantVideos.filter(v =>
          v.niche?.toLowerCase().includes(niche.toLowerCase())
        );
        if (nicheFiltered.length >= 20) {
          relevantVideos = nicheFiltered;
          insights.push(`📊 Analyzed ${nicheFiltered.length} videos in ${niche} niche`);
        } else {
          insights.push(`📊 Analyzed ${relevantVideos.length} videos (limited niche data)`);
        }
      }

      const sampleSize = relevantVideos.length;

      if (sampleSize < 10) {
        // Insufficient data - return defaults
        return {
          success: true,
          optimalHours: [9, 12, 18, 21],
          optimalDays: ['Tuesday', 'Wednesday', 'Thursday'],
          engagementMultiplierByHour: {},
          engagementMultiplierByDay: {},
          avoidHours: [2, 3, 4],
          peakWindow: { start: 18, end: 22 },
          timingScore: 5,
          confidence: 0.3,
          insights: ['⚠️ Insufficient data - using default posting times', 'Upload more content to get personalized recommendations'],
          features: { sampleSize },
          error: 'Insufficient historical data'
        };
      }

      // Step 2: Analyze performance by hour
      const hourlyStats: Record<number, { totalDPS: number; count: number; totalViews: number }> = {};
      const dailyStats: Record<string, { totalDPS: number; count: number }> = {};

      relevantVideos.forEach(video => {
        const date = new Date(video.created_at);
        const hour = date.getUTCHours();
        const day = DAYS[date.getUTCDay()];

        // Hourly stats
        if (!hourlyStats[hour]) {
          hourlyStats[hour] = { totalDPS: 0, count: 0, totalViews: 0 };
        }
        hourlyStats[hour].totalDPS += video.actual_dps;
        hourlyStats[hour].count += 1;
        hourlyStats[hour].totalViews += video.actual_views;

        // Daily stats
        if (!dailyStats[day]) {
          dailyStats[day] = { totalDPS: 0, count: 0 };
        }
        dailyStats[day].totalDPS += video.actual_dps;
        dailyStats[day].count += 1;
      });

      // Step 3: Calculate average DPS by hour
      const avgDPSByHour: Record<number, number> = {};
      let overallAvgDPS = 0;
      let totalCount = 0;

      Object.entries(hourlyStats).forEach(([hourStr, stats]) => {
        const hour = parseInt(hourStr);
        avgDPSByHour[hour] = stats.totalDPS / stats.count;
        overallAvgDPS += stats.totalDPS;
        totalCount += stats.count;
      });

      overallAvgDPS = overallAvgDPS / totalCount;

      // Step 4: Calculate engagement multipliers by hour
      const engagementMultiplierByHour: Record<number, number> = {};
      Object.entries(avgDPSByHour).forEach(([hourStr, avgDPS]) => {
        const hour = parseInt(hourStr);
        engagementMultiplierByHour[hour] = avgDPS / overallAvgDPS;
      });

      // Step 5: Find top 4 optimal hours
      const sortedHours = Object.entries(engagementMultiplierByHour)
        .sort(([, a], [, b]) => b - a)
        .map(([hour, multiplier]) => ({ hour: parseInt(hour), multiplier }));

      const optimalHours = sortedHours.slice(0, 4).map(h => h.hour).sort((a, b) => a - b);
      const avoidHours = sortedHours.slice(-3).map(h => h.hour).sort((a, b) => a - b);

      insights.push(`🎯 Best hours: ${optimalHours.map(h => `${h}:00`).join(', ')} UTC`);
      insights.push(`⚠️ Avoid hours: ${avoidHours.map(h => `${h}:00`).join(', ')} UTC`);

      // Step 6: Calculate average DPS by day
      const avgDPSByDay: Record<string, number> = {};
      let overallDailyAvg = 0;

      Object.entries(dailyStats).forEach(([day, stats]) => {
        avgDPSByDay[day] = stats.totalDPS / stats.count;
        overallDailyAvg += stats.totalDPS / stats.count;
      });

      overallDailyAvg = overallDailyAvg / Object.keys(dailyStats).length;

      // Step 7: Calculate engagement multipliers by day
      const engagementMultiplierByDay: Record<string, number> = {};
      Object.entries(avgDPSByDay).forEach(([day, avgDPS]) => {
        engagementMultiplierByDay[day] = avgDPS / overallDailyAvg;
      });

      // Step 8: Find top 3 optimal days
      const sortedDays = Object.entries(engagementMultiplierByDay)
        .sort(([, a], [, b]) => b - a)
        .map(([day]) => day);

      const optimalDays = sortedDays.slice(0, 3);

      insights.push(`📅 Best days: ${optimalDays.join(', ')}`);

      // Step 9: Identify peak posting window (consecutive hours with high performance)
      let peakWindow: { start: number; end: number } | null = null;
      let maxWindowScore = 0;

      // Check 3-4 hour windows
      for (let start = 0; start < 24; start++) {
        for (let windowSize = 3; windowSize <= 4; windowSize++) {
          const end = (start + windowSize) % 24;
          let windowScore = 0;

          for (let i = 0; i < windowSize; i++) {
            const hour = (start + i) % 24;
            windowScore += engagementMultiplierByHour[hour] || 0;
          }

          if (windowScore > maxWindowScore) {
            maxWindowScore = windowScore;
            peakWindow = { start, end };
          }
        }
      }

      if (peakWindow) {
        insights.push(`⏰ Peak window: ${peakWindow.start}:00 - ${peakWindow.end}:00 UTC`);
      }

      // Step 10: Calculate timing score (0-10)
      const topMultiplier = sortedHours[0]?.multiplier || 1.0;
      let timingScore = 5; // Baseline

      if (topMultiplier >= 1.5) {
        timingScore = 10;
        insights.push(`🚀 Excellent timing advantage: ${Math.round(topMultiplier * 100)}% above average`);
      } else if (topMultiplier >= 1.3) {
        timingScore = 8;
        insights.push(`✨ Strong timing patterns: ${Math.round(topMultiplier * 100)}% above average`);
      } else if (topMultiplier >= 1.15) {
        timingScore = 7;
        insights.push(`✅ Good timing data: ${Math.round(topMultiplier * 100)}% above average`);
      } else {
        timingScore = 6;
        insights.push(`📊 Moderate timing variation detected`);
      }

      // Step 11: Calculate confidence based on sample size
      let confidence = 0.5;
      if (sampleSize >= 200) {
        confidence = 0.9;
      } else if (sampleSize >= 100) {
        confidence = 0.8;
      } else if (sampleSize >= 50) {
        confidence = 0.7;
      } else if (sampleSize >= 20) {
        confidence = 0.6;
      }

      // Step 12: Query competitor posting times (optional enhancement)
      const { data: competitorVideos } = await supabase
        .from('scraped_videos')
        .select('created_at')
        .limit(500);

      let competitorPostingHours: number[] = [];
      if (competitorVideos && competitorVideos.length > 0) {
        const competitorHourCounts: Record<number, number> = {};
        competitorVideos.forEach(v => {
          const hour = new Date(v.created_at).getUTCHours();
          competitorHourCounts[hour] = (competitorHourCounts[hour] || 0) + 1;
        });

        // Find top 3 competitor posting hours
        competitorPostingHours = Object.entries(competitorHourCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([hour]) => parseInt(hour));

        // Check if optimal hours overlap with competitor hours
        const overlap = optimalHours.filter(h => competitorPostingHours.includes(h));
        if (overlap.length >= 2) {
          insights.push(`⚔️ High competition at ${overlap.map(h => `${h}:00`).join(', ')}`);
        }
      }

      return {
        success: true,
        optimalHours,
        optimalDays,
        engagementMultiplierByHour,
        engagementMultiplierByDay,
        avoidHours,
        peakWindow,
        timingScore,
        confidence,
        insights,
        features: {
          sampleSize,
          avgDPSByHour,
          competitorPostingHours
        }
      };

    } catch (error: any) {
      return {
        success: false,
        optimalHours: [9, 12, 18, 21],
        optimalDays: ['Tuesday', 'Wednesday', 'Thursday'],
        engagementMultiplierByHour: {},
        engagementMultiplierByDay: {},
        avoidHours: [2, 3, 4],
        peakWindow: null,
        timingScore: 5,
        confidence: 0.3,
        insights: ['Error analyzing posting times'],
        features: { sampleSize: 0 },
        error: error.message
      };
    }
  }

  /**
   * Convert posting time analysis to DPS prediction
   * Range: 45 (poor timing) to 90 (optimal timing)
   */
  public static toDPS(result: PostingTimeResult): number {
    if (!result.success || result.timingScore === undefined) {
      return 50; // Baseline (neutral)
    }

    // Map timing score (0-10) to DPS (45-75) - Timing isn't everything
    const baseDPS = 45;
    const maxBonus = 30;
    const dpsPrediction = baseDPS + (result.timingScore / 10) * maxBonus;

    return Math.round(dpsPrediction * 10) / 10;
  }
}

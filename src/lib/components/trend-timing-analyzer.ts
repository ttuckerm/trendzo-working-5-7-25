/**
 * Trend Timing Analyzer (Component 18)
 *
 * Analyzes the timing aspects of trending content to predict viral potential:
 * - Trend lifecycle stage detection
 * - Optimal posting window identification
 * - Trend momentum analysis
 * - Niche-specific timing patterns
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

export interface TrendTimingResult {
  success: boolean;
  trendStage: 'emerging' | 'peak' | 'saturated' | 'declining' | 'unknown';
  timingScore: number; // 0-10
  momentum: number; // -1 to 1 (negative = declining, positive = growing)
  optimalPostingHours: number[]; // Array of hours (0-23)
  daysSinceTrendStart: number | null;
  confidence: number; // 0-1
  insights: string[];
  features: {
    recentVideoCount: number;
    avgRecentDPS: number;
    trendVelocity: number;
    nicheEngagementByHour?: Record<number, number>;
  };
  error?: string;
}

/**
 * Trend Timing Analyzer
 */
export class TrendTimingAnalyzer {
  /**
   * Analyze trend timing for the given video input
   */
  public static async analyze(
    transcript?: string,
    niche?: string,
    goal?: string,
    accountSize?: string
  ): Promise<TrendTimingResult> {
    const insights: string[] = [];

    try {
      // Validation
      if (!niche) {
        return {
          success: false,
          trendStage: 'unknown',
          timingScore: 5,
          momentum: 0,
          optimalPostingHours: [9, 12, 18, 21],
          daysSinceTrendStart: null,
          confidence: 0.3,
          insights: ['No niche provided - using default timing patterns'],
          features: {
            recentVideoCount: 0,
            avgRecentDPS: 50,
            trendVelocity: 0
          },
          error: 'Niche required for trend timing analysis'
        };
      }

      // Step 1: Query recent videos in the niche (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const { data: recentVideos, error: recentError } = await supabase
        .from('scraped_videos')
        .select('video_id, views_count, likes_count, comments_count, shares_count, created_at_utc')
        .or(`description.ilike.%${niche}%,caption.ilike.%${niche}%`)
        .gte('created_at_utc', sevenDaysAgo.toISOString())
        .order('created_at_utc', { ascending: false })
        .limit(100);

      if (recentError) {
        console.warn('Error fetching recent videos:', recentError);
        throw recentError;
      }

      // Step 2: Query previous week for comparison
      const { data: previousWeekVideos, error: prevError } = await supabase
        .from('scraped_videos')
        .select('video_id, views_count, likes_count, comments_count, created_at_utc')
        .or(`description.ilike.%${niche}%,caption.ilike.%${niche}%`)
        .gte('created_at_utc', fourteenDaysAgo.toISOString())
        .lt('created_at_utc', sevenDaysAgo.toISOString())
        .limit(100);

      if (prevError) {
        console.warn('Error fetching previous week videos:', prevError);
      }

      // Calculate metrics
      const recentCount = recentVideos?.length || 0;
      const prevCount = previousWeekVideos?.length || 0;

      // Calculate average DPS for recent videos
      let avgRecentDPS = 50;
      if (recentVideos && recentVideos.length > 0) {
        const totalEngagement = recentVideos.reduce((sum, v) => {
          const engagement = (v.likes_count + v.comments_count + (v.shares_count || 0)) / Math.max(v.views_count, 1);
          return sum + (engagement * 100);
        }, 0);
        avgRecentDPS = Math.min(100, totalEngagement / recentVideos.length);
      }

      // Calculate trend velocity (growth rate)
      const trendVelocity = prevCount > 0
        ? ((recentCount - prevCount) / prevCount) * 100
        : recentCount > 0 ? 100 : 0;

      // Calculate momentum (-1 to 1)
      const momentum = Math.max(-1, Math.min(1, trendVelocity / 100));

      // Determine trend stage
      let trendStage: TrendTimingResult['trendStage'] = 'unknown';
      if (recentCount === 0 && prevCount === 0) {
        trendStage = 'unknown';
        insights.push(`Insufficient data: 0 videos found for niche "${niche}"`);
      } else if (recentCount < 5) {
        trendStage = 'emerging';
        insights.push(`🌱 Emerging trend: Only ${recentCount} recent videos in niche`);
      } else if (trendVelocity > 50) {
        trendStage = 'peak';
        insights.push(`🚀 Peak trend: ${Math.round(trendVelocity)}% growth week-over-week`);
      } else if (recentCount > 50 && trendVelocity < 10) {
        trendStage = 'saturated';
        insights.push(`📊 Saturated market: ${recentCount} videos, low growth`);
      } else if (momentum < -0.2) {
        trendStage = 'declining';
        insights.push(`📉 Declining trend: ${Math.round(trendVelocity)}% decline`);
      } else {
        trendStage = 'peak';
        insights.push(`✅ Active trend: ${recentCount} videos with steady engagement`);
      }

      // Step 3: Analyze optimal posting times from historical data
      const { data: historicalVideos, error: histError } = await supabase
        .from('scraped_videos')
        .select('dps_score, created_at')
        .not('dps_score', 'is', null)
        .limit(500);

      let optimalPostingHours = [9, 12, 18, 21]; // Default
      let nicheEngagementByHour: Record<number, number> = {};

      if (historicalVideos && historicalVideos.length > 10) {
        // Calculate engagement by hour
        const hourlyStats: Record<number, { total: number; count: number }> = {};

        historicalVideos.forEach(v => {
          const hour = new Date(v.created_at).getUTCHours();
          if (!hourlyStats[hour]) {
            hourlyStats[hour] = { total: 0, count: 0 };
          }
          hourlyStats[hour].total += parseFloat(v.dps_score || '0');
          hourlyStats[hour].count += 1;
        });

        // Calculate average DPS by hour
        Object.keys(hourlyStats).forEach(hourStr => {
          const hour = parseInt(hourStr);
          const stats = hourlyStats[hour];
          nicheEngagementByHour[hour] = stats.total / stats.count;
        });

        // Find top 4 hours
        const sortedHours = Object.entries(nicheEngagementByHour)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4)
          .map(([hour]) => parseInt(hour));

        if (sortedHours.length >= 4) {
          optimalPostingHours = sortedHours.sort((a, b) => a - b);
          insights.push(`⏰ Best posting times: ${optimalPostingHours.join(':00, ')}:00 UTC`);
        }
      } else {
        insights.push(`ℹ️ Using default posting times (insufficient historical data)`);
      }

      // Step 4: Calculate timing score (0-10)
      let timingScore = 5; // Baseline

      // Bonus for emerging/peak trends
      if (trendStage === 'emerging') {
        timingScore += 3;
        insights.push(`✨ Early adopter advantage: +3 timing score`);
      } else if (trendStage === 'peak') {
        timingScore += 2;
        insights.push(`🔥 Riding the wave: +2 timing score`);
      } else if (trendStage === 'saturated') {
        timingScore -= 1;
        insights.push(`⚠️ Crowded space: -1 timing score`);
      } else if (trendStage === 'declining') {
        timingScore -= 2;
        insights.push(`❌ Declining trend: -2 timing score`);
      }

      // Bonus for high momentum
      if (momentum > 0.5) {
        timingScore += 2;
        insights.push(`📈 Strong momentum: +2 timing score`);
      } else if (momentum < -0.3) {
        timingScore -= 1;
      }

      // Ensure 0-10 range
      timingScore = Math.max(0, Math.min(10, timingScore));

      // Calculate confidence based on data availability
      let confidence = 0.5;
      if (recentCount >= 20 && prevCount >= 20) {
        confidence = 0.85;
      } else if (recentCount >= 10 || prevCount >= 10) {
        confidence = 0.7;
      } else if (recentCount >= 5 || prevCount >= 5) {
        confidence = 0.6;
      }

      // Calculate days since trend start (approximate)
      let daysSinceTrendStart: number | null = null;
      if (recentVideos && recentVideos.length > 0) {
        const oldestVideo = recentVideos[recentVideos.length - 1];
        const trendAge = Date.now() - new Date(oldestVideo.created_at_utc).getTime();
        daysSinceTrendStart = Math.floor(trendAge / (1000 * 60 * 60 * 24));

        if (daysSinceTrendStart <= 3) {
          insights.push(`🆕 Very fresh trend: ${daysSinceTrendStart} days old`);
        } else if (daysSinceTrendStart <= 7) {
          insights.push(`📅 Recent trend: ${daysSinceTrendStart} days old`);
        } else {
          insights.push(`📆 Established trend: ${daysSinceTrendStart}+ days old`);
        }
      }

      return {
        success: true,
        trendStage,
        timingScore,
        momentum,
        optimalPostingHours,
        daysSinceTrendStart,
        confidence,
        insights,
        features: {
          recentVideoCount: recentCount,
          avgRecentDPS: Math.round(avgRecentDPS * 10) / 10,
          trendVelocity: Math.round(trendVelocity * 10) / 10,
          nicheEngagementByHour
        }
      };

    } catch (error: any) {
      return {
        success: false,
        trendStage: 'unknown',
        timingScore: 5,
        momentum: 0,
        optimalPostingHours: [9, 12, 18, 21],
        daysSinceTrendStart: null,
        confidence: 0.3,
        insights: ['Error analyzing trend timing'],
        features: {
          recentVideoCount: 0,
          avgRecentDPS: 50,
          trendVelocity: 0
        },
        error: error.message
      };
    }
  }

  /**
   * Convert timing analysis to DPS prediction
   * Range: 40 (poor timing) to 85 (perfect timing)
   */
  public static toDPS(result: TrendTimingResult): number {
    if (!result.success || result.timingScore === undefined) {
      return 50; // Baseline
    }

    // Map timing score (0-10) to DPS (40-85)
    const baseDPS = 40;
    const maxBonus = 45;
    const dpsPrediction = baseDPS + (result.timingScore / 10) * maxBonus;

    return Math.round(dpsPrediction * 10) / 10;
  }
}

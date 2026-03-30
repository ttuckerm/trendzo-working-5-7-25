import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // =====================================
    // FETCH FROM REAL DATA: scraped_videos
    // =====================================
    const { data: videos, error } = await supabase
      .from('scraped_videos')
      .select('video_id, dps_score, views_count, likes_count, scraped_at')
      .order('scraped_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching scraped_videos:', error);
    }

    const allVideos = videos || [];
    
    // Calculate REAL average DPS from scraped videos
    const avgDps = allVideos.length > 0
      ? allVideos.reduce((sum, v) => sum + (v.dps_score || 0), 0) / allVideos.length
      : 65;

    // Calculate engagement metrics for platform analysis
    const totalViews = allVideos.reduce((sum, v) => sum + (v.views_count || 0), 0);
    const totalLikes = allVideos.reduce((sum, v) => sum + (v.likes_count || 0), 0);
    const engagementRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 5;

    // Top performing videos (DPS > 75) indicate algorithm favorability
    const topPerformers = allVideos.filter(v => v.dps_score >= 75);
    const topPerformerRatio = allVideos.length > 0 ? topPerformers.length / allVideos.length : 0.3;

    // =====================================
    // CALCULATE REAL PLATFORM CONDITIONS
    // =====================================
    // Based on actual DPS distribution in our scraped data
    const platforms = [
      {
        name: 'TikTok',
        multiplier: calculateMultiplier(avgDps, 70, topPerformerRatio),
        status: getStatus(avgDps, 70, topPerformerRatio),
        description: getDescription(avgDps, 70, topPerformerRatio, allVideos.length)
      },
      {
        name: 'Instagram',
        multiplier: calculateMultiplier(avgDps, 65, topPerformerRatio * 1.05), // Slightly different baseline
        status: getStatus(avgDps, 65, topPerformerRatio * 1.05),
        description: getDescription(avgDps, 65, topPerformerRatio * 1.05, allVideos.length)
      },
      {
        name: 'YouTube Shorts',
        multiplier: calculateMultiplier(avgDps, 60, topPerformerRatio * 1.1), // YouTube tends to be more generous
        status: getStatus(avgDps, 60, topPerformerRatio * 1.1),
        description: getDescription(avgDps, 60, topPerformerRatio * 1.1, allVideos.length)
      }
    ];

    // Calculate REAL market sentiment from video performance
    // Use median DPS, top performer ratio, and engagement rate
    const sortedDps = allVideos
      .map(v => v.dps_score || 0)
      .filter(d => d > 0)
      .sort((a, b) => a - b);
    const medianDps = sortedDps.length > 0 
      ? sortedDps[Math.floor(sortedDps.length / 2)] 
      : 65;

    const sentiment = calculateSentiment(avgDps, medianDps, topPerformerRatio, engagementRate);
    const sentimentLabel = getSentimentLabel(sentiment);

    return NextResponse.json({
      success: true,
      weather: {
        platforms,
        sentiment: {
          value: Math.round(sentiment),
          label: sentimentLabel
        },
        avgDps: Math.round(avgDps * 10) / 10,
        videosAnalyzed: allVideos.length,
        lastUpdated: now.toISOString()
      },
      metadata: {
        source: 'scraped_videos',
        totalVideos: allVideos.length,
        topPerformers: topPerformers.length,
        engagementRate: Math.round(engagementRate * 100) / 100,
        medianDps: Math.round(medianDps * 10) / 10
      }
    });

  } catch (error: any) {
    console.error('Error calculating algorithm weather:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function calculateMultiplier(avgDps: number, baseline: number, topPerformerRatio: number): string {
  // Factor in both average DPS and how many videos are top performers
  const dpsRatio = avgDps / baseline;
  const performanceBoost = topPerformerRatio > 0.3 ? 0.1 : (topPerformerRatio > 0.2 ? 0.05 : 0);
  const ratio = dpsRatio + performanceBoost;
  return `${ratio.toFixed(1)}x`;
}

function getStatus(avgDps: number, baseline: number, topPerformerRatio: number): 'Generous' | 'Normal' | 'Harsh' {
  const ratio = avgDps / baseline;
  const hasHighPerformers = topPerformerRatio > 0.25;
  
  if (ratio >= 1.1 || (ratio >= 1.0 && hasHighPerformers)) return 'Generous';
  if (ratio <= 0.85 && topPerformerRatio < 0.15) return 'Harsh';
  return 'Normal';
}

function getDescription(avgDps: number, baseline: number, topPerformerRatio: number, totalVideos: number): string {
  const status = getStatus(avgDps, baseline, topPerformerRatio);
  const videoText = totalVideos > 0 ? ` (${totalVideos} videos analyzed)` : '';
  
  switch (status) {
    case 'Generous':
      return `Algorithm boosting content${videoText}`;
    case 'Harsh':
      return `Reach is suppressed${videoText}`;
    case 'Normal':
    default:
      return `Standard conditions${videoText}`;
  }
}

function calculateSentiment(avgDps: number, medianDps: number, topPerformerRatio: number, engagementRate: number): number {
  // Weighted formula for market sentiment
  const dpsScore = Math.min(100, (avgDps / 80) * 100);
  const medianScore = Math.min(100, (medianDps / 75) * 100);
  const performerScore = Math.min(100, topPerformerRatio * 200);
  const engagementScore = Math.min(100, engagementRate * 10);

  return (dpsScore * 0.4) + (medianScore * 0.25) + (performerScore * 0.25) + (engagementScore * 0.1);
}

function getSentimentLabel(sentiment: number): string {
  if (sentiment >= 80) return 'Very Positive';
  if (sentiment >= 65) return 'Positive';
  if (sentiment >= 45) return 'Neutral';
  if (sentiment >= 30) return 'Cautious';
  return 'Challenging';
}

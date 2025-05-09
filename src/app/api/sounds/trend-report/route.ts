import { NextRequest, NextResponse } from 'next/server';
import { soundAnalysisService } from '@/lib/services/soundAnalysisService';
import { soundService } from '@/lib/services/soundService';
import { auth } from '@/lib/auth';

// Cache expiration time in seconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60;
// In-memory cache for trend reports
const trendReportCache: {
  report: any;
  timestamp: number;
} = {
  report: null,
  timestamp: 0
};

/**
 * POST /api/sounds/trend-report
 * Generate a new sound trend report
 * 
 * Query parameters:
 * @param forceRefresh - Set to 'true' to force a new report generation
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check for force refresh parameter
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    
    // Check if we have a recent cached report
    const now = Math.floor(Date.now() / 1000);
    if (!forceRefresh && 
        trendReportCache.report && 
        now - trendReportCache.timestamp < CACHE_EXPIRATION) {
      return NextResponse.json({
        success: true,
        report: trendReportCache.report,
        cached: true,
        cacheAge: now - trendReportCache.timestamp
      });
    }
    
    // Generate a new trend report
    const report = await soundAnalysisService.generateSoundTrendReport();
    
    // Update cache
    trendReportCache.report = report;
    trendReportCache.timestamp = now;
    
    return NextResponse.json({
      success: true,
      report,
      cached: false
    });
  } catch (error: any) {
    console.error('Error generating sound trend report:', error);
    
    // If generation fails but we have a cached report, return that with a warning
    if (trendReportCache.report) {
      return NextResponse.json({
        success: true,
        report: trendReportCache.report,
        cached: true,
        warning: 'Generated report failed; serving cached version',
        cacheAge: Math.floor(Date.now() / 1000) - trendReportCache.timestamp
      });
    }
    
    return NextResponse.json(
      { error: error.message || 'An error occurred generating the trend report' }, 
      { status: 500 }
    );
  }
}

/**
 * GET /api/sounds/trend-report
 * Get the latest sound trend report with expanded details
 * 
 * Query parameters:
 * @param reportId - Optional specific report ID to retrieve
 * @param expanded - Set to 'true' to include detailed sound information
 * @param limit - Max number of sounds to include in each category (default: 5)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    const expanded = searchParams.get('expanded') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20); // Cap at 20
    
    // Get report - either specific one or latest
    let report;
    if (reportId) {
      report = await soundService.getTrendReportById(reportId);
    } else {
      report = await soundService.getLatestTrendReport();
    }
    
    if (!report) {
      return NextResponse.json(
        { error: 'No trend reports found' }, 
        { status: 404 }
      );
    }
    
    // If expanded, include detailed sound information
    if (expanded) {
      // Helper function to get sound details for IDs
      const getSoundDetails = async (soundIds: string[]) => {
        const details = await Promise.all(
          soundIds.slice(0, limit).map(async (id) => {
            const sound = await soundService.getSoundById(id);
            return sound ? {
              id: sound.id,
              title: sound.title,
              authorName: sound.authorName,
              soundCategory: sound.soundCategory,
              lifecycle: sound.lifecycle,
              viralityScore: sound.viralityScore,
              stats: {
                usageCount: sound.stats.usageCount,
                usageChange7d: sound.stats.usageChange7d,
                trend: sound.stats.trend
              }
            } : null;
          })
        );
        
        return details.filter(sound => sound !== null);
      };
      
      // Get detailed sound information for all categories
      const [
        topSoundsDaily,
        topSoundsWeekly,
        topSoundsMonthly,
        emergingSounds,
        peakingSounds,
        decliningTrends
      ] = await Promise.all([
        getSoundDetails(report.topSounds.daily),
        getSoundDetails(report.topSounds.weekly),
        getSoundDetails(report.topSounds.monthly),
        getSoundDetails(report.emergingSounds),
        getSoundDetails(report.peakingSounds),
        getSoundDetails(report.decliningTrends)
      ]);
      
      // Return expanded report
      return NextResponse.json({
        success: true,
        report: {
          ...report,
          details: {
            topSounds: {
              daily: topSoundsDaily,
              weekly: topSoundsWeekly,
              monthly: topSoundsMonthly
            },
            emergingSounds,
            peakingSounds,
            decliningTrends
          }
        },
        expanded: true
      });
    }
    
    // Return basic report
    return NextResponse.json({
      success: true,
      report,
      expanded: false
    });
  } catch (error: any) {
    console.error('Error retrieving sound trend report:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred retrieving the trend report' }, 
      { status: 500 }
    );
  }
} 
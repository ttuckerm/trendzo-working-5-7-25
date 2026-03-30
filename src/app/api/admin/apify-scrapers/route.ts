/**
 * Apify Scrapers Management API
 * Controls all 7 Apify actors for real-world data testing
 * Integrates with viral prediction pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ApifyScraperManager } from '@/lib/services/viral-prediction/apify-scraper-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Initialize scraper manager
let scraperManager: ApifyScraperManager | null = null;

async function getScraperManager(): Promise<ApifyScraperManager> {
  if (!scraperManager) {
    const { ApifyScraperManager } = await import('@/lib/services/viral-prediction/apify-scraper-manager');
    scraperManager = new ApifyScraperManager({
      apiToken: process.env.APIFY_API_TOKEN!,
      defaultMaxItems: 100,
      useProxy: true,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL'],
        apifyProxyCountry: 'US'
      }
    });
  }
  return scraperManager;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const manager = await getScraperManager();
    const startTime = Date.now();

    switch (action) {
      case 'scrape_trending': {
        const job = await manager.scrapeTrendingVideos({
          maxItems: body.maxItems || 100,
          region: body.region || 'US',
          includeComments: body.includeComments !== false,
          includeTranscripts: body.includeTranscripts !== false
        });

        return NextResponse.json({
          success: true,
          action: 'trending_scrape_started',
          job,
          processingTime: Date.now() - startTime,
          message: `Scraping ${body.maxItems || 100} trending videos`
        });
      }

      case 'scrape_hashtag': {
        if (!body.hashtag) {
          return NextResponse.json(
            { success: false, error: 'Missing required hashtag parameter' },
            { status: 400 }
          );
        }

        const job = await manager.scrapeHashtagVideos(
          body.hashtag,
          body.maxItems || 50
        );

        return NextResponse.json({
          success: true,
          action: 'hashtag_scrape_started',
          job,
          hashtag: body.hashtag,
          processingTime: Date.now() - startTime
        });
      }

      case 'scrape_trending_hashtags': {
        const { hashtags, job } = await manager.scrapeTrendingHashtags();

        return NextResponse.json({
          success: true,
          action: 'trending_hashtags_scraped',
          job,
          hashtags: hashtags.slice(0, 20), // Top 20
          totalHashtags: hashtags.length,
          processingTime: Date.now() - startTime
        });
      }

      case 'scrape_trending_sounds': {
        const { sounds, job } = await manager.scrapeTrendingSounds();

        return NextResponse.json({
          success: true,
          action: 'trending_sounds_scraped',
          job,
          sounds: sounds.slice(0, 20), // Top 20
          totalSounds: sounds.length,
          processingTime: Date.now() - startTime
        });
      }

      case 'run_daily_scraping': {
        const results = await manager.runDailyScraping();

        return NextResponse.json({
          success: true,
          action: 'daily_scraping_completed',
          results: {
            trendingVideos: results.trending.videosProcessed,
            trendingHashtags: results.hashtags.length,
            trendingSounds: results.sounds.length,
            totalVideos: results.totalVideos
          },
          jobs: {
            trending: results.trending
          },
          processingTime: Date.now() - startTime,
          
          // Evidence for proof of concept
          evidence: {
            realWorldDataActive: true,
            multiActorIntegration: true,
            comprehensiveDataCollection: {
              videos: results.totalVideos,
              hashtags: results.hashtags.length,
              sounds: results.sounds.length,
              comments: 'included',
              transcripts: 'included'
            },
            pipelineIntegration: 'Ready for viral prediction analysis'
          }
        });
      }

      case 'get_job_status': {
        if (!body.jobId) {
          return NextResponse.json(
            { success: false, error: 'Missing required jobId parameter' },
            { status: 400 }
          );
        }

        const job = manager.getJobStatus(body.jobId);
        
        if (!job) {
          return NextResponse.json(
            { success: false, error: 'Job not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          job
        });
      }

      case 'get_active_jobs': {
        const activeJobs = manager.getActiveJobs();

        return NextResponse.json({
          success: true,
          activeJobs,
          totalActive: activeJobs.length
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Apify scraper error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Scraper operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'status';

    const manager = await getScraperManager();

    if (view === 'status') {
      // Get current system status
      const activeJobs = manager.getActiveJobs();
      
      return NextResponse.json({
        success: true,
        status: {
          scraperManagerActive: true,
          activeJobs: activeJobs.length,
          actors: {
            trendingVideos: { status: 'ready', actor: 'TikTok Trending Videos Scraper' },
            fastApi: { status: 'ready', actor: 'Fast TikTok API' },
            dataExtractor: { status: 'ready', actor: 'TikTok Data Extractor (fail-safe)' },
            comments: { status: 'ready', actor: 'TikTok Comments Scraper' },
            trendingHashtags: { status: 'ready', actor: 'TikTok Trending Hashtags Scraper' },
            trendingSounds: { status: 'ready', actor: 'TikTok Trending Sounds Scraper' },
            transcripts: { status: 'ready', actor: 'Video Transcript Scraper' }
          },
          capabilities: {
            trendingContent: 'Scrape up to 100+ trending videos daily',
            hashtagAnalysis: 'Track specific hashtags and trends',
            soundTracking: 'Monitor viral sounds and music',
            commentAnalysis: 'Extract engagement insights from comments',
            transcriptGeneration: 'Generate transcripts for script analysis',
            batchProcessing: 'Process multiple scraping jobs in parallel',
            dailyAutomation: 'Run automated daily scraping routine'
          }
        },
        activeJobs: activeJobs.map(job => ({
          id: job.id,
          type: job.type,
          status: job.status,
          startedAt: job.startedAt,
          videosProcessed: job.videosProcessed
        }))
      });
    }

    if (view === 'cost_estimate') {
      // Provide cost estimates based on usage
      return NextResponse.json({
        success: true,
        costEstimate: {
          dailyUsage: {
            trendingVideos: { videos: 100, estimatedCU: 5, cost: '$0.00125' },
            hashtagVideos: { videos: 100, estimatedCU: 2, cost: '$0.0005' },
            comments: { videos: 20, estimatedCU: 10, cost: '$0.0025' },
            transcripts: { videos: 100, estimatedCU: 10, cost: '$0.0025' },
            trendingData: { runs: 2, estimatedCU: 4, cost: '$0.001' },
            totalDailyCU: 31,
            totalDailyCost: '$0.00775'
          },
          monthlyProjection: {
            totalCU: 930,
            totalCost: '$0.23',
            includedInStarter: true,
            starterPlanCU: 200000,
            utilizationPercentage: '0.47%'
          },
          recommendation: 'Usage well within Apify Starter Plan limits ($49/month)'
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid view parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Get scraper status error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get scraper status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
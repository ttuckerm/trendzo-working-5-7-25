/**
 * Viral Content Scraping API
 * 
 * Endpoints for managing viral content scraping to balance ML training data.
 * 
 * POST /api/viral-scraping - Start a new scraping job
 * GET /api/viral-scraping - Get current training data distribution
 * GET /api/viral-scraping?jobId=xxx - Get specific job status
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  ViralContentScraperService, 
  DEFAULT_VIRAL_SCRAPE_CONFIG,
  DEFAULT_SEARCH_QUERIES,
  ViralScrapeConfig 
} from '@/lib/services/viral-scraping/viral-content-scraper';

// Disable caching to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Singleton instance
let scraperService: ViralContentScraperService | null = null;

function getScraperService(): ViralContentScraperService {
  if (!scraperService) {
    scraperService = new ViralContentScraperService();
  }
  return scraperService;
}

/**
 * GET /api/viral-scraping
 * 
 * Returns current training data distribution and job status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const scraper = getScraperService();

    // If jobId provided, return specific job status
    if (jobId) {
      const job = scraper.getJobStatus(jobId);
      
      if (!job) {
        return NextResponse.json(
          { error: 'Job not found', jobId },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        job
      });
    }

    // Return overall training data distribution
    const distribution = await scraper.getTrainingDataDistribution();
    const allJobs = scraper.getAllJobs();

    // Calculate target progress
    const currentViral = distribution.megaViral + distribution.viral;
    const targetViral = 150; // Target 150+ viral/mega-viral videos
    const progress = Math.min(100, (currentViral / targetViral) * 100);

    return NextResponse.json({
      success: true,
      distribution: {
        ...distribution,
        targetViral,
        progress: Math.round(progress),
        needed: Math.max(0, targetViral - currentViral)
      },
      recentJobs: allJobs.slice(-5), // Last 5 jobs
      defaultConfig: DEFAULT_VIRAL_SCRAPE_CONFIG,
      defaultSearchQueries: DEFAULT_SEARCH_QUERIES
    });

  } catch (error) {
    console.error('Viral scraping GET error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get viral scraping status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/viral-scraping
 * 
 * Start a new viral content scraping job
 * 
 * Body (all optional, defaults applied):
 * {
 *   searchQueries?: string[],
 *   resultsPerPage?: number,
 *   minHearts?: number,
 *   publishedAfter?: string,
 *   shouldDownloadSubtitles?: boolean,
 *   shouldDownloadVideos?: boolean,
 *   excludePinnedPosts?: boolean,
 *   searchSection?: string,
 *   scrapeRelatedVideos?: boolean,
 *   maxItems?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const scraper = getScraperService();

    // Build config from body, with defaults
    const config: Partial<ViralScrapeConfig> = {};

    // String array parameters
    if (body.searchQueries && Array.isArray(body.searchQueries)) {
      // Filter and clean search queries
      config.searchQueries = body.searchQueries
        .map((q: string) => (typeof q === 'string' ? q.trim() : ''))
        .filter((q: string) => q.length > 0);
    }

    // Number parameters
    if (body.resultsPerPage && typeof body.resultsPerPage === 'number') {
      config.resultsPerPage = Math.min(100, Math.max(10, body.resultsPerPage));
    }

    if (body.minHearts && typeof body.minHearts === 'number') {
      config.minHearts = Math.max(10000, body.minHearts); // Minimum 10K hearts
    }

    if (body.maxItems && typeof body.maxItems === 'number') {
      config.maxItems = Math.max(1, body.maxItems);
    }

    // String parameters
    if (body.publishedAfter && typeof body.publishedAfter === 'string') {
      config.publishedAfter = body.publishedAfter;
    }

    if (body.searchSection && typeof body.searchSection === 'string') {
      config.searchSection = body.searchSection;
    }

    // Boolean parameters - explicitly check for boolean type
    if (typeof body.shouldDownloadSubtitles === 'boolean') {
      config.shouldDownloadSubtitles = body.shouldDownloadSubtitles;
    }

    if (typeof body.shouldDownloadVideos === 'boolean') {
      config.shouldDownloadVideos = body.shouldDownloadVideos;
    }

    if (typeof body.excludePinnedPosts === 'boolean') {
      config.excludePinnedPosts = body.excludePinnedPosts;
    }

    if (typeof body.scrapeRelatedVideos === 'boolean') {
      config.scrapeRelatedVideos = body.scrapeRelatedVideos;
    }

    // Check if there's already a running job
    const runningJobs = scraper.getAllJobs().filter(j => j.status === 'running');
    if (runningJobs.length > 0) {
      return NextResponse.json(
        { 
          error: 'A scraping job is already running',
          runningJobId: runningJobs[0].jobId,
          runningJob: runningJobs[0]
        },
        { status: 409 }
      );
    }

    // Start the scraping job
    console.log('🚀 Starting viral scrape via API...');
    console.log('   Config overrides:', JSON.stringify(config, null, 2));
    
    const jobId = await scraper.startViralScrape(config);

    // Build final config for response
    const finalConfig = { ...DEFAULT_VIRAL_SCRAPE_CONFIG, ...config };

    // Return immediately with job ID (job runs async)
    return NextResponse.json({
      success: true,
      message: 'Viral scraping job started',
      jobId,
      config: finalConfig,
      statusEndpoint: `/api/viral-scraping?jobId=${jobId}`
    });

  } catch (error) {
    console.error('Viral scraping POST error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start viral scraping job',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/viral-scraping
 * 
 * Cancel a running job (not implemented - jobs run to completion)
 */
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Job cancellation not supported. Jobs run to completion.' },
    { status: 501 }
  );
}

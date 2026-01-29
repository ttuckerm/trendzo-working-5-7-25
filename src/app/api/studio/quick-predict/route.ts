import { NextResponse } from 'next/server';
import { VideoIntelligenceService } from '@/lib/services/videoIntelligenceService';
import { VideoScraperService } from '@/lib/services/videoScraperService';
import { AlertService } from '@/lib/services/alertService';

interface PredictionRequest {
  videoUrl: string;
}

interface PredictionResponse {
  success: boolean;
  id?: string;
  message?: string;
  error?: string;
  details?: string;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  let body: PredictionRequest;
  
  try {
    body = await request.json();
    
    console.log(`[SCRAPE START] [${requestId}] Received request for URL: ${body.videoUrl}`);
    console.log(`[SCRAPE START] [${requestId}] Timestamp: ${new Date().toISOString()}`);
    
    if (!body.videoUrl) {
      console.log(`[SCRAPE ERROR] [${requestId}] Missing video URL in request`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Video URL is required',
          details: 'The videoUrl field is missing from the request body'
        } as PredictionResponse,
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(body.videoUrl);
      console.log(`[SCRAPE VALIDATION] [${requestId}] URL format is valid`);
    } catch (urlError) {
      console.log(`[SCRAPE ERROR] [${requestId}] Invalid URL format: ${urlError}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid URL format',
          details: urlError instanceof Error ? urlError.message : 'URL cannot be parsed'
        } as PredictionResponse,
        { status: 400 }
      );
    }

    // Step 1: Check if video already exists in database
    console.log(`[SCRAPE CHECK] [${requestId}] Checking if video already exists in database...`);
    const existingVideo = await VideoIntelligenceService.getVideoByUrl(body.videoUrl);
    
    if (existingVideo) {
      console.log(`[SCRAPE EXISTS] [${requestId}] Video already exists in database: ${existingVideo.id}`);
      console.log(`[SCRAPE COMPLETE] [${requestId}] Request completed in ${Date.now() - startTime}ms (existing video)`);
      return NextResponse.json({
        success: true,
        id: existingVideo.id,
        message: 'Video already analyzed and updated in Proving Grounds'
      } as PredictionResponse);
    }

    console.log(`[SCRAPE CHECK] [${requestId}] Video not found in database, proceeding with scraping...`);

    // Step 2: Scrape the video data
    console.log(`[SCRAPE CALL] [${requestId}] Invoking scraper service...`);
    const scrapedData = await VideoScraperService.scrapeVideo(body.videoUrl);
    
    console.log(`[SCRAPE SUCCESS] [${requestId}] Scraper returned data:`, {
      platform: scrapedData.platform,
      author: scrapedData.author,
      view_count: scrapedData.view_count,
      like_count: scrapedData.like_count,
      comment_count: scrapedData.comment_count,
      share_count: scrapedData.share_count,
      engagement_score: scrapedData.engagement_score,
      has_thumbnail: !!scrapedData.thumbnail_url,
      has_description: !!scrapedData.description,
      hashtags_count: scrapedData.hashtags?.length || 0,
      is_fallback: scrapedData.raw_data?.fallback || false
    });

    // Step 3: Save to database
    console.log(`[DB WRITE] [${requestId}] Saving to video_intelligence table...`);
    const videoRecord = await VideoIntelligenceService.createVideoIntelligence(
      body.videoUrl,
      scrapedData
    );

    console.log(`[DB SUCCESS] [${requestId}] Successfully saved with ID: ${videoRecord.id}`);
    console.log(`[API RESPONSE] [${requestId}] Sending back video data - Request completed in ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      id: videoRecord.id,
      message: 'Video analyzed and added to Proving Grounds'
    } as PredictionResponse);

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`[API ERROR] [${requestId}] An error occurred after ${duration}ms:`, errorMessage);
    console.error(`[API ERROR] [${requestId}] Error type:`, error instanceof Error ? error.constructor.name : typeof error);
    
    if (error instanceof Error && error.stack) {
      console.error(`[API ERROR] [${requestId}] Stack trace:`, error.stack);
    }

    // Log the failure to the system alerts
    try {
      await AlertService.logAlert(
        'error',
        'VideoScraperService',
        `Video scraping failed for URL: ${body?.videoUrl || 'unknown'}. Error: ${errorMessage}`
      );
      console.log(`[API ERROR] [${requestId}] Scraper failure logged to system alerts`);
    } catch (alertError) {
      console.error(`[API ERROR] [${requestId}] Failed to log alert:`, alertError);
    }

    // Analyze the error to provide more specific feedback
    let specificError = 'Failed to analyze video';
    let errorDetails = errorMessage;
    
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('fetch')) {
        specificError = 'Failed to fetch video content';
        errorDetails = 'Unable to access the video URL. The video may be private, deleted, or the platform may be blocking requests.';
      } else if (error.message.includes('load')) {
        specificError = 'Failed to parse video content';
        errorDetails = 'Retrieved video content but could not parse it. The page structure may have changed.';
      } else if (error.message.includes('SUPABASE') || error.message.includes('database')) {
        specificError = 'Database error';
        errorDetails = 'Video was scraped successfully but could not be saved to the database.';
      } else if (error.message.includes('timeout')) {
        specificError = 'Request timeout';
        errorDetails = 'The video platform took too long to respond. Please try again.';
      } else if (error.message.includes('rate limit')) {
        specificError = 'Rate limited';
        errorDetails = 'Too many requests. Please wait a moment before trying again.';
      } else if (error.message.includes('Scraper Error:')) {
        // This is a specific scraper error with detailed message
        specificError = 'Scraper Error';
        errorDetails = errorMessage;
      }
    }
    
    console.error(`[API ERROR] [${requestId}] Returning error response: ${specificError} - ${errorDetails}`);
    
    return NextResponse.json(
      { 
        success: false, 
        error: specificError,
        details: errorDetails
      } as PredictionResponse,
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}
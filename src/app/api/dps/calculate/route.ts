/**
 * FEAT-002: DPS Calculation API Endpoint
 * 
 * POST /api/dps/calculate
 * Calculates Dynamic Percentile System viral scores for videos
 * 
 * Supports:
 * - Single video calculation
 * - Batch processing (up to 100 videos)
 * - Automatic scraped video processing
 * 
 * @module api/dps/calculate
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  calculateSingleDPS, 
  calculateBatchDPS,
  processScrapedVideos,
  MAX_BATCH_SIZE,
} from '@/lib/services/dps/dps-calculation-service';

// =====================================================
// Request Validation Schemas
// =====================================================

const SingleVideoRequestSchema = z.object({
  video: z.object({
    videoId: z.string().min(1),
    platform: z.enum(['tiktok', 'instagram', 'youtube']),
    viewCount: z.number().int().nonnegative(),
    likeCount: z.number().int().nonnegative().optional(),
    commentCount: z.number().int().nonnegative().optional(),
    shareCount: z.number().int().nonnegative().optional(),
    followerCount: z.number().int().nonnegative(),
    hoursSinceUpload: z.number().nonnegative(),
    publishedAt: z.string().datetime(),
    caption: z.string().optional(), // FEAT-002 Enhancement: Identity Container
  }),
  options: z.object({
    enableBlockchainTimestamp: z.boolean().optional(),
    predictionMode: z.enum(['reactive', 'predictive']).optional(),
  }).optional(), // FEAT-002 Enhancements: Blockchain + Prediction Mode
});

const BatchVideoRequestSchema = z.object({
  videos: z.array(z.object({
    videoId: z.string().min(1),
    platform: z.enum(['tiktok', 'instagram', 'youtube']),
    viewCount: z.number().int().nonnegative(),
    likeCount: z.number().int().nonnegative().optional(),
    commentCount: z.number().int().nonnegative().optional(),
    shareCount: z.number().int().nonnegative().optional(),
    followerCount: z.number().int().nonnegative(),
    hoursSinceUpload: z.number().nonnegative(),
    publishedAt: z.string().datetime(),
    caption: z.string().optional(), // FEAT-002 Enhancement: Identity Container
  })).min(1).max(MAX_BATCH_SIZE),
  batchId: z.string().optional(),
  options: z.object({
    predictionMode: z.enum(['reactive', 'predictive']).optional(),
  }).optional(), // FEAT-002 Enhancement: Prediction Mode for batch
});

const ProcessScrapedRequestSchema = z.object({
  mode: z.literal('process_scraped'),
  limit: z.number().int().positive().max(MAX_BATCH_SIZE).optional(),
});

// =====================================================
// Rate Limiting (Simple in-memory implementation)
// =====================================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  clientData.count++;
  return true;
}

// =====================================================
// API Handler
// =====================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute allowed`,
        },
        { status: 429 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Determine request type and process accordingly
    if ('mode' in body && body.mode === 'process_scraped') {
      // Process scraped videos mode
      const validated = ProcessScrapedRequestSchema.parse(body);
      const result = await processScrapedVideos(validated.limit || 100);
      
      return NextResponse.json({
        success: true,
        mode: 'process_scraped',
        ...result,
        apiProcessingTimeMs: Date.now() - startTime,
      });
      
    } else if ('videos' in body && Array.isArray(body.videos)) {
      // Batch mode
      const validated = BatchVideoRequestSchema.parse(body);
      const result = await calculateBatchDPS(validated.videos, validated.batchId);
      
      return NextResponse.json({
        success: true,
        mode: 'batch',
        ...result,
        apiProcessingTimeMs: Date.now() - startTime,
      });
      
    } else if ('video' in body) {
      // Single video mode
      const validated = SingleVideoRequestSchema.parse(body);
      const result = await calculateSingleDPS(validated.video, validated.options);
      
      return NextResponse.json({
        success: true,
        mode: 'single',
        result,
        apiProcessingTimeMs: Date.now() - startTime,
      });
      
    } else {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          message: 'Request must include either "video", "videos", or "mode: process_scraped"',
          examples: {
            single: { video: { videoId: '...', platform: 'tiktok', /* ... */ } },
            batch: { videos: [{ videoId: '...', platform: 'tiktok', /* ... */ }], batchId: 'optional' },
            scraped: { mode: 'process_scraped', limit: 100 },
          },
        },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('DPS calculation API error:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors,
        },
        { status: 422 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =====================================================
// GET Handler (Health Check & Documentation)
// =====================================================

export async function GET() {
  return NextResponse.json({
    service: 'DPS Calculation Engine',
    version: 'v1',
    feature: 'FEAT-002',
    status: 'operational',
    endpoints: {
      calculate: 'POST /api/dps/calculate',
      cohortStats: 'GET /api/dps/cohort-stats/:platform/:followerCount',
    },
    modes: {
      single: {
        description: 'Calculate DPS for a single video',
        method: 'POST',
        body: {
          video: {
            videoId: 'string',
            platform: 'tiktok | instagram | youtube',
            viewCount: 'number',
            likeCount: 'number (optional)',
            commentCount: 'number (optional)',
            shareCount: 'number (optional)',
            followerCount: 'number',
            hoursSinceUpload: 'number',
            publishedAt: 'ISO8601 datetime',
          },
        },
      },
      batch: {
        description: 'Calculate DPS for multiple videos (up to 100)',
        method: 'POST',
        body: {
          videos: 'Array of video objects',
          batchId: 'string (optional)',
        },
      },
      processScraped: {
        description: 'Process unprocessed videos from scraped_videos table',
        method: 'POST',
        body: {
          mode: 'process_scraped',
          limit: 'number (optional, max 100)',
        },
      },
    },
    rateLimits: {
      maxRequestsPerMinute: RATE_LIMIT_MAX_REQUESTS,
      maxBatchSize: MAX_BATCH_SIZE,
    },
    documentation: 'See PRD FEAT-002 for complete specification',
  });
}


/**
 * FEAT-002: DPS Cohort Statistics API Endpoint
 * 
 * GET /api/dps/cohort-stats/:platform/:followerCount
 * Retrieves cohort statistics for DPS calculations
 * 
 * @module api/dps/cohort-stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  getCohortStats,
  getAllCohortStats,
} from '@/lib/services/dps/dps-database-service';

// =====================================================
// Validation Schemas
// =====================================================

const PlatformSchema = z.enum(['tiktok', 'instagram', 'youtube']);
const FollowerCountSchema = z.coerce.number().int().nonnegative();

// =====================================================
// API Handler
// =====================================================

interface RouteParams {
  params: {
    platform: string;
    followerCount: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Validate parameters
    const platform = PlatformSchema.parse(params.platform);
    const followerCount = FollowerCountSchema.parse(params.followerCount);
    
    // Get cohort statistics
    const cohortStats = await getCohortStats(platform, followerCount);
    
    if (!cohortStats) {
      return NextResponse.json(
        { 
          error: 'Cohort not found',
          message: `No cohort statistics found for ${platform} with follower count ${followerCount}`,
          suggestion: 'Try GET /api/dps/cohort-stats/:platform to see all available cohorts',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      platform,
      followerCount,
      cohortStats: {
        cohortMedian: cohortStats.cohortMedian,
        cohortMean: cohortStats.cohortMean,
        cohortStdDev: cohortStats.cohortStdDev,
        sampleSize: cohortStats.sampleSize,
      },
    });
    
  } catch (error) {
    console.error('Cohort stats API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}



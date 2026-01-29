/**
 * FEAT-002: DPS All Cohort Statistics API Endpoint
 * 
 * GET /api/dps/cohort-stats/:platform
 * Retrieves all cohort statistics for a platform
 * 
 * @module api/dps/cohort-stats-all
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAllCohortStats } from '@/lib/services/dps/dps-database-service';

// =====================================================
// Validation Schemas
// =====================================================

const PlatformSchema = z.enum(['tiktok', 'instagram', 'youtube']);

// =====================================================
// API Handler
// =====================================================

interface RouteParams {
  params: {
    platform: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Validate parameters
    const platform = PlatformSchema.parse(params.platform);
    
    // Get all cohort statistics for platform
    const cohortStats = await getAllCohortStats(platform);
    
    return NextResponse.json({
      success: true,
      platform,
      cohortCount: cohortStats.length,
      cohorts: cohortStats.map(cohort => ({
        followerRange: {
          min: cohort.follower_min,
          max: cohort.follower_max,
        },
        statistics: {
          cohortMedian: cohort.cohort_median,
          cohortMean: cohort.cohort_mean,
          cohortStdDev: cohort.cohort_stddev,
          sampleSize: cohort.sample_size,
        },
        lastUpdated: cohort.last_updated,
      })),
    });
    
  } catch (error) {
    console.error('All cohort stats API error:', error);
    
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



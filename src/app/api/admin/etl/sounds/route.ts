import { NextRequest, NextResponse } from 'next/server';
import { soundEtl } from '@/lib/etl/soundEtl';
import { handleApiError } from '@/lib/utils/apiHelpers';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';

/**
 * POST method to trigger the TikTok sound ETL process
 * This is an admin-only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract options from request body
    const body = await request.json().catch(() => ({}));
    const options = body.options || {};
    
    // Start the ETL process
    const result = await soundEtl.processSoundsFromTrending(options);
    
    // Return results
    return NextResponse.json({
      success: true,
      message: 'Sound ETL process completed successfully',
      results: {
        totalVideos: result.totalVideos,
        soundsExtracted: result.soundsExtracted,
        soundsStored: result.soundsStored,
        failed: result.failed
      }
    });
    
  } catch (error) {
    return handleApiError(error, 'Error running sound ETL process');
  }
}

/**
 * PUT method to update sound stats
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authorization
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract options from request body
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 50;
    
    // Update sound stats
    const result = await soundEtl.updateSoundStats(limit);
    
    // Return results
    return NextResponse.json({
      success: true,
      message: 'Sound stats update completed successfully',
      results: {
        total: result.total,
        updated: result.updated,
        failed: result.failed
      }
    });
    
  } catch (error) {
    return handleApiError(error, 'Error updating sound stats');
  }
} 
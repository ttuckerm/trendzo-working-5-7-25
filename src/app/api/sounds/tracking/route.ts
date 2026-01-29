import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { soundLibraryService } from '@/lib/services/soundLibraryService';
import { TrackSoundUsageRequest } from '@/lib/types/sound';

/**
 * GET /api/sounds/tracking
 * Retrieves sound usage history for the authenticated user
 * 
 * Query parameters:
 * @param soundId - Optional sound ID to filter history for a specific sound
 * @param limit - Maximum number of history records to return (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const soundId = searchParams.get('soundId');
    
    // Parse limit
    let limitCount = 50;
    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limitCount = Math.min(parsedLimit, 100); // Cap at 100
      }
    }
    
    // Fetch usage history
    const history = await soundLibraryService.getSoundUsageHistory(
      userId,
      soundId || undefined,
      limitCount
    );
    
    return NextResponse.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('Error fetching sound usage history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred fetching usage history' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sounds/tracking
 * Tracks a sound usage event
 * 
 * Request body:
 * @param soundId - ID of the sound being used (required)
 * @param actionType - Type of usage: 'played', 'downloaded', 'used_in_template', 'shared' (required)
 * @param templateId - Optional template ID if used in a template
 * @param templateName - Optional template name if used in a template
 * @param usageDuration - Optional duration of usage in seconds
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Parse request body
    const body = await request.json();
    const { soundId, actionType, templateId, templateName, usageDuration } = body as TrackSoundUsageRequest;
    
    // Validate required fields
    if (!soundId) {
      return NextResponse.json(
        { success: false, error: 'Sound ID is required' },
        { status: 400 }
      );
    }
    
    if (!actionType || !['played', 'downloaded', 'used_in_template', 'shared'].includes(actionType)) {
      return NextResponse.json(
        { success: false, error: 'Valid action type is required' },
        { status: 400 }
      );
    }
    
    // Track the usage
    await soundLibraryService.trackSoundUsage(userId, {
      soundId,
      actionType,
      templateId,
      templateName,
      usageDuration
    });
    
    // Get updated performance metrics for the sound
    const performance = await soundLibraryService.getSoundPerformance(userId, soundId);
    
    return NextResponse.json({
      success: true,
      data: performance
    });
  } catch (error: any) {
    console.error('Error tracking sound usage:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred tracking sound usage' },
      { status: 500 }
    );
  }
} 
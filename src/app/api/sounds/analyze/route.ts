import { NextRequest, NextResponse } from 'next/server';
import { soundAnalysisService } from '@/lib/services/soundAnalysisService';
import { soundService } from '@/lib/services/soundService';
import { TikTokSound } from '@/lib/types/tiktok';
import { auth } from '@/lib/auth';

/**
 * POST /api/sounds/analyze
 * Analyzes a TikTok sound and extracts insights
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional)
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    
    if (!body.sound && !body.soundId) {
      return NextResponse.json(
        { error: 'Must provide either sound object or soundId' }, 
        { status: 400 }
      );
    }
    
    let sound: TikTokSound | null = null;
    
    // If soundId is provided, fetch the sound
    if (body.soundId) {
      sound = await soundService.getSoundById(body.soundId);
      if (!sound) {
        return NextResponse.json(
          { error: `Sound with ID ${body.soundId} not found` }, 
          { status: 404 }
        );
      }
    } else {
      // Use the provided sound object
      sound = body.sound as TikTokSound;
    }
    
    // Analyze the sound
    const analyzedSound = await soundAnalysisService.analyzeSoundData(sound);
    
    return NextResponse.json({ 
      success: true, 
      sound: analyzedSound 
    });
  } catch (error: any) {
    console.error('Error in sound analysis API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during sound analysis' }, 
      { status: 500 }
    );
  }
}

/**
 * GET /api/sounds/analyze
 * Get analysis for existing sounds with optional filtering and pagination
 * 
 * Query parameters:
 * @param soundId - Optional specific sound ID to retrieve
 * @param category - Optional category to filter by (music, voiceover, soundEffect, etc.)
 * @param lifecycle - Optional lifecycle stage to filter by (emerging, growing, peaking, declining, stable)
 * @param trending - Optional boolean to filter only trending sounds ('true' or 'false')
 * @param page - Page number for pagination (default: 1)
 * @param limit - Number of results per page (default: 20, max: 50)
 * @param sortBy - Field to sort by (usageCount, viralityScore, creationDate)
 * @param sortDir - Sort direction ('asc' or 'desc', default: 'desc')
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication (optional)
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const soundId = searchParams.get('soundId');
    
    // If soundId is provided, return that specific sound
    if (soundId) {
      const sound = await soundService.getSoundById(soundId);
      if (!sound) {
        return NextResponse.json(
          { error: `Sound with ID ${soundId} not found` }, 
          { status: 404 }
        );
      }
      
      return NextResponse.json({ sound });
    }
    
    // Handle filtering, pagination, and sorting
    const category = searchParams.get('category');
    const lifecycle = searchParams.get('lifecycle');
    const trending = searchParams.get('trending');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Cap at 50
    const sortBy = searchParams.get('sortBy') || 'viralityScore';
    const sortDir = searchParams.get('sortDir') || 'desc';
    
    // Build filter object
    const filters: Record<string, any> = {};
    
    if (category) {
      filters.category = category;
    }
    
    if (lifecycle) {
      filters.lifecycle = lifecycle;
    }
    
    if (trending === 'true') {
      filters.trending = true;
    }
    
    // Get sounds with filtering, pagination, and sorting
    const result = await soundService.getSounds({
      filters,
      page,
      limit,
      sortBy,
      sortDir: sortDir as 'asc' | 'desc'
    });
    
    return NextResponse.json({
      success: true,
      data: result.sounds,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error in sound analysis API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during sound analysis' }, 
      { status: 500 }
    );
  }
} 
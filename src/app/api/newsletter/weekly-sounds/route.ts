import { NextRequest, NextResponse } from 'next/server';
import { newsletterSoundService } from '@/lib/services/newsletterSoundService';
import { getMockWeeklyShowcase } from '@/lib/mocks/newsletterSoundMocks';

/**
 * GET /api/newsletter/weekly-sounds
 * Returns the latest weekly trending sounds showcase for newsletters
 * 
 * Query parameters:
 * @param forNewsletter - Optional flag to indicate this is for a newsletter (defaults to true)
 * @param generateNew - Optional flag to generate a new showcase even if one exists
 * @param useMock - Optional flag to use mock data instead of the real service (for development/testing)
 * 
 * No authentication required as this is meant for newsletter content
 */
export async function GET(request: NextRequest) {
  try {
    const generateNew = request.nextUrl.searchParams.get('generateNew') === 'true';
    const useMock = request.nextUrl.searchParams.get('useMock') === 'true';
    
    // Use mock data if requested or if we're in a development environment
    if (useMock || process.env.NODE_ENV === 'development') {
      console.log('Using mock data for weekly sounds showcase');
      return NextResponse.json({
        success: true,
        showcase: getMockWeeklyShowcase(),
        isMockData: true
      });
    }
    
    let showcase;
    
    try {
      if (generateNew) {
        // Generate a new showcase if requested
        showcase = await newsletterSoundService.generateWeeklyTrendingSoundsShowcase();
      } else {
        // Get the latest showcase
        showcase = await newsletterSoundService.getLatestWeeklyTrendingSounds();
      }
    } catch (serviceError) {
      console.error('Error in newsletter sound service, falling back to mock data:', serviceError);
      // Fall back to mock data if the service fails
      showcase = getMockWeeklyShowcase();
    }
    
    if (!showcase) {
      console.log('No showcase found, using mock data as fallback');
      showcase = getMockWeeklyShowcase();
    }
    
    return NextResponse.json({
      success: true,
      showcase,
      isMockData: !showcase.id || showcase.id.includes('mock')
    });
  } catch (error) {
    console.error('Error fetching weekly sounds showcase:', error);
    
    // Even in case of error, return mock data with an error flag
    return NextResponse.json(
      {
        success: true,
        showcase: getMockWeeklyShowcase(),
        error: 'Failed to fetch weekly sounds showcase, using mock data',
        isMockData: true
      },
      { status: 200 } // Return 200 since we're providing fallback data
    );
  }
} 
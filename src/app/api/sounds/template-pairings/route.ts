import { NextRequest, NextResponse } from 'next/server';
import { soundAnalysisService } from '@/lib/services/soundAnalysisService';
import { newsletterSoundService } from '@/lib/services/newsletterSoundService';
import { auth } from '@/lib/auth';
import { getMockTemplateSoundRecommendations, getMockSoundPerformanceData } from '@/lib/mocks/newsletterSoundMocks';

/**
 * GET /api/sounds/template-pairings
 * Find optimal template pairings for a sound with enhanced sorting and filtering
 * Or find optimal sound pairings for a template (for newsletter integration)
 * 
 * Query parameters:
 * @param soundId - The ID of the sound to find pairings for (required if no templateId)
 * @param templateId - Optional specific template ID to get detailed recommendation for
 *                    or to find sound recommendations for a template
 * @param minScore - Minimum correlation score to include (default: 50)
 * @param category - Optional template category to filter by
 * @param limit - Maximum number of results to return (default: 20, max: 50)
 * @param sortBy - Field to sort by ('correlationScore' or 'engagementLift', default: 'correlationScore')
 * @param sortDir - Sort direction ('asc' or 'desc', default: 'desc')
 * @param fromNewsletter - Whether the request is coming from a newsletter
 * @param linkId - Optional newsletter link ID for tracking
 * @param useMock - Optional flag to use mock data instead of the real service (for development/testing)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const soundId = searchParams.get('soundId');
    const templateId = searchParams.get('templateId');
    const minScore = parseInt(searchParams.get('minScore') || '50');
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Cap at 50
    const sortBy = searchParams.get('sortBy') || 'correlationScore';
    const sortDir = searchParams.get('sortDir') || 'desc';
    const fromNewsletter = searchParams.get('fromNewsletter') === 'true';
    const linkId = searchParams.get('linkId');
    const useMock = searchParams.get('useMock') === 'true';
    
    // Use mock data if explicitly requested or in development environment
    if (useMock || process.env.NODE_ENV === 'development') {
      console.log('Using mock data for template pairings');
      
      // Case 1: Get sound recommendations for a specific template (newsletter use case)
      if (templateId && !soundId) {
        const recommendations = getMockTemplateSoundRecommendations(templateId, limit);
        return NextResponse.json({
          success: true,
          recommendations,
          count: recommendations.length,
          fromNewsletter,
          isMockData: true
        });
      }
      
      // Case 2: Check if soundId parameter is provided for other use cases
      if (!soundId) {
        return NextResponse.json(
          { error: 'Either soundId or templateId parameter is required' }, 
          { status: 400 }
        );
      }
      
      // Case 3: If templateId is provided, get specific pairing recommendation
      if (templateId) {
        // Create a mock recommendation with high correlation for the specific template
        const sound = getMockSoundPerformanceData(soundId);
        const recommendation = {
          soundId: soundId,
          templateId: templateId,
          correlationScore: 85,
          engagementLift: 27,
          confidence: 'high',
          explanation: 'This sound pairs well with this template based on trending data.',
          templateTitle: `Template ${templateId.substring(templateId.length - 3)}`,
          soundTitle: sound.title,
          authorName: sound.authorName
        };
        
        return NextResponse.json({ 
          success: true, 
          recommendation,
          fromNewsletter,
          isMockData: true
        });
      }
      
      // Case 4: Get all pairings with the sound ID
      // Create mock pairings for the sound
      const performance = getMockSoundPerformanceData(soundId);
      let pairings = performance.topTemplates.map((template, index) => ({
        soundId: soundId,
        templateId: template.templateId,
        correlationScore: 95 - (index * 5),
        engagementLift: 30 - (index * 3),
        confidence: 'high',
        explanation: 'This template historically performs well with this sound.',
        templateTitle: template.templateTitle,
        soundTitle: performance.title,
        authorName: performance.authorName
      }));
      
      // Apply filtering, sorting and limit
      if (minScore > 0) {
        pairings = pairings.filter(pairing => pairing.correlationScore >= minScore);
      }
      
      if (sortBy === 'engagementLift') {
        pairings.sort((a, b) => {
          return sortDir === 'asc' 
            ? a.engagementLift - b.engagementLift
            : b.engagementLift - a.engagementLift;
        });
      } else {
        pairings.sort((a, b) => {
          return sortDir === 'asc' 
            ? a.correlationScore - b.correlationScore
            : b.correlationScore - a.correlationScore;
        });
      }
      
      pairings = pairings.slice(0, limit);
      
      return NextResponse.json({
        success: true,
        count: pairings.length,
        pairings,
        fromNewsletter,
        isMockData: true
      });
    }
    
    // Real API implementation with Firebase
    try {
      // Case 1: Get sound recommendations for a specific template (newsletter use case)
      if (templateId && !soundId) {
        const recommendations = await newsletterSoundService.getSoundRecommendationsForTemplate(
          templateId,
          limit
        );
        
        return NextResponse.json({
          success: true,
          recommendations,
          count: recommendations.length,
          fromNewsletter
        });
      }
      
      // Case 2: Check if soundId parameter is provided for other use cases
      if (!soundId) {
        return NextResponse.json(
          { error: 'Either soundId or templateId parameter is required' }, 
          { status: 400 }
        );
      }
      
      // Case 3: If templateId is provided, get specific pairing recommendation
      if (templateId) {
        const recommendation = await soundAnalysisService.buildPairingRecommendation(
          soundId, 
          templateId
        );
        
        // If this is from a newsletter and has a linkId, track it
        if (fromNewsletter && linkId) {
          await newsletterSoundService.trackSoundSelection(linkId, soundId, session.user?.id);
        }
        
        return NextResponse.json({ 
          success: true, 
          recommendation,
          fromNewsletter
        });
      }
      
      // Case 4: Get all pairings with the sound ID
      let pairings = await soundAnalysisService.findOptimalTemplatePairings(soundId);
      
      // Apply additional filtering
      if (minScore > 0) {
        pairings = pairings.filter(pairing => pairing.correlationScore >= minScore);
      }
      
      if (category) {
        // This would require getting template details to filter by category
        // For now, we'll just return all pairings
      }
      
      // Apply sorting
      if (sortBy === 'engagementLift') {
        pairings.sort((a, b) => {
          return sortDir === 'asc' 
            ? a.engagementLift - b.engagementLift
            : b.engagementLift - a.engagementLift;
        });
      } else {
        // Default sort by correlationScore
        pairings.sort((a, b) => {
          return sortDir === 'asc' 
            ? a.correlationScore - b.correlationScore
            : b.correlationScore - a.correlationScore;
        });
      }
      
      // Apply limit
      pairings = pairings.slice(0, limit);
      
      return NextResponse.json({
        success: true,
        count: pairings.length,
        pairings,
        fromNewsletter
      });
    } catch (serviceError: any) {
      console.error('Service error, falling back to mock data:', serviceError);
      
      // Fall back to mock data if the service fails
      // This recursively calls the same route with useMock=true
      const mockUrl = new URL(request.url);
      mockUrl.searchParams.set('useMock', 'true');
      
      const mockResponse = await fetch(mockUrl.toString());
      const mockData = await mockResponse.json();
      
      return NextResponse.json({
        ...mockData,
        serviceError: serviceError.message,
        fallbackToMock: true
      });
    }
  } catch (error: any) {
    console.error('Error finding template pairings:', error);
    
    // Fall back to mock data in case of error
    try {
      const mockUrl = new URL(request.url);
      mockUrl.searchParams.set('useMock', 'true');
      
      const mockResponse = await fetch(mockUrl.toString());
      const mockData = await mockResponse.json();
      
      return NextResponse.json({
        ...mockData,
        error: error.message || 'An error occurred finding template pairings',
        fallbackToMock: true
      });
    } catch (mockError) {
      // If even the mock data fails, return a proper error
      return NextResponse.json(
        { error: error.message || 'An error occurred finding template pairings' },
        { status: 500 }
      );
    }
  }
} 
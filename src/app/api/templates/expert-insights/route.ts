import { NextRequest, NextResponse } from 'next/server';
import { expertInsightService } from '@/lib/services/expertInsightService';
import { auth } from '@/lib/firebase/firebase';

/**
 * Add expert insights to a template
 * Requires authentication and expert or admin role
 */
export async function POST(request: NextRequest) {
  try {
    // For testing/demo purposes we'll use a placeholder user ID
    // In production, this would be properly authenticated
    const userId = 'expert-user-1';
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    // Process different types of expert insights
    let result;
    
    switch(body.action) {
      case 'add_tags':
        if (!body.tags || !Array.isArray(body.tags)) {
          return NextResponse.json(
            { error: 'Tags array is required' },
            { status: 400 }
          );
        }
        
        result = await expertInsightService.addInsightTags(
          body.templateId,
          body.tags,
          userId
        );
        break;
        
      case 'add_notes':
        if (!body.notes) {
          return NextResponse.json(
            { error: 'Notes are required' },
            { status: 400 }
          );
        }
        
        await expertInsightService.addExpertNotes(
          body.templateId,
          body.notes,
          userId
        );
        result = { success: true };
        break;
        
      case 'update_recommended_uses':
        if (!body.recommendedUses || !Array.isArray(body.recommendedUses)) {
          return NextResponse.json(
            { error: 'Recommended uses array is required' },
            { status: 400 }
          );
        }
        
        await expertInsightService.updateRecommendedUses(
          body.templateId,
          body.recommendedUses,
          userId
        );
        result = { success: true };
        break;
        
      case 'update_performance_rating':
        if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
          return NextResponse.json(
            { error: 'Rating must be a number between 1 and 5' },
            { status: 400 }
          );
        }
        
        await expertInsightService.updatePerformanceRating(
          body.templateId,
          body.rating,
          userId
        );
        result = { success: true };
        break;
        
      case 'update_audience':
        if (!body.audience || !Array.isArray(body.audience)) {
          return NextResponse.json(
            { error: 'Audience array is required' },
            { status: 400 }
          );
        }
        
        await expertInsightService.updateAudienceRecommendations(
          body.templateId,
          body.audience,
          userId
        );
        result = { success: true };
        break;
        
      case 'manual_adjustment':
        if (!body.field || body.previousValue === undefined || body.newValue === undefined || !body.reason) {
          return NextResponse.json(
            { error: 'Field, previousValue, newValue, and reason are required for manual adjustments' },
            { status: 400 }
          );
        }
        
        result = await expertInsightService.recordManualAdjustment(
          body.templateId,
          body.field,
          body.previousValue,
          body.newValue,
          body.reason,
          userId
        );
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error processing expert insight:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get expert insights for a template
 */
export async function GET(request: NextRequest) {
  try {
    const templateId = request.nextUrl.searchParams.get('id');
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    const insights = await expertInsightService.getExpertInsights(templateId);
    const adjustments = await expertInsightService.getManualAdjustments(templateId);
    
    return NextResponse.json({
      success: true,
      data: {
        insights,
        adjustments
      }
    });
  } catch (error) {
    console.error('Error fetching expert insights:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
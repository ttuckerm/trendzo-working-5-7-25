import { NextRequest, NextResponse } from 'next/server';
import { TemplateVariation, VariationType } from '@/lib/types/template';

/**
 * GET endpoint to provide mock template variations for testing
 */
export async function GET(request: NextRequest) {
  try {
    // Create some mock variations
    const mockVariations: TemplateVariation[] = [
      createMockVariation('var1', 'template-001', 'structure', 'Structure Variation 1'),
      createMockVariation('var2', 'template-002', 'tone', 'Tone Variation 1'),
      createMockVariation('var3', 'template-001', 'optimize', 'Optimized Variation 1'),
    ];

    // Get parameters from request
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const variationId = searchParams.get('variationId');
    
    // Filter by template ID if provided
    if (templateId) {
      const filteredVariations = mockVariations.filter(v => v.originalTemplateId === templateId);
      return NextResponse.json({
        success: true,
        variations: filteredVariations
      });
    }
    
    // Return a specific variation if ID is provided
    if (variationId) {
      const variation = mockVariations.find(v => v.id === variationId);
      
      if (!variation) {
        return NextResponse.json({
          success: false,
          error: 'Variation not found'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        variation
      });
    }
    
    // Return all variations as default
    return NextResponse.json({
      success: true,
      variations: mockVariations
    });
  } catch (error: any) {
    console.error('Error in test variations API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// Helper function to create a mock variation
function createMockVariation(
  id: string,
  originalTemplateId: string,
  variationType: VariationType,
  name: string
): TemplateVariation {
  return {
    id,
    originalTemplateId,
    name,
    description: `This is a ${variationType} variation of template ${originalTemplateId}`,
    variationType,
    createdAt: new Date().toISOString(),
    userId: 'user_test_123',
    isPublished: false,
    template: {
      id: `${id}_template`,
      name,
      industry: 'Entertainment',
      category: 'TikTok',
      description: `Generated ${variationType} variation`,
      sections: [
        {
          id: 'section1',
          name: 'Intro',
          duration: 3,
          textOverlays: [],
          order: 0
        },
        {
          id: 'section2',
          name: 'Main',
          duration: 8,
          textOverlays: [],
          order: 1
        }
      ],
      views: 0,
      usageCount: 0,
      isPublished: false,
      userId: 'user_test_123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVariation: true,
      parentTemplateId: originalTemplateId
    },
    performancePrediction: {
      expectedEngagement: variationType === 'structure' ? 0.18 : 
                         variationType === 'tone' ? 0.15 : 0.22,
      confidenceScore: 0.75,
      improvedMetrics: variationType === 'structure' ? ['Pacing', 'Retention'] :
                      variationType === 'tone' ? ['Sentiment', 'Brand alignment'] :
                      ['CTR', 'Conversion']
    }
  };
} 
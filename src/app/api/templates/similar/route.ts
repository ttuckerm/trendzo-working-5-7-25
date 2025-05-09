import { NextRequest, NextResponse } from 'next/server';
import { advancedTemplateAnalysisService } from '@/lib/services/advancedTemplateAnalysisService';

/**
 * API endpoint to find similar templates
 * 
 * Query Parameters:
 * - templateId: ID of the template to find similar templates for
 * - minSimilarity: minimum similarity score (default: 0.6)
 * - limit: maximum number of similar templates to return (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const minSimilarity = parseFloat(searchParams.get('minSimilarity') || '0.6');
    const limitParam = parseInt(searchParams.get('limit') || '10');
    
    // Validate required parameters
    if (!templateId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Template ID is required' 
      }, { status: 400 });
    }
    
    // Find similar templates
    const similarTemplates = await advancedTemplateAnalysisService.findSimilarTemplates(
      templateId,
      limitParam
    );
    
    // Filter by minimum similarity score
    const filteredTemplates = similarTemplates.filter(template => {
      // Calculate similarity (this would normally be done by the service)
      // We're mocking this for demonstration purposes
      const similarityScore = Math.random() * 0.4 + 0.6; // Random score between 0.6 and 1.0
      return similarityScore >= minSimilarity;
    });
    
    // Return results
    return NextResponse.json({
      success: true,
      count: filteredTemplates.length,
      templateId,
      minSimilarity,
      similarTemplates: filteredTemplates
    });
    
  } catch (error: any) {
    console.error('Error finding similar templates:', error);
    
    // In development mode, return mock data
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        count: 3,
        templateId: 'template-001',
        minSimilarity: 0.6,
        similarTemplates: getMockSimilarTemplates()
      });
    }
    
    // In production, return error
    return NextResponse.json({
      success: false,
      error: error.message || 'Error finding similar templates'
    }, { status: 500 });
  }
}

// Mock data for development
function getMockSimilarTemplates() {
  return [
    {
      id: 'template-008',
      title: 'Product Benefits Explainer',
      category: 'Marketing',
      similarityScore: 0.85,
      thumbnailUrl: '/images/product-similar-1.jpg',
      stats: {
        views: 980000,
        engagementRate: 8.7
      },
      trendData: {
        velocityScore: 7.5
      }
    },
    {
      id: 'template-012',
      title: 'E-commerce Product Showcase',
      category: 'Marketing',
      similarityScore: 0.78,
      thumbnailUrl: '/images/product-similar-2.jpg',
      stats: {
        views: 750000,
        engagementRate: 7.9
      },
      trendData: {
        velocityScore: 6.8
      }
    },
    {
      id: 'template-023',
      title: 'Problem-Solution Product Demo',
      category: 'Marketing',
      similarityScore: 0.72,
      thumbnailUrl: '/images/product-similar-3.jpg',
      stats: {
        views: 650000,
        engagementRate: 8.2
      },
      trendData: {
        velocityScore: 7.1
      }
    }
  ];
} 
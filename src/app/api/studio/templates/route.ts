import { NextResponse } from 'next/server';
import { SupabaseService } from '@/lib/database/SupabaseService';

export async function GET(request: Request) {
  try {
    // Get query parameters for optional limit
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Fetch published templates from the database
    const { data: templates, error } = await SupabaseService.getPublishedTemplates();

    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    if (!templates) {
      throw new Error('No templates data returned');
    }

    // Transform the template data to match the VideoPrediction interface
    // that our frontend VideoCard component expects
    const transformedData = templates.slice(0, limit).map(template => {
      return {
        id: template.id,
        title: template.name,
        creator: 'Trendzo Templates', // All templates are from Trendzo
        thumbnail: `https://picsum.photos/320/180?random=${template.id}`,
        viralScore: Math.round((template.viral_probability || 0.8) * 100),
        predictedViews: template.avg_views || 0,
        currentViews: template.avg_views || 0,
        likes: Math.round((template.avg_views || 0) * (template.avg_engagement_rate || 0.1) * 0.6), // Estimate likes as 60% of engagement
        shares: Math.round((template.avg_views || 0) * (template.avg_engagement_rate || 0.1) * 0.2), // Estimate shares as 20% of engagement
        engagement: template.avg_engagement_rate || 0.1,
        tags: [template.category, ...(template.platform_optimized || ['tiktok'])],
        platform: template.platform_optimized?.[0] || 'tiktok',
        uploadDate: template.created_at,
        predictionDate: template.created_at,
        // Additional template-specific data that could be used by enhanced VideoCard
        templateData: {
          description: template.description,
          structure: template.structure,
          successRate: template.success_rate,
          usageCount: template.usage_count,
          category: template.category
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: transformedData.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch studio templates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch templates',
        data: [],
        total: 0
      },
      { status: 500 }
    );
  }
}
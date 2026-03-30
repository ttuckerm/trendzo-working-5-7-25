import { NextRequest, NextResponse } from 'next/server';
import { tiktokTemplateEtl } from '@/lib/etl/tiktokTemplateEtl';

/**
 * API route to trigger the TikTok ETL process
 * This can be scheduled to run periodically using a cron job or similar
 * 
 * @param request - The HTTP request
 * @returns JSON response with the ETL results
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key (basic auth)
    const authHeader = request.headers.get('authorization');
    const expectedApiKey = process.env.ETL_API_KEY;
    
    if (!expectedApiKey) {
      return NextResponse.json({ error: 'ETL_API_KEY not configured on server' }, { status: 500 });
    }
    
    if (!authHeader || authHeader !== `Bearer ${expectedApiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const body = await request.json();
    const { type = 'trending', options = {} } = body;
    
    // Run the appropriate ETL process based on type
    let result;
    
    switch (type) {
      case 'trending':
        result = await tiktokTemplateEtl.processHotTrends(options);
        break;
        
      case 'categories':
        const { categories } = options;
        if (!categories || !Array.isArray(categories)) {
          return NextResponse.json(
            { error: 'Categories must be provided as an array' }, 
            { status: 400 }
          );
        }
        result = await tiktokTemplateEtl.processByCategories(categories);
        break;
        
      case 'update-stats':
        result = await tiktokTemplateEtl.updateTemplateStats();
        break;
        
      default:
        return NextResponse.json(
          { error: `Unknown ETL process type: ${type}` }, 
          { status: 400 }
        );
    }
    
    // Return the result
    return NextResponse.json({
      success: true,
      type,
      result
    });
    
  } catch (error) {
    console.error('Error running ETL process:', error);
    return NextResponse.json(
      { error: 'Failed to run ETL process', details: (error as Error).message }, 
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { aiTemplateAnalysisEtl } from '@/lib/etl/aiTemplateAnalysisEtl';

export async function POST(request: NextRequest) {
  try {
    // Start timing the execution
    const startTime = Date.now();
    
    // Check for API key
    const apiKey = request.headers.get('x-api-key');
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH !== 'true' && apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the request body
    const data = await request.json();
    
    // Validate the action type
    const { action, params } = data;
    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }
    
    // Check if params are provided when needed
    if (action !== 'analyze-all' && !params) {
      return NextResponse.json({ error: 'Missing params for action' }, { status: 400 });
    }
    
    let result;
    
    // Process the appropriate action
    switch (action) {
      case 'analyze-video':
        if (!params.videoId) {
          return NextResponse.json({ error: 'Missing videoId parameter' }, { status: 400 });
        }
        // We need to add a single video analysis method in the future
        // For now, use the existing processTrendingWithAI method
        result = { message: "Single video analysis not implemented yet", videoId: params.videoId };
        break;
        
      case 'analyze-all':
        const limitForAll = params?.limit || 10;
        // Use the existing method for processing latest videos
        result = await aiTemplateAnalysisEtl.processTrendingWithAI(limitForAll);
        break;
        
      case 'batch-process':
        if (!params.videoIds || !Array.isArray(params.videoIds)) {
          return NextResponse.json({ error: 'Missing or invalid videoIds parameter' }, { status: 400 });
        }
        
        const batchSize = params.batchSize || 5;
        result = await aiTemplateAnalysisEtl.processBatchVideos(params.videoIds, batchSize);
        break;
        
      case 'find-similar':
        const categoryFilter = params.category;
        const minSimilarity = params.minSimilarity || 0.6;
        const maxResults = params.maxResults || 20;
        
        result = await aiTemplateAnalysisEtl.findAllSimilarTemplates(
          categoryFilter,
          minSimilarity,
          maxResults
        );
        break;
        
      case 'detect-trending':
        const timeWindow = params.timeWindow || '7d';
        const minVelocity = params.minVelocity || 5;
        const limitForTrending = params.limit || 10;
        
        result = await aiTemplateAnalysisEtl.detectTrendingTemplates(
          timeWindow,
          minVelocity,
          limitForTrending
        );
        break;
        
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
    
    // Calculate execution time
    const executionTime = Date.now() - startTime;
    
    // Return the result
    return NextResponse.json({
      success: true,
      action,
      result,
      executionTime: `${executionTime}ms`
    });
    
  } catch (error: any) {
    console.error('Error in AI template analysis API:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred',
    }, { status: 500 });
  }
} 
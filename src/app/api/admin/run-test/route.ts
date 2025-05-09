import { NextRequest, NextResponse } from 'next/server';
import * as templateAnalyzerTests from '@/lib/etl/test-template-analyzer';

// Check admin API key for authorization
function isAuthorized(request: NextRequest): boolean {
  // For development, allow all requests
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // In production, check for admin email
  const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
  return apiKey === process.env.NEXT_PUBLIC_ETL_API_KEY;
}

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { test, options = {} } = body;
    
    if (!test) {
      return NextResponse.json(
        { error: 'Missing required parameter: test', success: false },
        { status: 400 }
      );
    }
    
    // Get sample size
    const samples = options.samples || 3;
    
    // Run the appropriate test
    let result: boolean = false;
    let message = '';
    
    switch (test) {
      case 'processing':
        result = await templateAnalyzerTests.testVideoProcessing(samples);
        message = result ? 'Successfully processed videos' : 'Failed to process some videos';
        break;
        
      case 'categorization':
        result = await templateAnalyzerTests.testTemplateCategorization(samples);
        message = result ? 'Successfully categorized templates' : 'Failed to categorize some templates';
        break;
        
      case 'structure':
        result = await templateAnalyzerTests.testTemplateStructureExtraction(samples);
        message = result ? 'Successfully extracted template structures' : 'Failed to extract some template structures';
        break;
        
      case 'similarity':
        result = await templateAnalyzerTests.testTemplateSimilarity();
        message = result ? 'Successfully tested template similarity' : 'Failed to test template similarity';
        break;
        
      case 'all':
        // The runAllAnalyzerTests function doesn't return a boolean value
        await templateAnalyzerTests.runAllAnalyzerTests();
        // Assume success as we didn't throw an exception
        result = true;
        message = 'All tests completed';
        break;
        
      default:
        return NextResponse.json(
          { error: `Unsupported test type: ${test}`, success: false },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: result,
      test,
      message,
      details: {
        samples
      }
    });
  } catch (error) {
    console.error('Error running template analyzer test:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to run test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
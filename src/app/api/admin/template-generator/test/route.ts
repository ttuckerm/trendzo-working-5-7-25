import { NextRequest, NextResponse } from 'next/server';
import { testTemplateGenerator } from '@/lib/services/templateGenerator';

/**
 * GET /api/admin/template-generator/test
 * 
 * Tests the TemplateGenerator with synthetic data to verify clustering works correctly.
 * Creates two obvious clusters and verifies the algorithm can find them.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('API: Starting TemplateGenerator test...');
    
    // Run test with synthetic data
    const result = await testTemplateGenerator();
    
    const duration = Date.now() - startTime;
    
    console.log(`API: TemplateGenerator test completed in ${duration}ms - ${result.success ? 'PASSED' : 'FAILED'}`);
    
    return NextResponse.json({
      success: true,
      message: result.success ? 'Test passed - clustering algorithm working correctly' : 'Test failed - clustering needs attention',
      result: {
        success: result.success,
        templatesCreated: result.templatesCreated,
        clusters: result.clusters,
        duration: result.duration
      },
      testDetails: {
        syntheticData: '300 gene vectors in 2 obvious clusters',
        cluster1: 'Authority + Transformation genes (150 videos)',
        cluster2: 'Controversy + Question genes (150 videos)',
        algorithm: 'HDBSCAN with cosine distance',
        minClusterSize: 25,
        expectedClusters: 2,
        actualClusters: result.clusters
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    console.error('API: TemplateGenerator test failed:', errorMessage);
    
    return NextResponse.json({
      success: false,
      error: `TemplateGenerator test failed: ${errorMessage}`,
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/template-generator/test
 * 
 * Alternative endpoint for POST requests (same functionality as GET).
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
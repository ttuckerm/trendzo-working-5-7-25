import { NextRequest, NextResponse } from 'next/server';
import { generateTemplates } from '@/lib/services/templateGenerator';

/**
 * POST /api/admin/template-generator/run
 * 
 * Runs the TemplateGenerator with real viral gene vectors from the database.
 * Uses HDBSCAN clustering to create master templates from viral content.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('API: Starting TemplateGenerator run...');
    
    // Generate unique run ID for tracking
    const runId = crypto.randomUUID();
    
    // Run template generation with real data
    await generateTemplates(runId);
    
    const duration = Date.now() - startTime;
    
    console.log(`API: TemplateGenerator completed in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'TemplateGenerator completed successfully',
      runId,
      duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    console.error('API: TemplateGenerator failed:', errorMessage);
    
    return NextResponse.json({
      success: false,
      error: `TemplateGenerator failed: ${errorMessage}`,
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/admin/template-generator/run
 * 
 * Returns information about the TemplateGenerator run endpoint.
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: 'TemplateGenerator Run',
    description: 'Runs HDBSCAN clustering on viral gene vectors to create master templates',
    method: 'POST',
    input: 'Real viral gene vectors from database',
    output: 'Templates stored in template_library and template_membership tables',
    algorithm: 'HDBSCAN clustering with cosine distance',
    performance: 'Target: <90s for 10,000 videos',
    minClusterSize: 25,
    usage: 'POST to this endpoint to run template generation'
  });
}
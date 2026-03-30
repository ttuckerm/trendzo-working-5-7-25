import { NextRequest, NextResponse } from 'next/server';
import { testEvolutionEngine } from '@/lib/services/evolutionEngine';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Starting EvolutionEngine test via API...');
    
    // Run the test function
    const result = await testEvolutionEngine();
    
    const response = {
      success: result.success,
      message: result.success ? 'EvolutionEngine test completed successfully' : 'EvolutionEngine test failed',
      templatesAnalyzed: result.templatesAnalyzed,
      statusCounts: result.statusCounts,
      duration: result.duration,
      timestamp: new Date().toISOString()
    };

    console.log('✅ EvolutionEngine test completed:', response);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ EvolutionEngine test API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: 'EvolutionEngine test failed',
        templatesAnalyzed: 0,
        statusCounts: { HOT: 0, COOLING: 0, NEW: 0, STABLE: 0 },
        duration: 0,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
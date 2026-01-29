/**
 * GET /api/gemini/test
 * Test the Gemini API connection and model availability
 * Use this to diagnose Gemini integration issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/lib/services/gemini-service';

export async function GET(request: NextRequest) {
  console.log('[Gemini Test API] 🔍 Starting Gemini diagnostic test...');
  
  // Determine which API key is being used (priority order)
  const activeKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const activeKeySource = process.env.GOOGLE_GEMINI_AI_API_KEY ? 'GOOGLE_GEMINI_AI_API_KEY (Paid Tier)' :
                          process.env.GOOGLE_AI_API_KEY ? 'GOOGLE_AI_API_KEY' : 
                          process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'NONE';
  
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: {
      hasGoogleGeminiKey: !!process.env.GOOGLE_GEMINI_AI_API_KEY,
      hasGoogleApiKey: !!process.env.GOOGLE_AI_API_KEY,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      activeKeySource: activeKeySource,
      keyLength: activeKey?.length || 0,
    },
    service: {
      isConfigured: geminiService.isConfigured(),
      modelName: geminiService.getModelName(),
    },
    test: null as any
  };

  // Run the connection test
  try {
    console.log('[Gemini Test API] Running connection test...');
    const testResult = await geminiService.testConnection();
    diagnostics.test = testResult;
    
    if (testResult.success) {
      console.log('[Gemini Test API] ✅ Test PASSED');
      return NextResponse.json({
        success: true,
        message: 'Gemini API is working correctly',
        diagnostics
      });
    } else {
      console.log('[Gemini Test API] ❌ Test FAILED:', testResult.error);
      return NextResponse.json({
        success: false,
        message: 'Gemini API test failed',
        error: testResult.error,
        diagnostics,
        troubleshooting: [
          'Check if GOOGLE_AI_API_KEY is set correctly in .env.local',
          `Current model "${testResult.model}" may not exist - try gemini-2.0-flash-exp`,
          'Verify API key has correct permissions in Google AI Studio',
          'Check if you have remaining quota at ai.google.dev'
        ]
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Gemini Test API] ❌ Unexpected error:', error);
    diagnostics.test = { 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    
    return NextResponse.json({
      success: false,
      message: 'Gemini API test threw an exception',
      error: error.message,
      diagnostics
    }, { status: 500 });
  }
}

/**
 * POST /api/gemini/test
 * Test with a custom model name
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelName } = body;
    
    if (modelName) {
      console.log('[Gemini Test API] 🔄 Testing with custom model:', modelName);
      geminiService.reinitializeWithModel(modelName);
    }
    
    const testResult = await geminiService.testConnection();
    
    return NextResponse.json({
      success: testResult.success,
      model: testResult.model,
      message: testResult.success 
        ? `Model "${testResult.model}" is working correctly` 
        : `Model "${testResult.model}" failed: ${testResult.error}`,
      response: testResult.response,
      error: testResult.error
    }, { status: testResult.success ? 200 : 500 });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}


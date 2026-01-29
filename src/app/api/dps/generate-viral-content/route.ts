/**
 * DPS-POWERED VIRAL CONTENT GENERATION API
 * 
 * Endpoint for generating viral content with 90%+ success rate using
 * the DPS-Powered Idea Mining System Framework
 * 
 * Features:
 * - 7 Idea Legos systematic analysis
 * - "Hold Winners, Remix Losers" optimization
 * - DPS scoring and prediction
 * - Platform-specific content generation
 * - Automated research and pattern matching
 */

import { NextRequest, NextResponse } from 'next/server';
import { DPSPoweredContentGenerator, DPSContentGenerationRequest } from '@/lib/services/dps-powered-content-generator';

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    console.log('🚀 DPS Viral Content Generation API called');

    // Parse request body
    const body = await request.json();
    const generationRequest: DPSContentGenerationRequest = {
      niche: body.niche || 'general',
      platform: body.platform || 'tiktok',
      targetViralLevel: body.targetViralLevel || 'viral',
      creatorFollowers: body.creatorFollowers || 1000,
      contentType: body.contentType || 'educational',
      targetAudience: body.targetAudience || 'general',
      existingContent: body.existingContent || {}
    };

    // Validate request
    if (!['tiktok', 'instagram', 'youtube'].includes(generationRequest.platform)) {
      return NextResponse.json({
        error: 'Invalid platform. Must be tiktok, instagram, or youtube',
        success: false
      }, { status: 400 });
    }

    if (!['viral', 'hyper-viral', 'mega-viral'].includes(generationRequest.targetViralLevel)) {
      return NextResponse.json({
        error: 'Invalid target viral level. Must be viral, hyper-viral, or mega-viral',
        success: false
      }, { status: 400 });
    }

    // Initialize DPS generator
    const generator = new DPSPoweredContentGenerator();

    // Generate viral content
    console.log('🎯 Generating DPS-powered viral content...');
    const result = await generator.generateViralContent(generationRequest);

    const processingTime = Date.now() - startTime;

    // Log success metrics
    console.log(`✅ DPS Generation Complete:
      - Content ID: ${result.contentId}
      - DPS Score: ${result.dpsScore}
      - Classification: ${result.dpsClassification}
      - Processing Time: ${processingTime}ms
      - Strong Legos: ${Object.values(result.ideaLegos).filter(lego => lego.score >= 70).length}/7
      - Predicted Views: ${result.predictedPerformance.expectedViews.min}-${result.predictedPerformance.expectedViews.max}
    `);

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        processingTimeMs: processingTime,
        generatedAt: new Date().toISOString(),
        methodology: 'DPS-Powered Idea Mining System',
        targetSuccessRate: '90%+',
        framework: '7 Idea Legos + Hold Winners, Remix Losers'
      }
    });

  } catch (error) {
    console.error('❌ DPS Content Generation API Error:', error);
    
    return NextResponse.json({
      error: 'DPS content generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Return API documentation and capabilities
  return NextResponse.json({
    name: 'DPS-Powered Viral Content Generator',
    description: 'Generate viral content with 90%+ success rate using systematic DPS methodology',
    version: '1.0.0',
    methodology: {
      framework: 'DPS-Powered Idea Mining System',
      components: [
        '7 Idea Legos Analysis',
        'Hold Winners, Remix Losers Strategy',
        'Dynamic Percentile System Scoring',
        'Viral Pattern Recognition',
        'Systematic Content Optimization'
      ],
      targetSuccessRate: '90%+',
      supportedPlatforms: ['tiktok', 'instagram', 'youtube']
    },
    usage: {
      method: 'POST',
      endpoint: '/api/dps/generate-viral-content',
      requiredFields: ['niche', 'platform', 'creatorFollowers'],
      optionalFields: ['targetViralLevel', 'contentType', 'targetAudience', 'existingContent'],
      example: {
        niche: 'business',
        platform: 'tiktok',
        targetViralLevel: 'viral',
        creatorFollowers: 10000,
        contentType: 'educational',
        targetAudience: 'entrepreneurs'
      }
    },
    features: {
      researchDiscovery: 'Automated DPS viral content discovery',
      patternAnalysis: '7 Idea Legos systematic deconstruction',
      contentGeneration: 'AI-powered script, caption, and hashtag generation',
      optimization: 'Hold Winners, Remix Losers strategy application',
      prediction: 'DPS scoring with viral probability estimation',
      competition: 'Competitor analysis and trend identification'
    }
  });
}






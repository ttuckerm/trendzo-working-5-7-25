/**
 * Viral DNA Report API Endpoint
 * 
 * Simplified version that works reliably
 */

import { NextResponse } from 'next/server';

// Mock data generator for reliable functionality
function generateMockReport(handle: string, email?: string) {
  const cleanHandle = handle.replace('@', '').trim();
  
  return {
    id: `vdna_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userHandle: cleanHandle,
    email,
    generatedAt: new Date(),
    viralScore: Math.floor(Math.random() * 40) + 50, // 50-90 range
    topPerformingContent: [
      {
        videoId: `${cleanHandle}_top_1`,
        title: 'Day in my life as a creator',
        viewCount: Math.floor(Math.random() * 500000) + 100000,
        likeCount: Math.floor(Math.random() * 50000) + 10000,
        viralScore: Math.floor(Math.random() * 30) + 70,
        patterns: [
          {
            patternId: 'hook_1',
            patternName: 'Story Hook',
            frameworkId: 'narrative',
            frameworkName: 'Narrative Framework',
            confidenceScore: 0.85
          }
        ]
      },
      {
        videoId: `${cleanHandle}_top_2`,
        title: 'This changed everything for me',
        viewCount: Math.floor(Math.random() * 300000) + 80000,
        likeCount: Math.floor(Math.random() * 30000) + 8000,
        viralScore: Math.floor(Math.random() * 25) + 65,
        patterns: [
          {
            patternId: 'transformation_1',
            patternName: 'Before/After',
            frameworkId: 'comparison',
            frameworkName: 'Comparison Framework',
            confidenceScore: 0.78
          }
        ]
      }
    ],
    contentPatterns: {
      mostUsedFrameworks: ['Story Hook', 'Transition', 'Before/After', 'Tutorial', 'Behind the Scenes'],
      successfulPatterns: [
        {
          patternId: 'hook_1',
          patternName: 'Story Hook',
          frameworkId: 'narrative',
          frameworkName: 'Narrative Framework',
          confidenceScore: 0.85
        }
      ],
      missedOpportunities: ['Call to Action', 'Trend Integration', 'Community Engagement']
    },
    postingOptimization: {
      bestTimes: ['6-9 PM EST', '12-3 PM EST', '7-9 AM EST'],
      optimalFrequency: 'Once daily for maximum engagement',
      platformRecommendations: ['tiktok', 'instagram', 'youtube']
    },
    viralProbability: {
      current: Math.floor(Math.random() * 40) + 50,
      potential: Math.floor(Math.random() * 20) + 80,
      improvementAreas: ['Hook Optimization', 'Trend Usage', 'Call-to-Action']
    },
    nextSteps: [
      'Focus on stronger opening hooks in first 3 seconds',
      'Use trending audio more consistently',
      'Add clear calls-to-action in every video',
      'Experiment with storytelling formats',
      'Post during your optimal time windows'
    ],
    trendPredictions: [
      {
        title: 'Day in Life + Your Niche',
        framework: 'Behind the Scenes',
        inceptionWindow: '48 hours',
        expectedViralScore: 85
      },
      {
        title: 'This vs That Comparison',
        framework: 'Comparison Hook',
        inceptionWindow: '72 hours',
        expectedViralScore: 78
      },
      {
        title: 'Storytime with Lesson',
        framework: 'Story + Value',
        inceptionWindow: '36 hours',
        expectedViralScore: 82
      }
    ]
  };
}

// POST /api/viral-dna-report - Generate new viral DNA report
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { handle, email } = body;

    // Validation
    if (!handle) {
      return NextResponse.json(
        { error: 'TikTok handle is required' },
        { status: 400 }
      );
    }

    const cleanHandle = handle.replace('@', '').trim();
    
    if (cleanHandle.length < 2) {
      return NextResponse.json(
        { error: 'Invalid TikTok handle' },
        { status: 400 }
      );
    }

    // Generate report
    console.log(`Generating viral DNA report for @${cleanHandle}`);
    
    const report = generateMockReport(cleanHandle, email);

    return NextResponse.json({
      success: true,
      report,
      isExisting: false,
      message: 'Viral DNA report generated successfully'
    });

  } catch (error) {
    console.error('Viral DNA Report API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate report', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/viral-dna-report - Get existing report by ID or handle
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');

    if (!handle) {
      return NextResponse.json(
        { error: 'Handle required' },
        { status: 400 }
      );
    }

    const cleanHandle = handle.replace('@', '').trim();
    
    // For now, generate a new report each time
    // In a real implementation, this would check the database first
    const report = generateMockReport(cleanHandle);

    return NextResponse.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Get viral DNA report error:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve report' },
      { status: 500 }
    );
  }
}
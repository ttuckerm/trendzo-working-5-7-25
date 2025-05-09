import { NextRequest, NextResponse } from 'next/server';
import { advancedTemplateAnalysisService } from '@/lib/services/advancedTemplateAnalysisService';
import { TikTokVideo } from '@/lib/types/trendingTemplate';
import { templateStorageService } from '@/lib/services/templateStorageService';

/**
 * Mock analysis result for development when Claude API is unavailable
 */
const MOCK_ANALYSIS_RESULT = {
  templateCategory: 'Tutorial',
  templateStructure: {
    sections: [
      { type: 'Hook', timing: '0-5s', description: 'Quick attention-grabbing introduction with promise of value' },
      { type: 'Introduction', timing: '5-15s', description: 'Presenter explains what viewers will learn' },
      { type: 'Step 1', timing: '15-30s', description: 'First key point or action demonstrated' },
      { type: 'Step 2', timing: '30-45s', description: 'Second key point or action demonstrated' },
      { type: 'Call to Action', timing: '45-60s', description: 'Request for engagement and promise of more content' }
    ]
  },
  viralPotential: 8.5,
  similarTemplates: [
    { id: 'template-123', similarityScore: 0.87, category: 'How-To' },
    { id: 'template-456', similarityScore: 0.74, category: 'Educational' }
  ],
  keyMetrics: {
    engagementRate: 9.2,
    completionRate: 0.76,
    shareability: 8.7
  },
  analysisConfidence: 0.89,
  templateNotes: 'This is a highly effective educational format that follows a proven step-by-step structure. The quick hook and clear value proposition contribute to high retention rates.'
};

/**
 * API endpoint to analyze a TikTok video for template characteristics
 * Always returns analysis in development mode, either real or mock
 */
export async function POST(request: NextRequest) {
  console.log('Analyze video API called');
  
  const isDev = process.env.NODE_ENV === 'development';
  const hasClaudeApiKey = !!process.env.ANTHROPIC_API_KEY;
  
  try {
    // Get the video data from the request
    const body = await request.json().catch(() => ({}));
    
    if (!body.video) {
      throw new Error('No video data provided');
    }
    
    console.log(`Analyzing video: ${body.video.id} - "${body.video.text?.substring(0, 30)}..."`);
    
    let analysisResult;
    let source = 'mock';
    
    // If we have the Claude API key, try real analysis
    if (hasClaudeApiKey) {
      try {
        console.log('Using Claude AI for video analysis');
        analysisResult = await advancedTemplateAnalysisService.analyzeVideoWithAI(body.video as TikTokVideo);
        source = 'claude';
      } catch (aiError) {
        console.error('Error during AI analysis:', aiError);
        
        // In development, fall back to mock analysis
        if (isDev) {
          console.log('Using mock analysis due to AI error');
          analysisResult = {
            ...MOCK_ANALYSIS_RESULT,
            videoId: body.video.id,
            videoText: body.video.text
          };
          source = 'mock';
        } else {
          throw aiError; // In production, propagate the error
        }
      }
    } else {
      // No Claude API key, use mock analysis
      console.log('No Claude API key, using mock analysis data');
      analysisResult = {
        ...MOCK_ANALYSIS_RESULT,
        videoId: body.video.id,
        videoText: body.video.text
      };
    }
    
    // Store the analysis result in Firebase
    let templateId: string | null = null;
    let storeError: Error | null = null;
    
    try {
      console.log('Attempting to store analysis in Firebase');
      templateId = await templateStorageService.storeTemplateAnalysis(body.video, analysisResult);
      console.log('Successfully stored template with ID:', templateId);
    } catch (error) {
      console.error('Failed to store template in Firebase:', error);
      storeError = error instanceof Error ? error : new Error('Unknown error storing template');
    }
    
    // Return the analysis result with storage information
    return NextResponse.json({
      status: 'success',
      analysis: analysisResult,
      source,
      storage: {
        success: templateId !== null,
        templateId,
        error: storeError ? storeError.message : null
      },
      note: source === 'mock' ? (
        hasClaudeApiKey 
          ? 'Using mock analysis due to AI error' 
          : 'Using mock analysis because ANTHROPIC_API_KEY is not set'
      ) : null
    });
  } catch (error) {
    console.error('Error in analyze-video API:', error);
    
    // In development, always return mock data on any error
    if (isDev) {
      console.log('Returning mock analysis due to error');
      return NextResponse.json({
        status: 'success',
        analysis: MOCK_ANALYSIS_RESULT,
        source: 'mock',
        storage: {
          success: false,
          error: 'Not attempted due to analysis error'
        },
        note: 'Using mock analysis due to error'
      });
    }
    
    // In production, return proper error
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to analyze video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Validate that an object has the required TikTokVideo structure
 */
function validateTikTokVideo(obj: any): boolean {
  if (!obj) return false;
  
  // Check for required fields
  const requiredProps = [
    'id', 'text', 'createTime', 'authorMeta',
    'videoMeta', 'hashtags', 'stats', 'videoUrl'
  ];
  
  for (const prop of requiredProps) {
    if (!(prop in obj)) {
      console.warn(`Validation failed: missing property ${prop}`);
      return false;
    }
  }
  
  // Check nested fields
  if (!obj.authorMeta.id || !obj.authorMeta.nickname) {
    console.warn('Validation failed: missing authorMeta properties');
    return false;
  }
  
  if (!obj.videoMeta.duration) {
    console.warn('Validation failed: missing videoMeta.duration');
    return false;
  }
  
  if (!obj.stats.playCount && obj.stats.playCount !== 0) {
    console.warn('Validation failed: missing stats.playCount');
    return false;
  }
  
  return true;
} 
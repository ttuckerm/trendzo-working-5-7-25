import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  const niche = searchParams.get('niche');

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (!videoId) {
    return NextResponse.json({
      error: 'Video ID required',
      success: false
    }, { status: 400 });
  }

  // Mock workspace configuration based on video ID and niche
  const workspaceConfig = {
    workspaceId: `ws_${videoId}_${Date.now()}`,
    framework: getFrameworkForVideo(videoId),
    tools: [
      'Value Template Editor',
      'Real-time Advisor', 
      'Viral Predictor',
      'Series Creator',
      'Multi-Variation Builder'
    ],
    recommendations: [
      'Use authority-based opening for this niche',
      'Include specific numbers in your hook',
      'Add visual proof at 15-second mark',
      'End with value-promise CTA'
    ],
    niche: niche || 'General',
    optimizedFor: 'viral_potential',
    createdAt: new Date().toISOString()
  };

  return NextResponse.json({
    success: true,
    data: workspaceConfig,
    message: 'Workspace configured successfully'
  });
}

function getFrameworkForVideo(videoId: string): string {
  const frameworks = [
    'Authority Framework',
    'Transformation Framework', 
    'Secret Knowledge Framework',
    'POV Framework',
    'Tutorial Framework'
  ];
  
  // Simple hash to consistently return same framework for same video
  const index = videoId.length % frameworks.length;
  return frameworks[index];
} 
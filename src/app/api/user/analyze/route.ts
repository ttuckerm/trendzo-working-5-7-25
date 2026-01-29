import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';
import { predictDNA } from '@/lib/modules/dna-detective';
import { orchestratePrediction } from '@/lib/modules/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const { video_url } = await request.json();

    if (!video_url) {
      return NextResponse.json(
        { success: false, error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Get user from session (in production, implement proper auth)
    const userId = 'demo-user'; // Replace with actual user ID from session

    // Check user limits and status
    const { data: user, error: userError } = await supabaseClient
      .from('limited_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found or access denied' },
        { status: 403 }
      );
    }

    // Check if user has reached daily limit
    if (user.analyses_used_today >= user.daily_analysis_limit) {
      return NextResponse.json(
        { success: false, error: 'Daily analysis limit reached' },
        { status: 429 }
      );
    }

    // Check if user access has expired
    if (user.access_expires_at && new Date(user.access_expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Access expired' },
        { status: 403 }
      );
    }

    // Simulate video analysis (in production, implement actual video processing)
    const mockGenes = generateMockGenes(video_url);
    
    // Use DNA_Detective for basic analysis (limited users get baseline engine)
    const dnaAnalysis = await predictDNA(mockGenes);
    
    // Generate optimization suggestions based on user tier
    const optimizationSuggestions = generateOptimizationSuggestions(
      dnaAnalysis,
      user.features_enabled.optimization_suggestions
    );

    const analysis = {
      video_probability: dnaAnalysis.video_probability,
      closest_template: dnaAnalysis.closest_template,
      top_gene_matches: dnaAnalysis.top_gene_matches,
      optimization_suggestions: optimizationSuggestions,
      confidence_score: 0.8, // DNA_Detective baseline confidence
      analysis_id: crypto.randomUUID()
    };

    // Update user usage
    await supabaseClient
      .from('limited_users')
      .update({
        analyses_used_today: user.analyses_used_today + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    // Log user activity
    await supabaseClient
      .from('user_analytics')
      .insert({
        user_id: userId,
        action_type: 'video_analyzed',
        details: {
          video_url,
          viral_probability: analysis.video_probability,
          engine_used: 'DNA_Detective'
        },
        session_id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      });

    // Create prediction validation record
    await supabaseClient
      .from('prediction_validation')
      .insert({
        video_id: extractVideoId(video_url),
        predicted_probability: analysis.video_probability,
        prediction_engine: 'DNA_Detective',
        prediction_timestamp: new Date().toISOString(),
        niche: extractNiche(video_url),
        platform: extractPlatform(video_url)
      });

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('User video analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

// Generate mock gene vector based on video URL (in production, use actual video analysis)
function generateMockGenes(videoUrl: string): boolean[] {
  const hash = videoUrl.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const genes = Array(48).fill(false);
  
  // Activate genes based on URL hash for deterministic results
  for (let i = 0; i < 48; i++) {
    genes[i] = ((hash + i) % 3) === 0; // ~33% activation rate
  }
  
  return genes;
}

function generateOptimizationSuggestions(analysis: any, tier: string): string[] {
  const basicSuggestions = [
    "Add a strong hook in the first 3 seconds",
    "Include trending hashtags for your niche",
    "Post during peak engagement hours (7-9 PM)"
  ];

  const advancedSuggestions = [
    ...basicSuggestions,
    "Use pattern interrupts every 3-5 seconds",
    "Add captions for 85% higher engagement",
    "Include a clear call-to-action at the end",
    "Match your content pacing to the audio rhythm"
  ];

  const fullSuggestions = [
    ...advancedSuggestions,
    "Implement psychological triggers (scarcity, social proof)",
    "Use contrasting colors for better visual retention",
    "Apply the rule of thirds for better composition",
    "Include micro-expressions for emotional connection",
    "Optimize for platform-specific algorithm preferences"
  ];

  switch (tier) {
    case 'advanced': return advancedSuggestions.slice(0, 5);
    case 'full': return fullSuggestions.slice(0, 8);
    default: return basicSuggestions;
  }
}

function extractVideoId(url: string): string {
  // Extract video ID from various platform URLs
  const patterns = [
    /tiktok\.com\/.*\/video\/(\d+)/,
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/,
    /youtu\.be\/([A-Za-z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return crypto.randomUUID();
}

function extractPlatform(url: string): string {
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'unknown';
}

function extractNiche(url: string): string {
  // Simple niche detection based on URL patterns or user history
  // In production, this would use actual content analysis
  const niches = ['business', 'fitness', 'food', 'beauty', 'entertainment', 'education'];
  return niches[Math.floor(Math.random() * niches.length)];
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'
import { analyzeContentAndMatchFrameworks, ContentAnalysis } from '@/lib/services/viral-pattern-analyzer';

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
const supabase = new Proxy({}, { get(_t, p){ return (getDb() as any)[p as any] } }) as any;

// Cache for workspace configurations (5 minute TTL)
const configCache = new Map<string, { config: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * 🧬 ENHANCED WORKSPACE CONFIG API WITH ML-BASED FRAMEWORK MATCHING
 * 
 * Uses viral DNA analysis to intelligently match videos to optimal frameworks
 * and provide personalized workspace configurations.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    console.log('🔍 Workspace Config API called with videoId:', videoId);

    if (!videoId) {
      console.error('❌ No videoId provided');
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `workspace_${videoId}`;
    const cached = configCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.config);
    }

    console.log('🧬 Generating ML-enhanced workspace config for video:', videoId);

    // 📊 Fetch video data from database
    console.log('🔍 Fetching video from viral_video_gallery...');
    const { data: video, error: videoError } = await supabase
      .from('viral_video_gallery')
      .select('*')
      .eq('id', videoId)
      .single();

    console.log('📊 Video query result:', { video: !!video, error: videoError });

    if (videoError || !video) {
      console.error('❌ Video not found:', videoError);
      return NextResponse.json(
        { 
          error: 'Video not found in database', 
          details: videoError?.message || 'Video does not exist',
          debug: { videoId, videoFound: !!video }
        },
        { status: 404 }
      );
    }

    // 📚 Fetch available frameworks
    console.log('🔍 Fetching frameworks from viral_recipe_book...');
    const { data: frameworks, error: frameworkError } = await supabase
      .from('viral_recipe_book')
      .select('*')
      .eq('status', 'HOT')
      .order('effectiveness_score', { ascending: false });

    console.log('📚 Framework query result:', { 
      frameworksCount: frameworks?.length || 0, 
      error: frameworkError 
    });

    if (frameworkError) {
      console.error('❌ Framework query error:', frameworkError);
      return NextResponse.json(
        { 
          error: 'Database error fetching frameworks', 
          details: frameworkError.message,
          debug: { table: 'viral_recipe_book', status: 'HOT' }
        },
        { status: 500 }
      );
    }

    if (!frameworks || frameworks.length === 0) {
      console.warn('⚠️ No HOT frameworks found - this is likely the issue!');
      return NextResponse.json(
        { 
          error: 'No viral frameworks found in database', 
          details: 'viral_recipe_book table exists but no HOT status frameworks found',
          debug: { 
            table: 'viral_recipe_book', 
            status: 'HOT',
            action: 'Please populate viral_recipe_book table with framework data'
          }
        },
        { status: 404 }
      );
    }

    // 🧬 Prepare content for ML analysis
    const contentAnalysis: ContentAnalysis = {
      transcript: video.transcript || '',
      duration: video.duration_seconds || 30,
      viral_score: parseFloat(video.viral_score) || 0,
      view_count: video.view_count || 0,
      title: video.title || '',
      creator_profile: video.creator_name || ''
    };

    // 🎯 Run ML-based framework analysis
    const analysis = await analyzeContentAndMatchFrameworks(contentAnalysis, frameworks);

    console.log('🧬 Viral DNA Analysis Results:', {
      emotional_triggers: analysis.viral_dna.emotional_triggers,
      content_patterns: analysis.viral_dna.content_patterns,
      viral_coefficients: analysis.viral_dna.viral_coefficients,
      top_framework: analysis.recommended_framework?.framework_name,
      confidence: analysis.recommended_framework?.confidence_score
    });

    // 🚀 Generate enhanced workspace configuration
    const workspaceConfig = await generateEnhancedWorkspaceConfig(
      video,
      frameworks,
      analysis
    );

    // Cache the result
    configCache.set(cacheKey, {
      config: workspaceConfig,
      timestamp: Date.now()
    });

    return NextResponse.json(workspaceConfig);

  } catch (error) {
    console.error('❌ Workspace config generation error:', error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate workspace configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'UnknownError',
        debug: {
          timestamp: new Date().toISOString(),
          url: request.url
        }
      },
      { status: 500 }
    );
  }
}

/**
 * 🎨 Generate Enhanced Workspace Configuration
 * 
 * Creates personalized workspace config based on ML analysis results
 */
async function generateEnhancedWorkspaceConfig(
  video: any,
  frameworks: any[],
  analysis: any
) {
  const timestamp = Date.now();
  const workspaceId = `ws_${timestamp}_${video.id.substring(0, 8)}`;

  // 🎯 Get recommended framework and alternatives
  const recommendedFramework = analysis.recommended_framework;
  const alternativeFrameworks = analysis.framework_matches.slice(1, 4); // Top 3 alternatives

  // 🧬 Extract viral DNA insights
  const viralDNA = analysis.viral_dna;

  // 🎨 Generate color scheme based on viral coefficients
  const colorScheme = generateViralColorScheme(viralDNA.viral_coefficients);

  // 📝 Generate intelligent hooks based on analysis
  const intelligentHooks = generateIntelligentHooks(viralDNA, recommendedFramework);

  // ⚡ Generate optimization insights
  const optimizationInsights = generateOptimizationInsights(viralDNA, video);

  return {
    workspaceId,
    timestamp,
    
    // 🎯 Primary Framework Recommendation (ML-powered)
    recommendedFramework: recommendedFramework ? {
      id: recommendedFramework.framework_id,
      name: recommendedFramework.framework_name,
      confidence: Math.round(recommendedFramework.confidence_score * 100),
      reasoning: recommendedFramework.reasoning,
      viralDnaAlignment: Math.round(recommendedFramework.viral_dna_alignment * 100)
    } : null,

    // 🔄 Alternative Framework Options
    alternativeFrameworks: alternativeFrameworks.map(fw => ({
      id: fw.framework_id,
      name: fw.framework_name,
      confidence: Math.round(fw.confidence_score * 100),
      reasoning: fw.reasoning[0] || 'Alternative viral approach'
    })),

    // 🧬 Viral DNA Analysis Results
    viralDNA: {
      emotionalTriggers: viralDNA.emotional_triggers,
      contentPatterns: viralDNA.content_patterns,
      hookMechanisms: viralDNA.hook_mechanisms,
      engagementDrivers: viralDNA.engagement_drivers,
      viralCoefficients: {
        curiosity: Math.round(viralDNA.viral_coefficients.curiosity * 100),
        relatability: Math.round(viralDNA.viral_coefficients.relatability * 100),
        surprise: Math.round(viralDNA.viral_coefficients.surprise * 100),
        authority: Math.round(viralDNA.viral_coefficients.authority * 100),
        transformation: Math.round(viralDNA.viral_coefficients.transformation * 100),
        exclusivity: Math.round(viralDNA.viral_coefficients.exclusivity * 100)
      }
    },

    // 💡 ML-Generated Hook Suggestions
    suggestedHooks: intelligentHooks,

    // ⏱️ Intelligent Timing Guidance
    timingGuidance: {
      optimalDuration: video.duration_seconds,
      hookTimingSeconds: recommendedFramework?.optimization_suggestions.includes('first 3 seconds') ? 3 : 5,
      peakMomentSeconds: Math.round(video.duration_seconds * 0.4), // Viral peak earlier than middle
      callToActionTiming: Math.round(video.duration_seconds * 0.85)
    },

    // 🎨 Viral-Optimized Visual Elements
    visualElements: {
      primaryColors: colorScheme.primary,
      accentColors: colorScheme.accent,
      moodColors: colorScheme.mood,
      visualStyle: determineVisualStyle(viralDNA),
      cameraAngles: recommendCameraAngles(viralDNA),
      transitionStyle: recommendTransitions(viralDNA)
    },

    // 📝 Intelligent Script Guidance
    scriptGuidance: {
      tone: determineTone(viralDNA),
      pacing: determinePacing(viralDNA, video.duration_seconds),
      keyPhrases: generateKeyPhrases(viralDNA),
      emotionalArc: generateEmotionalArc(viralDNA),
      callToActionStyle: determineCallToActionStyle(viralDNA)
    },

    // 🔥 Optimization Insights (ML-powered)
    optimizationInsights,

    // 📊 Performance Predictions
    performancePredictions: {
      expectedViralScore: calculateExpectedViralScore(viralDNA, video),
      engagementPrediction: calculateEngagementPrediction(viralDNA),
      shareabilityScore: calculateShareabilityScore(viralDNA),
      retentionPrediction: calculateRetentionPrediction(viralDNA, video.duration_seconds)
    },

    // 🎯 Video Context
    videoContext: {
      id: video.id,
      title: video.title,
      creator: video.creator_name,
      currentViralScore: video.viral_score,
      viewCount: video.view_count,
      platform: video.platform,
      thumbnailUrl: video.thumbnail_url
    }
  };
}

/**
 * 🎨 Generate Viral Color Scheme Based on Coefficients
 */
function generateViralColorScheme(coefficients: any) {
  const { authority, curiosity, transformation, relatability, exclusivity, surprise } = coefficients;

  // Primary colors based on dominant viral coefficient
  let primary = ['#3b82f6', '#1e40af']; // Default blue (trust/authority)
  
  if (curiosity > 0.7) primary = ['#8b5cf6', '#6d28d9']; // Purple (mystery/curiosity)
  else if (transformation > 0.7) primary = ['#10b981', '#047857']; // Green (growth/transformation)
  else if (authority > 0.7) primary = ['#1f2937', '#374151']; // Dark (authority/power)
  else if (relatability > 0.7) primary = ['#f59e0b', '#d97706']; // Orange (warmth/relatability)

  // Accent colors based on secondary coefficients
  const accent = exclusivity > 0.5 ? ['#ef4444', '#dc2626'] : ['#06b6d4', '#0891b2'];
  
  // Mood colors based on surprise factor
  const mood = surprise > 0.6 ? ['#ec4899', '#be185d'] : ['#6366f1', '#4f46e5'];

  return { primary, accent, mood };
}

/**
 * 💡 Generate Intelligent Hooks Based on Viral DNA
 */
function generateIntelligentHooks(viralDNA: any, recommendedFramework: any): string[] {
  const hooks: string[] = [];
  const coefficients = viralDNA.viral_coefficients;

  // Authority-based hooks
  if (coefficients.authority > 0.6) {
    hooks.push("Establish your expertise in the opening 3 seconds");
    hooks.push("Share a specific, impressive result or credential");
    hooks.push("Use confident, authoritative language");
  }

  // Curiosity-driven hooks
  if (coefficients.curiosity > 0.6) {
    hooks.push("Create a curiosity gap that demands resolution");
    hooks.push("Tease the unexpected outcome or revelation");
    hooks.push("Use 'but here's what nobody tells you...' pattern");
  }

  // Transformation hooks
  if (coefficients.transformation > 0.6) {
    hooks.push("Show the dramatic 'before' state first");
    hooks.push("Hint at the transformation method early");
    hooks.push("Connect with viewer's transformation desire");
  }

  // Relatability hooks
  if (coefficients.relatability > 0.6) {
    hooks.push("Start with a universally relatable problem");
    hooks.push("Use 'POV:' or 'When you...' framing");
    hooks.push("Share a vulnerable, authentic moment");
  }

  // Framework-specific hooks
  if (recommendedFramework?.optimization_suggestions) {
    hooks.push(...recommendedFramework.optimization_suggestions.slice(0, 2));
  }

  return hooks.slice(0, 6); // Top 6 hooks
}

/**
 * 🔥 Generate Optimization Insights
 */
function generateOptimizationInsights(viralDNA: any, video: any): any[] {
  const insights: any[] = [];
  const coefficients = viralDNA.viral_coefficients;

  // Viral coefficient-based insights
  Object.entries(coefficients).forEach(([key, value]) => {
    if (value > 0.7) {
      insights.push({
        type: 'strength',
        category: key,
        message: `High ${key} coefficient detected - leverage this as your primary viral driver`,
        impact: 'high',
        actionable: true
      });
    } else if (value < 0.3) {
      insights.push({
        type: 'opportunity',
        category: key,
        message: `Low ${key} score - consider adding elements to boost this viral factor`,
        impact: 'medium',
        actionable: true
      });
    }
  });

  // Content pattern insights
  if (viralDNA.content_patterns.length > 2) {
    insights.push({
      type: 'strength',
      category: 'content_patterns',
      message: 'Multiple viral patterns detected - you have a complex, engaging narrative structure',
      impact: 'high',
      actionable: false
    });
  }

  // Engagement driver insights
  if (viralDNA.engagement_drivers.includes('high_stakes')) {
    insights.push({
      type: 'strength',
      category: 'engagement',
      message: 'High-stakes storytelling present - emphasize the dramatic stakes early',
      impact: 'high',
      actionable: true
    });
  }

  return insights.slice(0, 5); // Top 5 insights
}

// Helper functions for additional workspace config elements
function determineVisualStyle(viralDNA: any): string {
  if (viralDNA.viral_coefficients.authority > 0.6) return 'professional';
  if (viralDNA.viral_coefficients.relatability > 0.6) return 'authentic';
  if (viralDNA.viral_coefficients.surprise > 0.6) return 'dynamic';
  return 'modern';
}

function recommendCameraAngles(viralDNA: any): string[] {
  const angles = ['close-up'];
  if (viralDNA.viral_coefficients.authority > 0.6) angles.push('medium-shot');
  if (viralDNA.viral_coefficients.transformation > 0.6) angles.push('wide-shot');
  return angles;
}

function recommendTransitions(viralDNA: any): string[] {
  if (viralDNA.viral_coefficients.surprise > 0.6) return ['quick-cut', 'jump-cut'];
  if (viralDNA.viral_coefficients.transformation > 0.6) return ['fade', 'morph'];
  return ['cut', 'fade'];
}

function determineTone(viralDNA: any): string {
  if (viralDNA.viral_coefficients.authority > 0.6) return 'confident';
  if (viralDNA.viral_coefficients.relatability > 0.6) return 'conversational';
  if (viralDNA.viral_coefficients.curiosity > 0.6) return 'mysterious';
  return 'engaging';
}

function determinePacing(viralDNA: any, duration: number): string {
  if (viralDNA.viral_coefficients.surprise > 0.6) return 'fast';
  if (duration > 45) return 'measured';
  return 'moderate';
}

function generateKeyPhrases(viralDNA: any): string[] {
  const phrases: string[] = [];
  if (viralDNA.emotional_triggers.includes('curiosity')) phrases.push('But here\'s the secret...');
  if (viralDNA.emotional_triggers.includes('authority')) phrases.push('In my experience...');
  if (viralDNA.emotional_triggers.includes('relatability')) phrases.push('We\'ve all been there...');
  return phrases;
}

function generateEmotionalArc(viralDNA: any): string[] {
  const arc = ['hook'];
  if (viralDNA.viral_coefficients.transformation > 0.5) arc.push('struggle', 'breakthrough');
  if (viralDNA.viral_coefficients.curiosity > 0.5) arc.push('mystery', 'revelation');
  arc.push('resolution');
  return arc;
}

function determineCallToActionStyle(viralDNA: any): string {
  if (viralDNA.viral_coefficients.authority > 0.6) return 'direct';
  if (viralDNA.viral_coefficients.relatability > 0.6) return 'community';
  return 'engaging';
}

function calculateExpectedViralScore(viralDNA: any, video: any): number {
  const coefficientAvg = Object.values(viralDNA.viral_coefficients).reduce((a: any, b: any) => a + b, 0) / 6;
  const baseScore = video.viral_score || 50;
  return Math.min(95, baseScore + (coefficientAvg * 20));
}

function calculateEngagementPrediction(viralDNA: any): number {
  const engagementFactors = viralDNA.engagement_drivers.length * 15;
  const emotionalTriggers = viralDNA.emotional_triggers.length * 10;
  return Math.min(95, 40 + engagementFactors + emotionalTriggers);
}

function calculateShareabilityScore(viralDNA: any): number {
  let score = 40;
  if (viralDNA.viral_coefficients.surprise > 0.6) score += 20;
  if (viralDNA.viral_coefficients.curiosity > 0.6) score += 15;
  if (viralDNA.viral_coefficients.relatability > 0.6) score += 15;
  if (viralDNA.emotional_triggers.includes('exclusivity')) score += 10;
  return Math.min(95, score);
}

function calculateRetentionPrediction(viralDNA: any, duration: number): number {
  let score = 60;
  if (viralDNA.hook_mechanisms.length > 1) score += 15;
  if (duration < 30) score += 10;
  if (viralDNA.viral_coefficients.curiosity > 0.6) score += 10;
  if (viralDNA.engagement_drivers.includes('practical_value')) score += 5;
  return Math.min(95, score);
} 
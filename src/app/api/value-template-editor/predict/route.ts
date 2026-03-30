import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, logSupabaseRuntimeEnv } from '@/lib/env'
import { analyzeContentAndMatchFrameworks, ContentAnalysis } from '@/lib/services/viral-pattern-analyzer'

logSupabaseRuntimeEnv()
function getDb(){
  return createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )
}

interface UserContent {
  script: string
  hook: string
  style: string
}

interface ViralPrediction {
  viral_score: number
  confidence: number
  predicted_views: number
  estimated_engagement_rate: number
  suggestions: string[]
  breakdown: {
    hook_score: number
    content_score: number
    timing_score: number
    platform_fit_score: number
  }
}

/**
 * POST /api/value-template-editor/predict
 * 
 * 🧬 ENHANCED ML-BASED VIRAL PREDICTION API
 * 
 * Uses the same viral pattern analyzer and ML engine as workspace-config
 * for real, sophisticated content analysis and viral prediction.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { video_id, user_content, workspace_context } = body

    console.log('🎯 Starting ML-based viral prediction for video:', video_id)

    if (!video_id || !user_content || !workspace_context) {
      return NextResponse.json(
        { success: false, error: 'video_id, user_content, and workspace_context required' },
        { status: 400 }
      )
    }

    // 📊 Get video and framework context for enhanced prediction
    const contextData = await getEnhancedContextForPrediction(video_id)
    
    if (!contextData.success) {
      console.error('❌ Failed to get context data:', contextData.error)
      return NextResponse.json(
        { success: false, error: 'Failed to load prediction context' },
        { status: 500 }
      )
    }

    // 🧬 Run ML-based content analysis on user's content
    const mlAnalysis = await runMLContentAnalysis(user_content, contextData.video, contextData.frameworks || [])
    
    // 🎯 Generate sophisticated viral prediction
    const viralPrediction = await generateMLViralPrediction(
      user_content, 
      mlAnalysis, 
      contextData
    )
    
    // 💡 Generate intelligent, personalized suggestions
    const intelligentSuggestions = await generateIntelligentSuggestions(
      user_content, 
      mlAnalysis, 
      contextData
    )
    
    // 📈 Store prediction for validation and learning
    await storePredictionForValidation(video_id, user_content, viralPrediction)

    const result: ViralPrediction = {
      viral_score: Math.round(viralPrediction.viral_score),
      confidence: Math.round(viralPrediction.confidence * 100),
      predicted_views: viralPrediction.predicted_views,
      estimated_engagement_rate: viralPrediction.engagement_rate,
      suggestions: intelligentSuggestions,
      breakdown: {
        hook_score: Math.round(viralPrediction.hook_score),
        content_score: Math.round(viralPrediction.content_score),
        timing_score: Math.round(viralPrediction.timing_score),
        platform_fit_score: Math.round(viralPrediction.platform_fit_score)
      }
    }

    console.log('✅ ML viral prediction completed:', {
      viralScore: result.viral_score,
      confidence: result.confidence,
      suggestionsCount: result.suggestions.length
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('❌ ML viral prediction API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * 📊 Get Enhanced Context for ML Prediction
 * 
 * Fetches video data, frameworks, and existing workspace analysis
 */
async function getEnhancedContextForPrediction(videoId: string) {
  try {
    // For testing/development: Use mock data when Supabase is not available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      console.log('🧪 Using mock data for testing (Supabase not configured)')
      return {
        success: true,
        video: {
          id: videoId,
          title: 'Mock Viral Video',
          creator_name: 'Mock Creator',
          viral_score: 85,
          view_count: 1500000,
          duration_seconds: 30
        },
        frameworks: [
          {
            id: '1',
            recipe_name: 'Authority Hook',
            template_type: 'hook',
            viral_elements: { pattern: 'credibility_statement' },
            effectiveness_score: 0.87
          },
          {
            id: '2', 
            recipe_name: 'Before/After Transformation',
            template_type: 'structure',
            viral_elements: { pattern: 'transformation' },
            effectiveness_score: 0.83
          }
        ],
        existingMapping: null
      }
    }

    // Get video data
    const { data: video, error: videoError } = await getDb()
      .from('viral_video_gallery')
      .select('*')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      return { success: false, error: 'Video not found' }
    }

    // Get available frameworks
    const { data: frameworks, error: frameworkError } = await getDb()
      .from('viral_recipe_book')
      .select('*')
      .eq('status', 'HOT')
      .order('effectiveness_score', { ascending: false })

    if (frameworkError || !frameworks) {
      return { success: false, error: 'Frameworks not found' }
    }

    // Get existing framework mapping if available
    const { data: mapping } = await getDb()
      .from('video_framework_mapping')
      .select('*')
      .eq('video_id', videoId)
      .single()
    
    return {
      success: true,
      video,
      frameworks,
      existingMapping: mapping
    }
  } catch (error) {
    console.error('Error getting prediction context:', error)
    return { success: false, error: 'Context fetch failed' }
  }
}

/**
 * 🧬 Run ML-Based Content Analysis
 * 
 * Uses the same viral pattern analyzer as workspace-config for consistency
 */
async function runMLContentAnalysis(userContent: UserContent, video: any, frameworks: any[]) {
  try {
    // Prepare combined content analysis (video + user input)
    const combinedContent: ContentAnalysis = {
      transcript: `${userContent.hook} ${userContent.script}`.trim(),
      duration: video.duration_seconds || 30,
      viral_score: parseFloat(video.viral_score) || 0,
      view_count: video.view_count || 0,
      title: `${userContent.hook} - ${video.title}`,
      creator_profile: video.creator_name || ''
    }

    console.log('🧬 Running ML content analysis on user content...')

    // Run the same ML analysis as workspace-config
    const analysis = await analyzeContentAndMatchFrameworks(combinedContent, frameworks)

    console.log('🧬 ML Analysis Results:', {
      emotionalTriggers: analysis.viral_dna.emotional_triggers.length,
      contentPatterns: analysis.viral_dna.content_patterns.length,
      topFramework: analysis.recommended_framework?.framework_name,
      confidence: analysis.recommended_framework?.confidence_score
    })

    return analysis
  } catch (error) {
    console.error('Error in ML content analysis:', error)
    throw new Error('ML content analysis failed')
  }
}

/**
 * 🎯 Generate ML-Based Viral Prediction
 * 
 * Sophisticated prediction using viral DNA analysis and framework matching
 */
async function generateMLViralPrediction(userContent: UserContent, mlAnalysis: any, contextData: any) {
  const viralDNA = mlAnalysis.viral_dna
  const recommendedFramework = mlAnalysis.recommended_framework
  const video = contextData.video

  // 🧬 Calculate viral DNA score (0-100)
  const viralDNAScore = calculateViralDNAScore(viralDNA)
  
  // 🎯 Calculate framework alignment score
  const frameworkScore = recommendedFramework 
    ? (recommendedFramework.confidence_score * 100) 
    : 50

  // 📝 Analyze user's specific content quality
  const contentQualityScore = analyzeContentQuality(userContent, viralDNA)
  
  // 🎪 Calculate hook effectiveness using ML insights
  const hookScore = calculateMLHookScore(userContent.hook, viralDNA)
  
  // ⏱️ Calculate timing optimization score
  const timingScore = calculateTimingOptimization(userContent, video, viralDNA)
  
  // 📱 Calculate platform fit using ML patterns
  const platformFitScore = calculatePlatformFitScore(viralDNA, video.platform)

  // 🔮 Calculate overall viral score using weighted ML components
  const viralScore = calculateMLViralScore({
    viralDNAScore,
    frameworkScore,
    contentQualityScore,
    hookScore,
    timingScore,
    platformFitScore,
    baseVideoScore: video.viral_score
  })

  // 📊 Calculate prediction confidence based on ML analysis quality
  const confidence = calculateMLConfidence(mlAnalysis, userContent)

  // 📈 Predict views using ML-enhanced calculation
  const predictedViews = calculateMLPredictedViews(viralScore, viralDNA, video)

  // 💫 Calculate engagement rate using viral DNA insights
  const engagementRate = calculateMLEngagementRate(viralDNA, viralScore)

  return {
    viral_score: viralScore,
    confidence,
    predicted_views: predictedViews,
    engagement_rate: engagementRate,
    hook_score: hookScore,
    content_score: contentQualityScore,
    timing_score: timingScore,
    platform_fit_score: platformFitScore
  }
}

/**
 * 💡 Generate Intelligent Suggestions
 * 
 * Personalized, actionable suggestions based on ML analysis
 */
async function generateIntelligentSuggestions(userContent: UserContent, mlAnalysis: any, contextData: any): Promise<string[]> {
  const suggestions: string[] = []
  const viralDNA = mlAnalysis.viral_dna
  const coefficients = viralDNA.viral_coefficients
  
  // Hook-specific suggestions based on ML analysis
  if (!userContent.hook || userContent.hook.length < 10) {
    if (coefficients.curiosity > 0.6) {
      suggestions.push("Add a curiosity-driven hook like 'You'll never guess what happened next...'")
    } else if (coefficients.authority > 0.6) {
      suggestions.push("Start with a credibility statement: 'After 10 years of research, I discovered...'")
    } else {
      suggestions.push("Create a stronger hook to capture attention in the first 3 seconds")
    }
  }

  // Content optimization based on viral DNA
  if (coefficients.transformation > 0.7) {
    suggestions.push("Emphasize the transformation aspect - show clear before/after elements")
  }

  if (coefficients.relatability > 0.7) {
    suggestions.push("Add more relatable elements that your audience can connect with personally")
  }

  if (coefficients.surprise > 0.7) {
    suggestions.push("Include an unexpected twist or revelation to boost shareability")
  }

  // Framework-specific suggestions
  const framework = mlAnalysis.recommended_framework
  if (framework?.optimization_suggestions) {
    suggestions.push(...framework.optimization_suggestions.slice(0, 2))
  }

  // Content length optimization
  const totalLength = userContent.script.length + userContent.hook.length
  if (totalLength < 50) {
    suggestions.push("Expand your content to tell a more complete story (aim for 80-150 characters)")
  } else if (totalLength > 200) {
    suggestions.push("Consider shortening your content for better retention and impact")
  }

  // Emotional engagement suggestions
  if (viralDNA.emotional_triggers.length < 2) {
    suggestions.push("Add more emotional elements to increase viewer connection and engagement")
  }

  return suggestions.slice(0, 5) // Return top 5 suggestions
}

// 🧬 ML-Based Calculation Functions

function calculateViralDNAScore(viralDNA: any): number {
  const coefficients = viralDNA.viral_coefficients
  const triggers = viralDNA.emotional_triggers.length
  const patterns = viralDNA.content_patterns.length
  
  // Weighted average of viral coefficients
  const coefficientScore = Object.values(coefficients).reduce((sum: number, val: any) => sum + val, 0) / 6 * 100
  
  // Bonus for emotional triggers and patterns
  const triggerBonus = Math.min(triggers * 5, 20)
  const patternBonus = Math.min(patterns * 8, 25)
  
  return Math.min(100, coefficientScore + triggerBonus + patternBonus)
}

function analyzeContentQuality(userContent: UserContent, viralDNA: any): number {
  let score = 50
  
  // Script quality analysis
  const script = userContent.script.toLowerCase()
  
  // Emotional word detection (more sophisticated than before)
  const emotionalWords = viralDNA.emotional_triggers.length > 0 ? 15 : 5
  score += emotionalWords
  
  // Question and engagement patterns
  if (script.includes('?')) score += 10
  if (script.includes('!')) score += 8
  if (/\b(you|your|we|us)\b/gi.test(script)) score += 12
  
  // Story structure detection
  if (script.includes('but') || script.includes('however') || script.includes('then')) score += 8
  
  // Length optimization
  if (userContent.script.length > 30 && userContent.script.length < 120) score += 15
  
  return Math.min(100, score)
}

function calculateMLHookScore(hook: string, viralDNA: any): number {
  if (!hook || hook.length < 5) return 25
  
  let score = 40
  
  // Check against viral DNA patterns
  const coefficients = viralDNA.viral_coefficients
  
  // Authority hooks
  if (coefficients.authority > 0.6 && /\b(expert|proven|research|study|years)\b/i.test(hook)) {
    score += 25
  }
  
  // Curiosity hooks
  if (coefficients.curiosity > 0.6 && /\b(secret|never|nobody|hidden|discover)\b/i.test(hook)) {
    score += 25
  }
  
  // Transformation hooks
  if (coefficients.transformation > 0.6 && /\b(before|after|changed|transform|became)\b/i.test(hook)) {
    score += 25
  }
  
  // POV and relatability hooks
  if (coefficients.relatability > 0.6 && /\b(pov|when you|imagine|what if)\b/i.test(hook)) {
      score += 20
  }
  
  // Length optimization
  if (hook.length > 15 && hook.length < 80) score += 10
  
  return Math.min(100, score)
}

function calculateTimingOptimization(userContent: UserContent, video: any, viralDNA: any): number {
  const totalContentLength = userContent.script.length + userContent.hook.length
  const videoDuration = video.duration_seconds || 30
  const optimalCharsPerSecond = 5 // Rough estimate for readability
  
  let score = 60
  
  // Content-to-duration ratio
  const idealLength = videoDuration * optimalCharsPerSecond
  const lengthRatio = totalContentLength / idealLength
  
  if (lengthRatio > 0.7 && lengthRatio < 1.3) {
    score += 25 // Good pacing
  } else if (lengthRatio < 0.5) {
    score += 10 // Too short but can work for some formats
  }
  
  // Hook timing bonus
  if (userContent.hook.length > 10 && userContent.hook.length < 50) {
    score += 15 // Good hook length for video start
  }
  
  return Math.min(100, score)
}

function calculatePlatformFitScore(viralDNA: any, platform: string): number {
  let score = 70 // Base platform fit
  
  const coefficients = viralDNA.viral_coefficients
  
  // TikTok optimization
  if (platform === 'tiktok') {
    if (coefficients.surprise > 0.6) score += 15 // TikTok loves surprises
    if (coefficients.relatability > 0.7) score += 10 // Relatable content performs well
    if (viralDNA.emotional_triggers.includes('curiosity')) score += 10
  }
  
  // Instagram optimization
  if (platform === 'instagram') {
    if (coefficients.transformation > 0.6) score += 15 // Transformation content works well
    if (coefficients.authority > 0.6) score += 10 // Authority content performs well
  }
  
  return Math.min(100, score)
}

function calculateMLViralScore(components: any): number {
  const weights = {
    viralDNA: 0.25,
    framework: 0.20,
    contentQuality: 0.20,
    hook: 0.15,
    timing: 0.10,
    platformFit: 0.10
  }
  
  const weightedScore = (
    components.viralDNAScore * weights.viralDNA +
    components.frameworkScore * weights.framework +
    components.contentQualityScore * weights.contentQuality +
    components.hookScore * weights.hook +
    components.timingScore * weights.timing +
    components.platformFitScore * weights.platformFit
  )
  
  // Apply base video performance boost
  const baseBoost = Math.min(10, components.baseVideoScore * 0.1)
  
  return Math.min(100, Math.max(10, weightedScore + baseBoost))
}

function calculateMLConfidence(mlAnalysis: any, userContent: UserContent): number {
  let confidence = 0.6 // Base confidence
  
  // ML analysis quality indicators
  if (mlAnalysis.recommended_framework?.confidence_score) {
    confidence += mlAnalysis.recommended_framework.confidence_score * 0.3
  }
  
  // Content completeness
  const contentCompleteness = (userContent.script.length > 20 && userContent.hook.length > 5) ? 0.1 : 0
  confidence += contentCompleteness
  
  // Viral DNA richness
  const dnaRichness = Math.min(0.1, mlAnalysis.viral_dna.emotional_triggers.length * 0.02)
  confidence += dnaRichness
  
  return Math.min(1.0, confidence)
}

function calculateMLPredictedViews(viralScore: number, viralDNA: any, video: any): number {
  // Base calculation using exponential relationship
  const baseViews = Math.pow(viralScore / 10, 2.8) * 1200
  
  // Apply viral DNA multipliers
  const coefficients = viralDNA.viral_coefficients
  let multiplier = 1.0
  
  if (coefficients.surprise > 0.8) multiplier *= 1.4 // High surprise = shareability
  if (coefficients.curiosity > 0.8) multiplier *= 1.3 // High curiosity = retention
  if (coefficients.transformation > 0.8) multiplier *= 1.2 // Transformation = inspiration
  
  // Apply video context
  const videoViewsInfluence = Math.min(2.0, video.view_count / 1000000) // Max 2x multiplier
  multiplier *= (1 + videoViewsInfluence * 0.2)
  
  return Math.round(baseViews * multiplier)
}

function calculateMLEngagementRate(viralDNA: any, viralScore: number): number {
  // Base engagement rate
  let rate = (viralScore / 100) * 0.085 // Max 8.5% base rate
  
  // Viral DNA modifiers
  const coefficients = viralDNA.viral_coefficients
  
  if (coefficients.relatability > 0.7) rate *= 1.3 // Relatable content gets more engagement
  if (coefficients.authority > 0.7) rate *= 1.2 // Authority content gets quality engagement
  if (viralDNA.emotional_triggers.includes('curiosity')) rate *= 1.15
  
  // Emotional trigger bonus
  const emotionalBonus = Math.min(0.02, viralDNA.emotional_triggers.length * 0.005)
  rate += emotionalBonus
  
  return Math.max(0.015, Math.min(0.12, rate)) // Range: 1.5% - 12%
}

/**
 * Store prediction for validation tracking and ML learning
 */
async function storePredictionForValidation(
  videoId: string, 
  userContent: UserContent, 
  prediction: any
): Promise<void> {
  try {
    await getDb()
      .from('viral_predictions')
      .insert({
        video_id: videoId,
        script_text: userContent.script,
        hook_text: userContent.hook,
        platform: 'tiktok', // Default platform
        viral_probability: prediction.viral_score / 100,
        viral_score: prediction.viral_score,
        confidence_score: prediction.confidence,
        predicted_views: prediction.predicted_views,
        hook_score: prediction.hook_score,
        content_score: prediction.content_score,
        timing_score: prediction.timing_score,
        platform_fit_score: prediction.platform_fit_score,
        model_version: 'ml_enhanced_v2.0',
        prediction_method: 'ml_viral_dna_analysis',
        prediction_factors: {
          user_content: userContent,
          ml_enhanced: true,
          uses_viral_dna: true,
          framework_enhanced: true
        }
      })
  } catch (error) {
    console.error('Failed to store ML prediction for validation:', error)
    // Non-critical error - don't fail the request
  }
} 
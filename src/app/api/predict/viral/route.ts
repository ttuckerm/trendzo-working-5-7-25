import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractKnowledge, type VideoInput } from '@/lib/services/gppt/knowledge-extraction-engine'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

interface PredictionInput {
  script: string                                        // Video script/content plan (50-5000 chars)
  platform: 'tiktok' | 'youtube' | 'instagram'         // Target platform
  niche: string                                         // e.g., 'personal-finance'
  estimatedDuration?: number                            // seconds (optional)
  creatorFollowers?: number                             // Optional: for DPS calculation (default 10000)
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const input: PredictionInput = await req.json()

    // VALIDATION: Script length (PRD requirement: 50-5000 chars)
    if (!input.script || input.script.length < 50) {
      return NextResponse.json(
        { success: false, error: 'Script must be at least 50 characters' },
        { status: 400 }
      )
    }

    if (input.script.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Script must not exceed 5000 characters' },
        { status: 400 }
      )
    }

    // VALIDATION: Platform
    if (!['tiktok', 'youtube', 'instagram'].includes(input.platform)) {
      return NextResponse.json(
        { success: false, error: 'Platform must be one of: tiktok, youtube, instagram' },
        { status: 400 }
      )
    }

    // VALIDATION: Niche
    if (!input.niche || typeof input.niche !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Niche is required' },
        { status: 400 }
      )
    }

    console.log('🔮 FEAT-070: Starting viral prediction')
    console.log(`   Niche: ${input.niche}, Platform: ${input.platform}`)
    console.log(`   Script length: ${input.script.length} chars`)

    // Generate script hash for deduplication (PRD requirement)
    const scriptHash = crypto.createHash('sha256').update(input.script).digest('hex')

    // Extract user info for rate limiting (PRD requirement)
    const userId = null // TODO: Get from auth.uid() once auth implemented
    const userIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // RATE LIMITING: Check for duplicate script in last 24 hours (PRD requirement)
    const { data: recentPrediction } = await supabase
      .from('predictions')
      .select('*')
      .eq('script_hash', scriptHash)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (recentPrediction) {
      console.log('📦 Returning cached prediction (duplicate script)')
      return NextResponse.json({
        success: true,
        cached: true,
        prediction: {
          predicted_dps_score: recentPrediction.predicted_dps,
          predicted_classification: recentPrediction.predicted_classification,
          confidence: recentPrediction.confidence,
          viral_probability: recentPrediction.viral_probability || recentPrediction.confidence,
          pattern_based_score: recentPrediction.pattern_based_score || 0,
          novelty_bonus: recentPrediction.novelty_bonus || 0,
          confidence_factor: recentPrediction.confidence_factor || recentPrediction.confidence,
          top_matching_patterns: recentPrediction.top_pattern_matches || [],
          viral_elements_detected: recentPrediction.viral_elements_detected || { hooks: [], triggers: [], structure: '' },
          recommendations: recentPrediction.recommendations || [],
          prediction_id: recentPrediction.id,
          patterns_analyzed: recentPrediction.patterns_analyzed || 0,
          timestamp: recentPrediction.created_at
        }
      })
    }

    // RATE LIMITING: Check hourly limit (PRD requirement: 10/hour for free users)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('predictions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId || 'anonymous')
      .gte('created_at', oneHourAgo)

    if (count && count >= 10) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Maximum 10 predictions per hour.' },
        { status: 429 }
      )
    }

    console.log('✅ Validation and rate limiting passed')

    // STEP 1: Extract Knowledge Using FEAT-060
    console.log('📊 Step 1: Extracting knowledge from script...')

    // Create mock video object for extraction
    const mockVideo: VideoInput = {
      video_id: `prediction-${Date.now()}`,
      transcript: input.script,
      caption: input.script.substring(0, 150),
      dps_score: 0, // Will be predicted
      classification: 'normal', // Default, will be updated
      engagement_metrics: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0
      },
      creator_metadata: {
        followers: input.creatorFollowers || 10000,
        username: 'test_user'
      }
    }

    const extraction = await extractKnowledge(mockVideo)
    console.log('✅ Knowledge extracted:', {
      hooks: extraction.consensus_insights.viral_hooks.length,
      triggers: extraction.consensus_insights.emotional_triggers.length,
      confidence: extraction.confidence_score
    })

    // STEP 2: Match Against Viral Patterns (FEAT-003)
    console.log('🧬 Step 2: Matching against viral patterns...')
    const { data: patterns, error: patternError } = await supabase
      .from('viral_patterns')
      .select('*')
      .eq('niche', input.niche)
      .gte('avg_dps_score', 70) // Only use viral patterns
      .order('avg_dps_score', { ascending: false })

    if (patternError) throw patternError

    console.log(`📋 Found ${patterns?.length || 0} viral patterns for ${input.niche}`)

    // Calculate pattern match scores
    const patternMatches = patterns?.map(pattern => {
      const matchScore = calculatePatternMatch(
        extraction.consensus_insights,
        pattern
      )
      return {
        pattern_id: pattern.id,
        pattern_type: pattern.pattern_type,
        pattern_value: pattern.pattern_value,
        match_score: matchScore,
        pattern_dps: pattern.avg_dps_score
      }
    }) || []

    // Get top 5 matching patterns
    const topMatches = patternMatches
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5)

    console.log('🎯 Top pattern matches:', topMatches.map(m =>
      `${m.pattern_type}: ${m.match_score.toFixed(2)}`
    ))

    // STEP 3: Calculate Predicted DPS Score
    console.log('📈 Step 3: Calculating predicted DPS...')

    // Weighted average of matching patterns
    const patternBasedScore = topMatches.length > 0
      ? topMatches.reduce((sum, match) =>
          sum + (match.pattern_dps * match.match_score), 0
        ) / topMatches.reduce((sum, match) => sum + match.match_score, 0)
      : 50 // Default to medium

    // Adjust based on LLM confidence and novelty
    const noveltyBonus = extraction.consensus_insights.novelty_score > 7
      ? 5 : 0
    const confidenceFactor = extraction.confidence_score

    const predictedDPS = Math.round(
      (patternBasedScore * confidenceFactor) + noveltyBonus
    )

    // Classify prediction
    const predictedClassification =
      predictedDPS >= 80 ? 'mega-viral' :
      predictedDPS >= 70 ? 'viral' :
      predictedDPS >= 50 ? 'good' : 'normal'

    // Calculate prediction confidence
    const predictionConfidence = calculatePredictionConfidence(
      topMatches,
      extraction.confidence_score,
      patterns?.length || 0
    )

    // STEP 4: Generate Recommendations
    const recommendations = generateRecommendations(
      extraction.consensus_insights,
      topMatches,
      predictedDPS
    )

    // Calculate viral probability (PRD requirement)
    const viralProbability = predictedDPS >= 70
      ? Math.min(0.95, (predictedDPS - 70) / 30 + 0.5)
      : (predictedDPS / 70) * 0.5

    // STEP 5: Store Prediction for Validation (PRD requirement)
    const processingTime = Date.now() - startTime

    const { data: savedPrediction, error: saveError } = await supabase
      .from('predictions')
      .insert({
        // Input data
        script: input.script,
        platform: input.platform,
        niche: input.niche,
        estimated_duration: input.estimatedDuration,
        creator_followers: input.creatorFollowers || 10000,

        // Prediction results
        predicted_dps: predictedDPS,
        predicted_classification: predictedClassification,
        confidence: predictionConfidence,
        viral_probability: viralProbability,

        // Breakdown scores
        pattern_based_score: Math.round(patternBasedScore),
        novelty_bonus: noveltyBonus,
        confidence_factor: confidenceFactor,

        // Insights
        extraction_insights: extraction.consensus_insights,
        top_pattern_matches: topMatches,
        viral_elements_detected: {
          hooks: extraction.consensus_insights.viral_hooks || [],
          triggers: extraction.consensus_insights.emotional_triggers || [],
          structure: extraction.consensus_insights.content_structure || 'unknown'
        },

        // Recommendations
        recommendations: recommendations,

        // Metadata (PRD requirement)
        user_id: userId || 'anonymous',
        user_ip: userIp,
        script_hash: scriptHash,
        patterns_analyzed: patterns?.length || 0,
        processing_time_ms: processingTime,

        created_at: new Date().toISOString()
      })
      .select()
      .single()

    console.log('💾 Prediction saved:', savedPrediction?.id)
    console.log(`⏱️  Total processing time: ${processingTime}ms`)

    // Return prediction (PRD-compliant response format)
    return NextResponse.json({
      success: true,
      prediction: {
        // Main prediction
        predicted_dps_score: predictedDPS,
        predicted_classification: predictedClassification,
        confidence: predictionConfidence,
        viral_probability: Math.round(viralProbability * 10000) / 10000,

        // Breakdown
        pattern_based_score: Math.round(patternBasedScore),
        novelty_bonus: noveltyBonus,
        confidence_factor: Math.round(confidenceFactor * 100) / 100,

        // Insights
        top_matching_patterns: topMatches.slice(0, 5), // PRD: top 5 patterns
        viral_elements_detected: {
          hooks: extraction.consensus_insights.viral_hooks || [],
          triggers: extraction.consensus_insights.emotional_triggers || [],
          structure: extraction.consensus_insights.content_structure || 'unknown'
        },

        // Recommendations
        recommendations: recommendations,

        // Metadata
        prediction_id: savedPrediction?.id,
        patterns_analyzed: patterns?.length || 0,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ FEAT-070 Prediction error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate viral prediction',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// Helper: Calculate pattern match score
function calculatePatternMatch(
  insights: any,
  pattern: any
): number {
  let score = 0

  // Safety check
  if (!pattern.pattern_value || !insights) return 0

  const patternValue = pattern.pattern_value.toLowerCase()

  // Check hooks
  if (insights.viral_hooks?.length > 0) {
    const hooksMatch = insights.viral_hooks.some((hook: string) =>
      hook?.toLowerCase().includes(patternValue) ||
      patternValue.includes(hook?.toLowerCase() || '')
    )
    if (hooksMatch) score += 0.4
  }

  // Check triggers
  if (insights.emotional_triggers?.length > 0) {
    const triggersMatch = insights.emotional_triggers.some((trigger: string) =>
      trigger?.toLowerCase().includes(patternValue) ||
      patternValue.includes(trigger?.toLowerCase() || '')
    )
    if (triggersMatch) score += 0.3
  }

  // Check content structure
  if (insights.content_structure) {
    const structureMatch = insights.content_structure
      .toLowerCase()
      .includes(patternValue)
    if (structureMatch) score += 0.2
  }

  // Check pattern match field
  if (insights.pattern_match) {
    const patternMatchField = insights.pattern_match
      .toLowerCase()
      .includes(patternValue)
    if (patternMatchField) score += 0.1
  }

  return score
}

// Helper: Calculate prediction confidence
function calculatePredictionConfidence(
  topMatches: any[],
  extractionConfidence: number,
  totalPatterns: number
): number {
  // Base confidence from LLM extraction
  let confidence = extractionConfidence

  // Boost if we have strong pattern matches
  if (topMatches.length > 0) {
    const avgMatchScore = topMatches.reduce((sum, m) => sum + m.match_score, 0) / topMatches.length
    confidence *= (0.5 + avgMatchScore * 0.5) // Blend extraction + patterns
  }

  // Reduce confidence if we have few patterns to compare against
  if (totalPatterns < 10) {
    confidence *= 0.8 // Low pattern count = less reliable
  }

  return Math.round(confidence * 100) / 100
}

// Helper: Generate recommendations
function generateRecommendations(
  insights: any,
  topMatches: any[],
  predictedDPS: number
): string[] {
  const recommendations: string[] = []

  // Hook recommendations
  if (insights.viral_hooks.length === 0) {
    recommendations.push('❌ Add a strong hook in the first 3 seconds to grab attention')
  } else if (insights.viral_hooks.length === 1) {
    recommendations.push('⚠️ Consider adding a secondary hook to reinforce engagement')
  }

  // Emotional trigger recommendations
  if (insights.emotional_triggers.length < 2) {
    recommendations.push('❌ Incorporate more emotional triggers (curiosity, FOMO, shock)')
  }

  // Pattern match recommendations
  if (topMatches.length > 0 && topMatches[0].match_score < 0.5) {
    recommendations.push(`⚠️ Weak pattern match. Consider incorporating elements from: ${topMatches[0].pattern_value}`)
  }

  // DPS-based recommendations
  if (predictedDPS < 70) {
    recommendations.push('❌ Prediction below viral threshold (70). Review hooks and structure.')
  } else if (predictedDPS >= 70 && predictedDPS < 80) {
    recommendations.push('✅ Good viral potential! Minor tweaks could push to mega-viral.')
  } else {
    recommendations.push('🎉 Strong mega-viral potential! This script is ready.')
  }

  // Novelty recommendations
  if (insights.novelty_score < 5) {
    recommendations.push('⚠️ Content feels derivative. Add unique angle or fresh perspective.')
  }

  return recommendations
}

/**
 * FEAT-007: Pre-Content Prediction Service (Main Orchestrator)
 * Coordinates all sub-services to predict viral success before filming
 */

import { createClient } from '@supabase/supabase-js';
import {
  PreContentPredictionRequest,
  PreContentPredictionResponse,
  PreContentPredictionRecord,
} from '@/types/pre-content-prediction';
import { extractIdeaLegos } from './idea-legos-extractor';
import { getLLMConsensusScore } from './llm-consensus';
import { findMatchingPatterns } from './pattern-matcher';
import { predictPerformance } from './dps-predictor';
import { generateRecommendations } from './recommendations-generator';
import {
  calculateTierProbabilities,
  getMostLikelyTier,
  getTierConfidence,
  generateTierReasoning,
  classifyDPSToTier,
  type ViralTier,
} from '@/lib/utils/tier-classifier';

// ============================================================================
// Configuration
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const FEATURE_FLAG = 'FF-PreContentAnalyzer-v1';

// ============================================================================
// Main Prediction Pipeline
// ============================================================================

/**
 * Execute full pre-content prediction pipeline
 * Steps:
 * A. Extract Idea Legos
 * B. Pattern matching
 * C. Multi-LLM consensus scoring
 * D. DPS prediction
 * E. Generate recommendations
 */
export async function predictPreContentSuccess(
  request: PreContentPredictionRequest
): Promise<PreContentPredictionResponse> {
  const startTime = Date.now();

  try {
    // ========================================================================
    // Step A: Extract 7 Idea Legos from script using GPT-4
    // ========================================================================
    console.log('[PreContent] Step A: Extracting Idea Legos...');
    const ideaLegos = await extractIdeaLegos(request.script, request.storyboard);

    // ========================================================================
    // Step B: Compare extracted Legos against viral_patterns table
    // ========================================================================
    console.log('[PreContent] Step B: Matching patterns...');
    const patternMatchingResult = await findMatchingPatterns(
      ideaLegos,
      request.niche,
      request.platform
    );

    // ========================================================================
    // Step C: Multi-LLM Consensus Scoring (parallel calls)
    // Includes FFmpeg planned visual specifications if provided
    // ========================================================================
    console.log('[PreContent] Step C: Getting LLM consensus scores...');
    const llmConsensus = await getLLMConsensusScore(
      request.script,
      request.platform,
      request.niche,
      request.plannedVisuals
    );

    // ========================================================================
    // Step D: Predict DPS Score
    // ========================================================================
    console.log('[PreContent] Step D: Predicting DPS...');
    const { predictedDPS, estimates } = await predictPerformance(
      patternMatchingResult.overallScore,
      llmConsensus.consensusScore,
      request.niche,
      request.platform,
      request.creatorFollowers
    );

    // ========================================================================
    // Step E: Generate Recommendations
    // ========================================================================
    console.log('[PreContent] Step E: Generating recommendations...');
    const recommendations = generateRecommendations(
      ideaLegos,
      patternMatchingResult.topPatterns,
      patternMatchingResult.overallScore
    );

    // ========================================================================
    // NEW: Calculate Tier-Based Classification
    // ========================================================================
    
    // Count how many Idea Legos were successfully matched
    const patternLegoMatchCount = Object.keys(ideaLegos).filter(
      key => ideaLegos[key as keyof typeof ideaLegos] && 
             ideaLegos[key as keyof typeof ideaLegos].trim().length > 0
    ).length;

    // Calculate tier probabilities
    const tierProbabilities = calculateTierProbabilities(
      patternMatchingResult.overallScore,
      llmConsensus.consensusScore,
      patternLegoMatchCount
    );

    // Get predicted tier (most likely)
    const predictedTier = getMostLikelyTier(tierProbabilities);

    // Get confidence in predicted tier
    const tierConfidence = getTierConfidence(tierProbabilities);

    // Generate reasoning
    const topFramework = patternMatchingResult.topPatterns[0]?.description || 'viral patterns';
    const reasoning = generateTierReasoning(
      predictedTier,
      patternLegoMatchCount,
      7, // Total Idea Legos
      topFramework
    );

    // ========================================================================
    // Calculate legacy fields (for backward compatibility)
    // ========================================================================
    const predictedViralScore = Math.round(
      (patternMatchingResult.overallScore * 0.4) +
      (llmConsensus.consensusScore * 0.6)
    );

    const response: PreContentPredictionResponse = {
      // NEW TIER-BASED FIELDS
      predictedTier,
      confidence: tierConfidence,
      tierProbabilities,
      reasoning,

      // LEGACY FIELDS (deprecated but kept for backward compatibility)
      predictedViralScore,
      predictedDPS,

      predictions: estimates,
      breakdown: {
        patternMatchScore: patternMatchingResult.overallScore,
        llmConsensusScore: llmConsensus.consensusScore,
        llmScores: llmConsensus.scores,
      },
      ideaLegos,
      recommendations,
      topMatchingPatterns: patternMatchingResult.topPatterns,
    };

    // ========================================================================
    // Store prediction in database for proprietary training data
    // ========================================================================
    await storePrediction(request, response);

    const duration = Date.now() - startTime;
    console.log(`[PreContent] ✓ Prediction complete in ${duration}ms`);

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[PreContent] ✗ Prediction failed after ${duration}ms:`, error);
    throw error;
  }
}

// ============================================================================
// Database Storage
// ============================================================================

/**
 * Store prediction in database for future analysis and training
 */
async function storePrediction(
  request: PreContentPredictionRequest,
  response: PreContentPredictionResponse
): Promise<void> {
  try {
    // Count Lego matches
    const patternLegoMatchCount = Object.keys(response.ideaLegos).filter(
      key => response.ideaLegos[key as keyof typeof response.ideaLegos] && 
             response.ideaLegos[key as keyof typeof response.ideaLegos].trim().length > 0
    ).length;

    const record: Omit<PreContentPredictionRecord, 'id' | 'created_at' | 'updated_at'> = {
      script: request.script,
      storyboard: request.storyboard,
      niche: request.niche,
      platform: request.platform,
      creator_followers: request.creatorFollowers,
      
      // NEW TIER-BASED FIELDS
      predicted_tier: response.predictedTier,
      tier_probabilities: response.tierProbabilities,
      tier_confidence: response.confidence,
      tier_reasoning: response.reasoning,
      pattern_lego_match_count: patternLegoMatchCount,
      
      // LEGACY FIELDS (deprecated)
      predicted_viral_score: response.predictedViralScore,
      predicted_dps: response.predictedDPS,
      
      confidence: response.confidence,
      llm_scores: response.breakdown.llmScores,
      llm_consensus_score: response.breakdown.llmConsensusScore,
      pattern_match_score: response.breakdown.patternMatchScore,
      top_matching_patterns: response.topMatchingPatterns,
      idea_legos: response.ideaLegos,
      predictions: response.predictions,
      recommendations: response.recommendations,
      feature_flag: FEATURE_FLAG,
    };

    const { error } = await supabase
      .from('pre_content_predictions')
      .insert(record);

    if (error) {
      console.error('Failed to store prediction:', error);
      // Don't throw - storage failure shouldn't break the prediction
    } else {
      console.log('[PreContent] Prediction stored successfully');
    }
  } catch (error) {
    console.error('Error storing prediction:', error);
    // Continue even if storage fails
  }
}

// ============================================================================
// Batch Prediction (for bulk analysis)
// ============================================================================

/**
 * Predict multiple scripts in batch
 * Useful for A/B testing different script variations
 */
export async function batchPredictPreContent(
  requests: PreContentPredictionRequest[]
): Promise<PreContentPredictionResponse[]> {
  console.log(`[PreContent] Starting batch prediction for ${requests.length} scripts`);

  // Process in parallel for speed
  const results = await Promise.allSettled(
    requests.map(req => predictPreContentSuccess(req))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`Batch prediction failed for script ${index}:`, result.reason);
      throw result.reason;
    }
  });
}

// ============================================================================
// Update Prediction Accuracy (when actual content is published)
// ============================================================================

/**
 * Update prediction with actual performance data
 * Allows us to measure prediction accuracy over time
 */
export async function updatePredictionWithActual(
  predictionId: string,
  actualContentVideoId: string,
  actualDPS: number
): Promise<void> {
  try {
    // Classify actual DPS into tier
    const actualTier = classifyDPSToTier(actualDPS);

    // Get the predicted tier to check if prediction was correct
    const { data: prediction, error: fetchError } = await supabase
      .from('pre_content_predictions')
      .select('predicted_tier')
      .eq('id', predictionId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch prediction: ${fetchError.message}`);
    }

    // Check if tier prediction was correct
    const tierPredictionCorrect = prediction?.predicted_tier === actualTier;

    const { error } = await supabase
      .from('pre_content_predictions')
      .update({
        actual_content_video_id: actualContentVideoId,
        actual_dps: actualDPS,
        actual_tier: actualTier,
        tier_prediction_correct: tierPredictionCorrect,
      })
      .eq('id', predictionId);

    if (error) {
      throw new Error(`Failed to update prediction: ${error.message}`);
    }

    console.log(`[PreContent] Updated prediction ${predictionId} with actual DPS: ${actualDPS}, tier: ${actualTier}, correct: ${tierPredictionCorrect}`);
  } catch (error) {
    console.error('Error updating prediction accuracy:', error);
    throw error;
  }
}

// ============================================================================
// Analytics
// ============================================================================

/**
 * Get prediction accuracy statistics (tier-based)
 */
export async function getPredictionAccuracyStats(
  niche?: string,
  platform?: string
): Promise<{
  totalPredictions: number;
  predictionsWithActuals: number;
  
  // NEW: Tier-based accuracy metrics
  tierExactMatches: number;
  tierAccuracyPercentage: number;
  tierCloseMatches: number;
  tierCloseAccuracyPercentage: number;
  avgTierConfidence: number;
  avgLegoMatches: number;
  
  // LEGACY: DPS-based accuracy (deprecated)
  avgPredictionError: number;
  predictionCorrelation: number;
  
  // Tier distribution
  tierDistribution: {
    predicted: {
      mega_viral: number;
      hyper_viral: number;
      viral: number;
      strong: number;
      average: number;
    };
    actual: {
      mega_viral: number;
      hyper_viral: number;
      viral: number;
      strong: number;
      average: number;
    };
  };
}> {
  try {
    let query = supabase.from('prediction_accuracy_stats').select('*');

    if (niche) {
      query = query.eq('niche', niche);
    }
    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return {
        totalPredictions: 0,
        predictionsWithActuals: 0,
        tierExactMatches: 0,
        tierAccuracyPercentage: 0,
        tierCloseMatches: 0,
        tierCloseAccuracyPercentage: 0,
        avgTierConfidence: 0,
        avgLegoMatches: 0,
        avgPredictionError: 0,
        predictionCorrelation: 0,
        tierDistribution: {
          predicted: {
            mega_viral: 0,
            hyper_viral: 0,
            viral: 0,
            strong: 0,
            average: 0,
          },
          actual: {
            mega_viral: 0,
            hyper_viral: 0,
            viral: 0,
            strong: 0,
            average: 0,
          },
        },
      };
    }

    return {
      totalPredictions: data.total_predictions,
      predictionsWithActuals: data.predictions_with_actuals,
      
      // Tier-based accuracy
      tierExactMatches: data.tier_exact_matches || 0,
      tierAccuracyPercentage: parseFloat(data.tier_accuracy_percentage || 0),
      tierCloseMatches: data.tier_close_matches || 0,
      tierCloseAccuracyPercentage: parseFloat(data.tier_close_accuracy_percentage || 0),
      avgTierConfidence: parseFloat(data.avg_tier_confidence || 0),
      avgLegoMatches: parseFloat(data.avg_lego_matches || 0),
      
      // Legacy DPS accuracy
      avgPredictionError: parseFloat(data.avg_dps_error || 0),
      predictionCorrelation: parseFloat(data.dps_correlation || 0),
      
      // Tier distribution
      tierDistribution: {
        predicted: {
          mega_viral: data.predicted_mega_viral_count || 0,
          hyper_viral: data.predicted_hyper_viral_count || 0,
          viral: data.predicted_viral_count || 0,
          strong: data.predicted_strong_count || 0,
          average: data.predicted_average_count || 0,
        },
        actual: {
          mega_viral: data.actual_mega_viral_count || 0,
          hyper_viral: data.actual_hyper_viral_count || 0,
          viral: data.actual_viral_count || 0,
          strong: data.actual_strong_count || 0,
          average: data.actual_average_count || 0,
        },
      },
    };
  } catch (error) {
    console.error('Failed to get accuracy stats:', error);
    throw error;
  }
}

/**
 * Get recent predictions
 */
export async function getRecentPredictions(
  limit: number = 10,
  niche?: string,
  platform?: string
): Promise<PreContentPredictionRecord[]> {
  try {
    let query = supabase
      .from('pre_content_predictions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (niche) {
      query = query.eq('niche', niche);
    }
    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch predictions: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get recent predictions:', error);
    throw error;
  }
}

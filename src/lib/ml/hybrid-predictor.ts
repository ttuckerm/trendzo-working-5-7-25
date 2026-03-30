/**
 * Hybrid Predictor - XGBoost + GPT-4 Pipeline
 *
 * Orchestrates the complete prediction pipeline:
 * 1. Feature extraction (119 features)
 * 2. XGBoost prediction (baseline)
 * 3. GPT-4 refinement (adjustment)
 * 4. Final prediction (combined)
 */

import { extractFeaturesFromVideo, getFeatureNames } from '../services/feature-extraction';
import type { FeatureExtractionInput } from '../services/feature-extraction/types';
import { predictWithXGBoost, getTopFeatures, isModelAvailable } from './xgboost-predictor';
import { refineWithGPT4, shouldRefineWithGPT4 } from './gpt-refinement-service';
import type { GPTRefinementInput } from './gpt-refinement-service';

export interface HybridPredictionInput {
  // Option 1: Provide video ID (if already in database)
  videoId?: string;

  // Option 2: Provide transcript and metadata directly
  transcript?: string;
  title?: string;
  description?: string;
  metadata?: {
    viewsCount?: number;
    likesCount?: number;
    commentsCount?: number;
    sharesCount?: number;
    savesCount?: number;
    videoDurationSeconds?: number;
    uploadedAt?: string;
    hashtags?: string[];
  };

  // Options
  skipGPTRefinement?: boolean;     // Skip GPT-4 (faster, cheaper)
  forceGPTRefinement?: boolean;    // Always use GPT-4 (higher quality)
  useQuickAnalysis?: boolean;      // Use faster GPT-4 analysis
}

export interface HybridPredictionOutput {
  success: boolean;
  error?: string;

  // Final prediction
  finalDpsPrediction: number;
  confidence: number; // 0-1

  // Breakdown
  predictionBreakdown: {
    xgboostBase: number;
    gptAdjustment: number;
    finalScore: number;
  };

  // XGBoost analysis
  topFeatures: Array<{
    name: string;
    importance: number;
    value: number;
  }>;

  predictionInterval?: {
    lower: number;
    upper: number;
  };

  // GPT-4 qualitative analysis (if used)
  qualitativeAnalysis?: {
    viralHooks: string[];
    weaknesses: string[];
    recommendations: string[];
    reasoning: string;
    overallAssessment?: string;
  };

  // Metadata
  modelUsed: 'xgboost' | 'hybrid';
  featureCount: number;
  processingTimeMs: number;
  llmCostUsd: number;
  timestamp: string;
}

/**
 * Load video from Admin Lab video_files table (NO metrics contamination)
 */
async function loadVideoForAdminLab(videoId: string): Promise<FeatureExtractionInput> {
  const { createClient } = await import('@supabase/supabase-js');
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = await import('../env');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: video, error } = await supabase
    .from('video_files')
    .select('*')
    .eq('id', videoId)
    .single();

  if (error || !video) {
    throw new Error(`Video not found in video_files: ${videoId}`);
  }

  console.log(`   ⚠️ Admin Lab Mode: NO metrics access (clean prediction)`);

  return {
    videoId: video.id,
    transcript: '', // TODO: Extract from MP4 or TikTok URL (Phase 0: provide via input.transcript)
    title: '',
    description: '',
    // NO METRICS - predictor cannot see engagement data
    videoDurationSeconds: undefined,
    uploadedAt: video.created_at,
  };
}

/**
 * Main hybrid prediction function
 */
export async function predictVirality(
  input: HybridPredictionInput
): Promise<HybridPredictionOutput> {
  const startTime = Date.now();

  try {
    // Step 1: Extract features
    console.log('\n🎯 Starting Hybrid Viral Prediction...');
    console.log('   Step 1: Feature Extraction');

    let featureExtractionInput: FeatureExtractionInput;

    if (input.videoId) {
      // Check if Admin Lab mode (videoId is UUID from video_files table)
      const isAdminLabMode = process.env.ADMIN_LAB_MODE === 'phase0' ||
                             input.videoId.length === 36; // UUID format (36 chars with dashes)

      if (isAdminLabMode) {
        // ADMIN LAB: Load from video_files table (NO METRICS)
        featureExtractionInput = await loadVideoForAdminLab(input.videoId);

        // Override with provided transcript if available
        if (input.transcript) {
          featureExtractionInput.transcript = input.transcript;
        }
        if (input.title) {
          featureExtractionInput.title = input.title;
        }
        if (input.description) {
          featureExtractionInput.description = input.description;
        }
      } else {
        // LEGACY: Load from scraped_videos table (HAS METRICS - for backward compatibility)
        const { createClient } = await import('@supabase/supabase-js');
        const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = await import('../env');
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        const { data: video, error } = await supabase
          .from('scraped_videos')
          .select('*')
          .eq('video_id', input.videoId)
          .single();

        if (error || !video) {
          throw new Error(`Video not found: ${input.videoId}`);
        }

        featureExtractionInput = {
          videoId: video.video_id,
          transcript: video.transcript_text || '',
          title: video.title || '',
          description: video.description || '',
          viewsCount: video.views_count,
          likesCount: video.likes_count,
          commentsCount: video.comments_count,
          sharesCount: video.shares_count,
          savesCount: video.saves_count,
          videoDurationSeconds: video.video_duration,
          uploadedAt: video.create_time,
          dpsScore: video.dps_score,
        };
      }
    } else {
      // Use provided data
      if (!input.transcript) {
        throw new Error('Either videoId or transcript is required');
      }

      featureExtractionInput = {
        videoId: 'custom_' + Date.now(),
        transcript: input.transcript,
        title: input.title || 'Untitled',
        description: input.description || '',
        ...input.metadata,
      };
    }

    // Extract features
    const featureResult = await extractFeaturesFromVideo(featureExtractionInput);

    if (!featureResult.success || !featureResult.features) {
      throw new Error('Feature extraction failed');
    }

    const features = featureResult.features;
    console.log(`   ✅ Extracted ${featureResult.featureCount} features`);

    // Step 2: Get feature vector
    const { flattenFeatureVector } = await import('../services/feature-extraction');
    const featureVector = flattenFeatureVector(features);
    const featureNames = getFeatureNames();

    // Step 3: XGBoost prediction
    console.log('   Step 2: XGBoost Prediction');

    if (!isModelAvailable()) {
      throw new Error('XGBoost model not found. Please train the model first:\n   python scripts/train-xgboost-model.py');
    }

    const xgboostResult = await predictWithXGBoost({ featureVector });
    console.log(`   ✅ Base prediction: ${xgboostResult.baseDpsPrediction.toFixed(1)} DPS (confidence: ${(xgboostResult.confidence * 100).toFixed(0)}%)`);

    // Get top features
    const topFeatures = getTopFeatures(featureVector, featureNames, 10);

    // Step 4: Determine if GPT-4 refinement is needed
    let gptResult: Awaited<ReturnType<typeof refineWithGPT4>> | null = null;
    let useGPT = false;

    if (input.skipGPTRefinement) {
      console.log('   Step 3: GPT-4 Refinement [SKIPPED]');
    } else if (input.forceGPTRefinement || shouldRefineWithGPT4(xgboostResult.confidence)) {
      console.log('   Step 3: GPT-4 Refinement');
      useGPT = true;

      const gptInput: GPTRefinementInput = {
        transcript: featureExtractionInput.transcript,
        title: featureExtractionInput.title || 'Untitled',
        baseDpsPrediction: xgboostResult.baseDpsPrediction,
        xgboostConfidence: xgboostResult.confidence,
        topFeatures: xgboostResult.topFeatures.slice(0, 10),
        useQuickAnalysis: input.useQuickAnalysis,
      };

      gptResult = await refineWithGPT4(gptInput);
      console.log(`   ✅ GPT-4 adjustment: ${gptResult.adjustment > 0 ? '+' : ''}${gptResult.adjustment.toFixed(1)} DPS`);
    } else {
      console.log('   Step 3: GPT-4 Refinement [NOT NEEDED - High Confidence]');
    }

    // Step 5: Combine predictions
    const gptAdjustment = gptResult?.adjustment || 0;
    const finalDps = Math.max(0, Math.min(100, xgboostResult.baseDpsPrediction + gptAdjustment));

    // Calculate combined confidence
    let finalConfidence = xgboostResult.confidence;
    if (gptResult) {
      // Weighted average: 60% XGBoost, 40% GPT
      finalConfidence = (xgboostResult.confidence * 0.6) + ((gptResult.confidence / 100) * 0.4);

      // Reduce confidence if predictions diverge significantly
      if (Math.abs(gptAdjustment) > 15) {
        finalConfidence *= 0.8;
      }
    }

    const processingTimeMs = Date.now() - startTime;

    console.log(`\n✅ Prediction complete:`);
    console.log(`   Final DPS: ${finalDps.toFixed(1)}`);
    console.log(`   Confidence: ${(finalConfidence * 100).toFixed(0)}%`);
    console.log(`   Processing time: ${processingTimeMs}ms\n`);

    return {
      success: true,
      finalDpsPrediction: finalDps,
      confidence: finalConfidence,
      predictionBreakdown: {
        xgboostBase: xgboostResult.baseDpsPrediction,
        gptAdjustment,
        finalScore: finalDps,
      },
      topFeatures: topFeatures.map(f => ({
        name: f.name,
        importance: f.importance,
        value: f.value,
      })),
      predictionInterval: xgboostResult.predictionInterval,
      qualitativeAnalysis: gptResult ? {
        viralHooks: gptResult.viralHooks,
        weaknesses: gptResult.weaknesses,
        recommendations: gptResult.recommendations,
        reasoning: gptResult.reasoning,
        overallAssessment: gptResult.overallAssessment,
      } : undefined,
      modelUsed: useGPT ? 'hybrid' : 'xgboost',
      featureCount: featureResult.featureCount || 119,
      processingTimeMs,
      llmCostUsd: gptResult?.llmCostUsd || 0,
      timestamp: new Date().toISOString(),
    };

  } catch (error: any) {
    console.error('❌ Prediction error:', error.message);

    return {
      success: false,
      error: error.message,
      finalDpsPrediction: 0,
      confidence: 0,
      predictionBreakdown: {
        xgboostBase: 0,
        gptAdjustment: 0,
        finalScore: 0,
      },
      topFeatures: [],
      modelUsed: 'xgboost',
      featureCount: 0,
      processingTimeMs: Date.now() - startTime,
      llmCostUsd: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Batch prediction for multiple videos
 */
export async function predictViralityBatch(
  inputs: HybridPredictionInput[],
  options?: {
    maxConcurrent?: number;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<HybridPredictionOutput[]> {
  const maxConcurrent = options?.maxConcurrent || 5;
  const results: HybridPredictionOutput[] = [];

  console.log(`\n🎯 Starting batch viral prediction for ${inputs.length} videos...\n`);

  for (let i = 0; i < inputs.length; i += maxConcurrent) {
    const batch = inputs.slice(i, i + maxConcurrent);

    const batchResults = await Promise.all(
      batch.map(input => predictVirality(input))
    );

    results.push(...batchResults);

    if (options?.onProgress) {
      options.onProgress(results.length, inputs.length);
    }
  }

  const successCount = results.filter(r => r.success).length;
  const totalCost = results.reduce((sum, r) => sum + r.llmCostUsd, 0);
  const avgDps = results.filter(r => r.success).reduce((sum, r) => sum + r.finalDpsPrediction, 0) / successCount;

  console.log(`\n✅ Batch prediction complete:`);
  console.log(`   Success: ${successCount}/${inputs.length}`);
  console.log(`   Avg DPS: ${avgDps.toFixed(1)}`);
  console.log(`   Total Cost: $${totalCost.toFixed(4)}\n`);

  return results;
}

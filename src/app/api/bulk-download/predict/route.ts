/**
 * Bulk Download Prediction API
 * 
 * POST /api/bulk-download/predict - Run Kai prediction on a downloaded video
 * 
 * FIXED: Now uses KaiOrchestrator directly with all 22 components
 * and stores ~180 training features like the batch script does.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { KaiOrchestrator } from '@/lib/orchestration/kai-orchestrator';
import {
  validatePreProcessing,
  validateAllComponents,
  validatePostProcessing,
  validateStorage,
  updateProcessingStatus,
  runValidationGates,
  ProcessingStatus
} from '@/lib/orchestration/validation-gates';
import {
  evaluateTrainingReadiness,
  logTrainingReadiness,
  TRAINING_THRESHOLDS
} from '@/lib/services/training/training-quality-thresholds';
import { extractTrainingFeatures, ComponentResult } from '@/lib/services/training/feature-aggregator';
import { executeParallel } from '@/lib/orchestration/parallel-execution';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

const EXTRACTION_VERSION = '4.0-bulk-download';

interface PredictRequest {
  itemId: string;           // bulk_download_items ID
  niche?: string;           // Video niche category
  goal?: string;            // Content goal
  accountSize?: string;     // Account size bracket
}

// ============================================================================
// RUN ALL 22 COMPONENTS VIA KAI ORCHESTRATOR
// ============================================================================

async function runKaiOrchestrator(
  videoId: string,
  videoPath: string,
  transcript: string,
  niche: string,
  accountSize: string
): Promise<ComponentResult[]> {
  const kai = new KaiOrchestrator();

  const input = {
    videoId,
    transcript: transcript || '',
    title: '',
    description: '',
    hashtags: [],
    niche: niche || 'general',
    videoPath: videoPath || undefined,
    duration: 0,
    creatorFollowers: 0,
    accountSize: accountSize || 'medium'
  };

  // Execute in parallel batches (defined in parallel-execution.ts)
  return executeParallel(kai, input);
}

// ============================================================================
// POST - Run Kai prediction on a downloaded video
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: PredictRequest = await request.json();

    if (!body.itemId) {
      return NextResponse.json(
        { success: false, error: 'itemId is required' },
        { status: 400 }
      );
    }

    // Get the download item
    const { data: item, error: itemError } = await supabase
      .from('bulk_download_items')
      .select('*')
      .eq('id', body.itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { success: false, error: 'Download item not found' },
        { status: 404 }
      );
    }

    if (item.status !== 'completed' || !item.local_path) {
      return NextResponse.json(
        { success: false, error: 'Video has not been downloaded yet' },
        { status: 400 }
      );
    }

    // Check if video file exists
    if (!existsSync(item.local_path)) {
      return NextResponse.json(
        { success: false, error: 'Video file not found on disk' },
        { status: 404 }
      );
    }

    console.log(`[Bulk Predict] Running ALL 22 COMPONENTS for item ${body.itemId}`);

    const startTime = Date.now();

    // =========================================================================
    // GATE 1: PRE-PROCESSING VALIDATION
    // =========================================================================
    const preValidation = validatePreProcessing(item.local_path, item.transcript);
    
    if (!preValidation.valid) {
      console.log(`[Bulk Predict] ❌ Pre-processing validation failed`);
      
      // Store failed analysis record
      await supabase
        .from('video_analysis')
        .upsert({
          video_id: item.video_id,
          processing_status: 'validation_failed' as ProcessingStatus,
          validation_errors: preValidation.errors,
          validation_details: { preProcessing: preValidation },
          has_video_file: preValidation.hasVideoFile,
          has_transcript: preValidation.hasTranscript,
          extraction_version: EXTRACTION_VERSION
        }, { onConflict: 'video_id,extraction_version' });

      return NextResponse.json({
        success: false,
        error: 'Pre-processing validation failed',
        validation: preValidation
      }, { status: 400 });
    }

    // Run Kai Orchestrator with all 22 components
    const componentResults = await runKaiOrchestrator(
      item.video_id,
      item.local_path,
      item.transcript || '',
      body.niche || 'general',
      body.accountSize || 'medium (10K-100K)'
    );

    const processingTime = Date.now() - startTime;

    // =========================================================================
    // GATE 2: POST-COMPONENT VALIDATION
    // =========================================================================
    const componentValidations = validateAllComponents(componentResults);

    // Extract training features (~180 features)
    const trainingFeatures = extractTrainingFeatures(componentResults);
    console.log(`[Bulk Predict] Extracted ${trainingFeatures.featureCount} training features`);

    // =========================================================================
    // GATE 3: POST-PROCESSING VALIDATION
    // =========================================================================
    const postValidation = validatePostProcessing(componentValidations, trainingFeatures.featureCount);

    // Calculate final prediction (weighted average)
    const predictions = componentResults
      .filter(r => r.success && r.prediction !== undefined)
      .map(r => ({ pred: r.prediction!, conf: r.confidence || 0.5 }));

    let finalPrediction: number | null = null;
    let finalConfidence: number | null = null;
    let viralPotential = 'unknown';

    if (predictions.length > 0) {
      const totalWeight = predictions.reduce((sum, p) => sum + p.conf, 0);
      finalPrediction = predictions.reduce((sum, p) => sum + p.pred * p.conf, 0) / totalWeight;
      finalConfidence = totalWeight / predictions.length;
      
      if (finalPrediction >= 80) viralPotential = 'high';
      else if (finalPrediction >= 60) viralPotential = 'medium';
      else viralPotential = 'low';
    }

    // Get component summary
    const succeeded = componentResults.filter(r => r.success).length;
    const failed = componentResults.filter(r => !r.success && !r.skipped).length;
    const skipped = componentResults.filter(r => r.skipped).length;

    // Store video_analysis record with initial status 'processing'
    const { data: analysisData, error: analysisError } = await supabase
      .from('video_analysis')
      .upsert({
        video_id: item.video_id,
        final_dps_prediction: finalPrediction,
        final_confidence: finalConfidence,
        components_requested: componentResults.length,
        components_succeeded: succeeded,
        components_failed: failed,
        components_skipped: skipped,
        video_file_path: item.local_path,
        has_video_file: true,
        has_transcript: !!item.transcript,
        total_processing_time_ms: processingTime,
        extraction_version: EXTRACTION_VERSION,
        processing_status: 'processing' as ProcessingStatus,
        quality_score: postValidation.qualityScore,
        components_with_features: componentValidations.filter(c => c.hasNumericFeatures).length
      }, { onConflict: 'video_id,extraction_version' })
      .select('id')
      .single();

    let analysisId: string | null = null;
    if (!analysisError && analysisData) {
      analysisId = analysisData.id;

      // Store component_results
      for (const result of componentResults) {
        await supabase
          .from('component_results')
          .upsert({
            analysis_id: analysisId,
            video_id: item.video_id,
            component_id: result.componentId,
            component_name: result.componentId,
            success: result.success,
            skipped: result.skipped,
            skip_reason: result.skipReason,
            error: result.error,
            prediction: result.prediction,
            confidence: result.confidence,
            features: result.features,
            insights: result.insights,
            latency_ms: result.latency
          }, { onConflict: 'analysis_id,component_id' });
      }

      // Evaluate training readiness against quality thresholds
      const qualityScoreDecimal = postValidation.qualityScore / 100; // Convert percentage to decimal
      const trainingReadiness = evaluateTrainingReadiness(
        trainingFeatures.featureCount,
        qualityScoreDecimal,
        trainingFeatures.sources.text || false,
        succeeded
      );
      
      logTrainingReadiness(item.video_id, trainingReadiness);

      // Store training_features with training readiness evaluation
      await supabase
        .from('training_features')
        .upsert({
          video_id: item.video_id,
          analysis_id: analysisId,
          features: trainingFeatures.features,
          feature_count: trainingFeatures.featureCount,
          quality_score: qualityScoreDecimal,
          has_text_features: trainingFeatures.sources.text,
          has_ffmpeg_features: trainingFeatures.sources.ffmpeg,
          has_llm_features: trainingFeatures.sources.llm,
          has_pattern_features: trainingFeatures.sources.pattern,
          has_lego_features: trainingFeatures.sources.lego,
          has_attribute_features: trainingFeatures.sources.attribute,
          has_style_features: trainingFeatures.sources.style,
          has_hook_features: trainingFeatures.sources.hook,
          components_succeeded: succeeded,
          training_ready: trainingReadiness.isReady,
          included_in_training: trainingReadiness.isReady,
          exclusion_reasons: trainingReadiness.exclusionReasons,
          exclusion_reason: trainingReadiness.exclusionReasons.length > 0 
            ? trainingReadiness.exclusionReasons.join('; ') 
            : null,
          extraction_version: EXTRACTION_VERSION
        }, { onConflict: 'video_id,extraction_version' });

      // =========================================================================
      // GATE 4: STORAGE VALIDATION
      // =========================================================================
      const storageValidation = await validateStorage(supabase, item.video_id, analysisId);

      // Determine final processing status
      let finalStatus: ProcessingStatus = 'complete';
      const allErrors: string[] = [...postValidation.errors];

      if (!postValidation.valid) {
        finalStatus = 'incomplete';
      }
      
      if (!storageValidation.valid) {
        finalStatus = 'incomplete';
        allErrors.push(...storageValidation.errors);
      }

      // Update processing status with validation results
      await updateProcessingStatus(supabase, analysisId, finalStatus, {
        preProcessing: preValidation,
        componentValidations,
        postProcessing: postValidation,
        storage: storageValidation,
        finalStatus,
        overallValid: finalStatus === 'complete',
        allErrors,
        allWarnings: [...preValidation.warnings, ...postValidation.warnings]
      });

      console.log(`[Bulk Predict] Final processing status: ${finalStatus}`);
    }

    // Update the download item with prediction results
    const { error: updateError } = await supabase
      .from('bulk_download_items')
      .update({
        prediction_id: analysisId,
        predicted_dps: finalPrediction,
        predicted_range_low: finalPrediction ? finalPrediction * 0.85 : null,
        predicted_range_high: finalPrediction ? finalPrediction * 1.15 : null,
        confidence: finalConfidence,
        viral_potential: viralPotential,
        components_used: componentResults.filter(r => r.success).map(r => r.componentId),
        processing_time_ms: processingTime,
        prediction_data: {
          analysisId,
          components: {
            total: componentResults.length,
            succeeded,
            failed,
            skipped
          },
          trainingFeatures: {
            count: trainingFeatures.featureCount,
            sources: trainingFeatures.sources
          },
          niche: body.niche,
          accountSize: body.accountSize,
          goal: body.goal
        }
      })
      .eq('id', body.itemId);

    if (updateError) {
      console.error('[Bulk Predict] Failed to update item:', updateError);
    }

    // Determine final processing status for response
    const finalProcessingStatus: ProcessingStatus = postValidation.valid ? 'complete' : 'incomplete';
    
    // Re-evaluate training readiness for response (use local variable if available)
    const qualityScoreDecimal = postValidation.qualityScore / 100;
    const trainingReadiness = evaluateTrainingReadiness(
      trainingFeatures.featureCount,
      qualityScoreDecimal,
      trainingFeatures.sources.text || false,
      succeeded
    );
    
    const statusIcon = finalProcessingStatus === 'complete' ? '✅' : '⚠️';
    const trainingIcon = trainingReadiness.isReady ? '📊' : '⚠️';
    
    console.log(`[Bulk Predict] ${statusIcon} ${finalProcessingStatus.toUpperCase()}: ${finalPrediction?.toFixed(1)} DPS, ${trainingFeatures.featureCount} features, ${succeeded}/${componentResults.length} components`);
    console.log(`[Bulk Predict] ${trainingIcon} Training Ready: ${trainingReadiness.isReady ? 'YES' : 'NO'}`);
    if (!trainingReadiness.isReady) {
      console.log(`[Bulk Predict] Exclusion reasons: ${trainingReadiness.exclusionReasons.join('; ')}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        itemId: body.itemId,
        videoId: item.video_id,
        predictedDps: finalPrediction,
        predictedRange: finalPrediction ? [finalPrediction * 0.85, finalPrediction * 1.15] : null,
        confidence: finalConfidence,
        viralPotential,
        processingStatus: finalProcessingStatus,
        componentsUsed: componentResults.filter(r => r.success).map(r => r.componentId),
        componentStats: { total: componentResults.length, succeeded, failed, skipped },
        trainingFeatures: {
          count: trainingFeatures.featureCount,
          sources: trainingFeatures.sources
        },
        // NEW: Training readiness information
        trainingReadiness: {
          isReady: trainingReadiness.isReady,
          exclusionReasons: trainingReadiness.exclusionReasons,
          thresholdChecks: trainingReadiness.thresholdChecks,
          thresholds: TRAINING_THRESHOLDS
        },
        validation: {
          preProcessing: {
            valid: preValidation.valid,
            hasVideoFile: preValidation.hasVideoFile,
            hasTranscript: preValidation.hasTranscript,
            skippedComponents: preValidation.skippedComponents.length
          },
          postProcessing: {
            valid: postValidation.valid,
            qualityScore: postValidation.qualityScore,
            errors: postValidation.errors,
            warnings: postValidation.warnings
          }
        },
        processingTimeMs: processingTime,
        analysisId
      }
    });

  } catch (error: any) {
    console.error('[Bulk Predict] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get prediction status for an item
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'itemId is required' },
        { status: 400 }
      );
    }

    const { data: item, error } = await supabase
      .from('bulk_download_items')
      .select('id, video_id, predicted_dps, predicted_range_low, predicted_range_high, confidence, viral_potential, components_used, processing_time_ms, prediction_id, prediction_data, actual_dps, comparison_data')
      .eq('id', itemId)
      .single();

    if (error || !item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Also get training features count if available
    let featureCount = 0;
    if (item.prediction_id) {
      const { data: features } = await supabase
        .from('training_features')
        .select('feature_count')
        .eq('analysis_id', item.prediction_id)
        .single();
      if (features) featureCount = features.feature_count;
    }

    return NextResponse.json({
      success: true,
      data: {
        hasPrediction: !!item.predicted_dps,
        hasActualDps: !!item.actual_dps,
        prediction: item.predicted_dps ? {
          predictedDps: item.predicted_dps,
          range: [item.predicted_range_low, item.predicted_range_high],
          confidence: item.confidence,
          viralPotential: item.viral_potential,
          componentsUsed: item.components_used,
          processingTimeMs: item.processing_time_ms,
          predictionId: item.prediction_id,
          trainingFeaturesCount: featureCount
        } : null,
        actual: item.actual_dps ? {
          actualDps: item.actual_dps,
          comparison: item.comparison_data
        } : null
      }
    });

  } catch (error: any) {
    console.error('[Bulk Predict] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

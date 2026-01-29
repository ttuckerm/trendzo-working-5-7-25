/**
 * Canonical Prediction Pipeline
 *
 * This is the SINGLE entry point for all prediction runs.
 * It handles:
 * 1. Creating prediction_runs record in Supabase
 * 2. Running the KaiOrchestrator
 * 3. Storing component results in run_component_results
 * 4. Returning unified results
 *
 * Ticket A2: All predictions MUST go through this pipeline.
 */

import { createClient } from '@supabase/supabase-js';
import { KaiOrchestrator, VideoInput, PredictionResult } from '@/lib/orchestration/kai-orchestrator';
import {
  UnifiedGradingResult,
  EditingCoachResult,
  PackMetadata,
  ViralMechanicsStub,
  createViralMechanicsStub,
  VisualRubricResult,
  createVisualRubricStub,
} from '@/lib/rubric-engine';
import {
  runTranscriptionPipeline,
  TranscriptionResult,
  TranscriptSource,
} from '@/lib/services/transcription-pipeline';
import {
  calibratePrediction,
  logPackVTrainingFeatures,
  CalibrationInput,
  CalibrationResult,
} from '@/lib/prediction/prediction-calibrator';

// Initialize Supabase with service key for writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

export interface PredictionPipelineOptions {
  mode?: 'standard' | 'fast' | 'admin' | 'validation';
  videoFilePath?: string | null;
  transcript?: string | null;
  niche?: string | null;
  goal?: string | null;
  title?: string | null;
  description?: string | null;
  hashtags?: string[] | null;
  accountSize?: string | null;
}

/**
 * Qualitative analysis results from Pack 1, 2, 3, and V
 */
export interface QualitativeAnalysis {
  pack1: UnifiedGradingResult | null;
  pack2: EditingCoachResult | null;
  pack3: ViralMechanicsStub | null;
  packV: VisualRubricResult | null; // Visual rubric (no transcript required)
}

/**
 * Transcription status for UI display
 */
export interface TranscriptionStatus {
  source: TranscriptSource;
  confidence: number;
  processingTimeMs: number;
  skipped: boolean;
  skippedReason?: string;
  fallbackComponents?: string[];
}

export interface PipelineResult {
  success: boolean;
  run_id: string;
  video_id: string;
  predicted_dps_7d: number;
  predicted_tier_7d: string;
  confidence: number;
  components_used: string[];
  latency_ms_total: number;
  warnings: string[];
  error?: string;
  raw_result?: PredictionResult;
  // Standardized qualitative analysis with typed packs
  qualitative_analysis: QualitativeAnalysis;
  // Transcription status for UI step display
  transcription_status?: TranscriptionStatus;
  // Debug fields for transcript verification and component execution
  debug?: {
    resolved_transcript_length: number;
    resolved_transcript_preview: string; // First 120 chars
    transcript_source: TranscriptSource;
    user_transcript_length: number;
    executed_component_count: number;
    executed_component_ids: string[];
  };
  // Calibration results (Pack V + transcription status adjustments)
  calibration?: CalibrationResult;
  // Backward compatibility (legacy fields, deprecated)
  unified_grading?: UnifiedGradingResult | null;
  editing_suggestions?: EditingCoachResult | null;
}

/**
 * Run a prediction through the canonical pipeline.
 * This is the ONLY function that should be called for predictions.
 */
export async function runPredictionPipeline(
  videoId: string,
  options: PredictionPipelineOptions = {}
): Promise<PipelineResult> {
  const startTime = Date.now();
  // Use proper UUID for database compatibility
  const runId = crypto.randomUUID();
  const warnings: string[] = [];

  // Track user-provided transcript length for debugging
  const userTranscriptLength = options.transcript?.trim().length || 0;

  // Track final status for guaranteed finalization in finally block
  let finalStatus: 'completed' | 'failed' = 'failed';
  let finalResult: PipelineResult | null = null;
  let finalError: string | null = null;

  try {
    // Step 1: Create prediction_runs record
    console.log(`[Pipeline] Creating prediction_runs row for run_id=${runId}, video_id=${videoId}`);
    const { error: insertError } = await supabase
      .from('prediction_runs')
      .insert({
        id: runId,
        video_id: videoId,
        mode: options.mode || 'standard',
        status: 'running',
        started_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[Pipeline] Failed to create run record:', insertError);
      warnings.push(`DB insert warning: ${insertError.message}`);
    } else {
      console.log(`[Pipeline] ✓ Created prediction_runs row with status='running'`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2: Resolve transcript (SINGLE SOURCE OF TRUTH)
    // This transcript is used by ALL text-dependent components
    // ─────────────────────────────────────────────────────────────────────────
    let transcriptionResult: TranscriptionResult | null = null;
    let resolvedTranscript: string | undefined = undefined;
    let transcriptSource: TranscriptSource = 'none';

    // Check if user provided a valid transcript (min 10 chars)
    const userTranscript = options.transcript?.trim();
    const hasValidUserTranscript = userTranscript && userTranscript.length >= 10;

    if (hasValidUserTranscript) {
      // Use user-provided transcript
      resolvedTranscript = userTranscript;
      transcriptSource = 'user_provided';
      console.log(`[Pipeline] Using user-provided transcript (${userTranscript.length} chars)`);
    } else if (options.videoFilePath) {
      // Run transcription pipeline for auto-transcription
      console.log('[Pipeline] No valid user transcript, running transcription pipeline...');

      transcriptionResult = await runTranscriptionPipeline({
        videoPath: options.videoFilePath,
        userTranscript: userTranscript, // Pass even if short, pipeline will decide
        title: options.title,
        description: options.description,
      });

      if (transcriptionResult.transcript && transcriptionResult.transcript.length >= 10) {
        resolvedTranscript = transcriptionResult.transcript;
        transcriptSource = transcriptionResult.source;
        console.log(`[Pipeline] Transcription resolved from ${transcriptionResult.source}: ${resolvedTranscript.length} chars, confidence: ${transcriptionResult.confidence}`);
      } else {
        transcriptSource = 'none';
        console.log(`[Pipeline] No valid transcript available: ${transcriptionResult.skipped_reason || 'transcript too short'}`);
        warnings.push(`Transcription skipped: ${transcriptionResult.skipped_reason || 'no speech detected'}`);
      }
    } else {
      console.log('[Pipeline] No video file and no valid transcript - text-dependent components will be skipped');
    }

    // Log resolved transcript for debugging
    console.log(`[Pipeline] RESOLVED TRANSCRIPT: ${resolvedTranscript ? resolvedTranscript.length : 0} chars, source: ${transcriptSource}`);
    if (resolvedTranscript) {
      console.log(`[Pipeline] Preview: "${resolvedTranscript.substring(0, 120)}..."`);
    }

    // Step 3: Prepare input for orchestrator
    const videoInput: VideoInput = {
      videoId: videoId,
      transcript: resolvedTranscript,
      videoPath: options.videoFilePath || undefined,
      niche: options.niche || undefined,
      goal: options.goal || undefined,
      title: options.title || undefined,
      description: options.description || undefined,
      hashtags: options.hashtags || undefined,
    };

    // Step 4: Run prediction
    const orchestrator = new KaiOrchestrator();
    const workflow = resolvedTranscript || options.videoFilePath ? 'content-planning' : 'standard';

    console.log(`[Pipeline] Running prediction for video ${videoId} with workflow: ${workflow}`);

    const result = await orchestrator.predict(videoInput, workflow as any);

    const latencyMs = Date.now() - startTime;

    // Step 5: Mark success - actual DB update happens in finally block
    finalStatus = result.success ? 'completed' : 'failed';
    if (!result.success) {
      finalError = 'Orchestrator returned success=false';
    }
    console.log(`[Pipeline] Orchestrator finished: success=${result.success}, dps=${result.dps}`);

    // NOTE: We no longer do the main status update here - it's consolidated in the finally block
    // This ensures the update always happens even if later code throws

    // Step 6: Store component results and extract Pack 1/2/V data
    let unifiedGrading: UnifiedGradingResult | null = null;
    let editingSuggestions: EditingCoachResult | null = null;
    let visualRubric: VisualRubricResult | null = null;
    let executedComponentCount = 0;
    const executedComponentIds: string[] = [];

    // Log path execution details
    console.log(`[Pipeline] Orchestrator returned ${result.paths?.length || 0} paths`);
    console.log(`[Pipeline] Components used: ${result.componentsUsed?.join(', ') || 'none'}`);

    if (result.paths && Array.isArray(result.paths)) {
      for (const pathResult of result.paths) {
        console.log(`[Pipeline] Path '${pathResult.path}': ${pathResult.results?.length || 0} components, success=${pathResult.success}`);

        if (pathResult.results && Array.isArray(pathResult.results)) {
          for (const componentResult of pathResult.results) {
            executedComponentCount++;
            executedComponentIds.push(componentResult.componentId);

            console.log(`[Pipeline]   Component '${componentResult.componentId}': success=${componentResult.success}, error=${componentResult.error || 'none'}`);

            // Extract Pack 1 result (with _meta from runner)
            if (componentResult.componentId === 'unified-grading' && componentResult.success) {
              unifiedGrading = componentResult.features as UnifiedGradingResult;
              console.log('[Pipeline]   ✓ Extracted Pack 1 (unified-grading) result');
            }
            // Extract Pack 2 result (with _meta from runner)
            if (componentResult.componentId === 'editing-coach' && componentResult.success) {
              editingSuggestions = componentResult.features as EditingCoachResult;
              console.log('[Pipeline]   ✓ Extracted Pack 2 (editing-coach) result');
            }
            // Extract Pack V result (visual rubric - no transcript required)
            if (componentResult.componentId === 'visual-rubric' && componentResult.success) {
              visualRubric = componentResult.features as VisualRubricResult;
              console.log('[Pipeline]   ✓ Extracted Pack V (visual-rubric) result');
            }

            // Store component result to DB
            const { error: componentError } = await supabase
              .from('run_component_results')
              .insert({
                run_id: runId,
                video_id: videoId,
                component_id: componentResult.componentId,
                success: componentResult.success,
                error: componentResult.error || null,
                skipped: componentResult.skipped || false,
                skip_reason: componentResult.skipReason || null,
                prediction: componentResult.prediction,
                confidence: componentResult.confidence,
                features: componentResult.features || null,
                insights: componentResult.insights || null,
                latency_ms: componentResult.latency,
                cache_hit: false,
              });

            if (componentError) {
              console.error(`[Pipeline] Failed to store component result for ${componentResult.componentId}:`, componentError);
            }
          }
        }
      }
    } else {
      console.warn('[Pipeline] No paths returned from orchestrator - this is unexpected!');
    }

    console.log(`[Pipeline] Total executed components: ${executedComponentCount}`);
    console.log(`[Pipeline] Component IDs: ${executedComponentIds.join(', ')}`);
    console.log(`[Pipeline] Pack 1 extracted: ${!!unifiedGrading}, Pack 2 extracted: ${!!editingSuggestions}, Pack V extracted: ${!!visualRubric}`);

    // Prepare legacy fields (without _meta for backward compat)
    const legacyPack1 = unifiedGrading
      ? (() => {
          const { _meta, ...rest } = unifiedGrading;
          return rest as UnifiedGradingResult;
        })()
      : null;
    const legacyPack2 = editingSuggestions
      ? (() => {
          const { _meta, ...rest } = editingSuggestions;
          return rest as EditingCoachResult;
        })()
      : null;

    // Build transcription status for UI using the resolved transcript source
    const transcriptionStatus: TranscriptionStatus = {
      source: transcriptSource,
      confidence: transcriptionResult?.confidence ?? (transcriptSource === 'user_provided' ? 1.0 : 0),
      processingTimeMs: transcriptionResult?.processingTimeMs ?? 0,
      skipped: !resolvedTranscript || resolvedTranscript.length < 10,
      skippedReason: !resolvedTranscript
        ? (transcriptionResult?.skipped_reason || 'no_speech_detected')
        : undefined,
      fallbackComponents: transcriptionResult?.fallbackComponents,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Step 7: Apply calibration based on Pack V and transcription status
    // Rules: confidence penalty for no-speech, DPS cap for silent videos
    // ─────────────────────────────────────────────────────────────────────────

    // Determine audio_present from Pack V signal coverage or default to true if we have transcript
    const audioPresent = visualRubric?.signal_coverage?.signals_used?.some(
      s => s.field === 'audio_present' || s.field === 'has_music'
    ) ?? (resolvedTranscript ? true : false);

    // Extract detected style from component results (if 24-styles ran)
    let detectedStyle: string | undefined;
    if (result.paths && Array.isArray(result.paths)) {
      for (const pathResult of result.paths) {
        if (pathResult.results && Array.isArray(pathResult.results)) {
          const styleResult = pathResult.results.find((r: any) => r.componentId === '24-styles');
          if (styleResult?.features?.detected_style) {
            detectedStyle = styleResult.features.detected_style;
            break;
          }
        }
      }
    }

    const calibrationInput: CalibrationInput = {
      rawDps: result.dps,
      rawConfidence: result.confidence,
      transcriptionSource: transcriptSource,
      transcriptionSkipped: transcriptionStatus.skipped,
      transcriptionSkippedReason: transcriptionStatus.skippedReason,
      resolvedTranscriptLength: resolvedTranscript?.length ?? 0,
      audioPresent,
      packV: visualRubric,
      detectedStyle,
      niche: options.niche ?? undefined,
      videoId,
      runId,
    };

    const calibrationResult = calibratePrediction(calibrationInput);

    // Use calibrated values for final output
    const finalDps = calibrationResult.calibratedDps;
    const finalConfidence = calibrationResult.calibratedConfidence;

    // Log Pack V training features for future model retrains (Rule 3)
    if (visualRubric) {
      await logPackVTrainingFeatures(
        supabase,
        videoId,
        runId,
        calibrationResult.trainingFeatures
      );
    }

    // NOTE: Transcription/pack metadata is now persisted in the finally block
    // to ensure it always gets written even if later code throws

    // Build the final result (stored for finally block and return)
    finalResult = {
      success: result.success,
      run_id: runId,
      video_id: videoId,
      predicted_dps_7d: finalDps,  // Calibrated DPS
      predicted_tier_7d: result.viralPotential,
      confidence: finalConfidence,  // Calibrated confidence
      components_used: result.componentsUsed,
      latency_ms_total: latencyMs,
      warnings,
      raw_result: result,
      // Standardized qualitative_analysis with _meta
      qualitative_analysis: {
        pack1: unifiedGrading,
        pack2: editingSuggestions,
        pack3: createViralMechanicsStub(),
        packV: visualRubric,
      },
      // Transcription status for UI step display
      transcription_status: transcriptionStatus,
      // Calibration results (shows adjustments made)
      calibration: calibrationResult,
      // Debug fields for transcript verification and component execution
      debug: {
        resolved_transcript_length: resolvedTranscript?.length || 0,
        resolved_transcript_preview: resolvedTranscript?.substring(0, 120) || '',
        transcript_source: transcriptSource,
        user_transcript_length: userTranscriptLength,
        executed_component_count: executedComponentCount,
        executed_component_ids: executedComponentIds,
      },
      // Legacy fields (deprecated, without _meta)
      unified_grading: legacyPack1,
      editing_suggestions: legacyPack2,
    };

  } catch (error: any) {
    console.error('[Pipeline] Prediction failed:', error);
    finalStatus = 'failed';
    finalError = error.message;

    // Build error result (stored for finally block and return)
    const latencyMs = Date.now() - startTime;
    finalResult = {
      success: false,
      run_id: runId,
      video_id: videoId,
      predicted_dps_7d: 0,
      predicted_tier_7d: 'unknown',
      confidence: 0,
      components_used: [],
      latency_ms_total: latencyMs,
      warnings: [...warnings, `Error: ${error.message}`],
      error: error.message,
      qualitative_analysis: {
        pack1: null,
        pack2: null,
        pack3: createViralMechanicsStub(),
        packV: null,
      },
      unified_grading: null,
      editing_suggestions: null,
    };
  } finally {
    // ═══════════════════════════════════════════════════════════════════════════
    // GUARANTEED FINALIZATION: This block ALWAYS runs, even if try/catch throws
    // ═══════════════════════════════════════════════════════════════════════════
    const finalLatencyMs = Date.now() - startTime;

    console.log(`[Pipeline] ═══════════════════════════════════════════════════`);
    console.log(`[Pipeline] FINALIZING prediction_runs row:`);
    console.log(`[Pipeline]   run_id: ${runId}`);
    console.log(`[Pipeline]   status: ${finalStatus}`);
    console.log(`[Pipeline]   latency_ms: ${finalLatencyMs}`);
    console.log(`[Pipeline]   error: ${finalError || 'none'}`);
    console.log(`[Pipeline]   raw_result present: ${!!finalResult?.raw_result}`);

    try {
      // Prepare raw_result - truncate if too large (Supabase JSONB limit ~1GB but keep it reasonable)
      let rawResultForDb: any = finalResult?.raw_result || null;

      if (rawResultForDb) {
        const rawResultJson = JSON.stringify(rawResultForDb);
        if (rawResultJson.length > 500000) { // 500KB limit for raw_result
          // Store a compact summary instead
          rawResultForDb = {
            _truncated: true,
            _original_size_bytes: rawResultJson.length,
            success: rawResultForDb.success,
            dps: rawResultForDb.dps,
            viralPotential: rawResultForDb.viralPotential,
            confidence: rawResultForDb.confidence,
            componentsUsed: rawResultForDb.componentsUsed,
            // Omit large paths array
          };
          console.log(`[Pipeline]   raw_result truncated: ${rawResultJson.length} bytes -> compact summary`);
        }
      }

      const { error: finalUpdateError } = await supabase
        .from('prediction_runs')
        .update({
          status: finalStatus,
          predicted_dps_7d: finalResult?.predicted_dps_7d ?? 0,
          predicted_tier_7d: finalResult?.predicted_tier_7d ?? 'unknown',
          confidence: finalResult?.confidence ?? 0,
          components_used: finalResult?.components_used ?? [],
          latency_ms_total: finalLatencyMs,
          raw_result: rawResultForDb,
          error_message: finalError,
          completed_at: new Date().toISOString(),
          // Include transcription and pack metadata
          transcription_source: finalResult?.transcription_status?.source ?? 'none',
          transcription_confidence: finalResult?.transcription_status?.confidence ?? 0,
          transcription_latency_ms: finalResult?.transcription_status?.processingTimeMs ?? 0,
          transcription_skipped: finalResult?.transcription_status?.skipped ?? true,
          transcription_skip_reason: finalResult?.transcription_status?.skippedReason ?? null,
          resolved_transcript_length: finalResult?.debug?.resolved_transcript_length ?? 0,
          pack1_meta: finalResult?.qualitative_analysis?.pack1?._meta ? {
            source: finalResult.qualitative_analysis.pack1._meta.source,
            provider: finalResult.qualitative_analysis.pack1._meta.provider,
            latency_ms: finalResult.qualitative_analysis.pack1._meta.latency_ms,
          } : null,
          pack2_meta: finalResult?.qualitative_analysis?.pack2?._meta ? {
            source: finalResult.qualitative_analysis.pack2._meta.source,
            provider: finalResult.qualitative_analysis.pack2._meta.provider,
            latency_ms: finalResult.qualitative_analysis.pack2._meta.latency_ms,
          } : null,
        })
        .eq('id', runId);

      if (finalUpdateError) {
        console.error(`[Pipeline] ✗ FAILED to finalize run_id=${runId}:`, finalUpdateError);
        // Add to warnings if we have a result object
        if (finalResult) {
          finalResult.warnings.push(`DB finalization failed: ${finalUpdateError.message}`);
        }
      } else {
        console.log(`[Pipeline] ✓ Successfully finalized run_id=${runId} with status='${finalStatus}'`);
      }
    } catch (dbError: any) {
      console.error(`[Pipeline] ✗ EXCEPTION during finalization for run_id=${runId}:`, dbError);
      // Even if DB update fails, we still return the result
    }

    console.log(`[Pipeline] ═══════════════════════════════════════════════════`);
  }

  // Return the result (will be set by try or catch block)
  return finalResult!;
}

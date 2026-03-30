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
  ViralMechanicsResult,
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
import {
  normalizeComponentResult,
  NormalizedComponentResult,
  QCFlag,
  computeRunQCFlags,
  classifyLane,
  COACH_LANE_COMPONENT_IDS,
} from '@/lib/prediction/normalize-component-result';
import { TRAINING_V2_ENABLED } from '@/lib/training/feature-availability-matrix';
import {
  deriveIngestMode,
  sanitizeVideoInput,
  generateContaminationProof,
  ContaminationProof,
  IngestMode,
} from '@/lib/prediction/contamination-lock';
import type { CreatorContext } from '@/lib/prediction/creator-context';
import { analyzeSpeakingRate, type SpeakingRateResult } from '@/lib/services/speaking-rate-analyzer';
import { predictXGBoostV10, type XGBoostPredictionResult } from '@/lib/prediction/xgboost-inference';
import { extractPredictionFeatures, type PredictionFeatureResult } from '@/lib/prediction/extract-prediction-features';
import { emitEvent } from '@/lib/events/emit';

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
  mode?: 'standard' | 'validation';
  videoFilePath?: string | null;
  transcript?: string | null;
  niche?: string | null;
  goal?: string | null;
  title?: string | null;
  description?: string | null;
  hashtags?: string[] | null;
  accountSize?: string | null;
  /** QC Harness: Run LLM components but zero their weight in the VPS aggregate.
   *  Use with mode='validation' to diagnose LLM-induced VPS drift. */
  excludeLLMsFromAggregate?: boolean;
  /** Origin of this prediction run (Phase 82: Training Ingest) */
  source?: 'manual' | 'training_ingest' | 'api';
  /** Metadata about the ingest source (platform, caller, etc.) */
  sourceMeta?: Record<string, unknown>;
  /** Contamination lock: ingest mode override */
  ingestMode?: IngestMode;
  /** Optional creator context (calibration profile + channel data).
   *  When present, enables personalized suggestions and uses real follower count. */
  creatorContext?: CreatorContext | null;
}

/**
 * Qualitative analysis results from Pack 1, 2, 3, and V
 */
export interface QualitativeAnalysis {
  pack1: UnifiedGradingResult | null;
  pack2: EditingCoachResult | null;
  pack3: ViralMechanicsResult | ViralMechanicsStub | null;
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
  // Native Whisper confidence (WSP-003): available when source === 'whisper'
  nativeConfidence?: number;
  noSpeechProbability?: number;
}

export interface PipelineResult {
  success: boolean;
  run_id: string;
  video_id: string;
  predicted_vps: number;
  /** @deprecated Use predicted_vps instead */
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
    /** Actual error message when Pack 1 (unified-grading) fails */
    pack1_error?: string;
    /** Actual error message when Pack 2 (editing-coach) fails */
    pack2_error?: string;
  };
  // Calibration results (Pack V + transcription status adjustments)
  calibration?: CalibrationResult;
  // QC harness flags (run-level quality signals)
  qc_flags?: QCFlag[];
  /** LLM consensus gate: max(llm_preds) - min(llm_preds) */
  llm_spread?: number;
  /** true when LLM components contributed non-zero weight to the final VPS */
  llm_influence_applied?: boolean;

  // ── Two-Lane Output ──────────────────────────────────────────────────────
  /** Score Lane: VPS from deterministic/ML components only (no LLM influence) */
  score_lane?: {
    vps: number;
    /** @deprecated Use vps instead */
    dps?: number;
    components_used: string[];
  };
  /** Coach Lane: LLM outputs for coaching UI (never influences VPS) */
  coach_lane?: {
    llm_predictions: Array<{ componentId: string; prediction: number }>;
    pack1: UnifiedGradingResult | null;
    pack2: EditingCoachResult | null;
  };
  /** Semver-ish version tag for the scoring formula */
  score_version?: string;
  /** Semver-ish version tag for the coaching model set */
  coach_version?: string;
  /** Why LLMs were excluded from VPS: validation_mode | user_toggle | disagreement | null */
  llm_excluded_reason?: string | null;

  // ── Contamination Lock ─────────────────────────────────────────────────────
  /** Cryptographic proof of clean ingest (null if not a clean run) */
  contamination_proof?: ContaminationProof | null;
  /** Ingest mode: 'clean' or 'dirty_allowed' */
  ingest_mode?: IngestMode | null;

  // ── XGBoost v10 ─────────────────────────────────────────────────────────────
  /** XGBoost model prediction result (v9, key kept as xgboost_v7 for API compat) */
  xgboost_v7?: XGBoostPredictionResult | null;
  /** Feature extraction metadata (key kept as xgboost_v7_features for API compat) */
  xgboost_v7_features?: {
    extraction_time_ms: number;
    errors: string[];
    features_provided: number;
    features_total: number;
  } | null;

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
    // ── Contamination Lock: derive ingest mode ────────────────────────────────
    const ingestMode = options.ingestMode ?? deriveIngestMode(options.source) ?? undefined;
    const isCleanIngest = ingestMode === 'clean';
    let contaminationProof: ContaminationProof | null = null;

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
        source: options.source || 'manual',
        source_meta: options.sourceMeta || null,
        ingest_mode: ingestMode || null,
        cohort_key: `${options.niche || 'unknown'}:${options.accountSize || 'unknown'}`,
        cohort_frozen_at: new Date().toISOString(),
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

    // Compute speaking rate from Whisper segments if available (Batch B)
    let speakingRateResult: SpeakingRateResult | undefined;
    if (transcriptionResult?.whisperSegments && transcriptionResult.whisperSegments.length > 0) {
      try {
        const videoDuration = transcriptionResult.whisperSegments.length > 0
          ? Math.max(...transcriptionResult.whisperSegments.map(s => s.end))
          : 0;
        speakingRateResult = analyzeSpeakingRate(transcriptionResult.whisperSegments, videoDuration);
        if (speakingRateResult.success) {
          console.log(`[Pipeline] Speaking rate: ${speakingRateResult.overallWpm} WPM, category=${speakingRateResult.paceCategory}, variance=${speakingRateResult.wpmVariance}`);
        }
      } catch (err: any) {
        console.warn('[Pipeline] Speaking rate analysis failed:', err.message);
      }
    }

    // Log resolved transcript for debugging
    console.log(`[Pipeline] RESOLVED TRANSCRIPT: ${resolvedTranscript ? resolvedTranscript.length : 0} chars, source: ${transcriptSource}`);
    if (resolvedTranscript) {
      console.log(`[Pipeline] Preview: "${resolvedTranscript.substring(0, 120)}..."`);
    }

    // Step 3: Prepare input for orchestrator
    // Resolve accountSize: prefer real follower count from creator context
    let resolvedAccountSize = options.accountSize || undefined;
    if (options.creatorContext?.channelData?.followerCount != null) {
      const realBand = followerCountToSizeBand(options.creatorContext.channelData.followerCount);
      if (resolvedAccountSize && resolvedAccountSize !== realBand) {
        warnings.push(`Account size adjusted from "${resolvedAccountSize}" to "${realBand}" (real follower count: ${options.creatorContext.channelData.followerCount})`);
      }
      resolvedAccountSize = realBand;
    }

    // Cross-check niche (warning only — user's explicit dropdown selection wins)
    if (
      options.creatorContext?.channelData?.inferredNicheKey &&
      options.niche &&
      options.creatorContext.channelData.inferredNicheKey !== options.niche
    ) {
      warnings.push(`Niche mismatch: channel is "${options.creatorContext.channelData.inferredNicheKey}" but prediction uses "${options.niche}"`);
    }

    if (options.creatorContext) {
      console.log(`[Pipeline] Creator context active: stage=${options.creatorContext.creatorStage}, calibration=${!!options.creatorContext.calibrationProfile}, channel=${!!options.creatorContext.channelData}`);
    }

    const videoInput: VideoInput = {
      videoId: videoId,
      transcript: resolvedTranscript,
      videoPath: options.videoFilePath || undefined,
      niche: options.niche || undefined,
      goal: options.goal || undefined,
      title: options.title || undefined,
      description: options.description || undefined,
      hashtags: options.hashtags || undefined,
      accountSize: resolvedAccountSize,
      creatorContext: options.creatorContext || undefined,
      speakingRateData: speakingRateResult,
      whisperSegments: transcriptionResult?.whisperSegments,
    };

    // ── Contamination Lock: sanitize VideoInput ──────────────────────────────
    const { sanitized: sanitizedVideoInput, flags: lockFlags } = sanitizeVideoInput(videoInput, isCleanIngest);
    if (isCleanIngest) {
      contaminationProof = generateContaminationProof(sanitizedVideoInput, lockFlags);
      console.log(`[Pipeline] Contamination lock: ${lockFlags.join(', ')}, hash=${contaminationProof.inputs_hash.slice(0, 12)}...`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 3b: XGBoost v10 feature extraction + inference (BEFORE orchestrator)
    // Extracts content-only features and runs TypeScript XGBoost model.
    // Result is passed to the orchestrator as a pre-computed component input,
    // blended alongside all other components — NOT used as VPS override.
    // ─────────────────────────────────────────────────────────────────────────
    let xgboostResult: XGBoostPredictionResult | null = null;
    let xgboostFeatureMeta: PipelineResult['xgboost_v7_features'] = null;

    if (options.videoFilePath) {
      try {
        console.log(`[Pipeline] XGBoost v10: extracting features from video...`);
        const featureResult = await extractPredictionFeatures({
          videoFilePath: options.videoFilePath,
          transcript: resolvedTranscript || null,
          niche: options.niche || null,
          caption: options.description || options.title || null,
          creatorFollowerCount: options.creatorContext?.channelData?.followerCount ?? null,
        });

        xgboostFeatureMeta = {
          extraction_time_ms: featureResult.extractionTimeMs,
          errors: featureResult.errors,
          features_provided: Object.values(featureResult.features).filter(v => v !== null).length,
          features_total: Object.keys(featureResult.features).length,
        };

        if (featureResult.errors.length > 0) {
          console.warn(`[Pipeline] XGBoost v10 feature extraction warnings: ${featureResult.errors.join(', ')}`);
        }

        console.log(`[Pipeline] XGBoost v10: running inference (${xgboostFeatureMeta.features_provided}/${xgboostFeatureMeta.features_total} features)...`);
        xgboostResult = predictXGBoostV10(featureResult.features);

        console.log(`[Pipeline] XGBoost v10: VPS=${xgboostResult.vps} (raw=${xgboostResult.raw_prediction.toFixed(2)}), missing=${xgboostResult.missing_features.length} features`);

        // Pass pre-computed result to orchestrator via VideoInput
        sanitizedVideoInput.xgboostPrecomputed = {
          vps: xgboostResult.vps,
          raw_prediction: xgboostResult.raw_prediction,
          model_version: xgboostResult.model_version,
          features_provided: xgboostResult.features_provided,
          features_total: xgboostResult.features_total,
          missing_features: xgboostResult.missing_features,
        };
      } catch (err: any) {
        console.error(`[Pipeline] XGBoost v10 feature extraction failed: ${err.message}`);
        warnings.push(`XGBoost v10 failed: ${err.message}`);
      }
    } else {
      console.log(`[Pipeline] XGBoost v10: skipped (no video file path)`);
    }

    // Step 4: Run prediction (use sanitized input to guarantee no metrics leakage)
    const orchestrator = new KaiOrchestrator();
    const workflow = resolvedTranscript || options.videoFilePath ? 'content-planning' : 'standard';
    const isDeterministic = options.mode === 'validation';

    console.log(`[Pipeline] Running prediction for video ${videoId} with workflow: ${workflow}${isDeterministic ? ' (DETERMINISTIC)' : ''}`);

    // Pass deterministic flag so orchestrator uses temperature=0 and fixed A/B
    if (isDeterministic) {
      orchestrator.setDeterministic(true, videoId);
    }

    // QC Harness: exclude LLMs from VPS aggregate (components still run)
    if (options.excludeLLMsFromAggregate) {
      orchestrator.setExcludeLLMsFromAggregate(true);
    }

    const result = await orchestrator.predict(sanitizedVideoInput, workflow as any);

    const latencyMs = Date.now() - startTime;

    // Step 5: Mark success - actual DB update happens in finally block
    finalStatus = result.success ? 'completed' : 'failed';
    if (!result.success) {
      finalError = 'Orchestrator returned success=false';
    }
    console.log(`[Pipeline] Orchestrator finished: success=${result.success}, vps=${result.vps}`);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'30a7b9'},body:JSON.stringify({sessionId:'30a7b9',location:'runPredictionPipeline.ts:ORCH_RESULT',message:'Orchestrator raw result before calibrator',data:{orchestratorVps:result.vps,orchestratorConfidence:result.confidence,viralPotential:result.viralPotential,componentsUsed:result.componentsUsed,adjustments:result.adjustments,llmSpread:result.llm_spread,llmInfluenceApplied:result.llm_influence_applied,hasVideoPath:!!options.videoFilePath,hasTranscript:!!resolvedTranscript,transcriptSource,transcriptLength:resolvedTranscript?.length||0},timestamp:Date.now(),hypothesisId:'ALL'})}).catch(()=>{});
    // #endregion

    // NOTE: We no longer do the main status update here - it's consolidated in the finally block
    // This ensures the update always happens even if later code throws

    // Step 6: Store component results and extract Pack 1/2/V data
    //         Uses the QC normalizer to guarantee consistent DB writes.
    let unifiedGrading: UnifiedGradingResult | null = null;
    let editingSuggestions: EditingCoachResult | null = null;
    let viralMechanics: ViralMechanicsResult | null = null;
    let visualRubric: VisualRubricResult | null = null;
    let pack1Error: string | undefined;
    let pack2Error: string | undefined;
    let executedComponentCount = 0;
    const executedComponentIds: string[] = [];
    const normalizedResults: NormalizedComponentResult[] = [];

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

            // Normalize through QC harness
            const norm = normalizeComponentResult(componentResult);
            normalizedResults.push(norm);

            console.log(`[Pipeline]   Component '${norm.component_id}': status=${norm.status}, prediction=${norm.prediction ?? 'N/A'}, confidence=${norm.confidence.toFixed(2)}`);

            // Extract Pack 1 result (with _meta from runner)
            if (componentResult.componentId === 'unified-grading') {
              if (componentResult.success) {
                unifiedGrading = componentResult.features as UnifiedGradingResult;
                console.log('[Pipeline]   ✓ Extracted Pack 1 (unified-grading) result');
              } else {
                pack1Error = componentResult.error || 'Pack 1 failed (no error details)';
                console.log(`[Pipeline]   ✗ Pack 1 (unified-grading) failed: ${pack1Error}`);
              }
            }
            // Extract Pack 2 result (with _meta from runner)
            if (componentResult.componentId === 'editing-coach') {
              if (componentResult.success) {
                editingSuggestions = componentResult.features as EditingCoachResult;
                console.log('[Pipeline]   ✓ Extracted Pack 2 (editing-coach) result');
              } else {
                pack2Error = componentResult.error || 'Pack 2 failed (no error details)';
                console.log(`[Pipeline]   ✗ Pack 2 (editing-coach) failed: ${pack2Error}`);
              }
            }
            // Extract Pack 3 result (viral mechanics - rule-based)
            if (componentResult.componentId === 'viral-mechanics' && componentResult.success) {
              viralMechanics = componentResult.features as ViralMechanicsResult;
              console.log('[Pipeline]   ✓ Extracted Pack 3 (viral-mechanics) result');
            }
            // Extract Pack V result (visual rubric - no transcript required)
            if (componentResult.componentId === 'visual-rubric' && componentResult.success) {
              visualRubric = componentResult.features as VisualRubricResult;
              console.log('[Pipeline]   ✓ Extracted Pack V (visual-rubric) result');
            }

            // Store component result to DB (uses normalized prediction field)
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
                prediction: norm.prediction,
                confidence: norm.confidence,
                features: componentResult.features || null,
                insights: componentResult.insights || null,
                latency_ms: norm.latency_ms,
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

    // Step 6b: Compute run-level QC flags
    const qcFlags = computeRunQCFlags(
      normalizedResults,
      resolvedTranscript
        ? { length: resolvedTranscript.length, source: transcriptSource }
        : null,
    );
    // Push contamination lock flags
    qcFlags.push(...lockFlags);

    if (options.mode === 'validation') {
      qcFlags.push('DETERMINISTIC_MODE');
    }
    if (options.excludeLLMsFromAggregate) {
      qcFlags.push('LLM_EXCLUDED_FROM_AGGREGATE');
    }

    // LLM consensus gate flag (computed by orchestrator)
    const llmSpread = result.llm_spread ?? 0;
    if (llmSpread > 10) {
      qcFlags.push('LLM_DISAGREEMENT');
    }
    if (qcFlags.length > 0) {
      console.log(`[Pipeline] QC flags: ${qcFlags.join(', ')}`);
    }

    console.log(`[Pipeline] Total executed components: ${executedComponentCount}`);
    console.log(`[Pipeline] Component IDs: ${executedComponentIds.join(', ')}`);
    console.log(`[Pipeline] Pack 1 extracted: ${!!unifiedGrading}, Pack 2 extracted: ${!!editingSuggestions}, Pack 3 extracted: ${!!viralMechanics}, Pack V extracted: ${!!visualRubric}`);

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
      nativeConfidence: transcriptionResult?.nativeConfidence,
      noSpeechProbability: transcriptionResult?.noSpeechProbability,
    };

    // NOTE: XGBoost v10 extraction + inference now happens in Step 3b (before orchestrator).
    // XGBoost is component #18 in the orchestrator blend — it no longer overrides the VPS.
    // The xgboostResult and xgboostFeatureMeta variables are set above in Step 3b.

    // ─────────────────────────────────────────────────────────────────────────
    // Step 7: Apply calibration based on Pack V and transcription status
    // Rules: confidence penalty for no-speech, VPS cap for silent videos
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
      rawVps: result.vps,
      rawConfidence: result.confidence,
      transcriptionSource: transcriptSource,
      transcriptionSkipped: transcriptionStatus.skipped,
      transcriptionSkippedReason: transcriptionStatus.skippedReason,
      resolvedTranscriptLength: resolvedTranscript?.length ?? 0,
      noSpeechProbability: transcriptionStatus.noSpeechProbability,
      audioPresent,
      packV: visualRubric,
      detectedStyle,
      niche: options.niche ?? undefined,
      creatorContext: options.creatorContext ?? null,
      videoId,
      runId,
    };

    const calibrationResult = calibratePrediction(calibrationInput);

    // Use calibrated values for final output
    const finalVps = calibrationResult.calibratedVps;
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

    // ── Two-Lane Output ──────────────────────────────────────────────────────
    // Score Lane: deterministic/ML components only
    const scoreLaneComponents = executedComponentIds.filter(id => !COACH_LANE_COMPONENT_IDS.has(id));
    const scoreLaneVps = result.score_lane_vps ?? finalVps;

    // Coach Lane: LLM predictions + Pack 1/2 outputs (never influence VPS)
    const coachLaneLLMPredictions = result.coach_lane_llm_predictions ?? [];

    // Determine LLM exclusion reason
    let llmExcludedReason: string | null = null;
    if (options.mode === 'validation') {
      llmExcludedReason = 'validation_mode';
    } else if (options.excludeLLMsFromAggregate) {
      llmExcludedReason = 'user_toggle';
    } else if (llmSpread > 10) {
      llmExcludedReason = 'disagreement';
    }

    // Push TWO_LANE_ACTIVE flag when lanes are being explicitly separated
    if (llmExcludedReason) {
      qcFlags.push('TWO_LANE_ACTIVE');
    }

    // ── Score Version ──────────────────────────────────────────────────────
    let scoreVersion = xgboostResult ? 'xgboost-v10' : 'score-v1.0';
    if (!xgboostResult && TRAINING_V2_ENABLED()) {
      try {
        const { data: activeModel } = await supabase
          .from('model_versions')
          .select('version')
          .eq('is_production', true)
          .single();
        if (activeModel?.version) {
          scoreVersion = activeModel.version;
        }
      } catch {
        // Non-fatal — fall back to default version
      }
    }

    // Build the final result (stored for finally block and return)
    finalResult = {
      success: result.success,
      run_id: runId,
      video_id: videoId,
      predicted_vps: finalVps,  // Calibrated VPS (may still contain LLM influence in standard mode)
      predicted_dps_7d: finalVps,  // Deprecated alias for backward compat
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
        pack3: viralMechanics || createViralMechanicsStub(),
        packV: visualRubric,
      },
      // Transcription status for UI step display
      transcription_status: transcriptionStatus,
      // Calibration results (shows adjustments made)
      calibration: calibrationResult,
      // QC harness flags
      qc_flags: qcFlags,
      // LLM consensus gate
      llm_spread: llmSpread,
      llm_influence_applied: result.llm_influence_applied ?? true,
      // Two-Lane Output
      score_lane: {
        vps: Math.round(scoreLaneVps * 10) / 10,
        dps: Math.round(scoreLaneVps * 10) / 10,
        components_used: scoreLaneComponents,
      },
      coach_lane: {
        llm_predictions: coachLaneLLMPredictions,
        pack1: unifiedGrading,
        pack2: editingSuggestions,
      },
      score_version: scoreVersion,
      coach_version: 'coach-v1.0',
      llm_excluded_reason: llmExcludedReason,
      // Debug fields for transcript verification and component execution
      debug: {
        resolved_transcript_length: resolvedTranscript?.length || 0,
        resolved_transcript_preview: resolvedTranscript?.substring(0, 120) || '',
        transcript_source: transcriptSource,
        user_transcript_length: userTranscriptLength,
        executed_component_count: executedComponentCount,
        executed_component_ids: executedComponentIds,
        ...(pack1Error ? { pack1_error: pack1Error } : {}),
        ...(pack2Error ? { pack2_error: pack2Error } : {}),
      },
      // Contamination Lock
      contamination_proof: contaminationProof,
      ingest_mode: ingestMode || null,
      // XGBoost v10
      xgboost_v7: xgboostResult,
      xgboost_v7_features: xgboostFeatureMeta,
      // Legacy fields (deprecated, without _meta)
      unified_grading: legacyPack1,
      editing_suggestions: legacyPack2,
    };

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'30a7b9'},body:JSON.stringify({sessionId:'30a7b9',location:'runPredictionPipeline.ts:FINAL_OUTPUT',message:'Pipeline final output',data:{finalVps:finalVps,finalConfidence,calibrationAdjustments:calibrationResult.adjustments.map(a=>({rule:a.rule,vpsBefore:a.vpsBefore,vpsAfter:a.vpsAfter})),scoreLaneVps:scoreLaneVps,orchestratorRawVps:result.vps,executedComponentCount,executedComponentIds,hasVideoPath:!!options.videoFilePath,niche:options.niche},timestamp:Date.now(),hypothesisId:'ALL'})}).catch(()=>{});
    // #endregion

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
      predicted_vps: 0,
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
            vps: rawResultForDb.vps,
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
          predicted_dps_7d: finalResult?.predicted_vps ?? 0,
          predicted_tier_7d: finalResult?.predicted_tier_7d ?? 'Needs Work',
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
          qc_flags: finalResult?.qc_flags ?? [],
          llm_spread: finalResult?.llm_spread ?? null,
          llm_influence_applied: finalResult?.llm_influence_applied ?? null,
          score_version: finalResult?.score_version ?? null,
          coach_version: finalResult?.coach_version ?? null,
          llm_excluded_reason: finalResult?.llm_excluded_reason ?? null,
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
          // Contamination Lock
          ingest_mode: finalResult?.ingest_mode ?? null,
          contamination_lock: finalResult?.ingest_mode === 'clean',
          contamination_proof: finalResult?.contamination_proof ?? null,
          // Creator Context
          creator_context_active: !!options.creatorContext,
          creator_stage: options.creatorContext?.creatorStage ?? null,
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

        // Emit platform event (fire-and-forget)
        if (finalResult && finalStatus === 'completed') {
          emitEvent({
            eventType: 'prediction.scored',
            payload: {
              predictionRunId: runId,
              vpsScore: finalResult.predicted_vps,
              tier: finalResult.predicted_tier_7d,
              confidence: finalResult.confidence,
            },
            entityType: 'prediction_run',
            entityId: runId,
          }).catch(() => {});
        }
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

// ============================================================================
// Helpers
// ============================================================================

function followerCountToSizeBand(followers: number | null): string {
  if (followers == null) return 'small (0-10K)';
  if (followers >= 1_000_000) return 'mega (1M+)';
  if (followers >= 100_000) return 'large (100K-1M)';
  if (followers >= 10_000) return 'medium (10K-100K)';
  return 'small (0-10K)';
}

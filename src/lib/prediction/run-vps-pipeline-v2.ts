/**
 * VPS Pipeline V2 — XGBoost as sole score producer
 *
 * Calls extractPredictionFeatures() + predictXGBoostV10() directly.
 * No KaiOrchestrator, no multi-path averaging, no LLM consensus gate,
 * no calibratePrediction().
 *
 * @module run-vps-pipeline-v2
 */

import {
  extractPredictionFeatures,
  type PredictionFeatureInput,
  type PredictionFeatureResult,
} from '@/lib/prediction/extract-prediction-features';
import {
  predictXGBoostV10,
  type XGBoostPredictionResult,
} from '@/lib/prediction/xgboost-inference';

// ── Types ────────────────────────────────────────────────────────────────────

export interface VpsPipelineV2Input {
  videoFilePath?: string;
  transcript?: string;
  niche?: string;
  followerCount?: number;
  caption?: string;
}

export interface VpsPipelineV2Result {
  vps: number;
  raw_prediction: number;
  model_version: string;
  features_provided: number;
  features_total: number;
  missing_features: string[];
  feature_values: Record<string, number | boolean | null>;
  extraction_errors: string[];
  extraction_time_ms: number;
  inference_time_ms: number;
}

// ── Main Pipeline ────────────────────────────────────────────────────────────

/**
 * Run the VPS v2 pipeline: feature extraction → XGBoost inference.
 *
 * Requires at least a videoFilePath or transcript. If neither is provided,
 * feature extraction will have very limited signal.
 */
export async function runVpsPipelineV2(
  input: VpsPipelineV2Input,
): Promise<VpsPipelineV2Result> {
  // 1. Feature extraction
  const featureInput: PredictionFeatureInput = {
    videoFilePath: input.videoFilePath || '',
    transcript: input.transcript ?? null,
    niche: input.niche ?? null,
    caption: input.caption ?? null,
    creatorFollowerCount: input.followerCount ?? null,
  };

  const featureResult: PredictionFeatureResult =
    await extractPredictionFeatures(featureInput);

  // 2. XGBoost inference
  const inferenceStart = Date.now();
  const xgbResult: XGBoostPredictionResult =
    predictXGBoostV10(featureResult.features);
  const inferenceTimeMs = Date.now() - inferenceStart;

  // 3. Assemble result
  return {
    vps: xgbResult.vps,
    raw_prediction: xgbResult.raw_prediction,
    model_version: xgbResult.model_version,
    features_provided: xgbResult.features_provided,
    features_total: xgbResult.features_total,
    missing_features: xgbResult.missing_features,
    feature_values: featureResult.features,
    extraction_errors: featureResult.errors,
    extraction_time_ms: featureResult.extractionTimeMs,
    inference_time_ms: inferenceTimeMs,
  };
}

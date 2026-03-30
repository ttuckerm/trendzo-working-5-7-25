/**
 * Prediction Hash Service
 *
 * Generates SHA-256 hash of prediction payload for cryptographic freezing.
 * Hash proves prediction was made BEFORE metrics were known.
 *
 * @module prediction-hash
 */

import crypto from 'crypto';

// =====================================================
// Type Definitions
// =====================================================

export interface PredictionPayload {
  video_id: string;
  predicted_dps: number;
  predicted_range: [number, number];  // [low, high]
  confidence: number;
  model_version: string;
  top_features: Array<{
    name: string;
    importance: number;
    value: number;
  }>;
  explanation: string;
  timestamp_utc: string;
}

export interface PredictionHashResult {
  hash: string;
  algorithm: string;
  payload: PredictionPayload;
  created_at: string;
}

// =====================================================
// Core Functions
// =====================================================

/**
 * Generate SHA-256 hash of prediction payload
 *
 * @param payload - Complete prediction data
 * @returns Hash result with verification data
 */
export function generatePredictionHash(
  payload: PredictionPayload
): PredictionHashResult {
  // Normalize payload to ensure consistent hashing
  const normalizedPayload: PredictionPayload = {
    video_id: payload.video_id,
    predicted_dps: Number(payload.predicted_dps.toFixed(2)),
    predicted_range: [
      Number(payload.predicted_range[0].toFixed(2)),
      Number(payload.predicted_range[1].toFixed(2))
    ],
    confidence: Number(payload.confidence.toFixed(4)),
    model_version: payload.model_version,
    top_features: payload.top_features.slice(0, 10).map(f => ({
      name: f.name,
      importance: Number(f.importance.toFixed(4)),
      value: Number(f.value.toFixed(2))
    })),
    explanation: payload.explanation,
    timestamp_utc: payload.timestamp_utc
  };

  // Serialize to JSON (deterministic key order)
  const orderedKeys = [
    'video_id',
    'predicted_dps',
    'predicted_range',
    'confidence',
    'model_version',
    'top_features',
    'explanation',
    'timestamp_utc'
  ];

  const orderedPayload: any = {};
  orderedKeys.forEach(key => {
    orderedPayload[key] = (normalizedPayload as any)[key];
  });

  const jsonString = JSON.stringify(orderedPayload);

  // Generate SHA-256 hash
  const hash = crypto
    .createHash('sha256')
    .update(jsonString)
    .digest('hex');

  return {
    hash,
    algorithm: 'sha256',
    payload: normalizedPayload,
    created_at: new Date().toISOString()
  };
}

/**
 * Verify a prediction hash
 *
 * @param hash - Hash to verify
 * @param payload - Original prediction payload
 * @returns True if hash matches payload
 */
export function verifyPredictionHash(
  hash: string,
  payload: PredictionPayload
): boolean {
  const result = generatePredictionHash(payload);
  return result.hash === hash;
}

/**
 * Create prediction payload from hybrid predictor output
 *
 * @param predictionResult - Output from predictVirality()
 * @param videoId - Video ID from video_files table
 * @returns Formatted payload ready for hashing
 */
export function createPayloadFromPrediction(
  predictionResult: any,
  videoId: string
): PredictionPayload {
  const predictionInterval = predictionResult.predictionInterval || {
    lower: predictionResult.finalDpsPrediction - 15,
    upper: predictionResult.finalDpsPrediction + 15
  };

  return {
    video_id: videoId,
    predicted_dps: predictionResult.finalDpsPrediction,
    predicted_range: [predictionInterval.lower, predictionInterval.upper],
    confidence: predictionResult.confidence,
    model_version: predictionResult.modelUsed === 'hybrid' ? 'hybrid_v1.0' : 'xgb_v1.0',
    top_features: predictionResult.topFeatures.slice(0, 10),
    explanation: predictionResult.qualitativeAnalysis?.reasoning ||
                 `Predicted ${predictionResult.finalDpsPrediction.toFixed(1)} DPS based on ${predictionResult.featureCount} features`,
    timestamp_utc: predictionResult.timestamp
  };
}

// =====================================================
// Exports
// =====================================================

export const PredictionHash = {
  generate: generatePredictionHash,
  verify: verifyPredictionHash,
  createPayload: createPayloadFromPrediction
};

export default PredictionHash;

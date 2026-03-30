/**
 * XGBoost Predictor Service
 *
 * Provides DPS predictions using trained XGBoost model
 *
 * IMPLEMENTATION OPTIONS:
 * 1. Python microservice (recommended) - Call Python API with trained model
 * 2. ONNX runtime (future) - Convert XGBoost to ONNX and run in TypeScript
 * 3. Pre-computed (current) - Use predictions from training for known videos
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface XGBoostPredictionInput {
  featureVector: number[]; // 119 features
  videoId?: string;
}

export interface XGBoostPredictionOutput {
  baseDpsPrediction: number;
  confidence: number; // 0-1
  topFeatures: {
    name: string;
    value: number;
    importance: number;
  }[];
  predictionInterval?: {
    lower: number;
    upper: number;
  };
  processingTimeMs: number;
}

/**
 * Predict DPS using XGBoost model via Python
 */
export async function predictWithXGBoost(
  input: XGBoostPredictionInput
): Promise<XGBoostPredictionOutput> {
  const startTime = Date.now();

  try {
    // Option 1: Call Python prediction script
    const prediction = await predictViaPython(input.featureVector);

    const processingTimeMs = Date.now() - startTime;

    return {
      ...prediction,
      processingTimeMs,
    };
  } catch (error: any) {
    console.error('XGBoost prediction error:', error.message);

    // Fallback: Use simple baseline (mean DPS from training)
    return {
      baseDpsPrediction: 53.77, // Mean DPS from 116 videos
      confidence: 0.3, // Low confidence for fallback
      topFeatures: [],
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Call Python prediction script
 */
async function predictViaPython(
  featureVector: number[]
): Promise<Omit<XGBoostPredictionOutput, 'processingTimeMs'>> {
  // Create temp file with feature vector
  const tempFile = path.join(process.cwd(), 'temp_features.json');
  fs.writeFileSync(tempFile, JSON.stringify({ features: featureVector }));

  try {
    // Call Python prediction script
    const { stdout } = await execAsync(
      `python scripts/predict-xgboost.py ${tempFile}`,
      { timeout: 10000 }
    );

    // Clean up temp file
    fs.unlinkSync(tempFile);

    // Parse Python output
    const result = JSON.parse(stdout);

    return {
      baseDpsPrediction: result.prediction,
      confidence: result.confidence,
      topFeatures: result.top_features || [],
      predictionInterval: result.prediction_interval,
    };
  } catch (error: any) {
    // Clean up temp file on error
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    throw error;
  }
}

/**
 * Load feature importance from trained model
 */
export function loadFeatureImportance(): Record<string, number> {
  try {
    const metricsPath = path.join(process.cwd(), 'models', 'training-metrics.json');
    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));

    const importance: Record<string, number> = {};
    for (const feature of metrics.top_features || []) {
      importance[feature.feature] = feature.importance;
    }

    return importance;
  } catch (error) {
    console.error('Error loading feature importance:', error);
    return {};
  }
}

/**
 * Get top contributing features for a given feature vector
 */
export function getTopFeatures(
  featureVector: number[],
  featureNames: string[],
  topN = 10
): { name: string; value: number; importance: number }[] {
  const importance = loadFeatureImportance();

  const features = featureVector.map((value, idx) => ({
    name: featureNames[idx] || `feature_${idx}`,
    value,
    importance: importance[featureNames[idx]] || 0,
    score: Math.abs(value) * (importance[featureNames[idx]] || 0),
  }));

  return features
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ name, value, importance }) => ({ name, value, importance }));
}

/**
 * Check if XGBoost model is available
 */
export function isModelAvailable(): boolean {
  const modelPath = path.join(process.cwd(), 'models', 'xgboost-dps-model.json');
  const metricsPath = path.join(process.cwd(), 'models', 'training-metrics.json');

  return fs.existsSync(modelPath) && fs.existsSync(metricsPath);
}

/**
 * Get model training metrics
 */
export function getModelMetrics() {
  try {
    const metricsPath = path.join(process.cwd(), 'models', 'training-metrics.json');
    return JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
  } catch (error) {
    return null;
  }
}

/**
 * Estimate confidence based on feature vector
 * This is a heuristic until we implement proper uncertainty quantification
 */
export function estimateConfidence(featureVector: number[]): number {
  // Simple heuristic: confidence based on feature completeness
  const nonZeroFeatures = featureVector.filter(v => v !== 0).length;
  const completeness = nonZeroFeatures / featureVector.length;

  // Confidence ranges from 0.5 (50% features) to 0.9 (100% features)
  return 0.5 + (completeness * 0.4);
}

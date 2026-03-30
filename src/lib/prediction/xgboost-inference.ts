/**
 * XGBoost v10 Inference Engine (Pure TypeScript)
 *
 * Loads the trained XGBoost model (JSON tree format), scaler, and feature list.
 * v9 = v8 (48 features) + 3 validated features:
 *   text_overlay_density, visual_proof_ratio, vocal_confidence_composite
 *
 * Missing features (null) are filled with training mean → scales to 0 (neutral).
 * Account metadata (followers, hashtags) has been removed to eliminate bias.
 * Only content-quality features from the video itself are used.
 *
 * No Python subprocess — runs entirely in Node.js.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface XGBoostTree {
  base_weights: number[];
  left_children: number[];
  right_children: number[];
  split_conditions: number[];
  split_indices: number[];
  default_left: number[];
  split_type: number[];
}

interface XGBoostModel {
  learner: {
    gradient_booster: {
      model: {
        trees: XGBoostTree[];
        gbtree_model_param: { num_trees: string };
      };
    };
    learner_model_param: {
      base_score: string;
      num_feature: string;
    };
  };
}

interface ScalerData {
  mean: number[];
  std: number[];
  feature_names: string[];
}

export interface XGBoostPredictionResult {
  vps: number;
  raw_prediction: number;
  model_version: string;
  features_provided: number;
  features_total: number;
  missing_features: string[];
}

// ============================================================================
// SINGLETON MODEL CACHE
// ============================================================================

let cachedModel: XGBoostModel | null = null;
let cachedScaler: ScalerData | null = null;
let cachedFeatureNames: string[] | null = null;

function getModelsDir(): string {
  return join(process.cwd(), 'models');
}

function loadModel(): XGBoostModel {
  if (cachedModel) return cachedModel;
  const path = join(getModelsDir(), 'xgboost-v10-model.json');
  cachedModel = JSON.parse(readFileSync(path, 'utf-8'));
  return cachedModel!;
}

function loadScaler(): ScalerData {
  if (cachedScaler) return cachedScaler;
  const path = join(getModelsDir(), 'xgboost-v10-scaler.json');
  cachedScaler = JSON.parse(readFileSync(path, 'utf-8'));
  return cachedScaler!;
}

function loadFeatureNames(): string[] {
  if (cachedFeatureNames) return cachedFeatureNames;
  const path = join(getModelsDir(), 'xgboost-v10-features.json');
  cachedFeatureNames = JSON.parse(readFileSync(path, 'utf-8'));
  return cachedFeatureNames!;
}

// ============================================================================
// TREE TRAVERSAL
// ============================================================================

/**
 * Traverse a single XGBoost tree from root (node 0) to a leaf.
 * Returns the leaf's base_weight (the tree's contribution to the sum).
 */
function traverseTree(tree: XGBoostTree, features: number[]): number {
  let nodeIdx = 0;

  while (true) {
    const leftChild = tree.left_children[nodeIdx];
    const rightChild = tree.right_children[nodeIdx];

    // Leaf node: both children are -1
    if (leftChild === -1 && rightChild === -1) {
      return tree.base_weights[nodeIdx];
    }

    const splitFeatureIdx = tree.split_indices[nodeIdx];
    const splitCondition = tree.split_conditions[nodeIdx];
    const featureValue = features[splitFeatureIdx];

    // Handle missing (NaN) values — follow default direction
    if (featureValue === null || featureValue === undefined || isNaN(featureValue)) {
      nodeIdx = tree.default_left[nodeIdx] ? leftChild : rightChild;
    } else if (featureValue < splitCondition) {
      nodeIdx = leftChild;
    } else {
      nodeIdx = rightChild;
    }
  }
}

// ============================================================================
// MAIN PREDICTION
// ============================================================================

/**
 * Run XGBoost v10 inference on a flat feature object.
 *
 * @param featureValues - Object mapping feature name → numeric value.
 *   Boolean features (text_has_cta) should be 0 or 1.
 * @returns VPS prediction (0-100) with metadata.
 */
export function predictXGBoostV10(
  featureValues: Record<string, number | boolean | null>
): XGBoostPredictionResult {
  const model = loadModel();
  const scaler = loadScaler();
  const featureNames = loadFeatureNames();

  const trees = model.learner.gradient_booster.model.trees;

  // Parse base_score — format is "[4.9847622E1]"
  const baseScoreStr = model.learner.learner_model_param.base_score;
  const baseScore = parseFloat(baseScoreStr.replace(/[\[\]]/g, ''));

  // Build feature vector in canonical order
  const missingFeatures: string[] = [];
  const rawFeatures: number[] = new Array(featureNames.length);

  for (let i = 0; i < featureNames.length; i++) {
    const name = featureNames[i];
    const val = featureValues[name];

    if (val === null || val === undefined) {
      rawFeatures[i] = scaler.mean[i]; // Fill missing with training mean → scales to 0 (neutral)
      missingFeatures.push(name);
    } else if (typeof val === 'boolean') {
      rawFeatures[i] = val ? 1 : 0;
    } else {
      rawFeatures[i] = val;
    }
  }

  // Apply StandardScaler: (x - mean) / std
  const scaledFeatures: number[] = new Array(featureNames.length);
  for (let i = 0; i < featureNames.length; i++) {
    const std = scaler.std[i];
    if (std === 0 || isNaN(std)) {
      scaledFeatures[i] = 0; // Avoid division by zero
    } else {
      scaledFeatures[i] = (rawFeatures[i] - scaler.mean[i]) / std;
    }
  }

  // Sum tree predictions + base_score
  let prediction = baseScore;
  for (const tree of trees) {
    prediction += traverseTree(tree, scaledFeatures);
  }

  // Clamp to [0, 100]
  const clampedVps = Math.max(0, Math.min(100, prediction));

  return {
    vps: Math.round(clampedVps * 10) / 10, // 1 decimal place
    raw_prediction: prediction,
    model_version: 'v10',
    features_provided: featureNames.length - missingFeatures.length,
    features_total: featureNames.length,
    missing_features: missingFeatures,
  };
}

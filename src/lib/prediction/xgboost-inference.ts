/**
 * XGBoost Inference Engine (Pure TypeScript)
 *
 * Supports multiple model versions via `predictXGBoost(features, modelVersion)`.
 * - v10: StandardScaler (mean/std), 58 features. Trained on 863 videos.
 * - v15: MinMax scaling + label-encoded categoricals + one derived column.
 *        91 features. Trained on 5,645 videos.
 *
 * Missing features (null) fall through XGBoost's `default_left` direction at
 * each split — matches how the training code handled NaN.
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

/** v10-style standard scaler (mean/std). */
interface StandardScalerData {
  mean: number[];
  std: number[];
  feature_names: string[];
}

/** v15-style min-max scaler + label encoders + binary flags + derived columns. */
interface MinMaxScalerData {
  scaler_type: 'minmax';
  feature_names: string[];
  min: (number | null)[];
  max: (number | null)[];
  constant: boolean[];
  binary_features: string[];
  categorical_encoders: Record<string, string[]>;
  computed_features: string[];
}

type AnyScalerData = StandardScalerData | MinMaxScalerData;

function isMinMaxScaler(s: AnyScalerData): s is MinMaxScalerData {
  return (s as MinMaxScalerData).scaler_type === 'minmax';
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
// ARTEFACT LOADING (cached per model version)
// ============================================================================

interface LoadedModel {
  model: XGBoostModel;
  scaler: AnyScalerData;
  featureNames: string[];
}

const modelCache = new Map<string, LoadedModel>();

function getModelsDir(): string {
  return join(process.cwd(), 'models');
}

/**
 * Normalize a DB-resolved model_version string (e.g. "v15-honest-with-res")
 * into the filename prefix we use for artefacts ("v15", "v10", ...).
 */
function resolveArtefactPrefix(version: string): 'v10' | 'v15' {
  const v = version.toLowerCase();
  if (v.startsWith('v15')) return 'v15';
  // Anything else (including 'v10', 'default', unknown, or legacy) maps to v10.
  return 'v10';
}

function loadArtefacts(version: string): LoadedModel {
  const prefix = resolveArtefactPrefix(version);
  const cached = modelCache.get(prefix);
  if (cached) return cached;

  const dir = getModelsDir();
  const model = JSON.parse(
    readFileSync(join(dir, `xgboost-${prefix}-model.json`), 'utf-8'),
  ) as XGBoostModel;
  const scaler = JSON.parse(
    readFileSync(join(dir, `xgboost-${prefix}-scaler.json`), 'utf-8'),
  ) as AnyScalerData;
  const featureNames = JSON.parse(
    readFileSync(join(dir, `xgboost-${prefix}-features.json`), 'utf-8'),
  ) as string[];

  const loaded: LoadedModel = { model, scaler, featureNames };
  modelCache.set(prefix, loaded);
  return loaded;
}

// ============================================================================
// TREE TRAVERSAL
// ============================================================================

/**
 * Traverse a single XGBoost tree from root (node 0) to a leaf.
 * Returns the leaf's base_weight (the tree's contribution to the sum).
 *
 * XGBoost's C predictor performs the split comparison in float32. JavaScript
 * Numbers are float64, so a value equal-at-float32 but different-at-float64
 * would route differently here than in the real booster. `Math.fround` snaps
 * both operands to float32 so traversal matches XGBoost bit-for-bit.
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
    const splitCondition = Math.fround(tree.split_conditions[nodeIdx]);
    const featureValue = features[splitFeatureIdx];

    // Handle missing (NaN) values — follow default direction
    if (featureValue === null || featureValue === undefined || isNaN(featureValue)) {
      nodeIdx = tree.default_left[nodeIdx] ? leftChild : rightChild;
    } else if (Math.fround(featureValue) < splitCondition) {
      nodeIdx = leftChild;
    } else {
      nodeIdx = rightChild;
    }
  }
}

// ============================================================================
// SCALING DISPATCH
// ============================================================================

/**
 * v10 path: coerce raw values, fill missing with training mean, then
 * (x - mean) / std. Identical to the pre-v15 implementation.
 */
function buildStandardScaledVector(
  featureValues: Record<string, number | boolean | null>,
  featureNames: string[],
  scaler: StandardScalerData,
): { scaled: number[]; missing: string[] } {
  const missing: string[] = [];
  const raw = new Array<number>(featureNames.length);
  for (let i = 0; i < featureNames.length; i++) {
    const name = featureNames[i];
    const val = featureValues[name];
    if (val === null || val === undefined) {
      raw[i] = scaler.mean[i];
      missing.push(name);
    } else if (typeof val === 'boolean') {
      raw[i] = val ? 1 : 0;
    } else {
      raw[i] = val;
    }
  }
  const scaled = new Array<number>(featureNames.length);
  for (let i = 0; i < featureNames.length; i++) {
    const std = scaler.std[i];
    if (std === 0 || isNaN(std)) {
      scaled[i] = 0;
    } else {
      scaled[i] = (raw[i] - scaler.mean[i]) / std;
    }
  }
  return { scaled, missing };
}

/**
 * v15 path — three-pass transform mirroring retrain_s7.py:encode_and_scale().
 *
 *   1. For each feature:
 *      - CATEGORICAL (only `sound_type` today): LabelEncoder lookup; unknown → -1
 *      - BINARY: passthrough 0/1
 *      - CONSTANT-column: 0.5 if value present, else NaN
 *      - CONTINUOUS: (value - min) / (max - min), NaN stays NaN
 *   2. Compute derived features (creator_followers_log_computed). The training
 *      code computed this AFTER creator_followers_count had been scaled, so we
 *      do the same: log10(max(scaled_followers, 1)), then min-max scale that.
 *   3. Return the feature vector.
 *
 * Missing features are left as NaN so XGBoost's default_left branch handles them.
 */
function buildMinMaxScaledVector(
  featureValues: Record<string, number | boolean | null>,
  featureNames: string[],
  scaler: MinMaxScalerData,
): { scaled: number[]; missing: string[] } {
  const missing: string[] = [];
  const out = new Array<number>(featureNames.length);
  const binarySet = new Set(scaler.binary_features);
  const encoders = scaler.categorical_encoders || {};
  const nameToIdx = new Map<string, number>();
  for (let i = 0; i < featureNames.length; i++) nameToIdx.set(featureNames[i], i);

  // Pass 1 — encode and scale everything except computed derived features
  for (let i = 0; i < featureNames.length; i++) {
    const name = featureNames[i];
    if (scaler.computed_features?.includes(name)) {
      out[i] = NaN; // filled in Pass 2
      continue;
    }
    const val = featureValues[name];
    const encoder = encoders[name];

    if (encoder) {
      // Categorical — the training LabelEncoder used the literal string '__NaN__'
      // for nulls, so honour that when the raw value is null/undefined.
      const str = val === null || val === undefined ? '__NaN__' : String(val);
      const idx = encoder.indexOf(str);
      if (idx === -1) {
        out[i] = -1; // unseen category
        if (val === null || val === undefined) missing.push(name);
      } else {
        out[i] = idx;
      }
      continue;
    }

    if (binarySet.has(name)) {
      if (val === null || val === undefined) {
        out[i] = NaN;
        missing.push(name);
      } else if (typeof val === 'boolean') {
        out[i] = val ? 1 : 0;
      } else {
        out[i] = Number(val);
      }
      continue;
    }

    // Continuous
    if (val === null || val === undefined) {
      out[i] = NaN;
      missing.push(name);
      continue;
    }
    const numeric = typeof val === 'boolean' ? (val ? 1 : 0) : Number(val);
    if (scaler.constant[i]) {
      out[i] = Number.isFinite(numeric) ? 0.5 : NaN;
      continue;
    }
    const mn = scaler.min[i];
    const mx = scaler.max[i];
    if (mn === null || mx === null || mn === mx) {
      out[i] = NaN;
      continue;
    }
    out[i] = (numeric - mn) / (mx - mn);
  }

  // Pass 2 — derived columns (only creator_followers_log_computed today)
  const cflIdx = nameToIdx.get('creator_followers_log_computed');
  if (cflIdx !== undefined) {
    const srcIdx = nameToIdx.get('creator_followers_count');
    if (srcIdx !== undefined) {
      const scaledFollowers = out[srcIdx];
      if (Number.isFinite(scaledFollowers)) {
        const logged = Math.log10(Math.max(scaledFollowers, 1));
        const mn = scaler.min[cflIdx];
        const mx = scaler.max[cflIdx];
        if (mn !== null && mx !== null && mn !== mx) {
          out[cflIdx] = (logged - mn) / (mx - mn);
        } else {
          out[cflIdx] = logged;
        }
      } else {
        out[cflIdx] = NaN;
        missing.push('creator_followers_log_computed');
      }
    }
  }

  return { scaled: out, missing };
}

// ============================================================================
// MAIN PREDICTION
// ============================================================================

/**
 * Run XGBoost inference against the requested model version.
 *
 * @param featureValues - Object mapping feature name → numeric/boolean/null.
 * @param modelVersion  - DB-resolved version string ("v10", "v15-honest-with-res", ...).
 *                        Anything starting with "v15" loads v15 artefacts; everything
 *                        else falls back to v10 (the historical default).
 */
export function predictXGBoost(
  featureValues: Record<string, number | boolean | null>,
  modelVersion: string = 'v10',
): XGBoostPredictionResult {
  const { model, scaler, featureNames } = loadArtefacts(modelVersion);
  const prefix = resolveArtefactPrefix(modelVersion);

  const trees = model.learner.gradient_booster.model.trees;
  const baseScoreStr = model.learner.learner_model_param.base_score;
  const baseScore = parseFloat(baseScoreStr.replace(/[\[\]]/g, ''));

  let scaled: number[];
  let missing: string[];
  if (isMinMaxScaler(scaler)) {
    ({ scaled, missing } = buildMinMaxScaledVector(featureValues, featureNames, scaler));
  } else {
    ({ scaled, missing } = buildStandardScaledVector(featureValues, featureNames, scaler));
  }

  let prediction = baseScore;
  for (const tree of trees) {
    prediction += traverseTree(tree, scaled);
  }

  const clampedVps = Math.max(0, Math.min(100, prediction));

  return {
    vps: Math.round(clampedVps * 10) / 10,
    raw_prediction: prediction,
    model_version: prefix === 'v15' ? 'v15-honest-with-res' : 'v10',
    features_provided: featureNames.length - missing.length,
    features_total: featureNames.length,
    missing_features: missing,
  };
}

/**
 * Legacy alias — kept so existing callers continue to compile. Always targets v10.
 * New call sites should use `predictXGBoost(features, modelVersion)`.
 */
export function predictXGBoostV10(
  featureValues: Record<string, number | boolean | null>,
): XGBoostPredictionResult {
  return predictXGBoost(featureValues, 'v10');
}

/**
 * XGBoost Virality Service
 * 
 * ML-based virality prediction using XGBoost models trained on viral video data.
 * Provides DPS predictions based on FFmpeg and text features.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface XGBoostPredictionInput {
  features: Record<string, number | boolean | undefined>;
  niche: 'side_hustles' | 'personal_finance';
}

export interface XGBoostPredictionResult {
  success: boolean;
  predicted_dps: number;
  confidence: number;
  model_version: string;
  feature_importance: Record<string, number>;
  error?: string;
}

// ============================================================================
// FEATURE IMPORTANCE (from trained models)
// ============================================================================

const FEATURE_IMPORTANCE = {
  // Top FFmpeg features
  duration_seconds: 0.15,
  motion_score: 0.12,
  hook_scene_changes: 0.10,
  brightness_avg: 0.08,
  visual_complexity: 0.07,
  
  // Top text features
  word_count: 0.10,
  hook_word_count: 0.08,
  question_count: 0.06,
  power_word_count: 0.05,
  
  // Audio/visual
  has_music: 0.05,
  has_faces: 0.05,
  face_time_ratio: 0.04,
  avg_volume: 0.03,
  contrast_ratio: 0.02,
};

// ============================================================================
// XGBOOST VIRALITY SERVICE
// ============================================================================

// ============================================================================
// MODEL VERSION SWITCH
// Set MODEL_VERSION=xgb_v6 in .env.local to use the trained v6 model
// ============================================================================

const ACTIVE_MODEL_VERSION = process.env.MODEL_VERSION === 'xgb_v6' ? 'v6' : 'v5-simplified';

export const xgboostViralityService = {
  /**
   * Predict DPS using XGBoost model
   * 
   * When MODEL_VERSION=xgb_v6: calls Python XGBoost model with 41-feature vector
   * Otherwise: uses simplified heuristic (v5-simplified)
   */
  async predict(input: XGBoostPredictionInput): Promise<XGBoostPredictionResult> {
    // ── v6: delegate to Python XGBoost model ──────────────────────────────
    if (ACTIVE_MODEL_VERSION === 'v6') {
      return this._predictV6(input);
    }

    // ── v5-simplified: heuristic fallback ─────────────────────────────────
    return this._predictV5Heuristic(input);
  },

  /**
   * v6: Call real XGBoost model via Python subprocess
   */
  async _predictV6(input: XGBoostPredictionInput): Promise<XGBoostPredictionResult> {
    try {
      const { features } = input;
      // Build the 41-feature vector in the order expected by v6
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const fs = await import('fs');
      const path = await import('path');
      const execAsync = promisify(exec);

      // Load feature names from v6 metadata
      const namesPath = path.join(process.cwd(), 'models', 'xgboost-v6-features.json');
      if (!fs.existsSync(namesPath)) {
        return {
          success: false,
          predicted_dps: 0,
          confidence: 0,
          model_version: 'v6',
          feature_importance: {},
          error: 'v6 feature names not found. Run: python scripts/train-xgboost-v6.py',
        };
      }

      const featureNames: string[] = JSON.parse(fs.readFileSync(namesPath, 'utf-8'));
      const featureVector = featureNames.map(name => {
        const val = features[name];
        if (val === undefined || val === null) return 0;
        return typeof val === 'boolean' ? (val ? 1 : 0) : Number(val) || 0;
      });

      // Write temp file for Python
      const tempFile = path.join(process.cwd(), `temp_v6_features_${Date.now()}.json`);
      fs.writeFileSync(tempFile, JSON.stringify({ features: featureVector }));

      try {
        const { stdout } = await execAsync(
          `python scripts/predict-xgboost.py "${tempFile}"`,
          { timeout: 15000, env: { ...process.env, MODEL_VERSION: 'xgb_v6' } },
        );
        fs.unlinkSync(tempFile);

        const result = JSON.parse(stdout);
        return {
          success: true,
          predicted_dps: Math.round(Math.max(0, Math.min(100, result.prediction)) * 10) / 10,
          confidence: result.confidence ?? 0.7,
          model_version: 'v6',
          feature_importance: Object.fromEntries(
            (result.top_features || []).map((f: any) => [f.name, f.importance]),
          ),
        };
      } catch (err: any) {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        throw err;
      }
    } catch (error: any) {
      console.error('[XGBoost v6] Prediction error, falling back to v5:', error.message);
      // Fallback to v5 heuristic on failure
      return this._predictV5Heuristic(input);
    }
  },

  /**
   * v5-simplified: Heuristic-based prediction
   */
  async _predictV5Heuristic(input: XGBoostPredictionInput): Promise<XGBoostPredictionResult> {
    try {
      const { features, niche } = input;
      
      // Validate we have some features
      const featureKeys = Object.keys(features).filter(k => features[k] !== undefined);
      if (featureKeys.length < 5) {
        return {
          success: false,
          predicted_dps: 0,
          confidence: 0,
          model_version: 'v5-simplified',
          feature_importance: {},
          error: 'Insufficient features for prediction (need at least 5)',
        };
      }
      
      // Calculate weighted score based on feature importance
      let weightedSum = 0;
      let totalWeight = 0;
      const usedFeatures: Record<string, number> = {};
      
      for (const [key, importance] of Object.entries(FEATURE_IMPORTANCE)) {
        const value = features[key];
        if (value !== undefined) {
          // Normalize feature values to 0-1 range based on typical ranges
          let normalizedValue = 0;
          
          if (typeof value === 'boolean') {
            normalizedValue = value ? 1 : 0;
          } else if (key === 'duration_seconds') {
            // Optimal duration is 15-45s
            normalizedValue = value >= 15 && value <= 45 ? 1 : value / 60;
          } else if (key === 'motion_score' || key === 'visual_complexity') {
            normalizedValue = Math.min(1, value);
          } else if (key === 'word_count') {
            // Optimal word count varies, normalize to ~100 words
            normalizedValue = Math.min(1, value / 100);
          } else if (key === 'hook_word_count') {
            normalizedValue = Math.min(1, value / 20);
          } else if (key === 'question_count' || key === 'power_word_count') {
            normalizedValue = Math.min(1, value / 5);
          } else if (key === 'brightness_avg') {
            // Optimal brightness around 50-70
            normalizedValue = (value >= 40 && value <= 80) ? 1 : 0.5;
          } else if (key === 'hook_scene_changes') {
            // 2-5 scene changes in hook is good
            normalizedValue = (value >= 2 && value <= 5) ? 1 : Math.min(1, value / 5);
          } else {
            normalizedValue = Math.min(1, Math.abs(Number(value)));
          }
          
          weightedSum += normalizedValue * importance;
          totalWeight += importance;
          usedFeatures[key] = importance;
        }
      }
      
      // Calculate base DPS prediction (scaled to 20-85 range typical for real videos)
      const normalizedScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
      const baseDps = 20 + (normalizedScore * 65);
      
      // Apply niche adjustment
      const nicheMultiplier = niche === 'personal_finance' ? 1.05 : 1.0;
      const predictedDps = Math.min(100, Math.max(0, baseDps * nicheMultiplier));
      
      // Calculate confidence based on feature coverage
      const targetFeatures = Object.keys(FEATURE_IMPORTANCE).length;
      const coverage = featureKeys.length / targetFeatures;
      const confidence = Math.min(0.95, 0.5 + (coverage * 0.45));
      
      return {
        success: true,
        predicted_dps: Math.round(predictedDps * 10) / 10,
        confidence: Math.round(confidence * 100) / 100,
        model_version: 'v5-simplified',
        feature_importance: usedFeatures,
      };
    } catch (error: any) {
      return {
        success: false,
        predicted_dps: 0,
        confidence: 0,
        model_version: 'v5-simplified',
        feature_importance: {},
        error: error.message,
      };
    }
  },
  
  /**
   * Get model information
   */
  getModelInfo(niche: 'side_hustles' | 'personal_finance') {
    if (ACTIVE_MODEL_VERSION === 'v6') {
      return {
        model_name: `xgboost_virality_${niche}_v6`,
        version: 'v6',
        trained_on: 'side_hustles training CSV (actual DPS labels)',
        correlation: null, // determined at eval time
        feature_count: 41,
        supported_niches: ['side_hustles', 'personal_finance'],
      };
    }
    return {
      model_name: `xgboost_virality_${niche}_v5`,
      version: 'v5-simplified',
      trained_on: '3126 videos',
      correlation: niche === 'personal_finance' ? 0.85 : 0.61,
      feature_count: Object.keys(FEATURE_IMPORTANCE).length,
      supported_niches: ['side_hustles', 'personal_finance'],
    };
  },
};

export default xgboostViralityService;

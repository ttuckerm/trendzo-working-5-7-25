"""
XGBoost Prediction Script

Called by TypeScript to get predictions from trained XGBoost model

Usage:
    python scripts/predict-xgboost.py <feature_file.json>

Input JSON format:
    {"features": [119 numeric values]}

Output JSON format:
    {
        "prediction": 72.5,
        "confidence": 0.85,
        "prediction_interval": {"lower": 65.3, "upper": 79.7},
        "top_features": [...]
    }
"""

import sys
import os
import json
import numpy as np
import xgboost as xgb
import pickle
from pathlib import Path

# Paths — resolve based on MODEL_VERSION env var
MODEL_DIR = Path('models')
_model_version = os.environ.get('MODEL_VERSION', 'v5')

if _model_version == 'xgb_v7':
    MODEL_PATH = MODEL_DIR / 'xgboost-v7-model.json'
    SCALER_PATH = MODEL_DIR / 'xgboost-v7-scaler.pkl'
    FEATURE_NAMES_PATH = MODEL_DIR / 'xgboost-v7-features.json'
    METRICS_PATH = MODEL_DIR / 'xgboost-v7-metadata.json'
elif _model_version == 'xgb_v6':
    MODEL_PATH = MODEL_DIR / 'xgboost-v6-model.json'
    SCALER_PATH = MODEL_DIR / 'xgboost-v6-scaler.pkl'
    FEATURE_NAMES_PATH = MODEL_DIR / 'xgboost-v6-features.json'
    METRICS_PATH = MODEL_DIR / 'xgboost-v6-metadata.json'
else:
    MODEL_PATH = MODEL_DIR / 'xgboost-dps-model.json'
    SCALER_PATH = MODEL_DIR / 'feature-scaler.pkl'
    FEATURE_NAMES_PATH = MODEL_DIR / 'feature-names.json'
    METRICS_PATH = MODEL_DIR / 'training-metrics.json'

def load_model():
    """Load trained XGBoost model and scaler"""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

    model = xgb.XGBRegressor()
    model.load_model(str(MODEL_PATH))

    if SCALER_PATH.exists():
        with open(SCALER_PATH, 'rb') as f:
            scaler = pickle.load(f)
    else:
        scaler = None

    return model, scaler

def load_feature_names():
    """Load feature names"""
    if FEATURE_NAMES_PATH.exists():
        with open(FEATURE_NAMES_PATH, 'r') as f:
            return json.load(f)
    # Fallback: guess feature count from model if available
    try:
        model = xgb.XGBRegressor()
        model.load_model(str(MODEL_PATH))
        return [f'feature_{i}' for i in range(model.n_features_in_)]
    except Exception:
        return [f'feature_{i}' for i in range(119)]

def load_feature_importance():
    """Load feature importance from training metrics"""
    if METRICS_PATH.exists():
        with open(METRICS_PATH, 'r') as f:
            metrics = json.load(f)
            return {f['feature']: f['importance'] for f in metrics.get('top_features', [])}
    return {}

def estimate_confidence(feature_vector):
    """Estimate prediction confidence"""
    # Simple heuristic: confidence based on feature completeness
    non_zero = np.count_nonzero(feature_vector)
    completeness = non_zero / len(feature_vector)

    # Confidence ranges from 0.5 to 0.9
    return float(0.5 + (completeness * 0.4))

def get_prediction_interval(prediction, confidence, metrics_path=METRICS_PATH):
    """Estimate 95% prediction interval"""
    try:
        with open(metrics_path, 'r') as f:
            metrics = json.load(f)
            test_rmse = metrics['final_performance']['test_rmse']

            # 95% prediction interval: ±1.96 * RMSE
            margin = 1.96 * test_rmse

            return {
                'lower': float(max(0, prediction - margin)),
                'upper': float(min(100, prediction + margin))
            }
    except:
        # Default to ±15 points if metrics not available
        return {
            'lower': float(max(0, prediction - 15)),
            'upper': float(min(100, prediction + 15))
        }

def predict(feature_vector):
    """Make prediction using trained model"""
    # Load model and scaler
    model, scaler = load_model()
    feature_names = load_feature_names()
    feature_importance = load_feature_importance()

    # Convert to numpy array
    X = np.array(feature_vector).reshape(1, -1)

    # Scale features if scaler exists
    if scaler is not None:
        X_scaled = scaler.transform(X)
    else:
        X_scaled = X

    # Make prediction
    prediction = float(model.predict(X_scaled)[0])

    # Clamp to valid DPS range
    prediction = max(0, min(100, prediction))

    # Estimate confidence
    confidence = estimate_confidence(feature_vector)

    # Get prediction interval
    prediction_interval = get_prediction_interval(prediction, confidence)

    # Get top contributing features
    top_features = []
    for i, (name, value) in enumerate(zip(feature_names, feature_vector)):
        importance = feature_importance.get(name, 0)
        contribution = abs(value) * importance
        top_features.append({
            'name': name,
            'value': float(value),
            'importance': float(importance),
            'contribution': float(contribution)
        })

    # Sort by contribution and take top 10
    top_features.sort(key=lambda x: x['contribution'], reverse=True)
    top_features = top_features[:10]

    return {
        'prediction': prediction,
        'confidence': confidence,
        'prediction_interval': prediction_interval,
        'top_features': top_features
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: python predict-xgboost.py <feature_file.json>'}))
        sys.exit(1)

    feature_file = sys.argv[1]

    try:
        # Load features from file
        with open(feature_file, 'r') as f:
            data = json.load(f)

        feature_vector = data['features']

        expected_count = len(load_feature_names())
        if len(feature_vector) != expected_count:
            raise ValueError(f'Expected {expected_count} features, got {len(feature_vector)}')

        # Make prediction
        result = predict(feature_vector)

        # Output as JSON
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'prediction': 53.77,  # Fallback to mean
            'confidence': 0.3,
            'top_features': []
        }))
        sys.exit(1)

if __name__ == '__main__':
    main()

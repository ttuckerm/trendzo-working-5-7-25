"""
Convert XGBoost v7 StandardScaler from pickle to JSON.
Run once: python scripts/convert-scaler-to-json.py
"""
import pickle
import json
import numpy as np

with open('models/xgboost-v7-scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)

output = {
    'mean': scaler.mean_.tolist(),
    'std': scaler.scale_.tolist(),
    'feature_names': scaler.feature_names_in_.tolist() if hasattr(scaler, 'feature_names_in_') else None,
}

# Validate lengths
with open('models/xgboost-v7-features.json') as f:
    feature_names = json.load(f)

assert len(output['mean']) == len(feature_names), f"Mean length {len(output['mean'])} != features {len(feature_names)}"
assert len(output['std']) == len(feature_names), f"Std length {len(output['std'])} != features {len(feature_names)}"

# Use the canonical feature names from the features file
output['feature_names'] = feature_names

with open('models/xgboost-v7-scaler.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f"Wrote models/xgboost-v7-scaler.json ({len(output['mean'])} features)")
print(f"Mean range: [{min(output['mean']):.4f}, {max(output['mean']):.4f}]")
print(f"Std range: [{min(output['std']):.4f}, {max(output['std']):.4f}]")

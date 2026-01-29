# -*- coding: utf-8 -*-
"""
Train XGBoost Model for DPS Prediction

This script:
1. Loads 116 feature vectors from extracted_features.json
2. Trains XGBoost regressor with cross-validation
3. Evaluates model performance
4. Saves model and scaler to disk

Usage:
    python scripts/train-xgboost-model.py

Requirements:
    pip install xgboost scikit-learn pandas numpy matplotlib seaborn
"""

import sys
import io
# Force UTF-8 encoding for Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import pickle
import os

# Configuration
INPUT_FILE = 'extracted_features.json'
MODEL_DIR = 'models'
TEST_SIZE = 0.2
RANDOM_STATE = 42
CV_FOLDS = 5

# Create models directory if it doesn't exist
os.makedirs(MODEL_DIR, exist_ok=True)

print('╔════════════════════════════════════════════════════════════╗')
print('║                                                            ║')
print('║     XGBOOST MODEL TRAINING - DPS PREDICTION                ║')
print('║                                                            ║')
print('╚════════════════════════════════════════════════════════════╝\n')

# Step 1: Load data
print('📥 Step 1: Loading feature vectors...\n')

with open(INPUT_FILE, 'r') as f:
    data = json.load(f)

# Extract features and targets
feature_names = data['featureNames']
features_list = []
targets_list = []
video_ids = []

for item in data['features']:
    features_list.append(item['featureVector'])
    targets_list.append(item['metadata']['dpsScore'])
    video_ids.append(item['videoId'])

X = np.array(features_list)
y = np.array(targets_list)

print(f'✅ Loaded {len(X)} videos')
print(f'   Features: {X.shape[1]}')
print(f'   DPS Range: [{y.min():.2f}, {y.max():.2f}]')
print(f'   DPS Mean: {y.mean():.2f} ± {y.std():.2f}\n')

# Step 2: Split data
print('🔀 Step 2: Splitting train/test sets...\n')

X_train, X_test, y_train, y_test, ids_train, ids_test = train_test_split(
    X, y, video_ids, test_size=TEST_SIZE, random_state=RANDOM_STATE
)

print(f'✅ Train set: {len(X_train)} videos')
print(f'   Test set:  {len(X_test)} videos\n')

# Step 3: Normalize features
print('📊 Step 3: Normalizing features...\n')

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print('✅ Features normalized (StandardScaler)\n')

# Step 4: Train baseline XGBoost model
print('🎯 Step 4: Training baseline XGBoost model...\n')

baseline_model = xgb.XGBRegressor(
    objective='reg:squarederror',
    n_estimators=100,
    learning_rate=0.1,
    max_depth=6,
    random_state=RANDOM_STATE,
    n_jobs=-1
)

baseline_model.fit(X_train_scaled, y_train)

# Evaluate baseline
y_pred_train = baseline_model.predict(X_train_scaled)
y_pred_test = baseline_model.predict(X_test_scaled)

train_r2 = r2_score(y_train, y_pred_train)
test_r2 = r2_score(y_test, y_pred_test)
train_mae = mean_absolute_error(y_train, y_pred_train)
test_mae = mean_absolute_error(y_test, y_pred_test)
train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))

print('✅ Baseline Model Performance:')
print(f'   Train - R²: {train_r2:.3f}, MAE: {train_mae:.2f}, RMSE: {train_rmse:.2f}')
print(f'   Test  - R²: {test_r2:.3f}, MAE: {test_mae:.2f}, RMSE: {test_rmse:.2f}\n')

# Step 5: Hyperparameter tuning
print('⚙️  Step 5: Tuning hyperparameters (GridSearchCV)...\n')

param_grid = {
    'n_estimators': [100, 200, 300],
    'learning_rate': [0.01, 0.05, 0.1],
    'max_depth': [4, 6, 8],
    'min_child_weight': [1, 3, 5],
    'subsample': [0.8, 1.0],
    'colsample_bytree': [0.8, 1.0]
}

grid_search = GridSearchCV(
    estimator=xgb.XGBRegressor(objective='reg:squarederror', random_state=RANDOM_STATE, n_jobs=-1),
    param_grid=param_grid,
    cv=CV_FOLDS,
    scoring='r2',
    verbose=1,
    n_jobs=-1
)

grid_search.fit(X_train_scaled, y_train)

print(f'\n✅ Best parameters found:')
for param, value in grid_search.best_params_.items():
    print(f'   {param}: {value}')
print(f'   Best CV R²: {grid_search.best_score_:.3f}\n')

# Step 6: Train final model with best parameters
print('🏆 Step 6: Training final model with best parameters...\n')

final_model = grid_search.best_estimator_

# Evaluate final model
y_pred_train_final = final_model.predict(X_train_scaled)
y_pred_test_final = final_model.predict(X_test_scaled)

final_train_r2 = r2_score(y_train, y_pred_train_final)
final_test_r2 = r2_score(y_test, y_pred_test_final)
final_train_mae = mean_absolute_error(y_train, y_pred_train_final)
final_test_mae = mean_absolute_error(y_test, y_pred_test_final)
final_train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train_final))
final_test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test_final))

print('✅ Final Model Performance:')
print(f'   Train - R²: {final_train_r2:.3f}, MAE: {final_train_mae:.2f}, RMSE: {final_train_rmse:.2f}')
print(f'   Test  - R²: {final_test_r2:.3f}, MAE: {final_test_mae:.2f}, RMSE: {final_test_rmse:.2f}\n')

# Cross-validation
cv_scores = cross_val_score(final_model, X_train_scaled, y_train, cv=CV_FOLDS, scoring='r2')
print(f'   Cross-Validation R² (5-fold): {cv_scores.mean():.3f} ± {cv_scores.std():.3f}\n')

# Step 7: Feature importance
print('📊 Step 7: Analyzing feature importance...\n')

feature_importance = pd.DataFrame({
    'feature': feature_names,
    'importance': final_model.feature_importances_
}).sort_values('importance', ascending=False)

print('Top 15 Most Important Features:')
for idx, row in feature_importance.head(15).iterrows():
    print(f'   {row["feature"]:<30} {row["importance"]:.4f}')
print()

# Step 8: Save model and scaler
print('💾 Step 8: Saving model and scaler...\n')

# Save XGBoost model
model_path = os.path.join(MODEL_DIR, 'xgboost-dps-model.json')
final_model.save_model(model_path)
print(f'✅ Model saved: {model_path}')

# Save scaler
scaler_path = os.path.join(MODEL_DIR, 'feature-scaler.pkl')
with open(scaler_path, 'wb') as f:
    pickle.dump(scaler, f)
print(f'✅ Scaler saved: {scaler_path}')

# Save feature names
feature_names_path = os.path.join(MODEL_DIR, 'feature-names.json')
with open(feature_names_path, 'w') as f:
    json.dump(feature_names, f, indent=2)
print(f'✅ Feature names saved: {feature_names_path}')

# Save training metrics
metrics = {
    'model_type': 'XGBoost Regressor',
    'training_date': datetime.now().isoformat(),
    'dataset_size': {
        'total': len(X),
        'train': len(X_train),
        'test': len(X_test)
    },
    'dps_statistics': {
        'min': float(y.min()),
        'max': float(y.max()),
        'mean': float(y.mean()),
        'std': float(y.std())
    },
    'baseline_performance': {
        'train_r2': float(train_r2),
        'test_r2': float(test_r2),
        'train_mae': float(train_mae),
        'test_mae': float(test_mae)
    },
    'final_performance': {
        'train_r2': float(final_train_r2),
        'test_r2': float(final_test_r2),
        'train_mae': float(final_train_mae),
        'test_mae': float(final_test_mae),
        'train_rmse': float(final_train_rmse),
        'test_rmse': float(final_test_rmse),
        'cv_r2_mean': float(cv_scores.mean()),
        'cv_r2_std': float(cv_scores.std())
    },
    'best_hyperparameters': grid_search.best_params_,
    'top_features': feature_importance.head(20).to_dict('records')
}

metrics_path = os.path.join(MODEL_DIR, 'training-metrics.json')
with open(metrics_path, 'w') as f:
    json.dump(metrics, f, indent=2)
print(f'✅ Metrics saved: {metrics_path}\n')

# Step 9: Generate visualizations
print('📈 Step 9: Generating visualizations...\n')

# Create visualizations directory
viz_dir = os.path.join(MODEL_DIR, 'visualizations')
os.makedirs(viz_dir, exist_ok=True)

# 1. Actual vs Predicted
plt.figure(figsize=(10, 6))
plt.scatter(y_test, y_pred_test_final, alpha=0.6, edgecolors='k')
plt.plot([y.min(), y.max()], [y.min(), y.max()], 'r--', lw=2)
plt.xlabel('Actual DPS Score')
plt.ylabel('Predicted DPS Score')
plt.title(f'XGBoost Predictions vs Actual (Test Set)\nR² = {final_test_r2:.3f}, MAE = {final_test_mae:.2f}')
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(viz_dir, 'predictions_vs_actual.png'), dpi=300, bbox_inches='tight')
print('✅ Saved: predictions_vs_actual.png')

# 2. Feature importance
plt.figure(figsize=(10, 8))
top_20 = feature_importance.head(20)
plt.barh(range(len(top_20)), top_20['importance'])
plt.yticks(range(len(top_20)), top_20['feature'])
plt.xlabel('Importance')
plt.title('Top 20 Most Important Features')
plt.tight_layout()
plt.savefig(os.path.join(viz_dir, 'feature_importance.png'), dpi=300, bbox_inches='tight')
print('✅ Saved: feature_importance.png')

# 3. Residuals
residuals = y_test - y_pred_test_final
plt.figure(figsize=(10, 6))
plt.scatter(y_pred_test_final, residuals, alpha=0.6, edgecolors='k')
plt.axhline(y=0, color='r', linestyle='--', lw=2)
plt.xlabel('Predicted DPS Score')
plt.ylabel('Residual (Actual - Predicted)')
plt.title('Residual Plot (Test Set)')
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(viz_dir, 'residuals.png'), dpi=300, bbox_inches='tight')
print('✅ Saved: residuals.png\n')

# Step 10: Summary
print('╔════════════════════════════════════════════════════════════╗')
print('║                                                            ║')
print('║     ✅ MODEL TRAINING COMPLETE!                            ║')
print('║                                                            ║')
print('╚════════════════════════════════════════════════════════════╝\n')

print('📊 Final Model Summary:')
print(f'   Algorithm:     XGBoost Regressor')
print(f'   Training Size: {len(X_train)} videos')
print(f'   Test Size:     {len(X_test)} videos')
print(f'   Features:      {X.shape[1]}')
print(f'   Test R²:       {final_test_r2:.3f}')
print(f'   Test MAE:      {final_test_mae:.2f} DPS points')
print(f'   Test RMSE:     {final_test_rmse:.2f} DPS points\n')

print('📁 Saved Files:')
print(f'   • {model_path}')
print(f'   • {scaler_path}')
print(f'   • {feature_names_path}')
print(f'   • {metrics_path}')
print(f'   • {viz_dir}/predictions_vs_actual.png')
print(f'   • {viz_dir}/feature_importance.png')
print(f'   • {viz_dir}/residuals.png\n')

print('💡 Next Steps:')
print('   1. Review training metrics and visualizations')
print('   2. Build TypeScript prediction service')
print('   3. Create GPT-4 refinement layer')
print('   4. Test hybrid pipeline end-to-end\n')

#!/usr/bin/env python3
"""
Convert S7 v15-honest-with-res artefacts into production `models/xgboost-v15-*.json`
files that the TypeScript inference code can load.

Outputs (in C:/Projects/CleanCopy/models/):
  xgboost-v15-model.json       (copied verbatim from results-s7)
  xgboost-v15-features.json    (array of 91 feature names in model order)
  xgboost-v15-scaler.json      (min-max ranges + label encoders + binary flags)
  xgboost-v15-metadata.json    (metrics, hyperparams, audit)

Read-only w.r.t. training artefacts. Overwrites destination files if they exist.
"""
import json
import shutil
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
S7 = os.path.join(ROOT, 'results-s7')
MODELS = os.path.abspath(os.path.join(ROOT, '..', '..', '..', 'models'))

with open(os.path.join(S7, 'results_summary_s7.json')) as f:
    summary = json.load(f)

variant = next(v for v in summary['variants'] if v['variant'] == 'v15-honest-with-res')
features = variant['features_used']

with open(os.path.join(S7, 'scaling_params_s7.json')) as f:
    sparams = json.load(f)

# ── 1. Copy the model JSON verbatim ───────────────────────────────────────────
shutil.copyfile(
    os.path.join(S7, 'v15-honest-with-res.model.json'),
    os.path.join(MODELS, 'xgboost-v15-model.json'),
)
print(f'  wrote xgboost-v15-model.json ({os.path.getsize(os.path.join(MODELS, "xgboost-v15-model.json"))} bytes)')

# ── 2. Feature order ──────────────────────────────────────────────────────────
with open(os.path.join(MODELS, 'xgboost-v15-features.json'), 'w') as f:
    json.dump(features, f, indent=2)
print(f'  wrote xgboost-v15-features.json ({len(features)} features)')

# ── 3. Scaler — schema for v15 (min-max + label encoders + binary/categorical) ─
#
# Shape deliberately differs from v10's mean/std so the TS loader can detect
# "scaler_type" and dispatch to the right code path:
#
#   { "scaler_type": "minmax",
#     "feature_names": [...],
#     "min": [...], "max": [...],     # one per feature, null for categorical/binary
#     "binary_features": ["creator_verified", ...],
#     "categorical_encoders": { "sound_type": [class0, class1, ...] },
#     "computed_features": ["creator_followers_log_computed"]   # applied after scaling }

BINARY_FEATURES = {
    'creator_verified', 'has_fyp_hashtag', 'music_is_original',
    'ffmpeg_has_audio', 'text_has_cta', 'meta_has_viral_hashtag',
    'has_step_structure', 'hook_face_present', 'hook_text_overlay',
}

mins = [None] * len(features)
maxs = [None] * len(features)
constant_flags = [False] * len(features)
for i, f in enumerate(features):
    s = sparams['scaling'].get(f)
    if s is None:
        continue
    mins[i] = s.get('min')
    maxs[i] = s.get('max')
    constant_flags[i] = bool(s.get('constant'))

scaler_out = {
    'scaler_type': 'minmax',
    'feature_names': features,
    'min': mins,
    'max': maxs,
    'constant': constant_flags,
    'binary_features': sorted([f for f in features if f in BINARY_FEATURES]),
    'categorical_encoders': sparams.get('encoders', {}),
    'computed_features': ['creator_followers_log_computed'] if 'creator_followers_log_computed' in features else [],
}
with open(os.path.join(MODELS, 'xgboost-v15-scaler.json'), 'w') as f:
    json.dump(scaler_out, f, indent=2)
print(f'  wrote xgboost-v15-scaler.json '
      f'({len(scaler_out["categorical_encoders"])} categorical, '
      f'{len(scaler_out["binary_features"])} binary, '
      f'{len(scaler_out["computed_features"])} computed)')

# ── 4. Metadata ───────────────────────────────────────────────────────────────
metadata = {
    'model_version': 'v15-honest-with-res',
    'trained_at': '2026-04-17T00:00:00Z',
    'source': 'supabase:training_features+scraped_videos (5,645 videos)',
    'changes_from_v10': (
        'Retrained on 5,645 diverse videos (up from 863). Honest-only feature set: '
        'dropped all post-publication engagement columns (views/likes/shares/saves/rates). '
        'Added 33 pre-publication content + context features. Min-max scaling replaces '
        'v10 standard scaling. Includes categorical encoding for sound_type and one '
        'derived feature (creator_followers_log_computed).'
    ),
    'feature_count': variant['feature_count'],
    'training_rows': variant['training_rows'],
    'holdout_rows': summary['holdout_rows'],
    'cv_spearman_mean': variant['cv_spearman_mean'],
    'cv_spearman_std': variant['cv_spearman_std'],
    'holdout_spearman': variant['holdout_spearman'],
    'holdout_mae': variant['holdout_mae'],
    'hyperparameters': variant['best_params'],
    'top_10_feature_importance': variant['feature_importance_top10'],
    'validation_status': 'validated (Prompt 1, 2026-04-17)',
    'replaces': 'v10',
}
with open(os.path.join(MODELS, 'xgboost-v15-metadata.json'), 'w') as f:
    json.dump(metadata, f, indent=2)
print(f'  wrote xgboost-v15-metadata.json')

print(f'\nAll v15 artefacts written to: {MODELS}')

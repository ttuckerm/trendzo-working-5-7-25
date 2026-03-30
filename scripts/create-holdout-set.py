# -*- coding: utf-8 -*-
"""
Create Holdout Set for Honest XGBoost v7 Evaluation

Selects 50 videos from the 863-video side-hustles training set,
stratified across 5 DPS tiers. These videos will be EXCLUDED from
training and used ONLY for evaluation (holdout benchmark).

DPS Tiers:
  - Low:        0-30   (10 videos)
  - Average:   30-50   (10 videos)
  - Good:      50-65   (10 videos)
  - Viral:     65-85   (10 videos)
  - Mega-viral: 85-100 (10 videos)

If a tier has fewer than 10 videos, takes what's available and
redistributes extra slots to adjacent tiers.

Output: models/holdout-video-ids.json

Usage:
    python scripts/create-holdout-set.py
"""

import sys
import io
import os
import json
import random

# Force UTF-8 on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

RANDOM_STATE = 42
random.seed(RANDOM_STATE)

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'holdout-video-ids.json')

# ── Tier definitions ──────────────────────────────────────────────────────────

TIERS = [
    {'name': 'low',        'min': 0,  'max': 30,  'target': 10},
    {'name': 'average',    'min': 30, 'max': 50,  'target': 10},
    {'name': 'good',       'min': 50, 'max': 65,  'target': 10},
    {'name': 'viral',      'min': 65, 'max': 85,  'target': 10},
    {'name': 'mega-viral', 'min': 85, 'max': 100, 'target': 10},
]


def load_env():
    """Load environment variables from .env.local."""
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    os.environ[k.strip()] = v.strip()


def main():
    print('=' * 60)
    print('  Create Holdout Set for XGBoost v7 Evaluation')
    print('=' * 60)

    load_env()

    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')

    if not url or not key:
        print('  ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY')
        sys.exit(1)

    from supabase import create_client
    sb = create_client(url, key)

    # ── 1. Load all video_ids that have training features AND dps_score ──────

    print('\n  Fetching training_features video_ids...')
    all_features = []
    offset = 0
    batch_size = 1000
    while True:
        resp = sb.table('training_features').select('video_id').range(offset, offset + batch_size - 1).execute()
        if not resp.data:
            break
        all_features.extend(resp.data)
        if len(resp.data) < batch_size:
            break
        offset += batch_size

    feature_video_ids = {row['video_id'] for row in all_features}
    print(f'  Got {len(feature_video_ids)} video_ids with training features')

    # ── 2. Fetch DPS scores for these videos ────────────────────────────────

    print('  Fetching scraped_videos (dps_score, niche)...')
    all_videos = []
    offset = 0
    while True:
        resp = sb.table('scraped_videos').select(
            'video_id, dps_score, niche, transcript_text, caption, hashtags, creator_followers_count, duration_seconds'
        ).not_.is_('dps_score', 'null').range(offset, offset + batch_size - 1).execute()
        if not resp.data:
            break
        all_videos.extend(resp.data)
        if len(resp.data) < batch_size:
            break
        offset += batch_size

    # Filter to videos that have training features
    eligible = [v for v in all_videos if v['video_id'] in feature_video_ids]
    print(f'  Eligible videos (features + DPS): {len(eligible)}')

    # ── 3. Stratified sampling ──────────────────────────────────────────────

    # Bucket videos into tiers
    tier_buckets = {t['name']: [] for t in TIERS}
    for v in eligible:
        dps = float(v['dps_score'])
        for t in TIERS:
            if t['min'] <= dps < t['max'] or (t['name'] == 'mega-viral' and dps >= t['min']):
                tier_buckets[t['name']].append(v)
                break

    print('\n  Tier distribution (eligible videos):')
    for t in TIERS:
        print(f'    {t["name"]:<12}: {len(tier_buckets[t["name"]])} videos (target: {t["target"]})')

    # ── 4. Select with redistribution ───────────────────────────────────────

    holdout = []
    shortfall = 0

    for t in TIERS:
        bucket = tier_buckets[t['name']]
        target = t['target']

        if len(bucket) <= target:
            # Take all available
            selected = bucket[:]
            shortfall += target - len(bucket)
        else:
            # Random sample
            selected = random.sample(bucket, target)

        holdout.extend(selected)
        print(f'    {t["name"]:<12}: selected {len(selected)}/{target}')

    # Redistribute shortfall to adjacent tiers (largest buckets first)
    if shortfall > 0:
        print(f'\n  Redistributing {shortfall} shortfall slots...')
        already_selected_ids = {v['video_id'] for v in holdout}

        # Sort tiers by available remaining (largest first)
        tier_remaining = []
        for t in TIERS:
            remaining = [v for v in tier_buckets[t['name']] if v['video_id'] not in already_selected_ids]
            tier_remaining.append((t['name'], remaining))
        tier_remaining.sort(key=lambda x: -len(x[1]))

        for tier_name, remaining in tier_remaining:
            if shortfall <= 0:
                break
            extra = min(shortfall, len(remaining))
            if extra > 0:
                selected = random.sample(remaining, extra)
                holdout.extend(selected)
                shortfall -= extra
                print(f'    +{extra} from {tier_name} (had {len(remaining)} remaining)')

    # ── 5. Save holdout set ─────────────────────────────────────────────────

    holdout_ids = [v['video_id'] for v in holdout]
    holdout_data = {
        'description': 'Holdout video IDs for honest XGBoost v7 evaluation. These videos must be EXCLUDED from training.',
        'created_at': '2026-03-15',
        'total': len(holdout_ids),
        'tier_counts': {},
        'video_ids': holdout_ids,
    }

    # Count by tier
    for v in holdout:
        dps = float(v['dps_score'])
        for t in TIERS:
            if t['min'] <= dps < t['max'] or (t['name'] == 'mega-viral' and dps >= t['min']):
                holdout_data['tier_counts'][t['name']] = holdout_data['tier_counts'].get(t['name'], 0) + 1
                break

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(holdout_data, f, indent=2)

    print(f'\n  Saved {len(holdout_ids)} holdout video IDs to {OUTPUT_PATH}')

    # ── 6. Print selected videos ────────────────────────────────────────────

    print(f'\n  Selected holdout videos ({len(holdout_ids)}):')
    print(f'  {"#":<4} {"Video ID":<40} {"DPS":>6} {"Tier":<12}')
    print(f'  {"-"*62}')

    holdout_sorted = sorted(holdout, key=lambda v: float(v['dps_score']))
    for i, v in enumerate(holdout_sorted, 1):
        dps = float(v['dps_score'])
        tier = 'unknown'
        for t in TIERS:
            if t['min'] <= dps < t['max'] or (t['name'] == 'mega-viral' and dps >= t['min']):
                tier = t['name']
                break
        print(f'  {i:<4} {v["video_id"]:<40} {dps:>6.1f} {tier:<12}')

    print(f'\n{"=" * 60}')
    print(f'  Done. {len(holdout_ids)} holdout videos selected.')
    print(f'  Next: Run populate-holdout-benchmarks.py to update evaluation_benchmarks')
    print(f'{"=" * 60}\n')


if __name__ == '__main__':
    main()

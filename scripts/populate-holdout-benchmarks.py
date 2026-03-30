# -*- coding: utf-8 -*-
"""
Populate evaluation_benchmarks with Holdout Videos

Reads the holdout video IDs from models/holdout-video-ids.json,
DELETES all existing rows from evaluation_benchmarks, and
INSERTS the holdout videos with their ground truth data.

Usage:
    python scripts/populate-holdout-benchmarks.py
"""

import sys
import io
import os
import json

# Force UTF-8 on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HOLDOUT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'holdout-video-ids.json')


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
    print('  Populate evaluation_benchmarks with Holdout Videos')
    print('=' * 60)

    # ── 1. Load holdout IDs ─────────────────────────────────────────────────

    if not os.path.exists(HOLDOUT_PATH):
        print(f'  ERROR: {HOLDOUT_PATH} not found. Run create-holdout-set.py first.')
        sys.exit(1)

    with open(HOLDOUT_PATH) as f:
        holdout_data = json.load(f)

    video_ids = holdout_data['video_ids']
    print(f'\n  Loaded {len(video_ids)} holdout video IDs')

    # ── 2. Connect to Supabase ──────────────────────────────────────────────

    load_env()

    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')

    if not url or not key:
        print('  ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY')
        sys.exit(1)

    from supabase import create_client
    sb = create_client(url, key)

    # ── 3. Fetch video metadata from scraped_videos ─────────────────────────

    print('  Fetching video metadata from scraped_videos...')
    all_metadata = []
    # Supabase IN filter has limits, batch the IDs
    batch_size = 50
    for i in range(0, len(video_ids), batch_size):
        batch = video_ids[i:i + batch_size]
        resp = sb.table('scraped_videos').select(
            'video_id, dps_score, niche, transcript_text, caption, hashtags, creator_followers_count, duration_seconds'
        ).in_('video_id', batch).execute()
        if resp.data:
            all_metadata.extend(resp.data)

    print(f'  Got metadata for {len(all_metadata)} videos')

    if len(all_metadata) != len(video_ids):
        missing = set(video_ids) - {v['video_id'] for v in all_metadata}
        print(f'  WARNING: {len(missing)} video IDs not found in scraped_videos:')
        for vid in list(missing)[:5]:
            print(f'    {vid}')

    # ── 4. Delete existing benchmarks ───────────────────────────────────────

    print('\n  Deleting existing evaluation_benchmarks rows...')
    # Delete all rows — use a filter that matches everything
    del_resp = sb.table('evaluation_benchmarks').delete().gte('created_at', '1970-01-01').execute()
    deleted_count = len(del_resp.data) if del_resp.data else 0
    print(f'  Deleted {deleted_count} existing rows')

    # ── 5. Insert holdout videos ────────────────────────────────────────────

    print(f'  Inserting {len(all_metadata)} holdout videos...')
    rows_to_insert = []
    for v in all_metadata:
        rows_to_insert.append({
            'video_id': v['video_id'],
            'actual_dps': v['dps_score'],
            'niche': v.get('niche', 'side-hustles'),
            'transcript_text': v.get('transcript_text'),
            'caption': v.get('caption'),
            'hashtags': v.get('hashtags'),
            'creator_followers': v.get('creator_followers_count'),
            'duration_seconds': v.get('duration_seconds'),
        })

    # Insert in batches
    inserted = 0
    for i in range(0, len(rows_to_insert), 25):
        batch = rows_to_insert[i:i + 25]
        resp = sb.table('evaluation_benchmarks').insert(batch).execute()
        if resp.data:
            inserted += len(resp.data)

    print(f'  Inserted {inserted} rows')

    # ── 6. Verify ───────────────────────────────────────────────────────────

    count_resp = sb.table('evaluation_benchmarks').select('id', count='exact').execute()
    total = count_resp.count if hasattr(count_resp, 'count') and count_resp.count is not None else len(count_resp.data or [])
    print(f'\n  Verification: evaluation_benchmarks now has {total} rows')

    if total == len(video_ids):
        print('  OK: Row count matches holdout set size')
    else:
        print(f'  WARNING: Expected {len(video_ids)}, got {total}')

    print(f'\n{"=" * 60}')
    print(f'  Done. evaluation_benchmarks populated with {inserted} holdout videos.')
    print(f'  Next: Run train-xgboost-v7-holdout.py to retrain v7 without these videos.')
    print(f'{"=" * 60}\n')


if __name__ == '__main__':
    main()

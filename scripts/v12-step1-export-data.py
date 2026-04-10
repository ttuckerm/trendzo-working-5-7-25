"""
v12 Sandbox — Step 1: Export training data to JSON.
No xgboost/sklearn/pandas required. Pure stdlib + supabase.
"""
import sys, os, json, time
sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(PROJECT_ROOT, 'models')
SANDBOX_DIR = os.path.join(PROJECT_ROOT, 'data', 'sandbox')
HOLDOUT_PATH = os.path.join(MODELS_DIR, 'holdout-video-ids.json')
V10_META_PATH = os.path.join(MODELS_DIR, 'xgboost-v10-metadata.json')
OUTPUT_PATH = os.path.join(SANDBOX_DIR, 'v12-training-data.json')

os.makedirs(SANDBOX_DIR, exist_ok=True)

V8_FEATURES = [
    'ffmpeg_scene_changes', 'ffmpeg_cuts_per_second', 'ffmpeg_avg_motion',
    'ffmpeg_color_variance', 'ffmpeg_brightness_avg', 'ffmpeg_contrast_score',
    'ffmpeg_resolution_width', 'ffmpeg_resolution_height', 'ffmpeg_duration_seconds',
    'ffmpeg_bitrate', 'ffmpeg_fps',
    'audio_pitch_mean_hz', 'audio_pitch_variance', 'audio_pitch_range',
    'audio_pitch_std_dev', 'audio_pitch_contour_slope',
    'audio_loudness_mean_lufs', 'audio_loudness_range', 'audio_loudness_variance',
    'audio_silence_ratio', 'audio_silence_count',
    'speaking_rate_wpm',
    'visual_scene_count', 'visual_avg_scene_duration', 'visual_score',
    'thumb_brightness', 'thumb_contrast', 'thumb_colorfulness', 'thumb_overall_score',
    'hook_score', 'hook_confidence', 'hook_text_score', 'hook_type_encoded',
    'text_word_count', 'text_sentence_count', 'text_question_mark_count',
    'text_exclamation_count', 'text_transcript_length', 'text_avg_sentence_length',
    'text_unique_word_ratio', 'text_avg_word_length', 'text_syllable_count',
    'text_flesch_reading_ease', 'text_has_cta',
    'text_negative_word_count', 'text_emoji_count',
    'meta_duration_seconds', 'meta_words_per_second',
]
V9_NEW = ['text_overlay_density', 'visual_proof_ratio', 'vocal_confidence_composite']
V10_NEW = [
    'creator_followers_log', 'post_hour_utc', 'post_day_of_week',
    'specificity_score', 'instructional_density', 'has_step_structure', 'hedge_word_density',
]
V10_FEATURES = V8_FEATURES + V9_NEW + V10_NEW

def load_env():
    env_path = os.path.join(PROJECT_ROOT, '.env.local')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    os.environ[k.strip()] = v.strip()

def main():
    print('=== v12 Sandbox — Step 1: Export Training Data ===', flush=True)

    with open(HOLDOUT_PATH) as f:
        holdout_ids = set(json.load(f)['video_ids'])
    print(f'Holdout: {len(holdout_ids)} videos', flush=True)

    with open(V10_META_PATH) as f:
        v10_meta = json.load(f)
    v10_rows = v10_meta['dataset']['total_rows']

    load_env()
    from supabase import create_client
    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    sb = create_client(url, key)

    print('Fetching training_features...', flush=True)
    all_features = []
    offset = 0
    while True:
        resp = sb.table('training_features').select('*').range(offset, offset + 999).execute()
        if not resp.data: break
        all_features.extend(resp.data)
        if len(resp.data) < 1000: break
        offset += 1000
    print(f'Got {len(all_features)} training_features rows', flush=True)

    print('Fetching scraped_videos with dps_score...', flush=True)
    all_videos = []
    offset = 0
    while True:
        resp = sb.table('scraped_videos').select(
            'video_id, dps_score, niche, creator_id, creator_username'
        ).not_.is_('dps_score', 'null').range(offset, offset + 999).execute()
        if not resp.data: break
        all_videos.extend(resp.data)
        if len(resp.data) < 1000: break
        offset += 1000
    print(f'Got {len(all_videos)} scraped_videos with dps_score', flush=True)

    print('Fetching labeled prediction_runs...', flush=True)
    labeled_runs = []
    offset = 0
    while True:
        resp = sb.table('prediction_runs').select(
            'video_id, actual_dps'
        ).not_.is_('actual_dps', 'null').range(offset, offset + 999).execute()
        if not resp.data: break
        labeled_runs.extend(resp.data)
        if len(resp.data) < 1000: break
        offset += 1000

    actual_map = {}
    for r in labeled_runs:
        vid = r.get('video_id')
        if vid and r.get('actual_dps') is not None:
            actual_map[vid] = r['actual_dps']
    print(f'Got {len(actual_map)} with actual_dps', flush=True)

    video_map = {v['video_id']: v for v in all_videos}
    rows = []
    actual_used = 0
    for feat in all_features:
        vid = feat.get('video_id')
        if vid and vid in video_map:
            niche = video_map[vid].get('niche', 'side-hustles')
            if niche != 'side-hustles':
                continue
            if vid in actual_map:
                dps = actual_map[vid]
                actual_used += 1
            else:
                dps = video_map[vid]['dps_score']
            if dps is None:
                continue

            feature_dict = {}
            for f in V10_FEATURES:
                val = feat.get(f)
                if val is not None:
                    try:
                        feature_dict[f] = float(val)
                    except (ValueError, TypeError):
                        pass
            rows.append({
                'video_id': vid,
                'dps_score': float(dps),
                'features': feature_dict,
                'is_holdout': vid in holdout_ids,
            })

    print(f'\nTotal side-hustles with DPS: {len(rows)}', flush=True)
    print(f'Ground truth: {actual_used} from learning loop, {len(rows) - actual_used} from scraped', flush=True)

    train_rows = [r for r in rows if not r['is_holdout']]
    holdout_rows = [r for r in rows if r['is_holdout']]

    # Coverage
    coverage = {}
    for f in V10_FEATURES:
        coverage[f] = sum(1 for r in rows if f in r['features'])
    sorted_coverage = sorted(coverage.items(), key=lambda x: x[1])

    full_feat = sum(1 for r in rows if len(r['features']) == len(V10_FEATURES))

    dps_vals = [r['dps_score'] for r in train_rows]

    output = {
        'metadata': {
            'exported_at': time.strftime('%Y-%m-%dT%H:%M:%S'),
            'total_rows': len(rows),
            'train_rows': len(train_rows),
            'holdout_rows': len(holdout_rows),
            'full_feature_rows': full_feat,
            'v10_had': v10_rows,
            'feature_names': V10_FEATURES,
            'feature_count': len(V10_FEATURES),
            'target_stats': {
                'min': min(dps_vals), 'max': max(dps_vals),
                'mean': sum(dps_vals) / len(dps_vals),
            },
            'coverage': {f: {'count': c, 'pct': round(c / len(rows) * 100, 1)} for f, c in sorted_coverage},
        },
        'rows': rows,
    }

    with open(OUTPUT_PATH, 'w') as f:
        json.dump(output, f)
    size_mb = os.path.getsize(OUTPUT_PATH) / 1024 / 1024
    print(f'\nSaved to {OUTPUT_PATH} ({size_mb:.1f} MB)', flush=True)
    print(f'Train: {len(train_rows)} | Holdout: {len(holdout_rows)}', flush=True)
    print(f'Full feature vectors: {full_feat}/{len(rows)}', flush=True)
    print(f'v10 had: {v10_rows} rows (delta: +{len(rows) - v10_rows})', flush=True)
    print(f'\nLowest coverage features:', flush=True)
    for f, c in sorted_coverage[:10]:
        print(f'  {f:<35s} {c:>5d}/{len(rows)} ({c/len(rows)*100:.1f}%)', flush=True)
    print(f'\nDone. Run v12-step2-train.py next.', flush=True)

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Training Data Cleaning Script
Applies 3 filters to training_features, sets training_eligible=false for excluded rows.
Reports comprehensive statistics on the eligible population.
Does NOT delete any data. Does NOT retrain.

Filters:
  1. ffmpeg_resolution_height IS NULL → failed video download/analysis
  2. Matched scraped_videos.creator_followers_count < 1000 → sub-1K creators
  3. >=20% of the core 58 features are NULL = incomplete analysis
"""

import os, sys, json
import numpy as np
from datetime import datetime

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_env():
    env_path = os.path.join(PROJECT_ROOT, '.env.local')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    os.environ[k.strip()] = v.strip()

V10_FEATURES = [
    'ffmpeg_scene_changes', 'ffmpeg_cuts_per_second', 'ffmpeg_avg_motion',
    'ffmpeg_color_variance', 'ffmpeg_brightness_avg', 'ffmpeg_contrast_score',
    'ffmpeg_resolution_width', 'ffmpeg_resolution_height', 'ffmpeg_duration_seconds',
    'ffmpeg_bitrate', 'ffmpeg_fps',
    'audio_pitch_mean_hz', 'audio_pitch_variance', 'audio_pitch_range',
    'audio_pitch_std_dev', 'audio_pitch_contour_slope',
    'audio_loudness_mean_lufs', 'audio_loudness_range', 'audio_loudness_variance',
    'audio_silence_ratio', 'audio_silence_count', 'speaking_rate_wpm',
    'visual_scene_count', 'visual_avg_scene_duration', 'visual_score',
    'thumb_brightness', 'thumb_contrast', 'thumb_colorfulness', 'thumb_overall_score',
    'hook_score', 'hook_confidence', 'hook_text_score', 'hook_type_encoded',
    'text_word_count', 'text_sentence_count', 'text_question_mark_count',
    'text_exclamation_count', 'text_transcript_length', 'text_avg_sentence_length',
    'text_unique_word_ratio', 'text_avg_word_length', 'text_syllable_count',
    'text_flesch_reading_ease', 'text_has_cta', 'text_negative_word_count',
    'text_emoji_count',
    'meta_duration_seconds', 'meta_words_per_second',
    'text_overlay_density', 'visual_proof_ratio', 'vocal_confidence_composite',
    'creator_followers_log', 'post_hour_utc', 'post_day_of_week',
    'specificity_score', 'instructional_density', 'has_step_structure', 'hedge_word_density',
]

NULL_THRESHOLD = 0.20  # 20% of 58 = 11.6 → 12+ nulls = excluded

def classify_tier(dps):
    if dps is None: return 'unknown'
    if dps >= 90: return 'mega-viral (90+)'
    if dps >= 70: return 'viral (70-89)'
    if dps >= 60: return 'good (60-69)'
    if dps >= 40: return 'average (40-59)'
    if dps >= 20: return 'below-avg (20-39)'
    return 'poor (0-19)'

def follower_bucket(log_val):
    if log_val is None: return 'unknown'
    if log_val < 3: return '<1K (log<3)'
    if log_val < 4: return '1K-10K (3-4)'
    if log_val < 5: return '10K-100K (4-5)'
    if log_val < 6: return '100K-1M (5-6)'
    return '1M+ (6+)'

def paginated_fetch(sb, table, select_str, extra_filter=None):
    """Fetch all rows from a Supabase table with pagination."""
    all_rows = []
    offset = 0
    while True:
        q = sb.table(table).select(select_str).range(offset, offset + 999)
        if extra_filter:
            q = extra_filter(q)
        resp = q.execute()
        if not resp.data:
            break
        all_rows.extend(resp.data)
        if len(resp.data) < 1000:
            break
        offset += 1000
    return all_rows

def main():
    print('=' * 70)
    print('  TRAINING DATA CLEANING')
    print(f'  {datetime.now().isoformat()}')
    print('=' * 70)

    load_env()
    from supabase import create_client
    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    if not url or not key:
        print('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY')
        sys.exit(1)
    sb = create_client(url, key)

    # ── Fetch all data ──────────────────────────────────────────────────

    print('\n  Fetching training_features...')
    tf_rows = paginated_fetch(sb, 'training_features', '*')
    print(f'  Got {len(tf_rows)} training_features rows')

    print('  Fetching scraped_videos (dps_score + followers)...')
    sv_rows = paginated_fetch(sb, 'scraped_videos',
        'video_id, dps_score, niche, creator_followers_count, creator_username')
    sv_map = {r['video_id']: r for r in sv_rows}
    print(f'  Got {len(sv_rows)} scraped_videos rows')

    # ── Pre-filter state ────────────────────────────────────────────────

    total = len(tf_rows)
    with_dps = [r for r in tf_rows if sv_map.get(r['video_id'], {}).get('dps_score') is not None]
    print(f'\n  Total training_features: {total}')
    print(f'  With DPS score (joined): {len(with_dps)}')

    # ── STEP 1: Reset all to eligible ───────────────────────────────────

    print('\n  Step 0: Resetting all rows to training_eligible=true...')
    batch_size = 500
    all_ids = [r['video_id'] for r in tf_rows]
    reset_count = 0
    for i in range(0, len(all_ids), batch_size):
        batch_ids = all_ids[i:i + batch_size]
        sb.table('training_features').update({
            'training_eligible': True,
            'exclusion_reason': None,
        }).in_('video_id', batch_ids).execute()
        reset_count += len(batch_ids)
    print(f'  Reset {reset_count} rows to eligible')

    # ── FILTER 1: ffmpeg_resolution_height IS NULL ──────────────────────

    print('\n' + '-' * 70)
    print('  FILTER 1: ffmpeg_resolution_height IS NULL (failed video analysis)')
    print('-' * 70)

    f1_excluded = [r for r in tf_rows if r.get('ffmpeg_resolution_height') is None]
    f1_ids = [r['video_id'] for r in f1_excluded]
    print(f'  Rows with NULL ffmpeg_resolution_height: {len(f1_excluded)}')

    for i in range(0, len(f1_ids), batch_size):
        batch_ids = f1_ids[i:i + batch_size]
        sb.table('training_features').update({
            'training_eligible': False,
            'exclusion_reason': 'no_video_features',
        }).in_('video_id', batch_ids).execute()
    print(f'  Marked {len(f1_ids)} rows as ineligible (no_video_features)')

    # ── FILTER 2: follower_count < 1000 ─────────────────────────────────

    print('\n' + '-' * 70)
    print('  FILTER 2: scraped_videos.creator_followers_count < 1000')
    print('-' * 70)

    f2_excluded = []
    for r in tf_rows:
        if r['video_id'] in [x['video_id'] for x in f1_excluded]:
            continue  # already excluded
        sv = sv_map.get(r['video_id'])
        if sv is None:
            continue
        fc = sv.get('creator_followers_count')
        if fc is not None and fc < 1000:
            f2_excluded.append(r)

    f2_ids = [r['video_id'] for r in f2_excluded]
    print(f'  Rows with followers < 1K (not already excluded): {len(f2_excluded)}')

    for i in range(0, len(f2_ids), batch_size):
        batch_ids = f2_ids[i:i + batch_size]
        sb.table('training_features').update({
            'training_eligible': False,
            'exclusion_reason': 'sub_1k_followers',
        }).in_('video_id', batch_ids).execute()
    print(f'  Marked {len(f2_ids)} rows as ineligible (sub_1k_followers)')

    # -- FILTER 3: >=20% of core 58 features NULL --

    print('\n' + '-' * 70)
    print('  FILTER 3: >=20% of core 58 features are NULL (incomplete analysis)')
    print('-' * 70)

    already_excluded = set(f1_ids + f2_ids)
    null_threshold_count = int(np.ceil(len(V10_FEATURES) * NULL_THRESHOLD))  # 12
    print(f'  Threshold: {null_threshold_count}+ nulls out of {len(V10_FEATURES)} features')

    f3_excluded = []
    for r in tf_rows:
        if r['video_id'] in already_excluded:
            continue
        null_count = sum(1 for f in V10_FEATURES if r.get(f) is None)
        if null_count >= null_threshold_count:
            f3_excluded.append(r)

    f3_ids = [r['video_id'] for r in f3_excluded]
    print(f'  Rows with >={null_threshold_count} null features (not already excluded): {len(f3_excluded)}')

    for i in range(0, len(f3_ids), batch_size):
        batch_ids = f3_ids[i:i + batch_size]
        sb.table('training_features').update({
            'training_eligible': False,
            'exclusion_reason': 'low_fill_rate',
        }).in_('video_id', batch_ids).execute()
    print(f'  Marked {len(f3_ids)} rows as ineligible (low_fill_rate)')

    # ── SUMMARY ─────────────────────────────────────────────────────────

    all_excluded = set(f1_ids + f2_ids + f3_ids)
    eligible_rows = [r for r in tf_rows if r['video_id'] not in all_excluded]

    print('\n' + '=' * 70)
    print('  FILTER SUMMARY')
    print('=' * 70)
    print(f'  Total training_features rows:   {total}')
    print(f'  Filter 1 (no video features):   -{len(f1_ids)}')
    print(f'  Filter 2 (sub-1K followers):    -{len(f2_ids)}')
    print(f'  Filter 3 (low fill rate):       -{len(f3_ids)}')
    print(f'  ------------------------------------')
    print(f'  Total excluded:                 {len(all_excluded)}')
    print(f'  Remaining eligible:             {len(eligible_rows)}')

    # ── REPORT 1: DPS Distribution of eligible rows ─────────────────────

    print('\n' + '=' * 70)
    print('  REPORT 1: DPS DISTRIBUTION (eligible rows)')
    print('=' * 70)

    eligible_dps = []
    for r in eligible_rows:
        sv = sv_map.get(r['video_id'])
        if sv and sv.get('dps_score') is not None:
            eligible_dps.append(float(sv['dps_score']))

    arr = np.array(eligible_dps)
    print(f'  Eligible rows with DPS: {len(eligible_dps)} / {len(eligible_rows)}')
    if len(arr) > 0:
        print(f'  Mean:   {np.mean(arr):.2f}')
        print(f'  Median: {np.median(arr):.2f}')
        print(f'  Std:    {np.std(arr):.2f}')
        print(f'  Min:    {np.min(arr):.2f}')
        print(f'  Max:    {np.max(arr):.2f}')
        print(f'  P10:    {np.percentile(arr, 10):.2f}')
        print(f'  P25:    {np.percentile(arr, 25):.2f}')
        print(f'  P75:    {np.percentile(arr, 75):.2f}')
        print(f'  P90:    {np.percentile(arr, 90):.2f}')

        tiers = {}
        for s in eligible_dps:
            t = classify_tier(s)
            tiers[t] = tiers.get(t, 0) + 1
        print(f'\n  Tier breakdown:')
        for t in ['mega-viral (90+)', 'viral (70-89)', 'good (60-69)', 'average (40-59)', 'below-avg (20-39)', 'poor (0-19)']:
            c = tiers.get(t, 0)
            pct = c / len(eligible_dps) * 100
            print(f'    {t:25s}: {c:5d} ({pct:5.1f}%)')

    # ── REPORT 2: Follower Distribution ─────────────────────────────────

    print('\n' + '=' * 70)
    print('  REPORT 2: FOLLOWER DISTRIBUTION (eligible rows)')
    print('=' * 70)

    follower_vals = []
    for r in eligible_rows:
        val = r.get('creator_followers_log')
        if val is not None:
            follower_vals.append(float(val))

    arr_f = np.array(follower_vals)
    print(f'  Rows with creator_followers_log: {len(follower_vals)} / {len(eligible_rows)}')
    if len(arr_f) > 0:
        print(f'  Mean (log): {np.mean(arr_f):.4f}')
        print(f'  Median:     {np.median(arr_f):.4f}')
        print(f'  Std:        {np.std(arr_f):.4f}')
        print(f'  Min:        {np.min(arr_f):.4f} (~{10**np.min(arr_f):.0f} followers)')
        print(f'  Max:        {np.max(arr_f):.4f} (~{10**np.max(arr_f):.0f} followers)')

        buckets = {}
        for v in follower_vals:
            b = follower_bucket(v)
            buckets[b] = buckets.get(b, 0) + 1
        print(f'\n  Follower buckets:')
        for b in ['<1K (log<3)', '1K-10K (3-4)', '10K-100K (4-5)', '100K-1M (5-6)', '1M+ (6+)']:
            c = buckets.get(b, 0)
            pct = c / len(follower_vals) * 100 if follower_vals else 0
            print(f'    {b:20s}: {c:5d} ({pct:5.1f}%)')

    # Also check via scraped_videos.creator_followers_count for rows without log
    fc_from_sv = []
    for r in eligible_rows:
        sv = sv_map.get(r['video_id'])
        if sv and sv.get('creator_followers_count') is not None:
            fc_from_sv.append(int(sv['creator_followers_count']))

    if fc_from_sv:
        fc_arr = np.array(fc_from_sv)
        print(f'\n  From scraped_videos.creator_followers_count:')
        print(f'    Rows with data: {len(fc_from_sv)}')
        print(f'    Mean:   {np.mean(fc_arr):,.0f}')
        print(f'    Median: {np.median(fc_arr):,.0f}')
        print(f'    Min:    {np.min(fc_arr):,}')
        print(f'    Max:    {np.max(fc_arr):,}')

    # ── REPORT 3: Feature Fill Rate ─────────────────────────────────────

    print('\n' + '=' * 70)
    print('  REPORT 3: FEATURE FILL RATE (eligible rows)')
    print('=' * 70)

    print(f'\n  {"Feature":<35s} {"Filled":>7s} {"Total":>7s} {"Rate":>7s}')
    print(f'  {"-"*35} {"-"*7} {"-"*7} {"-"*7}')

    total_filled = 0
    total_cells = 0
    for col in V10_FEATURES:
        filled = sum(1 for r in eligible_rows if r.get(col) is not None)
        rate = filled / len(eligible_rows) * 100 if eligible_rows else 0
        total_filled += filled
        total_cells += len(eligible_rows)
        flag = '  *' if rate < 80 else ''
        print(f'  {col:<35s} {filled:7d} {len(eligible_rows):7d} {rate:6.1f}%{flag}')

    overall_fill = total_filled / total_cells * 100 if total_cells else 0
    print(f'\n  Overall fill rate: {total_filled}/{total_cells} = {overall_fill:.1f}%')

    # Per-row fill distribution
    row_fills = []
    for r in eligible_rows:
        filled = sum(1 for f in V10_FEATURES if r.get(f) is not None)
        row_fills.append(filled)
    arr_fill = np.array(row_fills)
    if len(arr_fill) > 0:
        print(f'\n  Per-row fill (out of {len(V10_FEATURES)} features):')
        print(f'    Mean:   {np.mean(arr_fill):.1f}')
        print(f'    Median: {np.median(arr_fill):.0f}')
        print(f'    Min:    {np.min(arr_fill)}')
        print(f'    Max:    {np.max(arr_fill)}')
        pct_100 = sum(1 for x in row_fills if x == len(V10_FEATURES)) / len(row_fills) * 100
        pct_90 = sum(1 for x in row_fills if x >= 52) / len(row_fills) * 100
        pct_80 = sum(1 for x in row_fills if x >= 46) / len(row_fills) * 100
        print(f'    100% filled: {pct_100:.1f}%')
        print(f'    >=90% filled: {pct_90:.1f}%')
        print(f'    >=80% filled: {pct_80:.1f}%')

    # ── REPORT 4: Comparison to original 963 ────────────────────────────

    print('\n' + '=' * 70)
    print('  REPORT 4: ELIGIBLE vs ORIGINAL 963')
    print('=' * 70)

    cutoff_ts = '2026-03-15'
    original_963 = [r for r in tf_rows if (r.get('extracted_at') or '') < cutoff_ts]
    orig_in_eligible = [r for r in eligible_rows if (r.get('extracted_at') or '') < cutoff_ts]
    newer_in_eligible = [r for r in eligible_rows if (r.get('extracted_at') or '') >= cutoff_ts]

    print(f'  Original 963 total:     {len(original_963)}')
    print(f'  Original still eligible:{len(orig_in_eligible)}')
    print(f'  Original excluded:      {len(original_963) - len(orig_in_eligible)}')
    print(f'  Newer rows eligible:    {len(newer_in_eligible)}')
    print(f'  Total eligible:         {len(eligible_rows)}')
    print(f'  Net change vs 963:      {len(eligible_rows) - len(original_963):+d}')

    # DPS comparison
    orig_dps = [float(sv_map.get(r['video_id'], {}).get('dps_score', 0))
                for r in original_963
                if sv_map.get(r['video_id'], {}).get('dps_score') is not None]
    if orig_dps and eligible_dps:
        print(f'\n  DPS comparison:')
        print(f'    {"Metric":<15s} {"Original 963":>15s} {"Eligible":>15s} {"Delta":>10s}')
        for name, fn in [('Mean', np.mean), ('Median', np.median), ('Std', np.std)]:
            o = fn(orig_dps)
            e = fn(eligible_dps)
            print(f'    {name:<15s} {o:>15.2f} {e:>15.2f} {e-o:>+10.2f}')

    # ── Save report ─────────────────────────────────────────────────────

    report = {
        'generated_at': datetime.now().isoformat(),
        'total_rows': total,
        'filter_1_no_video': len(f1_ids),
        'filter_2_sub_1k': len(f2_ids),
        'filter_3_low_fill': len(f3_ids),
        'total_excluded': len(all_excluded),
        'eligible_remaining': len(eligible_rows),
        'eligible_with_dps': len(eligible_dps),
        'dps_stats': {
            'mean': float(np.mean(eligible_dps)) if eligible_dps else None,
            'median': float(np.median(eligible_dps)) if eligible_dps else None,
            'std': float(np.std(eligible_dps)) if eligible_dps else None,
        },
        'overall_fill_rate': overall_fill,
    }
    report_path = os.path.join(PROJECT_ROOT, 'data', 'sandbox', 'cleaning-report.json')
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    print(f'\n  Report saved: {report_path}')

    print('\n' + '=' * 70)
    print('  CLEANING COMPLETE — No data deleted, all reversible')
    print('=' * 70)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'\nFATAL ERROR: {type(e).__name__}: {e}')
        import traceback
        print(traceback.format_exc())

# -*- coding: utf-8 -*-
"""
Tier Breakdown Analysis — What separates each DPS tier from the next.

Uses real training data (863 side-hustle videos) from Supabase.
Produces docs/TIER_ANALYSIS_REPORT.md
"""

import sys, io, os, json
import numpy as np
import pandas as pd
from scipy.stats import mannwhitneyu
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ── Config ───────────────────────────────────────────────────────────────────

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs', 'TIER_ANALYSIS_REPORT.md')

# Top 20 CONTENT features (excluding account-bias and proxy features)
# Replaced meta_creator_followers, meta_creator_followers_log, extraction_duration_ms
# with next-ranked content features from correlation report
TOP_FEATURES = [
    'ffmpeg_scene_changes',        # r=+0.38
    'visual_scene_count',          # r=+0.38 (same as scene_changes but from visual-scene-detector)
    'visual_variety_score',        # r=+0.36
    'ffmpeg_avg_motion',           # r=+0.35
    'ffmpeg_cuts_per_second',      # r=+0.31
    'visual_score',                # r=+0.29
    'ffmpeg_resolution_height',    # r=+0.28
    'ffmpeg_contrast_score',       # r=+0.26
    'thumb_contrast',              # r=+0.26
    'ffmpeg_fps',                  # r=+0.21
    'text_emoji_count',            # r=-0.20
    'text_negative_word_count',    # r=-0.19
    'audio_pitch_mean_hz',         # r=+0.19
    'meta_duration_seconds',       # r=+0.19
    'visual_avg_scene_duration',   # r=-0.18
    'text_transcript_length',      # r=-0.18
    'text_question_mark_count',    # r=-0.17
    'speaking_rate_wpm',           # r=-0.16
    'hook_score',                  # r=+0.10
    'thumb_overall_score',         # r=+0.15
]

# Human-readable names
FEATURE_LABELS = {
    'ffmpeg_scene_changes': 'Scene Changes',
    'visual_scene_count': 'Visual Scene Count',
    'visual_variety_score': 'Visual Variety',
    'ffmpeg_avg_motion': 'Avg Motion',
    'ffmpeg_cuts_per_second': 'Cuts/Second',
    'visual_score': 'Visual Score',
    'ffmpeg_resolution_height': 'Resolution (H)',
    'ffmpeg_contrast_score': 'Contrast Score',
    'thumb_contrast': 'Thumb Contrast',
    'ffmpeg_fps': 'FPS',
    'text_emoji_count': 'Emoji Count',
    'text_negative_word_count': 'Negative Words',
    'audio_pitch_mean_hz': 'Pitch (Hz)',
    'meta_duration_seconds': 'Duration (s)',
    'visual_avg_scene_duration': 'Avg Scene Len (s)',
    'text_transcript_length': 'Transcript Len',
    'text_question_mark_count': 'Question Marks',
    'speaking_rate_wpm': 'Speaking Rate (WPM)',
    'hook_score': 'Hook Score',
    'thumb_overall_score': 'Thumbnail Score',
}


def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    os.environ[k.strip()] = v.strip()


def fetch_data():
    from supabase import create_client
    url = os.environ['NEXT_PUBLIC_SUPABASE_URL']
    key = os.environ['SUPABASE_SERVICE_KEY']
    sb = create_client(url, key)

    # Fetch training_features
    all_features = []
    offset = 0
    while True:
        resp = sb.table('training_features').select('*').range(offset, offset + 999).execute()
        if not resp.data:
            break
        all_features.extend(resp.data)
        if len(resp.data) < 1000:
            break
        offset += 1000
    print(f'  training_features: {len(all_features)} rows')

    # Fetch scraped_videos with dps_score
    all_videos = []
    offset = 0
    while True:
        resp = sb.table('scraped_videos').select(
            'video_id, dps_score, niche'
        ).not_.is_('dps_score', 'null').range(offset, offset + 999).execute()
        if not resp.data:
            break
        all_videos.extend(resp.data)
        if len(resp.data) < 1000:
            break
        offset += 1000
    print(f'  scraped_videos with dps: {len(all_videos)} rows')

    video_map = {v['video_id']: v for v in all_videos}
    rows = []
    for feat in all_features:
        vid = feat.get('video_id')
        if vid and vid in video_map:
            row = {**feat}
            row['dps_score'] = video_map[vid]['dps_score']
            rows.append(row)
    return pd.DataFrame(rows)


def fmt(val, feat):
    """Format a value nicely based on the feature."""
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return 'N/A'
    if feat in ('ffmpeg_avg_motion', 'ffmpeg_cuts_per_second', 'ffmpeg_contrast_score'):
        return f'{val:.3f}'
    if feat in ('text_emoji_count', 'text_negative_word_count', 'text_question_mark_count',
                'ffmpeg_scene_changes', 'visual_scene_count'):
        return f'{val:.1f}'
    if feat in ('ffmpeg_resolution_height', 'ffmpeg_fps', 'audio_pitch_mean_hz',
                'meta_duration_seconds', 'visual_avg_scene_duration',
                'text_transcript_length', 'speaking_rate_wpm',
                'visual_variety_score', 'visual_score',
                'thumb_contrast', 'thumb_overall_score', 'hook_score'):
        return f'{val:.1f}'
    return f'{val:.2f}'


def pct_diff(a, b):
    """Percentage difference of a relative to b."""
    if b == 0 or np.isnan(b):
        return 'N/A'
    return f'{((a - b) / abs(b)) * 100:+.1f}%'


def main():
    print('=' * 60)
    print('  Tier Breakdown Analysis')
    print('=' * 60)

    load_env()
    df = fetch_data()
    df = df.dropna(subset=['dps_score'])
    print(f'  Joined rows: {len(df)}')

    dps = df['dps_score'].astype(float)

    # ── Step 1: Define tiers ─────────────────────────────────────────────────
    p10 = np.percentile(dps, 10)
    p25 = np.percentile(dps, 25)
    p50 = np.percentile(dps, 50)
    p75 = np.percentile(dps, 75)
    p90 = np.percentile(dps, 90)

    def assign_tier(d):
        if d >= p90: return 'Mega-Viral'
        if d >= p75: return 'Viral'
        if d >= p50: return 'Good'
        if d >= p25: return 'Average'
        return 'Underperformer'

    df['tier'] = dps.apply(assign_tier)

    tier_order = ['Mega-Viral', 'Viral', 'Good', 'Average', 'Underperformer']
    tier_stats = {}
    for t in tier_order:
        sub = df[df['tier'] == t]['dps_score']
        tier_stats[t] = {
            'n': len(sub),
            'min': float(sub.min()),
            'max': float(sub.max()),
            'mean': float(sub.mean()),
            'median': float(sub.median()),
        }

    print('\n  Tier definitions:')
    for t in tier_order:
        s = tier_stats[t]
        print(f'    {t:16s}: DPS {s["min"]:.1f}-{s["max"]:.1f}  n={s["n"]}  mean={s["mean"]:.1f}')

    # ── Step 2: Feature profiles per tier ────────────────────────────────────
    tier_means = {}  # feature -> {tier: mean}
    for feat in TOP_FEATURES:
        tier_means[feat] = {}
        for t in tier_order:
            sub = df[df['tier'] == t][feat].dropna()
            tier_means[feat][t] = float(sub.mean()) if len(sub) > 0 else np.nan

    # ── Step 3: Adjacent tier differences ────────────────────────────────────
    adjacent_pairs = [
        ('Mega-Viral', 'Viral'),
        ('Viral', 'Good'),
        ('Good', 'Average'),
        ('Average', 'Underperformer'),
    ]

    # For each pair, find features with biggest jump (by % difference or absolute)
    adjacent_analysis = {}
    for higher, lower in adjacent_pairs:
        diffs = []
        for feat in TOP_FEATURES:
            h = tier_means[feat][higher]
            l = tier_means[feat][lower]
            if np.isnan(h) or np.isnan(l) or l == 0:
                continue
            abs_diff = h - l
            pct = ((h - l) / abs(l)) * 100
            # For negative-correlation features, a decrease is "better", so flip sign for ranking
            # We want the biggest absolute pct change regardless of direction
            diffs.append({
                'feature': feat,
                'higher_val': h,
                'lower_val': l,
                'abs_diff': abs_diff,
                'pct_diff': pct,
                'rank_key': abs(pct),
            })
        diffs.sort(key=lambda x: x['rank_key'], reverse=True)
        adjacent_analysis[(higher, lower)] = diffs[:5]

    # ── Step 4: Threshold analysis ───────────────────────────────────────────
    # Use median of Good tier as threshold
    threshold_features = TOP_FEATURES[:10]  # top 10
    threshold_results = []
    for feat in threshold_features:
        good_sub = df[df['tier'] == 'Good'][feat].dropna()
        if len(good_sub) == 0:
            continue
        threshold = float(good_sub.median())
        col = df[feat].dropna()
        idx = col.index
        dps_col = df.loc[idx, 'dps_score']

        above = dps_col[col >= threshold]
        below = dps_col[col < threshold]

        if len(above) < 10 or len(below) < 10:
            continue

        # Mann-Whitney for statistical significance
        try:
            _, p_val = mannwhitneyu(above, below, alternative='two-sided')
        except Exception:
            p_val = 1.0

        threshold_results.append({
            'feature': feat,
            'threshold': threshold,
            'above_mean': float(above.mean()),
            'above_n': len(above),
            'below_mean': float(below.mean()),
            'below_n': len(below),
            'diff': float(above.mean() - below.mean()),
            'p_val': p_val,
        })

    # ── Step 5: Build recommendations per tier ───────────────────────────────
    # These are generated from the actual data
    # For each tier, compare to the next tier up and find the 3 biggest gaps
    recs = {}
    for t_idx, t in enumerate(tier_order):
        if t == 'Mega-Viral':
            recs[t] = None  # top tier, no "next tier"
            continue
        target = tier_order[t_idx - 1]  # next tier up
        gaps = []
        for feat in TOP_FEATURES:
            current = tier_means[feat][t]
            target_val = tier_means[feat][target]
            if np.isnan(current) or np.isnan(target_val) or current == 0:
                continue
            pct = ((target_val - current) / abs(current)) * 100
            gaps.append({
                'feature': feat,
                'current': current,
                'target': target_val,
                'pct': pct,
                'abs_pct': abs(pct),
            })
        gaps.sort(key=lambda x: x['abs_pct'], reverse=True)
        recs[t] = {'target_tier': target, 'top_gaps': gaps[:3]}

    # ═══════════════════════════════════════════════════════════════════════════
    # BUILD REPORT
    # ═══════════════════════════════════════════════════════════════════════════

    lines = []
    def w(s=''):
        lines.append(s)

    w('# Tier Analysis Report — What Separates Each DPS Tier')
    w()
    w(f'**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M")}')
    w(f'**Sample size:** {len(df)} videos (side-hustles niche)')
    w(f'**DPS range:** {dps.min():.1f} - {dps.max():.1f} (mean={dps.mean():.1f}, median={dps.median():.1f})')
    w()

    # Step 1
    w('## Step 1: Tier Definitions (Percentile-Based)')
    w()
    w('| Tier | Percentile | DPS Range | Count | Mean DPS | Median DPS |')
    w('|------|-----------|-----------|-------|----------|------------|')
    pct_labels = {
        'Mega-Viral': f'>= 90th (>= {p90:.1f})',
        'Viral': f'75th-90th ({p75:.1f}-{p90:.1f})',
        'Good': f'50th-75th ({p50:.1f}-{p75:.1f})',
        'Average': f'25th-50th ({p25:.1f}-{p50:.1f})',
        'Underperformer': f'< 25th (< {p25:.1f})',
    }
    for t in tier_order:
        s = tier_stats[t]
        w(f'| **{t}** | {pct_labels[t]} | {s["min"]:.1f}-{s["max"]:.1f} | {s["n"]} | {s["mean"]:.1f} | {s["median"]:.1f} |')
    w()

    # Step 2
    w('## Step 2: Feature Profile by Tier')
    w()
    w('Mean value of top 20 content features across all 5 tiers.')
    w('Reading left to right shows how features change as performance improves.')
    w()
    header = '| Feature | Mega-Viral | Viral | Good | Average | Under |'
    sep =    '|---------|-----------|-------|------|---------|-------|'
    w(header)
    w(sep)
    for feat in TOP_FEATURES:
        label = FEATURE_LABELS.get(feat, feat)
        vals = [fmt(tier_means[feat][t], feat) for t in tier_order]
        w(f'| {label} | {vals[0]} | {vals[1]} | {vals[2]} | {vals[3]} | {vals[4]} |')
    w()

    # Linearity analysis
    w('### Progression Patterns')
    w()
    w('Features where performance increases **linearly** with tier:')
    linear = []
    jumpy = []
    for feat in TOP_FEATURES:
        vals = [tier_means[feat][t] for t in tier_order]
        if any(np.isnan(v) for v in vals):
            continue
        # Check if monotonically increasing/decreasing across tiers
        diffs_seq = [vals[i] - vals[i+1] for i in range(len(vals)-1)]
        all_pos = all(d >= -0.01 for d in diffs_seq)
        all_neg = all(d <= 0.01 for d in diffs_seq)
        if all_pos or all_neg:
            linear.append(FEATURE_LABELS.get(feat, feat))
        else:
            jumpy.append(feat)

    if linear:
        w(f'- **Linear progression** (each tier step improves): {", ".join(linear)}')
    if jumpy:
        labels = [FEATURE_LABELS.get(f, f) for f in jumpy]
        w(f'- **Non-linear / jump patterns**: {", ".join(labels)}')
    w()

    # Step 3
    w('## Step 3: What Separates Adjacent Tiers')
    w()
    w('For each tier boundary, the 5 features with the **largest jump** between tiers.')
    w('These are the "unlock" features — improving them pushes you to the next tier.')
    w()

    pair_labels = {
        ('Mega-Viral', 'Viral'): 'Viral → Mega-Viral',
        ('Viral', 'Good'): 'Good → Viral',
        ('Good', 'Average'): 'Average → Good',
        ('Average', 'Underperformer'): 'Underperformer → Average',
    }

    for (higher, lower), diffs in adjacent_analysis.items():
        label = pair_labels[(higher, lower)]
        w(f'### {label}')
        w()
        for i, d in enumerate(diffs, 1):
            fl = FEATURE_LABELS.get(d['feature'], d['feature'])
            w(f'{i}. **{fl}**: {fmt(d["lower_val"], d["feature"])} → {fmt(d["higher_val"], d["feature"])} ({d["pct_diff"]:+.1f}%)')
        w()

    # Plain English for each transition
    w('### Plain English Summary')
    w()

    for (higher, lower), diffs in adjacent_analysis.items():
        label = pair_labels[(higher, lower)]
        w(f'**{label}:**')
        if higher == 'Mega-Viral':
            w(f'The jump from Viral to Mega-Viral is the hardest. The top {tier_stats["Mega-Viral"]["n"]} videos '
              f'(DPS {tier_stats["Mega-Viral"]["min"]:.0f}+) separate themselves through:')
        elif higher == 'Viral':
            w(f'To break into Viral territory (DPS {tier_stats["Viral"]["min"]:.0f}+):')
        elif higher == 'Good':
            w(f'The Average-to-Good transition (DPS {tier_stats["Good"]["min"]:.0f}+) is where most creators struggle:')
        else:
            w(f'To escape Underperformer status (DPS {tier_stats["Average"]["min"]:.0f}+):')

        for i, d in enumerate(diffs[:3], 1):
            fl = FEATURE_LABELS.get(d['feature'], d['feature'])
            if d['pct_diff'] > 0:
                w(f'- {fl} jumps {d["pct_diff"]:.0f}% higher ({fmt(d["lower_val"], d["feature"])} → {fmt(d["higher_val"], d["feature"])})')
            else:
                w(f'- {fl} drops {abs(d["pct_diff"]):.0f}% ({fmt(d["lower_val"], d["feature"])} → {fmt(d["higher_val"], d["feature"])})')
        w()

    # Step 4
    w('## Step 4: Threshold Analysis')
    w()
    w('For each top feature, the threshold (Good-tier median) that separates high from low performers.')
    w()
    w('| Feature | Threshold | Below: avg DPS | n | Above: avg DPS | n | Diff | Significant? |')
    w('|---------|-----------|---------------|---|---------------|---|------|-------------|')
    for r in threshold_results:
        fl = FEATURE_LABELS.get(r['feature'], r['feature'])
        sig = '***' if r['p_val'] < 0.001 else ('**' if r['p_val'] < 0.01 else ('*' if r['p_val'] < 0.05 else ''))
        w(f'| {fl} | {fmt(r["threshold"], r["feature"])} | {r["below_mean"]:.1f} | {r["below_n"]} | {r["above_mean"]:.1f} | {r["above_n"]} | {r["diff"]:+.1f} | {"Yes" + sig if r["p_val"] < 0.05 else "No"} |')
    w()

    w('### Key Thresholds (Plain English)')
    w()
    for r in threshold_results:
        if r['p_val'] >= 0.05:
            continue
        fl = FEATURE_LABELS.get(r['feature'], r['feature'])
        thresh_str = fmt(r['threshold'], r['feature'])
        w(f'- **{fl}**: Videos at/above {thresh_str} average **{r["above_mean"]:.1f}** DPS '
          f'vs **{r["below_mean"]:.1f}** below ({r["diff"]:+.1f} gap, n={r["above_n"]}+{r["below_n"]})')
    w()

    # Step 5
    w('## Step 5: Creator Action Items by Current Tier')
    w()

    for t in ['Underperformer', 'Average', 'Good', 'Viral']:
        info = recs[t]
        if not info:
            continue
        target = info['target_tier']
        s = tier_stats[t]
        ts = tier_stats[target]
        w(f'### If You\'re in **{t}** (DPS {s["min"]:.0f}-{s["max"]:.0f})')
        w(f'**Goal:** Reach {target} tier (DPS {ts["min"]:.0f}+)')
        w()

        for i, gap in enumerate(info['top_gaps'], 1):
            fl = FEATURE_LABELS.get(gap['feature'], gap['feature'])
            current_str = fmt(gap['current'], gap['feature'])
            target_str = fmt(gap['target'], gap['feature'])
            direction = 'increase' if gap['pct'] > 0 else 'decrease'

            # Generate specific advice based on feature
            advice = _get_advice(gap['feature'], gap['current'], gap['target'], direction)
            w(f'{i}. **{fl}**: Your tier averages {current_str}, {target} averages {target_str}.')
            w(f'   → {advice}')
        w()

    w('---')
    w(f'*Generated from {len(df)} real videos on {datetime.now().strftime("%Y-%m-%d")}. '
      f'All thresholds are data-driven percentiles, not arbitrary cutoffs.*')

    report = '\n'.join(lines)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(report)
    print(f'\n  ✅ Saved: {OUTPUT_PATH}')
    print(f'     {len(lines)} lines')

    # Also print to stdout for verification
    print('\n' + '=' * 60)
    print(report)

    return report


def _get_advice(feature, current, target, direction):
    """Generate specific, measurable advice for a feature gap."""
    adv = {
        'ffmpeg_scene_changes': f'Add more cuts and scene transitions. Aim for {target:.0f}+ scene changes per video (you average {current:.0f}).',
        'visual_scene_count': f'Use B-roll, screen recordings, and angle changes to reach {target:.0f}+ distinct scenes.',
        'visual_variety_score': f'Mix talking head with B-roll, text overlays, and screen shares. Target variety score {target:.0f}+.',
        'ffmpeg_avg_motion': f'Add more on-screen movement — hand gestures, walking, object demos. Avoid static talking-head framing.',
        'ffmpeg_cuts_per_second': f'Cut faster. Target {target:.2f}+ cuts/second (roughly one cut every {1/target:.0f}s).' if target > 0 else 'Add more frequent cuts.',
        'visual_score': f'Improve overall visual quality to {target:.1f}+ through better lighting, framing, and scene variety.',
        'ffmpeg_resolution_height': f'Film in {int(target)}p minimum. Your tier averages {int(current)}p.',
        'ffmpeg_contrast_score': f'Use better lighting to create contrast. Avoid flat, evenly-lit scenes.',
        'thumb_contrast': f'Design thumbnails with bold contrast — dark text on bright backgrounds or vice versa. Target score {target:.0f}+.',
        'ffmpeg_fps': f'Film at {target:.0f}fps for smoother playback.',
        'text_emoji_count': f'Reduce emoji usage in captions from {current:.1f} to {target:.1f} or fewer.',
        'text_negative_word_count': f'Eliminate negative framing (hate, worst, terrible). Reframe as positive outcomes.',
        'audio_pitch_mean_hz': f'Speak with more energy and vocal variety. Higher pitch ({target:.0f}Hz) correlates with engagement.',
        'meta_duration_seconds': f'Aim for {target:.0f}s videos. Your tier averages {current:.0f}s — {"extend" if target > current else "trim"} accordingly.',
        'visual_avg_scene_duration': f'Shorten individual scenes to ~{target:.0f}s each (you average {current:.0f}s). Faster pacing holds attention.',
        'text_transcript_length': f'{"Tighten your script" if target < current else "Expand your script"} — target ~{target:.0f} characters.',
        'text_question_mark_count': f'{"Use fewer rhetorical questions" if target < current else "Add strategic questions"} (target ~{target:.0f}).',
        'speaking_rate_wpm': f'{"Slow down" if target < current else "Speed up"} your delivery to ~{target:.0f} WPM.',
        'hook_score': f'Strengthen your opening hook. Target hook score {target:.1f}+ with a bold first statement.',
        'thumb_overall_score': f'Improve thumbnail quality — clarity, contrast, text readability. Target score {target:.1f}+.',
    }
    return adv.get(feature, f'{direction.capitalize()} from {current:.2f} to {target:.2f}.')


if __name__ == '__main__':
    main()

# -*- coding: utf-8 -*-
"""
Creator Baseline Analysis — Side-Hustles Niche

Determines which signals predict a video outperforming its creator's own
baseline, not just raw DPS. This separates true content-quality signals
from creator-authority signals.

Tables used:
  - scraped_videos: video_id, dps_score, creator_username, creator_followers_count,
    views_count, likes_count, comments_count, shares_count, saves_count,
    hashtags, upload_timestamp, duration_seconds, niche
  - training_features: all pre-publication extracted features (joined via video_id)

CONTAMINATION BOUNDARY:
  Post-publication engagement metrics (views, likes, comments, shares, saves)
  are used for ANALYSIS AND INTERPRETATION ONLY. None feed into prediction
  features. Creator baselines use DPS (a post-pub derived score) only to
  measure relative performance — never as a prediction input.

Output: docs/CREATOR_BASELINE_ANALYSIS.md
"""

import sys, io, os
import numpy as np
import pandas as pd
from scipy.stats import spearmanr, mannwhitneyu
from datetime import datetime
from collections import Counter

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs', 'CREATOR_BASELINE_ANALYSIS.md')
NICHE_FILTER = 'side-hustles'
MIN_VIDEOS_PER_CREATOR = 10  # minimum for baseline calculation


def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
    if os.path.exists(env_path):
        with open(env_path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    os.environ[k.strip()] = v.strip()
    else:
        print(f'ERROR: .env.local not found at {env_path}')
        sys.exit(1)


def fetch_data():
    from supabase import create_client

    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    if not url or not key:
        print('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY')
        sys.exit(1)

    sb = create_client(url, key)
    batch_size = 1000

    # 1. Fetch scraped_videos
    print('Fetching scraped_videos (side-hustles)...')
    columns = (
        'video_id, views_count, likes_count, comments_count, shares_count, '
        'saves_count, hashtags, upload_timestamp, dps_score, creator_username, '
        'creator_followers_count, duration_seconds, niche'
    )
    all_videos = []
    offset = 0
    while True:
        resp = (sb.table('scraped_videos')
                .select(columns)
                .eq('niche', NICHE_FILTER)
                .not_.is_('dps_score', 'null')
                .range(offset, offset + batch_size - 1)
                .execute())
        if not resp.data:
            break
        all_videos.extend(resp.data)
        if len(resp.data) < batch_size:
            break
        offset += batch_size
    print(f'  scraped_videos: {len(all_videos)} rows')

    # 2. Fetch training_features
    print('Fetching training_features...')
    all_features = []
    offset = 0
    while True:
        resp = sb.table('training_features').select('*').range(offset, offset + batch_size - 1).execute()
        if not resp.data:
            break
        all_features.extend(resp.data)
        if len(resp.data) < batch_size:
            break
        offset += batch_size
    print(f'  training_features: {len(all_features)} rows')

    return all_videos, all_features


def get_numeric_features(df):
    """Return numeric feature columns suitable for correlation."""
    skip = {'id', 'video_id', 'created_at', 'updated_at', 'dps_score', 'niche',
            'niche_key', 'creator_username', 'creator_followers_count',
            'views_count', 'likes_count', 'comments_count', 'shares_count',
            'saves_count', 'upload_timestamp', 'upload_ts', 'hour_of_day',
            'day_of_week', 'like_rate', 'comment_rate', 'share_rate',
            'save_rate', 'total_eng_rate', 'hashtag_count', 'hashtags',
            'tier', 'dps_deviation', 'dps_z_score', 'creator_mean_dps',
            'creator_median_dps', 'creator_q75_dps', 'creator_std_dps',
            'duration_seconds'}
    numeric_cols = []
    for col in df.columns:
        if col in skip:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            if df[col].notna().sum() >= 10 and df[col].std() > 0:
                numeric_cols.append(col)
    return sorted(numeric_cols)


def compute_correlations(df, features, target_col, label):
    """Compute Spearman r for each feature against target_col."""
    target = df[target_col].values.astype(float)
    results = []
    for feat in features:
        vals = df[feat].values.astype(float)
        valid = ~np.isnan(vals) & ~np.isnan(target)
        if valid.sum() < 10:
            continue
        r, p = spearmanr(vals[valid], target[valid])
        results.append({
            'feature': feat,
            'spearman_r': r,
            'p_value': p,
            'n_valid': int(valid.sum()),
        })
    results.sort(key=lambda x: abs(x['spearman_r']), reverse=True)
    return results


def fmt_num(val, decimals=2):
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return 'N/A'
    if abs(val) >= 1_000_000:
        return f'{val/1_000_000:.1f}M'
    if abs(val) >= 1_000:
        return f'{val/1_000:.1f}K'
    if decimals == 0:
        return f'{int(val)}'
    return f'{val:.{decimals}f}'


def classify_change(raw_r, dev_r):
    """Classify how a signal changes after creator-baseline adjustment."""
    raw_abs = abs(raw_r)
    dev_abs = abs(dev_r)

    if raw_abs < 0.05 and dev_abs < 0.05:
        return 'Negligible both'
    if raw_abs >= 0.1 and dev_abs < 0.05:
        return 'VANISHES (creator-driven)'
    if raw_abs >= 0.1 and dev_abs >= 0.1 and dev_abs < raw_abs * 0.5:
        return 'WEAKENS substantially'
    if raw_abs >= 0.1 and dev_abs >= raw_abs * 0.5:
        return 'SURVIVES (content signal)'
    if raw_abs < 0.05 and dev_abs >= 0.1:
        return 'EMERGES (hidden by creator variance)'
    if dev_abs >= raw_abs * 1.3 and dev_abs >= 0.1:
        return 'STRENGTHENS (true content signal)'
    return 'Minor change'


def main():
    print('=' * 60)
    print('  Creator Baseline Analysis — Side-Hustles')
    print('=' * 60)

    load_env()
    all_videos, all_features = fetch_data()

    if not all_videos:
        print('ERROR: No video data. Aborting.')
        sys.exit(1)

    # Build video DataFrame
    vdf = pd.DataFrame(all_videos)
    for col in ['views_count', 'likes_count', 'comments_count', 'shares_count',
                'saves_count', 'dps_score', 'creator_followers_count', 'duration_seconds']:
        vdf[col] = pd.to_numeric(vdf[col], errors='coerce')

    # Parse upload time
    vdf['upload_ts'] = pd.to_datetime(vdf['upload_timestamp'], errors='coerce', utc=True)
    vdf['hour_of_day'] = vdf['upload_ts'].dt.hour
    vdf['hashtag_count'] = vdf['hashtags'].apply(lambda h: len(h) if isinstance(h, list) else 0)

    # Engagement ratios
    for num_col, ratio_col in [('likes_count', 'like_rate'), ('comments_count', 'comment_rate'),
                                ('shares_count', 'share_rate'), ('saves_count', 'save_rate')]:
        vdf[ratio_col] = vdf[num_col] / vdf['views_count'].replace(0, np.nan)

    # ── Creator Baselines ────────────────────────────────────────────────────
    print('\n  Computing creator baselines...')

    creator_stats = (vdf.groupby('creator_username')['dps_score']
                     .agg(['count', 'mean', 'median', 'std'])
                     .rename(columns={'count': 'n', 'mean': 'creator_mean_dps',
                                      'median': 'creator_median_dps', 'std': 'creator_std_dps'}))
    creator_stats['creator_q75_dps'] = vdf.groupby('creator_username')['dps_score'].quantile(0.75)

    # Filter to creators with enough videos
    eligible = creator_stats[creator_stats['n'] >= MIN_VIDEOS_PER_CREATOR]
    excluded = creator_stats[creator_stats['n'] < MIN_VIDEOS_PER_CREATOR]

    print(f'  Creators with >= {MIN_VIDEOS_PER_CREATOR} videos: {len(eligible)} ({eligible["n"].sum()} videos)')
    print(f'  Excluded creators: {len(excluded)} ({excluded["n"].sum()} videos)')

    # Merge baselines into video df
    vdf = vdf.merge(eligible[['creator_mean_dps', 'creator_median_dps', 'creator_q75_dps', 'creator_std_dps']],
                     left_on='creator_username', right_index=True, how='inner')

    # Compute deviation metrics
    vdf['dps_deviation'] = vdf['dps_score'] - vdf['creator_median_dps']
    vdf['dps_z_score'] = (vdf['dps_score'] - vdf['creator_mean_dps']) / vdf['creator_std_dps'].replace(0, np.nan)

    print(f'  Videos after creator filter: {len(vdf)}')
    print(f'  DPS deviation range: {vdf["dps_deviation"].min():.1f} to {vdf["dps_deviation"].max():.1f}')
    print(f'  DPS z-score range: {vdf["dps_z_score"].min():.2f} to {vdf["dps_z_score"].max():.2f}')

    # ── Join with training_features ──────────────────────────────────────────
    if all_features:
        fdf = pd.DataFrame(all_features)
        # Merge on video_id
        merged = vdf.merge(fdf, on='video_id', how='inner', suffixes=('', '_feat'))
        print(f'  Videos with training_features: {len(merged)}')
    else:
        merged = vdf
        print(f'  No training_features data — using scraped_videos columns only')

    # Get pre-pub numeric features
    pre_pub_features = get_numeric_features(merged)
    print(f'  Pre-pub numeric features found: {len(pre_pub_features)}')

    # Also analyze post-pub engagement ratios (for the engagement section)
    post_pub_metrics = ['like_rate', 'comment_rate', 'share_rate', 'save_rate',
                        'hashtag_count', 'duration_seconds']

    # ══════════════════════════════════════════════════════════════════════════
    # COMPUTE CORRELATIONS: raw DPS vs creator-relative deviation
    # ══════════════════════════════════════════════════════════════════════════

    all_analysis_features = pre_pub_features + [m for m in post_pub_metrics if m in merged.columns]

    raw_corr = compute_correlations(merged, all_analysis_features, 'dps_score', 'Raw DPS')
    dev_corr = compute_correlations(merged, all_analysis_features, 'dps_deviation', 'DPS Deviation')
    z_corr = compute_correlations(merged, all_analysis_features, 'dps_z_score', 'DPS Z-Score')

    raw_map = {r['feature']: r for r in raw_corr}
    dev_map = {r['feature']: r for r in dev_corr}
    z_map = {r['feature']: r for r in z_corr}

    # ══════════════════════════════════════════════════════════════════════════
    # BUILD REPORT
    # ══════════════════════════════════════════════════════════════════════════

    report = []
    w = report.append

    w('# Creator Baseline Analysis — Side-Hustles Niche')
    w(f'\n**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M")}')
    w(f'**Niche:** Side-Hustles / Making Money Online')
    w(f'**Content type:** Creator-led short-form, talking-head knowledge, direct-to-camera educational')
    w('')

    w('> **CONTAMINATION BOUNDARY:** Post-publication engagement metrics are used for')
    w('> analysis and interpretation only. Creator baselines use DPS (a post-pub derived')
    w('> score) only to measure relative performance — never as a prediction input.')
    w('')

    # ── EXECUTIVE SUMMARY ────────────────────────────────────────────────────
    w('## Executive Summary')
    w('')
    w(f'Raw DPS correlations mix two effects: (1) creator authority (bigger accounts get more views)')
    w(f'and (2) content quality (some videos genuinely outperform). By computing each video\'s')
    w(f'**deviation from its creator\'s baseline DPS**, we isolate the content-quality signal.')
    w('')
    w(f'This analysis covers **{len(vdf)} videos** from **{len(eligible)} creators** (each with')
    w(f'>= {MIN_VIDEOS_PER_CREATOR} videos). {len(excluded)} creators with <{MIN_VIDEOS_PER_CREATOR}')
    w(f'videos ({excluded["n"].sum()} videos total) were excluded for insufficient baseline data.')
    w('')

    # Classify features into categories
    survivors = []
    vanished = []
    emerged = []
    weakened = []
    for feat in all_analysis_features:
        if feat in raw_map and feat in dev_map:
            raw_r = raw_map[feat]['spearman_r']
            dev_r = dev_map[feat]['spearman_r']
            cat = classify_change(raw_r, dev_r)
            entry = (feat, raw_r, dev_r, cat)
            if 'SURVIVES' in cat or 'STRENGTHENS' in cat:
                survivors.append(entry)
            elif 'VANISHES' in cat:
                vanished.append(entry)
            elif 'EMERGES' in cat:
                emerged.append(entry)
            elif 'WEAKENS' in cat:
                weakened.append(entry)

    w('**Key findings:**')
    w(f'- **{len(survivors)}** signals survive or strengthen after controlling for creator baseline — these reflect true content quality')
    w(f'- **{len(vanished)}** signals vanish — they were proxies for creator authority, not content quality')
    w(f'- **{len(emerged)}** signals emerge — hidden by between-creator variance in raw DPS')
    w(f'- **{len(weakened)}** signals weaken substantially but don\'t fully vanish')
    w('')

    # ── METHODOLOGY ──────────────────────────────────────────────────────────
    w('## Methodology')
    w('')
    w('### Creator Baseline Computation')
    w('')
    w(f'For each creator with >= {MIN_VIDEOS_PER_CREATOR} videos in the side-hustles dataset:')
    w('')
    w('| Metric | Definition | Purpose |')
    w('|--------|-----------|---------|')
    w('| `creator_mean_dps` | Mean of all creator\'s DPS scores | Central tendency |')
    w('| `creator_median_dps` | Median of all creator\'s DPS scores | Robust central tendency |')
    w('| `creator_q75_dps` | 75th percentile of creator\'s DPS scores | "Good day" threshold |')
    w('| `creator_std_dps` | Standard deviation of creator\'s DPS | Spread / consistency |')
    w('')
    w('### Per-Video Deviation Metrics')
    w('')
    w('| Metric | Formula | Interpretation |')
    w('|--------|---------|----------------|')
    w('| `dps_deviation` | `video_dps - creator_median_dps` | Points above/below creator norm |')
    w('| `dps_z_score` | `(video_dps - creator_mean_dps) / creator_std_dps` | Standard deviations from creator norm |')
    w('')
    w('### Comparison Approach')
    w('')
    w('For every feature, we compute Spearman rank correlation against both:')
    w('1. **Raw DPS** — the global percentile score (confounded by creator authority)')
    w('2. **DPS Deviation** — how much this video over/underperformed its creator\'s baseline')
    w('')
    w('Features that correlate with raw DPS but not deviation are **creator-authority proxies**.')
    w('Features that correlate with deviation are **content-quality signals**.')
    w('')

    w('### Tables/Columns Used')
    w('```')
    w('scraped_videos:')
    w('  video_id, dps_score, creator_username, creator_followers_count,')
    w('  views_count, likes_count, comments_count, shares_count, saves_count,')
    w('  hashtags, upload_timestamp, duration_seconds')
    w('')
    w('training_features:')
    w('  All numeric columns (pre-publication extracted features)')
    w('  Joined to scraped_videos via video_id')
    w('```')
    w('')

    w(f'### Sample Thresholds')
    w('')
    w(f'- **Minimum videos per creator:** {MIN_VIDEOS_PER_CREATOR}')
    w(f'- **Minimum non-null values for correlation:** 10')
    w(f'- **Significance threshold:** p < 0.05 (noted with *), p < 0.01 (**), p < 0.001 (***)')
    w('')

    # ── CREATOR BASELINES ────────────────────────────────────────────────────
    w('## Creator Baselines')
    w('')
    w(f'### Eligible Creators ({len(eligible)} with >= {MIN_VIDEOS_PER_CREATOR} videos)')
    w('')
    w('| Creator | Videos | Mean DPS | Median DPS | Std Dev | Q75 DPS | Followers |')
    w('|---------|--------|---------|------------|---------|---------|-----------|')
    for name, row in eligible.sort_values('creator_median_dps', ascending=False).iterrows():
        followers = vdf[vdf['creator_username'] == name]['creator_followers_count'].iloc[0]
        w(f'| @{name} | {int(row["n"])} | {row["creator_mean_dps"]:.1f} | '
          f'{row["creator_median_dps"]:.1f} | {row["creator_std_dps"]:.1f} | '
          f'{row["creator_q75_dps"]:.1f} | {fmt_num(followers)} |')
    w('')

    if len(excluded) > 0:
        w(f'### Excluded Creators ({len(excluded)} with < {MIN_VIDEOS_PER_CREATOR} videos)')
        w('')
        w('| Creator | Videos | Reason |')
        w('|---------|--------|--------|')
        for name, row in excluded.iterrows():
            w(f'| @{name} | {int(row["n"])} | Below {MIN_VIDEOS_PER_CREATOR}-video threshold |')
        w('')

    # Baseline spread analysis
    w('### Baseline Spread')
    w('')
    w(f'Creator median DPS ranges from **{eligible["creator_median_dps"].min():.1f}** to '
      f'**{eligible["creator_median_dps"].max():.1f}** (range: {eligible["creator_median_dps"].max() - eligible["creator_median_dps"].min():.1f} points).')
    w(f'This {eligible["creator_median_dps"].max() - eligible["creator_median_dps"].min():.0f}-point spread is the "creator authority" ')
    w(f'variance that raw DPS conflates with content quality.')
    w('')
    w(f'Mean within-creator std dev: **{eligible["creator_std_dps"].mean():.1f}** DPS points.')
    w(f'This is the typical range of content-quality variation *within* a single creator.')
    w('')

    # ── DEVIATION DISTRIBUTION ───────────────────────────────────────────────
    w('## DPS Deviation Distribution')
    w('')
    w('| Statistic | DPS Deviation | DPS Z-Score |')
    w('|-----------|--------------|-------------|')
    for stat_name, fn in [('Mean', 'mean'), ('Median', 'median'), ('Std Dev', 'std'),
                           ('Min', 'min'), ('Max', 'max')]:
        val_d = getattr(vdf['dps_deviation'], fn)()
        val_z = getattr(vdf['dps_z_score'], fn)()
        w(f'| {stat_name} | {val_d:.2f} | {val_z:.2f} |')
    # Manually add IQR
    d_q25, d_q75 = vdf['dps_deviation'].quantile(0.25), vdf['dps_deviation'].quantile(0.75)
    z_q25, z_q75 = vdf['dps_z_score'].quantile(0.25), vdf['dps_z_score'].quantile(0.75)
    w(f'| IQR (25-75%) | {d_q25:.2f} to {d_q75:.2f} | {z_q25:.2f} to {z_q75:.2f} |')
    w('')

    # ── ENGAGEMENT RATIOS: RAW vs DEVIATION ──────────────────────────────────
    w('## Post-Publication Engagement: Raw DPS vs Creator-Relative')
    w('')
    w('How do engagement ratios correlate with raw DPS vs deviation from creator baseline?')
    w('')

    eng_metrics = [('like_rate', 'Like Rate'), ('comment_rate', 'Comment Rate'),
                   ('share_rate', 'Share Rate'), ('save_rate', 'Save Rate'),
                   ('hashtag_count', 'Hashtag Count'), ('duration_seconds', 'Duration')]

    w('| Metric | r (Raw DPS) | p | r (Deviation) | p | r (Z-Score) | p | Change |')
    w('|--------|-------------|---|---------------|---|-------------|---|--------|')
    for col, label in eng_metrics:
        raw = raw_map.get(col, {})
        dev = dev_map.get(col, {})
        z = z_map.get(col, {})
        raw_r = raw.get('spearman_r', np.nan)
        raw_p = raw.get('p_value', np.nan)
        dev_r = dev.get('spearman_r', np.nan)
        dev_p = dev.get('p_value', np.nan)
        z_r = z.get('spearman_r', np.nan)
        z_p = z.get('p_value', np.nan)

        if not np.isnan(raw_r) and not np.isnan(dev_r):
            change = classify_change(raw_r, dev_r)
        else:
            change = 'N/A'

        def sig(p):
            if np.isnan(p): return 'N/A'
            if p < 0.001: return f'{p:.1e}***'
            if p < 0.01: return f'{p:.3f}**'
            if p < 0.05: return f'{p:.3f}*'
            return f'{p:.3f}'

        w(f'| {label} | {raw_r:+.3f} | {sig(raw_p)} | {dev_r:+.3f} | {sig(dev_p)} | '
          f'{z_r:+.3f} | {sig(z_p)} | {change} |')
    w('')

    # ── PRE-PUB FEATURES: RAW vs DEVIATION ───────────────────────────────────
    if pre_pub_features:
        w('## Pre-Publication Features: Raw DPS vs Creator-Relative')
        w('')
        w(f'*{len(pre_pub_features)} pre-publication features analyzed.*')
        w('')

        # Build combined table sorted by abs(deviation r)
        combined = []
        for feat in pre_pub_features:
            raw = raw_map.get(feat, {})
            dev = dev_map.get(feat, {})
            raw_r = raw.get('spearman_r', np.nan)
            dev_r = dev.get('spearman_r', np.nan)
            if np.isnan(raw_r) and np.isnan(dev_r):
                continue
            change = classify_change(raw_r, dev_r) if not np.isnan(raw_r) and not np.isnan(dev_r) else 'N/A'
            combined.append({
                'feature': feat,
                'raw_r': raw_r,
                'raw_p': raw.get('p_value', np.nan),
                'dev_r': dev_r,
                'dev_p': dev.get('p_value', np.nan),
                'change': change,
                'n': raw.get('n_valid', 0),
            })

        combined.sort(key=lambda x: abs(x.get('dev_r', 0)), reverse=True)

        # Top 30 by deviation correlation
        w('### Features Ranked by Creator-Relative Correlation (Top 30)')
        w('')
        w('| Feature | r (Raw DPS) | r (Deviation) | Change | n |')
        w('|---------|-------------|---------------|--------|---|')
        for entry in combined[:30]:
            sig_raw = '***' if entry['raw_p'] < 0.001 else '**' if entry['raw_p'] < 0.01 else '*' if entry['raw_p'] < 0.05 else ''
            sig_dev = '***' if entry['dev_p'] < 0.001 else '**' if entry['dev_p'] < 0.01 else '*' if entry['dev_p'] < 0.05 else ''
            w(f'| {entry["feature"]} | {entry["raw_r"]:+.3f}{sig_raw} | {entry["dev_r"]:+.3f}{sig_dev} | {entry["change"]} | {entry["n"]} |')
        w('')

        # ── Signals that VANISH ──────────────────────────────────────────────
        vanish_list = [e for e in combined if 'VANISHES' in e['change']]
        if vanish_list:
            w('### Signals That VANISH After Creator Control')
            w('*These correlated with raw DPS but NOT with deviation — they are creator-authority proxies.*')
            w('')
            w('| Feature | r (Raw DPS) | r (Deviation) |')
            w('|---------|-------------|---------------|')
            for entry in sorted(vanish_list, key=lambda x: abs(x['raw_r']), reverse=True):
                w(f'| {entry["feature"]} | {entry["raw_r"]:+.3f} | {entry["dev_r"]:+.3f} |')
            w('')

        # ── Signals that SURVIVE ─────────────────────────────────────────────
        survive_list = [e for e in combined if 'SURVIVES' in e['change'] or 'STRENGTHENS' in e['change']]
        if survive_list:
            w('### Signals That SURVIVE After Creator Control')
            w('*These correlate with both raw DPS AND deviation — they reflect true content quality.*')
            w('')
            w('| Feature | r (Raw DPS) | r (Deviation) | Verdict |')
            w('|---------|-------------|---------------|---------|')
            for entry in sorted(survive_list, key=lambda x: abs(x['dev_r']), reverse=True):
                w(f'| {entry["feature"]} | {entry["raw_r"]:+.3f} | {entry["dev_r"]:+.3f} | {entry["change"]} |')
            w('')

        # ── Signals that EMERGE ──────────────────────────────────────────────
        emerge_list = [e for e in combined if 'EMERGES' in e['change']]
        if emerge_list:
            w('### Signals That EMERGE After Creator Control')
            w('*These had negligible raw-DPS correlation but DO correlate with deviation — hidden by between-creator variance.*')
            w('')
            w('| Feature | r (Raw DPS) | r (Deviation) |')
            w('|---------|-------------|---------------|')
            for entry in sorted(emerge_list, key=lambda x: abs(x['dev_r']), reverse=True):
                w(f'| {entry["feature"]} | {entry["raw_r"]:+.3f} | {entry["dev_r"]:+.3f} |')
            w('')

        # ── Signals that WEAKEN ──────────────────────────────────────────────
        weaken_list = [e for e in combined if 'WEAKENS' in e['change']]
        if weaken_list:
            w('### Signals That WEAKEN Substantially')
            w('*These partially reflect creator authority but retain some content signal.*')
            w('')
            w('| Feature | r (Raw DPS) | r (Deviation) |')
            w('|---------|-------------|---------------|')
            for entry in sorted(weaken_list, key=lambda x: abs(x['raw_r']), reverse=True):
                w(f'| {entry["feature"]} | {entry["raw_r"]:+.3f} | {entry["dev_r"]:+.3f} |')
            w('')
    else:
        w('## Pre-Publication Features')
        w('')
        w('*No training_features data matched side-hustles videos. This section uses scraped_videos columns only.*')
        w('')

    # ── HEAD-TO-HEAD COMPARISON ──────────────────────────────────────────────
    w('## Head-to-Head: Raw DPS vs Creator-Relative Findings')
    w('')
    w('### Summary Table')
    w('')

    # Compute top 10 for each
    raw_top10 = [r['feature'] for r in raw_corr[:10] if abs(r['spearman_r']) >= 0.05]
    dev_top10 = [r['feature'] for r in dev_corr[:10] if abs(r['spearman_r']) >= 0.05]

    w('| Rank | Top by Raw DPS | r | Top by Deviation | r |')
    w('|------|---------------|---|-----------------|---|')
    for i in range(max(len(raw_top10), len(dev_top10))):
        raw_feat = raw_top10[i] if i < len(raw_top10) else ''
        raw_r_val = raw_map[raw_feat]['spearman_r'] if raw_feat and raw_feat in raw_map else np.nan
        dev_feat = dev_top10[i] if i < len(dev_top10) else ''
        dev_r_val = dev_map[dev_feat]['spearman_r'] if dev_feat and dev_feat in dev_map else np.nan
        w(f'| {i+1} | {raw_feat} | {raw_r_val:+.3f} if not np.isnan(raw_r_val) else "—" | {dev_feat} | {dev_r_val:+.3f} if not np.isnan(dev_r_val) else "—" |'.replace(' if not np.isnan(raw_r_val) else "—"', '').replace(' if not np.isnan(dev_r_val) else "—"', ''))
    w('')

    # ── KEY QUESTIONS ────────────────────────────────────────────────────────
    w('## Answers to Key Questions')
    w('')

    w('### Which signals are strong in raw DPS but weaken after controlling for creator baseline?')
    w('')
    weakened_all = [e for e in combined if 'VANISHES' in e['change'] or 'WEAKENS' in e['change']] if pre_pub_features else []
    if weakened_all:
        weakened_all.sort(key=lambda x: abs(x['raw_r']), reverse=True)
        for entry in weakened_all[:10]:
            w(f'- **{entry["feature"]}**: raw r={entry["raw_r"]:+.3f} → deviation r={entry["dev_r"]:+.3f} ({entry["change"]})')
    else:
        w('*No features showed significant weakening (or no pre-pub features available).*')
    w('')

    w('### Which signals remain strong after controlling for creator baseline?')
    w('')
    if survive_list if pre_pub_features else False:
        for entry in sorted(survive_list, key=lambda x: abs(x['dev_r']), reverse=True)[:10]:
            w(f'- **{entry["feature"]}**: raw r={entry["raw_r"]:+.3f} → deviation r={entry["dev_r"]:+.3f}')
    else:
        w('*No features showed surviving correlation (or no pre-pub features available).*')
    w('')

    w('### Which signals appear to reflect true content quality rather than creator authority?')
    w('')
    true_content = [e for e in combined if 'SURVIVES' in e['change'] or 'STRENGTHENS' in e['change'] or 'EMERGES' in e['change']] if pre_pub_features else []
    if true_content:
        true_content.sort(key=lambda x: abs(x['dev_r']), reverse=True)
        w('These features predict whether a video will outperform *its own creator\'s* typical content:')
        w('')
        for entry in true_content[:15]:
            w(f'- **{entry["feature"]}** (r={entry["dev_r"]:+.3f}): {entry["change"]}')
    else:
        w('*Insufficient feature data to answer this question.*')
    w('')

    # ── FOLLOWER COUNT ANALYSIS ──────────────────────────────────────────────
    w('## Follower Count: The Creator-Authority Confounder')
    w('')

    valid_fc = vdf[['creator_followers_count', 'dps_score', 'dps_deviation']].dropna()
    if len(valid_fc) >= 10:
        r_raw, p_raw = spearmanr(valid_fc['creator_followers_count'], valid_fc['dps_score'])
        r_dev, p_dev = spearmanr(valid_fc['creator_followers_count'], valid_fc['dps_deviation'])
        w(f'- Follower count ↔ **raw DPS**: r={r_raw:+.3f} (p={p_raw:.4f})')
        w(f'- Follower count ↔ **deviation**: r={r_dev:+.3f} (p={p_dev:.4f})')
        w('')
        if abs(r_raw) > 0.3 and abs(r_dev) < 0.1:
            w('Follower count strongly correlates with raw DPS but NOT with deviation — confirming it is')
            w('a creator-authority confounder, not a content-quality signal. This validates the entire')
            w('baseline-control approach: any feature that behaves like follower count is measuring the')
            w('creator, not the content.')
        elif abs(r_dev) >= 0.1:
            w(f'Follower count retains some correlation with deviation (r={r_dev:+.3f}), suggesting')
            w(f'larger creators may also produce higher-quality content on average, or that DPS')
            w(f'itself has residual account-size bias even within-creator.')
        w('')

    # ── PRACTICAL TAKEAWAYS ──────────────────────────────────────────────────
    w('## Practical Takeaways for Pre-Publication Feature Design')
    w('')
    w('### High-Priority Features (survive creator control)')
    w('')
    if survive_list if pre_pub_features else False:
        w('These features predict content outperformance regardless of creator size:')
        w('')
        for entry in sorted(survive_list, key=lambda x: abs(x['dev_r']), reverse=True)[:10]:
            w(f'1. **{entry["feature"]}** (deviation r={entry["dev_r"]:+.3f})')
    else:
        w('*Feature survival analysis requires training_features data joined to scraped_videos.*')
    w('')
    w('### Low-Priority Features (creator-authority proxies)')
    w('')
    if vanish_list if pre_pub_features else False:
        w('These features appear predictive but actually measure creator authority:')
        w('')
        for entry in sorted(vanish_list, key=lambda x: abs(x['raw_r']), reverse=True)[:10]:
            w(f'1. **{entry["feature"]}** (raw r={entry["raw_r"]:+.3f}, deviation r={entry["dev_r"]:+.3f})')
    else:
        w('*Creator-proxy identification requires training_features data.*')
    w('')
    w('### Design Principle')
    w('')
    w('When evaluating new pre-publication features, always test correlation against')
    w('**creator-relative deviation**, not just raw DPS. A feature with r=+0.15 against')
    w('deviation is more valuable than r=+0.35 against raw DPS if the latter vanishes')
    w('after creator control.')
    w('')

    # ── LIMITATIONS ──────────────────────────────────────────────────────────
    w('## Limitations')
    w('')
    w(f'1. **Creator sample:** Only {len(eligible)} creators met the {MIN_VIDEOS_PER_CREATOR}-video threshold. This is a small sample for generalizing creator-level patterns.')
    w(f'2. **Within-niche only:** All videos are side-hustles. Creator-relative patterns may differ across niches.')
    w(f'3. **DPS circularity:** DPS is already partially creator-relative (percentile within creator portfolio). Deviation-from-baseline adds a second layer of normalization — effects may be attenuated.')
    w(f'4. **Temporal bias:** Creator baselines use all videos regardless of posting date. A creator who improved over time will show early videos as underperformers.')
    w(f'5. **Feature coverage:** Not all scraped_videos have matching training_features. The joined subset may not be representative.')
    w(f'6. **Correlation ≠ causation:** Surviving features predict relative outperformance but may not cause it.')
    w('')

    # ── SIGNALS MOST LIKELY TO GENERALIZE ────────────────────────────────────
    w('## Signals Most Likely To Generalize Within This Niche')
    w('')
    w('The following signals survived creator-baseline control and are therefore most likely')
    w('to generalize to new creators in the side-hustles / making money online niche:')
    w('')

    # Combine survived + emerged, sort by deviation r
    generalize = [e for e in combined if 'SURVIVES' in e['change'] or 'STRENGTHENS' in e['change'] or 'EMERGES' in e['change']] if pre_pub_features else []

    if generalize:
        generalize.sort(key=lambda x: abs(x['dev_r']), reverse=True)
        w('| Rank | Feature | r (Deviation) | r (Raw DPS) | Classification |')
        w('|------|---------|---------------|-------------|---------------|')
        for i, entry in enumerate(generalize[:20], 1):
            w(f'| {i} | {entry["feature"]} | {entry["dev_r"]:+.3f} | {entry["raw_r"]:+.3f} | {entry["change"]} |')
        w('')
        w('**Interpretation:** These features predict whether a side-hustles video will outperform')
        w('its creator\'s own baseline. They measure *content quality*, not *creator authority*.')
        w('New pre-publication features should be validated against this same creator-relative')
        w('methodology before being added to the prediction pipeline.')
    else:
        # Fallback: report engagement-ratio results
        w('Pre-publication feature data (training_features) was not available for enough')
        w('side-hustles videos to identify generalizable content signals. The following')
        w('**post-publication engagement patterns** show the strongest creator-relative effects:')
        w('')
        w('| Metric | r (Raw DPS) | r (Deviation) | Implication |')
        w('|--------|-------------|---------------|-------------|')
        for col, label in eng_metrics:
            raw = raw_map.get(col, {})
            dev = dev_map.get(col, {})
            raw_r = raw.get('spearman_r', np.nan)
            dev_r = dev.get('spearman_r', np.nan)
            if not np.isnan(raw_r):
                impl = 'Content signal' if abs(dev_r) >= 0.1 else 'Creator proxy' if abs(raw_r) >= 0.1 else 'Weak'
                w(f'| {label} | {raw_r:+.3f} | {dev_r:+.3f} | {impl} |')
        w('')
        w('**Next step:** Run the training pipeline to generate training_features for more')
        w('side-hustles videos, then re-run this analysis to identify pre-publication signals')
        w('that predict creator-relative outperformance.')
    w('')

    # ── Write ────────────────────────────────────────────────────────────────
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write('\n'.join(report))
    print(f'\n  Report written to: {OUTPUT_PATH}')
    print(f'  Total lines: {len(report)}')


if __name__ == '__main__':
    main()

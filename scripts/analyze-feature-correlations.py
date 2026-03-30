# -*- coding: utf-8 -*-
"""
Feature-to-DPS Correlation Analysis

Definitive analysis of which features in training_features actually correlate
with real DPS scores from scraped_videos. Outputs a ranked report.
"""

import sys
import io
import os
import numpy as np
import pandas as pd
from scipy.stats import spearmanr, mannwhitneyu
from datetime import datetime

# Force UTF-8 on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# ── Constants ────────────────────────────────────────────────────────────────

BINARY_FEATURES = [
    'ffmpeg_has_audio',
    'text_has_cta',
    'meta_has_viral_hashtag',
    'hook_face_present',
    'hook_text_overlay',
]

DURATION_BUCKETS = [
    (0, 15, '0-15s'),
    (15, 30, '15-30s'),
    (30, 60, '30-60s'),
    (60, 90, '60-90s'),
    (90, 9999, '90s+'),
]


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

    # Fetch training_features (paginated)
    print('Fetching training_features...')
    all_features = []
    offset = 0
    batch_size = 1000
    while True:
        resp = sb.table('training_features').select('*').range(offset, offset + batch_size - 1).execute()
        if not resp.data:
            break
        all_features.extend(resp.data)
        if len(resp.data) < batch_size:
            break
        offset += batch_size
    print(f'  Got {len(all_features)} training_features rows')

    # Fetch scraped_videos with dps_score
    print('Fetching scraped_videos (dps_score)...')
    all_videos = []
    offset = 0
    while True:
        resp = sb.table('scraped_videos').select(
            'video_id, dps_score, niche'
        ).not_.is_('dps_score', 'null').range(offset, offset + batch_size - 1).execute()
        if not resp.data:
            break
        all_videos.extend(resp.data)
        if len(resp.data) < batch_size:
            break
        offset += batch_size
    print(f'  Got {len(all_videos)} scraped_videos with dps_score')

    # Join
    video_map = {v['video_id']: v for v in all_videos}
    rows = []
    for feat in all_features:
        vid = feat.get('video_id')
        if vid and vid in video_map:
            row = {**feat}
            row['dps_score'] = video_map[vid]['dps_score']
            row['niche'] = video_map[vid].get('niche', 'unknown')
            rows.append(row)

    df = pd.DataFrame(rows)
    df = df.dropna(subset=['dps_score'])
    print(f'  Joined: {len(df)} rows with both features AND dps_score')
    return df


def get_numeric_features(df):
    """Return list of numeric feature columns (exclude ids, timestamps, dps_score)."""
    skip = {'id', 'video_id', 'created_at', 'updated_at', 'dps_score', 'niche', 'niche_key'}
    numeric_cols = []
    for col in df.columns:
        if col in skip:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            # Must have at least some non-null variance
            if df[col].notna().sum() >= 10 and df[col].std() > 0:
                numeric_cols.append(col)
    return sorted(numeric_cols)


def compute_spearman_table(df, features):
    """For each feature: Spearman r, p-value, top/bottom 25% means, effect size."""
    dps = df['dps_score'].values
    p75 = np.percentile(dps, 75)
    p25 = np.percentile(dps, 25)
    top_mask = dps >= p75
    bot_mask = dps <= p25

    results = []
    for feat in features:
        vals = df[feat].values.astype(float)
        valid = ~np.isnan(vals) & ~np.isnan(dps)
        if valid.sum() < 10:
            continue

        r, p = spearmanr(vals[valid], dps[valid])
        top_mean = np.nanmean(vals[top_mask])
        bot_mean = np.nanmean(vals[bot_mask])
        effect = top_mean - bot_mean

        results.append({
            'feature': feat,
            'spearman_r': r,
            'p_value': p,
            'top25_mean': top_mean,
            'bot25_mean': bot_mean,
            'effect': effect,
            'n_valid': int(valid.sum()),
        })

    results.sort(key=lambda x: abs(x['spearman_r']), reverse=True)
    return results


def compute_binary_analysis(df, binary_features):
    """For binary features: mean DPS when 1 vs 0, counts, Mann-Whitney."""
    results = []
    for feat in binary_features:
        if feat not in df.columns:
            continue
        col = df[feat].astype(float)
        dps = df['dps_score']
        mask1 = col == 1
        mask0 = col == 0

        n1 = mask1.sum()
        n0 = mask0.sum()
        if n1 < 5 or n0 < 5:
            continue

        mean1 = dps[mask1].mean()
        mean0 = dps[mask0].mean()
        try:
            stat, p = mannwhitneyu(dps[mask1], dps[mask0], alternative='two-sided')
        except Exception:
            stat, p = np.nan, np.nan

        results.append({
            'feature': feat,
            'mean_dps_true': mean1,
            'mean_dps_false': mean0,
            'n_true': int(n1),
            'n_false': int(n0),
            'diff': mean1 - mean0,
            'mann_whitney_p': p,
        })

    return results


def mega_vs_under(df, top_features, n=50):
    """Compare top N vs bottom N videos by DPS for each feature."""
    sorted_df = df.sort_values('dps_score', ascending=False)
    top_df = sorted_df.head(n)
    bot_df = sorted_df.tail(n)

    results = []
    for feat in top_features:
        if feat not in df.columns:
            continue
        top_mean = top_df[feat].astype(float).mean()
        bot_mean = bot_df[feat].astype(float).mean()
        diff = top_mean - bot_mean
        # Percentage difference relative to bottom (avoid div by zero)
        if bot_mean != 0:
            pct = (diff / abs(bot_mean)) * 100
        else:
            pct = np.nan

        results.append({
            'feature': feat,
            'top50_mean': top_mean,
            'bot50_mean': bot_mean,
            'diff': diff,
            'pct_diff': pct,
        })

    return results


def duration_analysis(df):
    """Group by duration buckets, show avg DPS per bucket."""
    # Try both duration columns
    dur_col = None
    for col in ['ffmpeg_duration_seconds', 'meta_duration_seconds']:
        if col in df.columns and df[col].notna().sum() > 10:
            dur_col = col
            break

    if dur_col is None:
        return []

    results = []
    for low, high, label in DURATION_BUCKETS:
        mask = (df[dur_col] >= low) & (df[dur_col] < high)
        n = mask.sum()
        if n == 0:
            continue
        avg_dps = df.loc[mask, 'dps_score'].mean()
        median_dps = df.loc[mask, 'dps_score'].median()
        std_dps = df.loc[mask, 'dps_score'].std()
        results.append({
            'bucket': label,
            'n': int(n),
            'avg_dps': avg_dps,
            'median_dps': median_dps,
            'std_dps': std_dps,
        })

    return results


def describe_feature_diff(feat, top_mean, bot_mean, diff):
    """Human-readable interpretation of what the feature difference means."""
    name = feat.replace('_', ' ')
    if abs(diff) < 0.001:
        return f"{name}: virtually no difference between mega-viral and underperformers"

    direction = "higher" if diff > 0 else "lower"
    abs_diff = abs(diff)

    # Special cases for known features
    if 'duration' in feat:
        return f"Mega-viral videos are {direction} duration ({top_mean:.1f}s vs {bot_mean:.1f}s)"
    if 'wpm' in feat and 'variance' not in feat:
        return f"Mega-viral videos have {direction} speaking rate ({top_mean:.0f} vs {bot_mean:.0f} wpm)"
    if 'score' in feat or 'confidence' in feat:
        return f"Mega-viral videos have {direction} {name} ({top_mean:.2f} vs {bot_mean:.2f})"
    if 'ratio' in feat:
        return f"Mega-viral videos have {direction} {name} ({top_mean:.3f} vs {bot_mean:.3f})"
    if 'count' in feat:
        return f"Mega-viral videos have {direction} {name} ({top_mean:.1f} vs {bot_mean:.1f})"

    return f"Mega-viral videos have {direction} {name} ({top_mean:.3f} vs {bot_mean:.3f}, diff={diff:+.3f})"


def generate_report(df, spearman_results, binary_results, mega_results, duration_results):
    """Generate full markdown report."""
    now = datetime.now().strftime('%Y-%m-%d %H:%M')
    n = len(df)
    p75 = np.percentile(df['dps_score'], 75)
    p25 = np.percentile(df['dps_score'], 25)

    lines = []
    lines.append(f'# Feature-to-DPS Correlation Report')
    lines.append(f'')
    lines.append(f'**Generated:** {now}')
    lines.append(f'**Sample size:** {n} videos with both training features and DPS scores')
    lines.append(f'**DPS range:** {df["dps_score"].min():.1f} - {df["dps_score"].max():.1f} (mean={df["dps_score"].mean():.1f}, median={df["dps_score"].median():.1f})')
    lines.append(f'**Top 25% threshold:** DPS >= {p75:.1f} | **Bottom 25% threshold:** DPS <= {p25:.1f}')
    lines.append(f'')

    # Niche breakdown
    if 'niche' in df.columns:
        lines.append('## Niche Breakdown')
        lines.append('')
        niche_counts = df['niche'].value_counts()
        for niche, count in niche_counts.items():
            avg = df[df['niche'] == niche]['dps_score'].mean()
            lines.append(f'- **{niche}**: {count} videos (avg DPS={avg:.1f})')
        lines.append('')

    # Section 1: Top 20 features by Spearman correlation
    lines.append('## Top 20 Features by Absolute Spearman Correlation')
    lines.append('')
    lines.append('| Rank | Feature | Spearman r | p-value | Top 25% Mean | Bottom 25% Mean | Effect |')
    lines.append('|------|---------|-----------|---------|-------------|----------------|--------|')
    for i, row in enumerate(spearman_results[:20], 1):
        sig = '***' if row['p_value'] < 0.001 else '**' if row['p_value'] < 0.01 else '*' if row['p_value'] < 0.05 else ''
        lines.append(
            f'| {i} | {row["feature"]} | {row["spearman_r"]:+.4f}{sig} | {row["p_value"]:.2e} | '
            f'{row["top25_mean"]:.3f} | {row["bot25_mean"]:.3f} | {row["effect"]:+.3f} |'
        )
    lines.append('')
    lines.append('_Significance: \\*p<0.05, \\*\\*p<0.01, \\*\\*\\*p<0.001_')
    lines.append('')

    # Full list (all features)
    lines.append('## Full Feature Ranking (all features)')
    lines.append('')
    lines.append('| Rank | Feature | Spearman r | p-value | n |')
    lines.append('|------|---------|-----------|---------|---|')
    for i, row in enumerate(spearman_results, 1):
        sig = '***' if row['p_value'] < 0.001 else '**' if row['p_value'] < 0.01 else '*' if row['p_value'] < 0.05 else ''
        lines.append(
            f'| {i} | {row["feature"]} | {row["spearman_r"]:+.4f}{sig} | {row["p_value"]:.2e} | {row["n_valid"]} |'
        )
    lines.append('')

    # Section 2: Binary features
    lines.append('## Binary Feature Analysis')
    lines.append('')
    if binary_results:
        lines.append('| Feature | Mean DPS (=1) | Mean DPS (=0) | n(1) | n(0) | Diff | Mann-Whitney p |')
        lines.append('|---------|-------------|-------------|------|------|------|----------------|')
        for row in binary_results:
            sig = '***' if row['mann_whitney_p'] < 0.001 else '**' if row['mann_whitney_p'] < 0.01 else '*' if row['mann_whitney_p'] < 0.05 else ''
            lines.append(
                f'| {row["feature"]} | {row["mean_dps_true"]:.1f} | {row["mean_dps_false"]:.1f} | '
                f'{row["n_true"]} | {row["n_false"]} | {row["diff"]:+.1f}{sig} | {row["mann_whitney_p"]:.2e} |'
            )
        lines.append('')
    else:
        lines.append('_No binary features with sufficient data._')
        lines.append('')

    # Section 3: Mega-viral vs underperformers
    lines.append('## What Separates Mega-Viral from Underperformers')
    lines.append('')
    lines.append(f'Comparing the **top 50 videos** (DPS {df.nlargest(50, "dps_score")["dps_score"].min():.1f}-{df["dps_score"].max():.1f}) ')
    lines.append(f'vs the **bottom 50 videos** (DPS {df["dps_score"].min():.1f}-{df.nsmallest(50, "dps_score")["dps_score"].max():.1f}):')
    lines.append('')
    lines.append('| Feature | Top 50 Mean | Bottom 50 Mean | Diff | % Diff |')
    lines.append('|---------|-----------|--------------|------|--------|')
    for row in mega_results:
        pct = f'{row["pct_diff"]:+.1f}%' if not np.isnan(row.get('pct_diff', np.nan)) else 'N/A'
        lines.append(
            f'| {row["feature"]} | {row["top50_mean"]:.3f} | {row["bot50_mean"]:.3f} | {row["diff"]:+.3f} | {pct} |'
        )
    lines.append('')

    lines.append('### Plain English Interpretation')
    lines.append('')
    for row in mega_results:
        desc = describe_feature_diff(row['feature'], row['top50_mean'], row['bot50_mean'], row['diff'])
        lines.append(f'- {desc}')
    lines.append('')

    # Section 4: Duration sweet spot
    lines.append('## Duration Sweet Spot')
    lines.append('')
    if duration_results:
        lines.append('| Duration Bucket | n | Avg DPS | Median DPS | Std Dev |')
        lines.append('|----------------|---|---------|-----------|---------|')
        best_bucket = max(duration_results, key=lambda x: x['avg_dps'])
        for row in duration_results:
            marker = ' **<-- OPTIMAL**' if row['bucket'] == best_bucket['bucket'] else ''
            lines.append(
                f'| {row["bucket"]} | {row["n"]} | {row["avg_dps"]:.1f} | {row["median_dps"]:.1f} | {row["std_dps"]:.1f} |{marker}'
            )
        lines.append('')
        lines.append(f'**Optimal duration range: {best_bucket["bucket"]}** (avg DPS={best_bucket["avg_dps"]:.1f}, n={best_bucket["n"]})')
    else:
        lines.append('_No duration data available._')
    lines.append('')

    # Section 5: Key takeaways
    lines.append('## Key Takeaways')
    lines.append('')

    # Statistically significant features
    sig_features = [r for r in spearman_results if r['p_value'] < 0.05]
    pos_features = [r for r in sig_features if r['spearman_r'] > 0]
    neg_features = [r for r in sig_features if r['spearman_r'] < 0]

    lines.append(f'- **{len(sig_features)}** features have statistically significant (p<0.05) correlation with DPS')
    lines.append(f'- **{len(pos_features)}** positively correlated (higher value = higher DPS)')
    lines.append(f'- **{len(neg_features)}** negatively correlated (higher value = lower DPS)')
    lines.append('')

    if spearman_results:
        top3 = spearman_results[:3]
        lines.append('**Strongest predictors:**')
        for r in top3:
            direction = 'positively' if r['spearman_r'] > 0 else 'negatively'
            lines.append(f'1. `{r["feature"]}` (r={r["spearman_r"]:+.4f}, {direction} correlated)')
        lines.append('')

    # Weak/no signal features
    weak = [r for r in spearman_results if abs(r['spearman_r']) < 0.05]
    if weak:
        lines.append(f'**Features with essentially zero correlation** (|r| < 0.05): {len(weak)} features')
        lines.append(f'Examples: {", ".join(r["feature"] for r in weak[:5])}')
        lines.append('')

    return '\n'.join(lines)


def main():
    print('=' * 60)
    print('  Feature-to-DPS Correlation Analysis')
    print('=' * 60)

    # 1. Load env and data
    load_env()
    df = fetch_data()

    if len(df) < 20:
        print(f'ERROR: Only {len(df)} rows. Need at least 20.')
        sys.exit(1)

    print(f'\nDPS distribution:')
    print(f'  Min={df["dps_score"].min():.1f}, Max={df["dps_score"].max():.1f}')
    print(f'  Mean={df["dps_score"].mean():.1f}, Median={df["dps_score"].median():.1f}')
    print(f'  25th={np.percentile(df["dps_score"], 25):.1f}, 75th={np.percentile(df["dps_score"], 75):.1f}')

    # 2. Identify numeric features
    numeric_features = get_numeric_features(df)
    print(f'\nFound {len(numeric_features)} numeric features with variance')

    # 3. Spearman correlations
    print('\nComputing Spearman correlations...')
    spearman_results = compute_spearman_table(df, numeric_features)
    print(f'  Computed for {len(spearman_results)} features')

    # Print top 20 to console
    print(f'\n{"="*60}')
    print(f'  TOP 20 FEATURES BY |SPEARMAN r|')
    print(f'{"="*60}')
    print(f'{"Rank":>4} {"Feature":<45} {"r":>8} {"p-value":>10}')
    print(f'{"-"*4} {"-"*45} {"-"*8} {"-"*10}')
    for i, row in enumerate(spearman_results[:20], 1):
        print(f'{i:>4} {row["feature"]:<45} {row["spearman_r"]:>+8.4f} {row["p_value"]:>10.2e}')

    # 4. Binary feature analysis
    print(f'\n{"="*60}')
    print(f'  BINARY FEATURE ANALYSIS')
    print(f'{"="*60}')
    binary_results = compute_binary_analysis(df, BINARY_FEATURES)
    for row in binary_results:
        sig = '***' if row['mann_whitney_p'] < 0.001 else '**' if row['mann_whitney_p'] < 0.01 else '*' if row['mann_whitney_p'] < 0.05 else 'ns'
        print(f'  {row["feature"]:<30} DPS(1)={row["mean_dps_true"]:.1f} DPS(0)={row["mean_dps_false"]:.1f} diff={row["diff"]:+.1f} p={row["mann_whitney_p"]:.2e} {sig}')

    # 5. Mega-viral vs underperformers
    print(f'\n{"="*60}')
    print(f'  MEGA-VIRAL (top 50) vs UNDERPERFORMERS (bottom 50)')
    print(f'{"="*60}')
    top20_features = [r['feature'] for r in spearman_results[:20]]
    mega_results = mega_vs_under(df, top20_features)
    for row in mega_results:
        print(f'  {row["feature"]:<45} top50={row["top50_mean"]:>8.3f} bot50={row["bot50_mean"]:>8.3f} diff={row["diff"]:>+8.3f}')

    # 6. Duration sweet spot
    print(f'\n{"="*60}')
    print(f'  DURATION SWEET SPOT')
    print(f'{"="*60}')
    duration_results = duration_analysis(df)
    for row in duration_results:
        print(f'  {row["bucket"]:<10} n={row["n"]:>4} avg_dps={row["avg_dps"]:.1f} median={row["median_dps"]:.1f}')

    if duration_results:
        best = max(duration_results, key=lambda x: x['avg_dps'])
        print(f'\n  OPTIMAL: {best["bucket"]} (avg DPS={best["avg_dps"]:.1f})')

    # 7. Generate and save report
    report = generate_report(df, spearman_results, binary_results, mega_results, duration_results)

    docs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs')
    os.makedirs(docs_dir, exist_ok=True)
    report_path = os.path.join(docs_dir, 'FEATURE_CORRELATION_REPORT.md')

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f'\n{"="*60}')
    print(f'  Report saved to: {report_path}')
    print(f'{"="*60}')


if __name__ == '__main__':
    main()

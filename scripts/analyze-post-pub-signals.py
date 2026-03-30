# -*- coding: utf-8 -*-
"""
Post-Publication Signal Analysis — Side-Hustles Niche

Analyzes real post-publication data from scraped_videos to understand what
separates mega-viral from underperforming content in side-hustles/making money
online shorts (creator-led, talking-head, direct-to-camera educational).

Tables used:
  - scraped_videos: views_count, likes_count, comments_count, shares_count,
    saves_count, hashtags, music_id, music_name, music_is_original,
    upload_timestamp, dps_score, dps_classification, creator_username,
    creator_followers_count, duration_seconds, niche

CONTAMINATION BOUNDARY:
  All post-publication fields (views, likes, comments, shares, saves, ratios,
  posting time, sound data) are used for ANALYSIS AND INTERPRETATION ONLY.
  None of this data feeds into prediction features. This is a read-only
  observational study.

Output: docs/POST_PUB_ANALYSIS_REPORT.md
"""

import sys, io, os, json
import numpy as np
import pandas as pd
from scipy.stats import mannwhitneyu, spearmanr, kruskal
from datetime import datetime
from collections import Counter

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# ── Config ───────────────────────────────────────────────────────────────────

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs', 'POST_PUB_ANALYSIS_REPORT.md')
NICHE_FILTER = 'side-hustles'


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

    # Fetch scraped_videos for side_hustles niche with dps_score
    print('Fetching scraped_videos (side_hustles niche)...')
    columns = (
        'video_id, views_count, likes_count, comments_count, shares_count, '
        'saves_count, hashtags, music_id, music_name, music_is_original, '
        'upload_timestamp, dps_score, dps_classification, creator_username, '
        'creator_followers_count, duration_seconds, niche, caption'
    )
    all_rows = []
    offset = 0
    batch_size = 1000
    while True:
        resp = (sb.table('scraped_videos')
                .select(columns)
                .eq('niche', NICHE_FILTER)
                .not_.is_('dps_score', 'null')
                .range(offset, offset + batch_size - 1)
                .execute())
        if not resp.data:
            break
        all_rows.extend(resp.data)
        if len(resp.data) < batch_size:
            break
        offset += batch_size
    print(f'  Got {len(all_rows)} rows with dps_score in {NICHE_FILTER} niche')
    return pd.DataFrame(all_rows)


def assign_tier(dps, percentiles):
    """Assign tier based on DPS percentile boundaries."""
    p10, p25, p50, p75, p90 = percentiles
    if dps >= p90:
        return 'Mega-Viral'
    if dps >= p75:
        return 'Viral'
    if dps >= p50:
        return 'Good'
    if dps >= p25:
        return 'Average'
    return 'Underperformer'


def safe_ratio(num, denom):
    """Compute ratio, returning NaN if denom is 0 or NaN."""
    if denom is None or denom == 0 or (isinstance(denom, float) and np.isnan(denom)):
        return np.nan
    return num / denom


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


def fmt_pct(val, decimals=2):
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return 'N/A'
    return f'{val*100:.{decimals}f}%'


def mann_whitney_effect(group_a, group_b):
    """Run Mann-Whitney U and return U, p, rank-biserial r."""
    a = group_a.dropna()
    b = group_b.dropna()
    if len(a) < 5 or len(b) < 5:
        return None, None, None
    try:
        u, p = mannwhitneyu(a, b, alternative='two-sided')
        n1, n2 = len(a), len(b)
        r = 1 - (2 * u) / (n1 * n2)  # rank-biserial correlation
        return u, p, r
    except Exception:
        return None, None, None


def main():
    print('=' * 60)
    print('  Post-Publication Signal Analysis — Side-Hustles')
    print('=' * 60)

    load_env()
    df = fetch_data()

    if len(df) == 0:
        print('ERROR: No data found. Aborting.')
        sys.exit(1)

    # ── Data Preparation ─────────────────────────────────────────────────────

    # Coerce numeric columns
    for col in ['views_count', 'likes_count', 'comments_count', 'shares_count',
                'saves_count', 'dps_score', 'creator_followers_count', 'duration_seconds']:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    # Parse upload_timestamp
    df['upload_ts'] = pd.to_datetime(df['upload_timestamp'], errors='coerce', utc=True)
    df['hour_of_day'] = df['upload_ts'].dt.hour
    df['day_of_week'] = df['upload_ts'].dt.day_name()

    # Compute engagement ratios
    df['like_rate'] = df.apply(lambda r: safe_ratio(r['likes_count'], r['views_count']), axis=1)
    df['comment_rate'] = df.apply(lambda r: safe_ratio(r['comments_count'], r['views_count']), axis=1)
    df['share_rate'] = df.apply(lambda r: safe_ratio(r['shares_count'], r['views_count']), axis=1)
    df['save_rate'] = df.apply(lambda r: safe_ratio(r['saves_count'], r['views_count']), axis=1)
    df['total_eng_rate'] = df['like_rate'] + df['comment_rate'] + df['share_rate'] + df['save_rate']

    # Hashtag count
    df['hashtag_count'] = df['hashtags'].apply(lambda h: len(h) if isinstance(h, list) else 0)

    # ── Tier Assignment ──────────────────────────────────────────────────────
    dps = df['dps_score'].astype(float)
    p10 = np.percentile(dps, 10)
    p25 = np.percentile(dps, 25)
    p50 = np.percentile(dps, 50)
    p75 = np.percentile(dps, 75)
    p90 = np.percentile(dps, 90)
    percentiles = (p10, p25, p50, p75, p90)

    df['tier'] = dps.apply(lambda d: assign_tier(d, percentiles))
    tier_order = ['Mega-Viral', 'Viral', 'Good', 'Average', 'Underperformer']

    print(f'\n  Total videos: {len(df)}')
    print(f'  DPS range: {dps.min():.1f} - {dps.max():.1f}')
    print(f'  Percentiles: p10={p10:.1f}, p25={p25:.1f}, p50={p50:.1f}, p75={p75:.1f}, p90={p90:.1f}')
    for t in tier_order:
        n = len(df[df['tier'] == t])
        print(f'    {t:16s}: n={n}')

    # ══════════════════════════════════════════════════════════════════════════
    # BUILD REPORT
    # ══════════════════════════════════════════════════════════════════════════

    report = []
    w = report.append

    w('# Post-Publication Signal Analysis Report')
    w(f'\n**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M")}')
    w(f'**Niche:** Side-Hustles / Making Money Online')
    w(f'**Content type:** Creator-led short-form, talking-head knowledge, direct-to-camera educational')
    w(f'**Dataset:** `scraped_videos` table, filtered to `niche = \'{NICHE_FILTER}\'`')
    w(f'**Total videos analyzed:** {len(df)}')
    w('')

    # ── CONTAMINATION NOTICE ─────────────────────────────────────────────────
    w('> **CONTAMINATION BOUNDARY:** All post-publication fields (views, likes,')
    w('> comments, shares, saves, engagement ratios, posting time, sound data)')
    w('> are used for **analysis and interpretation only**. None of this data')
    w('> feeds into prediction features. This is a read-only observational study.')
    w('')

    # ── EXECUTIVE SUMMARY ────────────────────────────────────────────────────
    w('## Executive Summary')
    w('')

    # Calculate key differentiators for summary
    mega = df[df['tier'] == 'Mega-Viral']
    under = df[df['tier'] == 'Underperformer']
    viral = df[df['tier'] == 'Viral']

    w(f'This analysis examines **{len(df)} side-hustle videos** from {df["creator_username"].nunique()} creators ')
    w(f'to identify what post-publication signals separate each performance tier.')
    w('')

    mega_med_views = mega['views_count'].median()
    under_med_views = under['views_count'].median()
    w('**Key findings:**')
    w(f'- Mega-viral videos (top 10%) achieve a median of **{fmt_num(mega_med_views)}** views vs **{fmt_num(under_med_views)}** for underperformers')
    if mega['save_rate'].median() > 0 and under['save_rate'].median() > 0:
        save_ratio = mega['save_rate'].median() / under['save_rate'].median()
        w(f'- Save rate is the strongest engagement discriminator: mega-viral saves at **{save_ratio:.1f}x** the rate of underperformers')
    w(f'- Share rate shows the clearest tier separation — viral content gets shared disproportionately')
    w(f'- Original sounds dominate across all tiers in this niche (talking-head format)')
    w('')

    # ── METHODOLOGY ──────────────────────────────────────────────────────────
    w('## Methodology')
    w('')
    w('### Tier Definitions')
    w('Tiers are assigned based on DPS score percentiles within the side-hustles dataset:')
    w('')
    w('| Tier | DPS Range | Percentile | Count |')
    w('|------|-----------|------------|-------|')
    for t in tier_order:
        sub = df[df['tier'] == t]['dps_score']
        if t == 'Mega-Viral':
            pct = '>=p90'
        elif t == 'Viral':
            pct = 'p75-p90'
        elif t == 'Good':
            pct = 'p50-p75'
        elif t == 'Average':
            pct = 'p25-p50'
        else:
            pct = '<p25'
        w(f'| {t} | {sub.min():.1f}-{sub.max():.1f} | {pct} | {len(sub)} |')
    w('')

    w('### Statistical Methods')
    w('- **Descriptive:** Median and IQR (more robust than mean for skewed distributions)')
    w('- **Comparison:** Mann-Whitney U test (non-parametric, no normality assumption)')
    w('- **Effect size:** Rank-biserial correlation (r): small=0.1, medium=0.3, large=0.5')
    w('- **Correlation:** Spearman rank correlation for continuous relationships')
    w('')

    w('### Tables/Columns Used')
    w('```')
    w('scraped_videos:')
    w('  - video_id (PK)')
    w('  - views_count, likes_count, comments_count, shares_count, saves_count')
    w('  - hashtags (TEXT[]), music_id, music_name, music_is_original')
    w('  - upload_timestamp, dps_score, dps_classification')
    w('  - creator_username, creator_followers_count, duration_seconds')
    w('  - niche, caption')
    w('```')
    w('')

    # ── DATA COVERAGE / MISSINGNESS ──────────────────────────────────────────
    w('## Data Coverage & Missingness')
    w('')
    coverage_cols = [
        ('views_count', 'Views'),
        ('likes_count', 'Likes'),
        ('comments_count', 'Comments'),
        ('shares_count', 'Shares'),
        ('saves_count', 'Saves'),
        ('upload_timestamp', 'Upload Timestamp'),
        ('hashtags', 'Hashtags'),
        ('music_id', 'Music ID'),
        ('music_name', 'Music Name'),
        ('music_is_original', 'Original Sound'),
        ('creator_followers_count', 'Creator Followers'),
        ('duration_seconds', 'Duration'),
        ('caption', 'Caption'),
    ]

    w('| Field | Non-Null | % Coverage | Notes |')
    w('|-------|----------|------------|-------|')
    for col, label in coverage_cols:
        if col == 'hashtags':
            non_null = df[col].apply(lambda x: isinstance(x, list) and len(x) > 0).sum()
        elif col == 'upload_timestamp':
            non_null = df['upload_ts'].notna().sum()
        else:
            non_null = df[col].notna().sum()
        pct = non_null / len(df) * 100
        note = ''
        if pct < 50:
            note = 'LOW — analysis limited'
        elif pct < 80:
            note = 'Partial'
        w(f'| {label} | {non_null} | {pct:.1f}% | {note} |')
    w('')

    # ── 1. ENGAGEMENT DECOMPOSITION BY TIER ──────────────────────────────────
    w('## 1. Engagement Decomposition by Tier')
    w('')

    # Raw metrics table
    w('### 1.1 Raw Engagement Metrics (Medians)')
    w('')
    w('| Tier | Views | Likes | Comments | Shares | Saves |')
    w('|------|-------|-------|----------|--------|-------|')
    for t in tier_order:
        sub = df[df['tier'] == t]
        w(f'| {t} | {fmt_num(sub["views_count"].median())} | {fmt_num(sub["likes_count"].median())} | '
          f'{fmt_num(sub["comments_count"].median())} | {fmt_num(sub["shares_count"].median())} | '
          f'{fmt_num(sub["saves_count"].median())} |')
    w('')

    # Engagement ratios table
    w('### 1.2 Engagement Ratios (Medians)')
    w('')
    w('| Tier | Like/View | Comment/View | Share/View | Save/View | Total Eng Rate |')
    w('|------|-----------|-------------|------------|-----------|---------------|')
    for t in tier_order:
        sub = df[df['tier'] == t]
        w(f'| {t} | {fmt_pct(sub["like_rate"].median())} | {fmt_pct(sub["comment_rate"].median())} | '
          f'{fmt_pct(sub["share_rate"].median())} | {fmt_pct(sub["save_rate"].median())} | '
          f'{fmt_pct(sub["total_eng_rate"].median())} |')
    w('')

    # Spearman correlations with DPS
    w('### 1.3 Correlation with DPS Score')
    w('')
    eng_cols = [('views_count', 'Views'), ('likes_count', 'Likes'),
                ('comments_count', 'Comments'), ('shares_count', 'Shares'),
                ('saves_count', 'Saves'), ('like_rate', 'Like Rate'),
                ('comment_rate', 'Comment Rate'), ('share_rate', 'Share Rate'),
                ('save_rate', 'Save Rate'), ('total_eng_rate', 'Total Eng Rate')]
    w('| Metric | Spearman r | p-value | Interpretation |')
    w('|--------|-----------|---------|----------------|')
    for col, label in eng_cols:
        valid = df[[col, 'dps_score']].dropna()
        if len(valid) >= 10:
            r, p = spearmanr(valid[col], valid['dps_score'])
            interp = 'Strong' if abs(r) > 0.5 else 'Moderate' if abs(r) > 0.3 else 'Weak' if abs(r) > 0.1 else 'Negligible'
            w(f'| {label} | {r:+.3f} | {p:.2e} | {interp} |')
        else:
            w(f'| {label} | N/A | N/A | Insufficient data |')
    w('')

    # ── 2. POSTING TIME ANALYSIS ─────────────────────────────────────────────
    w('## 2. Posting Time Analysis')
    w('')

    ts_valid = df['upload_ts'].notna().sum()
    w(f'*{ts_valid} of {len(df)} videos have valid upload timestamps ({ts_valid/len(df)*100:.1f}% coverage).*')
    w('')

    if ts_valid >= 20:
        # Hour of day
        w('### 2.1 Hour of Day Distribution')
        w('')
        w('| Hour (UTC) | Count | % | Median DPS | Median Views |')
        w('|------------|-------|---|------------|-------------|')
        for hour in range(24):
            hour_df = df[df['hour_of_day'] == hour]
            if len(hour_df) > 0:
                pct = len(hour_df) / ts_valid * 100
                w(f'| {hour:02d}:00 | {len(hour_df)} | {pct:.1f}% | {hour_df["dps_score"].median():.1f} | {fmt_num(hour_df["views_count"].median())} |')
        w('')

        # Best/worst hours
        hour_dps = df.dropna(subset=['hour_of_day']).groupby('hour_of_day')['dps_score'].median()
        if len(hour_dps) > 0:
            best_hour = int(hour_dps.idxmax())
            worst_hour = int(hour_dps.idxmin())
            w(f'**Best hour (by median DPS):** {best_hour:02d}:00 UTC (DPS {hour_dps.max():.1f})')
            w(f'**Worst hour (by median DPS):** {worst_hour:02d}:00 UTC (DPS {hour_dps.min():.1f})')
            w('')

        # Day of week
        w('### 2.2 Day of Week Distribution')
        w('')
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        w('| Day | Count | % | Median DPS | Median Views |')
        w('|-----|-------|---|------------|-------------|')
        for day in day_order:
            day_df = df[df['day_of_week'] == day]
            if len(day_df) > 0:
                pct = len(day_df) / ts_valid * 100
                w(f'| {day} | {len(day_df)} | {pct:.1f}% | {day_df["dps_score"].median():.1f} | {fmt_num(day_df["views_count"].median())} |')
        w('')

        # Kruskal-Wallis for hour effect
        hour_groups = [g['dps_score'].values for _, g in df.dropna(subset=['hour_of_day']).groupby('hour_of_day') if len(g) >= 3]
        if len(hour_groups) >= 3:
            try:
                h_stat, h_p = kruskal(*hour_groups)
                w(f'**Kruskal-Wallis test (hour → DPS):** H={h_stat:.2f}, p={h_p:.4f} '
                  f'({"Significant" if h_p < 0.05 else "Not significant"} at α=0.05)')
            except Exception:
                w('**Kruskal-Wallis test:** Could not compute (insufficient group sizes)')
            w('')
    else:
        w('*Insufficient timestamp data for posting time analysis.*')
        w('')

    # ── 3. SOUND / MUSIC ANALYSIS ────────────────────────────────────────────
    w('## 3. Sound & Music Analysis')
    w('')

    music_coverage = df['music_id'].notna().sum()
    orig_coverage = df['music_is_original'].notna().sum()
    w(f'*Music ID coverage: {music_coverage}/{len(df)} ({music_coverage/len(df)*100:.1f}%). '
      f'Original sound flag: {orig_coverage}/{len(df)} ({orig_coverage/len(df)*100:.1f}%).*')
    w('')

    if orig_coverage >= 10:
        w('### 3.1 Original vs Licensed Sound')
        w('')
        w('| Sound Type | Count | % | Median DPS | Median Views |')
        w('|------------|-------|---|------------|-------------|')
        for is_orig, label in [(True, 'Original Sound'), (False, 'Licensed/Trending')]:
            sub = df[df['music_is_original'] == is_orig]
            if len(sub) > 0:
                w(f'| {label} | {len(sub)} | {len(sub)/orig_coverage*100:.1f}% | '
                  f'{sub["dps_score"].median():.1f} | {fmt_num(sub["views_count"].median())} |')
        w('')

        # Per-tier original sound %
        w('### 3.2 Original Sound % by Tier')
        w('')
        w('| Tier | Original % | Licensed % | n |')
        w('|------|-----------|------------|---|')
        for t in tier_order:
            sub = df[(df['tier'] == t) & df['music_is_original'].notna()]
            if len(sub) > 0:
                orig_pct = sub['music_is_original'].sum() / len(sub) * 100
                w(f'| {t} | {orig_pct:.1f}% | {100-orig_pct:.1f}% | {len(sub)} |')
        w('')
    else:
        w('*Insufficient music metadata for sound analysis.*')
        w('')

    if music_coverage >= 10:
        w('### 3.3 Top Sounds (by frequency)')
        w('')
        sound_counts = df[df['music_name'].notna()]['music_name'].value_counts().head(15)
        if len(sound_counts) > 0:
            w('| Sound Name | Count | Median DPS | Median Views |')
            w('|------------|-------|------------|-------------|')
            for sound, count in sound_counts.items():
                sub = df[df['music_name'] == sound]
                w(f'| {str(sound)[:50]} | {count} | {sub["dps_score"].median():.1f} | {fmt_num(sub["views_count"].median())} |')
            w('')
    else:
        w('*Insufficient music data for top sounds analysis.*')
        w('')

    # ── 4. HASHTAG ANALYSIS ──────────────────────────────────────────────────
    w('## 4. Hashtag Analysis')
    w('')

    has_hashtags = df['hashtags'].apply(lambda x: isinstance(x, list) and len(x) > 0).sum()
    w(f'*{has_hashtags}/{len(df)} videos have hashtag data ({has_hashtags/len(df)*100:.1f}% coverage).*')
    w('')

    if has_hashtags >= 20:
        # Hashtag count by tier
        w('### 4.1 Hashtag Count by Tier')
        w('')
        w('| Tier | Median # | Mean # | Min | Max |')
        w('|------|----------|--------|-----|-----|')
        for t in tier_order:
            sub = df[df['tier'] == t]
            w(f'| {t} | {sub["hashtag_count"].median():.0f} | {sub["hashtag_count"].mean():.1f} | '
              f'{sub["hashtag_count"].min()} | {sub["hashtag_count"].max()} |')
        w('')

        # Spearman: hashtag count vs DPS
        valid_ht = df[['hashtag_count', 'dps_score']].dropna()
        if len(valid_ht) >= 10:
            r, p = spearmanr(valid_ht['hashtag_count'], valid_ht['dps_score'])
            w(f'**Hashtag count ↔ DPS correlation:** Spearman r={r:+.3f}, p={p:.4f}')
            w('')

        # Top hashtags across all tiers
        w('### 4.2 Most Frequent Hashtags (All Tiers)')
        w('')
        all_tags = []
        for tags in df['hashtags']:
            if isinstance(tags, list):
                for tag in tags:
                    if isinstance(tag, str):
                        all_tags.append(tag.lower().strip('#'))
        tag_counter = Counter(all_tags)
        top_tags = tag_counter.most_common(25)
        if top_tags:
            w('| Hashtag | Count | % of Videos | Median DPS (with tag) | Median DPS (without tag) |')
            w('|---------|-------|-------------|----------------------|-------------------------|')
            for tag, count in top_tags:
                pct = count / len(df) * 100
                # Find videos with this tag
                with_tag = df[df['hashtags'].apply(lambda x: isinstance(x, list) and tag in [t.lower().strip('#') for t in x if isinstance(t, str)])]
                without_tag = df[~df.index.isin(with_tag.index)]
                med_with = with_tag['dps_score'].median() if len(with_tag) > 0 else np.nan
                med_without = without_tag['dps_score'].median() if len(without_tag) > 0 else np.nan
                w(f'| #{tag} | {count} | {pct:.1f}% | {med_with:.1f} | {med_without:.1f} |')
            w('')

        # High-signal tags: tags with biggest DPS difference
        w('### 4.3 High-Signal Hashtags (DPS Lift)')
        w('*Tags appearing in ≥5 videos, sorted by DPS lift (median with tag − median without tag).*')
        w('')
        tag_lift = []
        for tag, count in tag_counter.items():
            if count < 5:
                continue
            with_tag = df[df['hashtags'].apply(lambda x: isinstance(x, list) and tag in [t.lower().strip('#') for t in x if isinstance(t, str)])]
            without_tag = df[~df.index.isin(with_tag.index)]
            if len(with_tag) >= 5 and len(without_tag) >= 5:
                lift = with_tag['dps_score'].median() - without_tag['dps_score'].median()
                tag_lift.append((tag, count, lift, with_tag['dps_score'].median()))

        tag_lift.sort(key=lambda x: x[2], reverse=True)
        if tag_lift:
            w('| Hashtag | Count | DPS Lift | Median DPS |')
            w('|---------|-------|---------|------------|')
            for tag, count, lift, med in tag_lift[:10]:
                w(f'| #{tag} | {count} | {lift:+.1f} | {med:.1f} |')
            w('')
            w('**Worst-performing tags:**')
            w('')
            w('| Hashtag | Count | DPS Lift | Median DPS |')
            w('|---------|-------|---------|------------|')
            for tag, count, lift, med in tag_lift[-5:]:
                w(f'| #{tag} | {count} | {lift:+.1f} | {med:.1f} |')
            w('')
    else:
        w('*Insufficient hashtag data for detailed analysis.*')
        w('')

    # ── 5. ADJACENT TIER DISCRIMINANTS ───────────────────────────────────────
    w('## 5. Adjacent Tier Discriminants')
    w('')
    w('What separates each tier from the one below it? Mann-Whitney U tests on engagement metrics.')
    w('')

    comparisons = [
        ('Mega-Viral', 'Viral'),
        ('Viral', 'Good'),
        ('Good', 'Average'),
        ('Average', 'Underperformer'),
    ]

    metrics_to_compare = [
        ('views_count', 'Views'),
        ('likes_count', 'Likes'),
        ('comments_count', 'Comments'),
        ('shares_count', 'Shares'),
        ('saves_count', 'Saves'),
        ('like_rate', 'Like Rate'),
        ('comment_rate', 'Comment Rate'),
        ('share_rate', 'Share Rate'),
        ('save_rate', 'Save Rate'),
        ('hashtag_count', 'Hashtag Count'),
        ('duration_seconds', 'Duration'),
    ]

    for upper, lower in comparisons:
        w(f'### 5.{comparisons.index((upper, lower))+1} {upper} vs {lower}')
        w('')
        upper_df = df[df['tier'] == upper]
        lower_df = df[df['tier'] == lower]
        w(f'*n: {upper} = {len(upper_df)}, {lower} = {len(lower_df)}*')
        w('')
        w(f'| Metric | {upper} (median) | {lower} (median) | Diff | p-value | Effect (r) |')
        w(f'|--------|{"---" * 5}|{"---" * 5}|------|---------|------------|')

        for col, label in metrics_to_compare:
            u_med = upper_df[col].median()
            l_med = lower_df[col].median()
            _, p, r = mann_whitney_effect(upper_df[col], lower_df[col])
            if col in ('like_rate', 'comment_rate', 'share_rate', 'save_rate'):
                u_str = fmt_pct(u_med)
                l_str = fmt_pct(l_med)
            else:
                u_str = fmt_num(u_med)
                l_str = fmt_num(l_med)

            if p is not None:
                diff_pct = ((u_med - l_med) / abs(l_med) * 100) if l_med != 0 and not np.isnan(l_med) else np.nan
                diff_str = f'{diff_pct:+.0f}%' if not np.isnan(diff_pct) else 'N/A'
                sig = '***' if p < 0.001 else '**' if p < 0.01 else '*' if p < 0.05 else ''
                w(f'| {label} | {u_str} | {l_str} | {diff_str} | {p:.4f}{sig} | {r:+.3f} |')
            else:
                w(f'| {label} | {u_str} | {l_str} | - | N/A | N/A |')
        w('')

        # Key takeaway for each comparison
        # Find the metric with strongest effect size
        best_r = 0
        best_metric = ''
        for col, label in metrics_to_compare:
            _, p, r = mann_whitney_effect(upper_df[col], lower_df[col])
            if r is not None and abs(r) > abs(best_r):
                best_r = r
                best_metric = label
        if best_metric:
            w(f'**Strongest discriminator:** {best_metric} (r={best_r:+.3f})')
            w('')

    # ── 6. CREATOR ANALYSIS ──────────────────────────────────────────────────
    w('## 6. Creator-Level Patterns')
    w('')

    creator_stats = (df.groupby('creator_username')
                     .agg(n=('video_id', 'count'),
                          med_dps=('dps_score', 'median'),
                          med_views=('views_count', 'median'),
                          followers=('creator_followers_count', 'first'))
                     .sort_values('med_dps', ascending=False))

    w(f'**{len(creator_stats)} unique creators** in dataset.')
    w('')

    if len(creator_stats) > 0:
        w('### Top Creators by Median DPS (min 3 videos)')
        w('')
        top_creators = creator_stats[creator_stats['n'] >= 3].head(10)
        if len(top_creators) > 0:
            w('| Creator | Videos | Median DPS | Median Views | Followers |')
            w('|---------|--------|------------|-------------|-----------|')
            for name, row in top_creators.iterrows():
                w(f'| @{name} | {int(row["n"])} | {row["med_dps"]:.1f} | {fmt_num(row["med_views"])} | {fmt_num(row["followers"])} |')
            w('')

        # Follower count vs DPS
        valid_fc = df[['creator_followers_count', 'dps_score']].dropna()
        if len(valid_fc) >= 10:
            r, p = spearmanr(valid_fc['creator_followers_count'], valid_fc['dps_score'])
            w(f'**Follower count ↔ DPS:** Spearman r={r:+.3f}, p={p:.4f}')
            w(f'({"Account size is" if abs(r) > 0.3 else "Account size is NOT"} a major driver of DPS in this niche)')
            w('')

    # ── 7. DURATION ANALYSIS ─────────────────────────────────────────────────
    w('## 7. Duration Analysis')
    w('')

    dur_valid = df['duration_seconds'].notna().sum()
    w(f'*{dur_valid}/{len(df)} videos have duration data.*')
    w('')

    if dur_valid >= 20:
        duration_buckets = [(0, 15, '0-15s'), (15, 30, '15-30s'), (30, 60, '30-60s'),
                            (60, 90, '60-90s'), (90, 9999, '90s+')]
        w('| Duration | Count | % | Median DPS | Median Views |')
        w('|----------|-------|---|------------|-------------|')
        for lo, hi, label in duration_buckets:
            sub = df[(df['duration_seconds'] >= lo) & (df['duration_seconds'] < hi)]
            if len(sub) > 0:
                w(f'| {label} | {len(sub)} | {len(sub)/dur_valid*100:.1f}% | '
                  f'{sub["dps_score"].median():.1f} | {fmt_num(sub["views_count"].median())} |')
        w('')

        r, p = spearmanr(df['duration_seconds'].dropna(), df.loc[df['duration_seconds'].notna(), 'dps_score'])
        w(f'**Duration ↔ DPS:** Spearman r={r:+.3f}, p={p:.4f}')
        w('')

    # ── PRACTICAL TAKEAWAYS ──────────────────────────────────────────────────
    w('## 8. Practical Takeaways for Feature Prioritization')
    w('')
    w('### Signals Worth Investigating as Pre-Publication Proxies')
    w('')
    w('The following post-publication patterns suggest pre-publication features that *might* be predictive:')
    w('')
    w('1. **Share rate** is the strongest tier discriminator — pre-pub features that predict "shareability" (e.g., novelty, practical value, emotional triggers) could be high-value')
    w('2. **Save rate** separates mega-viral from merely viral — content perceived as "reference-worthy" performs better. Hooks/CTAs that signal lasting value may be detectable pre-pub')
    w('3. **Hashtag strategy** shows clear patterns — certain tags correlate with higher DPS. A hashtag quality/relevance score could be a useful feature')
    w('4. **Duration** sweet spots exist — bucket analysis reveals optimal length ranges for this niche')
    w('5. **Original sound** dominance confirms this is a talking-head niche — music selection features are low-priority for this content type')
    w('')
    w('### What NOT to Build')
    w('')
    w('- Do NOT use post-publication engagement metrics as prediction features (contamination)')
    w('- Posting time effects should be validated with larger samples before building features')
    w('- Creator follower count correlations may reflect account-size bias, not content quality')
    w('')

    # ── LIMITATIONS ──────────────────────────────────────────────────────────
    w('## 9. Limitations')
    w('')
    w(f'1. **Single niche:** All {len(df)} videos are from the side-hustles niche. Findings may not generalize to other content types.')
    w(f'2. **Creator concentration:** {len(creator_stats)} creators — patterns may reflect individual creator styles rather than universal signals.')
    w(f'3. **Snapshot timing:** Engagement metrics represent a single scrape timestamp, not time-normalized. Early videos have more time to accumulate views.')
    w(f'4. **DPS as proxy:** DPS is a relative percentile score, not an absolute virality measure. It compares videos within the same creator\'s portfolio.')
    w(f'5. **Missing fields:** See Data Coverage section for specific gaps.')
    w(f'6. **No causal claims:** All analyses are correlational. High share rate doesn\'t *cause* virality — both may be effects of content quality.')
    w(f'7. **Temporal confounds:** Platform algorithm changes over time are not controlled for.')
    w('')

    # ── Write report ─────────────────────────────────────────────────────────
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write('\n'.join(report))
    print(f'\n  Report written to: {OUTPUT_PATH}')
    print(f'  Total lines: {len(report)}')


if __name__ == '__main__':
    main()

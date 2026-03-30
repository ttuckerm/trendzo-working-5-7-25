# -*- coding: utf-8 -*-
"""
Response Stack Analysis — Side-Hustles Niche

Moves beyond raw DPS to identify what kinds of videos are share-heavy,
save-heavy, comment-heavy, or broad-view-but-shallow-engagement.

Connects observable content signals (pre-pub features, hashtags, duration,
captions) to distinct audience response patterns.

Tables used:
  - scraped_videos: video_id, views_count, likes_count, comments_count,
    shares_count, saves_count, hashtags, caption, dps_score, creator_username,
    creator_followers_count, duration_seconds, upload_timestamp, niche
  - training_features: all pre-publication extracted features (joined via video_id)

CONTAMINATION BOUNDARY:
  Post-publication engagement metrics are used for ANALYSIS AND INTERPRETATION
  ONLY. Response-stack classifications are observational categories derived
  from post-pub data. None feed into prediction features.

Output: docs/RESPONSE_STACK_REPORT.md
"""

import sys, io, os, re
import numpy as np
import pandas as pd
from scipy.stats import spearmanr, mannwhitneyu, kruskal
from datetime import datetime
from collections import Counter

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs', 'RESPONSE_STACK_REPORT.md')
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
    batch_size = 1000

    # scraped_videos
    print('Fetching scraped_videos (side-hustles)...')
    columns = (
        'video_id, views_count, likes_count, comments_count, shares_count, '
        'saves_count, hashtags, caption, dps_score, dps_classification, '
        'creator_username, creator_followers_count, duration_seconds, '
        'upload_timestamp, niche'
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

    # training_features
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
    """Return numeric feature columns (pre-pub only)."""
    skip = {'id', 'video_id', 'created_at', 'updated_at', 'dps_score', 'niche',
            'niche_key', 'creator_username', 'creator_followers_count',
            'views_count', 'likes_count', 'comments_count', 'shares_count',
            'saves_count', 'upload_timestamp', 'upload_ts', 'hashtags', 'caption',
            'dps_classification', 'duration_seconds',
            'like_rate', 'comment_rate', 'share_rate', 'save_rate',
            'total_eng_rate', 'hashtag_count',
            'share_dominance', 'save_dominance', 'comment_dominance',
            'response_type', 'is_share_heavy', 'is_save_heavy',
            'is_comment_heavy', 'is_shallow'}
    numeric_cols = []
    for col in df.columns:
        if col in skip:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            if df[col].notna().sum() >= 10 and df[col].std() > 0:
                numeric_cols.append(col)
    return sorted(numeric_cols)


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
    return f'{val * 100:.{decimals}f}%'


def sig_str(p):
    if p is None or (isinstance(p, float) and np.isnan(p)):
        return ''
    if p < 0.001:
        return '***'
    if p < 0.01:
        return '**'
    if p < 0.05:
        return '*'
    return ''


def caption_signals(caption):
    """Extract simple content-signal proxies from caption text."""
    if not caption or not isinstance(caption, str):
        return {}
    c = caption.lower()
    return {
        'has_question': bool(re.search(r'\?', caption)),
        'has_list_number': bool(re.search(r'\b\d+\s*(ways|tips|steps|things|ideas|methods|reasons|secrets|hacks)', c)),
        'has_money_amount': bool(re.search(r'\$\d+|k\/month|k\/year|k per|per month|per year|income|revenue|salary', c)),
        'has_urgency': bool(re.search(r'stop|don\'t|never|before it\'s too late|right now|immediately|hurry|warning', c)),
        'has_authority': bool(re.search(r'i made|i earned|i quit|my results|proof|real numbers|actual|here\'s how i', c)),
        'has_identity': bool(re.search(r'introverts|lazy|9.to.5|broke|beginners?|no experience|anyone can|even if', c)),
        'has_aspiration': bool(re.search(r'quit.*(job|9.to.5)|financial freedom|passive income|work from|laptop lifestyle|dream|life.changing', c)),
        'has_controversy': bool(re.search(r'scam|lie|truth|nobody|they don\'t|won\'t tell|secret|unpopular|overrated|overhyped', c)),
        'has_cta': bool(re.search(r'follow|save|share|comment|link|bio|dm', c)),
        'has_save_cta': bool(re.search(r'save (this|for later|it)', c)),
    }


def main():
    print('=' * 60)
    print('  Response Stack Analysis — Side-Hustles')
    print('=' * 60)

    load_env()
    all_videos, all_features = fetch_data()

    if not all_videos:
        print('ERROR: No video data. Aborting.')
        sys.exit(1)

    # ── Data Preparation ─────────────────────────────────────────────────────
    df = pd.DataFrame(all_videos)
    for col in ['views_count', 'likes_count', 'comments_count', 'shares_count',
                'saves_count', 'dps_score', 'creator_followers_count', 'duration_seconds']:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    # Engagement ratios (guard against 0 views)
    views_safe = df['views_count'].replace(0, np.nan)
    df['like_rate'] = df['likes_count'] / views_safe
    df['comment_rate'] = df['comments_count'] / views_safe
    df['share_rate'] = df['shares_count'] / views_safe
    df['save_rate'] = df['saves_count'] / views_safe
    total_eng = df['likes_count'] + df['comments_count'] + df['shares_count'] + df['saves_count']
    df['total_eng_rate'] = total_eng / views_safe

    df['hashtag_count'] = df['hashtags'].apply(lambda h: len(h) if isinstance(h, list) else 0)

    # ── Response Dominance Scores ────────────────────────────────────────────
    # For each video, compute which engagement type is disproportionately high
    # relative to the dataset median ratios

    med_share = df['share_rate'].median()
    med_save = df['save_rate'].median()
    med_comment = df['comment_rate'].median()
    med_like = df['like_rate'].median()
    med_total = df['total_eng_rate'].median()

    # Dominance = how many medians above the dataset median this video is
    df['share_dominance'] = (df['share_rate'] - med_share) / med_share
    df['save_dominance'] = (df['save_rate'] - med_save) / med_save
    df['comment_dominance'] = (df['comment_rate'] - med_comment) / med_comment

    # Classify response types
    # Thresholds: top quartile of each rate = "heavy"
    share_p75 = df['share_rate'].quantile(0.75)
    save_p75 = df['save_rate'].quantile(0.75)
    comment_p75 = df['comment_rate'].quantile(0.75)
    eng_p25 = df['total_eng_rate'].quantile(0.25)

    df['is_share_heavy'] = df['share_rate'] >= share_p75
    df['is_save_heavy'] = df['save_rate'] >= save_p75
    df['is_comment_heavy'] = df['comment_rate'] >= comment_p75
    df['is_shallow'] = (df['total_eng_rate'] <= eng_p25) & (df['views_count'] >= df['views_count'].median())

    # Primary response type (mutually exclusive for grouping)
    def primary_response(row):
        # Shallow takes priority if applicable
        if row['is_shallow']:
            return 'Shallow'
        # Otherwise, pick the highest dominance
        doms = {
            'Share-Heavy': row['share_dominance'],
            'Save-Heavy': row['save_dominance'],
            'Comment-Heavy': row['comment_dominance'],
        }
        best = max(doms, key=doms.get)
        # Only label if actually in top quartile
        if best == 'Share-Heavy' and row['is_share_heavy']:
            return 'Share-Heavy'
        if best == 'Save-Heavy' and row['is_save_heavy']:
            return 'Save-Heavy'
        if best == 'Comment-Heavy' and row['is_comment_heavy']:
            return 'Comment-Heavy'
        return 'Balanced'

    df['response_type'] = df.apply(primary_response, axis=1)

    # Caption signal extraction
    print('  Extracting caption signals...')
    cap_signals = df['caption'].apply(caption_signals)
    cap_df = pd.DataFrame(cap_signals.tolist(), index=df.index)
    for col in cap_df.columns:
        df[col] = cap_df[col].astype(float)

    # Join training_features
    if all_features:
        fdf = pd.DataFrame(all_features)
        merged = df.merge(fdf, on='video_id', how='inner', suffixes=('', '_feat'))
        print(f'  Videos with training_features: {len(merged)}')
    else:
        merged = df
        print(f'  No training_features data')

    pre_pub_features = get_numeric_features(merged)
    print(f'  Pre-pub numeric features: {len(pre_pub_features)}')

    response_types = ['Share-Heavy', 'Save-Heavy', 'Comment-Heavy', 'Shallow', 'Balanced']
    resp_counts = df['response_type'].value_counts()

    print('\n  Response type distribution:')
    for rt in response_types:
        n = resp_counts.get(rt, 0)
        print(f'    {rt:16s}: {n} ({n/len(df)*100:.1f}%)')

    # ══════════════════════════════════════════════════════════════════════════
    # BUILD REPORT
    # ══════════════════════════════════════════════════════════════════════════

    report = []
    w = report.append

    w('# Response Stack Analysis Report — Side-Hustles Niche')
    w(f'\n**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M")}')
    w(f'**Niche:** Side-Hustles / Making Money Online')
    w(f'**Content type:** Creator-led short-form, talking-head knowledge, direct-to-camera educational')
    w(f'**Total videos:** {len(df)} | **With training features:** {len(merged)}')
    w('')
    w('> **CONTAMINATION BOUNDARY:** Post-publication engagement metrics are used for')
    w('> response-type classification and analysis only. No post-pub data feeds into')
    w('> prediction features. Caption-signal extraction uses pre-publication text only.')
    w('')

    # ── EXECUTIVE SUMMARY ────────────────────────────────────────────────────
    w('## Executive Summary')
    w('')
    w('Not all viral videos are viral in the same way. A video with 500K views and')
    w('10K saves is fundamentally different from one with 500K views and 10K comments.')
    w('This analysis classifies side-hustle videos by their **dominant response pattern**')
    w('and identifies what content signals predict each pattern.')
    w('')
    w('**Key findings:**')

    # Compute mega-viral response breakdown
    p90 = df['dps_score'].quantile(0.90)
    mega = df[df['dps_score'] >= p90]
    mega_resp = mega['response_type'].value_counts()
    top_mega_type = mega_resp.index[0] if len(mega_resp) > 0 else 'N/A'

    w(f'- Among mega-viral videos (top 10% DPS), the dominant response type is **{top_mega_type}** '
      f'({mega_resp.get(top_mega_type, 0)}/{len(mega)} = {mega_resp.get(top_mega_type, 0)/len(mega)*100:.0f}%)')

    # Save vs share summary
    save_h = df[df['response_type'] == 'Save-Heavy']
    share_h = df[df['response_type'] == 'Share-Heavy']
    w(f'- **Save-heavy** videos have median DPS {save_h["dps_score"].median():.1f} vs '
      f'**share-heavy** at {share_h["dps_score"].median():.1f} — '
      f'{"saves correlate with higher overall performance" if save_h["dps_score"].median() > share_h["dps_score"].median() else "shares correlate with higher overall performance"}')
    w(f'- Shallow-engagement videos (high views, low interaction) make up '
      f'{resp_counts.get("Shallow", 0)/len(df)*100:.0f}% of the dataset')
    w(f'- Caption analysis reveals distinct linguistic patterns for each response type')
    w('')

    # ── METHODOLOGY ──────────────────────────────────────────────────────────
    w('## Methodology')
    w('')
    w('### Operational Definitions')
    w('')
    w('| Response Type | Definition | Rationale |')
    w('|--------------|-----------|-----------|')
    w(f'| **Share-Heavy** | Share rate >= p75 ({fmt_pct(share_p75)}) and highest dominance | Audience forwards to others — "you need to see this" |')
    w(f'| **Save-Heavy** | Save rate >= p75 ({fmt_pct(save_p75)}) and highest dominance | Audience bookmarks for reference — "I\'ll need this later" |')
    w(f'| **Comment-Heavy** | Comment rate >= p75 ({fmt_pct(comment_p75)}) and highest dominance | Audience engages in discussion — "I have something to say" |')
    w(f'| **Shallow** | Total engagement rate <= p25 ({fmt_pct(eng_p25)}) AND views >= median ({fmt_num(df["views_count"].median())}) | Algorithmically pushed but audience doesn\'t interact |')
    w(f'| **Balanced** | None of the above thresholds met | Evenly distributed engagement |')
    w('')

    w('### Dominance Score')
    w('')
    w('For each engagement type, dominance = `(video_rate - dataset_median_rate) / dataset_median_rate`.')
    w('A dominance of +1.0 means the video\'s rate is 2x the dataset median.')
    w('When multiple thresholds are met, the highest dominance wins the primary classification.')
    w('')

    w('### Caption Signal Extraction')
    w('')
    w('Binary content signals extracted from caption text via regex pattern matching:')
    w('')
    w('| Signal | Pattern Examples | Hypothesized Driver |')
    w('|--------|----------------|-------------------|')
    w('| `has_question` | "?" in caption | Engagement / curiosity |')
    w('| `has_list_number` | "5 ways", "10 tips", "3 steps" | Utility / save-worthiness |')
    w('| `has_money_amount` | "$5K/month", "income", "salary" | Aspiration |')
    w('| `has_urgency` | "stop", "don\'t", "warning", "right now" | Controversy / attention |')
    w('| `has_authority` | "I made", "my results", "proof" | Authority / credibility |')
    w('| `has_identity` | "introverts", "beginners", "no experience" | Identity / relatability |')
    w('| `has_aspiration` | "quit your job", "passive income", "financial freedom" | Aspiration |')
    w('| `has_controversy` | "scam", "truth", "nobody tells you" | Controversy / shares |')
    w('| `has_cta` | "follow", "save", "link in bio" | Explicit ask |')
    w('| `has_save_cta` | "save this", "save for later" | Direct save prompt |')
    w('')

    w('### Tables/Columns Used')
    w('```')
    w('scraped_videos: video_id, views_count, likes_count, comments_count, shares_count,')
    w('  saves_count, caption, hashtags, dps_score, creator_username,')
    w('  creator_followers_count, duration_seconds, upload_timestamp')
    w('training_features: all numeric pre-publication features (joined via video_id)')
    w('```')
    w('')

    # ── RESPONSE TYPE DISTRIBUTION ───────────────────────────────────────────
    w('## Response Type Distribution')
    w('')
    w('| Response Type | Count | % | Median DPS | Median Views | Median Like Rate | Median Save Rate | Median Share Rate | Median Comment Rate |')
    w('|--------------|-------|---|------------|-------------|-----------------|-----------------|------------------|-------------------|')
    for rt in response_types:
        sub = df[df['response_type'] == rt]
        if len(sub) == 0:
            continue
        w(f'| {rt} | {len(sub)} | {len(sub)/len(df)*100:.1f}% | '
          f'{sub["dps_score"].median():.1f} | {fmt_num(sub["views_count"].median())} | '
          f'{fmt_pct(sub["like_rate"].median())} | {fmt_pct(sub["save_rate"].median())} | '
          f'{fmt_pct(sub["share_rate"].median())} | {fmt_pct(sub["comment_rate"].median())} |')
    w('')

    # ── MEGA-VIRAL RESPONSE BREAKDOWN ────────────────────────────────────────
    w('## Mega-Viral Response Breakdown')
    w('')
    w(f'Among the **{len(mega)} mega-viral videos** (DPS >= {p90:.1f}, top 10%):')
    w('')
    w('| Response Type | Count | % of Mega-Viral | Median Views | Avg Save Rate | Avg Share Rate |')
    w('|--------------|-------|----------------|-------------|--------------|---------------|')
    for rt in response_types:
        sub = mega[mega['response_type'] == rt]
        if len(sub) == 0:
            continue
        w(f'| {rt} | {len(sub)} | {len(sub)/len(mega)*100:.1f}% | '
          f'{fmt_num(sub["views_count"].median())} | {fmt_pct(sub["save_rate"].mean())} | '
          f'{fmt_pct(sub["share_rate"].mean())} |')
    w('')

    # ── CAPTION SIGNAL ANALYSIS BY RESPONSE TYPE ─────────────────────────────
    w('## Caption Signals by Response Type')
    w('')
    w('What linguistic patterns appear in each response type? (% of videos with signal present)')
    w('')

    cap_signal_cols = ['has_question', 'has_list_number', 'has_money_amount', 'has_urgency',
                       'has_authority', 'has_identity', 'has_aspiration', 'has_controversy',
                       'has_cta', 'has_save_cta']

    header = '| Signal | All |'
    for rt in response_types:
        if resp_counts.get(rt, 0) > 0:
            header += f' {rt} |'
    w(header)
    w('|' + '|'.join(['--------'] * (2 + sum(1 for rt in response_types if resp_counts.get(rt, 0) > 0))) + '|')

    for sig in cap_signal_cols:
        row = f'| {sig} | {df[sig].mean()*100:.1f}% |'
        for rt in response_types:
            sub = df[df['response_type'] == rt]
            if len(sub) == 0:
                continue
            pct = sub[sig].mean() * 100
            # Bold if notably above or below overall
            overall = df[sig].mean() * 100
            if pct > overall * 1.3 and pct - overall > 3:
                row += f' **{pct:.1f}%** |'
            elif pct < overall * 0.7 and overall - pct > 3:
                row += f' _{pct:.1f}%_ |'
            else:
                row += f' {pct:.1f}% |'
        w(row)
    w('')
    w('*Bold = notably above average. Italic = notably below average.*')
    w('')

    # Statistical test: caption signals vs response types
    w('### Caption Signal ↔ Response Type Associations')
    w('')
    w('Mann-Whitney U tests comparing each signal between the labeled response type and all other videos:')
    w('')
    w('| Signal | Share-Heavy DPS diff | p | Save-Heavy DPS diff | p | Comment-Heavy DPS diff | p |')
    w('|--------|---------------------|---|--------------------|----|----------------------|---|')
    for sig in cap_signal_cols:
        row = f'| {sig} |'
        for rt in ['Share-Heavy', 'Save-Heavy', 'Comment-Heavy']:
            in_group = df[(df['response_type'] == rt) & (df[sig] == 1)]['dps_score']
            not_in_group = df[(df['response_type'] == rt) & (df[sig] == 0)]['dps_score']
            if len(in_group) >= 5 and len(not_in_group) >= 5:
                diff = in_group.median() - not_in_group.median()
                try:
                    _, p = mannwhitneyu(in_group, not_in_group, alternative='two-sided')
                    row += f' {diff:+.1f} | {p:.3f}{sig_str(p)} |'
                except Exception:
                    row += f' {diff:+.1f} | N/A |'
            else:
                row += ' N/A | N/A |'
        w(row)
    w('')

    # ── CONTENT FEATURES BY RESPONSE TYPE ────────────────────────────────────
    w('## Pre-Publication Features by Response Type')
    w('')

    if pre_pub_features:
        # For each response type, compute Spearman r of pre-pub features vs the
        # response-type dominance score
        dominance_targets = [
            ('share_dominance', 'Share Dominance'),
            ('save_dominance', 'Save Dominance'),
            ('comment_dominance', 'Comment Dominance'),
        ]

        w('### Feature Correlations with Response Dominance Scores')
        w('')
        w('Spearman r between each pre-pub feature and each dominance score.')
        w('Shows which features predict disproportionate shares vs saves vs comments.')
        w('')

        # Compute all correlations
        dom_results = {}
        for target_col, target_label in dominance_targets:
            results = []
            target = merged[target_col].values.astype(float)
            for feat in pre_pub_features:
                vals = merged[feat].values.astype(float)
                valid = ~np.isnan(vals) & ~np.isnan(target)
                if valid.sum() < 10:
                    continue
                r, p = spearmanr(vals[valid], target[valid])
                results.append({'feature': feat, 'r': r, 'p': p})
            results.sort(key=lambda x: abs(x['r']), reverse=True)
            dom_results[target_col] = results

        # Show top 15 for each dominance
        for target_col, target_label in dominance_targets:
            results = dom_results[target_col]
            w(f'#### Top 15 Features → {target_label}')
            w('')
            w('| Feature | Spearman r | p-value | Direction |')
            w('|---------|-----------|---------|-----------|')
            for entry in results[:15]:
                direction = 'Higher → more ' + target_label.split()[0].lower() + 's' if entry['r'] > 0 else 'Lower → more ' + target_label.split()[0].lower() + 's'
                w(f'| {entry["feature"]} | {entry["r"]:+.3f} | {entry["p"]:.4f}{sig_str(entry["p"])} | {direction} |')
            w('')

        # Compare: what features distinguish save-heavy from share-heavy?
        w('### Save-Heavy vs Share-Heavy: Feature Comparison')
        w('')
        save_group = merged[merged['response_type'] == 'Save-Heavy']
        share_group = merged[merged['response_type'] == 'Share-Heavy']

        if len(save_group) >= 10 and len(share_group) >= 10:
            w(f'*n: Save-Heavy = {len(save_group)}, Share-Heavy = {len(share_group)}*')
            w('')
            w('| Feature | Save-Heavy (median) | Share-Heavy (median) | Diff | p-value |')
            w('|---------|--------------------|--------------------|------|---------|')

            feat_diffs = []
            for feat in pre_pub_features:
                s_med = save_group[feat].median()
                h_med = share_group[feat].median()
                s_vals = save_group[feat].dropna()
                h_vals = share_group[feat].dropna()
                if len(s_vals) >= 5 and len(h_vals) >= 5:
                    try:
                        _, p = mannwhitneyu(s_vals, h_vals, alternative='two-sided')
                        feat_diffs.append((feat, s_med, h_med, p))
                    except Exception:
                        pass

            feat_diffs.sort(key=lambda x: x[3])  # sort by p-value
            for feat, s_med, h_med, p in feat_diffs[:20]:
                diff_pct = ((s_med - h_med) / abs(h_med) * 100) if h_med != 0 else np.nan
                diff_str = f'{diff_pct:+.0f}%' if not np.isnan(diff_pct) else 'N/A'
                w(f'| {feat} | {s_med:.2f} | {h_med:.2f} | {diff_str} | {p:.4f}{sig_str(p)} |')
            w('')
        else:
            w('*Insufficient data in one or both groups for comparison.*')
            w('')
    else:
        w('*No training_features data available for feature analysis.*')
        w('')

    # ── DURATION BY RESPONSE TYPE ────────────────────────────────────────────
    w('## Duration by Response Type')
    w('')
    w('| Response Type | Median Duration | Mean Duration | n |')
    w('|--------------|----------------|--------------|---|')
    for rt in response_types:
        sub = df[df['response_type'] == rt]
        if len(sub) == 0:
            continue
        w(f'| {rt} | {sub["duration_seconds"].median():.0f}s | {sub["duration_seconds"].mean():.0f}s | {len(sub)} |')
    w('')

    # ── HASHTAG PATTERNS BY RESPONSE TYPE ────────────────────────────────────
    w('## Hashtag Patterns by Response Type')
    w('')

    for rt in ['Share-Heavy', 'Save-Heavy', 'Comment-Heavy']:
        sub = df[df['response_type'] == rt]
        if len(sub) < 10:
            continue
        all_tags = []
        for tags in sub['hashtags']:
            if isinstance(tags, list):
                for t in tags:
                    if isinstance(t, str):
                        all_tags.append(t.lower().strip('#'))
        tag_counter = Counter(all_tags)
        top_tags = tag_counter.most_common(10)
        if top_tags:
            w(f'### {rt} — Top Hashtags')
            w('')
            w('| Hashtag | Count | % of group |')
            w('|---------|-------|-----------|')
            for tag, count in top_tags:
                w(f'| #{tag} | {count} | {count/len(sub)*100:.1f}% |')
            w('')

    # ── VIRAL DRIVER TYPOLOGY ────────────────────────────────────────────────
    w('## Viral Driver Typology: What Makes Side-Hustle Videos Go Mega-Viral?')
    w('')
    w('Using caption signals as proxies, we classify the likely viral driver for')
    w('mega-viral videos (top 10% DPS):')
    w('')

    # Compute driver prevalence in mega-viral vs rest
    driver_map = {
        'Utility-Driven': 'has_list_number',
        'Controversy-Driven': 'has_controversy',
        'Aspiration-Driven': 'has_aspiration',
        'Identity-Driven': 'has_identity',
        'Authority-Driven': 'has_authority',
    }

    rest = df[df['dps_score'] < p90]

    w('| Driver Type | Caption Signal | % in Mega-Viral | % in Rest | Lift | Interpretation |')
    w('|------------|---------------|----------------|----------|------|---------------|')
    for driver, signal in driver_map.items():
        mega_pct = mega[signal].mean() * 100
        rest_pct = rest[signal].mean() * 100
        lift = (mega_pct / rest_pct - 1) * 100 if rest_pct > 0 else np.nan
        lift_str = f'{lift:+.0f}%' if not np.isnan(lift) else 'N/A'

        if mega_pct > rest_pct * 1.3:
            interp = 'OVERREPRESENTED in mega-viral'
        elif mega_pct < rest_pct * 0.7:
            interp = 'Underrepresented in mega-viral'
        else:
            interp = 'Similar prevalence'
        w(f'| {driver} | {signal} | {mega_pct:.1f}% | {rest_pct:.1f}% | {lift_str} | {interp} |')
    w('')

    w('### Caveats')
    w('')
    w('- **HYPOTHESIS, not demonstrated causation.** Caption signals are rough proxies.')
    w('  A video with "$5K/month" in the caption may be aspiration-driven or authority-driven.')
    w('- **Multiple drivers overlap.** A single video can be both aspirational and authoritative.')
    w('- **Caption ≠ content.** The actual video content may have a different driver than the caption suggests.')
    w('- **Small sample.** Only ' + str(len(mega)) + ' mega-viral videos — percentages are noisy.')
    w('')

    # ── RESPONSE TYPE → DPS TIER CROSS-TAB ───────────────────────────────────
    w('## Response Type × DPS Tier Cross-Tab')
    w('')

    p25 = df['dps_score'].quantile(0.25)
    p50 = df['dps_score'].quantile(0.50)
    p75 = df['dps_score'].quantile(0.75)

    def assign_tier(d):
        if d >= p90: return 'Mega-Viral'
        if d >= p75: return 'Viral'
        if d >= p50: return 'Good'
        if d >= p25: return 'Average'
        return 'Underperformer'

    df['tier'] = df['dps_score'].apply(assign_tier)
    tier_order = ['Mega-Viral', 'Viral', 'Good', 'Average', 'Underperformer']

    w('| Response Type | Mega-Viral | Viral | Good | Average | Underperformer |')
    w('|--------------|-----------|-------|------|---------|----------------|')
    for rt in response_types:
        sub = df[df['response_type'] == rt]
        if len(sub) == 0:
            continue
        row = f'| {rt} |'
        for tier in tier_order:
            n = len(sub[sub['tier'] == tier])
            pct = n / len(sub) * 100 if len(sub) > 0 else 0
            row += f' {n} ({pct:.0f}%) |'
        w(row)
    w('')

    # ── PRACTICAL IMPLICATIONS ───────────────────────────────────────────────
    w('## Practical Implications for Feature Design & Tier Interpretation')
    w('')
    w('### For Feature Design')
    w('')
    w('1. **Response-type prediction** could become a secondary output alongside VPS.')
    w('   Pre-pub features that predict share dominance vs save dominance would help')
    w('   creators understand *how* their video will perform, not just *how much*.')
    w('')
    w('2. **Caption-signal features** are extractable pre-publication and show different')
    w('   profiles across response types. Worth adding to the feature pipeline:')
    w('   - List-number detection (utility proxy)')
    w('   - Money-amount detection (aspiration proxy)')
    w('   - Controversy language detection (share driver)')
    w('   - Identity-targeting language (relatability proxy)')
    w('')
    w('3. **Duration interacts with response type.** The optimal duration may differ')
    w('   depending on whether the goal is saves (reference content) vs shares')
    w('   (forwarding content) vs comments (discussion-generating content).')
    w('')
    w('### For Tier Interpretation')
    w('')
    w('1. **"Viral" is not monolithic.** A save-heavy viral video and a share-heavy')
    w('   viral video are different products with different implications for the creator.')
    w('')
    w('2. **Shallow-engagement detection** could flag videos that the algorithm is')
    w('   pushing but audiences aren\'t engaging with — a leading indicator of')
    w('   declining performance.')
    w('')
    w('3. **Response profile** adds nuance to VPS: two videos with identical VPS')
    w('   scores may have very different audience relationships.')
    w('')

    # ── LIMITATIONS ──────────────────────────────────────────────────────────
    w('## Limitations')
    w('')
    w(f'1. **Caption proxies are crude.** Regex pattern matching catches surface patterns but misses nuance, sarcasm, and context.')
    w(f'2. **Single snapshot.** Engagement metrics are from one scrape; response profiles may shift over time.')
    w(f'3. **No video-content analysis.** Actual spoken content, visual style, and editing patterns are not captured by caption analysis.')
    w(f'4. **Niche-specific.** Side-hustle content patterns may not transfer to other niches.')
    w(f'5. **Creator confounding.** Some creators consistently produce save-heavy or share-heavy content; response type may partially reflect creator style.')
    w(f'6. **Threshold sensitivity.** Using p75 for "heavy" and p25 for "shallow" is arbitrary; different thresholds would change group compositions.')
    w(f'7. **Overlap.** Some videos meet multiple "heavy" thresholds; primary classification forces a single label.')
    w('')

    # ── WHAT DRIVES SHARES VS SAVES VS COMMENTS ─────────────────────────────
    w('## What Drives Shares vs Saves vs Comments In This Niche')
    w('')
    w('Based on the evidence above, here is what the data shows — and what remains hypothesis.')
    w('')

    w('### Shares (demonstrated)')
    w('')
    share_evidence = []
    # Check caption signals overrepresented in share-heavy
    for sig in cap_signal_cols:
        sh_pct = df[df['response_type'] == 'Share-Heavy'][sig].mean()
        all_pct = df[sig].mean()
        if sh_pct > all_pct * 1.3 and sh_pct - all_pct > 0.03:
            share_evidence.append((sig, sh_pct, all_pct))

    if share_evidence:
        for sig, sh_pct, all_pct in share_evidence:
            w(f'- **{sig}** is overrepresented in share-heavy videos ({sh_pct*100:.1f}% vs {all_pct*100:.1f}% overall)')
    else:
        w('- No caption signals are significantly overrepresented in share-heavy videos')

    share_dur = df[df['response_type'] == 'Share-Heavy']['duration_seconds'].median()
    all_dur = df['duration_seconds'].median()
    w(f'- Share-heavy videos have median duration **{share_dur:.0f}s** (vs {all_dur:.0f}s overall)')

    # Top share-dominance features
    if 'share_dominance' in dom_results:
        top_share_feats = [r for r in dom_results['share_dominance'] if r['p'] < 0.05][:3]
        for feat_entry in top_share_feats:
            w(f'- Pre-pub feature **{feat_entry["feature"]}** correlates with share dominance (r={feat_entry["r"]:+.3f}, p={feat_entry["p"]:.4f})')
    w('')

    w('### Shares (hypothesis)')
    w('')
    w('- Controversy and "insider knowledge" framing likely drive shares ("you need to see this" / "they don\'t want you to know")')
    w('- Shorter, punchier videos may be more shareable than long-form reference content')
    w('- Videos with surprising or counterintuitive claims get forwarded more')
    w('')

    w('### Saves (demonstrated)')
    w('')
    save_evidence = []
    for sig in cap_signal_cols:
        sv_pct = df[df['response_type'] == 'Save-Heavy'][sig].mean()
        all_pct = df[sig].mean()
        if sv_pct > all_pct * 1.3 and sv_pct - all_pct > 0.03:
            save_evidence.append((sig, sv_pct, all_pct))

    if save_evidence:
        for sig, sv_pct, all_pct in save_evidence:
            w(f'- **{sig}** is overrepresented in save-heavy videos ({sv_pct*100:.1f}% vs {all_pct*100:.1f}% overall)')
    else:
        w('- No caption signals are significantly overrepresented in save-heavy videos')

    save_dur = df[df['response_type'] == 'Save-Heavy']['duration_seconds'].median()
    w(f'- Save-heavy videos have median duration **{save_dur:.0f}s** (vs {all_dur:.0f}s overall)')

    if 'save_dominance' in dom_results:
        top_save_feats = [r for r in dom_results['save_dominance'] if r['p'] < 0.05][:3]
        for feat_entry in top_save_feats:
            w(f'- Pre-pub feature **{feat_entry["feature"]}** correlates with save dominance (r={feat_entry["r"]:+.3f}, p={feat_entry["p"]:.4f})')
    w('')

    w('### Saves (hypothesis)')
    w('')
    w('- List-format content ("5 ways to...") triggers the save reflex — perceived as reusable reference')
    w('- Longer, more detailed videos are saved because they can\'t be absorbed in one viewing')
    w('- "Save this for later" CTAs in captions may directly boost save rate')
    w('')

    w('### Comments (demonstrated)')
    w('')
    comment_evidence = []
    for sig in cap_signal_cols:
        cm_pct = df[df['response_type'] == 'Comment-Heavy'][sig].mean()
        all_pct = df[sig].mean()
        if cm_pct > all_pct * 1.3 and cm_pct - all_pct > 0.03:
            comment_evidence.append((sig, cm_pct, all_pct))

    if comment_evidence:
        for sig, cm_pct, all_pct in comment_evidence:
            w(f'- **{sig}** is overrepresented in comment-heavy videos ({cm_pct*100:.1f}% vs {all_pct*100:.1f}% overall)')
    else:
        w('- No caption signals are significantly overrepresented in comment-heavy videos')

    comment_dur = df[df['response_type'] == 'Comment-Heavy']['duration_seconds'].median()
    w(f'- Comment-heavy videos have median duration **{comment_dur:.0f}s** (vs {all_dur:.0f}s overall)')

    if 'comment_dominance' in dom_results:
        top_comment_feats = [r for r in dom_results['comment_dominance'] if r['p'] < 0.05][:3]
        for feat_entry in top_comment_feats:
            w(f'- Pre-pub feature **{feat_entry["feature"]}** correlates with comment dominance (r={feat_entry["r"]:+.3f}, p={feat_entry["p"]:.4f})')
    w('')

    w('### Comments (hypothesis)')
    w('')
    w('- Questions in captions directly invite comment responses')
    w('- Controversial or polarizing claims generate "agree/disagree" comment threads')
    w('- Personal stories and vulnerability trigger empathy and advice comments')
    w('- Income claims invite skepticism comments ("proof?", "what niche?")')
    w('')

    w('### Shallow Engagement (demonstrated)')
    w('')
    shallow = df[df['response_type'] == 'Shallow']
    if len(shallow) >= 5:
        w(f'- Shallow videos have median **{fmt_num(shallow["views_count"].median())}** views but only '
          f'**{fmt_pct(shallow["total_eng_rate"].median())}** total engagement rate')
        w(f'- Median DPS: **{shallow["dps_score"].median():.1f}** (vs {df["dps_score"].median():.1f} overall)')

        shallow_evidence = []
        for sig in cap_signal_cols:
            sh_pct = shallow[sig].mean()
            all_pct = df[sig].mean()
            if abs(sh_pct - all_pct) > 0.05:
                shallow_evidence.append((sig, sh_pct, all_pct))
        for sig, sh_pct, all_pct in shallow_evidence:
            direction = 'more' if sh_pct > all_pct else 'less'
            w(f'- **{sig}**: {direction} common in shallow videos ({sh_pct*100:.1f}% vs {all_pct*100:.1f}%)')
    else:
        w('- Insufficient shallow-engagement videos for pattern analysis')
    w('')

    w('### Shallow Engagement (hypothesis)')
    w('')
    w('- Algorithm-pushed but audience-rejected: hook is strong enough for initial views but content doesn\'t deliver')
    w('- May indicate "clickbait gap" — promise in thumbnail/hook exceeds actual value')
    w('- Could also reflect trending-sound/hashtag virality where content is irrelevant to the discovery mechanism')
    w('')

    # ── Write ────────────────────────────────────────────────────────────────
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write('\n'.join(report))
    print(f'\n  Report written to: {OUTPUT_PATH}')
    print(f'  Total lines: {len(report)}')


if __name__ == '__main__':
    main()

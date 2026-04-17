#!/usr/bin/env python3
"""
Prompt 4 — Investigate sound_type's #1 XGBoost importance: causal vs confounded.

Runs 5 analyses on the S7 training + holdout data (5,845 rows total):
  1. Distribution of sound_type categories (count, mean/median DPS)
  2. Sound effect controlled for creator follower count bucket
  3. Sound effect controlled for content-quality tercile
  4. Same-creator comparison (requires Supabase join for creator_id)
  5. music_is_original breakdown + correlation with sound_type

Read-only. Writes nothing.
"""
import json, os, sys, io
import pandas as pd
import numpy as np

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

# Load .env.local manually (bash `source` choked on one of the values)
ENV_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env.local'))
if os.path.exists(ENV_FILE):
    with open(ENV_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            v = v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, 'data')

# Combine training + holdout for maximum sample
train = pd.read_csv(os.path.join(DATA, 'training_data.csv'))
holdout = pd.read_csv(os.path.join(DATA, 'holdout_data.csv'))
df = pd.concat([train, holdout], ignore_index=True)
df['video_id'] = df['video_id'].astype(str)
print(f'Loaded {len(df)} rows ({len(train)} train + {len(holdout)} holdout)')


def pct(x): return f'{x*100:.1f}%' if x is not None else '--'


# ── Helper: pretty-print a summary table ──────────────────────────────────────
def print_grouped_stats(groups, label, show_n_bucket=True):
    rows = []
    for (bucket, sound), g in groups:
        if len(g) < 5:
            continue
        rows.append({
            'bucket': bucket,
            'sound_type': sound,
            'n': len(g),
            'mean_dps': g['dps_score'].mean(),
            'median_dps': g['dps_score'].median(),
            'std_dps': g['dps_score'].std(),
        })
    out = pd.DataFrame(rows)
    if out.empty:
        print(f'  (no buckets with >=5 videos)')
        return out
    out = out.sort_values(['bucket', 'mean_dps'], ascending=[True, False])
    with pd.option_context('display.max_rows', None, 'display.width', 140,
                           'display.float_format', lambda v: f'{v:7.2f}'):
        print(out.to_string(index=False))
    return out


# ══════════════════════════════════════════════════════════════════════════════
# ANALYSIS 1 — sound_type distribution
# ══════════════════════════════════════════════════════════════════════════════
print('\n' + '=' * 78)
print('ANALYSIS 1 — sound_type distribution')
print('=' * 78)

dist = df.groupby('sound_type')['dps_score'].agg(['count', 'mean', 'median', 'std']).reset_index()
dist = dist.sort_values('mean', ascending=False)
with pd.option_context('display.float_format', lambda v: f'{v:7.2f}'):
    print(dist.to_string(index=False))

print(f'\nTotal rows: {len(df)}   Overall mean DPS: {df["dps_score"].mean():.2f}')
print(f'Variance across categories: {dist["mean"].var():.2f}')
print(f'Range of mean DPS across categories: '
      f'{dist["mean"].min():.2f} to {dist["mean"].max():.2f} '
      f'(spread = {dist["mean"].max() - dist["mean"].min():.2f})')


# ══════════════════════════════════════════════════════════════════════════════
# ANALYSIS 2 — controlled for creator size
# ══════════════════════════════════════════════════════════════════════════════
print('\n' + '=' * 78)
print('ANALYSIS 2 — sound_type DPS controlled for creator size')
print('=' * 78)


def size_bucket(f):
    if f is None or pd.isna(f):
        return 'Unknown'
    if f < 10_000:
        return 'Small (<10K)'
    if f < 100_000:
        return 'Medium (10K-100K)'
    if f < 1_000_000:
        return 'Large (100K-1M)'
    return 'Huge (>1M)'


df['size_bucket'] = df['creator_followers_count'].apply(size_bucket)
print(f'\nSize bucket counts: {df["size_bucket"].value_counts().to_dict()}')

grp2 = list(df.groupby(['size_bucket', 'sound_type']))
tbl2 = print_grouped_stats(grp2, 'size_bucket')


# Within-bucket spread: is there still variance between sound types?
print('\nWithin-bucket sound-type effect:')
for bucket in ['Small (<10K)', 'Medium (10K-100K)', 'Large (100K-1M)', 'Huge (>1M)']:
    sub = tbl2[tbl2['bucket'] == bucket] if not tbl2.empty else pd.DataFrame()
    if len(sub) < 2:
        print(f'  {bucket:<22} n/a (<2 sound types with >=5 videos)')
        continue
    spread = sub['mean_dps'].max() - sub['mean_dps'].min()
    top_sound = sub.iloc[0]['sound_type']
    bottom_sound = sub.iloc[-1]['sound_type']
    print(f'  {bucket:<22} DPS range: {sub["mean_dps"].min():.1f} ->{sub["mean_dps"].max():.1f} '
          f'(spread {spread:.1f}, top={top_sound}, bottom={bottom_sound})')


# ══════════════════════════════════════════════════════════════════════════════
# ANALYSIS 3 — controlled for content quality
# ══════════════════════════════════════════════════════════════════════════════
print('\n' + '=' * 78)
print('ANALYSIS 3 — sound_type DPS controlled for content-quality tercile')
print('=' * 78)

# Substitute for prompt-requested features that don't exist in training CSV:
#   hook_score                  -> hook_score                  ✓
#   visual_avg_scene_duration   -> ffmpeg_cuts_per_second       (pacing proxy, higher = faster)
#   gemini_overall_score        -> visual_variety_score         (closest visual-quality proxy)
#   pacing_score                -> scene_rate_first_half_vs_second
#   audio_loudness_integrated   -> audio_loudness_mean_lufs    (convert LUFS to [0,1])
QUALITY_FEATS = [
    'hook_score',                    # already 0-100
    'ffmpeg_cuts_per_second',        # pacing proxy
    'visual_variety_score',          # Gemini-style visual diversity
    'scene_rate_first_half_vs_second', # pacing change
    'audio_loudness_mean_lufs',      # production quality (LUFS, typically -30..-10)
    'vocal_confidence_composite',    # Bucket-2 confidence signal
    'hook_composition_score',        # Gemini Vision composition
]
print(f'Quality features used: {QUALITY_FEATS}')


def minmax_norm(s: pd.Series) -> pd.Series:
    s = pd.to_numeric(s, errors='coerce')
    mn, mx = s.min(skipna=True), s.max(skipna=True)
    if pd.isna(mn) or pd.isna(mx) or mn == mx:
        return pd.Series(np.full(len(s), 0.5), index=s.index)
    return (s - mn) / (mx - mn)


norm_cols = []
for f in QUALITY_FEATS:
    if f in df.columns:
        df[f + '_norm'] = minmax_norm(df[f])
        norm_cols.append(f + '_norm')
    else:
        print(f'  (skipping {f}: not in CSV)')

df['content_quality_index'] = df[norm_cols].mean(axis=1, skipna=True)

# Terciles
q33 = df['content_quality_index'].quantile(0.333)
q66 = df['content_quality_index'].quantile(0.667)
print(f'Content-quality index terciles: <{q33:.3f} | {q33:.3f}-{q66:.3f} | >{q66:.3f}')


def quality_tercile(q):
    if pd.isna(q):
        return 'Unknown'
    if q < q33:
        return '1-Low'
    if q < q66:
        return '2-Mid'
    return '3-High'


df['quality_tercile'] = df['content_quality_index'].apply(quality_tercile)
print(f'Tercile counts: {df["quality_tercile"].value_counts().to_dict()}')

grp3 = list(df.groupby(['quality_tercile', 'sound_type']))
tbl3 = print_grouped_stats(grp3, 'quality_tercile')

print('\nWithin-tercile sound-type effect:')
for tercile in ['1-Low', '2-Mid', '3-High']:
    sub = tbl3[tbl3['bucket'] == tercile] if not tbl3.empty else pd.DataFrame()
    if len(sub) < 2:
        continue
    spread = sub['mean_dps'].max() - sub['mean_dps'].min()
    print(f'  {tercile:<8} DPS range: {sub["mean_dps"].min():.1f} ->{sub["mean_dps"].max():.1f} '
          f'(spread {spread:.1f}, top={sub.iloc[0]["sound_type"]}, bottom={sub.iloc[-1]["sound_type"]})')


# ══════════════════════════════════════════════════════════════════════════════
# ANALYSIS 4 — same-creator comparison (needs Supabase join)
# ══════════════════════════════════════════════════════════════════════════════
print('\n' + '=' * 78)
print('ANALYSIS 4 — same-creator sound_type comparison')
print('=' * 78)


def load_creator_map():
    """Fetch video_id ->creator_id mapping from Supabase."""
    from supabase import create_client
    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL') or os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY') or os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        print('  (skipping — Supabase env not available)')
        return None
    client = create_client(url, key)

    # Paginate 1000 rows at a time
    out = {}
    PAGE = 1000
    offset = 0
    while True:
        page = client.from_('scraped_videos').select('video_id,creator_id,creator_username').range(
            offset, offset + PAGE - 1).execute()
        if not page.data:
            break
        for row in page.data:
            vid = str(row.get('video_id'))
            cid = row.get('creator_id') or row.get('creator_username')
            if vid and cid:
                out[vid] = str(cid)
        if len(page.data) < PAGE:
            break
        offset += PAGE
    return out


creator_map = load_creator_map()
if creator_map is None:
    print('Skipping — could not load creator_id map')
else:
    df['creator_id'] = df['video_id'].map(creator_map)
    print(f'Mapped {df["creator_id"].notna().sum()} of {len(df)} videos to creator_id')

    # Creators with 2+ videos AND ≥2 distinct sound_types
    creator_variants = (
        df.dropna(subset=['creator_id', 'sound_type'])
          .groupby('creator_id')
          .agg(n_videos=('video_id', 'count'),
               n_sound_types=('sound_type', 'nunique'))
          .query('n_videos >= 2 and n_sound_types >= 2')
    )
    print(f'{len(creator_variants)} creators have 2+ videos across 2+ sound_types')

    if len(creator_variants) > 0:
        eligible = df[df['creator_id'].isin(creator_variants.index)]
        print(f'{len(eligible)} videos total across those creators')

        # Per-creator per-sound mean DPS
        per_creator = (
            eligible.groupby(['creator_id', 'sound_type'])['dps_score']
                    .agg(['mean', 'count']).reset_index()
        )

        # For each creator, compute delta between best and worst sound_type
        wide = per_creator.pivot_table(index='creator_id', columns='sound_type',
                                       values='mean', aggfunc='mean')
        print('\nTop 10 creators by within-creator DPS spread across sound_types:')
        wide['spread'] = wide.max(axis=1) - wide.min(axis=1)
        top_spread = wide.sort_values('spread', ascending=False).head(10)
        with pd.option_context('display.float_format', lambda v: f'{v:6.2f}', 'display.width', 180):
            print(top_spread.to_string())

        # Aggregate: for each sound_type, average rank among creators who tried it
        # (rank 1 = best-performing sound_type for that creator)
        ranks = per_creator.copy()
        ranks['rank'] = ranks.groupby('creator_id')['mean'].rank(method='min', ascending=False)
        rank_summary = (
            ranks.groupby('sound_type')
                 .agg(n_creators=('creator_id', 'nunique'),
                      mean_rank=('rank', 'mean'),
                      median_rank=('rank', 'median'))
                 .sort_values('mean_rank')
        )
        print('\nPer-sound_type rank averaged across creators (lower = better):')
        with pd.option_context('display.float_format', lambda v: f'{v:6.2f}'):
            print(rank_summary.to_string())

        # Paired-delta: for each creator pair of sound_types, report how often
        # one beats the other
        # (full pairwise table is big; focus on original-vs-else as that's the
        # most important split per Analysis 5)
        print('\nWithin-creator: what beats original?')
        for sound in sorted(per_creator['sound_type'].unique()):
            if sound == 'original':
                continue
            paired = eligible.groupby(['creator_id', 'sound_type'])['dps_score'].mean().unstack()
            if 'original' not in paired.columns or sound not in paired.columns:
                continue
            both = paired.dropna(subset=['original', sound])
            if len(both) < 5:
                continue
            wins = (both[sound] > both['original']).sum()
            ties = (both[sound] == both['original']).sum()
            total = len(both)
            mean_delta = (both[sound] - both['original']).mean()
            print(f'  {sound:<30} creators with both: {total:>4}  '
                  f'{sound} beats original: {wins}/{total} ({wins/total*100:.0f}%)  '
                  f'mean delta DPS: {mean_delta:+.2f}')


# ══════════════════════════════════════════════════════════════════════════════
# ANALYSIS 5 — music_is_original breakdown
# ══════════════════════════════════════════════════════════════════════════════
print('\n' + '=' * 78)
print('ANALYSIS 5 — music_is_original breakdown')
print('=' * 78)

for col in ['music_is_original', 'is_original_sound', 'sound_is_trending']:
    if col not in df.columns:
        print(f'  {col}: not in CSV')
        continue
    print(f'\n-- {col} --')
    vals = df[col].value_counts(dropna=False)
    print(f'  distinct values: {dict(vals)}')
    stats = df.groupby(col)['dps_score'].agg(['count', 'mean', 'median', 'std']).round(2)
    print(stats.to_string())

# Cross-tabulation music_is_original vs sound_type
print('\n-- Cross-tab: sound_type × music_is_original (counts) --')
ctab = pd.crosstab(df['sound_type'], df['music_is_original'], margins=True)
print(ctab.to_string())
print('\n-- Cross-tab: sound_type × music_is_original (mean DPS) --')
mctab = df.groupby(['sound_type', 'music_is_original'])['dps_score'].agg(['count', 'mean']).round(2)
print(mctab.to_string())

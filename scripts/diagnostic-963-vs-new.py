import os, sys, json
from dotenv import load_dotenv
load_dotenv('.env.local')

from supabase import create_client
import numpy as np

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb = create_client(url, key)

FEATURE_COLS = [
    'ffmpeg_scene_changes','ffmpeg_cuts_per_second','ffmpeg_avg_motion','ffmpeg_color_variance',
    'ffmpeg_brightness_avg','ffmpeg_contrast_score','ffmpeg_resolution_width','ffmpeg_resolution_height',
    'ffmpeg_duration_seconds','ffmpeg_bitrate','ffmpeg_fps',
    'audio_pitch_mean_hz','audio_pitch_variance','audio_pitch_range','audio_pitch_std_dev',
    'audio_pitch_contour_slope','audio_loudness_mean_lufs','audio_loudness_range','audio_loudness_variance',
    'audio_silence_ratio','audio_silence_count','speaking_rate_wpm',
    'visual_scene_count','visual_avg_scene_duration','visual_score',
    'thumb_brightness','thumb_contrast','thumb_colorfulness','thumb_overall_score',
    'hook_score','hook_confidence','hook_text_score','hook_type_encoded',
    'text_word_count','text_sentence_count','text_question_mark_count','text_exclamation_count',
    'text_transcript_length','text_avg_sentence_length','text_unique_word_ratio','text_avg_word_length',
    'text_syllable_count','text_flesch_reading_ease','text_has_cta','text_negative_word_count','text_emoji_count',
    'meta_duration_seconds','meta_words_per_second','text_overlay_density','visual_proof_ratio',
    'vocal_confidence_composite','creator_followers_log','post_hour_utc','post_day_of_week',
    'specificity_score','instructional_density','has_step_structure','hedge_word_density'
]

print("Fetching training_features...")
all_rows = []
for offset in range(0, 10000, 1000):
    batch = sb.table('training_features').select('*').range(offset, offset + 999).execute()
    if not batch.data:
        break
    all_rows.extend(batch.data)
print(f"  Total: {len(all_rows)}")

print("Fetching scraped_videos for DPS + hashtag + niche...")
sv_rows = []
for offset in range(0, 10000, 1000):
    batch = sb.table('scraped_videos').select('video_id,dps_score,hashtags,niche,creator_username').range(offset, offset + 999).execute()
    if not batch.data:
        break
    sv_rows.extend(batch.data)
sv_map = {r['video_id']: r for r in sv_rows}
print(f"  Total scraped_videos: {len(sv_rows)}")

# Split into original vs newer
original = [r for r in all_rows if r.get('extracted_at','') < '2026-03-15']
newer = [r for r in all_rows if r.get('extracted_at','') >= '2026-03-15']
print(f"\nOriginal (before Mar 15): {len(original)}")
print(f"Newer (Mar 15+):          {len(newer)}")

def get_dps(row):
    vid = row.get('video_id')
    sv = sv_map.get(vid)
    if sv and sv.get('dps_score') is not None:
        return float(sv['dps_score'])
    return None

def dps_tier(score):
    if score is None: return 'unknown'
    if score >= 80: return 'Viral (80+)'
    elif score >= 60: return 'Good (60-79)'
    elif score >= 40: return 'Average (40-59)'
    elif score >= 20: return 'Below Avg (20-39)'
    else: return 'Poor (0-19)'

# ═══════════════════════════════════════════════════════════════
# QUERY 1: DPS Distribution
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("QUERY 1: DPS SCORE DISTRIBUTION")
print("=" * 70)

for label, group in [("ORIGINAL 963", original), ("NEWER", newer)]:
    scores = [get_dps(r) for r in group]
    valid = [s for s in scores if s is not None]
    arr = np.array(valid)
    print(f"\n  {label} ({len(group)} rows, {len(valid)} with DPS):")
    if len(valid) > 0:
        print(f"    Mean:   {np.mean(arr):.2f}")
        print(f"    Median: {np.median(arr):.2f}")
        print(f"    Std:    {np.std(arr):.2f}")
        print(f"    Min:    {np.min(arr):.2f}")
        print(f"    Max:    {np.max(arr):.2f}")

        tiers = {}
        for s in valid:
            t = dps_tier(s)
            tiers[t] = tiers.get(t, 0) + 1
        print(f"    Tier breakdown:")
        for t in ['Viral (80+)', 'Good (60-79)', 'Average (40-59)', 'Below Avg (20-39)', 'Poor (0-19)']:
            c = tiers.get(t, 0)
            pct = c / len(valid) * 100
            print(f"      {t:20s}: {c:5d} ({pct:5.1f}%)")
    else:
        print(f"    NO DPS scores found")

# ═══════════════════════════════════════════════════════════════
# QUERY 2: Feature Fill Rates
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("QUERY 2: FEATURE FILL RATES (% non-null)")
print("=" * 70)

print(f"\n  {'Feature':<35s} {'Orig %':>8s} {'New %':>8s} {'Delta':>8s}  FLAG")
print(f"  {'-'*35} {'-'*8} {'-'*8} {'-'*8}  ----")

flagged = []
for col in FEATURE_COLS:
    orig_filled = sum(1 for r in original if r.get(col) is not None) / max(len(original), 1) * 100
    new_filled = sum(1 for r in newer if r.get(col) is not None) / max(len(newer), 1) * 100
    delta = new_filled - orig_filled
    flag = " ***" if abs(delta) > 10 else ""
    if flag:
        flagged.append((col, orig_filled, new_filled, delta))
    print(f"  {col:<35s} {orig_filled:7.1f}% {new_filled:7.1f}% {delta:+7.1f}pp{flag}")

if flagged:
    print(f"\n  FLAGGED ({len(flagged)} features with >10pp difference):")
    for col, o, n, d in flagged:
        print(f"    {col}: {o:.1f}% -> {n:.1f}% ({d:+.1f}pp)")

# ═══════════════════════════════════════════════════════════════
# QUERY 3: Hashtags and Niche Tags
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("QUERY 3: HASHTAGS AND NICHE TAGS")
print("=" * 70)

for label, group in [("ORIGINAL 963", original), ("NEWER", newer)]:
    print(f"\n  {label} ({len(group)} rows):")

    niches = {}
    hashtags_all = {}
    no_sv = 0
    for r in group:
        sv = sv_map.get(r.get('video_id'))
        if not sv:
            no_sv += 1
            continue
        n = sv.get('niche') or 'NULL'
        niches[n] = niches.get(n, 0) + 1

        ht = sv.get('hashtags')
        if ht:
            if isinstance(ht, str):
                try:
                    ht = json.loads(ht)
                except:
                    ht = [ht]
            if isinstance(ht, list):
                for h in ht:
                    if isinstance(h, str):
                        hashtags_all[h.lower().strip()] = hashtags_all.get(h.lower().strip(), 0) + 1

    if no_sv:
        print(f"    (No scraped_video match for {no_sv} rows)")

    print(f"    Niche distribution:")
    for n, c in sorted(niches.items(), key=lambda x: -x[1]):
        print(f"      {n:30s}: {c:5d} ({c/len(group)*100:5.1f}%)")

    top_ht = sorted(hashtags_all.items(), key=lambda x: -x[1])[:30]
    print(f"    Top 30 hashtags (of {len(hashtags_all)} unique):")
    for h, c in top_ht:
        print(f"      #{h:40s}: {c:5d}")

# ═══════════════════════════════════════════════════════════════
# QUERY 4: creator_followers_log Distribution
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("QUERY 4: CREATOR_FOLLOWERS_LOG DISTRIBUTION")
print("=" * 70)

for label, group in [("ORIGINAL 963", original), ("NEWER", newer)]:
    vals = [r.get('creator_followers_log') for r in group if r.get('creator_followers_log') is not None]
    arr = np.array(vals, dtype=float)
    print(f"\n  {label} ({len(vals)}/{len(group)} non-null):")
    if len(vals) > 0:
        print(f"    Mean:   {np.mean(arr):.4f}")
        print(f"    Median: {np.median(arr):.4f}")
        print(f"    Std:    {np.std(arr):.4f}")
        print(f"    Min:    {np.min(arr):.4f}")
        print(f"    Max:    {np.max(arr):.4f}")
        print(f"    Approx follower range: {10**np.min(arr):.0f} to {10**np.max(arr):.0f}")

        buckets = {'<1K (log<3)': 0, '1K-10K (3-4)': 0, '10K-100K (4-5)': 0,
                   '100K-1M (5-6)': 0, '1M+ (6+)': 0}
        for v in vals:
            if v < 3: buckets['<1K (log<3)'] += 1
            elif v < 4: buckets['1K-10K (3-4)'] += 1
            elif v < 5: buckets['10K-100K (4-5)'] += 1
            elif v < 6: buckets['100K-1M (5-6)'] += 1
            else: buckets['1M+ (6+)'] += 1
        print(f"    Follower buckets:")
        for b, c in buckets.items():
            print(f"      {b:20s}: {c:5d} ({c/len(vals)*100:5.1f}%)")
    else:
        print(f"    NO values")

# ═══════════════════════════════════════════════════════════════
# QUERY 5: ffmpeg_resolution_height Distribution
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("QUERY 5: FFMPEG_RESOLUTION_HEIGHT DISTRIBUTION")
print("=" * 70)

for label, group in [("ORIGINAL 963", original), ("NEWER", newer)]:
    vals = [r.get('ffmpeg_resolution_height') for r in group if r.get('ffmpeg_resolution_height') is not None]
    arr = np.array(vals, dtype=float)
    print(f"\n  {label} ({len(vals)}/{len(group)} non-null):")
    if len(vals) > 0:
        print(f"    Mean:   {np.mean(arr):.1f}")
        print(f"    Median: {np.median(arr):.1f}")
        print(f"    Std:    {np.std(arr):.1f}")
        print(f"    Min:    {np.min(arr):.0f}")
        print(f"    Max:    {np.max(arr):.0f}")

        res_buckets = {}
        for v in vals:
            iv = int(v)
            if iv >= 1080:
                res_buckets['1080p+'] = res_buckets.get('1080p+', 0) + 1
            elif iv >= 720:
                res_buckets['720p'] = res_buckets.get('720p', 0) + 1
            elif iv >= 480:
                res_buckets['480p'] = res_buckets.get('480p', 0) + 1
            else:
                res_buckets[f'<480p ({iv})'] = res_buckets.get(f'<480p ({iv})', 0) + 1
        print(f"    Resolution breakdown:")
        for b in ['1080p+', '720p', '480p']:
            c = res_buckets.get(b, 0)
            print(f"      {b:15s}: {c:5d} ({c/len(vals)*100:5.1f}%)")
        others = {k: v for k, v in res_buckets.items() if k not in ['1080p+', '720p', '480p']}
        for b, c in sorted(others.items()):
            print(f"      {b:15s}: {c:5d} ({c/len(vals)*100:5.1f}%)")

        unique_heights = sorted(set(int(v) for v in vals))
        print(f"    Unique height values ({len(unique_heights)}): {unique_heights[:20]}{'...' if len(unique_heights) > 20 else ''}")

print("\n" + "=" * 70)
print("DIAGNOSTIC COMPLETE")
print("=" * 70)

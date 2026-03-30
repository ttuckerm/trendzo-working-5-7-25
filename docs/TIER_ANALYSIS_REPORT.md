# Tier Analysis Report — What Separates Each DPS Tier

**Generated:** 2026-03-17 14:27
**Sample size:** 863 videos (side-hustles niche)
**DPS range:** 11.6 - 91.7 (mean=49.9, median=49.1)

## Step 1: Tier Definitions (Percentile-Based)

| Tier | Percentile | DPS Range | Count | Mean DPS | Median DPS |
|------|-----------|-----------|-------|----------|------------|
| **Mega-Viral** | >= 90th (>= 75.6) | 75.6-91.7 | 87 | 81.2 | 80.1 |
| **Viral** | 75th-90th (64.2-75.6) | 64.2-75.6 | 129 | 70.0 | 70.2 |
| **Good** | 50th-75th (49.1-64.2) | 49.1-64.1 | 216 | 56.5 | 56.4 |
| **Average** | 25th-50th (34.9-49.1) | 34.9-49.0 | 215 | 41.9 | 41.6 |
| **Underperformer** | < 25th (< 34.9) | 11.6-34.8 | 216 | 26.6 | 27.5 |

## Step 2: Feature Profile by Tier

Mean value of top 20 content features across all 5 tiers.
Reading left to right shows how features change as performance improves.

| Feature | Mega-Viral | Viral | Good | Average | Under |
|---------|-----------|-------|------|---------|-------|
| Scene Changes | 9.7 | 7.2 | 4.6 | 3.3 | 1.6 |
| Visual Scene Count | 9.7 | 7.2 | 4.6 | 3.3 | 1.6 |
| Visual Variety | 68.6 | 48.5 | 44.2 | 30.6 | 21.1 |
| Avg Motion | 0.210 | 0.144 | 0.102 | 0.078 | 0.048 |
| Cuts/Second | 0.198 | 0.130 | 0.116 | 0.073 | 0.073 |
| Visual Score | 5.9 | 5.4 | 5.0 | 4.5 | 4.3 |
| Resolution (H) | 1767.0 | 1651.0 | 1601.8 | 1543.1 | 1382.5 |
| Contrast Score | 0.623 | 0.575 | 0.528 | 0.454 | 0.437 |
| Thumb Contrast | 62.4 | 57.5 | 52.9 | 45.5 | 43.7 |
| FPS | 37.9 | 37.3 | 32.1 | 34.0 | 30.2 |
| Emoji Count | 0.6 | 1.0 | 1.3 | 1.7 | 3.0 |
| Negative Words | 0.0 | 0.0 | 0.1 | 0.1 | 0.1 |
| Pitch (Hz) | 153.8 | 164.6 | 178.8 | 160.2 | 139.9 |
| Duration (s) | 68.5 | 67.6 | 53.8 | 52.0 | 44.6 |
| Avg Scene Len (s) | 26.3 | 29.4 | 30.0 | 32.4 | 36.5 |
| Transcript Len | 171.6 | 244.9 | 289.7 | 342.9 | 413.1 |
| Question Marks | 0.1 | 0.1 | 0.1 | 0.2 | 0.4 |
| Speaking Rate (WPM) | 44.2 | 152.2 | 238.6 | 323.7 | 376.8 |
| Hook Score | 19.5 | 17.7 | 18.0 | 17.1 | 16.9 |
| Thumbnail Score | 6.2 | 6.3 | 6.3 | 6.1 | 5.9 |

**Note on Speaking Rate (WPM):** This measures `word_count / duration * 60` — it's a **word density** metric, not literal speaking pace. Mega-Viral videos average just 26 words over 68 seconds. They rely on visuals, music, and demonstrations rather than non-stop talking. Underperformers pack 377 WPM because they're dialogue-heavy with minimal visual content.

### Progression Patterns

Features where performance increases **linearly** with tier:
- **Linear progression** (each tier step improves): Scene Changes, Visual Scene Count, Visual Variety, Avg Motion, Cuts/Second, Visual Score, Resolution (H), Contrast Score, Thumb Contrast, Emoji Count, Negative Words, Duration (s), Avg Scene Len (s), Transcript Len, Speaking Rate (WPM)
- **Non-linear / jump patterns**: FPS, Pitch (Hz), Question Marks, Hook Score, Thumbnail Score

## Step 3: What Separates Adjacent Tiers

For each tier boundary, the 5 features with the **largest jump** between tiers.
These are the "unlock" features — improving them pushes you to the next tier.

### Viral → Mega-Viral

1. **Speaking Rate (WPM)**: 152.2 → 44.2 (-70.9%)
2. **Cuts/Second**: 0.130 → 0.198 (+53.1%)
3. **Negative Words**: 0.0 → 0.0 (+48.3%)
4. **Avg Motion**: 0.144 → 0.210 (+46.0%)
5. **Visual Variety**: 48.5 → 68.6 (+41.5%)

### Good → Viral

1. **Negative Words**: 0.1 → 0.0 (-87.2%)
2. **Question Marks**: 0.1 → 0.1 (+76.3%)
3. **Scene Changes**: 4.6 → 7.2 (+57.3%)
4. **Visual Scene Count**: 4.6 → 7.2 (+57.3%)
5. **Avg Motion**: 0.102 → 0.144 (+41.1%)

### Average → Good

1. **Question Marks**: 0.2 → 0.1 (-61.7%)
2. **Cuts/Second**: 0.073 → 0.116 (+57.8%)
3. **Visual Variety**: 30.6 → 44.2 (+44.6%)
4. **Negative Words**: 0.1 → 0.1 (-40.6%)
5. **Scene Changes**: 3.3 → 4.6 (+38.0%)

### Underperformer → Average

1. **Scene Changes**: 1.6 → 3.3 (+109.5%)
2. **Visual Scene Count**: 1.6 → 3.3 (+109.5%)
3. **Avg Motion**: 0.048 → 0.078 (+60.9%)
4. **Question Marks**: 0.4 → 0.2 (-47.3%)
5. **Visual Variety**: 21.1 → 30.6 (+44.6%)

### Plain English Summary

**Viral → Mega-Viral** (the hardest jump — only 87 videos make it):
The top 10% separate themselves through **visual dominance over dialogue**. Mega-Viral videos have 71% fewer words per minute (44 vs 152 WPM) — they let visuals, B-roll, and music carry the message instead of relentless talking. They also cut 53% faster (one cut every 5s vs every 8s) and have 42% higher visual variety. The formula: more show, less tell, faster pacing.

**Good → Viral** (DPS 64+ — the "breakout" tier):
The biggest unlock is **editing intensity**. Scene changes jump 57% (4.6 → 7.2 per video). Motion increases 41%. Viral videos also eliminate all negative language — even traces of words like "worst" or "terrible" correlate with lower DPS. The shift: move from decent content to professional-grade editing.

**Average → Good** (DPS 49+ — where most creators stall):
The key differentiator is **pacing and variety**. Good videos cut 58% faster than Average (one cut every 9s vs every 14s) and score 45% higher on visual variety. They also use fewer rhetorical questions — letting the hook carry engagement rather than relying on "did you know?" patterns.

**Underperformer → Average** (DPS 35+ — escaping the bottom):
The single biggest leap is **basic editing**. Underperformers average just 1.6 scene changes — essentially no cuts. Average-tier videos double that to 3.3. Adding *any* B-roll, angle changes, or text overlays makes a measurable difference. Motion also jumps 61% — even small visual dynamism helps.

## Step 4: Threshold Analysis

For each top feature, the threshold (Good-tier median) that separates high from low performers.

| Feature | Threshold | Below: avg DPS | n | Above: avg DPS | n | Diff | Significant? |
|---------|-----------|---------------|---|---------------|---|------|-------------|
| Scene Changes | 2.0 | 44.3 | 440 | 55.6 | 422 | +11.3 | Yes*** |
| Visual Scene Count | 2.0 | 44.3 | 440 | 55.6 | 422 | +11.3 | Yes*** |
| Visual Variety | 52.2 | 44.2 | 463 | 55.7 | 310 | +11.4 | Yes*** |
| Avg Motion | 0.011 | 44.7 | 468 | 56.0 | 394 | +11.3 | Yes*** |
| Cuts/Second | 0.044 | 45.2 | 471 | 55.5 | 391 | +10.3 | Yes*** |
| Resolution (H) | 1920.0 | 44.8 | 424 | 54.8 | 438 | +10.0 | Yes*** |
| Contrast Score | 0.509 | 46.2 | 482 | 54.5 | 380 | +8.2 | Yes*** |
| Thumb Contrast | 51.0 | 46.4 | 471 | 54.0 | 391 | +7.6 | Yes*** |
| FPS | 30.0 | 37.5 | 60 | 50.8 | 802 | +13.3 | Yes*** |

### Key Thresholds (Plain English)

- **Scene Changes**: Videos at/above 2.0 average **55.6** DPS vs **44.3** below (+11.3 gap, n=422+440)
- **Visual Scene Count**: Videos at/above 2.0 average **55.6** DPS vs **44.3** below (+11.3 gap, n=422+440)
- **Visual Variety**: Videos at/above 52.2 average **55.7** DPS vs **44.2** below (+11.4 gap, n=310+463)
- **Avg Motion**: Videos at/above 0.011 average **56.0** DPS vs **44.7** below (+11.3 gap, n=394+468)
- **Cuts/Second**: Videos at/above 0.044 average **55.5** DPS vs **45.2** below (+10.3 gap, n=391+471)
- **Resolution (H)**: Videos at/above 1920.0 average **54.8** DPS vs **44.8** below (+10.0 gap, n=438+424)
- **Contrast Score**: Videos at/above 0.509 average **54.5** DPS vs **46.2** below (+8.2 gap, n=380+482)
- **Thumb Contrast**: Videos at/above 51.0 average **54.0** DPS vs **46.4** below (+7.6 gap, n=391+471)
- **FPS**: Videos at/above 30.0 average **50.8** DPS vs **37.5** below (+13.3 gap, n=802+60)

## Step 5: Creator Action Items by Current Tier

### If You're in **Underperformer** (DPS 12-35)
**Goal:** Reach Average tier (DPS 35+)

1. **Scene Changes**: Your tier averages 1.6, Average averages 3.3.
   → Add more cuts and scene transitions. Aim for 3+ scene changes per video (you average 2).
2. **Visual Scene Count**: Your tier averages 1.6, Average averages 3.3.
   → Use B-roll, screen recordings, and angle changes to reach 3+ distinct scenes.
3. **Avg Motion**: Your tier averages 0.048, Average averages 0.078.
   → Add more on-screen movement — hand gestures, walking, object demos. Avoid static talking-head framing.

### If You're in **Average** (DPS 35-49)
**Goal:** Reach Good tier (DPS 49+)

1. **Question Marks**: Your tier averages 0.2, Good averages 0.1.
   → Use fewer rhetorical questions (target ~0).
2. **Cuts/Second**: Your tier averages 0.073, Good averages 0.116.
   → Cut faster. Target 0.12+ cuts/second (roughly one cut every 9s).
3. **Visual Variety**: Your tier averages 30.6, Good averages 44.2.
   → Mix talking head with B-roll, text overlays, and screen shares. Target variety score 44+.

### If You're in **Good** (DPS 49-64)
**Goal:** Reach Viral tier (DPS 64+)

1. **Scene Changes**: Your tier averages 4.6, Viral averages 7.2.
   → Add 2-3 more cuts per video. Use B-roll inserts, angle changes, and text overlays to break up talking segments. Aim for 7+ total scene transitions.
2. **Avg Motion**: Your tier averages 0.102, Viral averages 0.144.
   → Add more physical movement — walk-and-talk, product demos, hand gestures. Avoid static framing.
3. **Transcript Length**: Your tier averages 290 chars, Viral averages 245.
   → Tighten your script. Say less, show more. Viral videos communicate with visuals, not walls of text.

### If You're in **Viral** (DPS 64-76)
**Goal:** Reach Mega-Viral tier (DPS 76+)

1. **Word Density (WPM)**: Your tier averages 152 words/min, Mega-Viral averages 44.
   → Let visuals carry the message. Replace talking segments with B-roll, demos, and visual storytelling. Mega-viral videos are 70% more visual than verbal.
2. **Cuts/Second**: Your tier averages 0.130, Mega-Viral averages 0.198.
   → Cut faster. Target one cut every 5 seconds (you're at every 8s). Use jump cuts, angle switches, and overlay transitions.
3. **Visual Variety**: Your tier averages 48.5, Mega-Viral averages 68.6.
   → Add more visual diversity — screen recordings, product shots, text overlays, different angles. Target variety score 65+.

---
*Generated from 863 real videos on 2026-03-17. All thresholds are data-driven percentiles, not arbitrary cutoffs.*
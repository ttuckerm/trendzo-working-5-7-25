# Tier Definitions — Side-Hustles / Making Money Online

**Date:** 2026-03-18
**Scope:** Creator-led short-form, talking-head knowledge, direct-to-camera educational shorts
**Data source:** 863 videos, side-hustles niche
**Companion doc:** [TIER_MECHANISM_PROFILES.md](TIER_MECHANISM_PROFILES.md) (full mechanism analysis per tier)
**Upstream data:** [TIER_ANALYSIS_REPORT.md](TIER_ANALYSIS_REPORT.md), [RESPONSE_STACK_REPORT.md](RESPONSE_STACK_REPORT.md)

---

## Purpose

This document defines the five performance tiers used in Trendzo's rating system. Each definition includes the statistical boundary, what it means for a creator at different account sizes, the measurable features that characterize the tier, the mechanism profile, and the actionable upgrade path to the next tier.

These definitions are intended to be used for:
- Product copy and UI language for tier badges
- Feature justification (why the system rates a video this way)
- Creator coaching (what to improve and why)
- Internal alignment on what each tier label actually means

---

## Tier 1: Mega-Viral

### Boundary
- **DPS range:** 75.6–91.7
- **Percentile:** >= 90th
- **Count in dataset:** 87 / 863 (10.1%)
- **Mean DPS:** 81.2 | **Median DPS:** 80.1

### Creator-Relative Interpretation

| Account Size | What This Means |
|-------------|-----------------|
| < 1K followers | Exceptional content quality overcame zero distribution advantage. The video earned its reach entirely through engagement signals. Rare — most mega-viral videos at this size have a specific side hustle that's trending. |
| 1K–10K followers | Strong breakout. The video significantly outperformed the creator's baseline reach. This is where side-hustle creators build their audience — one mega-viral video at this size can 5–10× follower count. |
| 10K–100K followers | Consistent with top-tier performance. The creator's editing and visual quality match their audience size. The video performed in the top 10% even against creators with larger followings. |
| 100K+ followers | Expected performance for established creators. At this size, mega-viral reflects both content quality and distribution advantage. The DPS formula accounts for follower count, so reaching this tier still requires above-average engagement rates. |

### Strongest Measurable Features

| Feature | Mega-Viral Value | Dataset Median | Separation | p-value |
|---------|-----------------|----------------|------------|---------|
| Speaking rate (WPM) | 44.2 | ~240 | -82% | <0.0001 |
| Scene changes | 9.7 | ~4.0 | +143% | <0.0001 |
| Visual variety | 68.6 | ~38 | +81% | <0.0001 |
| Cuts/second | 0.198 | ~0.09 | +120% | <0.0001 |
| Average motion | 0.210 | ~0.09 | +133% | <0.0001 |
| Contrast score | 0.623 | ~0.50 | +25% | <0.0001 |
| Duration | 68.5s | ~49s | +40% | <0.0001 |
| Emoji count | 0.6 | ~1.5 | -60% | <0.0001 |

### Mechanism Profile Summary

**Core mechanism:** Visual-first demonstration over dialogue.

Mega-viral side-hustle videos have 71% fewer words per minute than the next tier down. They replace talking with showing — screen recordings of actual earnings, live walkthroughs of tools, step-by-step visual demonstrations. The editing is fast (one cut every 5 seconds) with high visual variety (68.6 score). The result: the audience treats the video as a reusable reference (36% save-heavy) rather than passive entertainment.

**Dominant audience response:** Save-heavy (35.6%). Viewers bookmark these videos to return to later. In side-hustle content, this means the viewer intends to *try* the method shown.

**Dominant viral driver:** Utility (demonstrated — has_list_number is +48% overrepresented in mega-viral). Not controversy, not aspiration, not identity. The top-performing side-hustle videos deliver specific, actionable methods — not motivation, not hot takes.

### Likely Failure Point

Not applicable — this is the highest tier.

### Actionable Upgrade Path

Maintain position. Monitor for:
- **Speaking rate creep** — if WPM rises above 80, the visual-first advantage erodes
- **Production fatigue** — cutting corners on B-roll or screen recordings drops scene variety
- **Niche saturation** — the same side hustle shown repeatedly loses novelty; rotate topics

---

## Tier 2: Viral

### Boundary
- **DPS range:** 64.2–75.6
- **Percentile:** 75th–90th
- **Count in dataset:** 129 / 863 (14.9%)
- **Mean DPS:** 70.0 | **Median DPS:** 70.2

### Creator-Relative Interpretation

| Account Size | What This Means |
|-------------|-----------------|
| < 1K followers | Very strong performance. This video broke through the small-account disadvantage with quality and engagement. The content is genuinely good — the creator should study what they did differently here. |
| 1K–10K followers | This is the "growth engine" tier. Viral-tier videos at this size drive follower acquisition. If a creator can consistently produce at this level, they will grow. |
| 10K–100K followers | Solid performance. The video performed above 75th percentile. Not a breakout, but well above average for the niche. |
| 100K+ followers | Good but not exceptional. Larger accounts should expect to hit this tier regularly. Falling below it suggests content quality issues relative to audience size. |

### Strongest Measurable Features

| Feature | Viral Value | Dataset Median | Separation | p-value |
|---------|------------|----------------|------------|---------|
| Speaking rate (WPM) | 152.2 | ~240 | -37% | <0.0001 |
| Scene changes | 7.2 | ~4.0 | +80% | <0.0001 |
| Visual variety | 48.5 | ~38 | +28% | <0.0001 |
| Average motion | 0.144 | ~0.09 | +60% | <0.0001 |
| Duration | 67.6s | ~49s | +38% | <0.0001 |
| Negative words | 0.0 | ~0.05 | -100% | <0.0001 |
| Transcript length | 244.9 | ~300 | -18% | <0.0001 |
| Emoji count | 1.0 | ~1.5 | -33% | <0.0001 |

### Mechanism Profile Summary

**Core mechanism:** Professional editing with tight scripting.

Viral-tier creators have learned to edit well (7.2 scene changes, 0.130 cuts/s) and write tight scripts (245-char transcripts, 37% fewer words/min than average). They've eliminated negative language entirely. The production signals competence and credibility. The content is well-structured and well-delivered — but still delivered primarily through talking rather than showing.

**Dominant audience response:** Save-heavy (34.1%), but 20% shallow — meaning one in five viral-tier videos earns distribution without converting to deep engagement. These are the "almost mega-viral" videos where the content is good but the format (too much talking) limits the audience's impulse to save or share.

**Dominant viral driver:** Utility (hypothesis). Viral-tier videos share the utility pattern of mega-viral but deliver it through dialogue rather than demonstration. The value is real but harder for the viewer to act on because it's spoken, not shown.

### Likely Failure Point

**Over-reliance on dialogue.** Speaking rate at 152 WPM is 3.4× higher than mega-viral. The creator delivers value through monologue when the platform rewards visual demonstration. They've mastered the "good talking-head video" — but the next tier requires a fundamentally different approach.

### Actionable Upgrade Path to Mega-Viral

| Action | Current | Target | How |
|--------|---------|--------|-----|
| Reduce speaking rate | 152 WPM | ~50 WPM | Replace 60–70% of talking segments with visual demonstrations. Film screen recordings, tool walkthroughs, process B-roll. |
| Increase cuts/second | 0.130 | 0.198 | Cut every 5s instead of every 8s. Use jump cuts within talking segments, overlay transitions during demos. |
| Increase visual variety | 48.5 | 68.6 | Add 3+ more distinct visual scenes per video — different camera angles, screen recordings, text overlay cards, product shots. |
| Increase motion | 0.144 | 0.210 | Walk-and-talk, hand demonstrations, object manipulation. Avoid static seated framing. |

**The conceptual shift:** Stop being a talking head who edits well. Start being a demonstrator who talks sparingly.

---

## Tier 3: Good

### Boundary
- **DPS range:** 49.1–64.1
- **Percentile:** 50th–75th
- **Count in dataset:** 216 / 863 (25.0%)
- **Mean DPS:** 56.5 | **Median DPS:** 56.4

### Creator-Relative Interpretation

| Account Size | What This Means |
|-------------|-----------------|
| < 1K followers | Solid content. Above-median performance despite limited distribution. The content fundamentals are there — editing and format are the unlock, not topic or niche. |
| 1K–10K followers | Average-to-good performance. The video didn't break out but it's competitive. Most videos from creators at this size land here. |
| 10K–100K followers | Underperforming relative to account size. A 50K-follower creator should be producing above the 75th percentile. Hitting Good tier suggests content quality isn't matching distribution advantage. |
| 100K+ followers | Below expectations. The distribution advantage of a large account should push engagement higher. Good-tier performance here suggests the audience is disengaging — possible content fatigue or niche mismatch. |

### Strongest Measurable Features

| Feature | Good Value | Dataset Median | Separation | p-value |
|---------|-----------|----------------|------------|---------|
| Scene changes | 4.6 | ~4.0 | +15% | <0.0001 |
| Cuts/second | 0.116 | ~0.09 | +29% | <0.0001 |
| Visual variety | 44.2 | ~38 | +16% | <0.0001 |
| Duration | 53.8s | ~49s | +10% | <0.0001 |
| Pitch (Hz) | 178.8 | ~160 | +12% (highest tier) | <0.0001 |
| Question marks | 0.1 | ~0.2 | -50% | <0.0001 |
| Emoji count | 1.3 | ~1.5 | -13% | <0.0001 |

### Mechanism Profile Summary

**Core mechanism:** Competent production with adequate pacing.

Good-tier videos are "watchable" — they have enough editing (4.6 scene changes, one cut every 9s) and visual variety (44.2) to hold attention. The creator speaks at 239 WPM with some visual support. Captions are reasonably clean. The content is structured and on-topic. But nothing about the video compels the viewer to act — it's good enough to watch, not good enough to save, share, or comment on.

**Dominant audience response:** Balanced (35.6%) with 24% shallow. The balanced response means no strong audience impulse is being triggered. The 24% shallow segment is a warning: nearly a quarter of Good-tier videos get decent views but fail to convert them into engagement. These videos are "watchable but forgettable."

**Dominant viral driver:** None dominant. Good-tier videos lack a clear driver — they're competent content without a distinctive angle.

### Likely Failure Point

**Editing plateau.** Good-tier creators have learned basic editing but plateau at 4.6 scene changes per video. The jump to Viral requires 7.2 (+57%). The bottleneck is usually production workflow — adding more B-roll means planning shots in advance, recording screen recordings, or building a library of insert footage. Creators who "just hit record and talk" can't break through this ceiling.

### Actionable Upgrade Path to Viral

| Action | Current | Target | How |
|--------|---------|--------|-----|
| Add scene changes | 4.6 | 7.2 | Plan 3+ B-roll inserts before filming. Record screen recordings of tools/dashboards. Use angle changes (front-facing + over-the-shoulder). |
| Increase motion | 0.102 | 0.144 | Walk-and-talk for at least one segment. Use hand gestures with objects. Film product demos. |
| Tighten transcript | 290 chars | 245 chars | Cut 15% of the script. Every sentence that can be replaced with a visual, replace it. |
| Eliminate negative words | 0.1 | 0.0 | Remove "worst", "terrible", "never", "don't" from scripts. Reframe as positive: "instead, try X." |

**The conceptual shift:** Stop editing after filming. Start planning edits before filming. Create a shot list for every video.

---

## Tier 4: Average

### Boundary
- **DPS range:** 34.9–49.0
- **Percentile:** 25th–50th
- **Count in dataset:** 215 / 863 (24.9%)
- **Mean DPS:** 41.9 | **Median DPS:** 41.6

### Creator-Relative Interpretation

| Account Size | What This Means |
|-------------|-----------------|
| < 1K followers | Expected performance for new creators. The content meets baseline quality but production is holding it back. Focus on editing basics. |
| 1K–10K followers | Below average for established small creators. The audience is present but the content isn't compelling enough to trigger engagement. Production quality is the likely bottleneck. |
| 10K–100K followers | Concerning. Distribution advantage is being wasted on content that doesn't convert. The audience may be growing disengaged. |
| 100K+ followers | Red flag. High follower count with Average-tier content suggests audience mismatch or declining quality. |

### Strongest Measurable Features

| Feature | Average Value | Dataset Median | Separation | p-value |
|---------|--------------|----------------|------------|---------|
| Scene changes | 3.3 | ~4.0 | -18% | <0.0001 |
| Visual variety | 30.6 | ~38 | -19% | <0.0001 |
| Cuts/second | 0.073 | ~0.09 | -19% | <0.0001 |
| Speaking rate (WPM) | 323.7 | ~240 | +35% | <0.0001 |
| Duration | 52.0s | ~49s | +6% | <0.0001 |
| Emoji count | 1.7 | ~1.5 | +13% | <0.0001 |
| Question marks | 0.2 | ~0.2 | ~0% | N/A |

### Mechanism Profile Summary

**Core mechanism:** Basic production with dialogue dependency.

Average-tier videos are talking-head monologues with minimal editing. At 324 WPM, the creator talks through their content with sparse visual support (3.3 scene changes, 30.6 visual variety). The production clears minimum quality thresholds — the algorithm gives them initial distribution — but retention and engagement are too low to trigger amplification. These videos get seen but don't spread.

**Dominant audience response:** Balanced (35.3%) with 22% share-heavy. The share-heavy segment is notable: some Average-tier videos contain ideas worth forwarding even though the production doesn't earn saves. This suggests the *content* has value but the *format* fails to unlock it.

**Dominant viral driver:** None dominant. The content is generically positioned — it could be from anyone in the niche.

### Likely Failure Point

**Cut rate is too slow.** One cut every 14 seconds in a platform built for 3-second attention spans. The content may be solid, but the visual monotony causes viewers to scroll before they get to the value. The creator is producing at podcast pace on a visual-first platform.

### Actionable Upgrade Path to Good

| Action | Current | Target | How |
|--------|---------|--------|-----|
| Increase cuts/second | 0.073 | 0.116 | Cut every 9s instead of 14s. Simple: add a jump cut every time you start a new point. |
| Increase visual variety | 30.6 | 44.2 | Add 1–2 B-roll inserts per video. Screen recording of the tool/site you're discussing. Text overlay with the key number or URL. |
| Reduce question marks | 0.2 | 0.1 | Replace rhetorical questions with statements. "Did you know you can make money with X?" becomes "Here's how to make money with X." |
| Reduce speaking rate | 324 WPM | 239 WPM | Pause between points. Let a text overlay or B-roll fill 2–3 seconds instead of talking through transitions. |

**The conceptual shift:** You have something to say. Now learn to present it visually, not just verbally.

---

## Tier 5: Underperformer

### Boundary
- **DPS range:** 11.6–34.8
- **Percentile:** < 25th
- **Count in dataset:** 216 / 863 (25.0%)
- **Mean DPS:** 26.6 | **Median DPS:** 27.5

### Creator-Relative Interpretation

| Account Size | What This Means |
|-------------|-----------------|
| < 1K followers | Common for new creators learning the format. The content needs basic production improvements — not a judgment on the creator's knowledge, but on how they're presenting it. |
| 1K–10K followers | Below expectations. The creator has an audience but the content isn't meeting platform standards. Immediate editing improvements would likely move this video to Average or Good. |
| 10K–100K followers | Significant underperformance. A video this weak from a mid-size account suggests either a topic miss, a format experiment that failed, or declining effort. |
| 100K+ followers | Anomaly. Either a niche-mismatch post, a deliberately low-effort post (Q&A, update), or a sign of burnout. |

### Strongest Measurable Features

| Feature | Underperformer Value | Dataset Median | Separation | p-value |
|---------|---------------------|----------------|------------|---------|
| Scene changes | 1.6 | ~4.0 | -60% | <0.0001 |
| Speaking rate (WPM) | 376.8 | ~240 | +57% | <0.0001 |
| Visual variety | 21.1 | ~38 | -44% | <0.0001 |
| Average motion | 0.048 | ~0.09 | -47% | <0.0001 |
| Emoji count | 3.0 | ~1.5 | +100% | <0.0001 |
| Resolution (H) | 1382px | ~1580 | -13% | <0.01 |
| Contrast score | 0.437 | ~0.50 | -13% | <0.0001 |
| Transcript length | 413.1 chars | ~300 | +38% | <0.0001 |
| Question marks | 0.4 | ~0.2 | +100% | <0.0001 |
| Duration | 44.6s | ~49s | -9% | <0.01 |

### Mechanism Profile Summary

**Core mechanism:** Static monologue with caption clutter.

Underperforming side-hustle videos are single-take, unedited talking-head recordings. The creator talks nonstop (377 WPM) into a static frame (1.6 scene changes, 0.048 motion) at sub-1080p resolution with high-contrast captions stuffed with emojis (3.0) and questions (0.4). The platform deprioritizes them because retention metrics are poor — viewers swipe within 2–3 seconds because the static frame provides no visual reason to stay.

**Dominant audience response:** Balanced (65%) — but "balanced" here means "uniformly absent." Only 3.2% are save-heavy. The content has no reference value, no shareability, and doesn't trigger strong enough reactions for comments. The 0% shallow rate isn't positive — these videos don't get enough views to exhibit the shallow pattern.

**Dominant viral driver:** None. The caption signals show no clear positioning — no dominant utility, controversy, identity, or authority framing.

### Likely Failure Point

**No editing.** Scene changes at 1.6 mean the creator is recording in a single take and posting raw. In a niche where the top 10% average 9.7 scene changes and cut every 5 seconds, a single-take static video has zero chance of competing for attention.

### Actionable Upgrade Path to Average

| Action | Current | Target | How |
|--------|---------|--------|-----|
| Add scene changes | 1.6 | 3.3 | Record in 2–3 segments instead of one take. Add even one cut — a screen recording, a text overlay, a different camera angle. |
| Increase motion | 0.048 | 0.078 | Use hand gestures. Stand up. Hold up a phone or product. Any movement is better than static. |
| Clean caption | 3.0 emojis, 0.4 questions | 1.7 emojis, 0.2 questions | Cut emoji count in half. Replace "Did you know...?" with direct statements. |
| Upgrade resolution | 1382px | 1543px+ | Shoot at 1080p (1920×1080) minimum. Check phone camera settings — most phones default to 1080p but creators sometimes export at lower resolution. |
| Reduce word density | 377 WPM | 324 WPM | Pause between points. Let silence exist for 1–2 seconds. You don't have to fill every moment with talking. |

**The conceptual shift:** This is not a podcast. It's a visual medium. The camera is not a microphone — it's a screen. Show something.

---

## Tier Boundary Summary

| Tier | DPS Floor | DPS Ceiling | Percentile | n | Median Views | Dominant Response |
|------|-----------|-------------|------------|---|-------------|-------------------|
| **Mega-Viral** | 75.6 | 91.7 | >= 90th | 87 | — | Save-Heavy (36%) |
| **Viral** | 64.2 | 75.6 | 75th–90th | 129 | — | Save-Heavy (34%) |
| **Good** | 49.1 | 64.1 | 50th–75th | 216 | — | Balanced (36%) |
| **Average** | 34.9 | 49.0 | 25th–50th | 215 | — | Balanced (35%) |
| **Underperformer** | 11.6 | 34.8 | < 25th | 216 | — | Balanced (65%) |

---

## How The 5 Ratings Are Justified

### 1. Statistical Justification

The five tiers are **percentile-based** partitions of 863 real side-hustle videos scored by DPS (Dynamic Percentile System). DPS itself is computed from post-publication metrics using a weighted formula:

```
DPS = (viewPercentile × 0.52) + (engPercentile × 0.21) + (reachScore × 0.12) + (baseline × 0.15)
```

The tier boundaries are not arbitrary — they correspond to standard percentile breaks (25th, 50th, 75th, 90th) applied to this formula's output. The boundaries (34.9, 49.1, 64.2, 75.6) are derived from the data, not preset.

**Why five tiers, not three or seven:**
- Three tiers (low/medium/high) would collapse the critical Viral-to-Mega-Viral distinction, which is the most feature-differentiated boundary in the dataset (71% WPM drop, 53% cuts/second increase)
- Seven tiers would create distinctions too fine to be actionable — the feature profiles between adjacent tiers would overlap to the point of meaninglessness
- Five tiers produce boundaries where every adjacent pair has at least 3 statistically significant (p < 0.0001) feature differences with effect sizes large enough to be actionable

### 2. Mechanism Justification

Each tier isn't just a score range — it corresponds to a distinct *production style* with a distinct *audience mechanism*:

| Tier | Production Style | Audience Mechanism | Evidence Type |
|------|-----------------|-------------------|---------------|
| **Mega-Viral** | Visual-first demonstration | "I need to save this to try later" | Demonstrated (36% save-heavy, 44 WPM, 9.7 scenes) |
| **Viral** | Well-edited talking head | "This is quality content, worth my time" | Demonstrated (34% save-heavy, 0% neg words, 152 WPM) |
| **Good** | Competently paced talking head | "Watchable but I won't remember it" | Demonstrated (24% shallow, 36% balanced, 4.6 scenes) |
| **Average** | Minimally edited monologue | "Passable but nothing special" | Demonstrated (35% balanced, 324 WPM, 3.3 scenes) |
| **Underperformer** | Static unedited recording | "I scrolled past in 2 seconds" | Demonstrated (65% balanced at low levels, 1.6 scenes, 377 WPM) |

These are not post-hoc rationalizations — the feature profiles were computed independently and then mapped to mechanisms. The mechanism explanations are consistent with the measured features at every tier boundary.

### 3. Practical Justification

Each tier produces a different actionable recommendation. This is the ultimate test of a rating system: if two tiers produce the same advice, they should be merged. Every adjacent pair produces distinct advice:

| Boundary | Primary Advice | Secondary Advice |
|----------|---------------|-----------------|
| Under → Average | "Add any editing at all" (scene changes 1.6 → 3.3) | "Clean up your caption" (emojis 3.0 → 1.7) |
| Average → Good | "Cut faster" (cuts/s 0.073 → 0.116) | "Add visual variety" (variety 30.6 → 44.2) |
| Good → Viral | "More scene changes" (scenes 4.6 → 7.2) | "Eliminate negative language" (neg words → 0) |
| Viral → Mega-Viral | "Stop talking, start showing" (WPM 152 → 44) | "Cut even faster" (cuts/s 0.130 → 0.198) |

No two boundaries give the same primary advice. Each tier represents a genuine skill plateau with a specific unlock to the next level.

### 4. Response Stack Justification

The tiers correspond to distinct audience response patterns (from [RESPONSE_STACK_REPORT.md](RESPONSE_STACK_REPORT.md)):

- **Mega-Viral and Viral** are dominated by save-heavy responses (36% and 34%) — audiences treat these as reference material
- **Good and Average** are dominated by balanced responses (36% and 35%) — no strong audience impulse, watchable but not actionable
- **Underperformer** is overwhelmingly balanced at low levels (65%) — uniformly absent engagement

The shift from "balanced" to "save-heavy" as the dominant response happens at the Good-to-Viral boundary (DPS ~64). This is the point where content crosses from "watchable" to "worth coming back to." This boundary is independently meaningful — it's where the audience's relationship with the content fundamentally changes from consumption to reference.

### 5. Niche-Specific Justification

These tiers are calibrated specifically for **side-hustles / making money online** talking-head content. Key niche-specific aspects:

- **Visual demonstration matters more here than in other niches** because the content is about *methods* — showing a dashboard, a tool, or a process is fundamentally more credible than describing one. The WPM-to-tier correlation (r = -0.88 across tiers) is likely stronger here than in entertainment or comedy niches.
- **Save-heaviness dominates the top tiers** because side-hustle content is *actionable* — viewers save it to execute later. In entertainment niches, share-heaviness would likely dominate instead.
- **Caption clutter (emojis, questions) is penalized more severely** because the niche has been polluted by spam accounts using those exact signals. Legitimate creators who caption like spam accounts inherit the audience's skepticism.
- **Negative language elimination at Viral tier** is niche-specific — in side-hustle content, negativity ("this hustle is dead", "don't waste your time") triggers defensive responses rather than engagement. In commentary or news niches, negativity might perform differently.

These tiers should not be applied to other niches without recalibration. The DPS formula is universal, but the mechanism profiles and feature thresholds are specific to the making-money talking-head format.

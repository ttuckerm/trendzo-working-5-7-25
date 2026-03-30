# Next Pre-Publication Feature Queue — Side-Hustles Niche

**Date:** 2026-03-18
**Scope:** Creator-led short-form, talking-head knowledge, direct-to-camera educational shorts
**Input documents:**
- [SIGNAL_ONTOLOGY.md](SIGNAL_ONTOLOGY.md) — signal/mechanism/feature taxonomy
- [FORMAT_ONTOLOGY.md](FORMAT_ONTOLOGY.md) — structural vocabulary
- [TIER_ANALYSIS_REPORT.md](TIER_ANALYSIS_REPORT.md) — per-tier feature profiles
- [TIER_MECHANISM_PROFILES.md](TIER_MECHANISM_PROFILES.md) — mechanism explanations per tier
- [TIER_DEFINITIONS.md](TIER_DEFINITIONS.md) — boundaries, upgrade paths
- [RESPONSE_STACK_REPORT.md](RESPONSE_STACK_REPORT.md) — share/save/comment driver analysis
- [CREATOR_BASELINE_ANALYSIS.md](CREATOR_BASELINE_ANALYSIS.md) — features that survive creator control

---

## Decision Framework

A proposed feature earns its place based on three tests:

1. **Evidence test:** Does upstream analysis point to a measurable gap where a mechanism is identified but no feature exists, OR an existing feature shows weak/inverted correlation despite the mechanism clearly mattering?
2. **Extractability test:** Can it be computed from the video file, transcript, caption, or creator metadata — all available pre-publication?
3. **Non-redundancy test:** Does it measure something not already captured by the 106 existing training features, 42 XGBoost features, or the 5-channel hook scorer?

Features that fail any test are marked DROP or DEFER with explanation.

---

## Group 1: Visual / Pacing

### 1.1 `visual_proof_ratio` — KEEP (Priority: 1)

| Property | Value |
|----------|-------|
| **Target signal** | Fraction of video duration showing screen recordings, dashboards, earnings screenshots, or tool UIs vs talking-head frames |
| **Target mechanism** | Trust + Authority. The Signal Ontology identifies that visual proof (showing receipts/dashboards) is the strongest trust signal in the money niche, but is "not measured" (Ontology §3.2). Mega-viral videos underindex on *verbal* authority claims (3.4% vs 11.1%) because they *show* proof instead of claiming it. |
| **Why it matters in this niche** | In side-hustle content, the gap between "I made $50K" (claim) and *showing the Stripe dashboard* (proof) is the gap between a skeptical comment and a save. The Tier Mechanism Profiles identify "proof-over-claim framing" as a key mega-viral mechanism (hypothesis level — this feature would validate it). Save-heavy videos (the dominant response type in mega-viral, 36%) correlate with visual variety (r=+0.281) and scene changes (r=+0.320), both of which proxy for visual proof without measuring it directly. |
| **Extractable pre-pub?** | Yes. Gemini Vision already analyzes frames for Pack V. Extend to classify frame types: talking-head, screen-recording, product-shot, text-overlay, B-roll. Ratio = non-talking-head frames / total frames. |
| **Suggested extraction method** | Sample 8–10 frames evenly across video duration. Send to Gemini Vision with prompt: "Classify this frame as one of: talking_head, screen_recording, dashboard_screenshot, product_demo, text_card, b_roll, other." Compute `visual_proof_ratio = (screen_recording + dashboard_screenshot + product_demo) / total_frames`. Also output `talking_head_ratio` as inverse signal. |
| **Expected risk** | Medium. Gemini Vision classification accuracy on frame types is unvalidated. Misclassification of B-roll as screen recording (or vice versa) would add noise. Mitigation: validate against 50 manually labeled videos before using in pipeline. |
| **Disposition** | **KEEP** |

### 1.2 `pacing_acceleration_score` — DROP

| Property | Value |
|----------|-------|
| **Target signal** | Whether editing pace increases from first half to second half |
| **Why dropped** | Already measured as `scene_rate_first_half_vs_second` (r=+0.15 raw DPS). Creator Baseline Analysis shows it **vanishes** after controlling for creator authority (r=-0.015 deviation). This means pacing acceleration is a style signature of successful creators, not a content-quality signal. Building a new version of a vanished feature is wasted effort. |
| **Disposition** | **DROP** — already measured, already vanished |

### 1.3 `motion_distribution_evenness` — DEFER

| Property | Value |
|----------|-------|
| **Target signal** | Whether motion is distributed evenly across the video or concentrated in bursts |
| **Why deferred** | Plausible that even motion distribution (consistent visual energy) outperforms burst motion (static→active→static). But no upstream analysis compares motion *distribution* to DPS. The existing `ffmpeg_avg_motion` (r=+0.35 raw, r=+0.086 deviation) already captures motion level. Until there's evidence that distribution matters independently of level, this adds complexity without demonstrated value. |
| **Disposition** | **DEFER** — revisit when motion-level variance can be tested against DPS deviation |

---

## Group 2: Subtitles / Overlays

### 2.1 `text_overlay_density` — KEEP (Priority: 3)

| Property | Value |
|----------|-------|
| **Target signal** | Number of distinct text overlay appearances per minute of video (key numbers, URLs, tool names rendered on screen) |
| **Target mechanism** | Save impulse. The Response Stack Report identifies that save-heavy videos correlate with higher visual variety (r=+0.281), scene changes (r=+0.320), and thumb contrast (r=+0.328). The mechanism explanation: text overlays with specific information (tool names, dollar amounts, URLs) signal "you'll need this info later" and trigger the save reflex. The Signal Ontology notes that save impulse has "no feature specifically targeting save prediction" (§3.9). |
| **Why it matters in this niche** | Side-hustle tutorials that put the Etsy URL, the app name, or the earnings number *on screen as text* create reference value. The viewer saves because they can screenshot or return to get that specific detail. The Tier Mechanism Profiles note that the Good→Viral jump requires adding visual variety — text overlays are the lowest-effort way to increase variety score. |
| **Extractable pre-pub?** | Yes. Gemini Vision frame samples can detect on-screen text presence. Alternatively, ffmpeg OCR extraction (tesseract) on sampled frames. |
| **Suggested extraction method** | Sample 8–10 frames across video. For each, detect whether on-screen text (not captions/subtitles) is present. Count distinct text appearances. `text_overlay_density = text_overlay_count / duration_minutes`. Bonus: extract text content to classify as "informational" (numbers, URLs, names) vs "decorative" (emoji, sound effects text). |
| **Expected risk** | Low-medium. Text detection is well-solved. Main risk: confusing platform-generated captions with creator-added text overlays. Mitigation: caption/subtitle text is typically bottom-center with consistent styling; creator text overlays vary in position and style. |
| **Disposition** | **KEEP** |

### 2.2 `caption_spam_score` — DROP

| Property | Value |
|----------|-------|
| **Target signal** | Composite score of emoji density, question density, and CTA density in caption text |
| **Why dropped** | Already measured individually. `text_emoji_count` (r=-0.20), `text_question_mark_count` (r=-0.17), `text_has_cta` (DPS -5.2 points). A composite of three already-measured features adds no new information. XGBoost can learn the interaction effects from the individual features. |
| **Disposition** | **DROP** — redundant composite of existing features |

---

## Group 3: Trust / Authority

### 3.1 `specificity_score` — KEEP (Priority: 2)

| Property | Value |
|----------|-------|
| **Target signal** | Count and density of specific, verifiable details in the transcript: named tools/platforms, exact dollar amounts, specific timeframes, named processes |
| **Target mechanism** | Trust + Utility. The Signal Ontology identifies trust as "poorly measured" (§3.2) and notes that verbal social proof claims *inversely* correlate with DPS (r=-0.10) — meaning vague authority claims hurt. The mechanism: specific details (e.g., "I used Printify to make $347 in my first month") are harder to fake than vague claims ("I make thousands from home"), so they generate more trust. Specificity also drives saves — the viewer needs to reference the exact tool name or number later. |
| **Why it matters in this niche** | The money niche is plagued by vague claims. "I make money online" is noise. "I made $2,847 last month selling print-on-demand mugs on Etsy using Printify" is signal. The Response Stack Report shows `has_money_amount` is overrepresented in both share-heavy (26.2% vs 18.4%) and comment-heavy (24.2%) videos — but the current binary feature doesn't capture *how specific* the amount is or whether it's paired with a named method. |
| **Extractable pre-pub?** | Yes. From Whisper transcript. NER (named entity recognition) for tool/platform names + regex for dollar amounts + timeframe patterns ("per month", "in 30 days", "first week"). |
| **Suggested extraction method** | From transcript text: (1) Count named entities matching a curated list of ~200 common side-hustle platforms/tools (Etsy, Shopify, Printify, Canva, ChatGPT, etc.). (2) Count dollar amounts with specificity bonus (exact like "$2,847" scores higher than round like "$5,000"). (3) Count specific timeframes ("first month", "in 2 weeks"). `specificity_score = (named_tools × 2 + specific_amounts × 3 + timeframes × 1) / duration_seconds × 60`. Normalize per minute. |
| **Expected risk** | Low. All extraction is from transcript text (already available via Whisper). Tool list needs curation but is a one-time effort. Main risk: transcript errors garbling tool names. Mitigation: fuzzy matching against the tool list. |
| **Disposition** | **KEEP** |

### 3.2 `credential_type` — DEFER

| Property | Value |
|----------|-------|
| **Target signal** | What kind of authority the creator claims: result-based ("I made $X"), experience-based ("I've been doing this for 5 years"), credential-based ("certified in X"), teaching-based ("I've helped 200 students") |
| **Why deferred** | The Signal Ontology identifies authority measurement quality as "poor" (§3.3), and the Creator Baseline Analysis shows that `psych_social_proof_count` (which includes credential language) has r=-0.10 raw and *strengthens* slightly to r=+0.068 after creator control. This means credential language matters within-creator (it's a content signal) but is too noisy to measure well. The problem isn't that credential type doesn't matter — it's that we can't reliably classify it from transcript text without high error rates. |
| **Disposition** | **DEFER** — revisit when LLM-based transcript classification can be validated against outcome data |

### 3.3 `hedge_word_density` — KEEP (Priority: 5)

| Property | Value |
|----------|-------|
| **Target signal** | Frequency of uncertainty language in transcript: "maybe", "I think", "probably", "kind of", "sort of", "I guess", "not sure", "might work" |
| **Target mechanism** | Trust (inverse). The Signal Ontology notes that trust in the money niche requires "absence of hedge words" (§3.2 activating signals). The existing `text_negative_word_count` (r=-0.19) captures negative language but not uncertainty language. These are different: "this is terrible" (negative) vs "this might work" (hedging). In the money niche, hedging signals the creator doesn't believe their own advice. |
| **Why it matters in this niche** | Mega-viral creators in this format speak with certainty. "Do this" vs "You could try this." The Tier Mechanism Profiles note that negative language elimination is the key Good→Viral unlock (87% drop). Hedge language is a parallel signal that hasn't been measured. |
| **Extractable pre-pub?** | Yes. Regex against Whisper transcript. Curated list of ~30 hedge phrases. |
| **Suggested extraction method** | Count occurrences of hedge phrases in transcript. `hedge_word_density = hedge_count / word_count`. List: "maybe", "probably", "I think", "I guess", "kind of", "sort of", "might", "could be", "not sure", "I don't know", "possibly", "perhaps", "it depends", "in my opinion", "some people say", "you could try", "it might work", "I'm not certain". |
| **Expected risk** | Low. Simple regex. Risk of false positives ("I think this is the best tool" where "I think" introduces a strong claim). Mitigation: exclude "I think" when followed by superlatives or strong positive language. |
| **Disposition** | **KEEP** |

---

## Group 4: Delivery / Confidence

### 4.1 `vocal_confidence_composite` — KEEP (Priority: 4)

| Property | Value |
|----------|-------|
| **Target signal** | Composite of pitch stability, loudness consistency, and speaking pace steadiness — the vocal markers of a confident speaker |
| **Target mechanism** | Trust + Authority. The Signal Ontology identifies pitch mean (r=+0.19), pitch variance (r=+0.11), loudness variance (r=-0.09), and silence ratio (r=-0.09) as individual trust/authority signals. But Creator Baseline Analysis shows `audio_pitch_mean_hz` **vanishes** (r=+0.022 deviation) and `audio_pitch_variance` **vanishes** (r=-0.028 deviation). However, `audio_loudness_mean_lufs` **survives** (r=-0.093 deviation). The individual signals are noisy; a composite may capture confidence more reliably than any single audio feature. |
| **Why it matters in this niche** | In side-hustle talking-head content, vocal delivery is the primary trust signal — the viewer judges credibility from how the creator sounds before evaluating what they say. A confident, steady delivery ("I did this, here's how") vs a tentative, wavering one ("um, so I think you could maybe try...") determines whether the viewer trusts the advice enough to save or share. |
| **Extractable pre-pub?** | Yes. All components already exist in audio-prosodic-analyzer. This is a composite of existing raw signals: pitch variance (low = confident), loudness variance (low = steady), silence ratio (low = no dead air), speaking pace variance (low = controlled delivery). |
| **Suggested extraction method** | `vocal_confidence_composite = (1 - normalized_pitch_variance) × 0.3 + (1 - normalized_loudness_variance) × 0.3 + (1 - normalized_silence_ratio) × 0.2 + (1 - normalized_pace_variance) × 0.2`. Normalize each component to [0,1] using dataset percentiles. Output range: 0 (tentative, unsteady) to 1 (confident, controlled). |
| **Expected risk** | Low. All raw inputs already exist. Risk: the composite may not correlate with DPS any better than individual components. Mitigation: compute against labeled data before adding to pipeline — if Spearman r (deviation) < 0.10, drop it. |
| **Disposition** | **KEEP** (conditional — validate composite r before pipeline integration) |

### 4.2 `vocal_energy_arc` — DROP

| Property | Value |
|----------|-------|
| **Target signal** | Whether vocal energy (pitch + loudness) increases, decreases, or stays flat across the video |
| **Why dropped** | `audio_pitch_contour_slope` already exists (r=+0.01, not significant). The arc version would be a more nuanced version of an already-null signal. If the linear slope doesn't correlate, a categorized arc is unlikely to either. |
| **Disposition** | **DROP** — elaboration of a null signal |

### 4.3 `filler_word_rate` — DEFER

| Property | Value |
|----------|-------|
| **Target signal** | Frequency of "um", "uh", "like", "you know", "basically", "literally" per minute |
| **Why deferred** | Plausible trust/authority signal — filler words indicate less preparation. But Whisper transcription quality for filler words is unreliable (Whisper often drops "um" and "uh" from transcripts). Until filler word detection can be validated against manual annotation, extraction accuracy is too low to trust. |
| **Disposition** | **DEFER** — revisit when Whisper filler-word recall is validated (or when a dedicated filler detector is available) |

---

## Group 5: Structure / Payoff

### 5.1 `instructional_density` — KEEP (Priority: 2, tied with specificity_score)

| Property | Value |
|----------|-------|
| **Target signal** | Count of explicit instructional steps or actionable directives per minute of video |
| **Target mechanism** | Utility + Save impulse. The Signal Ontology identifies utility as "poorly measured" (§3.6) — the existing `share_utility_score` has r=+0.04 (null). The Response Stack Report identifies save-heavy as the dominant response type in mega-viral (36%) and notes that save-heaviness correlates with duration (60s median) and visual variety. But no feature captures *how many actionable steps* the video contains — which is the core of what makes side-hustle content saveable. |
| **Why it matters in this niche** | The Response Stack Report's "What Drives Saves" section identifies instructional density as the primary save driver (hypothesis level). The Tier Definitions show save-heavy dominance increases with tier: 3.2% of underperformers, 15% of average, 18% of good, 34% of viral, 36% of mega-viral. Instructional density would be the first feature to directly target save prediction in this niche. |
| **Extractable pre-pub?** | Yes. From Whisper transcript. Count imperative sentences ("Go to...", "Click on...", "Open...", "Set up...", "Create...") + sequential markers ("First...", "Then...", "Next...", "Step 1...", "Step 2...") + action verbs in command form. |
| **Suggested extraction method** | From transcript: (1) Count imperative constructions (verb-first sentences with action verbs). (2) Count sequential markers ("first", "second", "then", "next", "finally", "step N"). (3) Count tool-action pairs ("open Canva", "go to Etsy", "click create"). `instructional_density = total_instructions / duration_minutes`. Also output `has_step_structure` (boolean: >= 3 sequential markers). |
| **Expected risk** | Low-medium. Imperative detection from text is well-solved. Risk: conversational imperatives ("listen", "look", "think about it") may inflate count. Mitigation: curate action-verb list specific to side-hustle instruction (create, open, click, set up, sign up, upload, select, type, paste, copy). |
| **Disposition** | **KEEP** |

### 5.2 `hook_payoff_coherence` — DEFER

| Property | Value |
|----------|-------|
| **Target signal** | Whether the video's conclusion delivers on the hook's promise — semantic similarity between opening claim and closing content |
| **Target mechanism** | Payoff satisfaction. The Signal Ontology identifies this as "weakly measured" (§3.12) and notes that `retention_open_loop_count` (r=-0.14) may signal payoff failures (open loops that never close). |
| **Why deferred** | Requires semantic understanding of whether the ending matches the beginning — fundamentally an LLM task. Pack 1 already provides `clear_payoff` (1–10, LLM-scored) but it's not validated against DPS. Before building a new feature for this, first validate whether the existing Pack 1 `clear_payoff` score has predictive value. If Pack 1's LLM assessment doesn't correlate with DPS, a lighter feature won't either — the problem is measurement, not feature engineering. |
| **Disposition** | **DEFER** — first validate Pack 1 `clear_payoff` against DPS deviation. If it shows r > 0.10, skip this feature (Pack 1 already covers it). If null, the mechanism may not be extractable from pre-pub signals at all. |

### 5.3 `content_arc_type` — DROP

| Property | Value |
|----------|-------|
| **Target signal** | Categorical classification of the video's narrative arc: problem→solution, claim→proof, list, story→lesson, challenge→result |
| **Why dropped** | The Format Ontology (§3.9) defines arc types, but no upstream analysis connects arc type to DPS or response type. The 24-styles classifier already captures production format, and the hook-scorer captures opening structure. Arc type would be a semantic feature requiring LLM classification with no evidence that it adds predictive value beyond existing structural features. |
| **Disposition** | **DROP** — no evidence of DPS correlation, LLM dependency for uncertain value |

---

## Group 6: Counterfactual Differentiators

These features target signals that the upstream analysis identified as *surprising* — where the expected direction was wrong, or where a mechanism matters but existing features measure it incorrectly.

### 6.1 `visual_to_verbal_ratio` — KEEP (Priority: 1, tied with visual_proof_ratio)

| Property | Value |
|----------|-------|
| **Target signal** | Ratio of visual-carry time (frames where visuals communicate the message without speech) to verbal-carry time (frames where the creator is talking as the primary content delivery) |
| **Target mechanism** | The fundamental tier-separation mechanism. The Tier Analysis Report shows speaking rate (WPM) has the strongest tier gradient in the entire dataset: 376.8 (underperformer) → 44.2 (mega-viral). This is an 88% reduction. The Tier Mechanism Profiles identify the Viral→Mega-Viral unlock as "stop talking, start showing" (71% WPM reduction needed). |
| **Why it matters in this niche** | This is the single most important content signal we don't have a clean feature for. `speaking_rate_wpm` is a proxy but confounded — a creator who pauses between sentences has low WPM without adding visual content. What actually matters is whether the *non-speaking time is filled with visual content* (screen recordings, demos, B-roll) or is *dead air*. The difference: low WPM with visual content = mega-viral. Low WPM with silence = underperformer. |
| **Why existing features miss this** | `speaking_rate_wpm` (r=-0.169 raw, r=-0.070 deviation) measures verbal density but not visual density. `visual_variety_score` (r=+0.361 raw, r=+0.080 deviation) measures visual complexity but not the *replacement* of talking with showing. Neither captures the counterfactual: "during the time the creator is NOT talking, is the video showing something meaningful?" |
| **Extractable pre-pub?** | Yes. Combine Whisper speech segments (timestamps of when speech occurs) with Gemini Vision frame classification (what's happening visually during non-speech segments). |
| **Suggested extraction method** | (1) From Whisper segments, identify speech windows and non-speech windows. (2) For non-speech windows > 1 second, sample a frame and classify via Gemini Vision: "meaningful visual content" (screen recording, demo, product shot, text card) vs "passive" (static talking head with no speech, black frame, transition). (3) `visual_to_verbal_ratio = meaningful_visual_seconds / total_speech_seconds`. A video where the creator talks for 20s and shows demos for 40s scores 2.0. A video where the creator talks for 50s and has 10s of dead air scores 0.2. |
| **Expected risk** | Medium. Depends on Gemini Vision accuracy for "meaningful visual content" classification and Whisper segment boundary accuracy. Mitigation: validate against 50 manually segmented videos. |
| **Disposition** | **KEEP** |

### 6.2 `curiosity_gap_visual` — DEFER

| Property | Value |
|----------|-------|
| **Target signal** | Whether the video creates curiosity through what it *shows* (partial reveal of results, blurred numbers, quick dashboard flash) rather than what it *says* |
| **Why deferred** | The Signal Ontology identifies that all text-based curiosity features show *negative* DPS correlation (§3.4), suggesting that explicit verbal curiosity-building ("wait for it", "you won't believe") compensates for weak content. The ontology hypothesizes that *visual* curiosity (showing something intriguing rather than saying something intriguing) might be the real mechanism. This is a compelling theory but is purely hypothetical — no data supports it yet. Building a visual curiosity detector requires LLM frame analysis with no validation target. |
| **Disposition** | **DEFER** — revisit when text-vs-visual curiosity can be A/B tested against DPS deviation |

### 6.3 `show_dont_tell_score` — DROP (absorbed by 6.1)

| Property | Value |
|----------|-------|
| **Target signal** | Whether the creator demonstrates rather than describes |
| **Why dropped** | This is conceptually identical to `visual_to_verbal_ratio` (6.1) plus `visual_proof_ratio` (1.1). Building a third feature for the same mechanism is redundant. If 6.1 and 1.1 are both implemented, this signal is fully covered. |
| **Disposition** | **DROP** — redundant with 1.1 + 6.1 |

### 6.4 `anti_spam_signal_score` — DROP

| Property | Value |
|----------|-------|
| **Target signal** | Composite of all signals that correlate with spam/low-effort content: high emoji count, many questions, excessive CTAs, short duration, low resolution |
| **Why dropped** | Same problem as `caption_spam_score` (2.2) — this is a composite of features that already exist individually. `text_emoji_count` (r=-0.20), `text_question_mark_count` (r=-0.17), `text_has_cta` (-5.2 DPS points), resolution (r=+0.28) are all in the pipeline. XGBoost can learn the interaction. A manual composite adds no information. |
| **Disposition** | **DROP** — redundant composite |

---

## Summary Table

| # | Feature | Group | Priority | Disposition | Target Mechanism | Evidence Source |
|---|---------|-------|----------|-------------|-----------------|-----------------|
| 1.1 | `visual_proof_ratio` | Visual/Pacing | **1** | KEEP | Trust + Authority | Signal Ontology §3.2 (visual proof not measured), Tier Mechanism Profiles (proof-over-claim), Response Stack (save-heavy = 36% mega-viral) |
| 1.2 | `pacing_acceleration_score` | Visual/Pacing | — | DROP | Retention | Already measured, vanishes after creator control (r=-0.015) |
| 1.3 | `motion_distribution_evenness` | Visual/Pacing | — | DEFER | Retention | No upstream evidence for distribution vs level |
| 2.1 | `text_overlay_density` | Subtitles/Overlays | **3** | KEEP | Save impulse | Response Stack (save correlation with variety), Signal Ontology §3.9 (no save feature) |
| 2.2 | `caption_spam_score` | Subtitles/Overlays | — | DROP | Trust (inverse) | Redundant with existing individual features |
| 3.1 | `specificity_score` | Trust/Authority | **2** | KEEP | Trust + Utility | Signal Ontology §3.2 (trust poorly measured), Response Stack (has_money_amount overrepresented in share+comment heavy), verbal social proof *inverted* (r=-0.10) |
| 3.2 | `credential_type` | Trust/Authority | — | DEFER | Authority | Too noisy for transcript classification |
| 3.3 | `hedge_word_density` | Trust/Authority | **5** | KEEP | Trust (inverse) | Signal Ontology §3.2 (hedge words as activating signal), Tier Analysis (negative word elimination at Viral tier) |
| 4.1 | `vocal_confidence_composite` | Delivery/Confidence | **4** | KEEP | Trust + Authority | Signal Ontology (multiple audio signals individually weak), Creator Baseline (loudness survives, pitch vanishes — composite may capture what individuals miss) |
| 4.2 | `vocal_energy_arc` | Delivery/Confidence | — | DROP | Emotional congruence | Existing pitch contour slope is null (r=+0.01) |
| 4.3 | `filler_word_rate` | Delivery/Confidence | — | DEFER | Trust (inverse) | Whisper filler detection unreliable |
| 5.1 | `instructional_density` | Structure/Payoff | **2** | KEEP | Utility + Save impulse | Response Stack (save dominance = 36% mega-viral, no save-targeting feature exists), Signal Ontology §3.6 + §3.9 |
| 5.2 | `hook_payoff_coherence` | Structure/Payoff | — | DEFER | Payoff satisfaction | First validate Pack 1 `clear_payoff` before building new feature |
| 5.3 | `content_arc_type` | Structure/Payoff | — | DROP | Retention | No DPS correlation evidence, LLM cost for uncertain value |
| 6.1 | `visual_to_verbal_ratio` | Counterfactual | **1** | KEEP | Visual dominance (core tier mechanism) | Tier Analysis (WPM = strongest tier gradient, 88% reduction), Tier Mechanism Profiles (every tier boundary involves visual-over-verbal shift) |
| 6.2 | `curiosity_gap_visual` | Counterfactual | — | DEFER | Curiosity | Purely hypothetical; text curiosity features are inverted |
| 6.3 | `show_dont_tell_score` | Counterfactual | — | DROP | Trust + Utility | Absorbed by 1.1 + 6.1 |
| 6.4 | `anti_spam_signal_score` | Counterfactual | — | DROP | Trust (inverse) | Redundant composite of existing features |

**Final count:** 6 KEEP, 5 DROP, 5 DEFER

---

## Implementation Dependencies

```
                     ┌──────────────────────┐
                     │   Gemini Vision       │
                     │   frame classifier    │
                     └──────┬───────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
     visual_proof_ratio  text_overlay   visual_to_verbal
         (1.1)          _density (2.1)    _ratio (6.1)
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │ Whisper segment   │
                                    │ timestamps        │
                                    │ (already exists)  │
                                    └──────────────────┘

     ┌───────────────────┐     ┌──────────────────────┐
     │ Whisper transcript │     │ Audio prosodic       │
     │ (already exists)   │     │ analyzer             │
     └───────┬───────────┘     │ (already exists)     │
             │                  └──────────┬───────────┘
      ┌──────┼──────────┐                  │
      ▼      ▼          ▼                  ▼
  specificity  instructional  hedge_word  vocal_confidence
  _score (3.1) _density (5.1) _density    _composite (4.1)
                              (3.3)
```

**Shared dependency:** Features 1.1, 2.1, and 6.1 all require the same Gemini Vision frame classifier. Build the frame classifier once, extract all three features from its output.

**Zero new infrastructure:** Features 3.1, 3.3, 4.1, and 5.1 use only Whisper transcript and audio prosodic data that already exist in the pipeline. They can be implemented as pure computation — no new API calls.

---

## Top 5 Highest-Leverage Pre-Pub Features To Build Next

### 1. `visual_to_verbal_ratio` (Group 6.1)

**Why #1:** This targets the single strongest mechanism in the entire tier system. Speaking rate (WPM) shows an 88% gradient from underperformer (377) to mega-viral (44), making it the most differentiated signal across tiers. But WPM is a crude proxy — it conflates "talking less" with "showing more." A creator who talks less but shows nothing (dead air) is not mega-viral. This feature separates "visual-first demonstration" from "quiet talking head" — the specific mechanism that explains *why* low WPM correlates with high DPS. No existing feature captures this. Implementation shares infrastructure with #2 (Gemini Vision frame classifier).

### 2. `visual_proof_ratio` (Group 1.1)

**Why #2:** The Signal Ontology explicitly identifies visual proof as the strongest trust signal in the money niche and notes it is "not measured." The Tier Mechanism Profiles identify proof-over-claim framing as a key mega-viral mechanism. The Response Stack shows mega-viral side-hustle videos are 36% save-heavy — and saves are driven by reference value, which visual proof creates. This feature directly addresses the largest measurement gap in the trust mechanism. Implementation shares Gemini Vision infrastructure with #1.

### 3. `specificity_score` + `instructional_density` (Groups 3.1 + 5.1, tied)

**Why #3:** These two features are the first to directly target the save-and-utility mechanism — which the Signal Ontology identifies as "poorly measured" (§3.6) and "not directly measured" (§3.9), despite save-heavy being the dominant response type in viral and mega-viral tiers. Both features are pure transcript analysis with zero new API calls — they can be built and validated in a single session using existing Whisper output. Together, they answer: "Does this video tell you exactly what to do, with specific tools and steps?" — the core of what makes side-hustle content saveable.

### 4. `vocal_confidence_composite` (Group 4.1)

**Why #4:** Individual audio features are noisy — pitch mean vanishes after creator control, loudness variance is weak. But the Signal Ontology identifies confident delivery as a key trust mechanism, and trust is the critical bottleneck in money content. A composite may capture what individuals miss. Low implementation cost (all raw inputs exist). Conditional: validate composite r(deviation) > 0.10 before pipeline integration.

### 5. `hedge_word_density` (Group 3.3)

**Why #5:** Low cost, high signal-to-noise potential. The Tier Mechanism Profiles show that the Good→Viral boundary requires eliminating negative language (r=-0.19). Hedge language is a parallel trust-eroding signal that is not currently measured. In side-hustle content, "maybe try this" vs "do this" is a meaningful credibility difference. Trivial to extract (regex on transcript). Low risk of failure. Even if correlation is modest, the feature costs almost nothing to build.

---

### Implementation Order

Build in two waves:

**Wave 1 (transcript-only, no new API calls):**
- `specificity_score` (3.1)
- `instructional_density` (5.1)
- `hedge_word_density` (3.3)
- `vocal_confidence_composite` (4.1)

**Wave 2 (requires Gemini Vision frame classifier):**
- Gemini Vision frame classifier (shared infrastructure)
- `visual_proof_ratio` (1.1)
- `visual_to_verbal_ratio` (6.1)
- `text_overlay_density` (2.1)

Wave 1 can ship immediately. Wave 2 depends on building and validating the frame classifier.

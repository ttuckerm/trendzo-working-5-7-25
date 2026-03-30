# Signal Ontology: Creator-Led Short-Form (Side Hustles / Making Money Online)

> Three-layer ontology distinguishing **observed signals**, **latent mechanisms**, and **model features** for direct-to-camera, talking-head knowledge content in the side hustles / making money online niche.
>
> Companion to [FORMAT_ONTOLOGY.md](FORMAT_ONTOLOGY.md). That document defines the structural *vocabulary* of the format. This document defines the *causal and measurement model* — what we observe, what we infer, and what we feed into predictions.

---

## 1. Definitions

| Term | Definition |
|---|---|
| **Signal** | A directly observable property of a video or its environment. A signal exists in the video itself (or its metadata) and can be measured without inference. Examples: scene change count, speaking rate, face presence in frame 1. |
| **Mechanism** | A latent psychological or behavioral process in the viewer that a signal activates. Mechanisms are never directly observed — they are inferred from the relationship between signals and outcomes. Examples: trust, curiosity, attention capture. |
| **Feature** | A numeric or categorical value computed from one or more signals, formatted for consumption by a model or scoring component. A feature is an engineering artifact that *represents* a signal. The same signal can produce multiple features; a single feature can blend multiple signals. |
| **Pre-pub** | Measurable before the video is published. Extracted from the video file, transcript, caption, and creator metadata. The pipeline's operational domain. |
| **Post-pub** | Observable only after publication. Requires platform engagement data: views, likes, shares, comments, saves, completion rate, follower growth. Used for ground-truth labeling (DPS), not prediction. |
| **Endogenous** | Originating from within the video itself — its content, production, and structure. Endogenous signals are what the creator controls. |
| **Exogenous** | Originating from outside the video — the creator's account size, platform algorithm state, posting time, trend momentum, competitor activity. Exogenous signals are context the creator cannot change per-video. |

### Why these distinctions matter

The prediction pipeline's job is to estimate post-pub outcomes from pre-pub signals. Every design decision requires knowing:
1. Is this a **signal** (observable) or a **mechanism** (inferred)?
2. Is it **pre-pub** (actionable) or **post-pub** (ground truth)?
3. Is it **endogenous** (creator-controllable) or **exogenous** (context)?
4. Which **feature(s)** currently represent it, if any?

Confusing signals with mechanisms leads to circular reasoning ("the video went viral because it had high virality"). Confusing features with signals leads to overfitting artifacts rather than real properties.

---

## 2. Observed Signals

Every signal below is directly observable from the video file, its metadata, or its post-publication performance data. No inference required.

### 2.1 Pre-Publication Endogenous Signals

These are properties of the video itself. The creator controls them.

#### 2.1.1 Visual / Production Signals

| Signal | What it is | Unit/Range | Why it matters for this format | Current measurement status |
|---|---|---|---|---|
| **Scene change count** | Number of distinct cuts/transitions in the video | int, 0–100+ | #1 content predictor of DPS (r=+0.38). Editing intensity is the single strongest endogenous signal. Mega-viral videos average 10.4 cuts vs 1.0 for underperformers. | Measured. `ffmpeg_scene_changes` via FFmpeg scene filter in `ffmpeg-canonical-analyzer.ts`. |
| **Cuts per second** | Scene changes normalized by duration | float, 0–1+ | Controls for duration; separates "long video with few cuts" from "short video with few cuts". | Measured. `ffmpeg_cuts_per_second` derived in canonical analyzer. |
| **Average motion intensity** | Mean pixel displacement across frames | float, 0–1 | Motion = visual energy. Top videos have 5.7x more motion than underperformers. In talking-head format, motion comes from gestures, camera movement, and B-roll intercuts. | Measured. `ffmpeg_avg_motion` from signalstats variance proxy. |
| **Resolution** | Pixel dimensions (width × height) | int | 1080p+ correlates with higher DPS (r=+0.28). Proxy for production investment — phone selfie vs. proper camera setup. | Measured. `ffmpeg_resolution_width`, `ffmpeg_resolution_height`. |
| **Frame rate** | Frames per second | float, 24–60 | Higher FPS (37+ vs 30) correlates with DPS (r=+0.21). Smoother video signals professional production. | Measured. `ffmpeg_fps`. |
| **Contrast** | Luminance difference range | float, 0–1 | High contrast grabs attention in scroll feeds. Top videos 70% more contrasted than underperformers (r=+0.26). | Measured. `ffmpeg_contrast_score` (YDIF from signalstats). |
| **Color saturation** | Average color intensity | float, 0–1 | Vibrancy signal. Weak independent correlation (r=+0.02) — likely confounded with contrast. | Measured. `ffmpeg_color_variance` (SATAVG). |
| **Brightness** | Average luminance | float, 0–1 | No significant correlation (r=-0.04). Not a useful signal in isolation for this format. | Measured. `ffmpeg_brightness_avg` (YAVG). |
| **Bitrate** | Encoding quality | int, kbps | No significant correlation (r=+0.01). Modern platforms re-encode, so source bitrate is noise. | Measured. `ffmpeg_bitrate`. |
| **Thumbnail/first-frame contrast** | Contrast of the opening frame | int, 0–100 | Scroll-stop signal. r=+0.26, nearly identical to full-video contrast. | Measured. `thumb_contrast` in `thumbnail-analyzer.ts`. |
| **Thumbnail brightness** | Luminance of opening frame | int, 0–255 | No significant correlation (r=-0.04). | Measured. `thumb_brightness`. |
| **Thumbnail color saturation** | Color intensity of opening frame | int, 0–100 | No significant correlation (r=+0.02). | Measured. `thumb_colorfulness`. |
| **Face present in hook** | Whether a human face appears in the first frame(s) | binary | Expected to be critical for creator-led format, but current data shows no DPS correlation (r=-0.02, p=0.65). 86% of all videos in sample have face present, so low variance may explain null result. | Measured. `hook_face_present` via Gemini Vision in `vision-hook-features.ts`. |
| **Text overlay in hook** | Whether on-screen text appears in opening frame(s) | binary | Weak positive but not significant (r=+0.02, p=0.55). 98% of videos have text overlay — near-zero variance. | Measured. `hook_text_overlay` via Gemini Vision. |
| **Hook composition quality** | Visual arrangement of opening frame elements | float, 0–100 | Borderline significance (r=+0.06, p=0.06). Gemini Vision + rule-based blend. | Measured. `hook_composition_score`. |
| **Hook emotion intensity** | Facial expression intensity in opening frame | float, 0–100 | Not significant (r=+0.03, p=0.45). Gemini Vision extraction. | Measured. `hook_emotion_intensity`. |
| **Scene rate acceleration** | Whether editing pace increases (first half vs second half) | float, -1 to +1 | Accelerating editing pace correlates with higher DPS (r=+0.15). Videos that "speed up" retain better than those that slow down. | Measured. `scene_rate_first_half_vs_second` in `ffmpeg-segment-features.ts`. |
| **Visual variety** | Composite measure of visual complexity across timeline | float, 0–100 | 2nd strongest content signal (r=+0.36). Measures how much the visual content changes — monotonous talking head scores low, intercut with proof/B-roll scores high. | Measured. `visual_variety_score` in `ffmpeg-segment-features.ts`. |

#### 2.1.2 Audio / Vocal Signals

| Signal | What it is | Unit/Range | Why it matters | Current measurement status |
|---|---|---|---|---|
| **Pitch mean** | Average fundamental frequency of voice | float, Hz | Higher pitch correlates with DPS (r=+0.19). In money content, higher pitch signals energy and excitement without crossing into "scam hype" territory. | Measured. `audio_pitch_mean_hz` in `audio-prosodic-analyzer.ts`. |
| **Pitch variance** | How much pitch changes throughout | float | Vocal expressiveness. Significant positive correlation (r=+0.11). Monotone delivery underperforms. | Measured. `audio_pitch_variance`. |
| **Pitch range** | Max pitch minus min pitch | float, Hz | Related to expressiveness (r=+0.13). | Measured. `audio_pitch_range`. |
| **Pitch contour slope** | Whether pitch trends upward or downward over the video | float | Rising pitch = building energy. No significant correlation as currently measured (r=+0.01). | Measured. `audio_pitch_contour_slope`. |
| **Loudness mean** | Average loudness (LUFS) | float, -40 to 0 | Louder (less negative) correlates with DPS (r=+0.11). Confident, well-recorded audio. | Measured. `audio_loudness_mean_lufs`. |
| **Loudness variance** | Dynamic range in loudness | float | Significant negative correlation (r=-0.09). Consistent loudness > dramatic volume swings for this format. | Measured. `audio_loudness_variance`. |
| **Silence ratio** | Fraction of audio that is silent | float, 0–1 | More silence = lower DPS (r=-0.09). Dead air kills retention in short-form. | Measured. `audio_silence_ratio`. |
| **Silence count** | Number of distinct silence segments | int | More pauses = lower DPS (r=-0.09). | Measured. `audio_silence_count`. |
| **Hook loudness ratio** | Loudness of first 3 seconds vs rest | float | How much the hook "pops" acoustically. Used in hook scorer audio channel. | Measured. Via `hook-scorer.ts` audio channel input. |
| **Hook pitch ratio** | Pitch of first 3 seconds vs rest | float | Higher-pitch hook = urgency/excitement signal. | Measured. Via `hook-scorer.ts` audio channel input. |
| **Speaking rate (WPM)** | Words per minute | float, 100–400 | Negative correlation (r=-0.16). Counter-intuitive: *slower* speaking correlates with higher DPS. Mega-viral creators average 44 WPM vs 377 WPM for underperformers — because top videos are visual-dominant with sparse narration. | Measured. `speaking_rate_wpm` in `speaking-rate-analyzer.ts`. |
| **Hook WPM ratio** | Speaking rate in hook vs rest of video | float | Faster hook delivery signals urgency. Used in hook scorer pace channel. | Measured. Via `hook-scorer.ts` pace channel. |
| **Music presence** | Whether a music bed exists | float, 0–1 | Used in hook scorer tone channel. No independent DPS correlation measured. | Partially measured. `musicRatio` in tone channel input. |
| **Energy level** | Overall audio energy classification | categorical | High/medium/low. Used in hook scorer tone channel. | Partially measured. `energyLevel` in tone channel input. |

#### 2.1.3 Text / Transcript Signals

| Signal | What it is | Unit/Range | Why it matters | Current measurement status |
|---|---|---|---|---|
| **Word count** | Total words in transcript | int | Negative correlation (r=-0.12). Fewer words = higher DPS. Reinforces that visual-dominant content outperforms word-heavy lectures. | Measured. `text_word_count`. |
| **Transcript length** | Character count | int | Negative (r=-0.18). Redundant with word count. | Measured. `text_transcript_length`. |
| **Sentence count** | Number of sentences | int | Negative (r=-0.12). | Measured. `text_sentence_count`. |
| **Question mark count** | Count of ? in transcript | int | Negative (r=-0.17). Questions in transcript correlate with lower DPS — possibly because question-heavy content is tentative rather than authoritative. | Measured. `text_question_mark_count`. |
| **Exclamation count** | Count of ! | int | No significant correlation (r=+0.02). | Measured. `text_exclamation_count`. |
| **Unique word ratio** | Vocabulary richness | float, 0–1 | Positive (r=+0.11). Richer vocabulary = more value density. | Measured. `text_unique_word_ratio`. |
| **Average word length** | Characters per word | float | No significant correlation (r=-0.05). | Measured. `text_avg_word_length`. |
| **Average sentence length** | Words per sentence | float | No significant correlation (r=-0.05). | Measured. `text_avg_sentence_length`. |
| **Flesch reading ease** | Readability score | float | No significant correlation (r=+0.05). | Measured. `text_flesch_reading_ease`. |
| **Emoji count (caption)** | Emojis in the post caption | int | Negative (r=-0.20). Top videos use 4x fewer emojis. In money niche, emoji-heavy captions signal amateur/spammy content. | Measured. `text_emoji_count`. |
| **Negative word count** | Words like "hate", "worst", "terrible" | int | Negative (r=-0.19). Top 50 videos have literally zero negative words. Negativity signals complaint content, not opportunity content. | Measured. `text_negative_word_count`. |
| **CTA presence** | Whether transcript contains CTA keywords | binary | Videos *with* CTAs average 5.2 DPS points *lower* (46.0 vs 51.2, p<0.001). Counter-intuitive: explicit CTAs may signal lower production quality or desperation. | Measured. `text_has_cta`. |
| **Open loop count** | "Wait for it", "here's why", "stay till the end" phrases | int | Negative (r=-0.14). Surprising: open-loop phrases correlate with *lower* DPS. Possibly because heavy open-looping signals the creator is compensating for weak content. | Measured. `retention_open_loop_count` in `content-strategy-features.ts`. |
| **Power word density** | Urgency/exclusivity/desire/fear words per total words | float, 0–1 | No significant correlation (r=-0.007). Power words are noise in this niche. | Measured. `psych_power_word_density`. |
| **Direct address ratio** | Second-person "you/your" as fraction of all words | float, 0–1 | Weak negative (r=-0.09). Unexpected: more "you" language slightly correlates with lower DPS. Possibly: best performers show rather than tell, using less direct address. | Measured. `psych_direct_address_ratio`. |
| **Social proof count** | References to numbers, credentials, testimonials | int | Weak negative (r=-0.10). Verbal social proof claims may correlate with lower production quality. Visual proof (receipts) likely matters more but is harder to extract from text. | Measured. `psych_social_proof_count`. |
| **Curiosity gap score** | Contrarian/secret/unusual claim patterns | float, 0–100 | Weak negative (r=-0.07). | Measured. `psych_curiosity_gap_score`. |
| **Relatability score** | POV/relatable moment patterns | float, 0–100 | Not significant (r=-0.06). | Measured. `share_relatability_score`. |
| **Utility score** | Step-by-step/tip/hack patterns | float, 0–100 | Not significant (r=+0.04). | Measured. `share_utility_score`. |
| **Hook text pattern** | Which of 10 hook types the opening text matches | categorical | Significant (r=+0.10 for encoded type). The *type* of hook matters, though the encoded ordinal correlation is modest. | Measured. `hook_type` / `hook_type_encoded` in `hook-scorer.ts`. |

#### 2.1.4 Structural Signals

| Signal | What it is | Why it matters | Current measurement status |
|---|---|---|---|
| **Video duration** | Length in seconds | Longer videos (90s+) have higher avg DPS (54.7 vs 43.1 for <15s). r=+0.19. In money content, longer = more room for proof and teaching. | Measured. `meta_duration_seconds`. |
| **Words per second** | Speaking density | Negative (r=-0.16). Sparse narration + visual content outperforms word-dense monologues. | Measured. `meta_words_per_second`. |
| **Hook type** | Categorical: question, list_preview, contrarian, myth_bust, statistic, authority, result_preview, personal_story, problem_identification, urgency | Different hooks activate different mechanisms. Credibility-signal hooks (statistic, authority, result_preview) are specific to money niche trust dynamics. | Measured. `hook-scorer.ts` text channel, 10-type taxonomy. |
| **Hook cluster** | Psychological grouping of hook type: Curiosity Trigger, Cognitive Challenge, Credibility Signal, Emotional Connection, Urgency/Scarcity | Higher-level classification. Maps to FORMAT_ONTOLOGY §3.1. | Measured. Derived from `HOOK_CLUSTERS` in `system-registry.ts`. |
| **Video style** | Classification into 24 production styles (talking-head, green-screen, PIP walkthrough, etc.) | Determines pacing expectations, platform fit, production complexity norms. | Partially measured. `24-styles-classifier.ts` (hybrid keyword + optional LLM). Currently disabled at runtime. |

### 2.2 Pre-Publication Exogenous Signals

These are context signals outside the video itself.

| Signal | What it is | Why it matters | Current measurement status |
|---|---|---|---|
| **Creator follower count** | Account followers at time of posting | Strongest single predictor of DPS (r=+0.49). Mega-viral videos average 463K followers vs 21K for underperformers. This is distribution advantage, not content quality. **Deliberately excluded from XGBoost** to keep the model content-focused. | Measured in training data. `meta_creator_followers`. Excluded from prediction model. |
| **Creator stage** | New / growing / established / expert | Affects what kind of advice is credible and what production quality is expected. | Modeled. `creator-context.ts:CreatorContext.creatorStage`. Used in `/api/creator/predict` path only. |
| **Creator niche history** | Past content topics and performance | Whether the creator has authority in side hustles specifically. | Not measured. Would require historical channel analysis. |
| **Posting time** | Day of week / hour of day | Platform-dependent reach dynamics. | Component exists (`posting-time-optimizer`) but is **disabled** — content-independent, zero prediction power. |
| **Trend momentum** | Whether the topic/hashtag is trending | Riding a trend amplifies distribution. | Component exists (`trend-timing-analyzer`) but is **disabled** — content-independent. |
| **Platform algorithm state** | Current platform-wide engagement patterns | Unmeasurable and uncontrollable. | Not measured. Unmeasurable. |
| **Competitive density** | How many similar videos are being posted simultaneously | Affects relative performance. | Not measured. Would require real-time platform data. |

### 2.3 Post-Publication Signals

These signals become observable only after the video is published. They are the **ground truth** that pre-pub signals attempt to predict.

| Signal | What it is | Why it matters | Current measurement status |
|---|---|---|---|
| **View count** | Total views | Primary reach metric. Used to compute DPS. | Collected via Apify scraping. Stored in `prediction_runs`. |
| **Like count** | Total likes | Approval signal. Component of engagement rate. | Collected via Apify. |
| **Comment count** | Total comments | Engagement depth signal. High-comment videos get algorithmic boost. | Collected via Apify. |
| **Share count** | Total shares | Distribution amplification signal. Strongest algorithmic signal on TikTok. | Collected via Apify. |
| **Save/bookmark count** | Total saves | Utility signal — viewer found it valuable enough to return to. Strongest signal for educational content. | Collected via Apify. |
| **Completion rate** | % of viewers who watched to the end | Retention quality. Directly fed to recommendation algorithm. | Not directly measured — platform API doesn't expose. Inferred from view/engagement ratios. |
| **Follower conversion rate** | New followers per view | Creator authority signal — viewer trusts enough to follow. | Not measured. Would require creator analytics API access. |
| **Comment sentiment** | Positive/negative/question ratio in comments | Whether viewers believed the claims, found value, or called BS. Critical for money niche where scam accusations are common. | Not measured. |
| **DPS (Dynamic Percentile Score)** | Percentile ranking of actual performance within niche/platform cohort | The system's primary outcome metric. Computed from views/engagement relative to niche baseline. | Computed post-collection. Stored in `vps_evaluation` table. The ground truth the pipeline predicts against. |

---

## 3. Latent Mechanisms

Mechanisms are not directly observable. They are psychological or behavioral processes in the viewer that *cause* the relationship between pre-pub signals and post-pub outcomes. Each mechanism is activated by specific signals and produces specific viewer behaviors.

The causal chain: **Signal → Mechanism → Viewer Behavior → Post-pub Outcome**

### 3.1 Attention Capture

| Property | Value |
|---|---|
| **Layer** | Mechanism (latent) |
| **Definition** | The viewer's scroll is arrested in the first 0.5–1.5 seconds. The video wins the competition for initial attention against infinite scroll alternatives. |
| **Why it matters** | If attention is not captured, nothing else matters. This is the gatekeeper mechanism — it determines whether any other mechanism gets activated. In the money niche, attention capture competes against high skepticism ("another get-rich-quick scam"). |
| **Position in causal chain** | First. Pre-pub signals → Attention Capture → (all other mechanisms). |
| **Activating signals** | Thumbnail/hook contrast (+0.26), face presence in hook, text overlay in hook, hook composition score, hook scene changes, hook loudness ratio, hook pitch ratio, hook type (especially `result_preview`, `statistic`, `contrarian`). |
| **Resulting viewer behavior** | Viewer stops scrolling and begins watching. Measurable post-pub as initial view count / impression count (not currently accessible). |
| **Current features** | `hook_score` (fused 5-channel, r=+0.10), `thumb_contrast` (r=+0.26), `hook_composition_score` (r=+0.06), `hook_face_present` (r=-0.02, null). Pack V `visual_hook_score`. |
| **Correlation evidence** | `thumb_contrast` r=+0.26 (p<0.001), `hook_score` r=+0.10 (p<0.01). The hook score is surprisingly modest — visual first-frame signals (contrast, resolution) matter more than hook text pattern for scroll-stop. |
| **Measurement quality** | Partially covered. Visual scroll-stop signals (contrast, resolution) are well-measured. Hook content analysis is measured but weakly correlated. The actual scroll-stop rate (impressions → views) is **not accessible**. |

### 3.2 Trust

| Property | Value |
|---|---|
| **Layer** | Mechanism (latent) |
| **Definition** | The viewer believes the creator is credible and the claims are likely true. In the money niche, trust is the critical bottleneck — viewers are conditioned to expect scams and exaggeration. |
| **Why it matters** | Without trust, the viewer either stops watching (low completion) or watches with hostile intent (negative comments, no follow/save). Trust is what separates "interesting claim" from "actionable advice". |
| **Position in causal chain** | Second (after attention capture). Activated by authority signals and proof. Prerequisite for utility, save impulse, and share impulse. |
| **Activating signals** | Authority hook type, social proof count, specific numbers in transcript, credential language, dashboard/receipt visuals (visual proof), speaker confidence (pitch mean, loudness consistency), absence of hedge words, absence of negative language. |
| **Resulting viewer behavior** | Higher completion rate, positive comments, follows, saves, shares. Absence of trust produces hostile comments, reports, unfollows. |
| **Current features** | `psych_social_proof_count` (r=-0.10, **inverted** — verbal social proof claims may signal lower quality), `text_negative_word_count` (r=-0.19, negative language erodes trust), `audio_pitch_mean_hz` (r=+0.19, confident delivery), `audio_loudness_variance` (r=-0.09, consistent loudness = steady confidence). Pack 1 `hook.type` when classified as `authority`, `statistic`, or `claim`. |
| **Correlation evidence** | No single feature cleanly measures trust. The negative correlations are informative: negative words (r=-0.19) and explicit social proof phrases (r=-0.10) both *hurt* DPS. This suggests that trust in this format comes from *showing* (visual proof, production quality) rather than *telling* (verbal claims). |
| **Measurement quality** | Poorly measured. Text-based trust cues are captured but show inverted or null correlations. Visual proof detection (the strongest trust signal) requires semantic video understanding beyond current capabilities. Hedge word detection, specificity of numbers, and credential parsing are not discrete features. |

### 3.3 Authority

| Property | Value |
|---|---|
| **Layer** | Mechanism (latent) |
| **Definition** | The viewer perceives the creator as having earned the right to teach on this topic — through results, experience, or demonstrated competence. Distinct from trust (which is about *believing the claims*); authority is about *accepting the speaker's standing*. |
| **Why it matters** | In money content, authority determines whether advice is actionable or dismissible. A creator showing a Stripe dashboard with $50K MRR has authority on "how to make money with X". A creator with no proof is just another talking head. |
| **Position in causal chain** | Parallel with trust, feeds into it. Signals → Authority → Trust → Completion + Action. |
| **Activating signals** | Result preview hooks, dashboard/receipt visuals, credential language ("I've helped 200+ students"), follower count (exogenous), production quality (resolution, editing intensity — signals investment/professionalism), case study structure. |
| **Resulting viewer behavior** | Viewer accepts claims without pushback, follows for more, shares as "expert content", saves for reference. |
| **Current features** | `hook_type` = `authority` / `result_preview` / `statistic` (categorical, in hook scorer). `meta_creator_followers` (r=+0.49, strongest signal, but exogenous and excluded from XGBoost). Production quality proxies: `ffmpeg_resolution_height` (r=+0.28), `ffmpeg_fps` (r=+0.21). |
| **Correlation evidence** | Creator follower count is the strongest overall predictor (r=+0.49), which is fundamentally an authority signal — large audience *is* social proof of authority. Among content signals, production quality (resolution, fps, editing) serves as an authority proxy. |
| **Measurement quality** | Poorly measured as a content signal. The strongest authority indicator (follower count) is exogenous. Content-level authority (proof style, credential claims, result demonstrations) has no discrete feature. The hook taxonomy captures authority *hooks* but not sustained authority through the video. |

### 3.4 Curiosity

| Property | Value |
|---|---|
| **Layer** | Mechanism (latent) |
| **Definition** | An information gap the viewer wants closed. The video creates a question in the viewer's mind and promises an answer — the viewer keeps watching to resolve the gap. |
| **Why it matters** | Curiosity is the primary retention mechanism for the first 5–15 seconds. It bridges the gap between attention capture (scroll-stop) and value delivery. In money content, curiosity is activated by income claims ("I make $X"), contrarian claims ("everyone is wrong about Y"), and list previews ("3 side hustles nobody talks about"). |
| **Position in causal chain** | Immediately after attention capture. Curiosity sustains viewing through the middle of the video. Resolves into satisfaction (payoff) or frustration (bait). |
| **Activating signals** | Question hooks, contrarian hooks, list preview hooks, open loop phrases, curiosity gap language ("secret", "nobody talks about", "what nobody tells you"), result preview hooks (showing the end state before the method). |
| **Resulting viewer behavior** | Higher completion rate (viewer watches to learn the answer). If satisfied: save, share. If frustrated: negative comment, unfollow. |
| **Current features** | `psych_curiosity_gap_score` (r=-0.07, weak negative — **surprising**), `retention_open_loop_count` (r=-0.14, negative — open loop phrases hurt), `hook_type` when = `question`, `list_preview`, `contrarian`, `myth_bust`. Pack 1 `curiosity_gaps` attribute (1–10, LLM-scored). Pack 3 `Curiosity Gap` mechanic. |
| **Correlation evidence** | Counter-intuitive: all text-based curiosity signals show *negative* DPS correlation. This likely means that heavy verbal curiosity-building compensates for weak visual content. The best videos don't *talk about* being curious — they *show* something that creates curiosity visually. |
| **Measurement quality** | Partially measured but likely measuring the wrong thing. Text-pattern curiosity detection captures *explicit* curiosity language, which inversely correlates with quality. *Implicit* curiosity (created by what's shown, not what's said) is not measured. |

### 3.5 Clarity

| Property | Value |
|---|---|
| **Layer** | Mechanism (latent) |
| **Definition** | The viewer can follow the teaching and understands what the creator is saying. Low clarity creates confusion; high clarity enables value extraction. |
| **Why it matters** | Money content must be actionable. If the viewer doesn't understand the side hustle, they can't act on it. Clarity is the bridge between information transfer and perceived utility. |
| **Position in causal chain** | Mid-video. Curiosity gets them watching; clarity determines if the teaching lands. Clarity → Utility → Save/Share impulse. |
| **Activating signals** | Speaking rate (slower is clearer), sentence structure (shorter sentences), unique word ratio (richer vocabulary can both help and hurt), visual variety (visual aids clarify), text overlays (reinforce spoken words), numbered/step structure. |
| **Resulting viewer behavior** | Viewer can summarize the key takeaway. Leads to saves (for later reference) and shares (confident enough to recommend). Low clarity → early drop-off or re-watch (which may still boost metrics). |
| **Current features** | Pack 1 `clarity` score (1–10, LLM-judged). `text_unique_word_ratio` (r=+0.11). `speaking_rate_wpm` (r=-0.16, slower = higher DPS). `visual_variety_score` (r=+0.36, visual aids improve understanding). `text_avg_sentence_length` (r=-0.05, not significant). |
| **Correlation evidence** | Slower speaking rate and higher visual variety both correlate with DPS. This aligns: clear money content is *shown* (demonstrations, receipts, screen walks) more than *told* (rapid monologue). The Pack 1 LLM clarity score has no Spearman data against DPS (LLM scores are not in the correlation report). |
| **Measurement quality** | Weakly measured. Pack 1 provides an LLM clarity judgment, but it has no validated correlation with outcomes. Text readability features (Flesch, sentence length) show null correlations. The strongest clarity signals may be visual (text overlays, visual aids) rather than textual. |

### 3.6 Utility

| Property | Value |
|---|---|
| **Layer** | Mechanism (latent) |
| **Definition** | The viewer perceives the content as practically useful — they can take action based on what they learned. Distinct from clarity (understanding) and value density (information richness): utility is about *applicability*. |
| **Why it matters** | Utility is the #1 driver of saves in educational content. In the money niche, utility means the viewer can go start the side hustle, follow the steps, or use the tool. High utility content is the foundation of creator monetization (courses, templates, coaching). |
| **Position in causal chain** | Late-video. Clarity enables understanding → Utility is the "I can use this" judgment → Save impulse + Follow impulse. |
| **Activating signals** | Step-by-step structure, specific tool/platform names, exact dollar figures, concrete examples, live demonstrations, template/framework references, imperative language ("do this", "go here"). |
| **Resulting viewer behavior** | Save/bookmark (dominant behavior). Comment asking for more details. Follow for future utility. Share to someone specific ("you need to see this"). |
| **Current features** | `share_utility_score` (r=+0.04, not significant). Pack 1 `value_density` (1–10, LLM-scored). Pack 1 `idea_legos.lego_2` (audience relevance). |
| **Correlation evidence** | The text-pattern utility score has zero DPS correlation. This does not mean utility doesn't matter — it means the regex patterns ("step 1", "how to", "tip") don't capture it. Utility likely manifests in *what* is taught and *how specifically*, which requires semantic understanding. |
| **Measurement quality** | Poorly measured. Pattern-matching captures surface utility language but doesn't capture actual practical value. Whether a side hustle tutorial is genuinely useful requires domain knowledge and semantic understanding beyond current feature extraction. |

### 3.7 Emotional Congruence

| Property | Value |
|---|---|
| **Layer** | Mechanism (latent) |
| **Definition** | The emotional tone of the video matches the emotional need of the target viewer. In money content, the dominant emotional arc is: frustration/dissatisfaction → hope/excitement → confidence/motivation. |
| **Why it matters** | If the emotional tone is wrong (e.g., hype energy on a topic that needs calm authority, or calm delivery on a topic that needs urgency), the viewer feels a mismatch and disengages. Congruence is subtle — it's not about "be emotional" but "be the right kind of emotional". |
| **Position in causal chain** | Parallel throughout. Emotional congruence is a sustaining mechanism — it keeps the viewer in a receptive state while trust, clarity, and utility do their work. |
| **Activating signals** | Audio pitch patterns (matching content emotional arc), delivery energy level, facial expressions, direct address ("you"), personal story elements, absence of negative language. |
| **Resulting viewer behavior** | "This person gets it" feeling. Comments like "this is exactly what I needed". Higher completion rate. Share to friends in similar situation. |
| **Current features** | Pack 1 `emotional_journey` (1–10, LLM-scored). `hook_emotion_intensity` (r=+0.03, not significant). `audio_pitch_mean_hz` (r=+0.19) and `audio_pitch_variance` (r=+0.11) capture vocal expressiveness but not emotional *appropriateness*. Pack 3 `Emotional Trigger` mechanic. |
| **Correlation evidence** | No feature directly measures congruence (match between emotional tone and content topic). Individual emotional signals (pitch, expression) show modest correlations. The mechanism is inherently relational — it depends on the topic/audience pair, not the emotion in isolation. |
| **Measurement quality** | Poorly measured. Individual emotional signals are captured, but congruence (the *match* between tone and content) is not. Would require a model that understands what emotional tone is *appropriate* for each money-niche subtopic. |

### 3.8 Share Impulse

| Property | Value |
|---|---|
| **Layer** | Mechanism (latent) |
| **Definition** | The viewer wants to send or repost the video to someone specific, or broadcast it to signal their own identity. Sharing is the most powerful distribution mechanism — it moves the video to new audiences the algorithm hasn't yet served. |
| **Why it matters** | Shares are the strongest algorithmic signal on TikTok. A shared video gets exponentially more distribution. In money content, share impulse is driven by: "my friend needs to see this" (utility sharing), "I'm the kind of person who knows this" (identity sharing), or "this is outrageous/surprising" (reaction sharing). |
| **Position in causal chain** | Post-completion (mostly). Viewer finishes video → evaluates share-worthiness → shares. Some shares happen mid-video if the hook alone is striking enough. |
| **Activating signals** | High utility (shareable to someone who needs it), contrarian/surprising claims (reaction-worthy), specific identity appeal (see FORMAT_ONTOLOGY §3.5), relatability language ("this is so true"), visual proof (receipt/dashboard screenshots are shareable as images). |
| **Resulting viewer behavior** | Direct message share, repost, duet/stitch. Measurable post-pub as share count. |
| **Current features** | `share_relatability_score` (r=-0.06, not significant). `share_utility_score` (r=+0.04, not significant). Pack 1 `shareability` (1–10, LLM-scored). |
| **Correlation evidence** | Neither text-pattern share feature correlates with DPS. This is a measurement failure, not evidence that shareability doesn't matter. The features capture explicit share-bait language, which is probably anti-correlated with actual share behavior (the best-shared content doesn't say "share this"). |
| **Measurement quality** | Badly measured. Share impulse is fundamentally about the content's social function (identity signaling, utility forwarding, reaction provoking) — none of which is captured by keyword matching. The post-pub share count exists in training data but is blended into DPS rather than modeled directly. |

### 3.9 Save Impulse

| Property | Value |
|---|---|
| **Layer** | Mechanism (latent) |
| **Definition** | The viewer wants to return to this content later — to follow the steps, reference the information, or revisit the proof. Saves indicate the viewer found durable value. |
| **Why it matters** | Save rate is the strongest engagement metric for educational/knowledge content on all platforms. In money content, saves indicate the viewer intends to *act* on the advice — the highest-value outcome for the creator. Saves also signal the algorithm that content has long-term value. |
| **Position in causal chain** | End-of-video or immediately after. Utility + Clarity → "I want this for later" → Save. High utility, concrete steps, and specific tool/resource mentions drive saves. |
| **Activating signals** | Step-by-step content, specific resources/tools named, templates/frameworks, concrete numbers, tutorial structure, live demonstrations. Essentially: content dense enough to warrant re-visit. |
| **Resulting viewer behavior** | Bookmark/save action. Measurable post-pub as save count. |
| **Current features** | No feature specifically targets save prediction. `share_utility_score` (r=+0.04) is the closest proxy but captures share utility, not save utility. Pack 1 `value_density` (1–10) may be related. |
| **Correlation evidence** | No direct evidence. Save count is collected via Apify but not isolated as a prediction target. |
| **Measurement quality** | Not directly measured as a mechanism. Save behavior is captured in post-pub data and contributes to DPS, but no pre-pub feature specifically targets "will this be saved?" |

### 3.10 Retention Pressure

| Property | Value |
|---|---|
| **Layer** | Mechanism (latent) |
| **Definition** | The viewer feels compelled to keep watching at each moment — the cost of stopping exceeds the cost of continuing. Retention pressure is not a single event (that's attention capture) but a sustained force across the video's timeline. |
| **Why it matters** | Completion rate is a direct algorithmic input. Short-form platforms reward videos that keep viewers watching. In money content, retention pressure comes from: unresolved information gaps (curiosity), escalating value/proof, visual variety preventing boredom, and pacing that prevents cognitive fatigue. |
| **Position in causal chain** | Throughout. Each second of the video must independently justify continuing. Retention pressure is the aggregate of all sustaining mechanisms (curiosity, trust building, pacing, visual variety). |
| **Activating signals** | Scene change rate (visual novelty), editing cadence acceleration, open loop placement, escalating reveals, zoom punch-ins (pattern interrupts), pacing score, visual variety, music bed presence. |
| **Resulting viewer behavior** | Higher completion rate. Rewatches. Measurable post-pub as average watch time / completion rate. |
| **Current features** | `ffmpeg_scene_changes` (r=+0.38), `visual_variety_score` (r=+0.36), `ffmpeg_avg_motion` (r=+0.35), `ffmpeg_cuts_per_second` (r=+0.31), `scene_rate_first_half_vs_second` (r=+0.15). Pack 1 `pacing_rhythm` (1–10). Pack V `pacing_score`. Pack 3 `Optimal Pacing` and `Pattern Interrupt` mechanics. |
| **Correlation evidence** | The strongest correlations in the entire dataset are retention-related visual signals: scene changes, visual variety, motion, cuts per second. These four features collectively explain more DPS variance than all other content features combined. |
| **Measurement quality** | **Best-measured mechanism.** Visual retention signals (editing intensity, variety, motion) are the most robust features in the system. Audio retention signals (silence, loudness consistency) are weaker but present. The temporal dimension (where in the video retention is lost) is not modeled — only video-level aggregates. |

### 3.11 Identity Resonance

| Property | Value |
|---|---|
| **Layer** | Mechanism (latent) |
| **Definition** | The viewer sees themselves (or their aspirational self) in the content. The video speaks to who they are or who they want to become. In money content, the identities are: freedom seeker, builder/entrepreneur, smart insider, provider, underdog (see FORMAT_ONTOLOGY §3.5). |
| **Why it matters** | Identity resonance drives follows (subscribing to a version of yourself), shares (broadcasting identity signals), and course/product purchases (investing in the identity). It's the mechanism that converts viewers into community members and customers. |
| **Position in causal chain** | Parallel throughout, but strongest in hook and CTA. Hook activates aspiration → Content reinforces identity → CTA captures the motivated viewer. |
| **Activating signals** | Aspirational language ("quit your 9-5", "build your empire"), relatable starting point ("I was broke"), direct address to specific situations ("if you're stuck in a job you hate"), lifestyle visuals, income displays. |
| **Resulting viewer behavior** | Follow, comment expressing identification ("this is me"), share with caption adding personal context, DM the creator. |
| **Current features** | Pack 1 `tam_resonance` (1–10, LLM-scored). `psych_direct_address_ratio` (r=-0.09, weakly negative). `share_relatability_score` (r=-0.06, not significant). |
| **Correlation evidence** | No feature cleanly captures identity resonance. The LLM TAM score is not in the Spearman report. Text-pattern features for relatability and direct address are weakly negative, suggesting that *saying* "this is relatable" is different from *being* relatable. |
| **Measurement quality** | Not measured. Identity resonance is fundamentally semantic — it requires understanding what aspiration the content activates and whether the target audience shares that aspiration. No current feature attempts this. |

### 3.12 Payoff Satisfaction

| Property | Value |
|---|---|
| **Layer** | Mechanism (latent) |
| **Definition** | The viewer feels that the video delivered on its hook's promise. The information gap opened at the beginning was closed satisfactorily. |
| **Why it matters** | Payoff satisfaction determines whether a view converts to a positive engagement (like, save, share, follow) or a negative one (scroll away, negative comment, unfollow). In money content, bait-and-switch (promising income proof but delivering vague advice) is the most common payoff failure. |
| **Position in causal chain** | End-of-video. Curiosity → Retention → Payoff Satisfaction → Post-engagement (save, share, follow, comment). |
| **Activating signals** | Hook-to-conclusion coherence (did the video answer what the hook asked?), specificity of the conclusion, presence of proof at the end, clear actionable takeaway. |
| **Resulting viewer behavior** | Positive: like + save + share + follow. Negative: immediate scroll, negative comment, report. Neutral: view counted but no engagement. |
| **Current features** | Pack 1 `clear_payoff` (1–10, LLM-scored). `retention_open_loop_count` (r=-0.14, negative — more open loops = worse payoff?). |
| **Correlation evidence** | Open loops negatively correlate with DPS, which *may* indicate that videos with many open loops often fail to close them (payoff failure). But this is speculative — the correlation could also mean that open-loop language signals weaker content. |
| **Measurement quality** | Weakly measured. Pack 1 provides an LLM judgment on payoff clarity, but it's not validated against DPS. Hook-to-conclusion coherence (the core of payoff satisfaction) requires understanding the semantic relationship between the video's opening promise and its ending — no feature attempts this. |

---

## 4. Feature Mapping

This section maps every current repo feature to the signal(s) it measures and the mechanism(s) it attempts to represent.

### 4.1 XGBoost v8 Feature Set (48 features → signals → mechanisms)

| Feature | Signal(s) measured | Mechanism(s) represented | Spearman r with DPS | Quality assessment |
|---|---|---|---|---|
| `ffmpeg_scene_changes` | Scene change count | Retention pressure | +0.38*** | **Strong.** Direct, clean measurement. |
| `visual_scene_count` | Scene change count (duplicate) | Retention pressure | +0.38*** | Redundant with above. |
| `visual_variety_score` | Visual complexity/variety | Retention pressure | +0.36*** | **Strong.** Composite but robust. |
| `ffmpeg_avg_motion` | Motion intensity | Retention pressure, attention capture | +0.35*** | **Strong.** Clean physical measurement. |
| `ffmpeg_cuts_per_second` | Cut rate (normalized) | Retention pressure | +0.31*** | **Strong.** Duration-normalized scene changes. |
| `visual_score` | Editing quality composite | Retention pressure | +0.29*** | Good. Composite heuristic. |
| `ffmpeg_resolution_height` | Resolution | Authority (production quality proxy) | +0.28*** | Good. Hardware/investment proxy. |
| `ffmpeg_resolution_width` | Resolution | Authority (production quality proxy) | +0.28*** | Redundant with height (always proportional). |
| `ffmpeg_contrast_score` | Luminance contrast | Attention capture | +0.26*** | Good. Scroll-stop visual signal. |
| `thumb_contrast` | First-frame contrast | Attention capture | +0.26*** | Good. Nearly identical to video contrast. |
| `ffmpeg_fps` | Frame rate | Authority (production quality proxy) | +0.21*** | Moderate. 30→60fps signals professional. |
| `text_emoji_count` | Caption emoji usage | Trust (negative: spam signal) | -0.20*** | Good. Clean anti-signal. |
| `text_negative_word_count` | Negative language | Trust (negative: erodes trust) | -0.19*** | Good. Clean anti-signal. |
| `audio_pitch_mean_hz` | Voice pitch | Trust, emotional congruence | +0.19*** | Moderate. Proxy for confident delivery. |
| `meta_duration_seconds` | Video length | Retention pressure, utility | +0.19*** | Moderate. Longer = more room for value. |
| `ffmpeg_duration_seconds` | Video length (duplicate) | Same | +0.18*** | Redundant with above. |
| `visual_avg_scene_duration` | Average time between cuts | Retention pressure (inverse) | -0.18*** | Good. Inverse of cuts per second. |
| `text_transcript_length` | Transcript length | Clarity (inverse: word-heavy = less visual) | -0.18*** | Moderate. Proxy for "too much talking". |
| `text_syllable_count` | Syllable count | Same as transcript length | -0.17*** | Redundant with transcript length. |
| `text_question_mark_count` | Question usage | Curiosity (but inverted) | -0.17*** | Moderate. Questions signal tentativeness. |
| `meta_words_per_second` | Speaking density | Clarity (inverse), retention pressure | -0.16*** | Moderate. Visual-dominant > word-dense. |
| `speaking_rate_wpm` | Speaking rate | Same | -0.16*** | Redundant with words per second. |
| `scene_rate_first_half_vs_second` | Pacing acceleration | Retention pressure | +0.15*** | Moderate. Accelerating editing helps. |
| `thumb_overall_score` | Thumbnail quality composite | Attention capture | +0.15*** | Moderate. Composite heuristic. |
| `retention_open_loop_count` | Open loop phrases | Curiosity (but inverted) | -0.14*** | **Inverted.** Measures presence of curiosity *language*, which is anti-correlated. |
| `thumb_confidence` | Thumbnail analysis confidence | (Methodological artifact) | +0.13*** | Artifact. Not a content signal. |
| `audio_pitch_range` | Vocal range | Emotional congruence | +0.13*** | Moderate. Expressiveness proxy. |
| `text_word_count` | Word count | Clarity (inverse) | -0.12*** | Redundant with transcript length. |
| `text_sentence_count` | Sentence count | Same | -0.12*** | Redundant. |
| `audio_loudness_mean_lufs` | Average loudness | Trust (confident recording) | +0.11*** | Weak. Loudness is a recording quality signal. |
| `text_unique_word_ratio` | Vocabulary richness | Clarity, utility | +0.11*** | Weak positive. Richer vocab = denser content. |
| `audio_pitch_variance` | Pitch variability | Emotional congruence | +0.11** | Weak. Expressiveness proxy. |
| `audio_pitch_std_dev` | Pitch std dev | Same | +0.11** | Redundant with variance. |
| `hook_score` | Multi-modal hook strength | Attention capture | +0.10** | Weak. 5-channel fusion underperforms individual visual signals. |
| `hook_text_score` | Text channel hook score | Attention capture | +0.10** | Redundant with hook_score (text is 40% of fusion). |
| `hook_confidence` | Hook classification confidence | (Methodological artifact) | +0.10** | Partially artifact. |
| `psych_social_proof_count` | Social proof language | Trust, authority (inverted) | -0.10** | **Inverted.** Verbal social proof anti-correlates. |
| `audio_silence_ratio` | Silence fraction | Retention pressure (negative) | -0.09** | Weak. Dead air hurts. |
| `audio_loudness_variance` | Loudness inconsistency | Trust (negative) | -0.09** | Weak. Inconsistent audio hurts. |
| `psych_direct_address_ratio` | "You/your" usage | Identity resonance (inverted) | -0.09* | **Inverted.** More "you" = lower DPS. |
| `audio_silence_count` | Pause count | Retention pressure (negative) | -0.09* | Weak. |
| `audio_energy_buildup` | Energy trajectory | Retention pressure | -0.08* | Weak. Negative = declining energy hurts. |
| `psych_curiosity_gap_score` | Curiosity language | Curiosity (inverted) | -0.07* | **Inverted.** Curiosity *language* anti-correlates. |
| `hook_composition_score` | Opening frame composition | Attention capture | +0.06 | Not significant. |
| `share_relatability_score` | Relatability language | Identity resonance, share impulse | -0.06 | Not significant. |
| `share_utility_score` | Utility language | Utility, save impulse | +0.04 | Not significant. |
| `hook_face_present` | Face in opening | Attention capture | -0.02 | Not significant. Near-zero variance. |
| `hook_text_overlay` | Text in opening | Attention capture | +0.02 | Not significant. Near-zero variance. |

### 4.2 LLM-Scored Features (Pack 1 — not in Spearman report)

These are produced by Gemini via `unified-grading-prompt.ts`. They are used in the pipeline blend but are **not** in the `FEATURE_CORRELATION_REPORT.md` because they are not in the XGBoost training dataset.

| Pack 1 feature | Mechanism(s) represented | Validated against DPS? |
|---|---|---|
| `tam_resonance` (1–10) | Identity resonance | No |
| `shareability` (1–10) | Share impulse | No |
| `value_density` (1–10) | Utility | No |
| `emotional_journey` (1–10) | Emotional congruence | No |
| `hook_strength` (1–10) | Attention capture | No |
| `format_innovation` (1–10) | Retention pressure (novelty) | No |
| `pacing_rhythm` (1–10) | Retention pressure | No |
| `curiosity_gaps` (1–10) | Curiosity | No |
| `clear_payoff` (1–10) | Payoff satisfaction | No |
| `pacing` (1–10) | Retention pressure | No |
| `clarity` (1–10) | Clarity | No |
| `novelty` (1–10) | Attention capture, curiosity | No |
| `hook.type` (categorical) | Attention capture | Partially (hook_type_encoded r=+0.10) |
| `hook.clarity_score` (1–10) | Attention capture, clarity | No |
| `idea_legos` (7 booleans) | Various structural checks | `text_has_cta` validated (lego_7 proxy, negative) |

### 4.3 Pack V Visual Features (not in Spearman report as discrete scores)

| Pack V feature | Signal(s) | Mechanism(s) | Validated? |
|---|---|---|---|
| `visual_hook_score` | Face, text overlay, color, first frame | Attention capture | No (composite) |
| `pacing_score` | Scene frequency, motion, shot length, beat alignment | Retention pressure | No (constituent signals validated) |
| `pattern_interrupts_score` | Scene transitions, visual variety, color dominance | Retention pressure | No |
| `visual_clarity_score` | Contrast, text legibility, composition | Clarity, attention capture | No |
| `style_fit_score` | Niche alignment, format appropriateness | Authority (format matches expectations) | No |

---

## 5. Gaps

### 5.1 Not Measured

Signals or mechanisms with **no current feature** and **no proxy**.

| Gap | Layer | Why it matters | Why it's missing |
|---|---|---|---|
| **Visual proof detection** | Signal | Whether the video shows a real dashboard, receipt, or bank statement. The strongest trust signal in money content. | Requires semantic visual understanding — "is this a Stripe dashboard?" Frame-level Gemini Vision exists but doesn't classify proof types. |
| **Claim type classification** | Signal | What kind of claim (income, opportunity, ease, process, comparative — see FORMAT_ONTOLOGY §3.2). Determines what proof the viewer needs. | Would require LLM pass over transcript with niche-specific claim taxonomy. |
| **Hook-to-payoff coherence** | Signal | Whether the ending delivers on the opening's promise. The core of payoff satisfaction. | Requires understanding semantic relationship between opening and closing — beyond pattern matching. |
| **Hedge word density** | Signal | "Maybe", "I think", "sort of" — uncertainty markers that erode trust. | Simple to implement (regex) but not currently a feature. |
| **Number specificity** | Signal | Whether claims use specific numbers ("$4,237") vs vague quantities ("a lot of money"). Specificity builds trust. | Simple to implement (regex for dollar amounts, percentages, specific counts) but not currently a feature. |
| **Save impulse** | Mechanism | Whether the content is save-worthy. No feature targets save prediction specifically. | Save count exists in training data but is blended into DPS, not modeled as a distinct target. |
| **Identity appeal type** | Mechanism | Which aspirational identity the video activates (freedom seeker, builder, insider, etc.). | Requires semantic classification of aspirational language. |
| **Comment sentiment prediction** | Mechanism | Whether the video will generate positive vs. hostile comments. Critical in money niche (scam accusations). | Post-pub comments are collected but sentiment is not analyzed or used as a signal. |
| **Sustained eye contact** | Signal | Whether the creator maintains eye contact through the video (not just frame 1). | Would require per-frame face tracking. Current Gemini Vision samples 5 frames. |
| **CTA type classification** | Signal | Whether the CTA is soft-follow, save-prompt, DM-trigger, link-in-bio, etc. | `text_has_cta` is binary. Type classification from transcript is feasible but not implemented. |

### 5.2 Partially Measured

Signals or mechanisms where a **feature exists but misses the core of what matters**.

| Gap | What exists | What's missing | Impact |
|---|---|---|---|
| **Trust** | `text_negative_word_count`, `psych_social_proof_count`, audio confidence proxies | Visual proof, credential parsing, hedge words, number specificity, demonstrated competence | Trust is the #1 mechanism in money content but has no well-correlated positive feature. All current "trust" features are either anti-signals (negative words) or inversely correlated (social proof phrases). |
| **Curiosity** | `psych_curiosity_gap_score`, `retention_open_loop_count`, hook type classification | Implicit curiosity (visual curiosity, information gap created by showing rather than telling) | All text-based curiosity features are *negatively* correlated with DPS. The mechanism clearly works (people watch to learn the answer), but the features measure the *wrong kind* of curiosity signal. |
| **Authority** | Hook type (authority/statistic), follower count (excluded), production quality proxies | Content-level authority (proof, credentials, demonstrated expertise), authority *sustained through video* | Follower count (the strongest authority proxy) is deliberately excluded from the model. Remaining features are indirect production-quality proxies. |
| **Utility** | `share_utility_score`, Pack 1 `value_density` | Actual practical value of the content — whether the advice is specific, actionable, and correct | Utility language patterns (r=+0.04) have zero correlation. The LLM score is not validated. |
| **Emotional congruence** | `audio_pitch_mean_hz`, `audio_pitch_variance`, Pack 1 `emotional_journey` | Whether the emotional tone *matches* the content topic. Current features measure emotion presence, not appropriateness. | No feature measures the match — only the individual emotional signals. |
| **Text overlay behavior** | `hook_text_overlay` (binary, first frame) | Full-video text overlay density, kinetic caption style, keyword emphasis patterns | First-frame binary is near-zero variance (98% have text). Full-video text behavior is likely a retention signal but isn't measured. |
| **Video style classification** | `24-styles-classifier` exists (hybrid keyword + LLM) | Currently **disabled** at runtime. Even when active, low reliability (0.65). | Style determines pacing expectations and platform fit norms, but the classifier doesn't contribute to predictions. |

### 5.3 Measured Badly

Features that exist but produce **misleading or inverted signals**.

| Feature | Problem | Evidence | Root cause |
|---|---|---|---|
| `psych_curiosity_gap_score` | **Negatively** correlated with DPS (r=-0.07) | Text curiosity patterns ("secret", "nobody talks about") appear more in lower-performing videos | Explicit curiosity language compensates for weak content. Good videos create curiosity *visually*, not verbally. The feature measures verbal curiosity-baiting, which is an anti-signal. |
| `retention_open_loop_count` | **Negatively** correlated with DPS (r=-0.14) | "Wait for it", "stay till the end" phrases inversely predict performance | Open loops are a retention *tactic* used by creators who lack organic retention drivers (editing, visual variety). The feature detects compensatory behavior, not effective retention. |
| `psych_social_proof_count` | **Negatively** correlated with DPS (r=-0.10) | Verbal social proof ("everyone is doing this", "trending") inversely predicts | Verbal social proof claiming is a weak substitute for demonstrated social proof (large following, real testimonials). The feature captures the substitute, not the real thing. |
| `psych_direct_address_ratio` | **Negatively** correlated with DPS (r=-0.09) | More "you/your" language = slightly lower DPS | High direct-address content tends to be word-heavy monologue ("you need to…", "you should…"). Best-performing content *shows* rather than *addresses*. |
| `text_has_cta` | Videos **with** CTAs average 5.2 DPS points **lower** | Mann-Whitney p<0.001 | Explicit CTAs may signal desperation or lower production quality. Top creators let the content speak for itself. The binary feature cannot distinguish "organic CTA" from "desperate follow-bait". |
| `hook_score` (fused) | Modest correlation (r=+0.10) despite being 45% of Quality Gate weight | Individual visual signals (contrast, resolution) outperform the fused hook score | The 5-channel fusion may over-weight the text channel (40%) and dilute stronger visual signals. The channel weights may not reflect actual predictive power. |
| `hook_face_present` | **Zero** correlation (r=-0.02) despite theoretical importance | 86% of videos have face present → near-zero variance | Not measured badly per se — the signal just has too little variance in this format to be discriminative. The feature correctly detects face presence, but in a format where almost everyone shows their face, it can't differentiate. |

### 5.4 Unmeasurable (Pre-Pub)

Things that matter but **cannot be measured before publication**, even in principle.

| Signal/Mechanism | Why it matters | Why unmeasurable |
|---|---|---|
| **Platform algorithm state** | The same video posted on two different days gets different distribution based on platform-wide algorithm changes. | Internal platform state is opaque. No public API or signal. |
| **Competitive density at posting time** | How many similar videos are competing for the same audience at the same time. | Would require real-time indexing of all platform content. |
| **Viewer mood / context** | Whether the viewer is in a receptive state for money content (bored at work vs. actively searching). | Individual viewer state is unknowable. |
| **Actual completion rate** | The precise second-by-second retention curve of the video. | Only available post-pub through creator analytics (not public API). Pre-pub estimation is the entire point of the prediction pipeline. |
| **Comment virality dynamics** | Whether early comments trigger algorithmic boost or pile-on effects. | Emergent social dynamics — unpredictable from content alone. |
| **Creator's other recent content** | Whether this video benefits from or is penalized by the creator's recent posting pattern. | Would require historical channel analysis per-creator (partially available via Apify but not integrated). |

---

## 6. Completeness

### What "exhaustive enough" means here

This ontology does not claim to enumerate every possible signal that could ever affect whether a side-hustle talking-head video goes viral. It claims something narrower and more useful:

**Every signal and mechanism listed here meets at least one of these criteria:**
1. It has a computed feature in the current codebase (measured, even if badly)
2. It has a statistically significant (p<0.05) Spearman correlation with DPS in the 863-video training dataset
3. It is a well-established concept in content performance research that clearly applies to this format and niche
4. It is a named component, mechanic, or attribute in the current system-registry, Pack 1/2/3/V, or content-strategy-features

**What this ontology deliberately excludes:**
- Cultural or trend-specific signals (e.g., "this meme format is trending right now") — too ephemeral to be structural
- Platform-specific algorithm details (e.g., TikTok's specific completion rate threshold) — opaque and constantly changing
- Creator relationship dynamics (e.g., feuds, collaborations, network effects) — exogenous to the video itself
- Multi-video strategy signals (e.g., posting cadence, series structure) — outside single-video scope
- Other niches' signal structures — by design, scoped to side hustles / making money online only
- Other format families — by design, scoped to creator-led talking-head only

**How to extend this ontology:**
- If a new signal is discovered (new feature extraction, new research), add it to Section 2 with its measurement status
- If a new mechanism is theorized, add it to Section 3 with explicit activating signals and resulting behaviors
- If a new feature is built, add it to Section 4 with the signal(s) it measures and mechanism(s) it represents
- If something moves from "gap" to "measured", update both Section 4 and Section 5

**The test for completeness is not "have we listed everything?" but "can a future agent, given this document, correctly classify any new signal, mechanism, or feature into the right layer and understand its causal role?"**

---

## 7. Highest-Confidence Known Gaps

Ranked by expected impact on prediction quality if closed, based on correlation evidence and mechanism analysis.

### Gap 1: Visual Proof Detection

- **What's missing:** A feature that detects whether the video contains visual proof — dashboard screenshots, income receipts, bank statements, before/after comparisons, live demonstrations.
- **Why high confidence:** Trust is the #1 bottleneck mechanism in money content. Every current text-based trust feature is either null or inverted. Visual proof is the most credible trust signal in this niche, and it's completely undetected.
- **What it would take:** Gemini Vision classification of extracted frames with a money-niche proof taxonomy. The infrastructure exists (Pack V already extracts 5 frames and sends to Gemini). The missing piece is a purpose-built prompt for proof-type classification.
- **Expected impact:** Medium-high. Would likely become a significant positive DPS predictor, especially for differentiating the top 25% from the middle 50%.

### Gap 2: Verbal Curiosity vs. Visual Curiosity Disambiguation

- **What's missing:** A way to distinguish between *verbal* curiosity-building (which inversely correlates with DPS) and *visual* curiosity (showing something intriguing that makes the viewer want to know more).
- **Why high confidence:** All three text-based curiosity/retention features are negatively correlated. The curiosity mechanism clearly works (it's why people watch), but the features measure the compensatory behavior, not the effective signal. The gap between "videos that *say* they're interesting" and "videos that *are* interesting" is where prediction accuracy is being lost.
- **What it would take:** A feature that measures whether the first 3 seconds contain a *visual* curiosity trigger (unusual visual, partial reveal, shocking number on screen) rather than a verbal one ("wait for it"). Gemini Vision could be prompted to classify hook curiosity source.
- **Expected impact:** Medium. Would fix the inverted curiosity signals and potentially flip them from noise to real predictors.

### Gap 3: Hedge Word and Certainty Scoring

- **What's missing:** A discrete feature measuring the balance of certainty cues (specific numbers, absolute language, imperative framing) vs. uncertainty cues (hedge words, vague quantities, filler).
- **Why high confidence:** Trust and authority are poorly measured. The gap is easy to close — certainty/hedge word detection is simple regex. It sits at the intersection of three mechanisms (trust, authority, delivery style) and would provide a cheap new signal for XGBoost.
- **What it would take:** ~50 lines of code in `content-strategy-features.ts`. Hedge word list + specific number regex + certainty phrase list → bipolar score.
- **Expected impact:** Low-medium. Likely modest individual correlation, but it would be the first *positive* text-based trust feature, which is notable given that all current ones are inverted.

### Gap 4: Save vs. Share Prediction Separation

- **What's missing:** The system predicts a single outcome (DPS) that blends all engagement types. Save behavior and share behavior are driven by different mechanisms (utility/reference vs. identity/reaction) but are currently indistinguishable in the target variable.
- **Why high confidence:** In educational money content, saves are the dominant engagement type. A video that gets 10K saves and 100 shares is fundamentally different from one that gets 100 saves and 10K shares — but both might have similar DPS. The features that predict saves (utility, clarity, step-structure) are different from those that predict shares (identity appeal, surprise, relatability).
- **What it would take:** Decompose DPS into sub-scores: save-weighted DPS and share-weighted DPS. Train separate models or add engagement-type targets. Post-pub data already has like/comment/share/save breakdowns.
- **Expected impact:** Medium. Would allow the model to learn what *kind* of engagement a video will generate, not just how much. More actionable for creators.

### Gap 5: Production Quality as Authority (Consolidation)

- **What's missing:** Resolution, FPS, contrast, editing intensity, and visual variety all independently correlate with DPS, but they collectively represent a single latent construct: "production investment signals authority." There is no consolidated production quality feature.
- **Why high confidence:** The top 6 content features in the Spearman report are all production/editing signals. They are likely collinear. A consolidated feature might (a) reduce overfitting from correlated inputs and (b) be more interpretable for coaching ("your production quality score is 3/10").
- **What it would take:** PCA or simple weighted composite of the top visual/editing features. Alternatively, the existing `visual_score` composite could be expanded to include resolution and FPS.
- **Expected impact:** Low for prediction (XGBoost handles collinearity). Medium for interpretability and coaching (Pack 2 could say "invest in editing" with a single score).

---

## 8. Source Files

| File | What it contributed to this document |
|---|---|
| `docs/FEATURE_CORRELATION_REPORT.md` | All Spearman correlation values, top-50 vs. bottom-50 comparisons, duration sweet spot, tier analysis |
| `src/lib/prediction/system-registry.ts` | Component registry, hook taxonomy, video styles, niche definitions, pack definitions, path definitions |
| `src/lib/components/hook-scorer.ts` | 5-channel hook analysis architecture, channel weights, hook type patterns |
| `src/lib/prediction/content-strategy-features.ts` | 7 text-based strategy features, regex pattern lists |
| `src/lib/services/ffmpeg-canonical-analyzer.ts` | FFmpeg feature extraction (scene changes, motion, contrast, brightness, resolution, fps, bitrate) |
| `src/lib/services/audio-prosodic-analyzer.ts` | Audio features (pitch, loudness, silence, dynamics) |
| `src/lib/prediction/ffmpeg-segment-features.ts` | Temporal segment features (hook motion, energy buildup, scene rate acceleration, visual variety) |
| `src/lib/prediction/vision-hook-features.ts` | Gemini Vision features (face, text overlay, composition, emotion) |
| `src/lib/rubric-engine/prompts/unified-grading-prompt.ts` | Pack 1 LLM scoring schema (9 attributes, 7 legos, hook, pacing, clarity, novelty) |
| `src/lib/rubric-engine/prompts/editing-coach-prompt.ts` | Pack 2 rubric weights for lift estimation |
| `src/lib/rubric-engine/visual-rubric-types.ts` | Pack V 5 visual scoring dimensions |
| `src/lib/rubric-engine/viral-mechanics-types.ts` | Pack 3 mechanic definitions (9 named mechanics) |
| `src/lib/rubric-engine/viral-mechanics-runner.ts` | Pack 3 detection logic (how mechanics are derived from signals) |
| `src/lib/prediction/extract-prediction-features.ts` | Feature extraction orchestration |
| `src/lib/services/speaking-rate-analyzer.ts` | Speaking rate feature |
| `src/lib/components/thumbnail-analyzer.ts` | Thumbnail features |
| `src/lib/components/visual-scene-detector.ts` | Visual scene detection features |
| `docs/FORMAT_ONTOLOGY.md` | Format ontology cross-references (hook form, claim type, authority, teaching structure, etc.) |
| `models/xgboost-v8-features.json` | XGBoost v8 feature schema (48 features) |

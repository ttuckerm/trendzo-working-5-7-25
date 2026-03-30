# Format Ontology: Creator-Led Short-Form (Side Hustles / Making Money Online)

> Canonical reference for the atomic structure of **direct-to-camera, creator-led, talking-head knowledge content** in the **side hustles / making money online** niche.
>
> This document exists so that future analysis, feature extraction, and model training can reference a single, explicit vocabulary for the structural elements of this format.

---

## 1. Scope

This ontology covers **one format family only**:

- **Creator-led short-form video** (15–90 seconds, occasionally up to 3 minutes)
- **Talking-head / direct-to-camera** delivery (face visible, speaking to viewer)
- **Knowledge content**: the creator teaches, claims, proves, or persuades
- **Niche**: side hustles, making money online, and adjacent subtopics (freelancing, dropshipping, print-on-demand, affiliate marketing, digital products, AI tools for business, content creation income, flipping/reselling — see `NICHE_REGISTRY['side-hustles'].subtopics` in `system-registry.ts`)
- **Platforms**: TikTok, Instagram Reels, YouTube Shorts

The format follows a **teach → prove → convert** arc. The creator is the authority figure, the camera framing centers their face, and the editing rhythm serves retention and credibility — not entertainment or aesthetics.

---

## 2. Not In Scope

The following video types are **explicitly excluded** from this ontology:

| Excluded type | Why |
|---|---|
| Skits / comedy sketches | Entertainment-first; no knowledge transfer arc |
| Meme edits / remix culture | No creator authority; derivative format |
| Cinematic montages / B-roll only | No face-on-camera; no direct address |
| Faceless compilations | No creator identity; voiceover-only at best |
| Trend dances / lip-sync | Performance format; no teach–prove–convert structure |
| Carousels / slideshows | Different format entirely (covered in `docs/FORMATS.md`) |
| Long-form (>3 min) | Different retention dynamics (covered in `docs/FORMATS.md` as `long_video_3m`) |
| Product-demo-only (no face) | Covered by `top-down-demo` / `product-demo` video styles but outside this ontology's creator-led constraint |

---

## 3. Ontology Elements

Each element below is a discrete, nameable structural dimension of the format. For each:

- **Definition** — what it is
- **Why it matters** — its role in this specific format's performance
- **Measurability** — whether it can be extracted pre-publication, post-publication only, or is latent (inferred indirectly)
- **Repo grounding** — where the codebase already models this (if anywhere)

---

### 3.1 Hook Form

**Definition:** The structural pattern used in the first 1–3 seconds to arrest scroll and create a reason to keep watching. Not the topic — the *shape* of the opening.

**Why it matters:** Hook strength is 45% of the Quality Gate weight in the prediction pipeline. In creator-led money content, the hook must simultaneously promise value *and* establish that the speaker is worth listening to. A weak hook kills the video regardless of what follows.

**Taxonomy (10 types, 5 psychological clusters):**

| Cluster | Hook types | Example in niche |
|---|---|---|
| Curiosity Trigger | `question`, `list_preview` | "What if I told you there's a side hustle that takes 10 minutes a day?" / "3 side hustles nobody talks about" |
| Cognitive Challenge | `contrarian`, `myth_bust` | "Stop selling digital products on Etsy" / "Everything you've been told about dropshipping is wrong" |
| Credibility Signal | `statistic`, `authority`, `result_preview` | "I made $47K last month from one product" / "As someone who's built 6 businesses..." / "Here's my Stripe dashboard" |
| Emotional Connection | `personal_story`, `problem_identification` | "I was broke 18 months ago" / "You're working 60 hours a week and still broke" |
| Urgency/Scarcity | `urgency` | "This side hustle window is closing in 2026" |

**Measurability:** Pre-pub. The codebase extracts hook type via regex patterns in the text channel (40% weight), plus audio loudness/pitch (20%), visual scene changes (15%), delivery pace (15%), and tone/energy (10%). See `hook-scorer.ts` and `HOOK_CLUSTERS` in `system-registry.ts`.

**Repo grounding:** `system-registry.ts:HOOK_CLUSTERS`, `system-registry.ts:HOOK_TYPES`, `hook-scorer.ts` (5-channel multi-modal analyzer), `unified-grading-prompt.ts` (LLM hook classification), `vision-hook-features.ts` (Gemini Vision face/text/emotion in opening frame).

---

### 3.2 Claim Type

**Definition:** The nature of the central assertion the creator makes. Every video in this format makes at least one claim — what kind?

**Types:**

| Claim type | Description | Example |
|---|---|---|
| Income claim | Specific dollar amount or income range | "I make $10K/mo with print-on-demand" |
| Opportunity claim | A method/platform/niche is viable or underexploited | "Etsy digital products are still not saturated" |
| Ease/speed claim | Low barrier to entry or fast results | "You can start this tonight with $0" |
| Contrarian claim | Conventional wisdom is wrong | "College is the worst investment you can make" |
| Process claim | A specific method works if followed | "If you do these 5 steps, you will get clients" |
| Comparative claim | One option beats another | "Shopify is better than Etsy for X" |

**Why it matters:** Claim type determines what proof the viewer needs to believe the creator. Income claims demand receipts. Process claims demand demonstration. The claim sets up the proof obligation that the rest of the video must fulfill.

**Measurability:** Pre-pub (from transcript). Partially modeled today — `psych_curiosity_gap_score` and `psych_social_proof_count` in `content-strategy-features.ts` capture adjacent signals, and Pack 1's `novelty` score touches contrarian claims. But claim type is not explicitly classified as a discrete feature yet.

**Repo grounding:** Indirect. `content-strategy-features.ts` (power words, curiosity gaps), `unified-grading-prompt.ts` (`novelty`, `value_density`).

---

### 3.3 Authority Signal Type

**Definition:** How the creator establishes credibility to make their claim. In money content, authority is the single biggest trust variable — viewers are primed to be skeptical.

**Types:**

| Signal type | Description | Example |
|---|---|---|
| Results receipt | Screenshot of income dashboard, analytics, bank statement | Showing Stripe/Shopify dashboard on screen |
| Personal narrative | "I did this" story with timeline and specificity | "18 months ago I was $30K in debt, now I…" |
| Credential | Professional title, years of experience, client count | "I've helped 200+ students launch stores" |
| Social proof | Follower count, testimonial, media mention | "10K people already use my template" |
| Demonstration | Live build / real-time showing | Building a store or product on screen |
| Data/statistic | Third-party number, study, platform data | "Etsy saw 40% growth in digital products in 2025" |

**Why it matters:** Authority signal type directly affects whether the viewer completes the video and takes the CTA. Mismatched authority (e.g., making an income claim but showing no receipts) creates cognitive dissonance that tanks completion rate and comments sentiment.

**Measurability:** Partially pre-pub. Credential and narrative signals are extractable from transcript text. Receipt/dashboard signals require visual analysis (Gemini Vision in Pack V). Social proof count is already extracted. Demonstration requires video understanding beyond current capabilities.

**Repo grounding:** `content-strategy-features.ts:psych_social_proof_count`, `hook-scorer.ts` (authority hook type), `system-registry.ts:HOOK_CLUSTERS.credibility_signal`, `unified-grading-prompt.ts` (hook type: `statistic`, `claim`), `video-styles-24.ts:ugc-testimonial` style.

---

### 3.4 Teaching Structure

**Definition:** The organizational pattern the creator uses to transfer knowledge within the video. This is the backbone of the "teach" portion of the teach–prove–convert arc.

**Types:**

| Structure | Description | Niche example |
|---|---|---|
| Numbered list | "3 things…", "5 steps…" | "5 side hustles you can start today" |
| Single-concept deep dive | One idea explored with layers | "Why print-on-demand works in 2026" |
| Before/after narrative | Problem state → solution state | "From $0 to $5K/mo — here's what changed" |
| If/then decision tree | Branching advice based on viewer situation | "If you have $0, do X. If you have $500, do Y" |
| Framework/formula | Named system or acronym | "My 3-P method: Product, Platform, Promotion" |
| Rapid-fire Q&A | Multiple questions answered fast | "Answering your top Etsy questions" |
| Live walkthrough | Step-by-step demonstration in real time | "Watch me set up this store from scratch" |

**Why it matters:** Teaching structure determines pacing expectations. Lists create natural pattern interrupts (each item is a micro-hook). Deep dives need stronger retention devices. Structure choice also predicts video length and completion curve shape.

**Measurability:** Pre-pub. Partially modeled: `share_utility_score` detects step-language and how-to patterns, `7-legos` component checks for story structure (lego 5) and topic clarity (lego 1). The `sop-checklist`, `decision-tree`, `faq-rapid-fire`, and `case-study` video styles map onto these structures. Explicit classification as a discrete feature does not exist yet.

**Repo grounding:** `content-strategy-features.ts:share_utility_score` (step/tip/hack patterns), `system-registry.ts:VIDEO_STYLES_REGISTRY` (structural hints like `minNumberedSteps`, `minQuestionMarks`), `video-styles-24.ts` (SOP/Checklist, Decision Tree, FAQ, Case Study, Template/Framework styles), `unified-grading-prompt.ts:idea_legos.lego_5` (story structure).

---

### 3.5 Identity Appeal

**Definition:** Which viewer identity or aspiration the creator activates. Money content works by making the viewer see themselves in a future state — the identity appeal is *which* future self is being invoked.

**Types:**

| Identity | Viewer self-image activated | Typical language |
|---|---|---|
| Freedom seeker | "Quit your 9-5", financial independence | "fire your boss", "work from anywhere" |
| Builder/entrepreneur | Creating something, being their own boss | "build your empire", "start your business" |
| Smart/insider | Knowing something others don't | "what nobody tells you", "secret method" |
| Provider | Taking care of family, security | "pay off your debt", "provide for your kids" |
| Underdog | Starting from nothing, proving doubters wrong | "I had no experience", "they said I couldn't" |

**Why it matters:** Identity appeal determines shareability (viewers share content that reflects who they want to be seen as) and comment sentiment. It's also the primary driver of `tam_resonance` — how deeply the video resonates with the target audience.

**Measurability:** Latent. Not directly extractable from surface features. Partially captured by `psych_direct_address_ratio` (second-person "you" language), `share_relatability_score`, and Pack 1's `tam_resonance` and `emotional_journey` scores. But the specific identity type is not classified.

**Repo grounding:** `content-strategy-features.ts:share_relatability_score`, `content-strategy-features.ts:psych_direct_address_ratio`, `unified-grading-prompt.ts:tam_resonance`, `unified-grading-prompt.ts:emotional_journey`.

---

### 3.6 Proof / Receipt Style

**Definition:** How the creator provides evidence for their claim. In the money niche, "proof" is the most scrutinized element — viewers are conditioned to expect (and doubt) receipts.

**Types:**

| Proof style | Description | Trust level |
|---|---|---|
| Dashboard screenshot | Income platform UI shown on screen or green-screen | High (if unedited) |
| Physical receipt | Bank statement, check, cash | High (visceral) |
| Live demonstration | Building/doing the thing in real time | Very high (hardest to fake) |
| Verbal only | "I made $X" with no visual evidence | Low |
| Testimonial/DM | Screenshot of client result or message | Medium |
| Data/chart | Third-party analytics, graph, trend data | Medium-high |
| Before/after | Side-by-side comparison of states | Medium-high |

**Why it matters:** Proof style directly affects the credibility of the claim (3.2) and the authority signal (3.3). Videos with visual proof outperform verbal-only claims by a significant margin in this niche. The absence of proof when a claim demands it is a strong negative signal.

**Measurability:** Partially pre-pub. Visual proof (dashboard, receipts, before/after) can be detected by Gemini Vision (Pack V). Verbal-only proof is detectable from transcript. But distinguishing real from fabricated proof is not feasible pre-pub.

**Repo grounding:** `gemini-vision-scorer.ts` (frame analysis), `visual-rubric-types.ts:visual_clarity_score`, `video-styles-24.ts:case-study` (Before-After style), `unified-grading-prompt.ts:hook.type` (can detect `claim` and `statistic` hooks that imply proof obligations).

---

### 3.7 Delivery Style

**Definition:** How the creator speaks and presents: vocal energy, pace, confidence, conversational register. This is about *performance*, not content.

**Dimensions:**

| Dimension | Spectrum | Notes |
|---|---|---|
| Energy level | Low (calm authority) ↔ High (hype/urgency) | Money content skews high-energy |
| Speaking rate | Slow deliberate ↔ Rapid-fire | Faster pace correlates with shorter retention windows |
| Register | Casual/peer ↔ Expert/professional | Most successful in this niche: "casual expert" — relaxed tone, confident claims |
| Conviction | Tentative ↔ Absolute certainty | Hedging ("maybe", "might") is penalized in this niche |
| Direct address | Third-person general ↔ Second-person "you" | Higher `psych_direct_address_ratio` is a positive signal |

**Why it matters:** Delivery style is the primary "parasocial trust" mechanism. In creator-led content, the viewer is buying the person as much as the information. Delivery determines whether the creator *feels* credible, independent of their actual credentials.

**Measurability:** Pre-pub. Already well-modeled: audio-analyzer provides loudness, pitch, silence ratio. Hook scorer uses `hookWpm`, `wpmAcceleration`, `pitchContourSlope`, `energyLevel`. Content strategy features capture `psych_direct_address_ratio`.

**Repo grounding:** `hook-scorer.ts` (audio channel: hookLoudness, hookPitchMean; pace channel: hookWpm, wpmAcceleration; tone channel: energyLevel, pitchContourSlope), `content-strategy-features.ts:psych_direct_address_ratio`, `unified-grading-prompt.ts:pacing`.

---

### 3.8 Eye Contact / Face Framing

**Definition:** The camera relationship between the creator and the viewer — how the face is positioned, whether eye contact is maintained, and what that communicates.

**Typical patterns in this format:**

| Pattern | Description | Effect |
|---|---|---|
| Center-frame direct gaze | Face centered, eyes to lens | Maximum parasocial connection; "talking to you" |
| Offset with gestures | Face to one side, hand/body movement | Dynamic but slightly less intimate |
| Green-screen overlay | Creator over evidence/screenshots | Splits attention between face and proof |
| Cut-away and return | Periodic cuts to B-roll, returns to face | Provides visual variety without losing face anchor |

**Why it matters:** Face presence in the opening frame is one of the strongest single predictors of scroll-stop in creator-led content. Maintained eye contact through the video sustains the parasocial bond that keeps viewers watching advice from a stranger.

**Measurability:** Partially pre-pub. `vision-hook-features.ts` extracts `hook_face_present` (binary) and `hook_composition_score` (1–10). Gemini Vision in Pack V analyzes face presence and framing across 5 extracted frames. Sustained eye contact through the full video is not currently measured.

**Repo grounding:** `vision-hook-features.ts:hook_face_present`, `vision-hook-features.ts:hook_composition_score`, `gemini-vision-scorer.ts` (5-frame extraction, face/composition analysis), `visual-rubric-types.ts:visual_hook_score`, `video-styles-24.ts` (`requiresFaceOnCamera` field).

---

### 3.9 Trust and Certainty Cues

**Definition:** Linguistic and paralinguistic signals that communicate confidence, certainty, or transparency. Distinct from authority signals (3.3), which are about *evidence* — these are about *how* claims are delivered.

**Positive cues (trust-building):**

| Cue | Example |
|---|---|
| Absolute language | "This works", "I guarantee", "100%" |
| Specific numbers | "$4,237 last month" vs "a few thousand" |
| Temporal precision | "In 6 weeks" vs "pretty quickly" |
| Acknowledged limitations | "This won't work if you…" (paradoxically increases trust) |
| Imperative framing | "Do this", "Stop doing that" (implies authority) |

**Negative cues (trust-eroding):**

| Cue | Example |
|---|---|
| Hedge words | "Maybe", "I think", "possibly", "sort of" |
| Vague quantities | "A lot of money", "tons of people" |
| Excessive disclaimers | Over-qualifying every statement |
| Filler density | "Um", "like", "you know" at high frequency |

**Why it matters:** In the money niche, viewers are pattern-matching for scam signals. Certainty cues that *don't* feel like hype build trust. Hedge words signal the creator doesn't believe their own claims.

**Measurability:** Pre-pub. `psych_power_word_density` captures urgency/exclusivity/desire language. `psych_curiosity_gap_score` captures contrarian/secret framing. Specific number detection and hedge-word analysis are not currently discrete features but are extractable from transcript.

**Repo grounding:** `content-strategy-features.ts:psych_power_word_density`, `content-strategy-features.ts:psych_curiosity_gap_score`, `unified-grading-prompt.ts:clarity` (partially), `hook-scorer.ts` text channel patterns (contrarian, authority patterns).

---

### 3.10 Editing Cadence

**Definition:** The rhythm and frequency of visual cuts, transitions, and pattern interrupts throughout the video. Not just "how many cuts" but the *tempo* and *purpose* of edits.

**Patterns in this format:**

| Cadence | Description | When used |
|---|---|---|
| Jump-cut rhythm | Regular 2–4 second cuts removing pauses/ums | Default for talking-head; keeps pace tight |
| Beat-aligned cuts | Edits timed to emphasis words or music beats | Higher production value |
| Section markers | Visual transition between numbered points | List-format teaching structures |
| Zoom punch-ins | Subtle zoom on emphasis moments | Pattern interrupt without cutting away |
| B-roll intercuts | Brief cutaway to evidence/product, return to face | Proof delivery moments |

**Why it matters:** Editing cadence is the primary mechanism for retention in short-form. Too slow = scroll-away. Too fast = cognitive overload in knowledge content (viewers need time to process claims). The optimal cadence for this format is "tight but not frantic" — faster than a podcast clip, slower than a meme edit.

**Measurability:** Pre-pub. `visual-rubric-runner.ts` scores `pacing_score` from scene frequency, motion intensity, shot length, and beat alignment. `visual-scene-detector` counts scene changes. `ffmpeg` provides raw cut data. Pack 1 scores `pacing_rhythm` (1–10).

**Repo grounding:** `visual-rubric-types.ts:pacing_score` (scene frequency, motion intensity, fps, shot length, beat alignment), `visual-rubric-runner.ts`, `system-registry.ts:COMPONENT_REGISTRY['visual-scene-detector']`, `unified-grading-prompt.ts:pacing_rhythm`, `video-styles-24.ts` (structural hints: `expectsSceneChanges`, `expectsNoSceneChanges`).

---

### 3.11 Text Overlay and Subtitle Behavior

**Definition:** How on-screen text is used — not just "are there subtitles" but what role text plays in the information architecture of the video.

**Patterns:**

| Pattern | Description | Function |
|---|---|---|
| Kinetic captions | Auto-generated, word-by-word animated subtitles | Accessibility + retention (reading reinforces listening) |
| Keyword emphasis | Select words enlarged, colored, or animated | Directs attention to key claims |
| Headline overlay | Static or semi-static title bar | Reinforces hook/topic throughout |
| Data callout | Numbers, stats, or prices displayed prominently | Proof reinforcement (supports 3.6) |
| CTA text | "Follow for more", "Link in bio", "Save this" | Conversion mechanism |
| None | No text overlay | Rare in this format; signals lower production |

**Why it matters:** Text overlays are the second visual channel after the creator's face. In sound-off scroll environments (Instagram feed, TikTok browse), text overlays are the *primary* information channel. Their presence and quality directly affect scroll-stop and completion.

**Measurability:** Pre-pub. `vision-hook-features.ts:hook_text_overlay` (binary, opening frame). Pack V's `visual_clarity_score` includes text legibility. Gemini Vision frame analysis detects text presence. Full-video text overlay density and style classification are not currently modeled as discrete features.

**Repo grounding:** `vision-hook-features.ts:hook_text_overlay`, `visual-rubric-types.ts:visual_clarity_score` (text legibility), `gemini-vision-scorer.ts`, `video-styles-24.ts` (visual cues: `animated-captions`).

---

### 3.12 CTA Style

**Definition:** How the creator asks the viewer to take action — the "convert" portion of the teach–prove–convert arc.

**Types:**

| CTA style | Description | Example |
|---|---|---|
| Soft follow | Low-friction "follow for more" | "Follow me for daily side hustle tips" |
| Save/bookmark | Encourages saving for later reference | "Save this so you don't forget" |
| Comment prompt | Asks viewer to engage in comments | "Drop a 🔥 if you want part 2" |
| Link-in-bio | Directs to external resource | "Full guide linked in my bio" |
| DM trigger | "DM me [keyword]" for automated funnel | "DM me 'TEMPLATE' and I'll send it free" |
| Cliffhanger/series | Teases next video | "Part 2 drops tomorrow" |
| No explicit CTA | Content ends without ask | Common in high-confidence creators |

**Why it matters:** CTA style affects both the video's measurable engagement (comments, shares, saves) and the creator's monetization path. In the money niche, DM triggers and link-in-bio CTAs are the dominant conversion mechanisms. CTA presence is already tracked as `idea_legos.lego_7`.

**Measurability:** Pre-pub (from transcript). `lego_7` in Pack 1 checks for CTA presence (binary). The specific CTA *type* is not classified. `content-strategy-features.ts` captures adjacent signals (imperative verbs, direct address).

**Repo grounding:** `unified-grading-prompt.ts:idea_legos.lego_7` (CTA presence), `content-strategy-features.ts:IMPERATIVE_VERBS`, `content-strategy-features.ts:psych_direct_address_ratio`.

---

### 3.13 Payoff Structure

**Definition:** How the video delivers on the promise made by the hook. The payoff is the reason the viewer feels satisfied (or cheated) at the end.

**Types:**

| Payoff type | Description | Satisfaction driver |
|---|---|---|
| Full reveal | Delivers exactly what was promised | "Here are the 3 hustles" → all 3 explained |
| Escalating reveal | Each point is bigger/better than the last | List where item 3 is the real gem |
| Twist/reframe | Subverts expectation in a satisfying way | "The real side hustle is X, not what you think" |
| Proof payoff | Ends with the strongest evidence | Saves dashboard screenshot for the end |
| Open loop (intentional) | Deliberately withholds to drive follow/part 2 | "I'll show you the exact template in part 2" |
| No payoff / bait | Hook promises something the video doesn't deliver | Clickbait — strong negative signal |

**Why it matters:** `clear_payoff` is one of the 9 scored attributes (Pack 1) and directly affects completion rate and rewatch likelihood. In money content, bait-and-switch is the most common reason for negative comments and unfollows. A strong payoff also drives saves (viewers bookmark content that delivered real value).

**Measurability:** Partially pre-pub. Pack 1 scores `clear_payoff` (1–10) via LLM analysis of the full transcript. `retention_open_loop_count` in content strategy features detects open-loop phrases. Whether the payoff actually lands requires understanding the relationship between hook promise and ending — this is an LLM judgment, not a regex extraction.

**Repo grounding:** `unified-grading-prompt.ts:clear_payoff`, `content-strategy-features.ts:retention_open_loop_count`, `unified-grading-prompt.ts:curiosity_gaps`.

---

## 4. Element Measurability Summary

| Element | Pre-pub | Post-pub only | Latent |
|---|---|---|---|
| 3.1 Hook Form | ✅ Multi-modal (5-channel) | | |
| 3.2 Claim Type | ⚠️ Partial (text patterns, no discrete classifier) | | |
| 3.3 Authority Signal Type | ⚠️ Partial (text + some vision) | | |
| 3.4 Teaching Structure | ⚠️ Partial (utility patterns, style classification) | | |
| 3.5 Identity Appeal | | | ✅ Inferred from TAM/emotional scores |
| 3.6 Proof / Receipt Style | ⚠️ Partial (vision for visual proof, text for verbal) | Viewer trust reaction (comments) | |
| 3.7 Delivery Style | ✅ Well-modeled (audio, pace, tone, direct address) | | |
| 3.8 Eye Contact / Face Framing | ⚠️ Partial (opening frame, 5 samples) | | Full-video gaze tracking |
| 3.9 Trust and Certainty Cues | ⚠️ Partial (power words, curiosity gaps) | Comment sentiment | |
| 3.10 Editing Cadence | ✅ Well-modeled (pacing, scene detection, beat alignment) | | |
| 3.11 Text Overlay / Subtitles | ⚠️ Partial (opening frame, clarity score) | | Full-video text density |
| 3.12 CTA Style | ⚠️ Partial (presence only, not type) | CTA conversion rate | |
| 3.13 Payoff Structure | ⚠️ Partial (LLM judgment + open-loop count) | Completion rate curve shape | |

**Well-modeled (✅):** 3 elements — hook form, delivery style, editing cadence
**Partially modeled (⚠️):** 8 elements — have adjacent signals but lack a discrete, typed classifier
**Latent only:** 2 elements — identity appeal, full-video gaze tracking

---

## 5. Open Questions

1. **Claim type classifier.** Should claim type (3.2) become a discrete extracted feature? It would require an LLM pass over the transcript or an expanded regex taxonomy. The ROI depends on whether claim type predicts virality independently of existing features.

2. **Authority–proof coherence.** The *match* between claim type (3.2), authority signal (3.3), and proof style (3.6) likely matters more than any of them individually. Is there value in a "coherence score" that checks whether the proof satisfies the claim's burden of evidence?

3. **Identity appeal extraction.** Can identity appeal (3.5) be promoted from latent to pre-pub measurable? It would require detecting aspirational language patterns ("quit your 9-5", "be your own boss") and mapping them to identity archetypes. This may overlap with `tam_resonance` enough that a separate feature adds noise.

4. **CTA type vs. CTA presence.** `lego_7` is binary (CTA present or not). Given that CTA *type* (especially DM triggers vs. soft follows) strongly predicts creator monetization strategy and funnel behavior, should this be promoted to a typed classifier?

5. **Full-video text overlay density.** Current text overlay detection is limited to the opening frame. For this format, text overlays through the full video (kinetic captions, keyword emphasis) are a strong production quality signal. Worth investing in frame-by-frame or sampled text detection?

6. **Trust cue polarity.** Certainty cues (3.9) include both positive signals (specificity, conviction) and negative signals (hedging, filler). Should these be modeled as a single bipolar score or two independent features?

7. **Cross-element dependencies.** Several elements interact: a `contrarian` hook (3.1) with a `data/statistic` authority signal (3.3) and a `twist/reframe` payoff (3.13) is a coherent arc. A `contrarian` hook with `verbal only` proof (3.6) and `no payoff` (3.13) is bait. Can interaction effects be captured without combinatorial explosion?

---

## 6. Source Files

Files that directly informed this ontology:

| File | What it contributed |
|---|---|
| `src/lib/prediction/system-registry.ts` | Hook taxonomy (10 types, 5 clusters), 24 video style definitions, niche registry, component registry, pack definitions |
| `src/lib/components/hook-scorer.ts` | 5-channel multi-modal hook analysis architecture, channel weights |
| `src/lib/prediction/content-strategy-features.ts` | 7 text-based strategy signals (open loops, relatability, utility, curiosity gaps, power words, direct address, social proof) |
| `src/lib/rubric-engine/prompts/unified-grading-prompt.ts` | 9 scoring attributes, 7 idea legos, hook type classification, style classification |
| `src/lib/rubric-engine/prompts/editing-coach-prompt.ts` | Rubric weights for lift estimation, hook style preferences |
| `src/lib/rubric-engine/visual-rubric-types.ts` | 5 visual scoring dimensions (visual hook, pacing, pattern interrupts, clarity, style fit) |
| `src/lib/rubric-engine/gemini-vision-scorer.ts` | Frame extraction, Gemini Vision analysis |
| `src/lib/prediction/vision-hook-features.ts` | Face presence, text overlay, composition, emotion intensity |
| `src/lib/frameworks/video-styles-24.ts` | 24 video style interfaces with platform alignment, production complexity, detection patterns |
| `docs/FORMATS.md` | Format detection and calibration (short_video, carousel, long_video_3m) |
| `src/lib/rubric-engine/editing-coach-types.ts` | Creator context integration, hook style preferences |
| `src/lib/prediction/creator-context.ts` | Creator stage, channel data, calibration profile |

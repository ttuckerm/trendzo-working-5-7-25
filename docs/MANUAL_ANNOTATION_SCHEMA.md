# Manual Annotation Schema: Creator-Led Short-Form (Side Hustles / Making Money Online)

> Human annotation rubric and benchmark design for 100–200 videos across 5 DPS tiers.
>
> Companion to [FORMAT_ONTOLOGY.md](FORMAT_ONTOLOGY.md) and [SIGNAL_ONTOLOGY.md](SIGNAL_ONTOLOGY.md). The format ontology defines what we're looking at. The signal ontology defines what the pipeline measures. This document defines what **humans** judge — filling the gap between what machines extract and what actually matters.

---

## 1. Benchmark Purpose

The prediction pipeline has 48 XGBoost features and 14+ LLM-scored attributes. The `FEATURE_CORRELATION_REPORT.md` shows that:

- The strongest predictors are **production signals** (scene changes, motion, contrast) — but these explain editing quality, not content quality
- Text-based mechanism features (curiosity, social proof, utility, direct address) are **weakly negative or null** — the features measure compensatory behavior, not the real mechanisms
- LLM Pack 1 scores (tam_resonance, shareability, value_density, etc.) are **never validated** against DPS

This benchmark exists to answer three questions:

1. **Which latent mechanisms actually separate tiers?** If human-rated "trust" scores cleanly separate mega-viral from average, but the pipeline has no good trust feature, that's a high-priority gap.
2. **Which pipeline features are measuring the wrong thing?** If `psych_curiosity_gap_score` negatively correlates with DPS but human-rated "curiosity" positively correlates, the feature is capturing an anti-pattern rather than the mechanism.
3. **Which Pack 1 LLM scores are accurate?** If human-rated "clarity" correlates with Pack 1's `clarity` score, the LLM is doing its job. If they diverge, the LLM prompt needs fixing.

**This benchmark is NOT training data.** It is a diagnostic instrument. It must not be used to train or tune the prediction model, or it becomes self-referential. See Section 9.

---

## 2. Sampling Design

### 2.1 Tier Definitions

Tiers are defined by DPS (Dynamic Percentile Score) from post-publication metrics. The 863-video training set establishes these boundaries:

| Tier | Label | DPS Range | % of corpus | Target sample |
|---|---|---|---|---|
| T1 | Mega-Viral | 75.6–91.7 | Top 10% | 25 videos |
| T2 | Viral | 64.2–75.5 | 75th–90th percentile | 30 videos |
| T3 | Good | 49.1–64.1 | 50th–75th percentile | 40 videos |
| T4 | Average | 34.9–49.0 | 25th–50th percentile | 40 videos |
| T5 | Underperformer | 11.6–34.8 | Bottom 25% | 25 videos |

**Total target: 160 videos** (range: 130–200 acceptable).

The tails (T1, T5) are intentionally smaller because they are the most distinctive. The middle tiers (T3, T4) get more videos because they are hardest to differentiate — that's where the benchmark adds the most value.

### 2.2 Creator Diversity

| Constraint | Requirement | Rationale |
|---|---|---|
| **Max videos per creator** | 5 across entire benchmark | Prevents a single creator's style from dominating a tier |
| **Min creators per tier** | 8 distinct creators | Ensures tier characteristics aren't creator-specific |
| **Same-creator cross-tier pairs** | At least 10 creators who appear in 2+ tiers | Enables within-creator comparison (same person, different performance) |
| **Same-topic cross-tier pairs** | At least 5 topics (e.g., "Etsy digital products") with videos in 3+ tiers | Enables within-topic comparison (same topic, different execution) |
| **Subtopic coverage** | At least 6 of the 10 side-hustles subtopics represented | Prevents the benchmark from only reflecting one subtopic |
| **Platform mix** | At least 20% from each of TikTok, Instagram Reels, YouTube Shorts | Prevents platform-specific scoring bias |

### 2.3 Selection Process

1. **Pull candidate pool** from `prediction_runs` where `niche = 'side-hustles'` and `labeling_mode` is not null (DPS available).
2. **Stratify by DPS tier** using the boundaries above.
3. **Within each tier**, rank by creator diversity score: prefer creators not yet in the sample, then prefer subtopics not yet in the sample.
4. **Identify same-creator pairs**: for every creator with videos in multiple tiers, include at least one video from each tier they appear in.
5. **Identify same-topic pairs**: for each subtopic, include the highest-tier and lowest-tier video available.
6. **Verify format fit**: every selected video must be creator-led, talking-head, direct-to-camera knowledge content. Exclude any video that fits a FORMAT_ONTOLOGY exclusion (skits, memes, faceless, etc.). If in doubt, flag for manual format-check before annotation begins.
7. **Blind the raters**: raters must NOT see the DPS score, tier label, view count, or any engagement metrics during annotation.

### 2.4 Same-Creator Contrast Example

If creator @sidehustlequeen has:
- Video A: "3 Etsy digital products that print money" (DPS 82, T1)
- Video B: "My Etsy journey update" (DPS 38, T4)

Both are included. This pair lets us see what the *same creator* did differently in a top-performing vs. average video — isolating content/execution variables from creator/audience variables.

---

## 3. Annotation Rubric

### 3.0 General Instructions

- Watch the video **at least twice**: once casually (as a viewer would), once analytically (scoring each dimension).
- Score each dimension on a **1–5 integer scale**. No half-points. If you're torn between two scores, choose the lower one — err toward strictness.
- Score what you **observe in the video**, not what you think the metrics will show. You are rating the content, not predicting performance.
- If a dimension is **not applicable** (e.g., the video has no audio), mark it `N/A` and note why.
- Scores are **absolute**, not relative to other videos in the session. A "3" means the same thing whether you're annotating your 1st video or your 50th.

---

### 3.1 Hook Strength

**What it means:** How effectively the first 1–3 seconds arrest the viewer's scroll and create a reason to keep watching.

| Score | Anchor |
|---|---|
| **1** | No discernible hook. Video starts with throat clearing, "hey guys", or a slow ramp. Nothing in the first 3 seconds gives a reason to stop scrolling. |
| **2** | Weak hook. There's an attempt (a question, a claim) but it's generic ("Want to make money online?") or buried under filler. You'd keep scrolling on a normal day. |
| **3** | Functional hook. A clear promise or question that is relevant to the niche. You'd pause to see where it goes, but you're not hooked. Example: "Here are 3 side hustles you can start today." Competent but unremarkable. |
| **4** | Strong hook. Specific, surprising, or emotionally charged opening that creates genuine curiosity. Example: "I made $47K last month from a product that took me 2 hours to create." You'd watch at least 10 more seconds. |
| **5** | Exceptional hook. Instantly arresting — specific, credible, and creates an information gap you *need* to close. Example: "Stop selling on Etsy. Here's why I moved everything to Gumroad and tripled my income." You'd watch the whole thing. |

**Failure cases / ambiguity:**
- A hook can be *attention-grabbing* (loud, shocking) but not *relevant* (clickbait unrelated to content). Score the hook's relevance to what follows, not just its intensity.
- Green-screen hooks with a dashboard screenshot visible are strong even if the spoken words are generic — score the total first-3-seconds experience, not just the text.
- If the hook is a result preview (showing the end state) that creates a "how did they do that?" gap, that counts as strong even if no words are spoken.

---

### 3.2 Trust

**What it means:** The degree to which the viewer would believe this creator's claims are true. Not whether the claims *are* true — whether a reasonable viewer in the target audience would *perceive* them as credible.

| Score | Anchor |
|---|---|
| **1** | Active distrust. The video feels like a scam or exaggeration. Vague income claims with no proof, overly hype energy, or promises that sound too good to be true with nothing backing them up. |
| **2** | Skepticism. The creator makes claims but provides minimal or unconvincing evidence. The viewer would think "maybe, but I'm not sure I believe you." |
| **3** | Neutral. Neither particularly trustworthy nor untrustworthy. The creator presents information without strong trust signals but also without red flags. |
| **4** | Credible. The creator provides concrete evidence (screenshots, specific numbers, named tools/platforms), speaks with consistency, and doesn't overstate. You'd take this advice seriously enough to investigate further. |
| **5** | Highly trustworthy. Multiple credibility signals reinforce each other: specific results shown visually, acknowledged limitations, verifiable details, confident but not hype delivery. You'd act on this advice. |

**Failure cases / ambiguity:**
- High energy ≠ low trust. Some creators are genuinely excited and trustworthy. Score trust based on evidence and consistency, not energy level alone.
- A creator with a massive visible following (shown on screen) gets a trust boost from social proof — that's valid, score it.
- A creator who says "I'm not going to sugarcoat this" or "This won't work for everyone" may paradoxically score *higher* on trust because acknowledged limitations signal honesty.

---

### 3.3 Authority

**What it means:** Whether the creator has established the *right* to teach on this topic — through demonstrated results, experience, credentials, or competence visible in the video.

| Score | Anchor |
|---|---|
| **1** | No authority signal. The creator could be anyone. No results, no credentials, no demonstration of competence. They're simply stating things. |
| **2** | Weak authority. The creator claims experience ("I've been doing this for years") but shows no evidence. Or they reference someone else's results rather than their own. |
| **3** | Moderate authority. One clear authority signal: either a specific personal result ("I made $X"), a credential ("I help clients do Y"), or a competent demonstration. But only one dimension — not reinforced. |
| **4** | Strong authority. Multiple authority signals that reinforce each other. For example: specific income claim + dashboard screenshot + clear expertise in the explanation. The creator *sounds* like they know what they're talking about AND shows evidence. |
| **5** | Dominant authority. The creator is unambiguously an expert. Deep specificity, real-time demonstration of competence, specific and verifiable results, and a delivery that reflects genuine mastery. You'd pay for a course from this person. |

**Failure cases / ambiguity:**
- Authority and trust are related but distinct. A creator can have high authority (clearly an expert) but low trust (their specific claims in this video seem exaggerated). Score them separately.
- A younger or less polished creator who shows real results (actual dashboard) can score higher than a polished creator making unsubstantiated claims.
- "I just started this 3 months ago and here are my results" can be high-authority for the *beginner audience* — authority is relative to the claim being made, not absolute expertise.

---

### 3.4 Conviction

**What it means:** How certain and committed the creator sounds in their claims and recommendations. This is about delivery, not evidence. A creator can state wrong things with high conviction or right things with low conviction.

| Score | Anchor |
|---|---|
| **1** | Tentative. Hedging, qualifying, uncertain. "I think maybe this could work..." "You might want to try..." The creator sounds like they're not sure of their own advice. |
| **2** | Mild. Some commitment but softened with frequent qualifiers. "This usually works pretty well." The creator believes it but won't stake their reputation on it. |
| **3** | Moderate. Clear statements without excessive hedging, but no particular force. The creator is informative rather than persuasive. Standard "educational content" delivery. |
| **4** | Strong. Definitive statements, imperative language, specific recommendations. "Do this. Stop doing that. This is the way." The creator has picked a position and is committed to it. |
| **5** | Absolute. Unshakeable conviction. The creator speaks as if there's no other reasonable interpretation. "I guarantee if you follow these steps..." Combined with specific numbers and direct eye contact. |

**Failure cases / ambiguity:**
- High conviction + low evidence = hype/scam energy. Score conviction on its own scale — the Trust dimension handles whether the conviction is earned.
- Some creators use a calm, measured delivery that still conveys conviction through specificity rather than volume. Don't conflate conviction with loudness.
- Nuanced statements ("This works for X but not Y") can be high-conviction if the nuance itself is stated with certainty.

---

### 3.5 Clarity

**What it means:** How easy it is to follow the creator's teaching. Can the viewer understand *what* to do and *how* to do it after watching?

| Score | Anchor |
|---|---|
| **1** | Confusing. The viewer cannot extract a clear takeaway. Jumps between topics, uses unexplained jargon, contradicts itself, or is so vague that nothing is actionable. |
| **2** | Unclear. The general topic is discernible but the specifics are muddled. The viewer would need to watch multiple times or seek external information to understand the advice. |
| **3** | Adequate. The main points are understandable. The viewer gets the gist but might miss details. Some jargon is unexplained, or the structure could be tighter. |
| **4** | Clear. Well-structured, logically sequenced, and easy to follow on first watch. Technical terms are explained or obvious from context. The viewer could explain the main point to someone else. |
| **5** | Crystal clear. Exceptional structure — each point builds on the previous one, visual aids reinforce spoken words, complex ideas are made simple without dumbing down. The viewer could *act* on this advice immediately. |

**Failure cases / ambiguity:**
- A video can be clear about the *wrong* thing (clearly explains a bad strategy). Score clarity of communication, not quality of advice.
- Short videos (15s) may score high on clarity simply because there's less to confuse. That's fine — brevity is a clarity strategy.
- Jargon is not automatically a clarity failure if the target audience knows it. "POD" (print on demand) doesn't need explanation in the side-hustle niche.

---

### 3.6 Utility

**What it means:** How practically useful the content is. Could the viewer take action based on what they learned? Not "is the information interesting?" but "can I use this?"

| Score | Anchor |
|---|---|
| **1** | No utility. Pure motivation, vague claims, or information the viewer can't act on. "You should start a side hustle!" with no specifics. |
| **2** | Low utility. One actionable nugget buried in generalities. The viewer might learn *that* something exists but not *how* to do it. |
| **3** | Moderate utility. Some actionable information but not enough to actually start. The viewer would need additional research. "Use Etsy for digital products" — OK, but how? |
| **4** | High utility. Specific enough to act on: named tools, approximate costs, concrete steps. The viewer could start the process after watching. |
| **5** | Exceptional utility. A complete mini-tutorial or framework. The viewer could open their laptop and begin following the steps. Specific tools, specific price points, specific workflows. Save-worthy content. |

**Failure cases / ambiguity:**
- A video that teaches one thing very well (score 5) vs. a video that teaches five things superficially (score 3). Depth of actionability matters more than breadth.
- Motivation is not utility. "You can do this!" is encouragement, not instruction. Score utility on actionable specifics.
- A "mindset" video can score 4–5 on utility if it provides a specific mental framework the viewer can apply (not just "believe in yourself").

---

### 3.7 Emotional Congruence

**What it means:** Whether the creator's emotional tone matches what the content calls for. Not "is the creator emotional?" but "is the emotion *appropriate*?"

| Score | Anchor |
|---|---|
| **1** | Jarring mismatch. Hype energy on a topic that needs calm authority, or flat delivery on a topic that should be exciting. The tone makes the viewer uncomfortable or skeptical. |
| **2** | Slightly off. The general direction is right but the intensity is wrong — too excited about a mundane topic, or too casual about a significant result. |
| **3** | Neutral / acceptable. The emotional tone doesn't clash with the content but doesn't enhance it either. Standard "informational" delivery. |
| **4** | Good fit. The emotion enhances the message. Excitement about an exciting result, seriousness about a serious mistake to avoid, empathy about a common frustration. The viewer feels "this person gets it." |
| **5** | Perfect congruence. The emotional arc of the video matches the content arc. Builds from problem (empathy/frustration) → solution (building hope) → proof (excitement/confidence) → CTA (calm authority). The emotion carries the message. |

**Failure cases / ambiguity:**
- Cultural differences in emotional expression. Some creators are naturally lower-energy but still congruent. Score the *match* between tone and content, not the absolute energy level.
- Irony and sarcasm can be congruent if the audience expects it (e.g., "Oh great, another dropshipping guru" said sarcastically before delivering real advice).
- A creator who is visibly nervous but genuinely trying is incongruent (the nervousness undermines the confidence the content needs).

---

### 3.8 Share Impulse

**What it means:** After watching this video, would you want to send it to someone or repost it? Score the *impulse*, not whether you'd actually follow through.

| Score | Anchor |
|---|---|
| **1** | No share impulse. Nothing in this video would make you think of sending it to anyone. It's forgettable or too generic. |
| **2** | Weak impulse. You might think "that's interesting" but you wouldn't bother finding someone to share it with. |
| **3** | Moderate impulse. You can imagine a specific person who might find this useful. You'd share it if it was easy (repost) but wouldn't go out of your way. |
| **4** | Strong impulse. You'd actively think "my friend who just quit their job needs to see this." You'd DM it to them. |
| **5** | Irresistible. You'd share this unprompted. Either it's so valuable you feel *obligated* to share it ("everyone needs to know this"), or so surprising that you want to discuss it ("can you believe this?"), or so identity-affirming that reposting it says something about *you*. |

**Failure cases / ambiguity:**
- Share impulse is subjective. The rater should imagine themselves as the *target audience* (someone interested in side hustles), not their actual self. If you're a software engineer, imagine you're someone looking for a side income.
- A video can be excellent but not shareable (very niche, very specific). That's a valid 2 or 3 on share impulse with high scores elsewhere.
- Controversial or contrarian content may trigger share impulse for debate ("look at this idiot" shares). That still counts — shares are shares.

---

### 3.9 Save Impulse

**What it means:** Would you bookmark this video to return to later? Save impulse signals durable reference value.

| Score | Anchor |
|---|---|
| **1** | No save impulse. Nothing to return to. The content is either too vague to act on or fully absorbed in one watch. |
| **2** | Weak impulse. There's maybe one thing worth remembering, but you'd probably just try to recall it rather than save the video. |
| **3** | Moderate impulse. Contains enough specific information that you *might* save it, especially if you're actively pursuing this side hustle. But it's not a reference you'd revisit multiple times. |
| **4** | Strong impulse. You'd save this to follow the steps later. It has specific tools, resources, or a process you'd want to revisit when you sit down to do the work. |
| **5** | Must-save. This is a reference resource. Tutorial-quality content with specific steps, named tools, price points, and workflows. You'd save it AND create a folder for it. The kind of video people comment "saving this!" on. |

**Failure cases / ambiguity:**
- Save impulse correlates strongly with utility but is not identical. A video can be highly useful in the moment (score 5 utility) but not save-worthy if the information is simple enough to remember.
- Motivational content rarely triggers save impulse — nobody bookmarks "believe in yourself." Score accordingly.
- A video with a complex framework or a template reference ("use my free template, link in bio") can score high on save even if the video itself is moderate on utility — the save is for the associated resource.

---

### 3.10 Novelty of Angle

**What it means:** How fresh or unexpected the perspective is. Not "is this new information?" but "is this a new *way* of presenting or framing the information?"

| Score | Anchor |
|---|---|
| **1** | Completely generic. The same advice everyone gives, framed the same way. "Start a dropshipping store" with no unique angle. |
| **2** | Slightly differentiated. Same general advice but with one distinctive element — a personal anecdote, a specific tool recommendation. |
| **3** | Moderately novel. A recognizable topic but with a genuine twist: a contrarian take, an unexpected combination, or an under-discussed subtopic. "Why I stopped selling on Etsy and moved to Gumroad." |
| **4** | Fresh angle. The viewer thinks "I haven't heard it put that way before." A genuine reframe, a non-obvious insight, or a connection between ideas that isn't commonly made. |
| **5** | Genuinely surprising. The viewer's mental model shifts. A claim or framework they haven't encountered, backed by enough evidence to be credible. "I make $X from Y and nobody in this space talks about it because Z." |

**Failure cases / ambiguity:**
- Novelty is relative to the *niche's common discourse*, not to the rater's personal knowledge. If "Etsy digital products" is oversaturated in the niche, a video about it scores lower even if the rater personally hasn't heard of it.
- Novelty without substance (surprising claim with no proof) should score 2–3, not 4–5. Genuine novelty requires at least some credibility.
- A well-known concept presented with genuinely better clarity or structure is not "novel angle" — it might score high on clarity but low on novelty.

---

### 3.11 Specificity of Promise

**What it means:** How concrete and specific the video's central claim or promise is. Specificity is the difference between "make money online" and "earn $2K/month selling Canva templates on Etsy."

| Score | Anchor |
|---|---|
| **1** | Completely vague. "Make money online", "start a side hustle", "change your life." No specifics at all. |
| **2** | Slightly specific. One concrete detail but the rest is vague. "Make money with Etsy" — names a platform but nothing else. |
| **3** | Moderately specific. A clear topic with some quantification. "How I make $500/month with print-on-demand." Has a method, a platform, and a number, but lacks detail about *how*. |
| **4** | Specific. Named method + platform + approximate result + at least one process detail. "I make $3K/month selling Canva templates on Etsy — here's my top-selling category and pricing strategy." |
| **5** | Hyper-specific. Exact numbers, named tools, specific workflows, verifiable details. "I made $4,237 last month from 12 Canva templates on Etsy. My best seller is a social media planner at $7.99, and it took me 3 hours to create." |

**Failure cases / ambiguity:**
- Specificity is about the *promise/claim*, not the teaching. A video can have a specific promise (score 5) but vague teaching (low clarity). Score separately.
- Fake specificity (specific-sounding numbers that feel made up) should still score high on specificity but low on trust. The dimensions are independent.
- A video that says "I'll show you exactly how" but then gives vague steps has a specific *promise* but doesn't *deliver*. Score the promise itself here; delivery is covered by payoff clarity.

---

### 3.12 Payoff Clarity

**What it means:** Whether the video delivers on its hook's promise by the end. Did the viewer get what they were promised?

| Score | Anchor |
|---|---|
| **1** | No payoff. The video ends without delivering on the hook's promise. Classic bait-and-switch: hooks with an income claim, then pivots to "follow my course for more." |
| **2** | Weak payoff. Some information is delivered but it's vague or incomplete. The hook promised 3 side hustles but only gave one, or promised specifics but delivered generalities. |
| **3** | Adequate payoff. The hook's promise is addressed but not fully satisfied. The viewer learned *something* but feels like the best stuff was held back. "That was OK but I wanted more." |
| **4** | Strong payoff. The hook's promise is clearly delivered. If the hook said "3 side hustles," you get 3 explained side hustles. The viewer feels satisfied. |
| **5** | Exceptional payoff. Delivers more than the hook promised. The last point is the strongest, or there's a bonus insight, or the final proof is the most convincing. The viewer thinks "that was even better than I expected." |

**Failure cases / ambiguity:**
- A video with a weak hook (score 1–2) can still have a high payoff if it delivers good content despite the bad opening. Score payoff relative to *whatever promise was implied*, even if the hook was weak.
- "Part 2 coming tomorrow" endings are inherently low-payoff (2 at best) unless the video delivered standalone value *and* teases more.
- A video that escalates (each point better than the last) scores higher than one that front-loads the best point and trails off, even if total information is equal.

---

### 3.13 Teacher Energy

**What it means:** The degree to which the creator embodies the "teacher" role — guiding the viewer through information with appropriate enthusiasm, patience, and authority. Distinct from conviction (which is about certainty) and delivery confidence (which is about performance anxiety). Teacher energy is about *pedagogical presence*.

| Score | Anchor |
|---|---|
| **1** | No teacher energy. The creator is monologuing without regard for the viewer's understanding. Or they're so flat that there's no sense of guidance — just information dumped. |
| **2** | Low teacher energy. Some attempt at teaching but feels rushed, dismissive, or condescending. "Just do it, it's not that hard." |
| **3** | Adequate teacher energy. The creator is clearly trying to explain and help. Standard "educational content" feel. They care about the viewer understanding but don't go above and beyond. |
| **4** | Strong teacher energy. The creator anticipates questions, explains "why" not just "what", uses examples, and maintains engagement through the teaching. You feel like you're learning from someone who enjoys teaching. |
| **5** | Exceptional teacher energy. Magnetic pedagogical presence. The creator makes complex things simple, uses analogies, checks understanding ("let me show you what I mean"), and radiates genuine desire to help. You'd take their course. |

**Failure cases / ambiguity:**
- Teacher energy is not just enthusiasm. A calm, precise explainer with strong structure can score 5.
- "Hype guru" energy (ALL CAPS energy, motivational shouting) is low teacher energy (1–2) even if it's high *performance* energy.
- Very short videos (15–20s) may struggle to demonstrate teacher energy. Score what's there — a tight 20s explanation can still score 3–4.

---

### 3.14 Eye Contact Quality

**What it means:** How effectively the creator uses eye contact (looking at the camera lens) to create a sense of direct connection with the viewer.

| Score | Anchor |
|---|---|
| **1** | No eye contact. The creator is reading notes, looking at their screen, or consistently looking away from the camera. No sense of personal address. |
| **2** | Sporadic eye contact. Occasional glances at the camera but mostly looking elsewhere. The viewer doesn't feel "talked to." |
| **3** | Adequate eye contact. The creator generally looks at the camera but breaks eye contact for extended periods (looking at notes, thinking, looking down). Standard for most talking-head content. |
| **4** | Strong eye contact. Consistent gaze at the camera with natural, purposeful breaks (looking at visuals being shown, brief thinking moments). The viewer feels directly addressed. |
| **5** | Commanding eye contact. Unwavering camera-gaze that creates intense parasocial connection. The viewer feels like the creator is talking specifically to them. Breaks are rare and intentional (looking at proof being shown, then returning immediately). |

**Failure cases / ambiguity:**
- Green-screen videos naturally split eye contact between camera and overlay. This is not a flaw — score the *effectiveness* of how the creator manages attention between face and visuals.
- Screen-share walkthroughs (PIP format) will naturally have lower eye contact. Score relative to what the format allows, but cap at 3 if the creator never looks at the camera.
- Teleprompter-reading can produce technically perfect eye contact that feels dead/robotic. Score the *quality* of connection, not just the gaze direction.
- Mark `N/A` for audio-only or faceless segments.

---

### 3.15 Delivery Confidence vs. Hesitation

**What it means:** How physically and vocally confident the creator's delivery is. This is about *performance*, not content quality. A creator can deliver false information confidently or true information hesitantly.

| Score | Anchor |
|---|---|
| **1** | Highly hesitant. Frequent "um"s, "uh"s, false starts, visible nervousness, fidgeting. The creator seems uncomfortable on camera. |
| **2** | Somewhat hesitant. Occasional filler words, some uncertainty in body language. The creator is functional but not polished. You notice the hesitation. |
| **3** | Neutral. Reasonably smooth delivery with minor imperfections. Standard for most casual content creators. Filler words exist but don't distract. |
| **4** | Confident. Smooth, assured delivery with controlled pacing. Few or no filler words. The creator looks comfortable on camera. Natural gestures reinforce points. |
| **5** | Commanding. Professional-grade delivery. Zero filler, precise pacing, physical stillness or purposeful movement, vocal variety that sounds natural not rehearsed. The creator owns the frame. |

**Failure cases / ambiguity:**
- Over-rehearsed delivery that sounds like reading a script can feel *less* confident than natural conversational delivery with occasional imperfections. Score the *perception* of confidence, not the absence of errors.
- Jump-cut editing can mask hesitation (cutting out "ums"). If the editing makes the delivery seem confident, score what the viewer actually experiences, not what you suspect was edited out.
- Cultural and individual variation: some people are naturally quieter/slower but still confident. Don't penalize low energy if the delivery is assured.

---

## 4. Annotation Instructions for Raters

### 4.1 Before Starting

1. Read this entire document, including all 15 dimension definitions and their failure cases.
2. Watch the 5 **calibration videos** (one from each tier, provided separately) and compare your scores with the reference scores. If your scores diverge by more than 1 point on more than 3 dimensions, discuss with the lead annotator.
3. Understand that you will not see any engagement metrics, view counts, or DPS scores. You are rating the *content*, not predicting performance.

### 4.2 Per-Video Workflow

1. **Watch once casually.** Form a general impression. Note your gut reactions.
2. **Watch again analytically.** Pause if needed. Pay attention to specific moments for each dimension.
3. **Score all 15 dimensions.** Score in order (1–15). Do not go back and revise earlier scores based on later dimensions unless you genuinely made an error.
4. **Write free-text notes** for any dimension where you scored 1, 2, 4, or 5 (extremes). Explain briefly *why* in 1–2 sentences. Scores of 3 (middle) do not require notes.
5. **Flag format issues.** If the video is not actually creator-led talking-head knowledge content (it's a skit, meme, faceless voiceover, etc.), mark `format_valid = false` and stop. Do not score it.
6. **Record metadata.** Fill in the metadata columns (see Section 7).

### 4.3 Session Management

- **Maximum 20 videos per session.** After 20 videos, take a break of at least 30 minutes. Fatigue causes score drift.
- **Randomized order.** Videos must be presented in random order, not grouped by tier or creator.
- **No discussion during scoring.** Do not discuss specific videos with other raters until all scoring is complete.
- **Track your confidence.** After each video, rate your own confidence in your scores (1–3: uncertain / normal / confident). This helps identify ambiguous videos.

---

## 5. Inter-Rater Consistency

### 5.1 Target Agreement

| Metric | Target | Acceptable |
|---|---|---|
| **Cohen's kappa (per dimension)** | ≥ 0.60 (substantial) | ≥ 0.40 (moderate) |
| **Mean absolute difference (per dimension)** | ≤ 0.8 points | ≤ 1.2 points |
| **Exact match rate** | ≥ 40% | ≥ 25% |
| **Adjacent match rate (within ±1)** | ≥ 85% | ≥ 75% |

### 5.2 Achieving Consistency

1. **Calibration round.** Before the benchmark, all raters independently score the same 10 calibration videos. Compare scores, discuss disagreements, and adjust shared understanding of each dimension's anchors.
2. **Overlap set.** 20% of benchmark videos (32 of 160) are scored by all raters. These are the inter-rater reliability set.
3. **Rater count.** Each video is scored by at least 2 raters. The overlap set is scored by all raters.
4. **Disagreement resolution.** For any dimension where two raters diverge by ≥ 2 points, a third rater (or the lead annotator) scores that dimension. The final score is the median of all raters.
5. **Drift check.** After every 40 videos, insert a repeat of one calibration video (raters don't know it's a repeat). Compare with original scores to detect drift. If drift > 1 point average, pause and re-calibrate.

### 5.3 Which Dimensions to Watch

Based on expected difficulty:

| Difficulty | Dimensions | Why |
|---|---|---|
| **Easier** (expect high agreement) | Hook Strength, Clarity, Delivery Confidence, Eye Contact | Observable, less subjective |
| **Medium** (expect moderate agreement) | Trust, Authority, Conviction, Specificity of Promise, Payoff Clarity | Require judgment but have concrete anchors |
| **Harder** (expect lower agreement) | Utility, Emotional Congruence, Share Impulse, Save Impulse, Novelty, Teacher Energy | Subjective, audience-dependent, or require niche context |

If a dimension consistently falls below acceptable kappa after calibration, consider:
- Revising the anchor descriptions
- Splitting it into sub-dimensions
- Dropping it from the rubric (and documenting why)

---

## 6. Metadata Columns

These are recorded per video but are **not** annotation dimensions. They are factual or pre-populated from the database.

| Column | Type | Source | Notes |
|---|---|---|---|
| `video_id` | string | DB `prediction_runs.id` | Primary key |
| `tiktok_url` | string | DB | For rater to access the video |
| `creator_handle` | string | DB | Anonymous ID OK if blinding creator identity |
| `platform` | enum | DB | tiktok / instagram / youtube |
| `duration_seconds` | float | DB | Pre-populated |
| `dps_score` | float | DB | **HIDDEN from raters.** Used in analysis only. |
| `dps_tier` | enum | Derived | T1–T5. **HIDDEN from raters.** |
| `subtopic` | string | Manual or DB | etsy-digital-products, freelancing, etc. |
| `format_valid` | boolean | Rater | Is this actually creator-led talking-head knowledge content? |
| `rater_id` | string | System | Who scored this video |
| `rater_confidence` | int 1–3 | Rater | How confident the rater feels about this video's scores |
| `annotation_date` | date | System | When annotation was completed |
| `session_position` | int | System | Nth video in this rater's session (for fatigue analysis) |

---

## 7. Export Format

### 7.1 CSV Schema

One row per (video, rater) pair. All 15 dimension scores + metadata.

```
video_id,tiktok_url,creator_handle,platform,duration_seconds,subtopic,format_valid,rater_id,rater_confidence,annotation_date,session_position,hook_strength,trust,authority,conviction,clarity,utility,emotional_congruence,share_impulse,save_impulse,novelty_of_angle,specificity_of_promise,payoff_clarity,teacher_energy,eye_contact_quality,delivery_confidence,hook_strength_note,trust_note,authority_note,conviction_note,clarity_note,utility_note,emotional_congruence_note,share_impulse_note,save_impulse_note,novelty_of_angle_note,specificity_of_promise_note,payoff_clarity_note,teacher_energy_note,eye_contact_quality_note,delivery_confidence_note
```

**Column details:**

| Column | Type | Range | Required |
|---|---|---|---|
| `hook_strength` | int | 1–5 or null | Yes (unless format_valid = false) |
| `trust` | int | 1–5 or null | Yes |
| `authority` | int | 1–5 or null | Yes |
| `conviction` | int | 1–5 or null | Yes |
| `clarity` | int | 1–5 or null | Yes |
| `utility` | int | 1–5 or null | Yes |
| `emotional_congruence` | int | 1–5 or null | Yes |
| `share_impulse` | int | 1–5 or null | Yes |
| `save_impulse` | int | 1–5 or null | Yes |
| `novelty_of_angle` | int | 1–5 or null | Yes |
| `specificity_of_promise` | int | 1–5 or null | Yes |
| `payoff_clarity` | int | 1–5 or null | Yes |
| `teacher_energy` | int | 1–5 or null | Yes |
| `eye_contact_quality` | int | 1–5 or null | Yes (N/A allowed for non-face videos) |
| `delivery_confidence` | int | 1–5 or null | Yes |
| `*_note` | string | free text | Required for scores of 1, 2, 4, or 5 |

### 7.2 Aggregated View

For analysis, produce a second CSV with one row per video. Scores are the **median** across all raters.

```
video_id,creator_handle,platform,duration_seconds,subtopic,dps_score,dps_tier,n_raters,hook_strength_median,hook_strength_iqr,trust_median,trust_iqr,...[all 15 dimensions]...,mean_rater_confidence
```

Each dimension gets `_median` and `_iqr` (interquartile range as a measure of rater disagreement).

### 7.3 Hidden Labels Join

A separate file joins the rater-blinded data with the actual DPS scores and pipeline features:

```
video_id,dps_score,dps_tier,vps_predicted,hook_score_pipeline,pack1_clarity,pack1_tam_resonance,...[all pipeline features]
```

This join is performed **only for analysis**, never shown to raters, and never fed back into training.

---

## 8. Preventing Benchmark Contamination

The benchmark must remain a **diagnostic tool**, not a training signal. Contamination would make it self-referential and useless.

### 8.1 Rules

| Rule | Why |
|---|---|
| Benchmark video IDs must be flagged in the database (`benchmark_set = true`) | So no pipeline component accidentally trains on them |
| Human annotation scores must **never** be used as features, labels, or calibration targets in the prediction pipeline | They are for measuring the pipeline, not feeding it |
| If a benchmark video is also in the training set (it has DPS + training features), the DPS label may be used for training — but the *human annotations* may not | DPS comes from platform metrics, not from the benchmark. The annotations are a separate measurement layer. |
| The benchmark is re-run when major pipeline changes land, using the same videos and the same raters if possible | Longitudinal comparison requires stable inputs |
| New videos should NOT be added to the benchmark opportunistically | The benchmark is a fixed instrument. If the niche evolves, create a v2 benchmark. |

### 8.2 What the Benchmark CAN Inform

- Which **new features** to build (if human "trust" separates tiers but no pipeline feature does, build a trust feature)
- Which **existing features** to fix or remove (if pipeline `psych_curiosity_gap_score` disagrees with human "curiosity"-adjacent dimensions)
- Which **Pack 1 LLM scores** are accurate (compare Pack 1 `clarity` with human clarity scores)
- Which **dimensions are redundant** (if trust and authority always correlate > 0.9 in human ratings, they may be the same construct)
- What the **ceiling of prediction accuracy** looks like (if human ratings only weakly separate tiers, automated features can't be expected to do better)

### 8.3 What the Benchmark Must NOT Inform

- XGBoost model training (no human scores as features or labels)
- Pack 1/2/V LLM prompt tuning (do not optimize LLM prompts to match human scores — optimize them to predict DPS)
- Calibration constants or tier boundaries
- Anything that feeds back into the `prediction_runs` or `vps_evaluation` tables

---

## 9. How This Benchmark Feeds Steps 2 and 3

This document is Step 1 (annotation design). Steps 2 and 3 are:

- **Step 2**: Feature gap analysis — where the pipeline's features fail to capture what humans see
- **Step 3**: Feature design — building new features to close the highest-priority gaps

### 9.1 Step 2: Gap Analysis (How to use the benchmark)

Once annotation is complete, run the following analyses:

**Analysis A: Human Dimension → DPS Correlation**
For each of the 15 dimensions, compute Spearman rank correlation between the median human score and the video's DPS. This answers: *which human-perceived qualities actually predict performance?*

Expected high-correlation dimensions: hook strength, trust, authority, specificity, payoff clarity, delivery confidence.
Expected low-correlation dimensions: novelty (niche-saturated takes may still perform if well-executed), emotional congruence (subtle, may not separate tiers at n=160).

**Analysis B: Human Dimension → Pipeline Feature Alignment**
For each human dimension, compute Spearman correlation with the pipeline feature(s) that claim to measure the same thing:

| Human Dimension | Pipeline Feature(s) to Compare |
|---|---|
| Hook Strength | `hook_score`, `hook_confidence` |
| Trust | `text_negative_word_count`, `psych_social_proof_count` |
| Authority | `hook_type` (when authority/statistic), production quality features |
| Conviction | `psych_power_word_density`, `audio_pitch_mean_hz` |
| Clarity | Pack 1 `clarity`, `text_flesch_reading_ease` |
| Utility | `share_utility_score`, Pack 1 `value_density` |
| Emotional Congruence | Pack 1 `emotional_journey`, `audio_pitch_variance` |
| Share Impulse | `share_relatability_score`, Pack 1 `shareability` |
| Save Impulse | `share_utility_score` (closest proxy) |
| Novelty of Angle | Pack 1 `novelty` |
| Specificity of Promise | (no direct feature — a gap) |
| Payoff Clarity | Pack 1 `clear_payoff`, `retention_open_loop_count` |
| Teacher Energy | (no direct feature — a gap) |
| Eye Contact Quality | `hook_face_present` (weak proxy) |
| Delivery Confidence | `audio_loudness_mean_lufs`, `audio_silence_ratio` |

If the human dimension strongly predicts DPS (Analysis A) but has no well-correlated pipeline feature (Analysis B), that's a **high-priority gap** for Step 3.

If a pipeline feature claims to measure something but disagrees with the human dimension, that feature is **measuring the wrong thing** — also a Step 3 priority.

**Analysis C: Dimension Redundancy**
Compute the 15×15 correlation matrix of human dimensions. If two dimensions correlate > 0.85, they may be measuring the same latent construct. Consider merging them in future feature design to avoid redundant extraction.

**Analysis D: Tier Discrimination**
For each dimension, run a Kruskal-Wallis test across the 5 tiers. Which dimensions most cleanly separate the tiers? These are the highest-leverage dimensions for prediction improvement.

### 9.2 Step 3: Feature Design (What comes after)

Step 3 takes the gaps identified in Step 2 and designs features to close them. The benchmark stays frozen — no new annotations. The benchmark is re-scored against the pipeline *after* new features are built to measure improvement.

The cycle:
1. Annotate benchmark (Step 1 — this document)
2. Identify gaps (Step 2 — correlate human scores with DPS and pipeline features)
3. Build features to close gaps (Step 3 — new extraction code)
4. Re-evaluate pipeline against frozen benchmark (verify improvement)
5. Do NOT re-annotate. Do NOT update the benchmark based on pipeline changes.

---

## 10. Source Files

| File | What it contributed |
|---|---|
| `docs/FORMAT_ONTOLOGY.md` | Format scope, exclusion criteria, 13 ontology elements |
| `docs/SIGNAL_ONTOLOGY.md` | 12 latent mechanisms, feature-to-signal mapping, gap inventory |
| `docs/FEATURE_CORRELATION_REPORT.md` | DPS tier boundaries, Spearman correlations, tier analysis (key content differentiators per tier) |
| `src/lib/prediction/system-registry.ts` | DPS tier definitions, VPS tier definitions, hook taxonomy, niche registry |
| `src/lib/rubric-engine/prompts/unified-grading-prompt.ts` | Pack 1 scoring schema (9 attributes, 7 legos) — informs which LLM scores to validate |
| `src/lib/prediction/content-strategy-features.ts` | 7 text-based features — informs which pipeline features to compare against human scores |
| `src/lib/components/hook-scorer.ts` | Hook scoring architecture — informs hook strength comparison |

### Counterfactual Coach

Overview
- Inputs: `CoachInput { platform, niche?, scriptText?, caption?, durationSec?, templateId? }`
- Suggestion types: hook_rewrite, cta_insert, caption_tighten, hashtag_set, template_swap, pace_tweak
- Output: `CoachResult { baselineProb, suggestions[], features }` where each suggestion includes `expectedLift`, `confidence`, `preview`, and `diff`.

Uplift method
- Uses existing `lib/analysis/scorer.scoreDraft` to score baseline vs edited variant.
- `expectedLift = variantProb - baselineProb`, bounded to [0,1], returns confidence from scorer.
- Batched sequentially (fast in MOCK); safe to parallelize later.

Safety gate
- Uses `lib/safety/brand_policy.classifySafety` to filter suggestions that would create high policy risk.

APIs (App Router)
- POST `/api/coach/suggest` → body `CoachInput & { k?: number }` → returns `CoachResult` with up to 5 ranked suggestions.
- POST `/api/coach/apply` → body `{ suggestionId, input, edit, autopilot? }` → returns `{ variant, experimentId }` and creates a bandit experiment with baseline vs variant.
- GET `/api/coach/examples` (MOCK friendly, reads `fixtures/coach/examples.json`).

UI
- Page `src/app/admin/coach/page.tsx` (Coach Studio).
- Left: input form; Right: suggestion cards with uplift, confidence, preview, risk badge, actions: Apply as A/B (creates experiment), Copy.
- “Try Coach” button added to Instant Analysis to pre-fill and navigate to Coach Studio.
- Recipe Book cards include “Coach with this template” linking with `templateId`.

Persistence
- All experiments persisted under `fixtures/experiments/` using `lib/experiments/store` (atomic writes). No external DB required.

MOCK vs Live
- With `MOCK=1`, generators produce deterministic content via seeded RNG and fixtures. APIs are instant and never 500.
- Live mode: all endpoints catch errors and return valid empty shapes.

Proof Tiles
- `/api/proof-tiles` updated to compute Objective #10 PASS when suggest returns ≥3 suggestions with `expectedLift` and apply returns an `experimentId`.



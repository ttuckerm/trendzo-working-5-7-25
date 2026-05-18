# Escape Assessment Funnel Inventory — 2026-05-15

Repo root: `C:\Projects\CleanCopy` (branch: `vercel-deploy-test`).
All paths in this document are absolute Windows paths under that root unless noted.

---

## Section 1: Dev Server and Port Config

### package.json scripts (only dev/build/start)

`C:\Projects\CleanCopy\package.json:5-11`

```
"scripts": {
  "dev": "next dev",
  "dev:turbo": "next dev --turbo",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest",
  ...
}
```

The npm scripts pass **no `-p` / `--port` flag**. `next dev` defaults to port `3000`.

### Where `3002` actually appears

- `C:\Projects\CleanCopy\.env.local:4` — `NEXT_PUBLIC_BASE_URL=http://localhost:3001` (note: `3001`, not `3002`).
- `C:\Projects\CleanCopy\.env.local:42` — `NEXTAUTH_URL=http://localhost:3000`.
- `C:\Projects\CleanCopy\.env.local:86` — `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
- `C:\Projects\CleanCopy\playwright.config.ts:7,11` — `baseURL: process.env.PW_BASE_URL || 'http://localhost:3002'` (Playwright is wired to `3002`).
- `C:\Projects\CleanCopy\scripts\demo-accuracy.ts:7` — `const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3002'`.
- `C:\Projects\CleanCopy\scripts\reset-dev.ts:3` — same default.
- `C:\Projects\CleanCopy\scripts\process-scraped-videos-to-dps.ts:29` — `process.env.DPS_API_URL || 'http://localhost:3002/api/dps/calculate'`.
- `C:\Projects\CleanCopy\scripts\test-dps-api.js:10`, `scripts\test-dps-api.ts:9`, `scripts\test-script-generation.ts:32`, `scripts\test-pre-content-prediction.js:16`, `test-feat007.js:10`, `test-pattern-extraction.ps1:16`, `test-pattern-extraction.js:20`, `test-enhancements.ps1:30,62`, `debug-pattern-extraction.js:14`, `scripts\batch-extract-knowledge.js:120`, `scripts\llm-smoke.ps1:1` (`param([int]$Port = 3002)`) — all hardcode `3002` as the dev URL.
- `C:\Projects\CleanCopy\src\app\api\admin\test-ui-integration\route.ts:10`, `src\app\api\admin\super-admin\dashboard-data\route.ts:15-16` — `NEXT_PUBLIC_APP_URL || 'http://localhost:3002'`.

**Conclusion:** Nothing in npm scripts, `next.config.mjs`, `.env.local`, or `.env.example` sets the port to 3002. The 3002 the user is seeing is either (a) `next dev` falling back to 3002 because 3000/3001 are already in use (it auto-increments), or (b) the user is invoking `npm run dev -- -p 3002` / `next dev -p 3002` manually. INFERRED: option (a) is most likely — the test scripts hardcoding 3002 strongly suggest the dev-server-on-3002 became a project convention because someone routinely had something else running on 3000/3001.

### How many Next.js apps in this repo?

`C:\Projects\CleanCopy\next.config.mjs` is the only `next.config.*` at the repo root. The funnel pages all live under the single `C:\Projects\CleanCopy\src\app` App Router tree. There is NOT a nested funnel app — code-validate, freedom-os, assessment, and freedom-agent routes are all in the same Next.js project.

---

## Section 2: Landing Page and Code Redemption

### Landing page file

- `C:\Projects\CleanCopy\src\app\page.tsx` (entire file, 67 lines). Renders 13 landing sections + a CheckoutBanner from `@/components/landing/*`.

The three sections that contain the code input + paid CTA: `HookSection`, `CTASection`, `CloseSection` (see `C:\Projects\CleanCopy\src\components\landing\HookSection.tsx:2-3`, `CTASection.tsx:1-4`, `CloseSection.tsx:1-2`).

### Code entry UI

- `C:\Projects\CleanCopy\src\components\landing\CodeEntry.tsx` — controlled `<input maxLength=5>` with auto-uppercase and `/^[A-Z]{5}$/` enforcement client-side. Posts to `/api/landing/code-validate`. On success it `router.push(data.redirectTo)` (redirect target is server-controlled).

### Code validation logic + valid-code source

`C:\Projects\CleanCopy\src\app\api\landing\code-validate\route.ts:91-119`

```
if (!/^[A-Z]{5}$/.test(rawCode)) {
  return NextResponse.json(GENERIC_INVALID, { status: 400 });
}
...
const { data: redemptionId, error: rpcErr } = await supabase.rpc('redeem_code', {
  p_code: rawCode,
  p_ip: ip,
});
```

Valid codes live in the Supabase table `public.redemption_codes` (see migration `C:\Projects\CleanCopy\supabase\migrations\20260429000000_create_redemption_codes.sql:16-27`). Validation goes through the `redeem_code` Postgres function (same migration, lines 69-102), which:

1. `SELECT ... FOR UPDATE` on the code row.
2. Rejects (raises `P0001`) if not found / revoked / expired / `redemption_count >= max_redemptions`.
3. Inserts a `code_redemptions` row, increments the count, returns the redemption UUID.

So valid codes are: **(b) Supabase table** — NOT hardcoded TS, NOT env var.

### Currently configured codes

NOT FOUND IN CODE — the codes are in the live Supabase DB, not in source. The repo only contains the generator script `C:\Projects\CleanCopy\scripts\generate-codes.ts` (CLI tool that inserts codes into the table). The MEMORY note that today's code is `TREND` (formerly `LONEY`) must be verified against the Supabase `redemption_codes` table — `grep` for those strings in `src/**` finds no funnel hits (only unrelated TRENDZO branding strings).

### Redirect target after valid code

`C:\Projects\CleanCopy\src\app\api\landing\code-validate\route.ts:121` returns `{ ok: true, redirectTo: '/welcome?source=code' }`. The CodeEntry client component (`CodeEntry.tsx:62`) honors that, so the actual landing-after-code flow is:

```
landing /  →  POST /api/landing/code-validate  →  /welcome?source=code  →  /free/freedom-os
```

The dl_code_path HttpOnly signed cookie is set on the response (lines 122-131), TTL 30 min.

### `/welcome` gate

- `C:\Projects\CleanCopy\src\app\(public)\welcome\page.tsx` — server component that re-validates either the Stripe session (Path A) or the `dl_code_path` cookie (Path B). If neither, `redirect('/')`. The "Begin Your Assessment" CTA links to `/free/freedom-os` (Path B) or `/free/freedom-os?session_id=...` (Path A).

---

## Section 3: Stripe Purchase Path

### Files

| Purpose | File |
|---|---|
| Checkout button (UI) | `C:\Projects\CleanCopy\src\components\landing\PaidCheckoutButton.tsx` |
| Create-session API | `C:\Projects\CleanCopy\src\app\api\checkout\create-session\route.ts` |
| Webhook | `C:\Projects\CleanCopy\src\app\api\checkout\webhook\route.ts` |
| Verify-session API | `C:\Projects\CleanCopy\src\app\api\checkout\verify-session\route.ts` |
| Verify lib | `C:\Projects\CleanCopy\src\lib\stripe\verify.ts` |
| Stripe client cache | `C:\Projects\CleanCopy\src\lib\stripe\client.ts` |
| Service-role Supabase | `C:\Projects\CleanCopy\src\lib\stripe\admin.ts` |
| Signed-cookie helpers | `C:\Projects\CleanCopy\src\lib\stripe\cookie.ts` |

There is also an UNUSED-by-funnel `C:\Projects\CleanCopy\src\app\api\billing\stripe\webhook` route; the funnel only uses `/api/checkout/*`.

### Success / cancel URLs

`C:\Projects\CleanCopy\src\app\api\checkout\create-session\route.ts:46-48`

```
success_url: `${base}/welcome?source=paid&session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${base}/?checkout=cancelled`,
allow_promotion_codes: false,
```

Base URL is `process.env.NEXT_PUBLIC_SITE_URL`. The amount is hardcoded `AMOUNT_CENTS = 9700` (`create-session/route.ts:8`).

### Stripe env vars read by funnel code

- `STRIPE_SECRET_KEY` — `src/lib/stripe/client.ts:7`
- `STRIPE_PRICE_ID_ESCAPE_ASSESSMENT` — `src/app/api/checkout/create-session/route.ts:11`
- `STRIPE_WEBHOOK_SECRET` — `src/app/api/checkout/webhook/route.ts:10`
- `NEXT_PUBLIC_SITE_URL` — `src/app/api/checkout/create-session/route.ts:12`

### "Instant access" mechanic

There is no direct grant — the success URL is `/welcome?source=paid&session_id=cs_...`, and the welcome page server-side polls `verifySession` (`src/app/(public)/welcome/page.tsx:19-33`) for up to 10s with 1s backoff waiting for the webhook to flip the row from `pending` to `paid`. The webhook (`api/checkout/webhook/route.ts:29-50`) listens for `checkout.session.completed` and updates `stripe_purchases` via the service-role supabase client. Once `status='paid'`, `/welcome` renders a "Begin Your Assessment" button that deep-links to `/free/freedom-os?session_id=...`, which re-runs the same `waitForPaid` poll (`src/app/(public)/free/freedom-os/page.tsx:14-30`) before mounting the form. Final consumption (status → `consumed`) happens in `/api/assessment/generate` after the assessment row lands (`src/app/api/assessment/generate/route.ts:172-189`).

---

## Section 4: The 9-Question Form

### Page

- `C:\Projects\CleanCopy\src\app\(public)\free\freedom-os\page.tsx` — server component, performs Path A (Stripe session) and Path B (cookie) gating.
- `C:\Projects\CleanCopy\src\app\(public)\free\freedom-os\FreedomOSTool.tsx` — the actual form (`'use client'`, 494 lines). All 9 fields are here. localStorage-persisted under key `dl:freedom-os:v1:state`.

The 9 fields (`FreedomOSTool.tsx:265-444`): firstName, hoursPerWeek, monthlyIncome, monthlyExpenses, runwayMonths (with months / $-amount toggle), skillProfile, riskTolerance (low/medium/high radio), audienceAccess, nicheSignal — plus a `FreedomMultiplierControl` slider (control, not a field).

### Submission handler / API route

Submit posts JSON to `/api/assessment/generate` (`FreedomOSTool.tsx:175-178`).

- Form-side mapper: `C:\Projects\CleanCopy\src\lib\assessment\build-input-from-form.ts` (pure validator).
- API route: `C:\Projects\CleanCopy\src\app\api\assessment\generate\route.ts`.

### Submission writes to Supabase immediately AND triggers an LLM call

The route does both, in this order (`api/assessment/generate/route.ts`):
1. Validates the input (lines 91-102).
2. Calls `generateAssessment(input)` (line 113) — this is the Claude call (Section 5).
3. Inserts the result into `escape_assessments` with retry-on-EA-X-XXX-collision (lines 129-163).
4. If Stripe-path, marks `stripe_purchases` consumed (172-189).
5. If code-path, fills `code_redemptions.assessment_id` (195-208).
6. Returns `{ok, assessment, internalAssessmentUuid, assessmentId, shareToken, shareUrlId}`.

---

## Section 5: Calibration (The 90-Second Loading Screen)

### Calibration page file

There is **no separate `/free/freedom-os` calibration page** — the loader is an in-page client overlay. The "90-second loading screen" is `<HamsterLoader visible={isSubmitting} />` mounted by `FreedomOSTool.tsx:483` while the `/api/assessment/generate` POST is in flight.

- Loader component: `C:\Projects\CleanCopy\src\components\freedom-os\HamsterLoader.tsx` — rotates 4 phrases ("Calibrating your Freedom Number…", "Mapping your 14-day sprint…", "Drafting your 90-day roadmap…", "Finding your first 50 leads…", `HamsterLoader.tsx:10-15`) every 3s, plus the "This usually takes about 90 seconds" subline (line 120).
- Loader CSS: `C:\Projects\CleanCopy\src\app\(public)\free\freedom-os\hamster-loader.css`.

### Backend job doing actual generation

- Route: `C:\Projects\CleanCopy\src\app\api\assessment\generate\route.ts` (POST handler).
- Library: `C:\Projects\CleanCopy\src\lib\assessment\generate.ts` — `generateAssessment(input)` (lines 181-311). Synchronous: one HTTP POST to Claude (no queue, no separate job runner).

### LLM provider + model

`C:\Projects\CleanCopy\src\lib\assessment\generate.ts:68-90`

```
async function callClaude(systemPrompt: string, userJson: string, retryNote?: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  ...
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages,
```

Provider: **Anthropic** via raw `fetch` (not the SDK). Model: `claude-sonnet-4-20250514`. The system prompt is built by `buildEscapeAssessmentPrompt(input)` from `C:\Projects\CleanCopy\src\lib\prompts\escape-assessment-prompt.ts`.

### Supabase table + columns

`escape_assessments` (`api/assessment/generate/route.ts:136-143`):
- `payload` JSONB — the full AssessmentPayload (contains `payload.assessmentId` = the EA-X-XXX display ID).
- `inputs` JSONB — the validated AssessmentInput.
- `assessment_id` UUID PK (auto-assigned).
- `share_token` TEXT (auto-assigned by DB default, see migration `20260430000000_assessment_share_token.sql`).

### Redirect to `/assessment/[id]`

Client-side `router.push` once `/api/assessment/generate` returns. `FreedomOSTool.tsx:211-215`:

```
const shareUrlId =
  typeof data.shareUrlId === 'string' && data.shareUrlId
    ? data.shareUrlId
    : data.assessmentId
router.push(`/assessment/${shareUrlId}`)
```

The `shareUrlId` format is `{EA-X-XXX}-{20-char share_token}` (see Section 6).

---

## Section 6: Assessment Results Page

### Dynamic route file

- `C:\Projects\CleanCopy\src\app\assessment\[assessmentId]\page.tsx` (47 lines). Server component that calls `parseShareIdParam` + `fetchAssessmentByShareId` and hands off to `<AssessmentHUD>`. Sibling files: `loading.tsx`, `not-found.tsx`.

### Supabase table read from

`escape_assessments`, looked up by `payload->>'assessmentId'` and then verified against the `share_token` column. See `C:\Projects\CleanCopy\src\lib\assessment\fetch-assessment.ts:102-106` and `143-155`.

### ID generation

`C:\Projects\CleanCopy\src\lib\assessment\generate.ts:24-28`

```
export function generateAssessmentId(): string {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 900) + 100
  return `EA-${a}-${b}`
}
```

Format is `EA-{1-9}-{100-999}` → 8,100-value address space. Collisions are retried up to 8 times (`api/assessment/generate/route.ts:134-163`).

The full URL ID is `{EA-X-XXX}-{share_token}` (e.g. `EA-7-378-k7x9m2nq8pwer4t5y6u8`). The share_token (20-char lowercase hex) is generated by the DB function `generate_assessment_share_token()` (`supabase/migrations/20260430000000_assessment_share_token.sql:24-34`).

### Components the assessment page renders

Mounted by `<AssessmentHUD>` (`C:\Projects\CleanCopy\src\components\assessment\AssessmentHUD.tsx`):

| Component | File |
|---|---|
| `SaveYourLinkNotice` | `src\components\assessment\SaveYourLinkNotice.tsx` |
| `DeliverablesHeader` | `src\components\assessment\DeliverablesHeader.tsx` |
| `OperatorPanel` (wrapped in `Chassis`) | `src\components\assessment\OperatorPanel.tsx` |
| `FreedomNumberRing` (ring) | `src\components\assessment\FreedomNumberRing.tsx` |
| `BusinessMatchPanel` | `src\components\assessment\BusinessMatchPanel.tsx` |
| `Day1Spotlight` | `src\components\assessment\Day1Spotlight.tsx` |
| `SprintGrid` (14-Day Sprint) | `src\components\assessment\SprintGrid.tsx` |
| `RoadmapList` (90-Day Roadmap) | `src\components\assessment\RoadmapList.tsx` |
| `LeadsPanel` (Lead Playbook) | `src\components\assessment\LeadsPanel.tsx` |
| `AgentRail` (Freedom Agent — bottom rail) | `src\components\assessment\AgentRail.tsx` |
| `RailClickGate` (wrapper) | `src\components\assessment\AgentGate.tsx` |
| `Chassis` (border/frame shared primitive) | `src\components\assessment\Chassis.tsx` |
| `AgentChip`, `AgentInput`, `AgentMessages`, `AgentIdentityGlyph` | `src\components\assessment\Agent*.tsx` |
| `HolographicRing` (sub-component of ring) | `src\components\assessment\HolographicRing.tsx` |
| `EmailCapturePanel` | `src\components\assessment\EmailCapturePanel.tsx` — IMPORTED by name (exports `EMAIL_CAPTURED_EVENT`) but **not actually rendered in the current `AssessmentHUD.tsx`** — INFERRED: this is leftover from a previous design where it sat above the rail; today the email ask is conversational, fired from inside `AgentRail` after 4 user messages. Keep in mind during extraction.

---

## Section 7: Freedom Agent (The AI Chat)

### Chat UI

- `C:\Projects\CleanCopy\src\components\assessment\AgentRail.tsx` (the floating bottom rail, expand/collapse, scrim, email-ask block).
- `C:\Projects\CleanCopy\src\components\assessment\AgentInput.tsx` (textarea).
- `C:\Projects\CleanCopy\src\components\assessment\AgentMessages.tsx` (message list).
- `C:\Projects\CleanCopy\src\components\assessment\AgentChip.tsx` (quick-reply chips).
- `C:\Projects\CleanCopy\src\components\assessment\AgentIdentityGlyph.tsx` (visual glyph).
- `C:\Projects\CleanCopy\src\components\assessment\AgentGate.tsx` — `RailClickGate` wrapper.

### Chat API route

- `C:\Projects\CleanCopy\src\app\api\freedom-agent\chat\route.ts` (POST, streaming).
- Conversation history GET: `C:\Projects\CleanCopy\src\app\api\freedom-agent\conversation\route.ts`.
- Other endpoints in `src\app\api\freedom-agent\`: `history`, `session`, `unsubscribe`, `weekly-checkin` — INFERRED: not all are funnel-active; `weekly-checkin` and `unsubscribe` are for outbound email check-ins.

### LLM provider + model

`C:\Projects\CleanCopy\src\app\api\freedom-agent\chat\route.ts:4-7,120-121`

```
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
...
result = streamText({
  model: anthropic('claude-sonnet-4-5-20250929'),
```

Provider: **Anthropic via the Vercel AI SDK** (`ai@^6` + `@ai-sdk/anthropic@^3`). Model: `claude-sonnet-4-5-20250929` (note: this is a different model from the generator, which uses `claude-sonnet-4-20250514`). `maxOutputTokens: 1024` (line 124).

### Conversation persistence

Yes. One row per assessment in Supabase table `freedom_agent_conversations` (migration `C:\Projects\CleanCopy\supabase\migrations\20260427100000_create_freedom_agent_conversations.sql`):

- `assessment_id` TEXT UNIQUE (the EA-X-XXX display ID, NOT the UUID).
- `messages` JSONB array of `{role, content, timestamp}`.
- `message_count` INTEGER.
- Capped at the 20 most-recent messages at write time (`C:\Projects\CleanCopy\src\lib\freedom-agent\append-message.ts:8`, `STORAGE_CAP = 20`). At chat-call time the route sends only the last 10 plus the new turn to the LLM (`chat\route.ts:21`, `SEND_TO_LLM_CAP = 10`).

Persistence happens in the `onFinish` callback of `streamText` (`chat\route.ts:125-136`).

### System prompt

Template (assembled from assessment data): `C:\Projects\CleanCopy\src\lib\prompts\freedom-agent-prompt.ts:6-62` (single exported constant `FREEDOM_AGENT_SYSTEM_PROMPT_TEMPLATE`). Per-request assembly: `C:\Projects\CleanCopy\src\lib\freedom-agent\build-system-prompt.ts:29-58` — replaces `{{ASSESSMENT_PAYLOAD_JSON}}`, `{{TODAY}}`, `{{SPRINT_START_DATE}}`, `{{CURRENT_SPRINT_DAY}}`.

First 30 lines of the system prompt template (`src/lib/prompts/freedom-agent-prompt.ts:6-35`):

```
You are the Freedom Agent — a personal advisor inside the user's Escape Assessment. You have full context on their plan and you reference their actual numbers, tasks, and timeline in every response.

YOU ARE NOT A GENERIC AI ASSISTANT. You are an advisor who already knows this person. Speak as if you've already read their assessment because you have. Do not introduce yourself unless asked. Do not say "based on your assessment" — just answer.

THE USER'S ASSESSMENT:
{{ASSESSMENT_PAYLOAD_JSON}}

TODAY'S DATE: {{TODAY}}
THEIR SPRINT START DATE: {{SPRINT_START_DATE}}
WHICH SPRINT DAY THEY'RE ON: {{CURRENT_SPRINT_DAY}}

HOW TO RESPOND:
- Reference their actual numbers (Freedom Number, monthly target, hours per week, runway). Never invent numbers.
- Reference their actual sprint tasks by day number when relevant. Never invent tasks.
- Reference their actual business match (businessName, firstOffer.name) by name. Never invent a different business.
- If they ask about a day they've already completed (per sprint_progress), acknowledge it.
- If they ask about a day in the future, tell them the task and the date.
- If they're behind schedule, do not lecture — give them the smallest possible next action that gets them moving.
- If they ask something the assessment doesn't cover, say so honestly and give your best advice anyway, flagged as your opinion not their plan.

TONE:
- Direct. No corporate energy. No "I'm here to help you on your journey" language.
- Confident. You know their plan. You don't hedge.
- Short. Default to 2-4 sentences. Expand only when they ask for detail.
- No emojis. No motivational filler. No exclamation points.

EMAIL ASK BEHAVIOR
Do not bring up email capture in your conversational responses. The system handles email asks via a separate UI component that appears at message 4. You must NEVER ask the user for their email yourself — the UI does it.
```

(The full template is 62 lines and includes refusal rules, quick-reply context, and Trendzo-product-disclosure rules.)

### Rate limiting

**No rate limiting on `/api/freedom-agent/chat`.** Searched the route — no token bucket, no Redis check, no `runtime: 'edge'` quota helper. The only gate is:
- The signed `dl_code_path` cookie / Stripe session is required to reach `/free/freedom-os` and generate an assessment in the first place.
- The chat route requires `assessmentId + shareToken` to match a stored row (`chat\route.ts:64-67`), and then refuses unless an `assessment_emails` row exists for this assessment (`chat\route.ts:72-79`) — that's the email gate (Section 8).

The `/api/landing/code-validate` and `/api/landing/email-notify` endpoints DO have in-process token buckets (10/5min/IP), but the chat does not.

---

## Section 8: Email Gate and Beehiiv

### Email gate component (capture UI)

The capture UI lives in two places, both inside `AgentRail.tsx`:
1. The conversational email ask block (`EmailAskBlock`, `C:\Projects\CleanCopy\src\components\assessment\AgentRail.tsx:697-862`). Triggered after `EMAIL_ASK_THRESHOLD = 4` user messages.
2. The legacy `EmailCapturePanel.tsx` (still in the file tree but no longer rendered by `AssessmentHUD.tsx` — see Section 6).

### API route that captures + pushes to Beehiiv

`C:\Projects\CleanCopy\src\app\api\assessment\email-capture\route.ts` (POST). Inserts to `assessment_emails`, then fires `notifyBeehiiv` as a best-effort side-effect (lines 152-210).

There is a second Beehiiv path for landing-page subscribers (no assessment yet): `C:\Projects\CleanCopy\src\app\api\landing\email-notify\route.ts` — inserts to `landing_email_notifications`, tags `high-intent`.

### Beehiiv API call (≤ 10 lines)

`C:\Projects\CleanCopy\src\lib\beehiiv\notify.ts:90-106` (step 1 of 3 — create/reactivate):

```
const createRes = await fetch(
  `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions`,
  {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      reactivate_existing: params.reactivateExisting ?? true,
      send_welcome_email: params.sendWelcomeEmail ?? false,
      utm_source: params.utmSource ?? 'dailylotion',
      ...
```

`BEEHIIV_BASE = 'https://api.beehiiv.com/v2'` (line 29). The helper then POSTs to `/subscriptions/:id/tags` (step 2, lines 162-187) and PUTs `/subscriptions/:id` to re-assert custom fields (step 3, lines 192-212).

### How the `building-momentum` tag is determined

`C:\Projects\CleanCopy\src\app\api\assessment\email-capture\route.ts:155-199`

```
const operatorInputs = assessment.payload.operator.inputs
const lite: EscapeAssessmentInputsLite = {
  hoursPerWeek: operatorInputs.hoursPerWeek,
  ...
}
const segment = classifyEscapeAssessment(lite)
...
await notifyBeehiiv({
  email: body.email,
  customFields,
  tags: [segment],
  ...
```

The actual classification logic is in `C:\Projects\CleanCopy\src\lib\funnel\segment.ts:211-264` — function `classifyEscapeAssessment` returns one of 4 segments: `'ready-to-scale' | 'building-momentum' | 'stuck-zero' | 'tire-kicker'`. First-match-wins, ordered strongest signal first. Thresholds (segment.ts:228-258):

- `ready-to-scale`: hours ≥ 15 AND audience contains a number ≥ 1000 or established-platform keyword AND skillProfile ≥ 30 chars AND nicheSignal is concrete.
- `building-momentum`: hours 8-15 AND nicheSignal concrete AND skillProfile ≥ 20 chars. (Also: hours > 15 with concrete niche+skill but unproven audience.)
- `stuck-zero`: hours 3-8, or no clear niche but skillProfile descriptive.
- `tire-kicker`: fallback.

Custom fields pushed (`email-capture/route.ts:189-194`): `assessment_url`, `funnel_segment`, `freedom_number`, `youtube_source`.

The landing-page sibling (`api/landing/email-notify/route.ts:113-126`) instead sends `customFields: [{name:'waitlist_source', value:'landing-page'}]` and tags `['high-intent']`.

### Beehiiv env vars

- `BEEHIIV_API_KEY` — `src/lib/beehiiv/notify.ts:69`.
- `BEEHIIV_PUBLICATION_ID` — `src/lib/beehiiv/notify.ts:70`.

### What gets written to Supabase on email capture

`C:\Projects\CleanCopy\src\app\api\assessment\email-capture\route.ts:124-131` writes to `assessment_emails`:

```
const { error: insertError } = await supabase
  .from('assessment_emails')
  .insert({
    assessment_id: body.assessmentId,   // EA-X-XXX display id (TEXT, UNIQUE)
    email: body.email,
    capture_source: body.source,         // 'hud_panel' | 'agent_conversation'
    notify_on_codes: body.notifyOnCodes ?? true,
  })
```

On `23505` unique-violation the row is treated as "already captured" (line 136). Schema: `supabase/migrations/20260428000000_create_assessment_emails.sql:1-9`.

---

## Section 9: Shared Dependencies (The Tangle Question)

### Non-funnel imports

Below: every `@/...` import from each funnel file, classified.

#### Landing components (`src/components/landing/*`)

| File | Import | Source | Class |
|---|---|---|---|
| `CodeEntry.tsx` | `Chassis` | `@/components/assessment/Chassis` | Pure (intra-funnel, design primitive) |
| `NotForSection.tsx` | `Chassis` | `@/components/assessment/Chassis` | Pure |
| `StackSection.tsx` | `Chassis` | `@/components/assessment/Chassis` | Pure |
| `ReceiveSection.tsx` | `Chassis` | `@/components/assessment/Chassis` | Pure |
| `TestimonialsSection.tsx` | `Chassis` | `@/components/assessment/Chassis` | Pure |

The landing page bare imports `@/styles/instrument.css` (the funnel's bespoke design tokens). No `@/lib/supabase`, no `@/lib/auth`, no `@/components/ui` (shadcn) imports anywhere in `src/components/landing/`.

#### Assessment components (`src/components/assessment/*`)

| File | Import | Source | Class |
|---|---|---|---|
| `AssessmentHUD.tsx` | `AssessmentPayload` (type) | `@/types/assessment` | Pure (type-only) |
| | `SprintProgressMap` (type) | `@/lib/assessment/fetch-assessment` | Pure (type-only) |
| | `@/styles/instrument.css` | side-effect import | Pure |
| `OperatorPanel.tsx` | `AssessmentPayload` (type) | `@/types/assessment` | Pure |
| `SprintGrid.tsx` | `SprintBlock`, `SprintDay` (types) | `@/types/assessment` | Pure |
| | `SprintProgressMap` (type) | `@/lib/assessment/fetch-assessment` | Pure |
| `RoadmapList.tsx` | `RoadmapBlock` (type) | `@/types/assessment` | Pure |
| `LeadsPanel.tsx` | `LeadsBlock` (type) | `@/types/assessment` | Pure |
| `Day1Spotlight.tsx` | `SprintDay` (type) | `@/types/assessment` | Pure |
| `BusinessMatchPanel.tsx` | `BusinessMatch` (type) | `@/types/assessment` | Pure |
| `FreedomNumberRing.tsx` | `FreedomNumber` (type) | `@/types/assessment` | Pure |
| `AgentRail.tsx` | `AgentContext` (type) | `@/types/assessment` | Pure |
| | `FreedomAgentMessage` (type) | `@/types/freedom-agent` | Pure |
| | `EmailCaptureResponse`, etc. (types) | `@/types/email-capture` | Pure |
| `AgentMessages.tsx` | `FreedomAgentMessage` (type) | `@/types/freedom-agent` | Pure |

All component imports are type-only or intra-funnel. NONE pull anything from `src/components/ui/*`, `src/lib/supabase/*`, `src/lib/auth/*`, agency/operator/creator modules.

#### Funnel API routes

| Route | Imports | Source | Class |
|---|---|---|---|
| `api/landing/code-validate/route.ts` | `createClient` | `@supabase/supabase-js` | external pkg |
| | `CODE_PATH_COOKIE_*` | `@/lib/stripe/cookie` | Pure (intra-funnel) |
| `api/landing/email-notify/route.ts` | `createServerSupabaseClient` | `@/lib/supabase/server` | **Connected — see note** |
| | `notifyBeehiiv` | `@/lib/beehiiv/notify` | Pure (intra-funnel) |
| `api/checkout/create-session/route.ts` | `getStripe` | `@/lib/stripe/client` | Pure |
| | `getServiceSupabase` | `@/lib/stripe/admin` | Pure |
| `api/checkout/webhook/route.ts` | same two | `@/lib/stripe/*` | Pure |
| `api/checkout/verify-session/route.ts` | `verifySession` | `@/lib/stripe/verify` | Pure |
| `api/assessment/generate/route.ts` | `createClient` | `@supabase/supabase-js` | external |
| | `AssessmentInput`, `RiskTolerance` (types) | `@/types/assessment` | Pure |
| | `generateAssessment`, `generateAssessmentId` | `@/lib/assessment/generate` | Pure |
| | `CODE_PATH_COOKIE_*`, `readCodePathCookieRedemptionId` | `@/lib/stripe/cookie` | Pure |
| `api/assessment/email-capture/route.ts` | `createClient` (also `SupabaseClient` type) | `@supabase/supabase-js` | external |
| | `fetchAssessmentByShareId`, `DISPLAY_ID_REGEX`, `SHARE_TOKEN_REGEX` | `@/lib/assessment/fetch-assessment` | Pure |
| | `EmailCaptureRequest`, `EmailCaptureSource` (types) | `@/types/email-capture` | Pure |
| | `notifyBeehiiv` | `@/lib/beehiiv/notify` | Pure |
| | `classifyEscapeAssessment` | `@/lib/funnel/segment` | **Connected — see note** |
| `api/assessment/email-status/route.ts` | `createClient` | `@supabase/supabase-js` | external |
| | `DISPLAY_ID_REGEX`, `SHARE_TOKEN_REGEX`, `fetchAssessmentByShareId` | `@/lib/assessment/fetch-assessment` | Pure |
| | `EmailCaptureSource` (type) | `@/types/email-capture` | Pure |
| `api/freedom-agent/chat/route.ts` | `streamText` | `ai` | external |
| | `anthropic` | `@ai-sdk/anthropic` | external |
| | `createClient` | `@supabase/supabase-js` | external |
| | `FreedomAgentChatRequest`, `FreedomAgentMessage` (types) | `@/types/freedom-agent` | Pure |
| | `fetchAssessmentByShareId`, `SHARE_TOKEN_REGEX` | `@/lib/assessment/fetch-assessment` | Pure |
| | `fetchOrCreateConversation` | `@/lib/freedom-agent/fetch-conversation` | Pure |
| | `appendMessages` | `@/lib/freedom-agent/append-message` | Pure |
| | `buildFreedomAgentSystemPrompt` | `@/lib/freedom-agent/build-system-prompt` | Pure |
| `api/freedom-agent/conversation/route.ts` | `fetchConversation` | `@/lib/freedom-agent/fetch-conversation` | Pure |
| | `fetchAssessmentByShareId`, `DISPLAY_ID_REGEX`, `SHARE_TOKEN_REGEX` | `@/lib/assessment/fetch-assessment` | Pure |
| `(public)/free/freedom-os/page.tsx` | `CODE_PATH_COOKIE_*`, `verifyCodePathCookieValue` | `@/lib/stripe/cookie` | Pure |
| | `verifySession` | `@/lib/stripe/verify` | Pure |
| `(public)/welcome/page.tsx` | same two | `@/lib/stripe/*` | Pure |
| `(public)/free/freedom-os/FreedomOSTool.tsx` | `buildInputFromForm` | `@/lib/assessment/build-input-from-form` | Pure |

#### Notes on the two "Connected" classifications

1. **`@/lib/supabase/server.ts` (`createServerSupabaseClient`)** — used ONLY by `api/landing/email-notify/route.ts`. The helper itself (`src/lib/supabase/server.ts`, 30 lines) is a thin wrapper around `@supabase/ssr` + `next/headers` cookies. By itself it's pure, BUT it's also imported by ~80 other routes/agency-side code in the repo (confirmed: `grep` finds it in agency-chat, brief routes, etc.). For extraction, either (a) ship this file as-is and depend on it, or (b) refactor `email-notify` to use the inline `createClient(url, key)` pattern that every other funnel route already uses. Option (b) is the cleaner split and is a ~5-line change.

2. **`@/lib/funnel/segment.ts` (`classifyEscapeAssessment`)** — the file ALSO exports the legacy `classifyLead` function (`segment.ts:28-55`) and `FreedomOsInputs` / `mapInputsForSegmentation` (`segment.ts:1-75`). Those legacy exports are used by the older `/free/freedom-os/plan/[planId]` flow and the legacy `freedom-os` API routes. The Escape Assessment funnel uses ONLY the lower half (`classifyEscapeAssessment` + `EscapeSegment` + `EscapeAssessmentInputsLite`, lines 77-264). For extraction, split this file: keep only lines 1, 77-264 (drop the legacy classifier).

#### Funnel-only utility libs

These are 100% used by funnel code only and are clean to extract:

- `src/lib/assessment/generate.ts` (Claude call + JSON-extract + payload transforms)
- `src/lib/assessment/build-input-from-form.ts` (pure form validator)
- `src/lib/assessment/fetch-assessment.ts` (Supabase read + share-token verification)
- `src/lib/assessment/validate-payload.ts` (imported by `generate.ts` — schema describer; not read directly above but referenced from `generate.ts:14` and `fetch-assessment.ts:12`)
- `src/lib/freedom-agent/fetch-conversation.ts`
- `src/lib/freedom-agent/append-message.ts`
- `src/lib/freedom-agent/build-system-prompt.ts`
- `src/lib/prompts/freedom-agent-prompt.ts`
- `src/lib/prompts/escape-assessment-prompt.ts`
- `src/lib/stripe/cookie.ts`, `client.ts`, `admin.ts`, `verify.ts`
- `src/lib/beehiiv/notify.ts`

NOT touched by the funnel but co-resident in `src/lib/freedom-agent/`: `load-plan-for-session.ts`, `niche-templates.ts`, `plan-prompt-section.ts`, `progress-tracker.ts`, `soft-sell-arc.ts`. These belong to the legacy `freedom-os` plan flow. `src/lib/prompts/freedom-agent.ts` (note: no `-prompt` suffix) is also legacy. Verify by usage before deciding to extract.

---

## Section 10: Environment Variables

Every `process.env.X` reference inside funnel files, grouped:

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` — used by every funnel route + `fetch-assessment.ts`, `fetch-conversation.ts`, `append-message.ts`, `stripe/admin.ts`, `lib/supabase/server.ts`, middleware.
- `SUPABASE_URL` — fallback alternate, used by every funnel route that falls back beyond the NEXT_PUBLIC one.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon read paths.
- `SUPABASE_ANON_KEY` — fallback alternate.
- `SUPABASE_SERVICE_KEY` — preferred service-role key.
- `SUPABASE_SERVICE_ROLE_KEY` — fallback alternate.

### Stripe
- `STRIPE_SECRET_KEY` — `src/lib/stripe/client.ts:7`.
- `STRIPE_PRICE_ID_ESCAPE_ASSESSMENT` — `api/checkout/create-session/route.ts:11`.
- `STRIPE_WEBHOOK_SECRET` — `api/checkout/webhook/route.ts:10`.
- `NEXT_PUBLIC_SITE_URL` — `api/checkout/create-session/route.ts:12`, also read by `api/assessment/email-capture/route.ts:169` as the first of three fallbacks.

### Beehiiv
- `BEEHIIV_API_KEY` — `src/lib/beehiiv/notify.ts:69`.
- `BEEHIIV_PUBLICATION_ID` — `src/lib/beehiiv/notify.ts:70`.

### LLM
- `ANTHROPIC_API_KEY` — read by `src/lib/assessment/generate.ts:69` AND consumed implicitly by `@ai-sdk/anthropic` in `api/freedom-agent/chat/route.ts`.

### Site URL fallbacks (used to build links in Beehiiv payloads)
- `NEXT_PUBLIC_SITE_URL` — see above (Stripe).
- `NEXT_PUBLIC_BASE_URL` — `api/assessment/email-capture/route.ts:170` fallback.
- `NEXT_PUBLIC_APP_URL` — `api/assessment/email-capture/route.ts:171` fallback.

### Cookie secret
- `CODE_PATH_COOKIE_SECRET` — `src/lib/stripe/cookie.ts:7`.

### Auth bypass / middleware
- `NEXT_PUBLIC_DISABLE_AUTH` — `src/middleware.ts:169`. (Set to `true` in `.env.local`, so middleware short-circuits everywhere in dev.)
- `NODE_ENV` — `api/landing/code-validate/route.ts:127` (for `secure` cookie flag).

### Not used by funnel but loaded by neighbor scripts
The `.env.local` file also contains keys for OpenAI, Apify, KlingAI, Gemini, Resend (`RESEND_API_KEY` commented out), SMTP (gmail/resend), `BRIEF_ACK_SECRET`, `NEXTAUTH_*`, `CRON_SECRET`, `SCRAPECREATORS_API_KEY` — none of these are read by funnel files.

---

## Section 11: Supabase Tables Touched by the Funnel

| Table | Operation | File | Migration | Status |
|---|---|---|---|---|
| `escape_assessments` | INSERT | `api/assessment/generate/route.ts:137-143` | `20260426120000_create_escape_assessments.sql` + `20260427000000_add_sprint_progress.sql` + `20260427010000_unique_payload_assessment_id.sql` + `20260430000000_assessment_share_token.sql` | confirmed |
| `escape_assessments` | SELECT | `lib/assessment/fetch-assessment.ts:102-106` | same | confirmed |
| `escape_assessments` | UPDATE (sprint_progress) | INFERRED — sprint-progress route exists at `src/app/api/assessment/sprint-progress` (see `api/assessment/` listing) — not opened in this audit | same | confirmed |
| `redemption_codes` | SELECT + UPDATE (via RPC `redeem_code`) | `api/landing/code-validate/route.ts:109-112` | `20260429000000_create_redemption_codes.sql` | confirmed |
| `redemption_codes` | SELECT (lookup youtube_source) | `api/assessment/email-capture/route.ts:81-86` | same | confirmed |
| `code_redemptions` | INSERT (via RPC `redeem_code`) | same RPC | same migration | confirmed |
| `code_redemptions` | UPDATE (set assessment_id) | `api/assessment/generate/route.ts:196-202` | same | confirmed |
| `code_redemptions` | SELECT (lookup by assessment_id) | `api/assessment/email-capture/route.ts:75-80` | same | confirmed |
| `stripe_purchases` | INSERT | `api/checkout/create-session/route.ts:68-74` | `20260428200000_create_stripe_purchases.sql` | confirmed |
| `stripe_purchases` | UPDATE (status=paid) | `api/checkout/webhook/route.ts:52-55` | same | confirmed |
| `stripe_purchases` | UPDATE (status=consumed) | `api/assessment/generate/route.ts:174-183` | same | confirmed |
| `stripe_purchases` | SELECT | `lib/stripe/verify.ts:11-15` | same | confirmed |
| `assessment_emails` | INSERT | `api/assessment/email-capture/route.ts:124-131` | `20260428000000_create_assessment_emails.sql` | confirmed |
| `assessment_emails` | SELECT (gate check) | `api/freedom-agent/chat/route.ts:223-228` | same | confirmed |
| `assessment_emails` | SELECT (status check) | `api/assessment/email-status/route.ts:52-56` | same | confirmed |
| `assessment_emails` | SELECT (lookup existing on conflict) | `api/assessment/email-capture/route.ts:138-141` | same | confirmed |
| `landing_email_notifications` | INSERT | `api/landing/email-notify/route.ts:84-86` | `20260428100000_create_landing_emails.sql` | confirmed |
| `freedom_agent_conversations` | SELECT/INSERT/UPDATE | `lib/freedom-agent/fetch-conversation.ts:68-94`, `lib/freedom-agent/append-message.ts:41-58` | `20260427100000_create_freedom_agent_conversations.sql` | confirmed |

All tables referenced by funnel code have a migration file in `supabase/migrations/`. No orphans.

---

## Section 12: Middleware and Auth

### `src/middleware.ts` matcher

`C:\Projects\CleanCopy\src\middleware.ts:236-241`

```
export const config = {
  matcher: [
    // Page routes (exclude static assets)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

The matcher hits everything except static assets — so the middleware runs on every funnel route. But:

### Public-route allowlist

`src/middleware.ts:16-28`

```
const PUBLIC_PREFIXES = [
  '/free',
  '/login',
  '/signup',
  '/auth',
  '/api/free',
  '/api/freedom-agent',
  '/api/funnel',
  '/api/auth',
  '/api/health',
  '/api/ping',
  '/api/cron',
]
```

Funnel routes that match the allowlist directly:
- `/free/freedom-os` ✓
- `/api/freedom-agent/*` ✓

Funnel routes that DO NOT appear in the allowlist:
- `/` (landing)
- `/welcome`
- `/assessment/[id]`
- `/api/landing/*` (code-validate, email-notify)
- `/api/assessment/*` (generate, email-capture, email-status, sprint-progress)
- `/api/checkout/*`

However, these are all rescued because `getRequiredRoles(reqUrl)` returns `null` for them (none match `PROTECTED_ROUTES` in `middleware.ts:33-45`, which only protects `/chairman`, `/admin`, `/agency`, `/creator`, `/dashboard`, `/onboarding`, `/api/admin`, `/api/agency-chat`, `/api/chairman-chat`). The middleware `NextResponse.next({ request })` for any non-protected route (line 189).

### Additionally — dev short-circuit

`src/middleware.ts:168-170`

```
if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
  return NextResponse.next()
}
```

`.env.local` sets `NEXT_PUBLIC_DISABLE_AUTH=true` (line 17), so middleware is a no-op in dev for every route.

### Funnel auth posture

All funnel routes are PUBLIC. The funnel does not require Supabase auth login at any point. Identity is gated by:
1. The signed HttpOnly `dl_code_path` cookie (30-min TTL) issued at `/api/landing/code-validate` and verified at `/free/freedom-os` page render.
2. The Stripe `session_id` query param + `stripe_purchases.status='paid'` row.
3. The `share_token` URL fragment on `/assessment/{EA-X-XXX}-{share_token}` for all assessment + freedom-agent reads.
4. The `assessment_emails` row presence for the chat endpoint specifically.

### Extraction risk

Low. The funnel doesn't depend on the middleware's role-routing table, and the dev short-circuit env var means even the role-routing isn't exercised today. Middleware imports nothing from funnel code. **However** the middleware does hit funnel page routes (the matcher catches them), so extracting it to a standalone app means re-checking that the new minimal middleware also lets `/free/*`, `/api/freedom-agent/*`, `/api/landing/*`, `/api/assessment/*`, `/api/checkout/*` through unmolested. Easiest path is to strip middleware.ts down to public-allowlist-only or skip it entirely.

---

## Section 13: Observations and Open Questions

1. **Port 3002 is a convention, not configured.** No `next dev -p 3002` anywhere in package.json or shell scripts. The `playwright.config.ts` and ~13 scripts hardcode `localhost:3002` because some developer's dev server lives there. The most likely cause is `next dev` auto-incrementing past 3000/3001 when those ports are occupied by other services. INFERRED: the user is running `npm run dev` and accepting next.js's port-pick fallback. If they want to lock it, change package.json `dev` to `next dev -p 3002`.

2. **There are TWO different Claude models in the funnel:**
   - Assessment generator: `claude-sonnet-4-20250514` (`lib/assessment/generate.ts:85`, raw `fetch` to Anthropic API).
   - Freedom Agent chat: `claude-sonnet-4-5-20250929` (`api/freedom-agent/chat/route.ts:121`, via Vercel AI SDK `streamText`).
   This is intentional but worth noting. The newer model is on the chat path.

3. **`EmailCapturePanel.tsx` is dead code in the current HUD.** The component still exists at `src/components/assessment/EmailCapturePanel.tsx` and exports `EMAIL_CAPTURED_EVENT`, but `AssessmentHUD.tsx` does NOT render it (verified by `grep`). The conversational email ask inside `AgentRail.tsx` is the only active capture surface today. The event-name constant is also re-defined inside `AgentRail.tsx:27` — they may have drifted out of sync. Extraction candidate: delete `EmailCapturePanel.tsx`, keep the constant in one place.

4. **`src/lib/funnel/segment.ts` has two classifiers in one file.** `classifyLead` (legacy, used by `/free/freedom-os/plan/[planId]`) and `classifyEscapeAssessment` (new Escape funnel). Splitting the file along the comment fence at line 77 isolates the funnel from the legacy plan flow cleanly.

5. **Legacy `/free/freedom-os/plan/[planId]`, `/api/free/freedom-os/lead`, `/api/free/freedom-os/resend`, `/api/freedom-os/generate` routes still exist.** These predate the Escape Assessment funnel (the page metadata in `FreedomOSTool.tsx` still says "Generate Your Escape Assessment" but in `lib/freedom-os/` the modules carry plan-id semantics). If extracting the new funnel, leave the legacy routes behind — they don't import from the new funnel.

6. **The `/free` middleware allowlist would match `/free/anything`.** That's the assumption behind the funnel being "public" — but it also means any future `/free/*` subpath inherits this exemption. Be intentional about what lives under `/free`.

7. **No rate limit on the chat endpoint.** `/api/freedom-agent/chat` has only structural gates (assessmentId + shareToken + email gate). An attacker who has captured an email on a valid assessmentId can hit chat repeatedly. The two LLM-cap mitigations are `MAX_MESSAGE_CHARS = 2000` (`chat/route.ts:19`) and `maxOutputTokens: 1024` (line 124). The landing routes (`/api/landing/code-validate`, `/api/landing/email-notify`) DO have in-process 10-req/5-min/IP buckets.

8. **Code path uses an HMAC cookie, paid path uses a session ID query param.** They're verified differently. `verifySession` reads `stripe_purchases.status`; `verifyCodePathCookieValue` reads the signed cookie. Both eventually converge at the `/free/freedom-os` page guard but their failure modes (already_used vs expired vs unknown) diverge slightly.

9. **The `redemption_codes` table is the source of truth for valid codes.** The MEMORY note says today's code is `TREND` (formerly `LONEY`). NOT verifiable from source — only the Supabase `redemption_codes` table can confirm. If extraction needs to migrate codes, dump that table.

10. **`stripe_purchases.amount_paid_cents` is hardcoded to 9700 on the client side.** `api/checkout/create-session/route.ts:8`. If the price changes in Stripe but the env price ID stays, the row will record the wrong amount. Cosmetic risk only.

11. **The "90 seconds" loader claim is not enforced.** The HamsterLoader displays "This usually takes about 90 seconds" (`HamsterLoader.tsx:120`) but the actual generation is one synchronous Claude call (max retries 2-3). Real latency depends on Anthropic API performance. INFERRED: 90s is an upper-bound user-comfort estimate, not a backend SLA.

12. **Sprint-progress route was not opened.** `src/app/api/assessment/sprint-progress` is in the listing but not analyzed here. It's referenced by `SprintGrid.tsx` and `Day1Spotlight.tsx`. Follow-up read worth doing if extraction targets the assessment HUD's interactivity.

13. **Both `/welcome` and `/free/freedom-os` independently re-validate the code/paid gate.** This is good defense-in-depth, but extraction must preserve both checkpoints — not just one.

---

Output path: `C:\Projects\CleanCopy\FUNNEL_INVENTORY_2026-05-15.md`.

Funnel shape: a public single-page landing-page (`/`) splits into two access paths — (A) a 5-letter code redeemed via `/api/landing/code-validate` against the Supabase `redemption_codes` table that issues a signed HttpOnly cookie, or (B) a $97 Stripe Checkout that flips a `stripe_purchases` row to `paid` via webhook — both of which route the user through `/welcome` to the 9-question form at `/free/freedom-os`, whose submit posts to `/api/assessment/generate` (one synchronous Claude Sonnet 4 call that writes `payload` + `inputs` to `escape_assessments` and returns a `EA-X-XXX-{share_token}` URL slug), redirecting to `/assessment/[id]` which renders the HUD (Freedom Number ring, Business Match, 14-Day Sprint, 90-Day Roadmap, Lead Playbook) and a sticky bottom "Freedom Agent" rail that streams from Claude Sonnet 4.5 via `/api/freedom-agent/chat`, persists 20 messages per assessment in `freedom_agent_conversations`, is gated by an `assessment_emails` row, and after 4 user turns prompts for an email that gets POSTed to `/api/assessment/email-capture`, which inserts to `assessment_emails` and fires `notifyBeehiiv` with a `funnel_segment` tag (`ready-to-scale` / `building-momentum` / `stuck-zero` / `tire-kicker`) computed from the assessment inputs.

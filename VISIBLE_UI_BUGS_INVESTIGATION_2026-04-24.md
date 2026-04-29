# Visible UI Bugs Investigation — 2026-04-24

**Mode:** Read-only. No code changed, no migrations applied, no servers restarted.
**Targets:** `/agency` morning triage panel + Clay chat input.

---

## TL;DR

1. **BUG 1 root cause:** The `agency_triage` writer is registered only as a `node-cron` job inside `src/lib/cron/scheduler.ts` (no entry in `vercel.json`), so in this dev/serverless environment the 06:00 UTC overnight job has not run since 2026-04-17, and the reader is falling back to the most recent row with `stale: true`.
2. **BUG 1 fastest fix path:** Hit `POST /api/triage/run?scope=mine` (the same endpoint the "Re-run to refresh" button calls) to backfill today's row immediately, then either add the cron to `vercel.json` or move the writer behind a real `/api/cron/overnight-triage` route hit by Vercel Cron.
3. **BUG 2 root cause:** The previous assistant turn produced by the `[__TRENDZO_TRIAGE__]` short-circuit is written into useChat history as a UIMessage whose parts come out of `pipeJsonRender(...)` as non-text render parts (or text parts that get stripped to empty after spec extraction); on the next user send, the route calls `convertToModelMessages(cappedMessages)` (`src/app/api/agency-chat/route.ts:1620`) on that whole history and AI SDK `ai@6.0.168` rejects it as not matching `ModelMessage[]`.
4. **BUG 2 fastest fix path:** Strip the synthetic short-circuit turns out of the array before `convertToModelMessages` (filter messages whose previous user text starts with `TRIAGE_MARKER`/`ACTION_RESULT_MARKER`, plus the matching assistant reply), or sanitise each UIMessage to text-only parts, before the conversion.
5. **Are the bugs related?** No — independent. Bug 1 lives in the cron/data layer; Bug 2 lives in the AI-SDK v6 chat-history conversion.
6. **Recommended fix order:** Fix BUG 2 first. It is blocking *every* message into Clay (founder cannot operate the agent at all). BUG 1 has a manual-refresh escape hatch (the "Re-run" button calls a real endpoint), so the founder can keep working while it waits.
7. **Is today's `approve_brief` fix testable without first fixing BUG 2?** Yes — `POST /api/clay/action` with `{ actionId: '<briefId>', type: 'approve_brief', payload: {} }` invokes the same handler directly, no chat needed (snippet in §4.2).

---

## PART 1 — BUG 1: Stale morning briefing

### 1.1  Component rendering the morning triage panel

The whole panel is rendered inline by `AgencyClient`.

- **Component:** `AgencyClient` (default export)
- **File:** `src/app/agency/AgencyClient.tsx`
- The "GOOD MORNING. N THINGS NEED YOU." header is not a separate component — it is generated server-side by `buildTriageSpec()` in `src/app/api/agency-chat/route.ts` (lines ~182–291) as a JSON-render `Section` with title `"GOOD MORNING. {N} THING(S) NEED YOU."`, then streamed back as a JSON-render spec inside an assistant message and rendered by the `useJsonRenderMessage` hook in `ChatMessage` (`AgencyClient.tsx` ~lines 409–500).
- The "Stale" sub-label is added by the same builder when `payload.stale === true`.

### 1.2  How the component gets its data

**(a) HTTP fetch to an API route — initiated client-side.**

`AgencyClient.tsx` lines 680–720 (`fireAutoGreeting`):

```ts
const url = agencyId
  ? `/api/triage/today?agency_id=${encodeURIComponent(agencyId)}`
  : '/api/triage/today';
const res = await fetch(url, { cache: 'no-store' });
if (res.ok) {
  const triage = await res.json() as { items: unknown[]; stale: boolean; triage_date: string | null };
  if (Array.isArray(triage.items) && triage.items.length > 0) {
    const marker = '[__TRENDZO_TRIAGE__] ' + JSON.stringify(triage);
    sendMessage({ text: marker });   // hidden user msg → server short-circuits
    return;
  }
}
```

The fetched payload is then injected as a hidden `[__TRENDZO_TRIAGE__]` message; the server short-circuit (`tryBuildTriageStream` in `agency-chat/route.ts:293`) builds the spec and streams it back.

- **SQL table:** `agency_triage` (read by `readTriageForAgency` in `src/lib/triage/overnight-triage.ts:283`).

### 1.3  Read query against `agency_triage`

Confirmed: the data comes from `agency_triage` (created in `supabase/migrations/20260417_agency_triage.sql`).

**Read query** (`src/lib/triage/overnight-triage.ts:283–314`):

```ts
const today = new Date().toISOString().split('T')[0]

// Try today first
const { data: todayRow } = await db
  .from('agency_triage')
  .select('items, triage_date')
  .eq('agency_id', agencyId)
  .eq('triage_date', today)
  .maybeSingle()

if (todayRow) {
  return { items: ..., triage_date: todayRow.triage_date, stale: false }
}

// Fallback: most recent row, marked stale (per design review 2A: last-known-good)
const { data: recentRow } = await db
  .from('agency_triage')
  .select('items, triage_date')
  .eq('agency_id', agencyId)
  .order('triage_date', { ascending: false })
  .limit(1)
  .maybeSingle()

if (recentRow) {
  return { items: ..., triage_date: recentRow.triage_date, stale: true }
}
```

That `stale: true` branch is exactly what the founder is staring at.

### 1.4  Writers to `agency_triage`

Grep results (`from('agency_triage').(insert|upsert)`):

| File | Line | Operation |
|---|---|---|
| `src/lib/triage/overnight-triage.ts` | **251** | `.upsert({ agency_id, triage_date: today, items: topItems, ... }, { onConflict: 'agency_id,triage_date' })` |
| `src/lib/triage/overnight-triage.ts` | 81 | `.delete().lt('triage_date', cutoff)` (retention prune, not a writer) |

There is exactly **one** writer site: `runTriageForAgency()` in `src/lib/triage/overnight-triage.ts`. No `.insert()` call exists.

### 1.5  Triggers for the writer

`runTriageForAgency()` is called from two places:

1. **`runTriageForAllAgencies()`** (same file, lines 43–93) — wrapped by the internal scheduler, see §1.6.
2. **`POST /api/triage/run`** (`src/app/api/triage/run/route.ts:41`) — invoked manually by the dashboard "Re-run" button, see §1.7.

Trigger analysis:

| Caller | Type | Trigger | Last guaranteed run |
|---|---|---|---|
| `runTriageForAllAgencies()` via cron | Internal `node-cron` job (`src/lib/cron/scheduler.ts:212`) | Schedule `0 6 * * *` (06:00 UTC) registered with `node-cron` | **None guaranteed** — `node-cron` requires a continuously-running Node process; there is no entry in `vercel.json` and no `/api/cron/overnight-triage` route to bootstrap it. The cron only fires if `scheduler.ts` was actually started in-process. |
| `POST /api/triage/run` (`scope=mine` or `scope=all`) | Next.js API route | Operator click ("Re-run to refresh") or manual `curl` | Whatever the founder last clicked. The current `triage_date: 2026-04-17` row implies that was the last successful run. |

### 1.6  `vercel.json` cron audit

Full cron list from `vercel.json`:

| Path | Schedule | Handler exists? |
|---|---|---|
| `/api/cron/recency-decay` | `0 3 * * 0` | ✅ `src/app/api/cron/recency-decay/route.ts` |
| `/api/freedom-agent/weekly-checkin` | `0 10 * * 1` | ✅ `src/app/api/freedom-agent/weekly-checkin/route.ts` |
| `/api/atlas/feedback-collector` | `0 6 * * *` | ✅ `src/app/api/atlas/feedback-collector/route.ts` |
| `/api/cron/cultural-scan` | `30 0 * * *` | ✅ `src/app/api/cron/cultural-scan/route.ts` |
| `/api/cron/classify-events` | `0 1 * * *` | ✅ `src/app/api/cron/classify-events/route.ts` |

**No `/api/cron/overnight-triage` (or similar) is scheduled.** That is the missing link.

**Orphans (handler exists, no Vercel cron):** `'overnight-triage'` is registered in `src/lib/cron/scheduler.ts:212` (`schedule: '0 6 * * *'`, `enabled: true`, calls `runTriageForAllAgencies` at line 559) but **has no corresponding `/api/cron/*` route file and no `vercel.json` entry**. It depends entirely on `node-cron` running inside a long-lived process — which Vercel Functions do not provide.

**Inverse drift (vercel-scheduled cron with no handler):** None — every path in `vercel.json` resolves.

### 1.7  Manual trigger paths

Three options exist; **only the second is used by the UI today**:

1. **Re-run button** — `AgencyClient.tsx:727–753` (`refreshTriage()`):
   ```ts
   const runRes = await fetch(`/api/triage/run?scope=mine`, { method: 'POST', cache: 'no-store' });
   ```
2. **HTTP endpoint** — `POST /api/triage/run?scope=mine` (`src/app/api/triage/run/route.ts`). Calls `runTriageForAgency(db, agencyId)` for the caller's agency, returns `{ ok: true, items_written }`. There is also `?scope=all` (admin only) which calls `runTriageForAllAgencies()`.
3. **CLI script** — none found under `scripts/` for triage.

### 1.8  Diagnosis

**Cause: (a) — the writer cron is not effectively scheduled in this environment.**

Evidence:

- `vercel.json` has zero triage entries.
- `src/lib/cron/scheduler.ts:212` defines an `'overnight-triage'` job using `node-cron` (a library that requires a long-lived Node process). Vercel serverless functions are short-lived, so `node-cron` registrations there never fire. On a local `npm run dev` box the scheduler also only runs if `scheduler.ts`'s init path is actually executed by the dev server boot — and the most recent `triage_date` is `2026-04-17` (when the founder last clicked "Re-run"), proving that the daily 06:00 UTC tick has not landed since.
- The **read** path (`readTriageForAgency`) explicitly handles the absent-row case by returning the most recent row with `stale: true` — exactly the "Stale: briefing from 2026-04-17" header the founder sees. Reader is healthy; the table is just not being topped up.

Not (b): the writer code itself works — the row from 2026-04-17 was produced by it. Not (c): the reader query is correct (`from('agency_triage')`). Not (d): no other path could have written 2026-04-17 cards.

---

## PART 2 — BUG 2: Clay chat "Invalid prompt" schema error

### 2.1  Component owning the chat input

- **File:** `src/app/agency/AgencyClient.tsx`
- The input box ("Tell me what you need…") is rendered inline by `AgencyClient` itself (no dedicated child component for it). `handleSubmit` (`AgencyClient.tsx` ~989) calls `sendMessage({ text: inputValue })`.

### 2.2  AI SDK transport

`AgencyClient.tsx:636–644`:

```ts
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

const transport = useMemo(
  () => new DefaultChatTransport({ api: '/api/agency-chat' }) as any,
  []
);
const { messages, sendMessage, setMessages, status } = useChat({
  transport,
  onError: (err) => {
    console.error('[agency-chat] Error:', err);
    setChatError(err.message || 'Something went wrong');
  },
} as Parameters<typeof useChat>[0]);
```

The `chatError` here is what surfaces as the red toast.

### 2.3  Receiving route

Confirmed: `src/app/api/agency-chat/route.ts`. First ~50 lines of `POST`:

```ts
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Authenticate user
    let userId: string;
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      userId = 'dev-user';
    } else {
      const supabase = await createServerSupabaseClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized', detail: authError?.message }), {
          status: 401, headers: { 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    }

    // ── ACTION_RESULT short-circuit ──────────────────────────────────────
    const shortCircuit = tryBuildActionResultStream(messages);
    if (shortCircuit) {
      return createUIMessageStreamResponse({ stream: shortCircuit });
    }

    // ── TRIAGE short-circuit (Phase 1 Turn 4) ────────────────────────────
    const triageShortCircuit = tryBuildTriageStream(messages);
    if (triageShortCircuit) {
      return createUIMessageStreamResponse({ stream: triageShortCircuit });
    }

    // … context assembly + systemPrompt build (~lines 420–1614) …
```

### 2.4  Where AI SDK validates `messages`

There is exactly **one** generation call in this route (and none in any helper):

`src/app/api/agency-chat/route.ts:1618–1727`:

```ts
// Cap messages sent to model at 40 most recent to manage token costs
const cappedMessages = messages.length > 40 ? messages.slice(-40) : messages;
const modelMessages = await convertToModelMessages(cappedMessages);   // ← schema validation happens here / right after

// … buildToolsFromRegistry({ … }) …

const result = streamText({
  model: anthropic('claude-haiku-4-5'),
  messages: [
    {
      role: 'system',
      content: systemPrompt,
      providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
    },
    ...modelMessages,
  ],
  tools,
  stopWhen: stepCountIs(3),
});
```

Shape inspection of what reaches `streamText`:

- **System message:** role `'system'`, `content: systemPrompt` (string, ~3–10KB once context is compressed). Valid.
- **`...modelMessages`:** whatever `convertToModelMessages(cappedMessages)` produces. **The error is raised before this if the input UIMessages cannot be converted, OR by `streamText`'s own validator if the converter let through something non-conforming.**

Going through the failure modes from the prompt:

| Mode | Status |
|---|---|
| (a) missing `role` | Unlikely — `useChat` always sets role. |
| (b) invalid role | Unlikely — same reason. |
| (c) `content` neither string nor valid parts array | **Highly likely on the assistant turn produced by the short-circuit.** See below. |
| (d) tool-result missing required fields | Possible if a prior `streamText` step emitted a tool-call without a paired tool-result, though no real LLM turn has run yet on the very first user-typed message — so less likely. |
| (e) empty messages array | No — at minimum the auto-greeting marker is in the array. |
| (f) tool call/result mismatch | Unlikely on first user message (no prior tool call). |

**Why (c) is the prime suspect.** On `/agency` mount:

1. `fireAutoGreeting` calls `sendMessage({ text: '[__TRENDZO_TRIAGE__] {…JSON…}' })`. That user UIMessage is appended to `messages` and POSTed.
2. The route hits the `tryBuildTriageStream` short-circuit (route.ts:413). It synthesises a stream of `text-start` / `text-delta` / `text-end` parts wrapping a ` ```spec\n…\n``` ` block, then passes it through `pipeJsonRender(...)` (route.ts:321–326). `pipeJsonRender` extracts/transforms the `spec` fence into a render-spec representation that the client uses to display the morning brief.
3. The persisted assistant `UIMessage` in `useChat` history is therefore the **JSON-render-augmented** form coming out of `pipeJsonRender`, not a clean `{ role: 'assistant', content: '<text>' }`.
4. When the founder then types "show me any briefs that need approval", `useChat` POSTs the **entire** history: the marker user-message, that pipeJsonRender'd assistant message, and the new user message.
5. `convertToModelMessages` (a strict converter in `ai@6.0.168`) walks every UIMessage and rejects the assistant turn whose parts no longer fit the canonical `text` / `tool-call` / `tool-result` part shapes — surfacing as `Invalid prompt: The messages do not match the ModelMessage[] schema.`

That also explains why the toast fires on the **very first** message the founder types (no real LLM turn has happened yet — the only "assistant" history is the pipeJsonRender'd short-circuit reply).

### 2.5  Recent commit history

Last 10 commits touching `src/app/api/agency-chat/route.ts`, `src/lib/agent`, or `src/lib/clay`:

```
ad3b784 substrate: Fix 1 (content_briefs.agency_id) + Fix 2 (auth on brief routes)
c56e499 stage3/phase2-v2 fan-out: all 12 write adapters + generic propose prompt rule
5e51fa0 stage3/phase2-v2 fix: coerce non-uuid actor/agency ids to null at emit boundary
8845e1c stage3/phase2-v2: propose-only agent design, clicks direct-execute via RPC gate
2208214 Revert "stage3/phase2 wiring: agent write tools end-to-end for nudge_creator"
7511da1 stage3/phase2 wiring: agent write tools end-to-end for nudge_creator
10d98e3 stage3/phase2 scaffolding: agent tool-registry + proposal gate
81428f2 stage3/phase1: migrate /agency chat to anthropic with prompt caching
2a34ae4 Stage 2 (substrate pivot): extend platform_events + wire 4 new emissions
b47d678 Phase 2A polish: triage cards render 2-per-row via Section layout prop
```

Top 5 summary: heavy churn around the agent tool-registry, propose/confirm gating, and the migration to Anthropic + prompt caching (`81428f2`). Any of `8845e1c` / `c56e499` / `81428f2` could plausibly have introduced or exposed the message-shape issue (in particular the Anthropic migration changed how providerOptions and message parts flow). None of these commits sanitise short-circuit assistant messages before `convertToModelMessages`, which is where the bug sits.

### 2.6  Cross-check of the three files modified earlier today

| File | What changed today | Touches `messages` array sent to AI SDK? |
|---|---|---|
| `src/lib/clay/action-handler.ts` (`approveContentBrief`, line 640) | `status: 'approved'` → `status: 'accepted'` (DB write only). | **No.** Pure Supabase update inside a server action handler invoked by `/api/clay/action`. Never touches the chat `messages` array. |
| `src/lib/agent/handler-adapters.ts` (line ~114) | Description update (string label only). | **No.** Adapter metadata; not part of UIMessage construction. |
| `src/lib/clay/intelligent-clay-registry.ts` (line ~157) | Description update (string label only). | **No.** Component-registry metadata. |

**Ruled out.** None of today's edits could produce the schema error — they don't reach `useChat`, `convertToModelMessages`, or `streamText`.

### 2.7  AI SDK version

From `package.json` and `npm ls`:

```
ai                  ^6.0.138   (installed: 6.0.168)
@ai-sdk/react       ^3.0.140   (installed: 3.0.170)
@ai-sdk/anthropic   ^3.0.69    (installed: 3.0.71)
@ai-sdk/openai      ^3.0.48
```

`git log -- package.json` shows only two commits ever touched it:

```
8549c9d CHECKPOINT: April 17 2026 — Intelligent Clay planning + v15 XGBoost + agency work
c1426cb Fresh init: clean source, no video data, no secrets
```

So this AI SDK 6 / @ai-sdk-react 3 stack has been in place since 2026-04-17 — the **same day the briefing rendered last** and around when the Anthropic migration commit (`81428f2`) was made. AI SDK 6 made the `ModelMessage` schema and `convertToModelMessages` substantially stricter than v4/v5. The 3-files-changed-today story is unrelated; the underlying schema strictness has been latent since the v6 upgrade.

### 2.8  Diagnosis (ranked)

1. **(b) Server-side: the assistant message produced by the `[__TRENDZO_TRIAGE__]` (and `[__TRENDZO_ACTION_RESULT__]`) short-circuit is being reused on the next turn, and `convertToModelMessages` (`route.ts:1620`) cannot map it back to a clean `ModelMessage`.** Evidence: only the short-circuit path runs `pipeJsonRender(synthetic)` to write parts directly into the UIMessage stream (route.ts:321–326 / 365–369), bypassing the normal `streamText` text-delta flow that produces canonical text parts. Those non-canonical parts persist in `useChat`'s message history and are sent back on every subsequent POST.
2. **(c) Version-related strictness in AI SDK v6.** The same conversion logic that was lenient in v4/v5 now strictly validates each UIMessage. The bug only became visible after the AI SDK 6 + Anthropic migration on 2026-04-17.
3. **(d) Tool call / tool result pairing from prior conversation state.** Lower likelihood for the *first* user message, but if the chat ever reaches a `streamText` step that emits a tool-call without a paired tool-result before the stream closes (e.g., because of `stopWhen: stepCountIs(3)` cutting mid-flight), subsequent sends would also fail conversion. This is a real risk for follow-up turns even if (1) is fixed.
4. **(a) Client-side malformation before send.** Unlikely. `sendMessage({ text: '…' })` is the canonical `@ai-sdk/react` v3 API and produces standard UIMessage parts.
5. **(e) Today's three edits.** Ruled out (§2.6).

---

## PART 3 — Are these bugs related?

### 3.1  Shared root cause?

**No — they are independent.**

- **BUG 1** is a deployment/scheduling defect: the `agency_triage` writer is wired only to `node-cron` and never to Vercel Cron / a real `/api/cron/*` handler, so the table is never refreshed.
- **BUG 2** is an AI-SDK-v6 message-schema defect: the `[__TRENDZO_TRIAGE__]` and `[__TRENDZO_ACTION_RESULT__]` short-circuits write non-canonical UIMessage parts via `pipeJsonRender` that `convertToModelMessages` rejects on the next turn.

The only superficial overlap is the `[__TRENDZO_TRIAGE__]` marker — Bug 1 is about *what data goes into the marker*, Bug 2 is about *what shape comes back out of the short-circuit's stream*. Different layers, different files, no shared change.

### 3.2  Recommended fix order

**Fix BUG 2 first.**

- BUG 2 blocks **every** Clay interaction — the founder can't approve a brief, can't ask for status, can't even say "hi." That's a complete loss of the agent surface.
- BUG 1 has a working manual escape hatch: the "Re-run to refresh" button (`POST /api/triage/run?scope=mine`) regenerates today's row on demand. Stale-but-clickable is workable; broken-chat is not.
- BUG 2's fix is also lower-risk and self-contained (filter or sanitise messages in `agency-chat/route.ts` before `convertToModelMessages`). BUG 1 needs a small infra decision (add to `vercel.json` vs. add a real `/api/cron/overnight-triage` route vs. keep `node-cron` and pin a dev-only init).

---

## PART 4 — Today's `approve_brief` fix: actual verification path

### 4.1  Is `approve_brief` reachable outside Clay chat?

**(a) No dedicated UI button.** Searching `src/app/agency/dashboard/**` and the rest of the agency UI, there is no standalone "Approve" button that calls `approve_brief` directly. Today the only entry point is via the agent's proposal-confirm flow rendered inside the chat.

**(b) Yes — a real REST endpoint exists.** `POST /api/clay/action` (`src/app/api/clay/action/route.ts`) accepts `{ actionId, type, payload }` and routes by `type` through `handleComponentAction → action-handler.ts`. For `type === 'approve_brief'`, the handler is `approveContentBrief(db, action.actionId, context)` (`src/lib/clay/action-handler.ts:151`), which performs:

```ts
db.from('content_briefs').update({ status: 'accepted' }).eq('id', briefId)
```

**Critical:** the handler treats `actionId` itself as `briefId` (line 152: `approveContentBrief(db, action.actionId, context)`). There is no separate `briefId` field in the payload — pass the brief's UUID as `actionId`.

The route also requires `resolveContext()` to find an agency for the caller; with `NEXT_PUBLIC_DISABLE_AUTH=true` this resolves to a dev context. In production it expects a Supabase session cookie. In the agent-proposal branch it additionally requires a `proposalId` + `clientHash`, but a non-agent direct click (no `proposalId` in the payload) takes the simpler path at `route.ts:172–178`:

```ts
const result = await handleComponentAction(
  { actionId, type, payload: p },
  ctx,
)
return NextResponse.json(result)
```

### 4.2  Direct invocation snippet (paste into devtools console on `/agency`)

Replace `<BRIEF_UUID>` with a real `content_briefs.id`:

```js
// Browser fetch — runs from /agency tab so cookies are attached
fetch('/api/clay/action', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    actionId: '<BRIEF_UUID>',   // handler reads this as briefId
    type: 'approve_brief',
    payload: {},                // no extra fields needed; non-agent path
  }),
}).then(r => r.json()).then(console.log).catch(console.error);
```

Or, equivalent `curl` (substitute the Supabase auth cookie or rely on `NEXT_PUBLIC_DISABLE_AUTH=true`):

```bash
curl -X POST http://localhost:3001/api/clay/action \
  -H 'Content-Type: application/json' \
  -H 'Cookie: <your supabase auth cookie>' \
  -d '{"actionId":"<BRIEF_UUID>","type":"approve_brief","payload":{}}'
```

Expected response on success (from `ok(...)` in `action-handler.ts:617–630`):

```json
{
  "success": true,
  "message": "Approved \"<title>\"",
  "followUpComponents": ["ACTION_CONFIRMATION"],
  "confirmation": {
    "kind": "structured",
    "actionType": "approve_brief",
    "title": "Approved \"<title>\"",
    "subtitle": "<creator>'s brief is cleared to publish.",
    "details": { "briefId": "<BRIEF_UUID>", "creator": "<creator>" },
    "at": "<iso-ts>"
  }
}
```

To verify today's `approved → accepted` change actually persisted, immediately after the call run in Supabase:

```sql
select id, status, updated_at
from content_briefs
where id = '<BRIEF_UUID>';
```

`status` should be `'accepted'`.

---

## Appendix — Key code references

- `src/app/agency/AgencyClient.tsx:636–644` — `useChat` + `DefaultChatTransport`
- `src/app/agency/AgencyClient.tsx:680–720` — `fireAutoGreeting` (TRIAGE marker injection)
- `src/app/agency/AgencyClient.tsx:727–753` — `refreshTriage` ("Re-run" button → `/api/triage/run?scope=mine`)
- `src/app/api/agency-chat/route.ts:293–327` — `tryBuildTriageStream` (short-circuit, uses `pipeJsonRender(synthetic)`)
- `src/app/api/agency-chat/route.ts:329–370` — `tryBuildActionResultStream` (same pattern)
- `src/app/api/agency-chat/route.ts:1618–1727` — cap → `convertToModelMessages` → `streamText`
- `src/lib/triage/overnight-triage.ts:43–93` — `runTriageForAllAgencies` (cron entry point)
- `src/lib/triage/overnight-triage.ts:98–277` — `runTriageForAgency` (the only writer; upsert at line 251)
- `src/lib/triage/overnight-triage.ts:283–314` — `readTriageForAgency` (the stale-fallback reader)
- `src/lib/cron/scheduler.ts:212` — `'overnight-triage'` registration (`'0 6 * * *'`, node-cron)
- `src/lib/cron/scheduler.ts:556–569` — handler that calls `runTriageForAllAgencies`
- `src/app/api/triage/run/route.ts` — manual refresh endpoint
- `src/app/api/triage/today/route.ts` — read endpoint used by `fireAutoGreeting`
- `src/app/api/clay/action/route.ts` — the route to bypass the chat for direct action invocation
- `src/lib/clay/action-handler.ts:151–152` — `approve_brief` dispatch
- `src/lib/clay/action-handler.ts:637–654` — `approveContentBrief` (the handler that today's edit changed: `status: 'accepted'` at line 640)
- `vercel.json` — 5 crons, **none** for triage
- `package.json` — `ai ^6.0.138`, `@ai-sdk/react ^3.0.140`, `@ai-sdk/anthropic ^3.0.69`; installed `ai@6.0.168`, `@ai-sdk/react@3.0.170`, `@ai-sdk/anthropic@3.0.71`

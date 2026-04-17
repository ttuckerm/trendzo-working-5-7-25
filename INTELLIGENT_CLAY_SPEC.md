# Intelligent Clay — Technical Specification

**Purpose:** Single reference for `/agency` conversational AI (Intelligent Clay): routing, APIs, rendering, actions, prompts, state, and brief-related data.  
**Rule:** Statements below are tied to repository paths and line ranges as of the document date. Items marked **AMBIGUOUS** or **BUG** are called out explicitly.

---

## SECTION 1: SYSTEM OVERVIEW

| Topic | Detail |
|--------|--------|
| **Page route** | `src/app/agency/page.tsx` — server component loads auth, agency-scoped data (profiles, briefs, cards, scripts), passes props into `AgencyClient`. |
| **Client shell** | `src/app/agency/AgencyClient.tsx` — chat UI, `useChat` transport, json-render, Clay classification artifacts, voice, session persistence. |
| **Chat API** | `POST /api/agency-chat` — `src/app/api/agency-chat/route.ts`. |
| **Model** | `openai('gpt-4o')` — see `streamText` at line ~1487–1488. |
| **Streaming + spec** | Assistant stream is merged with `pipeJsonRender(result.toUIMessageStream())` (lines ~1498–1500). Package: `@json-render/core` (`pipeJsonRender`), `@json-render/react` (`Renderer`, `useJsonRenderMessage`, providers). |
| **Catalog / registry** | `src/lib/trendzo-catalog.ts` — `defineCatalog` + Zod props for each component and action *schema* for the model. `src/lib/trendzo-registry.tsx` — `defineRegistry(trendzoCatalog, { components: { ... } })` exports `registry`, `handlers`, `executeAction`. |
| **System prompt shape** | Built as one template string starting ~line 1319: identity + `trendzoCatalog.prompt({ mode: 'inline' })` + optional `assembleContext` block + Clay hint + `## AGENCY DATA` (compressed DB context) + `## RESPONSE RULES` + `## POST-WRITE CONFIRMATION CARDS` + `CRITICAL JSON-RENDER SPEC FORMAT` + `## SESSION`. Token estimate logged as `Math.ceil(systemPrompt.length / 4)` (~line 1408) — **character/4 heuristic, not tokenizer-accurate**. |

---

## SECTION 2: THE RENDERING PIPELINE

### How model output becomes UI

1. **Stream:** `streamText` emits UI message stream; `createUIMessageStream` runs `writer.merge(pipeJsonRender(result.toUIMessageStream()))` so text/spec chunks are normalized for the UI protocol.
2. **Client:** `useChat` receives messages with `parts`. For assistant messages, `ChatMessage` (`AgencyClient.tsx` ~408–527) calls `useJsonRenderMessage(message.parts)` → `{ spec, text, hasSpec }`.
3. **Spec path:** If `hasSpec && spec`, a `Renderer` renders `spec` with `registry` from `trendzo-registry.tsx` (~519–520).
4. **Parallel Clay path:** Classification from `/api/clay/classify` can attach `ClayComponentRenderer` components (non–json-render) based on intent; order vs text depends on `renderStrategy` (`lead-with-components` | `components-only` | default text-first).

### Spec fence format

The system prompt requires **RFC 6902 JSON Patch** lines inside a **markdown fence labeled `spec`** (see `src/app/api/agency-chat/route.ts` ~1395–1402).

**Example from codebase (comment in system prompt, lines ~1397–1401):**

```text
```spec
{"op":"add","path":"/root","value":"main"}
{"op":"add","path":"/elements/main","value":{"type":"Section","props":{"title":"Overview"},"children":["grid-1"]}}
```

### `pipeJsonRender`

- **Package:** `@json-render/core`.
- **Usage:** Wraps the async iterable from `result.toUIMessageStream()` so the merged stream is compatible with json-render’s UI message pipeline (`src/app/api/agency-chat/route.ts` ~1498–1500). Same helper used in `tryBuildActionResultStream` (~155–157) for synthetic ACTION_RESULT streams.

### Component types (catalog `components` — one line each)

Defined in `src/lib/trendzo-catalog.ts` under `components: { ... }` (lines ~6–862). **Actions** are listed separately below.

| Type | Description |
|------|-------------|
| `Row` | Horizontal flex row for children. |
| `Column` | Vertical flex column. |
| `Grid` | Grid with `columns` 1–4 and optional gap. |
| `Section` | Titled section with optional subtitle slot. |
| `KPICard` | Metric card: label, value, optional change/trend. |
| `CreatorCard` | Creator summary with VPS-colored score ring. |
| `VPSRing` | Circular VPS display. |
| `MorningBriefCard` | Digest / alert styled card (severity). |
| `ScriptCard` | Script preview with status. |
| `TrendItem` | Trend row with momentum. |
| `ComparisonTable` | Headers + row matrix. |
| `StatBadge` | Inline label/value badge. |
| `AlertBanner` | Full-width alert. |
| `EmptyState` | Empty placeholder. |
| `Heading` | Playfair heading levels. |
| `Text` | Body/caption/mono/label text. |
| `ActionButton` | Clickable action (label + `action` string + variants). |
| `CreatorProfile` | Deep-dive hero header. |
| `VPSTimeline` | VPS over time. |
| `NicheRanking` | Peer rank / percentile. |
| `ContentTable` | Tabular content list. |
| `EngagementBreakdown` | Engagement splits. |
| `RecommendationCard` | Recommendation callouts. |
| `OnboardingPipeline` | Pipeline visualization. |
| `OnboardingStats` | Aggregate onboarding stats. |
| `CalibrationProgress` | Calibration state. |
| `OnboardingCreatorRow` | Single creator row in onboarding. |
| `InviteCard` | Invite CTA. |
| `OnboardingTimeline` | Timeline of steps. |
| `EventCard` | Single event. |
| `EventCalendar` | Calendar of events. |
| `EventForm` | Event create/edit form. |
| `TrendAlert` | Trend warning strip. |
| `EventSummary` | Event list summary. |
| `EventBrief` | Brief tied to event. |
| `CreatorMatch` | Creator–event fit. |
| `PushStatus` | Push pipeline status. |
| `BriefPreview` | Brief preview panel. |
| `PushConfirmation` | Confirm push. |
| `BriefGrid` | Grid of briefs. |
| `BriefEditor` | Edit brief. |
| `BatchProgress` | Batch job progress. |
| `CreatorBriefAssignment` | Creator ↔ brief assignment. |
| `BatchSummary` | Batch summary. |
| `CalendarView` | Calendar view. |
| `ScheduleGrid` | Schedule grid. |
| `PostSlot` | Single post slot. |
| `WeekOverview` | Week summary. |
| `ScheduleConflict` | Conflict callout. |
| `PerformanceChart` | Chart. |
| `ReportCard` | Report summary card. |
| `AgencyScorecard` | Agency-level scorecard. |
| `CreatorComparison` | Side-by-side creators. |
| `ContentROI` | ROI breakdown. |
| `TrendReport` | Trend analysis report. |

**Actions catalog** (separate `actions: { ... }` in same file, ~865–993): `analyze_creator`, `generate_brief`, `refresh_data`, `export_report`, `navigate_creator`, `send_invite`, `nudge_creator`, `create_event`, `match_creators_to_event`, `push_brief_to_creators`, `check_push_status`, `generate_batch_briefs`, `approve_brief`, `schedule_post`, `generate_report`, `reschedule_post`, `update_brief_status`, `log_performance`.

### json-render registry

- **File:** `src/lib/trendzo-registry.tsx`.
- **Pattern:** `defineRegistry(trendzoCatalog, { components: { Row: ..., ActionButton: ..., ... } })`.
- **ActionButton** (~517–548): uses `useActions()` from `@json-render/react`. On click: if `on('press')` is bound, emit that; else if `props.action` exists and `handlers[props.action]` exists, call `handlers[props.action]({ ...props, _source: 'action-button' })`. Handlers are supplied by `ActionProvider` in `AgencyClient.tsx` (~1099).

---

## SECTION 3: THE ACTION SYSTEM

### A) How actions are TRIGGERED

**ActionButton (json-render)**  
- **Definition:** `src/lib/trendzo-registry.tsx` ~517–548 (render); **props schema:** `src/lib/trendzo-catalog.ts` ~155–163 (`label`, `action`, optional `variant`, `icon`).  
- **On click:** See registry above — dispatches to `handlers[action]` from React context.

**`ActionProvider` handlers (client registry)** — `src/app/agency/AgencyClient.tsx` ~972–1023:

| Key | Behavior |
|-----|----------|
| `analyze_creator` | `sendAsUser('Give me a deep analysis of …')` |
| `generate_brief` | `sendAsUser('Generate a content brief for …')` |
| `refresh_data` | `window.location.reload()` |
| `export_report` | `console.log` + `alert('Export coming soon')` |
| `navigate_creator` | `sendAsUser('Show me everything about …')` |
| `update_brief_status` | `handleComponentAction(briefId, { type, briefId, new_status, published_url })` |
| `log_performance` | `handleComponentAction(briefId, { type, briefId, actual_views, actual_engagement_rate })` |

**Other triggers**

- **Custom event `trendzo-action`:** `window.addEventListener('trendzo-action', …)` ~1025–1036 — dispatches to same `actionHandlers` map via `detail.action`.
- **CreatorCard** (~166–170) dispatches `trendzo-action` with `action: 'analyze_creator'` on click.
- **Clay `ClayComponentRenderer`** uses `onAction={handleComponentAction}` for non-json Clay components (separate from ActionButton string actions).

### B) How actions are DISPATCHED (server write path)

**Sequence (update_brief_status / log_performance):**

1. User clicks ActionButton → `handlers.update_brief_status` or `log_performance` (`trendzo-registry.tsx`).
2. Handler calls `handleComponentAction` (`AgencyClient.tsx` ~844–904).
3. `fetch('POST', '/api/clay/action', { actionId, type, payload })` ~864–867. **Note:** `actionId` is the brief UUID for these flows; `type` is taken from `payload.type` or falls back to `actionId` **AMBIGUOUS:** line ~846 `const actionType = (pl.type as string) || actionId` — if payload omits `type`, `type` sent to API may equal raw UUID string (see **BUG** below).
4. `src/app/api/clay/action/route.ts` ~8–43: auth → `getUserAgencyId` → `handleComponentAction` from `action-handler.ts`.
5. Response JSON returned to client; on success + `confirmation`, client sends hidden chat message with `ACTION_RESULT_MARKER` (~884–888).

**Sequence (read-only chat actions like analyze_creator):** no `/api/clay/action` — only `sendMessage` to `/api/agency-chat`.

### C) How actions are HANDLED — `/api/clay/action/route.ts`

- **File:** `src/app/api/clay/action/route.ts`.
- **Behavior:** Validates `actionId` + `type`, resolves `agencyId`, calls `handleComponentAction({ actionId, type, payload }, { agencyId, userId })`, returns JSON `ActionResult`.

### `action-handler.ts` — `switch (action.type)` cases

**File:** `src/lib/clay/action-handler.ts`. Router uses **`action.type`**, not `action.actionId`, for dispatch (line ~64).

| `case` | What it does |
|--------|----------------|
| `'approve'` | If payload looks like trainer experiment → `approveTrainerExperiment`; else `approveBrief` on `pre_generated_briefs`. |
| `'reject'` | Same split → `rejectTrainerExperiment` or `rejectBrief`. |
| `'generate-brief'` | Inserts draft row into `pre_generated_briefs` from cultural/agency event. |
| `'generate-recovery-brief'` | Inserts recovery brief into `pre_generated_briefs`. |
| `'select-variant'` | Updates `brief_variants` `was_selected` for a brief. |
| `'confirm'` | No DB; returns success + `ACTION_CONFIRMATION` component type. |
| `'cancel'` | Same pattern. |
| `'acknowledge_alert'` / `'dismiss_alert'` | `dismissAlert` → updates `chairman_alerts` if table exists. |
| `'update_brief_status'` | Validates transition → updates `content_briefs` completion fields → optional `confirmation` payload (`brief_status`). |
| `'log_performance'` | Updates `content_briefs` performance columns → optional `confirmation` (`performance`). |
| `'upgrade'` | No DB; message only. |
| `default` | `{ success: false, message: 'Unknown action type: …' }` |

**Returns:** `ActionResult`: `{ success, message, followUpComponents?, confirmation? }`.

**`update_brief_status` transitions** (`VALID` ~374–378):  
- `acknowledged` ← only from `delivered`  
- `in_production` ← only from `acknowledged`  
- `published` ← only from `in_production`  
Mismatch → `"Invalid transition: ${current} -> ${newStatus}"`.

### D) How results are RENDERED

1. **Inline confirmations:** `setInlineConfirmations` updates pending row to confirmed/failed (~871–881).
2. **Chat card:** If `result.confirmation`, client sends user message:  
   `` `${ACTION_RESULT_MARKER} ${JSON.stringify(result.confirmation)}` `` (~887–888).  
   Marker: `src/app/agency/AgencyClient.tsx` ~537; same string in `agency-chat/route.ts` ~17.

**`ACTION_RESULT_MARKER` server path:** `tryBuildActionResultStream` (`agency-chat/route.ts` ~119–161): if last user text starts with marker, parse JSON → `buildBriefStatusSpec` | `buildPerformanceSpec` | `buildFallbackSpec` → wrap in ` ```spec\n...\n``` ` synthetic stream → **`pipeJsonRender`** — **no LLM call** (short-circuit ~195–202).

**Deterministic templates (server-side, not model):**  
- `buildBriefStatusSpec` ~82–94 — JSONL patch lines with `Section` + `KPICard` ids `bsc-*`.  
- `buildPerformanceSpec` ~96–108 — `perf-*` ids, `Grid` + `KPICard`.  
**BUG / mismatch:** Server-built specs use props like `"accent"` on `Section` and raw hex on `KPICard`, while `trendzo-catalog` `Section` only documents `title`/`subtitle` and `KPICard` uses `accentColor` enum — **extra/unknown props may be ignored** by strict validation or passed through depending on json-render version; verify visually.

**Prompt templates:** System prompt also embeds human-readable templates for the model (~1366–1388) for when the model *would* render — superseded by short-circuit for real writes.

### E) REGISTRIES — files to update for a **new** write action

| File | Role | Format |
|------|------|--------|
| `src/lib/trendzo-catalog.ts` | Add `actions.<name>` with `params` Zod + description. | Match existing action entries (~865+). |
| `src/lib/trendzo-catalog.ts` | Optionally add UI component if new surface. | `components.<Name>: { props: z.object(...), ... }`. |
| `src/lib/trendzo-registry.tsx` | Implement component in `components` map if new UI type. | React component receiving `props`, `children`, etc. |
| `src/app/agency/AgencyClient.tsx` | Add handler key in `actionHandlers` if client should dispatch. | Function invoking `handleComponentAction` or `sendAsUser`. |
| `src/lib/clay/action-handler.ts` | Add `case` in `switch` + DB helpers. | `action.type` string must match what client sends. |
| `src/app/api/clay/action/route.ts` | Usually unchanged — passes through. | — |

**Actions currently in catalog** (`trendzo-catalog.ts` `actions` object): listed in Section 2.  
**Actions with `actionHandlers` implementations:** only the keys in ~972–1023 (subset of catalog).

---

## SECTION 4: AUTO-GREETING / MORNING BRIEFING

| Item | Detail |
|------|--------|
| **Trigger** | `fireAutoGreeting` (`AgencyClient.tsx` ~703–711): sets `autoGreetFired`, `autoBriefing`, calls `classifyMessage(AUTO_GREETING)` and `sendMessage({ text: AUTO_GREETING })`. |
| **AUTO_GREETING string** | `'Good morning. Brief me on what needs my attention.'` (~531). **Note:** `conversation-store.ts` ~41 excludes this exact string from session title (~39–45). |
| **When it runs** | After `initSession` (~713–764): (1) no user/agency → `setTimeout(fireAutoGreeting, 800)`; (2) restored session with messages → **no** auto-greet; (3) no session or timeout → `setTimeout(fireAutoGreeting, 800)`; (4) catch error → same. |
| **Guards** | `autoGreetFired` ref (~696); `actionInFlight` ref (~701) blocks `fireAutoGreeting` (~705); `handleNewSession` only resets greeting when `explicit === true` (~1038–1061) then `setTimeout(fireAutoGreeting, 300)`. |
| **Effect on briefing state** | Separate effect ~766–782 clears `autoBriefing` when stream finishes, unless last user message starts with `ACTION_RESULT_MARKER`. |
| **Re-fire risk** | New session button must pass `explicit: true` or reset is ignored. If `fireAutoGreeting` dependencies are stale (**eslint-disable** on ~711), **AMBIGUOUS** closure behavior. Rapid `handleNewSession` + race with `actionInFlight` could block or delay greeting. |

---

## SECTION 5: THE READ TOOLS

**Defined in** `src/app/api/agency-chat/route.ts` ~1421–1494, passed to `streamText` as `tools`.

| Tool name | Zod input | Internal call |
|-----------|-----------|---------------|
| `get_briefs_by_status` | `briefStatusSchema` ~1425–1431: optional `status` enum `pending \| delivered \| acknowledged \| in_production \| published \| failed`; optional `creator_name` string. | `GET /api/brief-status` with query params `status`, `creator_name`, same origin + cookie header ~1449–1456. |
| `get_performance_summary` | `performanceSchema` ~1434–1437: optional `period` `week \| month \| all`; optional `creator_name`. | `GET /api/brief-performance` ~1471–1478. |

**Tool results → model → spec:** Tool outputs are model-visible; the prompt instructs using them to populate KPICards / specs (~1349), not raw JSON paste.

**Stopping:** `stopWhen: stepCountIs(3)` ~1495 — limits multi-step tool loops.

---

## SECTION 6: STATE MANAGEMENT (`AgencyClient.tsx`)

| Concern | Mechanism |
|---------|-----------|
| **Chat messages** | `useChat` from `@ai-sdk/react` with `DefaultChatTransport({ api: '/api/agency-chat' })` ~663–664. |
| **Session id** | `useState` + `crypto.randomUUID()` ~651; updated on explicit new session ~1054–1055. |
| **Restore** | `loadActiveConversation(userId, agencyId)` ~728–730; maps stored messages to `UIMessage` with `parts` ~739–745; `setMessages(restored)`. |
| **Persistence** | `saveConversation` debounced ~784–817 → Supabase table **`agency_conversations`** (`src/lib/sessions/conversation-store.ts` ~47–57): `messages` as JSON string, `title`, `is_active`, etc. |
| **Refs** | `autoGreetFired`, `sessionInitialized`, `actionInFlight`, `messagesEndRef`, `sendMessageRef` ~963–964. |
| **Clay** | `clayClassifications`, `recentComponents`, `inlineConfirmations` ~657–661. |

---

## SECTION 7: THE SYSTEM PROMPT (STRUCTURE, NOT FULL TEXT)

**Order of major blocks** (`src/app/api/agency-chat/route.ts` ~1319–1406):

1. **Identity** — Trendzo Intelligent Clay; strategist tone; must use UI components.  
2. **`catalogPrompt`** — inline catalog from `trendzoCatalog.prompt({ mode: 'inline' })`.  
3. **`centralContextBlock`** — optional; from `assembleContext` (`src/lib/context/assemble-context.ts`) when `agencyId` set ~1294–1303.  
4. **`clayComponentHint`** — intent/components hint from `classifyIntent` ~1311–1313.  
5. **`## AGENCY DATA`** — date, niches, compressed sections (CREATORS, ALERTS, PENDING BRIEF REVIEW, conditional ONBOARDING, EVENTS, BRIEFS, CALENDAR, PERFORMANCE, DEEP DIVE) ~1232–1279.  
6. **`## RESPONSE RULES`** — long routing list (deep dive, onboarding, events, briefs, calendar, performance, greetings, pending briefs, ActionButton conventions, read tools) ~1329–1349.  
7. **`## POST-WRITE CONFIRMATION CARDS`** — highest priority; marker rules; forbid MorningBrief etc. ~1351–1392.  
8. **Embedded spec examples** — `brief_status` and `performance` templates ~1366–1388.  
9. **`CRITICAL JSON-RENDER SPEC FORMAT`** — JSONL in ` ```spec ` fence ~1395–1402.  
10. **`## SESSION`** — restored vs new session behavior ~1404–1406.

**Potential tension:** Restored session instruction says brief “Welcome back” vs full briefing; auto-greeting still sends the same `AUTO_GREETING` string on fresh load — operator-dependent. **POST-WRITE** block says to ignore other rules when marker present; short-circuit avoids model entirely for that case — **aligned**.

**Token count:** Use server log line ~1408; treat as **estimate**.

---

## SECTION 8: CURRENT BUGS AND KNOWN ISSUES (CODE-VERIFIED)

| ID | Issue |
|----|--------|
| **BUG** | **`approve_brief` / many catalog actions** have **no** entry in `AgencyClient` `actionHandlers` (~972–1023). `ActionButton` only runs if `handlers[props.action]` exists (`trendzo-registry.tsx` ~532–533). Clicks for `approve_brief`, `send_invite`, etc. may **no-op** unless `press` binding or another path exists. |
| **BUG** | **`handleComponentAction` type fallback** (~846): if `payload` omits `type`, `actionType` becomes `actionId` (UUID). Server `switch` may hit `default` → “Unknown action type”. Client passes explicit `type` for `update_brief_status` / `log_performance` — those are OK. |
| **BUG** | **KPICard `subtitle` / `accent`:** Catalog/registry `KPICard` (~132–157 `trendzo-registry.tsx`) does not render `subtitle`; server-built ACTION_RESULT specs include `subtitle` on props (~86 in route). **Section** in server spec uses `accent` not in catalog `Section` schema (~33–39 `trendzo-catalog.ts`). Visual mismatch possible. |
| **TODO / dead ends** | `export_report` handler only `alert('Export coming soon')` ~988–990. |
| **Transition** | Invalid `content_briefs.completion_status` transitions rejected with explicit error message (~393–399 `action-handler.ts`). |
| **Morning briefing** | Hidden `ACTION_RESULT` user messages filtered from UI ~1255–1262; marker messages skipped in `autoBriefing` effect ~777. |
| **Agent debug** | `src/app/agency/page.tsx` and `src/app/api/agency-chat/route.ts` contain **agent log** `fetch` calls to a local ingest URL (~8–12, ~165–168, etc.) — operational noise / side effect in production if left enabled. |

---

## SECTION 9: DATABASE SCHEMA (BRIEF-RELATED)

### `content_briefs`

**AMBIGUOUS:** Application code filters `content_briefs` with `.eq('agency_id', agencyId)` (`src/app/api/agency-chat/route.ts` ~256–257). **No migration in this repo** was found adding `agency_id` to `content_briefs` via grep of `supabase/migrations`. Column may exist from external SQL or uncommitted migration — **confirm against live DB**.

**From migrations (combined):**

| Column / area | Source | Purpose |
|----------------|--------|---------|
| `id`, `user_id`, `source_video_id`, `pattern_id`, `brief_content`, `predicted_vps`, `status`, `actual_vps`, `first_win`, `created_at`, `updated_at` | `20260303_content_briefs.sql` | Core brief workflow + training linkage. |
| `concept_score_id` | `20260304_concept_scores.sql` | FK to concept_scores. |
| `delivery_status` | `20260413_content_briefs_delivery_status.sql` | Email delivery tracking. |
| `completion_status`, `acknowledged_at`, `in_production_at`, `published_at`, `published_url` | `20260414_content_briefs_completion_status.sql` | B1-style lifecycle (delivered → … → published). |
| `vps_prediction`, `actual_views`, `actual_engagement_rate`, `performance_delta`, `performance_measured_at`, `performance_source` | `20260414_content_briefs_performance.sql` | B2/B3 performance logging. |

### `draft_briefs`

**No table named `draft_briefs` appears in `supabase/migrations`.** Only mention located: `AI EMPLOYEE ARCHITECTURE.md` (doc). **AMBIGUOUS / not in schema migrations verified here.** Agency draft workflow in code uses **`pre_generated_briefs`** (`action-handler.ts` approve/reject/generate paths).

### Other tables touched by action system

- `pre_generated_briefs`, `brief_variants`, `cultural_events`, `agency_events`, `training_experiments`, `model_variants`, `chairman_alerts`, `onboarding_profiles` — see `action-handler.ts` imports/usages.

---

## SECTION 10: FILE INDEX (INTELLIGENT CLAY SYSTEM)

| Path | Description |
|------|-------------|
| `src/app/agency/page.tsx` | Server page: auth, data fetch, renders `AgencyClient`. |
| `src/app/agency/AgencyClient.tsx` | Client: chat, json-render, Clay, voice, session, action handlers, `ActionProvider`. |
| `src/app/api/agency-chat/route.ts` | POST: auth, ACTION_RESULT short-circuit, data batching, system prompt, tools, `streamText` + `pipeJsonRender`. |
| `src/app/api/clay/action/route.ts` | POST: delegates to `handleComponentAction`. |
| `src/app/api/clay/classify/route.ts` | POST: intent classification for Clay (`classifyMessage` in AgencyClient). |
| `src/app/api/clay/component-data/route.ts` | POST: fetches prefetched data for Clay component types via `fetchComponentData`. |
| `src/lib/clay/action-handler.ts` | Server-side action switch + DB mutations + confirmation payloads. |
| `src/lib/trendzo-catalog.ts` | json-render catalog: component + action schemas for the model. |
| `src/lib/trendzo-registry.tsx` | React registry: real component implementations + ActionButton. |
| `src/lib/clay/index.ts` (and siblings) | Clay component types, `ClayComponentRenderer`, `getComponentsForIntent`. |
| `src/lib/sessions/conversation-store.ts` | Load/save `agency_conversations` sessions. |
| `src/lib/context/assemble-context.ts` | Optional central context block for system prompt. |
| `src/lib/clay/index.ts` | Clay exports. |
| `src/app/api/brief-status/route.ts` | Read API for `get_briefs_by_status` tool. |
| `src/app/api/brief-performance/route.ts` | Read API for `get_performance_summary` tool. |
| `src/lib/email/send-brief.ts` | Email send + `content_briefs` delivery_status updates (related to briefs, not chat UI core). |

---

*End of specification.*

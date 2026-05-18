# Funnel — Freedom-Agent Route Usage Audit

**Date:** 2026-05-16
**Branch:** funnel-deploy-techyai
**Scope:** Determine whether any funnel-side code calls the 4 freedom-agent routes that are NOT in `FUNNEL_ALLOWLIST`:
- `src/app/api/freedom-agent/history/route.ts`
- `src/app/api/freedom-agent/session/route.ts`
- `src/app/api/freedom-agent/unsubscribe/route.ts`
- `src/app/api/freedom-agent/weekly-checkin/route.ts`

Read-only; no code modified.

---

## Section 1 — `FUNNEL_ALLOWLIST` literal (from `src/middleware.ts:33-43`)

```typescript
const FUNNEL_ALLOWLIST = [
  '/',                          // landing (exact)
  '/welcome',
  '/free/freedom-os',
  '/assessment/',               // dynamic [assessmentId]
  '/api/landing/',
  '/api/checkout/',
  '/api/assessment/',
  '/api/freedom-agent/chat',
  '/api/freedom-agent/conversation',
]
```

Only `/api/freedom-agent/chat` and `/api/freedom-agent/conversation` are allowlisted. The 4 routes under investigation (`history`, `session`, `unsubscribe`, `weekly-checkin`) all return 404 at runtime under `DEPLOY_TARGET=funnel`.

---

## Section 2 — Codebase grep for the 4 route URLs

Pattern: `freedom-agent/(history|session|unsubscribe|weekly-checkin)` (case-sensitive, across the whole repo excluding `node_modules`).

### Source-code references (3 total)

| File | Line | Reference | Caller URL | Caller in allowlist? |
|---|---|---|---|---|
| `src/app/(public)/free/freedom-agent/[sessionId]/page.tsx` | 155 | `fetch(\`/api/freedom-agent/history?sessionId=...\`)` | `/free/freedom-agent/[sessionId]` | **NO** — only `/free/freedom-os` is allowlisted under `/free/` |
| `src/app/(public)/free/freedom-agent/page.tsx` | 26 | `fetch('/api/freedom-agent/session', { ... })` | `/free/freedom-agent` | **NO** — not in allowlist |
| `src/app/api/freedom-agent/weekly-checkin/route.ts` | 149 | Hardcoded unsubscribe link `\`${BASE_URL}/api/freedom-agent/unsubscribe?email=...\`` (string inside an email HTML template) | `/api/freedom-agent/weekly-checkin` (the route itself) | **NO** — not in allowlist |

### Self-references (the route files themselves — expected, not callers)

The 4 route files appear in their own list (`src/app/api/freedom-agent/{history,session,unsubscribe,weekly-checkin}/route.ts`). These are not callers; they're the routes being investigated.

### Other matches (non-source-code — for context only)

Several `.md` audit/investigation files and `.txt`/`.csv` logs at the repo root mention these routes; they are documentation, not consumers:
- `FUNNEL_DEPLOY_AUDIT_2026-05-15.md` (independent prior audit — confirms the same verdict; see Section 4 for excerpts)
- `FUNNEL_NONFUNNEL_ROUTES_TO_REMOVE.md` (prior diagnostic that listed these 4 routes among non-funnel)
- `FORCE_DYNAMIC_TARGET_LIST_2026-05-03.{txt,csv}` (historical export annotation)
- `AUDIT_2026-04-23.md`, `AI_EMPLOYEE_GAP_REPORT_2026-04-24.md`, `BUG1_STALE_BRIEFING_INVESTIGATION_2026-04-24.md`, `CODEBASE_INVENTORY_2026-05-04.md`, `PHASE1_BUILD_INVESTIGATION_2026-05-02.md`, `PHASE1_DECISIONS_INVESTIGATION_2026-05-02.md`, `VISIBLE_UI_BUGS_INVESTIGATION_2026-04-24.md`
- `docs/beehiiv-nurture-setup.md` (line 130: documentation mention of `weekly-checkin`)
- `vercel_phase1_5_log.txt` (build-log warnings from a past deploy)

None of these are runtime code paths.

---

## Section 3 — "Specifically check these files" (per investigation brief)

The user asked me to verify these directly even if grep showed no match. Results:

### 3a. `src/app/assessment/[assessmentId]/page.tsx` (the funnel assessment page)

The path as written in the brief (`src/app/assessment/...`) does not exist. The actual assessment page lives under the `(public)` route group. Verifying by checking what components the assessment chain imports:

**Components in `src/components/assessment/`** — fetch calls observed:

| Component | Fetch targets |
|---|---|
| `AgentRail.tsx` | `/api/freedom-agent/conversation` (line 54) ✓ allowlisted; `/api/assessment/email-status` (line 142) ✓ allowlisted; `/api/assessment/email-capture` (line 197) ✓ allowlisted; `/api/freedom-agent/chat` (line 263) ✓ allowlisted |
| `AgentGate.tsx` | `/api/assessment/email-status` (line 54) ✓; `/api/assessment/email-capture` (line 228) ✓; one comment at line 10 mentioning `/api/freedom-agent/chat` — code reference, not a fetch |
| `AgentMessages.tsx` | None of the 4 candidate routes (verified by explicit grep) |
| `EmailCapturePanel.tsx` | `/api/assessment/email-status` (line 48) ✓; `/api/assessment/email-capture` (line 109) ✓ |
| `SprintGrid.tsx` | `/api/assessment/sprint-progress` (line 84) ✓ allowlisted |
| `Day1Spotlight.tsx` | `/api/assessment/sprint-progress` (line 78) ✓ allowlisted |

**Verdict for 3a:** Zero references to any of the 4 candidate routes from any funnel-side assessment component.

### 3b. `src/components/freedom-agent/**`

Directory does **not exist**. Glob `src/components/freedom-agent/**` returned no files. Freedom-agent UI lives in `src/components/assessment/` (covered in 3a above).

### 3c. `src/lib/funnel/**`

The directory exists with at least one file: `src/lib/funnel/nurture-sequences.ts`. Grep inside it for `freedom-agent` matched **9 occurrences**, but **all are email-marketing tag/segment string identifiers** (e.g. `"freedom-agent-8week"`, `"freedom-agent-week-N"`, `"freedom-agent-active"`, `"freedom-agent-complete"`) used to configure Beehiiv nurture-sequence segments. These are tag literals, NOT route URLs — they never form a request to any of the 4 candidate routes.

**Verdict for 3c:** No reference to the 4 candidate routes.

### 3d. `src/lib/email/**`

Directory does **not exist**.

### 3e. `src/lib/beehiiv/**`

Directory does **not exist**. Beehiiv segment configuration lives in `src/lib/funnel/nurture-sequences.ts` (covered in 3c).

### 3f. `src/lib/freedom-agent/*` (cross-check — used by the allowlisted chat/conversation routes)

The 5 lib files under `src/lib/freedom-agent/` (`plan-prompt-section.ts`, `load-plan-for-session.ts`, `append-message.ts`, `fetch-conversation.ts`, `build-system-prompt.ts`) were greped for the 4 candidate route patterns. Result: **no matches**. These libs only support `chat`/`conversation`.

### 3g. `src/types/freedom-agent.ts`

Type-only definitions. Greped for the 4 route patterns: no matches.

---

## Section 4 — Independent corroboration from prior audit

`FUNNEL_DEPLOY_AUDIT_2026-05-15.md` (untracked file at repo root, written before this session) reached the same conclusion in lines 40-43:

> - `/api/freedom-agent/history` — **NOT used by funnel.** Called only from `src/app/(public)/free/freedom-agent/[sessionId]/page.tsx:155`. That `[sessionId]` page is the legacy plan-flow agent, NOT the Escape Assessment HUD's `AgentRail`. The Escape funnel uses `/api/freedom-agent/conversation` instead.
> - `/api/freedom-agent/session` — **NOT used by funnel.** Called only from `src/app/(public)/free/freedom-agent/page.tsx:26`, the legacy entry page that takes `?planId=`. The Escape funnel never reaches it.
> - `/api/freedom-agent/unsubscribe` — **NOT used by funnel.** Referenced only from `src/app/api/freedom-agent/weekly-checkin/route.ts:149` as an unsubscribe link in a weekly-checkin email body.
> - `/api/freedom-agent/weekly-checkin` — **NOT used by funnel at user-touch time.** Pure cron job. Listed in `vercel.json:11-14` with schedule `'0 10 * * 1'`. It emails legacy `freedom_agent_sessions` users; the Escape funnel does not write to that table.

Note: the cron entry referenced above has already been dropped from this branch — `vercel.json` was replaced with the funnel config (commit `5279d2f`, no crons block).

---

## Section 5 — Per-route verdicts

| Route | Caller(s) in source | Caller reachable in funnel deploy? | Verdict |
|---|---|---|---|
| `/api/freedom-agent/history` | `src/app/(public)/free/freedom-agent/[sessionId]/page.tsx:155` | No — caller URL `/free/freedom-agent/[sessionId]` is not in allowlist; middleware returns 404 | **SAFE TO DELETE** |
| `/api/freedom-agent/session` | `src/app/(public)/free/freedom-agent/page.tsx:26` | No — caller URL `/free/freedom-agent` is not in allowlist; middleware returns 404 | **SAFE TO DELETE** |
| `/api/freedom-agent/unsubscribe` | `src/app/api/freedom-agent/weekly-checkin/route.ts:149` (embedded as email-link string) | No — the caller (weekly-checkin route) is itself non-funnel and being deleted in the same batch; the funnel's `vercel.json` has no crons so `weekly-checkin` never runs anyway | **SAFE TO DELETE** |
| `/api/freedom-agent/weekly-checkin` | No source-code callers. Was a `vercel.json` cron target, but the funnel `vercel.json` (commit `5279d2f`) has no crons block | No — orphaned in the funnel deploy | **SAFE TO DELETE** |

---

## Section 6 — Coupling notes (advisory, no action required for funnel safety)

If all 4 routes are deleted:
- `src/app/(public)/free/freedom-agent/page.tsx` (legacy entry page) will still ship in the build but `fetch('/api/freedom-agent/session')` would 404 at runtime. The page itself is NOT in the funnel allowlist, so middleware would 404 the page before the fetch ever runs. **No funnel-user impact.**
- `src/app/(public)/free/freedom-agent/[sessionId]/page.tsx` — same situation. Page not allowlisted, middleware 404s first. **No funnel-user impact.**
- These two pages are themselves candidates for inclusion in a broader non-funnel-route deletion pass (they appear in `FUNNEL_NONFUNNEL_ROUTES_TO_REMOVE.md`), but their fate is independent of this 4-route question.

If the user wants to be thorough, both `(public)/free/freedom-agent/` pages can be deleted alongside the 4 API routes — they're dead code under `DEPLOY_TARGET=funnel`.

---

## Summary

**All 4 routes verified SAFE TO DELETE for the funnel deploy.** No file in the funnel allowlist (the 4 pages + 11 API routes specified in `FUNNEL_ALLOWLIST`) — nor any component, lib, or type used by those funnel files — references any of the 4 candidate routes. The only source-code callers are themselves non-funnel and would be 404'd by middleware before they ever ran.

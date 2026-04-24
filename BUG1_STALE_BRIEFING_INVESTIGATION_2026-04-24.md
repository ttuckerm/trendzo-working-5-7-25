# BUG1 — Stale Morning Briefing Investigation

**Date:** 2026-04-24
**Mode:** READ-ONLY. No code changes, no DB writes, no dev server, no build.
**Scope:** Agency dashboard shows a triage "briefing" dated 2026-04-17, marked stale, and the Refresh button returns 403.

---

## TL;DR

- **Problem A (no cron):** `overnight-triage` is registered only in the node-cron scheduler (`src/lib/cron/scheduler.ts:212`). It is **not** in `vercel.json` and there is **no** `/api/cron/overnight-triage/route.ts` handler. On Vercel the job never fires — so `agency_triage` has not been written since whenever the dev machine last ran node-cron (2026-04-17).
- **Problem B (403 on Refresh Triage):** `src/app/api/triage/run/route.ts:38-39` resolves the caller via `getUserAgencyId(userId)` where `userId === 'dev-user'` in dev (auth bypass). `'dev-user'` does not exist in `agency_members`, so `agencyId` is `null`, and line 39 returns 403. Unlike `/api/triage/today`, this handler has no `NEXT_PUBLIC_ADMIN_EMAIL` / owner-row fallback.

The two problems are independent and can be fixed in either order.

---

## STEP 1 — PROBLEM A (missing cron)

### 1.1 scheduler.ts lines 200–230

```ts
// src/lib/cron/scheduler.ts
200  { name: 'autodream',                  schedule: '0 4 * * *',           enabled: false, description: 'autoDream overnight pipeline',           jobRunKey: 'autodream' },
201  { name: 'memory-consolidation',       schedule: '0 5 * * *',           enabled: false, description: 'Memory consolidation (nightly)',         jobRunKey: 'consolidate_memory' },
202  { name: 'network-intelligence',       schedule: '45 4 * * *',          enabled: false, description: 'Network intelligence (daily)' },
203  { name: 'self-scheduler',             schedule: '0 * * * *',           enabled: false, description: 'Self-scheduler tick (hourly)' },
204
205  // ── Feedback Collector (Atlas S1) ────────────────────────────────────────
206  // Previously unregistered. Calls POST /api/atlas/feedback-collector every 6h.
207  { name: 'feedback-collector',         schedule: '0 */6 * * *',         enabled: true,  description: 'Feedback Collector (Atlas S1) — every 6h', jobRunKey: 'feedback_collector' },
208
209  // ── Overnight Triage (Phase 1 Turn 4) ────────────────────────────────────
210  // Populates agency_triage with top-5 urgency-ranked items per agency so the
211  // 8 AM morning brief is a deterministic read, not a GPT cold-start.
212  { name: 'overnight-triage',           schedule: '0 6 * * *',           enabled: true,  description: 'Overnight triage for /agency morning brief',      jobRunKey: 'overnight_triage' },
```

The job-dispatch side lives at `src/lib/cron/scheduler.ts:557-569`:

```ts
557  scheduleJob('overnight-triage', async () => {
558    try {
559      const { runTriageForAllAgencies } = await import('@/lib/triage/overnight-triage')
560      const result = await runTriageForAllAgencies()
561      console.log(
562        `[Cron:OvernightTriage] agencies=${result.agencies_processed} items=${result.items_written} errors=${result.errors.length}`,
563      )
564      try {
565        const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
566        await db.from('integration_job_runs').upsert({ job: 'overnight_triage', last_run: new Date().toISOString() } as any)
567      } catch {}
568      } catch (err: any) { console.error('[Cron:OvernightTriage] Error:', err.message) }
569    })
```

- **Handler function:** `runTriageForAllAgencies()` from `@/lib/triage/overnight-triage`
- **Schedule declared:** `0 6 * * *` (06:00 UTC daily), `enabled: true`, `jobRunKey: 'overnight_triage'`
- **Timezone:** UTC (set on the global `cron.schedule` call a few lines below)

### 1.2 Route-handler search

Searched for:
- `src/app/api/cron/overnight-triage/*`
- `src/app/api/cron/triage/*`
- Any handler for a path containing "overnight" or "triage" under `/api/cron/`

`src/app/api/cron/` contains only:

```
generate-recipes/route.ts
training-pipeline/route.ts
process-scheduled-actions/route.ts
autodream/route.ts
consolidate-memory/route.ts
cultural-scan/route.ts
classify-events/route.ts
```

**No `overnight-triage` or `triage` route under `/api/cron/`. Confirmed absent.**

There is an adjacent manual-trigger handler at `src/app/api/triage/run/route.ts` (not under `/api/cron/`). It requires user-session auth and cannot be called by the Vercel cron dispatcher without a bearer token / bypass.

### 1.3 vercel.json — current crons

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "crons": [
    { "path": "/api/cron/recency-decay",           "schedule": "0 3 * * 0" },
    { "path": "/api/freedom-agent/weekly-checkin", "schedule": "0 10 * * 1" },
    { "path": "/api/atlas/feedback-collector",     "schedule": "0 6 * * *" },
    { "path": "/api/cron/cultural-scan",           "schedule": "30 0 * * *" },
    { "path": "/api/cron/classify-events",         "schedule": "0 1 * * *" }
  ]
}
```

Five crons registered. **No `overnight-triage` entry.** This matches the memory note ("Atlas crons ready for Vercel 2026-04-21") — only the three Atlas crons + the two pre-existing ones are wired to Vercel.

### 1.4 Briefing WRITE paths

**`agency_triage` writes** (the table that feeds the "GOOD MORNING" header via `/api/triage/today`):

| File | Function | Writes to |
| --- | --- | --- |
| `src/lib/triage/overnight-triage.ts:251` | `runTriageForAgency()` (upsert with `onConflict: 'agency_id,triage_date'`) | `agency_triage` |
| `src/lib/triage/overnight-triage.ts:81`  | retention prune inside `runTriageForAllAgencies()` | deletes from `agency_triage` |

Callers of `runTriageForAllAgencies` / `runTriageForAgency`:

- `src/lib/cron/scheduler.ts:559` — node-cron dispatch (not running on Vercel)
- `src/app/api/triage/run/route.ts:4,33,42` — manual trigger (the 403 path)
- `scripts/run-triage-now.ts` — CLI

**`morning_briefs` writes** (a different table — used by the autodream pipeline, not by the agency briefing header in question):

| File | Function |
| --- | --- |
| `src/app/api/cron/autodream/route.ts:349-358` | upsert with `onConflict: 'agency_id,brief_date'` |

The stale "briefing from 2026-04-17" in the UI is NOT from `morning_briefs`; it is from `agency_triage`. See 1.5.

### 1.5 Briefing READ — the "GOOD MORNING" header

Search for `.from('morning_briefs').select(`:

- `src/mcp-server/tools.ts:249` — MCP tool, not the agency dashboard.
- `src/lib/clay/component-data-fetcher.ts:81` — Clay component fetcher. Used by a Clay panel, not the chat header.

The "GOOD MORNING …" title and the "Stale: briefing from 2026-04-17. [Re-run to refresh]" subtitle are **not** rendered from `morning_briefs`. They are generated in `src/app/api/agency-chat/route.ts:227-246` by `buildTriageSpec()`, which is handed the payload returned by `readTriageForAgency()`:

```ts
// src/app/api/agency-chat/route.ts
234  const title = items.length === 0
235    ? 'All quiet on the roster.'
236    : `Good morning. ${items.length} thing${items.length === 1 ? '' : 's'} need${items.length === 1 ? 's' : ''} you.`;
237  const subtitle = payload.stale
238    ? `Stale: briefing from ${payload.triage_date || 'an earlier day'}. [Re-run to refresh]`
239    : items.length === 0
240      ? 'Nothing needs you right now. Pulse below.'
241      : undefined;
```

`payload.stale` and `payload.triage_date` come from `readTriageForAgency()` at `src/lib/triage/overnight-triage.ts:283-314`:

```ts
283  export async function readTriageForAgency(
284    agencyId: string,
285  ): Promise<{ items: TriageItem[]; triage_date: string | null; stale: boolean }> {
286    const db: DB = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
287    const today = new Date().toISOString().split('T')[0]
288
289    const { data: todayRow } = await db
290      .from('agency_triage')
291      .select('items, triage_date')
292      .eq('agency_id', agencyId)
293      .eq('triage_date', today)
294      .maybeSingle()
295
296    if (todayRow) {
297      return { items: (todayRow.items as TriageItem[]) || [], triage_date: todayRow.triage_date, stale: false }
298    }
299
300    // Fall back to most recent row (design review decision 2A: last-known-good).
301    const { data: recentRow } = await db
302      .from('agency_triage')
303      .select('items, triage_date')
304      .order('triage_date', { ascending: false })
305      .limit(1)
306      .maybeSingle()
307
308    if (recentRow) {
309      return { items: (recentRow.items as TriageItem[]) || [], triage_date: recentRow.triage_date, stale: true }
310    }
311
312    return { items: [], triage_date: null, stale: false }
313  }
```

**Why stale = true today:** there is no row for `today = 2026-04-24` (no cron wrote one), so the fallback returns the most recent row — `triage_date = 2026-04-17` — with `stale: true`.

---

## STEP 2 — PROBLEM B (403 on /api/triage/run)

### 2.1 Full handler — `src/app/api/triage/run/route.ts`

```ts
 1  import { NextResponse } from 'next/server'
 2  import { createServerSupabaseClient } from '@/lib/supabase/server'
 3  import { getUserAgencyId } from '@/lib/auth/agency-utils'
 4  import { runTriageForAllAgencies, runTriageForAgency } from '@/lib/triage/overnight-triage'
 5  import { createClient } from '@supabase/supabase-js'
 6  import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
 7
 8  export const runtime = 'nodejs'
 9
10  /**
11   * Manual trigger for overnight triage. Two modes:
12   *   - ?scope=mine       → run for the caller's agency only (operator-triggered)
13   *   - ?scope=all        → run for all agencies (cron-like, admin only)
14   *
15   * Both return the result summary (agencies processed, items written, errors).
16   */
17  export async function POST(req: Request) {
18    try {
19      const url = new URL(req.url)
20      const scope = url.searchParams.get('scope') || 'mine'
21
22      let userId: string
23      if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
24        userId = 'dev-user'
25      } else {
26        const supabase = await createServerSupabaseClient()
27        const { data: { user }, error } = await supabase.auth.getUser()
28        if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
29        userId = user.id
30      }
31
32      if (scope === 'all') {
33        const result = await runTriageForAllAgencies()
34        return NextResponse.json(result)
35      }
36
37      // scope = 'mine' (default)
38      const agencyId = await getUserAgencyId(userId)
39      if (!agencyId) return NextResponse.json({ error: 'No agency found' }, { status: 403 })
40
41      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
42      const count = await runTriageForAgency(db, agencyId)
43
44      return NextResponse.json({
45        success: true,
46        agency_id: agencyId,
47        items_written: count,
48        ran_at: new Date().toISOString(),
49      })
50    } catch (e: any) {
51      console.error('[triage/run] Error:', e)
52      return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
53    }
54  }
```

### 2.2 The exact 403-producing lines

```ts
38      const agencyId = await getUserAgencyId(userId)
39      if (!agencyId) return NextResponse.json({ error: 'No agency found' }, { status: 403 })
```

`getUserAgencyId` (`src/lib/auth/agency-utils.ts:31-46`) queries `agency_members` where `user_id = <userId>` and returns `null` if no row matches.

In dev, the preceding block sets `userId = 'dev-user'`:

```ts
23      if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
24        userId = 'dev-user'
```

`.env.local` line 17 has `NEXT_PUBLIC_DISABLE_AUTH=true`. `'dev-user'` is a sentinel string, not a UUID — it never matches a row in `agency_members`, so `agencyId === null` and the handler returns 403.

### 2.3 The caller in the UI

```ts
// src/app/agency/AgencyClient.tsx
727  const refreshTriage = useCallback(async () => {
728    if (refreshingTriage) return;
729    setRefreshingTriage(true);
730    try {
731      const runUrl = agencyId
732        ? `/api/triage/run?scope=mine`
733        : `/api/triage/run?scope=mine`;
734      const runRes = await fetch(runUrl, { method: 'POST', cache: 'no-store' });
735      if (!runRes.ok) {
736        console.warn('[agency] triage re-run failed', runRes.status);
737        return;
738      }
...
745      const marker = '[__TRENDZO_TRIAGE__] ' + JSON.stringify(triage);
746      sendMessageRef.current({ text: marker });
```

- No body, no headers, no Authorization header, no `credentials: 'include'` (Next.js same-origin fetch sends cookies by default, which is fine).
- Sends `?scope=mine` with no `agency_id` param (the handler also ignores any body).

### 2.4 Caller vs handler mismatch

- **Handler expectation (scope=mine):** a logged-in user whose Supabase `auth.getUser()` returns a UUID that has a matching `agency_members` row — *or* in dev, a `'dev-user'` sentinel that happens to be in `agency_members` (it isn't).
- **What the caller sends:** just the POST request. Cookie auth would normally resolve a real user, but `NEXT_PUBLIC_DISABLE_AUTH=true` short-circuits that and forces `'dev-user'`.

Compare with the sibling read endpoint `src/app/api/triage/today/route.ts:35-50` — it **does** have a dev fallback:

```ts
35  if (!agencyId && process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
36    // Dev fallback: when auth bypass is on, look up the agency owner row directly.
37    const { createClient } = await import('@supabase/supabase-js')
38    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = await import('@/lib/env')
39    const sc = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
40    const { data: ownerRow } = await sc
41      .from('agency_members')
42      .select('agency_id')
43      .eq('role', 'owner')
44      .eq('is_active', true)
45      .limit(1)
46      .maybeSingle()
47    if (ownerRow?.agency_id) agencyId = ownerRow.agency_id
48  }
```

`/api/triage/run` is missing this fallback. That is the 403.

### 2.5 agency_id scoping

The handler resolves the agency **from the session only** (`getUserAgencyId(userId)`). It does not accept `agency_id` from the request. The caller also does not send it. So the bug isn't a missing field on the client; it's the missing dev-fallback on the server, identical to what `/api/triage/today` already does.

In real prod (no `NEXT_PUBLIC_DISABLE_AUTH`), this handler works: the logged-in operator's UUID resolves to their agency. This only breaks in dev with auth bypass on — which is the case the user is running.

---

## STEP 3 — FIX SHAPES

### Problem A (cron never runs)

**Option A1 — Create `/api/cron/overnight-triage/route.ts` + add it to `vercel.json`.**
- Files changed:
  - New: `src/app/api/cron/overnight-triage/route.ts` (~30 LOC — thin wrapper that imports `runTriageForAllAgencies`, returns JSON, mirrors the style of `src/app/api/cron/cultural-scan/route.ts` and `classify-events/route.ts`).
  - Edited: `vercel.json` — add one entry: `{ "path": "/api/cron/overnight-triage", "schedule": "0 6 * * *" }`.
- Lines of code: ~30 + 1 config entry.
- Risk: **Low**. Mirrors proven Atlas-cron pattern; `runTriageForAllAgencies` is already tested (ran successfully on 2026-04-17 via node-cron).
- DB migration: No.
- vercel.json change: **Yes** (required).
- Testable locally: Yes — `curl -X POST http://localhost:3001/api/cron/overnight-triage` verifies handler; actual cron firing only testable on Vercel.

**Option A2 — Reuse the existing `/api/triage/run?scope=all` endpoint in `vercel.json`, gate it with a cron bearer token.**
- Files changed:
  - Edited: `src/app/api/triage/run/route.ts` — add a `CRON_SECRET` / Vercel-cron-UA check that lets `scope=all` bypass session auth.
  - Edited: `vercel.json` — add `{ "path": "/api/triage/run?scope=all", "schedule": "0 6 * * *" }` (query params on cron path are supported by Vercel).
- Lines of code: ~15.
- Risk: **Medium**. Mixes manual-operator and cron paths in the same handler; adds a bypass branch that has to be carefully scoped. Easier to get wrong.
- DB migration: No.
- vercel.json change: Yes.
- Testable locally: Yes with a curl + header.

**Recommendation: A1.** It matches the repo's existing convention — every other Vercel cron (`cultural-scan`, `classify-events`, `feedback-collector`) is a dedicated `/api/cron/<name>/route.ts`. Keeping manual-trigger and cron-trigger handlers separate preserves the clean session-auth boundary on `/api/triage/run` and avoids widening its auth surface.

### Problem B (403 on refresh)

**Option B1 — Add the `NEXT_PUBLIC_ADMIN_EMAIL` owner-row fallback to `/api/triage/run`, mirroring `/api/triage/today`.**
- Files changed: `src/app/api/triage/run/route.ts` only.
- Lines of code: ~15 (copy the block from `triage/today` lines 35-50 and apply it after the `getUserAgencyId(userId)` call when dev bypass is on).
- Risk: **Low**. Existing pattern, proven in sibling route, only affects the dev branch.
- DB migration: No.
- vercel.json change: No.
- Testable locally: Yes — click Refresh Triage in the dashboard.

**Option B2 — Seed an `agency_members` row with `user_id='dev-user'` for the dev agency.**
- Files changed: none in code; requires a DB insert (migration or one-off script).
- Lines of code: ~5 SQL.
- Risk: **Medium**. Leaks a sentinel user into a production-shaped table. Couples dev auth bypass to DB state in a non-obvious way. If prod DB is ever mirrored to dev, this row travels with it.
- DB migration: Yes (or an ad-hoc insert).
- vercel.json change: No.
- Testable locally: Yes.

**Recommendation: B1.** It reuses the exact pattern that `/api/triage/today` already ships, keeps the fix scoped to one file (a handler that is small and well-understood), and leaves the DB alone. B2 is more invasive and couples dev-auth state to DB state.

---

## STEP 4 — DEPENDENCY CHECK

### 4.1 Does B depend on A?
**No.** `/api/triage/run` writes to `agency_triage` on demand; it does not require the Vercel cron to exist. Fixing the 403 lets the operator refresh the briefing manually, immediately, regardless of cron state.

### 4.2 Does A depend on B?
**No.** The Vercel cron will call a new `/api/cron/overnight-triage` route which calls `runTriageForAllAgencies()` directly (service-role client, no user session). `/api/triage/run` is orthogonal.

### 4.3 Recommended order

**Fix B first.** Two reasons:
1. It is the shorter, lower-risk change (one file, ~15 lines, mirrors an existing pattern in a sibling file) and unblocks the operator immediately in dev — they can refresh the briefing on demand today.
2. Fix A requires a Vercel redeploy to actually take effect (cron registrations only activate after deploy). Shipping A without B would not fix the visible 403 on the dev page; shipping B without A gives the operator a working manual refresh while A is still in flight.

After both ship, the 06:00 UTC Vercel cron maintains the daily row and the manual Refresh Triage button still works as an ad-hoc override.

---

## Appendix — supporting evidence

- `.env.local:17` → `NEXT_PUBLIC_DISABLE_AUTH=true` (confirms the dev branch of `triage/run` is the active branch)
- `.env.local:5`  → `NEXT_PUBLIC_ADMIN_EMAIL=ttucker.m@gmail.com` (the env var the proposed B1 fallback would check)
- `src/app/api/cron/` directory contents: `generate-recipes/`, `training-pipeline/`, `process-scheduled-actions/`, `autodream/`, `consolidate-memory/`, `cultural-scan/`, `classify-events/` — no `overnight-triage/` or `triage/`.
- `src/lib/triage/overnight-triage.ts:283-313` `readTriageForAgency` implements the fallback-to-most-recent-row behavior that produces `stale: true` when no row exists for today.

# classify-events Deep Dive — Why HTTP 200 but no `integration_job_runs` write

**Date:** 2026-05-26
**File:** `src/app/api/cron/classify-events/route.ts` (239 lines total)
**Mode:** Read-only investigation. No files modified.

---

## TL;DR

The route returns HTTP 200 without updating `integration_job_runs` because the
`integration_job_runs` upsert is **the very last statement in the handler**, and there are
**two earlier `return` branches that exit with HTTP 200 before reaching it**:

1. **Line 141–148** — `No trends to classify` (fetch error OR zero detected_trends)
2. **Line 163–170** — `All trends already classified` (every recent trend already has a cultural_event)

In normal steady-state operation the route hits branch #2 on essentially every run, returns
`{ success: true }`, and **never executes the upsert**. The PRIMARY KEY / `onConflict` theory is
a red herring — the write code is simply never reached.

A secondary problem: even when the upsert *does* run, **its result is never checked and its errors
are silently swallowed**, so a genuine DB failure would also produce a 200 with no row written and
no log.

---

## 1. Lines 1–50 (imports, exports, top of handler)

```ts
/**
 * Event Classifier — Converts detected_trends → cultural_events
 * Atlas subsystem 4 — Cultural Intelligence Pipeline
 *
 * GET /api/cron/classify-events              — classify all unprocessed trends
 * GET /api/cron/classify-events?niche=fitness — classify for one niche
 *
 * For each detected trend:
 * 1. Classifies by taxonomy (who/what/where/when/why/how)
 * 2. Estimates decay rate (how long until irrelevant)
 * 3. Determines which niches it activates
 * 4. Extracts keyword triggers for the prediction pipeline
 * 5. Auto-approves above confidence threshold (0.8)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const AUTO_APPROVE_THRESHOLD = 0.8

// ── All known niches for cross-niche activation ────────────────────────

const ALL_NICHES = [
  'side-hustles', 'personal-finance', 'fitness', 'business', 'food-nutrition',
  'beauty', 'real-estate', 'self-improvement', 'dating', 'education',
  'career', 'parenting', 'tech', 'fashion', 'health',
  'cooking', 'psychology', 'travel', 'diy', 'language',
]

// ── LLM Classification ─────────────────────────────────────────────────

interface ClassifiedEvent {
  event_title: string
  event_summary: string
  taxonomy: {
    who: string
    what: string
    where: string
    when: string
    why: string
    how: string
  }
  decay_rate: number
  activated_niches: string[]
  keywords: string[]
  expires_in_days: number
}
```

> Note: the handler (`export async function GET`) actually starts at **line 110**, not within the
> first 50 lines. Lines 52–106 are the `classifyTrends()` LLM helper. The handler body is summarized
> in §4 below.

---

## 2. The actual upsert to `integration_job_runs` (lines 220–223)

```ts
  // Track job run
  try {
    await db.from('integration_job_runs').upsert({ job: 'event_classifier', last_run: new Date().toISOString() } as any)
  } catch {}
```

Observations:

- **No `onConflict` argument is passed.** With `job` as PRIMARY KEY, Supabase's default conflict
  target is the PK, so this *would* work if reached. Your `onConflict: 'job'` hypothesis is correct
  but moot — the problem is reachability and error-swallowing, not conflict resolution.
- **The Supabase return value (`{ data, error }`) is never destructured or checked.** `.upsert()`
  does **not throw** on a database-level error (constraint violation, missing/extra column, RLS
  policy denial, type mismatch). It resolves successfully with the error inside the returned object.
  This code throws that object away.
- **The `catch {}` block is empty.** Any error that *is* thrown (network failure, client init issue)
  is silently discarded with zero logging.
- **There is no log line on success or failure of this write.** You cannot tell from logs whether it
  ran, succeeded, or failed.

Net effect: this write can fail for any reason whatsoever and the handler still returns HTTP 200
with no diagnostic trace.

---

## 3. The final return statement (lines 228–238)

```ts
  return NextResponse.json({
    success: true,
    trends_found: unclassified.length,
    classified,
    auto_approved: autoApproved,
    needs_review: classified - autoApproved,
    auto_approve_threshold: AUTO_APPROVE_THRESHOLD,
    elapsed_ms: elapsed,
    errors: errors.length > 0 ? errors : undefined,
  })
```

This is the "happy path" return reached only when there was ≥1 unclassified trend. Note `errors`
here is the **classification/insert** error array — it does **not** include the
`integration_job_runs` upsert outcome at all (that outcome is swallowed by the `catch {}` above).

---

## 4. All logging calls in the file

Only two logging statements exist; **both are `console.log`, neither is near the upsert**, and there
is **no `console.error` anywhere** in the file.

| Line | Call | Context |
|------|------|---------|
| 172  | `console.log(\`[EventClassifier] Classifying ${unclassified.length} trends...\`)` | After confirming there is unclassified work to do; before the LLM call. |
| 226  | `console.log(\`[EventClassifier] Done: ${classified} classified, ${autoApproved} auto-approved in ${(elapsed / 1000).toFixed(1)}s\`)` | After the upsert attempt, before the final return. |

Implications:
- The two HTTP-200 early-return branches (§5) emit **no log at all** — so when the route short-circuits
  you see nothing in the logs, which matches the "200 but no write, no clue why" symptom.
- The upsert's empty `catch {}` emits no log — a failing write is invisible.

---

## 5. Early HTTP-200 returns BEFORE the `integration_job_runs` write — **YES, two of them**

The upsert is at line 222. Two branches above it return `{ success: true }` (HTTP 200) and exit the
handler, never reaching the write:

### Early return A — lines 141–148

```ts
  const { data: trends, error: fetchErr } = await query

  if (fetchErr || !trends || trends.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No trends to classify',
      classified: 0,
      elapsed_ms: Date.now() - startTime,
    })
  }
```

Triggers when the `detected_trends` query errors **or** returns zero rows. Notably, a **fetch error
is treated as success** here (`fetchErr` collapses into the same 200 response) — so even a broken
read of `detected_trends` yields HTTP 200 and skips the job-run write.

### Early return B — lines 163–170

```ts
  const unclassified = trends.filter(t => !alreadyClassifiedIds.has(t.id))

  if (unclassified.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'All trends already classified',
      classified: 0,
      elapsed_ms: Date.now() - startTime,
    })
  }
```

Triggers when all of the fetched trends already have a corresponding `cultural_events` row.

### Why branch B fires on nearly every run (the steady-state trap)

The fetch logic guarantees this branch dominates over time:

```ts
let query = db
  .from('detected_trends')
  .select('id, niche, ...')
  .order('detected_date', { ascending: false })
  .limit(20)            // ← only the 20 MOST RECENT trends
```

Then (lines 152–161) it pulls **all** `cultural_events.source_trend_ids`, builds a Set of
already-classified trend ids, and filters. Once the 20 most-recent detected trends have each been
turned into a cultural_event, **every future run finds `unclassified.length === 0`** and returns at
line 164 — without ever touching `integration_job_runs`.

So `integration_job_runs.last_run` for `event_classifier` only advances on runs that actually
classify new trends. If trend detection is idle (or new trends never enter the most-recent-20 window),
`last_run` goes stale forever while the cron keeps returning 200.

### Other (non-200) exits, for completeness

- **Lines 111–114** — `401 Unauthorized` if `CRON_SECRET` is set and the `Bearer` token mismatches.
- **Lines 120–122** — `500` if Supabase env vars are missing.

Neither returns 200, so neither explains the symptom — but both also skip the write.

---

## 6. Does the route depend on the request being from Vercel's cron system? — **NO**

The only request-origin check is the bearer-token auth at **lines 110–114**:

```ts
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
```

- It reads **only** the `authorization` header, compared against `Bearer ${CRON_SECRET}`.
- The check is **conditional on `CRON_SECRET` being set** — if that env var is unset, there is **no
  auth at all** and any caller passes.
- There is **no inspection of `user-agent`, `x-vercel-cron`, `x-vercel-*`, or any Vercel-specific
  header.** Nothing about the code path depends on the caller being Vercel's scheduler.
- This check, when it fails, returns **401 — not 200** — so it is not a contributor to the
  "200 without a write" symptom.

---

## Conclusion & ranked likelihood

1. **(Most likely) Steady-state early return at line 164** — all recent trends already classified, so
   the handler returns 200 and never reaches the line-222 upsert. `last_run` stays stale.
2. **(Also possible) Early return at line 142** — `detected_trends` empty or the fetch errored
   (errors are misclassified as `success: true` here).
3. **(Possible, and would be invisible) The upsert runs but fails at the DB layer** — Supabase returns
   `{ error }` which is never checked, and any thrown error is swallowed by `catch {}`. No log either
   way. This would also yield 200 + no row.

### Cheap ways to disambiguate (not applied — read-only)

- Check the route's actual response body in Vercel logs: a `message: "All trends already classified"`
  or `"No trends to classify"` field proves it's an early return (#1/#2), not a write failure.
- The presence/absence of the `[EventClassifier] Classifying N trends...` log line (line 172)
  distinguishes "reached the work" from "early-returned" — it only prints past both early returns.
- To expose hypothesis #3, the upsert would need its `{ error }` checked and logged (and ideally the
  `catch {}` populated) — but that is a code change, out of scope for this read-only pass.

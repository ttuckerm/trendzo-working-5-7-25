# Brief Routes — Read-Only State Audit

**Date:** 2026-04-24
**Mode:** READ-ONLY. No code changes.
**Scope:** `/api/brief-status`, `/api/brief-performance`, `/api/brief-acknowledge`.

---

## ⚠ Surprises

**The task prompt's premise is out of date. All three routes have already been hardened.**

The prompt states: *"These three API routes currently use the Supabase service role without authentication or agency scoping"* — that was the state in `SUBSTRATE_AUDIT_2026-04-21.md` §2.D. **Commit `ad3b784` (2026-04-22) shipped the fix as "Fix 2":**

- `brief-status/route.ts` POST — session auth via `createServerSupabaseClient` + `getUserAgencyId`, brief ownership gated on `brief.agency_id !== operatorAgencyId → 403`.
- `brief-performance/route.ts` POST — identical pattern.
- `brief-acknowledge/[briefId]/route.ts` GET — HMAC-SHA256 signed `?token=` param, verified against `brief.user_id`. Helper at `src/lib/email/brief-ack-token.ts`. Signing integrated into `send-brief.ts:159-164`.

**What remains unauthenticated:**
- **`GET /api/brief-status`** — returns up to 50 briefs across all agencies with creator display names joined from `onboarding_profiles`. No session check; no `agency_id` filter.
- **`GET /api/brief-performance`** — returns up to 100 published-brief performance rows across all agencies, including aggregates (avg delta, top performer, biggest miss). No session check; no `agency_id` filter.

So the **actual** cross-tenant gap is the two unauthenticated **GET** endpoints, not the POST/PATCH paths. The gap report at `AI_EMPLOYEE_GAP_REPORT_2026-04-24.md:102,243,402` (which the prompt echoes) was written off the older audit; `AUDIT_2026-04-23.md:234-236` and the 2026-04-21 substrate-audit-fixes memory confirm the POST paths are already gated.

Remediation recommendations below reflect the current state, not the premise.

---

## 1. Route-by-route state

### 1.A — `src/app/api/brief-status/route.ts`

**HTTP methods:** `GET`, `POST`.

**Supabase client instantiations:**

| Line | Client | Purpose |
| --- | --- | --- |
| `30` (GET) | service-role (`createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)`) | Unauthenticated list read |
| `94` (POST) | `createServerSupabaseClient()` (request-scoped cookie client) | `auth.getUser()` only — NO DB reads on this client |
| `122` (POST) | service-role | Brief fetch, update, audit write |

**`content_briefs` queries/mutations:**

| Line | Method | Filters | Returned columns |
| --- | --- | --- | --- |
| 32–36 | `.select(...).order('created_at', desc).limit(50)` | optional `.eq('completion_status', status)` or `.eq('delivery_status', status)` | `id, user_id, brief_content, completion_status, delivery_status, published_url, created_at, acknowledged_at, in_production_at, published_at, performance_measured_at` |
| 124–128 | `.select('id, completion_status, agency_id').eq('id', briefId).single()` | — | — |
| 162–165 | `.update(update).eq('id', briefId)` | — | — |

Plus an `onboarding_profiles` lookup at 59–62 to resolve `business_name` for display.

**External dependencies:** none beyond Supabase. `emitEvent` from `@/lib/events/emit` (audit log only, POST path).

**Existing auth logic:**
- GET: **none** (cross-tenant exposed).
- POST: session gate at 94–98; agency gate at 101–104; brief ownership at 138–140.

**Success/error response shapes:**
- GET 200: `{ briefs: [{id, creator, title, completion_status, delivery_status, published_url, ...timestamps}], count }`
- GET 400/500: `{ briefs: [], error }`
- POST 200: `{ success: true }`
- POST 400/401/403/404/500: `{ success: false, error }`

### 1.B — `src/app/api/brief-performance/route.ts`

**HTTP methods:** `GET`, `POST`.

**Supabase client instantiations:**

| Line | Client | Purpose |
| --- | --- | --- |
| `43` (GET) | service-role | Unauthenticated aggregate read |
| `119` (POST) | `createServerSupabaseClient()` | `auth.getUser()` only |
| `153` (POST) | service-role | Brief fetch, update, audit write |

**`content_briefs` queries/mutations:**

| Line | Method | Filters | Returned columns |
| --- | --- | --- | --- |
| 45–51 | `.select(...).eq('completion_status','published').not('performance_measured_at','is',null).order(...).limit(100)` | optional `.gte('performance_measured_at', sinceIso)` | `id, user_id, brief_content, predicted_vps, actual_views, actual_engagement_rate, performance_delta, performance_measured_at` |
| 155–159 | `.select('id, predicted_vps, completion_status, agency_id').eq('id', briefId).single()` | — | — |
| 184–189 | `.update(update).eq('id', briefId).select(...)` | — | `id, predicted_vps, actual_views, actual_engagement_rate, performance_delta, performance_measured_at, performance_source, completion_status` |

Plus `onboarding_profiles` lookup at 65–68 for creator names.

**External dependencies:** `emitEvent` (audit log, POST only).

**Existing auth logic:**
- GET: **none**.
- POST: session gate at 119–123; agency gate at 126–129; brief ownership at 167–169.

**Success/error response shapes:**
- GET 200: `{ period, creator_filter, total_measured, avg_performance_delta, top_performer, biggest_miss, rows: [...] }`
- GET 400/500: `{ error }`
- POST 200: `{ success: true, brief }`
- POST 400/401/403/404/500: `{ success: false, error }`

### 1.C — `src/app/api/brief-acknowledge/[briefId]/route.ts`

**HTTP methods:** `GET` only (creator-facing one-click acknowledgement from email).

**Supabase client instantiations:**

| Line | Client | Purpose |
| --- | --- | --- |
| `44` | service-role | Brief fetch (needs `user_id` for sig check) + status update + audit |

No request-scoped client — intentional; see §3 below.

**`content_briefs` queries/mutations:**

| Line | Method | Filters | Returned columns |
| --- | --- | --- | --- |
| 48–52 | `.select('id, user_id, agency_id, completion_status').eq('id', briefId).single()` | — | — |
| 88–91 | `.update({ completion_status: 'acknowledged', acknowledged_at: now }).eq('id', briefId)` | (gated on `alreadyAcknowledged` check at 85) | — |

**External dependencies:** `verifyBriefAckToken` from `@/lib/email/brief-ack-token` (HMAC-SHA256, `timingSafeEqual`). `emitEvent` for audit.

**Existing auth logic:** HMAC-signed URL token — **no session, no cookies, no headers.** Flow:
1. `?token=...` param extracted at 34.
2. Brief loaded from DB by ID at 48 (needed to get `user_id` since the URL does not carry it).
3. `verifyBriefAckToken(briefId, brief.user_id, token)` at 66 recomputes the HMAC digest and `timingSafeEqual`s it against the provided token.
4. On success → conditional update (idempotent: only if `completion_status === 'delivered'`).

**Response shape:** HTML only (this is a browser-clicked link from an email), via `htmlResponse()` helper at 9–20. Status codes: 200 (success or already-acknowledged), 401 (missing/invalid token), 404 (brief not found), 500 (config error / secret missing).

---

## 2. Canonical auth pattern in the codebase

Five routes use `createServerSupabaseClient` + `getUserAgencyId` today:
`triage/run`, `triage/today`, `agency-chat`, `clay/classify`, `clay/action`, `clay/component-data`, and the already-hardened `brief-status` + `brief-performance` POST paths.

### Cleanest reference: `src/app/api/triage/run/route.ts` (already mirrors this fix)

```ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'

export async function POST(req: Request) {
  try {
    let userId: string
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      userId = 'dev-user'
    } else {
      const supabase = await createServerSupabaseClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      userId = user.id
    }
    // ... + the dev-fallback added in the prior session
    let agencyId = await getUserAgencyId(userId)
    if (!agencyId && process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' && process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      // Dev fallback: look up owner row ...
    }
    if (!agencyId) return NextResponse.json({ error: 'No agency found' }, { status: 403 })
    // ... scoped work
  }
}
```

### Most robust reference: `src/app/api/clay/action/route.ts` (extracted helper)

Factors the resolution order into a local `resolveContext()` helper at lines 19–53:
1. Real auth via `createServerSupabaseClient()` + `auth.getUser()` + `getUserAgencyId(user.id)`.
2. `NEXT_PUBLIC_ADMIN_EMAIL` dev fallback via owner-row lookup on `agency_members`.
3. Hard 403 on failure.

Returns `{ userId, agencyId }` — the two values any agency-scoped route needs. This is the cleanest canonical shape and is worth copying where a route needs both values.

### Helpers (full signatures)

**`src/lib/supabase/server.ts`**
```ts
export async function createServerSupabaseClient(): Promise<SupabaseClient>
```
Returns a `@supabase/ssr` cookie-bound server client. Use for `auth.getUser()`. DO NOT use for service-role DB work — it's the anon key under the user's cookie.

**`src/lib/auth/agency-utils.ts`**
```ts
export async function getUserAgencyId(userId: string): Promise<string | null>
export async function getAgencyCreators(agencyId: string): Promise<string[]>
```
Both use service-role internally to bypass RLS. `getUserAgencyId` queries `agency_members` where `user_id = userId AND is_active = true` and returns the first match.

### Error-shape convention

Across the 5 audit-gated routes:

| Status | Body | When |
| --- | --- | --- |
| 401 | `{ error: 'Unauthorized' }` or `{ success: false, error: 'Authentication required' }` | No session |
| 403 | `{ error: 'No agency found' }` or `{ success: false, error: 'Operator not assigned to an agency' }` | Session OK, no agency membership |
| 403 | `{ success: false, error: 'Brief belongs to a different agency' }` | Cross-tenant attempted |
| 404 | `{ success: false, error: 'Brief not found' }` | Unknown brief id |

The variance in wording is cosmetic — there's no hard convention. `success: false` is consistent in the POST mutation paths; the legacy/error-only routes omit it.

### Read vs write client split (canonical)

- **Session auth:** `createServerSupabaseClient` (anon+cookie).
- **DB reads and writes after auth:** service-role client via `createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)`.

This split is universal across the auth-gated routes. `brief-status` and `brief-performance` POST paths already follow it exactly.

---

## 3. `/api/brief-acknowledge` special case

### How the email URL is constructed

`src/lib/email/send-brief.ts:156-164` (verbatim):

```ts
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
let ackToken: string
try {
  ackToken = signBriefAckToken(briefId, brief.user_id)
} catch (e: any) {
  await db.from('content_briefs').update({ delivery_status: 'failed' }).eq('id', briefId)
  return { success: false, error: `Cannot sign ack token: ${e?.message || 'BRIEF_ACK_SECRET not configured'}` }
}
const ackUrl = `${baseUrl.replace(/\/$/, '')}/api/brief-acknowledge/${briefId}?token=${ackToken}`
```

- The token is a base64url HMAC-SHA256 of `briefId + '.' + creatorUserId` keyed on `BRIEF_ACK_SECRET` (from `src/lib/email/brief-ack-token.ts`).
- `brief.user_id` is NOT in the URL (Option A from the Fix 2 spec) — the route loads the brief by id first, then recomputes the HMAC over `briefId + user_id` and `timingSafeEqual`s against the supplied token.
- This means URL shape is `.../api/brief-acknowledge/{briefId}?token={base64url_hmac}`.

### Existing token-based auth patterns elsewhere

Searched for similar patterns for one-click / magic-link / unsubscribe flows. Findings:
- **HMAC-signed tokens:** only `brief-ack-token.ts` in this codebase. No other files use `createHmac` / `timingSafeEqual` for URL signing.
- **Cron bearer tokens:** `/api/cron/*` routes check `Authorization: Bearer ${CRON_SECRET}` header. Different use case (machine-to-machine, header-based, not creator-facing).
- No unsubscribe flow, no magic-link flow, no other one-click email actions currently exist in the repo.

**So `brief-ack-token.ts` is the canonical token pattern** and the GET route already uses it correctly.

### Is there a per-brief verification secret column?

Schema (from `20260303_content_briefs.sql` + subsequent ALTERs):
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` — public, v4 random. Could in principle serve as a capability token, but it's already the URL path segment so using it for auth = no auth.
- `user_id` — FK, not a secret.
- `agency_id` — FK (added 2026-04-21), not a secret.
- Status and timestamp columns — none random, none nullable-to-seed.

**There is NO per-brief random secret column.** The current HMAC design was chosen specifically because there's no storage-side secret to sign with — the secret lives in the env (`BRIEF_ACK_SECRET`), not in the row. This is simpler and avoids a schema change; revocation, if ever needed, would require rotating `BRIEF_ACK_SECRET` (invalidating all live tokens) or adding a column.

### Assessment

The current `brief-acknowledge` design is **appropriate for the creator-not-member constraint**:
- Creators don't log in, so session auth is impossible.
- HMAC signing binds the URL to `{briefId, user_id, BRIEF_ACK_SECRET}`. A brief_id alone does not grant access; a leaked token only grants acknowledgement of that specific brief.
- `timingSafeEqual` defends against timing attacks.
- The route is idempotent — re-hitting a valid URL after acknowledgement is a no-op with a friendly HTML message.

**No known-better design is in play.** One weak oracle remains: 404 vs 401 distinguishability lets an attacker with a brief UUID test existence — the header comment in `brief-ack-token.ts:10` acknowledges this and deems it acceptable given UUID randomness. Agreed.

---

## 4. Caller map

### `/api/brief-status`

| Caller | File:line | Method | Body / params | Notes |
| --- | --- | --- | --- | --- |
| Frontend — dashboard status-update button | `src/app/agency/dashboard/DashboardClient.tsx:234-238` | POST | `{ briefId, status, publishedUrl }` | Already operator-only UI; cookie-authed request |
| Backend — agency-chat agent tool `get_briefs_by_status` | `src/app/api/agency-chat/route.ts:1704-1708` | GET (forwards `cookie: cookieHeader`) | `?status=...&creator_name=...` | Internal same-origin fetch with operator cookie forwarded |
| Test scripts | `scripts/test-phase2-chat.mjs`, `scripts/test-phase2-v2.mjs` | (greps show only references in dev/test docs, not direct POST) | — | — |

### `/api/brief-performance`

| Caller | File:line | Method | Body / params |
| --- | --- | --- | --- |
| Frontend — dashboard "log performance" form | `src/app/agency/dashboard/DashboardClient.tsx:194-202` | POST | `{ briefId, actualViews, actualEngagementRate }` |
| Backend — agency-chat agent tool `get_performance_summary` | `src/app/api/agency-chat/route.ts:1727-1731` | GET (with `cookie: cookieHeader`) | `?period=...&creator_name=...` |

### `/api/brief-acknowledge/[briefId]`

| Caller | File:line | Method | Body / params |
| --- | --- | --- | --- |
| Email click — creator's inbox | generated by `src/lib/email/send-brief.ts:164` | GET | `?token={HMAC}` (in the rendered email HTML, button at `send-brief.ts:88`) |

**No other callers.** No internal server-side route calls `/api/brief-acknowledge`. No test script posts to it directly.

---

## 5. Current security surface

### `/api/brief-status`

- **Anonymous attacker with a valid `brief_id`:**
  - GET: can list up to 50 briefs across **all agencies** filtered by status. Creator business names are joined in from `onboarding_profiles`. Exposes workflow state and counts to anyone who can hit the URL.
  - POST: **cannot do anything** — 401 at line 97.
- **Authenticated member of Agency A vs Agency B brief:**
  - GET: same unfiltered listing — sees Agency B briefs.
  - POST: **403** at line 139 ("Brief belongs to a different agency"). Mutation blocked.
- **Rate limiting / abuse protection:** none.

### `/api/brief-performance`

- **Anonymous attacker:**
  - GET: can pull up to 100 published-brief performance rows (views, engagement, delta, predicted VPS) across **all agencies**, plus aggregates (avg delta, top performer, biggest miss). Raw VPS-vs-actual data leak.
  - POST: **cannot do anything** — 401 at line 122.
- **Authenticated Agency A member vs Agency B:**
  - GET: sees Agency B data.
  - POST: **403** at 168.
- **Rate limiting:** none.

### `/api/brief-acknowledge/[briefId]`

- **Anonymous attacker with only a valid `briefId` and no token:** 401 "This link is missing its signature."
- **Anonymous attacker with brief_id + guessed/forged token:** 401 "This acknowledgment link could not be verified." — HMAC binds token to `{briefId, user_id, secret}`, unforgeable without secret.
- **Cross-tenant (Agency A member acting on Agency B brief):** the agency does not matter here — acknowledgement is a creator action gated on token. If the Agency A member has possession of the signed link (e.g. forwarded email), they could hit it. This is by design and matches the creator-forwarding-their-own-link threat model.
- **Rate limiting:** none. HMAC verify is O(1), cheap to probe, but useless without `BRIEF_ACK_SECRET`. The only signal an attacker can extract is "does this briefId exist" via 404-vs-401 — accepted per the helper comment.

---

## 6. Recommendations

### 6.A — `/api/brief-status`

- **POST: NO CHANGE.** Already session-gated + agency-scoped (the task-prompt premise was stale).
- **GET: add session + agency scope.**
  - Mirror the POST path's auth block: `createServerSupabaseClient` → `auth.getUser()` → `getUserAgencyId(user.id)` → 401/403.
  - Add `.eq('agency_id', operatorAgencyId)` to the query at lines 32–36.
  - Drop the `onboarding_profiles.business_name` join from an unbounded list to an agency-scoped `.in('user_id', agencyCreatorIds)` or keep the current join since the brief set is already scoped — either works, the join is still bounded to scoped briefs' user_ids.
- **Schema change needed:** none. `agency_id` is live (per `AGENCY_ID_VERIFICATION_2026-04-24.md`).
- **Utility to use:** `createServerSupabaseClient` + `getUserAgencyId`. No new helper needed. Optionally, if the `clay/action.resolveContext` helper gets extracted to a shared location, use it — but that's a refactor, not a requirement.
- **Risk:** **Low.** The GET endpoint is called by the agency-chat agent tool which already forwards the operator's cookie (`agency-chat/route.ts:1708`). After the change, the tool will resolve the same operator's agency and return scoped data — **behavior strictly improves**. No external callers depend on unauthenticated access.

### 6.B — `/api/brief-performance`

- **POST: NO CHANGE.** Already session-gated + agency-scoped.
- **GET: add session + agency scope** using the same pattern as §6.A. Add `.eq('agency_id', operatorAgencyId)` to the query at lines 45–51.
- **Schema change needed:** none.
- **Utility to use:** same.
- **Risk:** **Low.** Same caller analysis as §6.A — the only backend caller is `agency-chat/route.ts:1731` which forwards the cookie. After the change, aggregates (`avg_delta`, `top_performer`, `biggest_miss`) become agency-scoped — a correctness improvement the agent is already implicitly requesting.

### 6.C — `/api/brief-acknowledge`

- **GET: NO CHANGE recommended.**
- The token-based design is correct and already shipped. No session can exist here; the creator is not an agency member.
- If hardening beyond the current HMAC is wanted in a follow-up:
  - **Option 1 — per-brief secret column.** Add `content_briefs.ack_token UUID DEFAULT gen_random_uuid()`. Pros: revocable per-brief, no global secret rotation needed. Cons: schema change, migration, backfill, code in `send-brief.ts` changes. Would be a Fix 3 / separate PR.
  - **Option 2 — token expiry.** Bake `expires_at` into the HMAC payload (e.g. `briefId.user_id.expTs`). Pros: compromised emails can't be replayed forever. Cons: creators who open a week-old brief email hit a 401 and have to ask the operator to resend.
- **Neither is urgent.** The current design is an acceptable endpoint security posture for a creator-facing one-click action.
- **Schema change needed:** none for the current design. Option 1 above would need `ALTER TABLE content_briefs ADD COLUMN ack_token UUID NOT NULL DEFAULT gen_random_uuid()` — a pre-flight before any route change.

### Shared risks and edge cases

1. **`NEXT_PUBLIC_DISABLE_AUTH=true` (local dev).** The audited auth-gated routes (`triage/run`, `clay/action`) include a fallback that maps the dev-user sentinel to the agency owner by looking up the `NEXT_PUBLIC_ADMIN_EMAIL`. The current `brief-status`/`brief-performance` POST paths do **NOT** have this fallback — they 401 in dev unless the operator is real-authed. If the GET endpoints are hardened using the same pattern, they'll have the same dev-environment 401 unless the fallback is copied forward. **Recommend copying the `clay/action.resolveContext` block** so the GET calls work in dev.
2. **Agency-chat tool `cookie: cookieHeader` forwarding.** The agent's internal GET calls (1708, 1731) forward the operator's cookie. After hardening, this continues to work. If the agent ever runs out-of-band of an operator session (scheduled job, background worker), those calls would break — none exist today, but flag for future `/api/cron/*` integrations.
3. **Caller with no agency row.** Any operator without an `agency_members` row will 403 on the GET. This matches the POST behavior and is correct per the domain model; if unaffiliated users ever need read access, the fallback shape (e.g. `briefs: [], scope: 'none'`) would need a product decision.
4. **`brief-acknowledge` forward-compat.** If Option 1 (per-brief secret) is chosen later, the migration must backfill existing undelivered/delivered briefs' emails — live emails containing HMAC tokens would 401 after cutover. Same "tokens are forward-only" constraint noted in commit `ad3b784`'s deploy notes.
5. **Nothing else in the codebase depends on the unauthenticated GET behavior.** Grep confirmed only the 2 dashboard fetches (POST) and 2 agent tool fetches (GET with cookie) call these paths. No cron, no webhook, no external service.

# Creator Table Write Investigation — 2026-04-23

**Type:** READ-ONLY investigation
**Scope:** `creators` and `creator_profiles` tables (deprecation candidates)
**Canonical table going forward:** `onboarding_profiles`
**Goal:** Determine which write paths are still active so we can decide soft-freeze vs hard-freeze per path.

---

## SECTION 1 — Every write to the `creators` table

Search performed: `.from('creators')` followed within ~10 lines by `.insert(`, `.update(`, or `.upsert(` across `src/`.

**Result:** **4 write call sites — all in a single file: `src/hooks/useCreators.ts`. Zero writes to `creators` exist outside this hook.** No `.insert()` to `creators` was found anywhere in `src/`.

---

### 1.1 `src/hooks/useCreators.ts:269` — `updateCreator()` (UPDATE)

```typescript
264|  const updateCreator = async (id: string, data: Partial<Creator>): Promise<Creator | null> => {
265|    setLoading(true);
266|    setError(null);
267|    try {
268|      const supabase = createClient();
269|      const { data: creator, error: updateError } = await supabase
270|        .from('creators')
271|        .update(data)
272|        .eq('id', id)
273|        .select()
274|        .single();
275|
276|      if (updateError) throw updateError;
277|      return creator;
278|    } catch (err) {
279|      setError(err instanceof Error ? err : new Error('Failed to update creator'));
```

- **Route path:** N/A (client hook, not an API route)
- **Called from:** `useCreatorMutations` is re-exported in `src/hooks/index.ts:23`. **Grep across `src/` for `from '@/hooks/useCreators'`, `from "@/hooks/useCreators"`, `from '@/hooks'`, `from "@/hooks"` returned ZERO matches.** No file in `src/` consumes this hook.

---

### 1.2 `src/hooks/useCreators.ts:307` — `verifyCreator()` (UPDATE)

```typescript
302|      if (status === 'verified' || status === 'featured') {
303|        updateData.verified_at = new Date().toISOString();
304|        updateData.verified_by = user?.id || null;
305|      }
306|
307|      const { error: updateError } = await supabase
308|        .from('creators')
309|        .update(updateData)
310|        .eq('id', id);
311|
312|      if (updateError) throw updateError;
313|      return true;
314|    } catch (err) {
315|      setError(err instanceof Error ? err : new Error('Failed to verify creator'));
316|      return false;
317|    } finally {
```

- **Route path:** N/A (client hook)
- **Called from:** Same as 1.1 — re-exported but never imported by any file in `src/`.

---

### 1.3 `src/hooks/useCreators.ts:327` — `assignToAgency()` (UPDATE)

```typescript
322|  const assignToAgency = async (creatorId: string, agencyId: string | null): Promise<boolean> => {
323|    setLoading(true);
324|    setError(null);
325|    try {
326|      const supabase = createClient();
327|      const { error: updateError } = await supabase
328|        .from('creators')
329|        .update({ agency_id: agencyId })
330|        .eq('id', creatorId);
331|
332|      if (updateError) throw updateError;
333|      return true;
334|    } catch (err) {
335|      setError(err instanceof Error ? err : new Error('Failed to assign creator to agency'));
336|      return false;
337|    } finally {
```

- **Route path:** N/A (client hook)
- **Called from:** Same as 1.1 — never imported.

---

### 1.4 `src/hooks/useCreators.ts:347` — `suspendCreator()` (UPDATE)

```typescript
342|  const suspendCreator = async (id: string, reason: string): Promise<boolean> => {
343|    setLoading(true);
344|    setError(null);
345|    try {
346|      const supabase = createClient();
347|      const { error: updateError } = await supabase
348|        .from('creators')
349|        .update({
350|          suspended_at: new Date().toISOString(),
351|          suspension_reason: reason,
352|          is_active: false,
353|        })
354|        .eq('id', id);
355|
356|      if (updateError) throw updateError;
357|      return true;
358|    } catch (err) {
359|      setError(err instanceof Error ? err : new Error('Failed to suspend creator'));
360|      return false;
361|    } finally {
```

- **Route path:** N/A (client hook)
- **Called from:** Same as 1.1 — never imported.

---

### 1.5 Adjacent finding — `src/lib/services/creatorAttributionService.ts:622` (mock, not a real write)

The service `saveCreatorToDatabase()` is referenced from `/api/creator-attribution/route.ts:91` (`registerCreator()`), but the underlying implementation does NOT execute a write — it only logs:

```typescript
621|  // Database operations (mock implementations)
622|  private async saveCreatorToDatabase(creator: CreatorInfo): Promise<void> {
623|    try {
624|      const { supabaseClient } = await import('@/lib/supabase-client');
625|
626|      // In production, save to creators table
627|      console.log(`💾 Saving creator to database: ${creator.id}`);
628|    } catch (error) {
629|      console.error('Error saving creator to database:', error);
630|    }
631|  }
```

It does NOT call `.from('creators').insert()`. **Not counted as a real write path.**

---

### Section 1 summary table

| File | Route Path | Write Type | Called From | Currently Active? |
|------|-----------|------------|-------------|-------------------|
| `src/hooks/useCreators.ts:269` (`updateCreator`) | N/A (client hook) | UPDATE | Re-exported in `src/hooks/index.ts:23`; **no consumer in `src/`** | **NO — dead code** |
| `src/hooks/useCreators.ts:307` (`verifyCreator`) | N/A (client hook) | UPDATE | Re-exported only; no consumer in `src/` | **NO — dead code** |
| `src/hooks/useCreators.ts:327` (`assignToAgency`) | N/A (client hook) | UPDATE | Re-exported only; no consumer in `src/` | **NO — dead code** |
| `src/hooks/useCreators.ts:347` (`suspendCreator`) | N/A (client hook) | UPDATE | Re-exported only; no consumer in `src/` | **NO — dead code** |

> **Bottom line for Section 1:** No active write path to `creators` was found. The only writes that exist are inside an unused client hook. The "mock" `creatorAttributionService.saveCreatorToDatabase()` (referenced by `/api/creator-attribution`) only `console.log`s and does not execute a write.

---

## SECTION 2 — Every write to the `creator_profiles` table

Search performed: `.from('creator_profiles')` followed within ~10 lines by `.insert(`, `.update(`, or `.upsert(` across `src/`.

**Result:** **5 write call sites across 2 files.**

---

### 2.1 `src/app/api/creator/onboard/route.ts:58` — UPDATE `analysis_status='scraping'`

```typescript
53|    if (existingProfile) {
54|      profileId = existingProfile.id;
55|      console.log(`[Creator Onboard] Existing profile found: ${profileId}`);
56|
57|      // Update status to scraping
58|      await supabase
59|        .from('creator_profiles')
60|        .update({ analysis_status: 'scraping' })
61|        .eq('id', profileId);
62|    } else {
63|      // Create new profile
64|      const { data: newProfile, error: createError } = await supabase
65|        .from('creator_profiles')
66|        .insert({
67|          tiktok_username: username,
68|          channel_url: `https://www.tiktok.com/@${username}`,
```

- **Route path:** `POST /api/creator/onboard`
- **Called from:**
  - `src/app/admin/creators/page.tsx:58` — "Add Creator" form submit
  - `src/app/admin/creators/page.tsx:90` — "Refresh Baseline" button per row

---

### 2.2 `src/app/api/creator/onboard/route.ts:64` — INSERT new profile

```typescript
62|    } else {
63|      // Create new profile
64|      const { data: newProfile, error: createError } = await supabase
65|        .from('creator_profiles')
66|        .insert({
67|          tiktok_username: username,
68|          channel_url: `https://www.tiktok.com/@${username}`,
69|          analysis_status: 'scraping'
70|        })
71|        .select()
72|        .single();
73|
74|      if (createError || !newProfile) {
75|        return NextResponse.json(
76|          { success: false, error: `Failed to create profile: ${createError?.message}` },
77|          { status: 500 }
78|        );
79|      }
```

- **Route path:** `POST /api/creator/onboard` (same handler as 2.1)
- **Called from:** Same UI consumers as 2.1.

---

### 2.3 `src/app/api/creator/onboard/route.ts:167` — UPDATE `analysis_status='analyzing'`

```typescript
162|    }
163|
164|    console.log(`[Creator Onboard] Scraped ${scrapeData.length} videos`);
165|
166|    // Step 4: Process scraped videos and store in creator_video_history
167|    await supabase
168|      .from('creator_profiles')
169|      .update({ analysis_status: 'analyzing' })
170|      .eq('id', profileId);
171|
172|    let videosProcessed = 0;
173|    let ffmpegAnalyzed = 0;
174|
175|    for (const video of scrapeData) {
176|      try {
177|        // Calculate DPS from scraped metrics
```

- **Route path:** `POST /api/creator/onboard` (same handler).
- **Called from:** Same UI consumers as 2.1.

---

### 2.4 `src/app/api/creator/onboard/route.ts:256` — UPDATE `analysis_status='complete'`

```typescript
251|    await supabase.rpc('calculate_creator_baseline', {
252|      p_creator_profile_id: profileId
253|    });
254|
255|    // Step 6: Update status to complete
256|    await supabase
257|      .from('creator_profiles')
258|      .update({ analysis_status: 'complete', last_scraped_at: new Date().toISOString() })
259|      .eq('id', profileId);
260|
261|    // Fetch final profile
262|    const { data: finalProfile } = await supabase
263|      .from('creator_profiles')
264|      .select('*')
265|      .eq('id', profileId)
266|      .single();
```

- **Route path:** `POST /api/creator/onboard` (same handler).
- **Called from:** Same UI consumers as 2.1.

---

### 2.5 `src/lib/creator/profile_builder.ts:117` — UPSERT (rebuildCreatorProfile)

```typescript
108|  const coeffRows: any[] = []
109|  for (const [token, rec] of tokenCounts) {
110|    if (rec.count < 5) continue
111|    const avg = rec.sumLift / rec.count
112|    const shrink = rec.count / (rec.count + 25)
113|    const coeff = Number((avg * shrink).toFixed(4))
114|    coeffRows.push({ creator_id: creatorId, token, coeff, support: rec.count, updated_at: new Date().toISOString() })
115|  }
116|
117|  await db.from('creator_profiles').upsert({ creator_id: creatorId, niche, follower_band, style_embedding: embedding, baseline_completion, baseline_share_rate, updated_at: new Date().toISOString() } as any)
118|  if (coeffRows.length) await db.from('creator_token_coeffs').upsert(coeffRows)
119|  return { ok: true }
120|}
121|
122|export async function getCreatorProfile(creatorId: string): Promise<any> {
123|  await ensureCreatorTables()
124|  const { data: prof } = await db.from('creator_profiles').select('*').eq('creator_id', creatorId).limit(1)
125|  return { profile: prof?.[0], coeffs: [] }
```

- **Route path (indirect):** `POST /api/creator/rebuild_profile` (`src/app/api/creator/rebuild_profile/route.ts:8` calls `rebuildCreatorProfile()`).
- **Called from:** Grep for `/api/creator/rebuild_profile` and for `rebuildCreatorProfile` symbol returned **only the route handler itself**. **No fetch in `src/` invokes this route. No other file calls `rebuildCreatorProfile()`.**

> **Note:** This `upsert` writes a different schema shape than the one used by `/api/creator/onboard`. `profile_builder.ts` keys on `creator_id` (text PK created by `ensureCreatorTables()` via `exec_sql`), while `/api/creator/onboard` writes `id` (uuid) + `tiktok_username` + `analysis_status`. These look like two different evolutionary layers grafted on the same table name.

---

### 2.6 Adjacent finding — `src/lib/federated/ensure.ts:38` (DDL via RPC, not a SDK write)

```typescript
36|  const sql = `
37|  ...
38|  alter table if exists creator_profiles add column if not exists personalization_model_version text;
39|  `
40|  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
```

This is a schema DDL via `rpc('exec_sql')`, not a Supabase-SDK `.insert/.update/.upsert`. **Not counted as a write path** (it's a one-time column add). Mentioned for completeness.

---

### Section 2 summary table

| File | Route Path | Write Type | Called From | Currently Active? |
|------|-----------|------------|-------------|-------------------|
| `src/app/api/creator/onboard/route.ts:58` | `POST /api/creator/onboard` | UPDATE (status='scraping') | UI: `src/app/admin/creators/page.tsx:58, :90` | **YES — UI active** |
| `src/app/api/creator/onboard/route.ts:64` | `POST /api/creator/onboard` | INSERT (new profile) | UI: `src/app/admin/creators/page.tsx:58, :90` | **YES — UI active** |
| `src/app/api/creator/onboard/route.ts:167` | `POST /api/creator/onboard` | UPDATE (status='analyzing') | UI: `src/app/admin/creators/page.tsx:58, :90` | **YES — UI active** |
| `src/app/api/creator/onboard/route.ts:256` | `POST /api/creator/onboard` | UPDATE (status='complete') | UI: `src/app/admin/creators/page.tsx:58, :90` | **YES — UI active** |
| `src/lib/creator/profile_builder.ts:117` (`rebuildCreatorProfile`) | `POST /api/creator/rebuild_profile` | UPSERT (full row) | **No callers in `src/`** | **NO — orphaned** |

---

## SECTION 3 — Every read from the `creators` table

Search: `.from('creators').select(` (and `.from('creators')` followed by `.select`).

**Total reads: 17 call sites across 8 files.**

| # | File:Line | Context (5 lines) |
|---|-----------|-------------------|
| 1 | `src/hooks/useCreators.ts:59` | `.from('creators').select(` with joined `profiles!creators_user_id_fkey` and `agencies!creators_agency_id_fkey`; main `useCreators()` list query with filters. |
| 2 | `src/hooks/useCreators.ts:170` | `.from('creators').select('*, user:profiles!creators_user_id_fkey(*), agency:agencies!creators_agency_id_fkey(*), verified_by_user:profiles!creators_verified_by_fkey(*)').eq('id', id).single();` — single creator fetch in `useCreator(id)`. |
| 3 | `src/hooks/useCreators.ts:230` | `.from('creators').select('*, user:profiles!creators_user_id_fkey(*)', { count: 'exact' }).eq('agency_id', agencyId).order('created_at', { ascending: false });` — `useAgencyCreators()`. |
| 4 | `src/hooks/useCreators.ts` (inside `usePendingCreators`, line ~200) | Wraps `useCreators({ verificationStatus: 'pending' })`, so resolves to read #1. |
| 5 | `src/lib/coordinator/handlers/platform-audit.ts:21` | `db.from('creators').select('id', { count: 'exact', head: true })` — count only. |
| 6 | `src/lib/planning/context-assembler.ts:30` | `db.from('creators').select('id', { count: 'exact', head: true })` — count only. |
| 7 | `src/lib/planning/context-assembler.ts:80` | `.from('creators').select('id', { count: 'exact', head: true })` followed by `.eq` — filtered count. |
| 8 | `src/mcp-server/tools.ts:36-40` | `.from('creators').select('id, username, display_name, total_followers, total_videos, avg_dps, platforms, updated_at')` — MCP tool list. |
| 9 | `src/mcp-server/tools.ts:60` | `.from('creators').select('*', { count: 'exact', head: true })` — MCP count tool. |
| 10 | `src/mcp-server/tools.ts:98` | `.from('creators').select('id, username, display_name, agency_id')` — MCP creator selector. |
| 11 | `src/lib/network-intelligence/analyzer.ts:101` | `.from('creators').select('id, username, agency_id')` — network analyzer. |
| 12 | `src/lib/coordinator/handlers/monthly-reports.ts:75` | `.from('creators').select('id', { count: 'exact', head: true })` — total count. |
| 13 | `src/lib/coordinator/handlers/monthly-reports.ts:82` | `.from('creators').select('id', { count: 'exact', head: true })` — filtered count. |
| 14 | `src/lib/coordinator/handlers/monthly-reports.ts:96` | `.from('creators').select('user_id')` — list of user_ids. |
| 15 | `src/hooks/useDashboardStats.ts:147` | `supabase.from('creators').select('verification_status')` inside admin dashboard stats query. |
| 16 | `src/hooks/useDashboardStats.ts:313` | `supabase.from('creators').select('*', { count: 'exact' }).eq('agency_id', agencyId)` — agency dashboard stats. |
| 17 | `src/hooks/useCreators.ts:200` (re-export site) | `usePendingCreators()` wrapper — counted separately under hook re-export. |

> Hooks (`useCreators.ts`, `useDashboardStats.ts`) are re-exported via `src/hooks/index.ts` but **no other file imports from `@/hooks` or `@/hooks/useCreators` / `@/hooks/useDashboardStats`** — so reads #1, #2, #3, #4, #15, #16 are dead at the consumer level.
> Live read paths today: `mcp-server/tools.ts` (MCP server), `network-intelligence/analyzer.ts`, `coordinator/handlers/*` (background jobs), `planning/context-assembler.ts`. None of these are wired to a user-facing UI page.

---

## SECTION 4 — Every read from the `creator_profiles` table

Search: `.from('creator_profiles').select(`.

**Total reads: 11 call sites across 5 files.**

| # | File:Line | Context |
|---|-----------|---------|
| 1 | `src/app/api/creator/onboard/route.ts:46` | `await supabase.from('creator_profiles').select('*').eq('tiktok_username', username).single();` — check existing profile in POST. |
| 2 | `src/app/api/creator/onboard/route.ts:263` | `.from('creator_profiles').select('*').eq('id', profileId).single();` — fetch final profile after onboarding. |
| 3 | `src/app/api/creator/onboard/route.ts:306` | `.from('creator_profiles').select('*').eq('tiktok_username', username.replace('@', '')).single();` — GET handler (status check). |
| 4 | `src/app/api/creator/list/route.ts:21` | `.from('creator_profiles').select('*').order('created_at', { ascending: false });` — list endpoint used by `/admin/creators` page. |
| 5 | `src/app/api/creator/predictions/route.ts:34` | `.from('creator_profiles').select('id').eq('tiktok_username', username).single();` — GET predictions for creator. |
| 6 | `src/app/api/creator/predictions/route.ts:87` | `.from('creator_profiles').select('id').eq('tiktok_username', creator_username).single();` — POST: resolve creator profile id before inserting prediction. |
| 7 | `src/app/api/admin/integration/status/route.ts:525` | `await db.from('creator_profiles').select('creator_id')` — admin integration status. |
| 8 | `src/app/api/admin/integration/status/route.ts:527` | `await db.from('creator_profiles').select('updated_at').order('updated_at', { ascending: false }).limit(1)` — last-updated timestamp. |
| 9 | `src/lib/components/creator-baseline.ts:256` | `.from('creator_profiles').select('*').eq('tiktok_username', tiktokUsername).single();` — `CreatorBaseline.loadProfile()`. |
| 10 | `src/lib/creator/profile_builder.ts:124` | `await db.from('creator_profiles').select('*').eq('creator_id', creatorId).limit(1)` — `getCreatorProfile()` used by `/api/creator/profile`. |
| 11 | (none additional) | — |

---

## SECTION 5 — UI pages that depend on these tables

Tracing UI pages (`page.tsx` under `src/app/`) that, directly or via 2 levels of imports/fetches, reach a write on `creators` or `creator_profiles`.

### 5.1 `/admin/creators` — `src/app/admin/creators/page.tsx`

- **Writes which deprecated table:** `creator_profiles` (indirectly, via `POST /api/creator/onboard`).
- **Direct evidence:**
  - Line 58: `await fetch('/api/creator/onboard', { method: 'POST', ... })` — "Add Creator" submit (`handleAddCreator`).
  - Line 90: `await fetch('/api/creator/onboard', { method: 'POST', ... })` — "Refresh Baseline" per row (`handleRefreshBaseline`).
  - Line 39: `await fetch('/api/creator/list')` — read list of `creator_profiles`.
- **Linked from navigation?** **YES.**
  - `src/lib/control-center/constants.ts:113` registers it in `PAGE_DEFINITIONS` as a system page (`{ id:'creators', name:'Creators', path:'/admin/creators', ... }`).
  - `src/app/admin/bloomberg/page.tsx:702` and `:1188` push to `/admin/creators` from the Bloomberg admin terminal.
  - `src/app/admin/creators/[username]/page.tsx:179, :195` cross-link back from the detail page.
  - No matches in any `**/layout.tsx` for the literal string `/admin/creators` (i.e., not in a global sidebar/nav layout).

### 5.2 `/admin/creators/[username]` — `src/app/admin/creators/[username]/page.tsx`

- **Writes which deprecated table:** `creator_profiles` only **indirectly via reads** (`GET /api/creator/onboard?username=…`, `GET /api/creator/predictions?username=…`). The `POST /api/creator/predictions` it issues writes to `creator_predictions`, not to `creator_profiles` itself. So this page **does not directly cause writes to `creator_profiles`**, only reads.
- **Linked from navigation?** Reachable from `/admin/creators` row click (line 186 of the parent page). Not linked from layout/sidebar.

### 5.3 `/admin/scale` — `src/app/admin/scale/page.tsx`

- **Calls `/api/scale/create-creator` (line 37), `/api/scale/list`, `/api/scale/summary`, `/api/scale/plan`, `/api/scale/run-day`, `/api/scale/run-30d`, `/api/scale/reset`.**
- **Verification:** `Get-ChildItem -Path src/app/api/scale -Recurse -File` returned **empty**. **None of those routes exist in the codebase.**
- **Conclusion:** This page contains a "Create Creator" button, but the corresponding API route is **missing**. The button cannot reach `creators` or `creator_profiles`. Effectively a broken page; no write path.

### 5.4 Pages reaching `creators` (table) writes via UI

- The only writes to `creators` exist in `useCreators.ts` mutations.
- `useCreators`/`useCreatorMutations` are re-exported from `src/hooks/index.ts` but **no component imports them** (grep for `from '@/hooks/useCreators'`, `from "@/hooks/useCreators"`, `from '@/hooks'`, `from "@/hooks"` returned **zero matches** under `src/`).
- **Conclusion:** No UI page reaches a write to `creators`.

### 5.5 Layout/sidebar nav scan

Grep across `**/layout.tsx` for `/admin/creators`, `/admin/scale`, `/api/creator/onboard`, `/api/creator/list`, `/api/creator/predictions`, `/api/creator/profile`, `/api/creator/rebuild_profile` returned **zero matches**. There is no global nav/sidebar entry for these. The only first-class registration is in `src/lib/control-center/constants.ts` (used by an internal control-center / system-health UI), and the cross-links from `/admin/bloomberg`.

---

## SECTION 6 — Production traffic indicators

For each route identified in Sections 1 & 2:

### 6.1 `POST /api/creator/onboard`
- **Vercel analytics import:** None (no `@vercel/analytics` import in this route file).
- **`console.log` / `logger.info` statements:** **YES, extensive `console.log` instrumentation** (lines 42, 55, 82, 86, 118, 121, 140, 164, 233, 246, 249, 268, 283). These would show up in Vercel function logs whenever the route is hit. So if the route is being hit in production, you can see it in Vercel runtime logs.
- **Environment-gated code (`process.env.NODE_ENV === 'production'`):** None.
- **Other env reads:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `TIKTOK_SCRAPER_ACTOR_ID`, `APIFY_API_TOKEN`. The route will fail at request time if `APIFY_API_TOKEN` is missing — that's an indirect health signal.

### 6.2 `POST /api/creator/rebuild_profile` → `rebuildCreatorProfile()` (writes via upsert)
- **Vercel analytics:** None.
- **`console.log` / logger:** None in `src/app/api/creator/rebuild_profile/route.ts`. `src/lib/creator/profile_builder.ts` also has zero log statements.
- **Environment-gated code:** None.
- **Observability:** **NONE.** If this route is being hit in production, there is no log line, no analytics event, and no metric to confirm it. Silent.

### 6.3 `useCreators.ts` mutations (`updateCreator`, `verifyCreator`, `assignToAgency`, `suspendCreator`)
- These are **client-side Supabase calls**, not API routes — they hit Supabase from the browser directly. Vercel function logs cannot observe them.
- No `console.log` other than `setError(... new Error(...))` on failure paths.
- **Observability:** Only via Supabase logs / RLS audit. No client-side analytics on these mutations. Effectively unobservable from our app code.

### 6.4 `creatorAttributionService.saveCreatorToDatabase()` (Section 1.5)
- Has `console.log('💾 Saving creator to database: ...')` and an error `console.error`. Will appear in logs every time `/api/creator-attribution` (`registerCreator` action) is hit. But it does **not perform a write** — only a log.

### 6.5 Summary
- Real production observability exists only for **`POST /api/creator/onboard`** (via `console.log` lines).
- **No** Vercel analytics or environment-gated code anywhere in any of these routes.
- `POST /api/creator/rebuild_profile` and the `useCreators.ts` client mutations have **no observability whatsoever** in our app code.

---

## SECTION 7 — Recommendation matrix

For each write path identified in Sections 1 and 2:

| # | Write path | Recommendation | Reasoning |
|---|-----------|----------------|-----------|
| 1 | `useCreators.ts:269` `updateCreator` (UPDATE on `creators`) | **SAFE TO HARD FREEZE** | The hook is re-exported but **not imported by any file in `src/`**. No UI path. No production observability needed because nothing calls it. Dead code. |
| 2 | `useCreators.ts:307` `verifyCreator` (UPDATE on `creators`) | **SAFE TO HARD FREEZE** | Same as #1. Dead. |
| 3 | `useCreators.ts:327` `assignToAgency` (UPDATE on `creators`) | **SAFE TO HARD FREEZE** | Same as #1. Dead. |
| 4 | `useCreators.ts:347` `suspendCreator` (UPDATE on `creators`) | **SAFE TO HARD FREEZE** | Same as #1. Dead. |
| 5 | `/api/creator/onboard` line 58 — UPDATE `creator_profiles.analysis_status='scraping'` | **SOFT FREEZE ONLY** | `/admin/creators` page actively calls this route in two flows ("Add Creator", "Refresh Baseline"). Page is referenced by Bloomberg admin and registered in `control-center/constants.ts`. Route has live `console.log` instrumentation; production traffic cannot be ruled out without checking Vercel logs. Hard-freezing this would break the Add/Refresh UX. Recommend: redirect to `onboarding_profiles` only after confirming via Vercel logs that the route is unused, or after migrating the UI page. |
| 6 | `/api/creator/onboard` line 64 — INSERT new `creator_profiles` row | **SOFT FREEZE ONLY** | Same handler / same UI consumers as #5. This is the only INSERT path into `creator_profiles` in the entire codebase. Hard-freezing without migrating the UI flow will silently break creator onboarding for any current admin user. |
| 7 | `/api/creator/onboard` line 167 — UPDATE `creator_profiles.analysis_status='analyzing'` | **SOFT FREEZE ONLY** | Same handler, same risk. Removing it would leave records stuck at `'scraping'`. |
| 8 | `/api/creator/onboard` line 256 — UPDATE `creator_profiles.analysis_status='complete'` | **SOFT FREEZE ONLY** | Same handler, same risk. Removing it would leave records stuck at `'analyzing'`. |
| 9 | `/api/creator/rebuild_profile` → `profile_builder.ts:117` UPSERT on `creator_profiles` | **NEEDS MANUAL REVIEW** | The route `POST /api/creator/rebuild_profile` exists and `rebuildCreatorProfile()` is exported, but **no code in `src/` invokes either**. Schema shape (keyed on `creator_id` text via `ensureCreatorTables()` `exec_sql`) is incompatible with the schema written by `/api/creator/onboard` (uuid `id` + `tiktok_username`). The route has **zero observability** — no logs, no analytics — so even in production we cannot tell whether anything is hitting it (e.g., a manual cron, an external integration, or a deprecated frontend). Recommend: check Vercel route invocation metrics for `/api/creator/rebuild_profile` and `/api/creator/profile` for the last 30 days before deciding. If invocation count is zero, safe to hard-freeze; otherwise treat as live. |

---

## Cross-cutting notes (not part of the matrix, but worth surfacing)

1. **There are effectively two `creator_profiles` schemas in the code.** `src/app/api/creator/onboard/route.ts` writes the column set `{tiktok_username, channel_url, analysis_status, last_scraped_at, baseline_dps, ...}` against an `id` (uuid) PK. `src/lib/creator/profile_builder.ts` writes `{creator_id (text), niche, follower_band, style_embedding, baseline_completion, baseline_share_rate}` and creates the table with `creator_id text primary key` if it doesn't exist (`ensureCreatorTables()`). Both target the same table name. Whichever schema currently exists in production determines which write path actually succeeds.

2. **`/api/creator-attribution` (`registerCreator`) is a no-op write.** The implementation only `console.log`s. Any consumer expecting real persistence is broken. Not part of the deprecation decision but should be noted.

3. **`/admin/scale` references several missing API routes** under `/api/scale/*`. The "Create Creator" button on that page cannot reach the database. The page is broken regardless of what we decide about deprecation.

4. **Hooks file `src/hooks/useCreators.ts` is fully dead.** All 4 mutations and all 4 read variants are re-exported by `src/hooks/index.ts`, but no file in `src/` imports from `@/hooks` or `@/hooks/useCreators`. Same for `useDashboardStats`. Safe to delete entirely as a follow-up cleanup.

---

**Investigation completed (read-only). No files were modified. No migrations were run.**

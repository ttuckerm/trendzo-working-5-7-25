# `content_briefs.agency_id` — Production-State Verification

**Date:** 2026-04-24
**Mode:** READ-ONLY diagnostic. No code or migration changes.
**Question:** Does `content_briefs.agency_id` actually exist in the production schema, and is its backfill + code rollout consistent?

---

## 1. Commit `ad3b784` contents

**Full commit message** (2026-04-22, ttucker.m@gmail.com):

> **substrate: Fix 1 (content_briefs.agency_id) + Fix 2 (auth on brief routes)**
>
> Following SUBSTRATE_AUDIT_2026-04-21.md (included). Two substrate hygiene fixes shipped from the audit.
>
> **Fix 1 — content_briefs.agency_id**
> - Migration 20260421 adds nullable UUID column + FK agencies(id) ON DELETE SET NULL + index + additive agency-scoped SELECT RLS policy.
> - Backfilled from onboarding_profiles.agency_id via user_id join. **Live DB at ship time: 20/20 rows covered, 0 still-null.**
> - Six insert paths now populate agency_id:
>   - agency/brief-review (operator, from source pre_generated_brief)
>   - clay/action-handler pushBriefToCreators + generateBatchBriefs (operator, from context.agencyId)
>   - creator/concept-score/expand, content-calendar/accept, quick-win/brief (creator, null-safe onboarding_profiles lookup)
>
> **Fix 2 — Auth + agency gate on exposed brief routes** — [brief-status POST / brief-performance POST / brief-acknowledge GET with HMAC token] …
>
> **Verification** (from commit): tsc --noEmit clean on 12 edited/created files; unauthenticated POST /api/brief-status → 401 verified; GET /api/brief-acknowledge with no token → 401 verified; cross-agency 403 test deferred to multi-agency staging.

**Files changed** (12 files, +1026 / −13):

| File | Lines |
| --- | --- |
| `SUBSTRATE_AUDIT_2026-04-21.md` | +694 |
| `src/app/api/agency/brief-review/route.ts` | +1 |
| `src/app/api/brief-acknowledge/[briefId]/route.ts` | +51 / −? |
| `src/app/api/brief-performance/route.ts` | +41 / −? |
| `src/app/api/brief-status/route.ts` | +42 / −? |
| `src/app/api/content-calendar/accept/route.ts` | +9 |
| `src/app/api/creator/concept-score/expand/route.ts` | +9 |
| `src/app/api/quick-win/brief/route.ts` | +9 |
| `src/lib/clay/action-handler.ts` | +12 / −? |
| `src/lib/email/brief-ack-token.ts` | +65 (new) |
| `src/lib/email/send-brief.ts` | +15 / −? |
| **`supabase/migrations/20260421_add_agency_id_to_content_briefs.sql`** | **+91 (new)** |

Migration file present in the commit: `supabase/migrations/20260421_add_agency_id_to_content_briefs.sql`.

---

## 2. Migration file(s) adding `agency_id` to `content_briefs`

**Exactly one match**: `supabase/migrations/20260421_add_agency_id_to_content_briefs.sql` (91 lines). No other file under `supabase/migrations/` or `supabase/migrations_archive/` adds this column. Searched with grep for `ALTER TABLE content_briefs` combined with `agency_id`, and for `ADD COLUMN agency_id` against `content_briefs`.

**Relevant SQL (verbatim, with `IF NOT EXISTS` guards noted):**

```sql
-- 1. Add column (nullable). — HAS IF NOT EXISTS GUARD
ALTER TABLE content_briefs
  ADD COLUMN IF NOT EXISTS agency_id UUID;

-- 2. Backfill from onboarding_profiles. — WRAPPED IN DO $$ BLOCK, RAISES NOTICE
DO $$
DECLARE
  total_before INT;
  backfilled   INT;
  still_null   INT;
BEGIN
  SELECT COUNT(*) INTO total_before FROM content_briefs;

  UPDATE content_briefs cb
  SET    agency_id = op.agency_id
  FROM   onboarding_profiles op
  WHERE  cb.user_id   = op.user_id
    AND  cb.agency_id IS NULL
    AND  op.agency_id IS NOT NULL;

  GET DIAGNOSTICS backfilled = ROW_COUNT;

  SELECT COUNT(*) INTO still_null
  FROM   content_briefs
  WHERE  agency_id IS NULL;

  RAISE NOTICE 'content_briefs backfill: total=%, backfilled=%, still_null=%',
    total_before, backfilled, still_null;
END $$;

-- 3. FK constraint. — GUARDED VIA pg_constraint LOOKUP
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'content_briefs_agency_id_fkey'
  ) THEN
    ALTER TABLE content_briefs
      ADD CONSTRAINT content_briefs_agency_id_fkey
      FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Index. — HAS IF NOT EXISTS GUARD
CREATE INDEX IF NOT EXISTS idx_content_briefs_agency_id
  ON content_briefs(agency_id);

-- 5. RLS policy. — DROP/CREATE pattern (idempotent)
DROP POLICY IF EXISTS "Agency members can read their briefs" ON content_briefs;
CREATE POLICY "Agency members can read their briefs"
  ON content_briefs FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM agency_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- 6. Column comment.
COMMENT ON COLUMN content_briefs.agency_id IS
  'Agency this brief belongs to. Added 2026-04-21 (audit Fix 1). …';
```

**Idempotency:** every DDL step is idempotent (`IF NOT EXISTS` for column/index, `pg_constraint` check for FK, `DROP POLICY IF EXISTS` + `CREATE POLICY` for the policy). Re-running this migration is safe. The backfill `UPDATE` is also safe on re-run (filtered on `cb.agency_id IS NULL`).

**No NOT NULL constraint added.** Nullability-tightening is explicitly deferred to a later migration per the file's header comment.

---

## 3. Production schema state — **UNVERIFIABLE FROM CODE ALONE**

The repo does **not** contain a definitive record of which migrations have been applied to the production Supabase project (`ref = vyeiyccrageeckeehyhj`, per `supabase/.temp/linked-project.json`).

### What I checked

| Signal | Finding |
| --- | --- |
| Manifest/lockfile under `supabase/` | None present. Only `config.toml`, `functions/`, `migrations/`, `migrations_archive/`, `.temp/` — no `MIGRATIONS_APPLIED*` file, no lockfile. |
| `_supabase_migrations` tracking table dump | Not in repo. Supabase stores applied migrations in `supabase_migrations.schema_migrations` **on the live DB** — querying requires live DB access, which this diagnostic does not have. |
| `MIGRATIONS_APPLIED.md` / similar project convention | Absent. There is no repo convention I can find for recording applied migrations. Adjacent artifacts like `APPLY-PREDICTIONS-MIGRATION.md` are per-migration runbooks, not trackers. |
| `-- applied: YYYY-MM-DD` header in the migration file | Absent. The file has no applied-date marker. |
| Commit-message assertion | Commit `ad3b784` (2026-04-22) states: *"Live DB at ship time: 20/20 rows covered, 0 still-null."* This is an **author assertion that the migration was run and the backfill took effect at commit time** — reasonable trust signal, not independent verification. |
| Later migration referencing `agency_id` | `20260423_drop_vps_prediction_and_tighten_completion_status.sql` (only newer `content_briefs`-touching migration) does **not** reference `agency_id`. So no later migration implicitly asserts the column is present. |
| Filename chronology | `20260421_add_agency_id_to_content_briefs.sql` sits inside a dense cluster of same-era migrations (`20260420`, `20260421`, `20260421b`, `20260423`). Every one of those newer files is also on disk with no applied-marker, so filename position tells us nothing about applied-vs-not. |

### What the code behavior would imply (indirect evidence only)

- `src/app/api/brief-status/route.ts:125–126` does `.from('content_briefs').select('id, completion_status, agency_id')`. If `agency_id` did not exist in production, **every live request to this route would return a PostgREST error** along the lines of `column "agency_id" does not exist`. Same for `brief-performance/route.ts:157` and `brief-acknowledge/[briefId]/route.ts:50`. So: **if any of these routes have been successfully serving requests in production since 2026-04-22, the column is present.** I cannot verify that from the codebase alone.
- Similarly, the 6 INSERT paths populating `agency_id` would all fail on write in production if the column were absent.

### Verdict for Step 3

**UNVERIFIABLE FROM CODE ALONE.** The commit-message assertion plus the code's unconditional reliance on the column strongly suggests applied, but ground truth requires either:
- a live SQL query (e.g. in Supabase SQL Editor):
  ```sql
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'content_briefs' AND column_name = 'agency_id';

  SELECT COUNT(*) AS total, COUNT(agency_id) AS with_agency, COUNT(*) - COUNT(agency_id) AS null_rows
  FROM content_briefs;
  ```
- or a check against `supabase_migrations.schema_migrations` for the `20260421` version.

Neither can be obtained from the repo.

---

## 4. Code usage of `content_briefs.agency_id` — PARTIAL ROLLOUT

### Write path — **COMPLETE** (6/6 insert paths populate `agency_id`)

| File | Line | Source of `agency_id` |
| --- | --- | --- |
| `src/app/api/agency/brief-review/route.ts` | 192 | `brief.agency_id` (from source `pre_generated_brief`) |
| `src/lib/clay/action-handler.ts` | 822 | `context.agencyId` (operator session, `pushBriefToCreators` clone-insert) |
| `src/lib/clay/action-handler.ts` | 899 | `context.agencyId` (operator session, `generateBatchBriefs`) |
| `src/app/api/content-calendar/accept/route.ts` | 101–102, insert below | `resolvedAgencyId = creatorProfile?.agency_id ?? null` (null-safe) |
| `src/app/api/creator/concept-score/expand/route.ts` | 188–192 | Same null-safe lookup pattern |
| `src/app/api/quick-win/brief/route.ts` | 43–49 | Same null-safe lookup pattern |

All 6 paths match the commit message and the memory file. None of them wrap the insert in a try/catch around column existence — they assume the column exists unconditionally.

### Read path (agency-scoped) — **COMPLETE where touched** (3 routes)

| File | Line | Usage |
| --- | --- | --- |
| `src/app/api/brief-status/route.ts` | 126, 138 | `SELECT … agency_id`; `if (brief.agency_id !== operatorAgencyId) → 403`. Comment at :135 cites migration 20260421. |
| `src/app/api/brief-performance/route.ts` | 157, 167 | Same select + ownership gate pattern. Comment at :166 cites migration 20260421. |
| `src/app/api/brief-acknowledge/[briefId]/route.ts` | 50, 99 | `SELECT … agency_id`; `emitEvent({ agencyId: brief.agency_id ?? undefined })`. |

### Read path (legacy `user_id` → `onboarding_profiles.agency_id` join) — **STILL IN USE** (4 files)

These query agency-scoped data but **do not** use `content_briefs.agency_id` directly. They resolve agency membership via `agency_members` → `user_ids` → `.in('user_id', …)` on `content_briefs`:

| File | Line | Pattern |
| --- | --- | --- |
| `src/lib/clay/action-handler.ts` | 955–964 (`generateReport`) | Comment at :955 **literally says**: `// (content_briefs has no agency_id column — we resolve via onboarding_profiles → user_id.)` — **stale and now false** after the migration. |
| `src/lib/triage/overnight-triage.ts` | 118, 155 | Overdue-brief scan + performance-highlight scan both use `.in('user_id', Array.from(userIdSet))`. |
| `src/lib/dashboard/queries.ts` | 117, 251 | Agency dashboard queries use `.in('user_id', creatorIds)`. |
| `src/app/api/agency-chat/route.ts` | 497–508 | Context assembly for the agency chat uses `.in('user_id', safeCreatorIds)`. |
| `src/lib/monitoring/platform-signals.ts` | 201–202 | Doc comment still says *"Briefs link to agencies via content_briefs.user_id → onboarding_profiles.user_id → onboarding_profiles.agency_id."* — stale. |

These legacy paths still work correctly (the join produces the same agency scoping indirectly) but are slower (extra round-trip) and miss briefs with `agency_id` set but no matching `onboarding_profiles` row (theoretical edge case).

### Verdict for Step 4

**Code-side rollout is PARTIAL.** The write side is complete (all 6 insert paths populate `agency_id`). The agency-ownership read side is complete for the three brief-lifecycle routes the audit touched (`brief-status`, `brief-performance`, `brief-acknowledge`). But four agency-scoped **read** paths — report generation, overnight triage, dashboard queries, agency-chat context — still use the legacy user_id-join pattern and contain a stale code comment claiming the column doesn't exist.

No code has a runtime try/catch around the column — every read/write assumes the column exists unconditionally.

---

## 5. RLS policies on `content_briefs`

All `CREATE POLICY ... ON content_briefs` statements across every migration (current + archive):

| Migration | Line | Policy | Predicate |
| --- | --- | --- | --- |
| `20260303_content_briefs.sql` | 35 | `content_briefs_user_select` | `FOR SELECT USING (auth.uid() = user_id)` |
| `20260303_content_briefs.sql` | 38 | `content_briefs_user_insert` | `FOR INSERT WITH CHECK (auth.uid() = user_id)` |
| `20260303_content_briefs.sql` | 41 | `content_briefs_user_update` | `FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)` |
| `20260421_add_agency_id_to_content_briefs.sql` | 74 | `"Agency members can read their briefs"` | `FOR SELECT USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid() AND is_active = true))` |

### Observation

Policies are **permissive** (Postgres default), so they OR together. The 2026-04-21 migration adds an **additive** agency-scoped SELECT policy:
- A user can still SELECT their own briefs via `auth.uid() = user_id`.
- An agency member can additionally SELECT any brief whose `agency_id` matches their active agency.

**INSERT and UPDATE policies still use only `auth.uid() = user_id`.** An operator editing a brief they do not own — even for a brief in their own agency — would be blocked by RLS unless the backend uses the service-role key to bypass RLS. In practice, the brief-lifecycle routes (`brief-status`, `brief-performance`) use the service-role client for the actual mutation, with the agency ownership check (`brief.agency_id !== operatorAgencyId → 403`) enforced at the application layer. So this is deliberate layered defense, not a hole — but it means **RLS alone does not enforce agency-scoped mutations.** That enforcement lives entirely in the API handlers.

---

## 6. Recommendation

### Classification

Migration **exists and is well-formed**; author assertion at commit time says it was applied to the live DB; code has unconditionally adopted the column on the write side and on the three lifecycle-auth routes. **Ground truth on "is the column currently in production" requires one live SQL query.**

### Recommended next action

**Run a single one-line verification in the Supabase SQL Editor. No migration writing needed. No code changes yet.**

```sql
-- Verification query — copy-paste into Supabase SQL Editor against the production project
SELECT
  (SELECT column_name FROM information_schema.columns
   WHERE table_name = 'content_briefs' AND column_name = 'agency_id') AS column_present,
  (SELECT COUNT(*) FROM content_briefs)                                AS total_rows,
  (SELECT COUNT(*) FROM content_briefs WHERE agency_id IS NOT NULL)    AS agency_scoped_rows,
  (SELECT COUNT(*) FROM content_briefs WHERE agency_id IS NULL)        AS null_rows;
```

Expected outcomes:

| Scenario | What it means | Next step |
| --- | --- | --- |
| `column_present = 'agency_id'` AND `null_rows` is small (~0 for the ship-time 20 rows, or stable post-ship %) | **Fix 1 is applied, backfill stuck.** Step 1 of AM completion is done. | Proceed to Step 2 of AM completion (API route hardening). Optionally file a cleanup PR to retire the 4 legacy user_id-join read paths (Step 4 above) and update the 2 stale comments (`action-handler.ts:955`, `platform-signals.ts:201-202`). |
| `column_present = 'agency_id'` BUT `null_rows` is unexpectedly large | **Column exists, backfill incomplete.** | Re-run only the backfill `UPDATE` block (it's idempotent and scoped to `agency_id IS NULL`). No new migration needed. |
| `column_present IS NULL` | **Migration never applied.** Every live call to brief-status / brief-performance / brief-acknowledge is erroring today (contradicts field evidence if the routes are known to be working). | Apply `supabase/migrations/20260421_add_agency_id_to_content_briefs.sql` as a one-shot run via Supabase SQL Editor or `supabase db execute`. The file is idempotent so it's safe. After application, run the verification query above again. |

### Caveat

The repo **cannot** answer "is it applied in production" by itself. Until a live query runs, any step in the AM completion plan that **adds new code** which assumes `agency_id` exists is identical in risk to what has already shipped in the three brief-lifecycle routes — i.e. it bets on the commit-message assertion. If this bet has been holding without user complaints since 2026-04-22, it's likely fine. If there's been silence because the affected routes are rarely exercised, risk is not yet quantified.

One SQL query resolves the ambiguity. Do that first.

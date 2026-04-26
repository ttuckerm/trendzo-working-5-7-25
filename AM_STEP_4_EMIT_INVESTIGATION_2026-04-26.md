# AM Step 4 — emit investigation (2026-04-26)

**TL;DR — root cause identified, no code touched.** Every `auto_nudge.*` emit is failing at the database with an `invalid input syntax for type uuid` error because `actorId: 'auto-nudge-unacknowledged'` is a string being inserted into a `uuid`-typed column. `emitEvent` swallows the error (`console.error` only, no throw, returns void), so the cron route's `dry_run_count` and `nudged_count` look correct in the response while zero rows actually land in `platform_events`. The same bug also breaks the future `auto_nudge.sent` and `auto_nudge.escalated*` events.

---

## What `emitEvent` does on success / failure

`src/lib/events/emit.ts:11-39`:

```ts
export async function emitEvent(params: { … }): Promise<void> {
  try {
    const { error } = await supabase.from('platform_events').insert({ … });
    if (error) {
      console.error(`[emitEvent] Failed to emit '${params.eventType}':`, error.message);
    }
  } catch (err: any) {
    console.error(`[emitEvent] Exception emitting '${params.eventType}':`, err.message);
  }
}
```

- Returns `Promise<void>` either way — caller cannot tell success from failure.
- On a Postgres error: `console.error` to the dev server log, then **silent return**. No throw.
- On a thrown exception: same — log and silent return.

`emitEventStrict` (line 45-69) is the same insert but **throws** on `{ error }`. It does not silently drop.

This is intentional per the file comment — strict is reserved for "load-bearing events (agent.proposal, agent.proposal_confirmed, agent.scheduled_run_config_drift)". The non-strict variant is the audit-log default.

That design choice is fine for ordinary audit. **It hid this bug.**

---

## What `platform_events` requires

Combined schema after both migrations (`20260319_platform_events.sql` + `20260418_platform_events_extend.sql`):

| column | type | nullable | notes |
|---|---|---|---|
| `id` | `uuid` | default `gen_random_uuid()` | PK |
| `event_type` | `text` | NOT NULL | required |
| `payload` | `jsonb` | nullable, default `'{}'` | |
| `actor_id` | **`uuid`** | nullable | **strict UUID format required** |
| `entity_type` | `text` | nullable | |
| `entity_id` | **`uuid`** | nullable | **strict UUID format required** |
| `created_at` | `timestamptz` | default `now()` | |
| `actor_type` | `text` | nullable | added 2026-04-18 |
| `agency_id` | **`uuid`** | nullable | added 2026-04-18 — strict UUID |
| `correlation_id` | **`uuid`** | nullable | added 2026-04-18 — strict UUID |

No NOT NULL constraints beyond `event_type`. No CHECK constraints. RLS is not relevant — we use the service-role client (`emit.ts:5` uses `SUPABASE_SERVICE_KEY`, which bypasses RLS).

**Three columns are typed `uuid`: `actor_id`, `entity_id`, `agency_id` (and `correlation_id`).** Postgres rejects any string that isn't UUID-formatted with `invalid input syntax for type uuid`.

---

## What the cron route is passing

`src/app/api/cron/auto-nudge-unacknowledged/route.ts` has 4 `emitEvent` call sites — lines 108, 134, 191, 248. Every single one passes:

```ts
actorId: 'auto-nudge-unacknowledged',
```

That string is **not** a valid UUID, so every insert fails with `invalid input syntax for type uuid: "auto-nudge-unacknowledged"`. `emitEvent` swallows that error.

Other fields:
- `entityId: briefId` — `briefId` comes from `content_briefs.id` (a real UUID) → valid.
- `agencyId: row.agency_id` — comes from `content_briefs.agency_id` (already filtered `IS NOT NULL`) → valid.
- `actorType: 'cron'` — `text` column → valid.
- `payload: { … }` — jsonb → valid.
- `eventType: 'auto_nudge.dry_run' | 'auto_nudge.sent' | 'auto_nudge.escalated' | 'auto_nudge.escalated_dry_run'` — `text NOT NULL` → valid.

**Only `actor_id` is wrong. That single field tanks every emit.**

---

## Why I missed it

The codebase already has a defensive helper for exactly this — `uuidOrNull` at `src/lib/agent/correlation-context.ts:48`:

```ts
export function uuidOrNull(s: string | undefined | null): string | undefined {
  return s && UUID_RE.test(s) ? s : undefined;
}
```

Comment says *"Used at platform_events emit boundaries where actor_id / agency_id columns are `uuid` and reject sentinel values like 'dev-user'…"*. Multiple callers wrap their `actorId` in it (`tool-registry.ts:84`, `clay/action/route.ts:101/122/150`).

I did not use it. I assumed `actor_id` was a `text` column based on seeing arbitrary strings flow through other `emitEvent` callers without context-checking that they were guaranteed-UUID `user.id` values.

For comparison, valid call patterns in the codebase:
- `clay/action-handler.ts:83`, `clay/action-handler.ts:811` — `actorId: context.userId` (UUID, set from auth session)
- `brief-status/route.ts:230`, `brief-performance/route.ts:256` — `actorId: user.id` (UUID, from `supabase.auth.getUser()`)
- `tool-registry.ts:84`, `clay/action/route.ts:101/122/150` — wrapped in `uuidOrNull(...)` defensively

My cron route is the first place that passes a sentinel string straight through.

---

## Why the response payload looked correct

The cron route increments `dryRunCount` / `nudgedCount` / `escalatedCount` immediately at the call site, **without checking whether the emit succeeded**. `emitEvent` returns `Promise<void>` so there's nothing to check anyway. Result: route logs "did 3 dry-runs", DB has 0 rows.

If we'd called `emitEventStrict`, the very first emit would have thrown, the per-brief `try/catch` would have caught it, the route would have returned `errors: [{brief_id, error: '...invalid input syntax for type uuid...'}]`, and the bug would have been visible immediately.

---

## Three possible fixes

**These are options, not recommendations. I am not implementing any until you choose.**

1. **Set `actorId: undefined` (or omit it) and put the route name in `payload`.** Cleanest if `actor_id` is meant to identify a *user* — for cron there is no user. The route name is metadata; it belongs in `payload.actor_name` or `payload.source` next to `actor_type='cron'`.

2. **Wrap with `uuidOrNull(...)`.** Safe, makes the field always-valid, but `'auto-nudge-unacknowledged'` always coerces to `undefined`, so the result is identical to option 1 — just routed through the existing helper. Pro: matches the convention of every other modern caller.

3. **Switch from `emitEvent` to `emitEventStrict` in the cron route.** Forces failures to surface in the route's `errors` array. This is orthogonal to the actor_id fix — strict still throws on the bad UUID until you also do option 1 or 2. But it is the right hardening for a cron route where silent audit-log loss is a problem (we just lived this).

**Recommended combination:** option 1 + option 3 together. Option 1 makes the inserts succeed; option 3 makes any future schema mismatch fail loudly instead of silently. Total surface: one helper-style edit to four call sites + one import swap.

---

## Out of scope for this investigation

I did not check whether `nudgeCreator` in `action-handler.ts` (operator path) has the same problem — it doesn't directly call `emitEvent` from auto-nudge.ts; the operator-side `emitEvent` at `action-handler.ts:74` passes `actorId: context.userId` (a real UUID). That path is fine.

I did not check the other dry-run-mode emit sites (`auto_nudge.escalated_dry_run`) for additional issues beyond `actor_id` — they share the same code shape so they share the same bug, no other.

I did not touch any code. Awaiting your call on which fix to apply.

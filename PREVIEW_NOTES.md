# PREVIEW NOTES — funnel cherry-pick (PREVIEW ONLY, NOT PUSHED, NOT DEPLOYED)

- **Preview branch:** `preview/funnel-cherry-pick-20260524-1952` (local only)
- **Base:** `funnel-deploy-techyai` @ `f8caff9`
- **Preview commit:** `6b64e74`
- **Built in worktree:** `C:\Projects\CleanCopy-preview` (the `vercel-deploy-test` working tree was never touched)
- **Generated:** 2026-05-24

## Backups (created before any write)
- Tag: `backup/pre-funnel-cherry-pick-20260524-1952` → `53724af` (vercel-deploy-test HEAD)
- `C:\Projects\CleanCopy\backup-uncommitted-20260524-1952.patch` (15 tracked-file diffs vs HEAD)
- `C:\Projects\CleanCopy\backup-git-status-20260524-1952.txt`
- `C:\Projects\CleanCopy\backup-untracked-20260524-1952.tar.gz` (StepOffGame/ + rail_gate migration + MAXDURATION audit)

---

## Method — file-scoped reconstruction (NOT a git cherry-pick)

The planned `git cherry-pick` of per-Prompt commits was **not possible**, for three reasons discovered during investigation:

1. **No per-Prompt commits exist.** `vercel-deploy-test` is only 2 commits beyond the merge-base: one monolithic `a7a4594` "snapshot: full project state 2026-05-23" (29 files, incl. 13 junk artifacts) and `53724af` (an unrelated maxDuration build fix). There is no Prompt-1/2/2.5/3/4/4.1 commit to map.
2. **The canonical work is uncommitted.** The final Group A/B state lives in the `vercel-deploy-test` **working tree** (uncommitted edits + untracked files), not in any commit. Cherry-picking the snapshot would have shipped a stale 05-23 version and dragged in junk.
3. So the approved approach was: copy each explicitly-listed Group A + Group B file's **current working-tree content** onto a worktree branched from `funnel-deploy-techyai`, apply the two deletions, add the untracked files, and exclude everything else.

## Conflict log

**No merge/cherry-pick conflicts occurred** — this was a file-scoped copy, not a 3-way merge, so there were no textual conflicts to resolve. The substantive decisions were *which files move*:

| Decision | Resolution | Rationale |
|---|---|---|
| Files carrying the funnel scaffolding (`DEPLOY_TARGET` gate, Meta Pixel) | **Kept funnel version — not touched.** Verified `src/app/layout.tsx` (where the gate + pixel live) is in zero Group A/B import chains. | Hard rule: funnel branch stays stripped. |
| `AgentGate.tsx` / `EmailCapturePanel.tsx` deletion vs funnel's `AssessmentHUD.tsx` importing `RailClickGate` from `./AgentGate` | Overwrote `AssessmentHUD.tsx` with the working-tree version (no longer imports it), then deleted both files. | Deleting alone would orphan funnel's import and break the build. |
| 7 dependency files not in the original named list (`AgentMessages.tsx`, `AssessmentHUD.tsx`, `types/email-capture.ts`, `types/freedom-agent.ts`, `StepOffGame/sprites.tsx`, `StepOffGame/StepOffGame.global.css`, `rail_gate` migration) | **Included** (operator-approved). | Mechanically required imports / type pairings; build fails without them. |
| 13 snapshot junk artifacts (`.env.funnel`, 4 diagnostic `.md`, 10 `hero_*_verify.png`, 2 mockup `.html`) | **Excluded.** | Not features; never belong on the deploy branch. |
| 2 unrelated working-tree edits (`api/assessment/test/route.ts`, `api/training/scrape-profiles/route.ts`) | **Excluded.** | Not part of Group A or B. |

---

## Final manifest (29 files — see `git diff funnel-deploy-techyai...HEAD --stat`)
- **Modified (16):** FreedomOSTool, email-capture/route, AgentMessages, AgentRail, AssessmentHUD, Day1Spotlight, DeliverablesHeader, LeadsPanel, RoadmapList, SprintGrid, HamsterLoader, validate-payload, escape-assessment-prompt, freedom-agent-prompt, types/email-capture, types/freedom-agent
- **Deleted (2):** AgentGate.tsx, EmailCapturePanel.tsx
- **Created (11):** AgentHeroBanner.tsx, SprintDayPanel.tsx, lib/assessment/types.ts, StepOffGame/{StepOffGame.tsx, gameEngine.ts, obstacles.ts, PlayButton.tsx, sprites.tsx, StepOffGame.module.css, StepOffGame.global.css}, supabase migration `20260524000000_add_rail_gate_capture_source.sql`

Diff total: **+4519 / −1183 across 29 files.**

## Verification results
- **tsc (`tsc --noEmit`, full 4657-file worktree):** pristine funnel baseline = **1550** errors; with manifest = **1549** errors → **net −1, zero new errors from this work.** None of the 1549 are in any touched file (all pre-existing platform debt: missing `@types/express`/`node-cache`, Stripe namespace, filename casing, admin components, jest setup, etc.).
- **Build with `ignoreBuildErrors: false` (temporary, in-memory, restored after):** `✓ Compiled successfully`, then failed at the type-check phase on `src/api/recipeBook.ts:1` (`express` missing types) — a pre-existing baseline error, not ours.
- **Build with real deploy config (`ignoreBuildErrors: true`):** **PASS** — `✓ Compiled successfully` → page data collected → `✓ Generating static pages (10/10)` → finalized. Funnel routes built: `/`, `/free/freedom-os` (13.2 kB), `/free/freedom-os/plan/[planId]`, `/assessment/[assessmentId]` (21.2 kB), `/welcome`, and the assessment/freedom-agent/checkout API routes. Deployable.
- `next.config.mjs` restored to original (hash `f833480c`, `git diff --quiet` clean) and **not committed**.

---

## What the live site would look like post-deploy

**1. Inline Freedom Agent rail (`/assessment/[assessmentId]`).** The old gate flow (`AgentGate.tsx` + `EmailCapturePanel.tsx`) is gone. The Freedom Agent rail (`#freedom-agent-rail`) now handles its locked state inline: an unauthenticated visitor sees a hardcoded welcome message, three LLM-generated suggestion chips (topic-detected by chip label, since chips vary per assessment), and an email field that replaces the chat input while locked. Clicking a chip shows a one-shot teaser ("Drop your email below to read the full walkthrough →") and dims that chip; previewed chips persist after unlock. On mount the rail fetches `email-status` once and treats unknown as locked until proven otherwise. Capturing an email through the rail posts `source: 'rail_gate'` (newly accepted by `/api/assessment/email-capture`; DB side added by the `rail_gate` migration).

**2. Updated assessment HUD layout.** `AssessmentHUD.tsx` now lays out a 12-column grid where the **Sprint section is full-width** and **Roadmap + Leads sit side-by-side** (`span 6` each). `RoadmapList` is rebuilt as a **vertical timeline**. A new **`SprintDayPanel`** opens a shared per-day detail panel (driven by `SprintGrid` and `Day1Spotlight` via an `OPEN_DAY_PANEL_EVENT`). `LeadsPanel` shows a 3-state outreach progression (Cold → Warming → Active) with comparison cards, reacting to the sprint-toggle event. A new centered **`AgentHeroBanner`** pill (rounded, max-width ~720px, orb bleeding past the left edge) sits in the HUD; `DeliverablesHeader` drops the now-redundant "your Freedom Agent knows everything here" line.

**3. StepOff game on the loading page (`/free/freedom-os`).** While the assessment generates, `HamsterLoader` now renders the **StepOffGame** (a small DOM/SVG runner with obstacles, a play button, and its own sprites/styles) via a render-prop, and routes to `/assessment/${shareUrlId}` once `AssessmentReadyData` arrives. `FreedomOSTool` holds the `assessmentData` state and passes it down. Net effect: the wait turns into a playable mini-game that auto-advances when the plan is ready.

**4. Freedom Agent soft-sell behavior.** `freedom-agent-prompt.ts` is rewritten with **zero "Trendzo" mentions**. The agent stays an advisor on the user's own assessment, but now names operational limits honestly (concrete thresholds — ~30 leads break spreadsheets, ~50 DMs/week, ~4 long-form/month, ~5th client) and soft-sells via exactly two interchangeable names — **"AI Agency In A Box"** / **"Done-For-You AI Business"** — across four defined moments (operational pain at scale, "what are you" questions, readiness/buying signals, durable engagement). Each mention is one to two sentences embedded in otherwise-useful advice, capped at one per conversation, never a pivot to sales. The old "our new platform / message-6 threshold" logic is removed.

**5. Stricter Day-1 / fabrication rules in the generator.** `escape-assessment-prompt.ts` (engine renamed **"Escape Assessment Generator"**) makes the **Tomorrow-Morning Method** an explicit promise and **bans setup/research/planning tasks on Days 1–10** ("set up your domain", "build a portfolio", "create your logo", "research your niche", "outline your offer", "plan your email sequence", etc.) regardless of category label. Day 1 must open with an active **outreach** verb. `validate-payload.ts` enforces this with new guards — `DAY1_OPENER_VERB_REGEX` (must start send/post/dm/email/comment/call/reach out/reply/message), `INFRASTRUCTURE_TASK_REGEX` (incl. the Prompt-4.1 broadened payment branch catching both verb-before and noun-after orderings), `PLAN_OUTLINE_INFRASTRUCTURE_REGEX`, and `FABRICATED_GROUP_COUNT_REGEX` (rejects invented community counts like "join 12,000 operators"). The "Not sure" niche path is inverted to its niche-selection handling. Net effect: generated plans push real customer-facing action on Day 1 and can't fabricate group sizes or dress up infrastructure busywork as outreach.

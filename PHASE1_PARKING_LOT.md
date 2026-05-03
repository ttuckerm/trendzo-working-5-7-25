# Phase 1 — Parking Lot

Issues surfaced during Phase 1 investigation that are real, but explicitly out of scope for getting the Vercel build green. To be addressed in later phases. Each item has the evidence reference to the investigation report where it was first surfaced.

## TypeScript health (~2418 errors)

- 248 of 342 TS2304 "Cannot find name" errors are leftover Firebase/Firestore identifiers (`db`, `doc`, `collection`, `query`, `getDocs`, `Firestore`, etc.) from an incomplete Firebase→Supabase migration. See `PHASE1_BUILD_INVESTIGATION_2026-05-02.md` Section A1.
- 66 TS2694 "Namespace 'global.React' has no exported member" errors caused by `@types/react ^18.3.24` mismatched against runtime `react 18.2.0`. Fix: pin `@types/react` to `18.2.x`. `PHASE1_BUILD_INVESTIGATION_2026-05-02.md` Section E2.
- `tsconfig.json` `types: ["react", "react-dom", "node"]` — `"react-dom"` is non-standard. `PHASE1_BUILD_INVESTIGATION_2026-05-02.md` Section A2.
- These are non-blocking for the Vercel build (`next.config.mjs` has `typescript.ignoreBuildErrors: true`) but represent real bugs that should be triaged in a future phase.

## Filename casing collisions

- `src/components/ui/Slider.tsx` + `src/components/ui/slider.tsx` (case-only twins)
- `src/components/ui/TextArea.tsx` + `src/components/ui/textarea.tsx` (case-only twins)
- Imported with both casings across ~30 files. Linux build (Vercel) is case-sensitive. `PHASE1_BUILD_INVESTIGATION_2026-05-02.md` Section F1.

## Vercel project consolidation

- Two Vercel projects (`trendzo-test`, `trendzo-working-5-7-25`) both connected to the same GitHub repo, both auto-deploying on every push.
- Recommended canonical: `trendzo-working-5-7-25` (matches repo name).
- Recommended action for `trendzo-test`: disconnect from GitHub, do not delete.
- Will be addressed in Fix Prompt #2 (Phase 1 sub-task) AFTER the current build is green on `trendzo-test`.
- See `PHASE1_FINAL_DECISIONS_2026-05-02.md` Block 1.

## Branch canonicalization

- `main` is at the initial commit; `vercel-deploy-test` has all 28 commits of real work.
- Six GitHub Actions workflows reference `main` as the diff base. None reference `vercel-deploy-test`.
- `claude-pr-review.yml` may be silently broken (uses `origin/main` as diff base in five places).
- Deferred to Phase 2 per `PHASE1_DECISIONS_INVESTIGATION_2026-05-02.md` Q3 recommendation γ.

## Three coexisting auth systems

- Clerk (`@clerk/nextjs ^5.1.3`), Supabase auth (`@supabase/auth-helpers-nextjs` + `@supabase/ssr`), and NextAuth (`next-auth ^4.24.11`) all installed. Should be consolidated to one. Phase 3+ work.
- See `PHASE1_BUILD_INVESTIGATION_2026-05-02.md` Section E2.

## Other unanchored .gitignore rules with latent collision risk

- `agent-starter-python/`, `frameworks-and-research/`, `.claude/`, `.gstack/`, `model-backups/`, `.git-backup/` — all unanchored, all currently match exactly one directory at root. A future contributor creating, e.g., `src/lib/.claude/`, would silently lose it. Not actionable now; flagged for future cleanup.
- See `PHASE1_VERCEL_AND_GITIGNORE_INVESTIGATION_2026-05-02.md` B8.

## Five referenced-but-missing SKILL.md files

- `AI_EMPLOYEE_ARCHITECTURE` references five `SKILL.md` files that don't exist. Substrate audit issue separate from build pipeline.

## Dashboard components fabricating data with Math.random()

- Substrate audit issue. Real data wiring needed. Phase 3+ work.

## Five missing tables identified in substrate audit

- `trend_creator_matches`, `creator_alerts`, `creator_feedback`, `performance_reports`, `chase_log`. Substrate work. Phase 3+.

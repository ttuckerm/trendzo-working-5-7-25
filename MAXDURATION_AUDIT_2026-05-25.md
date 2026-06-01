# maxDuration Audit — 2026-05-25

**Scope:** Every `maxDuration` route-segment / config declaration in `C:\Projects\CleanCopy`.
**Mode:** Read-only. No source files were modified.
**Plan limit (Vercel Pro):** Serverless Function `maxDuration` must be **between 1 and 800** seconds.

---

## ❌ INVALID — exceeds the 1–800 range (build blocker)

| # | File | Line | Code | Value | Status |
|---|------|------|------|-------|--------|
| 1 | `src/app/api/admin/training/retrain/route.ts` | 14 | `export const maxDuration = 3600;` | 3600 | **INVALID** (> 800) |

This is the function named in the failing build (`api/admin/training/retrain`). `3600` is far above the Pro ceiling of `800`.

---

## ✅ VALID — within the 1–800 range

| # | File | Line | Code | Value |
|---|------|------|------|-------|
| 2 | `src/app/api/agency/batch-briefs/route.ts` | 22 | `export const maxDuration = 120` | 120 |
| 3 | `src/app/api/admin/backfill/run/route.ts` | 20 | `export const maxDuration = 300; // Feature backfill can be long-running.` | 300 |
| 4 | `src/app/api/admin/scrape-search/route.ts` | 18 | `export const maxDuration = 120;` | 120 |
| 5 | `src/app/api/cron/training-pipeline/route.ts` | 13 | `export const maxDuration = 300; // 5 minutes max for Vercel Pro` | 300 |
| 6 | `src/app/api/admin/platform-monitor/route.ts` | 17 | `export const maxDuration = 120` | 120 |
| 7 | `src/app/api/cron/process-scheduled-actions/route.ts` | 20 | `export const maxDuration = 120;` | 120 |
| 8 | `src/app/api/cron/overnight-triage/route.ts` | 23 | `export const maxDuration = 300` | 300 |
| 9 | `src/app/api/cron/cultural-scan/route.ts` | 18 | `export const maxDuration = 300` | 300 |
| 10 | `src/app/api/cron/consolidate-memory/route.ts` | 24 | `export const maxDuration = 300` | 300 |
| 11 | `src/app/api/cron/classify-events/route.ts` | 20 | `export const maxDuration = 120` | 120 |
| 12 | `src/app/api/cron/autodream/route.ts` | 29 | `export const maxDuration = 300` | 300 |
| 13 | `src/app/api/cron/auto-nudge-unacknowledged/route.ts` | 40 | `export const maxDuration = 300;` | 300 |
| 14 | `src/app/api/admin/training/prepare/route.ts` | 26 | `export const maxDuration = 300;` | 300 |
| 15 | `src/app/api/admin/trainer/route.ts` | 32 | `export const maxDuration = 120` | 120 |
| 16 | `src/app/api/assessment/test/route.ts` | 8 | `export const maxDuration = 300` | 300 |
| 17 | `src/app/api/freedom-agent/chat/route.ts` | 16 | `export const maxDuration = 60` | 60 |
| 18 | `src/app/api/predict/route.ts` | 18 | `export const maxDuration = 60; // 60 seconds max` | 60 |
| 19 | `src/app/api/quick-win/analyze/route.ts` | 23 | `export const maxDuration = 60;` | 60 |
| 20 | `src/app/api/training/scrape-profiles/route.ts` | 26 | `export const maxDuration = 300;` | 300 |
| 21 | `src/app/api/training/scrape-hashtags/route.ts` | 34 | `export const maxDuration = 300;` | 300 |
| 22 | `src/app/api/training/niche-creators/route.ts` | 19 | `export const maxDuration = 300;` | 300 |
| 23 | `src/app/api/training/extract-features/route.ts` | 17 | `export const maxDuration = 300; // 5 min max for serverless` | 300 |
| 24 | `src/app/api/training/export/route.ts` | 15 | `export const maxDuration = 60; // allow up to 60s for large exports` | 60 |

---

## vercel.json

`C:\Projects\CleanCopy\vercel.json` contains **no** `functions` block and **no** `maxDuration:` declarations — only a `crons` array. Nothing to flag here.

---

## Summary

- **Total `export const maxDuration` route declarations found:** 24
- **Invalid (outside 1–800):** 1 → `src/app/api/admin/training/retrain/route.ts:14` (`3600`)
- **Valid (1–800):** 23 (all are 60, 120, or 300)
- **vercel.json function config:** none

**Single fix needed to unblock the build:** lower `maxDuration` in `src/app/api/admin/training/retrain/route.ts:14` from `3600` to a value ≤ `800` (Pro max is `800`).

> Note: Other `maxDuration` occurrences in the codebase (e.g. `src/lib/services/videoComposer.ts`, `src/lib/donna/...`, `src/components/workflow-1/PublishPhase.tsx`, `src/lib/workflow-specs/shared-components.ts`) are **local variables / object properties / platform metadata**, not Next.js route-segment config, and have no effect on Vercel function limits. They are intentionally excluded above.

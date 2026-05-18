# Funnel Build — Blocked Asset Deletions (RESOLVED via Option 1)

**Date opened:** 2026-05-15
**Date resolved:** 2026-05-16
**Branch:** funnel-deploy-techyai
**Step originally blocked:** 6b — "Remove additional Trendzo-branded public assets"
**Resolution commit:** `2671107 chore(funnel): remove remaining Trendzo-branded public assets`

Step 6b instructed: *"Before deleting, grep src/ for each asset path. If any file under src/ references it, do NOT delete — log to FUNNEL_BUILD_BLOCKED_2026-05-15.md and stop."*

All three candidate assets had live references under `src/`. The follow-up session shipped **Option 1** from the "Resolution paths" section below — confirmed each referencing src/ file is unreachable under `DEPLOY_TARGET=funnel` (no route in `FUNNEL_ALLOWLIST` reaches it), then deleted the assets. Remaining src/ references become dead refs of the same class as the pre-existing `trendzo-logo.svg` refs that the previous audit already accepted.

### Option 1 verification (2026-05-16)

`FUNNEL_ALLOWLIST` (from `src/middleware.ts`): `/`, `/welcome`, `/free/freedom-os`, `/assessment/`, `/api/landing/`, `/api/checkout/`, `/api/assessment/`, `/api/freedom-agent/chat`, `/api/freedom-agent/conversation`.

| Asset | Referencing src/ file | Reachability under funnel gate | Verdict |
|---|---|---|---|
| `public/images/content/trendzo-dashboard-view.png` | `src/lib/assets/asset-manager.ts` | Zero importers of `asset-manager.ts` anywhere in `src/` — dead module in **any** build target | Unreachable ✓ |
| `public/sdk/trendzo.js` | `src/app/api/ga/handoff/route.ts` (runtime `fs.readFileSync`) | `/api/ga/handoff` is not in `FUNNEL_ALLOWLIST` — middleware returns 404 | Unreachable ✓ |
| `public/sounds/trendzo-default/` | `CanvasOverlay.tsx`, `SoundManager.ts` + every other `useSound` consumer | Every chain terminates at `CanvasOverlay`, which is mounted only by `src/app/os-canvas/page.tsx`; `/os-canvas` is not in `FUNNEL_ALLOWLIST` | Unreachable ✓ |

Post-deletion grep of `public/` for `*trendzo*` (case-insensitive, recursive): zero remaining.

---

## Asset 1: `public/images/content/trendzo-dashboard-view.png` — BLOCKED

| File | Line | Reference |
|------|------|-----------|
| `src/lib/assets/asset-manager.ts` | 120 | `path: '/images/content/trendzo-dashboard-view.png',` |

**Funnel exposure:** `asset-manager.ts` would need to be traced to determine whether any route in `FUNNEL_ALLOWLIST` reaches this asset entry. Out of scope for this step.

---

## Asset 2: `public/sdk/trendzo.js` — BLOCKED

| File | Line | Reference |
|------|------|-----------|
| `src/app/api/ga/handoff/route.ts` | 64 | `const sdkJs = path.join(process.cwd(), 'public', 'sdk', 'trendzo.js'); if (fs.existsSync(sdkJs)) readFileIf(sdkJs, 'sdk/trendzo.js')` |

**Funnel exposure:** `/api/ga/handoff` is read at runtime by the route handler. If this route is in `FUNNEL_ALLOWLIST` and the file is deleted, the `fs.existsSync` guard will simply return false (no crash), but the asset removal would still need to be paired with a verification that no funnel feature depends on `sdk/trendzo.js` being available. Confirm allowlist membership before any deletion.

---

## Asset 3: `public/sounds/trendzo-default/` (directory) — BLOCKED

| File | Line | Reference | Real reference? |
|------|------|-----------|-----------------|
| `src/components/canvas/CanvasOverlay.tsx` | 40 | `loadPack((localStorage.getItem('trendzo.sound.pack') || 'trendzo-default'))` | Yes — pack-id default |
| `src/components/canvas/CanvasOverlay.tsx` | 85 | `defaultValue={(localStorage.getItem('trendzo.sound.pack') || 'trendzo-default')}` | Yes — pack-id default |
| `src/components/canvas/CanvasOverlay.tsx` | 86 | `<option value="trendzo-default">Trendzo default</option>` | Yes — UI option |
| `src/components/canvas/CanvasOverlay.tsx` | 257 | `loadPack((localStorage.getItem('trendzo.sound.pack') || 'trendzo-default'))` | Yes — pack-id default |
| `src/lib/moat/keys.ts` | 66 | `'trendzo-default-salt'` | **No** — substring match; this is a salt string constant, not a directory reference |
| `src/os/sound/SoundManager.ts` | 60 | `this.packId = savedPack || 'trendzo-default';` | Yes — pack-id default |
| `src/os/sound/SoundManager.ts` | 166 | `const pack = this.packId || 'trendzo-default';` | Yes — pack-id default |

**Funnel exposure:** `CanvasOverlay.tsx` and `SoundManager.ts` are part of the Canvas / OS layer. If no route under `FUNNEL_ALLOWLIST` mounts these components, the directory is dead under the funnel gate and could be deleted safely. This is not verified yet. The `keys.ts:66` hit is a false positive (substring match on an unrelated salt string).

---

## Resolution paths (for follow-up sessions)

For each asset, the decision is the same shape:

1. **Confirm the referencing src/ file is unreachable under `DEPLOY_TARGET=funnel`** — verify the file is only imported by routes outside `FUNNEL_ALLOWLIST`. If so, deletion is safe under the funnel gate; the dead reference is the same class as the pre-existing `trendzo-logo.svg` refs already flagged in the previous audit.
2. **Or, rewrite the src/ reference** to a neutral path / value before deleting the asset.
3. **Or, leave the asset in place** and accept that the funnel build ships a few orphan files; this is the lowest-risk option and matches what the previous audit chose for `trendzo-logo.svg`-class refs.

No edits beyond this log were made.

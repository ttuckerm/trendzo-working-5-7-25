# Cleanup Report — CleanCopy (Trendzo)

**Generated:** 2026-03-29
**Total project size (excluding .git):** ~14 GB
**Total project size (including .git):** ~21 GB

---

## 1. Top-Level Directory Sizes (sorted)

| Directory | Size |
|---|---|
| `data/` | **12 GB** |
| `.git/` | **6.9 GB** |
| `node_modules/` | 1.5 GB |
| `.next/` | 263 MB |
| `tiktok_transcriber/` | 60 MB |
| `public/` | 40 MB |
| `docs/` | 38 MB |
| `src/` | 28 MB |
| `snapshots/` | 15 MB |
| `models/` | 7.6 MB |
| `scripts/` | 3.7 MB |
| `autoresearch/` | 3.3 MB |
| `dist/` | 1.8 MB |
| `agent-starter-python/` | 1.7 MB |
| `frameworks-and-research/` | 1.3 MB |
| `.cursor/` | 1.3 MB |
| `.claude/` | 1.2 MB |
| `supabase/` | 1.1 MB |
| `.planning/` | 976 KB |
| `fixtures/` | 962 KB |
| `.bmad-core/` | 778 KB |
| `Research & Framework Data For Algorithm/` | 568 KB |
| `tasks/` | 360 KB |
| `video frameworks and research/` | 276 KB |
| `docker/` | 140 KB |

---

## 2. Files Over 100MB (GitHub HARD LIMIT)

| File | Size |
|---|---|
| `data/tiktok_downloads/tiktok_7411899378647960838_1764354146174.mp4` | **101 MB** |

## 3. Files Over 50MB (GitHub WARNING threshold)

| File | Size |
|---|---|
| `data/tiktok_downloads/tiktok_7411899378647960838_1764354146174.mp4` | 101 MB |
| `data/tiktok_downloads/tiktok_7413014938437831941_1764354162973.mp4` | 62 MB |

## 4. Files Over 1MB (top 30, excluding node_modules)

| File | Size |
|---|---|
| `data/tiktok_downloads/tiktok_7411899378647960838...` | 101 MB |
| `data/tiktok_downloads/tiktok_7413014938437831941...` | 62 MB |
| `data/tiktok_downloads/` (many .mp4 files 5-39 MB each) | ~11 GB total |
| `data/raw_videos/` (kai_*.mp4 files ~5-30 MB each) | 542 MB total |
| `models/xgboost-v10-model.json` | 2.3 MB |
| `models/xgboost-v9-model.json` | 2.2 MB |
| `models/xgboost-v8-model.json` | 2.1 MB |

---

## 5. node_modules

| Path | Size |
|---|---|
| `./node_modules/` (root) | **1.5 GB** |

Notable large packages inside node_modules:
- `@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` — 130 MB (x2 copies = 260 MB)
- `ffmpeg-static/ffmpeg.exe` — 78 MB
- `ffprobe-static/bin/` — ~265 MB (all platforms combined)

---

## 6. Build/Cache Directories

| Path | Size |
|---|---|
| `.next/` | **263 MB** |
| `dist/` | 1.8 MB |
| No `.cache`, `.turbo`, `__pycache__` found | — |

---

## 7. data/ Directory Breakdown

**Total: 12 GB** — This is the biggest problem.

| Subdirectory | Size | Notes |
|---|---|---|
| `data/tiktok_downloads/` | **11 GB** | ~2,000 .mp4 video files |
| `data/raw_videos/` | **542 MB** | User-uploaded .mp4 files |
| `data/frames/` | 984 KB | Extracted video frames (JPGs) |
| `data/temp/` | 784 KB | Temporary processing files |
| `data/test-frames/` | 484 KB | Test frame images |
| `data/audio/` | 32 KB | Audio extractions |
| `data/seed/` | 8 KB | Seed data (recipe-book.json) |

**Git tracking status:** 2,072 files in `data/` are tracked by git, including **2,020 .mp4 video files** totaling **11.0 GB**.

---

## 8. models/ Directory

**Total: 7.6 MB** — 31 files tracked by git.

| File | Size |
|---|---|
| `xgboost-v10-model.json` | 2.3 MB |
| `xgboost-v9-model.json` | 2.2 MB |
| `xgboost-v8-model.json` | 2.1 MB |
| `xgboost-dps-model.json` | 376 KB |
| `visualizations/feature_importance.png` | 192 KB |
| `visualizations/predictions_vs_actual.png` | 168 KB |
| `visualizations/residuals.png` | 120 KB |
| `xgboost-v7-model.json` | 172 KB |
| `xgboost-v6-model.json` | 32 KB |
| Various metadata/scaler/feature JSON files | 4-8 KB each |
| `.pkl` files (v6, v7 scalers, feature-scaler) | 4 KB each |

---

## 9. frameworks-and-research/

**Total: 1.3 MB** — Contains its own `.git/` directory (nested git repo).
Mostly markdown research documents (4-160 KB each). No large files.

---

## 10. Environment Files

| File | Size |
|---|---|
| `.env.local` | 4 KB |
| `.env.local.example` | 1 KB |

`.gitignore` has `.env*` and `.env*.local` patterns — these should be excluded from git. Verify `.env.local` is NOT tracked:
- `.gitignore` has both `.env*.local` (line 22) and `.env*` (line 40) — should be safe.

---

## 11. Large Media/Data Files (>500KB, outside node_modules)

Over 2,000 `.mp4` files in `data/` (11+ GB total). See Section 7 for full breakdown.

Additional large files:
| File | Size |
|---|---|
| `data/custom_frameworks.json` | 28 KB |
| Various `.json` files in `data/` | < 30 KB |

No `.mov`, `.zip`, `.tar.gz`, `.sqlite`, `.db` files over 500KB found outside node_modules.

---

## 12. .git Directory

**Size: 6.9 GB**

This is extremely bloated. Normal for a Next.js project: ~50-200 MB. The .git directory is massive because **video files (.mp4) have been committed to git history**. Even if you delete the videos now, they remain in git history forever unless you rewrite history (e.g., `git filter-repo`).

---

## 13. File Counts

| Metric | Count |
|---|---|
| Total files (excl. .git, node_modules) | **11,373** |
| Files tracked by git | **6,886** |
| Files in `data/` tracked by git | 2,072 |
| `.mp4` files tracked by git | 2,020 |
| Uncommitted changes (modified + untracked) | 68 |

---

## 14. Git Status (uncommitted changes)

**33 modified files** (staged area):
- Various source files in `src/`, `scripts/`, `tailwind.config.ts`
- 1 deleted file: `src/lib/services/viral-prediction/dynamic-percentile-system.ts`

**35 untracked files**:
- 5 new raw videos in `data/raw_videos/`
- 19 new TikTok downloads in `data/tiktok_downloads/`
- 8 new test scripts in `scripts/`
- 1 new component, 1 new lib file, 1 new migration

---

## 15. .gitignore Coverage

Currently gitignored:
- `/node_modules`, `/.next/`, `/build`, `/out`, `/coverage`
- `.env*` (except `.example`)
- `*.log`, `*.pem`, `.DS_Store`, `*.tsbuildinfo`
- Some zip files, `*.tar.xz`

**NOT gitignored (but should be):**
- `data/` (or at minimum `data/tiktok_downloads/`, `data/raw_videos/`)
- `models/` (arguable — 7.6 MB is manageable, but `.pkl` binaries don't diff well)
- `dist/`
- `snapshots/`

---

# GITHUB BLOCKERS

### Files Over 100MB (GitHub HARD LIMIT — push will be REJECTED)
| File | Size |
|---|---|
| `data/tiktok_downloads/tiktok_7411899378647960838_1764354146174.mp4` | **101 MB** |

**This single file will block any push to GitHub.**

### Files Over 50MB (GitHub WARNING threshold)
| File | Size |
|---|---|
| `data/tiktok_downloads/tiktok_7411899378647960838_1764354146174.mp4` | 101 MB |
| `data/tiktok_downloads/tiktok_7413014938437831941_1764354162973.mp4` | 62 MB |

### data/ Directory — CRITICAL
- **Total size: 12 GB** (11 GB videos + 542 MB raw videos)
- **2,020 .mp4 files are tracked by git**
- **NOT in .gitignore**
- This is the #1 blocker. Videos should never be in a git repo.

### models/ Directory
- **Total size: 7.6 MB** — manageable for GitHub
- 31 files tracked, all JSON/PKL
- Largest file: 2.3 MB (xgboost-v10-model.json)
- **Not a blocker**, but `.pkl` binaries won't diff meaningfully

### .env Files Found
| File | Status |
|---|---|
| `.env.local` | Appears gitignored (`.env*` pattern) — verify not tracked |

### .git History Bloat
- **6.9 GB** — videos committed to history
- Even after adding `data/` to `.gitignore` and deleting the files, the `.git` directory will remain bloated
- Will need `git filter-repo` or BFG Repo Cleaner to remove videos from history

### Estimated Repo Size If Pushed As-Is

| Component | Size |
|---|---|
| Source code + config + docs | ~130 MB |
| data/ (videos) | ~12 GB |
| models/ | ~7.6 MB |
| frameworks-and-research/ | ~1.3 MB |
| Other (snapshots, scripts, etc.) | ~80 MB |
| **.git/ history** | **6.9 GB** |
| **TOTAL (what GitHub would store)** | **~19 GB** |

GitHub's recommended max repo size is **1 GB**. Soft limit is **5 GB**. This repo at **~19 GB** is nearly 4x the soft limit.

### Recommended Actions (in order)

1. **Add to .gitignore immediately:**
   ```
   /data/tiktok_downloads/
   /data/raw_videos/
   /data/temp/
   /data/frames/
   /data/test-frames/
   /data/audio/
   /dist/
   /snapshots/
   ```

2. **Remove tracked videos from git index** (without deleting files):
   ```
   git rm -r --cached data/tiktok_downloads/
   git rm -r --cached data/raw_videos/
   ```

3. **Rewrite git history** to remove video blobs:
   ```
   git filter-repo --path data/tiktok_downloads/ --invert-paths
   git filter-repo --path data/raw_videos/ --invert-paths
   ```
   This will shrink .git from 6.9 GB to likely < 500 MB.

4. **Consider Git LFS** if videos must be version-controlled.

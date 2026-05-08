# Verification Report — `tiktok_transcriber/` and `.agents/`

**Date:** 2026-05-04
**Branch:** `vercel-deploy-test`
**HEAD:** `da993d9b1e8ea014e1425c835d17f5885a0d0a33`
**Mode:** Read-only. No edits, no commits, no installs. Only this report file was created.

---

## 1. Pre-flight check results

| Check | Expected | Result |
|---|---|---|
| `git status` captured | yes | 51 lines of WIP (the in-progress assessment share-token work) — unchanged by this task |
| `git rev-parse HEAD` | `da993d9b1e8ea014e1425c835d17f5885a0d0a33` | ✅ matches |
| `git rev-parse --abbrev-ref HEAD` | `vercel-deploy-test` | ✅ matches |
| `VERIFICATION_REPORT_2026-05-04.md` does not exist at repo root | absent | ✅ confirmed absent, then created by this task |

All pre-flight checks pass.

---

## 2. `tiktok_transcriber/` verification

### 2.1 Last modification analysis

**Top-level contents** of `tiktok_transcriber/`:

| Type | Name | Last write |
|---|---|---|
| dir | `.venv/` | 2025-10-10 (vendored Python deps — excluded from analysis) |
| file | `db.py` | 2026-01-28 21:21:49 |
| file | `fetch.py` | 2026-01-28 21:21:49 |
| file | `requirements.txt` | 2026-01-28 21:21:49 |
| file | `run.py` | 2026-01-28 21:21:49 |
| file | `transcribe.py` | 2026-01-28 21:21:49 |
| file | `util.py` | 2026-01-28 21:21:49 |

**Recency counts (excluding `node_modules`, `.venv`, `venv`, `__pycache__`, `.git`):**

- Total application files: **6**
- Touched in last 30 days: **0**
- Touched in last 90 days: **0**
- Touched in last 180 days: **6**
- Most recent modification: **2026-01-28 21:21:49** (~96 days ago, all 6 files have the same timestamp — looks like a single bulk edit)
- Oldest modification: **2026-01-28 21:21:49**

In plain English: every application file in this folder was last touched on the same day, just over 3 months ago. Nothing has been edited since.

### 2.2 Inbound reference search results

I grepped the entire repo for the string `tiktok_transcriber`. Every hit:

| File | Line | Type of reference |
|---|---|---|
| `.vercelignore` | 20 | `/tiktok_transcriber/` — **explicitly excluded from Vercel deploy** (the deployed app does not see this folder) |
| `CLEANUP_REPORT.md` | 17 | Listed as `~60 MB` cleanup candidate (audit doc, not live code) |
| `CODEBASE_INVENTORY_2026-05-04.md` | 47, 55, 458, 1336 | Listed as "EXPERIMENTAL", noted as "almost entirely vendored Python deps", "strong delete-candidate" (audit doc, not live code) |

**No matches** in: `src/` (the live Next.js app), `scripts/`, `package.json`, `vercel.json`, `tsconfig.json`, `Dockerfile`, `docker-compose*.yml`, `.env*`, or any `.ts/.tsx/.js/.jsx/.py` source file.

I also explicitly checked `vercel.json` and `package.json` for any cron entry, build hook, or postinstall step that might shell out to this folder. **Zero matches.**

In plain English: nothing in the live application code references this folder. Vercel is configured to ignore it during deploy. The only mentions are in your own audit/cleanup notes that already flagged it as a delete candidate.

### 2.3 Standalone runnability findings

This folder is a **self-contained standalone Python project**, not part of the Next.js app:

- `requirements.txt` (5 deps: `yt-dlp`, `openai`, `supabase`, `python-dotenv`, `tenacity`)
- Its own `.venv/` directory
- `run.py` is a CLI entry point with `argparse` — designed to be invoked directly:
  - `tiktok_transcriber/run.py:13-19` — `parser.add_argument("--handles" ...)`, `--days`, `--limit`, `--min_chars`, `--max_workers`
- No `README.md` or `__main__` package wrapper
- Reads its own `.env` / `.env.local` (`run.py:10-11`) for `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`
- Writes to a Supabase table called `scraped_videos` (`db.py:14`)

In plain English: this was a one-off Python script someone (you or a contractor) ran from the command line, like `python tiktok_transcriber/run.py --handles foo bar --days 30`. The deployed Trendzo app does its own transcription via `src/lib/services/whisper-service.ts` (per `CODEBASE_INVENTORY_2026-05-04.md:1336`) and never calls into this folder.

### 2.4 Verdict — `tiktok_transcriber/`

**Verdict: SAFE TO DELETE** *(with one small reversibility caveat below)*

**Reasoning (citations):**
- Zero inbound references from any live code (`src/`, `scripts/`, `package.json`, `vercel.json`).
- Explicitly excluded from Vercel deploy at `.vercelignore:20`, so removing it cannot affect production.
- No cron, no build hook, no postinstall reference anywhere.
- Application files untouched for ~96 days; no recent activity suggesting active use.
- It is a standalone CLI Python script (`run.py:13-19`) that writes to Supabase table `scraped_videos`.

**Reversibility caveat (worth knowing before deleting):**
The `scraped_videos` table in Supabase may still contain rows that this script wrote. Deleting the folder does **not** affect that data — it only removes the script that *populated* it. If you ever want to re-run this scraper later, you'd have to recover the script from git history (`git log -- tiktok_transcriber/`). That's annoying but not catastrophic.

If you want stronger insurance: copy the 6 `.py` files (~few KB total) to a notes folder before deleting.

---

## 3. `.agents/` verification

### 3.1 Full file inventory

`.agents/` contains **32 files** across **22 subdirectories**, all under `.agents/skills/`. Every file is a markdown skill definition (`SKILL.md`) or supporting reference doc:

```
.agents/skills/adapt/SKILL.md             [purpose: adapt designs to different screen sizes/devices]
.agents/skills/animate/SKILL.md           [purpose: add animations and micro-interactions]
.agents/skills/arrange/SKILL.md           [purpose: improve layout, spacing, visual rhythm]
.agents/skills/audit/SKILL.md             [purpose: a11y/perf/quality audit with P0-P3 scoring]
.agents/skills/bolder/SKILL.md            [purpose: amplify safe/boring designs for visual impact]
.agents/skills/clarify/SKILL.md           [purpose: improve UX copy, error messages, microcopy]
.agents/skills/colorize/SKILL.md          [purpose: add strategic color to monochromatic designs]
.agents/skills/critique/SKILL.md          [purpose: UX critique with quantitative scoring + personas]
.agents/skills/critique/reference/cognitive-load.md      [supporting doc for critique]
.agents/skills/critique/reference/heuristics-scoring.md  [supporting doc for critique]
.agents/skills/critique/reference/personas.md            [supporting doc for critique]
.agents/skills/delight/SKILL.md           [purpose: add joy/personality/unexpected polish]
.agents/skills/distill/SKILL.md           [purpose: simplify by removing complexity]
.agents/skills/emil-design-eng/SKILL.md   [purpose: Emil Kowalski's UI polish philosophy]
.agents/skills/extract/SKILL.md           [purpose: extract reusable components/tokens to design system]
.agents/skills/frontend-design/SKILL.md   [purpose: distinctive production-grade frontend (Apache 2.0, attributed to Anthropic's frontend-design skill)]
.agents/skills/frontend-design/reference/color-and-contrast.md    [supporting doc]
.agents/skills/frontend-design/reference/interaction-design.md    [supporting doc]
.agents/skills/frontend-design/reference/motion-design.md         [supporting doc]
.agents/skills/frontend-design/reference/responsive-design.md     [supporting doc]
.agents/skills/frontend-design/reference/spatial-design.md        [supporting doc]
.agents/skills/frontend-design/reference/typography.md            [supporting doc]
.agents/skills/frontend-design/reference/ux-writing.md            [supporting doc]
.agents/skills/harden/SKILL.md            [purpose: i18n / error handling / overflow / edge cases]
.agents/skills/normalize/SKILL.md         [purpose: realign UI to design system standards]
.agents/skills/onboard/SKILL.md           [purpose: design onboarding/empty states/first-run flows]
.agents/skills/optimize/SKILL.md          [purpose: UI performance fixes (loading, render, bundle)]
.agents/skills/overdrive/SKILL.md         [purpose: technically ambitious UI (shaders, springs, scroll)]
.agents/skills/polish/SKILL.md            [purpose: pre-ship final polish pass]
.agents/skills/quieter/SKILL.md           [purpose: tone down loud/aggressive designs]
.agents/skills/teach-impeccable/SKILL.md  [purpose: one-time setup that gathers project design context]
.agents/skills/typeset/SKILL.md           [purpose: improve typography (fonts, hierarchy, sizing)]
```

### 3.2 Type classification (A/B/C) for each file

Every file in `.agents/` has the same shape: a markdown front-matter block (`name`, `description`, `user-invocable: true`, `argument-hint: ...`) followed by instructions written for a Claude Code / Cursor-style assistant. The `frontend-design/SKILL.md` even carries an `Apache 2.0. Based on Anthropic's frontend-design skill` license note.

**All 32 files are type (A) — IDE / developer tooling.** Specifically: design-oriented Claude Code / Cursor skills that the editor invokes when *you* are designing UI. They are not Trendzo product agents.

| File | Type |
|---|---|
| All 32 files in `.agents/skills/**` | **(A) IDE / developer tooling** |

No file is type (B) Trendzo product agent. No file is type (C) unclear.

### 3.3 Inbound reference search results

Grepped the whole repo for `.agents`. Hits:

| File | Line | Reference |
|---|---|---|
| `agent.py` | 4 | `from livekit.agents import ...` — **false positive**, this is the LiveKit Python package namespace, not the `.agents/` folder |
| `CODEBASE_INVENTORY_2026-05-04.md` | 80, 85 | Audit doc describing this folder (not live code) |
| `docs/methodology_pack/03_objectives/objective_09_research.md` | 295 | `mcp.agents_coordinated` — false positive (doc string, no path) |
| `SUBSTRATE_AUDIT_2026-04-21.md` | 439 | **Important context** — notes that `.claude/skills/` contains symlinks into `.agents/skills/` |

Specific patterns also checked, all **zero matches**:
- `from '.agents...` — no matches
- `require('.agents...` — no matches
- No `package.json`, `tsconfig.json`, or `vercel.json` references
- No references in `src/` source code

### 3.4 Cross-check against known product agent paths

Confirmed the actual Trendzo product-agent code lives elsewhere — none of these are inside `.agents/`:

| Path | Exists? |
|---|---|
| `src/lib/freedom-agent/` | ✅ yes |
| `src/lib/prompts/freedom-agent-prompt.ts` | ✅ yes |
| `src/app/api/freedom-agent/` | ✅ yes |
| `src/app/api/agency-chat/` | ✅ yes (Clay chat surface) |
| `src/app/api/chairman-chat/` | ✅ yes |
| `src/lib/clay/` | ✅ yes |

I also searched for any other directory under `src/` whose name contains "agent". Found these — none of them touch `.agents/`:

```
src/app/(public)/free/freedom-agent
src/app/admin/agent
src/app/api/admin/agent
src/app/api/freedom-agent
src/lib/agent
src/lib/agents
src/lib/freedom-agent
```

In plain English: every product-agent in your app (the Freedom Agent, Clay, the Chairman chat, the agency chat) lives under `src/`. The `.agents/` folder at repo root is a **completely different thing** — it's a set of design-oriented skills that your editor (Claude Code / Cursor) loads. Deleting it cannot break any product agent in Trendzo.

### 3.5 Per-file verdict + overall folder verdict

**Per-file:** all 32 files are type (A) developer tooling with **zero inbound references from product code**. None of them ship to users.

**Folder verdict: NEEDS REVIEW — DO NOT BLIND-DELETE**

The reason this is *not* a clean "SAFE TO DELETE":

> 🚨 **`.claude/skills/` is a directory of 22 symlinks pointing into `.agents/skills/`.**
>
> Verified by `ls -la .claude/skills`:
> ```
> adapt           -> /c/Projects/CleanCopy/.agents/skills/adapt
> animate         -> /c/Projects/CleanCopy/.agents/skills/animate
> arrange         -> /c/Projects/CleanCopy/.agents/skills/arrange
> audit           -> /c/Projects/CleanCopy/.agents/skills/audit
> bolder          -> /c/Projects/CleanCopy/.agents/skills/bolder
> clarify         -> /c/Projects/CleanCopy/.agents/skills/clarify
> colorize        -> /c/Projects/CleanCopy/.agents/skills/colorize
> critique        -> /c/Projects/CleanCopy/.agents/skills/critique
> delight         -> /c/Projects/CleanCopy/.agents/skills/delight
> distill         -> /c/Projects/CleanCopy/.agents/skills/distill
> emil-design-eng -> /c/Projects/CleanCopy/.agents/skills/emil-design-eng
> extract         -> /c/Projects/CleanCopy/.agents/skills/extract
> frontend-design -> /c/Projects/CleanCopy/.agents/skills/frontend-design
> harden          -> /c/Projects/CleanCopy/.agents/skills/harden
> normalize       -> /c/Projects/CleanCopy/.agents/skills/normalize
> onboard         -> /c/Projects/CleanCopy/.agents/skills/onboard
> optimize        -> /c/Projects/CleanCopy/.agents/skills/optimize
> overdrive       -> /c/Projects/CleanCopy/.agents/skills/overdrive
> polish          -> /c/Projects/CleanCopy/.agents/skills/polish
> quieter         -> /c/Projects/CleanCopy/.agents/skills/quieter
> teach-impeccable-> /c/Projects/CleanCopy/.agents/skills/teach-impeccable
> typeset         -> /c/Projects/CleanCopy/.agents/skills/typeset
> ```

In plain English: deleting `.agents/` would **immediately break 22 of the design skills that Claude Code loads in this project** (`/animate`, `/polish`, `/critique`, `/audit`, `/frontend-design`, etc.). The skills wouldn't break the *product*, but they'd break the *editor* — every time you typed `/animate` or `/critique` in Claude Code in this project, it would fail to find the skill file.

**What this means for the deletion decision:**

- If you *do not use* these design slash-commands in Claude Code → the folder is harmless to delete, **but you must also delete the matching symlinks under `.claude/skills/`** so the editor doesn't trip over dangling links.
- If you *do use* any of `/animate`, `/polish`, `/critique`, `/audit`, `/frontend-design`, `/onboard`, `/optimize`, `/extract`, etc. when designing the Trendzo UI → **keep `.agents/`**. These are your design-quality skills.
- If you're not sure → keep it. It's tiny (32 markdown files), there's no production cost, and the cost of breaking your editor's design tooling is higher than the cost of leaving 32 markdown files on disk.

---

## 4. Summary table

| Folder | Verdict | One-sentence reason |
|---|---|---|
| `tiktok_transcriber/` | **SAFE TO DELETE** | Standalone Python CLI, zero references from live code, explicitly excluded from Vercel deploy at `.vercelignore:20`, untouched for 96 days, app uses `src/lib/services/whisper-service.ts` instead. |
| `.agents/` | **NEEDS REVIEW** | All 32 files are developer-tooling skills (not product agents), but `.claude/skills/` contains 22 symlinks into this folder — deleting it without also cleaning those symlinks would break Claude Code's design slash-commands in this project. |

---

## 5. Anything that surprised me

1. **`.claude/skills/` is a symlink farm pointing into `.agents/skills/`.** This is the single most important finding in this report. A naive "delete `.agents/`" would silently break every design slash-command (`/animate`, `/polish`, `/critique`, etc.) that you use inside Claude Code. The two folders look independent on a file listing but they're tightly coupled. The substrate audit at `SUBSTRATE_AUDIT_2026-04-21.md:439` already noted this; I confirmed it directly with `ls -la`.

2. **`tiktok_transcriber/` writes to a real Supabase table (`scraped_videos`).** The folder is safe to delete code-wise, but the data it produced is still live in your database. Deleting the folder doesn't touch that data — it just means you'd need to dig into git history if you ever wanted to re-run the scraper. Worth knowing before you delete.

3. **`agent.py` at repo root is a LiveKit voice agent**, not connected to either folder under review. Just noting it because the grep for `.agents` matched on its `from livekit.agents import ...` line (the LiveKit Python package namespace happens to be called `agents`). False positive — no impact on this verification.

4. **The `frontend-design` skill explicitly attributes itself to Anthropic** (`Apache 2.0. Based on Anthropic's frontend-design skill`). That's not a problem; it just confirms these are upstream design skills you adopted, not something custom-built for Trendzo.

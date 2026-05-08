# @json-render/react Investigation
Date: 2026-05-03
Branch: vercel-deploy-test
HEAD: dccf1b5 — Phase 1: lock package manager to npm + recover silently-excluded source files

This is a read-only investigation. No files were modified, no commits were created,
no `npm` commands were executed. Only `git status`, `git log`, `git show`,
`git cat-file -e`, `git branch --show-current`, and read-only file inspection were used.

---

## I1. Entry state

`git status --porcelain` → 41 non-empty lines.

This matches the expected post-pop state: the 18 modified WIP source files,
3 deleted recover-flow files, 2 untracked source items (`SaveYourLinkNotice.tsx`
+ assessment share-token migration), the 4 PHASE1 investigation MDs (untracked),
plus the post-fix outputs (`PHASE1_FIX_OUTCOME_2026-05-02.md`,
`vercel_post_fix_log.txt`, `POP_DIFF_LOST.txt`, `POP_DIFF_GAINED.txt`,
`POST_POP_STATUS.txt`). No edits were made during this investigation.

Branch: `vercel-deploy-test`.
HEAD: `dccf1b5 Phase 1: lock package manager to npm + recover silently-excluded source files`.

---

## I2. package.json entry

```
package.json:28:    "@google/genai": "^1.43.0",
package.json:29:    "@json-render/core": "^0.15.0",
package.json:30:    "@json-render/react": "^0.15.0",
package.json:31:    "@modelcontextprotocol/sdk": "^1.29.0",
package.json:32:    "@motionone/utils": "^10.18.0",
```

Version specifier: `"@json-render/react": "^0.15.0"` (line 30, top-level
`dependencies` block, not `devDependencies`).

Note: a companion package `@json-render/core@^0.15.0` sits one line above (line 29).
Per the `@json-render/react` README, `@json-render/core` is its hard runtime peer
("npm install @json-render/react @json-render/core zod"). Whatever decision is made
about `@json-render/react` likely has to be paired with the same decision about
`@json-render/core`.

---

## I3. Git archaeology

Only **three** commits in the entire repo have ever touched `package.json`:

| SHA | Date | Author | Subject |
|---|---|---|---|
| `c1426cb` | 2026-03-30 | ttuckerm | Fresh init: clean source, no video data, no secrets |
| `8549c9d` | 2026-04-17 | ttuckerm | CHECKPOINT: April 17 2026 — Intelligent Clay planning + v15 XGBoost + agency work |
| `051f431` | 2026-04-29 | ttuckerm | checkpoint: 2026-04-29 — escape funnel + agency dashboard parity work |

`@json-render/react` was introduced in commit **`c1426cb3dacd19efcfd3c5ac77340739ed9fa602`**
("Fresh init: clean source, no video data, no secrets", 2026-03-30, ttuckerm). This is
the **root commit** of the repository (no parents — verified via `git log -1 --format='%P' c1426cb`
returning empty).

- `8549c9d` (April 17 checkpoint) added `@modelcontextprotocol/sdk` immediately below it;
  `@json-render/react` appears in that diff only as **context**, not as an `+` add.
- `051f431` (April 29 checkpoint) did not touch `@json-render/react` at all.

"What other packages were added in that same commit?" — because c1426cb is the
root commit, ~85 dependencies and ~34 devDependencies were all introduced
simultaneously when the repo was initialized. The introduction batch is therefore
not informative about intent. Intent has to be read from how the package is *used*
in the source tree (see I4).

---

## I4. Full grep results

Searched `*.{ts,tsx,js,jsx,json,mjs,cjs}` across the repo (excluding `node_modules`,
`.next`, `.git`, `dist`, `build`).

### Source-code import sites (committed in HEAD, working tree clean)

| File:Line | Reference |
|---|---|
| `src/app/agency/AgencyClient.tsx:14` | `} from '@json-render/react';` (named imports including `useJsonRenderMessage` per L8) |
| `src/lib/trendzo-catalog.ts:1` | `import { defineCatalog } from '@json-render/core';` |
| `src/lib/trendzo-catalog.ts:2` | `import { schema } from '@json-render/react/schema';` |
| `src/lib/trendzo-registry.tsx:4` | `import { defineRegistry, useActions } from '@json-render/react';` |
| `src/app/api/agency-chat/route.ts:5` | `import { pipeJsonRender } from '@json-render/core';` |
| `tsconfig.json:33-34` | Path mapping: `"@json-render/react/schema": ["./node_modules/@json-render/react/dist/schema.d.ts"]` |

All six files were verified to exist in `HEAD` with **clean** working-tree status
(via `git cat-file -e HEAD:<file>` and `git status --porcelain -- <file>` — none
of them are part of Tommy's WIP modifications). They are committed substrate.

### Inline references / comments (same files)

| File:Line | Reference |
|---|---|
| `src/app/agency/AgencyClient.tsx:796` | `// Restore the previous session with full parts (including json-render specs)` |
| `src/app/agency/AgencyClient.tsx:861` | `// Serialize full parts array to preserve json-render specs` |
| `src/lib/clay/index.ts:11` | `// of json-render specs authored by the LLM. Inline action confirmations still` |
| `src/app/api/agency-chat/route.ts:29` | `* route emits assistant turns through pipeJsonRender(...) in three places` |

### Lockfile (informational, not a source reference)

| File:Line | Reference |
|---|---|
| `package-lock.json:18` | top-level `dependencies` entry: `"@json-render/react": "^0.15.0"` |
| `package-lock.json:3329` | `node_modules/@json-render/react` install record |

### Conclusion

Five source files (TypeScript / TSX / route handler) plus `tsconfig.json` plus
`package.json` plus `package-lock.json` reference the package. The five source
files are not stubs — they invoke the package's actual API surface (`defineCatalog`,
`defineRegistry`, `useActions`, `useJsonRenderMessage`, `pipeJsonRender`, `schema`).

---

## I5. package-lock.json appearance

Searched the lockfile for the literal string `"@json-render/react"`:

- **Total occurrences: 1**, at `package-lock.json:18`, in the root project's
  top-level `dependencies` block. This is the canonical "direct top-level dep" location.
- Other matches surfaced by an unquoted search are at `package-lock.json:3329`
  (the `node_modules/@json-render/react` package node — a *key*, not a "this package
  needs @json-render/react" *value*) and in lines 17, 3331, 3335 (related to
  `@json-render/core`, the resolved tarball URL, and `@json-render/react`'s own
  internal dep on `@json-render/core@0.15.0`).

**Verdict:** `@json-render/react` is **a direct top-level dependency only**. No other
installed package declares it as a dependency or peer dependency. Removing it from
`package.json` would not be re-introduced transitively by any other dep.

(The reverse is also true: nothing else in the tree is "covering" for it — if you
remove it, it really is gone.)

---

## I6. Package purpose

From `node_modules/@json-render/react/package.json`:

```
name:        @json-render/react
version:     0.15.0
description: React renderer for @json-render/core. JSON becomes React components.
main:        ./dist/index.js
types:       ./dist/index.d.ts
license:     Apache-2.0
homepage:    https://json-render.dev
repository:  git+https://github.com/vercel-labs/json-render (directory: packages/react)
peerDeps:    {"react":"^19.2.3"}             ← THIS IS THE CONFLICT
deps:        {"@json-render/core":"0.15.0"}
exports:     "."  and  "./schema"
```

From `node_modules/@json-render/react/README.md` (head 60):

> # @json-render/react
> React renderer for json-render. Turn JSON specs into React components with
> data binding, visibility, and actions.
>
> ## Installation
> npm install @json-render/react @json-render/core zod
>
> ## Quick Start
> ### 1. Create a Catalog
> import { defineCatalog } from "@json-render/core";
> import { schema } from "@json-render/react/schema";
> ...
>
> ### 2. Define Component Implementations
> `defineRegistry` conditionally requires the `actions` field only when the
> catalog declares actions. Catalogs with `actions: {}` can omit it entirely.
>
> import { defineRegistry, useBoundProp } from "@json-render/react";
> import { catalog } from "./catalog";
> export const { registry } = defineRegistry(catalog, { ... });

**Purpose**: It is a **Vercel Labs** project that converts LLM-authored JSON UI
specs into rendered React components, with type validation (Zod), data binding,
visibility rules, and a server-side stream transformer (`pipeJsonRender`) that
rewrites assistant token streams so JSON UI fences can be detected and rendered
client-side.

**Peer-dependency requirement**: `react@^19.2.3` (strict). The Trendzo project is
pinned to `react@18.2.0`, hence the `ERESOLVE` error in the Vercel build.

---

## I7. Related search terms

Searched `src/**/*.{ts,tsx,js,jsx}` for `JsonRender|jsonRender|JSONRender`:

| File:Line | Reference |
|---|---|
| `src/app/api/agency-chat/route.ts:5` | `import { pipeJsonRender } from '@json-render/core';` |
| `src/app/api/agency-chat/route.ts:29` | `* route emits assistant turns through pipeJsonRender(...) in three places` |
| `src/app/api/agency-chat/route.ts:368` | `writer.merge(pipeJsonRender(synthetic));` |
| `src/app/api/agency-chat/route.ts:412` | `writer.merge(pipeJsonRender(synthetic));` |
| `src/app/api/agency-chat/route.ts:1665` | `// BUG 2 (2026-04-24): drop assistant turns that pipeJsonRender wrote as` |
| `src/app/api/agency-chat/route.ts:1835` | `writer.merge(pipeJsonRender(result.toUIMessageStream()));` |
| `src/app/agency/AgencyClient.tsx:8` | `useJsonRenderMessage,` (named import from `@json-render/react`) |
| `src/app/agency/AgencyClient.tsx:420-421` | `const { spec, text, hasSpec } = useJsonRenderMessage(message.parts as Parameters<typeof useJsonRenderMessage>[0]);` |

`pipeJsonRender` is invoked in **four** distinct call sites in
`agency-chat/route.ts` (synthetic stream short-circuits at L368/L412 and the main
LLM-stream merge at L1835, plus the L1665 comment referencing earlier history-cleanup
logic). `useJsonRenderMessage` is the React hook that drives assistant-message
rendering on the client.

---

## I8. Documentation references

Six markdown files at the repo root reference the package or its concepts:

### `INTELLIGENT_CLAY_SPEC.md` (the design spec for the Agency / Intelligent Clay system)
- L13: "**Client shell** | `src/app/agency/AgencyClient.tsx` — chat UI, `useChat` transport, **json-render**, Clay classification artifacts, voice, session persistence."
- L16: "**Streaming + spec** | Assistant stream is merged with `pipeJsonRender(result.toUIMessageStream())` (lines ~1498–1500). Package: **`@json-render/core` (`pipeJsonRender`), `@json-render/react` (`Renderer`, `useJsonRenderMessage`, providers)**."
- L26-27: explicit description of how `pipeJsonRender` normalizes spec chunks and how `useJsonRenderMessage(message.parts)` drives the client renderer.
- L43-46: dedicated subsection for `pipeJsonRender`.
- L112-124: "**json-render registry**" subsection describing `useActions()` from `@json-render/react`.
- L329-335: file-by-file architecture table where `AgencyClient.tsx`, `agency-chat/route.ts`, and `trendzo-catalog.ts` are all anchored to json-render functionality.

### `SUBSTRATE_AUDIT_2026-04-21.md`
- L658: "Artifacts | TrendzoCards + json-render components | PARTIAL | 16 clay components in `src/components/clay/` … Renderer dispatches via **`@json-render/core`**."

### `VISIBLE_UI_BUGS_INVESTIGATION_2026-04-24.md`
- Multiple references (L12, L28, L277-282, L335, L350, L450) describe a UI bug whose root cause is how `pipeJsonRender(...)` shapes assistant `UIMessage.parts` and how those parts persist in `useChat` history.

### `BUG2_CHAT_SCHEMA_FIX_2026-04-24.md`
- L59 etc.: contains the **fix plan** for the bug above. Includes a quoted snippet of the package's compiled internals at `node_modules/@json-render/core/dist/chunk-AFLK3Q4T.mjs:551-555` showing `function pipeJsonRender(stream) { … createJsonRenderTransform() }`.
- The investigation explicitly relies on the package's behavior. Removing the package would invalidate the fix.

### `PHASE1_BUILD_INVESTIGATION_2026-05-02.md`
- Multiple references documenting that `@json-render/react@^0.15.0` is in `package.json` and was a candidate root-cause of the build issue.

### `PHASE1_FIX_OUTCOME_2026-05-02.md` (the most recent — written by Fix Prompt #1)
- L191-200: full Vercel install error log showing peer-dep mismatch.
- L212-217: identifies "Remove `@json-render/react` if it's unused / safe to drop" as one of the two candidate paths but explicitly defers the decision to a "burden-of-proof grep" (which is what this report is).
- L308: "decide between (a) removing `@json-render/react` after the standard burden-of-proof grep, or (b) adding `--legacy-peer-deps` to `vercel.json`'s `installCommand`. Both are reversible."

---

## I9. Verdict

### **ACTIVELY USED**

This is not a close call. `@json-render/react` (and its companion
`@json-render/core`) is **load-bearing substrate** for the Agency / Intelligent
Clay feature. The evidence:

**Direct API consumption in committed source (5 files):**
1. `src/lib/trendzo-catalog.ts` — calls `defineCatalog(schema, …)` from
   `@json-render/core` + `@json-render/react/schema`. This is the catalog of UI
   components and actions that the LLM is allowed to emit.
2. `src/lib/trendzo-registry.tsx` — calls `defineRegistry(catalog, …)` and uses
   `useActions` from `@json-render/react`. This binds the LLM-emitted spec types
   to actual React component implementations.
3. `src/app/api/agency-chat/route.ts` — invokes `pipeJsonRender(...)` in **four**
   places (L368, L412, L1835, plus a comment at L1665 about prior pipeJsonRender
   behavior). Without it, the LLM-stream → UI-spec rewrite breaks; the chat
   route stops producing renderable assistant messages.
4. `src/app/agency/AgencyClient.tsx` — imports `useJsonRenderMessage` from
   `@json-render/react`, calls it at L420-421 to extract `{ spec, text, hasSpec }`
   from each assistant message's `parts`. Without it, assistant messages stop
   rendering on the client.
5. `tsconfig.json` — explicit path alias for `@json-render/react/schema`. Removing
   the package leaves a broken path mapping.

**Architectural documentation (6 files) treats it as core:**
- `INTELLIGENT_CLAY_SPEC.md` is the design spec for the Agency feature and dedicates
  multiple sections to json-render (Client shell, Streaming + spec, registry, file table).
- `SUBSTRATE_AUDIT_2026-04-21.md` assumes Renderer dispatches via `@json-render/core`.
- `VISIBLE_UI_BUGS_INVESTIGATION_2026-04-24.md` and `BUG2_CHAT_SCHEMA_FIX_2026-04-24.md`
  are investigations whose entire reasoning depends on how `pipeJsonRender` shapes
  UIMessage parts.

**No transitive cover:** I5 confirmed `@json-render/react` is a direct top-level dep
with exactly one `dependencies`-entry occurrence in the lockfile. Removing it removes
it; no other package brings it back.

**What would break if `@json-render/react` were removed from `package.json`:**
- TypeScript compile of the 5 source files above would fail with "Cannot find
  module" errors for `@json-render/react`, `@json-render/react/schema`, and
  (via runtime dep chain) likely `@json-render/core` too.
- `next build` would fail (TypeScript errors are normally suppressed by
  `typescript.ignoreBuildErrors:true` in `next.config.mjs`, but missing modules
  cause webpack resolution failures, which are *not* suppressed).
- At runtime, even if the build somehow proceeded, the `/agency` route and
  `/api/agency-chat` route would 500: `useJsonRenderMessage` and `pipeJsonRender`
  would be undefined.
- The agency dashboard parity work referenced in HEAD's grandparent commit
  (`051f431 checkpoint: 2026-04-29 — escape funnel + agency dashboard parity work`)
  becomes non-functional.

**Specifically what this means for the standing principle:** Removing this package
would delete substrate that 5 committed source files import from and that 6
markdown documents describe as core architecture. That fails the "explicit
statement of what would break" test. This is the opposite of "dead / unused / safe to remove."

### Recommended path forward: **Path B — `--legacy-peer-deps`**

Update `vercel.json`'s `installCommand` from:

```
"installCommand": "npm install"
```

to:

```
"installCommand": "npm install --legacy-peer-deps"
```

Rationale:

- **Reversible in one git revert.** No code is touched. No deps removed. Easy
  rollback if it surfaces a different problem.
- **Matches how npm install actually works locally.** Tommy ran `npm install` to
  get the project into its current state; the lockfile already reflects that
  install. Either his local npm is on a version that auto-relaxes peer-dep
  resolution, or he ran with a `.npmrc` that does, or the environment somehow
  produced the install. Vercel's container runs strict peer-dep enforcement by
  default. `--legacy-peer-deps` brings Vercel's behavior in line with what the
  rest of the project already assumed.
- **`react@18` + a package that asks for `react@^19`** is a *very common* npm
  ecosystem state in 2025/2026. Many React-based libraries advertise React 19
  peer support before being widely adopted on React 19. Using
  `--legacy-peer-deps` (or `npm config set legacy-peer-deps=true`) is the
  standard, low-risk mitigation.
- **React 19 upgrade is a major Phase 3+ decision** in its own right. Pinning
  to `--legacy-peer-deps` parks that decision cleanly without forcing it now.
  When/if React 19 upgrade happens, the flag can be removed in the same PR.
- **Defers no work that has to be done.** Path A (removing the package) would
  require ripping out a feature, which is forbidden by the standing principle
  on this evidence base.

### Risks of Path B (declared explicitly)

- `--legacy-peer-deps` skips peer-dep checks globally for that install, not just
  for `@json-render/react`. If another peer-dep mismatch is hidden in the tree,
  it will silently pass instead of being flagged. Mitigation: keep this flag
  scoped to Vercel install only (i.e., set it in `vercel.json.installCommand`,
  **not** project-wide via `.npmrc`); leave local `npm install` strict so dev
  notices new conflicts as they're introduced.
- `@json-render/react@0.15.0` was published expecting React 19's APIs. On React
  18, behavior is *probably* fine for the surface the codebase uses
  (`useJsonRenderMessage`, `defineRegistry`, `useActions`, `pipeJsonRender`),
  but anything that internally relies on React 19-only features (`use()`, new
  Suspense behavior, `useFormStatus`, etc.) could behave subtly differently.
  Mitigation: smoke-test the agency chat after the next Vercel deploy succeeds.

### Out of scope for this fix prompt

- Decision about React 19 upgrade (Phase 3+).
- Decision about the companion package `@json-render/core` (paired with
  `@json-render/react`; same answer applies — keep, leave alone).
- Bug investigation in `VISIBLE_UI_BUGS_INVESTIGATION_2026-04-24.md` /
  `BUG2_CHAT_SCHEMA_FIX_2026-04-24.md` — those are open issues but unrelated
  to the build break.

---

## What was NOT done in this investigation

- `package.json` was **not** modified.
- `vercel.json` was **not** modified.
- No `npm install`, `npm uninstall`, `npm remove`, or any package mutation was run.
- Nothing was staged or committed.
- The working tree (Tommy's 21 WIP files) was **not** touched.
- No recommendation in this report depends on partial evidence — every claim is
  cited with a file:line or a `git show` reference.

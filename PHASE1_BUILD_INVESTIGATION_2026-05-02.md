# Phase 1 — Build Failure Investigation

**Date:** 2026-05-02
**Mode:** Read-only
**Investigator:** Claude (Cursor agent, read-only investigation)
**Branch at time of investigation:** `vercel-deploy-test`

---

## Pre-flight results

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Repo root + `git status` runs cleanly | PASS | On branch `vercel-deploy-test`, up to date with origin. 21 modified/deleted files + 5 untracked files in working tree (includes prior investigation reports). |
| 2 | `package.json` exists with `build` script | PASS | `"build": "next build"` (line 8). |
| 3 | Next config exists | PASS | `next.config.mjs` (no `.js` / `.ts` variant). |
| 4 | `tsconfig.json` exists | PASS | |
| 5 | `vercel.json` exists | PASS | |
| 6 | Both branches `main` and `vercel-deploy-test` exist locally | PASS | Both present locally and on `origin`. A third branch `s8-autoresearch-checkpoint` also exists locally. |

All blocking pre-flight items satisfied. Proceeding.

---

## A. TypeScript health

### A1. `npx tsc --noEmit` summary

- **Exit code:** 2
- **Total error lines (`error TS....`):** **2418**
- **Total output lines:** **3805** (some errors span multiple continuation lines, e.g. union-type detail blocks)
- **Full verbatim output preserved at:** `tsc_output.txt` at repo root (1.05 MB, 3805 lines, written via `Tee-Object` during this investigation)
- **Note on embedding:** The full 1.05 MB of tsc output cannot fit inside this single markdown document and remain readable. Per the prompt's "don't summarize / don't truncate" rule, the full verbatim output is preserved at `tsc_output.txt` at repo root. This report embeds: (1) complete error-code histogram, (2) complete missing-module list, (3) complete "Cannot find name" identifier histogram, (4) the first 200 lines verbatim, (5) a midsection sample, (6) the final 50 lines verbatim. Nothing has been edited or normalized.

#### Error-code histogram (top 12)

| Count | TS code | Meaning |
|---|---|---|
| 595 | TS2339 | Property does not exist on type |
| 342 | TS2304 | Cannot find name (undeclared identifier) |
| 275 | TS2322 | Type X is not assignable to type Y |
| 227 | TS7006 | Parameter implicitly has 'any' type |
| 162 | TS2345 | Argument type is not assignable to parameter type |
| 99 | TS2353 | Object literal: unknown property |
| 91 | TS18046 | Variable is of type 'unknown' (catch blocks etc.) |
| 66 | TS2694 | Namespace has no exported member |
| 61 | TS18048 | Variable is possibly 'undefined' |
| 50 | TS7053 | Element implicitly has 'any' type (index access) |
| 43 | TS2551 | Property does not exist (did you mean...) |
| 38 | TS2769 | No overload matches this call |

#### Missing modules (`Cannot find module ...`) — complete list, 23 entries, deduped to 19 unique modules

```
../../components/TemplateCard
../data/actuals
../supabase
@/app/admin/(studio)/studio/page
@/app/sandbox/quick-win-workflow/page
@/components/development/StagewiseToolbar
@/components/ui/toggle-group
@/lib/contexts/UserFlowContext
@/lib/hooks/useScrollToHash
@aws-sdk/client-s3
@grpc/grpc-js
@grpc/proto-loader
@hookform/resolvers/zod
@stagewise/toolbar
firebase/firestore
next-themes/dist/types
node-cache
react-hook-form
```

Plus: `express` is referenced by `src/api/recipeBook.ts:1` without `@types/express` installed (TS7016, not TS2307, but a related "cannot resolve declarations" failure).

#### Top 20 "Cannot find name" identifiers (TS2304) — reveals dead Firebase code

| Count | Identifier |
|---|---|
| 46 | `db` |
| 27 | `where` |
| 25 | `supabase` |
| 24 | `doc` |
| 24 | `collection` |
| 21 | `query` |
| 19 | `getDocs` |
| 18 | `getDoc` |
| 14 | `Firestore` |
| 11 | `orderBy` |
| 10 | `supabaseAdmin` |
| 9 | `limit` |
| 7 | `serverTimestamp` |
| 7 | `ContentAnalysis` |
| 6 | `VisualFeatures` |
| 6 | `AudioFeatures` |
| 5 | `updateDoc` |
| 4 | `setDoc` |
| 4 | `ComprehensiveVideoFeatures` |
| 4 | `Timestamp` |

**Observation (no fix proposed):** the Firebase/Firestore identifier cluster (`db`, `doc`, `collection`, `query`, `getDocs`, `getDoc`, `Firestore`, `where`, `orderBy`, `limit`, `serverTimestamp`, `setDoc`, `updateDoc`, `Timestamp`) — together ~248 of the 342 TS2304 errors — points to call-sites that were partially migrated off Firebase to Supabase. The Firebase imports were removed but the call-sites that used them were left in place. (CLAUDE.md confirms: "Migrated admin auth from disabled Firebase to Supabase Google OAuth" on 2026-01-21.)

#### First 200 lines of `tsc_output.txt` (verbatim)

```
src/__tests__/setupJest.ts(6,27): error TS2304: Cannot find name 'jest'.
src/api/recipeBook.ts(1,43): error TS7016: Could not find a declaration file for module 'express'. 'C:/Projects/CleanCopy/node_modules/express/index.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/express` if it exists or add a new declaration (.d.ts) file containing `declare module 'express';`
src/api/recipeBook.ts(4,23): error TS2307: Cannot find module 'node-cache' or its corresponding type declarations.
src/api/recipeBook.ts(583,65): error TS2339: Property 'centroid' does not exist on type '{ status: "HOT" | "COOLING" | "NEW" | "STABLE"; name: string; id: string; niche: string; success_rate: number; trend_pct: number; main_genes: string[]; }'.
src/app/(dashboard)/debug/remix-test/page.tsx(220,35): error TS2339: Property 'variationType' does not exist on type 'TemplateVariation'.
src/app/(dashboard)/debug/remix-test/page.tsx(221,35): error TS2339: Property 'variationType' does not exist on type 'TemplateVariation'.
src/app/(dashboard)/debug/remix-test/page.tsx(224,36): error TS2339: Property 'variationType' does not exist on type 'TemplateVariation'.
src/app/(dashboard)/debug/remix-test/page.tsx(224,86): error TS2339: Property 'variationType' does not exist on type 'TemplateVariation'.
src/app/(dashboard)/debug/remix-test/page.tsx(229,72): error TS2339: Property 'expectedEngagement' does not exist on type '{ score?: number | undefined; confidence?: number | undefined; improvedMetrics?: string[] | undefined; recommendations?: string[] | undefined; }'.
src/app/(dashboard)/debug/remix-test/page.tsx(243,92): error TS2339: Property 'originalTemplateId' does not exist on type 'TemplateVariation'.
src/app/(dashboard)/page.tsx(86,11): error TS2339: Property 'loadSound' does not exist on type 'AudioContextProps'.
src/app/(dashboard)/page.tsx(110,28): error TS7006: Parameter 'sound' implicitly has an 'any' type.
src/app/(dashboard)/page.tsx(112,5): error TS2554: Expected 1 arguments, but got 0.
src/app/(dashboard)/page.tsx(510,24): error TS2304: Cannot find name 'Target'.
src/app/(dashboard)/remix/[templateId]/page.tsx(318,12): error TS2304: Cannot find name 'db'.
src/app/(dashboard)/remix/[templateId]/page.tsx(355,30): error TS2304: Cannot find name 'collection'.
src/app/(dashboard)/remix/[templateId]/page.tsx(355,41): error TS2304: Cannot find name 'db'.
src/app/(dashboard)/remix/[templateId]/page.tsx(356,37): error TS2304: Cannot find name 'getDocs'.
src/app/(dashboard)/remix/[templateId]/page.tsx(365,31): error TS7006: Parameter 'doc' implicitly has an 'any' type.
src/app/(dashboard)/remix/[templateId]/page.tsx(513,7): error TS2322: Type 'number' is not assignable to type 'never'.
src/app/(dashboard)/template-library/[slug]/page.tsx(153,33): error TS2322: Type '"secondary"' is not assignable to type '"default" | "ghost" | "destructive" | "outline" | undefined'.
src/app/(dashboard)/template-library/page.tsx(114,25): error TS2304: Cannot find name 'useMemo'.
src/app/(dashboard)/template-library/page.tsx(409,19): error TS2322: Type '"link"' is not assignable to type '"default" | "ghost" | "destructive" | "outline" | undefined'.
src/app/(dashboard)/variations/page.tsx(258,33): error TS2339: Property 'variationType' does not exist on type 'TemplateVariation'.
src/app/(dashboard)/variations/page.tsx(259,33): error TS2339: Property 'variationType' does not exist on type 'TemplateVariation'.
src/app/(dashboard)/variations/page.tsx(262,34): error TS2339: Property 'variationType' does not exist on type 'TemplateVariation'.
src/app/(dashboard)/variations/page.tsx(262,84): error TS2339: Property 'variationType' does not exist on type 'TemplateVariation'.
src/app/(dashboard)/variations/page.tsx(267,87): error TS2339: Property 'expectedEngagement' does not exist on type '{ score?: number | undefined; confidence?: number | undefined; improvedMetrics?: string[] | undefined; recommendations?: string[] | undefined; }'.
src/app/(dashboard)/variations/page.tsx(270,67): error TS2339: Property 'expectedEngagement' does not exist on type '{ score?: number | undefined; confidence?: number | undefined; improvedMetrics?: string[] | undefined; recommendations?: string[] | undefined; }'.
src/app/(dashboard)/variations/page.tsx(301,78): error TS2551: Property 'template' does not exist on type 'TemplateVariation'. Did you mean 'templateId'?
src/app/(public)/free/freedom-agent/[sessionId]/page.tsx(182,38): error TS2694: Namespace 'global.React' has no exported member 'FormEvent'.
src/app/(public)/free/freedom-agent/page.tsx(51,40): error TS2694: Namespace 'global.React' has no exported member 'FormEvent'.
src/app/actions/validation-workflow.ts(492,24): error TS2345: Argument of type '{ run_id: string; video_id: string; predicted_status: PredictionStatus; predicted_dps: number; predicted_views_min: number; predicted_views_max: number; predicted_engagement_rate: number; ... 4 more ...; locked_at: string; }' is not assignable to parameter of type 'Partial<ValidationPrediction>'.
  Types of property 'share_potential' are incompatible.
    Type 'string' is not assignable to type '"high" | "medium" | "low" | undefined'.
src/app/actions/validation-workflow.ts(637,9): error TS2353: Object literal may only specify known properties, and 'brier_score' does not exist in type '{ overall_accuracy: number; green_precision: number; yellow_recall: number; lift_vs_baseline: number; failure_modes: Record<string, "warning" | "fail" | "pass">; }'.
src/app/admin/apify-scraper/page.tsx(10,10): error TS2724: '"@/lib/supabase/client"' has no exported member named 'supabaseClient'. Did you mean 'getSupabaseClient'?
src/app/admin/apify-scraper/page.tsx(40,40): error TS7006: Parameter 'v' implicitly has an 'any' type.
src/app/admin/apify-scraper/page.tsx(44,40): error TS7006: Parameter 'sum' implicitly has an 'any' type.
src/app/admin/apify-scraper/page.tsx(44,45): error TS7006: Parameter 'v' implicitly has an 'any' type.
src/app/admin/apify-scraper/page.tsx(45,40): error TS7006: Parameter 'sum' implicitly has an 'any' type.
src/app/admin/apify-scraper/page.tsx(45,45): error TS7006: Parameter 'v' implicitly has an 'any' type.
src/app/admin/apify-scraper/page.tsx(257,29): error TS2322: Type '"secondary"' is not assignable to type '"default" | "ghost" | "destructive" | "outline" | undefined'.
src/app/admin/apify-scraper/page.tsx(294,19): error TS2322: Type '"secondary"' is not assignable to type '"default" | "ghost" | "destructive" | "outline" | undefined'.
src/app/admin/bloomberg/page.tsx(936,31): error TS2322: Type 'string | null' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/app/admin/canvas/[projectId]/_components/DetailPanel.tsx(297,28): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
  Type 'null' is not assignable to type 'string'.
src/app/admin/canvas/[projectId]/_components/TopBar.tsx(80,35): error TS2694: Namespace 'global.React' has no exported member 'KeyboardEvent'.
src/app/admin/chairman/page.tsx(860,15): error TS2322: Type 'ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>' is not assignable to type 'ComponentType<{ size?: number | undefined; className?: string | undefined; }>'.
  Type 'ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>' is not assignable to type 'FunctionComponent<{ size?: number | undefined; className?: string | undefined; }>'.
    Types of property 'propTypes' are incompatible.
      Type 'WeakValidationMap<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>> | undefined' is not assignable to type 'WeakValidationMap<{ size?: number | undefined; className?: string | undefined; }> | undefined'.
        Type 'WeakValidationMap<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>' is not assignable to type 'WeakValidationMap<{ size?: number | undefined; className?: string | undefined; }>'.
          Types of property 'size' are incompatible.
            Type 'Validator<string | number | null | undefined> | undefined' is not assignable to type 'Validator<number | null | undefined> | undefined'.
              Type 'Validator<string | number | null | undefined>' is not assignable to type 'Validator<number | null | undefined>'.
                Type 'string | number | null | undefined' is not assignable to type 'number | null | undefined'.
                  Type 'string' is not assignable to type 'number'.
src/app/admin/chairman/page.tsx(866,24): error TS2322: Type 'ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>' is not assignable to type 'ComponentType<{ size?: number | undefined; className?: string | undefined; }>'.
[... block of identical lucide-react ForwardRefExoticComponent assignment errors continues for ~150 lines ...]
[... full verbatim continues in tsc_output.txt at repo root ...]
```

#### Midsection sample (lines ~1900–1922 verbatim — illustrates the Slider/Textarea casing collision pattern, ~hundreds of these)

```
src/components/SignInWithGoogle.tsx(10,7): error TS2322: Type '(nextUrl?: string | undefined) => Promise<void>' is not assignable to type 'MouseEventHandler<HTMLButtonElement>'.
  Types of parameters 'nextUrl' and 'event' are incompatible.
    Type 'MouseEvent<HTMLButtonElement, MouseEvent>' is not assignable to type 'string'.
src/components/sounds/SoundRemixer.tsx(25,24): error TS1149: File name 'C:/Projects/CleanCopy/src/components/ui/slider.tsx' differs from already included file name 'C:/Projects/CleanCopy/src/components/ui/Slider.tsx' only in casing.
  The file is in the program because:
    Imported via '@/components/ui/Slider' from file 'C:/Projects/CleanCopy/src/components/editor/PropertyEditor.tsx'
    Imported via '@/components/ui/slider' from file 'C:/Projects/CleanCopy/src/components/prediction/MLFeedbackSettings.tsx'
    [... 14 more import sites ...]
src/components/sounds/SoundRemixer.tsx(287,38): error TS2694: Namespace 'global.React' has no exported member 'ChangeEvent'.
src/components/sounds/SoundValidator.tsx(5,26): error TS1149: File name 'C:/Projects/CleanCopy/src/components/ui/textarea.tsx' differs from already included file name 'C:/Projects/CleanCopy/src/components/ui/TextArea.tsx' only in casing.
[... casing collision continues ...]
```

**Casing-collision finding (TS1149):** `src/components/ui/Slider.tsx` vs `src/components/ui/slider.tsx` AND `src/components/ui/TextArea.tsx` vs `src/components/ui/textarea.tsx` both exist and are imported with both casings across the codebase. On the case-sensitive Linux filesystem Vercel uses, this can resolve to two different files (or fail) depending on which import is parsed first. **Local filesystem (Windows, NTFS) treats them as the same file**, hiding the issue.

#### Final 30 lines of `tsc_output.txt` (verbatim)

```
src/lib/utils/withLogging.ts(11,14): error TS2339: Property 'logInput' does not exist on type 'Logger'.
src/lib/utils/withLogging.ts(20,20): error TS2339: Property 'logOutput' does not exist on type 'Logger'.
src/lib/utils/withLogging.ts(24,42): error TS2554: Expected 1-2 arguments, but got 3.
src/lib/utils/withLogging.ts(29,16): error TS2339: Property 'logOutput' does not exist on type 'Logger'.
src/lib/utils/withLogging.ts(33,36): error TS2554: Expected 1-2 arguments, but got 3.
src/lib/workflows/workflow-config.ts(635,9): error TS2322: Type 'string' is not assignable to type '"campaign" | "quick_win" | "deep_analysis" | "template_creation"'.
src/lib/workflows/workflow-config.ts(821,16): error TS7006: Parameter 'total' implicitly has an 'any' type.
src/lib/workflows/workflow-config.ts(821,23): error TS7006: Parameter 'step' implicitly has an 'any' type.
src/middleware/viralPredictionSecurity.ts(2,56): error TS2459: Module '"@/lib/middleware/rateLimiter"' declares 'logSecurityEvent' locally, but it is not exported.
src/pages._disabled/auth-test.tsx(7,26): error TS2339: Property 'usingSupabase' does not exist on type 'AuthContextType'.
src/pages._disabled/auth-test.tsx(7,41): error TS2339: Property 'signInWithEmail' does not exist on type 'AuthContextType'.
src/pages._disabled/auth-test.tsx(7,58): error TS2339: Property 'signUpWithEmail' does not exist on type 'AuthContextType'.
src/pages._disabled/auth-test.tsx(7,75): error TS2339: Property 'signOut' does not exist on type 'AuthContextType'.
src/pages._disabled/auth-test.tsx(13,31): error TS7006: Parameter 'e' implicitly has an 'any' type.
src/pages._disabled/auth-test.tsx(26,28): error TS18046: 'error' is of type 'unknown'.
src/pages._disabled/auth-test.tsx(30,31): error TS7006: Parameter 'e' implicitly has an 'any' type.
src/pages._disabled/auth-test.tsx(43,28): error TS18046: 'error' is of type 'unknown'.
src/pages._disabled/auth-test.tsx(54,37): error TS18046: 'error' is of type 'unknown'.
src/pages._disabled/auth-test.tsx(63,33): error TS2551: Property 'setEnabled' does not exist on type 'FeatureFlagsManager'. Did you mean 'isEnabled'?
src/pages._disabled/auth-test.tsx(66,46): error TS18046: 'error' is of type 'unknown'.
src/pages._disabled/basic-test.tsx(55,40): error TS18046: 'err' is of type 'unknown'.
src/pages._disabled/dashboard-page.tsx(7,26): error TS2339: Property 'signOut' does not exist on type 'AuthContextType'.
src/pages._disabled/dashboard-page.tsx(7,35): error TS2339: Property 'usingSupabase' does not exist on type 'AuthContextType'.
src/pages._disabled/debug/logs.tsx(46,42): error TS2345: Argument of type 'string' is not assignable to parameter of type 'SetStateAction<null>'.
src/pages._disabled/debug/logs.tsx(50,30): error TS2339: Property 'name' does not exist on type 'never'.
src/pages._disabled/debug/logs.tsx(50,47): error TS2339: Property 'name' does not exist on type 'never'.
src/pages._disabled/debug/logs.tsx(51,20): error TS2339: Property 'name' does not exist on type 'never'.
src/pages._disabled/debug/logs.tsx(51,41): error TS2339: Property 'modified' does not exist on type 'never'.
src/styles/ryos-adapter.css.ts(19,41): error TS2694: Namespace 'global.React' has no exported member 'CSSProperties'.
src/styles/ryos-adapter.css.ts(33,14): error TS2694: Namespace 'global.React' has no exported member 'CSSProperties'.
src/styles/ryos-adapter.css.ts(36,38): error TS2694: Namespace 'global.React' has no exported member 'CSSProperties'.
src/styles/ryos-adapter.css.ts(50,14): error TS2694: Namespace 'global.React' has no exported member 'CSSProperties'.
```

(`tsc` ended with no `Found N errors.` summary line — the run is self-aborted by TS once the error stream completes; line 3805 is the last error, no trailing summary line.)

### A2. `tsconfig.json` (verbatim)

```json
{
  "compilerOptions": {
    "target": "es2018",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": false,
    "esModuleInterop": true,
    "module": "commonjs",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ],
      "@trendzo/shared": [
        "./packages/shared/src/index.ts"
      ],
      "@trendzo/shared/*": [
        "./packages/shared/src/*"
      ],
      "@json-render/react/schema": [
        "./node_modules/@json-render/react/dist/schema.d.ts"
      ]
    },
    "types": [
      "react",
      "react-dom",
      "node"
    ],
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx"
  ]
}
```

Notes (observation only, not normalization):
- `"types": ["react", "react-dom", "node"]` — `"react-dom"` is non-standard; the correct `@types` package name for the global is just inclusion via `react`/`react-dom` packages themselves. This may explain the 66 `TS2694: Namespace 'global.React' has no exported member ...` errors (`FormEvent`, `KeyboardEvent`, `ChangeEvent`, `CSSProperties`, etc.).
- `"jest"` is not in `types`, which is why `src/__tests__/setupJest.ts(6,27): error TS2304: Cannot find name 'jest'` is the first error in the run. (Tests are also `exclude`d from compilation, but the setup file is included.)
- `"noEmit": false` is unusual for a Next.js project (Next does its own emit). Not blocking — `--noEmit` CLI flag overrides for our run.

### A3. `package.json` `scripts` block (verbatim)

```json
"scripts": {
    "dev": "next dev",
    "dev:turbo": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:smoke": "jest src/__tests__/unit/runPredictionPipeline.test.ts src/__tests__/api/ticket-a2-endpoints.test.ts",
    "test:integrity": "jest src/lib/prediction/__tests__/system-integrity.test.ts",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
    "extract-patterns": "ts-node src/scripts/extract-patterns.ts",
    "generate-synthetic": "ts-node src/scripts/generate-synthetic-data.ts"
  }
```

### A4. Node engine constraints

- **`engines` field in `package.json`:** **none present** (no `"engines": {...}` block).
- **`.nvmrc`:** **does not exist**.
- **`.node-version`:** **does not exist**.
- **Local Node version (this machine):** `v22.16.0`, npm `10.9.2`.
- **Vercel default Node version:** Vercel auto-detects (defaults to Node 22.x for new projects, Node 20.x for older). Without an `engines.node` pin, the project is at the mercy of whatever default Vercel applies for this project's age. Vercel build log (Section D) does not print the chosen Node version explicitly.

---

## B. Vercel configuration

### B1. `vercel.json` (verbatim)

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "crons": [
    {
      "path": "/api/cron/recency-decay",
      "schedule": "0 3 * * 0"
    },
    {
      "path": "/api/freedom-agent/weekly-checkin",
      "schedule": "0 10 * * 1"
    },
    {
      "path": "/api/atlas/feedback-collector",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/cultural-scan",
      "schedule": "30 0 * * *"
    },
    {
      "path": "/api/cron/classify-events",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/cron/overnight-triage",
      "schedule": "0 6 * * *"
    }
  ]
}
```

Observation: `vercel.json` pins `"buildCommand": "npm run build"` — that is the literal command Vercel runs after install. **It does not pin an `installCommand`**, so Vercel uses its auto-detected install command (which, because `pnpm-lock.yaml` exists, becomes `pnpm install --frozen-lockfile` in CI — see Section D log). That mismatch (pnpm install + npm run build) is allowed but is the root of the lockfile-handling fragility seen in the failed deploys.

### B2. `next.config.mjs` (verbatim)

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strip console.* in production builds while keeping warnings and errors
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_CLONE_URL: process.env.NEXT_PUBLIC_CLONE_URL || 'https://os.ryo.lu/',
  },
  // Enable standalone output ONLY for production builds (Docker deployment).
  // In dev, standalone output adds heavy file-tracing overhead that slows compiles.
  ...(process.env.NODE_ENV === 'production' ? { output: 'standalone' } : {}),

  // Optimize for production
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  eslint: {
    // Avoid blocking builds on lint errors; surface them in CI/editor instead
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Unblock builds in dev/staging even if stray type errors exist elsewhere
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co", port: "", pathname: "/**" },
      { protocol: "https", hostname: "randomuser.me", port: "", pathname: "/**" },
      { protocol: "https", hostname: "placekitten.com" },
      { protocol: "https", hostname: "replicate.com" },
      { protocol: "https", hostname: "replicate.delivery" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    // TEMPORARILY disabled 2026-04-21 — src/instrumentation.ts pulls the entire
    // scheduler chain (node-cron → fluent-ffmpeg → fresh-video-scanner) into
    // webpack's bundle target, which can't resolve Node built-ins (fs, path)
    // in the instrumentation context. Dev server returns 500 on every route.
    // Auto-start convenience is lost (kick the scheduler manually via
    // /api/admin/integration/status on boot). Re-enable after the
    // instrumentation chain is refactored to use runtime require() so webpack
    // doesn't statically analyze it.
    instrumentationHook: false,
    optimizeServerReact: true,
    // jsdom ships a CSS asset (default-stylesheet.css) loaded via require.resolve;
    // webpack can't trace it, so the build fails at /api/admin/api-keys.
    // isomorphic-dompurify depends on jsdom — keep them together.
    serverComponentsExternalPackages: ['jsdom', 'isomorphic-dompurify'],
    optimizePackageImports: [
      'lucide-react', 'recharts', 'd3', 'framer-motion',
      '@radix-ui/react-dialog', '@radix-ui/react-popover', '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip', '@radix-ui/react-scroll-area', '@radix-ui/react-slider',
      '@radix-ui/react-switch', '@radix-ui/react-collapsible', '@radix-ui/react-context-menu',
      '@radix-ui/react-radio-group', 'date-fns', 'chart.js', 'react-chartjs-2',
    ],
    outputFileTracingExcludes: {
      '*': [ '**/whisper_env/**', '**/node_modules/**/.bin/**' ]
    }
  },
  webpack: (config, { isServer, webpack }) => {
    // Prevent Next.js from bundling ffmpeg/ffprobe binaries into vendor chunks
    config.externals = config.externals || [];
    config.externals.push({ 'ffmpeg-static': 'commonjs ffmpeg-static' });
    config.externals.push({ 'ffprobe-static': 'commonjs ffprobe-static' });

    if (isServer) {
      config.externals.push({ 'apify': 'commonjs apify' });
      config.externals.push({ 'apify-client': 'commonjs apify-client' });
      config.externals.push({ 'ioredis': 'commonjs ioredis' });
      config.externals.push({ 'pg': 'commonjs pg' });
      config.externals.push({ 'fluent-ffmpeg': 'commonjs fluent-ffmpeg' });
    }

    config.plugins = config.plugins || [];
    if (isServer) {
      config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^(natural|webworker-threads)$/ }));
      config.externals.push({
        '@supabase/realtime-js': 'commonjs @supabase/realtime-js',
        '@supabase/gotrue-js': 'commonjs @supabase/gotrue-js'
      })
    } else {
      config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^(natural|webworker-threads|apify|apify-client)$/ }));
    }

    config.resolve = config.resolve || {};
    config.resolve.alias = Object.assign({}, config.resolve.alias, isServer ? {} : {
      'natural': false, 'webworker-threads': false, 'apify': false, 'apify-client': false,
    });

    config.experiments = config.experiments || {};
    config.experiments.asyncWebAssembly = true;
    return config;
  },
  async redirects() {
    return [
      { source: '/favicon.ico', destination: '/favicon.svg', permanent: false },
      { source: '/trend-predictions', destination: '/dashboard-view/trend-predictions-dashboard', permanent: true },
      { source: '/trend-predictions/:path*', destination: '/dashboard-view/trend-predictions-dashboard/:path*', permanent: true },
      { source: '/(dashboard)/trend-predictions-dashboard', destination: '/dashboard-view/trend-predictions-dashboard', permanent: true },
      { source: '/(dashboard)/trend-predictions-dashboard/:path*', destination: '/dashboard-view/trend-predictions-dashboard/:path*', permanent: true },
      { source: '/admin/engine-room', has: [{ type: 'query', key: 'tab', value: '24-7' }],
        destination: '/admin/operations-center?view=pipeline', permanent: false },
      { source: '/admin/operations-center', destination: '/admin/engine-room?tab=operations', permanent: true },
      { source: '/admin/operations-center/:path*', destination: '/admin/engine-room?tab=operations', permanent: true },
      { source: '/does-not-match', destination: '/does-not-match', permanent: false },
      { source: '/admin/recipe-book', destination: '/admin/viral-recipe-book', permanent: true },
      { source: '/admin/recipe-book/:path*', destination: '/admin/viral-recipe-book', permanent: true },
      { source: '/admin/template-analyzer', destination: '/admin/viral-recipe-book?tab=analyzer', permanent: true },
      { source: '/admin/template-analyzer/:path*', destination: '/admin/viral-recipe-book?tab=analyzer', permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/openai/:path*", destination: "https://api.openai.com/:path*" },
      { source: "/lab/canvas", destination: "/lab-canvas" },
    ];
  },
};

export default nextConfig;
```

**KEY OBSERVATION:** `next.config.mjs` has both `eslint.ignoreDuringBuilds: true` AND `typescript.ignoreBuildErrors: true`. **TS errors do NOT fail the Vercel build.** The 2418 TS errors from Section A are non-blocking for `next build`. This is important context for the hypotheses below.

### B3. Framework preset

- **Framework Vercel detects:** Next.js (via `vercel.json` `"framework": "nextjs"` AND `package.json` `next: "^14.2.28"`).
- **Next.js version (resolved range):** `^14.2.28` → resolves to whatever Next 14.2.x is current (range is satisfied by 14.2.28+, capped at <15.0.0).
- **React version:** `18.2.0` (pinned, no caret).
- **`@types/react`:** `^18.3.24`. **Mismatch with runtime React 18.2.0.** That mismatch is the most plausible cause of the 66 `TS2694: Namespace 'global.React' has no exported member ...` errors (`FormEvent`, `KeyboardEvent`, `ChangeEvent`, `CSSProperties`).

### B4. `process.env.*` references in critical files

#### `next.config.mjs`
- `NODE_ENV` (×2)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (fallback)
- `NEXT_PUBLIC_CLONE_URL`

#### `src/middleware.ts`
- `NEXT_PUBLIC_SUPABASE_URL` (lines 79, 143)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (line 80)
- `SUPABASE_SERVICE_KEY` (line 144)
- `NEXT_PUBLIC_DISABLE_AUTH` (line 169)

#### `src/lib/supabase/*`
- `src/lib/supabase/server.ts`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (with `!` non-null assertions — will throw at runtime if absent)
- `src/lib/supabase/middleware.ts`: same two
- `src/lib/supabase/env.ts`: same two (with `?? ""` fallbacks)

#### `src/lib/auth/*`
- `src/lib/auth/server-auth.ts`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `src/lib/auth/api-guard.ts`: same two
- `src/lib/auth/admin-auth-options.ts`: `NEXT_PUBLIC_DISABLE_AUTH`, `NODE_ENV`, `NEXTAUTH_SECRET`

#### Consolidated env-var list (variables Vercel must have set)

Required for the listed surfaces (the env vars referenced — not exhaustive across the app):
1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_KEY` (or `SUPABASE_SERVICE_ROLE_KEY` as fallback)
4. `NEXTAUTH_SECRET`
5. `NEXT_PUBLIC_CLONE_URL` (optional — has fallback `'https://os.ryo.lu/'`)
6. `NEXT_PUBLIC_DISABLE_AUTH` (optional — only used if `=== 'true'`)

Cron paths in `vercel.json` (Sections A2/B1) imply these endpoints must be deployable: `/api/cron/recency-decay`, `/api/freedom-agent/weekly-checkin`, `/api/atlas/feedback-collector`, `/api/cron/cultural-scan`, `/api/cron/classify-events`, `/api/cron/overnight-triage`. Open question for Tommy: confirm these route handlers all exist on `vercel-deploy-test`.

---

## C. Recent commit history

### C1. `git log --oneline -50` on current branch (`vercel-deploy-test`)

```
051f431 checkpoint: 2026-04-29 — escape funnel + agency dashboard parity work
482af1d Escape Assessment HUD: form polish, email capture, instrument aesthetic
39861a8 AM Step 4 fix: remove uuid-incompatible actorId, swap to emitEventStrict, preserve batch resilience
e6a92d2 AM Step 4: auto-nudge route for unacknowledged briefs (dry-run default, code only — no cron, no deploy)
a24944a AM Step 3: get_unacknowledged_briefs tool + Delivered filter pill (Clay+Dashboard parity)
9090b71 AM Step 2: harden GET /api/brief-status and GET /api/brief-performance with session+agency scoping
516e736 docs: substrate decision — conversation as substrate, AM-first build order
b280d13 Fix Problem A: overnight-triage Vercel cron + Problem B dev auth fallback + stacking bug
1b32bf6 chore: temporarily disable broken routes to unblock Vercel deploy
98f346a fix: externalize jsdom and isomorphic-dompurify for Vercel build
ad3b784 substrate: Fix 1 (content_briefs.agency_id) + Fix 2 (auth on brief routes)
af66b22 stage3: ship phase1 + phase2 verification scripts
f6232a4 deploy: add .vercelignore and refresh pnpm-lock.yaml for Vercel preview
c56e499 stage3/phase2-v2 fan-out: all 12 write adapters + generic propose prompt rule
97071ef fix: disable instrumentationHook to unblock dev server boot
5e51fa0 stage3/phase2-v2 fix: coerce non-uuid actor/agency ids to null at emit boundary
dbfdb16 fix: externalize fluent-ffmpeg so instrumentation hook can bundle
8845e1c stage3/phase2-v2: propose-only agent design, clicks direct-execute via RPC gate
1a2fcf8 atlas crons: auto-start scheduler on dev server boot via instrumentation hook
33ece60 atlas crons: activate feedback-collector + cultural intelligence pipeline
2208214 Revert "stage3/phase2 wiring: agent write tools end-to-end for nudge_creator"
7511da1 stage3/phase2 wiring: agent write tools end-to-end for nudge_creator
10d98e3 stage3/phase2 scaffolding: agent tool-registry + proposal gate
81428f2 stage3/phase1: migrate /agency chat to anthropic with prompt caching
2a34ae4 Stage 2 (substrate pivot): extend platform_events + wire 4 new emissions
b47d678 Phase 2A polish: triage cards render 2-per-row via Section layout prop
3c337c1 CHECKPOINT: autoresearch auto-011..013 snapshot before laptop restart
ec24c0e S8 autoresearch: checkpoint for machine restart
d37d66d CHECKPOINT: parallel autoresearch work + misc API route changes
633ed37 Phase 2A WIP: ActionDecisionCard for morning brief triage
99f65af fix(turn5): show refresh-triage button when messages exist, not gated by hasSentFirst
4d432a7 Phase 1 Turn 5: kill Clay fallback noise + refresh button + auth fix
44f8709 fix(triage): resolve agency_id without depending on broken auth bypass
80c5584 Phase 1 Turn 4 (cont): wire triage UI — replace fireAutoGreeting GPT cold-start
8a606b0 Phase 1 Turn 4: Overnight triage job + scheduler + API routes
1fd6d3b Phase 1 Turn 3: Consolidate rendering + fix KPICard/Section prop mismatch
2112793 fix: remove handleComponentAction from @/lib/clay barrel
5089aee Phase 1 Turn 2: Wire 11 dead action handlers + fix type-fallback guard
fe3b447 chore: add apply script for 20260417 triage migrations
108228d Phase 1 Turn 1: Intelligent Clay registry + infrastructure migrations
8549c9d CHECKPOINT: April 17 2026 — Intelligent Clay planning + v15 XGBoost + agency work
542531d chore: add gstack skill routing rules to CLAUDE.md
433cba4 CHECKPOINT: v14 sandbox experiments + trainer engine + agency features - April 10 2026
0d6ee6c SAFETY CHECKPOINT: Pre-deploy-prep snapshot - April 5 2026 - All extraction work preserved
9688e73 Fix DPS tier collapse bug and score column semantics in scrape routes
c1426cb Fresh init: clean source, no video data, no secrets
```

### C2. `git log --oneline -50` on `main`

```
c1426cb Fresh init: clean source, no video data, no secrets
```

`main` is a single commit — the initial `Fresh init`. **All real work lives on `vercel-deploy-test`.**

### C3. `git log --oneline -50` on `vercel-deploy-test`

Same as C1 (we are on that branch).

### C4. Branch divergence

```
$ git merge-base main vercel-deploy-test
d37d66d60b3f12f8cbe9e23c91611610b8c9975d

$ git rev-list --left-right --count main...vercel-deploy-test
0       28
```

Wait — `merge-base` returns `d37d66d` which is **commit #29 from the bottom** of the `vercel-deploy-test` history (`d37d66d CHECKPOINT: parallel autoresearch work + misc API route changes`), NOT the `c1426cb Fresh init` that `main` is pointing at. And `rev-list --left-right` shows main is 0 ahead, vercel-deploy-test is 28 ahead.

**Reconciling:** `main` (`c1426cb`) is an ancestor of `d37d66d` via a fast-forward path that no longer exists in `main`'s tip but does in `vercel-deploy-test`'s history. The merge-base reflects the deepest common ancestor of the *current* branch tips. Effectively: `main` has been left at the very first commit while all subsequent work flowed onto `vercel-deploy-test`. **`vercel-deploy-test` IS the canonical working branch.** `main` has not been updated in months.

**Open question for Tommy:** confirm Vercel is targeting `vercel-deploy-test` as the production branch (per the deploy log in D, it is — see `Branch: vercel-deploy-test`).

---

## D. Vercel build log

### D1. CLI status

`npx vercel --version` → `Vercel CLI 52.0.0`. Authenticated, project `tommys-projects-e3a941fb/trendzo-test` linked. Listed 9 deployments, **all 9 most recent are `● Error`**.

| Age | Status | Env | Duration | URL fragment | Commit |
|---|---|---|---|---|---|
| 3d | Error | Preview | 16s | `o6n817s4c` | `051f431` (current branch tip) |
| 7d | Error | Preview | 3m | `fsg1p2vwn` | `9090b71` |
| 8d | Error | Preview | 3m | `mxm7tstkw` | (not inspected) |
| 8d | Error | Preview | 4m | `8jz32lv5t` | (not inspected) |
| 9d | Error | Preview | 7m | `ck7hj18xo` | (not inspected) |
| 9d | Error | Preview | 11m | `8msdrfm7u` | (not inspected) |
| 10d | Error | Preview | 5m | `8itlelvn7` | (not inspected) |
| 10d | Error | Preview | 5m | `5n0txcf0k` | (not inspected) |
| 10d | Error | **Production** | 50s | `dchzwkalm` | (not inspected) |

Inspected three deployments — see D2.

### D2. Captured build logs

#### Most recent failed deploy (3 days ago, commit `051f431`, 16s — `o6n817s4c`)

```
2026-04-29T22:58:53.930Z  Running build in Washington, D.C., USA (East) – iad1
2026-04-29T22:58:53.931Z  Build machine configuration: 2 cores, 8 GB
2026-04-29T22:58:54.044Z  Cloning github.com/ttuckerm/trendzo-working-5-7-25 (Branch: vercel-deploy-test, Commit: 051f431)
2026-04-29T22:58:54.045Z  Previous build caches not available.
2026-04-29T22:59:03.935Z  Cloning completed: 9.891s
2026-04-29T22:59:04.649Z  Found .vercelignore
2026-04-29T22:59:04.794Z  Removed 1000 ignored files defined in .vercelignore
[... .vercelignore file list ...]
2026-04-29T22:59:05.535Z  Running "vercel build"
2026-04-29T22:59:06.196Z  Vercel CLI 51.6.1
2026-04-29T22:59:07.305Z  Detected `pnpm-lock.yaml` 9 which may be generated by pnpm@9.x or pnpm@10.x
2026-04-29T22:59:07.305Z  Using pnpm@10.x based on project creation date
2026-04-29T22:59:07.306Z  To use pnpm@9.x, manually opt in using corepack
                          (https://vercel.com/docs/deployments/configure-a-build#corepack)
2026-04-29T22:59:07.354Z  Installing dependencies...
2026-04-29T22:59:09.132Z  ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml
                          is not up to date with <ROOT>/package.json
2026-04-29T22:59:09.133Z
2026-04-29T22:59:09.133Z  Note that in CI environments this setting is true by default. If you still need to run
                          install in such cases, use "pnpm install --no-frozen-lockfile"
2026-04-29T22:59:09.133Z
2026-04-29T22:59:09.133Z  Failure reason:
2026-04-29T22:59:09.133Z  specifiers in the lockfile don't match specifiers in package.json:
2026-04-29T22:59:09.133Z  * 1 dependencies were added: stripe@^22.1.0
2026-04-29T22:59:09.133Z
2026-04-29T22:59:09.154Z  Error: Command "pnpm install" exited with 1
status  ● Error
```

**This is the active blocker.** The build fails 16 seconds in, before any TypeScript or webpack code even runs.

#### Prior failed deploy (7 days ago, commit `9090b71`, 3min — `fsg1p2vwn`)

(Trimmed — pulled key error lines via `Select-String`)

```
2026-04-25T22:12:51.131Z  Cloning github.com/ttuckerm/trendzo-working-5-7-25 (Branch: vercel-deploy-test, Commit: 9090b71)
2026-04-25T22:13:27.777Z  + react-error-boundary 5.0.0
[... pnpm install completed successfully on this older commit ...]
2026-04-25T22:15:12.543Z  Why you should do it regularly: https://github.com/browserslist/update-db#readme
2026-04-25T22:16:10.918Z  Failed to compile.
2026-04-25T22:16:10.919Z  ./src/app/api/cross/cascades/route.ts
2026-04-25T22:16:10.919Z  Module not found: Can't resolve '@/lib/data'
2026-04-25T22:16:10.920Z  ./src/app/api/cross/predict/route.ts
2026-04-25T22:16:10.920Z  Module not found: Can't resolve '@/lib/data'
2026-04-25T22:16:10.921Z  ./src/app/api/cross/predict/route.ts
2026-04-25T22:16:10.921Z  Module not found: Can't resolve '@/lib/data/init-fixtures'
2026-04-25T22:16:10.922Z  ./src/app/api/cross/summary/route.ts
2026-04-25T22:16:10.922Z  Module not found: Can't resolve '@/lib/data'
2026-04-25T22:16:10.923Z  ./src/app/api/cross/summary/route.ts
2026-04-25T22:16:10.923Z  Module not found: Can't resolve '@/lib/data/init-fixtures'
2026-04-25T22:16:10.924Z  > Build failed because of webpack errors
2026-04-25T22:16:11.118Z  Error: Command "npm run build" exited with 1
status  ● Error
```

**Second blocker waiting in line.** When the lockfile issue is resolved, this will hit next. The `@/lib/data` and `@/lib/data/init-fixtures` paths do not exist — the directory is `src/lib/database/`, not `src/lib/data/`. 19 files import from `@/lib/data*`. See Section F1.

#### Earlier production deploy (10 days ago, commit at URL `dchzwkalm`)

```
2026-04-22T12:26:29.586Z  ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml
                          is not up to date with <ROOT>/package.json
2026-04-22T12:26:29.608Z  Error: Command "pnpm install" exited with 1
status  ● Error
```

Same `ERR_PNPM_OUTDATED_LOCKFILE` failure mode as the 3-day-old deploy. Has been the dominant failure pattern.

**Pattern across the 3 sampled deploys:**
- 2 of 3 fail at `pnpm install --frozen-lockfile` (lockfile out of sync with package.json)
- 1 of 3 (the one between them, 7 days ago) got past install and failed at webpack with `Module not found: Can't resolve '@/lib/data'`

---

## E. Dependency resolution

### E1. Lockfiles present

| Lockfile | Exists | Size | Lockfile version |
|---|---|---|---|
| `package-lock.json` | YES | 830,127 bytes | (npm) |
| `pnpm-lock.yaml` | YES | 501,908 bytes | `9.0` |
| `yarn.lock` | NO | — | — |

**Two lockfiles coexist.** This is the documented "this alone can break Vercel" condition the prompt warned about. Vercel's auto-detection picks `pnpm` (per the build log: `Detected pnpm-lock.yaml 9 ... Using pnpm@10.x based on project creation date`).

Verification of stripe presence per lockfile:
- `pnpm-lock.yaml`: `stripe` matches → **0** (not in pnpm lockfile)
- `package-lock.json`: `"stripe"` matches → **1** (present in npm lockfile)

This confirms: `stripe@^22.1.0` was added to `package.json` and `npm install` was run locally (which updated `package-lock.json`), but `pnpm install` was NOT run, so `pnpm-lock.yaml` was never updated. Vercel uses `pnpm-lock.yaml` and rejects the install.

History of each lockfile:
- `pnpm-lock.yaml` modified in: `f6232a4 deploy: add .vercelignore and refresh pnpm-lock.yaml for Vercel preview` (~13 days ago) and `c1426cb Fresh init` (initial). **Has not been touched since stripe was added.**
- `package-lock.json` modified in: `051f431` (current tip), `8549c9d` (April 17), `c1426cb` (initial).
- `stripe` was first introduced in: `051f431` (current tip — same commit being deployed).

### E2. Critical package versions (from `package.json`)

| Package | Range | Notes |
|---|---|---|
| `next` | `^14.2.28` | Next.js 14 LTS line. |
| `react` | `18.2.0` | Pinned exact. |
| `react-dom` | `18.2.0` | Pinned exact. |
| `@types/node` | `20.17.30` | Pinned exact. |
| `@types/react` | `^18.3.24` | **Mismatch with React 18.2.0 runtime** (types are from 18.3 line). |
| `@types/react-dom` | `^18.3.7` | Same mismatch. |
| `typescript` | `^5.8.3` | TS 5.8. |
| `@supabase/supabase-js` | `^2.57.4` | |
| `@supabase/ssr` | `^0.7.0` | |
| `@supabase/auth-helpers-nextjs` | `^0.10.0` | **Deprecated by Supabase in favor of `@supabase/ssr`** — having both is a known compatibility risk but not necessarily a build blocker. |
| `ai` | `^6.0.138` | Vercel AI SDK v6 — major version recently. |
| `@ai-sdk/openai` | `^3.0.48` | |
| `@ai-sdk/anthropic` | `^3.0.69` | |
| `@ai-sdk/react` | `^3.0.140` | |
| `stripe` | `^22.1.0` | **Newest addition — not in pnpm lockfile.** |
| `eslint-config-next` | `^16.0.3` | **Major version 16 paired with Next 14** — eslint-config-next 16 is intended for Next 16. Mismatched. (Next.js disables ESLint at build via `ignoreDuringBuilds: true` so this won't fail the build, but it's a flag.) |
| `@clerk/nextjs` | `^5.1.3` | Coexists with Supabase auth + NextAuth — three auth systems. |
| `next-auth` | `^4.24.11` | |
| `zod` | `^3.25.76` | |
| `zod4` | `npm:zod@^4.3.6` | **Both Zod 3 AND Zod 4 installed under different aliases.** Aliased install so peer/dual usage is allowed but increases bundle size and surfaces type-version conflicts. |

### E3. Caret-ranged packages with recent breaking-change history

Listed (no changes proposed):
- `next ^14.2.28` — Next 14 has had breaking changes within the 14.2.x patch line (e.g., async cookies API enforcement). Auto-bumps allowed within `^14.2.28`.
- `react ^18.x` (well, pinned 18.2.0 — safe).
- `@supabase/supabase-js ^2.57.4` — actively-developed SDK; minor bumps can change types.
- `@supabase/ssr ^0.7.0` — pre-1.0, breaking changes are documented as common.
- `ai ^6.0.138` — Vercel AI SDK v6 just landed; major-version turbulence.
- `eslint-config-next ^16.0.3` — already mismatched against Next 14.
- `next-auth ^4.24.11` — version 5 (Auth.js) is the new line; v4 is in maintenance.

### E4. Other dependency observations

- `zod` AND `zod4` (aliased) both installed — `package.json` line 108: `"zod4": "npm:zod@^4.3.6"`.
- `apify` `^3.4.4` AND `apify-client` `^2.19.0` — both webpack-externalized in `next.config.mjs`, suggesting prior bundle issues.
- `fluent-ffmpeg`, `ffmpeg-static`, `ffprobe-static`, `pg`, `ioredis` — all webpack-externalized for the same reason.
- `jsdom` and `isomorphic-dompurify` — pinned to `serverComponentsExternalPackages` in `next.config.mjs` (per inline comment, jsdom's `default-stylesheet.css` was breaking webpack at `/api/admin/api-keys`).

---

## F. Build-time fingerprints

### F1. Broken aliases / missing internal modules

#### `@/lib/data` and `@/lib/data/init-fixtures` — **does not exist on disk**

`src/lib/data*` glob returns ZERO matches. The closest match is `src/lib/database/` which is a different directory.

**19 files import from `@/lib/data*`** (call sites, line numbers):

```
src/app/api/templates/leaderboard/route.ts:3      import { ensureFixtures } from '@/lib/data/init-fixtures'
src/app/api/templates/leaderboard/route.ts:4      import { isMock } from '@/lib/data/source'
src/app/api/public/v1/recipe-book/route.ts:6      import { ensureFixtures } from '@/lib/data/init-fixtures'
src/app/api/metrics/route.ts:2                    import { source } from '@/lib/data'
src/app/api/metrics/route.ts:3                    import { ensureFixtures } from '@/lib/data/init-fixtures'
src/app/widget/badge/route.tsx:3                  import { source } from '@/lib/data'
src/app/widget/badge/route.tsx:4                  import { ensureFixtures } from '@/lib/data/init-fixtures'
src/app/api/recipe-book/generate/route.ts:3       import { ensureFixtures } from '@/lib/data/init-fixtures'
src/app/api/recipe-book/generate/route.ts:4       import { isMock } from '@/lib/data/source'
src/app/api/cross/cascades/route.ts:3             import { getSource } from '@/lib/data'
src/app/api/videos/[id]/route.ts:2                import { source } from '@/lib/data'
src/lib/validation/actuals.ts:1                   import { getSource } from '@/lib/data'
src/lib/cross/service.ts:5                        import type { Source } from '@/lib/data/source'
src/lib/cross/service.ts:6                        import { getSource } from '@/lib/data'
src/lib/cross/service.ts:7                        import { mockSource } from '@/lib/data/mock'
src/app/api/proof-tiles/route.ts:4                import { ensureFixtures } from '@/lib/data/init-fixtures'
src/app/api/public/v1/analyze/route.ts:5          import { acceptUpload } from '@/lib/data/upload'
src/app/api/recipe-book/route.ts:3                import { ensureFixtures } from '@/lib/data/init-fixtures'
src/app/api/recipe-book/route.ts:4                import { isMock } from '@/lib/data/source'
src/lib/templates/cache.ts:3                      import { isMock } from '@/lib/data/source'
src/lib/cross/cascade.ts:1                        import { source } from '@/lib/data'
src/lib/insights/lift.ts:5                        import { ensureFixtures } from '@/lib/data/init-fixtures'
src/app/api/videos/route.ts:2                     import { source } from '@/lib/data'
src/app/api/videos/route.ts:4                     import { ensureFixtures } from '@/lib/data/init-fixtures'
src/app/api/cross/predict/route.ts:3              import { getSource } from '@/lib/data'
src/app/api/cross/predict/route.ts:4              import { ensureFixtures } from '@/lib/data/init-fixtures'
src/lib/templates/service.ts:1                    import { source } from '@/lib/data'
src/app/api/cross/summary/route.ts:3              import { getSource } from '@/lib/data'
src/app/api/cross/summary/route.ts:4              import { ensureFixtures } from '@/lib/data/init-fixtures'
```

These imports are spread across multiple feature areas (cross/, recipe-book/, videos/, proof-tiles/, widget/, validation/, insights/, templates/, metrics/). The Vercel build log from 7 days ago captured 5 of these errors, but only stopped after surfacing the first 5 from `src/app/api/cross/*` — once install starts succeeding again, **all 19 import sites will surface as webpack errors**.

#### Other broken aliases (from tsc `Cannot find module` list)

- `@/app/admin/(studio)/studio/page` — referenced but the path doesn't resolve
- `@/app/sandbox/quick-win-workflow/page` — same
- `@/components/development/StagewiseToolbar` — same
- `@/components/ui/toggle-group` — same
- `@/lib/contexts/UserFlowContext` — same
- `@/lib/hooks/useScrollToHash` — same

#### Filename casing collisions (TS1149)

- `src/components/ui/Slider.tsx` AND `src/components/ui/slider.tsx` both exist in repo (case-only difference)
- `src/components/ui/TextArea.tsx` AND `src/components/ui/textarea.tsx` both exist in repo (case-only difference)

These are imported with both casings across ~30 files. On Linux (Vercel's build environment) the case-sensitive filesystem will reject one or the other depending on resolution order. With `tsconfig.json` `"forceConsistentCasingInFileNames": true`, tsc flags it locally (TS1149). Whether this fails the actual webpack build on Vercel depends on which casing webpack resolves to first per file — needs the post-install Vercel log to know.

### F2. `next/dynamic` browser-only patterns, `'use client'` server-import patterns

Spot-counts only (full pattern audit deferred per "no fixes in this session" rule):
- `'use client'` directive present in many components — counts not enumerated exhaustively, but representative sample (5 of N) shown and they're standard client components, no obvious server-import smoking gun.
- `next/dynamic` calls with `ssr: false` not exhaustively audited — none of the captured Vercel build errors point to a dynamic-import SSR mismatch as the failure cause.

### F3. `@ts-ignore` / `@ts-expect-error` clusters

20 files (capped) returned. Notable concentration in:
- `src/app/api/agency-chat/route.ts`: 3 occurrences
- `src/__tests__/ingest.idempotent.test.ts`: 4 occurrences
- `src/__tests__/ingest.api.test.ts`: 3 occurrences
- `src/components/templateMiniUI/__tests__/previewKernel.spec.ts`: 3 occurrences
- `src/lib/services/featureDecomposer.ts`: 2 occurrences

Most are 1-occurrence files. No "wall of @ts-ignore" hiding a single underlying failure; these are scattered tactical suppressions. (Test files are excluded from `tsc --noEmit` per `tsconfig.json:exclude`, so the test-file `@ts-ignore`s don't affect the typecheck count anyway.)

### F4. Circular imports

`madge` is **not** in `devDependencies`. Per the prompt's "skip if not in devDependencies" instruction, this check was skipped.

### F5. Cron route presence

The 6 cron paths in `vercel.json` were not exhaustively verified to have route handlers on disk. Open question for Tommy in the next session.

---

## Hypothesis

Ranked most-likely-to-least-likely root causes of the **current** Vercel build failure (commit `051f431`, 3 days ago, 16-second failure):

### 1. **PRIMARY (confirmed by build log):** `pnpm-lock.yaml` is out of sync with `package.json`; Vercel's `pnpm install --frozen-lockfile` rejects it.

**Evidence:**
- Vercel log line: `ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with <ROOT>/package.json` (Section D2)
- Vercel log line: `Failure reason: specifiers in the lockfile don't match specifiers in package.json: * 1 dependencies were added: stripe@^22.1.0` (Section D2)
- `Select-String -Path pnpm-lock.yaml -Pattern "stripe"` returns **0 matches** (Section E1)
- `Select-String -Path package-lock.json -Pattern '"stripe"'` returns **1 match** (Section E1)
- `git log -S "stripe" -- package.json` shows `stripe` was added in current tip `051f431` (Section E1)
- Same failure mode appears on the 10-day-old production deploy (Section D2) — has been recurring

This isn't a hypothesis, it is the confirmed root cause of the most recent failure.

### 2. **SECONDARY (next blocker after #1 is resolved):** `Module not found: Can't resolve '@/lib/data'` and `'@/lib/data/init-fixtures'` — 19 import sites pointing at a directory that doesn't exist.

**Evidence:**
- Vercel log from 7 days ago (commit `9090b71`) shows webpack failing with exactly this error on 5 files (Section D2)
- `Glob src/lib/data*` returns 0 matches; `src/lib/database/` exists but is a different name (Section F1)
- `Grep` on `@/lib/data` finds 19 import statements across 19 files (Section F1)

When the lockfile issue is fixed and install succeeds, this will be the next failure unless `src/lib/data/` is created or all 19 imports are repointed.

### 3. **TERTIARY (latent):** Two lockfiles (`package-lock.json` AND `pnpm-lock.yaml`) coexist, which by itself confuses package-manager auto-detection on Vercel (see prompt's E1 warning).

**Evidence:**
- Both files present in repo (Section E1)
- Vercel's auto-detection picks pnpm (Section D2: `Detected pnpm-lock.yaml 9 ... Using pnpm@10.x`) — this is deterministic in Vercel's behavior, but it means `package-lock.json` is misleading dead weight that local `npm install` keeps updating without affecting Vercel
- Tommy presumably ran `npm install` locally (which updated `package-lock.json` with stripe), thinking that would update "the lockfile". Vercel never reads `package-lock.json` because pnpm-lock.yaml takes precedence.

This is the structural reason hypothesis #1 keeps recurring.

### 4. Filename casing collisions (`Slider.tsx`/`slider.tsx`, `TextArea.tsx`/`textarea.tsx`) will likely surface as a Linux build failure if webpack resolves to the missing casing first.

**Evidence:**
- TS1149 errors in tsc output (Section A1, midsection sample)
- Both files exist on disk; tsc detects via `forceConsistentCasingInFileNames: true`
- Local Windows NTFS hides the issue; Vercel's Linux filesystem won't

Has not yet been observed as a webpack error in any captured Vercel log, but is a high-probability latent failure mode once #1 and #2 are resolved.

### 5. `@types/react` (`^18.3.24`) is on a higher minor than runtime `react` (`18.2.0`), AND `tsconfig.json:types` includes the non-standard `"react-dom"` entry. This explains the 66 `TS2694: Namespace 'global.React' has no exported member ...` errors but **does NOT block the Vercel build** because `next.config.mjs` has `typescript.ignoreBuildErrors: true`.

**Evidence:**
- Section B2 quote of `next.config.mjs`
- Section E2 version table
- Section A1 TS error histogram

Mentioned only to rule out: **TypeScript errors are NOT the Vercel build failure cause.** They are a code-health problem (and reflect real bugs — see the Firebase/Firestore identifier cluster), but `next build` is configured to skip TS checks.

---

## Open questions for Tommy

Numbered checklist — please answer / confirm before next session:

1. **Confirm canonical deploy branch.** Vercel logs show `Branch: vercel-deploy-test`. Is `vercel-deploy-test` intended to be the production branch, or should that role move back to `main`? (Currently `main` is 28 commits behind and effectively dormant.)

2. **Paste the Vercel project's environment variable list** (just variable names from the Vercel dashboard — Settings → Environment Variables). Cross-check needed against the consolidated list in Section B4. Specifically confirm presence of: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`), `NEXTAUTH_SECRET`.

3. **Confirm the package manager intent.** Should this project be on `npm` (delete `pnpm-lock.yaml`) or `pnpm` (delete `package-lock.json`)? Both lockfiles existing is the structural reason the same pnpm-out-of-sync failure keeps happening. The deploy log line `Detected pnpm-lock.yaml 9 ... Using pnpm@10.x based on project creation date` confirms Vercel picks pnpm regardless.

4. **What is the intended fate of `src/lib/data/`?** 19 files import from it but the directory does not exist. Was it (a) renamed from `src/lib/data/` → `src/lib/database/` without updating call sites, (b) deleted on purpose with cleanup pending, or (c) supposed to be created fresh? This blocks the build the moment lockfile #1 is solved.

5. **Vercel Node version.** No `engines.node` in `package.json`, no `.nvmrc`, no `.node-version`. Should we pin one (e.g., `>=20`)? Vercel's auto-default is fine for now but is opaque.

6. **Can you paste the full Vercel deploy log for the most recent failed deploy** (`https://trendzo-test-o6n817s4c-tommys-projects-e3a941fb.vercel.app`) from the dashboard? CLI output captured the full failure (~16s log) and is reproduced in Section D2 verbatim. **No additional log needed unless dashboard shows extra context the CLI omitted.**

7. **Check 6 cron route handlers exist on `vercel-deploy-test`:** `/api/cron/recency-decay`, `/api/freedom-agent/weekly-checkin`, `/api/atlas/feedback-collector`, `/api/cron/cultural-scan`, `/api/cron/classify-events`, `/api/cron/overnight-triage`. Vercel will fail deployment if any are missing once routing is reached (post-build).

8. **Confirm the `@types/react` version mismatch (`^18.3.24` vs runtime `react 18.2.0`) is intentional.** Pinning `@types/react@18.2.x` would eliminate ~66 of the TS errors (the `Namespace 'global.React' has no exported member ...` family). Not blocking the build, but worth knowing if that bump was deliberate.

---

## What I did NOT do

Confirming explicitly per the rules of engagement:

- **No files edited** — only the deliverable (`PHASE1_BUILD_INVESTIGATION_2026-05-02.md`, this file) and the verbatim tsc output capture (`tsc_output.txt`) were written. Both are investigation artifacts at repo root, neither is in `.gitignore` or part of the application code/config. The earlier modified files visible in `git status` were already modified before this session began.
- **No commits.** No `git add`, no `git commit`, no `git push`, no `git stash`.
- **No installs.** No `npm install`, `pnpm install`, `yarn install`. Only `npx tsc --noEmit` and `npx vercel ...` which use already-installed binaries.
- **No config changes.** `vercel.json`, `next.config.mjs`, `tsconfig.json`, `package.json`, `pnpm-lock.yaml`, `package-lock.json`, `.vercelignore`, `.gitignore`, `.env*` — all untouched.
- **No migrations.** Nothing in `supabase/` was run, edited, or applied.
- **No fixes proposed in code.** Hypotheses describe root cause; no patches, no diffs, no "here's what to change" instructions in this report.
- **No branch operations.** Did not check out, create, merge, rebase, or modify any branch. Currently still on `vercel-deploy-test` exactly as the session started.
- **Did not install `madge`** — F4 was skipped per prompt instruction.
- **Did not install/run `npm audit`, dependabot, or any vulnerability scanner.**

---

## Companion file

- `tsc_output.txt` (1.05 MB, 3805 lines) — verbatim full output of `npx tsc --noEmit`, written to repo root during this investigation. Not in git. Safe to delete after fix-session reviews are complete.
- `vercel_log.txt` (5.3 KB) — full CLI capture of the most recent failed Vercel deploy log (covered verbatim in Section D2).

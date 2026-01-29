# Codebase Structure

**Analysis Date:** 2026-01-14

## Directory Layout

```
trendzo/
├── .claude/              # Claude Code configuration
│   ├── agents/          # Agent playbooks
│   ├── commands/        # Slash command definitions
│   └── workflows/       # Multi-step workflows
├── .planning/           # GSD planning artifacts (new)
│   └── codebase/       # Codebase analysis docs
├── docs/                # Documentation
├── fixtures/            # Test fixtures and sample data
├── python-services/     # Python ML microservice
├── scripts/             # Build and utility scripts
├── src/                 # Main application source
│   ├── __tests__/      # Test files
│   ├── app/            # Next.js App Router
│   ├── components/     # React components
│   ├── config/         # Configuration
│   ├── hooks/          # React hooks
│   ├── lib/            # Core business logic
│   └── types/          # TypeScript types
├── supabase/            # Supabase configuration
│   └── migrations/     # Database migrations
└── package.json         # Project manifest
```

## Directory Purposes

**src/app/**
- Purpose: Next.js App Router pages and API routes
- Contains: Page components, layouts, API route handlers
- Key files: `layout.tsx`, `page.tsx`, `globals.css`
- Subdirectories: `admin/`, `api/`, `membership/`

**src/lib/**
- Purpose: Core business logic and services
- Contains: Prediction pipeline, orchestration, utilities
- Key files: `src/lib/prediction/runPredictionPipeline.ts`
- Subdirectories: `prediction/`, `orchestration/`, `services/`, `components/`

**src/lib/prediction/**
- Purpose: Canonical prediction pipeline
- Contains: Pipeline runner, artifact caching, configuration
- Key files: `runPredictionPipeline.ts`, `artifact-cache.ts`, `prediction-config.ts`

**src/lib/orchestration/**
- Purpose: Component orchestration for predictions
- Contains: KaiOrchestrator, parallel execution, validation gates
- Key files: `kai-orchestrator.ts`, `parallel-execution.ts`

**src/lib/rubric-engine/**
- Purpose: LLM-based rubric scoring (Pack 1/2)
- Contains: Unified grading, editing coach runners and schemas
- Key files: `unified-grading-runner.ts`, `editing-coach-runner.ts`

**src/components/**
- Purpose: Reusable React components
- Contains: UI primitives, admin components, control center
- Subdirectories: `admin/`, `control-center/`, `ui/`

**src/__tests__/**
- Purpose: Test files organized by type
- Contains: API tests, unit tests, integration tests
- Subdirectories: `api/`, `unit/`, `integration/`, `lib/`

**python-services/**
- Purpose: Python ML model service
- Contains: FastAPI app, XGBoost model inference
- Key files: `main.py`, `requirements.txt`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Home page
- `python-services/main.py` - Python service entry

**Configuration:**
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript config
- `tailwind.config.ts` - Tailwind CSS config
- `vercel.json` - Vercel deployment config

**Core Logic:**
- `src/lib/prediction/runPredictionPipeline.ts` - Canonical pipeline
- `src/lib/orchestration/kai-orchestrator.ts` - Component orchestrator
- `src/lib/rubric-engine/unified-grading-runner.ts` - Pack 1 grading

**Prediction Endpoints:**
- `src/app/api/predict/route.ts` - Standard prediction
- `src/app/api/kai/predict/route.ts` - Kai prediction
- `src/app/api/admin/predict/route.ts` - Admin prediction
- `src/app/api/admin/super-admin/quick-predict/route.ts` - Quick prediction

**Testing:**
- `src/__tests__/unit/` - Unit tests
- `src/__tests__/api/` - API integration tests
- `jest.config.js` - Jest configuration

**Documentation:**
- `CLAUDE.md` - AI assistant instructions
- `docs/COMPONENT_RUBRIC_AUDIT.md` - Component status

## Naming Conventions

**Files:**
- kebab-case for modules: `kai-orchestrator.ts`, `run-prediction-pipeline.ts`
- PascalCase for React components: `AdminSidebar.tsx`, `StatCard.tsx`
- `*.test.ts` for test files
- `route.ts` for API routes (Next.js convention)

**Directories:**
- kebab-case: `rubric-engine/`, `control-center/`
- Lowercase for standard dirs: `lib/`, `components/`, `hooks/`
- `__tests__/` for test directories

**Special Patterns:**
- `index.ts` for barrel exports
- `types.ts` for type definitions
- `[param]/` for dynamic routes

## Where to Add New Code

**New Prediction Component:**
- Implementation: `src/lib/components/{name}.ts`
- Registration: Add to `src/lib/orchestration/kai-orchestrator.ts`
- Types: `src/lib/orchestration/types.ts`
- Tests: `src/__tests__/lib/components/{name}.test.ts`

**New API Endpoint:**
- Implementation: `src/app/api/{path}/route.ts`
- Tests: `src/__tests__/api/{name}.api.test.ts`
- Note: Must use `runPredictionPipeline()` for predictions

**New UI Component:**
- Implementation: `src/components/{category}/{Name}.tsx`
- Barrel export: `src/components/{category}/index.ts`

**New Admin Page:**
- Implementation: `src/app/admin/{page}/page.tsx`
- Layout: Use existing `src/app/admin/layout.tsx`

**Utilities:**
- Shared helpers: `src/lib/utils/{name}.ts`
- Type definitions: `src/types/{name}.ts`

## Special Directories

**.planning/**
- Purpose: GSD planning artifacts
- Source: Generated by /gsd commands
- Committed: Yes

**fixtures/**
- Purpose: Test fixtures and sample data
- Source: Manual + generated
- Committed: Yes

**supabase/migrations/**
- Purpose: Database schema migrations
- Source: Supabase CLI
- Committed: Yes

---

*Structure analysis: 2026-01-14*
*Update when directory structure changes*

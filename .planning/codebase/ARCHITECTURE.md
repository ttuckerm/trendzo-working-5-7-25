# Architecture

**Analysis Date:** 2026-01-14

## Pattern Overview

**Overall:** Full-stack Next.js Application with Canonical Prediction Pipeline

**Key Characteristics:**
- Monolithic Next.js app with App Router
- Canonical prediction pipeline (`src/lib/prediction/runPredictionPipeline.ts`)
- Component-based viral prediction system (27 registered components)
- Supabase for persistence and auth
- Python microservice for ML model serving

## Layers

**API Layer:**
- Purpose: HTTP endpoints for all functionality
- Contains: Route handlers, request validation, response formatting
- Location: `src/app/api/**/*.ts`
- Depends on: Pipeline layer, service layer
- Used by: Frontend, external clients

**Pipeline Layer:**
- Purpose: Canonical prediction orchestration with full traceability
- Contains: `runPredictionPipeline()`, `KaiOrchestrator`, component registry
- Location: `src/lib/prediction/`, `src/lib/orchestration/`
- Depends on: Component layer, service layer, database
- Used by: API layer exclusively

**Component Layer:**
- Purpose: Individual prediction analysis modules (27 registered)
- Contains: Hook analysis, pacing, clarity, novelty, attribute scoring
- Location: `src/lib/components/`, `src/lib/rubric-engine/`
- Depends on: LLM services, utility functions
- Used by: Pipeline/Orchestrator layer

**Service Layer:**
- Purpose: Business logic and external integrations
- Contains: Database services, API clients, file handling
- Location: `src/lib/services/`
- Depends on: External APIs, database
- Used by: API layer, pipeline layer

**UI Layer:**
- Purpose: React components and pages
- Contains: Admin dashboard, prediction UI, shared components
- Location: `src/app/`, `src/components/`
- Depends on: API layer
- Used by: End users, admin users

## Data Flow

**Prediction Request Lifecycle:**

1. User submits video/transcript via API endpoint
2. Route handler validates input and calls `runPredictionPipeline()`
3. Pipeline creates `prediction_runs` record with unique `run_id`
4. `KaiOrchestrator` executes registered components in order
5. Each component writes results to `run_component_results` table
6. Pipeline aggregates component outputs into final DPS score
7. Response returned with `run_id` for traceability

**State Management:**
- Database: Supabase PostgreSQL for persistent state
- Caching: Redis via `ioredis` for session/temporary data
- Client: Zustand for React state management

## Key Abstractions

**Prediction Pipeline:**
- Purpose: Single source of truth for all predictions
- Location: `src/lib/prediction/runPredictionPipeline.ts`
- Pattern: Orchestration with component registry

**KaiOrchestrator:**
- Purpose: Execute and coordinate prediction components
- Location: `src/lib/orchestration/kai-orchestrator.ts`
- Pattern: Strategy pattern with component plugins

**Component:**
- Purpose: Individual analysis module (hook, pacing, etc.)
- Examples: 27 components including `unified-grading`, `editing-coach`
- Pattern: Plugin architecture with standard interface

**Route Handler:**
- Purpose: API endpoint definition
- Examples: `src/app/api/predict/route.ts`, `src/app/api/kai/predict/route.ts`
- Pattern: Next.js App Router conventions

## Entry Points

**Web Application:**
- Location: `src/app/layout.tsx`, `src/app/page.tsx`
- Triggers: Browser navigation
- Responsibilities: Render React app, handle routing

**API Routes:**
- Location: `src/app/api/**/route.ts`
- Triggers: HTTP requests
- Responsibilities: Validate, process, respond

**Prediction Pipeline:**
- Location: `src/lib/prediction/runPredictionPipeline.ts`
- Triggers: API route handlers
- Responsibilities: Orchestrate prediction, ensure traceability

**Python ML Service:**
- Location: `python-services/main.py`
- Triggers: HTTP requests from Node.js
- Responsibilities: XGBoost model inference

## Error Handling

**Strategy:** Try/catch at route level, component-level graceful degradation

**Patterns:**
- Route handlers wrap pipeline calls in try/catch
- Components return error state without throwing (degraded operation)
- Pipeline records component errors in `run_component_results`
- Zod validation at API boundaries

## Cross-Cutting Concerns

**Logging:**
- Console logging throughout
- Component execution logged to `run_component_results`
- See `src/lib/services/database-pool.ts` for DB logging

**Validation:**
- Zod schemas for API input validation
- Component output validation
- See `src/lib/rubric-engine/*-schema.ts`

**Authentication:**
- Supabase Auth via `@supabase/ssr`
- Admin auth via `src/lib/auth/admin-auth-options.ts`
- Clerk integration for user management

**Caching:**
- Artifact cache for transcripts/FFmpeg analysis
- Content-based hashing (`src/lib/prediction/artifact-cache.ts`)

---

*Architecture analysis: 2026-01-14*
*Update when major patterns change*

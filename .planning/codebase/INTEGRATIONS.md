# External Integrations

**Analysis Date:** 2026-01-14

## APIs & External Services

**AI/LLM Services:**
- Anthropic Claude - Primary LLM for rubric grading (`@ai-sdk/anthropic`)
  - SDK/Client: `@ai-sdk/anthropic` v1.2 (`package.json`)
  - Auth: API key in `ANTHROPIC_API_KEY` env var
  - Usage: Pack 1 grading, Pack 2 coaching suggestions

- OpenAI - Secondary LLM integration (`@ai-sdk/openai`)
  - SDK/Client: `@ai-sdk/openai` v1.3, `openai` v4.104
  - Auth: API key in `OPENAI_API_KEY` env var
  - Usage: Transcription, chat completions

- Google Gemini - AI integration (`@google/generative-ai`)
  - SDK/Client: `@google/generative-ai` v0.24
  - Auth: API key in env var
  - Usage: Alternative LLM provider

**Transcription:**
- Deepgram - Audio transcription (`@deepgram/sdk`)
  - SDK/Client: `@deepgram/sdk` v3.6
  - Auth: API key in `DEEPGRAM_API_KEY` env var
  - Usage: Video audio transcription

**Image Generation:**
- Replicate - AI image generation (`replicate`)
  - SDK/Client: `replicate` v0.32
  - Auth: API token in env var
  - Endpoints: `src/app/api/replicate/generate-image/route.ts`

**Web Scraping:**
- Apify - TikTok video scraping (`apify`, `apify-client`)
  - SDK/Client: `apify` v3.4, `apify-client` v2.19
  - Auth: API token in env var
  - Usage: Viral video discovery, ETL pipeline

## Data Storage

**Databases:**
- PostgreSQL on Supabase - Primary data store
  - Connection: via `DATABASE_URL` env var
  - Client: `@supabase/supabase-js` v2.57, `pg` v8.12
  - Key tables: `prediction_runs`, `run_component_results`, `artifact_cache`
  - Migrations: `supabase/migrations/`

**Caching:**
- Redis - Session and job queue storage
  - Client: `ioredis` v5.4
  - Connection: `REDIS_URL` env var
  - Usage: BullMQ job queues

**File Storage:**
- Supabase Storage - Video and asset storage
  - SDK/Client: Via `@supabase/supabase-js`
  - Usage: `src/lib/services/video-storage-service.ts`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Primary auth system
  - Implementation: `@supabase/ssr` v0.7, `@supabase/auth-helpers-nextjs` v0.10
  - Token storage: Cookies via SSR package
  - Files: `src/lib/supabase-server.ts`, `src/lib/auth/supabase-auth.ts`

- Clerk - User management (`@clerk/nextjs`)
  - SDK/Client: `@clerk/nextjs` v5.1
  - Usage: User profiles, session management

- NextAuth - Alternative auth (`next-auth`)
  - SDK/Client: `next-auth` v4.24
  - Config: `src/lib/auth/admin-auth-options.ts`

## Monitoring & Observability

**Error Tracking:**
- Not configured (console logging only)

**Analytics:**
- Custom analytics: `src/lib/analytics/`

**Logs:**
- Console logging
- Database logging for prediction runs

## CI/CD & Deployment

**Hosting:**
- Vercel - Next.js app hosting
  - Configuration: `vercel.json`
  - Environment vars: Configured in Vercel dashboard

**Python Service:**
- Separate deployment (not in Vercel)
  - Entry: `python-services/main.py`
  - Framework: FastAPI with Uvicorn

## Environment Configuration

**Development:**
- Required env vars:
  - `DATABASE_URL` - Supabase PostgreSQL
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key
  - `ANTHROPIC_API_KEY` - Claude API
  - `OPENAI_API_KEY` - OpenAI API
  - `DEEPGRAM_API_KEY` - Deepgram transcription
- Secrets location: `.env.local` (gitignored)
- Config: `src/lib/env.ts`

**Production:**
- Secrets management: Vercel environment variables
- Database: Supabase production project

## Webhooks & Callbacks

**Incoming:**
- Not detected

**Outgoing:**
- Not detected

## ML Services

**Python ML Service:**
- Framework: FastAPI 0.104, Uvicorn 0.24
- Models: XGBoost 2.0, scikit-learn 1.3
- Data: pandas 2.1, numpy 1.26
- Database: Supabase client (Python)
- Location: `python-services/`

---

*Integration audit: 2026-01-14*
*Update when adding/removing external services*

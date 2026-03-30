# Technology Stack

**Analysis Date:** 2026-01-14

## Languages

**Primary:**
- TypeScript 5.8 - All application code (`package.json`, `tsconfig.json`)
- JavaScript - Build scripts, config files

**Secondary:**
- Python 3.x - ML model serving (`python-services/requirements.txt`)

## Runtime

**Environment:**
- Node.js (Next.js 14.2.x runtime)
- Python FastAPI for ML services (`python-services/main.py`)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present
- pip for Python services

## Frameworks

**Core:**
- Next.js 14.2.x - Full-stack React framework (`package.json`)
- React 18.2 - UI framework
- FastAPI 0.104 - Python ML API (`python-services/requirements.txt`)

**Testing:**
- Jest 29.7 - Unit tests (`package.json`)
- Playwright 1.52 - E2E tests
- Testing Library (React, jest-dom, user-event)

**Build/Dev:**
- TypeScript 5.8 - Compilation
- PostCSS - CSS processing
- Tailwind CSS 3.4 - Utility-first CSS

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.57 - Database and auth (`package.json`)
- `@ai-sdk/anthropic` 1.2 - Claude AI integration
- `@ai-sdk/openai` 1.3 - OpenAI integration
- `@deepgram/sdk` 3.6 - Audio transcription
- `zod` 3.23 - Runtime validation

**Infrastructure:**
- `next` 14.2 - Server and routing
- `pg` 8.12 - PostgreSQL client
- `ioredis` 5.4 - Redis client
- `bullmq` 5.12 - Job queue

**ML/Analysis:**
- `xgboost` 2.0 - ML models (Python)
- `scikit-learn` 1.3 - ML utilities (Python)
- `pandas` 2.1 - Data processing (Python)
- `fluent-ffmpeg` 2.1 - Video analysis
- `tesseract.js` 6.0 - OCR

**UI:**
- `@radix-ui/*` - Accessible UI primitives
- `lucide-react` - Icons
- `framer-motion` 11.18 - Animations
- `recharts` 2.15 - Charts
- `sonner` 1.5 - Toast notifications

## Configuration

**Environment:**
- `.env` files (gitignored)
- Required: DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, various API keys
- See `src/lib/env.ts` for environment handling

**Build:**
- `tsconfig.json` - TypeScript compiler options
- `tailwind.config.ts` - Tailwind configuration
- `postcss.config.js` - PostCSS plugins
- `jest.config.js` - Test configuration

## Platform Requirements

**Development:**
- macOS/Linux/Windows (any platform with Node.js)
- Python 3.x for ML services
- FFmpeg for video analysis

**Production:**
- Vercel for Next.js hosting (`vercel.json`)
- Supabase for database and auth
- Redis for caching/queues

---

*Stack analysis: 2026-01-14*
*Update after major dependency changes*

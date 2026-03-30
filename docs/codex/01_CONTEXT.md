# Trendzo (aka CleanCopy) — Codebase Context (Codex)

## Stack / Architecture
- Next.js 14 App Router (src/app)
- Supabase for DB + Auth via:
  - @supabase/supabase-js
  - @supabase/ssr
  - @supabase/auth-helpers-nextjs
- Auth: Supabase Google OAuth. Middleware refreshes session with createServerClient (@supabase/ssr)
- No Prisma. All DB access via Supabase JS client directly.
- Validation: Zod
- UI: shadcn-style components in src/components/ui (Radix + CVA + Tailwind + cn()) with custom glass/dark theme.
- State: Zustand
- Logging: Pino
- Jobs: BullMQ available
- AI: Vercel AI SDK + Anthropic/OpenAI SDKs available

## Repo Rules (do not violate)
- Follow existing patterns for:
  - API routes: src/app/api/**/route.ts
  - Pages: src/app/**/page.tsx
  - Supabase client setup (use existing helpers; do not create a new auth approach)
- Do NOT introduce Prisma.
- Do NOT add Clerk usage (Clerk dependency is dead; no imports exist).
- Prefer Zod schemas for request/response validation.
- Keep changes scoped to this feature unless a shared utility is clearly reusable.

## Existing Analytics / Security
- Marketing analytics service: src/lib/services/analytics.ts
  - trackEvent(eventType, metadata) writes to Supabase campaign_analytics (marketing funnel)
- Security logging: src/lib/security/security-monitor.ts and /api/admin/security/events
- There is no general-purpose app telemetry. If needed, add a small scoped tracker for this feature OR reuse analytics.ts if acceptable.

## Navigation Placement (IMPORTANT)
- This feature is a NEW TOP-LEVEL sidebar menu item.
- It must appear as the newest menu item directly BELOW “HUB”.
- It is NOT nested inside Hub and must not use /hub/* routes.

## Sidebar Navigation (IMPORTANT)
- Sidebar component and nav items array live here:
  - src/app/admin/components/MasterNavigation.tsx
- There is also a navigation config types file:
  - src/components/admin/navigation-config.ts
- MasterNavigation currently uses its own inline NavItem interface and navItems array.
- For this task: modify MasterNavigation.tsx directly (do not refactor to shared config unless required).

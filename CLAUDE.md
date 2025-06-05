# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trendzo is a Next.js 14 application with comprehensive AI-powered social media template management features. The project uses TypeScript, React, and is currently migrating from Firebase to Supabase for backend services.

### TRENDZO MVP Implementation (Latest Sprint)

The MVP focuses on viral video template creation with the core hypothesis: "Will people give their email for a guaranteed viral video they can customize in 60 seconds?"

**MVP Components Implemented:**
1. **Smart Template Engine**: Dynamic landing pages for 16 niche/platform combinations
2. **Zero-Signup Editor**: Edit templates without creating an account  
3. **Exit-Intent System**: Smart email capture with personalized offers
4. **Magic Link Authentication**: Seamless onboarding experience
5. **Campaign Analytics**: Full funnel tracking and conversion optimization
6. **Admin Dashboard**: Monitor performance and manage templates

**MVP Routes:**
- `/l/[niche]/[platform]` - Dynamic landing pages (e.g., `/l/business/linkedin`)
- `/editor-mvp` - Zero-signup template editor
- `/auth/magic-link` - Magic link authentication
- `/auth/save-template` - Save template flow
- `/admin/mvp` - MVP admin dashboard
- `/test-landing` - Test landing page implementation

## Key Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production server locally
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests with Playwright
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Linting & Type Checking
```bash
# Run Next.js linter
npm run lint

# TypeScript will check types during build
npm run build
```

### Database Migration (Important - Active Migration)
```bash
# Run complete Supabase migration
npm run complete-migration

# Enable Supabase features
npm run enable-supabase

# Test migration status
npm run test-migration
```

## Architecture Overview

### Route Structure
- **App Router Pattern**: Using Next.js 14 App Router with route groups
- **Main Routes**:
  - `/` - Public landing page (marketing site) - NEVER redirect to dashboard
  - `/(dashboard)/*` - Authenticated user dashboard and features
  - `/admin/*` - Admin interface with protected routes
  - `/api/*` - API endpoints for data and integrations
  - `/auth/*` - Authentication flows

### Core Systems
1. **Template Management**: AI-powered template analysis, editing, and performance tracking
2. **Sound Integration**: Audio library with beat sync and visual synchronization
3. **Analytics & Predictions**: ML-based trend predictions with expert adjustments
4. **Newsletter System**: One-click template sharing with performance tracking
5. **Admin Interface**: Hybrid AI-expert system for content curation

### State Management
- **Context Providers**: Multiple React contexts for different features
- **Auth Context**: User authentication and session management
- **Feature Context**: Feature flags and tier-based access control
- **Theme Context**: Dark/light mode and UI preferences

### Key Technologies
- **Frontend**: React 18, Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Firebase (migrating to Supabase)
- **AI Integration**: OpenAI, Anthropic Claude, custom ML pipelines
- **Database**: Firebase Firestore → Supabase PostgreSQL (active migration)
- **Authentication**: Firebase Auth → Supabase Auth (active migration)

## Development Guidelines

### Critical Rules (From .cursor/rules/)

1. **Preserve Working Functionality**: Never break existing features when implementing new ones
2. **Respect Route Integrity**: Root (/) must remain a landing page, never redirect to dashboard
3. **Maintain Tier Boundaries**: Features must respect Free/Premium/Platinum access levels
4. **Follow Unicorn UX Principles**: 
   - Invisible interface - technology should disappear
   - Emotional design - every interaction should evoke positive emotions
   - Contextual intelligence - anticipate user needs
   - Progressive disclosure - reveal complexity gradually
   - Sensory harmony - visual, motion, and feedback work together

### Component Patterns
- **UI Components**: Located in `src/components/ui/` - reusable primitives
- **Feature Components**: Organized by feature (audio/, templates/, analytics/)
- **Layout Components**: Header, Sidebar, Footer in `src/components/layout/`
- **Performance Optimization**: Use optimization hooks and components from `src/lib/hooks/` and `src/components/common/`

### API Development
- **Route Handlers**: Use Next.js 14 App Router API routes
- **Error Handling**: Consistent error responses with proper status codes
- **Authentication**: Check user session and tier access in protected routes
- **Rate Limiting**: Consider implementing for external API calls

### Testing Approach
- **Unit Tests**: Jest + React Testing Library for components and hooks
- **E2E Tests**: Playwright for critical user journeys
- **Test Location**: Tests in `src/__tests__/` mirroring source structure
- **Coverage**: Aim for high coverage on critical business logic

## Common Tasks

### Adding a New Feature
1. Check tier requirements (Free/Premium/Platinum)
2. Create feature components in appropriate directory
3. Add route if needed (respect route structure)
4. Implement with Unicorn UX principles
5. Add tests for new functionality
6. Update feature flags if tier-gated

### Working with Templates
- Template data models in `src/lib/types/template.ts`
- Template services in `src/lib/services/templateService.ts`
- Template components in `src/components/templates/`
- Editor components in `src/components/templateEditor-v2/`

### Working with Audio/Sound Features
- Sound types in `src/lib/types/sound.ts`
- Sound services in `src/lib/services/soundService.ts`
- Audio components in `src/components/audio/`
- Beat sync utilities in `src/lib/hooks/useBeatSyncAnimation.ts`

### Database Operations
- Currently migrating from Firebase to Supabase
- Use Supabase client from `src/lib/supabase/client.ts`
- Database types in `src/lib/types/database.ts`
- Check migration status before modifying database code

## Performance Optimization

The project includes a comprehensive performance framework:
- **Monitoring**: Use `MetricsMonitor` and `PerformanceVisualizer` components
- **Optimization Hooks**: `useOptimizedAnimation`, `useOptimizedDataFetching`
- **Loading States**: Use `OptimizedSkeletonLoader` for progressive loading
- **Documentation**: See `/documentation/` routes for optimization guides

## Important Notes

1. **Active Migration**: The project is migrating from Firebase to Supabase. Check migration status before modifying auth or database code.
2. **Feature Flags**: Respect tier-based access control for all features
3. **Admin Interface**: Preserve hybrid AI-expert functionality - don't fully automate expert features
4. **Route Protection**: Use appropriate middleware and guards for protected routes
5. **API Keys**: Never commit API keys - use environment variables
6. **Testing**: Run tests before submitting changes to ensure nothing breaks

## Environment Variables

Key environment variables needed (see `.env.local.example` or scripts/create-env-local.js):
- Firebase configuration (during migration)
- Supabase configuration
- OpenAI and Anthropic API keys
- NextAuth configuration
- Various service API keys

When in doubt, refer to the comprehensive documentation in the project or the established patterns in existing code.
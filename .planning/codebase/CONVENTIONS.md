# Coding Conventions

**Analysis Date:** 2026-01-14

## Naming Patterns

**Files:**
- kebab-case for all TypeScript modules: `run-prediction-pipeline.ts`, `kai-orchestrator.ts`
- PascalCase for React components: `AdminSidebar.tsx`, `StatCard.tsx`
- `*.test.ts` co-located or in `__tests__/` directories
- `route.ts` for Next.js API routes

**Functions:**
- camelCase for all functions: `runPredictionPipeline`, `processComponent`
- No special prefix for async functions
- Handler functions: `handleSubmit`, `handleClick` pattern

**Variables:**
- camelCase for variables: `videoId`, `predictionResult`
- UPPER_SNAKE_CASE for constants: `MAX_RETRIES`, `API_TIMEOUT`
- No underscore prefix for private members

**Types:**
- PascalCase for interfaces: `PredictionResult`, `ComponentOutput`
- No `I` prefix on interfaces
- PascalCase for type aliases: `VideoMetadata`, `RunConfig`

## Code Style

**Formatting:**
- Prettier configured (`package.json` has format scripts)
- Single quotes for strings (inferred from codebase)
- Semicolons required
- 2-space indentation

**Linting:**
- ESLint with `eslint-config-next`
- Run: `npm run lint`

**TypeScript:**
- Strict mode enabled (`tsconfig.json`)
- Explicit return types preferred
- Zod for runtime validation

## Import Organization

**Order:**
1. External packages (react, next, etc.)
2. Internal modules (@/lib, @/components)
3. Relative imports (./utils, ../types)
4. Type imports (import type { ... })

**Path Aliases:**
- `@/*` maps to `src/*`
- `@trendzo/shared` for shared package

**Grouping:**
- Blank line between import groups
- React imports first in components

## Error Handling

**Patterns:**
- Try/catch at route handler level
- Components return error state (don't throw)
- Pipeline records errors in database

**Error Types:**
- Throw on invalid input (validated by Zod)
- Return error object for expected failures
- Log error context before throwing

**Example:**
```typescript
try {
  const result = await runPredictionPipeline(videoId);
  return NextResponse.json(result);
} catch (error) {
  console.error('Prediction failed:', error);
  return NextResponse.json({ error: 'Prediction failed' }, { status: 500 });
}
```

## Logging

**Framework:**
- `console.log`, `console.error` for development
- Database logging for component results
- No production logging service configured

**Patterns:**
- Log at service boundaries
- Include context in log messages
- Log state transitions and external calls

## Comments

**When to Comment:**
- Explain why, not what
- Document business rules and edge cases
- Reference ticket numbers for workarounds

**JSDoc/TSDoc:**
- Optional for internal functions
- Encouraged for public APIs and complex logic

**TODO Comments:**
- Format: `// TODO: description`
- Link to issue when available

## Function Design

**Size:**
- Keep under 50 lines where possible
- Extract helpers for complex logic

**Parameters:**
- Max 3 positional parameters
- Use options object for more: `runPredictionPipeline(videoId, options)`
- Destructure in function signature

**Return Values:**
- Explicit return types
- Return early for guard clauses
- Return objects with success/error fields for operations

## Module Design

**Exports:**
- Named exports preferred
- Default exports for React components
- Barrel exports via `index.ts`

**Patterns:**
- One responsibility per module
- Services as functions, not classes
- Avoid circular dependencies

## React Patterns

**Components:**
- Functional components only
- Props interface defined above component
- Use hooks for side effects

**State:**
- Zustand for global state
- React state for local UI state
- Server state via API calls

**Styling:**
- Tailwind CSS utilities
- `cn()` utility for conditional classes
- Component variants via `class-variance-authority`

---

*Convention analysis: 2026-01-14*
*Update when patterns change*

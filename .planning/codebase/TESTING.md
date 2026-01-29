# Testing Patterns

**Analysis Date:** 2026-01-14

## Test Framework

**Runner:**
- Jest 29.7 (`package.json`)
- Config: `jest.config.js` in project root

**Assertion Library:**
- Jest built-in expect
- `@testing-library/jest-dom` for DOM matchers

**Run Commands:**
```bash
npm test                              # Run all tests
npm run test:watch                    # Watch mode
npm run test:coverage                 # Coverage report
npm run test:smoke                    # Critical tests only
npx jest path/to/file.test.ts        # Single file
```

## Test File Organization

**Location:**
- Primary: `src/__tests__/` directory tree
- Some co-located tests: `src/lib/**/__tests__/`

**Naming:**
- Unit tests: `*.test.ts`
- API tests: `*.api.test.ts`
- Integration tests: `*.integration.test.ts`

**Structure:**
```
src/__tests__/
├── api/                    # API endpoint tests
│   ├── ticket-a2-endpoints.test.ts
│   └── *.api.test.ts
├── unit/                   # Unit tests
│   ├── runPredictionPipeline.test.ts
│   └── *.test.ts
├── integration/            # Integration tests
├── lib/                    # Library tests
├── llm/                    # LLM-related tests
└── golden/                 # Golden file tests
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('ModuleName', () => {
  describe('functionName', () => {
    beforeEach(() => {
      // reset state
    });

    it('should handle valid input', async () => {
      // arrange
      const input = createTestInput();

      // act
      const result = await functionName(input);

      // assert
      expect(result).toEqual(expectedOutput);
    });

    it('should throw on invalid input', () => {
      expect(() => functionName(null)).toThrow('Invalid input');
    });
  });
});
```

**Patterns:**
- Use `beforeEach` for per-test setup
- Use `afterEach` to restore mocks: `jest.restoreAllMocks()`
- Arrange/Act/Assert structure
- One assertion focus per test

## Mocking

**Framework:**
- Jest built-in mocking

**Patterns:**
```typescript
// Mock module
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// Mock in test
const mockFetch = jest.spyOn(global, 'fetch');
mockFetch.mockResolvedValue(new Response(JSON.stringify({ data: 'test' })));
```

**What to Mock:**
- External APIs (Supabase, OpenAI, Anthropic)
- File system operations
- Database connections
- HTTP requests

**What NOT to Mock:**
- Pure functions and utilities
- Internal business logic
- Zod schemas

## Fixtures and Factories

**Test Data:**
```typescript
// Factory functions
function createTestVideo(overrides?: Partial<Video>): Video {
  return {
    id: 'test-video-123',
    transcript: 'Test transcript',
    ...overrides
  };
}
```

**Location:**
- Shared fixtures: `fixtures/` directory at root
- Test-specific: Inline in test file
- JSON fixtures: `fixtures/validation/`, `fixtures/learning/`

## Coverage

**Requirements:**
- No enforced coverage target
- Critical paths should have tests
- Focus on prediction pipeline and API endpoints

**Configuration:**
- Jest coverage via `--coverage` flag
- Excludes: test files, config files

**View Coverage:**
```bash
npm run test:coverage
open coverage/index.html
```

## Test Types

**Unit Tests:**
- Location: `src/__tests__/unit/`
- Scope: Single function/module in isolation
- Examples: `runPredictionPipeline.test.ts`, `flags.test.ts`

**API Tests:**
- Location: `src/__tests__/api/`
- Scope: HTTP endpoint behavior
- Examples: `ticket-a2-endpoints.test.ts`, `predict.log.api.test.ts`

**Integration Tests:**
- Location: `src/__tests__/integration/`
- Scope: Multiple modules together
- Examples: `dlq-and-breaker.test.ts`

**Smoke Tests:**
- Command: `npm run test:smoke`
- Scope: Critical paths only
- Files: `runPredictionPipeline.test.ts`, `ticket-a2-endpoints.test.ts`

## Common Patterns

**Async Testing:**
```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

**Error Testing:**
```typescript
it('should throw on invalid input', () => {
  expect(() => parse(null)).toThrow('Cannot parse null');
});

// Async error
it('should reject on failure', async () => {
  await expect(asyncCall()).rejects.toThrow('error message');
});
```

**API Route Testing:**
```typescript
it('should return 200 for valid request', async () => {
  const response = await fetch('/api/predict', {
    method: 'POST',
    body: JSON.stringify({ videoId: 'test' })
  });
  expect(response.status).toBe(200);
});
```

**Snapshot Testing:**
- Not widely used in this codebase
- Prefer explicit assertions

---

*Testing analysis: 2026-01-14*
*Update when test patterns change*

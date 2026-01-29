### Rate Limiting & Idempotency

- Rate limiting: `src/lib/security/rate-limiter.ts` (Redis or memory fallback) and `src/lib/middleware/rateLimiter.ts` (Supabase-backed). Use `createRateLimiter` or `withRateLimit`.
- Idempotency: `src/lib/idempotency.ts` wraps POST handlers; header `Idempotency-Key` stores request hash and response for 24h in `idempotency_store`.
- QA checks: rapid calls to a test endpoint should yield 429; repeated POST with same key returns first result with `x-idempotent-replayed: 1`.



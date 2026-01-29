## Feature Flags: Setup Guide

1) Environment
Add to `.env.local`:

```
CORTEZA_BASE_URL=https://your.corteza.local
CORTEZA_API_TOKEN=xxxxx
FEATURE_FLAG_CACHE_TTL_MS=15000
```

2) Corteza Token
- In Corteza, create a token for a service user with permissions to read user role memberships.
- Store the bearer token value in `CORTEZA_API_TOKEN`.

3) Database
- Run Supabase migrations to create feature tables: `supabase/migrations/20250912_feature_flags.sql`.

4) Admin
- Navigate to `/admin/feature-flags` to toggle features and preview as a user.

5) Client SDK
- Wrap pages in `FlagProvider` and guard components with `FeatureGate`.








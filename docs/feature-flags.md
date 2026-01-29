## Feature Flags MVP

### Overview
Server-driven feature flags backed by Supabase Postgres with admin toggles, preview-as-user, and client SDK for gating UI.

### Env
Add to .env.local:

```
CORTEZA_BASE_URL=
CORTEZA_API_TOKEN=
FEATURE_FLAG_CACHE_TTL_MS=15000
```

### API
- POST `/api/flags` body `{ keys: string[], userId?: string, tenantId?: string, plans?: string[] }` → `{ [key]: boolean }`
- Admin GET `/api/admin/flags` (super_admin)
- Admin POST `/api/admin/flags` body `{ key, default_state?, description?, action }`
- Admin POST `/api/admin/preview` body `{ userId, keys[] }` → `{ [key]: boolean }`

### Client SDK
```tsx
<FlagProvider userId={user?.id} keys={["rewards_v1"]}>
  <FeatureGate feature="rewards_v1"><RewardsWidget /></FeatureGate>
</FlagProvider>
```

### DB
See `supabase/migrations/*feature_flags.sql` for tables: `features`, `feature_rules`, `entitlements`, `flag_audit`.

### Admin UI
Visit `/admin/feature-flags` to toggle defaults and preview as a user.








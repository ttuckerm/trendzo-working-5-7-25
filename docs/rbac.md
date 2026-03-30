### RBAC and Multi-Tenant Isolation

- Tables: `organization(id,name)`, `user_role(user_id, organization_id, role)`.
- Middleware: `src/middleware/rbac.ts` provides `requireTenantAccess` and `getTenantContext`.
- UI: `/admin/operations-center` → Tenants & Roles tab with `[data-testid='tenants-table']` and `[data-testid='apikeys-table']`.
- API keys per-tenant: `api_key(tenant_id, name, hash, last_used_at, revoked_at)` with endpoints under `/api/admin/tenants/:tenantId/keys`.
- Route guards: include `x-tenant-id` and `x-user-id` headers; super_admin bypass supported.
- Tests: extend Playwright preflight to assert 403 on cross-tenant reads.



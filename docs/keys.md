### API Keys

- Table: `api_key(id, tenant_id, name, hash, last_used_at, created_at, revoked_at)`.
- Endpoints: `GET/POST /api/admin/tenants/:tenantId/keys`, `DELETE /api/admin/tenants/:tenantId/keys/:keyId`.
- Keys are generated raw once and stored as SHA-256 hash.
- Usage: pass `X-API-Key` to SDK/Pixel/Federated endpoints; RBAC validated per tenant.
- UI shows last used and revoke.



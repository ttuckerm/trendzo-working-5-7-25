### Privacy / Compliance (Consent • DSAR • Retention)

- Consent: `consent(tenant_id, subject_id, consent, dnt, updated_at)`.
- DSAR export: `GET /api/privacy/export?subject_id=...` returns artifact path to zip.
- DSAR delete: `POST /api/privacy/delete { subject_id }` pseudonymizes or deletes from key tables.
- Retention: configure TTL per table and run sweeper job (see Jobs runbook).
- UI: `/admin/operations-center` → Privacy tab shows queue and policies.



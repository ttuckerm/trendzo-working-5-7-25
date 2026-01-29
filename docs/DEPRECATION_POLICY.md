# API Deprecation Policy (90-Day Window)

This document defines the deprecation policy for public and admin APIs, SDKs, and plugin surfaces. The goal is to provide a predictable migration window and automated notices that help integrators safely upgrade.

## Scope
- Public APIs: endpoints under `/public/*`
- Admin APIs: endpoints under `/api/admin/*`
- SDK & Plugin Contracts: CapCut, Premiere, Descript helpers that call `/public/score`

## Policy
- Minimum deprecation window: 90 days from announcement to removal
- Announcement channels: email (if on file), signed webhook, and admin UI banner
- Breaking changes require a new version (e.g., `/api/docs/public/v2`) with the old version deprecated but available for 90 days
- Non-breaking additions do not require a deprecation window

## Workflow
1) Propose change and produce OpenAPI for the new version
2) Create deprecation records for affected routes/versions with `announced_at` and `end_date = announced_at + 90 days`
3) UI shows banners for active deprecations with end dates
4) Automated notices:
   - Email: weekly reminder for impacted keys (if email available)
   - Webhook: POST signed JSON to registered endpoint with `{ route, version, end_date }`
5) Removal after `end_date` (requests return 410 Gone for removed versions)

## Notices
- Email subject: `[Deprecation Notice] {route} v{version} ends on {end_date}`
- Webhook body: `{ event: "deprecation_notice", route, version, announced_at, end_date, message }`
- Admin banner: concise warning with link to docs

## SLA and Exceptions
- Shorter windows are only allowed for security issues; otherwise 90 days
- Emergency removals will include immediate email + webhook + UI banner

## Contact
- Support: support@yourdomain.example
- Security: security@yourdomain.example

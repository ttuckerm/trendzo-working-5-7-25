## Model Registry & Release Channels

Endpoints:
- POST `/api/models/register` { name, sha, metrics }
- POST `/api/models/promote` { version_id, channel }
- GET `/api/models/active` → { canary, stable }


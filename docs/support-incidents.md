Support & Incidents

APIs
- POST `/api/incidents` { sev, summary, impact }
- POST `/api/incidents/:id/ack`
- POST `/api/incidents/:id/resolve`
- GET `/api/incidents?status=open|resolved`
- GET `/api/oncall/now`

UI
- `/operations-center#incidents` renders incidents table and on-call.

Runbooks
- SEV1 page on-call; SEV2 within 30 minutes.




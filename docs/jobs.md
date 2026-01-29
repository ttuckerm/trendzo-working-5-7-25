### Background Jobs & Resilience

- Tables: `job_queue`, `job_dlq`, `job_runs`.
- Enqueue: `POST /api/admin/jobs/enqueue { type, payload }`.
- List: `GET /api/admin/jobs/list` returns depth and last jobs.
- Worker: implement a Node worker that polls `job_queue`, processes with retries/backoff, quarantines to DLQ.
- UI: `/admin/operations-center` → Jobs tab shows `[data-testid='queue-depth']` and job list; DLQ viewer can be added.



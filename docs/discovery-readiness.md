## Discovery Readiness

What “Ready” means

- Freshness seconds <= 7200
- Templates total >= 60
- Sections: HOT >= 10, COOLING >= 10, NEW >= 10
- Examples coverage >= 90% (>=3 examples per template)
- Safety coverage >= 95%
- Analyzer online, A/B online, Validate online

Endpoints

- GET `/api/discovery/readiness` → readiness JSON (scores + reasons)
- POST `/api/discovery/qa-seed` → seeds realistic templates, examples, discovery metrics, entity velocity, minimal A/B + validation rows
- Ops actions (Controls Bar):
  - `recompute-discovery` → recompute (falls back to QA seed if live DB missing)
  - `warm-examples` → backfill examples for any template with <3

How to QA seed

1. Go to Operations Center → Controls Bar → Run QA seed
2. Or call: `curl -X POST -H "x-user-id: local-admin" ${BASE_URL}/api/discovery/qa-seed`
3. Verify: GET `/api/discovery/readiness` shows `ready=true` and thresholds met

How to fix each reason

- Discovery stale (>7200s): use “Recompute Discovery” from Ops Controls
- Examples coverage low: use “Warm Examples” from Ops Controls
- Analyzer/AB/Validate offline: open Engine Room; if in mock mode, run QA seed

Owner UI

- `/admin/viral-recipe-book` header shows a pill “Discovery: Ready / Needs Attention”
- Click the pill to open the slide-over with each score and “Fix it” actions

Cron

- An hourly job should refresh discovery (`recompute_discovery_job`). It skips if pipeline is red (see Ops readiness banner). In local/dev environments, QA seed suffices.

Smoke tests

- KPI chips and filters render (non-null values)
- HOT/COOLING/NEW sections and All grid show `tpl-card-*`
- Slide-over tabs render `tpl-slide-tabs`
- Analyzer returns results `analyze-results`
- A/B start returns receipt and table shows a row `ab-table`
- Validate tab shows calibration `validate-calibration`
- Readiness pill is Ready after QA seed; if freshness forced >7200s, pill flips to Needs Attention



## Viral Quick-Win Sandbox Workflow

This sandbox demonstrates an end-to-end Quick-Win Workflow (8 steps) using fixtures and lightweight UI. It is gated behind a feature flag so it can be toggled on/off safely.

### Enable feature flag

Set an environment variable before starting the dev server:

Windows PowerShell:

```
$env:NEXT_PUBLIC_SANDBOX_WORKFLOW="1"; npm run dev
```

Unix shells:

```
NEXT_PUBLIC_SANDBOX_WORKFLOW=1 npm run dev
```

Disable by omitting or setting to `0`.

### Routes

All routes are under `/sandbox/workflow`:

- `/onboarding` — niche/goal wizard
- `/gallery` — starter pack templates
- `/script` — script workbench (hooks, tone, CTA, teleprompter, SRT export)
- `/analysis` — instant analysis (score, fixes, PDF export)
- `/schedule` — rollout planner (ICS, captions/hashtags, cut list)
- `/receipt` — prediction receipt
- `/dashboard` — system health + algorithm weather
- `/accuracy` — validation + learning
- `/lab` — R&D
- `/process` — process intelligence
- `/campaigns` — marketing inception
- `/moat` — defensible moat
- `/starter-playbook` — scale from zero

### State & Persistence

The sandbox uses a small context stored under `localStorage` keys prefixed with `sandboxUser` to persist `niche`, `goal`, `templateId`, `script`, `analysis`, `schedule`, and `receipts` across refresh.

### Tests

End-to-end flow is in `e2e/sandbox-workflow.spec.ts`. Run with your Playwright setup, or adapt path to your existing Playwright suite if needed.



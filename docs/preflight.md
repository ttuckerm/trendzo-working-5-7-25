Preflight Gate

Local
1) Start app: `npm run dev`
2) Run gate: `npm run preflight`

Artifacts
- `public/artifacts/preflight-summary.json`

CI
- Workflow `.github/workflows/preflight.yml` runs preflight on PR and push to main.
- Blocks merges on failure and uploads artifacts.


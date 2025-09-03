# Disaster Recovery Restore

## Prereqs
- Git LFS installed (git lfs install)
- Node.js 20.x recommended

## Steps
1. Clone: git clone REPO_URL
2. (Optional) Checkout snapshot tag:
   git fetch --tags
   git checkout TAG_NAME
3. Pull LFS files:
   git lfs fetch --all
   git lfs checkout
4. Create env:
   copy .env.local.example to .env.local and fill secrets
5. Install deps: npm ci
6. Build: npm run build
7. Run: npm start

## Notes
- Secrets are not in Git. Retrieve from GitHub Secrets or your password manager.
- Restore databases/3rd party services from your infra backups.

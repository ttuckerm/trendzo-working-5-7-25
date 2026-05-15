# Funnel Deploy — techyai.co

This branch (funnel-deploy-techyai) is the production source for
the Escape Assessment funnel deployed to techyai.co.

## What this branch is

A copy of vercel-deploy-test with the following changes:

- DEPLOY_TARGET=funnel middleware gate added to src/middleware.ts.
  Any URL not on the funnel allowlist returns 404.
- Page metadata titles scrubbed of "Trendzo".
- Visible eyebrow tags changed to "THE ESCAPE ASSESSMENT".
- Freedom Agent system prompt rebrand: "Trendzo" → "our new platform".
- Assessment generator prompt rebrand: "Trendzo Personalization Engine"
  → "Escape Assessment Personalization Engine".
- 7 dead Trendzo-branded public assets deleted from public/images/.
- vercel.funnel.json added (no crons, plain build config).

## How updates work

To update the live funnel:
1. Make changes on this branch.
2. Commit and push to GitHub.
3. Vercel auto-deploys the techyai.co project from this branch.

To pull non-funnel changes from vercel-deploy-test:
1. git checkout funnel-deploy-techyai
2. git merge vercel-deploy-test (or cherry-pick specific commits)
3. Resolve conflicts manually.
4. Commit, push.

## Vercel project setup (one-time, outside this branch)

The techyai.co Vercel project must be configured with:

Build & Output Settings:
- Vercel Config File: vercel.funnel.json
- Production Branch: funnel-deploy-techyai

Environment Variables (Production):
- DEPLOY_TARGET=funnel
- NEXT_PUBLIC_SITE_URL=https://techyai.co
- NEXT_PUBLIC_BASE_URL=https://techyai.co
- NEXT_PUBLIC_APP_URL=https://techyai.co
- NEXT_PUBLIC_DISABLE_AUTH=false
- All Supabase, Stripe, Beehiiv, Anthropic, and cookie-secret
  vars copied from the dev environment (with production values
  where applicable).

Stripe Dashboard:
- New webhook endpoint at https://techyai.co/api/checkout/webhook
- Webhook secret copied to STRIPE_WEBHOOK_SECRET env var on
  the Vercel project (different from dev secret).

## Funnel-only routes (the allowlist)

Pages:
- / (landing)
- /welcome
- /free/freedom-os
- /assessment/[assessmentId]

API:
- /api/landing/*
- /api/checkout/*
- /api/assessment/*
- /api/freedom-agent/chat
- /api/freedom-agent/conversation

Every other URL returns 404 on techyai.co.

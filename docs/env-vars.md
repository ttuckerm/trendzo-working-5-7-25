# Environment Variables

All environment variables required for Trendzo deployment.

## Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-side only). Alias: `SUPABASE_SERVICE_ROLE_KEY` |
| `NEXT_PUBLIC_BASE_URL` | Production URL (e.g. `https://trendzo.app`) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude-based components |
| `OPENAI_API_KEY` | OpenAI API key for GPT-based components and AI SDK |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key for Gemini-based components (Pack 1/2/V) |
| `BEEHIIV_API_KEY` | Beehiiv API key for newsletter/nurture integration |
| `BEEHIIV_PUBLICATION_ID` | Beehiiv publication ID |
| `CRON_SECRET` | Secret token for authenticating cron job endpoints |

## Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key for transactional emails | — |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Admin user email for admin access detection | — |
| `NEXT_PUBLIC_DISABLE_AUTH` | Set to `true` to bypass auth in development | `false` |
| `REDIS_URL` | Redis connection URL (for legacy system routes) | — |
| `APIFY_API_TOKEN` | Apify API token for TikTok scraping | — |
| `NEXT_PUBLIC_CLONE_URL` | Clone URL override | `https://os.ryo.lu/` |

## Vercel Setup

1. Go to your Vercel project settings > Environment Variables
2. Add each required variable for **Production**, **Preview**, and **Development**
3. The `NEXT_PUBLIC_*` variables are exposed to the browser — do not put secrets in them
4. `SUPABASE_SERVICE_KEY` is server-only and must never be prefixed with `NEXT_PUBLIC_`

## Health Check

After deployment, verify environment is configured:

```
GET /api/health
```

Returns JSON with status of each env var and Supabase connectivity.

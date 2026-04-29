# Verification — Stripe Checkout for the Escape Assessment

This adds a paid `$97` path to the public landing page. Users with a code keep
their existing flow; users without a code can now click "Buy for $97 — instant
access," pay through Stripe Checkout, and land at the same form.

---

## Env vars Tommy needs to fill in

These all go in `.env.local` (NOT `.env.local.example` — that file is only the
template). Each one is a separate value you paste from a different place.

| Variable | What it is and where to get it |
| --- | --- |
| `STRIPE_SECRET_KEY` | Your Stripe **secret key**. Log into Stripe → top-right toggle should say **Test mode** (orange) → left sidebar **Developers** → **API keys** → "Secret key" → click **Reveal test key**. Starts with `sk_test_…`. Never share publicly. |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe **publishable key**, same page as above. Starts with `pk_test_…`. Safe to expose; we don't actually use it on the client (hosted checkout doesn't need it), but it's wired in case we want to attach Stripe.js later. |
| `STRIPE_PRICE_ID_ESCAPE_ASSESSMENT` | The Stripe **Price ID** for the $97 product. In Stripe → **Product catalog** → create a product called "Escape Assessment", set price to **$97 USD, one-time** → after saving, copy the price's ID (looks like `price_1Pa…`). |
| `STRIPE_WEBHOOK_SECRET` | The signing secret for the webhook. Two scenarios: **(a) Local dev** — install the Stripe CLI, run `stripe listen --forward-to localhost:3004/api/checkout/webhook`. The CLI prints a `whsec_…` value; paste that. **(b) Production** — Stripe → **Developers → Webhooks → Add endpoint** → URL `https://YOUR_DOMAIN/api/checkout/webhook`, event `checkout.session.completed` → after creating, the endpoint detail page shows a **Signing secret** starting with `whsec_…`. |
| `NEXT_PUBLIC_SITE_URL` | The base URL Stripe should redirect back to after payment. Locally: `http://localhost:3004`. In production: `https://your-domain.com` (no trailing slash). |
| `CODE_PATH_COOKIE_SECRET` | A long random string used to sign the cookie that proves a user came through the code path. Generate one by running this in any terminal: `openssl rand -base64 32`. Copy the output. Never share. If you change this value later, anyone with an outstanding code-path session will be bounced back to the landing page (that's fine). |

After you save `.env.local`, restart `npm run dev` so Next.js picks up the new
env vars.

---

## What was built

- **DB**: `supabase/migrations/20260428200000_create_stripe_purchases.sql` — new `stripe_purchases` table, `assessment_id` is a real FK to `escape_assessments(assessment_id)` with `ON DELETE SET NULL`. Run this against Supabase before testing.
- **Stripe SDK**: added `stripe` to `package.json` (server-only, no client SDK).
- **Routes**:
  - `POST /api/checkout/create-session` — creates the Stripe Checkout session, inserts a `pending` row, returns `{ url }`.
  - `POST /api/checkout/webhook` — verifies signature, marks the matching row `paid`, captures email + customer id + payment intent id.
  - `GET /api/checkout/verify-session?session_id=…` — returns `{ valid, reason }` from the DB row's status.
- **Route guard**: `/free/freedom-os` is now a server component. It accepts either `?session_id=cs_…` (validated against the DB, with up to 10s of webhook-lag retry) OR a signed `dl_code_path` cookie issued by `/api/landing/code-validate`. With neither, it redirects to `/`.
- **Linkage**: `/api/assessment/generate` now accepts an optional `sessionId`. After the assessment row lands, the generator atomically marks the matching `paid` purchase as `consumed`, sets `consumed_at`, and writes the new `assessment_id` UUID. CodeEntry behavior unchanged.
- **UI**:
  - New shared `PaidCheckoutButton` component used in the hook section (above the fold) and the bottom CTA section (Redeem Your Code).
  - Outlined/muted secondary visual weight; the crimson INITIATE button stays primary.
  - `CheckoutBanner` shows a dismissible message at the top of the landing page when the URL has `?checkout=cancelled|invalid|already_used`.

## What was NOT touched

- `CodeEntry.tsx` UI/UX — unchanged.
- `FreedomOSTool.tsx` form fields, validation, and look — unchanged. Only added an optional `sessionId` prop and a single line that includes it in the generate request when present.
- The assessment generator, HUD, and prompts — unchanged in shape; only the linkage block at the end was added.
- The third (minimal) `CodeEntry` in `CloseSection.tsx` — left alone, since the prompt called out "two checkout placements."

---

## Manual verification checklist (run in Stripe **test** mode)

1. **Landing renders both CTAs above the fold and at the bottom.** Open `/`. INITIATE button + 5-letter code field is visible; below an "or" divider, "Buy for $97 — instant access" button is visible. Scroll to the "Redeem Your Code" section: same pattern. **PASS / FAIL** + one-line note.

2. **Paid path → Stripe → form.** Click "Buy for $97" up top → page redirects to `checkout.stripe.com` → enter test card `4242 4242 4242 4242`, any future expiry, any CVC, any zip → click Pay → Stripe redirects you back to `/free/freedom-os?session_id=cs_…` → form loads → fill it out → submit → assessment generates → arrives at the HUD. **PASS / FAIL** + one-line note.

3. **Direct access to `/free/freedom-os` is blocked.** Open a fresh incognito window and go straight to `/free/freedom-os` (no params). Should redirect to `/`. **PASS / FAIL** + one-line note.

4. **Fake session_id is rejected.** Visit `/free/freedom-os?session_id=cs_FAKE`. Should redirect to `/?checkout=invalid` and show the dismissible banner. **PASS / FAIL** + one-line note.

5. **Reusing a consumed session is blocked.** Take the `session_id` from check #2 (after the assessment was generated) and visit `/free/freedom-os?session_id=THAT_VALUE` again. Should redirect to `/?checkout=already_used`. **PASS / FAIL** + one-line note.

6. **Cancel returns user with banner.** Click "Buy for $97," on the Stripe page click the back arrow / cancel link. Should land on `/?checkout=cancelled` and show the cancelled banner. **PASS / FAIL** + one-line note.

7. **Code path still works untouched.** On `/`, type any 5-letter string into the code field (placeholder validation: any 5 letters are accepted) → INITIATE → should redirect to `/free/freedom-os` → form loads (no Stripe involved). **PASS / FAIL** + one-line note.

8. **Supabase rows look right.** In Supabase Studio → `stripe_purchases` table. After step #2 you should see one row with `status='consumed'`, `paid_at` and `consumed_at` populated, `email` matching your test card email, and `assessment_id` linked to the new escape assessment. **PASS / FAIL** + one-line note.

9. **Stripe Dashboard shows the test payment.** Stripe → Payments tab. The test payment from #2 should appear as `$97.00 USD`, status Succeeded. **PASS / FAIL** + one-line note.

10. **Webhook lag tolerance.** Optional: with the Stripe CLI **stopped** mid-checkout, complete a test payment and watch the page. The `/free/freedom-os` page polls verify-session for ~10s; if you start the CLI back up within that window the form loads, otherwise you're redirected to `/?checkout=invalid`. **PASS / FAIL** + one-line note.

---

## Local-dev quickstart

```bash
# 1. Install Stripe CLI (one-time): https://stripe.com/docs/stripe-cli
# 2. Log in:
stripe login

# 3. Forward webhook events to your local Next.js server:
stripe listen --forward-to localhost:3004/api/checkout/webhook
# Copy the whsec_... it prints into STRIPE_WEBHOOK_SECRET in .env.local.

# 4. Generate the cookie secret:
openssl rand -base64 32
# Paste the output into CODE_PATH_COOKIE_SECRET in .env.local.

# 5. Run the migration in Supabase Studio or via the CLI:
#    supabase/migrations/20260428200000_create_stripe_purchases.sql

# 6. Start the dev server:
npm run dev
```

## Production deploy notes

- Add the same env vars to your Vercel project (or wherever you host).
- Switch `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_PRICE_ID_ESCAPE_ASSESSMENT` to **live mode** values.
- Create a real webhook endpoint in Stripe Dashboard pointing at `https://your-domain.com/api/checkout/webhook` and put its signing secret in `STRIPE_WEBHOOK_SECRET`.
- `NEXT_PUBLIC_SITE_URL` becomes `https://your-domain.com`.
- `CODE_PATH_COOKIE_SECRET` should be a different value than the dev one. Generate fresh.

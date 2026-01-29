## Billing & Plans

Endpoints:
- POST `/api/billing/stripe/webhook` (Stripe webhook; verifies header presence; stores customers, subscriptions, invoices)
- GET `/api/billing/portal` → JSON `{ url }` to customer portal
- GET `/api/billing/status` → `{ plan, seats, renews_at, delinquent, credits_remaining }` with `X-Quota-Remaining`

Tables:
- `billing_customer(id,user_id,stripe_customer_id,plan,seats,credits_remaining,delinquent,created_at)`
- `subscription(id,customer_id,status,current_period_end,created_at)`
- `invoice_event(id,customer_id,amount_due,amount_paid,currency,status,raw,created_at)`

Plan gates: enforced via `usage_events` and telemetry/api key checks.
402 behavior: when plan limits/credits exceeded, endpoints may return `402` with `{ "error": "quota_exceeded" | "plan_insufficient" }`. Headers include `X-Usage-Plan` and `X-Quota-Remaining`.


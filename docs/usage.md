## Usage Metering

Headers:
- `X-Usage-24h`, `X-Usage-Month`, `X-Quota-Remaining`
 - `X-Usage-Plan`

Counters are tracked in `usage_events` by API key and route.

Errors:
- Quota exceeded or plan insufficient returns HTTP 402 with `{ "error": "quota_exceeded" | "plan_insufficient" }`.


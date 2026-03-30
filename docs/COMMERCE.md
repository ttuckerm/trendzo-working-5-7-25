# Commerce Attribution & Conversion Lift

## Pixel
- GET /px.gif?ev=view&sid=...&video_id=...&sku_id=...
- POST /api/commerce/event — richer events with JSON body
- POST /api/commerce/order — idempotent order postback

Cookie: vl_sid (180 days)

## SDK
- sdk/js/commerce.ts — ViralLabPixel.init/track/order

## Data
- Tables: sku_catalog, commerce_sessions, commerce_events, orders, attribution_results
- PII: store ip_hash only

## Attribution
- last_touch_decay (λ=0.1), window=7d; supports first_touch and multi_touch (70/30 split)
- Run now: POST /api/admin/commerce/attribution/run-now

## Lift
- Public: POST /public/commerce/estimate_lift
- Mapping per (platform,niche,format); piecewise-linear default

## Admin APIs
- GET /api/admin/commerce/attribution/summary
- GET /api/admin/commerce/top_creatives

## Dry-runs
- GET /api/admin/integration/dryrun_commerce_attribution
- GET /api/admin/integration/dryrun_commerce_lift

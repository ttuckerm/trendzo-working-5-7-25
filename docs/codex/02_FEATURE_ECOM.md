# Feature: Ecom Trend Forecast (Scraped) + Live Recipe Builder (MVP)

## User Outcome
Users can see emerging/trending products (from scraped data), understand why they’re hot, and generate a TikTok LIVE selling plan (“Live Recipe”) for a selected product.

## Placement (TOP-LEVEL NAV ITEM)
- New top-level sidebar item (newest item) directly BELOW "HUB"
- Routes:
  - /ecom (feed)
  - /ecom/[productId] (detail)

## Data Source
- Scraped input is ingested into Supabase.
- MVP does NOT require building the scraper itself; only:
  - ingestion endpoint(s)
  - storage schema
  - UI to browse + score + generate Live Recipe

## Core Objects
### ProductCandidate (stored)
- id (uuid)
- platform (string: "tiktok_shop" initially)
- title (string)
- category (string | null)
- price (number | null)
- currency (string | null)
- image_url (string | null)
- product_url (string | null)
- seller (jsonb | null)
- metrics (jsonb) // raw scraped metrics blob
- observed_at (timestamptz) // when scraped
- created_at, updated_at

### ForecastScore (computed)
- marketHeatScore (0-100)
- breakoutProbability (0-1)
- confidence (0-1)
- topReasons: string[] (min 3)

### LiveRecipe (generated)
- hookOptions: string[] (min 5)
- runOfShow: array of segments with timestamps + script
- objections: array
- offerStack: array
- ctaMoments: array
- pivotTriggers: array (what to do if retention dips)

## MVP Scoring (heuristic, deterministic)
Compute scores from metrics.jsonb using:
- velocity (recent delta in GMV/sales/views)
- acceleration (velocity change)
- creator adoption (unique creators pushing it)
- saturation (competitors count / declining conversion proxy)
Return explainable topReasons.

## Feature Flag / Gating
- Gate behind FEATURE_ECOM_FORECAST (env flag is acceptable for MVP)
- MVP can be admin-only.

## Logging
Track minimum usage events:
- ecom_forecast_viewed
- ecom_product_opened
- ecom_live_recipe_generated
Use existing analytics.ts only if appropriate; otherwise add a small scoped table/service.

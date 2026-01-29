# Formats (Carousel & 3-Minute Branch)

## Detection
- ContentFormat: short_video | carousel | long_video_3m
- detectFormat(input, apifyItem?, dbRow?)
  - long_video_3m: duration_seconds >= 150
  - carousel: Apify slideshow signals OR DB flags OR caption/hashtags heuristics
  - else short_video

## Features
- Carousel: slide_count, est_avg_text_density, cover_text_presence, swipe_linger_proxy, cta_presence
- 3m: ret_30s/60s/180s, hook_under_3s, cut_rate_per_min, section_ctas

## Engine
- Carousel branch: upweight saves/re-engagement; clamp factor [0.92,1.15]
- 3m branch: weight retention anchors; smoother decay; clamp [0.90,1.15]
- Calibration keyed by (platform,niche,format)

## APIs
- Public POST /public/score accepts optional format and returns format + format_breakdown.
- Dry-run: GET /api/admin/integration/dryrun_formats

## Status
- Per-format distribution (7d), model counts, and last run timestamps.

## Run per-format calibration
- Optional: POST /api/admin/calibration/run-now?format=carousel|long_video_3m

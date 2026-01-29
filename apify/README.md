# Apify Actors (TikTok v1)

This directory contains v1 actor specs and local harnesses.

Actors
- HotFeedScanner (hourly): discover trending video_ids by niche/seed hashtags/sounds; store initial snapshot.
- VideoDetailEnricher (1–3h, until 7d): refresh engagement windows; light ASR, keyframe OCR, basic shot detection; compute beats & CTA-forward; audio heuristics.
- AuthorBackfill (daily): last 30d posts per discovered author → median_views_30d, posting_heatmap.
- EntityTrackers (24h/7d): sounds/hashtags/effects velocity.
- CommentSampler (≤24h): top N comments, sentiment/themes, CTA intents.

Environment
- APIFY_TOKEN
- SUPABASE_URL, SUPABASE_SERVICE_KEY
- S3_BUCKET (optional), AWS_REGION

Schedules
- HotFeedScanner: every hour
- VideoDetailEnricher: every 2h
- AuthorBackfill: daily at 02:00
- EntityTrackers: every 6h
- CommentSampler: every 3h

Local run
```bash
node apify/hot-feed-scanner.js --niche marketing --limit 50
```

Notes
- Idempotent upserts via unique (platform, video_id) and (author_id) keys.
- Keep 90-day raw, 12-month aggregates. Use retention_policy_key on rows.
- Emit Apify datasets as staging; loaders persist to Postgres and S3.

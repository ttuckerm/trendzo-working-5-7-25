-- =====================================================
-- Populate Evaluation Benchmarks
-- =====================================================
-- Selects 30 benchmark videos from scraped_videos,
-- stratified by DPS tier (6 per tier).
-- Requires training_features to exist (for XGBoost eval).
--
-- DPS Tiers (from system-registry):
--   mega-viral: dps_score >= 90  (2 available — take all)
--   hyper-viral: dps_score >= 75  (94 available — take 7)
--   viral:       dps_score >= 60  (179 available — take 7)
--   trending:    dps_score >= 40  (293 available — take 7)
--   normal:      dps_score < 40   (295 available — take 7)
-- Total: 30
-- =====================================================

INSERT INTO evaluation_benchmarks (video_id, actual_dps, niche, transcript_text, caption, hashtags, creator_followers, duration_seconds)
SELECT
  video_id,
  dps_score AS actual_dps,
  niche,
  transcript_text,
  caption,
  hashtags,
  creator_followers_count AS creator_followers,
  duration_seconds
FROM (
  SELECT
    sv.*,
    ROW_NUMBER() OVER (
      PARTITION BY
        CASE
          WHEN sv.dps_score >= 90 THEN 'mega-viral'
          WHEN sv.dps_score >= 75 THEN 'hyper-viral'
          WHEN sv.dps_score >= 60 THEN 'viral'
          WHEN sv.dps_score >= 40 THEN 'trending'
          ELSE 'normal'
        END
      ORDER BY
        -- Prefer videos that have training features extracted
        CASE WHEN tf.video_id IS NOT NULL THEN 0 ELSE 1 END,
        -- Then by DPS score (middle of tier = most representative)
        ABS(sv.dps_score - CASE
          WHEN sv.dps_score >= 90 THEN 95
          WHEN sv.dps_score >= 75 THEN 82
          WHEN sv.dps_score >= 60 THEN 67
          WHEN sv.dps_score >= 40 THEN 50
          ELSE 20
        END)
    ) AS rn
  FROM scraped_videos sv
  INNER JOIN training_features tf ON tf.video_id = sv.video_id
  WHERE sv.dps_score IS NOT NULL
) ranked
WHERE rn <= CASE
  -- Only 2 mega-viral exist, take all; give extra slots to other tiers
  WHEN ranked.dps_score >= 90 THEN 2
  ELSE 7
END
ON CONFLICT (video_id) DO NOTHING;

-- Copy this entire block and paste it into Supabase SQL Editor
-- Then click RUN to see the actual data

-- 1. Total count
SELECT
  'Total Videos' as metric,
  COUNT(*) as count
FROM scraped_videos

UNION ALL

-- 2. Videos with transcripts
SELECT
  'With Transcripts' as metric,
  COUNT(*) as count
FROM scraped_videos
WHERE transcript_text IS NOT NULL

UNION ALL

-- 3. Videos without transcripts
SELECT
  'Without Transcripts' as metric,
  COUNT(*) as count
FROM scraped_videos
WHERE transcript_text IS NULL;

-- 4. Show me 5 actual transcripts
SELECT
  video_id,
  creator_username,
  LEFT(transcript_text, 100) as transcript_preview,
  updated_at
FROM scraped_videos
WHERE transcript_text IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- 5. Show me top creators
SELECT
  creator_username,
  COUNT(*) as video_count
FROM scraped_videos
GROUP BY creator_username
ORDER BY video_count DESC
LIMIT 10;

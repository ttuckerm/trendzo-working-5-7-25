# 🚀 Apify TikTok Pipeline - Deployment Checklist

This checklist ensures a smooth deployment of the Apify → Supabase → DPS pipeline for TikTok video ingestion.

---

## 📋 Pre-Deployment Checklist

### ✅ Phase 1: Database Setup

- [ ] **1.1** Connect to Supabase database (SQL Editor or psql)
- [ ] **1.2** Run migration: `supabase/migrations/20251012_create_scraped_videos_table.sql`
- [ ] **1.3** Verify table creation:
  ```sql
  SELECT table_name, table_type 
  FROM information_schema.tables 
  WHERE table_name IN ('scraped_videos', 'scraping_jobs')
  AND table_schema = 'public';
  ```
  Expected: 2 rows returned
  
- [ ] **1.4** Verify indexes:
  ```sql
  SELECT indexname 
  FROM pg_indexes 
  WHERE tablename = 'scraped_videos' 
  AND schemaname = 'public';
  ```
  Expected: 14+ indexes
  
- [ ] **1.5** Test table insert:
  ```sql
  INSERT INTO scraped_videos (video_id, url, platform, tiktok_id, caption)
  VALUES ('test_12345', 'https://test.com/video', 'tiktok', 'test_12345', 'Test video')
  ON CONFLICT (video_id) DO NOTHING;
  
  SELECT * FROM scraped_videos WHERE video_id = 'test_12345';
  
  DELETE FROM scraped_videos WHERE video_id = 'test_12345';
  ```

### ✅ Phase 2: Environment Variables

- [ ] **2.1** Navigate to: Supabase Dashboard → Project Settings → Edge Functions → Secrets
- [ ] **2.2** Add `SUPABASE_URL`:
  - Value: `https://<PROJECT_REF>.supabase.co`
  - Source: Project Settings → API → Project URL
  
- [ ] **2.3** Add `SUPABASE_SERVICE_ROLE_KEY`:
  - Value: `eyJhbGc...` (service_role key)
  - Source: Project Settings → API → service_role key
  - ⚠️ **CRITICAL:** Use service_role, NOT anon key
  
- [ ] **2.4** Add `APIFY_TOKEN` (optional but recommended):
  - Value: Your Apify API token
  - Source: Apify Settings → Integrations → API Tokens
  - Note: Required for private datasets
  
- [ ] **2.5** Add `OPENAI_API_KEY` (optional):
  - Value: Your OpenAI API key
  - Source: https://platform.openai.com/api-keys
  - Note: For future Whisper transcription

- [ ] **2.6** Verify all secrets are saved (refresh page to confirm)

### ✅ Phase 3: Edge Function Deployment

- [ ] **3.1** Ensure Supabase CLI is installed:
  ```bash
  supabase --version
  ```
  If not installed: https://supabase.com/docs/guides/cli
  
- [ ] **3.2** Login to Supabase CLI:
  ```bash
  supabase login
  ```
  
- [ ] **3.3** Link project:
  ```bash
  supabase link --project-ref <YOUR_PROJECT_REF>
  ```
  
- [ ] **3.4** Deploy Edge Function:
  ```bash
  supabase functions deploy apify-ingest --no-verify-jwt
  ```
  Expected output: `Deployed Function apify-ingest`
  
- [ ] **3.5** Verify deployment:
  - Navigate to: Supabase Dashboard → Edge Functions
  - Confirm `apify-ingest` is listed
  - Status should be "Active"
  
- [ ] **3.6** Note the function URL:
  ```
  https://<PROJECT_REF>.supabase.co/functions/v1/apify-ingest
  ```

---

## 🧪 Testing Phase

### ✅ Phase 4: Local Testing

- [ ] **4.1** Run PowerShell test script:
  ```powershell
  .\scripts\test-apify-webhook.ps1
  ```
  Or with parameters:
  ```powershell
  .\scripts\test-apify-webhook.ps1 -ProjectRef "abc123" -ServiceRoleKey "eyJhbG..."
  ```
  
- [ ] **4.2** Verify test results:
  - [ ] Test 1: Basic Connectivity ✅
  - [ ] Test 2: Auth validation ✅
  - [ ] Test 3: Valid auth with empty dataset ✅
  - [ ] Test 4: Mock payload processing ✅ or ⚠️ (expected to fail dataset fetch)
  - [ ] Test 5: Payload validation ✅

- [ ] **4.3** Check Edge Function logs:
  - Navigate to: Supabase Dashboard → Edge Functions → apify-ingest → Logs
  - Verify you see log entries from the test script

### ✅ Phase 5: Apify Configuration

- [ ] **5.1** Login to Apify dashboard
- [ ] **5.2** Navigate to: Actors → Tasks → tiktok-scraper-prod (or your task name)
- [ ] **5.3** Click: Settings tab → Integrations section
- [ ] **5.4** Click: Add Integration → HTTP Request
- [ ] **5.5** Configure webhook:
  - **Event:** Run succeeded ✅
  - **URL:** `https://<PROJECT_REF>.supabase.co/functions/v1/apify-ingest`
  - **Method:** POST
  - **Headers:** (Click "Edit Headers")
    ```json
    {
      "Authorization": "Bearer <SERVICE_ROLE_KEY>",
      "apikey": "<SERVICE_ROLE_KEY>",
      "Content-Type": "application/json"
    }
    ```
  - **Payload:** (Use default or leave empty)
  
- [ ] **5.6** Save and enable integration (toggle ON)
- [ ] **5.7** Verify status shows "Active"

---

## 🎯 End-to-End Testing

### ✅ Phase 6: Production Test Run

- [ ] **6.1** In Apify task, click "Run" button
- [ ] **6.2** Configure small test run:
  - Limit: 5-10 videos
  - Use safe profiles/hashtags (e.g., @tiktok, #fyp)
  
- [ ] **6.3** Wait for run to complete (Status: Succeeded)
- [ ] **6.4** Check Apify integration logs:
  - Navigate to: Task → Integrations → View Log
  - Expected: HTTP 200 response
  - If failed: Check error message and troubleshoot
  
- [ ] **6.5** Check Supabase Edge Function logs:
  - Expected entries:
    - `📥 Received Apify webhook`
    - `📥 Fetching Apify dataset`
    - `✅ Fetched X items from Apify dataset`
    - `🔄 Processing X videos...`
    - `✅ Processing complete: { inserted: Y, updated: Z, errors: 0 }`
  
- [ ] **6.6** Verify database insertion:
  ```sql
  SELECT 
    video_id,
    creator_username,
    views_count,
    likes_count,
    hashtags,
    scraped_at
  FROM scraped_videos
  ORDER BY scraped_at DESC
  LIMIT 10;
  ```
  Expected: 5-10 rows with data from test run
  
- [ ] **6.7** Inspect raw data (optional):
  ```sql
  SELECT 
    video_id,
    raw_scraping_data
  FROM scraped_videos
  ORDER BY scraped_at DESC
  LIMIT 1;
  ```
  Verify: Complete Apify payload is stored in `raw_scraping_data`

---

## 🔍 Verification & Monitoring

### ✅ Phase 7: Post-Deployment Validation

- [ ] **7.1** Check data quality:
  ```sql
  SELECT 
    COUNT(*) as total_videos,
    COUNT(*) FILTER (WHERE transcript_text IS NOT NULL) as with_transcripts,
    COUNT(*) FILTER (WHERE creator_username IS NOT NULL) as with_creator,
    COUNT(*) FILTER (WHERE views_count > 0) as with_metrics
  FROM scraped_videos;
  ```
  Expected: All counts should be close to total_videos
  
- [ ] **7.2** Check for errors:
  ```sql
  SELECT 
    video_id,
    caption,
    scraped_at
  FROM scraped_videos
  WHERE creator_username IS NULL 
     OR views_count IS NULL
  ORDER BY scraped_at DESC
  LIMIT 10;
  ```
  Expected: 0 rows (or investigate anomalies)
  
- [ ] **7.3** Verify processing flags:
  ```sql
  SELECT 
    needs_processing,
    COUNT(*) as count
  FROM scraped_videos
  GROUP BY needs_processing;
  ```
  Expected: All rows should have `needs_processing = true` initially
  
- [ ] **7.4** Test DPS calculation integration:
  ```sql
  SELECT 
    sv.video_id,
    sv.creator_username,
    sv.views_count,
    sv.needs_processing,
    dps.viral_score
  FROM scraped_videos sv
  LEFT JOIN dps_calculations dps ON sv.video_id = dps.video_id
  ORDER BY sv.scraped_at DESC
  LIMIT 10;
  ```
  Note: DPS scores will be calculated by separate process

### ✅ Phase 8: Monitoring Setup

- [ ] **8.1** Bookmark Supabase Edge Function logs:
  ```
  https://supabase.com/dashboard/project/<PROJECT_REF>/functions/apify-ingest/logs
  ```
  
- [ ] **8.2** Bookmark Apify integration logs:
  ```
  https://console.apify.com/actors/tasks/<TASK_ID>/integrations
  ```
  
- [ ] **8.3** Set up monitoring query (save in SQL Editor):
  ```sql
  -- Daily scraping summary
  SELECT 
    DATE(scraped_at) as date,
    COUNT(*) as videos_scraped,
    COUNT(DISTINCT creator_username) as unique_creators,
    AVG(views_count)::INT as avg_views,
    SUM(views_count) as total_views
  FROM scraped_videos
  GROUP BY DATE(scraped_at)
  ORDER BY date DESC
  LIMIT 7;
  ```
  
- [ ] **8.4** Test error notification (optional):
  - Configure Apify webhook for "Run failed" event
  - Send to Slack/email/monitoring service

---

## 📊 Success Criteria

All of the following must be true for successful deployment:

- ✅ **Database:**
  - `scraped_videos` table exists with 30+ columns
  - All indexes created (14+)
  - RLS policies enabled
  
- ✅ **Edge Function:**
  - Deployed and active in Supabase
  - Responds to test requests
  - Logs show successful execution
  
- ✅ **Apify Integration:**
  - Webhook configured with correct URL
  - Headers include both `Authorization` and `apikey`
  - Integration status: Active
  
- ✅ **End-to-End Flow:**
  - Apify run completes successfully
  - Webhook fires and returns 200
  - Videos appear in `scraped_videos` table
  - No errors in Edge Function logs
  - Data quality checks pass

---

## 🛠️ Troubleshooting Guide

### Issue: Edge Function returns 401 Unauthorized

**Solutions:**
1. Verify `Authorization` header includes "Bearer " prefix
2. Ensure both `Authorization` and `apikey` headers are present
3. Confirm using `service_role` key, not `anon` key
4. Check for extra spaces or line breaks in key

### Issue: Edge Function returns 400 Bad Request

**Solutions:**
1. Verify Apify payload includes `resource.defaultDatasetUrl`
2. Check payload template in Apify integration
3. Review Edge Function logs for specific error message

### Issue: Edge Function returns 500 Internal Server Error

**Solutions:**
1. Check Edge Function logs for stack trace
2. Verify `scraped_videos` table exists
3. Confirm environment variables are set correctly
4. Test Apify dataset URL accessibility

### Issue: Videos not appearing in database

**Solutions:**
1. Verify webhook fired successfully (Apify logs)
2. Check Edge Function processed payload (Supabase logs)
3. Run SQL query: `SELECT COUNT(*) FROM scraped_videos;`
4. Check for unique constraint violations (duplicate video_id)
5. Review `raw_scraping_data` field for payload issues

### Issue: Missing transcript data

**Solutions:**
1. Check if Apify actor includes `subtitles` in output
2. Verify `shouldDownloadSubtitles: true` in Apify input
3. OpenAI Whisper integration is placeholder (not yet implemented)
4. Transcript extraction logs in Edge Function

---

## 📞 Support Resources

- **Supabase Edge Functions Docs:** https://supabase.com/docs/guides/functions
- **Apify Webhooks Docs:** https://docs.apify.com/integrations/webhooks
- **TikTok Scraper Actor:** https://apify.com/clockworks/free-tiktok-scraper
- **Project Documentation:** `docs/APIFY_WEBHOOK_SETUP.md`
- **Test Scripts:** `scripts/test-apify-webhook.ps1`

---

## ✅ Sign-Off

After completing all phases, sign off below:

- [ ] **Database Migration:** Completed by __________ on __________
- [ ] **Environment Setup:** Completed by __________ on __________
- [ ] **Function Deployment:** Completed by __________ on __________
- [ ] **Apify Configuration:** Completed by __________ on __________
- [ ] **End-to-End Test:** Passed on __________
- [ ] **Production Ready:** Approved by __________ on __________

---

**Version:** 1.0.0  
**Last Updated:** October 12, 2025  
**Status:** ✅ Ready for Deployment


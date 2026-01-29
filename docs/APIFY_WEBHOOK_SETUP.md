# Apify TikTok Webhook Configuration Guide

This document provides step-by-step instructions for configuring Apify to send TikTok scraping results to your Supabase Edge Function.

---

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Supabase Project** with Edge Functions enabled
2. **Apify Account** with TikTok Scraper actor configured
3. **Environment Variables** set in Supabase (see below)

---

## 🔐 Required Environment Variables (Supabase)

Navigate to **Supabase Dashboard → Project Settings → Edge Functions → Secrets** and add:

| Variable Name | Description | Example |
|---------------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (found in API settings) | `eyJhbGc...` |
| `APIFY_TOKEN` | Apify API token (optional, for private datasets) | `apify_api_xxx` |
| `OPENAI_API_KEY` | OpenAI API key (optional, for Whisper transcripts) | `sk-proj-xxx` |

### How to Get These Values:

#### **Supabase Service Role Key:**
1. Go to **Project Settings → API**
2. Copy the `service_role` key (NOT the anon key)
3. ⚠️ **Keep this secret** - it bypasses RLS policies

#### **Apify Token:**
1. Go to **Apify Settings → Integrations → API Tokens**
2. Create a new token or copy existing one
3. Grant `Read` permission on datasets

#### **OpenAI API Key:**
1. Visit https://platform.openai.com/api-keys
2. Create new secret key
3. Store securely

---

## 🌐 Edge Function URL

Your deployed function will be accessible at:

```
https://<PROJECT_REF>.supabase.co/functions/v1/apify-ingest
```

**Example:**
```
https://abcdefghijklmnop.supabase.co/functions/v1/apify-ingest
```

### How to Find Your Project Reference:
1. Go to **Supabase Dashboard → Project Settings → General**
2. Look for **Reference ID** (17-character alphanumeric string)
3. Or copy from the URL: `https://supabase.com/dashboard/project/<PROJECT_REF>`

---

## ⚙️ Apify Webhook Configuration

### Step 1: Navigate to Your Apify Task

1. Log in to Apify
2. Go to **Actors → Tasks**
3. Select your `tiktok-scraper-prod` task (or create new one)
4. Click **Settings** tab

### Step 2: Add Webhook Integration

1. Scroll to **Integrations** section
2. Click **Add Integration**
3. Select **HTTP Request**

### Step 3: Configure Webhook Settings

#### **Trigger Event:**
- ✅ Select: **Run succeeded**
- ❌ Uncheck: Run failed, Run aborted (unless you want error notifications)

#### **Request URL:**
```
https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/apify-ingest
```

#### **HTTP Method:**
- Select: **POST**

#### **Headers Template:**

Click **Edit Headers** and paste:

```json
{
  "Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>",
  "apikey": "<YOUR_SERVICE_ROLE_KEY>",
  "Content-Type": "application/json"
}
```

**⚠️ IMPORTANT:**
- Replace `<YOUR_SERVICE_ROLE_KEY>` with your actual service role key
- Both `Authorization` and `apikey` headers are **required** (Supabase needs both)
- Use the **same key value** for both headers

**Example:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjk0NzAwMDAwLCJleHAiOjE4NTI0NjAwMDB9.xxxxxxxxx",
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjk0NzAwMDAwLCJleHAiOjE4NTI0NjAwMDB9.xxxxxxxxx",
  "Content-Type": "application/json"
}
```

#### **Payload Template:**

Use the **default Apify webhook payload** (leave empty or use):

```json
{
  "userId": {{userId}},
  "createdAt": {{createdAt}},
  "eventType": {{eventType}},
  "eventData": {{eventData}},
  "resource": {{resource}}
}
```

### Step 4: Save Configuration

1. Click **Save** button
2. Enable the integration (toggle should be ON)
3. The status should show **Active**

---

## ✅ Testing the Integration

### Test 1: Manual Test from Apify

1. In your Apify task, click the **Run** button
2. Wait for the run to complete (status: **Succeeded**)
3. Navigate to **Integrations** tab
4. Click **View Log** next to your webhook integration
5. Check the response:
   - ✅ **200 OK** = Success
   - ❌ **401 Unauthorized** = Check your headers
   - ❌ **400 Bad Request** = Check payload structure
   - ❌ **500 Internal Server Error** = Check Edge Function logs

### Test 2: Check Supabase Edge Function Logs

1. Go to **Supabase Dashboard → Edge Functions**
2. Click on `apify-ingest` function
3. Navigate to **Logs** tab
4. You should see entries like:
```
📥 Received Apify webhook: { eventType: 'ACTOR.RUN.SUCCEEDED', ... }
📥 Fetching Apify dataset: https://api.apify.com/v2/datasets/...
✅ Fetched 300 items from Apify dataset
🔄 Processing 300 videos...
✅ Processing complete: { inserted: 298, updated: 2, errors: 0 }
```

### Test 3: Verify Database Insertion

Run this SQL query in **Supabase SQL Editor**:

```sql
SELECT 
  video_id,
  creator_username,
  views_count,
  likes_count,
  caption,
  scraped_at
FROM scraped_videos
ORDER BY scraped_at DESC
LIMIT 10;
```

You should see recently scraped videos.

---

## 🔧 Troubleshooting

### Problem: 401 Unauthorized

**Cause:** Missing or incorrect authentication headers

**Solution:**
1. Verify both `Authorization` and `apikey` headers are present
2. Ensure both use the **service_role** key (not anon key)
3. Check for extra spaces or line breaks in the key
4. Verify the key starts with `eyJhbGc...`

### Problem: 400 Bad Request

**Cause:** Invalid payload structure

**Solution:**
1. Check Apify webhook payload template is using default format
2. Verify `resource.defaultDatasetUrl` or `resource.defaultDatasetId` is present
3. Review Edge Function logs for specific error message

### Problem: 500 Internal Server Error

**Cause:** Edge Function crashed or configuration error

**Solution:**
1. Check Supabase Edge Function logs for error details
2. Verify environment variables are set correctly
3. Ensure `scraped_videos` table exists (run migration)
4. Check if Apify dataset is accessible

### Problem: Videos Not Appearing in Database

**Cause:** Various possible issues

**Solution:**
1. Check if webhook fired successfully (Apify integration logs)
2. Verify Edge Function processed the payload (Supabase logs)
3. Run SQL query to check if rows exist:
   ```sql
   SELECT COUNT(*) FROM scraped_videos;
   ```
4. Check for errors in `raw_scraping_data` JSONB field

---

## 📊 Monitoring & Metrics

### Key Metrics to Track

1. **Webhook Success Rate:**
   - Check Apify integration logs
   - Target: >99% success rate

2. **Processing Time:**
   - Review Supabase Edge Function logs
   - Target: <10 seconds for 100 videos

3. **Database Growth:**
   ```sql
   SELECT 
     DATE(scraped_at) as date,
     COUNT(*) as videos_scraped
   FROM scraped_videos
   GROUP BY DATE(scraped_at)
   ORDER BY date DESC
   LIMIT 7;
   ```

4. **Error Rate:**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE needs_processing = true) as pending,
     COUNT(*) FILTER (WHERE needs_processing = false) as processed,
     COUNT(*) as total
   FROM scraped_videos;
   ```

---

## 🚀 Best Practices

1. **Use Service Role Key Only for Server-to-Server:**
   - Never expose in client-side code
   - Store securely in Apify webhook settings

2. **Monitor Dataset Sizes:**
   - Large datasets (>1000 videos) may timeout
   - Consider batching or pagination for huge runs

3. **Enable Error Notifications:**
   - Add webhook for "Run failed" events
   - Send to monitoring service (Slack, email, etc.)

4. **Regular Audits:**
   - Check database growth weekly
   - Review error logs monthly
   - Update Apify actor versions quarterly

5. **Backup Configuration:**
   - Document all webhook settings
   - Keep screenshot of Apify integration panel
   - Version control this documentation

---

## 📞 Support

If you encounter issues:

1. Check Supabase Edge Function logs first
2. Review Apify integration logs second
3. Verify database schema with migration
4. Test with cURL (see `TEST_APIFY_WEBHOOK.md`)

---

**Last Updated:** October 12, 2025  
**Version:** 1.0.0


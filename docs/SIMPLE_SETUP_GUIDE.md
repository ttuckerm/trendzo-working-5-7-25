# 🎯 Simple Setup Guide for Apify → Supabase Integration
## (No Technical Knowledge Required)

This guide will help you connect your Apify TikTok scraper to your Supabase database so videos automatically save when Apify finishes scraping.

**Time needed:** 20-30 minutes  
**What you need:** Computer, internet, Apify account, Supabase account

---

## 📌 OVERVIEW (What We're Doing)

Right now when Apify scrapes TikTok videos, the data just sits in Apify. We want to automatically send that data to your Supabase database so you can use it for viral predictions.

**Simple flow:**
1. Apify scrapes TikTok videos ✅
2. Apify automatically sends data to Supabase ⬅️ **We're setting this up**
3. Data appears in your database ✅
4. Your viral prediction system can use it ✅

---

## ✅ PART 1: Create the Database Table (5 minutes)

### What you're doing:
Creating a place in your database to store the TikTok videos.

### Steps:

**1.1** Open your web browser and go to:
```
https://supabase.com/dashboard
```

**1.2** Log in to your Supabase account

**1.3** Click on your project name (probably called "Trendzo" or similar)

**1.4** On the left sidebar, click the **"SQL Editor"** button (it looks like a document icon)

**1.5** Click the **"New Query"** button (green button at top right)

**1.6** Open this file on your computer:
```
C:\Projects\CleanCopy\supabase\migrations\20251012_create_scraped_videos_table.sql
```

**1.7** Copy EVERYTHING in that file (press Ctrl+A to select all, then Ctrl+C to copy)

**1.8** Go back to Supabase, paste it into the SQL Editor (click in the empty space and press Ctrl+V)

**1.9** Click the **"Run"** button (bottom right corner)

**1.10** You should see a green message saying "Success. No rows returned"

✅ **Done!** Your database now has a table called `scraped_videos`

---

## ✅ PART 2: Add Your Secret Keys (10 minutes)

### What you're doing:
Giving Apify permission to send data to your Supabase database.

### Steps:

**2.1** In Supabase, click **"Project Settings"** (gear icon at bottom left)

**2.2** Click **"API"** in the left menu

**2.3** Look for a section called **"Project API keys"**

**2.4** Find the key labeled **"service_role"** (NOT "anon")

**2.5** Click the **"Copy"** button next to the service_role key

**2.6** Open Notepad and paste it there (we'll need it in a minute)

**2.7** On the same page, look at the top for **"Project URL"**

**2.8** Copy that URL (it looks like: `https://abcdefghijk.supabase.co`)

**2.9** Paste that into Notepad too (on a new line)

**2.10** Now click **"Edge Functions"** in the left menu

**2.11** Click the **"Secrets"** tab at the top

**2.12** Click **"New Secret"** button

**2.13** For the first secret:
- Name: `SUPABASE_URL`
- Value: (paste the URL from step 2.9)
- Click **"Create Secret"**

**2.14** Click **"New Secret"** again

**2.15** For the second secret:
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: (paste the service_role key from step 2.5)
- Click **"Create Secret"**

**2.16** You should now see 2 secrets listed

✅ **Done!** Your secrets are saved

---

## ✅ PART 3: Upload the Function (5 minutes)

### What you're doing:
Uploading code that will receive data from Apify and save it to your database.

### Steps:

**3.1** Download and install Supabase CLI:
- Go to: https://supabase.com/docs/guides/cli/getting-started
- Click the download button for Windows
- Run the installer
- Click "Next" until it's done

**3.2** Open **Command Prompt**:
- Press Windows key
- Type "cmd"
- Press Enter

**3.3** Type this command and press Enter:
```
supabase login
```

**3.4** A web page will open - click **"Authorize"**

**3.5** Go back to Command Prompt

**3.6** Type this command (replace `abc123` with your actual project reference):
```
supabase link --project-ref abc123
```

**How to find your project reference:**
- In Supabase, go to Project Settings → General
- Look for "Reference ID"
- It's a 20-character code like `abcdefghijklmnopqrst`

**3.7** Type this command:
```
cd C:\Projects\CleanCopy
```

**3.8** Type this command:
```
supabase functions deploy apify-ingest --no-verify-jwt
```

**3.9** Wait for it to finish (you'll see "Deployed Function apify-ingest")

✅ **Done!** Your function is uploaded

---

## ✅ PART 4: Connect Apify (10 minutes)

### What you're doing:
Telling Apify to send data to your Supabase function whenever it finishes scraping.

### Steps:

**4.1** Open your web browser and go to:
```
https://console.apify.com
```

**4.2** Log in to your Apify account

**4.3** Click **"Actors"** in the top menu

**4.4** Click **"Tasks"** tab

**4.5** Find your TikTok scraper task (probably called "tiktok-scraper-prod")

**4.6** Click on it

**4.7** Click the **"Settings"** tab at the top

**4.8** Scroll down to the **"Integrations"** section

**4.9** Click **"Add Integration"**

**4.10** Select **"HTTP Request"**

**4.11** For **"Event"**, check the box for **"Run succeeded"** ONLY

**4.12** For **"Request URL"**, paste this (replace `abc123` with your project reference):
```
https://abc123.supabase.co/functions/v1/apify-ingest
```

**4.13** For **"HTTP Method"**, select **"POST"**

**4.14** Click **"Edit Headers"**

**4.15** A text box will appear. Delete everything in it.

**4.16** Go to your Notepad (from Part 2) and find your service_role key

**4.17** Copy this template and paste it into the Headers box:
```json
{
  "Authorization": "Bearer YOUR_KEY_HERE",
  "apikey": "YOUR_KEY_HERE",
  "Content-Type": "application/json"
}
```

**4.18** Replace BOTH instances of `YOUR_KEY_HERE` with your service_role key

**Example of what it should look like:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjk0NzAwMDAwfQ.xxxxxx",
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjk0NzAwMDAwfQ.xxxxxx",
  "Content-Type": "application/json"
}
```

**4.19** Leave **"Payload Template"** empty (or use the default)

**4.20** Click **"Save"**

**4.21** Make sure the toggle switch next to your integration is **ON** (green)

✅ **Done!** Apify is now connected

---

## ✅ PART 5: Test It (5 minutes)

### What you're doing:
Making sure everything works by running a small test.

### Steps:

**5.1** In Apify, go back to your TikTok scraper task

**5.2** Click the **"Input"** tab

**5.3** Find the setting for number of videos to scrape

**5.4** Change it to **5** (we're just testing)

**5.5** Click the **"Run"** button (big green button)

**5.6** Wait for it to finish (status will say "Succeeded")

**5.7** Click the **"Integrations"** tab

**5.8** You should see a log entry with a green checkmark and "200 OK"

**5.9** If you see that, it worked! 🎉

**5.10** Now let's check your database:

**5.11** Go back to Supabase → SQL Editor

**5.12** Click "New Query"

**5.13** Paste this:
```sql
SELECT video_id, creator_username, views_count, caption
FROM scraped_videos
ORDER BY scraped_at DESC
LIMIT 10;
```

**5.14** Click "Run"

**5.15** You should see 5 videos in the results!

✅ **Done!** Everything is working!

---

## 🎉 YOU'RE ALL SET!

From now on, whenever Apify finishes scraping TikTok videos, they'll automatically appear in your Supabase database.

### What happens next:

1. You run your Apify scraper (like you normally do)
2. When it finishes, Apify automatically sends the data to Supabase
3. The data appears in the `scraped_videos` table
4. Your viral prediction system can now use that data

### How to check if videos are being saved:

1. Go to Supabase → SQL Editor
2. Run this query:
```sql
SELECT COUNT(*) FROM scraped_videos;
```
3. You'll see how many total videos are saved

---

## ⚠️ TROUBLESHOOTING (If Something Goes Wrong)

### Problem: "Error deploying function" in Part 3

**Solution:**
1. Make sure you installed Supabase CLI
2. Make sure you typed the commands exactly as shown
3. Try closing Command Prompt and starting Part 3 over

### Problem: Apify shows "401 Unauthorized" in Part 5

**Solution:**
1. Go back to Part 4, step 4.18
2. Make sure you replaced BOTH `YOUR_KEY_HERE` with your actual key
3. Make sure the key starts with `eyJhbG...`
4. Delete the integration and create it again

### Problem: Apify shows "500 Internal Server Error" in Part 5

**Solution:**
1. Go to Supabase → Edge Functions → apify-ingest → Logs
2. Look for the error message (it will explain what went wrong)
3. Common fix: Go back to Part 1 and make sure the SQL ran successfully

### Problem: No videos showing up in database (Part 5, step 5.15)

**Solution:**
1. Check if Apify integration shows "200 OK" (if not, see solutions above)
2. Make sure you ran the SQL query from Part 1 (the `scraped_videos` table must exist)
3. Try running the Apify scraper again

---

## 📞 NEED MORE HELP?

If you're still stuck:

1. Take a screenshot of the error message
2. Note which step you're on
3. Send that to your developer/technical support

The error message will tell them exactly what's wrong.

---

**Last Updated:** October 12, 2025  
**Made with ❤️ for non-technical users**


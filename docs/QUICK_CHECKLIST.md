# ✅ Quick Setup Checklist
## Connect Apify to Supabase (30 Minutes)

Print this page and check off each step as you complete it.

---

## 📝 BEFORE YOU START

**Get these ready:**
- [ ] Computer with internet
- [ ] Supabase login (website: supabase.com)
- [ ] Apify login (website: console.apify.com)
- [ ] Open Notepad to save important info

---

## PART 1: Create Database Table (5 min)

- [ ] Go to supabase.com/dashboard
- [ ] Log in
- [ ] Click your project name
- [ ] Click "SQL Editor" on left side
- [ ] Click green "New Query" button
- [ ] Open file: `C:\Projects\CleanCopy\supabase\migrations\20251012_create_scraped_videos_table.sql`
- [ ] Select all (Ctrl+A), copy (Ctrl+C)
- [ ] Paste into Supabase SQL Editor (Ctrl+V)
- [ ] Click "Run" button (bottom right)
- [ ] See green "Success" message ✅

---

## PART 2: Save Your Keys (10 min)

- [ ] In Supabase, click "Project Settings" (gear icon, bottom left)
- [ ] Click "API" in menu
- [ ] Find "Project URL" at top
- [ ] Copy it, paste in Notepad
- [ ] Find "service_role" key (NOT "anon")
- [ ] Click Copy button
- [ ] Paste in Notepad
- [ ] Click "Edge Functions" in left menu
- [ ] Click "Secrets" tab
- [ ] Click "New Secret"
- [ ] Name: `SUPABASE_URL`, Value: (paste your URL from Notepad)
- [ ] Click "Create Secret"
- [ ] Click "New Secret" again
- [ ] Name: `SUPABASE_SERVICE_ROLE_KEY`, Value: (paste your key from Notepad)
- [ ] Click "Create Secret"
- [ ] See 2 secrets listed ✅

---

## PART 3: Upload Function (5 min)

- [ ] Download Supabase CLI: https://supabase.com/docs/guides/cli/getting-started
- [ ] Install it (click Next until done)
- [ ] Press Windows key, type "cmd", press Enter
- [ ] Type: `supabase login` and press Enter
- [ ] Click "Authorize" on webpage that opens
- [ ] Find your Project Reference ID:
  - In Supabase: Project Settings → General → Reference ID
  - Copy the 20-character code
- [ ] In Command Prompt, type: `supabase link --project-ref PASTE_YOUR_ID_HERE`
- [ ] Press Enter
- [ ] Type: `cd C:\Projects\CleanCopy`
- [ ] Press Enter
- [ ] Type: `supabase functions deploy apify-ingest --no-verify-jwt`
- [ ] Press Enter
- [ ] Wait for "Deployed Function apify-ingest" message ✅

---

## PART 4: Connect Apify (10 min)

- [ ] Go to console.apify.com
- [ ] Log in
- [ ] Click "Actors" → "Tasks"
- [ ] Click your TikTok scraper task
- [ ] Click "Settings" tab
- [ ] Scroll to "Integrations" section
- [ ] Click "Add Integration"
- [ ] Select "HTTP Request"
- [ ] Check "Run succeeded" only
- [ ] For URL, paste: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/apify-ingest`
  - Replace `YOUR_PROJECT_REF` with the ID from Part 3
- [ ] Select "POST" for method
- [ ] Click "Edit Headers"
- [ ] Delete everything in the box
- [ ] Copy this template:
```json
{
  "Authorization": "Bearer YOUR_KEY",
  "apikey": "YOUR_KEY",
  "Content-Type": "application/json"
}
```
- [ ] Replace BOTH `YOUR_KEY` with your service_role key from Notepad
- [ ] Click "Save"
- [ ] Make sure toggle is ON (green) ✅

---

## PART 5: Test It (5 min)

- [ ] In Apify, go to your task
- [ ] Click "Input" tab
- [ ] Change number of videos to scrape to **5**
- [ ] Click big green "Run" button
- [ ] Wait for "Succeeded" status
- [ ] Click "Integrations" tab
- [ ] See green checkmark and "200 OK" ✅
- [ ] Go to Supabase → SQL Editor
- [ ] Click "New Query"
- [ ] Paste this:
```sql
SELECT * FROM scraped_videos ORDER BY scraped_at DESC LIMIT 5;
```
- [ ] Click "Run"
- [ ] See 5 videos in results ✅

---

## 🎉 DONE!

If you checked all boxes, you're all set!

### Quick Test Anytime:

**Check how many videos are saved:**
1. Supabase → SQL Editor → New Query
2. Paste: `SELECT COUNT(*) FROM scraped_videos;`
3. Click Run
4. See total count

---

## ⚠️ IF SOMETHING FAILED

**401 Error in Apify:**
→ Part 4: Make sure you pasted your key in BOTH places in the headers

**500 Error in Apify:**
→ Part 1: Re-run the SQL script

**No videos in database:**
→ Part 5: Check if Apify shows "200 OK" first

**Can't install CLI:**
→ Ask someone to help with Part 3 (it's the most technical step)

---

**Print this page and check off each box as you go!**


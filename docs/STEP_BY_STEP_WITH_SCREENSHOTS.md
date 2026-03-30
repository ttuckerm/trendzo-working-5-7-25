# 📸 Step-by-Step Guide with Screenshots Descriptions
## Setting Up Apify → Supabase Connection

This guide describes exactly what you'll see on your screen at each step.

---

## 🎬 SECTION 1: CREATE THE DATABASE TABLE

### Step 1: Log into Supabase
1. Open web browser
2. Go to: **supabase.com/dashboard**
3. Enter your email and password
4. Click green "Sign In" button

**What you see:** Your Supabase dashboard with a list of projects

---

### Step 2: Open Your Project
1. Look for your project (probably named "Trendzo")
2. Click on the project name

**What you see:** A sidebar on the left with lots of icons

---

### Step 3: Open SQL Editor
1. Look at the left sidebar
2. Find the icon that looks like a document with "<>" on it
3. The text next to it says "SQL Editor"
4. Click it

**What you see:** A page with "SQL Editor" at the top, and a big empty text box

---

### Step 4: Create New Query
1. Look at the top right corner
2. Find the green button that says "+ New Query"
3. Click it

**What you see:** A blank text editor where you can type

---

### Step 5: Get the SQL Code
1. On your computer, open File Explorer (folder icon on taskbar)
2. Navigate to: `C:\Projects\CleanCopy\supabase\migrations\`
3. Find the file: `20251012_create_scraped_videos_table.sql`
4. Double-click it to open
5. Press **Ctrl+A** (selects everything)
6. Press **Ctrl+C** (copies it)

**What you see:** Notepad or text editor with lots of SQL code

---

### Step 6: Paste and Run
1. Go back to Supabase SQL Editor
2. Click in the text box
3. Press **Ctrl+V** (pastes the code)
4. Look at bottom right corner
5. Click the button that says "Run" or "RUN" (it might be green)

**What you see:** 
- The "Run" button will flash
- After a few seconds, you'll see a green message: "Success. No rows returned"
- If you see this, it worked! ✅

**If you see red error:**
- Read the error message
- Most common: "table already exists" = Good! It means the table is already there
- Other error: Copy the error message and save it for later

---

## 🎬 SECTION 2: ADD YOUR SECRET KEYS

### Step 7: Go to Project Settings
1. Look at the left sidebar (all the way at the bottom)
2. Find the gear icon (⚙️)
3. Text next to it says "Project Settings"
4. Click it

**What you see:** A page with "Project Settings" at the top

---

### Step 8: Find Your Keys
1. On the left menu, click "API"
2. Scroll down to "Project API keys" section

**What you see:** Several rows with titles like:
- "anon" / "public"
- "service_role"

---

### Step 9: Copy Your Keys
1. Find the row labeled "service_role" (NOT "anon")
2. On the right side of that row, click the clipboard icon (📋) or "Copy" button
3. Open Notepad (Start → Type "notepad" → Enter)
4. Paste it (Ctrl+V)
5. Press Enter to go to next line
6. Go back to Supabase
7. Scroll up to the top of the page
8. Find "Project URL" (looks like: `https://abcdefg.supabase.co`)
9. Click the copy button next to it
10. Go back to Notepad
11. Paste it (Ctrl+V)
12. **Save this Notepad file!** (File → Save As → "supabase-keys.txt")

**What your Notepad looks like:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh... (very long key)
https://abcdefghijk.supabase.co
```

---

### Step 10: Add Secrets
1. In Supabase, look at left sidebar
2. Click "Edge Functions"
3. At the top of the page, click the "Secrets" tab
4. Click the button "+ New Secret"

**What you see:** A popup window with two fields

---

### Step 11: First Secret
1. In "Name" field, type exactly: `SUPABASE_URL`
2. In "Value" field, paste your URL from Notepad (the one that starts with https://)
3. Click "Create Secret" button

**What you see:** The popup closes, and you see your secret listed

---

### Step 12: Second Secret
1. Click "+ New Secret" again
2. In "Name" field, type exactly: `SUPABASE_SERVICE_ROLE_KEY`
3. In "Value" field, paste your long key from Notepad (the one starting with eyJhbG...)
4. Click "Create Secret" button

**What you see:** Two secrets now listed:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

✅ If you see both, you're done with this section!

---

## 🎬 SECTION 3: UPLOAD THE CODE (Most Technical Part)

### Step 13: Download Supabase CLI
1. Open new browser tab
2. Go to: **supabase.com/docs/guides/cli/getting-started**
3. Find the section "Install the Supabase CLI"
4. Click the Windows download link
5. Run the installer
6. Click "Next" through all screens
7. Click "Install"
8. Wait for it to finish
9. Click "Finish"

**What you see:** Normal Windows installer screens

---

### Step 14: Open Command Prompt
1. Press the Windows key on your keyboard
2. Type: **cmd**
3. Press Enter

**What you see:** A black window with white text (this is called Command Prompt)

---

### Step 15: Login to Supabase
1. In the black window, type exactly: `supabase login`
2. Press Enter
3. Wait for a browser window to open
4. Click the "Authorize" button

**What you see in Command Prompt:** 
- Text that says "Opening browser..."
- Then "You are now logged in"

---

### Step 16: Connect to Your Project
1. Go back to Supabase in your browser
2. Click "Project Settings" (gear icon, bottom left)
3. Make sure "General" is selected in the left menu
4. Find "Reference ID" (it's a 20-character code like: `abcdefghijklmnopqrst`)
5. Click the copy button next to it
6. Go back to Command Prompt
7. Type: `supabase link --project-ref ` (note the space at the end)
8. Press Ctrl+V to paste your Reference ID
9. Press Enter
10. It will ask for your database password - enter it and press Enter

**What you see:** "Finished supabase link"

---

### Step 17: Navigate to Your Project Folder
1. In Command Prompt, type exactly: `cd C:\Projects\CleanCopy`
2. Press Enter

**What you see:** The line now shows `C:\Projects\CleanCopy>`

---

### Step 18: Deploy the Function
1. Type exactly: `supabase functions deploy apify-ingest --no-verify-jwt`
2. Press Enter
3. Wait (this might take 30-60 seconds)

**What you see:** 
- "Deploying Function..." 
- "Deployed Function apify-ingest version 1.0"
- If you see this, it worked! ✅

**If you see an error:**
- Screenshot it
- You may need technical help for this step
- The error message will tell a developer what went wrong

---

## 🎬 SECTION 4: CONNECT APIFY

### Step 19: Go to Apify
1. Open new browser tab
2. Go to: **console.apify.com**
3. Log in with your Apify account

**What you see:** Apify dashboard

---

### Step 20: Find Your Task
1. At the top menu, click "Actors"
2. Click "Tasks" tab (under "Actors")
3. Look for your TikTok scraper (probably called "tiktok-scraper-prod")
4. Click on it

**What you see:** Your task details page with tabs at the top

---

### Step 21: Go to Settings
1. Click the "Settings" tab at the top
2. Scroll down until you see "Integrations" section

**What you see:** A section with "+ Add Integration" button

---

### Step 22: Add Integration
1. Click the "+ Add Integration" button
2. A list appears - click "HTTP Request"

**What you see:** A form with multiple fields

---

### Step 23: Configure the Webhook
1. Under "Event", check the box for "Run succeeded" ONLY
2. Leave other boxes unchecked

**What you see:** One checkbox is checked (Run succeeded)

---

### Step 24: Add the URL
1. Go back to Supabase → Project Settings → General
2. Copy your Reference ID again
3. Go back to Apify
4. In the "Request URL" field, paste this:
```
https://YOUR_REF_ID_HERE.supabase.co/functions/v1/apify-ingest
```
5. Replace `YOUR_REF_ID_HERE` with your actual Reference ID

**Example:** If your Reference ID is `abcdefghijk`, the URL should be:
```
https://abcdefghijk.supabase.co/functions/v1/apify-ingest
```

---

### Step 25: Set Method
1. Find "HTTP Method" dropdown
2. Select "POST"

**What you see:** Dropdown now shows "POST"

---

### Step 26: Add Headers (IMPORTANT!)
1. Find the "Headers template" section
2. Click "Edit Headers" or the pencil icon
3. A text box appears
4. Delete anything in that box
5. Open your Notepad file (supabase-keys.txt)
6. Copy this template:
```json
{
  "Authorization": "Bearer YOUR_KEY_HERE",
  "apikey": "YOUR_KEY_HERE",
  "Content-Type": "application/json"
}
```
7. Paste it into the Apify headers box
8. Find the TWO places where it says `YOUR_KEY_HERE`
9. Replace BOTH with your service_role key from Notepad

**Important:** The key is the LONG text that starts with `eyJhbG...`, NOT the URL!

**What it should look like:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjk0NzAwMDAwfQ.xxxx",
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjk0NzAwMDAwfQ.xxxx",
  "Content-Type": "application/json"
}
```

---

### Step 27: Save Everything
1. Scroll down to the bottom
2. Click "Save" button
3. Make sure the toggle switch is ON (should be green/blue)

**What you see:** Integration is now listed in the Integrations section

✅ Done! Apify is now connected!

---

## 🎬 SECTION 5: TEST IT

### Step 28: Run a Test
1. In Apify, go back to your task (click the task name at top)
2. Click "Input" tab
3. Find where it asks for number of videos (might say "maxItems" or "resultsPerPage")
4. Change it to **5** (just for testing)
5. Scroll to bottom
6. Click the big "Run" button
7. Wait for it to finish (30 seconds to 2 minutes)

**What you see:** Status changes from "Running..." to "Succeeded"

---

### Step 29: Check Integration Log
1. Click the "Integrations" tab
2. Look for a new log entry
3. It should have a green checkmark
4. Text should say "200 OK" or "Success"

**If you see green checkmark and 200 OK:** Perfect! It worked! ✅

**If you see red X or error:**
- Click on it to see details
- Common errors:
  - "401 Unauthorized" = Go back to Step 26, check your headers
  - "500 Server Error" = Go back to Section 1, re-run the SQL
  - Take a screenshot of the error

---

### Step 30: Check Your Database
1. Go back to Supabase
2. Click "SQL Editor" on left sidebar
3. Click "+ New Query"
4. Copy and paste this:
```sql
SELECT video_id, creator_username, views_count, caption
FROM scraped_videos
ORDER BY scraped_at DESC
LIMIT 5;
```
5. Click "Run"

**What you see:** 
- A table with 5 rows
- Each row is a TikTok video with data
- If you see this, EVERYTHING WORKED! 🎉

**If you see no results:**
- Check Step 29 first (was there a 200 OK?)
- If Apify showed error, fix that first
- If Apify showed success but no data here, something went wrong in the function

---

## 🎉 YOU'RE DONE!

From now on:
1. When Apify finishes scraping
2. Videos automatically appear in your database
3. No manual work needed!

### How to check anytime:

**Quick query to see how many videos you have:**
1. Supabase → SQL Editor → New Query
2. Paste:
```sql
SELECT COUNT(*) FROM scraped_videos;
```
3. Click Run
4. You'll see a number (that's how many videos are saved)

---

## 📞 HELP!

**If you're stuck:**
1. Take a screenshot of the error
2. Note which step number you're on
3. Write down what you expected to see vs. what you actually saw
4. Share that with someone technical

The screenshot will show them exactly what went wrong!

---

**Good luck! You got this! 💪**


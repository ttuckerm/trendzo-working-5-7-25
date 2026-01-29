# TikTok Transcript Pipeline - User Guide

## ✅ What's Working

Your TikTok data pipeline is fully operational:

1. **Apify Scraper** → Automatically scrapes TikTok videos and saves to Supabase
2. **Transcript Generator** → Downloads videos and generates transcripts using OpenAI Whisper
3. **Database** → All data stored in Supabase `scraped_videos` table

---

## 🚀 Quick Start

### Option 1: Double-Click Batch Files (Easiest)

**Check Pipeline Status:**
- Double-click `check-status.bat`
- Shows: total videos, how many have transcripts, recent videos

**Generate Transcripts:**
- Double-click `run-transcripts.bat` (transcribes 5 videos)
- Or run from command line: `run-transcripts.bat 10` (transcribes 10 videos)

### Option 2: Command Line

```bash
# Check status
python scripts/check-pipeline-status.py

# Generate transcripts (5 videos)
python scripts/transcribe-videos.py --limit 5

# Generate transcripts (10 videos)
python scripts/transcribe-videos.py --limit 10
```

---

## 📊 Check Results in Supabase

1. Go to **Supabase** → **SQL Editor**
2. Run this query:

```sql
SELECT 
  video_id,
  creator_username,
  views_count,
  likes_count,
  LEFT(description, 80) as caption,
  LEFT(transcript_text, 100) as transcript
FROM scraped_videos 
WHERE transcript_text IS NOT NULL
ORDER BY updated_at DESC 
LIMIT 10;
```

---

## 🔄 Complete Workflow

### Step 1: Scrape Videos (Automatic)
- Apify runs your task
- Videos automatically saved to Supabase
- Includes: views, likes, comments, creator info, hashtags

### Step 2: Generate Transcripts (Manual)
- Run `run-transcripts.bat` or use the command line
- Script downloads videos, extracts audio, calls Whisper API
- Transcripts saved to database

### Step 3: Use the Data
- All data available in `scraped_videos` table
- Use for DPS analysis, pattern extraction, etc.

---

## 📁 Files Created

- `scripts/transcribe-videos.py` - Main transcript generation script
- `scripts/check-pipeline-status.py` - Status checker
- `scripts/verify-transcripts.py` - Verification helper
- `run-transcripts.bat` - Quick run batch file
- `check-status.bat` - Quick status check

---

## 💡 Tips

**Cost Management:**
- Whisper costs $0.006 per minute of audio
- 30-second video ≈ $0.003
- Only transcribe videos you need

**Batch Processing:**
- Process 10-20 videos at a time
- Script has 2-second delay between videos (rate limiting)
- Can be interrupted with Ctrl+C

**Troubleshooting:**
- If PowerShell shows "file not found", make sure you're in `C:\Projects\CleanCopy`
- Environment variables are set in the batch files
- FFmpeg and yt-dlp are installed via Scoop

---

## 🎯 What's Next

Your pipeline is complete! You can now:
1. Continue scraping with Apify
2. Generate transcripts as needed
3. Build your DPS analysis features
4. Move on to your other 59 features

The transcript generation is decoupled from scraping, so you have full control over when to transcribe and how many videos to process.


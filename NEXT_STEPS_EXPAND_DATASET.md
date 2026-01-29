# 📋 Next Steps: Expand Dataset from 116 to 600+ Videos

**Current Status**: Model trained on 116/788 videos (14.7% with transcripts)
**Goal**: Train on 600+ videos for better generalization

---

## Overview

The XGBoost model is currently trained on only 116 videos because 672 out of 788 scraped videos (85.3%) don't have transcripts. To improve model performance and generalization, we need to:

1. **Fix TikTok scraper** to capture transcripts more reliably
2. **Use speech-to-text API** to generate transcripts for videos without them
3. **Scrape more high-DPS content** (80+ range) for better viral prediction

---

## Step 1: Fix TikTok Scraper for Better Transcript Capture

### Current Problem
The Apify TikTok scraper (`clockworks/tiktok-scraper`) doesn't always capture transcripts. Out of 788 videos scraped, only 116 have transcripts.

### Solution A: Update Scraper Configuration

**Action**: Check if Apify scraper has a setting to force transcript capture

```typescript
// In your Apify scraper configuration (src/lib/api/apify-scrapers.ts or similar)
const scrapingInput = {
  // ... existing config
  shouldDownloadVideos: false,
  shouldDownloadCovers: false,
  shouldDownloadSubtitles: true,  // ← ADD THIS
  shouldDownloadSlideshowImages: false,
};
```

**Test**: Run a small scrape (10-20 videos) and check if transcripts are captured.

### Solution B: Try Alternative Scrapers

If the current scraper doesn't support reliable transcript capture, consider:

1. **TikTok Unofficial API** (requires TikTok account)
   - More reliable transcript access
   - Higher rate limits
   - More expensive

2. **Custom Scraper with Playwright**
   - Full control over transcript extraction
   - Can target specific selectors
   - Requires maintenance

3. **Apify's "TikTok Video Scraper" (different actor)**
   - Try: `apify/tiktok-video-scraper` instead of `clockworks/tiktok-scraper`
   - May have better transcript support

### Solution C: Re-scrape Existing Videos

We have 672 videos without transcripts. Re-scrape them specifically to get transcripts:

```typescript
// Create script: scripts/rescrape-for-transcripts.ts

import { createClient } from '@supabase/supabase-js';
import { ApifyClient } from 'apify-client';

async function rescrapeForTranscripts() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const apify = new ApifyClient({ token: APIFY_API_TOKEN });

  // Get all videos without transcripts
  const { data: videos } = await supabase
    .from('scraped_videos')
    .select('video_id, video_url')
    .is('transcript_text', null)
    .limit(100); // Start with 100

  console.log(`Re-scraping ${videos.length} videos for transcripts...`);

  const run = await apify.actor('clockworks/tiktok-scraper').call({
    postURLs: videos.map(v => v.video_url),
    resultsPerPage: 100,
    shouldDownloadSubtitles: true, // Force transcript download
  });

  // Process results and update database
  for (const item of run.dataset.items) {
    if (item.subtitles || item.transcript) {
      await supabase
        .from('scraped_videos')
        .update({
          transcript_text: item.subtitles || item.transcript
        })
        .eq('video_id', item.id);
    }
  }
}
```

**Estimated Time**: 672 videos ÷ 100 per batch = ~7 batches × 5 minutes = 35 minutes
**Estimated Cost**: 672 videos × $0.0003/video = ~$0.20

---

## Step 2: Use Speech-to-Text API for Missing Transcripts

This is the **most reliable** solution. Generate transcripts from video audio using AI.

### Option A: OpenAI Whisper API (Recommended)

**Pros**:
- Extremely accurate (near-human quality)
- Supports 99+ languages
- Fast (real-time processing)
- Affordable ($0.006 per minute of audio)

**Cons**:
- Requires video file download
- Costs money (but very cheap)

#### Implementation

```typescript
// scripts/generate-transcripts-with-whisper.ts

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function downloadVideo(videoUrl: string, outputPath: string) {
  const response = await axios.get(videoUrl, { responseType: 'stream' });
  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function transcribeVideo(videoPath: string): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(videoPath),
    model: 'whisper-1',
    language: 'en', // Auto-detect if undefined
    response_format: 'text',
  });
  return transcription;
}

async function main() {
  // Get videos without transcripts
  const { data: videos } = await supabase
    .from('scraped_videos')
    .select('video_id, video_url, video_duration')
    .is('transcript_text', null)
    .limit(50); // Process in batches

  console.log(`Processing ${videos.length} videos...`);

  let processed = 0;
  let failed = 0;
  let totalCost = 0;

  for (const video of videos) {
    try {
      // Download video to temp file
      const tempPath = path.join(__dirname, `temp_${video.video_id}.mp4`);
      console.log(`Downloading: ${video.video_id}...`);
      await downloadVideo(video.video_url, tempPath);

      // Transcribe
      console.log(`Transcribing: ${video.video_id}...`);
      const transcript = await transcribeVideo(tempPath);

      // Update database
      await supabase
        .from('scraped_videos')
        .update({ transcript_text: transcript })
        .eq('video_id', video.video_id);

      // Clean up
      fs.unlinkSync(tempPath);

      // Calculate cost (Whisper: $0.006 per minute)
      const durationMinutes = (video.video_duration || 30) / 60;
      const cost = durationMinutes * 0.006;
      totalCost += cost;

      processed++;
      console.log(`✅ ${video.video_id} - ${transcript.substring(0, 50)}... (cost: $${cost.toFixed(4)})`);
    } catch (error) {
      console.error(`❌ Failed: ${video.video_id}`, error.message);
      failed++;
    }
  }

  console.log(`\nProcessed: ${processed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total cost: $${totalCost.toFixed(2)}`);
}

main();
```

**Cost Estimate**:
- 672 videos × 30 seconds average = 336 minutes
- 336 minutes × $0.006/minute = **$2.02 total**

**Time Estimate**: ~2-3 hours for 672 videos

#### Running the Script

```bash
# Install dependencies
npm install openai axios

# Run the script
npx tsx scripts/generate-transcripts-with-whisper.ts

# Expected output:
# Processing 50 videos...
# Downloading: 7560321608347323670...
# Transcribing: 7560321608347323670...
# ✅ 7560321608347323670 - "Hey guys, today I'm going to show you..." (cost: $0.0030)
# ...
# Processed: 48
# Failed: 2
# Total cost: $0.14
```

### Option B: Deepgram API (Faster, Cheaper)

**Pros**:
- Faster than Whisper (3x speed)
- Cheaper ($0.0043 per minute)
- Supports streaming (for real-time)

**Cons**:
- Slightly less accurate than Whisper
- Fewer language support

**Implementation**:

```typescript
import { createClient } from '@deepgram/sdk';

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

async function transcribeWithDeepgram(videoUrl: string): Promise<string> {
  const { result } = await deepgram.listen.prerecorded.transcribeUrl(
    { url: videoUrl },
    {
      model: 'nova-2',
      language: 'en',
      smart_format: true,
      punctuate: true,
    }
  );

  return result.results.channels[0].alternatives[0].transcript;
}
```

**Cost Estimate**: 672 videos × 0.5 minutes × $0.0043 = **$1.44 total**

### Option C: Google Speech-to-Text (Most Accurate, Expensive)

**Pros**:
- Highest accuracy
- Best punctuation
- Best for multiple speakers

**Cons**:
- Most expensive ($0.024 per minute)
- Requires GCP setup

**Cost Estimate**: 672 videos × 0.5 minutes × $0.024 = **$8.06 total**

---

## Step 3: Scrape More High-DPS Content (80+ Range)

### Current Problem
Only 4 out of 116 videos (3.4%) have DPS > 80. This creates a bias toward medium-performing content.

### Solution: Targeted Scraping of Viral Content

#### Strategy 1: Scrape TikTok Trending Page

```typescript
// scripts/scrape-trending-videos.ts

const trendingScrapingInput = {
  hashtags: [], // Leave empty to get trending
  searchQueries: [],
  resultsPerPage: 50,
  maxPostCount: 200, // Get 200 trending videos
  shouldDownloadSubtitles: true,
};

const run = await apify.actor('clockworks/tiktok-scraper').call(trendingScrapingInput);
```

**Expected**: 200 trending videos, likely 50-100 with DPS > 80

#### Strategy 2: Scrape from High-Performing Creators

```typescript
// scripts/scrape-viral-creators.ts

const viralCreators = [
  'khaby.lame',
  'charlidamelio',
  'addisonre',
  'zachking',
  // Add more from https://www.tiktok.com/discover/top-100
];

for (const creator of viralCreators) {
  const run = await apify.actor('clockworks/tiktok-scraper').call({
    profiles: [creator],
    resultsPerPage: 30,
    maxPostCount: 30, // Get 30 recent videos per creator
    shouldDownloadSubtitles: true,
  });
}
```

**Expected**: 20 creators × 30 videos = 600 videos, likely 200-300 with DPS > 70

#### Strategy 3: Scrape by Hashtag (Viral Topics)

```typescript
const viralHashtags = [
  '#viral',
  '#fyp',
  '#foryou',
  '#trending',
  '#storytime',
  '#challenge',
];

for (const hashtag of viralHashtags) {
  const run = await apify.actor('clockworks/tiktok-scraper').call({
    hashtags: [hashtag],
    resultsPerPage: 50,
    maxPostCount: 100,
    shouldDownloadSubtitles: true,
  });
}
```

**Expected**: 6 hashtags × 100 videos = 600 videos, likely 100-200 with DPS > 70

---

## Complete Implementation Plan

### Phase 1: Generate Transcripts for Existing 672 Videos (Week 1)

**Goal**: Get 672 transcripts using Whisper API
**Cost**: ~$2.00
**Time**: 2-3 hours

**Steps**:
1. ✅ Create `scripts/generate-transcripts-with-whisper.ts` (provided above)
2. ✅ Run in batches of 50 videos
3. ✅ Monitor progress and errors
4. ✅ Verify transcripts are saved to database

**Script to Run**:
```bash
npx tsx scripts/generate-transcripts-with-whisper.ts
```

**Expected Result**: 600-650 videos with transcripts (90%+ success rate)

### Phase 2: Scrape Additional Viral Content (Week 2)

**Goal**: Scrape 200-300 more videos with DPS > 70
**Cost**: ~$0.50 (Apify credits)
**Time**: 1-2 hours

**Steps**:
1. ✅ Create `scripts/scrape-trending-videos.ts`
2. ✅ Run trending scraper (200 videos)
3. ✅ Run viral creators scraper (600 videos)
4. ✅ Filter for DPS > 60 and with transcripts

**Script to Run**:
```bash
npx tsx scripts/scrape-trending-videos.ts
npx tsx scripts/scrape-viral-creators.ts
```

**Expected Result**: 800-1000 videos total, 100-150 with DPS > 70

### Phase 3: Extract Features & Retrain Model (Week 2)

**Goal**: Train model on 600-800 videos
**Time**: 1 hour

**Steps**:
1. ✅ Run feature extraction on all new transcripts
2. ✅ Store features in database
3. ✅ Retrain XGBoost model
4. ✅ Compare performance (before vs after)

**Scripts to Run**:
```bash
# Extract features from all videos with transcripts
npx tsx scripts/extract-all-features.ts

# Store in database
npx tsx scripts/store-features-in-db.ts

# Train model
python scripts/train-xgboost-model.py

# Verify
npx tsx scripts/verify-model-training.ts
```

**Expected Result**:
- R² improves from 0.970 to 0.975-0.980 (marginal)
- MAE stays around 0.99 or improves to 0.7-0.8
- Model generalizes better to diverse content

---

## Detailed Scripts

### Script 1: Generate Transcripts with Whisper

Create `scripts/generate-transcripts-with-whisper.ts`:

```typescript
import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function downloadVideo(videoUrl: string, outputPath: string) {
  console.log(`  Downloading video...`);
  const response = await axios.get(videoUrl, {
    responseType: 'stream',
    timeout: 30000,
  });

  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
    setTimeout(() => reject(new Error('Download timeout')), 30000);
  });
}

async function transcribeVideo(videoPath: string): Promise<string> {
  console.log(`  Transcribing with Whisper...`);
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(videoPath),
    model: 'whisper-1',
    response_format: 'text',
  });
  return transcription as unknown as string;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     GENERATE TRANSCRIPTS WITH WHISPER API                  ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get videos without transcripts
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('video_id, video_url, video_duration')
    .is('transcript_text', null)
    .not('video_url', 'is', null)
    .limit(50); // Process 50 at a time

  if (error || !videos) {
    console.error('❌ Error fetching videos:', error?.message);
    return;
  }

  console.log(`📊 Found ${videos.length} videos without transcripts\n`);

  let processed = 0;
  let failed = 0;
  let totalCost = 0;
  const tempDir = path.join(process.cwd(), 'temp_videos');

  // Create temp directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const tempPath = path.join(tempDir, `${video.video_id}.mp4`);

    console.log(`\n[${i + 1}/${videos.length}] Processing: ${video.video_id}`);

    try {
      // Download video
      await downloadVideo(video.video_url, tempPath);

      // Transcribe
      const transcript = await transcribeVideo(tempPath);

      if (!transcript || transcript.length < 10) {
        throw new Error('Transcript too short or empty');
      }

      // Update database
      const { error: updateError } = await supabase
        .from('scraped_videos')
        .update({ transcript_text: transcript })
        .eq('video_id', video.video_id);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      // Calculate cost
      const durationMinutes = (video.video_duration || 30) / 60;
      const cost = durationMinutes * 0.006;
      totalCost += cost;

      processed++;
      console.log(`  ✅ Success`);
      console.log(`  Transcript: "${transcript.substring(0, 80)}..."`);
      console.log(`  Length: ${transcript.length} characters`);
      console.log(`  Cost: $${cost.toFixed(4)}`);

    } catch (error: any) {
      console.error(`  ❌ Failed: ${error.message}`);
      failed++;
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     ✅ BATCH COMPLETE                                      ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Processed: ${processed}/${videos.length}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${(processed / videos.length * 100).toFixed(1)}%`);
  console.log(`Total Cost: $${totalCost.toFixed(2)}`);
  console.log(`\nEstimated cost for all 672 videos: $${(totalCost / processed * 672).toFixed(2)}`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
```

### Script 2: Scrape Trending Videos

Create `scripts/scrape-trending-videos.ts`:

```typescript
import { config } from 'dotenv';
config();

import { ApifyClient } from 'apify-client';
import { createClient } from '@supabase/supabase-js';

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Scraping trending TikTok videos...\n');

  const run = await apify.actor('clockworks/tiktok-scraper').call({
    hashtags: [],
    profiles: [],
    resultsPerPage: 50,
    maxPostCount: 200,
    shouldDownloadSubtitles: true,
    shouldDownloadCovers: false,
    shouldDownloadVideos: false,
  });

  console.log(`Run completed. Processing ${run.defaultDatasetId}...\n`);

  const client = apify.dataset(run.defaultDatasetId);
  const { items } = await client.listItems();

  console.log(`Found ${items.length} videos\n`);

  for (const item of items) {
    // Insert into database (upsert to avoid duplicates)
    const { error } = await supabase.from('scraped_videos').upsert({
      video_id: item.id,
      video_url: item.videoUrl,
      title: item.text,
      description: item.text,
      transcript_text: item.subtitles || null,
      views_count: item.playCount,
      likes_count: item.diggCount,
      comments_count: item.commentCount,
      shares_count: item.shareCount,
      video_duration: item.videoMeta?.duration,
      creator_username: item.authorMeta?.name,
      // Add DPS calculation here if needed
    }, { onConflict: 'video_id' });

    if (error) {
      console.error(`Error inserting ${item.id}:`, error.message);
    } else {
      console.log(`✅ Inserted: ${item.id}`);
    }
  }

  console.log(`\n✅ Scraping complete!`);
}

main();
```

---

## Expected Outcomes

### After Phase 1 (Whisper Transcripts)
- **Dataset size**: 650-700 videos (116 existing + 534-584 new)
- **Cost**: ~$2.00
- **Model performance**: R² = 0.972-0.975 (+0.2-0.5%)

### After Phase 2 (Viral Content)
- **Dataset size**: 800-1000 videos
- **High-DPS videos (>80)**: 50-100 (vs 4 currently)
- **Cost**: ~$0.50
- **Model performance**: R² = 0.975-0.980 (+0.5-1.0%)

### After Phase 3 (Retraining)
- **Better generalization** across content types
- **Reduced reliance on historical DPS** (currently 88.37% importance)
- **More accurate viral predictions** for new content
- **Lower MAE** (0.99 → 0.7-0.8 DPS)

---

## Cost Summary

| Phase | Task | Cost | Time |
|-------|------|------|------|
| 1 | Whisper transcripts (672 videos) | $2.00 | 2-3 hours |
| 2 | Scrape trending (200 videos) | $0.20 | 30 mins |
| 2 | Scrape viral creators (600 videos) | $0.30 | 1 hour |
| 3 | Feature extraction | $0.00 | 5 mins |
| 3 | Model training | $0.00 | 2 mins |
| **TOTAL** | **Expand from 116 to 800+ videos** | **$2.50** | **4-5 hours** |

---

## Quick Start

Want to get started right now? Here's the fastest path:

### Option 1: Generate Transcripts (Recommended)

```bash
# 1. Install OpenAI library
npm install openai axios

# 2. Create the script (copy code from above)
# Save to: scripts/generate-transcripts-with-whisper.ts

# 3. Run it (processes 50 videos at a time)
npx tsx scripts/generate-transcripts-with-whisper.ts

# 4. Check progress in database
node -e "const {createClient}=require('@supabase/supabase-js'); const s=createClient('${NEXT_PUBLIC_SUPABASE_URL}','${SUPABASE_SERVICE_ROLE_KEY}'); s.from('scraped_videos').select('count').not('transcript_text','is',null).then(r=>console.log('Videos with transcripts:',r.data[0].count))"

# 5. Repeat until all 672 videos are processed
# Then proceed to feature extraction and training
```

### Option 2: Scrape More Videos

```bash
# 1. Create trending scraper (copy code from above)
# Save to: scripts/scrape-trending-videos.ts

# 2. Run it
npx tsx scripts/scrape-trending-videos.ts

# 3. Extract features and train
npx tsx scripts/extract-all-features.ts
npx tsx scripts/store-features-in-db.ts
python scripts/train-xgboost-model.py
```

---

## Monitoring Progress

Check how many videos have transcripts:

```bash
NEXT_PUBLIC_SUPABASE_URL="your-url" SUPABASE_SERVICE_ROLE_KEY="your-key" node -e "const {createClient}=require('@supabase/supabase-js'); const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY); s.from('scraped_videos').select('count').not('transcript_text','is',null).then(r=>console.log('Videos with transcripts:',r.data[0].count))"
```

Check dataset size after training:

```bash
cat models/training-metrics.json | grep -A 3 "dataset_size"
```

---

## Conclusion

Expanding from 116 to 600+ videos will:
✅ Cost only ~$2.50
✅ Take 4-5 hours total
✅ Improve model accuracy by 0.5-1.0%
✅ Enable better viral predictions
✅ Reduce reliance on historical DPS

**Recommended approach**: Start with Phase 1 (Whisper transcripts) to maximize ROI with minimal effort.

Ready to start? Copy the scripts above and run them!


<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create verification script for model training", "activeForm": "Creating verification script for model training", "status": "completed"}, {"content": "Run verification to confirm 116-video training", "activeForm": "Running verification to confirm 116-video training", "status": "completed"}, {"content": "Create guide for expanding dataset to 600+ videos", "activeForm": "Creating guide for expanding dataset to 600+ videos", "status": "in_progress"}]
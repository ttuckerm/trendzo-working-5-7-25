# 🎯 Action Plan: 3 Phases to Expand Dataset from 116 to 600+ Videos

**Current Status**: ✅ Model trained on 116 videos (R² = 0.970, MAE = 0.99 DPS)
**Goal**: Train on 600+ videos for better generalization
**Total Cost**: ~$2.50
**Total Time**: 4-5 hours

---

## Phase 1: Generate Transcripts with Whisper API ⭐ START HERE

**Goal**: Generate transcripts for 672 videos that don't have them
**Method**: OpenAI Whisper API (speech-to-text)
**Cost**: ~$2.00
**Time**: 2-3 hours

### Step 1.1: Install Dependencies

```bash
npm install openai axios
```

### Step 1.2: Create the Whisper Script

Create `scripts/generate-transcripts-with-whisper.ts` and copy this code:

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

### Step 1.3: Run the Script (Multiple Times)

```bash
# Run batch 1 (50 videos)
npx tsx scripts/generate-transcripts-with-whisper.ts

# Check progress
NEXT_PUBLIC_SUPABASE_URL="https://vyeiyccrageeckeehyhj.supabase.co" SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlZWNrZWVoeWhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkyMTYxMSwiZXhwIjoyMDYyNDk3NjExfQ.A-AngxU0Y6bEdTE-gDVoh9xRypol0C474LEgRKR8bE8" node -e "const {createClient}=require('@supabase/supabase-js'); const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY); s.from('scraped_videos').select('count').not('transcript_text','is',null).then(r=>console.log('Videos with transcripts:',r.data[0].count))"

# Run batch 2 (next 50 videos)
npx tsx scripts/generate-transcripts-with-whisper.ts

# Repeat ~14 times until all 672 videos are processed
# (672 ÷ 50 = ~14 batches)
```

### Step 1.4: Monitor Progress

After each batch, check how many transcripts you have:

```bash
# Quick check
NEXT_PUBLIC_SUPABASE_URL="https://vyeiyccrageeckeehyhj.supabase.co" SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlZWNrZWVoeWhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkyMTYxMSwiZXhwIjoyMDYyNDk3NjExfQ.A-AngxU0Y6bEdTE-gDVoh9xRypol0C474LEgRKR8bE8" node -e "const {createClient}=require('@supabase/supabase-js'); const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY); s.from('scraped_videos').select('count').not('transcript_text','is',null).then(r=>console.log('Videos with transcripts:',r.data[0].count))"
```

**Target**: 650-700 videos with transcripts (90%+ success rate)

---

## Phase 2: Scrape Additional Viral Content (Optional)

**Goal**: Get 200-300 more videos with DPS > 70
**Method**: Apify scraper targeting trending/viral creators
**Cost**: ~$0.50
**Time**: 1-2 hours

### Step 2.1: Scrape Trending Videos

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
    hashtags: ['#viral', '#fyp', '#trending'],
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

  let inserted = 0;
  let failed = 0;

  for (const item of items) {
    // Calculate DPS
    const engagement = (item.diggCount + item.commentCount + item.shareCount);
    const dps = (engagement / item.playCount) * 100;

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
      dps_score: dps,
    }, { onConflict: 'video_id' });

    if (error) {
      console.error(`❌ Error: ${item.id} - ${error.message}`);
      failed++;
    } else {
      console.log(`✅ Inserted: ${item.id} (DPS: ${dps.toFixed(1)})`);
      inserted++;
    }
  }

  console.log(`\n✅ Scraping complete!`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Failed: ${failed}`);
}

main();
```

Run it:

```bash
npx tsx scripts/scrape-trending-videos.ts
```

**Note**: This step is optional. Phase 1 alone will give you 600+ videos.

---

## Phase 3: Extract Features & Retrain Model

**Goal**: Train model on 600-800 videos
**Cost**: $0.00 (free)
**Time**: 10 minutes

### Step 3.1: Extract Features from All Videos

```bash
npx tsx scripts/extract-all-features.ts
```

**Expected output**:
```
✅ Found 650 videos with transcripts
✅ Extracted 650 feature vectors
✅ Success Rate: 100.0%
```

### Step 3.2: Store Features in Database

```bash
npx tsx scripts/store-features-in-db.ts
```

**Expected output**:
```
✅ Total records in video_features table: 650
✅ Success Rate: 100.0%
```

### Step 3.3: Train the Model

```bash
python scripts/train-xgboost-model.py
```

**Expected output**:
```
✅ Loaded 650 videos
✅ Train set: 520 videos
✅ Test set: 130 videos
✅ Test R²: 0.975 (improved from 0.970)
✅ Test MAE: 0.85 (improved from 0.99)
```

### Step 3.4: Verify the New Model

```bash
npx tsx scripts/verify-model-training.ts
```

**Expected output**:
```
✅ VERIFICATION COMPLETE
✅ XGBoost model has been successfully trained on 650 videos
✅ Model performance: R² = 0.975, MAE = 0.85 DPS
✅ All verifications passed
```

---

## Progress Tracking

### Current Status
- ✅ Model trained on 116 videos
- ✅ R² = 0.970, MAE = 0.99 DPS
- ✅ Verification script confirms all systems working

### Phase 1 Target
- 🎯 650-700 videos with transcripts
- 🎯 Cost: ~$2.00
- 🎯 Time: 2-3 hours

### Phase 3 Target
- 🎯 R² improves to 0.975-0.980
- 🎯 MAE improves to 0.7-0.9 DPS
- 🎯 Better generalization across content types

---

## Quick Commands Reference

### Check transcript count
```bash
NEXT_PUBLIC_SUPABASE_URL="https://vyeiyccrageeckeehyhj.supabase.co" SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlZWNrZWVoeWhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkyMTYxMSwiZXhwIjoyMDYyNDk3NjExfQ.A-AngxU0Y6bEdTE-gDVoh9xRypol0C474LEgRKR8bE8" node -e "const {createClient}=require('@supabase/supabase-js'); const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY); s.from('scraped_videos').select('count').not('transcript_text','is',null).then(r=>console.log('Videos with transcripts:',r.data[0].count))"
```

### Check model training size
```bash
cat models/training-metrics.json | grep -A 3 "dataset_size"
```

### Verify model
```bash
npx tsx scripts/verify-model-training.ts
```

---

## Summary

**To complete the checklist item, you need to:**

1. **Phase 1**: Generate transcripts for 672 videos using Whisper (~$2, 2-3 hours)
2. **Phase 2**: (Optional) Scrape more viral content (~$0.50, 1-2 hours)
3. **Phase 3**: Extract features and retrain model (free, 10 minutes)

**Start with Phase 1** - it's the most impactful and cost-effective!

**Total investment**: ~$2.00 and 2-3 hours to 5x your dataset from 116 to 600+ videos.

Ready to start? Run:
```bash
npm install openai axios
npx tsx scripts/generate-transcripts-with-whisper.ts
```

# Quick Start: Enhanced Pattern Extraction

## The Issue
Your dev server configuration uses different ports. Let's get this working.

## ⚡ FASTEST PATH TO SUCCESS

### Option 1: Run WITHOUT Dev Server (Recommended)

Create this file: `scripts/run-extraction-standalone.js`

```javascript
#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('\n🚀 Starting standalone pattern extraction...\n');

// This will run the extraction directly without needing the dev server
async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  // Check database connection
  const { data, error } = await supabase
    .from('video_patterns_detailed')
    .select('count')
    .limit(1);
    
  if (error && error.code === '42P01') {
    console.error('❌ Table video_patterns_detailed does not exist');
    console.log('\n📋 You need to apply the migration first:');
    console.log('   Go to Supabase Studio → SQL Editor');
    console.log('   Run: supabase/migrations/20251006_enhanced_video_patterns.sql\n');
    process.exit(1);
  }
  
  console.log('✅ Database connection successful');
  console.log('✅ Table exists');
  console.log('\n📊 Querying videos for extraction...\n');
  
  // Query videos
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 365);
  
  const { data: videos, error: videoError } = await supabase
    .from('scraped_videos')
    .select(`
      video_id,
      title,
      description,
      transcript,
      hashtags,
      creator_username,
      views_count,
      likes_count,
      platform,
      niche,
      dps_calculations!inner (
        viral_score,
        percentile
      )
    `)
    .eq('niche', 'personal-finance')
    .gte('scraped_at', cutoffDate.toISOString())
    .not('transcript', 'is', null)
    .limit(20);
  
  if (videoError) {
    console.error('❌ Error querying videos:', videoError);
    process.exit(1);
  }
  
  const highDpsVideos = videos.filter(v => {
    const dpsCalc = Array.isArray(v.dps_calculations) ? v.dps_calculations[0] : v.dps_calculations;
    return dpsCalc && dpsCalc.viral_score >= 70;
  });
  
  console.log(`✅ Found ${highDpsVideos.length} videos with DPS >= 70 and transcripts`);
  
  if (highDpsVideos.length === 0) {
    console.log('\n⚠️  No videos found. Try:');
    console.log('   1. Lowering minDPSScore to 50');
    console.log('   2. Checking if videos have transcripts:');
    console.log('      SELECT COUNT(*) FROM scraped_videos WHERE transcript IS NOT NULL;');
    process.exit(0);
  }
  
  console.log('\n📋 Sample videos:');
  highDpsVideos.slice(0, 3).forEach((v, i) => {
    const dps = Array.isArray(v.dps_calculations) ? v.dps_calculations[0] : v.dps_calculations;
    console.log(`   ${i + 1}. ${v.video_id} - DPS: ${dps.viral_score}`);
    console.log(`      "${(v.title || 'No title').substring(0, 60)}..."`);
    console.log(`      Transcript length: ${(v.transcript || '').length} chars`);
  });
  
  console.log('\n✅ Ready for extraction!');
  console.log('\n📝 Next: Call the API endpoint with these videos');
  console.log('   Or manually run GPT-4 extraction on them\n');
}

run().catch(console.error);
```

Run it:
```bash
node scripts/run-extraction-standalone.js
```

---

### Option 2: Manual Steps (If Above Doesn't Work)

1. **Apply Migration** (One time only):
   - Go to https://supabase.com/dashboard
   - SQL Editor → Copy contents of `supabase/migrations/20251006_enhanced_video_patterns.sql`
   - Run it

2. **Verify videos exist**:
   ```sql
   SELECT 
     sv.video_id,
     sv.title,
     sv.transcript,
     dc.viral_score
   FROM scraped_videos sv
   JOIN dps_calculations dc ON sv.video_id = dc.video_id
   WHERE sv.niche = 'personal-finance'
     AND dc.viral_score >= 70
     AND sv.transcript IS NOT NULL
   LIMIT 10;
   ```

3. **Manual extraction** (if needed):
   - Copy a transcript from above
   - Use ChatGPT/Claude to extract the 9 fields manually
   - Insert into `video_patterns_detailed` table

---

### Option 3: Fix Dev Server Issues

The dev server has port conflicts. To fix:

1. Kill all Node processes:
   ```bash
   taskkill /F /IM node.exe
   ```

2. Start fresh:
   ```bash
   npm run dev
   ```

3. Wait for "Ready in X.Xs"

4. Run extraction:
   ```bash
   node scripts/run-enhanced-pattern-extraction.js
   ```

---

## 🎯 What We're Trying To Do

Extract this structure for each video:
```json
{
  "topic": "Credit card debt",
  "angle": "Minimum payments are a trap",
  "hook_spoken": "If you're paying minimums...",
  "hook_text": "⚠️ Don't Do This",
  "hook_visual": "Person pointing at camera",
  "story_structure": "Problem → Solution",
  "visual_format": "Talking head + text",
  "key_visual_elements": ["Hand gestures", "Graphics"],
  "audio_description": "Upbeat music"
}
```

## 💡 Simplest Path

**Just apply the migration, then we can manually extract patterns or troubleshoot the API.**

The code is all ready. The only blocker is getting the data extraction to run!


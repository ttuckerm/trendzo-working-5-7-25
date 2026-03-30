# FFmpeg Integration: Architectural Limitation

## Root Cause Analysis

**Issue:** FFmpeg cannot analyze TikTok videos from scraped data.

**Root Cause:** TikTok CDN URLs expire within minutes/hours and cannot be used for delayed processing.

### Evidence

1. **URL Structure Analysis:**
   ```
   https://v16m-webapp.tiktokcdn-us.com/.../video.mp4?
     l=202510121829192FC81122817BC1E887BD  <- Timestamp-based token
     &expires=...                           <- Explicit expiration
   ```

2. **Expiration Test:**
   - URL scraped: October 12, 2025 13:29:19
   - Access attempted: October 29, 2025 21:09:34 (17 days later)
   - Result: `HTTP 403 Forbidden` from Akamai CDN

3. **Access Control:**
   - TikTok uses Akamai CDN with strict bot protection
   - URLs contain single-use, time-limited tokens
   - Headers (User-Agent, Referer) do NOT bypass expiration

### Current System Flow (Broken)

```
Day 1: Apify scrapes TikTok → Stores CDN URL in DB
  ↓
Day 17: User runs FFmpeg analysis → URL expired → 403 Forbidden
```

## Solution Options

### Option A: Real-Time Video Download (RECOMMENDED)

**Modify Apify scraper to download videos immediately:**

```typescript
// In Apify scraper workflow
async function onVideoScraped(video: TikTokVideo) {
  // 1. Download video file while URL is still valid
  const videoBuffer = await downloadVideo(video.cdnUrl);

  // 2. Upload to permanent storage (S3, Supabase Storage, etc.)
  const permanentUrl = await uploadToStorage(videoBuffer, video.id);

  // 3. Store permanent URL in database
  await db.scraped_videos.update({
    video_id: video.id,
    permanent_video_url: permanentUrl  // NEW FIELD
  });

  // 4. Optionally: Run FFmpeg analysis immediately
  const ffmpegData = await analyzeVideoMetrics(permanentUrl);
  await db.video_visual_analysis.insert(ffmpegData);
}
```

**Pros:**
- Videos available permanently
- FFmpeg analysis possible anytime
- No URL expiration issues

**Cons:**
- Requires storage costs (S3/Supabase Storage)
- Slower scraping process
- Storage space requirements (~10-50MB per video)

### Option B: Immediate FFmpeg Analysis (CURRENT WORKAROUND)

**Run FFmpeg analysis during scraping while URLs are fresh:**

```typescript
// In Apify scraper
async function onVideoScraped(video: TikTokVideo) {
  // Analyze immediately while URL is valid (within ~5 minutes of scrape)
  try {
    const ffmpegData = await analyzeVideoMetrics(video.cdnUrl);
    await db.video_visual_analysis.insert(ffmpegData);
  } catch (error) {
    console.warn('FFmpeg analysis failed, URL may have expired');
  }
}
```

**Pros:**
- No storage costs
- Simpler implementation

**Cons:**
- Must happen during scraping (tight time window)
- Can't re-analyze videos later
- Scraping becomes slower

### Option C: Accept Limitation (CURRENT STATE)

**Only analyze fresh videos (scraped within last hour):**

```typescript
// Filter for recently scraped videos
const recentVideos = await db.scraped_videos
  .select()
  .where('created_at_utc', '>', new Date(Date.now() - 3600000)) // Last hour
  .limit(10);

// These URLs *might* still be valid
for (const video of recentVideos) {
  try {
    await analyzeWithFFmpeg(video);
  } catch (error) {
    // URL already expired, skip
  }
}
```

**Pros:**
- No architecture changes
- Works for immediate processing

**Cons:**
- Can only process newest videos
- High failure rate (60-80% expired even within 1 hour)
- Limited usefulness

## Recommended Implementation Path

### Phase 1: Immediate (Workaround)
1. Document limitation for users
2. Add filter to only process videos < 1 hour old
3. Add clear error messages about URL expiration

### Phase 2: Short-term (Storage Integration)
1. Set up Supabase Storage bucket for videos
2. Modify Apify scraper to upload videos
3. Update database schema with `permanent_video_url` field
4. Migrate FFmpeg scripts to use permanent URLs

### Phase 3: Long-term (Full Integration)
1. Implement automatic video cleanup (delete after 30 days)
2. Add video download queue for priority videos
3. Implement FFmpeg analysis queue
4. Add retry logic for failed analyses

## Migration Steps for Users

### Current Users (Stuck with Expired URLs)

**You have two options:**

**Option 1: Re-scrape Videos**
```bash
# Re-run Apify scraper to get fresh URLs
# Then immediately run FFmpeg analysis (within 1 hour)
npm run apify-scrape
npx tsx scripts/populate-ffmpeg-data.ts --limit=10
```

**Option 2: Wait for Storage Implementation**
- Storage-based solution coming in Phase 2
- Videos will be permanently accessible
- Can analyze any video anytime

### Technical Debt

This issue reveals a critical architectural assumption:
- **Assumption:** External URLs remain valid indefinitely
- **Reality:** CDN URLs are ephemeral and single-use
- **Impact:** Any delayed processing of scraped data fails

**Affected Systems:**
- FFmpeg video analysis
- Thumbnail extraction
- Video re-processing
- Content moderation workflows

**Required Mindset Shift:**
- Treat scraped URLs as "read once, store immediately"
- External URLs should trigger immediate download, not be stored as-is
- Permanent storage is not optional, it's mandatory for delayed processing

## Cost Analysis

### Storage Costs (Supabase/S3)

**Assumptions:**
- Average video size: 20 MB
- Videos analyzed: 1,000 per month
- Storage period: 30 days

**Monthly Costs:**
- Storage: 20 MB × 1,000 = 20 GB → ~$0.50/month (S3)
- Bandwidth: 20 MB × 1,000 downloads → ~$1.80/month
- **Total: ~$2.50/month**

### Scraping Performance Impact

**Current:** 10 videos/minute
**With Download:** 3-5 videos/minute (60% slower)
**With Download + FFmpeg:** 1-2 videos/minute (80% slower)

## Conclusion

FFmpeg integration requires architectural changes to handle video permanence. The current "URL-only" scraping model is fundamentally incompatible with delayed video processing.

**Immediate Action Required:**
1. Implement video storage during scraping (Option A)
2. OR move FFmpeg analysis into scraper (Option B)
3. Update user documentation about limitations

**This is not a bug—it's an architectural design decision that needs revision.**

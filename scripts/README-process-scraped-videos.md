# Process Scraped Videos to DPS

This script processes videos from the `scraped_videos` table and calculates their DPS (Dynamic Percentile System) viral scores.

## Prerequisites

1. **Database Migration**: Run the migration to add DPS columns to scraped_videos:
   ```bash
   # Apply the migration in Supabase dashboard or via migration tool
   supabase/migrations/20251002_add_dps_to_scraped_videos.sql
   ```

2. **Environment Variables**: Ensure these are set in your `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_KEY=your-service-key
   # Optional: Override DPS API URL (defaults to http://localhost:3002/api/dps/calculate)
   DPS_API_URL=http://localhost:3002/api/dps/calculate
   ```

3. **DPS API Server**: Make sure the DPS API is running on port 3002:
   ```bash
   npm run dev
   ```

## Usage

### Basic Usage
Process all videos needing DPS calculation (100 per batch):
```bash
npm run process:scraped-videos
```

### Custom Batch Size
Process with a specific batch size:
```bash
npm run process:scraped-videos -- --batch-size=50
```

### Limit Total Videos
Process only a specific number of videos:
```bash
npm run process:scraped-videos -- --limit=500
```

### Combined Options
```bash
npm run process:scraped-videos -- --batch-size=50 --limit=1000
```

## What It Does

1. **Queries** the `scraped_videos` table for videos where `needs_processing = TRUE`
2. **Extracts** video metrics (views, likes, comments, shares, follower count, etc.)
3. **Calculates** hours since upload from the `upload_timestamp`
4. **Calls** the DPS API endpoint to calculate viral scores
5. **Updates** the database with results:
   - `dps_score` - Viral score (0-100)
   - `dps_percentile` - Percentile rank (0-100)
   - `dps_classification` - Classification (normal, viral, hyper-viral, mega-viral)
   - `dps_calculated_at` - Timestamp of calculation
   - `needs_processing` - Set to FALSE

## Output

The script provides real-time progress updates:

```
📊 Found 250 videos to process
📦 Batch size: 100
🔗 DPS API: http://localhost:3002/api/dps/calculate

📦 Processing batch 1 (100 videos)...

📊 Progress: 100/250 videos (40.0%)
   ✅ Success: 98 | ❌ Failed: 2
   📈 Avg DPS: 67.3 | ⏱️  12.5s (8.0 videos/sec)

📦 Processing batch 2 (100 videos)...
...

============================================================
✨ Processing Complete!
============================================================
📊 Total Processed: 250/250
✅ Successful: 245 (98.0%)
❌ Failed: 5
📈 Average DPS Score: 66.8
⏱️  Total Time: 32.1s
🚀 Processing Rate: 7.79 videos/sec
============================================================
```

## Error Handling

- **Individual failures**: If a video fails to process, the error is logged and the script continues with the next video
- **API failures**: Network errors and API errors are caught and logged
- **Database errors**: Update failures are caught and logged
- The script tracks success/failure counts in the final summary

## Database Schema Changes

The migration adds these columns to `scraped_videos`:

| Column | Type | Description |
|--------|------|-------------|
| `dps_score` | DECIMAL(5,2) | Viral score (0-100) |
| `dps_percentile` | DECIMAL(5,2) | Percentile rank (0-100) |
| `dps_classification` | VARCHAR(50) | Classification level |
| `dps_calculated_at` | TIMESTAMPTZ | When DPS was calculated |

## Troubleshooting

### "No videos need processing"
- All videos in `scraped_videos` have `needs_processing = FALSE`
- Check if videos exist: `SELECT COUNT(*) FROM scraped_videos WHERE needs_processing = TRUE;`

### API Connection Errors
- Verify the DPS API is running: `curl http://localhost:3002/api/dps/calculate`
- Check if port 3002 is correct
- Set `DPS_API_URL` environment variable if using a different endpoint

### Database Connection Errors
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set correctly
- Verify `SUPABASE_SERVICE_KEY` has proper permissions
- Check Supabase dashboard for connection issues

### High Failure Rate
- Check DPS API logs for errors
- Verify video data has required fields (views_count, creator_followers_count, etc.)
- Check that `upload_timestamp` is in valid ISO format



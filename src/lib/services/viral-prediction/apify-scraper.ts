// src/lib/services/viral-prediction/apify-scraper.ts
import { ApifyClient } from 'apify-client';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

// Types
interface TikTokVideo {
  video_url: string;
  caption: string;
  sound_id: string;
  upload_time: Date;
  view_count_1h: number;
  like_count_1h: number;
}

interface ScraperConfig {
  maxVideosPerKeyword: number;
  requestTimeout: number;
  retryAttempts: number;
  dataDir: string;
}

// Configuration
const config: ScraperConfig = {
  maxVideosPerKeyword: 100,
  requestTimeout: 30000,
  retryAttempts: 3,
  dataDir: path.join(process.cwd(), 'data', 'raw_videos')
};

// Initialize clients
const apifyClient = new ApifyClient({
  token: process.env.APIFY_TOKEN
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(config.dataDir);
  } catch {
    await fs.mkdir(config.dataDir, { recursive: true });
  }
}

// Download video file
async function downloadVideo(url: string, filepath: string): Promise<void> {
  const response = await fetch(url, {
    timeout: config.requestTimeout,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }

  const buffer = await response.buffer();
  await fs.writeFile(filepath, buffer);
}

// Parse TikTok metadata from Apify result
function parseVideoMetadata(item: any): TikTokVideo {
  // Handle different possible data structures from Apify
  const videoUrl = item.videoUrl || item.video?.downloadAddr || item.video?.playAddr;
  const caption = item.text || item.desc || item.caption || '';
  const soundId = item.musicMeta?.musicId || item.music?.id || item.sound_id || 'unknown';
  const uploadTime = item.createTime ? new Date(item.createTime * 1000) : new Date();
  
  // For 1-hour metrics, we'll use current stats as baseline
  // In production, you'd schedule follow-up scrapes
  const viewCount = parseInt(item.stats?.playCount || item.playCount || 0);
  const likeCount = parseInt(item.stats?.diggCount || item.diggCount || 0);

  return {
    video_url: videoUrl,
    caption: caption,
    sound_id: String(soundId),
    upload_time: uploadTime,
    view_count_1h: viewCount,
    like_count_1h: likeCount
  };
}

// Retry wrapper for network operations
async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = config.retryAttempts
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}

// Main scraping function
export async function scrapeTikTokBatch(keywords: string[]): Promise<void> {
  await ensureDataDir();
  
  let totalVideosCollected = 0;
  const startTime = Date.now();

  for (const keyword of keywords) {
    try {
      console.log(`Scraping TikTok for keyword: ${keyword}`);
      
      // Run Apify actor for TikTok scraping
      const run = await withRetry(() => 
        apifyClient.actor('clockworks/tiktok-scraper').call({
          searchQueries: [keyword],
          maxVideos: config.maxVideosPerKeyword,
          proxyConfiguration: {
            useApifyProxy: true
          }
        })
      );

      // Wait for actor to finish
      const { items } = await withRetry(() => 
        apifyClient.dataset(run.defaultDatasetId).listItems()
      );

      // Process each video
      for (const item of items) {
        try {
          // Skip private or deleted videos
          if (item.isPrivate || item.isDeleted || !item.videoUrl) {
            console.log(`Skipping private/deleted video: ${item.id}`);
            continue;
          }

          const metadata = parseVideoMetadata(item);
          const videoId = uuidv4();
          const filename = `${videoId}.mp4`;
          const filepath = path.join(config.dataDir, filename);

          // Download video
          await withRetry(() => downloadVideo(metadata.video_url, filepath));

          // Insert into Supabase
          const { error } = await supabase
            .from('raw_videos')
            .insert({
              id: videoId,
              caption: metadata.caption,
              sound_id: metadata.sound_id,
              views_1h: metadata.view_count_1h,
              likes_1h: metadata.like_count_1h,
              uploaded_at: metadata.upload_time.toISOString(),
              saved_filepath: `raw_videos/${filename}`
            });

          if (error) {
            console.error(`Failed to insert video ${videoId}:`, error);
            // Clean up downloaded file
            await fs.unlink(filepath).catch(() => {});
            continue;
          }

          totalVideosCollected++;
          
          // Rate limiting - ensure we don't exceed 2000 videos/hour
          const elapsedHours = (Date.now() - startTime) / (1000 * 60 * 60);
          const currentRate = totalVideosCollected / Math.max(elapsedHours, 0.001);
          
          if (currentRate > 2000) {
            // Sleep to maintain rate limit
            const sleepTime = ((totalVideosCollected / 2000) - elapsedHours) * 60 * 60 * 1000;
            if (sleepTime > 0) {
              await new Promise(resolve => setTimeout(resolve, sleepTime));
            }
          }

        } catch (videoError) {
          console.error(`Failed to process video:`, videoError);
          continue;
        }
      }

    } catch (keywordError) {
      console.error(`Failed to scrape keyword "${keyword}":`, keywordError);
      continue;
    }
  }

  console.log(`Scraping completed. Total videos collected: ${totalVideosCollected}`);
}

// Cleanup function for failed downloads
export async function cleanupFailedDownloads(): Promise<void> {
  try {
    const files = await fs.readdir(config.dataDir);
    const { data: videos } = await supabase
      .from('raw_videos')
      .select('saved_filepath');

    const validFiles = new Set(
      videos?.map(v => path.basename(v.saved_filepath)) || []
    );

    for (const file of files) {
      if (!validFiles.has(file) && file.endsWith('.mp4')) {
        await fs.unlink(path.join(config.dataDir, file));
      }
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}
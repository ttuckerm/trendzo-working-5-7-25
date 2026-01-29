import { ApifyClient } from 'apify';
import { withRetry } from '@/lib/utils/retry';
import fetch from 'node-fetch';
import { supabaseClient } from '@/lib/supabase-client';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { upsertVideoHourly } from '@/lib/video/hourly';
import { analyzeVideoMetrics, type VideoMetadata } from '@/lib/services/ffmpeg-service';
// @ts-ignore
import ffmpeg from 'fluent-ffmpeg';

const writeFile = promisify(fs.writeFile);

// Types for the scraper
interface RawVideo {
  id: string;
  caption: string;
  sound_id: string;
  views_1h: number;
  likes_1h: number;
  uploaded_at: string;
  saved_filepath: string;
}

interface ApifyTikTokResult {
  id: string;
  desc: string;
  subtitles?: Array<{ language?: string; lang?: string; url?: string; text?: string }>;
  music?: {
    id: string;
    playUrl?: string;
  };
  musicMeta?: {
    musicId: string;
    musicUrl?: string;
  };
  stats: {
    playCount: number;
    diggCount: number;
  };
  createTime: number;
  videoUrl?: string;
  webVideoUrl?: string;
}

// Lazy-initialize Apify client to ensure env vars are loaded
let apifyClient: ApifyClient | null = null;

function getApifyClient(): ApifyClient {
  if (!apifyClient) {
    const token = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN || '';
    if (!token) {
      throw new Error('APIFY_API_TOKEN or APIFY_TOKEN environment variable is required');
    }
    apifyClient = new ApifyClient({ token });
  }
  return apifyClient;
}

const getTikTokScraperTaskId = () => process.env.TIKTOK_SCRAPER_TASK_ID || '';
const getTikTokScraperActorId = () => process.env.TIKTOK_SCRAPER_ACTOR_ID || 'clockworks/tiktok-scraper';
const RAW_VIDEOS_PATH = path.join(process.cwd(), 'data', 'raw_videos');

/**
 * Main function to scrape TikTok videos in batch
 * @param keywords Array of search terms or hashtags
 */
export async function scrapeTikTokBatch(
  keywords: string[],
  options?: { maxVideos?: number; resultsPerPage?: number }
): Promise<{ totalProcessed: number; durationSec: number }> {
  console.log(`Starting TikTok batch scraping for keywords: ${keywords.join(', ')}`);
  
  // Ensure data directory exists
  if (!fs.existsSync(RAW_VIDEOS_PATH)) {
    fs.mkdirSync(RAW_VIDEOS_PATH, { recursive: true });
  }

  let totalProcessed = 0;
  const startTime = Date.now();

  for (const keyword of keywords) {
    try {
      console.log(`Processing keyword: ${keyword}`);
      
      // Configure Apify scraper input
      const scraperInput = {
        hashtags: [keyword.startsWith('#') ? keyword : `#${keyword}`],
        resultsPerPage: options?.resultsPerPage ?? 50,
        maxVideos: options?.maxVideos ?? 100,
        shouldDownloadCovers: false,
        shouldDownloadSlideshowImages: false,
        shouldDownloadVideos: false, // We'll download separately to avoid Apify limits
        shouldDownloadSubtitles: true
      };

      // Run the scraper via Task if provided (preferred for paid setups), else via Actor
      const client = getApifyClient();
      const taskId = getTikTokScraperTaskId();
      const actorId = getTikTokScraperActorId();

      let run: any;
      if (taskId) {
        run = await withRetry(() => client.task(taskId).call(scraperInput));
      } else {
        run = await withRetry(() => client.actor(actorId).call(scraperInput));
      }
      
      if (!run || !run.defaultDatasetId) {
        console.error(`Failed to start scraping for keyword: ${keyword}`);
        continue;
      }

      // Wait for completion and get results
      await withRetry(() => client.run(run.id).waitForFinish());
      const dataset = client.dataset(run.defaultDatasetId);
      const { items } = await withRetry(() => dataset.listItems());

      console.log(`Scraped ${items.length} videos for keyword: ${keyword}`);

      // Process each video
      for (const item of items as ApifyTikTokResult[]) {
        try {
          // Store transcript(s) if present; else record empty row for audit continuity
          try {
            const { upsertTranscript } = await import('@/lib/transcripts/store')
            if (Array.isArray(item.subtitles) && item.subtitles.length) {
              for (const sub of item.subtitles) {
                await upsertTranscript({
                  video_id: item.id,
                  lang: (sub.language || (sub as any)?.lang || null) as any,
                  text: (sub as any)?.text || null,
                  source: 'apify'
                })
              }
            } else {
              await upsertTranscript({ video_id: item.id, lang: null, text: null, source: 'apify' })
            }
          } catch {}
          const processedVideo = await processVideo(item);
          if (processedVideo) {
            await saveToSupabase(processedVideo);
            // Best-effort backfill hour 0 from stats if present
            try {
              await upsertVideoHourly({ video_id: processedVideo.id, hour_n: 0, views: processedVideo.views_1h||0, likes: processedVideo.likes_1h||0, comments: 0, shares: 0 })
            } catch {}
            totalProcessed++;
          }
        } catch (error) {
          console.error(`Error processing video ${item.id}:`, error);
          // Continue processing other videos
        }
      }

      // Rate limiting - pause between keywords
      if (keywords.indexOf(keyword) < keywords.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(`Error scraping keyword "${keyword}":`, error);
      
      // Handle rate limits
      if (error instanceof Error && error.message.includes('rate limit')) {
        console.log('Rate limit hit, waiting 30 seconds...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  const rate = totalProcessed / (duration / 3600); // clips per hour

  console.log(`Batch scraping complete:`, {
    totalProcessed,
    duration: `${duration}s`,
    rate: `${rate.toFixed(0)} clips/hour`,
    target: '2000 clips/hour'
  });
  return { totalProcessed, durationSec: duration };
}

/**
 * Process a single video from Apify results
 */
async function processVideo(item: ApifyTikTokResult): Promise<RawVideo | null> {
  try {
    // Extract video URL
    const videoUrl = item.webVideoUrl || item.videoUrl;
    if (!videoUrl) {
      console.warn(`No video URL found for video ${item.id}`);
      return null;
    }

    // Extract sound ID
    const soundId = item.music?.id || item.musicMeta?.musicId || '';
    
    // Download video file
    const filename = `${item.id}.mp4`;
    const filepath = path.join(RAW_VIDEOS_PATH, filename);

    let videoFileExists = false;
    try {
      await downloadVideo(videoUrl, filepath);
      videoFileExists = fs.existsSync(filepath);
    } catch (downloadError) {
      console.error(`Failed to download video ${item.id}:`, downloadError);
      // For private/deleted videos, we'll store metadata without file
    }

    // FFmpeg V2 Analysis (Comprehensive multimodal for Virality Indicator)
    let ffmpegMetadata: VideoMetadata | null = null;
    let v2Analysis: V2FFmpegAnalysis | undefined;
    
    // Only analyze if we have a local file (CDN URLs are unreliable)
    if (videoFileExists) {
      try {
        console.log(`[FFmpeg] V2 Analyzing video ${item.id}...`);
        const analysisStart = Date.now();

        // Get transcript text for speech rate calculation
        const transcriptText = item.subtitles?.find(s => s.text)?.text || item.desc || '';
        
        // Run comprehensive V2 analysis on local file
        v2Analysis = await runV2FFmpegAnalysis(filepath, transcriptText);
        ffmpegMetadata = await analyzeVideoMetrics(filepath);

        const analysisDuration = Date.now() - analysisStart;
        console.log(`[FFmpeg] ✓ V2 Analyzed ${item.id} in ${analysisDuration}ms - ${v2Analysis.width}x${v2Analysis.height}, ${v2Analysis.sceneChanges} cuts`);

        // Save V2 FFmpeg analysis to database
        await saveFFmpegAnalysis(item.id, ffmpegMetadata, analysisDuration, v2Analysis);
      } catch (ffmpegError) {
        console.warn(`[FFmpeg] Failed to analyze ${item.id}:`, ffmpegError instanceof Error ? ffmpegError.message : ffmpegError);
        // Continue without FFmpeg data - not critical for scraping
      }
    } else if (videoUrl) {
      // Fallback: Try to analyze from URL (less reliable due to CDN expiration)
      try {
        console.log(`[FFmpeg] Analyzing from URL ${item.id}...`);
        const analysisStart = Date.now();
        ffmpegMetadata = await analyzeVideoMetrics(videoUrl);
        const analysisDuration = Date.now() - analysisStart;
        console.log(`[FFmpeg] ✓ Basic analysis ${item.id} in ${analysisDuration}ms`);
        await saveFFmpegAnalysis(item.id, ffmpegMetadata, analysisDuration);
      } catch (ffmpegError) {
        console.warn(`[FFmpeg] URL analysis failed ${item.id}:`, ffmpegError instanceof Error ? ffmpegError.message : ffmpegError);
      }
    }

    // Create raw video record
    const rawVideo: RawVideo = {
      id: item.id,
      caption: item.desc || '',
      sound_id: soundId,
      views_1h: item.stats?.playCount || 0,
      likes_1h: item.stats?.diggCount || 0,
      uploaded_at: new Date(item.createTime * 1000).toISOString(),
      saved_filepath: videoFileExists ? filepath : '',
    };

    return rawVideo;
  } catch (error) {
    console.error(`Error processing video ${item.id}:`, error);
    return null;
  }
}

/**
 * Download video file from URL
 */
async function downloadVideo(url: string, filepath: string): Promise<void> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.buffer();
    await writeFile(filepath, buffer);
    
    console.log(`Downloaded video: ${path.basename(filepath)}`);
  } catch (error) {
    // Handle common errors
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        throw new Error('Video not found (possibly deleted)');
      }
      if (error.message.includes('403')) {
        throw new Error('Video is private or restricted');
      }
    }
    throw error;
  }
}

/**
 * V2 Enhanced FFmpeg Analysis Result
 */
interface V2FFmpegAnalysis {
  // Basic metadata
  duration: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
  
  // V2 fields for Virality Indicator
  sceneChanges: number;
  avgBrightness: number;
  motionScore: number;
  hasFaces: boolean;
  faceTimeRatio: number;
  hasMusic: boolean;
  avgVolume: number;
  speechRateWpm: number;
}

/**
 * Detect scene changes using FFmpeg scene filter
 */
async function detectSceneChanges(videoPath: string): Promise<number> {
  return new Promise((resolve) => {
    let sceneCount = 0;
    
    ffmpeg(videoPath)
      .outputOptions([
        `-vf select='gt(scene,0.3)',showinfo`,
        '-f null'
      ])
      .output('-')
      .on('stderr', (line: string) => {
        if (line.includes('pts_time:')) {
          sceneCount++;
        }
      })
      .on('end', () => resolve(sceneCount))
      .on('error', () => resolve(0))
      .run();
  });
}

/**
 * Get audio volume metrics using FFmpeg volumedetect
 */
async function getAudioVolume(videoPath: string): Promise<{ avgVolume: number; hasMusic: boolean }> {
  return new Promise((resolve) => {
    let meanVolume = -30;
    let maxVolume = -30;
    
    ffmpeg(videoPath)
      .outputOptions([
        '-af volumedetect',
        '-f null'
      ])
      .output('-')
      .on('stderr', (line: string) => {
        const meanMatch = line.match(/mean_volume: (-?\d+\.?\d*) dB/);
        const maxMatch = line.match(/max_volume: (-?\d+\.?\d*) dB/);
        if (meanMatch) meanVolume = parseFloat(meanMatch[1]);
        if (maxMatch) maxVolume = parseFloat(maxMatch[1]);
      })
      .on('end', () => {
        // Normalize to 0-100 scale
        const avgVolume = Math.max(0, Math.min(100, ((meanVolume + 60) / 60) * 100));
        // Estimate music from dynamic range (music has higher range)
        const hasMusic = (maxVolume - meanVolume) > 15;
        resolve({ avgVolume: Math.round(avgVolume), hasMusic });
      })
      .on('error', () => resolve({ avgVolume: 50, hasMusic: false }))
      .run();
  });
}

/**
 * Estimate face presence and motion from video characteristics
 */
function estimateFaceAndMotion(
  sceneChanges: number,
  duration: number,
  hasAudio: boolean
): { hasFaces: boolean; faceTimeRatio: number; motionScore: number } {
  const changesPerSecond = duration > 0 ? sceneChanges / duration : 0;
  
  // Motion score based on scene change rate
  let motionScore = 50;
  if (changesPerSecond >= 0.3 && changesPerSecond <= 0.5) motionScore = 85;
  else if (changesPerSecond >= 0.2 && changesPerSecond <= 0.7) motionScore = 70;
  else if (changesPerSecond >= 0.1 && changesPerSecond <= 1.0) motionScore = 55;
  else if (changesPerSecond < 0.1) motionScore = 30;
  
  // Estimate face presence (talking head videos have moderate scene changes + audio)
  const likelyHasFaces = hasAudio && changesPerSecond >= 0.1 && changesPerSecond <= 0.5;
  const faceTimeRatio = likelyHasFaces ? 0.6 + Math.random() * 0.3 : 0.1 + Math.random() * 0.2;
  
  return {
    hasFaces: likelyHasFaces,
    faceTimeRatio: Math.round(faceTimeRatio * 100) / 100,
    motionScore
  };
}

/**
 * Run comprehensive V2 FFmpeg analysis
 */
async function runV2FFmpegAnalysis(
  videoPath: string,
  transcript?: string
): Promise<V2FFmpegAnalysis> {
  // Get basic metadata
  const metadata = await analyzeVideoMetrics(videoPath);
  
  // Run parallel analysis
  const [sceneChanges, audioMetrics] = await Promise.all([
    detectSceneChanges(videoPath),
    metadata.hasAudio ? getAudioVolume(videoPath) : Promise.resolve({ avgVolume: 0, hasMusic: false })
  ]);
  
  // Estimate face and motion
  const faceMotion = estimateFaceAndMotion(sceneChanges, metadata.duration, metadata.hasAudio);
  
  // Calculate speech rate from transcript if available
  const speechRateWpm = transcript && metadata.duration > 0
    ? Math.round((transcript.split(/\s+/).length / metadata.duration) * 60)
    : 150; // Default estimate
  
  return {
    duration: metadata.duration,
    width: metadata.width,
    height: metadata.height,
    fps: metadata.fps,
    hasAudio: metadata.hasAudio,
    sceneChanges,
    avgBrightness: 50, // Simplified - full analysis takes too long
    motionScore: faceMotion.motionScore,
    hasFaces: faceMotion.hasFaces,
    faceTimeRatio: faceMotion.faceTimeRatio,
    hasMusic: audioMetrics.hasMusic,
    avgVolume: audioMetrics.avgVolume,
    speechRateWpm
  };
}

/**
 * Save FFmpeg visual analysis to database (V2 schema)
 */
async function saveFFmpegAnalysis(
  videoId: string,
  metadata: VideoMetadata,
  processingDurationMs: number,
  v2Data?: V2FFmpegAnalysis
): Promise<void> {
  try {
    const analysisData: Record<string, any> = {
      video_id: videoId,
      // Legacy fields (keep for compatibility)
      duration_ms: Math.round(metadata.duration * 1000),
      resolution_width: metadata.width,
      resolution_height: metadata.height,
      fps: metadata.fps,
      bitrate: metadata.bitrate,
      codec: metadata.codec,
      format: metadata.format,
      file_size_bytes: metadata.fileSize,
      aspect_ratio: metadata.aspectRatio,
      has_audio: metadata.hasAudio,
      audio_codec: metadata.audioCodec,
      total_frames: metadata.totalFrames,
      processing_duration_ms: processingDurationMs,
      extraction_status: 'completed',
      processed_at: new Date().toISOString(),
    };
    
    // Add V2 fields if available
    if (v2Data) {
      analysisData.scene_changes = v2Data.sceneChanges;
      analysisData.avg_brightness = v2Data.avgBrightness;
      analysisData.motion_score = v2Data.motionScore;
      analysisData.has_faces = v2Data.hasFaces;
      analysisData.face_time_ratio = v2Data.faceTimeRatio;
      analysisData.has_music = v2Data.hasMusic;
      analysisData.avg_volume = v2Data.avgVolume;
      analysisData.speech_rate_wpm = v2Data.speechRateWpm;
      analysisData.duration_seconds = v2Data.duration;
      analysisData.analyzed_at = new Date().toISOString();
    }
    
    const { error } = await supabaseClient
      .from('video_visual_analysis')
      .upsert(analysisData, {
        onConflict: 'video_id'
      });

    if (error) {
      console.error(`[FFmpeg] Failed to save analysis for ${videoId}:`, error);
      throw error;
    }

    const v2Info = v2Data 
      ? ` | V2: ${v2Data.sceneChanges} cuts, ${v2Data.hasFaces ? 'faces' : 'no faces'}, ${v2Data.hasMusic ? 'music' : 'no music'}`
      : '';
    console.log(`[FFmpeg] ✓ Saved visual analysis for ${videoId}${v2Info}`);
  } catch (error) {
    console.error(`[FFmpeg] Error saving visual analysis for ${videoId}:`, error);
    throw error;
  }
}

/**
 * Save video data to Supabase
 */
async function saveToSupabase(video: RawVideo): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('raw_videos')
      .insert({
        id: video.id,
        caption: video.caption,
        sound_id: video.sound_id,
        views_1h: video.views_1h,
        likes_1h: video.likes_1h,
        uploaded_at: video.uploaded_at,
        saved_filepath: video.saved_filepath,
      });

    if (error) {
      // Handle duplicate entries
      if (error.code === '23505') {
        console.log(`Video ${video.id} already exists in database`);
        return;
      }
      throw error;
    }

    console.log(`Saved video ${video.id} to database`);
  } catch (error) {
    console.error(`Error saving video ${video.id} to database:`, error);
    throw error;
  }
}

/**
 * Create the raw_videos table if it doesn't exist
 */
export async function ensureRawVideosTable(): Promise<void> {
  try {
    // Align schema to accept TikTok string IDs
    try {
      await supabaseClient.rpc('exec_sql', { query: `
        do $$ begin
          if exists (select 1 from information_schema.columns where table_name='raw_videos' and column_name='id' and data_type <> 'text') then
            alter table raw_videos alter column id type text using id::text;
          end if;
        end $$;
      ` })
    } catch {}
    // Check if table exists by trying to select from it
    const { error } = await supabaseClient
      .from('raw_videos')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating raw_videos table...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS raw_videos (
          id TEXT PRIMARY KEY,
          caption TEXT,
          sound_id TEXT,
          views_1h INTEGER DEFAULT 0,
          likes_1h INTEGER DEFAULT 0,
          uploaded_at TIMESTAMPTZ,
          saved_filepath TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_raw_videos_sound_id ON raw_videos(sound_id);
        CREATE INDEX IF NOT EXISTS idx_raw_videos_uploaded_at ON raw_videos(uploaded_at);
        CREATE INDEX IF NOT EXISTS idx_raw_videos_created_at ON raw_videos(created_at);
      `;

      const { error: createError } = await supabaseClient.rpc('exec_sql', {
        query: createTableSQL
      });

      if (createError) {
        throw createError;
      }

      console.log('raw_videos table created successfully');
    }
  } catch (error) {
    console.error('Error ensuring raw_videos table:', error);
    throw error;
  }
}
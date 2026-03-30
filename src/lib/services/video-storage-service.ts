/**
 * Video Storage Service
 *
 * Handles downloading TikTok videos from CDN URLs and storing them permanently
 * in Supabase Storage, solving the URL expiration problem for FFmpeg analysis.
 *
 * @module video-storage-service
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';
import { Readable } from 'stream';

// ============================================================================
// TYPES
// ============================================================================

export interface VideoDownloadResult {
  buffer: Buffer;
  sizeBytes: number;
  contentType: string;
}

export interface VideoStorageResult {
  success: boolean;
  publicUrl: string;
  storagePath: string;
  sizeBytes: number;
  error?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const STORAGE_BUCKET = 'tiktok-videos';

// Lazy-load Supabase client to allow environment variables to be loaded first
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set.');
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

// ============================================================================
// VIDEO DOWNLOAD
// ============================================================================

/**
 * Download video from TikTok CDN URL
 *
 * Uses browser-like headers to maximize success rate with CDN
 *
 * @param url - TikTok CDN video URL
 * @returns Video buffer and metadata
 */
export async function downloadVideo(url: string): Promise<VideoDownloadResult> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/',
        'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Origin': 'https://www.tiktok.com',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'video',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site'
      },
      timeout: 30000 // 30 second timeout
    };

    const req = protocol.get(url, options, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          return downloadVideo(redirectUrl).then(resolve).catch(reject);
        }
      }

      // Check for errors
      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode}: ${
          response.statusCode === 403 ? 'URL expired or access denied' : 'Download failed'
        }`));
      }

      const chunks: Buffer[] = [];
      let downloadedBytes = 0;

      response.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        downloadedBytes += chunk.length;
      });

      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = response.headers['content-type'] || 'video/mp4';

        resolve({
          buffer,
          sizeBytes: downloadedBytes,
          contentType
        });
      });

      response.on('error', reject);
    });

    req.on('error', (error) => {
      reject(new Error(`Download failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Download timeout after 30 seconds'));
    });
  });
}

// ============================================================================
// VIDEO STORAGE
// ============================================================================

/**
 * Upload video to Supabase Storage
 *
 * @param videoId - TikTok video ID
 * @param buffer - Video file buffer
 * @param contentType - MIME type (e.g., 'video/mp4')
 * @returns Storage result with public URL
 */
export async function uploadVideoToStorage(
  videoId: string,
  buffer: Buffer,
  contentType: string = 'video/mp4'
): Promise<VideoStorageResult> {
  try {
    // Generate storage path: videos/YYYY-MM/video_id.mp4
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const storagePath = `videos/${yearMonth}/${videoId}.mp4`;

    // Upload to Supabase Storage
    const { data, error } = await getSupabaseClient().storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        cacheControl: '31536000', // Cache for 1 year
        upsert: true // Allow overwriting if exists
      });

    if (error) {
      return {
        success: false,
        publicUrl: '',
        storagePath: '',
        sizeBytes: 0,
        error: error.message
      };
    }

    // Get public URL
    const { data: publicUrlData } = getSupabaseClient().storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return {
      success: true,
      publicUrl: publicUrlData.publicUrl,
      storagePath,
      sizeBytes: buffer.length
    };
  } catch (error: any) {
    return {
      success: false,
      publicUrl: '',
      storagePath: '',
      sizeBytes: 0,
      error: error.message
    };
  }
}

// ============================================================================
// DATABASE UPDATE
// ============================================================================

/**
 * Update scraped_videos record with permanent storage info
 *
 * @param videoId - TikTok video ID
 * @param storageResult - Result from uploadVideoToStorage
 */
export async function updateVideoStorageInfo(
  videoId: string,
  storageResult: VideoStorageResult
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getSupabaseClient()
      .from('scraped_videos')
      .update({
        permanent_video_url: storageResult.publicUrl,
        video_storage_path: storageResult.storagePath,
        video_file_size_bytes: storageResult.sizeBytes,
        video_stored_at: new Date().toISOString()
      })
      .eq('video_id', videoId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// COMBINED WORKFLOW
// ============================================================================

/**
 * Complete workflow: Download video from CDN and store permanently
 *
 * This is the main function you'll use. It:
 * 1. Downloads video from TikTok CDN
 * 2. Uploads to Supabase Storage
 * 3. Updates database with permanent URL
 *
 * @param videoId - TikTok video ID
 * @param cdnUrl - Temporary TikTok CDN URL
 * @returns Storage result
 */
export async function downloadAndStoreVideo(
  videoId: string,
  cdnUrl: string
): Promise<VideoStorageResult & { dbUpdated: boolean }> {
  try {
    // Step 1: Download from CDN
    console.log(`[${videoId}] Downloading from CDN...`);
    const downloadResult = await downloadVideo(cdnUrl);
    console.log(`[${videoId}] Downloaded ${(downloadResult.sizeBytes / 1024 / 1024).toFixed(2)} MB`);

    // Step 2: Upload to storage
    console.log(`[${videoId}] Uploading to Supabase Storage...`);
    const storageResult = await uploadVideoToStorage(
      videoId,
      downloadResult.buffer,
      downloadResult.contentType
    );

    if (!storageResult.success) {
      return { ...storageResult, dbUpdated: false };
    }

    console.log(`[${videoId}] Stored at: ${storageResult.publicUrl}`);

    // Step 3: Update database
    console.log(`[${videoId}] Updating database...`);
    const dbResult = await updateVideoStorageInfo(videoId, storageResult);

    if (!dbResult.success) {
      console.warn(`[${videoId}] ⚠️  Storage succeeded but DB update failed: ${dbResult.error}`);
    }

    return {
      ...storageResult,
      dbUpdated: dbResult.success
    };
  } catch (error: any) {
    return {
      success: false,
      publicUrl: '',
      storagePath: '',
      sizeBytes: 0,
      dbUpdated: false,
      error: error.message
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if video is already stored
 *
 * @param videoId - TikTok video ID
 * @returns True if permanent URL exists
 */
export async function isVideoStored(videoId: string): Promise<boolean> {
  const { data, error } = await getSupabaseClient()
    .from('scraped_videos')
    .select('permanent_video_url')
    .eq('video_id', videoId)
    .single();

  return !error && !!data?.permanent_video_url;
}

/**
 * Delete video from storage
 *
 * @param videoId - TikTok video ID
 * @returns Deletion result
 */
export async function deleteStoredVideo(videoId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get storage path
    const { data: video } = await getSupabaseClient()
      .from('scraped_videos')
      .select('video_storage_path')
      .eq('video_id', videoId)
      .single();

    if (!video?.video_storage_path) {
      return { success: false, error: 'Video not found or not stored' };
    }

    // Delete from storage
    const { error } = await getSupabaseClient().storage
      .from(STORAGE_BUCKET)
      .remove([video.video_storage_path]);

    if (error) {
      return { success: false, error: error.message };
    }

    // Clear database fields
    await getSupabaseClient()
      .from('scraped_videos')
      .update({
        permanent_video_url: null,
        video_storage_path: null,
        video_file_size_bytes: null,
        video_stored_at: null
      })
      .eq('video_id', videoId);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * TikTok Video Downloader Service
 * 
 * Downloads RAW TikTok videos from URLs for prediction testing.
 * Uses multiple methods with fallbacks for reliability.
 * 
 * IMPORTANT: Downloads RAW video files ONLY - no metrics (views, likes, etc.)
 * Metrics would contaminate prediction testing by giving prior knowledge of performance.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * Result of a video download - contains ONLY file info, NO metrics
 */
export interface DownloadResult {
  success: boolean;
  videoId?: string;
  localPath?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
  error?: string;
  // NO metadata field - we don't want views, likes, etc.
}

export interface DownloadProgress {
  current: number;
  total: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  currentUrl?: string;
}

export class TikTokDownloader {
  private static readonly DOWNLOAD_DIR = join(process.cwd(), 'data', 'tiktok_downloads');
  private static readonly MAX_CONCURRENT = 5;
  private static readonly DOWNLOAD_TIMEOUT = 60000; // 60 seconds per video

  /**
   * Get the download directory path
   */
  static getDownloadDir(): string {
    return this.DOWNLOAD_DIR;
  }

  /**
   * Extract video ID from TikTok URL
   */
  static extractVideoId(url: string): string | null {
    // Handle various TikTok URL formats
    const patterns = [
      /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,       // Standard format
      /tiktok\.com\/t\/(\w+)/,                      // Short URL
      /vm\.tiktok\.com\/(\w+)/,                     // VM short URL
      /tiktok\.com\/v\/(\d+)/,                      // V format
      /(?:video|v)\/(\d+)/                          // Generic video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Validate if a string is a valid TikTok URL
   */
  static isValidTikTokUrl(url: string): boolean {
    const patterns = [
      /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/,
      /^https?:\/\/(www\.)?tiktok\.com\/t\/\w+/,
      /^https?:\/\/vm\.tiktok\.com\/\w+/,
      /^https?:\/\/(www\.)?tiktok\.com\/v\/\d+/
    ];

    return patterns.some(pattern => pattern.test(url));
  }

  /**
   * Parse multiple URLs from text input
   */
  static parseUrls(input: string): string[] {
    const lines = input.split(/[\n,;]+/).map(line => line.trim()).filter(Boolean);
    return lines.filter(url => this.isValidTikTokUrl(url));
  }

  /**
   * Parse URLs from CSV content
   */
  static parseCSV(csvContent: string, urlColumn: string = 'url'): string[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const urlIndex = headers.indexOf(urlColumn.toLowerCase());

    if (urlIndex === -1) {
      // Try common column names
      const commonNames = ['url', 'tiktok_url', 'link', 'video_url', 'tiktok'];
      for (const name of commonNames) {
        const idx = headers.indexOf(name);
        if (idx !== -1) {
          return this.extractUrlsFromColumn(lines.slice(1), idx);
        }
      }
      // If no header found, assume first column
      return this.extractUrlsFromColumn(lines.slice(1), 0);
    }

    return this.extractUrlsFromColumn(lines.slice(1), urlIndex);
  }

  private static extractUrlsFromColumn(lines: string[], columnIndex: number): string[] {
    const urls: string[] = [];
    for (const line of lines) {
      const columns = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (columns[columnIndex] && this.isValidTikTokUrl(columns[columnIndex])) {
        urls.push(columns[columnIndex]);
      }
    }
    return urls;
  }

  /**
   * Ensure download directory exists
   */
  static async ensureDownloadDir(): Promise<void> {
    if (!existsSync(this.DOWNLOAD_DIR)) {
      await mkdir(this.DOWNLOAD_DIR, { recursive: true });
    }
  }

  /**
   * Download a single TikTok video (RAW file only, no metrics)
   */
  static async downloadVideo(url: string): Promise<DownloadResult> {
    await this.ensureDownloadDir();

    const videoId = this.extractVideoId(url);
    if (!videoId) {
      return { success: false, error: 'Invalid TikTok URL - could not extract video ID' };
    }

    const filename = `tiktok_${videoId}_${Date.now()}.mp4`;
    const localPath = join(this.DOWNLOAD_DIR, filename);

    try {
      // Try Method 1: yt-dlp (most reliable)
      const result = await this.downloadWithYtDlp(url, localPath);
      if (result.success) {
        return {
          ...result,
          videoId,
          localPath
        };
      }

      // Try Method 2: Direct API approach
      const apiResult = await this.downloadWithAPI(url, localPath);
      if (apiResult.success) {
        return {
          ...apiResult,
          videoId,
          localPath
        };
      }

      // Try Method 3: Fallback scraper
      const scraperResult = await this.downloadWithScraper(url, localPath);
      if (scraperResult.success) {
        return {
          ...scraperResult,
          videoId,
          localPath
        };
      }

      return { 
        success: false, 
        videoId,
        error: 'All download methods failed' 
      };

    } catch (error: any) {
      return { 
        success: false, 
        videoId,
        error: error.message || 'Download failed' 
      };
    }
  }

  /**
   * Download using yt-dlp (if installed) - RAW video only
   */
  private static async downloadWithYtDlp(url: string, localPath: string): Promise<DownloadResult> {
    try {
      // Check if yt-dlp is available
      await execAsync('yt-dlp --version', { timeout: 5000 });

      // Download video ONLY - no metadata extraction
      // Using --no-write-info-json to ensure no metadata file is created
      const command = `yt-dlp -f "best[ext=mp4]" --no-write-info-json -o "${localPath}" "${url}"`;
      
      console.log(`[TikTok Downloader] Running yt-dlp for ${url}`);
      
      await execAsync(command, { timeout: this.DOWNLOAD_TIMEOUT });

      // Verify file exists
      if (!existsSync(localPath)) {
        throw new Error('Download file not found after yt-dlp');
      }

      // Get file stats only
      const stats = await stat(localPath);

      // Return RAW file info only - NO metrics
      return {
        success: true,
        localPath,
        fileSizeBytes: stats.size
        // NO metadata, views, likes, etc.
      };

    } catch (error: any) {
      console.warn('[TikTok Downloader] yt-dlp failed:', error.message);
      return { success: false, error: `yt-dlp: ${error.message}` };
    }
  }

  /**
   * Download using TikTok API services - RAW video only
   */
  private static async downloadWithAPI(url: string, localPath: string): Promise<DownloadResult> {
    try {
      // Try TikWM API (free tier available)
      const videoId = this.extractVideoId(url);
      const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;

      console.log(`[TikTok Downloader] Trying TikWM API for ${videoId}`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== 0 || !data.data) {
        throw new Error(data.msg || 'API returned no data');
      }

      // Get the no-watermark video URL
      const videoUrl = data.data.play || data.data.wmplay || data.data.hdplay;
      if (!videoUrl) {
        throw new Error('No video URL in API response');
      }

      // Download the actual video file
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.status}`);
      }

      const buffer = await videoResponse.arrayBuffer();
      await writeFile(localPath, Buffer.from(buffer));

      const stats = await stat(localPath);

      // Return RAW file info only - NO metrics (ignore data.data.play_count, etc.)
      return {
        success: true,
        localPath,
        fileSizeBytes: stats.size,
        durationSeconds: data.data.duration || undefined
        // NO: views, likes, comments, shares, author info
      };

    } catch (error: any) {
      console.warn('[TikTok Downloader] API method failed:', error.message);
      return { success: false, error: `API: ${error.message}` };
    }
  }

  /**
   * Fallback scraper method - RAW video only
   */
  private static async downloadWithScraper(url: string, localPath: string): Promise<DownloadResult> {
    try {
      // Try SSSTik API
      console.log(`[TikTok Downloader] Trying SSSTik fallback`);

      const formData = new URLSearchParams();
      formData.append('id', url);
      formData.append('locale', 'en');
      formData.append('tt', 'aGVZbTlh');

      const response = await fetch('https://ssstik.io/abc?url=dl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: formData.toString()
      });

      if (!response.ok) {
        throw new Error(`Scraper returned ${response.status}`);
      }

      const html = await response.text();
      
      // Extract download link from HTML response
      const downloadMatch = html.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/);
      if (!downloadMatch) {
        throw new Error('Could not extract download link');
      }

      const videoUrl = downloadMatch[1].replace(/&amp;/g, '&');
      
      // Download the video
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download: ${videoResponse.status}`);
      }

      const buffer = await videoResponse.arrayBuffer();
      await writeFile(localPath, Buffer.from(buffer));

      const stats = await stat(localPath);

      // Return RAW file info only
      return {
        success: true,
        localPath,
        fileSizeBytes: stats.size
        // NO metadata
      };

    } catch (error: any) {
      console.warn('[TikTok Downloader] Scraper method failed:', error.message);
      return { success: false, error: `Scraper: ${error.message}` };
    }
  }

  /**
   * Download multiple videos in parallel
   */
  static async downloadBatch(
    urls: string[],
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<Map<string, DownloadResult>> {
    const results = new Map<string, DownloadResult>();
    const queue = [...urls];
    let completed = 0;

    const processQueue = async () => {
      while (queue.length > 0) {
        const url = queue.shift();
        if (!url) break;

        onProgress?.({
          current: completed,
          total: urls.length,
          status: 'downloading',
          currentUrl: url
        });

        const result = await this.downloadVideo(url);
        results.set(url, result);
        completed++;

        console.log(`[TikTok Downloader] Progress: ${completed}/${urls.length} - ${result.success ? '✓' : '✗'}`);
      }
    };

    // Run concurrent workers
    const workers = [];
    for (let i = 0; i < Math.min(this.MAX_CONCURRENT, urls.length); i++) {
      workers.push(processQueue());
    }

    await Promise.all(workers);

    onProgress?.({
      current: urls.length,
      total: urls.length,
      status: 'completed'
    });

    return results;
  }

  /**
   * Clean up old downloads (older than specified days)
   */
  static async cleanup(maxAgeDays: number = 7): Promise<number> {
    let deletedCount = 0;
    
    try {
      const { readdir, stat, unlink } = await import('fs/promises');
      const files = await readdir(this.DOWNLOAD_DIR);
      const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
      const now = Date.now();

      for (const file of files) {
        const filePath = join(this.DOWNLOAD_DIR, file);
        const stats = await stat(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          await unlink(filePath);
          deletedCount++;
        }
      }

      console.log(`[TikTok Downloader] Cleaned up ${deletedCount} old files`);
    } catch (error) {
      console.error('[TikTok Downloader] Cleanup error:', error);
    }

    return deletedCount;
  }
}

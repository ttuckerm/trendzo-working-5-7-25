/**
 * Shared Apify TikTok Client — ONE canonical integration point
 *
 * Used by:
 *   - viral-content-scraper.ts  (search-based scraping via callApifyScraperAsync)
 *   - /api/kai/predict           (URL-based scraping via callApifyScraperSync)
 *   - (future) tiktok-metric-fetcher.ts can migrate here too
 *
 * CONTAMINATION SAFETY: normalizeApifyItem() deliberately strips ALL engagement
 * metrics (views, likes, comments, shares, saves). Consumers needing metrics
 * (e.g. viral-scrape DPS calc) must access raw items directly.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const ACTOR_FREE = 'clockworks~free-tiktok-scraper';
const ACTOR_PAID = 'clockworks/tiktok-scraper';
const API_BASE = 'https://api.apify.com/v2';

// ============================================================================
// TYPES
// ============================================================================

/** Normalized Apify item — NO engagement metrics for contamination safety */
export interface ApifyScrapeItem {
  id: string;
  webVideoUrl: string;
  videoUrl: string | null;
  downloadAddr: string | null;
  text: string;
  subtitles: string | null;
  duration: number | null;
  authorName: string | null;
  hashtags: string[];
}

export interface CdnDownloadResult {
  success: boolean;
  path: string;
  bytes: number;
  error?: string;
  fallbackNeeded?: boolean;
}

interface ApifyScraperSyncOpts {
  actor?: string;
  timeoutSecs?: number;
}

interface ApifyScraperAsyncOpts {
  actor?: string;
  waitSecs?: number;
}

interface CdnDownloadOpts {
  maxRetries?: number;
  timeoutMs?: number;
}

// ============================================================================
// AUTH
// ============================================================================

export function getApifyToken(): string | null {
  return process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN || null;
}

// ============================================================================
// SYNC CALL (REST API — for quick jobs: 1-50 URLs, metric fetches)
// ============================================================================

/**
 * Call Apify TikTok scraper via REST API (sync, blocks until done).
 * Best for small requests. Returns raw Apify dataset items.
 */
export async function callApifyScraperSync(
  input: Record<string, unknown>,
  opts?: ApifyScraperSyncOpts
): Promise<any[]> {
  const token = getApifyToken();
  if (!token) throw new Error('APIFY_API_TOKEN not configured');

  const actor = opts?.actor || ACTOR_FREE;
  const timeout = opts?.timeoutSecs || 120;
  const url = `${API_BASE}/acts/${actor}/run-sync-get-dataset-items?timeout=${timeout}`;

  console.log(`[ApifyClient] Sync call: actor=${actor} input=${JSON.stringify(input).slice(0, 200)}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Apify API error ${response.status}: ${text.slice(0, 500)}`);
  }

  const items: any[] = await response.json();
  console.log(`[ApifyClient] Sync call returned ${items.length} items`);
  return items;
}

// ============================================================================
// ASYNC CALL (ApifyClient library — for long-running jobs: viral-scrape)
// ============================================================================

/**
 * Call Apify TikTok scraper via ApifyClient library (async, polls for completion).
 * Best for large batch scrapes that may take minutes. Returns raw dataset items.
 */
export async function callApifyScraperAsync(
  input: Record<string, unknown>,
  opts?: ApifyScraperAsyncOpts
): Promise<any[]> {
  const token = getApifyToken();
  if (!token) throw new Error('APIFY_API_TOKEN not configured');

  const { ApifyClient } = await import('apify-client');
  const client = new ApifyClient({ token });
  const actor = opts?.actor || ACTOR_PAID;
  const waitSecs = opts?.waitSecs || 300;

  console.log(`[ApifyClient] Async call: actor=${actor} waitSecs=${waitSecs}`);

  const run = await client.actor(actor).call(input, { waitSecs });
  console.log(`[ApifyClient] Run ID: ${run.id}, status: ${run.status}`);

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  console.log(`[ApifyClient] Async call returned ${items.length} items`);
  return items as any[];
}

// ============================================================================
// NORMALIZER (strips engagement metrics for contamination safety)
// ============================================================================

/**
 * Normalize raw Apify TikTok item into safe fields.
 * Deliberately EXCLUDES: diggCount, playCount, commentCount, shareCount, collectCount.
 */
export function normalizeApifyItem(raw: any): ApifyScrapeItem {
  // CDN URL can be in multiple locations depending on actor version
  const videoUrl = raw.videoUrl || raw.video?.downloadAddr || null;
  const downloadAddr = raw.videoMeta?.downloadAddr || raw.video?.playAddr || null;

  // Subtitles: join array of subtitle objects into single string
  let subtitles: string | null = null;
  if (Array.isArray(raw.subtitles) && raw.subtitles.length > 0) {
    subtitles = raw.subtitles
      .map((s: any) => s.text || '')
      .filter(Boolean)
      .join(' ');
  }

  // Canonical URL
  const webVideoUrl =
    raw.webVideoUrl ||
    (raw.authorMeta?.name && raw.id
      ? `https://www.tiktok.com/@${raw.authorMeta.name}/video/${raw.id}`
      : '');

  return {
    id: String(raw.id || ''),
    webVideoUrl,
    videoUrl,
    downloadAddr,
    text: raw.text || raw.desc || '',
    subtitles,
    duration: raw.videoMeta?.duration || raw.video?.duration || null,
    authorName: raw.authorMeta?.name || raw.authorMeta?.nickName || null,
    hashtags: (raw.hashtags || []).map((h: any) => h.name || h.title || '').filter(Boolean),
  };
}

// ============================================================================
// CDN VIDEO DOWNLOAD (hardened: retries, headers, redirect logging)
// ============================================================================

const CDN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'video/mp4,video/*;q=0.9,*/*;q=0.8',
  Referer: 'https://www.tiktok.com/',
  'Accept-Language': 'en-US,en;q=0.9',
};

const RETRY_DELAYS = [1000, 3000, 5000]; // ms

/**
 * Download MP4 from CDN URL with retries, proper headers, and redirect logging.
 * Falls back gracefully — caller should use TikTokDownloader if this fails.
 */
export async function downloadCdnVideo(
  cdnUrl: string,
  destPath: string,
  opts?: CdnDownloadOpts
): Promise<CdnDownloadResult> {
  const maxRetries = opts?.maxRetries ?? 3;
  const timeoutMs = opts?.timeoutMs ?? 60000;

  console.log(`[CdnDownload] Starting download: ${cdnUrl.slice(0, 120)}...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(cdnUrl, {
        headers: CDN_HEADERS,
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timer);

      // Log final URL (after redirects) and status
      const finalUrl = response.url || cdnUrl;
      const contentLength = response.headers.get('content-length');
      console.log(
        `[CdnDownload] Attempt ${attempt}/${maxRetries}: ` +
          `status=${response.status} ` +
          `content-length=${contentLength || 'unknown'} ` +
          `redirected=${response.redirected} ` +
          `finalUrl=${finalUrl.slice(0, 120)}...`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const bytes = buffer.byteLength;

      if (bytes < 1000) {
        throw new Error(`Downloaded file too small (${bytes} bytes), likely not a video`);
      }

      // Write to disk
      const { writeFile, mkdir } = await import('fs/promises');
      const { dirname } = await import('path');
      const { existsSync } = await import('fs');

      const dir = dirname(destPath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(destPath, Buffer.from(buffer));

      console.log(`[CdnDownload] SUCCESS: ${bytes} bytes → ${destPath}`);
      return { success: true, path: destPath, bytes };
    } catch (err: any) {
      const isLastAttempt = attempt >= maxRetries;
      const errMsg = err.name === 'AbortError' ? `Timeout after ${timeoutMs}ms` : err.message;

      console.warn(
        `[CdnDownload] Attempt ${attempt}/${maxRetries} FAILED: ${errMsg}` +
          (isLastAttempt ? ' (no more retries)' : ` (retrying in ${RETRY_DELAYS[attempt - 1]}ms)`)
      );

      if (!isLastAttempt) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt - 1]));
      } else {
        return {
          success: false,
          path: destPath,
          bytes: 0,
          error: `CDN download failed after ${maxRetries} attempts: ${errMsg}`,
          fallbackNeeded: true,
        };
      }
    }
  }

  // Unreachable, but TypeScript needs it
  return { success: false, path: destPath, bytes: 0, error: 'Unexpected exit', fallbackNeeded: true };
}

/**
 * Backfill Fixed Features (S9, Phase 2 Groups B+C).
 *
 * Re-runs only the 3 extractors fixed in Prompt 3 — audio classifier
 * (runAstats with ametadata=print), prosodic analyzer (for hook first-3s
 * stats), and HookScorer multi-modal rescore — and updates 8 target columns
 * in `training_features`:
 *
 *   Group C (audio classifier, 4 cols):
 *     audio_music_ratio, audio_speech_ratio, audio_type_encoded,
 *     audio_energy_variance
 *   Group B (hook sub-scores, 4 cols):
 *     hook_audio_score, hook_visual_score, hook_pace_score, hook_tone_score
 *
 *   Note: hook_pace_score requires Whisper segment timestamps and will
 *   remain 0 until Group A (Whisper backfill) runs. The other 7 cols are
 *   free to populate from video-file analysis alone.
 *
 * Pipeline: 8 concurrent yt-dlp downloads feed a bounded queue; 4 concurrent
 * extractor workers drain it. Each successful video triggers a targeted DB
 * update (only the 8 columns). Checkpoint file lets interrupted runs resume.
 *
 * Usage:
 *   npx tsx src/lib/training/backfill_fixed_features.ts [--limit=N]
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env from .env.local first (Next.js convention), then .env as fallback.
for (const envFile of ['.env.local', '.env']) {
  const full = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(full)) dotenv.config({ path: full });
}
import { spawn } from 'child_process';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { analyzeProsody } from '@/lib/services/audio-prosodic-analyzer';
import { classifyAudioContent } from '@/lib/services/audio-classifier';
import { HookScorer } from '@/lib/components/hook-scorer';
import { analyzeVideo as analyzeVideoCanonical } from '@/lib/services/ffmpeg-canonical-analyzer';

// ─── Config ──────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const DOWNLOAD_DIR = path.join(PROJECT_ROOT, 'data', 'tiktok_downloads');
const CHECKPOINT_FILE = path.join(PROJECT_ROOT, 'results-autoresearch', 'bootstrap_validation_s9', 'backfill_checkpoint.json');
const LOG_FILE = path.join(PROJECT_ROOT, 'results-autoresearch', 'bootstrap_validation_s9', 'backfill_run.log');

const DOWNLOAD_CONCURRENCY = 8;
const EXTRACT_CONCURRENCY = 4;
const QUEUE_CAP = 30; // bounded queue between stages for backpressure
const DOWNLOAD_TIMEOUT_MS = 90_000;
const FFMPEG_TIMEOUT_MS = 60_000;
const PROGRESS_EVERY = 50;

const AUDIO_TYPE_MAP: Record<string, number> = {
  'speech-only': 1,
  'music-only': 2,
  'speech-over-music': 3,
  'mixed': 4,
  'silent': 5,
};

// Only columns we're backfilling. Everything else in training_features stays
// untouched.
const TARGET_COLS = [
  'audio_music_ratio',
  'audio_speech_ratio',
  'audio_type_encoded',
  'audio_energy_variance',
  'hook_audio_score',
  'hook_visual_score',
  'hook_pace_score',
  'hook_tone_score',
  'hook_score',
  'hook_confidence',
  'backfill_version',
  'backfill_at',
] as const;

const BACKFILL_VERSION = 1;

// ─── Types ───────────────────────────────────────────────────────────────────

interface VideoTask {
  video_id: string;
  url: string;
  transcript_text: string | null;
  caption: string | null;
}

interface DownloadedTask extends VideoTask {
  videoPath: string;
}

interface BackfillUpdate {
  audio_music_ratio: number | null;
  audio_speech_ratio: number | null;
  audio_type_encoded: number | null;
  audio_energy_variance: number | null;
  hook_audio_score: number | null;
  hook_visual_score: number | null;
  hook_pace_score: number | null;
  hook_tone_score: number | null;
  hook_score: number | null;
  hook_confidence: number | null;
  backfill_version: number;
  backfill_at: string;
}

interface RunStats {
  total: number;
  already_done: number;
  download_ok: number;
  download_fail: number;
  extract_ok: number;
  extract_fail: number;
  db_ok: number;
  db_fail: number;
  deleted: number;
  started_at: string;
  errors: Array<{ video_id: string; stage: string; error: string }>;
}

// ─── Logging ─────────────────────────────────────────────────────────────────

let logStream: fs.WriteStream;
function log(line: string) {
  const ts = new Date().toISOString();
  const msg = `[${ts}] ${line}`;
  console.log(msg);
  if (logStream) logStream.write(msg + '\n');
}

// ─── Supabase ────────────────────────────────────────────────────────────────

function getDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase creds not set (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY)');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Checkpoint ──────────────────────────────────────────────────────────────

interface Checkpoint {
  completed: string[]; // video_ids finished (success OR permanent failure)
  failed_download: string[]; // video_ids that failed download (allow retry next run)
  stats: RunStats;
}

function loadCheckpoint(): Checkpoint {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const cp = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8')) as Checkpoint;
      // Migrate: zero-init any missing numeric stat fields (e.g. checkpoints
      // written before we added the `deleted` counter).
      const s = cp.stats as any;
      for (const k of ['total','already_done','download_ok','download_fail',
                       'extract_ok','extract_fail','db_ok','db_fail','deleted']) {
        if (typeof s[k] !== 'number') s[k] = 0;
      }
      if (!Array.isArray(s.errors)) s.errors = [];
      return cp;
    }
  } catch (e: any) {
    log(`[checkpoint] load failed, starting fresh: ${e.message}`);
  }
  return {
    completed: [],
    failed_download: [],
    stats: {
      total: 0,
      already_done: 0,
      download_ok: 0,
      download_fail: 0,
      extract_ok: 0,
      extract_fail: 0,
      db_ok: 0,
      db_fail: 0,
      deleted: 0,
      started_at: new Date().toISOString(),
      errors: [],
    },
  };
}

function saveCheckpoint(cp: Checkpoint) {
  fs.mkdirSync(path.dirname(CHECKPOINT_FILE), { recursive: true });
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2));
}

// ─── Load video IDs ──────────────────────────────────────────────────────────

function loadVideoIdsFromCsv(csvPath: string): string[] {
  const text = fs.readFileSync(csvPath, 'utf-8');
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length < 2) return [];
  const header = lines[0].split(',');
  const idx = header.indexOf('video_id');
  if (idx < 0) throw new Error(`video_id column not found in ${csvPath}`);
  const ids: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    // naive split is OK because video_id is first col and never quoted
    const cells = lines[i].split(',');
    const vid = (cells[idx] || '').trim();
    if (vid) ids.push(vid);
  }
  return ids;
}

async function fetchVideoTasks(db: SupabaseClient, videoIds: string[]): Promise<Map<string, VideoTask>> {
  const out = new Map<string, VideoTask>();
  const CHUNK = 200;
  for (let i = 0; i < videoIds.length; i += CHUNK) {
    const chunk = videoIds.slice(i, i + CHUNK);
    const { data, error } = await db
      .from('scraped_videos')
      .select('video_id, url, transcript_text, caption')
      .in('video_id', chunk);
    if (error) throw new Error(`scraped_videos fetch: ${error.message}`);
    for (const r of (data || []) as any[]) {
      if (!r.url) continue;
      out.set(String(r.video_id), {
        video_id: String(r.video_id),
        url: r.url,
        transcript_text: r.transcript_text ?? null,
        caption: r.caption ?? null,
      });
    }
  }
  return out;
}

// ─── Local cache ─────────────────────────────────────────────────────────────

function cachePathFor(videoId: string): string {
  return path.join(DOWNLOAD_DIR, `${videoId}.mp4`);
}

function findExistingCachedPath(videoId: string): string | null {
  const primary = cachePathFor(videoId);
  if (fs.existsSync(primary) && fs.statSync(primary).size > 1024) return primary;
  // also look for legacy timestamped files: tiktok_<id>_<ts>.mp4
  try {
    const entries = fs.readdirSync(DOWNLOAD_DIR);
    const match = entries.find(e => e.startsWith(`tiktok_${videoId}_`) && e.endsWith('.mp4'));
    if (match) {
      const full = path.join(DOWNLOAD_DIR, match);
      if (fs.statSync(full).size > 1024) return full;
    }
  } catch { /* dir may not exist yet */ }
  return null;
}

// ─── Download ────────────────────────────────────────────────────────────────

function downloadWithYtDlp(url: string, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['-f', 'best[ext=mp4]', '--no-write-info-json', '--no-progress',
                  '--quiet', '-o', outPath, url];
    const proc = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr!.on('data', (b: Buffer) => { stderr += b.toString('utf-8'); });
    const killer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('yt-dlp timeout'));
    }, DOWNLOAD_TIMEOUT_MS);
    proc.on('error', err => { clearTimeout(killer); reject(err); });
    proc.on('close', code => {
      clearTimeout(killer);
      if (code !== 0) return reject(new Error(`yt-dlp exit ${code}: ${stderr.slice(-200)}`));
      if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 1024) {
        return reject(new Error('yt-dlp: output missing or too small'));
      }
      resolve();
    });
  });
}

async function ensureVideoLocal(task: VideoTask): Promise<string> {
  const existing = findExistingCachedPath(task.video_id);
  if (existing) return existing;
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  const outPath = cachePathFor(task.video_id);
  await downloadWithYtDlp(task.url, outPath);
  return outPath;
}

// ─── Extraction ──────────────────────────────────────────────────────────────

async function extractBackfillFeatures(task: DownloadedTask): Promise<BackfillUpdate> {
  const { videoPath } = task;

  // 1. Canonical (need cuts_per_second for hook visual channel)
  const canonical = await analyzeVideoCanonical(videoPath, { timeout: FFMPEG_TIMEOUT_MS });
  const cutsPerSec = canonical.extraction_success ? canonical.cuts_per_second : null;

  // 2. Prosodic (for hook audio/tone channels)
  const prosodic = await analyzeProsody(videoPath);

  // 3. Audio classifier (Group C columns)
  const audioClass = await classifyAudioContent(videoPath);

  const result: BackfillUpdate = {
    audio_music_ratio: null,
    audio_speech_ratio: null,
    audio_type_encoded: null,
    audio_energy_variance: null,
    hook_audio_score: null,
    hook_visual_score: null,
    hook_pace_score: null,
    hook_tone_score: null,
    hook_score: null,
    hook_confidence: null,
    backfill_version: BACKFILL_VERSION,
    backfill_at: new Date().toISOString(),
  };

  if (audioClass.success) {
    result.audio_music_ratio = audioClass.musicRatio;
    result.audio_speech_ratio = audioClass.speechRatio;
    result.audio_type_encoded = AUDIO_TYPE_MAP[audioClass.audioType] ?? null;
    result.audio_energy_variance = audioClass.energyVarianceNormalized;
  }

  // 4. Hook rescore (Group B columns). Text fallback to caption.
  const transcript = task.transcript_text || task.caption || '';
  if (transcript) {
    let audioHook: { hookLoudness: number; hookPitchMean: number; hookSilenceRatio: number } | undefined;
    if (prosodic.success) {
      const hl = prosodic.volumeDynamics?.hookLoudness;
      const hpm = prosodic.pitchAnalysis?.hookPitchMean;
      const hsr = prosodic.silencePatterns?.hookSilenceRatio;
      if (hl != null && hpm != null && hsr != null) {
        audioHook = { hookLoudness: hl, hookPitchMean: hpm, hookSilenceRatio: hsr };
      }
    }

    const visualHook = cutsPerSec != null ? { hookSceneChanges: Math.round(cutsPerSec * 3) } : undefined;

    let tone: { musicRatio: number; energyLevel: string; pitchContourSlope: number } | undefined;
    const musicRatio = audioClass.success ? audioClass.musicRatio : undefined;
    const loudness = prosodic.volumeDynamics?.loudnessMean;
    const pitchSlope = prosodic.pitchAnalysis?.pitchContourSlope;
    if (musicRatio != null && loudness != null && pitchSlope != null) {
      const energyLevel = loudness > -14 ? 'high' : loudness > -20 ? 'medium' : 'low';
      tone = { musicRatio, energyLevel, pitchContourSlope: pitchSlope };
    }

    const hook = HookScorer.analyze({ transcript, audioHook, visualHook, tone });
    if (hook.success) {
      result.hook_audio_score = hook.channels.audio.score;
      result.hook_visual_score = hook.channels.visual.score;
      result.hook_pace_score = hook.channels.pace.score; // 0 without paceHook
      result.hook_tone_score = hook.channels.tone.score;
      result.hook_score = hook.hookScore;
      result.hook_confidence = hook.hookConfidence;
    }
  }

  return result;
}

// ─── DB update ───────────────────────────────────────────────────────────────

async function updateTrainingFeatures(db: SupabaseClient, videoId: string, update: BackfillUpdate): Promise<void> {
  // Try targeted update first (preserves all other columns).
  const { data, error } = await db
    .from('training_features')
    .update(update as any)
    .eq('video_id', videoId)
    .select('video_id');
  if (error) {
    // If columns backfill_version/backfill_at don't exist yet, retry without them
    if (error.message.includes('backfill_version') || error.message.includes('backfill_at') ||
        error.message.includes('column') && error.message.includes('does not exist')) {
      const slim = { ...update };
      delete (slim as any).backfill_version;
      delete (slim as any).backfill_at;
      const retry = await db.from('training_features').update(slim as any).eq('video_id', videoId).select('video_id');
      if (retry.error) throw new Error(`DB update (slim): ${retry.error.message}`);
      if (!retry.data || retry.data.length === 0) {
        throw new Error(`DB update (slim): no row for video_id=${videoId}`);
      }
      return;
    }
    throw new Error(`DB update: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error(`DB update: no row for video_id=${videoId} (training_features row missing)`);
  }
}

// ─── Pipeline ────────────────────────────────────────────────────────────────

async function runPipeline(db: SupabaseClient, tasks: VideoTask[], cp: Checkpoint): Promise<void> {
  const todo = [...tasks];
  const queue: DownloadedTask[] = [];
  let downloadersActive = DOWNLOAD_CONCURRENCY;

  async function downloader(id: number) {
    while (todo.length > 0) {
      const task = todo.shift();
      if (!task) break;
      try {
        const videoPath = await ensureVideoLocal(task);
        // backpressure
        while (queue.length >= QUEUE_CAP) await new Promise(r => setTimeout(r, 100));
        queue.push({ ...task, videoPath });
        cp.stats.download_ok++;
      } catch (err: any) {
        cp.stats.download_fail++;
        cp.stats.errors.push({ video_id: task.video_id, stage: 'download', error: err.message });
        cp.failed_download.push(task.video_id);
        cp.completed.push(task.video_id); // don't retry in same run
      }
    }
    downloadersActive--;
  }

  async function extractor(id: number) {
    while (downloadersActive > 0 || queue.length > 0) {
      if (queue.length === 0) {
        await new Promise(r => setTimeout(r, 200));
        continue;
      }
      const task = queue.shift();
      if (!task) continue;
      let dbSucceeded = false;
      try {
        const update = await extractBackfillFeatures(task);
        cp.stats.extract_ok++;
        try {
          await updateTrainingFeatures(db, task.video_id, update);
          cp.stats.db_ok++;
          dbSucceeded = true;
        } catch (err: any) {
          cp.stats.db_fail++;
          cp.stats.errors.push({ video_id: task.video_id, stage: 'db', error: err.message });
        }
      } catch (err: any) {
        cp.stats.extract_fail++;
        cp.stats.errors.push({ video_id: task.video_id, stage: 'extract', error: err.message });
      }
      // Delete-after-extract: only remove the local file once the DB update
      // succeeded. If extraction or DB writing failed, leave the file on disk
      // so a retry-run can re-use it instead of re-downloading.
      if (dbSucceeded) {
        try { fs.unlinkSync(task.videoPath); cp.stats.deleted++; } catch { /* best effort */ }
      }
      cp.completed.push(task.video_id);
      const done = cp.stats.db_ok + cp.stats.db_fail + cp.stats.extract_fail + cp.stats.download_fail;
      if (done % PROGRESS_EVERY === 0) {
        log(`progress: done=${done}/${cp.stats.total}  dl_ok=${cp.stats.download_ok}  dl_fail=${cp.stats.download_fail}  ext_ok=${cp.stats.extract_ok}  ext_fail=${cp.stats.extract_fail}  db_ok=${cp.stats.db_ok}  db_fail=${cp.stats.db_fail}  deleted=${cp.stats.deleted}  queue=${queue.length}  todo=${todo.length}`);
        saveCheckpoint(cp);
      }
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < DOWNLOAD_CONCURRENCY; i++) workers.push(downloader(i));
  for (let i = 0; i < EXTRACT_CONCURRENCY; i++) workers.push(extractor(i));
  await Promise.all(workers);
  saveCheckpoint(cp);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
  log(`=== S9 Group B+C backfill starting ===`);

  const argLimit = process.argv.find(a => a.startsWith('--limit='));
  const limit = argLimit ? parseInt(argLimit.split('=')[1], 10) : 0;

  const db = getDb();

  // 1. Load all training+holdout video_ids from CSVs
  const trainIds = loadVideoIdsFromCsv(path.join(PROJECT_ROOT, 'src/lib/training/data/training_data.csv'));
  const holdIds = loadVideoIdsFromCsv(path.join(PROJECT_ROOT, 'src/lib/training/data/holdout_data.csv'));
  const allIds = Array.from(new Set([...trainIds, ...holdIds]));
  log(`Loaded video_ids: train=${trainIds.length}  holdout=${holdIds.length}  unique=${allIds.length}`);

  // 2. Load or init checkpoint
  const cp = loadCheckpoint();
  const doneSet = new Set(cp.completed);
  log(`Checkpoint: ${doneSet.size} already-processed video_ids`);

  // 3. Filter to remaining
  let remaining = allIds.filter(id => !doneSet.has(id));
  if (limit > 0) remaining = remaining.slice(0, limit);
  log(`Remaining to process: ${remaining.length}`);

  // 4. Fetch URL/transcript from Supabase for remaining
  log(`Fetching URLs from scraped_videos...`);
  const taskMap = await fetchVideoTasks(db, remaining);
  log(`Got ${taskMap.size}/${remaining.length} video rows from scraped_videos`);

  const tasks: VideoTask[] = [];
  for (const id of remaining) {
    const t = taskMap.get(id);
    if (t) tasks.push(t);
    else {
      // No URL available — count as permanent failure so we don't retry
      cp.stats.download_fail++;
      cp.stats.errors.push({ video_id: id, stage: 'lookup', error: 'no scraped_videos row with URL' });
      cp.completed.push(id);
    }
  }
  cp.stats.total = allIds.length;
  cp.stats.already_done = doneSet.size;
  log(`Runnable tasks: ${tasks.length}`);

  if (tasks.length === 0) {
    log('Nothing to do, exiting.');
    saveCheckpoint(cp);
    return;
  }

  // 5. Run pipeline
  await runPipeline(db, tasks, cp);

  // 6. Final summary
  log('=== DONE ===');
  log(`total=${cp.stats.total}  already_done_before=${cp.stats.already_done}`);
  log(`download_ok=${cp.stats.download_ok}  download_fail=${cp.stats.download_fail}`);
  log(`extract_ok=${cp.stats.extract_ok}  extract_fail=${cp.stats.extract_fail}`);
  log(`db_ok=${cp.stats.db_ok}  db_fail=${cp.stats.db_fail}`);
  log(`deleted=${cp.stats.deleted} (videos removed after successful DB update)`);
  log(`errors logged: ${cp.stats.errors.length}`);
  saveCheckpoint(cp);
}

main().catch(err => {
  log(`FATAL: ${err.message}\n${err.stack}`);
  process.exit(1);
});

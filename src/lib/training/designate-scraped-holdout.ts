/**
 * Scraped Video Holdout Designation
 *
 * One-time procedure that selects a 200-video stratified (by niche) holdout
 * set from scraped_videos rows where training_eligible = true and permanently
 * locks them via is_holdout = true.
 *
 * Stratification: proportional per-niche allocation with largest-remainder
 * rounding so allocations sum to exactly 200. Niches with fewer than 3 eligible
 * rows are skipped (too small to sample from meaningfully). Selection within a
 * niche uses a seeded RNG (seed: 'trendzo-holdout-v1') so the designation is
 * reproducible prior to the lock landing.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const HOLDOUT_SIZE = 200;
const HOLDOUT_SEED = 'trendzo-holdout-v1';
const MIN_ROWS_PER_NICHE = 3;
const MIN_ELIGIBLE_FOR_HOLDOUT = 1500;
const UNKNOWN_NICHE = '__unknown__';

export interface ScrapedHoldoutReport {
  totalEligible: number;
  totalLocked: number;
  remainingTraining: number;
  perNiche: Array<{ niche: string; eligible: number; holdout: number }>;
  lockedAt: string;
}

interface EligibleRow {
  video_id: string;
  niche: string | null;
  dps_score: number | null;
}

function getServiceDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase service credentials not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

// xmur3 → mulberry32 seeded PRNG (same pattern as designate-holdout.ts).
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededRng(seed: string): () => number {
  const s = xmur3(seed);
  return mulberry32(s());
}

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

async function countLockedHoldout(db: SupabaseClient): Promise<number> {
  const { count, error } = await db
    .from('scraped_videos')
    .select('video_id', { count: 'exact', head: true })
    .eq('is_holdout', true);
  if (error) throw new Error(`count holdout: ${error.message}`);
  return count ?? 0;
}

/**
 * Clear is_holdout / holdout_locked_at on every currently-locked row, in
 * chunks of 500 to stay under Supabase's statement timeout. Returns the
 * number of rows unlocked.
 */
async function resetHoldout(db: SupabaseClient): Promise<number> {
  let total = 0;
  const PAGE = 500;
  for (;;) {
    const { data, error } = await db
      .from('scraped_videos')
      .select('video_id')
      .eq('is_holdout', true)
      .range(0, PAGE - 1);
    if (error) throw new Error(`reset holdout fetch: ${error.message}`);
    if (!data || data.length === 0) break;
    const ids = data.map((r) => (r as { video_id: string }).video_id);
    const { error: updErr } = await db
      .from('scraped_videos')
      .update({ is_holdout: false, holdout_locked_at: null })
      .in('video_id', ids);
    if (updErr) throw new Error(`reset holdout update: ${updErr.message}`);
    total += ids.length;
    if (data.length < PAGE) break;
  }
  return total;
}

async function fetchEligibleRows(db: SupabaseClient): Promise<EligibleRow[]> {
  const pageSize = 1000;
  const rows: EligibleRow[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await db
      .from('scraped_videos')
      .select('video_id, niche, dps_score')
      .eq('training_eligible', true)
      .eq('is_holdout', false)
      .order('video_id', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`fetch eligible: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as EligibleRow[]));
    if (data.length < pageSize) break;
  }
  return rows;
}

/**
 * Proportional allocation with largest-remainder rounding. Ensures allocations
 * sum to exactly `total` and never exceed per-niche eligible counts.
 */
function allocate(
  perNicheCounts: Array<{ niche: string; count: number }>,
  total: number,
): Map<string, number> {
  const sumCounts = perNicheCounts.reduce((s, n) => s + n.count, 0);
  const allocations = new Map<string, number>();
  if (sumCounts === 0 || total === 0) return allocations;

  const raw = perNicheCounts.map((n) => ({
    niche: n.niche,
    count: n.count,
    ideal: (n.count / sumCounts) * total,
  }));

  let floorSum = 0;
  const withFloor = raw.map((r) => {
    const floor = Math.min(r.count, Math.floor(r.ideal));
    floorSum += floor;
    allocations.set(r.niche, floor);
    return { ...r, floor, remainder: r.ideal - Math.floor(r.ideal) };
  });

  let remainder = total - floorSum;
  const sorted = [...withFloor].sort((a, b) => b.remainder - a.remainder);
  for (const r of sorted) {
    if (remainder <= 0) break;
    const current = allocations.get(r.niche) || 0;
    if (current < r.count) {
      allocations.set(r.niche, current + 1);
      remainder--;
    }
  }

  while (remainder > 0) {
    let bestNiche: string | null = null;
    let bestHeadroom = 0;
    for (const r of withFloor) {
      const headroom = r.count - (allocations.get(r.niche) || 0);
      if (headroom > bestHeadroom) {
        bestHeadroom = headroom;
        bestNiche = r.niche;
      }
    }
    if (!bestNiche) break;
    allocations.set(bestNiche, (allocations.get(bestNiche) || 0) + 1);
    remainder--;
  }

  return allocations;
}

export interface DesignateScrapedHoldoutOptions {
  /**
   * When true, wipe is_holdout / holdout_locked_at on any already-locked rows
   * before re-running the designation. Use when a prior run produced a bad
   * holdout set and you need to redo it.
   */
  force?: boolean;
}

export async function designateScrapedHoldout(
  options: DesignateScrapedHoldoutOptions = {},
): Promise<ScrapedHoldoutReport> {
  const db = getServiceDb();

  // ── Optional reset (batched) ──────────────────────────────────────────────
  if (options.force) {
    const cleared = await resetHoldout(db);
    console.log(`[designateScrapedHoldout] force=true — cleared ${cleared} previously locked rows.`);
  }

  // ── Safety: refuse to re-run without force ────────────────────────────────
  const existing = await countLockedHoldout(db);
  if (existing > 0) {
    throw new Error('Holdout already designated. Cannot run twice.');
  }

  // ── Fetch eligible rows ───────────────────────────────────────────────────
  const eligible = await fetchEligibleRows(db);
  const totalEligible = eligible.length;

  if (totalEligible < MIN_ELIGIBLE_FOR_HOLDOUT) {
    throw new Error(
      `Only ${totalEligible} eligible rows. Need at least ${MIN_ELIGIBLE_FOR_HOLDOUT} to set aside ${HOLDOUT_SIZE} for holdout.`,
    );
  }

  // ── Group by niche (read directly from scraped_videos.niche) ──────────────
  const byNiche = new Map<string, EligibleRow[]>();
  for (const row of eligible) {
    const raw = row.niche;
    const nicheStr = raw == null ? '' : String(raw).trim();
    const niche = nicheStr.length > 0 ? nicheStr : UNKNOWN_NICHE;
    if (!byNiche.has(niche)) byNiche.set(niche, []);
    byNiche.get(niche)!.push(row);
  }
  const distribution = [...byNiche.entries()]
    .map(([niche, rows]) => `${niche}=${rows.length}`)
    .join(', ');
  console.log(`[designateScrapedHoldout] eligible=${totalEligible} niches={${distribution}}`);

  // Drop tiny niches (<3 rows) from allocation consideration — keep them in
  // the per-niche report with holdout=0 for transparency.
  const allNicheEntries = Array.from(byNiche.entries()).sort((a, b) => b[1].length - a[1].length);
  const eligibleForAlloc = allNicheEntries.filter(([, rows]) => rows.length >= MIN_ROWS_PER_NICHE);
  const perNicheCounts = eligibleForAlloc.map(([niche, rows]) => ({ niche, count: rows.length }));

  const targetSize = Math.min(HOLDOUT_SIZE, eligible.length);
  const allocations = allocate(perNicheCounts, targetSize);

  // ── Seeded sample within each niche ───────────────────────────────────────
  const rng = seededRng(HOLDOUT_SEED);
  const selectedIds: string[] = [];
  for (const { niche } of perNicheCounts) {
    const alloc = allocations.get(niche) || 0;
    if (alloc === 0) continue;
    const rows = [...(byNiche.get(niche) || [])];
    shuffleInPlace(rows, rng);
    for (const row of rows.slice(0, alloc)) selectedIds.push(row.video_id);
  }

  const lockedAt = new Date().toISOString();

  // ── Lock rows in chunks ───────────────────────────────────────────────────
  const chunkSize = 200;
  for (let i = 0; i < selectedIds.length; i += chunkSize) {
    const chunk = selectedIds.slice(i, i + chunkSize);
    const { error } = await db
      .from('scraped_videos')
      .update({ is_holdout: true, holdout_locked_at: lockedAt })
      .in('video_id', chunk);
    if (error) throw new Error(`Failed to lock holdout rows: ${error.message}`);
  }

  const perNiche = allNicheEntries.map(([niche, rows]) => ({
    niche,
    eligible: rows.length,
    holdout: allocations.get(niche) || 0,
  }));

  const report: ScrapedHoldoutReport = {
    totalEligible,
    totalLocked: selectedIds.length,
    remainingTraining: totalEligible - selectedIds.length,
    perNiche,
    lockedAt,
  };

  console.log('[designateScrapedHoldout] Holdout locked', {
    totalEligible: report.totalEligible,
    totalLocked: report.totalLocked,
    remainingTraining: report.remainingTraining,
    lockedAt: report.lockedAt,
  });

  return report;
}

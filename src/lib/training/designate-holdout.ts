/**
 * Holdout Designation
 *
 * One-time procedure that selects a 200-video stratified (by niche) holdout
 * set from eligible prediction_runs and permanently locks those rows via
 * is_holdout = true. Rows so marked must never be used for XGBoost training.
 *
 * Stratification: proportional per-niche allocation, rounded to nearest int,
 * remainder added to the largest niche so allocations sum to exactly 200.
 * Selection within a niche is a seeded random sample (seed: 'trendzo-holdout-v1')
 * so the designation is reproducible pre-execution.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const HOLDOUT_SIZE = 200;
const HOLDOUT_SEED = 'trendzo-holdout-v1';
const UNKNOWN_NICHE = '__unknown__';

export interface HoldoutReport {
  totalEligible: number;
  totalLocked: number;
  perNiche: Array<{ niche: string; eligible: number; allocated: number }>;
  lockedAt: string;
}

interface EligibleRow {
  id: string;
  creator_id: string | null;
  video_id: string;
}

function getServiceDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('Supabase service credentials not configured');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// Deterministic 32-bit hash → mulberry32 PRNG. Seeding with a fixed string makes
// the holdout selection reproducible (any re-run before the lock lands picks the
// same rows in the same order).
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

async function fetchEligibleRows(db: SupabaseClient): Promise<EligibleRow[]> {
  const pageSize = 1000;
  const rows: EligibleRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await db
      .from('prediction_runs')
      .select('id, creator_id, video_id')
      .eq('is_holdout', false)
      .not('actual_dps', 'is', null)
      .not('video_id', 'is', null)
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(`Failed to query eligible rows: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as EligibleRow[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

async function fetchNicheByCreator(
  db: SupabaseClient,
  creatorIds: string[],
): Promise<Map<string, string>> {
  const nicheMap = new Map<string, string>();
  if (creatorIds.length === 0) return nicheMap;

  const chunkSize = 500;
  for (let i = 0; i < creatorIds.length; i += chunkSize) {
    const chunk = creatorIds.slice(i, i + chunkSize);
    const { data, error } = await db
      .from('onboarding_profiles')
      .select('user_id, selected_niche, niche_key')
      .in('user_id', chunk);

    if (error) throw new Error(`Failed to query onboarding_profiles: ${error.message}`);
    for (const row of (data || []) as Array<{
      user_id: string;
      selected_niche: string | null;
      niche_key: string | null;
    }>) {
      const niche = row.selected_niche || row.niche_key || UNKNOWN_NICHE;
      nicheMap.set(row.user_id, niche);
    }
  }
  return nicheMap;
}

/**
 * Proportional allocation with largest-remainder rounding.
 * Ensures allocations sum to exactly `total`.
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
  // Distribute leftover seats by largest fractional remainder, respecting
  // per-niche eligible cap (can't allocate more than available rows).
  const sorted = [...withFloor].sort((a, b) => b.remainder - a.remainder);
  for (const r of sorted) {
    if (remainder <= 0) break;
    const current = allocations.get(r.niche) || 0;
    if (current < r.count) {
      allocations.set(r.niche, current + 1);
      remainder--;
    }
  }

  // Final sweep in case the fractional round couldn't place everything
  // (e.g. several niches already capped at their eligible count).
  while (remainder > 0) {
    // Find the niche with the most available headroom.
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

export async function designateHoldout(): Promise<HoldoutReport> {
  const db = getServiceDb();

  const eligible = await fetchEligibleRows(db);
  const totalEligible = eligible.length;

  if (totalEligible === 0) {
    return { totalEligible: 0, totalLocked: 0, perNiche: [], lockedAt: new Date().toISOString() };
  }

  const creatorIds = Array.from(
    new Set(eligible.map((r) => r.creator_id).filter((v): v is string => !!v)),
  );
  const nicheByCreator = await fetchNicheByCreator(db, creatorIds);

  // Group rows by niche
  const byNiche = new Map<string, EligibleRow[]>();
  for (const row of eligible) {
    const niche = (row.creator_id && nicheByCreator.get(row.creator_id)) || UNKNOWN_NICHE;
    if (!byNiche.has(niche)) byNiche.set(niche, []);
    byNiche.get(niche)!.push(row);
  }

  const perNicheCounts = Array.from(byNiche.entries())
    .map(([niche, rows]) => ({ niche, count: rows.length }))
    .sort((a, b) => b.count - a.count);

  const targetSize = Math.min(HOLDOUT_SIZE, totalEligible);
  const allocations = allocate(perNicheCounts, targetSize);

  // Seeded sample per niche.
  const rng = seededRng(HOLDOUT_SEED);
  const selectedIds: string[] = [];
  for (const { niche } of perNicheCounts) {
    const alloc = allocations.get(niche) || 0;
    if (alloc === 0) continue;
    const rows = [...(byNiche.get(niche) || [])];
    shuffleInPlace(rows, rng);
    for (const row of rows.slice(0, alloc)) selectedIds.push(row.id);
  }

  const lockedAt = new Date().toISOString();

  // Update in chunks to stay under Postgres parameter limits.
  const chunkSize = 200;
  for (let i = 0; i < selectedIds.length; i += chunkSize) {
    const chunk = selectedIds.slice(i, i + chunkSize);
    const { error } = await db
      .from('prediction_runs')
      .update({ is_holdout: true, holdout_locked_at: lockedAt })
      .in('id', chunk);
    if (error) throw new Error(`Failed to lock holdout rows: ${error.message}`);
  }

  const perNiche = perNicheCounts.map((n) => ({
    niche: n.niche,
    eligible: n.count,
    allocated: allocations.get(n.niche) || 0,
  }));

  const report: HoldoutReport = {
    totalEligible,
    totalLocked: selectedIds.length,
    perNiche,
    lockedAt,
  };

  console.log('[designateHoldout] Holdout locked', {
    totalEligible: report.totalEligible,
    totalLocked: report.totalLocked,
    perNiche: report.perNiche,
    lockedAt: report.lockedAt,
  });

  return report;
}

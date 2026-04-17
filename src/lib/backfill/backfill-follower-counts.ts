/**
 * Backfill onboarding_profiles.follower_count from scraped_videos.
 *
 * scraped_videos stores `creator_followers` keyed by `creator_username`.
 * onboarding_profiles stores `follower_count` keyed by `user_id` with a
 * `channel_handle` field we can join on.
 *
 * For every profile with NULL follower_count, look up the most recent
 * scraped_videos row for that username and copy creator_followers across.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getServiceDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase service credentials not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

function normalizeHandle(h: string | null | undefined): string | null {
  if (!h) return null;
  const s = String(h).trim().toLowerCase();
  if (!s) return null;
  return s.startsWith('@') ? s.slice(1) : s;
}

export async function backfillFollowerCounts(): Promise<{ updated: number; skipped: number }> {
  const db = getServiceDb();

  // 1) Pull profiles that still have NULL follower_count and a handle to match on.
  const { data: profiles, error: profErr } = await db
    .from('onboarding_profiles')
    .select('id, user_id, channel_handle, follower_count')
    .is('follower_count', null)
    .not('channel_handle', 'is', null);

  if (profErr) throw new Error(`Failed to query onboarding_profiles: ${profErr.message}`);
  if (!profiles || profiles.length === 0) {
    console.log('[backfill-followers] no profiles missing follower_count');
    return { updated: 0, skipped: 0 };
  }

  // Build handle → profile id(s) lookup.
  const byHandle = new Map<string, string[]>();
  for (const p of profiles as Array<{ id: string; channel_handle: string | null }>) {
    const h = normalizeHandle(p.channel_handle);
    if (!h) continue;
    if (!byHandle.has(h)) byHandle.set(h, []);
    byHandle.get(h)!.push(p.id);
  }

  const handles = Array.from(byHandle.keys());
  if (handles.length === 0) return { updated: 0, skipped: profiles.length };

  // 2) Pull scraped_videos rows keyed by those handles, ordered most recent first.
  //    creator_username in scraped_videos is case-insensitive in practice; we lower-case.
  const chunkSize = 200;
  const followerByHandle = new Map<string, number>();

  for (let i = 0; i < handles.length; i += chunkSize) {
    const chunk = handles.slice(i, i + chunkSize);
    const { data: videos, error: vidErr } = await db
      .from('scraped_videos')
      .select('creator_username, creator_followers, scraped_at')
      .in('creator_username', chunk)
      .not('creator_followers', 'is', null)
      .gt('creator_followers', 0)
      .order('scraped_at', { ascending: false });

    if (vidErr) throw new Error(`Failed to query scraped_videos: ${vidErr.message}`);

    for (const v of (videos || []) as Array<{ creator_username: string; creator_followers: number }>) {
      const h = normalizeHandle(v.creator_username);
      if (!h) continue;
      if (followerByHandle.has(h)) continue; // most recent already captured
      followerByHandle.set(h, v.creator_followers);
    }
  }

  // 3) Update profiles one by one (Supabase has no bulk-update-by-id shortcut
  //    that also sets different values per row). Counts are small.
  let updated = 0;
  let skipped = 0;
  const now = new Date().toISOString();

  for (const p of profiles as Array<{ id: string; channel_handle: string | null }>) {
    const h = normalizeHandle(p.channel_handle);
    if (!h) { skipped++; continue; }
    const followers = followerByHandle.get(h);
    if (!followers) { skipped++; continue; }

    const { error: updErr } = await db
      .from('onboarding_profiles')
      .update({ follower_count: followers, updated_at: now })
      .eq('id', p.id);

    if (updErr) {
      console.warn(`[backfill-followers] update failed for profile ${p.id}: ${updErr.message}`);
      skipped++;
      continue;
    }
    updated++;
  }

  console.log(`[backfill-followers] updated=${updated} skipped=${skipped} (of ${profiles.length} candidates)`);
  return { updated, skipped };
}

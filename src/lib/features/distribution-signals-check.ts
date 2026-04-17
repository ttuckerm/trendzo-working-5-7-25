/**
 * Distribution Signals Coverage Check
 *
 * Reports how much of the scraped_videos dataset has distribution metadata populated.
 * Run after migration to see backfill coverage, and periodically to track new data.
 */

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any

export interface DistributionCoverage {
  totalScraped: number
  withPostTiming: number
  withHashtagData: number
  withSoundData: number
  withEngagementVelocity: number
  coveragePct: number
  details: {
    posted_hour_utc: number
    posted_day_of_week: number
    hashtag_count: number
    has_fyp_hashtag: number
    hashtag_niche_count: number
    sound_type: number
    views_at_1h: number
    views_at_24h: number
  }
}

function getServiceClient(): DB {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

export async function checkDistributionCoverage(db?: DB): Promise<DistributionCoverage> {
  const client = db || getServiceClient()

  // Total rows
  const { count: totalScraped } = await client
    .from('scraped_videos')
    .select('video_id', { count: 'exact', head: true })

  const total = totalScraped || 0
  if (total === 0) {
    return {
      totalScraped: 0,
      withPostTiming: 0,
      withHashtagData: 0,
      withSoundData: 0,
      withEngagementVelocity: 0,
      coveragePct: 0,
      details: {
        posted_hour_utc: 0, posted_day_of_week: 0,
        hashtag_count: 0, has_fyp_hashtag: 0, hashtag_niche_count: 0,
        sound_type: 0, views_at_1h: 0, views_at_24h: 0,
      },
    }
  }

  // Count each column's non-null rows
  const counts = await Promise.all([
    client.from('scraped_videos').select('video_id', { count: 'exact', head: true }).not('posted_hour_utc', 'is', null),
    client.from('scraped_videos').select('video_id', { count: 'exact', head: true }).not('posted_day_of_week', 'is', null),
    client.from('scraped_videos').select('video_id', { count: 'exact', head: true }).not('hashtag_count', 'is', null),
    client.from('scraped_videos').select('video_id', { count: 'exact', head: true }).not('has_fyp_hashtag', 'is', null),
    client.from('scraped_videos').select('video_id', { count: 'exact', head: true }).not('hashtag_niche_count', 'is', null),
    client.from('scraped_videos').select('video_id', { count: 'exact', head: true }).not('sound_type', 'is', null),
    client.from('scraped_videos').select('video_id', { count: 'exact', head: true }).not('views_at_1h', 'is', null),
    client.from('scraped_videos').select('video_id', { count: 'exact', head: true }).not('views_at_24h', 'is', null),
  ])

  const [hourC, dowC, hcountC, fypC, nicheHC, soundC, v1hC, v24hC] = counts.map(r => r.count || 0)

  const withPostTiming = Math.min(hourC as number, dowC as number)
  const withHashtagData = Math.min(hcountC as number, fypC as number)
  const withSoundData = soundC as number
  const withEngagementVelocity = v1hC as number

  // Coverage = rows that have at least post timing OR hashtag data
  const bestCoverage = Math.max(withPostTiming, withHashtagData, withSoundData)
  const coveragePct = total > 0 ? Math.round((bestCoverage / total) * 100) : 0

  return {
    totalScraped: total,
    withPostTiming,
    withHashtagData,
    withSoundData,
    withEngagementVelocity,
    coveragePct,
    details: {
      posted_hour_utc: hourC as number,
      posted_day_of_week: dowC as number,
      hashtag_count: hcountC as number,
      has_fyp_hashtag: fypC as number,
      hashtag_niche_count: nicheHC as number,
      sound_type: soundC as number,
      views_at_1h: v1hC as number,
      views_at_24h: v24hC as number,
    },
  }
}

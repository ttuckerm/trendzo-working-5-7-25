import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'
config({ path: resolve(process.cwd(), '.env.local') })

import { loadFeedbackForDiscovery } from '../src/lib/training/trainer-engine'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
)

;(async () => {
  const { clean, corrupted } = await loadFeedbackForDiscovery(sb)

  console.log(`clean rows:  ${clean.length}`)
  console.log(`corrupted:   ${corrupted}`)

  // Dedup confirmation
  const videoIds = clean.map((r) => r.video_id).filter(Boolean) as string[]
  const uniqueVideoIds = new Set(videoIds)
  console.log(`video_ids:   ${videoIds.length}, unique: ${uniqueVideoIds.size}`)
  console.log(`da093384 present: ${videoIds.filter((id) => id.startsWith('da093384')).length} time(s)`)

  // Niche resolution
  const withNiche = clean.filter((r) => r.niche).length
  const niches: Record<string, number> = {}
  for (const r of clean) {
    const k = r.niche || '__unknown__'
    niches[k] = (niches[k] || 0) + 1
  }
  console.log(`with niche:  ${withNiche} / ${clean.length}`)
  console.log(`niche distribution:`, niches)

  // Negative-actual rows preserved?
  const negative = clean.filter((r) => r.actual_dps < 0).length
  const nonneg = clean.filter((r) => r.actual_dps >= 0).length
  console.log(`negative actual_dps: ${negative}`)
  console.log(`non-negative actual_dps: ${nonneg}`)

  // Sanity checks
  console.log('')
  const target = 42 // 43 raw minus 1 da093384 duplicate
  const pass = clean.length >= target - 1 && clean.length <= target + 1
  console.log(pass ? `✅ PASS — clean.length=${clean.length} near expected ${target}` : `❌ FAIL — clean.length=${clean.length}, expected ~${target}`)
})()

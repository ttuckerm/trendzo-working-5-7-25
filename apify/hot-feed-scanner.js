#!/usr/bin/env node
// HotFeedScanner: stub harness calling Apify dataset and writing to Supabase
/* eslint-disable @typescript-eslint/no-var-requires */
const { ApifyClient } = require('apify-client')
const { createClient } = require('@supabase/supabase-js')

const token = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN
const datasetId = process.env.APIFY_DATASET_ID
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

async function main(){
  const niche = getArg('--niche') || 'general'
  const limit = Number(getArg('--limit') || '50')
  const client = new ApifyClient({ token })
  const db = SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null

  let items = []
  if (datasetId && token) {
    const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&limit=${limit}`)
    if (res.ok) items = await res.json()
  }

  // Minimal mapping
  const mapped = items.map((a)=>({
    platform: 'tiktok',
    video_id: a.videoId || a.id,
    author_id: a.authorId || a.author?.id || 'unknown',
    caption_full: a.caption || a.text || '',
    hashtags: Array.isArray(a.hashtags)? a.hashtags: [],
    sound_id: a.music?.id || a.soundId || null,
    sound_title: a.music?.title || a.music?.name || null,
    scrape_id: `hotfeed_${Date.now()}`,
    actor_name: 'HotFeedScanner',
    actor_version: 'v1',
    scrape_time: new Date().toISOString(),
    source_url: a.url || a.shareUrl || null,
  }))

  if (db && mapped.length) {
    for (const v of mapped) {
      try { await db.from('videos').upsert(v, { onConflict: 'platform,video_id' }) } catch {}
    }
  }
  console.log(JSON.stringify({ ok:true, niche, count: mapped.length }))
}

function getArg(name){
  const idx = process.argv.indexOf(name)
  return idx>=0 ? process.argv[idx+1] : undefined
}

main().catch((e)=>{ console.error(e); process.exit(1) })



#!/usr/bin/env node
const { ApifyClient } = require('apify-client')
const { createClient } = require('@supabase/supabase-js')

const token = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

async function main(){
  const client = new ApifyClient({ token })
  const db = SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null

  // stub velocities
  const now = new Date().toISOString()
  const sounds = [{ platform:'tiktok', sound_id:'s1', velocity_24h: 12, velocity_7d: 80, updated_at: now }]
  if (db) {
    for (const s of sounds) { try { await db.from('sounds').upsert(s, { onConflict: 'platform,sound_id' }) } catch {} }
  }
  console.log(JSON.stringify({ ok:true, sounds: sounds.length }))
}

main().catch((e)=>{ console.error(e); process.exit(1) })



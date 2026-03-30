import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

import { scrapeTikTokBatch, ensureRawVideosTable } from '@/lib/services/apifyScraper'
import { runWithProgress } from '@/app/api/admin/jobs/runner'
import { updateJobRun } from '@/lib/jobs/job_store'

type ScrapeBody = {
  keywords?: string[]
  mode?: 'frameworks' | 'keywords' | 'trending'
  maxKeywords?: number
}

export async function POST(request: NextRequest) {
  try {
    if (process.env.SCRAPING_ENABLED !== 'true') {
      return NextResponse.json({ success: false, error: 'Scraping disabled' }, { status: 503 })
    }
    const body = (await request.json().catch(() => ({}))) as ScrapeBody
    const mode = body.mode || (body.keywords && body.keywords.length ? 'keywords' : 'frameworks')
    const maxKeywords = Math.min(Math.max(body.maxKeywords ?? 40, 5), 200)

    // Validate env
    const apifyToken = process.env.APIFY_API_TOKEN
    const actorId = process.env.TIKTOK_SCRAPER_ACTOR_ID || 'clockworks/free-tiktok-scraper'
    if (!apifyToken) {
      return NextResponse.json({ success: false, error: 'APIFY_API_TOKEN is not set' }, { status: 400 })
    }

    let keywords: string[] = []

    if (mode === 'keywords' && Array.isArray(body.keywords) && body.keywords.length > 0) {
      keywords = body.keywords
    } else if (mode === 'trending') {
      // Fallback trending seeds
      keywords = ['viral', 'fyp', 'trend', 'storytime', 'fitness', 'skin care', 'ai tools', 'side hustle']
    } else {
      keywords = buildKeywordsFromFrameworks(maxKeywords)
    }

    if (keywords.length === 0) {
      return NextResponse.json({ success: false, error: 'No keywords to scrape' }, { status: 400 })
    }

    // Normalize to hashtags expected by scraper
  const hashed = Array.from(new Set(keywords.map(toHashtag))).slice(0, maxKeywords)

    // Ensure destination table exists
    await ensureRawVideosTable()

    // Run scrape (batch) with progress
    const started = Date.now()
    const { job_id } = await runWithProgress('scrape_tiktok', { mode, count: hashed.length }, [
      { name: 'prepare', fn: async ()=>{ await new Promise(r=>setTimeout(r,200)) } },
      { name: 'scrape', fn: async ()=>{
          const chunk = Math.max(1, Math.floor(hashed.length/5))
          let processed = 0
          for (let i=0;i<hashed.length;i+=chunk) {
            const slice = hashed.slice(i, i+chunk)
            const res = await scrapeTikTokBatch(slice, { maxVideos: 50 })
            processed += slice.length
            await updateJobRun(job_id, { meta: { processed } }, { ts: new Date().toISOString(), msg: `processed:${processed}` })
          }
        }
      },
      { name: 'finalize', fn: async ()=>{ await new Promise(r=>setTimeout(r,100)) } }
    ])

    return NextResponse.json({ success: true, mode, keywords: hashed, count: hashed.length, job_id, sse: `/api/admin/ws?job_id=${job_id}`, started_at: new Date(started).toISOString() })
  } catch (error) {
    console.error('Scrape trigger failed:', error)
    return NextResponse.json({ success: false, error: String((error as Error).message || error) }, { status: 500 })
  }
}

function toHashtag(s: string): string {
  const cleaned = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '')
  return cleaned.startsWith('#') ? cleaned : `#${cleaned}`
}

function buildKeywordsFromFrameworks(maxKeywords: number): string[] {
  const results = new Set<string>()

  try {
    // Seed with explicit top-20 niches
    const nichesPath = path.join(process.cwd(), 'data', 'niches.json')
    if (fs.existsSync(nichesPath)) {
      const niches: string[] = JSON.parse(fs.readFileSync(nichesPath, 'utf-8'))
      niches.forEach((n) => results.add(n))
    }

    const rootGenes = path.join(process.cwd(), 'framework_genes.json')
    if (fs.existsSync(rootGenes)) {
      const parsed = JSON.parse(fs.readFileSync(rootGenes, 'utf-8'))
      const arr: any[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.genes) ? parsed.genes : []
      for (const g of arr) {
        if (g.name) results.add(String(g.name))
        if (Array.isArray(g.trigger_words)) g.trigger_words.forEach((w: any) => results.add(String(w)))
        if (Array.isArray(g.examples)) g.examples.forEach((e: any) => results.add(String(e).slice(0, 40)))
        if (results.size >= maxKeywords * 3) break
      }
    }
  } catch {}

  try {
    const custom = path.join(process.cwd(), 'data', 'custom_frameworks.json')
    if (fs.existsSync(custom)) {
      const arr: any[] = JSON.parse(fs.readFileSync(custom, 'utf-8'))
      for (const f of arr) {
        if (f?.name) results.add(String(f.name))
        if (Array.isArray(f?.optimizationTips)) f.optimizationTips.forEach((t: any) => results.add(String(t).slice(0, 30)))
        if (Array.isArray(f?.patterns)) f.patterns.forEach((p: any) => results.add(String(p).replace(/[^a-z0-9 ]/gi, ' ').slice(0, 30)))
        if (results.size >= maxKeywords * 4) break
      }
    }
  } catch {}

  // Heuristic seed topics if still small
  if (results.size < 10) {
    ;['authority', 'story', 'challenge', 'tutorial', 'myth', 'comparison', 'transformation', 'broll', 'greenscreen'].forEach(
      (k) => results.add(k)
    )
  }

  return Array.from(results).slice(0, maxKeywords)
}



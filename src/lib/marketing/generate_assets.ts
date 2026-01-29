import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { simulateAudience } from '@/lib/simulator/audience'
import fs from 'fs'
import path from 'path'

export type MarketingAsset = {
  id?: string
  kind: 'script' | 'caption' | 'thumbnail'
  content: any
  predicted_score: number
}

async function ensureTable(db: any) {
  try { await (db as any).rpc?.('exec_sql', { query: `
    create table if not exists marketing_assets (
      id uuid default gen_random_uuid() primary key,
      kind text not null,
      content jsonb not null,
      predicted_score double precision not null,
      created_at timestamptz not null default now()
    );
    create index if not exists idx_marketing_assets_created on marketing_assets(created_at desc);
  ` }) } catch {}
}

function sampleFrameworkTokens(max = 3): string[] {
  try {
    const p = path.join(process.cwd(), 'data', 'custom_frameworks.json')
    if (!fs.existsSync(p)) return ['hook','story']
    const arr = JSON.parse(fs.readFileSync(p,'utf-8'))
    const names = Array.isArray(arr) ? arr.map((x:any)=> String(x.name||'')).filter(Boolean) : []
    const out: string[] = []
    for (let i=0;i<Math.min(max, names.length);i++) out.push(names[(Math.random()*names.length)|0].toLowerCase().slice(0,24))
    return out.length? out : ['hook','story']
  } catch { return ['hook','story'] }
}

function buildDraft(kind: MarketingAsset['kind'], niche: string, tokens: string[]): MarketingAsset {
  const base = {
    script: `Here’s the ${tokens[0]||'viral'} play for ${niche}. Step 1: Hook. Step 2: Story. Step 3: CTA.`,
    caption: `Trying a ${tokens.join('/')} format in ${niche}. What do you think? #${niche}`,
    thumbnail: { title: `${niche.toUpperCase()} • ${tokens[0]||'HOOK'}`, style: 'bold' }
  }
  const content = kind==='thumbnail' ? base.thumbnail : (kind==='script' ? { text: base.script } : { text: base.caption })
  const sim = simulateAudience({
    niche,
    cohort: 'default',
    platform: 'tiktok' as any,
    tokens,
    frameworkProfile: { overallScore: 0.6 },
    timingScore: 1.0,
    personalizationFactor: 1.0,
    impressions: 10000,
    videoFeatures: { hookStrength: 0.6, durationSeconds: 20 }
  })
  const score = Math.max(0, Math.min(100, Number((sim.sim_score||1)*100)))
  return { kind, content, predicted_score: score }
}

export async function generateMarketingDrafts(n = 10, niche = 'general'): Promise<{ created: number }> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureTable(db)
  const tokens = sampleFrameworkTokens(3)
  const kinds: MarketingAsset['kind'][] = ['script','caption','thumbnail']
  let created = 0
  for (let i=0;i<n;i++) {
    const kind = kinds[i % kinds.length]
    const asset = buildDraft(kind, niche, tokens)
    try { await db.from('marketing_assets').insert(asset as any); created++ } catch {}
  }
  return { created }
}



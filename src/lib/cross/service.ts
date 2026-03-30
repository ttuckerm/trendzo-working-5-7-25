import { promises as fs } from 'fs'
import path from 'path'
import { buildCascadesRaw, Cascade } from './cascade'
import type { VIT } from '@/lib/vit/vit'
import type { Source } from '@/lib/data/source'
import { getSource } from '@/lib/data'
import { mockSource } from '@/lib/data/mock'
import { predictCrossPlatform } from './predict'

const ROOT = path.join(process.cwd(), 'fixtures', 'cross')
const FIX_DIR = ROOT
const CASC = path.join(ROOT, 'cascades.json')
const CASCADES_PATH = CASC
const PRED = path.join(ROOT, 'predictions.json')

type BuildParams = { window?: string; niche?: string; creator?: string }

export async function ensureCrossFixtures(): Promise<void> {
  await fs.mkdir(FIX_DIR, { recursive: true })
  try {
    await fs.access(CASCADES_PATH)
    return
  } catch {}
  // synthesize demo set
  let videos: any[] = []
  try {
    const v = await fs.readFile(path.join(process.cwd(), 'fixtures', 'videos.json'), 'utf8')
    videos = JSON.parse(v)
  } catch {
    videos = Array.from({ length: 30 }).map((_, i) => ({
      id: `vid-${i + 1}`,
      platform: i % 3 === 0 ? 'tiktok' : i % 3 === 1 ? 'instagram' : 'youtube',
      videoId: `demo-${i + 1}`,
      views48h: Math.floor(1_000_000 * Math.random()),
    }))
  }
  const cascades = Array.from({ length: Math.max(20, Math.min(60, videos.length)) }).map((_, i) => ({
    id: `cascade-${i + 1}`,
    signature: `sig-${i + 1}`,
    leader: { platform: 'tiktok', videoId: `tt-${i + 1}`, views48h: Math.floor(1_000_000 * Math.random()) },
    lags: { ig: 24 + Math.floor(Math.random() * 48), yt: 48 + Math.floor(Math.random() * 96) },
    viral: true,
    crossSR: 70 + Math.floor(Math.random() * 25),
  }))
  await fs.writeFile(CASCADES_PATH, JSON.stringify({ generatedAtISO: new Date().toISOString(), cascades }, null, 2), 'utf8')
}

export async function readFixtureCascades() {
  try {
    const raw = await (await fs.readFile(CASCADES_PATH, 'utf8'))
    const json = JSON.parse(raw)
    return json.cascades ?? []
  } catch {
    await ensureCrossFixtures()
    const raw = await fs.readFile(CASCADES_PATH, 'utf8')
    const json = JSON.parse(raw)
    return json.cascades ?? []
  }
}

export async function buildCascades(source: Source, params: BuildParams) {
  if (process.env.MOCK === '1') {
    await ensureCrossFixtures()
    return readFixtureCascades()
  }
  try {
    const items: any[] = await (source as any).list({ window: params.window ?? '30d' })
    const cascades = (items || []).slice(0, 40).map((v: any, i: number) => ({
      id: v.id ?? `live-${i}`,
      signature: v.signature ?? `live-${i}`,
      leader: { platform: v.platform ?? 'tiktok', videoId: v.videoId ?? `vid-${i}`, views48h: v.views48h ?? v.views ?? 0 },
      lags: { ig: 36, yt: 72 },
      viral: !!v.viral,
      crossSR: 70 + Math.floor(Math.random() * 25),
    }))
    if (cascades.length === 0) throw new Error('empty-live-cascades')
    return cascades
  } catch {
    await ensureCrossFixtures()
    return readFixtureCascades()
  }
}

export async function savePrediction(pred: any) {
  try { await fs.mkdir(ROOT, { recursive: true }); await fs.writeFile(PRED, JSON.stringify(pred, null, 2)) } catch {}
}

export function summarize(cascades: any[]): { total:number; topLeader:string|null; avgLags:any; crossSRByTemplate:Record<string,number>; activeCascades:number } {
  const total = cascades.length
  const leaders: Record<string, number> = {}
  let sumTI=0, cTI=0, sumIY=0, cIY=0
  const byTemplate: Record<string, { n:number; sr:number }> = {}
  for (const c of cascades) {
    const leader = typeof c.leader === 'string' ? c.leader : c.leader?.platform || 'tiktok'
    leaders[leader] = (leaders[leader]||0)+1
    const ti = (c.lags?.tikTokToIG ?? c.lags?.ig)
    const iy = (c.lags?.igToYT ?? c.lags?.yt)
    if (typeof ti === 'number') { sumTI += ti; cTI++ }
    if (typeof iy === 'number') { sumIY += iy; cIY++ }
    const tpl = String(c.signature?.split?.('|')?.[0] || c.signature || '')
    const cur = byTemplate[tpl] || { n:0, sr:0 }
    byTemplate[tpl] = { n: cur.n+1, sr: cur.sr + (typeof c.crossSR === 'number' ? c.crossSR/100 : 0.5) }
  }
  const topLeader = Object.entries(leaders).sort((a,b)=>b[1]-a[1])[0]?.[0] || null
  const avgTI = cTI? Number((sumTI/cTI).toFixed(1)) : 0
  const avgIY = cIY? Number((sumIY/cIY).toFixed(1)) : 0
  const crossSRByTemplate = Object.fromEntries(Object.entries(byTemplate).map(([k,v]) => [k, Number((v.sr/Math.max(1,v.n)).toFixed(3))]))
  return { total, topLeader, avgLags: { tikTokToIG: avgTI, igToYT: avgIY }, crossSRByTemplate, activeCascades: total }
}

export async function predictForSeed(srcOrMode: Source|'mock'|undefined, seed: { platform:'tiktok'|'instagram'|'youtube'; videoId?: string; templateId?: string; niche?: string }): Promise<ReturnType<typeof predictCrossPlatform>> {
  const src = srcOrMode && srcOrMode !== 'mock' ? (srcOrMode as Source) : mockSource
  let v: VIT | null = null
  if (seed.videoId) { try { v = await src.get(seed.videoId) } catch {} }
  const out = predictCrossPlatform({ platform: seed.platform, video: v, templateId: seed.templateId, niche: seed.niche })
  await savePrediction({ seed, out, at: new Date().toISOString() })
  return out
}



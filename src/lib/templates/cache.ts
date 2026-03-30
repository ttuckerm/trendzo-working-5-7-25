import fs from 'fs'
import path from 'path'
import { isMock } from '@/lib/data/source'
import { TemplateAggregate } from './aggregate'

type WindowArg = '7d' | '30d' | '90d'

export interface RecipeBookPayload {
  generatedAtISO: string
  counts: { hot: number; cooling: number; newly: number; uses: number; viral: number }
  hot: any[]
  cooling: any[]
  newly: any[]
}

const FIX_DIR = () => path.join(process.cwd(), 'fixtures')
const RB_FILE = () => path.join(FIX_DIR(), 'recipe_book.json')
const LB_FILE = () => path.join(FIX_DIR(), 'templates_leaderboard.json')

function ensureDir() { if (!fs.existsSync(FIX_DIR())) fs.mkdirSync(FIX_DIR(), { recursive: true }) }

export function writeFixtures(rb: RecipeBookPayload, leaderboard: any[]) {
  if (!isMock()) return
  ensureDir()
  fs.writeFileSync(RB_FILE(), JSON.stringify(rb, null, 2), 'utf8')
  fs.writeFileSync(LB_FILE(), JSON.stringify(leaderboard, null, 2), 'utf8')
}

export function readRecipeBook(): RecipeBookPayload | null {
  if (!isMock()) return null
  try { return JSON.parse(fs.readFileSync(RB_FILE(), 'utf8')) } catch { return null }
}

export function readLeaderboard(): any[] | null {
  if (!isMock()) return null
  try { return JSON.parse(fs.readFileSync(LB_FILE(), 'utf8')) } catch { return null }
}

type Key = string

function makeKey(window: WindowArg, platform?: string, niche?: string): Key {
  return `${window}|${platform || 'all'}|${niche || 'all'}`
}

const LRU_CAP = 20
const TTL_MS = 10 * 60 * 1000
const lru = new Map<Key, { at: number; value: any }>()

export function cacheGet(window: WindowArg, platform?: string, niche?: string): any | null {
  if (isMock()) return null
  const k = makeKey(window, platform, niche)
  const v = lru.get(k)
  if (!v) return null
  if (Date.now() - v.at > TTL_MS) { lru.delete(k); return null }
  lru.delete(k); lru.set(k, { at: v.at, value: v.value })
  return v.value
}

export function cacheSet(window: WindowArg, platform: string | undefined, niche: string | undefined, value: any) {
  if (isMock()) return
  const k = makeKey(window, platform, niche)
  if (lru.size >= LRU_CAP) {
    const first = lru.keys().next().value as Key | undefined
    if (first) lru.delete(first)
  }
  lru.set(k, { at: Date.now(), value })
}



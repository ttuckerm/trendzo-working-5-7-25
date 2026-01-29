import { promises as fs } from 'fs'
import * as path from 'path'
import { z } from 'zod'

export interface FrameworkGene {
  id: string
  name: string
  category?: string
  description?: string
  patterns?: string[]
  tokens?: string[]
  success_rate?: number
}

const DATA_DIR = path.join(process.cwd(), 'data')
const FW_DIR = path.join(DATA_DIR, 'frameworks')
const CUSTOM_PATH = path.join(DATA_DIR, 'custom_frameworks.json')

const FrameworkSpec = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  patterns: z.array(z.string()).optional(),
  tokens: z.array(z.string()).optional(),
  success_rate: z.number().optional()
})

export async function loadAllFrameworks(): Promise<FrameworkGene[]> {
  const byFiles: FrameworkGene[] = []
  try {
    const names = await fs.readdir(FW_DIR)
    for (const n of names) {
      if (!n.endsWith('.json')) continue
      try {
        const buf = await fs.readFile(path.join(FW_DIR, n), 'utf-8')
        const parsed = JSON.parse(buf)
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const v = FrameworkSpec.parse(item)
            byFiles.push(v)
          }
        } else if (parsed) {
          const v = FrameworkSpec.parse(parsed)
          byFiles.push(v)
        }
      } catch {}
    }
  } catch {}

  let custom: FrameworkGene[] = []
  try {
    const buf = await fs.readFile(CUSTOM_PATH, 'utf-8')
    const parsed = JSON.parse(buf)
    if (Array.isArray(parsed)) custom = parsed.map(x=>FrameworkSpec.parse(x))
  } catch {}

  // Merge, favor custom overrides by id
  const idTo = new Map<string, FrameworkGene>()
  for (const f of byFiles) if (f && f.id) idTo.set(f.id, f)
  for (const f of custom) if (f && f.id) idTo.set(f.id, { ...idTo.get(f.id), ...f })
  return Array.from(idTo.values())
}

export async function syncFrameworks(): Promise<{ frameworksCount: number }>{
  await fs.mkdir(FW_DIR, { recursive: true })
  let all: FrameworkGene[] = []
  try { all = await loadAllFrameworks() } catch {}
  // Write back custom as single source of truth
  await fs.writeFile(CUSTOM_PATH, JSON.stringify(all, null, 2))
  // Optionally write split files grouped by category
  const byCat: Record<string, FrameworkGene[]> = {}
  for (const fw of all) {
    const cat = fw.category || 'uncategorized'
    ;(byCat[cat] ||= []).push(fw)
  }
  for (const [cat, arr] of Object.entries(byCat)) {
    const safe = cat.toLowerCase().replace(/[^a-z0-9]+/g,'_')
    await fs.writeFile(path.join(FW_DIR, `${safe}.json`), JSON.stringify(arr, null, 2))
  }
  return { frameworksCount: all.length }
}

export async function extractAllTokens(): Promise<Set<string>> {
  const all = await loadAllFrameworks()
  const tokens = new Set<string>()
  for (const fw of all) {
    for (const t of fw.tokens || []) tokens.add(t.toLowerCase())
    for (const p of fw.patterns || []) tokens.add(String(p).toLowerCase())
  }
  return tokens
}


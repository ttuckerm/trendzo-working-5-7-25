import fs from 'fs'
import path from 'path'
import { ensureFixtures } from '@/lib/data/init-fixtures'

export interface UploadInput {
  file?: File | Blob | null
  url?: string
}

export async function acceptUpload(input: UploadInput): Promise<{ mode: 'mock' | 'live'; localPath?: string; url?: string }> {
  if (process.env.MOCK === '1') {
    try { ensureFixtures() } catch {}
    const p = path.join(process.cwd(), 'fixtures', 'videos.json')
    if (fs.existsSync(p)) return { mode: 'mock', localPath: p }
    return { mode: 'mock' }
  }

  if (input.url) return { mode: 'live', url: input.url }
  // For simplicity, assume file is handled by higher-level upload; return placeholder pointer
  return { mode: 'live' }
}



import fs from 'fs'
import path from 'path'

function ensureDir() {
  const dir = path.join(process.cwd(), 'fixtures', 'scripts')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export function appendNdjson(fileName: 'generated.ndjson'|'analyses.ndjson', obj: unknown): void {
  ensureDir()
  const file = path.join(process.cwd(), 'fixtures', 'scripts', fileName)
  const tmp = file + '.tmp'
  const line = JSON.stringify(obj) + '\n'
  fs.writeFileSync(tmp, line)
  try { fs.appendFileSync(file, fs.readFileSync(tmp)) } finally { fs.unlinkSync(tmp) }
}

export function readAllNdjson<T = any>(fileName: 'generated.ndjson'|'analyses.ndjson'): T[] {
  try {
    const file = path.join(process.cwd(), 'fixtures', 'scripts', fileName)
    const txt = fs.readFileSync(file, 'utf8')
    return txt.split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l)) as T[]
  } catch { return [] }
}









































































































































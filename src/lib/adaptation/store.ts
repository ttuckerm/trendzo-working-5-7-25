import fs from 'fs'
import path from 'path'

const ROOT = path.join(process.cwd(), 'fixtures', 'adaptation')
const LOG = path.join(ROOT, 'changes.ndjson')

function ensureDir() { if (!fs.existsSync(ROOT)) fs.mkdirSync(ROOT, { recursive: true }) }

export type ChangeLogRow = { proposed: any; applied: boolean; appliedAtISO?: string }

export function recordProposal(proposed: any): void {
  ensureDir()
  const row: ChangeLogRow = { proposed, applied: false }
  fs.appendFileSync(LOG, JSON.stringify(row) + '\n')
}

export function recordApply(proposed: any): void {
  ensureDir()
  const row: ChangeLogRow = { proposed, applied: true, appliedAtISO: new Date().toISOString() }
  fs.appendFileSync(LOG, JSON.stringify(row) + '\n')
}

export function recentChanges(limit = 50): ChangeLogRow[] {
  try {
    const txt = fs.readFileSync(LOG, 'utf8')
    const lines = txt.split(/\r?\n/).filter(Boolean)
    const rows = lines.map(l => { try { return JSON.parse(l) as ChangeLogRow } catch { return null } }).filter(Boolean) as ChangeLogRow[]
    return rows.slice(-limit).reverse()
  } catch { return [] }
}



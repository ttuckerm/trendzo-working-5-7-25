import { createHash, createHmac } from 'crypto'
import { promises as fs } from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function ensureAuditTables(): Promise<void> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const sql = `
  create table if not exists predictions_audit (
    prediction_id text primary key,
    model_version text,
    cohort_version text,
    inputs_digest text,
    outputs_digest text,
    token_lifts jsonb,
    timing_score numeric,
    personalization_factor numeric,
    alignment_factor numeric,
    signed_at timestamptz,
    signature text
  );
  create table if not exists prediction_events (
    id bigserial primary key,
    prediction_id text,
    event text,
    payload jsonb,
    created_at timestamptz default now()
  );
  `
  try { await (db as any).rpc('exec_sql', { query: sql }) } catch {}
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export function hmacSignHex(data: string, key: string): string {
  return createHmac('sha256', key).update(data).digest('hex')
}

// Minimal ZIP (store-only) builder for small JSON files
function crc32(buf: Buffer): number {
  let crc = ~0
  for (let i = 0; i < buf.length; i++) {
    let c = (crc ^ buf[i]) & 0xFF
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    crc = (crc >>> 8) ^ c
  }
  return ~crc >>> 0
}

export async function writeEvidenceZip(predictionId: string, files: Record<string, string>): Promise<string> {
  const entries = Object.entries(files)
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0
  const now = new Date()
  const msDosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (Math.floor(now.getSeconds() / 2))) & 0xFFFF
  const msDosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth()+1) << 5) | now.getDate()) & 0xFFFF

  for (const [name, content] of entries) {
    const data = Buffer.from(content, 'utf-8')
    const nameBuf = Buffer.from(name)
    const crc = crc32(data)
    const compSize = data.length
    const uncompSize = data.length
    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0) // local file header sig
    localHeader.writeUInt16LE(20, 4) // version needed
    localHeader.writeUInt16LE(0, 6) // flags
    localHeader.writeUInt16LE(0, 8) // compression method (store)
    localHeader.writeUInt16LE(msDosTime, 10)
    localHeader.writeUInt16LE(msDosDate, 12)
    localHeader.writeUInt32LE(crc, 14)
    localHeader.writeUInt32LE(compSize, 18)
    localHeader.writeUInt32LE(uncompSize, 22)
    localHeader.writeUInt16LE(nameBuf.length, 26)
    localHeader.writeUInt16LE(0, 28) // extra length
    const local = Buffer.concat([localHeader, nameBuf, data])
    localParts.push(local)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0) // central dir sig
    centralHeader.writeUInt16LE(20, 4) // version made by
    centralHeader.writeUInt16LE(20, 6) // version needed
    centralHeader.writeUInt16LE(0, 8) // flags
    centralHeader.writeUInt16LE(0, 10) // method
    centralHeader.writeUInt16LE(msDosTime, 12)
    centralHeader.writeUInt16LE(msDosDate, 14)
    centralHeader.writeUInt32LE(crc, 16)
    centralHeader.writeUInt32LE(compSize, 20)
    centralHeader.writeUInt32LE(uncompSize, 24)
    centralHeader.writeUInt16LE(nameBuf.length, 28)
    centralHeader.writeUInt16LE(0, 30) // extra
    centralHeader.writeUInt16LE(0, 32) // comment
    centralHeader.writeUInt16LE(0, 34) // disk start
    centralHeader.writeUInt16LE(0, 36) // int attrs
    centralHeader.writeUInt32LE(0, 38) // ext attrs
    centralHeader.writeUInt32LE(offset, 42) // relative offset
    const central = Buffer.concat([centralHeader, nameBuf])
    centralParts.push(central)

    offset += local.length
  }

  const centralDir = Buffer.concat(centralParts)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0) // end of central dir sig
  end.writeUInt16LE(0, 4) // disk number
  end.writeUInt16LE(0, 6) // start disk
  end.writeUInt16LE(entries.length, 8) // # records on this disk
  end.writeUInt16LE(entries.length, 10) // total # records
  end.writeUInt32LE(centralDir.length, 12) // size of central dir
  end.writeUInt32LE(offset, 16) // offset of central dir
  end.writeUInt16LE(0, 20) // comment length

  const zip = Buffer.concat([...localParts, centralDir, end])
  const outDir = path.join(process.cwd(), 'storage', 'evidence')
  await fs.mkdir(outDir, { recursive: true })
  const filePath = path.join(outDir, `${predictionId}.zip`)
  await fs.writeFile(filePath, zip)
  return path.join('storage','evidence',`${predictionId}.zip`).replace(/\\/g,'/')
}



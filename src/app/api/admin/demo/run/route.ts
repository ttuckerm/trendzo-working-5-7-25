import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import * as path from 'path'

const SEED = 1337

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return h >>> 0
}

function deterministicArray<T>(arr: T[], count: number, seed: number): T[] {
  const r = rng(seed)
  const out: T[] = []
  for (let i = 0; i < count; i++) {
    out.push(arr[Math.floor(r() * arr.length)])
  }
  return out
}

function buildStoredZip(entries: { name: string; data: Buffer }[]): Buffer {
  // Minimal ZIP (STORED) writer
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8')
    const crc = crc32(data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0, 6)
    local.writeUInt16LE(0, 8)
    local.writeUInt16LE(0, 10)
    local.writeUInt16LE(0, 12)
    local.writeUInt32LE(crc >>> 0, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28)
    const localHeader = Buffer.concat([local, nameBuf])
    const localRecord = Buffer.concat([localHeader, data])
    localParts.push(localRecord)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0, 8)
    central.writeUInt16LE(0, 10)
    central.writeUInt16LE(0, 12)
    central.writeUInt32LE(crc >>> 0, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    central.writeUInt16LE(0, 30)
    central.writeUInt16LE(0, 32)
    central.writeUInt16LE(0, 34)
    central.writeUInt16LE(0, 36)
    central.writeUInt32LE(0, 38)
    central.writeUInt32LE(offset, 42)
    const centralHeader = Buffer.concat([central, nameBuf])
    centralParts.push(centralHeader)
    offset += localRecord.length
  }
  const centralDir = Buffer.concat(centralParts)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralDir.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)
  return Buffer.concat([...localParts, centralDir, end])
}

function crc32(buf: Buffer): number {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
    }
  }
  return ~c >>> 0
}

export async function GET() {
  // Seeded inputs
  const seed = SEED
  const frameworkTokens = ['hook', 'twist', 'cta', 'pattern-break', 'social-proof']
  const selectedFrameworks = deterministicArray(frameworkTokens, 3, seed)

  // Analyze (deterministic scores)
  const base = rng(seed)()
  const analyze = {
    engagement_score: Math.round((0.72 + base * 0.01) * 1000) / 1000,
    retention_score: Math.round((0.81 + base * 0.01) * 1000) / 1000,
    virality_index: Math.round((0.64 + base * 0.01) * 1000) / 1000,
  }

  // Simulate (synthetic audience)
  const simRng = rng(hashString('sim:' + seed))
  const simulate = Array.from({ length: 5 }).map((_, i) => ({
    variant: `v${i + 1}`,
    ctr: Math.round((0.045 + simRng() * 0.001) * 1000) / 1000,
    completion: Math.round((0.39 + simRng() * 0.002) * 1000) / 1000,
    saves: Math.floor(100 + simRng() * 3),
  }))

  // Coach (tips)
  const coachPool = [
    'Front-load the payoff in the first 1.8s',
    'Tighten the mid-beat by 10–12%',
    'Give a visual anchor for each claim',
    'Re-order the 2nd and 3rd beats',
  ]
  const coach = deterministicArray(coachPool, 3, hashString('coach:' + seed))

  // Bandit (arm selection)
  const banditArms = ['title:A', 'title:B', 'title:C']
  const bandit = {
    chosen: banditArms[Math.floor(rng(hashString('bandit:' + seed))() * banditArms.length)],
    epsilon: 0.08,
  }

  // Readiness summary
  const readiness = {
    frameworks: selectedFrameworks,
    analyze,
    simulate,
    coach,
    bandit,
    seed,
  }

  // Persist current demo JSON
  const proofDir = path.join(process.cwd(), 'storage', 'proof')
  await fs.mkdir(proofDir, { recursive: true })
  const demoJsonPath = path.join(proofDir, 'demo_current.json')
  await fs.writeFile(demoJsonPath, JSON.stringify(readiness, null, 2))

  // Build a deterministic proof ZIP containing readiness.json
  const zipBuf = buildStoredZip([
    { name: 'readiness.json', data: Buffer.from(JSON.stringify(readiness, null, 2), 'utf8') },
  ])
  const proofZipPath = path.join(proofDir, 'demo_readiness.zip')
  await fs.writeFile(proofZipPath, zipBuf)

  return NextResponse.json({
    ok: true,
    readiness,
    evidence: {
      proof_zip: 'storage/proof/demo_readiness.zip',
      demo_json: 'storage/proof/demo_current.json',
    },
  })
}








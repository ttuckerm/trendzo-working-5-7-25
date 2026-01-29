import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { publicV1Spec, publicV2Spec } from '@/lib/api/openapi'

function buildStoredZip(entries: { name: string; data: Buffer }[]): Buffer {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0
  function crc32(buf: Buffer): number { let c = ~0; for (let i=0;i<buf.length;i++){ c ^= buf[i]; for (let k=0;k<8;k++){ c = (c>>>1) ^ (0xedb88320 & -(c & 1)) } } return ~c>>>0 }
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8')
    const crc = crc32(data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0, 6); local.writeUInt16LE(0, 8); local.writeUInt16LE(0, 10); local.writeUInt16LE(0, 12)
    local.writeUInt32LE(crc>>>0, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBuf.length, 26); local.writeUInt16LE(0, 28)
    const localHeader = Buffer.concat([local, nameBuf])
    const localRecord = Buffer.concat([localHeader, data])
    localParts.push(localRecord)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0, 8); central.writeUInt16LE(0, 10); central.writeUInt16LE(0, 12)
    central.writeUInt32LE(crc>>>0, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(nameBuf.length, 28); central.writeUInt16LE(0, 30); central.writeUInt16LE(0, 32); central.writeUInt16LE(0, 34); central.writeUInt16LE(0, 36)
    central.writeUInt32LE(0, 38); central.writeUInt32LE(offset, 42)
    const centralHeader = Buffer.concat([central, nameBuf])
    centralParts.push(centralHeader)
    offset += localRecord.length
  }
  const centralDir = Buffer.concat(centralParts)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(0, 4); end.writeUInt16LE(0, 6); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralDir.length, 12); end.writeUInt32LE(offset, 16); end.writeUInt16LE(0, 20)
  return Buffer.concat([...localParts, centralDir, end])
}

export async function POST(_req: NextRequest) {
  const artifactsDir = path.join(process.cwd(), 'public', 'artifacts')
  const handoffDir = path.join(artifactsDir, 'handoff')
  fs.mkdirSync(handoffDir, { recursive: true })
  const gaDir = path.join(artifactsDir, 'ga')
  fs.mkdirSync(gaDir, { recursive: true })

  // Gather items
  const items: { name: string; data: Buffer }[] = []
  const readFileIf = (p: string, name: string) => { if (fs.existsSync(p)) items.push({ name, data: fs.readFileSync(p) }) }
  // GA-gate + preflight
  readFileIf(path.join(artifactsDir, 'ga-gate-report.html'), 'ga-gate-report.html')
  readFileIf(path.join(artifactsDir, 'ga-gate-summary.json'), 'ga-gate-summary.json')
  readFileIf(path.join(artifactsDir, 'preflight-report.html'), 'preflight-report.html')
  readFileIf(path.join(artifactsDir, 'preflight-summary.json'), 'preflight-summary.json')
  // Runbooks from docs
  const runbooks = [
    'docs/support-incidents.md', 'docs/warehouse.md', 'docs/bugs-sla.md', 'docs/voc.md', 'docs/integrations-zapier-make.md', 'docs/release.md',
  ]
  for (const r of runbooks) { const abs = path.join(process.cwd(), r); if (fs.existsSync(abs)) items.push({ name: r, data: fs.readFileSync(abs) }) }
  // OpenAPI specs
  items.push({ name: 'openapi/public_v1.json', data: Buffer.from(JSON.stringify(publicV1Spec, null, 2)) })
  items.push({ name: 'openapi/public_v2.json', data: Buffer.from(JSON.stringify(publicV2Spec, null, 2)) })
  // SDK snippets (from public SDK if present)
  const sdkJs = path.join(process.cwd(), 'public', 'sdk', 'trendzo.js'); if (fs.existsSync(sdkJs)) readFileIf(sdkJs, 'sdk/trendzo.js')
  // Pixel snippet
  const pixel = `<script>window.trendzoPixel=window.trendzoPixel||function(e){fetch('/api/pixel/collect',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(e||{})})}</script>`
  items.push({ name: 'snippets/pixel.html', data: Buffer.from(pixel) })
  // Security & compliance placeholders from artifacts if exist
  readFileIf(path.join(artifactsDir, 'dpia.json'), 'dpia.json')
  readFileIf(path.join(artifactsDir, 'ropa.json'), 'ropa.json')
  readFileIf(path.join(artifactsDir, 'security-scan-summary.json'), 'security-scan-summary.json')
  readFileIf(path.join(artifactsDir, 'backup-restore-transcript.txt'), 'backup-restore-transcript.txt')
  // Release notes
  readFileIf(path.join(gaDir, 'release.json'), 'release.json')

  // Role-based checklists (generate minimal PDFs as text for now)
  const roles = ['super_admin','admin','analyst','viewer']
  for (const role of roles) {
    const content = `Trendzo ${role} checklist\n- Access\n- Daily tasks\n- Runbooks\n`
    items.push({ name: `checklists/${role}.txt`, data: Buffer.from(content) })
  }

  const zip = buildStoredZip(items)
  const zipPath = path.join(handoffDir, 'trendzo-handoff.zip')
  fs.writeFileSync(zipPath, zip)
  return NextResponse.json({ ok: true, path: '/artifacts/handoff/trendzo-handoff.zip', bytes: zip.length })
}




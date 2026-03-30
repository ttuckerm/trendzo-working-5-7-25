import { promises as fs } from 'fs'
import path from 'path'
import type { Experiment, Report } from './types'

const ROOT = path.join(process.cwd(), 'fixtures', 'experiments')
const EXP_FILE = (id: string) => path.join(ROOT, `${id}.json`)
const LOG_FILE = (id: string) => path.join(ROOT, `${id}.ndjson`)

async function ensureDir(){ await fs.mkdir(ROOT, { recursive: true }) }

async function writeAtomic(file: string, data: unknown) {
  await ensureDir()
  const tmp = file + '.tmp'
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmp, file)
}

function uid(): string { return 'exp_' + Math.random().toString(36).slice(2,10) }

export async function createExperiment(input: Omit<Experiment,'id'|'createdAtISO'|'status'|'winnerVariantId'|'deployed'>): Promise<Experiment> {
  const id = uid()
  const exp: Experiment = {
    id,
    createdAtISO: new Date().toISOString(),
    status: 'running',
    winnerVariantId: null,
    deployed: false,
    ...input,
  }
  await writeAtomic(EXP_FILE(id), exp)
  return exp
}

export async function getExperiment(id: string): Promise<Experiment | null> {
  try { const raw = await fs.readFile(EXP_FILE(id), 'utf8'); return JSON.parse(raw) as Experiment } catch { return null }
}

export async function listExperiments(): Promise<Experiment[]> {
  try {
    await ensureDir()
    const files = await fs.readdir(ROOT)
    const ids = files.filter(f=>f.endsWith('.json'))
    const out: Experiment[] = []
    for (const f of ids) {
      try { out.push(JSON.parse(await fs.readFile(path.join(ROOT,f),'utf8'))) } catch {}
    }
    return out.sort((a,b)=> +new Date(b.createdAtISO) - +new Date(a.createdAtISO))
  } catch { return [] }
}

export async function appendReport(id: string, rep: Report): Promise<void> {
  await ensureDir()
  const line = JSON.stringify({ ...rep, atISO: rep.atISO || new Date().toISOString() }) + '\n'
  await fs.appendFile(LOG_FILE(id), line, 'utf8')
}

export async function readReports(id: string): Promise<Report[]> {
  try { const text = await fs.readFile(LOG_FILE(id),'utf8'); return text.split(/\r?\n/).filter(Boolean).map(l=>JSON.parse(l)) } catch { return [] }
}

export async function setStatus(id: string, status: Experiment['status']): Promise<void> {
  const exp = await getExperiment(id)
  if (!exp) return
  exp.status = status
  await writeAtomic(EXP_FILE(id), exp)
}

export async function setWinner(id: string, variantId: string): Promise<void> {
  const exp = await getExperiment(id)
  if (!exp) return
  exp.winnerVariantId = variantId
  exp.status = 'winner'
  await writeAtomic(EXP_FILE(id), exp)
}

export async function markDeployed(id: string): Promise<void> {
  const exp = await getExperiment(id)
  if (!exp) return
  exp.deployed = true
  await writeAtomic(EXP_FILE(id), exp)
}

// MOCK bootstrapping
export async function ensureDemoExperiment(): Promise<Experiment> {
  const list = await listExperiments()
  if (list.length > 0) return list[0]
  const exp = await createExperiment({ name:'Demo Bandit — Hooks', mode:'bandit', objective:'viral48h', autopilot:true, variants:[{ id:'A', name:'Hook A' },{ id:'B', name:'Hook B' },{ id:'C', name:'Hook C' }] })
  // seed a few reports
  for (let i=0;i<30;i++) {
    const vid = i%3===0?'A': i%3===1?'B':'C'
    const viral = Math.random() < (vid==='A'? 0.09 : vid==='B'? 0.12 : 0.18)
    await appendReport(exp.id, { experimentId: exp.id, variantId: vid, impressions: 1, viral })
  }
  return exp
}



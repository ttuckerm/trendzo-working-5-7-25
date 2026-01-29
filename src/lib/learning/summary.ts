import fs from 'fs'
import path from 'path'
import { readAllValidations } from '@/lib/validation/store'

function formatDay(iso: string): string {
  const d = new Date(iso)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth()+1).padStart(2,'0')
  const da = String(d.getUTCDate()).padStart(2,'0')
  return `${y}-${m}-${da}`
}

export function buildTrend(days = 30): Array<{ day:string; accuracy:number; validated:number }> {
  const vals = readAllValidations()
  const byDay = new Map<string, { correct:number; total:number }>()
  for (const v of vals) {
    const day = formatDay(v.maturedAtISO || v.madeAtISO)
    const e = byDay.get(day) || { correct:0, total:0 }
    e.total += 1
    e.correct += v.actualViral === v.predictedViral ? 1 : 0
    byDay.set(day, e)
  }
  const today = new Date()
  const out: Array<{ day:string; accuracy:number; validated:number }> = []
  for (let i=days-1;i>=0;i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()-i))
    const key = formatDay(d.toISOString())
    const e = byDay.get(key) || { correct:0, total:0 }
    out.push({ day: key, accuracy: e.total? e.correct/e.total: 0, validated: e.total })
  }
  return out
}

export function computeDriftIndex(): number {
  const vals = readAllValidations()
  if (vals.length < 20) return 0
  // Split last 14 days into two 7-day windows
  const recentCut = Date.now() - 7*24*3600*1000
  const priorCut = Date.now() - 14*24*3600*1000
  const last7 = vals.filter(v=> new Date(v.maturedAtISO||v.madeAtISO).getTime() >= recentCut)
  const prev7 = vals.filter(v=> {
    const t = new Date(v.maturedAtISO||v.madeAtISO).getTime()
    return t < recentCut && t >= priorCut
  })
  const bins = 10
  function bucketize(arr: typeof vals) {
    const b = Array.from({ length: bins },()=>0)
    const c = Array.from({ length: bins },()=>0)
    for (const v of arr) {
      const idx = Math.min(bins-1, Math.max(0, Math.floor(v.probability * bins)))
      b[idx] += 1
      c[idx] += 1
    }
    const total = c.reduce((a,n)=>a+n,0) || 1
    return b.map(x=> x/total)
  }
  const p = bucketize(prev7)
  const q = bucketize(last7)
  let psi = 0
  for (let i=0;i<bins;i++) {
    const pi = Math.max(1e-6, p[i])
    const qi = Math.max(1e-6, q[i])
    psi += (qi - pi) * Math.log(qi/pi)
  }
  // Normalize to 0..1 with soft cap
  const idx = Math.max(0, Math.min(1, psi))
  return idx
}

const SUM_FILE = path.join(process.cwd(), 'fixtures', 'learning', 'summary.json')

export function readCachedSummary(): any | null { try { return JSON.parse(fs.readFileSync(SUM_FILE,'utf8')) } catch { return null } }
export function writeCachedSummary(s: any): void {
  const dir = path.dirname(SUM_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const tmp = SUM_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2))
  fs.renameSync(tmp, SUM_FILE)
}











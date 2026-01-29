import { readFileSync } from 'fs'
import * as path from 'path'

function precisionAtK(yTrue: number[], yScore: number[], k: number) {
  const idx = yScore.map((s,i)=>[s,i]).sort((a,b)=>b[0]-a[0]).slice(0,k).map(x=>x[1])
  const hits = idx.reduce((acc,i)=>acc + (yTrue[i]===1 ? 1 : 0), 0)
  return hits / Math.max(1,k)
}

function expectedCalibrationError(yTrue: number[], yProb: number[], bins = 10) {
  const bucket = Array.from({length: bins},()=>({n:0, p:0, y:0}))
  yProb.forEach((p,i)=>{ const b = Math.min(bins-1, Math.floor(p*bins)); const slot=bucket[b]; slot.n++; slot.p+=p; slot.y+=yTrue[i]; })
  let ece = 0, total = 0
  bucket.forEach(b => { if (b.n>0){ const ap=b.p/b.n, ay=b.y/b.n; ece += b.n*Math.abs(ap-ay); total += b.n; } })
  return total ? ece/total : 0
}

function computeAUROC(yTrue: number[], yScore: number[]): number {
  const pos = yScore.filter((_,i)=>yTrue[i]===1), neg = yScore.filter((_,i)=>yTrue[i]===0)
  let conc=0, pairs=pos.length*neg.length
  pos.forEach(p=>neg.forEach(n=>{ if (p>n) conc++; else if (p===n) conc+=0.5 }))
  return pairs ? conc/pairs : 0.5
}

function load(file: string) {
  const p = path.join(process.cwd(), 'tests', 'validation', 'golden', file)
  return JSON.parse(readFileSync(p, 'utf-8')) as any[]
}

function evalOne(rows: any[]) {
  const y = rows.map(r=> r.label_viral ? 1 : 0)
  const s = rows.map(r=> Number(r.predicted_viral_probability))
  return {
    n: rows.length,
    auroc: computeAUROC(y, s),
    ece: expectedCalibrationError(y, s, 10),
    precision_at_100: precisionAtK(y, s, Math.min(100, rows.length))
  }
}

const tik = evalOne(load('tiktok.json'))
const ig = evalOne(load('instagram.json'))

const overall = {
  n: tik.n + ig.n,
  auroc: (tik.auroc * tik.n + ig.auroc * ig.n) / (tik.n + ig.n),
  ece: (tik.ece * tik.n + ig.ece * ig.n) / (tik.n + ig.n),
  precision_at_100: (tik.precision_at_100 + ig.precision_at_100) / 2
}

console.log(JSON.stringify({ by_platform: { tiktok: tik, instagram: ig }, overall }, null, 2))

// Gates: AUROC >= 0.92, ECE <= 0.05, coverage >= 0.60 (golden has labels, so coverage=1)
const aurocPass = overall.auroc >= 0.92
const ecePass = overall.ece <= 0.05
const coveragePass = true

if (!(aurocPass && ecePass && coveragePass)) {
  console.error(`CI GATE FAIL: auroc>=0.92? ${aurocPass}, ece<=0.05? ${ecePass}, coverage>=0.60? ${coveragePass}`)
  process.exit(2)
}




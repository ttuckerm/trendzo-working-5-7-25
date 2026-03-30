export type EditOp = { type: 'shorten'|'rephrase'|'reorder'|'insertCTA'|'numberize'|'questionize'; range?: [number, number]; payload?: any }

export function applyEdits(text: string, edits: EditOp[]): string {
  let t = text
  for (const e of edits) {
    if (e.type === 'shorten') t = opShorten(t, e)
    else if (e.type === 'rephrase') t = opRephrase(t, e)
    else if (e.type === 'reorder') t = opReorder(t, e)
    else if (e.type === 'insertCTA') t = opInsertCTA(t, e)
    else if (e.type === 'numberize') t = opNumberize(t, e)
    else if (e.type === 'questionize') t = opQuestionize(t, e)
  }
  return t
}

function sliceByRange(lines: string[], range?: [number, number]){
  const [lo, hi] = range || [0, lines.length]
  return { lo: Math.max(0, lo), hi: Math.min(lines.length, hi) }
}

function opShorten(text: string, e: EditOp): string {
  const lines = text.split('\n')
  const { lo, hi } = sliceByRange(lines, e.range)
  for (let i = lo; i < hi; i++) {
    lines[i] = lines[i]
      .replace(/\b(really|very|actually|just|basically|literally|kind of|sort of)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }
  return lines.join('\n')
}

function opRephrase(text: string, e: EditOp): string {
  const lines = text.split('\n')
  const { lo, hi } = sliceByRange(lines, e.range)
  for (let i = lo; i < hi; i++) {
    lines[i] = lines[i]
      .replace(/\b(i|we)\b/gi, 'you')
      .replace(/\b(can|could|might)\b/gi, 'will')
  }
  return lines.join('\n')
}

function opReorder(text: string, e: EditOp): string {
  const lines = text.split('\n')
  if (!e.payload || !Array.isArray(e.payload.order)) return text
  const order: number[] = e.payload.order as number[]
  const selected = order.map(i => lines[i]).filter(x => typeof x === 'string')
  return selected.concat(lines.filter((_, idx) => !order.includes(idx))).join('\n')
}

function opInsertCTA(text: string, e: EditOp): string {
  const cta = String(e.payload?.cta || 'Follow for more like this.')
  const lines = text.split('\n')
  const idx = Math.floor(lines.length * 0.8)
  lines.splice(idx, 0, cta)
  return lines.join('\n')
}

function opNumberize(text: string, e: EditOp): string {
  const lines = text.split('\n')
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    if (!/^\d+\./.test(lines[i]) && lines[i].trim()) lines[i] = `1. ${lines[i].trim()}`
  }
  return lines.join('\n')
}

function opQuestionize(text: string, e: EditOp): string {
  const lines = text.split('\n')
  if (lines[0] && !lines[0].trim().endsWith('?')) lines[0] = ensureQuestion(lines[0])
  return lines.join('\n')
}

function ensureQuestion(s: string){
  const trimmed = s.trim().replace(/[.!]+$/, '')
  if (/^(what|why|how|when|where|who|did|do|does|ever)/i.test(trimmed)) return trimmed + '?'
  return 'What if ' + trimmed.charAt(0).toLowerCase() + trimmed.slice(1) + '?'
}









































































































































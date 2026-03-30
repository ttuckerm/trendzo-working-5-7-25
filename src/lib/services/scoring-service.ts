// Viral score + prioritized fixes + apply-fixes

export interface AnalysisInput { beat_timeline: { element: string; text: string }[]; audio_id?: string; captions?: string }
export interface AnalysisOutput { viral_score: number; fixes: { title: string; rationale: string; operation: { type: string; target?: string; value?: any } }[] }

export function analyze(input: AnalysisInput): AnalysisOutput {
  const text = input.beat_timeline.map(b => b.text).join(' ')
  const hasCTA = input.beat_timeline.findIndex(b => b.element === 'CTA')
  const hookIdx = input.beat_timeline.findIndex(b => b.element === 'Hook')
  const questionMarks = (text.match(/\?/g)||[]).length
  const capsRatio = text ? (text.replace(/[^A-Z]/g,'').length / text.length) : 0
  let score = 70
  if (hookIdx === 0) score += 8
  if (hasCTA >= 0 && hasCTA <= 2) score += 6
  score += Math.min(6, questionMarks)
  score -= Math.max(0, Math.round((capsRatio-0.2)*20))
  score = Math.max(0, Math.min(100, score))
  const fixes = [
    { title: 'Move main hook earlier', rationale: 'Earlier hook improves retention', operation: { type: 'reorder', target: 'Hook', value: 0 } },
    { title: 'Add urgency words', rationale: 'Urgency boosts clicks', operation: { type: 'augment', target: 'CTA', value: ' [+ urgency]' } },
    { title: 'Add secondary CTA at 15s', rationale: 'More conversions', operation: { type: 'insert', target: 'CTA', value: 'Follow for more' } }
  ]
  return { viral_score: score, fixes }
}

export interface ApplyFixesInput { beat_timeline: { element: string; text: string }[]; fixes: AnalysisOutput['fixes'] }
export interface ApplyFixesOutput { beat_timeline: { element: string; text: string }[] }

export function applyFixes(input: ApplyFixesInput): ApplyFixesOutput {
  let out = input.beat_timeline.slice()
  for (const f of input.fixes) {
    if (f.operation.type === 'augment') {
      out = out.map(b => b.element === f.operation.target ? { ...b, text: `${b.text}${f.operation.value||''}` } : b)
    } else if (f.operation.type === 'reorder') {
      const idx = out.findIndex(b => b.element === (f.operation.target||''))
      if (idx >= 0) {
        const [item] = out.splice(idx, 1)
        out.splice(Number(f.operation.value||0), 0, item)
      }
    } else if (f.operation.type === 'insert') {
      const idx = out.findIndex(b => b.element === (f.operation.target||''))
      const newItem = { element: String(f.operation.target||'CTA'), text: String(f.operation.value||'Follow for more') }
      out.splice(idx >= 0 ? idx+1 : out.length, 0, newItem)
    }
  }
  return { beat_timeline: out }
}



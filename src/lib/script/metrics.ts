import fs from 'fs'
import path from 'path'

export function computeScriptMetrics(): { byPattern: { patternId: string; sr: number; uses: number; lift: number }[]; overall: { sr: number; uses: number } } {
  // In MOCK, read fixtures/scripts/metrics.json if present. Otherwise synthesize from validations/recipe-book.
  const file = path.join(process.cwd(), 'fixtures', 'scripts', 'metrics.json')
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
    return raw
  } catch {
    // Synthesize a stable mock with ≥5 patterns
    const patterns = ['list_of_n','question_reveal','before_after','myth_truth','pov','problem_demo','tutorial_3_steps']
    const by = patterns.map((id, i) => ({ patternId: id, sr: 0.12 + i*0.03, uses: 20 + i*7, lift: 0.9 + i*0.05 }))
    const totalUses = by.reduce((a,b)=>a+b.uses,0)
    const totalWins = by.reduce((a,b)=>a+Math.round(b.uses*b.sr),0)
    return { byPattern: by.slice(0, Math.max(5, by.length)), overall: { sr: totalWins/Math.max(1,totalUses), uses: totalUses } }
  }
}









































































































































export type TemplateInput = {
  id: string
  name?: string
  title?: string
  niche?: string
  goal?: string
  successScore?: number
  delta7d?: number
}

function scoreOf(t: any): number {
  const s = Number(t.successScore ?? t.success_rate ?? 0)
  return isNaN(s) ? 0 : s
}

function deltaOf(t: any): number {
  const d = Number(t.delta7d ?? t.delta ?? 0)
  return isNaN(d) ? 0 : d
}

export function selectStarterTemplates(templates: TemplateInput[], niche?: string, goal?: string): string[] {
  const list = Array.isArray(templates) ? templates.slice() : []
  const norm = (s?: string) => (s || '').trim().toLowerCase()
  const n = norm(niche)
  const g = norm(goal)

  const byBoth = list.filter(t => (norm((t as any).niche) === n) && (norm((t as any).goal) === g))
  const byEither = list.filter(t => (norm((t as any).niche) === n) || (norm((t as any).goal) === g))
  const pickFrom = (arr: TemplateInput[]) => arr
    .slice()
    .sort((a,b) => (scoreOf(b) - scoreOf(a)) || (deltaOf(b) - deltaOf(a)))
    .map(t => String((t as any).id))

  let ids: string[] = []
  if (n || g) {
    ids = pickFrom(byBoth)
    if (ids.length < 3) {
      const more = pickFrom(byEither).filter(id => !ids.includes(id))
      ids = ids.concat(more)
    }
  }
  if (ids.length < 3) {
    const global = pickFrom(list).filter(id => !ids.includes(id))
    ids = ids.concat(global)
  }
  return ids.slice(0, 3)
}




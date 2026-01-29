import fs from 'fs'
import path from 'path'
import { SCRIPT_PATTERNS, PatternSpec } from '../../lib/script/patterns'

export type CanonicalElement =
  | 'Hook'
  | 'Problem'
  | 'Solution'
  | 'Steps'
  | 'Proof'
  | 'Benefit'
  | 'Before'
  | 'After'
  | 'Myth'
  | 'Truth'
  | 'Authority'
  | 'SocialProof'
  | 'Urgency'
  | 'Numbers/List'
  | 'FrameworkTeaser'
  | 'Reveal'
  | 'Audience'
  | 'CTA'
  | 'Story'

export interface PatternSequenceSummary {
  id: string
  name: string
  elements: CanonicalElement[]
  tokens: string[]
}

export interface AggregatedScriptAnalysis {
  supersetElements: CanonicalElement[]
  elementsMeta: Record<string, { aliases: string[]; count: number }>
  patterns: PatternSequenceSummary[]
  stats: {
    elementCounts: Record<string, number>
    bigramCounts: Array<{ pair: [CanonicalElement, CanonicalElement]; count: number }>
    commonSequences: CanonicalElement[][]
    typicalFlow: CanonicalElement[]
  }
  genesIncluded: Array<{ label: string; mappedElement: CanonicalElement }>
  beatsPreset?: CanonicalElement[]
  version: string
  generatedAt: string
}

const TOKEN_MAP: Record<string, CanonicalElement> = {
  cta: 'CTA',
  ctaaction: 'CTA',
  proof: 'Proof',
  benefit: 'Benefit',
  benefit1: 'Benefit',
  benefit2: 'Benefit',
  benefit3: 'Benefit',
  pain: 'Problem',
  step: 'Steps',
  step1: 'Steps',
  step2: 'Steps',
  step3: 'Steps',
  step4: 'Steps',
  before: 'Before',
  after: 'After',
  myth: 'Myth',
  truth: 'Truth',
  framework: 'FrameworkTeaser',
  role: 'Authority',
  n: 'Numbers/List',
  noun: 'Numbers/List',
  pluralnoun: 'Numbers/List',
  quote: 'SocialProof',
  audience: 'Audience',
  topic: 'Reveal',
  reason: 'Reveal',
  reveal: 'Reveal',
}

const GENE_TO_ELEMENT: Array<{ match: RegExp; el: CanonicalElement }> = [
  { match: /CallToAction/i, el: 'CTA' },
  { match: /Authority/i, el: 'Authority' },
  { match: /QuestionHook|POV/i, el: 'Hook' },
  { match: /NumbersHook/i, el: 'Numbers/List' },
  { match: /UrgencyHook/i, el: 'Urgency' },
  { match: /PersonalStory|Story/i, el: 'Story' },
  { match: /TransformationBeforeAfter/i, el: 'Before' },
  { match: /EducationalContent|Tutorial/i, el: 'Steps' },
  { match: /Social Proof|Testimonial/i, el: 'SocialProof' },
]

function extractTokensFromTemplate(template: string): string[] {
  const tokens: string[] = []
  const re = /\{([^}]+)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(template))) {
    tokens.push(m[1].trim())
  }
  return tokens
}

function mapTokenToElement(token: string): CanonicalElement | null {
  const k = token.toLowerCase().replace(/\s+/g, '')
  if (TOKEN_MAP[k]) return TOKEN_MAP[k]

  // Heuristics
  if (/^step\d+$/i.test(k)) return 'Steps'
  if (k.includes('benefit')) return 'Benefit'
  if (k.includes('cta')) return 'CTA'
  return null
}

function uniquePreservingOrder<T>(list: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of list) {
    const key = JSON.stringify(item)
    if (!seen.has(key)) {
      seen.add(key)
      out.push(item)
    }
  }
  return out
}

function summarizePattern(p: PatternSpec): PatternSequenceSummary {
  const hookTokens = (p.hookTemplates || []).flatMap(extractTokensFromTemplate)
  const bodyTokens = (p.bodyTemplates || []).flatMap(extractTokensFromTemplate)

  const hookElements = uniquePreservingOrder([
    'Hook' as CanonicalElement,
    ...hookTokens.map(mapTokenToElement).filter((x): x is CanonicalElement => !!x),
  ])

  const bodyElements = uniquePreservingOrder(
    bodyTokens.map(mapTokenToElement).filter((x): x is CanonicalElement => !!x)
  )

  // Sequence is Hook + inferred body elements
  const elements = uniquePreservingOrder<CanonicalElement>([...hookElements, ...bodyElements])

  return {
    id: p.id,
    name: p.name,
    elements,
    tokens: uniquePreservingOrder([...hookTokens, ...bodyTokens]),
  }
}

function computeBigrams(seqs: CanonicalElement[][]): Map<string, number> {
  const m = new Map<string, number>()
  for (const seq of seqs) {
    for (let i = 0; i < seq.length - 1; i++) {
      const a = seq[i]
      const b = seq[i + 1]
      const key = `${a}>>>${b}`
      m.set(key, (m.get(key) || 0) + 1)
    }
  }
  return m
}

function chooseTypicalFlow(
  bigrams: Map<string, number>,
  elementsSet: Set<CanonicalElement>
): CanonicalElement[] {
  const nextOf = new Map<CanonicalElement, Array<{ el: CanonicalElement; c: number }>>()
  for (const [key, count] of bigrams.entries()) {
    const [from, to] = key.split('>>>') as [CanonicalElement, CanonicalElement]
    if (!nextOf.has(from)) nextOf.set(from, [])
    nextOf.get(from)!.push({ el: to, c: count })
  }
  for (const arr of nextOf.values()) arr.sort((a, b) => b.c - a.c)

  const flow: CanonicalElement[] = ['Hook']
  const maxLen = 8
  const used = new Set<CanonicalElement>(flow)
  while (flow.length < maxLen) {
    const last = flow[flow.length - 1]
    const options = nextOf.get(last) || []
    const next = options.find((o) => !used.has(o.el)) || options[0]
    if (!next) break
    flow.push(next.el)
    used.add(next.el)
    // Prefer to end on CTA if present later and we already have 3+ items
    if (flow.length >= 4 && flow.includes('CTA')) break
  }
  // Ensure CTA presence if widely used
  if (!flow.includes('CTA') && elementsSet.has('CTA')) flow.push('CTA')
  return uniquePreservingOrder(flow)
}

function loadFrameworkGenes(): Array<{ name: string }> {
  try {
    const genesPath = path.join(process.cwd(), 'framework_genes.json')
    if (!fs.existsSync(genesPath)) return []
    const raw = fs.readFileSync(genesPath, 'utf-8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    if (parsed && Array.isArray(parsed.genes)) return parsed.genes
  } catch {}
  return []
}

function beatsPresetFromProject(): CanonicalElement[] | undefined {
  try {
    const p = path.join(process.cwd(), 'src', 'app', 'sandbox', 'workflow', '_fixtures', 'script-presets.json')
    if (!fs.existsSync(p)) return undefined
    const raw = JSON.parse(fs.readFileSync(p, 'utf-8'))
    const beats: string[] = Array.isArray(raw?.beats) ? raw.beats : []
    const canon = beats
      .map((b) => String(b))
      .map((b) => (b.toLowerCase() === 'cta' ? 'CTA' : (b.charAt(0).toUpperCase() + b.slice(1)) as CanonicalElement))
      .filter(Boolean) as CanonicalElement[]
    return canon
  } catch {
    return undefined
  }
}

export function aggregateScriptElements(): AggregatedScriptAnalysis {
  const patterns = SCRIPT_PATTERNS.map(summarizePattern)

  const elementCounts = new Map<string, number>()
  const allElements: CanonicalElement[] = []
  for (const p of patterns) {
    for (const e of p.elements) {
      allElements.push(e)
      elementCounts.set(e, (elementCounts.get(e) || 0) + 1)
    }
  }

  const superset = Array.from(new Set(allElements)) as CanonicalElement[]
  const bigrams = computeBigrams(patterns.map((p) => p.elements))
  const elementsSet = new Set<CanonicalElement>(superset)
  const typicalFlow = chooseTypicalFlow(bigrams, elementsSet)

  // elements meta
  const elementsMeta: Record<string, { aliases: string[]; count: number }> = {}
  for (const e of superset) {
    elementsMeta[e] = {
      aliases: Object.entries(TOKEN_MAP)
        .filter(([, v]) => v === e)
        .map(([k]) => k),
      count: elementCounts.get(e) || 0,
    }
  }

  // gene mapping
  const genes = loadFrameworkGenes()
  const geneMappings: Array<{ label: string; mappedElement: CanonicalElement }> = []
  for (const g of genes) {
    const match = GENE_TO_ELEMENT.find((x) => x.match.test(g.name))
    if (match) geneMappings.push({ label: g.name, mappedElement: match.el })
  }

  // common sequences: top 5 bigrams as 2-length sequences
  const commonBigrams = Array.from(bigrams.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k.split('>>>') as [CanonicalElement, CanonicalElement])

  const beats = beatsPresetFromProject()

  return {
    supersetElements: superset,
    elementsMeta,
    patterns,
    stats: {
      elementCounts: Object.fromEntries(elementCounts.entries()),
      bigramCounts: Array.from(bigrams.entries()).map(([k, v]) => ({ pair: k.split('>>>') as [CanonicalElement, CanonicalElement], count: v })),
      commonSequences: commonBigrams,
      typicalFlow,
    },
    genesIncluded: geneMappings,
    beatsPreset: beats,
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
  }
}

export default aggregateScriptElements



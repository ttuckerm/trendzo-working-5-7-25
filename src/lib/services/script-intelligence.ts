// Deterministic script intelligence stubs for v1
// Maps transcripts/metadata to canonical elements + hook ideas

export type CanonicalElement =
  | 'Hook' | 'Problem' | 'Reveal'
  | 'Authority' | 'Benefit' | 'Steps'
  | 'Before' | 'After' | 'Proof' | 'CTA'
  | 'Numbers/List' | 'Myth' | 'Truth'
  | 'SocialProof' | 'Audience' | 'FrameworkTeaser'
  | 'Story' | 'Urgency'

export interface HookGenInput { template_id?: string; niche?: string; goal?: string; context?: any }
export interface HookGenOutput { hooks: string[]; retention_estimates: number[] }

export function generateHooks(input: HookGenInput): HookGenOutput {
  const seed = ((input?.niche||'') + (input?.goal||'')).length % 7
  const base = [
    'Stop scrolling — here’s how to 2x in 7 days',
    'You’re missing this 1 change (it’s easy)',
    'If you post, do this first',
    'I tried this for 7 days—here’s what happened',
    'Most creators get this wrong—fix it today',
    'This framework changed everything for me',
    'POV: You unlock the simplest growth lever'
  ]
  const hooks = [base[seed%base.length], base[(seed+2)%base.length], base[(seed+4)%base.length]]
  const retention = hooks.map((_, i) => 0.82 + 0.03 * ((seed+i)%3))
  return { hooks, retention_estimates: retention }
}

export interface FillBeatsInput { selected_hook: string; element: CanonicalElement; content: string; current?: { [k: string]: string } }
export interface FillBeatsOutput { beat_timeline: { element: CanonicalElement; text: string }[]; preview: { text: string } }

export function fillBeats(input: FillBeatsInput): FillBeatsOutput {
  const current: Record<string,string> = { ...(input.current||{}) }
  current[input.element] = input.content
  if (!current['Hook']) current['Hook'] = input.selected_hook
  const order: CanonicalElement[] = ['Hook','Problem','Benefit','Steps','Proof','CTA']
  const timeline = order
    .filter(e => current[e])
    .map(e => ({ element: e, text: current[e] }))
  const preview = { text: timeline.map(x => `${x.element}: ${x.text}`).join('\n') }
  return { beat_timeline: timeline, preview }
}



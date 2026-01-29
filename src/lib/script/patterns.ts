export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'linkedin'

export interface PatternSpec {
  id: string
  name: string
  description: string
  hookTemplates: string[]
  bodyTemplates: string[]
  signals: { keywords?: string[]; regex?: string[] }
  platformFits: Record<Platform, { durationRange: [number, number]; hookMaxSec: number }>
}

const fit = (min: number, max: number, hook: number) => ({ durationRange: [min, max] as [number, number], hookMaxSec: hook })

export const SCRIPT_PATTERNS: PatternSpec[] = [
  {
    id: 'pov',
    name: 'POV',
    description: 'First-person hook that frames a relatable perspective or pain point.',
    hookTemplates: [
      'POV: {pain} you didn\'t know about…',
      'POV: You\'re {undesiredState} because {reason}',
      'POV: {role} finally reveals {benefit}'
    ],
    bodyTemplates: [
      'Here\'s what happens when {step1}, then {step2}, and finally {step3}.',
      'I used to be {before}, then I did {step1} → {step2}, now I\'m {after}.',
      '{proof}. The key is {benefit}. {cta}'
    ],
    signals: { keywords: ['pov', 'i', 'me', 'my'], regex: ['^pov[:\s]'] },
    platformFits: {
      tiktok: fit(10, 45, 3), instagram: fit(10, 45, 3), youtube: fit(30, 120, 5), linkedin: fit(20, 90, 5)
    }
  },
  {
    id: 'question_reveal',
    name: 'Question → Reveal',
    description: 'Open with a question, then quickly reveal an unexpected answer.',
    hookTemplates: [
      'What if {counterfactual}?',
      'Do you know why {pain} happens?',
      'Ever wondered {mystery}?'
    ],
    bodyTemplates: [
      'Short answer: {reveal}. Longer: {step1}, {step2}, {step3}.',
      'Because {reason}. Here\'s how to fix it: {step1} → {step2}. {cta}'
    ],
    signals: { keywords: ['why', 'how', 'what if', 'ever wondered'], regex: ['\\/?\s*$'] },
    platformFits: { tiktok: fit(10, 45, 3), instagram: fit(10, 45, 3), youtube: fit(30, 180, 7), linkedin: fit(20, 120, 6) }
  },
  {
    id: 'problem_demo',
    name: 'Problem → Demo',
    description: 'State a problem, then demonstrate a concise solution.',
    hookTemplates: ['{pain}? Watch this.', 'Stop {pain} in {N} seconds', '{pain} → do this'],
    bodyTemplates: [
      'Problem: {pain}. Demo: {step1} then {step2}. Result: {benefit}.',
      '{proof}. Follow with {cta}'
    ],
    signals: { keywords: ['problem', 'fix', 'do this', 'watch this'] },
    platformFits: { tiktok: fit(10, 45, 2), instagram: fit(10, 45, 2), youtube: fit(30, 180, 5), linkedin: fit(20, 120, 5) }
  },
  {
    id: 'counterintuitive_tip',
    name: 'Counterintuitive Tip',
    description: 'Offer a surprising tactic that defies expectations.',
    hookTemplates: ['Don\'t {commonAdvice} — do this instead', 'The weird trick that {benefit}', 'Everyone says {myth}; here\'s the truth'],
    bodyTemplates: ['Why it works: {proof}. Steps: {step1}, {step2}. {cta}'],
    signals: { keywords: ['instead', 'weird', 'nobody tells you', 'counterintuitive'] },
    platformFits: { tiktok: fit(10, 45, 3), instagram: fit(10, 45, 3), youtube: fit(60, 240, 7), linkedin: fit(30, 180, 6) }
  },
  {
    id: 'list_of_n',
    name: 'List of N',
    description: 'Numbered list of quick, punchy items.',
    hookTemplates: ['{N} {noun} you\'re doing wrong', '{N} ways to {benefit}', 'Top {N} {pluralNoun} for {niche}'],
    bodyTemplates: ['{step1}; {step2}; {step3}; {step4}; {cta}'],
    signals: { regex: ['\\b\n?\n?\n?\n?\n?'], keywords: ['top', 'ways', 'mistakes', 'reasons', 'tips'] },
    platformFits: { tiktok: fit(10, 45, 2), instagram: fit(10, 45, 2), youtube: fit(60, 240, 6), linkedin: fit(30, 180, 5) }
  },
  {
    id: 'before_after',
    name: 'Before → After',
    description: 'Contrast state transformation to communicate benefit.',
    hookTemplates: ['Before: {before}. After: {after}.', 'I used to be {before} — now {after}', '{before} → {after} in {N} days'],
    bodyTemplates: ['Here\'s how: {step1} → {step2} → {step3}. {proof}. {cta}'],
    signals: { keywords: ['before', 'after', 'then', 'now'], regex: ['before\s*:?\s*.*after'] },
    platformFits: { tiktok: fit(10, 45, 3), instagram: fit(10, 45, 3), youtube: fit(60, 240, 7), linkedin: fit(30, 180, 6) }
  },
  {
    id: 'myth_truth',
    name: 'Myth → Truth',
    description: 'Debunk a popular misconception and replace it with a fact.',
    hookTemplates: ['Myth: {myth}. Truth: {truth}', 'Stop believing {myth}', '{myth}? Not quite.'],
    bodyTemplates: ['Why this matters: {benefit}. Evidence: {proof}. {cta}'],
    signals: { keywords: ['myth', 'truth', 'actually', 'fact'] },
    platformFits: { tiktok: fit(10, 45, 3), instagram: fit(10, 45, 3), youtube: fit(60, 240, 6), linkedin: fit(30, 180, 6) }
  },
  {
    id: 'tutorial_3_steps',
    name: 'Tutorial in 3 Steps',
    description: 'Straightforward how-to guide in three steps.',
    hookTemplates: ['How to {benefit} in 3 steps', '3 steps to {benefit}', 'Do this to {benefit}'],
    bodyTemplates: ['Step 1: {step1}\nStep 2: {step2}\nStep 3: {step3}\n{cta}'],
    signals: { keywords: ['how to', 'step', 'tutorial'], regex: ['step\s*1'] },
    platformFits: { tiktok: fit(10, 45, 2), instagram: fit(10, 45, 2), youtube: fit(60, 300, 6), linkedin: fit(30, 180, 5) }
  },
  {
    id: 'storytime_hook',
    name: 'Storytime Hook',
    description: 'Narrative opening that teases a payoff.',
    hookTemplates: ['This almost ruined {something}…', 'I wasn\'t going to share this…', 'It started when {setup}'],
    bodyTemplates: ['Then {step1}. After that {step2}. Finally {step3}. Here\'s the lesson: {benefit}. {cta}'],
    signals: { keywords: ['story', 'once', 'it started', 'i was'], regex: ['^this\s'] },
    platformFits: { tiktok: fit(10, 60, 4), instagram: fit(10, 60, 4), youtube: fit(120, 480, 8), linkedin: fit(45, 240, 7) }
  },
  {
    id: 'authority_claim_proof',
    name: 'Authority Claim + Proof',
    description: 'Establish credibility quickly, then demonstrate results.',
    hookTemplates: ['I\'ve helped {N} people {benefit}', '{role} explains {topic}', 'After {N} years, here\'s what works'],
    bodyTemplates: ['Proof: {proof}. The method: {step1}, {step2}. {cta}'],
    signals: { keywords: ['i\'ve', 'helped', 'years', 'clients', 'proof'] },
    platformFits: { tiktok: fit(10, 45, 3), instagram: fit(10, 45, 3), youtube: fit(60, 240, 6), linkedin: fit(30, 180, 6) }
  },
  {
    id: 'social_proof_first',
    name: 'Social Proof First',
    description: 'Lead with testimonial or metric before explaining.',
    hookTemplates: ['{N} people did this and {result}', 'This got {N} saves last week', '“{quote}”'],
    bodyTemplates: ['Why it works: {proof}. Try this: {step1} → {step2}. {cta}'],
    signals: { keywords: ['reviews', 'saved', 'likes', 'testimonial', 'case study'] },
    platformFits: { tiktok: fit(10, 45, 2), instagram: fit(10, 45, 2), youtube: fit(60, 240, 5), linkedin: fit(30, 180, 5) }
  },
  {
    id: 'urgency_scarcity',
    name: 'Urgency / Scarcity',
    description: 'Time- or quantity-limited offer or information.',
    hookTemplates: ['Only {N} hours left to {benefit}', 'This ends tonight', 'Before this disappears…'],
    bodyTemplates: ['What to do: {step1} now, then {step2}. {cta}'],
    signals: { keywords: ['today', 'now', 'last chance', 'ends', 'only'] },
    platformFits: { tiktok: fit(10, 30, 2), instagram: fit(10, 30, 2), youtube: fit(30, 120, 5), linkedin: fit(20, 90, 5) }
  },
  {
    id: 'mistake_fix',
    name: 'Mistake → Fix',
    description: 'Call out a common mistake, then show the fix.',
    hookTemplates: ['You\'re doing {noun} wrong', 'Stop making this {noun} mistake', 'If you\'re {audience}, avoid this'],
    bodyTemplates: ['Mistake: {before}. Fix: {after}. Steps: {step1} → {step2}. {cta}'],
    signals: { keywords: ['mistake', 'wrong', 'fix', 'stop'] },
    platformFits: { tiktok: fit(10, 45, 2), instagram: fit(10, 45, 2), youtube: fit(60, 240, 5), linkedin: fit(30, 180, 5) }
  },
  {
    id: 'framework_teaser',
    name: 'Framework Teaser',
    description: 'Tease a named framework and its core ideas.',
    hookTemplates: ['My {framework} for {benefit}', '{framework}: do {N} things', 'Steal my {framework}'],
    bodyTemplates: ['Pillars: {step1}, {step2}, {step3}. Proof: {proof}. {cta}'],
    signals: { keywords: ['framework', 'system', 'method', 'pillars'] },
    platformFits: { tiktok: fit(10, 45, 3), instagram: fit(10, 45, 3), youtube: fit(60, 300, 7), linkedin: fit(30, 240, 6) }
  },
  {
    id: 'cta_forward',
    name: 'CTA Forward',
    description: 'Place the call-to-action early and weave it naturally.',
    hookTemplates: ['Before we start, {cta}', 'Do {ctaAction} so you don\'t miss {benefit}', 'Quick: {cta}'],
    bodyTemplates: ['Then value: {step1}, {step2}. Reminder: {cta}'],
    signals: { keywords: ['follow', 'subscribe', 'save', 'share'], regex: ['^follow|^subscribe'] },
    platformFits: { tiktok: fit(10, 45, 2), instagram: fit(10, 45, 2), youtube: fit(30, 180, 5), linkedin: fit(20, 120, 5) }
  },
  {
    id: 'benefit_stack',
    name: 'Benefit Stack',
    description: 'Stack multiple benefits in rapid succession before details.',
    hookTemplates: ['Get {benefit1}, {benefit2}, and {benefit3} — here\'s how', '{benefit1} + {benefit2} in one move'],
    bodyTemplates: ['Why this combo: {proof}. Do: {step1} → {step2}. {cta}'],
    signals: { keywords: ['and', 'plus', 'stack', 'bundle'] },
    platformFits: { tiktok: fit(10, 45, 3), instagram: fit(10, 45, 3), youtube: fit(60, 240, 6), linkedin: fit(30, 180, 6) }
  }
]

export function listPatterns(): PatternSpec[] {
  return SCRIPT_PATTERNS
}









































































































































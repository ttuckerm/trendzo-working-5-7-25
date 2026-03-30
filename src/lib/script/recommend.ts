import { ScriptFeatures } from './features'

export function scriptRecommendations(features: ScriptFeatures, platform: string){
  const recs: { title: string; why: string; change: string; example?: string }[] = []

  if (features.questions === 0) {
    recs.push({
      title: 'Turn first sentence into a question',
      why: 'Questions increase curiosity and retention in the first 3 seconds.',
      change: 'Apply questionize to the first line',
      example: 'What if you could double results in 7 days?'
    })
  }
  if (features.numbers === 0) {
    recs.push({
      title: 'Add a number in the hook (List-of-N)',
      why: 'Numbers promise specificity and outperform vague claims.',
      change: 'Include a concrete count (e.g., 3, 5, 7) in the opening',
      example: '5 mistakes killing your conversions'
    })
  }
  if (!features.ctaDetected) {
    recs.push({
      title: 'Insert CTA at 80% mark',
      why: 'Late CTAs convert better without disrupting early retention.',
      change: 'Add a single-line CTA near the end',
      example: 'Follow for proven systems that work.'
    })
  }
  if (features.avgWordsPerSentence > 20) {
    recs.push({
      title: 'Compress sentences to ≤ 20 words',
      why: 'Shorter sentences improve clarity and retention.',
      change: 'Use shorten to remove filler and split long sentences'
    })
  }
  if (features.imperativeVerbs.length === 0) {
    recs.push({
      title: 'Lead with an action verb',
      why: 'Imperatives create momentum and increase comments.',
      change: 'Start hook with Stop/Do/Try/Use'
    })
  }
  if (!features.beforeAfterDetected && /\b(before|after)\b/i.test(platform) === false) {
    recs.push({
      title: 'Move benefit to the first 5 words',
      why: 'Front-loaded value increases watch time.',
      change: 'Place the core outcome before details'
    })
  }

  return recs.slice(0, 7)
}









































































































































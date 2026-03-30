export function getIntelligenceEngine(): 'llm'|'legacy' {
  const v = (process.env.INTELLIGENCE_ENGINE ?? 'llm').toLowerCase()
  return v === 'legacy' ? 'legacy' : 'llm'
}



#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

async function main() {
  const out = process.argv[2] || 'artifacts/script-elements.json'
  const projectRoot = process.cwd()
  const aggPath = path.join(projectRoot, 'dist', 'lib', 'services', 'scriptElementsAggregator.js')

  let aggregate
  try {
    // Prefer compiled output if available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    aggregate = require(aggPath)
      .aggregateScriptElements
  } catch {
    // Fallback to ts-node dynamic transpile if running in dev without build
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('ts-node/register/transpile-only')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    aggregate = require(path.join(projectRoot, 'src', 'lib', 'services', 'scriptElementsAggregator.ts'))
      .aggregateScriptElements
  }

  const data = aggregate()
  const outPath = path.isAbsolute(out) ? out : path.join(projectRoot, out)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2))
  console.log(`✅ Wrote script elements analysis to ${outPath}`)
}

main().catch((e) => {
  console.error('Failed to export script elements:', e)
  process.exit(1)
})



const fs = require('fs')
const path = require('path')

function main() {
  const outDir = path.join(process.cwd(), 'artifacts', 'test')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  // naive: mark e2e passed if playwright exit was success (invoke this only on success)
  fs.writeFileSync(path.join(outDir, 'e2e.json'), JSON.stringify({ passed: true }))
}

main()



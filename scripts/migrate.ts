import { initVitTable, pg } from '@/lib/db/pg'

async function main() {
  await initVitTable()
  console.log('Migration complete')
  await pg.end()
}

main().catch((err) => { console.error(err); process.exit(1) })



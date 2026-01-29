import { pg } from '@/lib/db/pg'

async function main() {
  // Move processed_at back 24h for existing rows, then re-touch to now to simulate 24h processing
  await pg.query(`UPDATE vit SET processed_at = NOW() - INTERVAL '23 hours' WHERE processed_at < NOW()`)
  console.log('Shifted processed_at by ~24h for simulation')
  await pg.end()
}

main().catch((err) => { console.error(err); process.exit(1) })



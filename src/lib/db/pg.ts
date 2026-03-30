import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL || 'postgres://trendzo:trendzo@127.0.0.1:5432/trendzo'
const needsSsl = /sslmode=require/i.test(databaseUrl) || process.env.PGSSL === '1' || !!process.env.NEXT_PUBLIC_SUPABASE_URL

export const pg = new Pool({
  connectionString: databaseUrl,
  max: 10,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
})

export async function initVitTable() {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS vit (
      platform TEXT NOT NULL,
      video_id TEXT NOT NULL,
      vit JSONB NOT NULL,
      scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (platform, video_id)
    );
  `)
}

export async function upsertVit(platform: string, videoId: string, vit: any) {
  await pg.query(
    `INSERT INTO vit (platform, video_id, vit, scraped_at, processed_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (platform, video_id)
     DO UPDATE SET vit = EXCLUDED.vit, processed_at = NOW()`,
    [platform, videoId, vit]
  )
}

export async function countProcessedLast24h(): Promise<number> {
  const res = await pg.query(`SELECT COUNT(*)::int AS c FROM vit WHERE processed_at >= NOW() - INTERVAL '24 hours'`)
  return res.rows[0]?.c || 0
}



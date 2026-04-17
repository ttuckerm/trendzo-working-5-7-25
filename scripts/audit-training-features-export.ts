/**
 * STEP 1 audit: training_features schema + join coverage vs scraped_videos.
 * Requires .env.local with SUPABASE_DB_PASSWORD and NEXT_PUBLIC_SUPABASE_URL.
 *
 * Run: npx tsx scripts/audit-training-features-export.ts
 */
import { Client } from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
const pwMatch = env.match(/^SUPABASE_DB_PASSWORD=(.+)$/m);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!pwMatch || !url) {
  console.error('Missing SUPABASE_DB_PASSWORD in .env.local or NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}
const pw = pwMatch[1].trim();
const ref = url.replace('https://', '').split('.')[0];
const pg = new Client({
  connectionString: `postgresql://postgres:${encodeURIComponent(pw)}@db.${ref}.supabase.co:5432/postgres`,
});

(async () => {
  await pg.connect();

  const { rows: cols } = await pg.query(
    `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'training_features'
       ORDER BY ordinal_position`,
  );

  console.log('\n=== training_features columns ===\n');
  for (const r of cols) {
    console.log(`${r.column_name}\t${r.data_type}\tnullable=${r.is_nullable}`);
  }
  console.log(`\nTotal columns: ${cols.length}\n`);

  const q = async (label: string, sql: string) => {
    const { rows } = await pg.query(sql);
    console.log(`${label}: ${rows[0]?.c ?? rows[0]}`);
  };

  await q('COUNT(*) training_features', `SELECT COUNT(*)::int AS c FROM training_features`);
  await q(
    'tf JOIN sv (any match on video_id)',
    `SELECT COUNT(*)::int AS c FROM training_features tf
     INNER JOIN scraped_videos sv ON tf.video_id = sv.video_id`,
  );
  await q(
    'tf JOIN sv WHERE sv.training_eligible = true',
    `SELECT COUNT(*)::int AS c FROM training_features tf
     INNER JOIN scraped_videos sv ON tf.video_id = sv.video_id
     WHERE sv.training_eligible = true`,
  );

  const hasTfEligible = cols.some((c: { column_name: string }) => c.column_name === 'training_eligible');
  if (hasTfEligible) {
    await q(
      'training_features.training_eligible = true (informational; export uses scraped_videos.training_eligible)',
      `SELECT COUNT(*)::int AS c FROM training_features WHERE training_eligible = true`,
    );
    await q(
      'training_features.training_eligible = false',
      `SELECT COUNT(*)::int AS c FROM training_features WHERE training_eligible = false`,
    );
  } else {
    console.log('(No training_features.training_eligible column)');
  }

  await pg.end();
  console.log('\nDone.\n');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

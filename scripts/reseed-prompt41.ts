import { Client } from 'pg'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'
config({ path: resolve(process.cwd(), '.env.local') })

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const pw = env.match(/^SUPABASE_DB_PASSWORD=(.+)$/m)![1].trim()
const ref = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('https://', '').split('.')[0]
const pg = new Client({ connectionString: `postgresql://postgres:${encodeURIComponent(pw)}@db.${ref}.supabase.co:5432/postgres` })

;(async () => {
  await pg.connect()
  await pg.query(`
    INSERT INTO candidate_features (feature_name, description, extraction_logic, status)
    VALUES
      ('hook_word_count', 'Number of words in the first 1.5 seconds of transcript. Hypothesis: tighter hooks correlate with higher VPS in short-form.', 'transcript.slice(0, 1500ms).split(/\\s+/).length', 'untested'),
      ('on_screen_text_density', 'Count of distinct on-screen text overlays per second in the first 5 seconds. Hypothesis: dense overlays signal production value and hold attention.', 'pack_v.frame_analysis.text_overlays_first_5s / 5', 'untested'),
      ('audio_onset_count', 'Number of audio onsets (beat/transient hits) in the first 3 seconds. Hypothesis: rhythm-heavy intros correlate with retention.', 'librosa.onset.onset_detect(y[:sr*3], sr)', 'untested')
    ON CONFLICT (feature_name) DO UPDATE SET status='untested', spearman_delta=NULL, tested_date=NULL
  `)
  const r = await pg.query(`SELECT feature_name, status FROM candidate_features ORDER BY created_at`)
  console.log(`candidate_features now has ${r.rows.length} rows:`)
  for (const row of r.rows) console.log(`  ${row.feature_name.padEnd(28)} ${row.status}`)
  await pg.end()
})()

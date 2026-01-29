import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

// Lightweight harness: write a small mock dataset and run with MOCK_DB=true

function runEvalWith(rows: any[]) {
  const tmpDir = path.join(process.cwd(), 'tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
  const file = path.join(tmpDir, 'prediction_validation.json')
  fs.writeFileSync(file, JSON.stringify(rows, null, 2))
  const cmd = process.platform === 'win32' ? 'node.exe' : 'node'
  const res = spawnSync(cmd, ['scripts/evaluate_predictions.ts'], {
    env: { ...process.env, MOCK_DB: 'true', PREDICTION_VALIDATION_PATH: file, SUPABASE_URL: '', SUPABASE_SERVICE_KEY: '' },
    encoding: 'utf-8'
  })
  return res
}

describe('evaluate_predictions guard behavior', () => {
  const base = new Date(Date.now() - 47*3600*1000).toISOString()

  test('aborts on future feature usage (72h)', () => {
    const rows = [{
      video_id: 'v1', predicted_viral_probability: 0.8, label_viral: 1, created_at: base,
      model_version: 'X', creator_id: 'c1', caption: 'hello', frame_hash: 'f1',
      feature_ts_24h: base, feature_ts_48h: base, feature_ts_72h: new Date(Date.now() + 25*3600*1000).toISOString()
    }]
    const res = runEvalWith(rows)
    expect(res.status).not.toBe(0)
    expect(res.stderr + res.stdout).toMatch(/future features/i)
  })

  test('passes guards and emits enriched metrics', () => {
    const rows = Array.from({length: 10}, (_,i)=>({
      video_id: `v${i}`, predicted_viral_probability: Math.random(), label_viral: i%2,
      created_at: base, model_version: 'X', creator_id: `c${i}`, caption: `text ${i}`, frame_hash: `fh${i}`,
      feature_ts_24h: base, feature_ts_48h: base
    }))
    const res = runEvalWith(rows)
    expect(res.status).toBe(0)
    const out = (res.stdout||'').trim()
    expect(out).toMatch(/coverage_of_real_actuals/)
    expect(out).toMatch(/leakage_checks/)
  })
})




import fs from 'fs'
import path from 'path'
import { VITSchema } from '@trendzo/shared'

describe('VIT zod schema', () => {
  it('accepts good fixtures', () => {
    const p = path.join(process.cwd(), 'packages/fixtures/vit-fixtures.json')
    const json = JSON.parse(fs.readFileSync(p, 'utf-8'))
    const first = json.vit[0]
    const parsed = VITSchema.safeParse(first)
    expect(parsed.success).toBe(true)
  })

  it('rejects bad fixtures', () => {
    const p = path.join(process.cwd(), 'packages/fixtures/vit-bad-fixtures.json')
    const json = JSON.parse(fs.readFileSync(p, 'utf-8'))
    for (const item of json.vit) {
      const parsed = VITSchema.safeParse(item)
      expect(parsed.success).toBe(false)
    }
  })
})



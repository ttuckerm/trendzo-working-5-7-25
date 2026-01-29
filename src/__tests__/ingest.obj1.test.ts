import { VITSchema } from '@/lib/schemas/vit'

describe('Objective 1: DRY_RUN ingest validates fixtures', () => {
  it('validates sample VIT fixtures without schema violations', async () => {
    const { vit } = await import('../../packages/fixtures/vit-fixtures.json') as any
    expect(Array.isArray(vit)).toBe(true)
    for (const item of vit) {
      const parsed = VITSchema.safeParse(item)
      if (!parsed.success) {
        console.error(parsed.error.flatten())
      }
      expect(parsed.success).toBe(true)
    }
  })
})



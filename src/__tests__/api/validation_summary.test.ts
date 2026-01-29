import { describe, it, expect } from 'vitest'

describe('validation summary route', () => {
  it('smoke: builds JSON shape', async () => {
    // We cannot run the server here; just verify the shape builder exists by importing file
    const mod = await import('../../app/api/admin/validation/summary/route')
    expect(typeof mod.GET).toBe('function')
  })
})



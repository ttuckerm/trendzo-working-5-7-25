describe('flags.isStarterPackEnabled', () => {
  it('returns true only when NEXT_PUBLIC_LIVE_STARTER_PACK_PATH === "true"', () => {
    const modPath = '../../config/flags'

    jest.resetModules()
    process.env.NEXT_PUBLIC_LIVE_STARTER_PACK_PATH = 'true'
    let mod = require(modPath)
    expect(mod.isStarterPackEnabled()).toBe(true)

    jest.resetModules()
    process.env.NEXT_PUBLIC_LIVE_STARTER_PACK_PATH = '1'
    mod = require(modPath)
    expect(mod.isStarterPackEnabled()).toBe(false)

    jest.resetModules()
    process.env.NEXT_PUBLIC_LIVE_STARTER_PACK_PATH = 'false'
    mod = require(modPath)
    expect(mod.isStarterPackEnabled()).toBe(false)
  })
})



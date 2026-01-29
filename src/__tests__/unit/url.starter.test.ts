describe('url helpers for starter param', () => {
  it('parses starter=on only', () => {
    const url = require('../../workflow/url')
    expect(url.getStarterParam('?starter=on')).toBe(true)
    expect(url.getStarterParam('starter=on')).toBe(true)
    expect(url.getStarterParam('?starter=ON')).toBe(true)
    expect(url.getStarterParam('?starter=yes')).toBe(false)
    expect(url.getStarterParam('')).toBe(false)
  })

  it('applies param only on allowed routes and is stable', () => {
    const url = require('../../workflow/url')
    const base = url.allowedStarterRoutes[0]
    const onUrl = url.applyStarterParam(`${base}`, true)
    expect(onUrl).toContain(`${url.STARTER_PARAM}=on`)
    const offUrl = url.applyStarterParam(onUrl, false)
    expect(offUrl).not.toContain(`${url.STARTER_PARAM}=`)
  })

  it('does not add param on disallowed routes', () => {
    const url = require('../../workflow/url')
    const u = '/not/allowed/path'
    const out = url.applyStarterParam(u, true)
    expect(out).toBe(u)
  })
})



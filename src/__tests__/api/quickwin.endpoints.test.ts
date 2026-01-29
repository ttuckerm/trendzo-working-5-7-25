describe('QuickWin endpoints', () => {
  it('starter-pack returns 3 templates', async () => {
    const res = await fetch('http://localhost/api/starter-pack')
    const j = await res.json()
    expect(Array.isArray(j.templates)).toBe(true)
    expect(j.templates.length).toBeGreaterThan(0)
  })
  it('script generate-hooks returns hooks', async () => {
    const r = await fetch('http://localhost/api/script/generate-hooks', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ niche:'general', goal:'quick-win' }) })
    const j = await r.json()
    expect(Array.isArray(j.hooks)).toBe(true)
  })
  it('analyze returns score and fixes', async () => {
    const r = await fetch('http://localhost/api/analyze', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ beat_timeline: [{ element:'Hook', text:'Test' }, { element:'CTA', text:'Follow' }] }) })
    const j = await r.json()
    expect(typeof j.viral_score).toBe('number')
    expect(Array.isArray(j.fixes)).toBe(true)
  })
})



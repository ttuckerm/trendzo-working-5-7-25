describe('starterSelect', () => {
  it('picks up to 3 by niche+goal then either then global', () => {
    const mod = require('../../workflow/starterSelect')
    const templates = [
      { id: 'a', niche:'fitness', goal:'growth', successScore: 95, delta7d: 5 },
      { id: 'b', niche:'fitness', goal:'sales', successScore: 90, delta7d: 10 },
      { id: 'c', niche:'beauty', goal:'growth', successScore: 92, delta7d: 8 },
      { id: 'd', niche:'fitness', goal:'growth', successScore: 85, delta7d: 20 },
      { id: 'e', niche:'other', goal:'other', successScore: 99, delta7d: 3 },
    ]
    const ids = mod.selectStarterTemplates(templates, 'fitness', 'growth')
    expect(ids.length).toBe(3)
    expect(ids[0]).toBe('a')
  })
})




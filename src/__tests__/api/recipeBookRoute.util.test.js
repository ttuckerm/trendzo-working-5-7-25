const { filterSort } = require('../../lib/server/recipeBook-util');

describe('recipeBook-util filterSort', () => {
  const templates = [
    { id: 'a', name: 'Listicle with Numbers V2', status: 'COOLING', successRate: 68, uses: 980, trendDelta7d: -14, keyPatterns: ['Listicle with numbers', 'Pattern Interrupt'] },
    { id: 'b', name: 'Split-screen How-To Turbo', status: 'HOT', successRate: 92, uses: 910, trendDelta7d: 38, keyPatterns: ['Split-screen how-to', 'Hook in first 1.2s'] },
    { id: 'c', name: 'Duet Side-by-side', status: 'NEW', successRate: 65, uses: 9, trendDelta7d: 0, keyPatterns: ['Duet Reaction'] },
  ];

  it('filters by status', () => {
    const res = filterSort(templates, { status: 'HOT' });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('b');
  });

  it('searches by q across name and keyPatterns', () => {
    const res = filterSort(templates, { q: 'Listicle' });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('a');
  });

  it('sorts by success', () => {
    const res = filterSort(templates, { sort: 'success' });
    expect(res.map((t) => t.id)).toEqual(['b', 'a', 'c']);
  });
});



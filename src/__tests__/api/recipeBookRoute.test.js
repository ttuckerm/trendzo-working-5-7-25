const { GET } = require('../../../src/app/api/recipe-book/route');

function makeRequest(query) {
  return new Request('http://localhost/api/recipe-book' + (query ? `?${query}` : ''));
}

describe('Recipe Book API route', () => {
  it('returns payload with generatedAt and templates', async () => {
    const res = await GET(makeRequest(''));
    const json = await res.json();
    expect(json.generatedAt).toBeDefined();
    expect(Array.isArray(json.templates)).toBe(true);
    expect(json.templates.length).toBeGreaterThan(0);
  });

  it('filters by status', async () => {
    const res = await GET(makeRequest('status=HOT'));
    const json = await res.json();
    expect(json.templates.every((t) => t.status === 'HOT')).toBe(true);
  });

  it('searches by q across name and keyPatterns', async () => {
    const res = await GET(makeRequest('q=Listicle'));
    const json = await res.json();
    expect(json.templates.length).toBeGreaterThan(0);
    expect(json.templates.some((t) => t.name.includes('Listicle') || t.keyPatterns.join(' ').includes('Listicle'))).toBe(true);
  });

  it('sorts by success rate', async () => {
    const res = await GET(makeRequest('sort=success'));
    const json = await res.json();
    const arr = json.templates.map((t) => t.successRate);
    const sorted = [...arr].sort((a, b) => b - a);
    expect(arr).toEqual(sorted);
  });
});



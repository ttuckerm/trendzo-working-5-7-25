import { POST as CLONE } from '@/app/api/sandbox/clone-relume/route'

describe('/api/sandbox/clone-relume', () => {
  const originalFetch = global.fetch as any
  const originalKey = process.env.FIRECRAWL_API_KEY

  afterEach(() => {
    // Restore fetch between tests
    ;(global as any).fetch = originalFetch
    jest.resetAllMocks()
    process.env.FIRECRAWL_API_KEY = originalKey
  })

  it('propagates upstream 401 as 502 (repro current failure)', async () => {
    process.env.FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || 'test-key'
    ;(global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    })

    const req = new Request('http://test/api/sandbox/clone-relume', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://www.relume.io/' }),
    }) as any

    const res = await CLONE(req)
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  it('should return HTML when Firecrawl returns data[0].html (expected behavior)', async () => {
    process.env.FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || 'test-key'
    ;(global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ html: '<div>OK</div>' }] }),
    })

    const req = new Request('http://test/api/sandbox/clone-relume', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://www.relume.io/' }),
    }) as any

    const res = await CLONE(req)

    // EXPECTED: 200 with html, but current buggy implementation may 502 due to parsing
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.html).toBe('string')
    expect(body.html.length).toBeGreaterThan(0)
  })
})



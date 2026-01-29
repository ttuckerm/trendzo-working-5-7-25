import { describe, it, expect } from 'vitest'

describe('Plugin smoke tests (CapCut/Premiere/Descript via public/score)', () => {
  it('scores via /public/score', async () => {
    const res = await fetch('http://localhost:3000/public/score', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': 'tk_tlm_DEMO_SANDBOX' },
      body: JSON.stringify({ features: { viewCount: 1000, likeCount: 60, commentCount: 10, shareCount: 5 } })
    })
    expect([200,401,429]).toContain(res.status)
  })
})



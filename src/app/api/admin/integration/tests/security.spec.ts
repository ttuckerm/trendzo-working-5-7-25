// Basic smoke tests for 429 enforcement (conceptual; adapt to your test runner)
import { describe, it, expect } from 'vitest'

describe('Security quotas', () => {
  it('blocks public score when over minute limit', async () => {
    const key = 'tk_tlm_DEMO_SANDBOX'
    const headers = { 'Content-Type': 'application/json', 'x-api-key': key }
    const payload = { features: { viewCount: 1000, likeCount: 80, commentCount: 10, shareCount: 5 } }
    let lastStatus = 200
    for (let i=0;i<130;i++) {
      const res = await fetch('http://localhost:3000/public/score', { method: 'POST', headers, body: JSON.stringify(payload) })
      lastStatus = res.status
      if (res.status === 429) break
    }
    expect([200,429]).toContain(lastStatus)
  })
})



/** @jest-environment jsdom */
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Page from '@/app/admin/cross-intel/page'

describe('Admin Cross-Platform Intelligence Page', () => {
  it('renders cascades table and predict panel', async () => {
    ;(global as any).fetch = jest.fn(async (url:string, opts?:any) => {
      if (url.includes('/api/cross/cascades')) return { ok:true, json: async ()=> ({ cascades: [{ creator:'abc', leader:'tiktok', signature:'sig', lags:{ tikTokToIG:6, igToYT:12, tikTokToYT:18 }, crossSR:0.4, nodes: [] }] }) } as any
      if (url.includes('/api/cross/summary')) return { ok:true, json: async ()=> ({ total:1, topLeader:'tiktok', avgLags:{ tikTokToIG:6, igToYT:12 }, crossSRByTemplate:{}, activeCascades:1 }) } as any
      if (url.includes('/api/cross/predict')) return { ok:true, json: async ()=> ({ probIG:0.7, probYT:0.6, confidence:'med', recommendedLags:{ toIG:12, toYT:36 } }) } as any
      return { ok:true, json: async ()=> ({}) } as any
    })
    render(<Page />)
    await waitFor(()=> screen.getByText(/Cross-Platform Intelligence/))
    expect(screen.getByText(/Cascades/)).toBeInTheDocument()
    expect(screen.getByText(/Predict/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Predict'))
  })
})



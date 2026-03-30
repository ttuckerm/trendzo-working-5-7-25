/** @jest-environment jsdom */
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Page from '@/app/admin/adaptation/page'

describe('Admin Adaptation Center', () => {
  it('renders signals and buttons', async () => {
    ;(global as any).fetch = jest.fn(async (url: string, opts?: any) => {
      if (url.includes('/api/adaptation/summary')) {
        return { ok:true, json: async ()=> ({ weather:{ status:'Stable', lastChangeISO: new Date().toISOString(), driftIndex: 0.1 }, latestProposal: null, recentChanges: [] }) } as any
      }
      return { ok:true, json: async ()=> ({}) } as any
    })
    render(<Page />)
    await waitFor(()=> screen.getByText(/Adaptation Center/))
    expect(screen.getByText(/Signals/)).toBeInTheDocument()
    expect(screen.getByText(/Scan/)).toBeInTheDocument()
  })
})



import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Page from '@/app/admin/analysis/page'

describe('Instant Analysis Page', () => {
  it('renders inputs and runs analyze flow', async () => {
    // Mock fetch for POST /api/analyze
    ;(global as any).fetch = jest.fn(async (url: string, opts: any) => {
      if (String(url).includes('/api/analyze')) {
        return { ok: true, json: async () => ({ probability: 0.6, confidence: 0.8, reasons: ['strong hook'], recommendations: [{ action: 'Add CTA', rationale: '...', predictedUplift: 0.05 }], timings: { elapsedMs: 50, metSLA: true } }) }
      }
      return { ok: true, json: async () => ({}) }
    })

    render(<Page />)
    const btn = await screen.findByText('Analyze')
    fireEvent.click(btn)
    await waitFor(() => screen.getByText(/Probability:/))
    expect(screen.getByText(/Recommendations/)).toBeInTheDocument()
  })
})



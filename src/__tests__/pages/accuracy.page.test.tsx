/** @jest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AccuracyPage from '@/app/accuracy/page'

describe('Accuracy page', () => {
  it('renders tile and ticker', async () => {
    ;(global as any).fetch = jest.fn(async (url: string) => {
      if (url.includes('/api/metrics')) {
        return {
          ok: true,
          json: async () => ({ accuracy: { correct: 274, total: 300 }, calibration: Array.from({ length: 10 }, (_, i) => ({ bin: i, meanPred: 0.1 * (i + 1), empRate: 0.1 * (i + 1) })), weather: { status: 'Stable' }, driftIndex: 0.1 })
        } as any
      }
      if (url.includes('/api/validation/summary')) {
        return { ok: true, json: async () => ({ total: 100, validated: 100, correct: 90, accuracy: 0.9, auroc: 0.8, ece: 0.05, bins: Array.from({ length: 10 }, (_, i)=>({ p_mid: (i+0.5)/10, frac_positive: (i+0.5)/10, count: 10})), computedAtISO: new Date().toISOString() }) } as any
      }
      if (url.includes('/api/learning/summary')) {
        return { ok: true, json: async () => ({ currentVersion: 1, candidateVersion: 2, lastUpdateISO: new Date().toISOString(), accuracyTrend: Array.from({ length: 30 }, (_, i)=>({ day: '2024-01-01', accuracy: 0.9, validated: 10 })), driftIndex: 0.1, ece: 0.05, auroc: 0.8 }) } as any
      }
      return { ok: false, json: async () => ({}) } as any
    })
    render(<AccuracyPage />)
    await waitFor(() => expect(screen.getByText(/Accuracy/)).toBeInTheDocument())
    expect(screen.getByText(/Model v/)).toBeInTheDocument()
  })
})

 



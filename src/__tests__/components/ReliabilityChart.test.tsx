/** @jest-environment jsdom */
import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import ReliabilityChart from '@/components/admin/accuracy/ReliabilityChart'

describe('ReliabilityChart', () => {
  beforeEach(() => {
    ;(global as any).fetch = jest.fn(async (_input: any, _init?: any) => {
      return {
        ok: true,
        json: async () => ({ accuracy: 0, auc: 0.5, ece: 0.1, reliability: { x: [], y: [] } })
      } as any
    })
  })

  it('shows No data yet when empty', async () => {
    render(<ReliabilityChart cohort={'demo'} />)
    await waitFor(() => expect(screen.getByText('No data yet')).toBeInTheDocument())
  })
})



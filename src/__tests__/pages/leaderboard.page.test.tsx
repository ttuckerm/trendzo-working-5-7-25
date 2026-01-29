/** @jest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Page from '@/app/admin/recipes/leaderboard/page'

describe('Leaderboard page', () => {
  it('renders a row with Name and SR%', async () => {
    ;(global as any).fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        updatedAtISO: new Date().toISOString(),
        items: [ { id:'t1', name:'Template 1', state:'HOT', successRate:0.9, uses:20, examples:3, lastSeenTs: new Date().toISOString() } ]
      })
    }))
    render(<Page />)
    await waitFor(()=> expect(screen.getByText(/Template 1/)).toBeInTheDocument())
    expect(screen.getByText(/90%/)).toBeInTheDocument()
  })
})

 



import { render, screen, waitFor } from '@testing-library/react'
import Page from '@/app/accuracy/page'

describe('Accuracy Page', () => {
  it('renders summary tiles and reliability chart', async () => {
    ;(global as any).fetch = jest.fn(async (url:string) => {
      if (url.includes('/api/validation/summary')) {
        return { ok:true, json: async ()=> ({ validated: 120, correct: 110, accuracy: 110/120, tp:55, fp:5, tn:55, fn:5, auroc: 0.92, ece: 0.03, bins: Array.from({length:10}, (_,i)=>({ p_mid:(i+0.5)/10, frac_positive: (i+1)/11, count: 12 })), computedAtISO: new Date().toISOString() }) }
      }
      return { ok:true, json: async ()=> ({}) }
    })

    render(<Page />)
    await waitFor(()=> screen.getByText(/Accuracy/))
    expect(screen.getByText(/Validated/)).toBeInTheDocument()
  })
})



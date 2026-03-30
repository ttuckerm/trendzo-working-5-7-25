/** @jest-environment jsdom */
import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RunPredictionPanel from '@/components/admin/accuracy/RunPredictionPanel'

describe('RunPredictionPanel', () => {
  beforeEach(() => {
    ;(global as any).fetch = jest.fn(async (_input: any, _init?: any) => {
      return {
        ok: true,
        json: async () => ({ prediction: { viralProbability: 0.734, viralScore: 78.9, meta: { modelVersion: 'x.y.z' } } })
      } as any
    })
  })

  it('renders probability and cohort key after run', async () => {
    render(<RunPredictionPanel />)
    const tpl = screen.getByPlaceholderText('templateId (optional)') as HTMLInputElement
    const v = screen.getByPlaceholderText('variantId (optional)') as HTMLInputElement
    fireEvent.change(tpl, { target: { value: 'tmp_1' } })
    fireEvent.change(v, { target: { value: 'A' } })
    fireEvent.click(screen.getByText('Run'))
    await waitFor(() => expect(screen.getByText(/prob:/i)).toBeInTheDocument())
    expect(screen.getByText('prob: 73.4%')).toBeInTheDocument()
    expect(screen.getByText('tmp_1::A')).toBeInTheDocument()
  })
})



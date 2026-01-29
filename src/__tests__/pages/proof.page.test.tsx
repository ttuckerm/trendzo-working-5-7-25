/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import ProofPage from '@/app/proof/page'

describe('Page /proof', () => {
	it('renders without crashing and shows static labels', async () => {
		process.env.MOCK = '1'
		render(await ProofPage())
		expect(screen.getByText(/Embeddable Badge/i)).toBeTruthy()
	})
})



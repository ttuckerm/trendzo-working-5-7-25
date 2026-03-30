import React from 'react'
import { render } from '@testing-library/react'
import Page from '@/app/admin/scale/page'

describe('Admin Scale page', () => {
	it('renders without crashing', () => {
		render(React.createElement(Page))
	})
})



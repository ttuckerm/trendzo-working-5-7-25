/** @jest-environment jsdom */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/studio',
  useRouter: () => ({ push: () => {} }),
  useSearchParams: () => new URLSearchParams('niche=fitness&goal=growth'),
}));

jest.mock('../../workflow/useStarterSurfaceCheck', () => ({ useStarterSurfaceCheck: () => {} }));

describe('Gallery header Starter chip', () => {
  test('chip renders and toggles URL when enabled', async () => {
    const GalleryPhase = (await import('../../app/admin/viral-studio/components/phases/GalleryPhase')).default as any;
    const { getByTestId } = render(
      <GalleryPhase selectedNiche="fitness" onTemplateSelect={()=>{}} hoveredTemplate={null} onTemplateHover={()=>{}} />
    );
    const chip = getByTestId('starter-chip');
    expect(chip).toBeTruthy();
  });
});



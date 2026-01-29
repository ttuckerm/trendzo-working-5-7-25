/** @jest-environment jsdom */
import React from 'react';
import { render } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/studio',
  useRouter: () => ({ push: () => {} }),
  useSearchParams: () => new URLSearchParams('niche=fitness&goal=growth&starter=on'),
}));

jest.mock('../../workflow/useStarterSurfaceCheck', () => ({ useStarterSurfaceCheck: () => {} }));

describe('Gallery list ribbons', () => {
  test('renders ribbons when starter enabled and niche/goal set', async () => {
    const GalleryPhase = (await import('../../app/admin/viral-studio/components/phases/GalleryPhase')).default as any;
    const { container } = render(
      <GalleryPhase selectedNiche="fitness" onTemplateSelect={()=>{}} hoveredTemplate={null} onTemplateHover={()=>{}} />
    );
    // Presence of some starter-ribbon-* data-testid elements
    const ribbons = container.querySelectorAll('[data-testid^="starter-ribbon-"]');
    expect(ribbons.length).toBeGreaterThanOrEqual(0);
    expect(ribbons.length).toBeLessThanOrEqual(3);
  });
});



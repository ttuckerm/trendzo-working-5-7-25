/** @jest-environment jsdom */
import React from 'react';
import { render, cleanup } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/studio',
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
  useSearchParams: () => new URLSearchParams(''),
}));

describe('useStarterSurfaceCheck mount behavior', () => {
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  test('Studio/Viral Workflow gallery container calls useStarterSurfaceCheck()', async () => {
    const spy = jest.spyOn(console, 'debug').mockImplementation(() => undefined as unknown as void);
    const GalleryPhase = (await import('../../app/admin/viral-studio/components/phases/GalleryPhase')).default;
    render(
      <GalleryPhase
        selectedNiche=""
        onTemplateSelect={() => {}}
        hoveredTemplate={null}
        onTemplateHover={() => {}}
      />
    );
    expect(spy).toHaveBeenCalled();
  });

});


